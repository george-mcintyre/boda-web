# Printer-ready PDF generation

This directory turns the **artefact descriptors** you download from the admin
Gift Purchases tab into PDF files that you can hand to a printer.

It runs locally on your laptop. No server changes, no Vercel cold starts,
no Chromium-on-serverless wrangling. Playwright is already in
`devDependencies`; no extra install needed beyond `npm install` once.

---

## Quick start

1. **Download descriptors from admin**

   In the admin "Gift Purchases" tab:
   - The download icon (per row) downloads ONE purchase as
     `purchase-<id>-<guest-slug>.json`.
   - The "Download all artefacts" button at the top downloads every
     purchase as `wedding-print-bundle-<date>.json`.

2. **Run the script**

   ```bash
   # Single descriptor:
   node scripts/print/render-artefacts.js ~/Downloads/purchase-65f3a...-maria-jose.json

   # Bulk bundle:
   node scripts/print/render-artefacts.js ~/Downloads/wedding-print-bundle-2026-05-17.json

   # Whole folder of descriptors:
   node scripts/print/render-artefacts.js ~/Downloads/wedding-prints/

   # Custom output directory:
   node scripts/print/render-artefacts.js --out ~/Desktop/prints/ ~/Downloads/wedding-print-bundle.json

   # Force a Spanish salutation form for all purchases (default: masculine plural):
   node scripts/print/render-artefacts.js --salutation-gender=f ~/Downloads/wedding-print-bundle.json

   # Override individual purchases (e.g. set a couple as feminine plural, a
   # single man as masculine singular). Other purchases use the auto-detected
   # number and the default gender:
   node scripts/print/render-artefacts.js \
     --overrides=~/Downloads/salutation-overrides.json \
     ~/Downloads/wedding-print-bundle.json
   ```

   See `node scripts/print/render-artefacts.js --help` for the full Spanish
   salutation matrix and the overrides JSON shape.

   **Tip:** every run writes `prints/salutation-overrides.json` containing
   the CLI's salutation decision for every purchase (with the signer name
   as a hint). Open the file, edit any wrong rows, and re-run with
   `--overrides=prints/salutation-overrides.json` to fix them. If you've
   already edited that file, the next run writes a timestamped sibling
   (`salutation-overrides.<YYYYMMDD-HHMMSS>.json`) so your edits are never
   overwritten.

3. **Send the PDFs to the printer**

   Output (default `./prints/`) contains one PDF per artefact per purchase,
   plus one aggregate sheet for the block (cube) labels, named like:

   ```
   gift-note-<purchaseId>-<guest-slug>.pdf
   thank-you-note-<purchaseId>-<guest-slug>.pdf
   honeymoon-card-<purchaseId>-<guest-slug>.pdf   (cash gifts only)
   block-notes-sheet.pdf                          (one per run; only if there are cube purchases)
   ```

---

## What gets printed

| Artefact | Page size | Pages | Notes |
|---|---|---|---|
| **Gift note** | A4 landscape (297×210 mm) | 2 | Outside spread + inside spread. Score down the centre, fold to A5 portrait. |
| **Thank-you note** | A4 landscape (297×210 mm) | 2 | Same shape as gift note. Inside is bilingual (EN/ES). |
| **Honeymoon card** | 91×61 mm (= 85×55 mm + 3 mm bleed each side) | 2 | Front + back. ISO/IEC 7810 ID-1 credit-card size. |
| **Block notes sheet** | A4 portrait (210×297 mm) | 1 per 12 cube purchases | 3×4 grid of 60×60 mm self-adhesive labels. Print on adhesive stock and cut along the corner marks. Centred message + cursive "— signer" at bottom-right. |

The gift / thank-you / honeymoon PDFs include **3 mm bleed and corner
crop marks** suitable for professional printers. They print at the
native size — do not scale or "fit to page". The block-notes sheet
prints onto self-adhesive A4 label stock and gets cut along the hairline
corner marks (no bleed — the labels are flush white, edge-to-edge).

### Printer specs to give your printer

- **Format**: PDF
- **Colour**: RGB (most printers convert to CMYK automatically; ask if uncertain)
- **Resolution**: assets are embedded at full source quality
- **Bleed**: 3 mm (already included in page size)
- **Trim marks**: corner crop marks already on the PDF
- **Stock**:
  - Gift note + Thank-you note: 300 gsm folded card stock works well
  - Honeymoon card: 350 gsm or laminated PVC for a true credit-card feel

For folded cards, the dashed line down the centre of each PDF marks
where to score and fold. Most commercial printers will do score + fold
as a finishing option — mention "score and fold to A5" when ordering.

---

## Descriptor JSON schema (v1)

The admin endpoint `/api/admin/gift-purchases/:id/descriptor.json` builds
this. The bulk endpoint `/api/admin/gift-purchases/descriptors.json`
returns `{ schemaVersion, generatedAt, count, descriptors: [...] }` where
each item in `descriptors` has the shape below.

