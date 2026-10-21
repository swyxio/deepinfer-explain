"""Render a module story to a PNG sequence for FFmpeg encoding."""
import sys
from pathlib import Path
import bpy

args = sys.argv[sys.argv.index('--') + 1:]
if not args:
    raise SystemExit('Usage: blender -b scene.blend --python render_module_stories.py -- OUTPUT_DIR [END_FRAME]')
output = Path(args[0]).resolve()
output.mkdir(parents=True, exist_ok=True)
scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE'
scene.render.use_sequencer = False
scene.render.use_compositing = False
scene.eevee.taa_render_samples = 4
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGB'
scene.render.image_settings.compression = 50
if len(args) > 1:
    scene.frame_end = int(args[1])
scene.render.filepath = str(output / 'frame-')
bpy.ops.render.render(animation=True)
