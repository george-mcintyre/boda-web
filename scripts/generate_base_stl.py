#!/usr/bin/env python3
"""
Generate the wedding photo cube base as a 4-colour 3MF assembly.

The base is a circular disk that mounts the entire 4-level cube structure.
It has a raised platform shaped to match Level 1's cube footprint, with 32
registration pins (4 per Level-1 cube) projecting up to engage the cubes'
bottom-face corner peg holes.

Around the structure position, two cursive text arches are extruded vertically
(letters stand upright, perpendicular to the disk plane):
  "Iluminada (heart) George"   above the structure
  "6 . 6 . 2026"               below the structure

The heart includes an arrow piercing it horizontally.

Output is a single 3MF file containing five named bodies for 4-colour
multi-material printing (3MF = 3D Manufacturing Format, the standard for
multi-colour jobs, supported by Orca/Bambu/PrusaSlicer and all online print
services):

  base.3mf
    body "disk"   -> WHITE  (disk + raised platform + 32 registration pins)
    body "names"  -> BLACK  ("Iluminada George" arched cursive text)
    body "date"   -> GOLD   ("6 . 6 . 2026" arched text)
    body "heart"  -> RED    (heart shape with arrow shaft cut through)
    body "arrow"  -> GOLD   (arrow piercing the heart - same gold as date)

Five companion STLs are also written (one per body) for verification and as
a fallback for printers that prefer separate STLs over 3MF.
"""

import math

import cadquery as cq

CUBE_OUTER         = 63.0
PEG_HOLE_INSET     = 3.5
PEG_DIAM           = 2.4
PEG_LENGTH         = 2.7

DISK_DIAM          = 420.0
DISK_THICK         = 5.0
PLATFORM_HEIGHT    = 8.0

LEVEL_1_POSITIONS  = [(0, 1), (0, 2), (0, 3),
                      (1, 0), (2, 0),
                      (3, 1), (3, 2), (3, 3)]

GRID_OFFSET        = -2 * CUBE_OUTER

TEXT_FONT          = "Brush Script MT"
TEXT_HEIGHT        = 16.0
TEXT_THICK         = 4.0
COLORED_BODY_SINK  = 0.2

NAMES_TEXT         = "Iluminada"
NAMES_TEXT_2       = "George"
DATE_TEXT          = "6 . 6 . 2026"

NAMES_ARCH_RADIUS  = 188.0
DATE_ARCH_RADIUS   = 145.0
NAMES_CHAR_SPACING_DEG = 4.0
DATE_CHAR_SPACING_DEG  = 6.0
NAMES_GAP_FOR_HEART_DEG = 18.0

WALL_HEIGHT       = 1.5
WALL_THICK        = 1.5
WALL_RADIAL_OFFSET = 2.0
WALL_ANGULAR_PAD_DEG = 3.0

DESCENDER_DEPRESSION_DEPTH = 3.0
DESCENDER_DEPRESSION_FOOTPRINT_RADIUS = 8.0
DESCENDER_LETTERS_IN_GEORGE = [4]
DESCENDER_LETTERS_IN_ILUMINADA: list[int] = []
DESCENDER_LETTERS_IN_DATE: list[int] = []

TITTLE_LETTERS_IN_ILUMINADA = [4]
TITTLE_LETTERS_IN_GEORGE: list[int] = []
TITTLE_LETTERS_IN_DATE: list[int] = []
TITTLE_STEM_Z_BOTTOM       = 5.0
TITTLE_STEM_Z_TOP          = 16.0
TITTLE_STEM_ANGULAR_HALFWIDTH_DEG = 0.23

SEAM_PIN_TANGENT_W   = 4.0
SEAM_PIN_RADIAL_L    = 6.0
SEAM_PIN_HEIGHT      = 3.0
SEAM_SLOT_CLEARANCE  = 0.2
SEAM_PIN_RADII       = [40.0, 90.0, 145.0, 195.0]

HEART_HEIGHT       = 18.0
HEART_THICK        = 4.0
HEART_BASE_FILLET_WIDTH  = 8.0
HEART_BASE_FILLET_HEIGHT = 1.5
ARROW_SHAFT_LEN    = 28.0
ARROW_SHAFT_DIAM   = 1.8
ARROW_HEAD_LEN     = 4.0
ARROW_TAIL_LEN     = 4.0
ARROW_INPLANE_TILT_DEG = 45.0
ARROW_PIERCE_DEG       = 37.0
ARROW_TAIL_LIFT_ABOVE_DISK = 1.5


def cube_grid_to_world(col: int, row: int) -> tuple[float, float]:
    cx = GRID_OFFSET + (col + 0.5) * CUBE_OUTER
    cy = GRID_OFFSET + (row + 0.5) * CUBE_OUTER
    return (cx, cy)


