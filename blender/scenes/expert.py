"""Editable DeepInfer MoE load-balancing diorama.

Illustrative, not a trace or benchmark. The router chooses logical experts;
EPLB maps logical experts onto physical placements and may replicate hot ones.
Source: deepinfer/model_executor/eplb/policy.py, doc/inference_deployment_qa.md.
"""
import os
import sys
import math

import bpy

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from scene_core import setup, mat, cube, sphere, line, label, overlay, save


def hold_until(obj, reveal):
    """Keep mesh/text hidden, then reveal. Constant keys avoid ghosting."""
    for frame, hidden in ((1, True), (reveal - 1, True), (reveal, False)):
        obj.hide_render = hidden
        obj.hide_viewport = hidden
        obj.keyframe_insert(data_path='hide_render', frame=frame)
        obj.keyframe_insert(data_path='hide_viewport', frame=frame)


def travel(obj, positions):
    for frame, position in positions:
        obj.location = position
        obj.keyframe_insert(data_path='location', frame=frame)


def text_mat(name, color):
    # Typography is self-lit so it stays legible on the strongly lit stage.
    rgb = [int(color[i:i+2], 16) / 255 for i in (1, 3, 5)]
    rgb = [v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in rgb]
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    nodes.clear()
    emission = nodes.new('ShaderNodeEmission')
    emission.inputs['Color'].default_value = (*rgb, 1)
    output = nodes.new('ShaderNodeOutputMaterial')
    material.node_tree.links.new(emission.outputs['Emission'], output.inputs['Surface'])
    return material


