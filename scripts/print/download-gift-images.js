#!/usr/bin/env node
'use strict';

/*
 * One-shot bulk downloader for cash gift artwork.
 *
 * Mirrors every GiftImage referenced by the input bundle to local disk
 * under scripts/print/gift-images/<imageId>.<ext>. Idempotent: existing
 * files are skipped, so re-running on the same bundle (or a superset
 * bundle after a new purchase) only fetches what's missing.
 *
 * Why this exists:
 *   Descriptor schemaVersion 2 stopped embedding cash gift image bytes
 *   in the bundle download. Each cash purchase now carries
 *   `gift.imageId` (the GiftImage._id) and render-artefacts.js resolves
 *   that to a local file at render time. The operator runs THIS script
 *   once after downloading a bundle to populate the local cache.
 *
 * Auth:
 *   The /api/admin/gift-images/:imageId endpoint requires admin auth.
 *   Either provide ADMIN_EMAIL + ADMIN_PASSWORD env vars (the script
 *   logs in to get a JWT) or paste your existing token via WEDDING_ADMIN_TOKEN
 *   (grab it from your browser's localStorage on the live admin page:
 *   localStorage.getItem('adminToken') in DevTools).
 *
 * Usage:
 *   node scripts/print/download-gift-images.js <bundle.json | descriptor.json | folder>
 *
 *   WEDDING_ADMIN_TOKEN=eyJhbGc... \
 *     node scripts/print/download-gift-images.js ~/Downloads/wedding-print-bundle.json
 *
 *   ADMIN_PASSWORD=secret \
 *     node scripts/print/download-gift-images.js ~/Downloads/wedding-print-bundle.json
 */

const fs = require('fs');
const path = require('path');

const SCRIPT_DIR = __dirname;
const OUT_DIR = path.join(SCRIPT_DIR, 'gift-images');

const API_BASE = process.env.API_BASE_URL || 'https://george-and-iluminada.com';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'george.mcintyre@me.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_TOKEN = process.env.WEDDING_ADMIN_TOKEN;

const MIME_TO_EXT = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function printHelp() {
  process.stdout.write(`Usage:
  node scripts/print/download-gift-images.js <bundle.json | descriptor.json | folder>

Reads every cash purchase's gift.imageId from the input, fetches the
matching GiftImage from the admin API, and writes it to
${path.relative(process.cwd(), OUT_DIR)}/<imageId>.<ext>.

Auth (one of):
  WEDDING_ADMIN_TOKEN=<jwt>      Reuse your browser session token
                                 (localStorage.getItem('adminToken')
                                 from the admin page DevTools console)
  ADMIN_PASSWORD=<password>      Log in with ADMIN_EMAIL+ADMIN_PASSWORD

Env vars:
  API_BASE_URL                   Default: ${API_BASE}
  ADMIN_EMAIL                    Default: ${ADMIN_EMAIL}
`);
}

function collectImageIds(input) {
  const ids = new Set();
  function walk(d) {
    if (!d || typeof d !== 'object') return;
    if (d.gift && d.gift.type === 'cash' && d.gift.imageId) {
      ids.add(String(d.gift.imageId));
    }
  }

  function readOne(filePath) {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) parsed.forEach(walk);
    else if (parsed && Array.isArray(parsed.descriptors)) parsed.descriptors.forEach(walk);
    else if (parsed && parsed.schemaVersion && parsed.purchaseId) walk(parsed);
  }

  const abs = path.resolve(input);
  const stat = fs.statSync(abs);
  if (stat.isDirectory()) {
    fs.readdirSync(abs)
      .filter((f) => f.toLowerCase().endsWith('.json'))
      .map((f) => path.join(abs, f))
      .forEach(readOne);
  } else {
    readOne(abs);
  }
  return [...ids];
}

async function login() {
  if (!ADMIN_PASSWORD) {
    throw new Error('Set WEDDING_ADMIN_TOKEN (recommended) or ADMIN_PASSWORD env var. Run with --help for details.');
  }
  const res = await fetch(`${API_BASE}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!res.ok) throw new Error(`Login failed: HTTP ${res.status} ${await res.text()}`);
  const d = await res.json();
  if (d.type !== 'admin') throw new Error(`Unexpected role: ${d.type}`);
  return d.token;
}

function extensionForResponse(res) {
  const contentType = (res.headers.get('content-type') || '').toLowerCase().split(';')[0].trim();
  return MIME_TO_EXT[contentType] || 'bin';
}

function existingFileFor(imageId) {
  for (const ext of Object.values(MIME_TO_EXT)) {
    const p = path.join(OUT_DIR, `${imageId}.${ext}`);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function downloadOne(token, imageId) {
  const existing = existingFileFor(imageId);
  if (existing) return { imageId, status: 'skipped', path: existing };

  const res = await fetch(`${API_BASE}/api/admin/gift-images/${imageId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    return { imageId, status: 'failed', error: `HTTP ${res.status}` };
  }
  const ext = extensionForResponse(res);
  const buf = Buffer.from(await res.arrayBuffer());
  const outPath = path.join(OUT_DIR, `${imageId}.${ext}`);
  fs.writeFileSync(outPath, buf);
  return { imageId, status: 'downloaded', path: outPath, bytes: buf.length };
}

async function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h') || process.argv.length < 3) {
    printHelp();
    process.exit(process.argv.includes('--help') || process.argv.includes('-h') ? 0 : 1);
  }

  const input = process.argv[2];
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const ids = collectImageIds(input);
  if (ids.length === 0) {
    process.stdout.write('No cash gift imageIds found in input. Nothing to download.\n');
    return;
  }
  process.stdout.write(`Found ${ids.length} unique cash gift image id(s) in input.\n`);

  const token = ADMIN_TOKEN || await login();

  let downloaded = 0, skipped = 0, failed = 0, totalBytes = 0;
  for (const imageId of ids) {
    const r = await downloadOne(token, imageId);
    if (r.status === 'downloaded') {
      downloaded++;
      totalBytes += r.bytes;
      process.stdout.write(`  \u2713 ${imageId} -> ${path.relative(process.cwd(), r.path)} (${r.bytes} bytes)\n`);
    } else if (r.status === 'skipped') {
      skipped++;
      process.stdout.write(`  \u2014 ${imageId} already on disk (${path.relative(process.cwd(), r.path)})\n`);
    } else {
      failed++;
      process.stderr.write(`  \u2717 ${imageId}: ${r.error}\n`);
    }
  }

  process.stdout.write(`\nDone. Downloaded ${downloaded}, skipped ${skipped}, failed ${failed}. Total bytes: ${totalBytes}.\n`);
  if (failed > 0) process.exit(2);
}

main().catch((e) => {
  process.stderr.write(`Fatal: ${e.message}\n`);
  process.exit(1);
});
