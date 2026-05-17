#!/usr/bin/env python3
"""
Generate full_assembly.stl: a single visualization STL with everything
assembled in its correct position. Use this to inspect the complete design
in FreeCAD or any STL viewer before printing.

Contents:
  - Base disk + raised platforms + registration pins (as one piece)
  - Heart + arrow ornament
  - Names text and date text
  - All 38 cubes in their correct (col, row, level) positions
  - 10 L-brackets each placed and rotated to fit between its supporters
  - Registration pins between every directly-stacked cube pair

Output: full_assembly.stl (binary STL, not for printing - for visual review)
"""

import math
import sys

import cadquery as cq

sys.path.insert(0, "scripts")

from generate_picture_cube_stl import build_full_assembly as build_cube_assembly
from generate_l_bracket_stl import build_bracket as build_lbracket
from generate_registration_pin_stl import build_pin as build_reg_pin
from generate_base_stl import (
    CUBE_OUTER, GRID_OFFSET,
    DISK_THICK, PLATFORM_HEIGHT, HEART_HEIGHT,
    NAMES_ARCH_RADIUS, DATE_ARCH_RADIUS, DATE_CHAR_SPACING_DEG,
    build_disk_with_platform_and_pins,
    build_arched_text_at, build_heart_with_arrow_assembly,
    _build_names_around_heart,
    DATE_TEXT,
)


LEVELS = {
    1: {(0,1), (0,2), (0,3), (3,1), (3,2), (3,3), (1,0), (2,0)},
    2: {(0,0), (0,1), (0,2), (0,3), (1,1), (2,1), (3,0), (3,1), (3,2), (3,3)},
    3: {(0,0), (0,1), (0,2), (0,3), (1,1), (1,2), (2,1), (2,2),
        (3,0), (3,1), (3,2), (3,3)},
    4: {(1,0), (2,0), (0,1), (3,1), (0,2), (3,2), (1,3), (2,3)},
}

PLATFORM_TOP_Z = DISK_THICK + PLATFORM_HEIGHT


def cube_xy_center(col: int, row: int) -> tuple[float, float]:
    cx = GRID_OFFSET + (col + 0.5) * CUBE_OUTER
    cy = GRID_OFFSET + (row + 0.5) * CUBE_OUTER
    return (cx, cy)


def cube_z_bottom(level: int) -> float:
    return PLATFORM_TOP_Z + (level - 1) * CUBE_OUTER


def place_cube(cube_template: cq.Workplane, col: int, row: int, level: int) -> cq.Workplane:
    cx, cy = cube_xy_center(col, row)
    z_bottom = cube_z_bottom(level)
    z_center = z_bottom + CUBE_OUTER / 2
    return cube_template.translate((cx, cy, z_center))


def find_supporters(cube_pos: tuple[int, int], lower_level_set: set) -> tuple[int, int] | None:
    """For an unsupported cube on level N+1, return (dx, dy) where dx, dy ∈ {-1, +1}
    representing the diagonal direction from the void corner to the supporters.
    Both supporters at (col+dx, row) and (col, row+dy) must exist on level N.
    Returns None if not exactly one such pair exists.
    """
    col, row = cube_pos
    for dx in (-1, 1):
        for dy in (-1, 1):
            if (col + dx, row) in lower_level_set and (col, row + dy) in lower_level_set:
                return (dx, dy)
    return None


def place_lbracket(bracket_template: cq.Workplane, cube_pos: tuple[int, int],
                   level_above: int, supporters_dir: tuple[int, int]) -> cq.Workplane:
    """Place an L-bracket so its inside corner sits at the void's corner where
    the two perpendicular supporters meet, at the level boundary between
    level_above-1 and level_above.

    The canonical bracket has its inside corner at local origin with arms
    extending in -X and -Y (Face A is at +X side, Face B is at +Y side).
    For other supporter orientations we rotate around Z by 0, 90, 180, or 270.
    """
    col, row = cube_pos
    dx, dy = supporters_dir
    cx, cy = cube_xy_center(col, row)

    if dx > 0 and dy > 0:
        rotation = 0
        corner_x = cx + CUBE_OUTER / 2
        corner_y = cy + CUBE_OUTER / 2
    elif dx < 0 and dy > 0:
        rotation = 90
        corner_x = cx - CUBE_OUTER / 2
        corner_y = cy + CUBE_OUTER / 2
    elif dx < 0 and dy < 0:
        rotation = 180
        corner_x = cx - CUBE_OUTER / 2
        corner_y = cy - CUBE_OUTER / 2
    else:
        rotation = 270
        corner_x = cx + CUBE_OUTER / 2
        corner_y = cy - CUBE_OUTER / 2

    z_top_of_lower = cube_z_bottom(level_above)

    bracket = bracket_template.rotate((0, 0, 0), (0, 0, 1), rotation)
    return bracket.translate((corner_x, corner_y, z_top_of_lower))