def build_disk_with_platform_and_pins() -> cq.Workplane:
    disk = (
        cq.Workplane("XY")
        .circle(DISK_DIAM / 2)
        .extrude(DISK_THICK)
    )

    platform_z_top = DISK_THICK + PLATFORM_HEIGHT
    overlap_eps = 0.05
    for col, row in LEVEL_1_POSITIONS:
        cx, cy = cube_grid_to_world(col, row)
        cube_pad = (
            cq.Workplane("XY")
            .center(cx, cy)
            .rect(CUBE_OUTER + overlap_eps, CUBE_OUTER + overlap_eps)
            .extrude(PLATFORM_HEIGHT)
            .translate((0, 0, DISK_THICK))
        )
        disk = disk.union(cube_pad)

    half = CUBE_OUTER / 2
    inset_from_center = half - PEG_HOLE_INSET
    pin_offsets = [
        (-inset_from_center, -inset_from_center),
        ( inset_from_center, -inset_from_center),
        ( inset_from_center,  inset_from_center),
        (-inset_from_center,  inset_from_center),
    ]

    for col, row in LEVEL_1_POSITIONS:
        cx, cy = cube_grid_to_world(col, row)
        for dx, dy in pin_offsets:
            px, py = cx + dx, cy + dy
            on_diagonal_seam = abs(abs(px) - abs(py)) < 0.1
            if on_diagonal_seam:
                continue
            pin = (
                cq.Workplane()
                .add(cq.Solid.makeCylinder(
                    PEG_DIAM / 2,
                    PEG_LENGTH,
                    pnt=cq.Vector(px, py, platform_z_top),
                    dir=cq.Vector(0, 0, 1),
                ))
            )
            disk = disk.union(pin)

    wall_radius_offset_outer = WALL_RADIAL_OFFSET + WALL_THICK / 2

    iluminada_center_deg, iluminada_span_deg = _iluminada_arc_extent_deg()
    iluminada_wall = build_arc_wall(
        NAMES_ARCH_RADIUS + wall_radius_offset_outer,
        arc_center_deg=iluminada_center_deg,
        angular_span_deg=iluminada_span_deg + 2 * WALL_ANGULAR_PAD_DEG,
        height=WALL_HEIGHT, thickness=WALL_THICK,
    )
    george_center_deg, george_span_deg = _george_arc_extent_deg()
    george_wall = build_arc_wall(
        NAMES_ARCH_RADIUS + wall_radius_offset_outer,
        arc_center_deg=george_center_deg,
        angular_span_deg=george_span_deg + 2 * WALL_ANGULAR_PAD_DEG,
        height=WALL_HEIGHT, thickness=WALL_THICK,
    )
    date_center_deg, date_span_deg = _date_arc_extent_deg()
    date_wall = build_arc_wall(
        DATE_ARCH_RADIUS + wall_radius_offset_outer,
        arc_center_deg=date_center_deg,
        angular_span_deg=date_span_deg + 2 * WALL_ANGULAR_PAD_DEG,
        height=WALL_HEIGHT, thickness=WALL_THICK,
    )
    for cutter in _build_descender_depression_cutters_for_names():
        disk = disk.cut(cutter)
    for cutter in _build_descender_depression_cutters_for_date():
        disk = disk.cut(cutter)

    disk = disk.union(iluminada_wall).union(george_wall).union(date_wall)

    for stem in _build_tittle_stems_for_names():
        disk = disk.union(stem)

    return disk


def _letter_angle_deg(arc_center_deg: float, char_spacing_deg: float,
                      n_chars: int, letter_index: int) -> float:
    arc_half = (n_chars - 1) * char_spacing_deg / 2
    return arc_center_deg - arc_half + letter_index * char_spacing_deg


def _build_tittle_stem(arch_radius: float, angular_center_deg: float) -> cq.Workplane:
    """Build a thin vertical pillar from the disk top up past a cursive 'i'
    letter's tittle, providing the bridge that holds the dot in place.

    The stem spans Z=[TITTLE_STEM_Z_BOTTOM, TITTLE_STEM_Z_TOP]. The bottom
    MUST be at or below the wall top so the stem fuses into the disk/wall
    via the union operation \u2014 otherwise CadQuery produces two disjoint
    solids and the 3MF tessellator (which only meshes the main connected
    solid) silently drops the stem from the output. The STL exporter
    sometimes still meshes both, but only when boolean union order works
    out a certain way, so behaviour was nondeterministic.

    Cross-section: thin angular wedge centred on the letter's angular
    position. Radial position MATCHES the text-backing wall exactly: same
    thickness (WALL_THICK) and same radial centre, so the stem sits flush
    along the wall and aligns with the existing white wall material.
    """
    outer_r = arch_radius
    inner_r = arch_radius - WALL_THICK
    half_span = TITTLE_STEM_ANGULAR_HALFWIDTH_DEG

    start_deg = angular_center_deg - half_span
    end_deg = angular_center_deg + half_span
    start_rad = math.radians(start_deg)
    end_rad = math.radians(end_deg)
    mid_rad = math.radians(angular_center_deg)

    p_in_a = (inner_r * math.cos(start_rad), inner_r * math.sin(start_rad))
    p_out_a = (outer_r * math.cos(start_rad), outer_r * math.sin(start_rad))
    p_out_mid = (outer_r * math.cos(mid_rad), outer_r * math.sin(mid_rad))
    p_out_b = (outer_r * math.cos(end_rad), outer_r * math.sin(end_rad))
    p_in_b = (inner_r * math.cos(end_rad), inner_r * math.sin(end_rad))
    p_in_mid = (inner_r * math.cos(mid_rad), inner_r * math.sin(mid_rad))

    profile = (
        cq.Workplane("XY")
        .moveTo(*p_in_a)
        .lineTo(*p_out_a)
        .threePointArc(p_out_mid, p_out_b)
        .lineTo(*p_in_b)
        .threePointArc(p_in_mid, p_in_a)
        .close()
    )
    stem_height = TITTLE_STEM_Z_TOP - TITTLE_STEM_Z_BOTTOM
    return profile.extrude(stem_height).translate(
        (0, 0, TITTLE_STEM_Z_BOTTOM)
    )


