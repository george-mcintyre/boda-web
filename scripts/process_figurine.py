#!/usr/bin/env python3
"""
Post-process an AI-generated GLB figurine (e.g. from Meshy.ai) into a
print-ready STL, a multi-body colour-segmented 3MF for slicing, a
decimated GLB sized for the web viewer, and a PNG thumbnail.

Pipeline:
  1. Load the GLB and flatten its scene to a single textured trimesh.
  2. Inspect: vertex count, watertight status, has-texture flag, bbox.
  3. Repair: fix winding, merge duplicate vertices, fill small holes.
  4. Orient upright (Y-up GLB convention -> Z-up for printing) and rest
     the figure's lowest point on Z = 0.
  5. Scale uniformly so the Z-extent matches the requested height.
  6. Sample a colour per face from the GLB texture / vertex colours.
  7. K-means cluster the face colours into N regions.
  8. Split the mesh into one trimesh per cluster.
  9. Export single-body STL and multi-body coloured 3MF.
 10. Export a decimated web-ready GLB (Y-up, original colours preserved).
 11. Render a PNG thumbnail for the gift-registry card.

Run:
    python3 scripts/process_figurine.py path/to/figure.glb --name george

Options:
    --name              Output basename (default: derived from input file).
    --height            Target Z-extent in mm (default: 80).
    --colors            Number of colour clusters / 3MF bodies (default: 4).
    --out-dir           Output directory (default: ./models).
    --web-faces         Target face count for the web GLB (default: 30000).
    --thumb-size        Thumbnail edge in pixels (default: 512).
    --no-web-glb        Skip web-GLB export.
    --no-thumbnail      Skip thumbnail render.
    --dry-run           Inspect only; print analysis and exit without writing.
    --no-segment        Skip colour segmentation; emit a single-body 3MF.
    --keep-up-axis      Skip the GLB Y-up to Z-up rotation (use if the source
                        mesh is already Z-up).
"""

from __future__ import annotations

import argparse
import os
import sys
from dataclasses import dataclass

import numpy as np
import trimesh
from PIL import Image
from sklearn.cluster import KMeans

sys.path.insert(0, os.path.dirname(__file__))
from _3mf_writer import write_multi_body_3mf_from_trimesh  # noqa: E402


@dataclass
class FigurineStats:
    vertex_count: int
    face_count: int
    is_watertight: bool
    bbox_min: np.ndarray
    bbox_max: np.ndarray
    has_texture: bool
    has_vertex_colors: bool

    def extents(self) -> np.ndarray:
        return self.bbox_max - self.bbox_min

    def __str__(self) -> str:
        ex = self.extents()
        return (
            f"  vertices       : {self.vertex_count}\n"
            f"  faces          : {self.face_count}\n"
            f"  watertight     : {self.is_watertight}\n"
            f"  texture        : {self.has_texture}\n"
            f"  vertex colours : {self.has_vertex_colors}\n"
            f"  bbox min       : [{self.bbox_min[0]:.2f}, {self.bbox_min[1]:.2f}, {self.bbox_min[2]:.2f}]\n"
            f"  bbox max       : [{self.bbox_max[0]:.2f}, {self.bbox_max[1]:.2f}, {self.bbox_max[2]:.2f}]\n"
            f"  size (x,y,z)   : [{ex[0]:.2f}, {ex[1]:.2f}, {ex[2]:.2f}]"
        )


def load_glb_as_mesh(path: str) -> trimesh.Trimesh:
    loaded = trimesh.load(path, force=None, process=False)
    if isinstance(loaded, trimesh.Trimesh):
        return loaded
    if isinstance(loaded, trimesh.Scene):
        if len(loaded.geometry) == 0:
            raise ValueError(f"GLB has no geometry: {path}")
        if len(loaded.geometry) == 1:
            return list(loaded.geometry.values())[0]
        meshes = list(loaded.geometry.values())
        combined = trimesh.util.concatenate(meshes)
        if not isinstance(combined, trimesh.Trimesh):
            raise ValueError(
                f"Failed to flatten scene to a single mesh ({len(meshes)} parts)"
            )
        return combined
    raise ValueError(f"Unsupported GLB content type: {type(loaded).__name__}")


