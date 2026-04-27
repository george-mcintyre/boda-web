#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
const { execFileSync } = require('child_process');

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const force = args.has('--force') || args.has('-y');
const skipResize = args.has('--no-resize');

const RESIZE_WIDE_PX = Number(process.env.RESIZE_WIDE_PX || 1100);
const RESIZE_CLOSEUP_PX = Number(process.env.RESIZE_CLOSEUP_PX || 800);
const JPEG_QUALITY = Number(process.env.JPEG_QUALITY || 72);

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'george.mcintyre@me.com';

const IMAGE_DIR = path.resolve(__dirname, '..', '..', 'images', 'final_food', 'final');

const PREFIX_TO_LABEL_EN = {
  iberian_charcuterie:        'Iberian Charcuterie Board',
  cheese_board:               'Cheese Board with Nuts and Red Berries',
  gazpacho:                   'Strawberry and Raspberry Gazpacho',
  ajoblanco:                  'Ajoblanco with Moscatel Wine Reduction and Raisins',
  mushroom_croquettes:        'Mushroom Croquettes with Aioli',
  patatas_bravas:             'Patatas Bravas with Oyana Sauce',
  duck_dumplings:             'Chicken Karaage with Seaweed Emulsion',
  sea_bream_ceviche:          'Sea Bream Ceviche with Roasted Sweet Potato',
  watermelon_pistachio_salad: 'Watermelon and Pistachio Salad with Thyme and Lemon Ice Cream',
  fried_eggplant:             'Fried Eggplant with Cane Honey',
  teriyaki_sea_bass:          'Teriyaki Sea Bass',
  grilled_beef_tenderloin:    'Grilled Beef Tenderloin',
  cauliflower_steak:          'Cauliflower Steak with Romesco Sauce',
  creamy_rice:                'Creamy Rice with Roasted Vegetables and Mushrooms',
  brownie:                    'Brownie',
  lime_cake:                  'Lime Cake',
  cheesecake:                 'Cheesecake',
  carrot_cake:                'Carrot Cake with Cream Cheese Frosting',
  mini_burger:                'Mini Burger',
  vegan_mini_burger:          'Vegan Mini Burger'
};

function contentTypeFor(filePath) {
  switch (path.extname(filePath).toLowerCase()) {
    case '.png':  return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.gif':  return 'image/gif';
    case '.webp': return 'image/webp';
    default:      return 'application/octet-stream';
  }
}

function fmtBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function resizeToJpeg(inputPath, outputPath, longestEdgePx) {
  execFileSync('magick', [
    inputPath,
    '-auto-orient',
    '-resize', `${longestEdgePx}x${longestEdgePx}>`,
    '-strip',
    '-interlace', 'Plane',
    '-quality', String(JPEG_QUALITY),
    outputPath
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
}

function ask(question) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, answer => { rl.close(); resolve(answer); });
  });
}

async function login(email, password) {
  const res = await fetch(`${API_BASE}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Login failed (HTTP ${res.status}): ${body}`);
  }
  const data = await res.json();
  if (data.type !== 'admin') throw new Error(`Logged in but role is "${data.type}", expected "admin"`);
  return data.token;
}

async function fetchCourseData(token) {
  const res = await fetch(`${API_BASE}/api/admin/courseData`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Failed to fetch courseData: HTTP ${res.status}`);
  return res.json();
}

async function uploadImage(token, filePath) {
  const buf = fs.readFileSync(filePath);
  const blob = new Blob([buf], { type: contentTypeFor(filePath) });
  const fd = new FormData();
  fd.append('image', blob, path.basename(filePath));
  const res = await fetch(`${API_BASE}/api/admin/menu-options/upload-image`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: fd
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Upload failed for ${path.basename(filePath)}: HTTP ${res.status} ${body}`);
  }
  const data = await res.json();
  if (!data.imageId) throw new Error(`Upload returned no imageId for ${path.basename(filePath)}`);
  return data.imageId;
}

async function patchOption(token, courseId, optionId, body) {
  const res = await fetch(`${API_BASE}/api/admin/courseData/${courseId}/options/${optionId}?lang=en`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`PUT option ${optionId} failed: HTTP ${res.status} ${text}`);
  }
  return res.json();
}