def _build_tittle_stems_for_names() -> list[cq.Workplane]:
    stems = []
    wall_outer_radius = NAMES_ARCH_RADIUS + WALL_RADIAL_OFFSET + WALL_THICK / 2

    iluminada_centre_deg = (
        270.0 - NAMES_GAP_FOR_HEART_DEG / 2
        - (len(NAMES_TEXT) - 1) * NAMES_CHAR_SPACING_DEG / 2
    )
    for i in TITTLE_LETTERS_IN_ILUMINADA:
        angle = _letter_angle_deg(iluminada_centre_deg, NAMES_CHAR_SPACING_DEG,
                                  len(NAMES_TEXT), i)
        stems.append(_build_tittle_stem(
            arch_radius=wall_outer_radius,
            angular_center_deg=angle,
        ))

    george_centre_deg = (
        270.0 + NAMES_GAP_FOR_HEART_DEG / 2
        + (len(NAMES_TEXT_2) - 1) * NAMES_CHAR_SPACING_DEG / 2
    )
    for i in TITTLE_LETTERS_IN_GEORGE:
        angle = _letter_angle_deg(george_centre_deg, NAMES_CHAR_SPACING_DEG,
                                  len(NAMES_TEXT_2), i)
        stems.append(_build_tittle_stem(
            arch_radius=wall_outer_radius,
            angular_center_deg=angle,
        ))

    return stems


def _build_descender_depression_cutters_for_names() -> list[cq.Workplane]:
    cutters = []

    iluminada_centre_deg = (
        270.0 - NAMES_GAP_FOR_HEART_DEG / 2
        - (len(NAMES_TEXT) - 1) * NAMES_CHAR_SPACING_DEG / 2
    )
    for i in DESCENDER_LETTERS_IN_ILUMINADA:
        angle = _letter_angle_deg(iluminada_centre_deg, NAMES_CHAR_SPACING_DEG,
                                  len(NAMES_TEXT), i)
        cutters.append(build_descender_depression_cutter(
            arch_radius=NAMES_ARCH_RADIUS + WALL_RADIAL_OFFSET,
            angular_center_deg=angle,
            depth=DESCENDER_DEPRESSION_DEPTH,
            footprint_radius=DESCENDER_DEPRESSION_FOOTPRINT_RADIUS,
        ))

    george_centre_deg = (
        270.0 + NAMES_GAP_FOR_HEART_DEG / 2
        + (len(NAMES_TEXT_2) - 1) * NAMES_CHAR_SPACING_DEG / 2
    )
    for i in DESCENDER_LETTERS_IN_GEORGE:
        angle = _letter_angle_deg(george_centre_deg, NAMES_CHAR_SPACING_DEG,
                                  len(NAMES_TEXT_2), i)
        cutters.append(build_descender_depression_cutter(
            arch_radius=NAMES_ARCH_RADIUS + WALL_RADIAL_OFFSET,
            angular_center_deg=angle,
            depth=DESCENDER_DEPRESSION_DEPTH,
            footprint_radius=DESCENDER_DEPRESSION_FOOTPRINT_RADIUS,
        ))

    return cutters


def _build_descender_depression_cutters_for_date() -> list[cq.Workplane]:
    cutters = []
    for i in DESCENDER_LETTERS_IN_DATE:
        angle = _letter_angle_deg(270.0, DATE_CHAR_SPACING_DEG,
                                  len(DATE_TEXT), i)
        cutters.append(build_descender_depression_cutter(
            arch_radius=DATE_ARCH_RADIUS + WALL_RADIAL_OFFSET,
            angular_center_deg=angle,
            depth=DESCENDER_DEPRESSION_DEPTH,
            footprint_radius=DESCENDER_DEPRESSION_FOOTPRINT_RADIUS,
        ))
    return cutters


def build_descender_depression_cutter(
    arch_radius: float,
    angular_center_deg: float,
    depth: float,
    footprint_radius: float,
) -> cq.Workplane:
    """A spherical cutter that, subtracted from the disk, leaves a perfectly
    smooth bowl-shaped depression centred on the given angular position.

    The sphere is sized and positioned so that:
      - the bowl is `depth` mm deep at its centre
      - the bowl meets the disk top (z=DISK_THICK) along a circle of radius
        `footprint_radius` mm around the centre point

    Geometry: for sphere of radius R centred at z = DISK_THICK + h_above,
    the sphere bottom sits at z = DISK_THICK + h_above - R. For depth=`depth`:
    h_above - R = -depth, so R = h_above + depth.
    The horizontal intersection circle at z=DISK_THICK has radius
    sqrt(R^2 - h_above^2). Solving for both constraints:
        R = (depth^2 + footprint_radius^2) / (2 * depth)
        h_above = R - depth
    """
    R = (depth * depth + footprint_radius * footprint_radius) / (2 * depth)
    h_above = R - depth

    a = math.radians(angular_center_deg)
    cx = arch_radius * math.cos(a)
    cy = arch_radius * math.sin(a)
    cz_center = DISK_THICK + h_above

    return (
        cq.Workplane("XY")
        .sphere(R)
        .translate((cx, cy, cz_center))
    )





