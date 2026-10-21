"""Render lightweight preview frames without changing the saved .blend."""
import sys
from pathlib import Path
import bpy

args = sys.argv[sys.argv.index('--') + 1:]
if len(args) != 1:
    raise SystemExit('Usage: blender -b scene.blend --python render_preview.py -- FRAME_DIRECTORY')
output = Path(args[0]).resolve()
output.mkdir(parents=True, exist_ok=True)
scene = bpy.context.scene
scene.render.resolution_percentage = 80
scene.cycles.samples = 8
scene.frame_step = 2
scene.render.image_settings.file_format = 'PNG'
scene.render.filepath = str(output / 'frame-')
bpy.ops.render.render(animation=True)