def place_registration_pins(pin_template: cq.Workplane,
                            col: int, row: int, level: int) -> cq.Workplane:
    """Place 4 registration pins on top of cube at (col, row, level) at the
    cube's 4 corner peg-hole positions. Each pin is centred on the cube-cube
    boundary z = cube_top, so the pin spans z ∈ [cube_top - L/2, cube_top + L/2]
    with 2.7mm engaged in each adjacent cube's hole and 1.2mm spanning the
    flush-face recess pocket gap (2 x RECESS_DEPTH).
    """
    from generate_registration_pin_stl import PIN_LENGTH as REG_PIN_LEN

    cx, cy = cube_xy_center(col, row)
    z_cube_top = cube_z_bottom(level + 1)

    inset = CUBE_OUTER / 2 - 3.5
    corners = [(-inset, -inset), (inset, -inset), (inset, inset), (-inset, inset)]

    pins = None
    for dx, dy in corners:
        pin = pin_template.translate((cx + dx, cy + dy, z_cube_top - REG_PIN_LEN / 2))
        pins = pin if pins is None else pins.union(pin)
    return pins


def _collect_solids(workplane: cq.Workplane) -> list:
    """Extract solid shapes from a Workplane for compound assembly.

    Using a compound (rather than chained boolean unions) is essential for
    visualisation-scale assemblies: CadQuery's boolean union is O(N) per
    operation and chaining 100+ unions of complex geometry takes hours.
    A compound treats each body as a separate but co-located solid; STL
    viewers and slicers render them correctly.
    """
    val = workplane.val()
    if hasattr(val, "Solids"):
        solids = val.Solids()
        return list(solids) if solids else [val]
    return [val]


def main() -> None:
    print("Building full visualisation assembly using compound (fast)...")
    print()

    all_solids: list = []

    print("[1/6] Base disk + platforms + registration pins...")
    base = build_disk_with_platform_and_pins()
    all_solids.extend(_collect_solids(base))

    print("[2/6] Heart + arrow + white base fillet (vertical, faces -Y)...")
    heart_pierced, arrow, heart_fillet = build_heart_with_arrow_assembly()
    heart_x = 0.0
    heart_y = -NAMES_ARCH_RADIUS
    heart_z = DISK_THICK + HEART_HEIGHT * 0.55
    all_solids.extend(_collect_solids(heart_pierced.translate((heart_x, heart_y, heart_z))))
    all_solids.extend(_collect_solids(arrow.translate((heart_x, heart_y, heart_z))))
    all_solids.extend(_collect_solids(heart_fillet.translate((heart_x, heart_y, heart_z))))

    print("[3/6] 'Iluminada' + 'George' on outer front arc...")
    iluminada, george = _build_names_around_heart()
    all_solids.extend(_collect_solids(iluminada))
    all_solids.extend(_collect_solids(george))

    print("[4/6] '6 . 6 . 2026' on inner front arc...")
    date = build_arched_text_at(DATE_TEXT, DATE_ARCH_RADIUS,
                                arc_center_deg=270.0,
                                char_spacing_deg=DATE_CHAR_SPACING_DEG)
    all_solids.extend(_collect_solids(date))

    print("[5/6] Cubes (38 total across 4 levels)...")
    print("       Building cube template once...")
    cube_template = build_cube_assembly()

    cube_count = 0
    for level, positions in LEVELS.items():
        for col, row in sorted(positions):
            placed = place_cube(cube_template, col, row, level)
            all_solids.extend(_collect_solids(placed))
            cube_count += 1
    print(f"       Total cubes placed: {cube_count}")

    print("[6/6] L-brackets and registration pins...")
    print("       Building bracket and pin templates...")
    bracket_template = build_lbracket()
    pin_template = build_reg_pin()

    bracket_count = 0
    pin_count = 0
    for level in (1, 2, 3):
        upper_level = level + 1
        upper = LEVELS[upper_level]
        lower = LEVELS[level]

        for cube in sorted(upper):
            if cube in lower:
                pins = place_registration_pins(pin_template, cube[0], cube[1], level)
                all_solids.extend(_collect_solids(pins))
                pin_count += 4
            else:
                supporters = find_supporters(cube, lower)
                if supporters is None:
                    print(f"       WARNING: cube {cube} on L{upper_level} has no valid supporter pair on L{level}")
                    continue
                bracket = place_lbracket(bracket_template, cube, upper_level, supporters)
                all_solids.extend(_collect_solids(bracket))
                bracket_count += 1

    print(f"       L-brackets placed: {bracket_count}")
    print(f"       Registration pins placed: {pin_count}")
    print(f"       Total solid bodies in compound: {len(all_solids)}")

    print()
    print("Building compound and exporting STL...")
    compound = cq.Compound.makeCompound(all_solids)
    assembly = cq.Workplane("XY").add(compound)

    output_path = "full_assembly.stl"
    cq.exporters.export(
        assembly,
        output_path,
        exportType="STL",
        tolerance=0.15,
        angularTolerance=0.4,
    )

    bbox = compound.BoundingBox()
    print()
    print("=" * 60)
    print(f"Full assembly STL: {output_path}")
    print("=" * 60)
    print(f"Bounding box: x=[{bbox.xmin:.1f}, {bbox.xmax:.1f}]")
    print(f"              y=[{bbox.ymin:.1f}, {bbox.ymax:.1f}]")
    print(f"              z=[{bbox.zmin:.1f}, {bbox.zmax:.1f}]")
    print(f"Size:         {bbox.xlen:.1f} x {bbox.ylen:.1f} x {bbox.zlen:.1f} mm")
    print()
    print("Total height = base (13mm) + 4 cube levels (252mm) = ~265mm")
    print(f"Components: {cube_count} cubes, {bracket_count} L-brackets, "
          f"{pin_count} registration pins, plus base.")


if __name__ == "__main__":
    main()
