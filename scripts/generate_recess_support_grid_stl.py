#!/usr/bin/env python3
"""
Generate recess_support_grid.stl - a 4x4 grid of small support pads to be
loaded into Orca-Flashforge alongside a picture cube as a Support Enforcer.

When the cube prints face-down on the bed, its bottom face's recess opens
downward, leaving a 60x60mm x 0.6mm void between the recess floor (above)
and the build plate (below). The slicer cannot bridge 60mm of PLA cleanly,
but it CAN bridge ~15mm easily. This grid provides 16 small pads inside
that void as support pillars, breaking the 60mm void into ~15mm bridges
that the slicer can handle without sagging.

Workflow in Orca-Flashforge:
  1. Load picture_cube.stl onto the build plate (auto-positions on bed)
  2. Load recess_support_grid.stl as a separate file
  3. Right-click the grid object → "Change type" → "Support Enforcer"
  4. Centre the grid on the cube in X-Y (drag in slicer or set position to
     match the cube's centre exactly; the grid's bottom is already at z=0
     to sit on the build plate)
  5. Slice. The slicer auto-generates support material wherever the
     enforcer overlaps an unsupported region (= the recess floor underside).

This avoids:
  - Hand-painting 16 support spots per cube (tedious for 38 cubes)
  - Full auto-support that puts material near the peg holes (impossible to remove)
  - 60mm-bridge sag across the entire recess floor (the original problem)

Geometry:
  Pad layout    : 4x4 grid, 16 pads total
  Pad size      : 4 x 4 mm square footprint
  Pad height    : 0.55 mm (just under RECESS_DEPTH = 0.6 mm)
  Pad positions : at (-22.5, -7.5, +7.5, +22.5) in both X and Y (cube-centred coords)
  Bridge spans  : max 11 mm between pad edges, max 5.5 mm pad-to-recess-wall
  Centred on    : cube X-Y centre; aligned with the recess (cube and recess
                  are both centred on the same origin)
  Z position    : pad bottoms at z = 0 (sits on build plate)

Output: recess_support_grid.stl (binary STL).
"""

import cadquery as cq

PAD_SIZE     = 4.0
PAD_HEIGHT   = 0.55
PAD_POSITIONS = (-22.5, -7.5, 7.5, 22.5)


def build_support_grid() -> cq.Workplane:
    grid = None
    for x in PAD_POSITIONS:
        for y in PAD_POSITIONS:
            pad = (
                cq.Workplane("XY")
                .box(PAD_SIZE, PAD_SIZE, PAD_HEIGHT, centered=(True, True, False))
                .translate((x, y, 0))
            )
            grid = pad if grid is None else grid.union(pad)
    return grid


def main() -> None:
    import sys, os
    sys.path.insert(0, os.path.dirname(__file__))
    from _3mf_writer import write_single_body_3mf

    print("Building 4x4 support enforcer grid with CadQuery...")
    grid = build_support_grid()

    stl_path = "recess_support_grid.stl"
    cq.exporters.export(
        grid,
        stl_path,
        exportType="STL",
        tolerance=0.005,
        angularTolerance=0.05,
    )

    threemf_path = "recess_support_grid.3mf"
    write_single_body_3mf(grid, threemf_path, name="recess_support_grid")

    bbox = grid.val().BoundingBox()
    print(f"\nFiles written: {stl_path} + {threemf_path}")
    print(f"Bounding box: x=[{bbox.xmin:.2f}, {bbox.xmax:.2f}] "
          f"y=[{bbox.ymin:.2f}, {bbox.ymax:.2f}] "
          f"z=[{bbox.zmin:.2f}, {bbox.zmax:.2f}]")
    print(f"Size:         {bbox.xlen:.2f} x {bbox.ylen:.2f} x {bbox.zlen:.2f} mm")
    print()
    print("Geometry parameters:")
    print(f"  Pad size:        {PAD_SIZE} x {PAD_SIZE} mm")
    print(f"  Pad height:      {PAD_HEIGHT} mm")
    print(f"  Number of pads:  {len(PAD_POSITIONS) ** 2}  ({len(PAD_POSITIONS)}x{len(PAD_POSITIONS)} grid)")
    print(f"  Pad XY centres:  {PAD_POSITIONS} (mm from cube centre)")
    print(f"  Pad bottoms at:  z = 0 (sits on build plate)")
    print()
    print("Max bridge span (pad-to-pad): 11.0 mm")
    print("Max bridge span (pad-to-recess-wall): 5.5 mm")
    print()
    print("Usage in Orca-Flashforge:")
    print("  1. Load picture_cube.stl onto build plate")
    print("  2. Load recess_support_grid.stl alongside")
    print("  3. Right-click grid object -> 'Change type' -> 'Support Enforcer'")
    print("  4. Align grid centre to cube centre in X-Y (slicer should do this auto)")
    print("  5. Slice as normal (auto-support enabled, threshold overlap 90%)")


if __name__ == "__main__":
    main()
