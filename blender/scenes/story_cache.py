"""Chapter 1: a shared prefix cache as an inference workshop archive.

The repeated input tiles represent tokens; the teal bundles represent *computed*
KV state, not text or a cached answer. This illustrates the production shared
cache described in doc/inference_deployment_qa.md, not a bundled storage
service in the open release. The number of tiles is illustrative.
"""
import os
import sys
import bpy

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from scene_core import setup, mat, cube, line, label, overlay, save


def group(name, xyz):
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    obj.location = xyz
    return obj


def component(parent, name, offset, size, material, bevel=.04):
    obj = cube(name, offset, size, material, bevel)
    obj.parent = parent
    return obj


def move(obj, keys):
    for frame, xyz in keys:
        obj.location = xyz
        obj.keyframe_insert(data_path='location', frame=frame)


def during(objects, start, end=240):
    for obj in objects if isinstance(objects, list) else [objects]:
        for frame, hidden in [(1, start > 1), (max(1, start - 1), start > 1), (start, False), (end, False), (min(241, end + 1), True)]:
            obj.hide_render = hidden
            obj.hide_viewport = hidden
            obj.keyframe_insert(data_path='hide_render', frame=frame)
            obj.keyframe_insert(data_path='hide_viewport', frame=frame)


def phase(name, text, start, end, ink):
    o = overlay(name, text, -7.15, -3.48, .32, ink)
    during(o, start, end)


def token(name, x, y, material, mark):
    p = group(name, (x, y, .30))
    parts = [component(p, name + ' / paper', (0, 0, 0), (.54, .76, .19), material),
             component(p, name + ' / stripe', (0, .18, .115), (.33, .05, .028), mark, .01),
             component(p, name + ' / line 1', (0, -.01, .115), (.30, .024, .028), mark, .01),
             component(p, name + ' / line 2', (-.045, -.15, .115), (.21, .024, .028), mark, .01)]
    return p, parts


def state(name, x, y, z, teal, pale):
    p = group(name, (x, y, z))
    parts = [component(p, name + ' / computed block', (0, 0, 0), (.60, .46, .20), teal),
             component(p, name + ' / binding', (0, 0, .115), (.50, .065, .025), pale, .01)]
    return p, parts


