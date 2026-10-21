"""Check that the shipped projects contain the intended editable motion."""
import sys
from pathlib import Path
import bpy

args = sys.argv[sys.argv.index('--') + 1:]
root = Path(args[0]) if args else Path(__file__).resolve().parents[1] / 'public' / 'blender'
names = ['expert-traffic', 'near-far-attention', 'precision', 'vision', 'parallelism']
for name in names:
    bpy.ops.wm.open_mainfile(filepath=str(root / (name + '.blend')))
    scene = bpy.context.scene
    assert scene.camera and scene.frame_start == 1 and scene.frame_end == 144 and scene.render.fps == 24, name
    assert sum(obj.animation_data is not None for obj in scene.objects) > 1, name
    if name == 'expert-traffic':
        replica = bpy.data.objects['expert A second physical copy']
        scene.frame_set(1)
        assert replica.hide_render
        scene.frame_set(100)
        assert not replica.hide_render
    elif name == 'near-far-attention':
        obj = bpy.data.objects['index selection halo (illustrative)']
        scene.frame_set(1)
        first = obj.location.x
        scene.frame_set(76)
        assert abs(obj.location.x - first) > 1
    elif name == 'precision':
        obj = bpy.data.objects['ROUTED EXPERTS | value 01']
        scene.frame_set(1)
        first = obj.scale.x
        scene.frame_set(110)
        assert obj.scale.x < first
    elif name == 'vision':
        obj = bpy.data.objects['Image patch 01']
        scene.frame_set(1)
        first = obj.location.x
        scene.frame_set(62)
        assert abs(obj.location.x - first) > 1
    elif name == 'parallelism':
        obj = bpy.data.objects['Sequence block 8']
        scene.frame_set(1)
        first = obj.location.x
        scene.frame_set(110)
        assert first > 0 and obj.location.x < 0
    print('Verified:', name, '|', len(scene.objects), 'objects | 144 frames at 24 fps')
