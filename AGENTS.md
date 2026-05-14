# AGENTS.md

Guidance for AI coding agents working in this repository. Read this BEFORE making changes to 3D-geometry code (`scripts/generate_*_stl.py`).

For general project info (server, frontend, deployment, API, etc.), see `CLAUDE.md`.

---

## Hard rules for 3D geometry (CadQuery)

### Rule 1: Never trust workplane normal direction without verifying

CadQuery's named workplanes do NOT all have the "expected" outward-pointing normal.

| Workplane | Normal direction (actual) |
|-----------|---------------------------|
| `"XY"`    | `+Z` ✓ (intuitive)        |
| `"YZ"`    | `+X` ✓ (intuitive)        |
| `"XZ"`    | **`-Y`** ❌ (counterintuitive: normal points in NEGATIVE Y) |

A box built with `cq.Workplane("XZ").box(W, H, D, centered=(True, True, False))` extrudes in the `-Y` direction, NOT `+Y`. Translating that box by `(0, +25, 0)` puts it at `Y = [22.5, 25]`, not `[25, 27.5]` as a naive reading would suggest.

**This bug has been introduced and fixed multiple times in `generate_picture_cube_stl.py` and `generate_base_stl.py`. Recent incidents:**
- `_build_face_centre_bulges`: used `cq.Workplane("XZ")` for +Y/-Y face bulges, placing them inside the cavity instead of in the wall. Symptoms: 2 of 4 cube faces had full-thickness walls (not thinned), visible as asymmetric slicer cross-sections.
- Earlier incidents in tittle stems and L-bracket pin positioning.

**The "XZ uses -Y normal" gotcha is the single most repeated bug in this codebase. Always assume you're about to step in it.**

**Defensive practice (use ALL of these, not just one):**
1. **Default: build primitives on `cq.Workplane("XY")` only**, with explicit dimensions matching the world axes, then translate to position. This is what `_build_face_centre_bulges()` in `generate_picture_cube_stl.py` now does and what new code should do.
2. **If existing code in this file uses non-XY workplanes, that does NOT mean the pattern is safe.** Old code may be relying on accidental double-negation (e.g. `extrude(-L)` on "XZ" cancels the -Y normal). Adding new code in the same style is the trap.
3. **If you must use named workplanes other than XY**, you MUST verify each primitive's bounding box before any boolean operation. Print the bbox. Compare to the world-axis range you expect.
4. **Never** use `centered=(True, True, False)` with a non-XY workplane assuming the asymmetric axis is positive — it might be negative.

### Rule 2: After any geometry change, MANDATORY symmetry/integrity check

This is not optional. Run these checks after every geometry-affecting edit, before moving on:

**Symmetry check (for parts that should be 4-fold symmetric like the cube):**
```python
import trimesh
m = trimesh.load('picture_cube.stl')
for z in [-26, -20, -10, 0, 10, 20, 26]:
    section = m.section(plane_origin=[0,0,z], plane_normal=[0,0,1])
    p2d = section.to_2D()[0]
    b = p2d.bounds
    x_ext = b[1][0] - b[0][0]
    y_ext = b[1][1] - b[0][1]
    assert abs(x_ext - y_ext) < 0.5, f"asymmetric at z={z}"

# Also verify the wall is symmetric in cross-section through wall material:
for xy in [22, 24, 26]:  # inside wall material region
    s1 = m.section(plane_origin=[xy,0,0], plane_normal=[1,0,0])
    s2 = m.section(plane_origin=[0,xy,0], plane_normal=[0,1,0])
    p1 = s1.to_2D()[0]; p2 = s2.to_2D()[0]
    # The cross-sections should have the same enclosed area
    assert abs(p1.area - p2.area) < 5.0, f"wall asymmetric at {xy} (X-slice area {p1.area} vs Y-slice area {p2.area})"
```

**Note**: outer-bbox symmetry alone is INSUFFICIENT — the cube's outer box is always 63×63 regardless of which bulges work. The wall-region cross-section check catches asymmetric bulges that the outer check misses. THIS DISTINCTION MATTERS — I previously confirmed "symmetric" using only the outer bbox check and missed an obvious bulge bug.

**Watertight check (for parts that should be sealed):**
```python
assert m.is_watertight, "Mesh has holes - geometry is broken somewhere"
```

**Hole-presence check (for parts with drilled holes):**
```python
# For each expected hole, ray-cast from outside through the hole position
# and confirm the first hit is at the hole bottom, not the recess floor.
import numpy as np
for hx, hy in [(28, 28), (-28, 28), (28, -28), (-28, -28)]:
    origin = np.array([[hx, hy, 50]])
    direction = np.array([[0, 0, -1]])
    locations, _, _ = m.ray.intersects_location(origin, direction)
    first_hit = max(loc[2] for loc in locations) if len(locations) else None
    assert first_hit < 28, f"Hole at ({hx},{hy}) is blocked or missing"
```

