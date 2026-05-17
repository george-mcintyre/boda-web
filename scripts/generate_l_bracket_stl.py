#!/usr/bin/env python3
"""
Generate L-bracket STLs for the wedding photo cube structure.

The L-bracket is a horizontal flat L-shaped support that:
  - Sits in the gap between two supporter cubes at the corner where they meet
  - Locates itself via 4 horizontal side-pins plugged into corner peg holes on
    the supporters' side faces (2 pins each into Face A and Face B, top-corner
    holes only)
  - Supports an unsupported cube above via bearing contact on its top surface
  - Registers the cube above via 3 vertical top-pegs into the cube's bottom-face
    corner peg holes (the 3 corners closest to the L)

Canonical orientation (this script generates ONE bracket; assembly script can
rotate copies for the other 3 corner orientations):
  L's inside corner at local origin (0, 0, 0)
  Face A (with Face A's outward normal = +X) is at local x = 0
  Face B (with Face B's outward normal = +Y) is at local y = 0
  Bracket body extends in -X and -Y from origin
  Bracket top surface at z = 0; bracket bottom at z = -BODY_T
  Top pegs project to z = +PEG_TOP_LEN
  Side pins project at z = SIDE_PIN_Z (centered below top), in +X or +Y dir.

Output: l_bracket_canonical.stl
"""

import cadquery as cq

CUBE_OUTER       = 63.0
RECESS_DEPTH     = 0.6
PEG_HOLE_INSET   = 3.5
PEG_HOLE_DIAM    = 2.5
PEG_HOLE_DEPTH   = 3.0

ARM_WIDTH        = 5.5
ARM_LENGTH       = 63.0

PIN_DIAM         = 2.4
PIN_LEN          = 2.7

TOP_PEG_DIAM     = 2.4
TOP_PEG_LEN      = 2.7

SIDE_PIN_Z_OFFSET = -PEG_HOLE_INSET

CLEARANCE = 0.05

BODY_T = PEG_HOLE_INSET + PIN_DIAM / 2 + 0.5


def build_l_body() -> cq.Workplane:
    arm_a = (
        cq.Workplane("XY")
        .box(ARM_WIDTH, ARM_LENGTH, BODY_T, centered=False)
        .translate((-ARM_WIDTH, -ARM_LENGTH, -BODY_T))
    )
    arm_b = (
        cq.Workplane("XY")
        .box(ARM_LENGTH, ARM_WIDTH, BODY_T, centered=False)
        .translate((-ARM_LENGTH, -ARM_WIDTH, -BODY_T))
    )
    return arm_a.union(arm_b)


def _cylinder_at(diam: float, length: float, point: tuple[float, float, float],
                 direction: tuple[float, float, float]) -> cq.Workplane:
    return (
        cq.Workplane()
        .add(
            cq.Solid.makeCylinder(
                diam / 2,
                length,
                pnt=cq.Vector(*point),
                dir=cq.Vector(*direction),
            )
        )
    )


def build_top_peg(x: float, y: float) -> cq.Workplane:
    return _cylinder_at(TOP_PEG_DIAM, TOP_PEG_LEN, (x, y, 0), (0, 0, 1))


def build_bracket() -> cq.Workplane:
    bracket = build_l_body()

    pin_y_near = -PEG_HOLE_INSET
    pin_y_far  = -(CUBE_OUTER - PEG_HOLE_INSET)
    pin_x_near = -PEG_HOLE_INSET
    pin_x_far  = -(CUBE_OUTER - PEG_HOLE_INSET)

    bracket = bracket.union(_horizontal_pin_x(pin_y_near))
    bracket = bracket.union(_horizontal_pin_x(pin_y_far))
    bracket = bracket.union(_horizontal_pin_y(pin_x_near))
    bracket = bracket.union(_horizontal_pin_y(pin_x_far))

    top_peg_positions = [
        (-PEG_HOLE_INSET, -PEG_HOLE_INSET),
        (-PEG_HOLE_INSET, -(CUBE_OUTER - PEG_HOLE_INSET)),
        (-(CUBE_OUTER - PEG_HOLE_INSET), -PEG_HOLE_INSET),
    ]
    for px, py in top_peg_positions:
        bracket = bracket.union(build_top_peg(px, py))

    return bracket


def _horizontal_pin_x(y_pos: float) -> cq.Workplane:
    return _cylinder_at(
        PIN_DIAM,
        PIN_LEN + CLEARANCE,
        (-CLEARANCE, y_pos, SIDE_PIN_Z_OFFSET),
        (1, 0, 0),
    )


def _horizontal_pin_y(x_pos: float) -> cq.Workplane:
    return _cylinder_at(
        PIN_DIAM,
        PIN_LEN + CLEARANCE,
        (x_pos, -CLEARANCE, SIDE_PIN_Z_OFFSET),
        (0, 1, 0),
    )


def main() -> None:
    import sys, os
    sys.path.insert(0, os.path.dirname(__file__))
    from _3mf_writer import write_single_body_3mf

    print("Building L-bracket with CadQuery...")
    bracket = build_bracket()

    stl_path = "l_bracket_canonical.stl"
    cq.exporters.export(
        bracket,
        stl_path,
        exportType="STL",
        tolerance=0.01,
        angularTolerance=0.1,
    )

    threemf_path = "l_bracket_canonical.3mf"
    write_single_body_3mf(bracket, threemf_path, name="l_bracket")

    bbox = bracket.val().BoundingBox()
    print(f"\nFiles written: {stl_path} + {threemf_path}")
    print(f"Bounding box: x=[{bbox.xmin:.3f}, {bbox.xmax:.3f}] "
          f"y=[{bbox.ymin:.3f}, {bbox.ymax:.3f}] "
          f"z=[{bbox.zmin:.3f}, {bbox.zmax:.3f}]")
    print(f"Size:         {bbox.xlen:.3f} x {bbox.ylen:.3f} x {bbox.zlen:.3f} mm")
    print()
    print("Geometry parameters:")
    print(f"  Arm length:           {ARM_LENGTH} mm  (each arm)")
    print(f"  Arm width:            {ARM_WIDTH} mm")
    print(f"  Body thickness:       {BODY_T} mm")
    print(f"  Side pin diameter:    \u00d8{PIN_DIAM} mm")
    print(f"  Side pin length:      {PIN_LEN} mm  (engages \u00d8{PEG_HOLE_DIAM} hole, {PEG_HOLE_DEPTH} deep)")
    print(f"  Side pin clearance:   {PEG_HOLE_DIAM - PIN_DIAM} mm friction fit")
    print(f"  Side pins per arm:    2  (4 pins total)")
    print(f"  Top peg diameter:     \u00d8{TOP_PEG_DIAM} mm")
    print(f"  Top peg length:       {TOP_PEG_LEN} mm")
    print(f"  Top pegs:             3  (registers cube above at 3 of its 4 corner holes)")


if __name__ == "__main__":
    main()
