#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const SCRIPT_DIR = __dirname;
const TEMPLATES_DIR = path.join(SCRIPT_DIR, 'templates');
const DEFAULT_OUT_DIR = path.join(process.cwd(), 'prints');
// Schema bumped to v2 when the server stopped embedding cash gift image
// bytes in the descriptor. v2 emits gift.imageId (the GiftImage._id) and
// the operator runs scripts/print/download-gift-images.js once to mirror
// every GiftImage to local disk before rendering.
const SCHEMA_VERSION_SUPPORTED = 2;
const GIFT_IMAGES_DIR_RELATIVE = 'scripts/print/gift-images';

// Per-descriptor artefacts: one PDF emitted per descriptor per key.
const ARTEFACTS = ['giftNote', 'thankYouNote', 'honeymoonCard'];
const ARTEFACT_TEMPLATE_FILE = {
  giftNote: 'gift-note.html',
  thankYouNote: 'thank-you-note.html',
  honeymoonCard: 'honeymoon-card.html',
};
// Aggregate artefacts: one PDF emitted per RUN, gathering data across many
// descriptors. The block-notes sheet packs every cube purchase's message +
// signer into a 3×4 grid on A4 so the printer can cut all the 60×60 mm
// self-adhesive labels from a single sheet.
const BLOCK_NOTES_TEMPLATE_FILE = 'block-notes.html';
const BLOCK_NOTES_OUTPUT_FILE = 'block-notes-sheet.pdf';

function parseArgs(argv) {
  const args = {
    positional: [],
    outDir: DEFAULT_OUT_DIR,
    defaultGender: 'mixed',
    defaultNumber: 'auto',
    overridesPath: null,
  };
  const validGender = new Set(['m', 'f', 'mixed']);
  const validNumber = new Set(['1', 'n', 'auto']);

  // Accept every long flag in BOTH `--flag value` and `--flag=value` forms.
  // Unknown `--flag` tokens throw; we used to silently treat them as positional,
  // which led to `--overrides path/to.json` being parsed as "--overrides is an
  // unknown flag, ignore it; path/to.json is a positional".
  const flagValue = (name, raw, i) => {
    if (raw === name) {
      if (i + 1 >= argv.length) throw new Error(`Flag ${name} requires a value`);
      return { value: argv[i + 1], consumed: 2 };
    }
    if (raw.startsWith(name + '=')) {
      return { value: raw.slice(name.length + 1), consumed: 1 };
    }
    return null;
  };

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];

    if (a === '--help' || a === '-h') { args.help = true; continue; }
    if (a === '-o') {
      if (i + 1 >= argv.length) throw new Error('Flag -o requires a value');
      args.outDir = path.resolve(argv[++i]);
      continue;
    }

    let m;
    if ((m = flagValue('--out', a, i))) {
      args.outDir = path.resolve(m.value);
      i += m.consumed - 1;
      continue;
    }
    if ((m = flagValue('--salutation-gender', a, i))) {
      if (!validGender.has(m.value)) throw new Error(`--salutation-gender must be one of m|f|mixed (got '${m.value}')`);
      args.defaultGender = m.value;
      i += m.consumed - 1;
      continue;
    }
    if ((m = flagValue('--salutation-number', a, i))) {
      if (!validNumber.has(m.value)) throw new Error(`--salutation-number must be one of 1|n|auto (got '${m.value}')`);
      args.defaultNumber = m.value;
      i += m.consumed - 1;
      continue;
    }
    if ((m = flagValue('--overrides', a, i))) {
      args.overridesPath = path.resolve(m.value);
      i += m.consumed - 1;
      continue;
    }

    if (a.startsWith('-')) {
      throw new Error(`Unknown flag: ${a}. Run with --help to see supported flags.`);
    }
    args.positional.push(a);
  }
  return args;
}

function loadOverrides(overridesPath) {
  if (!overridesPath) return {};
  const raw = fs.readFileSync(overridesPath, 'utf8');
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || !parsed.purchases) {
    throw new Error(`Overrides file must be the shape { purchases: { "<purchaseId>": {...} } } — the same shape this CLI emits.`);
  }
  return parsed.purchases;
}

// Heuristic: a signer string represents multiple people if it contains a
// separator that is *unambiguously* between names. The separators below match
// the typical "Maria & José" / "Juan y Pedro" / "Ana, Lucía y Sofía" /
// "Tom and Sarah" forms used at checkout. Single hyphenated names like
// "Maria-José" deliberately fall through to singular — buyer can override.
const PLURAL_SEPARATOR_RE = /,| & | y | & | and /i;