def build_arc_wall(arch_radius: float, arc_center_deg: float,
                   angular_span_deg: float, height: float,
                   thickness: float) -> cq.Workplane:
    """Build a curved annular wall segment that sits behind a row of arched
    text, providing structural support so that fragile cursive letters bond
    to a strong substrate instead of the disk along narrow points.

    The wall extends from BELOW the disk top by DESCENDER_DEPRESSION_DEPTH
    (so its bottom is hidden inside the solid disk material everywhere
    except where descender depressions carve the disk top \u2014 there the
    wall's lower portion fills the depression, keeping the wall continuously
    grounded in the dipped surface). Wall top is at DISK_THICK + height.
    """
    inner_r = arch_radius - thickness
    outer_r = arch_radius
    half_span = angular_span_deg / 2

    start_deg = arc_center_deg - half_span
    end_deg   = arc_center_deg + half_span
    start_rad = math.radians(start_deg)
    end_rad   = math.radians(end_deg)

    p_inner_start = (inner_r * math.cos(start_rad), inner_r * math.sin(start_rad))
    p_outer_start = (outer_r * math.cos(start_rad), outer_r * math.sin(start_rad))
    p_inner_end   = (inner_r * math.cos(end_rad),   inner_r * math.sin(end_rad))
    p_outer_end   = (outer_r * math.cos(end_rad),   outer_r * math.sin(end_rad))

    p_outer_mid_rad = math.radians(arc_center_deg)
    p_outer_mid = (outer_r * math.cos(p_outer_mid_rad), outer_r * math.sin(p_outer_mid_rad))
    p_inner_mid = (inner_r * math.cos(p_outer_mid_rad), inner_r * math.sin(p_outer_mid_rad))

    profile = (
        cq.Workplane("XY")
        .moveTo(*p_inner_start)
        .lineTo(*p_outer_start)
        .threePointArc(p_outer_mid, p_outer_end)
        .lineTo(*p_inner_end)
        .threePointArc(p_inner_mid, p_inner_start)
        .close()
    )

    extended_height = height + DESCENDER_DEPRESSION_DEPTH
    return profile.extrude(extended_height).translate(
        (0, 0, DISK_THICK - DESCENDER_DEPRESSION_DEPTH)
    )


def build_arched_text_at(text: str, arch_radius: float,
                         arc_center_deg: float, char_spacing_deg: float,
                         start_offset_deg: float = 0.0) -> cq.Workplane:
    """Place each character of `text` upright on a vertical workplane, arranged
    along an arc of given radius around the disk centre.

    arc_center_deg is the angular direction of the arc's centre in standard
    math convention (0=+X, 90=+Y, 180=-X, 270=-Y). For text in front of the
    structure, pass arc_center_deg=270; the readable face of each character
    naturally points in the radial OUTWARD direction (away from origin), so
    a viewer outside the disk looking toward origin reads the text correctly.

    Implementation: each character is drawn on its own custom Plane whose
    normal points radially outward from origin and whose local "up" is +Z.
    This is the natural workplane for the character's readable face, so no
    post-rotation or mirroring is needed; characters appear correctly oriented
    by construction.
    """
    n_chars = len(text)
    total_arc_deg = (n_chars - 1) * char_spacing_deg
    start_deg = arc_center_deg - total_arc_deg / 2 + start_offset_deg

    result = None
    for i, ch in enumerate(text):
        if ch == " ":
            continue
        angle_deg = start_deg + i * char_spacing_deg
        angle_rad = math.radians(angle_deg)

        radial_outward = cq.Vector(math.cos(angle_rad), math.sin(angle_rad), 0)
        local_x = cq.Vector(-math.sin(angle_rad), math.cos(angle_rad), 0)
        origin_point = cq.Vector(
            arch_radius * math.cos(angle_rad),
            arch_radius * math.sin(angle_rad),
            DISK_THICK - COLORED_BODY_SINK,
        )

        plane = cq.Plane(origin=origin_point, xDir=local_x, normal=radial_outward)
        char_solid = (
            cq.Workplane(plane)
            .text(
                ch,
                fontsize=TEXT_HEIGHT,
                distance=TEXT_THICK,
                font=TEXT_FONT,
                halign="center",
                valign="bottom",
            )
        )

        result = char_solid if result is None else result.union(char_solid)

    return result


def build_heart_with_arrow_assembly() -> tuple[cq.Workplane, cq.Workplane, cq.Workplane]:
    """Build a vertically-standing heart pierced by a 45-degree arrow.

    Returns three separately-coloured bodies:
      - heart_pierced: the red heart shape with arrow shaft cut through
      - arrow:         the gold arrow solid
      - base_fillet:   a small white triangular support at the heart's base,
                       same colour as the disk and text-backing walls. The
                       fillet is anatomically the heart's base reinforcement
                       but is exported as part of the white body so it
                       visually blends with the disk surface and supports
                       the heart without breaking the heart's red silhouette.

    The shaft cutter is applied to the heart and to the fillet so that any
    fillet material in the arrow's path is also removed (the arrow passes
    through the heart cleanly).
    """
    h = HEART_HEIGHT
    lobe_r = h * 0.28
    lobe_z = h * 0.18
    lobe_x = h * 0.25
    bottom_z = -h * 0.55

    lobe_left = (
        cq.Workplane("XZ")
        .center(-lobe_x, lobe_z)
        .circle(lobe_r)
        .extrude(-HEART_THICK)
    )
    lobe_right = (
        cq.Workplane("XZ")
        .center(lobe_x, lobe_z)
        .circle(lobe_r)
        .extrude(-HEART_THICK)
    )

    triangle_top_left  = (-lobe_x - lobe_r * 0.95, lobe_z - lobe_r * 0.30)
    triangle_top_right = ( lobe_x + lobe_r * 0.95, lobe_z - lobe_r * 0.30)
    triangle_bottom    = (0.0, bottom_z)

    triangle = (
        cq.Workplane("XZ")
        .moveTo(*triangle_top_left)
        .lineTo(*triangle_top_right)
        .lineTo(*triangle_bottom)
        .close()
        .extrude(-HEART_THICK)
    )

    heart = lobe_left.union(lobe_right).union(triangle)

    fillet_half_w = HEART_BASE_FILLET_WIDTH / 2
    fillet_top_z = bottom_z + HEART_BASE_FILLET_HEIGHT
    base_fillet = (
        cq.Workplane("XZ")
        .moveTo(-fillet_half_w, bottom_z)
        .lineTo( fillet_half_w, bottom_z)
        .lineTo(0.0, fillet_top_z)
        .close()
        .extrude(-HEART_THICK)
    )

    overlap = 0.1

    shaft = (
        cq.Workplane()
        .add(cq.Solid.makeCylinder(
            ARROW_SHAFT_DIAM / 2,
            ARROW_SHAFT_LEN,
            pnt=cq.Vector(-ARROW_SHAFT_LEN / 2, 0, 0),
            dir=cq.Vector(1, 0, 0),
        ))
    )
    head = (
        cq.Workplane()
        .add(cq.Solid.makeCone(
            ARROW_SHAFT_DIAM / 2 * 1.6,
            0.0,
            ARROW_HEAD_LEN,
            pnt=cq.Vector(ARROW_SHAFT_LEN / 2 - overlap, 0, 0),
            dir=cq.Vector(1, 0, 0),
        ))
    )
    tail = (
        cq.Workplane("YZ")
        .rect(ARROW_SHAFT_DIAM * 1.4, ARROW_SHAFT_DIAM * 1.4)
        .extrude(ARROW_TAIL_LEN + overlap)
        .translate((-ARROW_SHAFT_LEN / 2 - ARROW_TAIL_LEN, 0, 0))
    )
    arrow = shaft.union(head).union(tail)

    shaft_cutter = (
        cq.Workplane()
        .add(cq.Solid.makeCylinder(
            ARROW_SHAFT_DIAM / 2 + 0.1,
            ARROW_SHAFT_LEN + 4,
            pnt=cq.Vector(-ARROW_SHAFT_LEN / 2 - 2, 0, 0),
            dir=cq.Vector(1, 0, 0),
        ))
    )

    arrow = arrow.rotate((0, 0, 0), (0, 1, 0), -ARROW_INPLANE_TILT_DEG)
    arrow = arrow.rotate((0, 0, 0), (1, 0, 0), -ARROW_PIERCE_DEG)
    shaft_cutter = shaft_cutter.rotate((0, 0, 0), (0, 1, 0), -ARROW_INPLANE_TILT_DEG)
    shaft_cutter = shaft_cutter.rotate((0, 0, 0), (1, 0, 0), -ARROW_PIERCE_DEG)

    arrow = arrow.translate((0, HEART_THICK / 2, lobe_z))
    shaft_cutter = shaft_cutter.translate((0, HEART_THICK / 2, lobe_z))

    heart_pierced = heart.cut(shaft_cutter)
    base_fillet = base_fillet.cut(shaft_cutter)

    return heart_pierced, arrow, base_fillet