def inspect_mesh(mesh: trimesh.Trimesh) -> FigurineStats:
    has_texture = (
        mesh.visual is not None
        and hasattr(mesh.visual, "material")
        and getattr(mesh.visual.material, "baseColorTexture", None) is not None
    )
    has_vertex_colors = (
        mesh.visual is not None
        and hasattr(mesh.visual, "vertex_colors")
        and mesh.visual.vertex_colors is not None
        and len(mesh.visual.vertex_colors) == len(mesh.vertices)
    )
    return FigurineStats(
        vertex_count=len(mesh.vertices),
        face_count=len(mesh.faces),
        is_watertight=bool(mesh.is_watertight),
        bbox_min=mesh.bounds[0].copy(),
        bbox_max=mesh.bounds[1].copy(),
        has_texture=has_texture,
        has_vertex_colors=has_vertex_colors,
    )


def repair_mesh(mesh: trimesh.Trimesh) -> trimesh.Trimesh:
    mesh = mesh.copy()
    mesh.merge_vertices()
    mesh.update_faces(mesh.unique_faces())
    mesh.update_faces(mesh.nondegenerate_faces())
    mesh.remove_unreferenced_vertices()
    trimesh.repair.fix_winding(mesh)
    trimesh.repair.fix_inversion(mesh)
    trimesh.repair.fill_holes(mesh)
    return mesh


def orient_upright(mesh: trimesh.Trimesh, swap_y_to_z: bool) -> trimesh.Trimesh:
    mesh = mesh.copy()
    if swap_y_to_z:
        rot = trimesh.transformations.rotation_matrix(
            angle=np.pi / 2.0,
            direction=[1.0, 0.0, 0.0],
            point=[0.0, 0.0, 0.0],
        )
        mesh.apply_transform(rot)

    bmin, bmax = mesh.bounds
    cx = (bmin[0] + bmax[0]) / 2.0
    cy = (bmin[1] + bmax[1]) / 2.0
    cz = bmin[2]
    mesh.apply_translation([-cx, -cy, -cz])
    return mesh


def scale_to_height(mesh: trimesh.Trimesh, target_z_mm: float) -> trimesh.Trimesh:
    mesh = mesh.copy()
    current = mesh.bounds[1][2] - mesh.bounds[0][2]
    if current <= 1e-9:
        raise ValueError("Mesh has zero Z-extent; cannot scale")
    factor = target_z_mm / current
    mesh.apply_scale(factor)
    return mesh


def face_colors_rgb(mesh: trimesh.Trimesh) -> np.ndarray:
    visual = mesh.visual

    if (
        visual is not None
        and hasattr(visual, "uv")
        and visual.uv is not None
        and hasattr(visual, "material")
        and getattr(visual.material, "baseColorTexture", None) is not None
    ):
        texture: Image.Image = visual.material.baseColorTexture
        tex_array = np.asarray(texture.convert("RGB"))
        h, w = tex_array.shape[:2]
        uv = np.asarray(visual.uv)
        face_uvs = uv[mesh.faces].mean(axis=1)
        face_uvs[:, 0] = np.clip(face_uvs[:, 0], 0.0, 1.0)
        face_uvs[:, 1] = np.clip(face_uvs[:, 1], 0.0, 1.0)
        px = (face_uvs[:, 0] * (w - 1)).astype(np.int64)
        py = ((1.0 - face_uvs[:, 1]) * (h - 1)).astype(np.int64)
        return tex_array[py, px].astype(np.float32)

    if (
        visual is not None
        and hasattr(visual, "vertex_colors")
        and visual.vertex_colors is not None
        and len(visual.vertex_colors) == len(mesh.vertices)
    ):
        vc = np.asarray(visual.vertex_colors)[:, :3].astype(np.float32)
        return vc[mesh.faces].mean(axis=1)

    return np.full((len(mesh.faces), 3), 200.0, dtype=np.float32)


