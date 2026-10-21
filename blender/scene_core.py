"""Common stage and primitives for the editable DeepInfer Blender scenes."""
from pathlib import Path
import bpy
from mathutils import Vector


def mat(name, hex_color, metallic=0, roughness=0.45):
    color = hex_color.lstrip('#')
    srgb = [int(color[i:i+2], 16) / 255 for i in (0, 2, 4)]
    rgba = tuple(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb) + (1.0,)
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.diffuse_color = rgba
    m.use_nodes = True
    shader = m.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = rgba
    shader.inputs['Metallic'].default_value = metallic
    shader.inputs['Roughness'].default_value = roughness
    return m


def cube(name, loc, size, material, bevel=0.06):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.object
    o.name = name
    o.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        mod = o.modifiers.new('Soft edges', 'BEVEL')
        mod.width = bevel
        mod.segments = 3
    if material:
        o.data.materials.append(material)
    return o


def sphere(name, loc, radius, material):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=12, radius=radius, location=loc)
    o = bpy.context.object
    o.name = name
    if material:
        o.data.materials.append(material)
    for p in o.data.polygons:
        p.use_smooth = True
    return o


def line(name, points, material, radius=0.035):
    crv = bpy.data.curves.new(name, 'CURVE')
    crv.dimensions = '3D'
    crv.resolution_u = 12
    crv.bevel_depth = radius
    crv.bevel_resolution = 3
    spline = crv.splines.new('POLY')
    spline.points.add(len(points) - 1)
    for p, co in zip(spline.points, points):
        p.co = (*co, 1)
    o = bpy.data.objects.new(name, crv)
    bpy.context.collection.objects.link(o)
    if material:
        crv.materials.append(material)
    return o


def label(name, text, loc, size, material, align='CENTER'):
    font = bpy.data.curves.new(name, 'FONT')
    font.body = text
    font.align_x = align
    font.align_y = 'CENTER'
    font.size = size
    font.extrude = 0.001
    o = bpy.data.objects.new(name, font)
    bpy.context.collection.objects.link(o)
    o.location = loc
    if material:
        font.materials.append(material)
    return o


def overlay(name, text, x, y, size, material, align='LEFT'):
    # Camera-local typography remains readable and independent of the diorama.
    o = label(name, text, (0, 0, 0), size, material, align)
    o.parent = bpy.context.scene.camera
    o.location = (x, y, -5)
    return o


def setup(title, subtitle, frames=144):
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    scene = bpy.context.scene
    scene.name = title
    scene.frame_start = 1
    scene.frame_end = frames
    scene.render.fps = 24
    scene.render.engine = 'CYCLES'
    scene.render.use_compositing = False
    scene.cycles.samples = 16
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 960
    scene.render.resolution_y = 540
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.film_transparent = False
    scene.world.color = (0.8, 0.8, 0.8)
    scene.view_settings.view_transform = 'Standard'
    stage = mat('Stage | warm paper', '#F4EFE5', roughness=0.9)
    ink = mat('Ink | navy', '#233953', roughness=0.8)
    cube('Ground', (0, 0, -0.28), (200, 200, 0.4), stage, 0)
    bpy.ops.object.camera_add(location=(0, -12, 19))
    camera = bpy.context.object
    camera.name = 'Camera | editorial isometric'
    camera.rotation_euler = (Vector((0, 0, 0.15)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
    camera.data.type = 'ORTHO'
    camera.data.ortho_scale = 16
    scene.camera = camera
    bpy.ops.object.light_add(type='AREA', location=(-5, -5, 12))
    light = bpy.context.object
    light.name = 'Key | softbox'
    light.data.energy = 2200
    light.data.shape = 'DISK'
    light.data.size = 12
    light.rotation_euler = (Vector((0, 0, 0)) - light.location).to_track_quat('-Z', 'Y').to_euler()
    bpy.ops.object.light_add(type='AREA', location=(7, 3, 9))
    fill = bpy.context.object
    fill.name = 'Fill | softbox'
    fill.data.energy = 1100
    fill.data.size = 10
    fill.rotation_euler = (Vector((0, 0, 0)) - fill.location).to_track_quat('-Z', 'Y').to_euler()
    overlay('Header | title', title.upper(), -7.25, 3.80, 0.56, ink)
    overlay('Header | context', subtitle, -7.25, 3.25, 0.30, ink)
    return scene


def save(scene_name, output_dir):
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(out / (scene_name + '.blend')))