COLOR_WHITE = (255, 255, 255, 255)
COLOR_BLACK = (20, 20, 20, 255)
COLOR_GOLD  = (212, 175, 55, 255)
COLOR_RED   = (200, 30, 40, 255)


def _strip_zero_volume_components(stl_path: str, min_volume_mm3: float = 0.01) -> None:
    """Remove disconnected components with volume below threshold from an STL.

    CadQuery boolean operations occasionally leave tiny degenerate slivers in
    the output mesh. These are harmless visually but break watertightness
    checks and can confuse slicers. Strip them by keeping only components
    above the volume threshold.
    """
    import trimesh
    m = trimesh.load(stl_path)
    parts = m.split(only_watertight=False)
    keep = [p for p in parts if abs(p.volume) >= min_volume_mm3]
    if len(keep) == len(parts):
        return
    cleaned = trimesh.util.concatenate(keep) if len(keep) > 1 else keep[0]
    cleaned.export(stl_path)


def write_combined_3mf(bodies: list[tuple[str, cq.Workplane, tuple[int, int, int, int]]],
                       out_path: str) -> None:
    import sys, os
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from _3mf_writer import write_multi_body_3mf
    write_multi_body_3mf(bodies, out_path)


def _build_names_around_heart() -> tuple[cq.Workplane, cq.Workplane]:
    """Lay out 'Iluminada' (left) and 'George' (right) on the outer front arc,
    with an angular gap between them where the heart sits.

    Arc is centred on -Y direction (in front of the structure, viewer's front).
    With the viewer looking at the front face (looking in +Y direction), -X is
    viewer's left and +X is viewer's right; so 'Iluminada' (read first) is on
    the -X side and 'George' (read second) is on the +X side.
    """
    front_deg = 270.0

    iluminada_arc_half = (len(NAMES_TEXT) - 1) * NAMES_CHAR_SPACING_DEG / 2
    george_arc_half    = (len(NAMES_TEXT_2) - 1) * NAMES_CHAR_SPACING_DEG / 2

    iluminada_centre_deg = front_deg - NAMES_GAP_FOR_HEART_DEG / 2 - iluminada_arc_half
    george_centre_deg    = front_deg + NAMES_GAP_FOR_HEART_DEG / 2 + george_arc_half

    iluminada = build_arched_text_at(
        NAMES_TEXT, NAMES_ARCH_RADIUS,
        arc_center_deg=iluminada_centre_deg,
        char_spacing_deg=NAMES_CHAR_SPACING_DEG,
    )
    george = build_arched_text_at(
        NAMES_TEXT_2, NAMES_ARCH_RADIUS,
        arc_center_deg=george_centre_deg,
        char_spacing_deg=NAMES_CHAR_SPACING_DEG,
    )
    return iluminada, george


def _iluminada_arc_extent_deg() -> tuple[float, float]:
    """Return (center_deg, span_deg) for 'Iluminada' alone on the names arc.
    Wall behind 'Iluminada' is sized from this so it ends where the name ends,
    leaving the heart gap clear.
    """
    front_deg = 270.0
    iluminada_arc_half = (len(NAMES_TEXT) - 1) * NAMES_CHAR_SPACING_DEG / 2
    iluminada_centre_deg = front_deg - NAMES_GAP_FOR_HEART_DEG / 2 - iluminada_arc_half
    return iluminada_centre_deg, 2 * iluminada_arc_half