**Mate check (for parts that interface with other parts):**
- Cube ↔ L-bracket ↔ pin: run `scripts/check_interference.py` after changes.
- L-bracket pin lengths and registration pin total length must match `PEG_HOLE_DEPTH` in cube.

**STL vs 3MF check (both outputs must contain the same geometry):**
```python
stl = trimesh.load('part.stl')
mf = trimesh.load('part.3mf')
mf_geom = list(mf.geometry.values())[0] if hasattr(mf, 'geometry') else mf
assert abs(stl.volume - mf_geom.volume) < 1.0, "STL and 3MF have different geometry"
```

The 3MF writer in `_3mf_writer.py` only meshes the primary solid (see Rule 3) — if STL and 3MF disagree, you have a disjoint-solids problem.

### Rule 3: Disjoint solids vs single solid

CadQuery's `.union()` of two non-overlapping solids produces a `Compound` containing both as **separate** solids, not a single fused solid.

- `cq.exporters.export(..., exportType="STL")` may or may not include all solids depending on internal traversal — historically the AD5X cube hit this where struts/stems were silently dropped.
- The 3MF writer in `_3mf_writer.py` uses `shape.tessellate()` which only meshes the **primary** solid — disjoint solids are silently dropped from the 3MF output.

**Whenever you union two solids that should be one part, ensure they geometrically overlap by at least 0.1 mm.** After union, verify:

```python
solids = workplane.val().Solids()
assert len(solids) == 1, f"Expected 1 connected solid, got {len(solids)}"
```

Examples of past bugs from this rule:
- `_build_tittle_stem` was Z=[10, 13] floating above wall top at Z=6.5 → 3MF silently dropped the stem.
- Fixed by extending to Z=[5, 16] so the stem fuses into the disk/wall.

### Rule 4: Cube hole drilling is order-sensitive

The corner peg holes are drilled into the cube AFTER any internal features (struts, cavity carving) are unioned in. Holes at cube corners drill through any material in their path including struts.

If you change the cube assembly order, verify hole clearance by ray-casting:

```python
import trimesh, numpy as np
m = trimesh.load('picture_cube.stl')
for hx, hy in [(28, 28), (-28, 28), (28, -28), (-28, -28)]:
    origin = np.array([[hx, hy, 50]])
    direction = np.array([[0, 0, -1]])
    locations, _, _ = m.ray.intersects_location(origin, direction)
    # First downward hit should be at z=27.9 (hole bottom) or below (mutual corner intersection)
    assert min(loc[2] for loc in locations) < 28, f"hole at ({hx},{hy}) appears blocked"
```

### Rule 5: Layer-height-aware Z dimensions for visible features

The cubes are sliced at 0.12 mm layer height. Z dimensions of visible features should be exact multiples of 0.12 mm where practical:

- `RECESS_DEPTH = 0.6` mm = 5 layers exactly ✓
- `CHAMFER = 1.0` mm = 8.33 layers (acceptable; chamfer prints as stair-step over 8 or 9 layers)
- `DISK_THICK`, `PLATFORM_HEIGHT`, `WALL_HEIGHT` in `generate_base_stl.py` — see comments there; some are deliberately set to multiples of 0.12 mm.

When adding new Z-direction features that will be visible, check the layer-alignment in your head: divide by 0.12 mm and see if it lands cleanly. If not, consider adjusting by ±0.04 mm to land on a clean layer boundary.

---

## 3D geometry file map

| File | Produces |
|------|----------|
| `scripts/generate_picture_cube_stl.py` | One picture cube (24 corner peg holes, recesses, thinned face centres) |
| `scripts/generate_l_bracket_stl.py` | L-bracket support piece |
| `scripts/generate_registration_pin_stl.py` | Small pin used between directly-stacked cubes |
| `scripts/generate_base_stl.py` | Wedding base disk with text, heart, arrow, 4-quarter split |
| `scripts/generate_batched_prints.py` | Grids of cubes/brackets/pins for batch AD5X prints |
| `scripts/generate_full_assembly_stl.py` | Visualisation-only full assembly |
| `scripts/check_interference.py` | Verify L-bracket pins/pegs sit in cube hole cavities |
| `scripts/verify_l_bracket_fit.py` | Build a 2-cube + bracket + cube-above assembly STL |
| `scripts/_3mf_writer.py` | Shared helper for emitting 3MF (single-body and multi-body) |

