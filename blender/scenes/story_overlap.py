"""Scene 5: an illustrative CPU/GPU scheduling overlap in the workshop.

The timeline is a teaching device, not a trace, performance claim, or fixed
CPU/GPU synchronization guarantee. DeepInfer credits prior SGLang and
NanoFlow work for zero-overhead CPU/GPU scheduling in its deployment Q&A.
"""
from pathlib import Path
import sys
import bpy

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from scene_core import setup, mat, cube, line, label, overlay, save


def text_material(name, color):
    srgb = [int(color[i:i+2], 16) / 255 for i in (1, 3, 5)]
    rgb = [v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in srgb]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nodes = m.node_tree.nodes
    nodes.clear()
    source = nodes.new('ShaderNodeEmission')
    source.inputs['Color'].default_value = (*rgb, 1)
    source.inputs['Strength'].default_value = 1
    out = nodes.new('ShaderNodeOutputMaterial')
    m.node_tree.links.new(source.outputs[0], out.inputs['Surface'])
    return m


def show_during(obj, start, end):
    for frame, hidden in [(1, start != 1), (max(1, start - 1), start != 1),
                          (start, False), (end, False), (end + 1, True)]:
        obj.hide_render = hidden
        obj.keyframe_insert(data_path='hide_render', frame=frame)


def animate_location(obj, points):
    for frame, loc in points:
        obj.location = loc
        obj.keyframe_insert(data_path='location', frame=frame)


def batch(name, char, paper, ink):
    root = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(root)
    tile = cube(name + ' paper', (0, 0, 0), (.84, .62, .12), paper, .065)
    tile.parent = root
    tile.location = (0, 0, .10)
    cap = cube(name + ' tab', (0, 0, 0), (.20, .48, .04), ink, .025)
    cap.parent = root
    cap.location = (-.28, 0, .18)
    text = label(name + ' mark', char, (0, 0, 0), .34, ink)
    text.parent = root
    text.location = (.14, 0, .18)
    return root


def caption(text, first, last, ink):
    obj = overlay('Timing | ' + text, text, -7.25, -3.88, .35, ink)
    show_during(obj, first, last)


def build(output_dir):
    scene = setup('05  |  KEEP THE GPU FED',
                  'The CPU prepares the next batch while the GPU runs this one', frames=240)
    ink = text_material('Type | ink', '#1D3045')
    muted = text_material('Type | muted', '#5D6D74')
    white = text_material('Type | light', '#F8F3E9')
    navy = mat('Workshop | navy', '#1D3045')
    paper = mat('Workshop | paper', '#FAF5E9')
    beige = mat('Workshop | table', '#E9DDC8')
    track = mat('Workshop | belts', '#D8D3C4')
    amber = mat('Workshop | new work', '#E7A84D')
    blue = mat('Workshop | GPU', '#5594C4')
    teal = mat('Workshop | cached state', '#48A59A')
    grey = mat('Workshop | idle', '#A9B4B3')

    cube('Workshop stage', (0, 0, -.11), (13.35, 6.5, .22), beige, .13)
    # Belts, rollers and parallel brass rails make the lanes recognizable as
    # physical work surfaces, not disconnected cards.
    for y, name in [(1.25, 'CPU'), (-1.25, 'GPU')]:
        cube(name + ' conveyor', (0, y, .03), (10.0, .94, .14), track, .12)
        for side in (-1, 1):
            line(name + ' rail', [(-4.9, y+side*.45, .13), (4.9, y+side*.45, .13)], navy, .025)
        for x in [-4.4,-3.7,-3.0,-2.3,-1.6,-.9,-.2,.5,1.2,1.9,2.6,3.3,4.0,4.7]:
            line(name + ' roller', [(x,y-.37,.115),(x,y+.37,.115)], grey, .017)
    # Benches sit just behind the belts: the dossiers stay visible during
    # the important overlap instead of disappearing under a machine roof.
    for y, name, color in [(1.25,'CPU',amber), (-1.25,'GPU',blue)]:
        cube(name + ' bench', (-.35, y+.64, .25), (1.8,.28,.50), navy,.05)
        cube(name + ' sign', (-.35,y+.64,.54), (1.48,.25,.08), color,.04)
        label(name + ' sign letters', name, (-.35,y+.64,.60), .20, ink)
    label('CPU lane title', 'CPU', (-5.62,1.42,.18), .33, ink)
    label('CPU lane role', 'PLAN', (-5.62,.99,.18), .21, muted)
    label('GPU lane title', 'GPU', (-5.62,-1.03,.18), .33, ink)
    label('GPU lane role', 'RUN', (-5.62,-1.46,.18), .21, muted)
    label('output title', 'DONE', (5.42,-1.24,.18), .23, muted)
    # A transfer path between work surfaces; it is conceptual rather than a
    # literal transfer between physical CPU and GPU worker queues.
    line('transfer path', [(1.1,1.25,.17),(1.9,1.25,.17),(1.9,-1.25,.17),(1.1,-1.25,.17)], teal,.035)
    line('transfer arrow 1', [(1.1,-1.25,.17),(1.40,-1.04,.17)],teal,.035)
    line('transfer arrow 2', [(1.1,-1.25,.17),(1.40,-1.46,.17)],teal,.035)

    a = batch('Batch A', 'A', amber, ink)
    b = batch('Batch B', 'B', paper, ink)
    # Batches start on the CPU lane, move along the conceptual handoff, and
    # remain on the GPU long enough to see B being planned concurrently.
    animate_location(a, [(1,(-4.55,1.25,.19)),(10,(-4.55,1.25,.19)),
                         (35,(-.35,1.25,.19)),(48,(-.35,1.25,.19)),
                         (57,(1.9,1.25,.19)),(68,(1.9,-1.25,.19)),
                         (73,(-.35,-1.25,.19)),(112,(-.35,-1.25,.19)),
                         (128,(4.65,-1.25,.19)),(240,(4.65,-1.25,.19))])
    animate_location(b, [(1,(-4.55,1.25,.19)),(72,(-4.55,1.25,.19)),
                         (101,(-.35,1.25,.19)),(114,(-.35,1.25,.19)),
                         (123,(1.9,1.25,.19)),(134,(1.9,-1.25,.19)),
                         (139,(-.35,-1.25,.19)),(178,(-.35,-1.25,.19)),
                         (195,(3.55,-1.25,.19)),(240,(3.55,-1.25,.19))])
    for child in b.children:
        show_during(child, 69, 240)
    idle = label('GPU waiting indicator', 'WAITING', (2.7,-2.07,.18), .26, muted)
    show_during(idle,1,68)
    busy = label('GPU active indicator', 'RUNNING', (2.7,-2.07,.18), .26, ink)
    show_during(busy,69,194)
    label('timeline legend', 'BATCHES AND TIMING ARE ILLUSTRATIVE', (0,-2.75,.18), .19, muted)
    caption('First, the GPU waits while the CPU prepares batch A.',1,67,ink)
    caption('Now the CPU plans B while the GPU runs A.',68,130,ink)
    caption('Overlapping the two reduces scheduling gaps.',131,240,ink)
    scene.frame_set(1)
    save('story-overlap', output_dir)


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    build(str(Path(args[0]).resolve()) if args else str(Path(__file__).resolve().parents[2] / 'public/blender'))
