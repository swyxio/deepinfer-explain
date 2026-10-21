"""Editable DeepSeek V4 attention diorama.

Illustrative: recent KV stays in a sliding window; compressed older KV is
shown separately, and an index selects older entries on sparse layers.
Selection and compression details vary by layer configuration.
Source: deepinfer/model_executor/models/v4_modules/attn.py.
"""
import os
import sys
import math

import bpy

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from scene_core import setup, mat, cube, sphere, line, label, overlay, save


def visible_from(obj, frame):
    for f, hidden in ((1,True),(frame-1,True),(frame,False)):
        obj.hide_render = hidden
        obj.hide_viewport = hidden
        obj.keyframe_insert(data_path='hide_render', frame=f)
        obj.keyframe_insert(data_path='hide_viewport', frame=f)


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
    setup('Near and far attention', 'Detailed recent context and compressed older context', frames=144)
    ink = text_mat('text | ink', '#162E41')
    muted = text_mat('text | secondary', '#3D5A60')
    stone = mat('stone', '#EADDC5')
    white = mat('paper', '#F8F3E8')
    blue = mat('older compressed', '#5588AE', metallic=.08)
    blue_light = mat('compressed tops', '#B6D7E4')
    green = mat('recent context', '#47977C', metallic=.08)
    green_light = mat('recent tops', '#C2E1C8')
    amber = mat('selection highlight', '#E8A45C', metallic=.15)
    rail = mat('time arrow', '#8FA099')

    cube('attention base', (0, 0, -.12), (13.2, 5.75, .24), stone, .12)
    # The left row is compacted visual bundles, not one-to-one tokens.
    cube('older region', (-3.15, .0, .05), (5.9, 2.3, .10), white, .10)
    cube('recent region', (3.15, .0, .05), (5.9, 2.3, .10), white, .10)
    label('older heading', 'OLDER CONTEXT', (-3.15, 1.65, .18), .28, ink)
    label('older subheading', 'COMPRESSED KV', (-3.15, 1.29, .18), .21, muted)
    label('recent heading', 'RECENT CONTEXT', (3.15, 1.65, .18), .28, ink)
    label('recent subheading', 'SLIDING WINDOW', (3.15, 1.29, .18), .21, muted)

    old_x = [-5.50, -4.68, -3.86, -3.04, -2.22, -1.40, -.58]
    for i, x in enumerate(old_x):
        cube('compressed KV %02d' % i, (x, 0, .31), (.62,.85,.48), blue, .065)
        cube('compressed top %02d' % i, (x, 0, .58), (.52,.74,.06), blue_light, .04)
        # Each short seam reads as a compressed bundle rather than a word.
        for j in [-1, 0, 1]:
            line('bundle %02d seam %d' % (i,j), [(x-.20,j*.15,.62),(x+.20,j*.15,.62)], blue, .012)

    # Detailed nearby positions are drawn as individual upright pieces.
    for i in range(9):
        x = .42 + i*.63
        cube('recent KV %02d' % i, (x, 0, .43), (.46,.85,.73), green, .055)
        cube('recent cap %02d' % i, (x, 0, .82), (.38,.75,.05), green_light, .035)
        line('recent mark %02d' % i, [(x-.11,0,.85),(x+.11,0,.85)], green, .014)

    line('chronology', [(-5.8,-1.64,.14),(5.8,-1.64,.14)], rail, .022)
    line('arrow head upper', [(5.8,-1.64,.14),(5.50,-1.45,.14)], rail, .022)
    line('arrow head lower', [(5.8,-1.64,.14),(5.50,-1.83,.14)], rail, .022)
    label('earlier', 'EARLIER', (-5.8,-2.03,.18), .20, muted, 'LEFT')
    label('now', 'NOW', (5.8,-2.03,.18), .20, muted, 'RIGHT')

    # A moving halo is the sparse indexer scanning older context. Its path
    # is an explanatory device, not a claim about a literal sequential scan.
    bpy.ops.mesh.primitive_torus_add(major_radius=.48, minor_radius=.045, major_segments=48, minor_segments=8, location=(old_x[0],0,.75))
    halo=bpy.context.object
    halo.name='index selection halo (illustrative)'
    halo.data.materials.append(amber)
    for frame, x in [(1,old_x[0]),(20,old_x[0]),(40,old_x[2]),(58,old_x[4]),(76,old_x[6]),(90,old_x[4]),(144,old_x[4])]:
        halo.location = (x,0,.75)
        halo.keyframe_insert(data_path='location', frame=frame)
    indexer = label('sparse indexer label', 'INDEX SELECTS', (-3.15,-1.15,.18), .23, ink)
    label('index scope', 'SPARSE LAYERS', (-3.15,-1.43,.18), .20, muted)

    # Mark selected older blocks in turn. The check-like bars are separate
    # 3D geometry, so they remain editable independently of the block.
    for i, reveal in [(1,46),(4,84)]:
        x=old_x[i]
        marker=cube('selected block %02d' % i, (x,0,.68), (.59,.82,.08), amber, .035)
        visible_from(marker,reveal)
        beacon=sphere('selection beacon %02d' % i, (x,0,.88), .10, amber)
        visible_from(beacon,reveal)
    save('near-far-attention',output_dir)


if __name__ == '__main__':
    out=sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else os.path.join(os.path.dirname(os.path.dirname(__file__)), 'output')
    build(os.path.abspath(out))
