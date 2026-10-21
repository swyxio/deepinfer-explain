"""Chapter 4: confidence-sensitive speculative verification.

Illustrative single request, not a benchmark or guaranteed acceptance rate.
The production Q&A describes five draft tokens, a confidence head and a
hardware-aware scheduler that selects a variable verification prefix across
requests. This depicts one possible outcome: three accepted, one rejected,
one not selected. The verifier's replacement token is omitted for clarity.
See DeepInfer/doc/inference_deployment_qa.md, Speculative decoding.
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
    parent = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(parent)
    parent.location = position
    body = cube(name + ' | paper', (0, 0, 0), (.46, .45, .13), paper, .04)
    body.parent = parent
    body.location = (0, 0, 0)
    strip = cube(name + ' | stripe', (0, 0, 0), (.29, .07, .018), accent, .01)
    strip.parent = parent
    strip.location = (0, 0, .073)
    return parent, (body, strip)


def cue(name, text, start, end, ink):
    caption = overlay(name, text, -7.23, -3.8, .32, ink)
    visibility(caption, start, end)


def build(output_dir):
    setup('04 / Try ahead, then verify', 'DSpark and confidence-sensitive speculation', frames=240)
    ink = emission('story 04 | ink', '#172E42')
    muted = emission('story 04 | muted', '#506776')
    light_type = emission('story 04 | light type', '#F8F5ED')
    paper = mat('story 04 | paper tokens', '#FFF9EA')
    stage = mat('story 04 | stage', '#EADFCB')
    machine = mat('story 04 | navy machinery', '#20394B')
    amber = mat('story 04 | draft work', '#E6A34F')
    blue = mat('story 04 | accepted output', '#4894CF')
    teal = mat('story 04 | confidence', '#4F9D91')
    faint = mat('story 04 | rail', '#A8A89B')
    reject = mat('story 04 | discarded draft', '#B57458')

    cube('workshop plinth', (0, 0, -.12), (13.55, 6.2, .24), stage, .12)
    line('workbench track', [(-5.85, 0, .10), (5.95, 0, .10)], faint, .027)

    # The smaller draft assistant and larger verifier are physically distinct.
    cube('draft assistant body', (-5.15, 0, .38), (1.55, 1.18, .76), machine, .12)
    cube('draft assistant top', (-5.15, 0, .78), (1.29, .93, .08), amber, .05)
    label('draft assistant label', 'DRAFT', (-5.15, 0, .84), .26, ink)
    label('draft assistant description', 'PROPOSE', (-5.15, -1.05, .13), .22, muted)

    cube('main verifier body', (1.65, 0, .60), (2.03, 1.50, 1.20), machine, .14)
    cube('main verifier top', (1.65, 0, 1.23), (1.78, 1.23, .08), blue, .06)
    label('main verifier label', 'VERIFY', (1.65, 0, 1.30), .28, light_type)
    label('verifier description', 'MAIN MODEL', (1.65, -1.15, .13), .22, muted)
    cube('output landing', (5.05, 0, .10), (2.35, 1.05, .15), paper, .08)
    label('output name', 'ACCEPTED OUTPUT', (5.05, -1.05, .14), .22, ink)

    # Confidence bars are intentionally illustrative rather than numerical.
    bar_xs = [-3.52 + i * .49 for i in range(5)]
    for i, x in enumerate(bar_xs):
        h = [.83, .70, .58, .43, .21][i]
        bar = cube('relative confidence %d' % (i + 1), (x, 1.09, .12), (.14, h, .13), teal if i < 4 else faint, .025)
        visibility(bar, 55, 133)
    confidence_label = label('confidence label', 'ESTIMATED CONFIDENCE', (-2.54, 1.95, .13), .21, ink)
    visibility(confidence_label, 55, 133)

    # Five drafts are made. Four are selected for this invented example; the
    # fifth is unverified, not incorrectly called rejected.
    for i, x in enumerate(bar_xs):
        launch = 12 + i * 5
        token, pieces = tile('draft tile %d' % (i + 1), (-4.32, 0, .23), paper, amber)
        for part in pieces:
            visibility(part, launch, 149 + i * 7 if i < 4 else 241)
        if i < 4:
            into = 148 + i * 7
            move(token, [(1, (-4.32, 0, .23)), (launch, (-4.32, 0, .23)),
                         (launch + 28, (x, 0, .23)), (111, (x, 0, .23)),
                         (into - 18, (-.10, 0, .23)), (into, (1.65, 0, .23))])
        else:
            move(token, [(1, (-4.32, 0, .23)), (launch, (-4.32, 0, .23)),
                         (launch + 28, (x, 0, .23)), (94, (x, 0, .23)),
                         (115, (-1.25, -1.72, .23)), (240, (-1.25, -1.72, .23))])

    note = label('unverified label', 'NOT SELECTED', (-1.50, -2.19, .13), .20, muted)
    visibility(note, 105)
    for i in range(3):
        into = 148 + i * 7
        output, parts = tile('accepted tile %d' % (i + 1), (1.65, 0, 1.30), paper, blue)
        for part in parts:
            visibility(part, into + 9)
        destination = (4.62 + i * .47, 0, .25)
        move(output, [(1, (1.65, 0, 1.30)), (into + 9, (1.65, 0, 1.30)),
                      (into + 34, destination), (240, destination)])

    # This fourth selected token is rejected; no claim that confidence predicts
    # the exact outcome is implied, and no output ratio is asserted.
    discarded, discard_parts = tile('rejected draft', (1.65, 0, 1.30), paper, reject)
    for part in discard_parts:
        visibility(part, 181)
    move(discarded, [(1, (1.65, 0, 1.30)), (181, (1.65, 0, 1.30)),
                     (203, (2.80, -1.75, .23)), (240, (2.80, -1.75, .23))])
    rejected_label = label('rejected label', 'DISAGREES', (2.80, -2.22, .13), .20, ink)
    visibility(rejected_label, 203)

    cue('phase 1', 'A smaller model proposes draft tokens.', 1, 55, ink)
    cue('phase 2', 'Confidence helps choose how many to verify.', 55, 113, ink)
    cue('phase 3', 'The main model checks the chosen prefix.', 113, 182, ink)
    cue('phase 4', 'Accepted tokens continue; a disagreement is discarded.', 182, 241, ink)
    save('story-dspark', output_dir)


if __name__ == '__main__':
    out = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else os.path.join(os.path.dirname(os.path.dirname(__file__)), 'output')
    build(os.path.abspath(out))
