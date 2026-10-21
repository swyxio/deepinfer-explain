"""Illustrative FP4 groups in expert weights and KV; generated as editable geometry."""
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import bpy
from scene_core import setup, mat, cube, label, overlay, save

scene = setup('The precision budget', 'FP4 is used selectively; groups carry their own scale.')
ink = mat('Ink | navy', '#233953')
orange = mat('Expert | rust', '#C86345')
blue = mat('Main KV | blue', '#3977A8')
teal = mat('Indexer | teal', '#4C988A')
paper = mat('Card | white', '#FCFAF4')
scale_color = mat('Scale | gold', '#D9A85B')
dark = mat('Cabinet edge', '#6B8194', metallic=0.2)

panels = [
    (-4.65, 'ROUTED EXPERTS', 'MXFP4  |  32 VALUES', 8, 4, orange),
    (0.00, 'MAIN KV', 'FP4  |  16 VALUES', 4, 4, blue),
    (4.65, 'INDEXER KV', 'MXFP4  |  32 VALUES', 8, 4, teal),
]
for cx, title, subtitle, cols, rows, color in panels:
    cube(title + ' | plinth', (cx, -0.1, 0), (3.55, 4.3, 0.14), paper, 0.10)
    label(title + ' | title', title, (cx, 1.45, 0.09), 0.34, ink)
    label(title + ' | format', subtitle, (cx, 1.07, 0.09), 0.24, ink)
    # A single group is shown with its true number of abstract values.
    cube(title + ' | tray', (cx, -0.12, 0.13), (2.9, 1.8, 0.18), dark, 0.08)
    for row in range(rows):
        for col in range(cols):
            x = cx + (col - (cols - 1) / 2) * (0.31 if cols == 8 else 0.46)
            y = 0.42 - row * 0.36
            tile = cube(f'{title} | value {row * cols + col + 1:02d}', (x, y, 0.32), (0.27, 0.27, 0.25), color, 0.035)
            tile.keyframe_insert('location', frame=1)
            tile.keyframe_insert('scale', frame=1)
            # Animate the abstract values packing together: explanatory, not a measured ratio.
            tile.location.x = cx + (x - cx) * 0.68
            tile.location.y = -0.12 + (y + 0.12) * 0.78
            tile.scale = (0.65, 0.75, 0.75)
            tile.keyframe_insert('location', frame=100)
            tile.keyframe_insert('scale', frame=100)
            tile.keyframe_insert('location', frame=144)
            tile.keyframe_insert('scale', frame=144)
    cube(title + ' | scale marker', (cx - 0.85, -1.37, 0.16), (0.28, 0.28, 0.2), scale_color, 0.04)
    label(title + ' | scale label', 'GROUP SCALE', (cx - 0.55, -1.37, 0.10), 0.24, ink, align='LEFT')

overlay('Footnote | caution', 'Illustrative encoding, not a measurement. Other model components are omitted.', -7.25, -4.0, 0.25, ink)
output_dir = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else str(Path(__file__).resolve().parents[1] / 'output')
save('precision', output_dir)
