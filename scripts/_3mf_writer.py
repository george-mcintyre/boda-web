"""Shared helper to write 3MF files from CadQuery Workplanes and raw meshes.

Used by the cube, bracket, pin and base generators to emit 3MF in addition
to STL. For single-body parts, the 3MF just wraps the geometry; for
multi-body assemblies (the base disk and the AI-derived figurines), each
body gets its own colour via the 3MF Material Group extension.

Two input shapes are supported:

- CadQuery ``Workplane`` objects (used by the parametric generators) - see
  ``write_single_body_3mf`` and ``write_multi_body_3mf``.
- Raw ``trimesh.Trimesh`` objects (used by the figurine post-processing
  pipeline, which works with AI-generated meshes that never enter CadQuery)
  - see ``write_multi_body_3mf_from_trimesh``.
"""

import cadquery as cq
import lib3mf
import trimesh


def cq_to_trimesh(workplane: cq.Workplane, tolerance: float = 0.05,
                  angular_tolerance: float = 0.2) -> trimesh.Trimesh:
    """Tessellate a CadQuery shape and return a deduplicated trimesh.

    CadQuery's shape.tessellate() runs tessellation on each face independently
    and outputs duplicated vertices at every shared edge - producing a "soup
    of triangles" where adjacent triangles do not share vertex indices even
    though they share geometric edges. This confuses some slicers (Orca-
    Flashforge in particular) into producing malformed slice output that
    looks like holes/features are at the wrong positions.

    We merge duplicate vertices here so the output mesh has proper edge
    topology with shared indices, matching what cq.exporters.export() does
    internally for STL output.
    """
    shape = workplane.val()
    vertices, triangles = shape.tessellate(tolerance, angular_tolerance)
    verts = [(v.x, v.y, v.z) for v in vertices]
    mesh = trimesh.Trimesh(vertices=verts, faces=triangles, process=False)
    mesh.merge_vertices()
    mesh.update_faces(mesh.nondegenerate_faces())
    return mesh


def write_single_body_3mf(workplane: cq.Workplane, out_path: str,
                          name: str = "body") -> None:
    """Export a single CadQuery body as a 3MF file with no colour assignments."""
    wrapper = lib3mf.Wrapper()
    model = wrapper.CreateModel()

    tm = cq_to_trimesh(workplane)
    mesh_object = model.AddMeshObject()
    mesh_object.SetName(name)

    positions = [lib3mf.Position((float(v[0]), float(v[1]), float(v[2])))
                 for v in tm.vertices]
    triangles = [lib3mf.Triangle((int(f[0]), int(f[1]), int(f[2])))
                 for f in tm.faces]
    mesh_object.SetGeometry(positions, triangles)

    identity = wrapper.GetIdentityTransform()
    model.AddBuildItem(mesh_object, identity)

    writer = model.QueryWriter("3mf")
    writer.WriteToFile(out_path)


def write_multi_body_3mf(bodies: list[tuple[str, cq.Workplane, tuple[int, int, int, int]]],
                         out_path: str) -> None:
    """Export multiple CadQuery bodies as a multi-colour 3MF file.

    `bodies` is a list of (name, workplane, RGBA-color-tuple) entries. Each
    body becomes a separate mesh object in the 3MF, and is assigned a base
    material whose displaycolor is the given RGBA. Slicers that support
    multi-material 3MF (Bambu Studio, Orca, PrusaSlicer) will recognise the
    bodies and offer per-body filament assignment. Flash Studio loads the
    geometry but ignores the colour metadata (assign filaments manually).
    """
    wrapper = lib3mf.Wrapper()
    model = wrapper.CreateModel()

    material_group = model.AddBaseMaterialGroup()
    material_indices: dict[tuple, int] = {}

    for name, _wp, rgba in bodies:
        if rgba not in material_indices:
            r, g, b, a = rgba
            color = wrapper.RGBAToColor(r, g, b, a)
            mat_id = material_group.AddMaterial(name, color)
            material_indices[rgba] = mat_id

    for name, wp, rgba in bodies:
        tm = cq_to_trimesh(wp)
        mesh_object = model.AddMeshObject()
        mesh_object.SetName(name)

        positions = [lib3mf.Position((float(v[0]), float(v[1]), float(v[2])))
                     for v in tm.vertices]
        triangles = [lib3mf.Triangle((int(f[0]), int(f[1]), int(f[2])))
                     for f in tm.faces]
        mesh_object.SetGeometry(positions, triangles)

        mesh_object.SetObjectLevelProperty(
            material_group.GetResourceID(),
            material_indices[rgba],
        )

        identity = wrapper.GetIdentityTransform()
        model.AddBuildItem(mesh_object, identity)

    writer = model.QueryWriter("3mf")
    writer.WriteToFile(out_path)


def write_multi_body_3mf_from_trimesh(
    bodies: list[tuple[str, trimesh.Trimesh, tuple[int, int, int, int]]],
    out_path: str,
) -> None:
    wrapper = lib3mf.Wrapper()
    model = wrapper.CreateModel()

    material_group = model.AddBaseMaterialGroup()
    material_indices: dict[tuple, int] = {}

    for name, _mesh, rgba in bodies:
        if rgba not in material_indices:
            r, g, b, a = rgba
            color = wrapper.RGBAToColor(r, g, b, a)
            mat_id = material_group.AddMaterial(name, color)
            material_indices[rgba] = mat_id

    for name, mesh, rgba in bodies:
        if len(mesh.vertices) == 0 or len(mesh.faces) == 0:
            continue
        mesh_object = model.AddMeshObject()
        mesh_object.SetName(name)

        positions = [lib3mf.Position((float(v[0]), float(v[1]), float(v[2])))
                     for v in mesh.vertices]
        triangles = [lib3mf.Triangle((int(f[0]), int(f[1]), int(f[2])))
                     for f in mesh.faces]
        mesh_object.SetGeometry(positions, triangles)

        mesh_object.SetObjectLevelProperty(
            material_group.GetResourceID(),
            material_indices[rgba],
        )

        identity = wrapper.GetIdentityTransform()
        model.AddBuildItem(mesh_object, identity)

    writer = model.QueryWriter("3mf")
    writer.WriteToFile(out_path)
