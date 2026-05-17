#!/usr/bin/env python3
"""
Generate registration_pin.stl for the wedding photo cube structure.

A standalone cylindrical pin used to register one cube directly stacked on
another. Insert one end into a corner peg hole on the top face of the lower
cube, and slide the upper cube down so its bottom-face corner hole engages
the other end. Glue in place once positioned.

Geometry:
  Diameter      : 2.4 mm   (matches L-bracket pins; 0.1 mm friction fit in
                            the cube's 2.5 mm holes)
  Total length  : 6.6 mm   (2.7 mm in each cube hole + 1.2 mm spanning the
                            two 0.6 mm recess pockets between flush cube faces)
  End chamfer   : 0.2 mm at 45 deg on each end for self-alignment

Output: registration_pin.stl (binary STL).
"""

import cadquery as cq

PIN_DIAM      = 2.4
PIN_LENGTH    = 6.6
END_CHAMFER   = 0.2


def build_pin() -> cq.Workplane:
    pin = (
        cq.Workplane("XY")
        .circle(PIN_DIAM / 2)
        .extrude(PIN_LENGTH)
    )
    pin = pin.faces(">Z").chamfer(END_CHAMFER)
    pin = pin.faces("<Z").chamfer(END_CHAMFER)
    return pin


def main() -> None:
    import sys, os
    sys.path.insert(0, os.path.dirname(__file__))
    from _3mf_writer import write_single_body_3mf

    print("Building registration pin with CadQuery...")
    pin = build_pin()

    stl_path = "registration_pin.stl"
    cq.exporters.export(
        pin,
        stl_path,
        exportType="STL",
        tolerance=0.005,
        angularTolerance=0.05,
    )

    threemf_path = "registration_pin.3mf"
    write_single_body_3mf(pin, threemf_path, name="registration_pin")

    bbox = pin.val().BoundingBox()
    print(f"\nFiles written: {stl_path} + {threemf_path}")
    print(f"Bounding box: x=[{bbox.xmin:.3f}, {bbox.xmax:.3f}] "
          f"y=[{bbox.ymin:.3f}, {bbox.ymax:.3f}] "
          f"z=[{bbox.zmin:.3f}, {bbox.zmax:.3f}]")
    print(f"Size:         {bbox.xlen:.3f} x {bbox.ylen:.3f} x {bbox.zlen:.3f} mm")
    print()
    print("Geometry parameters:")
    print(f"  Diameter:      \u00d8{PIN_DIAM} mm  (\u00d82.5 mm hole = {2.5 - PIN_DIAM:.1f} mm friction clearance)")
    print(f"  Total length:  {PIN_LENGTH} mm")
    print(f"    2.7 mm into each cube hole")
    print(f"    1.2 mm spanning the recess pockets between flush cube faces")
    print(f"  End chamfer:   {END_CHAMFER} mm at 45 deg (both ends)")
    print()
    print("Use: glue one end into a top-face corner hole, slide upper cube down")
    print("     onto the protruding end so its bottom-face hole engages the pin.")


if __name__ == "__main__":
    main()