def cluster_faces_by_color(
    face_colors: np.ndarray, n_clusters: int, seed: int = 0
) -> tuple[np.ndarray, np.ndarray]:
    if n_clusters < 1:
        raise ValueError("n_clusters must be >= 1")
    n_clusters = min(n_clusters, len(face_colors))
    km = KMeans(n_clusters=n_clusters, n_init=10, random_state=seed)
    labels = km.fit_predict(face_colors)
    centroids = np.clip(km.cluster_centers_, 0, 255).astype(np.uint8)
    return labels, centroids


def split_mesh_by_face_labels(
    mesh: trimesh.Trimesh, labels: np.ndarray
) -> dict[int, trimesh.Trimesh]:
    out: dict[int, trimesh.Trimesh] = {}
    for label in np.unique(labels):
        face_mask = labels == label
        if not face_mask.any():
            continue
        sub = mesh.submesh([np.where(face_mask)[0]], append=True)
        if isinstance(sub, list):
            if not sub:
                continue
            sub = sub[0]
        out[int(label)] = sub
    return out


def cluster_descriptor(rgb: np.ndarray) -> str:
    r, g, b = int(rgb[0]), int(rgb[1]), int(rgb[2])
    luminance = 0.299 * r + 0.587 * g + 0.114 * b
    if luminance < 50:
        tone = "dark"
    elif luminance > 200:
        tone = "light"
    else:
        tone = "mid"

    if max(r, g, b) - min(r, g, b) < 18:
        hue = "neutral"
    elif r >= g and r >= b:
        hue = "red" if r - max(g, b) > 30 else "warm"
    elif g >= r and g >= b:
        hue = "green"
    else:
        hue = "blue"
    return f"{tone}_{hue}"


def write_stl(mesh: trimesh.Trimesh, path: str) -> None:
    mesh.export(path, file_type="stl")


def decimate_for_web(mesh: trimesh.Trimesh, target_faces: int) -> trimesh.Trimesh:
    if len(mesh.faces) <= target_faces:
        return mesh.copy()
    try:
        return _decimate_with_pymeshlab(mesh, target_faces)
    except Exception as exc:
        print(f"  WARN: pymeshlab decimation failed ({exc}); falling back to trimesh QEC")
        try:
            return mesh.simplify_quadric_decimation(face_count=target_faces)
        except Exception as exc2:
            print(f"  WARN: trimesh decimation also failed ({exc2}); using original mesh")
            return mesh.copy()


def _decimate_with_pymeshlab(
    mesh: trimesh.Trimesh, target_faces: int
) -> trimesh.Trimesh:
    import pymeshlab
    import tempfile

    with tempfile.TemporaryDirectory() as td:
        in_path = os.path.join(td, "in.ply")
        out_path = os.path.join(td, "out.ply")
        mesh.export(in_path, file_type="ply", vertex_normal=True)

        ms = pymeshlab.MeshSet()
        ms.load_new_mesh(in_path)
        ms.apply_filter(
            "meshing_decimation_quadric_edge_collapse",
            targetfacenum=target_faces,
            qualitythr=0.5,
            preserveboundary=True,
            boundaryweight=1.0,
            preservenormal=True,
            preservetopology=True,
            optimalplacement=True,
            planarquadric=True,
            autoclean=True,
        )
        ms.save_current_mesh(
            out_path, save_vertex_color=True, save_vertex_normal=True
        )
        decimated = trimesh.load(out_path, process=False)

    if not isinstance(decimated, trimesh.Trimesh):
        raise RuntimeError(
            "pymeshlab output was not a single Trimesh "
            f"(got {type(decimated).__name__})"
        )
    return decimated