def _george_arc_extent_deg() -> tuple[float, float]:
    """Return (center_deg, span_deg) for 'George' alone on the names arc."""
    front_deg = 270.0
    george_arc_half = (len(NAMES_TEXT_2) - 1) * NAMES_CHAR_SPACING_DEG / 2
    george_centre_deg = front_deg + NAMES_GAP_FOR_HEART_DEG / 2 + george_arc_half
    return george_centre_deg, 2 * george_arc_half


def _date_arc_extent_deg() -> tuple[float, float]:
    return 270.0, (len(DATE_TEXT) - 1) * DATE_CHAR_SPACING_DEG


def build_quarter_cutter(arc_center_deg: float, angular_span_deg: float = 90.0,
                         radius: float = 250.0, z_min: float = -5.0,
                         z_max: float = 50.0) -> cq.Workplane:
    """A pie-slice-shaped solid covering one quarter of the disk volume.

    Spans `angular_span_deg` centred on `arc_center_deg`, extending from
    origin out to `radius` (well beyond the disk edge) through the full
    Z range. Used as the base cutter for a quarter; teeth are added/removed
    on top of this base shape by `apply_castellated_teeth`.
    """
    import math
    half = angular_span_deg / 2
    a0 = math.radians(arc_center_deg - half)
    a1 = math.radians(arc_center_deg + half)
    a_mid = math.radians(arc_center_deg)

    p0 = (0.0, 0.0)
    p1 = (radius * math.cos(a0), radius * math.sin(a0))
    p_mid = (radius * math.cos(a_mid), radius * math.sin(a_mid))
    p2 = (radius * math.cos(a1), radius * math.sin(a1))

    height = z_max - z_min
    profile = (
        cq.Workplane("XY")
        .moveTo(*p0)
        .lineTo(*p1)
        .threePointArc(p_mid, p2)
        .close()
    )
    return profile.extrude(height).translate((0, 0, z_min))


def _seam_pin_or_slot_centres(seam_angle_deg: float,
                              pin_owner_quarter_centre_deg: float
                              ) -> list[tuple[float, float, tuple[float, float]]]:
    """Return the world-coord centres and perpendicular-direction unit
    vectors for the pins/slots along a seam.

    For each radius r in SEAM_PIN_RADII, compute:
      (x, y): centre of the pin block at radius r along the seam
      (px, py): unit perpendicular vector pointing from the seam INTO the
                pin-owner quarter's territory (so a pin extends in the
                OPPOSITE direction, into the neighbour quarter)

    All primitives are then built around these centres entirely on
    cq.Workplane("XY") with explicit world-axis dimensions, then translated
    to position. This avoids CadQuery workplane-normal-direction ambiguity.
    """
    import math
    seam_rad = math.radians(seam_angle_deg)
    radial_unit = (math.cos(seam_rad), math.sin(seam_rad))

    diff = ((pin_owner_quarter_centre_deg - seam_angle_deg + 180.0) % 360.0) - 180.0
    perp_sign = 1.0 if diff > 0 else -1.0
    perp_owner_dir = (-math.sin(seam_rad) * perp_sign, math.cos(seam_rad) * perp_sign)

    results = []
    for r in SEAM_PIN_RADII:
        if r > DISK_DIAM / 2 - SEAM_PIN_RADIAL_L:
            continue
        x = r * radial_unit[0]
        y = r * radial_unit[1]
        results.append((x, y, perp_owner_dir))
    return results


def _build_seam_pin_block(centre_x: float, centre_y: float,
                          perp_into_owner: tuple[float, float],
                          seam_angle_deg: float,
                          width: float, length: float, height: float
                          ) -> cq.Workplane:
    """Build a single pin/slot block centred at the seam at (centre_x, centre_y)
    and projecting away from the pin-owner quarter (toward the neighbour) by
    `length`. `width` is tangential to the seam, `height` is in Z.

    For pins: pass SEAM_PIN_TANGENT_W and SEAM_PIN_RADIAL_L.
    For slot cutters: pass SEAM_PIN_TANGENT_W + 2*SEAM_SLOT_CLEARANCE,
    SEAM_PIN_RADIAL_L + SEAM_SLOT_CLEARANCE, and a slightly increased height.

    The block extends from the seam line OUTWARD into the neighbour quarter
    (opposite to perp_into_owner direction). It also extends from the seam
    line INWARD into the owner quarter by a small "anchor" depth, so the
    pin fuses with the owner quarter's disk material as a single solid.
    """
    import math
    perp_into_neighbour = (-perp_into_owner[0], -perp_into_owner[1])

    anchor_depth = 1.0
    block_centre_offset = (length / 2) - (anchor_depth / 2)

    cx = centre_x + perp_into_neighbour[0] * block_centre_offset
    cy = centre_y + perp_into_neighbour[1] * block_centre_offset

    half_w = width / 2
    half_l = (length + anchor_depth) / 2

    seam_rad = math.radians(seam_angle_deg)
    seam_along = (math.cos(seam_rad), math.sin(seam_rad))

    p1 = (-half_l * perp_into_neighbour[0] + -half_w * seam_along[0],
          -half_l * perp_into_neighbour[1] + -half_w * seam_along[1])
    p2 = ( half_l * perp_into_neighbour[0] + -half_w * seam_along[0],
           half_l * perp_into_neighbour[1] + -half_w * seam_along[1])
    p3 = ( half_l * perp_into_neighbour[0] +  half_w * seam_along[0],
           half_l * perp_into_neighbour[1] +  half_w * seam_along[1])
    p4 = (-half_l * perp_into_neighbour[0] +  half_w * seam_along[0],
          -half_l * perp_into_neighbour[1] +  half_w * seam_along[1])

    profile = (
        cq.Workplane("XY")
        .moveTo(*p1)
        .lineTo(*p2)
        .lineTo(*p3)
        .lineTo(*p4)
        .close()
    )
    block = profile.extrude(height).translate((cx, cy, 0))
    return block


