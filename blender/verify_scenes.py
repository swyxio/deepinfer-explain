"""Verify that every editable scene has four synchronized, animated beats."""
import sys
from pathlib import Path
import bpy

args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
root = Path(args[0]) if args else Path(__file__).resolve().parents[1] / 'public' / 'blender'
names = ['story-cache', 'story-replay', 'story-experts', 'story-dspark', 'story-overlap', 'story-system']
for name in names:
    bpy.ops.wm.open_mainfile(filepath=str(root / (name + '.blend')))
    scene = bpy.context.scene
    assert scene.camera and scene.frame_start == 1 and scene.frame_end == 384 and scene.render.fps == 24, name
    for beat in range(4):
        start = 1 + beat * 96
        title = bpy.data.objects[f'Beat {beat} / title']
        marker = bpy.data.objects[f'Beat {beat} / moving packet']
        active_first = bpy.data.objects[f'Beat {beat} / active node 0']
        active_second = bpy.data.objects[f'Beat {beat} / active node 1']
        source = bpy.data.objects[f'Beat {beat} / origin']
        scene.frame_set(start + 8)
        assert not title.hide_render and not source.hide_render, (name, beat)
        assert not active_first.hide_render and active_second.hide_render, (name, beat, 'first node')
        first_y = marker.location.y
        scene.frame_set(start + 40)
        assert active_first.hide_render and not active_second.hide_render, (name, beat, 'second node')
        assert marker.location.y < first_y, (name, beat, 'packet did not move')
        scene.frame_set(start + 79)
        assert not bpy.data.objects[f'Beat {beat} / active node 2'].hide_render, (name, beat, 'third node')
    assert bpy.data.objects['Beat 3 / origin'].data.body in {'VLLM SOURCE', 'SGLANG SOURCE'}, name
    print('Verified:', name, '| four 4-second phases | source, movement, and active nodes')
