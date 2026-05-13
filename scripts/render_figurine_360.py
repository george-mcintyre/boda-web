"""
Render a 360-degree turntable image sequence of a figurine using Blender Cycles.

Invocation (run via Blender, not plain python):

    /Applications/Blender.app/Contents/MacOS/Blender \
        --background --python scripts/render_figurine_360.py -- \
        --glb models/george.glb --out-dir public/assets/figurines/figurine-2 \
        --frames 12 --size 800

Output: <out-dir>/00.png through <out-dir>/<frames-1>.png (transparent
backgrounds, studio-lit, centered on a turntable). Plus a small thumb.png
which is a copy of frame 00 (used by the gift card).
"""

import argparse
import math
import os
import shutil
import sys

import bpy
import addon_utils


def parse_cli_args() -> argparse.Namespace:
    if "--" in sys.argv:
        argv = sys.argv[sys.argv.index("--") + 1:]
    else:
        argv = []
    p = argparse.ArgumentParser()
    p.add_argument("--glb", required=True)
    p.add_argument("--out-dir", required=True)
    p.add_argument("--frames", type=int, default=12)
    p.add_argument("--size", type=int, default=800)
    p.add_argument("--samples", type=int, default=64)
    p.add_argument("--elevation-deg", type=float, default=15.0)
    p.add_argument("--engine", default="CYCLES",
                   choices=("CYCLES", "BLENDER_EEVEE"))
    return p.parse_args(argv)


def reset_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for collection in (bpy.data.meshes, bpy.data.materials, bpy.data.images,
                       bpy.data.lights, bpy.data.cameras, bpy.data.objects):
        for item in list(collection):
            collection.remove(item)


def import_glb(glb_path: str) -> list[bpy.types.Object]:
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=glb_path)
    after = set(bpy.data.objects)
    return [o for o in (after - before) if o.type == "MESH"]


def compute_world_bbox(meshes: list[bpy.types.Object]) -> tuple[list[float], list[float]]:
    bbox_min = [float("inf")] * 3
    bbox_max = [float("-inf")] * 3
    depsgraph = bpy.context.evaluated_depsgraph_get()
    for obj in meshes:
        eo = obj.evaluated_get(depsgraph)
        mesh = eo.to_mesh()
        try:
            mw = obj.matrix_world
            for v in mesh.vertices:
                world = mw @ v.co
                for i in range(3):
                    if world[i] < bbox_min[i]:
                        bbox_min[i] = world[i]
                    if world[i] > bbox_max[i]:
                        bbox_max[i] = world[i]
        finally:
            eo.to_mesh_clear()
    return bbox_min, bbox_max


def fit_meshes_to_unit_height(meshes: list[bpy.types.Object],
                              target_height: float = 1.6) -> None:
    if not meshes:
        return
    bpy.ops.object.select_all(action="DESELECT")
    for m in meshes:
        m.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    bbox_min, bbox_max = compute_world_bbox(meshes)
    height = bbox_max[2] - bbox_min[2]
    width = max(bbox_max[0] - bbox_min[0], bbox_max[1] - bbox_min[1])
    largest = max(height, width)
    if largest <= 0:
        return
    scale = target_height / largest
    cx = (bbox_min[0] + bbox_max[0]) / 2.0
    cy = (bbox_min[1] + bbox_max[1]) / 2.0
    cz = bbox_min[2]

    for obj in meshes:
        obj.location.x = (obj.location.x - cx) * scale
        obj.location.y = (obj.location.y - cy) * scale
        obj.location.z = (obj.location.z - cz) * scale
        obj.scale = (obj.scale[0] * scale,
                     obj.scale[1] * scale,
                     obj.scale[2] * scale)
    bpy.context.view_layer.update()


def add_studio_lighting() -> None:
    light_specs = [
        dict(name="key", energy=160.0, size=3.5,
             location=(2.4, -2.8, 3.4), rotation=(math.radians(50), 0,
                                                  math.radians(40))),
        dict(name="fill", energy=90.0, size=4.5,
             location=(-2.8, -1.6, 2.4), rotation=(math.radians(40), 0,
                                                   math.radians(-30))),
        dict(name="rim", energy=70.0, size=2.5,
             location=(0.4, 2.6, 2.6), rotation=(math.radians(75), 0,
                                                 math.radians(180))),
        dict(name="top_fill", energy=50.0, size=5.0,
             location=(0.0, 0.0, 4.5), rotation=(0, 0, 0)),
    ]
    for spec in light_specs:
        bpy.ops.object.light_add(type="AREA", location=spec["location"],
                                 rotation=spec["rotation"])
        lamp = bpy.context.object
        lamp.name = f"studio_{spec['name']}"
        lamp.data.energy = spec["energy"]
        lamp.data.size = spec["size"]
        lamp.data.color = (1.0, 0.985, 0.97)


