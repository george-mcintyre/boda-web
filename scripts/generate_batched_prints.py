#!/usr/bin/env python3
"""
Generate batched print files for the wedding cube structure: multiple parts
arranged in grids on a single build plate to print together in one job.

Outputs:
  - cubes_9x.{stl,3mf}     - 9 picture cubes in a 3x3 grid (38 needed, 5 batches)
  - l_brackets_10x.{stl,3mf} - 10 L-brackets in a single batch
  - registration_pins_80x.{stl,3mf} - 80 registration pins in a single batch

Each batched 3MF contains the parts as separate named bodies so the slicer
treats them as independent objects (so individual parts can be repositioned
in the slicer if needed). The grid spacing leaves 5mm between adjacent
parts to prevent first-layer bleeding.

All batches fit the Flashforge AD5X build plate (220x220mm).
"""

import math
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

import cadquery as cq

from generate_picture_cube_stl import build_full_assembly as build_cube
from generate_l_bracket_stl import build_bracket as build_l_bracket
from generate_registration_pin_stl import build_pin as build_pin
from _3mf_writer import write_multi_body_3mf


CUBE_OUTER = 63.0
BUILD_PLATE = 220.0


def grid_positions(n_x: int, n_y: int, part_size_x: float, part_size_y: float,
                   gap: float) -> list[tuple[float, float]]:
    """Return (x, y) translation offsets to lay out n_x*n_y copies of a part
    in a grid centred on origin. `part_size_x/y` is the part's bounding-box
    extent; `gap` is the spacing between adjacent parts.
    """
    pitch_x = part_size_x + gap
    pitch_y = part_size_y + gap
    total_x = (n_x - 1) * pitch_x
    total_y = (n_y - 1) * pitch_y
    positions = []
    for i in range(n_x):
        for j in range(n_y):
            x = i * pitch_x - total_x / 2
            y = j * pitch_y - total_y / 2
            positions.append((x, y))
    return positions


def batch_part(part: cq.Workplane, name_prefix: str,
               n_x: int, n_y: int,
               part_size_x: float, part_size_y: float,
               gap: float) -> list[tuple[str, cq.Workplane, tuple[int, int, int, int]]]:
    """Replicate a part in an n_x by n_y grid; return list of named bodies
    suitable for write_multi_body_3mf. All instances assigned a single neutral
    colour (white) since these single-material parts don't need per-instance
    differentiation.
    """
    color = (240, 240, 240, 255)
    bodies = []
    for idx, (x, y) in enumerate(grid_positions(n_x, n_y, part_size_x, part_size_y, gap)):
        instance = part.translate((x, y, 0))
        bodies.append((f"{name_prefix}_{idx + 1:02d}", instance, color))
    return bodies


def export_batch(bodies, out_basename: str) -> None:
    """Export a batched list of bodies as both STL (concatenated) and 3MF
    (each body separate). Print a summary of the batch's bounding box and
    fitness for the AD5X build plate.
    """
    combined = bodies[0][1]
    for _, b, _ in bodies[1:]:
        combined = combined.union(b)

    stl_path = f"{out_basename}.stl"
    cq.exporters.export(
        combined, stl_path,
        exportType="STL",
        tolerance=0.05, angularTolerance=0.2,
    )

    threemf_path = f"{out_basename}.3mf"
    write_multi_body_3mf(bodies, threemf_path)

    bbox = combined.val().BoundingBox()
    fits = "FITS AD5X" if bbox.xlen <= BUILD_PLATE and bbox.ylen <= BUILD_PLATE else "TOO BIG"
    print(f"  {stl_path} + {threemf_path}")
    print(f"    Bounding: {bbox.xlen:.1f} x {bbox.ylen:.1f} x {bbox.zlen:.1f} mm  -- {fits}")
    print(f"    Bodies in 3MF: {len(bodies)}")


def main() -> None:
    print("Generating batched print files...")
    print()

    print("[1/3] 9 cubes in 3x3 grid (5mm gap)...")
    cube = build_cube()
    cube_bodies = batch_part(
        cube, name_prefix="cube",
        n_x=3, n_y=3,
        part_size_x=CUBE_OUTER, part_size_y=CUBE_OUTER,
        gap=5.0,
    )
    export_batch(cube_bodies, "cubes_9x")
    print()

    print("[2/3] 9 L-brackets in 3x3 grid (5mm gap, +1 separate print needed)...")
    bracket = build_l_bracket()
    bracket_bbox = bracket.val().BoundingBox()
    bracket_size_x = max(bracket_bbox.xlen, bracket_bbox.ylen)
    bracket_size_y = bracket_size_x
    bracket_bodies = batch_part(
        bracket, name_prefix="l_bracket",
        n_x=3, n_y=3,
        part_size_x=bracket_size_x, part_size_y=bracket_size_y,
        gap=5.0,
    )
    export_batch(bracket_bodies, "l_brackets_9x")
    print()

    print("[3/3] 80 registration pins in 10x8 grid (3mm gap)...")
    pin = build_pin()
    pin_bbox = pin.val().BoundingBox()
    pin_size = max(pin_bbox.xlen, pin_bbox.ylen)
    pin_bodies = batch_part(
        pin, name_prefix="pin",
        n_x=10, n_y=8,
        part_size_x=pin_size, part_size_y=pin_size,
        gap=3.0,
    )
    export_batch(pin_bodies, "registration_pins_80x")
    print()

    print("=" * 60)
    print("Batched print files generated.")
    print("=" * 60)
    print()
    print("Print plan for the full structure (38 cubes, 10 brackets, 80 pins):")
    print("  Cubes:    cubes_9x.3mf      x 5 prints (45 total, ~7 spare)")
    print("            ~5h per batch on AD5X, PLA HD, 0.2mm layers")
    print("  Brackets: l_brackets_9x.3mf x 1 print (~2h)")
    print("            + l_bracket_canonical.3mf x 1 print for the 10th (~30min)")
    print("  Pins:     registration_pins_80x.3mf x 1 print (~30min)")
    print()
    print("Compared to single-part prints, batching saves ~5-8 hours total")
    print("from print-startup overhead reductions.")


if __name__ == "__main__":
    main()