function detectNumberFromSigner(signer) {
  if (!signer || typeof signer !== 'string') return '1';
  return PLURAL_SEPARATOR_RE.test(signer) ? 'n' : '1';
}

function resolveSalutationParams(descriptor, defaults, overrides) {
  const purchaseId = descriptor.purchaseId;
  const override = (overrides && overrides[purchaseId]) || {};
  const signer = (descriptor.purchase && descriptor.purchase.signerName) || '';

  let number = override.number || defaults.defaultNumber;
  if (number === 'auto') number = detectNumberFromSigner(signer);
  if (number !== '1' && number !== 'n') number = '1';

  let gender = override.gender || defaults.defaultGender;
  if (!['m', 'f', 'mixed'].includes(gender)) gender = 'mixed';
  // 'mixed' only makes sense in plural; collapse to 'm' for one person.
  if (number === '1' && gender === 'mixed') gender = 'm';

  return { number, gender, signer, overridden: Boolean(override.gender || override.number) };
}

function buildSalutation(params) {
  const name = params.signer || 'friend';
  // English: "Dear" is gender-neutral and works for singular and plural.
  const en = `Dear ${name},`;

  let esWord;
  if (params.number === '1') {
    esWord = params.gender === 'f' ? 'Querida' : 'Querido';
  } else {
    esWord = params.gender === 'f' ? 'Queridas' : 'Queridos';
  }
  const es = `${esWord} ${name},`;

  return { en, es };
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseCoupleFirstNames(coupleNames) {
  if (!coupleNames || typeof coupleNames !== 'string') return null;
  const parts = coupleNames.split(/\s+(?:&|y|and)\s+/i).map((s) => s.trim()).filter(Boolean);
  if (parts.length !== 2) return null;
  return parts;
}

// The printed gift note now puts the couple's names as the inside-right
// page header (the "addressed to" heading). Buyers who address their
// message "Iluminada y George, ..." therefore duplicate that heading
// inside the message body. Strip the leading couple-greeting (any combo
// of name order × {&, y, and} × case) plus immediately-following
// punctuation/whitespace so the printed message starts with the body.
function stripLeadingCoupleSalutation(message, coupleNames) {
  if (!message || typeof message !== 'string') return message;
  const names = parseCoupleFirstNames(coupleNames);
  if (!names) return message;
  const [a, b] = names.map(escapeRegex);
  const sep = '\\s*(?:&|y|and)\\s*';
  const namesPattern = `(?:${a}${sep}${b}|${b}${sep}${a})`;
  // Trailing punctuation we are willing to absorb after the greeting:
  // comma, period, dash/em-dash, colon, semicolon, exclamation, plus any
  // surrounding whitespace including newlines.
  const trailing = '[\\s,.\\-\u2013\u2014:;!]+';
  const re = new RegExp(`^\\s*${namesPattern}${trailing}`, 'i');
  return message.replace(re, '');
}

/*
 * Resolve every image referenced by a descriptor to a base64 data URI
 * read from local disk.
 *
 * Descriptors v2+ never embed image bytes. Two classes of image:
 *
 *   1. Site-shipped static assets (gift-note cover, couple-inside
 *      portrait). The script runs from a repo checkout, so it reads
 *      these off disk, preferring the AI-upscaled hi-res variant
 *      under .../print-hires/<file> (produced by
 *      scripts/upscale-gift-card-images.sh; gitignored because the
 *      files are 10-20 MB each), falling back to the original small
 *      asset under public/assets/images/gift-cards/.
 *
 *   2. Per-gift cash artwork (the honeymoon-perk images stored in
 *      MongoDB's GiftImage collection). The operator runs
 *      scripts/print/download-gift-images.js ONCE to mirror every
 *      GiftImage as scripts/print/gift-images/<imageId>.<ext>. The
 *      function below resolves descriptor.gift.imageId to whichever
 *      file extension exists.
 *
 * Every read is base64-encoded once and cached so the same image isn't
 * re-encoded for every descriptor in a bundle (the cover/couple pair
 * is shared by every purchase; cash artwork is shared whenever multiple
 * guests bought the same perk).
 */
const STATIC_IMAGE_SOURCES = [
  {
    descriptorPath: ['artefacts', 'giftNote', 'coverImageDataUri'],
    hiresFilePath: 'public/assets/images/gift-cards/print-hires/gift-note-cover.jpg',
    originalFilePath: 'public/assets/images/gift-cards/gift-note-cover.jpg',
    mime: 'image/jpeg',
  },
  {
    descriptorPath: ['artefacts', 'thankYouNote', 'coupleImageDataUri'],
    hiresFilePath: 'public/assets/images/gift-cards/print-hires/couple-inside-transparent.png',
    originalFilePath: 'public/assets/images/gift-cards/couple-inside-transparent.png',
    mime: 'image/png',
  },
];

const CASH_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const CASH_IMAGE_MIME_BY_EXT = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
};