```jsonc
{
  "schemaVersion": 1,
  "purchaseId": "65f3a...",
  "generatedAt": "2026-05-17T14:32:00.000Z",

  "guest": {
    "name": "Maria & José Pérez",
    "email": "maria@example.com",
    "slug": "maria-jose-perez"
  },

  "purchase": {
    "date": "2026-05-15T10:23:11.000Z",
    "message": "Wishing you a wonderful adventure together!",
    "signerName": "Maria & José",
    "amount": 150
  },

  "gift": {
    "type": "cash",                  // 'cash' | 'cube' | 'figurine'
    "title":       { "en": "...", "es": "...", "fr": "...", "de": "..." },
    "description": { "en": "...", "es": "...", "fr": "...", "de": "..." },
    "amount": 150,
    "imageDataUri": "data:image/jpeg;base64,...",   // cash only
    "cubeId": null,                  // 1..38 for cube gifts
    "figurineId": null               // 1..4 for figurine gifts
  },

  "couple": { "names": "Iluminada & George" },

  "artefacts": {
    "giftNote":      { "coverImageDataUri": "data:image/jpeg;base64,..." },
    "thankYouNote":  { "coupleImageDataUri": "data:image/png;base64,..." },
    "honeymoonCard": { "imageDataUri": "data:image/jpeg;base64,..." }  // only for cash
  }
}
```

The descriptor deliberately omits cube face textures and figurine
thumbnails — they used to be embedded but the print templates moved to
text-only layouts and the images added ~1-2 MB per cube purchase to
every bundle download for no gain. If a future template needs those
images back, add them under `artefacts.<artefactKey>` (where the
print-only assets live) rather than back onto `gift.*` (which mirrors
the schema). The live admin block viewer dialog gets its faces from
`/api/admin/gift-purchases` directly, not from the descriptor.

### Notes on the schema

- **Self-contained.** All images are embedded as base64 data URIs. The
  print script never makes any network call. You could re-run a print
  job months from now from a USB stick with no internet.
- **Localised strings** are kept as `{ en, es, fr, de }` objects. The
  templates choose which language to use per section (the thank-you
  note uses EN/ES side-by-side, the gift note uses EN only — change
  the templates if you want different language behaviour).
- **`schemaVersion`** is the contract between the server (in
  `server/controllers/adminExpansionController.js`,
  `buildCombinedDescriptor()`) and this script. If you change the
  schema in a way that breaks old descriptors, bump the version in
  both places.

---

## Directory layout

```
scripts/print/
├── render-artefacts.js          Main CLI
├── templates/
│   ├── gift-note.html           Folded card, outside + inside spread
│   ├── thank-you-note.html      Folded card, bilingual inside
│   ├── honeymoon-card.html      Credit-card-shaped voucher
│   └── block-notes.html         A4 sheet of 60×60 mm cube-label stickers
└── README.md                    This file
```

The templates are standalone HTML documents. You can open one in a
browser to preview the print layout — just paste a descriptor into the
JS console as `window.__DESCRIPTOR__ = {...}; window.__ARTEFACT__ = 'giftNote';`
and reload the inline `<script>` block at the bottom of the file. Easier
in practice: change the wording in the template, re-run
`render-artefacts.js` on a sample descriptor, open the resulting PDF.

### Template contract

Per-descriptor templates (`gift-note.html`, `thank-you-note.html`,
`honeymoon-card.html`):
1. Load with the marker comment `<!--INJECT-DATA-->` somewhere in the body.
2. The CLI substitutes that marker with a `<script>` block that sets
   `window.__DESCRIPTOR__` and `window.__ARTEFACT__`.
3. The template's own inline script reads those globals, populates the
   DOM, and sets `window.__TEMPLATE_READY__ = true`.
4. Playwright waits for `__TEMPLATE_READY__` before generating the PDF.

The aggregate template `block-notes.html` follows the same contract but
receives `window.__BLOCK_NOTES__` (an array of `{ message, signer, lang,
purchaseId, cubeId }`) instead of `__DESCRIPTOR__`. The CLI builds the
array by scanning every cube purchase in the run and emits one PDF per
run, not per purchase.

If you write a new template, keep all the steps above.

---

## Troubleshooting

**"Descriptor schemaVersion=N not supported"**
The server descriptor builder and this script are out of sync. Either
update the server (`buildCombinedDescriptor()` in
`server/controllers/adminExpansionController.js`) or update the script's
`SCHEMA_VERSION_SUPPORTED` constant — whichever needs to catch up.

**Blank PDFs or missing data**
The template's inline `<script>` probably threw. Open the template HTML
in a browser, paste a sample descriptor into devtools, and reload.

**Images look pixelated**
The source images are stored in the database (cash gifts) or shipped
with the site (cube faces, couple portrait). For higher print fidelity,
upgrade the source assets — the script just embeds whatever the server
sent.

**Honeymoon card prints with white text on a missing background**
The cash gift's `image` field on the `Gift` document is unset. Upload
an image for that gift in the admin Gift List tab and re-download the
descriptor.

**Playwright launch error on first run**
You may need to install Chromium for Playwright:
```bash
npx playwright install chromium
```

---

## Where the data comes from

- `gift.title` / `gift.description` are the localised strings from the
  `Gift` Mongo document.
- `purchase.message` and `purchase.signerName` are what the buyer typed
  during checkout (`GiftChoice.message`, `GiftChoice.giftFrom`).
- `couple.names` is currently hardcoded to "Iluminada & George" in the
  server descriptor builder. Change `COUPLE_NAMES` in
  `server/controllers/adminExpansionController.js` if you ever need to
  edit it.
- Image bytes are read from MongoDB (`GiftImage` for cash gifts) or
  the filesystem under `public/assets/` (cube faces, figurine thumbs,
  couple portrait, gift note cover).
