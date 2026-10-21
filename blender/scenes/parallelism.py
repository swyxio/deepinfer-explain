"""Mirrored context parallelism: 8 sequence blocks across 4 example ranks.

For rank r, DeepInfer's mirror permutation assigns block r and 2N - 1 - r:
deepinfer/model_executor/layers/tilelang_ops/cuda/prepare_cp_mirror.py:106-114.
Later causal queries may have more prior context; pairing early with late work
helps avoid a concentrated rank workload. Counts and geometry here are illustrative.
"""
from pathlib import Path
import sys

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from scene_core import setup, mat, cube, label, line, overlay, save

scene = setup('Fold a long prompt across GPUs',
              'Mirror the sequence so each rank receives an early and a late slice')
ink = mat('Parallel | ink', '#233B55')
blue = mat('Parallel | early sequence', '#4D87A4')
blue_dark = mat('Parallel | dark blue', '#294E68')
rust = mat('Parallel | late sequence', '#D07758')
paper = mat('Parallel | paper', '#FBF6EB')
white = mat('Parallel | bright', '#FFFDF6')
edge = mat('Parallel | muted', '#B9C9C8')

# A long prompt segmented into eight consecutive, indexed chunks.
cube('Sequence | rail', (0, 1.32, .10), (10.46, 1.03, .17), paper)
label('Sequence | heading', 'ONE LONG SEQUENCE', (0, 2.29, .04), .25, ink)
label('Sequence | beginning', 'EARLIER', (-5.25, 1.95, .04), .16, blue_dark, 'LEFT')
label('Sequence | end', 'LATER', (4.68, 1.95, .04), .16, rust, 'LEFT')

# Four GPU trays are independent meshes and can be rearranged in Blender.
rank_xs = (-4.65, -1.55, 1.55, 4.65)
for rank, x in enumerate(rank_xs):
    cube('GPU %d | casing' % rank, (x, -1.16, .12), (2.64, 1.64, .24), blue_dark)
    cube('GPU %d | surface' % rank, (x, -1.16, .26), (2.43, 1.43, .06), white)
    # Contacts suggest a hardware board without asserting a specific GPU model.
    for p in range(5):
        cube('GPU %d | contact %d' % (rank, p), (x + (p - 2) * .30, -2.02, .11),
             (.16, .14, .08), rust, .01)
    # A visible central chip and traces make the tray read as hardware before
    # slices arrive. The chip becomes the surface on which the pair lands.
    cube('GPU %d | chip' % rank, (x, -1.16, .31), (.45, .50, .06), edge, .025)
    for p in range(3):
        line('GPU %d | trace %d' % (rank, p),
             [(x - .77, -.84 - p * .26, .31), (x - .27, -.84 - p * .26, .31)], edge, .012)
        line('GPU %d | right trace %d' % (rank, p),
             [(x + .27, -.84 - p * .26, .31), (x + .77, -.84 - p * .26, .31)], edge, .012)
    label('GPU %d | name' % rank, 'GPU %d' % rank, (x, -2.28, .04), .24, ink)

for i in range(8):
    # Ranks 0..3 own early blocks 1..4 and their mirror late blocks 8..5.
    rank = i if i < 4 else 7 - i
    side = -.60 if i < 4 else .60
    source = (-4.56 + i * 1.30, 1.32, .30)
    destination = (rank_xs[rank] + side, -1.18, .43)
    material = blue if i < 4 else rust
    block = cube('Sequence block %d' % (i + 1), source, (1.16, .72, .24), material, .065)
    numeral = label('Sequence block %d | number' % (i + 1), str(i + 1),
                    (source[0], source[1], source[2] + .13), .27, white)
    for o, z_offset in ((block, 0), (numeral, .13)):
        o.keyframe_insert(data_path='location', frame=1)
        o.keyframe_insert(data_path='location', frame=30)
        # Lift each slice off the source ribbon before fanning into mirror pairs.
        o.location = (source[0], source[1], source[2] + .40 + z_offset)
        o.keyframe_insert(data_path='location', frame=50)
        o.location = (destination[0], destination[1], destination[2] + z_offset)
        o.keyframe_insert(data_path='location', frame=104)
        o.keyframe_insert(data_path='location', frame=144)

line('Legend | early', [(-3.40, -2.75, .04), (-2.75, -2.75, .04)], blue, .09)
label('Legend | early label', 'EARLY', (-2.61, -2.75, .04), .17, ink, 'LEFT')
line('Legend | late', [(.02, -2.75, .04), (.67, -2.75, .04)], rust, .09)
label('Legend | late label', 'LATE', (.82, -2.75, .04), .17, ink, 'LEFT')
overlay('Parallel | key idea', 'Later causal queries can see more history. Pairing early and late helps balance work.',
        -7.25, -3.87, .18, ink)
overlay('Parallel | disclaimer', 'Conceptual example: 8 slices on 4 ranks.', -7.25, -4.17, .16, ink)

scene.frame_set(1)
output = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else str(Path(__file__).resolve().parents[1] / 'output')
save('parallelism', output)
