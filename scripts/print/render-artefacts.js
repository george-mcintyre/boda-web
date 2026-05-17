#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const SCRIPT_DIR = __dirname;
const TEMPLATES_DIR = path.join(SCRIPT_DIR, 'templates');
const DEFAULT_OUT_DIR = path.join(process.cwd(), 'prints');
const SCHEMA_VERSION_SUPPORTED = 1;

const ARTEFACTS = ['giftNote', 'thankYouNote', 'honeymoonCard'];
const ARTEFACT_TEMPLATE_FILE = {
  giftNote: 'gift-note.html',
  thankYouNote: 'thank-you-note.html',
  honeymoonCard: 'honeymoon-card.html',
};

function parseArgs(argv) {
  const args = { positional: [], outDir: DEFAULT_OUT_DIR };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out' || a === '-o') {
      args.outDir = path.resolve(argv[++i]);
    } else if (a === '--help' || a === '-h') {
      args.help = true;
    } else {
      args.positional.push(a);
    }
  }
  return args;
}

function printHelp() {
  process.stdout.write(`Usage:
  node scripts/print/render-artefacts.js [--out DIR] <descriptor.json | bundle.json | folder>

Modes:
  Single descriptor:  one JSON file as exported per-row from admin
  Bulk bundle:        the JSON exported by "Download all artefacts"
  Folder:             processes every *.json file in the folder

Output:
  PDFs are written to ./prints/ by default (override with --out).
  One PDF per artefact per purchase.

  Filename pattern:
    <artefact>-<purchaseId>-<guestSlug>.pdf

  Example:
    gift-note-65f3a..._maria-jose.pdf
    thank-you-note-65f3a..._maria-jose.pdf
    honeymoon-card-65f3a..._maria-jose.pdf   (cash gifts only)

Format:
  Each PDF includes 3 mm bleed and corner crop marks suitable for
  professional printing. See scripts/print/README.md for the full
  descriptor schema and printer specs.
`);
}

function loadDescriptorsFromPath(p) {
  const abs = path.resolve(p);
  const stat = fs.statSync(abs);
  if (stat.isDirectory()) {
    const files = fs.readdirSync(abs)
      .filter((f) => f.toLowerCase().endsWith('.json'))
      .map((f) => path.join(abs, f));
    if (files.length === 0) {
      throw new Error(`No .json files found in ${abs}`);
    }
    return files.flatMap(loadDescriptorsFromFile);
  }
  return loadDescriptorsFromFile(abs);
}

function loadDescriptorsFromFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed)) {
    return parsed.map((d) => ({ descriptor: d, source: filePath }));
  }
  if (parsed && Array.isArray(parsed.descriptors)) {
    return parsed.descriptors.map((d) => ({ descriptor: d, source: filePath }));
  }
  if (parsed && parsed.schemaVersion && parsed.purchaseId) {
    return [{ descriptor: parsed, source: filePath }];
  }
  throw new Error(`Unrecognised JSON shape in ${filePath}: expected a descriptor, a bundle ({descriptors:[...]}), or an array of descriptors.`);
}

function validateDescriptor(d, source) {
  if (!d || typeof d !== 'object') throw new Error(`Invalid descriptor in ${source}`);
  if (d.schemaVersion !== SCHEMA_VERSION_SUPPORTED) {
    throw new Error(`Descriptor schemaVersion=${d.schemaVersion} not supported (this script supports v${SCHEMA_VERSION_SUPPORTED}). Update either the server descriptor builder or this script.`);
  }
  if (!d.purchaseId) throw new Error(`Descriptor in ${source} is missing purchaseId`);
  if (!d.gift || !d.guest || !d.artefacts) throw new Error(`Descriptor ${d.purchaseId} is missing required sections (gift/guest/artefacts)`);
}

function loadTemplate(artefactKey) {
  const file = ARTEFACT_TEMPLATE_FILE[artefactKey];
  if (!file) throw new Error(`Unknown artefact key: ${artefactKey}`);
  return fs.readFileSync(path.join(TEMPLATES_DIR, file), 'utf8');
}

function renderTemplate(template, descriptor, artefactKey) {
  // Contract with templates: read window.__DESCRIPTOR__ + window.__ARTEFACT__,
  // populate the DOM, then set window.__TEMPLATE_READY__ = true.
  const injected = `
    <script>
      window.__ARTEFACT__ = ${JSON.stringify(artefactKey)};
      window.__DESCRIPTOR__ = ${JSON.stringify(descriptor)};
    </script>
  `;
  return template.replace('<!--INJECT-DATA-->', injected);
}

async function renderOnePdf({ browser, descriptor, artefactKey, outDir }) {
  const template = loadTemplate(artefactKey);
  const html = renderTemplate(template, descriptor, artefactKey);

  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: 'networkidle' });
    // Wait briefly for the template's own DOMContentLoaded hook to populate
    // fields. networkidle alone isn't enough because the inline script that
    // reads __DESCRIPTOR__ runs synchronously but updates the DOM, and
    // Playwright should let that paint cycle complete.
    await page.waitForFunction(() => window.__TEMPLATE_READY__ === true, { timeout: 5000 }).catch(() => {});

    const pdfOptions = pdfOptionsForArtefact(artefactKey);
    const filename = `${kebab(artefactKey)}-${descriptor.purchaseId}-${descriptor.guest.slug || 'unknown'}.pdf`;
    const outPath = path.join(outDir, filename);
    await page.pdf({ ...pdfOptions, path: outPath, printBackground: true, preferCSSPageSize: true });
    return outPath;
  } finally {
    await page.close();
  }
}

function pdfOptionsForArtefact(artefactKey) {
  // preferCSSPageSize: true means the @page rule in the template's CSS
  // dictates page size and margins; the values below are fallbacks Playwright
  // uses if the CSS doesn't declare them.
  if (artefactKey === 'honeymoonCard') {
    return { width: '91mm', height: '61mm' }; // 85x55 mm + 3 mm bleed on each side
  }
  // Folded greeting card: A4 landscape, scored down centre to fold to A5
  return { format: 'A4', landscape: true };
}

function kebab(camel) {
  return String(camel).replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help || args.positional.length === 0) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }

  const input = args.positional[0];
  const outDir = args.outDir;

  fs.mkdirSync(outDir, { recursive: true });

  const entries = loadDescriptorsFromPath(input);
  entries.forEach(({ descriptor, source }) => validateDescriptor(descriptor, source));

  process.stdout.write(`Rendering ${entries.length} descriptor(s) → ${outDir}\n`);

  const browser = await chromium.launch({ headless: true });
  let ok = 0;
  let failed = 0;
  try {
    for (const { descriptor } of entries) {
      const artefactKeys = Object.keys(descriptor.artefacts).filter((k) => ARTEFACTS.includes(k));
      for (const artefactKey of artefactKeys) {
        try {
          const outPath = await renderOnePdf({ browser, descriptor, artefactKey, outDir });
          process.stdout.write(`  \u2713 ${path.basename(outPath)}\n`);
          ok++;
        } catch (err) {
          process.stderr.write(`  \u2717 ${artefactKey} for ${descriptor.purchaseId}: ${err.message}\n`);
          failed++;
        }
      }
    }
  } finally {
    await browser.close();
  }

  process.stdout.write(`\nDone. ${ok} PDF(s) written, ${failed} failed.\n`);
  process.exit(failed > 0 ? 2 : 0);
}

main().catch((e) => {
  process.stderr.write(`Fatal: ${e.message}\n${e.stack || ''}\n`);
  process.exit(1);
});