def _build_seam_pins(seam_angle_deg: float,
                     pin_owner_quarter_centre_deg: float
                     ) -> list[cq.Workplane]:
    centres = _seam_pin_or_slot_centres(seam_angle_deg, pin_owner_quarter_centre_deg)
    pins = []
    for cx, cy, perp in centres:
        pin = _build_seam_pin_block(
            cx, cy, perp, seam_angle_deg,
            width=SEAM_PIN_TANGENT_W,
            length=SEAM_PIN_RADIAL_L,
            height=SEAM_PIN_HEIGHT,
        )
        pins.append(pin)
    return pins


def _build_seam_slot_cutters(seam_angle_deg: float,
                             slot_owner_quarter_centre_deg: float
                             ) -> list[cq.Workplane]:
    """Build the slot cutters that get subtracted from the slot owner's
    disk material. The slot is in the slot owner's territory (on the slot
    owner's side of the seam), extending inward from the seam wall.

    Note: callers MUST pass the slot owner's centre. Internally we flip the
    perpendicular direction so the cutter block extends INTO the slot owner
    (not into the pin source). This is opposite to _build_seam_pins which
    extends into the neighbour.
    """
    centres = _seam_pin_or_slot_centres(seam_angle_deg, slot_owner_quarter_centre_deg)
    cutters = []
    for cx, cy, perp_into_slot_owner in centres:
        perp_into_neighbour_from_slot_owner_perspective = (
            -perp_into_slot_owner[0], -perp_into_slot_owner[1]
        )
        cutter = _build_seam_pin_block(
            cx, cy, perp_into_neighbour_from_slot_owner_perspective, seam_angle_deg,
            width=SEAM_PIN_TANGENT_W + 2 * SEAM_SLOT_CLEARANCE,
            length=SEAM_PIN_RADIAL_L + SEAM_SLOT_CLEARANCE,
            height=SEAM_PIN_HEIGHT + SEAM_SLOT_CLEARANCE,
        )
        cutters.append(cutter)
    return cutters


def section_disk_into_quarters(bodies: list) -> dict:
    """Cut each body into 4 quarters along 45-degree diagonal seams, with
    horizontal pin-and-slot joints at each seam.

    The 4 quarters are positioned at front/right/back/left. Each seam has
    one quarter contributing PINS (rectangular blocks projecting from its
    seam-wall horizontally) and the other quarter contributing SLOTS
    (matching rectangular cutouts in its seam-wall). All pins and slots
    sit at z=0..SEAM_PIN_HEIGHT (flush with the bed) so they print without
    any horizontal overhangs.

    Pin/slot convention (all 4 quarters identical, rotated 90 deg):
      - Each quarter has pins on its CW seam edge
      - Each quarter has slots on its CCW seam edge
      - CW/CCW are from each quarter's centre going around the disk

    Assembly sequence (user-verified):
      1. Two adjacent quarters slide together (pin enters slot)
      2. Other two adjacent quarters slide together (pin enters slot)
      3. The two halves slide together along the appropriate axis

    Returns dict keyed by quarter name, each value a list of
    (body_name, body_piece, color) for that quarter.
    """
    quarter_centers = {
        "front": 270.0,
        "right":   0.0,
        "back":   90.0,
        "left":  180.0,
    }
    cw_seam_of = {
        "front": 225.0,
        "right": 315.0,
        "back":   45.0,
        "left":  135.0,
    }
    ccw_seam_of = {
        "front": 315.0,
        "right":  45.0,
        "back":  135.0,
        "left":  225.0,
    }

    quarter_bodies: dict = {q: [] for q in quarter_centers}

    for q_name, center_deg in quarter_centers.items():
        cutter = build_quarter_cutter(center_deg)
        for body_name, body, rgba in bodies:
            piece = body.intersect(cutter)
            if piece.val() is None or piece.val().Volume() < 0.1:
                continue
            quarter_bodies[q_name].append((body_name, piece, rgba))

    for q_name, q_centre_deg in quarter_centers.items():
        new_disk = None
        for body_name, body, rgba in quarter_bodies[q_name]:
            if body_name == "disk_white":
                new_disk = body
                break
        if new_disk is None:
            continue

        cw_seam_angle = cw_seam_of[q_name]
        for pin in _build_seam_pins(cw_seam_angle, q_centre_deg):
            new_disk = new_disk.union(pin)

        ccw_seam_angle = ccw_seam_of[q_name]
        for cutter in _build_seam_slot_cutters(ccw_seam_angle, q_centre_deg):
            new_disk = new_disk.cut(cutter)

        quarter_bodies[q_name] = [
            (n, (new_disk if n == "disk_white" else b), c)
            for n, b, c in quarter_bodies[q_name]
        ]

    return quarter_bodies