### Cross-file invariants

These constants MUST stay consistent across the per-part files:

- `CUBE_OUTER = 63.0`
- `PEG_HOLE_INSET = 3.5`
- `PEG_HOLE_DIAM = 2.5` (matching pin diameter 2.4 mm = 0.1 mm friction fit)
- `PEG_HOLE_DEPTH = 3.0` — used by L-bracket (`PEG_HOLE_DEPTH`), registration pin (engagement 2.7 mm), base (`PEG_LENGTH = 2.7`)
- `RECESS_DEPTH = 0.6`

When changing one of these, search every script for usages and update consistently.

---

## Print orientation reminders

- **Cubes** print bottom-face-down on the bed. The bottom face's recess opens downward (toward the bed), so it needs support inside the recess (60×60 mm overhang). All other faces' geometry prints without overhang support.
- **L-brackets** print flat on the bed. No support needed.
- **Pins** print upright. No support needed.
- **Base quarters** print upright with all features (text, heart, arrow) facing up. Support may be needed for the heart/arrow assembly.

---

## Slicer settings notes (Orca-Flashforge / AD5X)

- Layer height 0.12 mm, line width 0.42 mm, 4 walls, 6 top shells, 4 bottom shells, 15% gyroid infill
- Ironing on topmost surface (concentric, 10% flow)
- Bridge flow 0.98, top/bottom flow 0.98
- Outer wall 100 mm/s, monotonic top pattern
- For cubes: support enabled, on-build-plate-only, threshold angle 45°, top interface 3 layers concentric, top Z distance = 0.12 mm (1 layer)
- Disable prime tower (single-material parts don't need it)
- "Don't support bridges" must stay UNCHECKED — the 60×60 recess floor cannot bridge and must be supported

The slicer preset is saved as **"George's Quality"** in Orca-Flashforge.

---

## Gift terminology (canonical — use these names everywhere)

The wedding portal has five distinct physical gift artefacts. They were previously called "card" / "tarjeta" / "carte" / "Karte" interchangeably, which made it impossible to tell them apart in conversation, code, or UI copy. The names below are the canonical terms — when the user says one, they mean exactly that artefact, and when an agent writes UI copy, code comments, commit messages, or replies, it should use the same name.

| Concept | EN | ES | FR | DE |
|---|---|---|---|---|
| Physical card delivered with **every** gift, with the purchaser's name and personal message and space to handwrite more on the day | **Gift note** | **Nota de regalo** | **Mot d'accompagnement** | **Geschenkkarte** |
| Card from the bride and groom thanking each gift purchaser | **Thank-you note** | **Nota de agradecimiento** | **Mot de remerciement** | **Dankeskarte** |
| Credit-card-shaped gift voucher that funds the honeymoon — gift type `'cash'` in the Gift schema | **Honeymoon card** | **Tarjeta de luna de miel** | **Carte lune de miel** | **Hochzeitsreise-Karte** |
| The printed-cube gift assembled into the wedding sculpture — gift type `'cube'` in the Gift schema (enum unchanged) | **Block** | **Bloque** | **Bloc** | **Block** |
| The 3D figurine of the couple (4 variants: bride, groom, bride-on-lounger, groom-on-lounger) — gift type `'figurine'` in the Gift schema | **Figurine** | **Figurita** | **Figurine** | **Figur** |

### Where these names live

- **User-facing copy**: `public/js/i18n.js` — section "Canonical gift terminology" near the end of each language block, keys `gifts:term.giftNote`, `gifts:term.thankYouNote`, `gifts:term.honeymoonCard`, `gifts:term.block`, `gifts:term.figurine` (plus `.plural` variants). Use these keys via `translate()` rather than hardcoding strings.
- **Gift descriptions**: `server/data/figurine-text.js`, `server/data/cube-text.js`. References to "a printed card" inside descriptions should say "gift note" (or the locale equivalent) — never "card" alone, which is now ambiguous.

### How gifts work end-to-end (the physical flow)

The wedding has **three purchaseable gift types** and **two paper artefacts** that accompany every purchase. Knowing the flow keeps copy honest and prevents agents from inventing extra steps.

**The three purchaseable gifts** (one of these per guest purchase):

1. **Honeymoon card** — a credit-card-shaped voucher. Funds go toward the honeymoon. Gift type `'cash'` in the schema.
2. **Block** — a printed picture cube that becomes part of the wedding sculpture. Gift type `'cube'`, `cubeId` 1..38.
3. **Figurine** — a 3D-printed figurine of the couple (4 variants). Gift type `'figurine'`, `figurineId` 1..4.

**The two paper artefacts** (both included in every guest's banquet bag at their seat):

1. **Gift note** (guest → couple) — printed with the **purchaser's** name and personal message at the time they bought their gift online, with space to handwrite more and sign on the wedding day. Travels TO the couple, alongside the gift itself.
2. **Thank-you note** (couple → guest) — written by the bride and groom, addressed to that specific purchaser, **prepared in advance**. Because all purchases are made before the wedding day, the couple knows every gift + buyer combination ahead of time and can write a personalised thank-you for each one. Travels FROM the couple, in the same bag as the gift the guest is about to hand over.

### The banquet-day choreography

When a guest sits down at their assigned table seat at the wedding banquet, they find a bag at their place containing:

- The Honeymoon card / Block / Figurine they purchased (the physical gift itself)
- The Gift note already printed with their name and message, with space to handwrite extra words and sign right there
- The Thank-you note from the couple, already addressed to them

During a designated moment in the banquet, the guest signs their Gift note, places it with their gift, and presents it to the couple — the Thank-you note stays in their bag (it's theirs to take home).

This means every gift purchase the platform processes is **deterministic at print time**: by the day of the wedding, all Gift notes have been printed and all Thank-you notes have been written. There is no live in-banquet checkout flow.

### Previews shown in the gift-purchase UI

Each gift type has a preview matching its physical form. A purchaser can preview the gift before committing to buying.

| Gift type | Preview surface | Code location |
|---|---|---|
| Honeymoon card | Front + inside spread, with the buyer's name and live-typed message rendered onto the inside as they type | `public/js/gifts/gifts.js` (`cash-gift-preview-overlay`, `cash-card-preview-page--front`, `cash-card-preview-page--inside`) — assets in `public/assets/images/gift-cards/` |
| Block | Interactive 3D cube viewer | `public/js/gifts/cube-viewer.js` |
| Figurine | Interactive 360° turntable image sequence | `public/js/gifts/figurine-viewer.js` |

The **Thank-you note** has a separate static preview that lives outside the purchase flow:

- File: `public/thank-you-card-preview.html`
- This is a standalone HTML page the couple can open to see what the printed Thank-you note will look like. It is **not** part of any guest-facing screen — guests never see this preview, because they receive the actual physical note on the wedding day.

### Schema vs UI mismatch (deliberate)

The `Gift.type` enum in `server/models/Gift.js` is `'cash' | 'cube' | 'figurine'`. The user-facing labels are **honeymoon card / block / figurine**. The mismatch is intentional — renaming the enum is a database migration with rollout risk, while renaming the UI labels is safe and was done first. CSS class names (`gift-cube-card`, `cube-viewer`, `gift-credit-card`) and JS function names (`createCubeViewer`, `purchaseCube`) also still use the old internal vocabulary. **Do not rename these in passing.** A future commit will do the schema + identifier rename as a single coordinated change with a migration.

When writing code, use the **schema enum value** as the internal identifier and the **canonical user-facing name** in any string the user will see. Example:

```js
// internal: 'cube' (schema), user-facing: 'block'
if (gift.type === 'cube') {
  showToast(translate('gifts:term.block') + ' added to your basket');
}
```

### Agent communication rules

- When the user says "block", they mean the printed-cube gift. They never mean the figurine, the honeymoon card, or anything else.
- When the user says "figurine", they mean the 3D printed figure. The four variants are accessed by `figurineId` (1=bride, 2=groom, 3=bride-on-lounger, 4=groom-on-lounger).
- When the user says "gift note", they mean the small card delivered alongside whichever gift was purchased — never the honeymoon card.
- When the user says "honeymoon card" or just "card" in the context of gift purchasing, they mean the credit-card-shaped voucher (Gift type `'cash'`).
- When the user says "thank-you note", they mean the couple's outbound card to the purchaser (not yet implemented as a feature — only the static preview `public/thank-you-card-preview.html` exists).

When writing reply text, commit messages, or PR descriptions, use these names consistently. Do not invent synonyms ("memento card", "wedding token", "wee figurine") — the canonical names are the canonical names.

### When to use the schema name vs the user-facing name

| Context | Use |
|---|---|
| Mongoose query, schema field, API enum value | Schema name (`'cube'`, `'figurine'`, `'cash'`) |
| Function name, class name, file path, CSS class | Schema name (until the future rename commit) |
| UI label, button text, error message visible to a guest | Canonical user-facing name via i18n key |
| Commit message, code comment explaining intent | Either — prefer the canonical user-facing name |
| Conversation with the user | Canonical user-facing name |