def build(out):
    scene = setup('01 / The shared archive', 'A repeated prefix can reuse its prepared KV state', frames=240)
    scene.cycles.samples = 12
    ink = mat('story | ink', '#182D43')
    muted = mat('story | muted ink', '#58716E')
    navy = mat('story | machine navy', '#1E3851')
    navy_light = mat('story | machine edges', '#365B6D')
    teal = mat('story | cached state', '#258F83')
    teal_light = mat('story | archive highlights', '#A8DDD0')
    amber = mat('story | new work', '#E6A443')
    cream = mat('story | token paper', '#FFF8EA')
    stone = mat('story | stage stone', '#E8DCC5')
    track = mat('story | track', '#A9B4A7')

    cube('workshop / raised platform', (0, 0, -.12), (14.1, 5.5, .24), stone, .12)
    cube('matching desk', (-4.15, -.28, .025), (4.5, 1.55, .10), cream, .08)
    cube('prefill / footing', (-.30, .20, .08), (2.55, 2.18, .26), navy, .10)
    cube('prefill / processor body', (-.30, .20, .65), (2.25, 1.75, 1.08), navy, .14)
    cube('prefill / top panel', (-.30, .20, 1.23), (1.95, 1.45, .08), navy_light, .06)
    for i in range(5):
        cube('prefill / panel groove %d' % i, (-.98 + i*.34, .20, 1.285), (.16, .78, .025), teal_light, .01)
    # Open-front drawers evoke a shared store rather than a local GPU buffer.
    cube('archive / plinth', (4.32, .25, .10), (3.15, 2.30, .28), navy, .10)
    cube('archive / cabinet', (4.32, .25, .81), (2.88, 2.04, 1.25), navy, .12)
    cube('archive / roof', (4.32, .25, 1.48), (3.02, 2.18, .12), navy_light, .05)
    for row in range(2):
        for col in range(3):
            x = 3.53 + col * .79
            cube('archive / drawer %d %d' % (row, col), (x, -.80, .51 + row*.53), (.66, .09, .40), teal, .04)
            cube('archive / drawer label %d %d' % (row, col), (x, -.86, .54 + row*.53), (.26, .035, .055), teal_light, .02)

    # Fine track seams help the viewer follow objects from left to right.
    line('track / request', [(-6.27, -.28, .095), (-1.72, -.28, .095)], track, .018)
    line('track / state', [(1.05, .22, .10), (2.73, .22, .10)], track, .022)
    forward_arrows = [line('track / save arrow 1', [(2.73,.22,.11),(2.40,.43,.11)], teal, .028),
                      line('track / save arrow 2', [(2.73,.22,.11),(2.40,.01,.11)], teal, .028)]
    during(forward_arrows, 1, 89)
    reverse_arrows = [line('track / fetch arrow 1', [(1.05,.22,.11),(1.38,.43,.11)], teal, .028),
                      line('track / fetch arrow 2', [(1.05,.22,.11),(1.38,.01,.11)], teal, .028)]
    during(reverse_arrows, 90, 240)
    label('station / request', 'REQUEST', (-4.45, -1.53, .14), .25, ink)
    label('station / prefill', 'PREFILL', (-.30, -1.53, .14), .25, ink)
    label('station / cache', 'SHARED KV ARCHIVE', (4.32, -1.53, .14), .25, ink)
    label('legend / teal', 'TEAL = COMPUTED KV STATE', (-4.50, 2.08, .14), .19, muted)
    phase('phase / first', 'FIRST REQUEST  /  prepare the prefix and save its state', 1, 89, ink)
    phase('phase / match', 'NEXT REQUEST  /  match the same prefix', 90, 156, ink)
    phase('phase / reuse', 'REUSE  /  load matched state; process the new suffix', 157, 240, ink)

    # First request: four schematic token tiles are processed, then four KV
    # bundles travel to storage. They are deliberately different objects.
    for i in range(4):
        start = (-6.35 + i*.62, -.27, .31)
        p, parts = token('first prefix token %d' % (i+1), *start[:2], cream, navy_light)
        arrival = 51 + (3-i)*6
        move(p, [(1, start), (18, start), (arrival, (-1.15, -.27, .31))])
        during(parts, 1, arrival-1)
        q, pieces = state('saved prefix KV %d' % (i+1), -.85 + i*.38, .18, 1.40, teal, teal_light)
        depart = 52 + i*5
        move(q, [(depart, (-.85+i*.38, .18, 1.40)), (depart+22, (3.65+i*.45, .25, 1.60))])
        during(pieces, depart, depart + 21)

    # Second request: matched prefix goes to matching (not through prefill),
    # then the archive returns KV. The amber suffix goes to the processor.
    for i in range(4):
        start = (-6.25 + i*.58, -.25, .31)
        p, parts = token('repeated prefix token %d' % (i+1), *start[:2], cream, navy_light)
        move(p, [(91, start), (112, start), (150, (start[0]+2.0, -.25, .31))])
        during(parts, 90, 149)
        q, pieces = state('fetched prefix KV %d' % (i+1), 3.65+i*.45, .30, 1.60, teal, teal_light)
        depart = 130 + i*8
        move(q, [(depart, (3.65+i*.45, .30, 1.60)), (depart+39, (-.85+i*.38, .25, 1.40))])
        during(pieces, depart, depart + 38)
    p, parts = token('new suffix token', -3.85, -.25, amber, ink)
    move(p, [(90, (-3.85, -.25, .31)), (112, (-3.85, -.25, .31)),
             (150, (-1.85, -.25, .31)), (160, (-1.85, -.25, .31)), (190, (-.65, -.25, .50))])
    during(parts, 90, 189)
    for i in range(3):
        o = cube('new computation / pulse %d' % i, (-.64+i*.34, .2, 1.30), (.22, .70, .045), amber, .02)
        during(o, 183+i*4, 240)
    overlay('footer / illustrative', 'Illustrative request · storage is part of DeepSeek’s production system', -7.15, -3.92, .20, muted)
    scene.frame_set(1)
    save('story-cache', out)


if __name__ == '__main__':
    output = sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else os.path.join(os.path.dirname(os.path.dirname(__file__)), 'output')
    build(os.path.abspath(output))
