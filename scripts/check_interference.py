#!/usr/bin/env python3
"""
Verify L-bracket fits cleanly with cubes.

A correctly-placed bracket has its pins/pegs inside hole cavities (air), not
in solid cube material. So the intersection volume of bracket with cube
should be approximately ZERO. Any non-trivial intersection indicates pins
are poking into solid material where they shouldn't.
"""

import sys
import cadquery as cq

sys.path.insert(0, "scripts")
from generate_picture_cube_stl import build_full_assembly as build_cube_assembly
from generate_l_bracket_stl import build_bracket, CUBE_OUTER


def main() -> None:
    cube = build_cube_assembly()
    bracket = build_bracket()

    bracket_world = bracket.translate((CUBE_OUTER / 2, CUBE_OUTER / 2, CUBE_OUTER / 2))

    supporter_a = cube.translate((CUBE_OUTER, 0, 0))
    supporter_b = cube.translate((0, CUBE_OUTER, 0))
    cube_above  = cube.translate((0, 0, CUBE_OUTER))

    print("Interference check (bracket vs cubes): non-zero overlap = bracket")
    print("poking into solid cube material where it shouldn't.")
    print()
    print(f"  Cube volume (each):    {cube.val().Volume():.1f} mm^3")
    print(f"  Bracket volume:        {bracket_world.val().Volume():.1f} mm^3")
    print()

    vol_a = (bracket_world.intersect(supporter_a)).val().Volume()
    vol_b = (bracket_world.intersect(supporter_b)).val().Volume()
    vol_above = (bracket_world.intersect(cube_above)).val().Volume()

    print(f"  Bracket \u2229 Supporter A: {vol_a:.4f} mm^3")
    print(f"  Bracket \u2229 Supporter B: {vol_b:.4f} mm^3")
    print(f"  Bracket \u2229 Cube above:  {vol_above:.4f} mm^3")
    print()

    threshold = 1.0
    bad = vol_a >= threshold or vol_b >= threshold or vol_above >= threshold
    if not bad:
        print(f"\u2705 PASS: all intersections < {threshold} mm^3.")
        print(f"   Bracket pins/pegs sit in cube hole cavities as designed.")
    else:
        print(f"\u26a0  WARNING: significant intersection (\u2265 {threshold} mm^3).")
        if vol_a >= threshold:
            print(f"   Supporter A: {vol_a:.3f} mm^3 - check Face A pin positions")
        if vol_b >= threshold:
            print(f"   Supporter B: {vol_b:.3f} mm^3 - check Face B pin positions")
        if vol_above >= threshold:
            print(f"   Cube above:  {vol_above:.3f} mm^3 - check top peg positions")


if __name__ == "__main__":
    main()