def transfer_face_colors(
    source_mesh: trimesh.Trimesh,
    source_face_colors: np.ndarray,
    target_mesh: trimesh.Trimesh,
) -> np.ndarray:
    from scipy.spatial import cKDTree

    source_centroids = source_mesh.triangles.mean(axis=1)
    target_centroids = target_mesh.triangles.mean(axis=1)
    tree = cKDTree(source_centroids)
    _, idx = tree.query(target_centroids, k=1)
    return source_face_colors[idx]


def _finalize_web_glb(path: str, vertex_normals: np.ndarray | None) -> None:
    import json
    import struct

    with open(path, "rb") as fh:
        data = fh.read()

    if data[:4] != b"glTF":
        return

    version, _total_length = struct.unpack("<II", data[4:12])
    json_chunk_length, json_chunk_type = struct.unpack("<II", data[12:20])
    if json_chunk_type != 0x4E4F534A:
        return

    json_bytes = data[20:20 + json_chunk_length]
    bin_section = data[20 + json_chunk_length:]
    gltf = json.loads(json_bytes.decode("utf-8"))

    materials = gltf.setdefault("materials", [])
    material_index = len(materials)
    materials.append({
        "name": "vertex_color_material",
        "pbrMetallicRoughness": {
            "baseColorFactor": [1.0, 1.0, 1.0, 1.0],
            "metallicFactor": 0.0,
            "roughnessFactor": 0.85,
        },
        "doubleSided": True,
    })

    for mesh_def in gltf.get("meshes", []):
        for primitive in mesh_def.get("primitives", []):
            if "COLOR_0" in primitive.get("attributes", {}) and "material" not in primitive:
                primitive["material"] = material_index

    appended_bin = b""
    if vertex_normals is not None and len(gltf.get("meshes", [])) > 0:
        normals = np.ascontiguousarray(vertex_normals, dtype=np.float32)
        bin_chunk_header_length = 8
        bin_payload = bin_section[bin_chunk_header_length:]
        existing_bin_length = len(bin_payload)
        normal_offset_in_buffer = existing_bin_length
        normal_byte_length = normals.nbytes

        buffers = gltf.setdefault("buffers", [{}])
        buffers[0]["byteLength"] = existing_bin_length + normal_byte_length

        buffer_views = gltf.setdefault("bufferViews", [])
        normal_view_index = len(buffer_views)
        buffer_views.append({
            "buffer": 0,
            "byteOffset": normal_offset_in_buffer,
            "byteLength": normal_byte_length,
            "target": 34962,
        })

        accessors = gltf.setdefault("accessors", [])
        normal_accessor_index = len(accessors)
        accessors.append({
            "bufferView": normal_view_index,
            "componentType": 5126,
            "count": len(normals),
            "type": "VEC3",
            "min": normals.min(axis=0).tolist(),
            "max": normals.max(axis=0).tolist(),
        })

        for mesh_def in gltf["meshes"]:
            for primitive in mesh_def.get("primitives", []):
                primitive.setdefault("attributes", {})["NORMAL"] = normal_accessor_index

        appended_bin = normals.tobytes()

    new_json = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
    pad = (4 - (len(new_json) % 4)) % 4
    new_json = new_json + (b" " * pad)
    new_json_chunk = struct.pack("<II", len(new_json), 0x4E4F534A) + new_json

    bin_chunk_header_length = 8
    new_bin_payload = bin_section[bin_chunk_header_length:] + appended_bin
    new_bin_pad = (4 - (len(new_bin_payload) % 4)) % 4
    new_bin_payload = new_bin_payload + (b"\x00" * new_bin_pad)
    new_bin_chunk = struct.pack("<II", len(new_bin_payload), 0x004E4942) + new_bin_payload

    new_total = 12 + len(new_json_chunk) + len(new_bin_chunk)
    new_header = struct.pack("<4sII", b"glTF", version, new_total)

    with open(path, "wb") as fh:
        fh.write(new_header)
        fh.write(new_json_chunk)
        fh.write(new_bin_chunk)