def build(output_dir):
    setup('Expert traffic jam', 'One logical expert can have multiple physical copies', frames=144)
    dark = mat('ink', '#182E40')
    type_ink = text_mat('text | ink', '#162E41')
    muted = text_mat('text | secondary', '#3D5A60')
    cream = mat('porcelain', '#EADCC0')
    pale = mat('tile', '#F7F1E6')
    blue = mat('hot expert blue', '#286DB8', metallic=0.12)
    blue_light = mat('hot tokens', '#59A7E3', metallic=0.15)
    green = mat('expert green', '#438F72', metallic=0.12)
    orange = mat('expert ochre', '#DB8350', metallic=0.12)
    gold = mat('router gold', '#E9BA6C', metallic=0.15)
    rail = mat('rail neutral', '#B0B6A9')

    # A low platform and physical objects invite the viewer to read the
    # routes as a tangible machine, rather than as flat dashboard widgets.
    cube('machine plinth', (0, 0, -0.12), (13.3, 6.0, .25), cream, 0.12)
    cube('router base', (-3.25, 0, .34), (1.45, 1.25, .68), dark, 0.14)
    cube('router top', (-3.25, 0, .73), (1.27, 1.07, .12), gold, 0.09)
    label('router label', 'ROUTER', (-3.25, 0, .82), .22, type_ink)
    label('input label', 'TOKENS', (-5.65, -1.05, .18), .26, type_ink)
    label('expert heading', 'PHYSICAL EXPERTS', (1.04, 2.70, .18), .26, type_ink)
    label('output label', 'OUTPUT', (5.8, -.65, .18), .26, type_ink)

    rows = [('A', 1.65, blue), ('B', .55, green), ('C', -.55, orange)]
    for name, y, color in rows:
        # Branch rail: a real curve with volume, not a flattened texture.
        line('incoming branch '+name, [(-2.5, 0, .13), (-1.8, y, .13), (.10, y, .13)], color, .038)
        line('outgoing branch '+name, [(1.65, y, .13), (4.25, y, .13), (5.0, 0, .13)], color, .038)
        cube('physical expert '+name, (.87, y, .38), (1.38, .82, .76), color, .12)
        cube('expert inset '+name, (.87, y, .79), (1.13, .61, .08), pale, .055)
        label('expert label '+name, 'EXPERT '+name, (.87, y, .86), .23, type_ink)
        label('gpu label '+name, 'GPU '+str(ord(name)-64), (2.05, y-.28, .18), .20, muted, 'LEFT')
    line('token input', [(-6.0, 0, .13), (-4.0, 0, .13)], rail, .04)
    line('output convergence', [(5.0, 0, .13), (6.15, 0, .13)], rail, .04)

    # Extra physical placement for the SAME logical expert A, revealed after
    # a history of imbalance. This does not create a new logical expert.
    replica_parts = []
    replica_y = -1.80
    replica_parts.append(line('replica inbound route', [(-2.5, 0, .13), (-1.8, replica_y, .13), (.10, replica_y, .13)], blue, .038))
    replica_parts.append(line('replica outbound route', [(1.65, replica_y, .13), (4.25, replica_y, .13), (5.0, 0, .13)], blue, .038))
    replica_parts.append(cube('expert A second physical copy', (.87, replica_y, .38), (1.38, .82, .76), blue, .12))
    replica_parts.append(cube('replica inset', (.87, replica_y, .79), (1.13, .61, .08), pale, .055))
    replica_parts.append(label('replica label', 'EXPERT A', (.87, replica_y, .86), .23, type_ink))
    replica_parts.append(label('replica gpu label', 'GPU 4', (2.05, replica_y-.28, .18), .20, muted, 'LEFT'))
    replica_parts.append(label('replica note', 'SAME LOGICAL EXPERT', (3.0, replica_y-.43, .18), .22, type_ink, 'LEFT'))
    for piece in replica_parts:
        hold_until(piece, 73)

    # Hot demand is deliberately queued before A, then split across two A
    # placements; particles are editorial tokens, not measurements.
    for i in range(7):
        ball = sphere('hot token %02d' % i, (-6.0, 0, .31), .14, blue_light)
        start = 4 + i * 5
        queue_x = .02 - i * .27
        if i < 4:
            travel(ball, [(1,(-6,0,.31)), (start,(-6,0,.31)), (start+18,(-3.25,0,.31)),
                          (44,(queue_x,1.65,.31)), (67,(queue_x,1.65,.31)),
                          (94+i*4,(3.8,1.65,.31)), (112+i*4,(5.7,0,.31)), (144,(6.3,0,.31))])
        else:
            travel(ball, [(1,(-6,0,.31)), (start,(-6,0,.31)), (start+18,(-3.25,0,.31)),
                          (55,(queue_x,1.65,.31)), (71,(queue_x,1.65,.31)),
                          (88+(i-4)*5,(-1.0,replica_y,.31)), (112+(i-4)*5,(3.8,replica_y,.31)),
                          (132+(i-4)*3,(5.7,0,.31)), (144,(6.3,0,.31))])
        hold_until(ball, start)

    for name, y, color, delay in [('B', .55, green, 9), ('C', -.55, orange, 22)]:
        for j in range(2):
            particle = sphere('token '+name+str(j), (-6, 0, .31), .12, color)
            t = delay+j*12
            travel(particle, [(1,(-6,0,.31)), (t,(-6,0,.31)), (t+18,(-3.25,0,.31)),
                              (t+40,(.87,y,.31)), (t+60,(4.25,y,.31)),
                              (t+77,(5.7,0,.31)), (144,(6.3,0,.31))])
            hold_until(particle, t)

    # Subtle, temporary queue cue. The text makes the motivating imbalance
    # explicit without suggesting a reported load value.
    crowd = label('queue cue', 'HOT EXPERT', (-.65, 2.24, .18), .24, type_ink)
    for frame, hidden in [(1, True), (25, True), (26, False), (72, False), (73, True)]:
        crowd.hide_render = hidden
        crowd.keyframe_insert(data_path='hide_render', frame=frame)
    save('expert-traffic', output_dir)


if __name__ == '__main__':
    out = sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else os.path.join(os.path.dirname(os.path.dirname(__file__)), 'output')
    build(os.path.abspath(out))
