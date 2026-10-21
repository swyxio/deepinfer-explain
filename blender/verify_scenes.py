"""Verify the editable workshop scenes contain their essential animated beats."""
import sys
from pathlib import Path
import bpy

args = sys.argv[sys.argv.index('--') + 1:]
root = Path(args[0]) if args else Path(__file__).resolve().parents[1] / 'public' / 'blender'
names = ['story-cache', 'story-replay', 'story-experts', 'story-dspark', 'story-overlap', 'story-system']
for name in names:
    bpy.ops.wm.open_mainfile(filepath=str(root / (name + '.blend')))
    scene = bpy.context.scene
    assert scene.camera and scene.frame_start == 1 and scene.frame_end == 240 and scene.render.fps == 24, name
    assert sum(obj.animation_data is not None for obj in scene.objects) > 2, name
    if name == 'story-cache':
        obj = bpy.data.objects['track / fetch arrow 1']
        scene.frame_set(1)
        assert obj.hide_render
        scene.frame_set(160)
        assert not obj.hide_render
    elif name == 'story-replay':
        obj = bpy.data.objects['local window / approximate']
        scene.frame_set(1)
        assert obj.hide_render
        scene.frame_set(200)
        assert not obj.hide_render
    elif name == 'story-experts':
        obj = bpy.data.objects['GPU 4 | physical workstation']
        scene.frame_set(1)
        assert obj.hide_render
        scene.frame_set(150)
        assert not obj.hide_render
    elif name == 'story-dspark':
        obj = bpy.data.objects['rejected label']
        scene.frame_set(1)
        assert obj.hide_render
        scene.frame_set(220)
        assert not obj.hide_render
    elif name == 'story-overlap':
        idle = bpy.data.objects['GPU waiting indicator']
        active = bpy.data.objects['GPU active indicator']
        scene.frame_set(1)
        assert not idle.hide_render and active.hide_render
        scene.frame_set(100)
        assert idle.hide_render and not active.hide_render
    elif name == 'story-system':
        scene.frame_set(1)
        first = scene.camera.data.ortho_scale
        scene.frame_set(100)
        assert scene.camera.data.ortho_scale > first
    print('Verified:', name, '|', len(scene.objects), 'objects | 240 frames at 24 fps')