def main() -> None:
    print("Building wedding cube base with CadQuery...")
    print()

    print("[1/5] Disk + platform + pins + text-backing walls (white)...")
    disk = build_disk_with_platform_and_pins()
    bb = disk.val().BoundingBox()
    print(f"   bounding: {bb.xlen:.1f} x {bb.ylen:.1f} x {bb.zlen:.1f} mm")

    print("[2/5] 'Iluminada' + 'George' on outer front arc (black)...")
    iluminada, george = _build_names_around_heart()
    names = iluminada.union(george)
    bb = names.val().BoundingBox()
    print(f"   bounding: {bb.xlen:.1f} x {bb.ylen:.1f} x {bb.zlen:.1f} mm")

    print("[3/5] '6 . 6 . 2026' on inner front arc (gold)...")
    date = build_arched_text_at(DATE_TEXT, DATE_ARCH_RADIUS,
                                arc_center_deg=270.0,
                                char_spacing_deg=DATE_CHAR_SPACING_DEG)
    bb = date.val().BoundingBox()
    print(f"   bounding: {bb.xlen:.1f} x {bb.ylen:.1f} x {bb.zlen:.1f} mm")

    print("[4/5] Heart with arrow hole (red), standing vertical (faces -Y)...")
    print("[5/5] Arrow piercing heart (gold) + white base fillet...")
    heart_pierced, arrow, heart_fillet = build_heart_with_arrow_assembly()

    heart_arc_radius = NAMES_ARCH_RADIUS
    heart_x = 0.0
    heart_y = -heart_arc_radius
    heart_z = DISK_THICK + HEART_HEIGHT * 0.55

    heart_pierced = heart_pierced.translate((heart_x, heart_y, heart_z))
    arrow = arrow.translate((heart_x, heart_y, heart_z))
    heart_fillet = heart_fillet.translate((heart_x, heart_y, heart_z - COLORED_BODY_SINK))
    bb = heart_pierced.val().BoundingBox()
    print(f"   heart bounding: {bb.xlen:.1f} x {bb.ylen:.1f} x {bb.zlen:.1f} mm")
    bb = arrow.val().BoundingBox()
    print(f"   arrow bounding: {bb.xlen:.1f} x {bb.ylen:.1f} x {bb.zlen:.1f} mm")

    disk = disk.union(heart_fillet)

    bodies = [
        ("disk_white",  disk,           COLOR_WHITE),
        ("names_black", names,          COLOR_BLACK),
        ("date_gold",   date,           COLOR_GOLD),
        ("heart_red",   heart_pierced,  COLOR_RED),
        ("arrow_gold",  arrow,          COLOR_GOLD),
    ]

    print()
    print("Writing FULL (un-sectioned) base files for visualisation...")
    for name, wp, _rgba in bodies:
        path = f"base_{name}.stl"
        cq.exporters.export(wp, path, exportType="STL",
                            tolerance=0.05, angularTolerance=0.2)
        _strip_zero_volume_components(path)
        print(f"   {path}")
    write_combined_3mf(bodies, "base.3mf")
    print(f"   base.3mf")

    print()
    print("Sectioning disk into 4 quarters (each fits AD5X 220x220mm build plate)...")
    quarters = section_disk_into_quarters(bodies)

    quarter_print_rotations = {
        "front":  -45.0,
        "right":  -135.0,
        "back":   135.0,
        "left":   45.0,
    }

    for q_name, q_bodies in quarters.items():
        if not q_bodies:
            print(f"   [{q_name}] empty, skipping")
            continue
        rot_deg = quarter_print_rotations[q_name]
        rotated_bodies = [
            (n, b.rotate((0, 0, 0), (0, 0, 1), rot_deg), c) for (n, b, c) in q_bodies
        ]
        for body_name, wp, _rgba in rotated_bodies:
            stl_path = f"quarter_{q_name}_{body_name}.stl"
            cq.exporters.export(wp, stl_path, exportType="STL",
                                tolerance=0.05, angularTolerance=0.2)
            _strip_zero_volume_components(stl_path)
        out_3mf = f"quarter_{q_name}.3mf"
        write_combined_3mf(rotated_bodies, out_3mf)
        all_x: list[float] = []
        all_y: list[float] = []
        all_z: list[float] = []
        for _, b, _ in rotated_bodies:
            ob = b.val().BoundingBox()
            all_x.extend([ob.xmin, ob.xmax])
            all_y.extend([ob.ymin, ob.ymax])
            all_z.extend([ob.zmin, ob.zmax])
        combined_w = max(all_x) - min(all_x)
        combined_d = max(all_y) - min(all_y)
        combined_h = max(all_z) - min(all_z)
        fits = "FITS AD5X" if combined_w <= 220 and combined_d <= 220 else "TOO BIG FOR AD5X"
        print(f"   [{q_name}] {len(rotated_bodies)} bodies, "
              f"bounding {combined_w:.1f}x{combined_d:.1f}x{combined_h:.1f}mm  -- {fits}")
        print(f"     -> {out_3mf} (multi-colour) + {len(rotated_bodies)} STL files")

    print()
    print("=" * 60)
    print("Files to print on AD5X (220x220mm build plate):")
    print("  quarter_front.3mf  - Multi-colour: white + black + gold + red")
    print("                       (disk + Iluminada + date + heart + arrow)")
    print("  quarter_right.3mf  - White only (just disk material)")
    print("  quarter_back.3mf   - White only")
    print("  quarter_left.3mf   - White only")
    print("=" * 60)
    print()
    print("Each quarter is already rotated 45 degrees in the STL/3MF, so")
    print("the seam edges align with the build plate's X/Y axes.")
    print()
    print("Assembly:")
    print(f"  Each seam has {len(SEAM_PIN_RADII)} horizontal pins ({SEAM_PIN_TANGENT_W}x{SEAM_PIN_HEIGHT}mm cross-section,")
    print(f"  projecting {SEAM_PIN_RADIAL_L}mm) on one quarter, mating with matching slots")
    print(f"  on the adjacent quarter ({SEAM_SLOT_CLEARANCE}mm clearance for slide fit).")
    print()
    print("  1. Slide together one adjacent pair (e.g. front + right) along the")
    print("     direction perpendicular to their shared seam. Pins enter slots.")
    print("  2. Slide together the other pair (back + left) the same way.")
    print("  3. Slide the two halves together along the appropriate axis to engage")
    print("     the remaining two pin/slot pairs simultaneously.")
    print("  4. Apply glue at the seams before the final slide to lock in place.")


if __name__ == "__main__":
    main()
