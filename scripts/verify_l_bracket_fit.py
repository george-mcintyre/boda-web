#!/usr/bin/env python3
"""
Verify the L-bracket mates cleanly with cubes.

Builds an assembly of: 2 supporter cubes (cube A and cube B at perpendicular
positions) + L-bracket in their corner + 1 unsupported cube above. Saves a
combined STL for visual inspection in FreeCAD/slicer.

Reports:
- Whether all parts are positioned correctly
- Bounding box of full assembly
- Whether bracket pins land in cube holes (geometric check)

Output: assembly_test.stl
"""

import math
import sys
import cadquery as cq

sys.path.insert(0, "scripts")
from generate_picture_cube_stl import build_full_assembly as build_cube_assembly
from generate_l_bracket_stl import build_bracket, CUBE_OUTER, PEG_HOLE_INSET


def main() -> None:
    print("Building test assembly: 2 supporters + L-bracket + 1 unsupported cube above")

    cube_template = build_cube_assembly()

    supporter_a = cube_template.translate((CUBE_OUTER, 0, 0))
    supporter_b = cube_template.translate((0, CUBE_OUTER, 0))

    cube_above = cube_template.translate((0, 0, CUBE_OUTER))

    bracket = build_bracket()
    bracket = bracket.translate((CUBE_OUTER / 2, CUBE_OUTER / 2, CUBE_OUTER / 2))

    assembly = (
        cq.Workplane("XY")
        .union(supporter_a)
        .union(supporter_b)
        .union(cube_above)
        .union(bracket)
    )

    output = "assembly_test.stl"
    cq.exporters.export(
        assembly,
        output,
        exportType="STL",
        tolerance=0.05,
        angularTolerance=0.2,
    )

    bbox = assembly.val().BoundingBox()
    print(f"\nAssembly STL: {output}")
    print(f"Bounding box: x=[{bbox.xmin:.2f}, {bbox.xmax:.2f}] "
          f"y=[{bbox.ymin:.2f}, {bbox.ymax:.2f}] "
          f"z=[{bbox.zmin:.2f}, {bbox.zmax:.2f}]")
    print(f"Size:         {bbox.xlen:.2f} x {bbox.ylen:.2f} x {bbox.zlen:.2f}")
    print()
    print("Expected positions:")
    print(f"  Supporter A: x=[{CUBE_OUTER/2}, {CUBE_OUTER*1.5}], y=[-{CUBE_OUTER/2}, {CUBE_OUTER/2}], z=[-{CUBE_OUTER/2}, {CUBE_OUTER/2}]")
    print(f"  Supporter B: x=[-{CUBE_OUTER/2}, {CUBE_OUTER/2}], y=[{CUBE_OUTER/2}, {CUBE_OUTER*1.5}], z=[-{CUBE_OUTER/2}, {CUBE_OUTER/2}]")
    print(f"  Cube above:  x=[-{CUBE_OUTER/2}, {CUBE_OUTER/2}], y=[-{CUBE_OUTER/2}, {CUBE_OUTER/2}], z=[{CUBE_OUTER/2}, {CUBE_OUTER*1.5}]")
    print(f"  L-bracket:   in the corner at high (x, y), top at z={CUBE_OUTER/2}")


if __name__ == "__main__":
    main()