const repoRoot = path.resolve(__dirname, '..', '..');
const imageDataUriCache = new Map();

function readDataUriFromDisk(relPath, mime) {
  if (imageDataUriCache.has(relPath)) return imageDataUriCache.get(relPath);
  const abs = path.join(repoRoot, relPath);
  let value = null;
  try {
    if (fs.existsSync(abs)) {
      const buf = fs.readFileSync(abs);
      value = `data:${mime};base64,${buf.toString('base64')}`;
    }
  } catch (_e) { /* ignore */ }
  imageDataUriCache.set(relPath, value);
  return value;
}

function readCashImageDataUri(imageId) {
  // Look for any of the supported extensions — the downloader writes
  // whatever extension matches the GiftImage's contentType, which we
  // don't know up-front here.
  for (const ext of CASH_IMAGE_EXTENSIONS) {
    const rel = path.posix.join(GIFT_IMAGES_DIR_RELATIVE, `${imageId}.${ext}`);
    const dataUri = readDataUriFromDisk(rel, CASH_IMAGE_MIME_BY_EXT[ext]);
    if (dataUri) return dataUri;
  }
  return null;
}

function injectImagesFromDisk(descriptor) {
  const stats = { hires: 0, original: 0, cashLocal: 0, descriptor: 0, missingStatic: 0, missingCash: 0 };

  for (const sub of STATIC_IMAGE_SOURCES) {
    let obj = descriptor;
    for (let i = 0; i < sub.descriptorPath.length - 1; i++) {
      if (!obj || typeof obj !== 'object') { obj = null; break; }
      obj = obj[sub.descriptorPath[i]];
    }
    if (!obj || typeof obj !== 'object') continue;
    const leaf = sub.descriptorPath[sub.descriptorPath.length - 1];

    const hires = readDataUriFromDisk(sub.hiresFilePath, sub.mime);
    if (hires) { obj[leaf] = hires; stats.hires++; continue; }

    const original = readDataUriFromDisk(sub.originalFilePath, sub.mime);
    if (original) { obj[leaf] = original; stats.original++; continue; }

    if (obj[leaf]) { stats.descriptor++; continue; }

    stats.missingStatic++;
  }

  // Cash gift artwork: the templates read both gift.imageDataUri and
  // artefacts.honeymoonCard.imageDataUri. We populate both so the templates
  // don't need to know the descriptor changed shape between v1 and v2.
  const gift = descriptor.gift;
  if (gift && gift.type === 'cash' && gift.imageId) {
    const dataUri = readCashImageDataUri(gift.imageId);
    if (dataUri) {
      gift.imageDataUri = dataUri;
      if (descriptor.artefacts && descriptor.artefacts.honeymoonCard) {
        descriptor.artefacts.honeymoonCard.imageDataUri = dataUri;
      }
      stats.cashLocal++;
    } else {
      stats.missingCash++;
    }
  }

  return stats;
}

function pickOverridesOutputPath(outDir) {
  const primary = path.join(outDir, 'salutation-overrides.json');
  if (!fs.existsSync(primary)) return primary;
  // Don't clobber an existing (likely hand-edited) overrides file. Stamp the
  // new emission with a timestamp so the operator can diff and merge.
  const now = new Date();
  const stamp = now.getFullYear().toString()
    + String(now.getMonth() + 1).padStart(2, '0')
    + String(now.getDate()).padStart(2, '0')
    + '-'
    + String(now.getHours()).padStart(2, '0')
    + String(now.getMinutes()).padStart(2, '0')
    + String(now.getSeconds()).padStart(2, '0');
  return path.join(outDir, `salutation-overrides.${stamp}.json`);
}