def bake_face_colors_to_vertex_colors(
    mesh: trimesh.Trimesh, face_rgb: np.ndarray
) -> trimesh.Trimesh:
    baked = mesh.copy()
    vertex_rgba = np.full((len(baked.vertices), 4), 255, dtype=np.uint8)
    vertex_sum = np.zeros((len(baked.vertices), 3), dtype=np.float64)
    vertex_count = np.zeros(len(baked.vertices), dtype=np.int64)
    for tri_idx, tri in enumerate(baked.faces):
        for vi in tri:
            vertex_sum[vi] += face_rgb[tri_idx]
            vertex_count[vi] += 1
    nonzero = vertex_count > 0
    vertex_rgba[nonzero, :3] = (
        vertex_sum[nonzero] / vertex_count[nonzero, None]
    ).clip(0, 255).astype(np.uint8)
    baked.visual = trimesh.visual.ColorVisuals(
        mesh=baked, vertex_colors=vertex_rgba
    )
    return baked


def export_web_glb(mesh: trimesh.Trimesh, path: str) -> None:
    web_mesh = mesh.copy()
    rot = trimesh.transformations.rotation_matrix(
        angle=-np.pi / 2.0,
        direction=[1.0, 0.0, 0.0],
        point=[0.0, 0.0, 0.0],
    )
    web_mesh.apply_transform(rot)
    bmin, bmax = web_mesh.bounds
    cx = (bmin[0] + bmax[0]) / 2.0
    cz = (bmin[2] + bmax[2]) / 2.0
    cy = bmin[1]
    web_mesh.apply_translation([-cx, -cy, -cz])
    largest = float(np.max(web_mesh.bounds[1] - web_mesh.bounds[0]))
    if largest > 0:
        web_mesh.apply_scale(1.0 / largest)

    vertex_normals = np.asarray(web_mesh.vertex_normals, dtype=np.float32).copy()
    web_mesh.export(path, file_type="glb")
    _finalize_web_glb(path, vertex_normals=vertex_normals)


def render_thumbnail(
    mesh: trimesh.Trimesh,
    path: str,
    size_px: int,
    face_colors_rgb_arr: np.ndarray | None = None,
    background_rgba: tuple[float, float, float, float] = (1.0, 1.0, 1.0, 0.0),
) -> None:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    from mpl_toolkits.mplot3d.art3d import Poly3DCollection

    if face_colors_rgb_arr is not None:
        face_rgb = np.asarray(face_colors_rgb_arr, dtype=np.float32) / 255.0
    else:
        face_rgb = face_colors_rgb(mesh) / 255.0
    if len(face_rgb) != len(mesh.faces):
        face_rgb = np.full((len(mesh.faces), 3), 0.78, dtype=np.float32)

    verts = mesh.vertices
    faces = mesh.faces
    triangles = verts[faces]

    transparent_bg = background_rgba[3] < 1.0
    dpi = 128
    fig_in = size_px / dpi
    fig = plt.figure(figsize=(fig_in, fig_in), dpi=dpi)
    if transparent_bg:
        fig.patch.set_alpha(0.0)
    else:
        fig.patch.set_facecolor(background_rgba[:3])
        fig.patch.set_alpha(background_rgba[3])
    ax = fig.add_subplot(111, projection="3d")
    ax.set_axis_off()
    ax.set_proj_type("ortho")
    if transparent_bg:
        ax.patch.set_alpha(0.0)
    else:
        ax.set_facecolor(background_rgba[:3])

    tri_v0 = triangles[:, 0, :]
    tri_v1 = triangles[:, 1, :]
    tri_v2 = triangles[:, 2, :]
    normals = np.cross(tri_v1 - tri_v0, tri_v2 - tri_v0)
    norm_lens = np.linalg.norm(normals, axis=1, keepdims=True)
    norm_lens[norm_lens == 0] = 1.0
    normals = normals / norm_lens

    key_dir = np.array([-0.35, -0.55, 0.75], dtype=np.float32)
    key_dir /= np.linalg.norm(key_dir)
    fill_dir = np.array([0.65, -0.20, 0.30], dtype=np.float32)
    fill_dir /= np.linalg.norm(fill_dir)
    key = np.clip(normals @ key_dir, 0.0, 1.0)[:, None]
    fill = np.clip(normals @ fill_dir, 0.0, 1.0)[:, None]
    ambient = 0.55
    shade = ambient + 0.55 * key + 0.20 * fill
    shaded_rgb = np.clip(face_rgb * shade, 0.0, 1.0)
    shaded_rgba = np.concatenate(
        [shaded_rgb, np.ones((len(shaded_rgb), 1))], axis=1
    )

    coll = Poly3DCollection(triangles, facecolors=shaded_rgba, edgecolors="none",
                             linewidths=0, antialiased=False)
    ax.add_collection3d(coll)

    bmin = verts.min(axis=0)
    bmax = verts.max(axis=0)
    extents = bmax - bmin
    cx, cy, cz = (bmin + bmax) / 2.0
    half = max(extents) / 2.0 * 1.02
    ax.set_xlim(cx - half, cx + half)
    ax.set_ylim(cy - half, cy + half)
    ax.set_zlim(cz - half, cz + half)
    ax.set_box_aspect((1.0, 1.0, 1.0))

    if extents[2] > max(extents[0], extents[1]):
        ax.view_init(elev=8, azim=-72)
    else:
        ax.view_init(elev=28, azim=-45)

    if transparent_bg:
        fig.savefig(path, dpi=dpi, bbox_inches="tight", pad_inches=0,
                    transparent=True)
    else:
        fig.savefig(path, dpi=dpi, bbox_inches="tight", pad_inches=0,
                    transparent=False, facecolor=fig.get_facecolor())
    plt.close(fig)


