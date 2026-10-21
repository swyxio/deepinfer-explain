"""Chapter 3: a hot logical expert gets a second physical placement.

An editorial illustration, not a trace or measured traffic. The router still
selects expert A; EPLB changes A's GPU placement after observing load.
See DeepInfer/doc/inference_deployment_qa.md, Expert-parallel load balancing.
"""
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from scene_core import setup, mat, cube, line, label, overlay, save


def emission(name, color):
    values = [int(color[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    linear = [v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in values]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nodes = m.node_tree.nodes
    nodes.clear()
    source = nodes.new('ShaderNodeEmission')
    source.inputs['Color'].default_value = (*linear, 1)
    out = nodes.new('ShaderNodeOutputMaterial')
    m.node_tree.links.new(source.outputs['Emission'], out.inputs['Surface'])
    return m


def visibility(obj, start, end=241):
    for f, hidden in ((1, True), (start - 1, True), (start, False), (end, True)):
        if f >= 1:
            obj.hide_render = hidden
            obj.hide_viewport = hidden
            obj.keyframe_insert(data_path='hide_render', frame=f)
            obj.keyframe_insert(data_path='hide_viewport', frame=f)


def move(obj, steps):
    for frame, position in steps:
        obj.location = position
        obj.keyframe_insert(data_path='location', frame=frame)


def tile(name, position, paper, accent):
    """A real, editable miniature paper tile with an ink stripe."""
    parent = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(parent)
    parent.location = position
    body = cube(name + ' | paper', (0, 0, 0), (.48, .40, .13), paper, .04)
    body.parent = parent
    body.location = (0, 0, 0)
    strip = cube(name + ' | stripe', (0, 0, 0), (.29, .06, .018), accent, .01)
    strip.parent = parent
    strip.location = (0, 0, .073)
    return parent, (body, strip)


def cue(name, text, start, end, ink):
    caption = overlay(name, text, -7.23, -3.8, .32, ink)
    visibility(caption, start, end)


def build(output_dir):
    setup('03 / A wider workshop', 'Expert parallelism and load balancing', frames=240)
    ink = emission('story 03 | ink', '#172E42')
    muted = emission('story 03 | muted', '#506776')
    white_text = emission('story 03 | white type', '#F8F5ED')
    paper = mat('story 03 | paper tokens', '#FFF9EA')
    stage = mat('story 03 | stage', '#EADFCB')
    machine = mat('story 03 | navy machinery', '#20394B')
    purple = mat('story 03 | expert violet', '#7954AD')
    lavender = mat('story 03 | expert highlight', '#C5A9E7')
    amber = mat('story 03 | incoming work', '#E6A34F')
    blue = mat('story 03 | finished output', '#4894CF')
    faint = mat('story 03 | rails', '#A8A89B')

    cube('workshop plinth', (0, 0, -.12), (13.55, 6.2, .24), stage, .12)
    cube('router body', (-3.75, 0, .43), (1.28, 1.05, .86), machine, .12)
    cube('router top', (-3.75, 0, .88), (1.05, .82, .09), amber, .045)
    label('router name', 'ROUTER', (-3.75, 0, .94), .24, ink)
    label('input name', 'NEW WORK', (-5.7, -1.10, .10), .23, ink)
    label('gpu heading', 'EXPERTS ON DIFFERENT GPUs', (4.35, 2.45, .12), .23, ink)
    label('output heading', 'OUTPUT', (5.72, -1.10, .12), .23, ink)
    line('input rail', [(-6.15, 0, .10), (-4.4, 0, .10)], faint, .027)
    line('output rail', [(2.0, 0, .1), (5.95, 0, .1)], faint, .027)

    # A/B/C stand for different logical experts, not fixed expert counts.
    # The fourth workstation is another physical copy of A.
    lanes = [('A', 1.80), ('B', .60), ('C', -.60), ('A', -1.80)]
    for index, (expert, y) in enumerate(lanes):
        start = 1 if index < 3 else 102
        parts = []
        parts.append(line('route to GPU %d' % (index + 1), [(-3.10, 0, .11), (-2.63, y, .11), (.27, y, .11)], purple, .025))
        parts.append(line('route from GPU %d' % (index + 1), [(1.95, y, .11), (3.85, y, .11), (4.55, 0, .11)], faint, .025))
        parts.append(cube('GPU %d | physical workstation' % (index + 1), (1.10, y, .25), (1.63, .70, .50), machine, .10))
        parts.append(cube('GPU %d | expert top' % (index + 1), (1.10, y, .54), (1.40, .54, .08), purple, .05))
        parts.append(label('GPU %d | expert name' % (index + 1), 'EXPERT ' + expert, (1.10, y, .60), .21, white_text))
        parts.append(label('GPU %d | physical number' % (index + 1), 'GPU ' + str(index + 1), (2.45, y-.22, .13), .20, muted, 'LEFT'))
        if start > 1:
            for part in parts:
                visibility(part, start)
    replica_label = label('copy explanation', 'SAME EXPERT A', (3.0, -2.27, .12), .19, ink, 'LEFT')
    visibility(replica_label, 102)

    # The queued work already chose logical expert A. After a replica is
    # placed, eligible A work is split across its two physical copies.
    for i in range(6):
        launch = 10 + i * 7
        qx = -.48 - i * .52
        token, pieces = tile('A work %d' % i, (-6, 0, .23), paper, amber)
        for part in pieces:
            visibility(part, launch, 151 + i * 6)
        target_y = 1.80 if i % 2 == 0 else -1.80
        end = 150 + i * 6
        move(token, [(1, (-6, 0, .23)), (launch, (-6, 0, .23)),
                     (launch + 18, (-3.75, 0, .23)), (launch + 40, (qx, 1.80, .23)),
                     (117, (qx, 1.80, .23)), (132 + i * 6, (-.15, target_y, .23)),
                     (end, (1.10, target_y, .23))])
        done, done_parts = tile('completed A work %d' % i, (1.30, target_y, .65), paper, blue)
        for part in done_parts:
            visibility(part, end + 1)
        move(done, [(1, (1.30, target_y, .65)), (end + 1, (1.30, target_y, .65)),
                    (end + 14, (3.80, target_y, .23)), (end + 29, (4.95 + .54 * (i % 3), -.36 + .72 * (i // 3), .23)),
                    (240, (4.95 + .54 * (i % 3), -.36 + .72 * (i // 3), .23))])

    # A small amount of unrelated work makes the hot-A imbalance visible.
    for expert, y, launch in [('B', .60, 17), ('C', -.60, 28)]:
        token, pieces = tile(expert + ' work', (-6, 0, .23), paper, lavender)
        for part in pieces:
            visibility(part, launch, launch + 66)
        move(token, [(1, (-6, 0, .23)), (launch, (-6, 0, .23)),
                     (launch + 18, (-3.75, 0, .23)), (launch + 45, (-.15, y, .23)),
                     (launch + 65, (1.1, y, .23))])

    cue('phase 1', 'The router sends work to specialized experts.', 1, 70, ink)
    cue('phase 2', 'When A is popular, its queue grows.', 70, 102, ink)
    cue('phase 3', 'Load balancing places another copy of expert A.', 102, 155, ink)
    cue('phase 4', 'The same expert can now share work across GPUs.', 155, 241, ink)
    save('story-experts', output_dir)


if __name__ == '__main__':
    out = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else os.path.join(os.path.dirname(os.path.dirname(__file__)), 'output')
    build(os.path.abspath(out))
