"""Chapter 2: approximate SWA replay after a production prefix-cache hit.

Production encoder case: retained block KV is reused unchanged. If the local
SWA state is missing, the last 128 tokens of the hit prefix are replayed to
reconstruct it approximately; those replayed tokens are not a new user suffix.
The four amber tiles depict a group of tokens, not four of the 128 tokens.
"""
import os
import sys
import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from scene_core import setup, mat, cube, line, label, overlay, save
from story_cache import group, component, move, during, phase, token, state


def build(out):
    scene = setup('02 / Rebuild the recent window', 'When local SWA state is missing, replay only the recent edge', frames=240)
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
    # Same cabinet and machine as chapter 1, re-arranged for the cutaway.
    cube('archive / plinth', (-5.22, .45, .10), (2.55, 2.20, .28), navy, .10)
    cube('archive / cabinet', (-5.22, .45, .81), (2.29, 1.94, 1.25), navy, .12)
    cube('archive / roof', (-5.22, .45, 1.48), (2.42, 2.08, .12), navy_light, .05)
    for row in range(2):
        for col in range(3):
            x = -5.84 + col*.62
            cube('archive / drawer %d %d' % (row, col), (x, -.54, .51+row*.53), (.52, .09, .40), teal, .035)
            cube('archive / drawer label %d %d' % (row, col), (x, -.60, .54+row*.53), (.22, .035, .055), teal_light, .02)
    cube('prefill / footing', (.1, .45, .08), (2.4, 2.08, .26), navy, .10)
    cube('prefill / processor body', (.1, .45, .65), (2.10, 1.72, 1.08), navy, .14)
    cube('prefill / top panel', (.1, .45, 1.23), (1.85, 1.42, .08), navy_light, .06)
    for i in range(5):
        cube('prefill / panel groove %d' % i, (-.58 + i*.34, .45, 1.285), (.16, .78, .025), teal_light, .01)
    # A local tray represents the recent per-instance SWA state, distinct from
    # the archive, not a second persistent storage cabinet.
    cube('local window / base', (4.65, .45, .12), (3.15, 1.65, .20), navy, .08)
    cube('local window / cavity', (4.65, .45, .235), (2.80, 1.28, .04), cream, .05)
    line('track / archived blocks', [(-3.88, .43, .13), (-1.05, .43, .13)], teal, .025)
    line('track / replay result', [(1.30, .43, .13), (3.05, .43, .13)], amber, .025)
    label('station / archive', 'BLOCK KV', (-5.22, -1.42, .15), .25, ink)
    label('station / prefill', 'PREFILL', (.10, -1.42, .15), .25, ink)
    label('station / recent', 'LOCAL SWA WINDOW', (4.65, -1.42, .15), .25, ink)
    label('detail / archived', 'RETAINED', (-5.22, -1.77, .15), .19, muted)
    label('detail / schematic', 'RECENT TOKENS OF HIT PREFIX', (-.30, 2.00, .15), .19, muted)
    phase('phase / cache hit', 'BLOCK KV HIT  /  keep the archived state', 1, 63, ink)
    phase('phase / miss', 'LOCAL SWA MISS  /  the recent window is unavailable', 64, 105, ink)
    phase('phase / replay', 'BOUNDED REPLAY  /  recompute the last 128 prefix tokens', 106, 187, ink)
    phase('phase / continue', 'CONTINUE  /  use retained block KV and approximate SWA', 188, 240, ink)
    overlay('footer / scope', 'Encoder miss path · blocks are schematic; rebuilt SWA is approximate', -7.15, -3.92, .20, muted)

    # At the hit, block KV is retrieved without recomputing or overwriting it.
    for i in range(4):
        p, parts = state('retained block KV %d' % (i+1), -5.2, .45, 1.6, teal, teal_light)
        depart = 20 + i*8
        move(p, [(depart, (-5.2, .45, 1.6)), (depart+37, (-.18+i*.18, .45, 1.42))])
        during(parts, depart, depart+36)

    # Blank tray plus dotted rim says this cache isn't available locally.
    missing = []
    for i in range(7):
        x = 3.55 + i*.37
        missing.append(cube('local window / missing mark %d' % i, (x, .45, .27), (.21, .065, .035), navy_light, .015))
    missing_label = label('local window / miss', 'MISSING', (4.65, .85, .28), .25, ink)
    missing.append(missing_label)
    during(missing, 1, 177)

    # The four tiles collectively stand for the last 128 input tokens of the
    # cache hit. Replay reconstructs SWA; it doesn't regenerate the block KV.
    for i in range(4):
        start = (-2.65+i*.67, 1.74, .34)
        p, parts = token('recent hit prefix / group %d' % (i+1), *start[:2], amber, ink)
        depart = 112+i*9
        move(p, [(79, start), (depart, start), (depart+35, (.15, .45, 1.38))])
        during(parts, 79, depart+34)
    approx = overlay('replay / bounded value', '128 TOKENS', 3.10, 2.82, .34, ink)
    during(approx, 105, 240)
    for i in range(4):
        p, parts = state('rebuilt approximate SWA %d' % (i+1), .20, .45, 1.40, teal, amber)
        depart = 155+i*7
        end = (3.74+i*.60, .45, .38)
        move(p, [(depart, (.20,.45,1.40)), (depart+28,end), (240,end)])
        during(parts, depart, 240)
    restored = label('local window / approximate', 'APPROXIMATE', (4.65, .95, .28), .19, ink)
    during(restored, 184, 240)

    # A later amber tile is the uncached suffix, distinct from the replayed
    # hit-prefix tiles above.
    p, parts = token('new suffix / after replay', -3.5, -.80, amber, ink)
    move(p, [(180, (-3.5,-.80,.31)), (202, (-3.5,-.80,.31)), (228, (-.5,-.15,.52))])
    during(parts, 180, 227)
    suffix = label('new suffix / legend', 'NEW SUFFIX', (-3.50, -1.20, .15), .18, muted)
    during(suffix, 180, 227)
    scene.frame_set(1)
    save('story-replay', out)


if __name__ == '__main__':
    output = sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else os.path.join(os.path.dirname(os.path.dirname(__file__)), 'output')
    build(os.path.abspath(output))