def process(
    glb_path: str,
    out_dir: str,
    name: str,
    target_height_mm: float,
    n_colors: int,
    dry_run: bool,
    segment: bool,
    swap_y_to_z: bool,
    emit_web_glb: bool,
    emit_thumbnail: bool,
    web_target_faces: int,
    thumb_size_px: int,
) -> None:
    print(f"\n=== process_figurine: {glb_path} ===")
    raw = load_glb_as_mesh(glb_path)
    raw_stats = inspect_mesh(raw)
    print("\n[1/8] Loaded GLB:")
    print(raw_stats)

    if dry_run:
        print("\nDry run: stopping after inspection.")
        return

    print("\n[2/8] Repairing mesh...")
    repaired = repair_mesh(raw)
    print(inspect_mesh(repaired))

    print(f"\n[3/8] Orienting (swap_y_to_z={swap_y_to_z}) and resting on Z=0...")
    oriented = orient_upright(repaired, swap_y_to_z=swap_y_to_z)
    print(inspect_mesh(oriented))

    print(f"\n[4/8] Scaling so Z-extent = {target_height_mm} mm...")
    scaled = scale_to_height(oriented, target_height_mm)
    scaled_stats = inspect_mesh(scaled)
    print(scaled_stats)

    AD5X_PLATE_MM = 220.0
    ex = scaled_stats.extents()
    if ex[0] > AD5X_PLATE_MM or ex[1] > AD5X_PLATE_MM:
        print(f"  WARNING: XY footprint {ex[0]:.1f} x {ex[1]:.1f} mm exceeds "
              f"AD5X plate ({AD5X_PLATE_MM:.0f} mm). Check orientation: source "
              f"GLB may not be upright. Re-run with --keep-up-axis or rotate.")
    if ex[2] != max(ex):
        print(f"  NOTE: Z-extent ({ex[2]:.1f} mm) is not the largest axis "
              f"(max = {max(ex):.1f} mm). The figure may not be upright.")

    os.makedirs(out_dir, exist_ok=True)
    stl_path = os.path.join(out_dir, f"{name}.stl")
    threemf_path = os.path.join(out_dir, f"{name}.3mf")

    print(f"\n[5/8] Writing single-colour STL: {stl_path}")
    write_stl(scaled, stl_path)

    if not segment:
        print("\n[6/8] --no-segment set: writing single-body 3MF...")
        write_multi_body_3mf_from_trimesh(
            [(name, scaled, (255, 255, 255, 255))], threemf_path
        )
        print(f"Wrote: {threemf_path}")

        web_glb_path = None
        thumb_path = None
        if emit_web_glb:
            web_glb_path = os.path.join(out_dir, f"{name}.web.glb")
            fc_for_web = face_colors_rgb(scaled)
            colored = bake_face_colors_to_vertex_colors(scaled, fc_for_web)
            web_mesh = decimate_for_web(colored, web_target_faces)
            export_web_glb(web_mesh, web_glb_path)
            print(f"Wrote: {web_glb_path}")
        if emit_thumbnail:
            thumb_path = os.path.join(out_dir, f"{name}.thumb.png")
            thumb_source = decimate_for_web(scaled, min(web_target_faces, 60000))
            fc_full = face_colors_rgb(scaled)
            fc_thumb = transfer_face_colors(scaled, fc_full, thumb_source)
            render_thumbnail(thumb_source, thumb_path, size_px=thumb_size_px,
                             face_colors_rgb_arr=fc_thumb)
            print(f"Wrote: {thumb_path}")

        _summary(
            stl_path,
            threemf_path,
            scaled_stats,
            segments=None,
            web_glb_path=web_glb_path,
            thumb_path=thumb_path,
        )
        return

    print(f"\n[6/8] Sampling face colours from texture / vertex colours...")
    fc = face_colors_rgb(scaled)
    color_spread = float(fc.std(axis=0).mean())
    print(f"  sampled {len(fc)} face colours, "
          f"mean RGB = ({fc.mean(axis=0)[0]:.0f}, "
          f"{fc.mean(axis=0)[1]:.0f}, "
          f"{fc.mean(axis=0)[2]:.0f}), "
          f"spread (stddev) = {color_spread:.1f}")
    if color_spread < 2.0:
        print()
        print("  ABORT: face colours have near-zero variation (stddev "
              f"{color_spread:.2f}). The GLB has no usable texture/vertex "
              "colour data; segmentation would collapse to one body.")
        print("  Fix: re-export from Meshy with textures enabled, or re-run "
              "with --no-segment to emit a single-body 3MF.")
        print()
        return

    print(f"\n[7/8] K-means clustering into {n_colors} colour regions...")
    labels, centroids = cluster_faces_by_color(fc, n_clusters=n_colors)
    submeshes = split_mesh_by_face_labels(scaled, labels)
    print(f"  produced {len(submeshes)} colour bodies:")
    for lbl, sub in sorted(submeshes.items()):
        c = centroids[lbl]
        print(f"    body {lbl}: rgb=({c[0]:3d},{c[1]:3d},{c[2]:3d}) "
              f"-> {cluster_descriptor(c):<14} "
              f"faces={len(sub.faces):>6}  verts={len(sub.vertices):>6}")

    print(f"\n[8/8] Writing multi-body 3MF: {threemf_path}")
    bodies = []
    for lbl, sub in sorted(submeshes.items()):
        c = centroids[lbl]
        body_name = f"{name}_{lbl:02d}_{cluster_descriptor(c)}"
        bodies.append((body_name, sub, (int(c[0]), int(c[1]), int(c[2]), 255)))
    write_multi_body_3mf_from_trimesh(bodies, threemf_path)

    web_glb_path = None
    thumb_path = None

    if emit_web_glb:
        web_glb_path = os.path.join(out_dir, f"{name}.web.glb")
        print(f"\n[extra] Decimating to {web_target_faces} faces and writing web GLB: {web_glb_path}")
        colored = bake_face_colors_to_vertex_colors(scaled, fc)
        web_mesh = decimate_for_web(colored, web_target_faces)
        print(f"  decimated: {len(scaled.faces)} -> {len(web_mesh.faces)} faces")
        export_web_glb(web_mesh, web_glb_path)
        print(f"  wrote: {web_glb_path} "
              f"({os.path.getsize(web_glb_path) / (1024 * 1024):.2f} MB)")

    if emit_thumbnail:
        thumb_path = os.path.join(out_dir, f"{name}.thumb.png")
        print(f"\n[extra] Rendering thumbnail PNG: {thumb_path}")
        thumb_source = decimate_for_web(scaled, min(web_target_faces, 60000))
        fc_thumb = transfer_face_colors(scaled, fc, thumb_source)
        render_thumbnail(thumb_source, thumb_path, size_px=thumb_size_px,
                         face_colors_rgb_arr=fc_thumb)
        print(f"  wrote: {thumb_path} "
              f"({os.path.getsize(thumb_path) / 1024:.1f} KB)")

    _summary(
        stl_path,
        threemf_path,
        scaled_stats,
        segments=len(submeshes),
        web_glb_path=web_glb_path,
        thumb_path=thumb_path,
    )