async function main() {
  console.log('━'.repeat(72));
  console.log('Course Option Image Upload (via API)');
  console.log('━'.repeat(72));
  console.log(`Mode:      ${dryRun ? 'DRY RUN (no writes)' : 'LIVE'}`);
  console.log(`API:       ${API_BASE}`);
  console.log(`Email:     ${ADMIN_EMAIL}`);
  console.log(`Image dir: ${IMAGE_DIR}`);
  console.log();

  if (!fs.existsSync(IMAGE_DIR)) {
    console.error(`ERROR: image directory not found: ${IMAGE_DIR}`);
    process.exit(1);
  }

  const plan = [];
  const missing = [];
  for (const [prefix, labelEn] of Object.entries(PREFIX_TO_LABEL_EN)) {
    let wideFile = null, closeupFile = null;
    for (const ex of ['png', 'jpg', 'jpeg', 'webp']) {
      const w = path.join(IMAGE_DIR, `${prefix}_1.${ex}`);
      const c = path.join(IMAGE_DIR, `${prefix}_2.${ex}`);
      if (!wideFile && fs.existsSync(w)) wideFile = w;
      if (!closeupFile && fs.existsSync(c)) closeupFile = c;
    }
    if (!wideFile || !closeupFile) missing.push({ prefix, labelEn, wideFile, closeupFile });
    else plan.push({ prefix, labelEn, wideFile, closeupFile });
  }

  if (missing.length) {
    console.log(`Missing image pair(s) for ${missing.length} prefix(es):`);
    for (const m of missing) {
      console.log(`  - ${m.prefix} (${m.labelEn})`);
      if (!m.wideFile)    console.log(`      missing: ${m.prefix}_1.{png,jpg,jpeg,webp}`);
      if (!m.closeupFile) console.log(`      missing: ${m.prefix}_2.{png,jpg,jpeg,webp}`);
    }
    console.log();
  }

  if (!plan.length) {
    console.error('Nothing to upload (no complete pairs found).');
    process.exit(1);
  }

  if (dryRun) {
    console.log('Plan (file resolution only — skipping API):');
    console.log('─'.repeat(72));
    for (const item of plan) {
      const ws = fs.statSync(item.wideFile).size;
      const cs = fs.statSync(item.closeupFile).size;
      console.log(`  ${item.prefix.padEnd(28)} → ${item.labelEn}`);
      console.log(`      wide   : ${path.basename(item.wideFile).padEnd(40)} (${fmtBytes(ws)})`);
      console.log(`      closeup: ${path.basename(item.closeupFile).padEnd(40)} (${fmtBytes(cs)})`);
    }
    console.log('─'.repeat(72));
    console.log(`Total: ${plan.length} options, ${plan.length * 2} images`);
    console.log('\nDRY RUN — no API calls, no changes written.');
    return;
  }

  const password = process.env.ADMIN_PASSWORD || (await ask(`Password for ${ADMIN_EMAIL}: `)).trim();
  if (!password) { console.error('No password provided.'); process.exit(1); }

  console.log('\nLogging in…');
  const token = await login(ADMIN_EMAIL, password);
  console.log('  ✓ admin token acquired');

  console.log('\nFetching courseData to resolve option IDs…');
  const courses = await fetchCourseData(token);
  const labelToOption = new Map();
  for (const course of courses) {
    for (const opt of (course.options || [])) {
      const labelEn = (typeof opt.label === 'string') ? opt.label : (opt.label && opt.label.en);
      if (labelEn) labelToOption.set(labelEn, { courseId: course.id, optionId: opt.id });
    }
  }
  console.log(`  ✓ ${labelToOption.size} option(s) indexed`);

  const unmatched = [];
  for (const item of plan) {
    const ref = labelToOption.get(item.labelEn);
    if (!ref) unmatched.push(item);
    else { item.courseId = ref.courseId; item.optionId = ref.optionId; }
  }

  if (unmatched.length) {
    console.error(`\n${unmatched.length} CourseOption(s) not found by label.en:`);
    for (const u of unmatched) console.error(`  - "${u.labelEn}" (prefix: ${u.prefix})`);
    process.exit(1);
  }

  console.log('\nUpload plan:');
  console.log('─'.repeat(72));
  for (const item of plan) {
    const ws = fs.statSync(item.wideFile).size;
    const cs = fs.statSync(item.closeupFile).size;
    console.log(`  ${item.prefix.padEnd(28)} → ${item.labelEn}`);
    console.log(`      wide   : ${path.basename(item.wideFile).padEnd(40)} (${fmtBytes(ws)})`);
    console.log(`      closeup: ${path.basename(item.closeupFile).padEnd(40)} (${fmtBytes(cs)})`);
  }
  console.log('─'.repeat(72));
  console.log(`Total: ${plan.length} options, ${plan.length * 2} images`);
  console.log();

  if (!force) {
    const ans = (await ask('Proceed with upload? (y/N) ')).trim();
    if (!/^y(es)?$/i.test(ans)) { console.log('Aborted.'); return; }
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'course-img-'));
  console.log(`\nTemp dir: ${tmpDir}`);
  console.log(skipResize ? 'Skipping resize (--no-resize)' : `Resizing wide→${RESIZE_WIDE_PX}px, close-up→${RESIZE_CLOSEUP_PX}px, JPEG q${JPEG_QUALITY}`);

  console.log('\nUploading…');
  let okCount = 0;
  for (const item of plan) {
    try {
      let wideUploadPath = item.wideFile;
      let closeUploadPath = item.closeupFile;
      if (!skipResize) {
        wideUploadPath = path.join(tmpDir, `${item.prefix}_1.jpg`);
        closeUploadPath = path.join(tmpDir, `${item.prefix}_2.jpg`);
        resizeToJpeg(item.wideFile, wideUploadPath, RESIZE_WIDE_PX);
        resizeToJpeg(item.closeupFile, closeUploadPath, RESIZE_CLOSEUP_PX);
      }
      const ws = fs.statSync(wideUploadPath).size;
      const cs = fs.statSync(closeUploadPath).size;
      const wideId = await uploadImage(token, wideUploadPath);
      const closeId = await uploadImage(token, closeUploadPath);
      await patchOption(token, item.courseId, item.optionId, {
        image: wideId,
        imageCloseup: closeId
      });
      okCount++;
      console.log(`  ✓ ${item.prefix.padEnd(28)} wide ${fmtBytes(ws)}, closeup ${fmtBytes(cs)}`);
    } catch (err) {
      console.error(`  ✗ ${item.prefix}: ${err.message}`);
    }
  }

  if (!skipResize) {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
  }

  console.log('\n' + '━'.repeat(72));
  console.log(`Done. ${okCount}/${plan.length} options updated.`);
  console.log('━'.repeat(72));
}

main().catch(err => {
  console.error('Fatal error:', err.message || err);
  process.exit(1);
});