def add_world_background(intensity: float = 0.6) -> None:
    world = bpy.context.scene.world
    if world is None:
        world = bpy.data.worlds.new("World")
        bpy.context.scene.world = world
    world.use_nodes = True
    tree = world.node_tree
    tree.nodes.clear()
    out = tree.nodes.new("ShaderNodeOutputWorld")
    bg = tree.nodes.new("ShaderNodeBackground")
    bg.inputs[0].default_value = (1.0, 1.0, 1.0, 1.0)
    bg.inputs[1].default_value = intensity
    tree.links.new(bg.outputs[0], out.inputs[0])


def add_shadow_catcher(size: float = 6.0) -> None:
    bpy.ops.mesh.primitive_plane_add(size=size, location=(0.0, 0.0, 0.0))
    plane = bpy.context.object
    plane.name = "shadow_catcher"
    plane.is_shadow_catcher = True
    plane.visible_diffuse = False
    plane.visible_glossy = False
    plane.visible_transmission = False
    plane.visible_volume_scatter = False


def add_camera(distance: float = 4.5, elevation_deg: float = 15.0,
               target_height: float = 0.8) -> bpy.types.Object:
    bpy.ops.object.camera_add()
    cam = bpy.context.object
    cam.name = "studio_cam"
    elev = math.radians(elevation_deg)
    cam.location = (0.0, -distance * math.cos(elev),
                    target_height + distance * math.sin(elev))

    bpy.ops.object.empty_add(type="PLAIN_AXES",
                             location=(0.0, 0.0, target_height))
    target = bpy.context.object
    target.name = "cam_target"
    constraint = cam.constraints.new("TRACK_TO")
    constraint.target = target
    constraint.track_axis = "TRACK_NEGATIVE_Z"
    constraint.up_axis = "UP_Y"
    cam.data.lens = 75.0
    cam.data.clip_start = 0.1
    cam.data.clip_end = 100.0
    return cam


def add_turntable_parent(meshes: list[bpy.types.Object]) -> bpy.types.Object:
    bpy.ops.object.empty_add(type="PLAIN_AXES", location=(0.0, 0.0, 0.0))
    turntable = bpy.context.object
    turntable.name = "turntable"
    for m in meshes:
        m.parent = turntable
    return turntable


def configure_render(engine: str, size: int, samples: int) -> None:
    scene = bpy.context.scene
    if engine == "CYCLES":
        addon_utils.enable("cycles", default_set=True, persistent=True)
        scene.render.engine = "CYCLES"
        scene.cycles.samples = samples
        scene.cycles.use_denoising = True
        try:
            scene.cycles.denoiser = "OPENIMAGEDENOISE"
        except (TypeError, ValueError):
            pass
        scene.cycles.use_adaptive_sampling = True
        scene.cycles.adaptive_threshold = 0.01
    else:
        scene.render.engine = "BLENDER_EEVEE"

    scene.render.resolution_x = size
    scene.render.resolution_y = size
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.compression = 50
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"


def render_frame(out_path: str) -> None:
    bpy.context.scene.render.filepath = out_path
    bpy.ops.render.render(write_still=True)


def main() -> None:
    args = parse_cli_args()
    print(f"[render] glb={args.glb} out={args.out_dir} frames={args.frames} "
          f"size={args.size} engine={args.engine}")

    reset_scene()
    configure_render(args.engine, args.size, args.samples)
    add_world_background()
    meshes = import_glb(args.glb)
    if not meshes:
        raise RuntimeError(f"No mesh objects imported from {args.glb}")
    fit_meshes_to_unit_height(meshes, target_height=1.6)
    add_studio_lighting()
    add_shadow_catcher(size=6.0)
    cam = add_camera(distance=3.6, elevation_deg=args.elevation_deg,
                     target_height=0.8)
    bpy.context.scene.camera = cam
    turntable = add_turntable_parent(meshes)

    os.makedirs(args.out_dir, exist_ok=True)
    for frame_idx in range(args.frames):
        angle = frame_idx * (2 * math.pi / args.frames)
        turntable.rotation_euler = (0.0, 0.0, angle)
        bpy.context.view_layer.update()
        out_path = os.path.join(args.out_dir, f"{frame_idx:02d}.png")
        print(f"[render] frame {frame_idx + 1}/{args.frames} "
              f"(angle={math.degrees(angle):.0f}\u00b0) -> {out_path}")
        render_frame(out_path)

    thumb_src = os.path.join(args.out_dir, "00.png")
    thumb_dst = os.path.join(args.out_dir, "thumb.png")
    shutil.copyfile(thumb_src, thumb_dst)
    print(f"[render] done: {args.frames} frames + thumb.png in {args.out_dir}")


if __name__ == "__main__":
    main()