def _summary(
    stl_path: str,
    threemf_path: str,
    stats: FigurineStats,
    segments: int | None,
    web_glb_path: str | None = None,
    thumb_path: str | None = None,
) -> None:
    print("\n--- Output summary ---")
    print(f"  STL:      {stl_path}")
    print(f"  3MF:      {threemf_path}")
    if web_glb_path:
        print(f"  Web GLB:  {web_glb_path}")
    if thumb_path:
        print(f"  Thumb:    {thumb_path}")
    ex = stats.extents()
    print(f"  Size (mm): {ex[0]:.2f} x {ex[1]:.2f} x {ex[2]:.2f}")
    if segments is not None:
        print(f"  Coloured bodies: {segments}")
    print()
    print("Next: open the 3MF in your slicer, assign filaments per body,")
    print("review supports (figurines almost always need them), slice and print.")


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Post-process an AI-generated GLB figurine")
    p.add_argument("glb", help="Path to input GLB file")
    p.add_argument("--name", help="Output basename (default: GLB stem)")
    p.add_argument("--height", type=float, default=80.0,
                   help="Target Z-extent in mm (default 80)")
    p.add_argument("--colors", type=int, default=4,
                   help="Number of colour clusters / 3MF bodies (default 4)")
    p.add_argument("--out-dir", default="models",
                   help="Output directory (default ./models)")
    p.add_argument("--web-faces", type=int, default=80000,
                   help="Target face count for the web GLB (default 80000)")
    p.add_argument("--thumb-size", type=int, default=1024,
                   help="Thumbnail edge in pixels (default 1024)")
    p.add_argument("--no-web-glb", action="store_true",
                   help="Skip web-GLB export")
    p.add_argument("--no-thumbnail", action="store_true",
                   help="Skip thumbnail render")
    p.add_argument("--dry-run", action="store_true",
                   help="Inspect only; print analysis and exit")
    p.add_argument("--no-segment", action="store_true",
                   help="Skip colour segmentation; emit single-body 3MF")
    p.add_argument("--keep-up-axis", action="store_true",
                   help="Skip the Y-up -> Z-up rotation (source already Z-up)")
    return p.parse_args()


def main() -> None:
    args = parse_args()
    name = args.name or os.path.splitext(os.path.basename(args.glb))[0]
    process(
        glb_path=args.glb,
        out_dir=args.out_dir,
        name=name,
        target_height_mm=args.height,
        n_colors=args.colors,
        dry_run=args.dry_run,
        segment=not args.no_segment,
        swap_y_to_z=not args.keep_up_axis,
        emit_web_glb=not args.no_web_glb,
        emit_thumbnail=not args.no_thumbnail,
        web_target_faces=args.web_faces,
        thumb_size_px=args.thumb_size,
    )


if __name__ == "__main__":
    main()