function writeOverridesTemplate(outDir, decisions) {
  const outPath = pickOverridesOutputPath(outDir);
  // Build the JSON in stable purchaseId order so re-runs produce a clean diff.
  const ordered = {};
  const sortedIds = Object.keys(decisions).sort();
  for (const id of sortedIds) {
    const d = decisions[id];
    ordered[id] = {
      gender: d.gender,
      number: d.number,
      _signer: d.signer,
      _autoDetected: !d.overridden,
    };
  }
  const payload = {
    _readme: 'Edit `gender` (m|f|mixed) and `number` (1|n) for any purchase '
      + 'whose Spanish salutation came out wrong. Re-run render-artefacts.js '
      + 'with --overrides=<this file> to apply. Fields starting with `_` are '
      + 'informational and ignored by the CLI.',
    purchases: ordered,
  };
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  return outPath;
}

function printHelp() {
  process.stdout.write(`Usage:
  node scripts/print/render-artefacts.js [OPTIONS] <descriptor.json | bundle.json | folder>

Modes:
  Single descriptor:  one JSON file as exported per-row from admin
  Bulk bundle:        the JSON exported by "Download all artefacts"
  Folder:             processes every *.json file in the folder

Options:
  --out DIR, -o DIR              Output directory (default: ./prints)
  --salutation-gender=m|f|mixed  Default Spanish gender for the thank-you
                                 salutation. Default: 'mixed' (yields
                                 "Queridos" for plural — the masculine
                                 plural is correct for mixed groups in
                                 Spanish).
  --salutation-number=1|n|auto   Default number for the salutation.
                                 'auto' (default) detects plural when the
                                 signer string contains ',', '&', ' y ',
                                 ' and '.
  --overrides=FILE.json          Per-purchase salutation overrides keyed
                                 by purchaseId. See below.

Output:
  PDFs are written to ./prints/ by default (override with --out).
  One PDF per artefact per purchase, plus one aggregate sheet for the
  block (cube) labels.

  Per-purchase filename pattern:
    <artefact>-<purchaseId>-<guestSlug>.pdf

  Example:
    gift-note-65f3a..._maria-jose.pdf
    thank-you-note-65f3a..._maria-jose.pdf
    honeymoon-card-65f3a..._maria-jose.pdf   (cash gifts only)

  Aggregate:
    block-notes-sheet.pdf                    (3×4 grid on A4 portrait;
                                              one 60×60 mm self-adhesive
                                              label per cube purchase)

Spanish salutation forms:
  number=1 gender=m  → "Querido <name>,"
  number=1 gender=f  → "Querida <name>,"
  number=n gender=m  → "Queridos <name>,"   (also: gender=mixed)
  number=n gender=f  → "Queridas <name>,"

  English is always "Dear <name>," (gender-neutral, number-agnostic).

Overrides JSON shape (same shape the CLI emits — see below):
  {
    "_readme": "...",
    "purchases": {
      "65f3abc...": { "gender": "f", "number": "n", "_signer": "María", "_autoDetected": false },
      "65f3def...": { "gender": "m" }
    }
  }
  Either or both of gender/number may be omitted on any entry; missing
  values fall back to the CLI defaults, then to auto-detection. The
  "_readme", "_signer", and "_autoDetected" fields are informational
  only and the CLI ignores them on read.

Auto-emitted overrides template:
  Every run writes <outDir>/salutation-overrides.json containing the
  CLI's decision for every purchase (with the signer name as a hint).
  Edit the few wrong ones and re-run with
  --overrides=<outDir>/salutation-overrides.json. If that file already
  exists (i.e. you have hand-edited it), the CLI writes
  salutation-overrides.<YYYYMMDD-HHMMSS>.json instead so your edits
  are never clobbered.

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

function collectBlockNotes(entries) {
  // Only cube purchases get a block sticker. For each, take the same
  // message that goes on the gift note's inside-right (messageDisplay,
  // with any duplicated couple-name salutation already stripped by the
  // pre-pass loop in main()) and the same signer name that signs the
  // gift note.
  const notes = [];
  for (const { descriptor: d } of entries) {
    if (!d || !d.gift || d.gift.type !== 'cube') continue;
    const purchase = d.purchase || {};
    const guest = d.guest || {};
    const message = typeof purchase.messageDisplay === 'string'
      ? purchase.messageDisplay
      : (purchase.message || '');
    notes.push({
      purchaseId: d.purchaseId,
      message,
      signer: purchase.signerName || guest.name || '',
      lang: purchase.lang || guest.lang || 'en',
      cubeId: d.gift.cubeId || null,
    });
  }
  // Stable ordering: by cubeId when present (so the printed sheet maps
  // sensibly onto the sculpture's block numbering), with anything missing
  // a cubeId trailing at the end.
  notes.sort((a, b) => {
    const ax = Number.isFinite(a.cubeId) ? a.cubeId : Infinity;
    const bx = Number.isFinite(b.cubeId) ? b.cubeId : Infinity;
    if (ax !== bx) return ax - bx;
    return String(a.purchaseId).localeCompare(String(b.purchaseId));
  });
  return notes;
}

async function renderBlockNotesSheet({ browser, notes, outDir }) {
  const template = fs.readFileSync(path.join(TEMPLATES_DIR, BLOCK_NOTES_TEMPLATE_FILE), 'utf8');
  const injected = `
    <script>
      window.__BLOCK_NOTES__ = ${JSON.stringify(notes)};
    </script>
  `;
  const html = template.replace('<!--INJECT-DATA-->', injected);

  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.__TEMPLATE_READY__ === true, { timeout: 5000 }).catch(() => {});
    const outPath = path.join(outDir, BLOCK_NOTES_OUTPUT_FILE);
    // A4 portrait. preferCSSPageSize honours the @page rule in the template.
    await page.pdf({ format: 'A4', path: outPath, printBackground: true, preferCSSPageSize: true });
    return outPath;
  } finally {
    await page.close();
  }
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

  const overrides = loadOverrides(args.overridesPath);

  const entries = loadDescriptorsFromPath(input);
  entries.forEach(({ descriptor, source }) => validateDescriptor(descriptor, source));

  const salutationDecisions = {};
  const imageStats = { hires: 0, original: 0, cashLocal: 0, descriptor: 0, missingStatic: 0, missingCash: 0 };
  const missingCashIds = new Set();
  for (const { descriptor } of entries) {
    const params = resolveSalutationParams(descriptor, args, overrides);
    descriptor.salutation = buildSalutation(params);
    salutationDecisions[descriptor.purchaseId] = params;
    const tag = params.overridden ? 'override' : 'auto';
    process.stdout.write(
      `[salutation] ${descriptor.purchaseId} "${params.signer || '?'}"`
      + ` → ${descriptor.salutation.es} (${tag}: number=${params.number}, gender=${params.gender})\n`
    );

    if (descriptor.purchase && typeof descriptor.purchase.message === 'string') {
      const raw = descriptor.purchase.message;
      const coupleNames = descriptor.couple && descriptor.couple.names;
      const cleaned = stripLeadingCoupleSalutation(raw, coupleNames);
      descriptor.purchase.messageDisplay = cleaned;
      if (cleaned !== raw) {
        const stripped = raw.slice(0, raw.length - cleaned.length).replace(/\s+/g, ' ').trim();
        process.stdout.write(`[message]    ${descriptor.purchaseId} stripped leading "${stripped}"\n`);
      }
    }

    const before = imageStats.missingCash;
    const s = injectImagesFromDisk(descriptor);
    for (const k of Object.keys(s)) imageStats[k] += s[k];
    if (imageStats.missingCash > before && descriptor.gift && descriptor.gift.imageId) {
      missingCashIds.add(descriptor.gift.imageId);
    }
  }

  process.stdout.write(`[images]    static: ${imageStats.hires} hires / ${imageStats.original} original / ${imageStats.descriptor} from-descriptor / ${imageStats.missingStatic} missing | cash: ${imageStats.cashLocal} local / ${imageStats.missingCash} missing\n`);
  if (missingCashIds.size > 0) {
    process.stdout.write(`[images]    Missing cash gift image(s) on disk. Run:\n`);
    process.stdout.write(`[images]      node scripts/print/download-gift-images.js ${input}\n`);
    process.stdout.write(`[images]    to download every referenced GiftImage to scripts/print/gift-images/.\n`);
    process.stdout.write(`[images]    Missing ids: ${[...missingCashIds].join(', ')}\n`);
  }

  const overridesOutPath = writeOverridesTemplate(outDir, salutationDecisions);
  process.stdout.write(`\n[salutation] Wrote editable overrides template: ${overridesOutPath}\n`);
  process.stdout.write(`[salutation]   Edit any wrong entries and re-run with --overrides=${path.relative(process.cwd(), overridesOutPath) || overridesOutPath}\n\n`);

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

    const blockNotes = collectBlockNotes(entries);
    if (blockNotes.length > 0) {
      try {
        const outPath = await renderBlockNotesSheet({ browser, notes: blockNotes, outDir });
        process.stdout.write(`  \u2713 ${path.basename(outPath)} (${blockNotes.length} block label${blockNotes.length === 1 ? '' : 's'})\n`);
        ok++;
      } catch (err) {
        process.stderr.write(`  \u2717 block-notes-sheet: ${err.message}\n`);
        failed++;
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
