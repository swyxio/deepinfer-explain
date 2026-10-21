"""Build an editable, progressively revealed DSpark explanation.

The invented two-request example separates a toy CPU budget choice, GPU
allocation, and a separately invented verification outcome. Blender 5.2:
  Blender -b --python blender/build_dspark_study.py -- OUTPUT_DIR
"""
import sys
from pathlib import Path

import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
from scene_core import mat, cube, label, line

ROOT = Path(__file__).resolve().parents[1]
FPS = 15
DURATION = 102
FRAMES = FPS * DURATION


def frame(seconds):
    return max(1, round(seconds * FPS) + 1)


def show(objects, start=0, end=DURATION):
    for obj in objects:
        a, b = frame(start), min(frame(end), FRAMES)
        for tick, hidden in ((1, a > 1), (max(1, a - 1), a > 1), (a, False), (b, False)):
            obj.hide_render = obj.hide_viewport = hidden
            obj.keyframe_insert(data_path='hide_render', frame=tick)
        if b < FRAMES:
            obj.hide_render = obj.hide_viewport = True
            obj.keyframe_insert(data_path='hide_render', frame=b + 1)


def place(obj, keys):
    for seconds, position in keys:
        obj.location = position
        obj.keyframe_insert(data_path='location', frame=frame(seconds))


def change_color(material, color, seconds):
    rgb = [int(color[i:i+2], 16) / 255 for i in (1, 3, 5)]
    rgba = tuple(v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in rgb) + (1,)
    slot = material.node_tree.nodes['Principled BSDF'].inputs['Base Color']
    slot.default_value = rgba
    slot.keyframe_insert(data_path='default_value', frame=frame(seconds))


def slab(name, cx, cy, width, height, material, depth=.10, z=.2, bevel=.045):
    return cube(name, (cx, cy, z), (width, height, depth), material, bevel)


def txt(name, value, x, y, size, ink, align='LEFT', start=0, end=DURATION, z=.35):
    item = label(name, value, (x, y, z), size, ink, align)
    show([item], start, end)
    return item


def stroke(name, points, ink, radius=.022, start=0):
    obj = line(name, [(x, y, .31) for x, y in points], ink, radius)
    show([obj], start)
    return obj


def arrow(name, x1, y1, x2, y2, ink, start=0, radius=.025):
    dx, dy = x2-x1, y2-y1
    length = (dx*dx + dy*dy) ** .5
    ux, uy = dx/length, dy/length
    wing = .16
    stroke(name + ' / shaft', [(x1, y1), (x2, y2)], ink, radius, start)
    stroke(name + ' / head', [(x2 - .25*ux + wing*uy, y2 - .25*uy - wing*ux), (x2, y2),
                              (x2 - .25*ux - wing*uy, y2 - .25*uy + wing*ux)], ink, radius, start)


def ribbon(name, x, y, length, width0, width1, material, start, finish):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata([(0, -width0/2, 0), (length, -width1/2, 0),
                      (length, width1/2, 0), (0, width0/2, 0)], [], [(0, 1, 2, 3)])
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = (x, y, .29)
    obj.data.materials.append(material)
    show([obj], start)
    for sec, scale in ((start, .001), (finish, 1)):
        obj.scale.x = scale
        obj.keyframe_insert(data_path='scale', frame=frame(sec))
    return obj


def card(name, x, y, w, h, fill, ink, top, bottom='', start=0, size=.40):
    root = bpy.data.objects.new(name + ' / group', None)
    bpy.context.collection.objects.link(root)
    root.location = (x, y, .32)
    body = slab(name + ' / paper', 0, 0, w, h, fill, depth=.09, z=0)
    body.parent = root
    body.location = (0, 0, 0)
    first = label(name + ' / label', top, (0, 0, .07), size, ink, 'CENTER')
    first.parent = root
    first.location = (0, .14 if bottom else 0, .08)
    pieces = [body, first]
    if bottom:
        second = label(name + ' / detail', bottom, (0, 0, .07), .26, ink, 'CENTER')
        second.parent = root
        second.location = (0, -.22, .08)
        pieces.append(second)
    show(pieces, start)
    return root, pieces


def title(center, number, heading, sub, sub_start=0):
    txt('section ' + str(number), '%02d  /  %s' % (number, heading), center-7.0, 3.90, .30, P['teal'])
    txt('heading ' + str(number), sub, center-7.0, 3.29, .43, P['ink'], start=sub_start)


def stage(center):
    slab('Page edge %s' % center, center, 0, 15.35, 8.65, P['edge'], depth=.12, z=-.06, bevel=.12)
    slab('Page %s' % center, center, 0, 15.30, 8.60, P['page'], depth=.12, z=.03, bevel=.12)


def setup():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    s = bpy.context.scene
    s.name = 'DSpark / from prefix scores to the decode loop'
    s.frame_start, s.frame_end, s.render.fps = 1, FRAMES, FPS
    s.render.engine = 'BLENDER_EEVEE'
    s.eevee.taa_render_samples = 8
    s.render.use_sequencer = s.render.use_compositing = False
    s.render.resolution_x, s.render.resolution_y, s.render.resolution_percentage = 1280, 720, 100
    s.render.image_settings.file_format = 'PNG'
    s.view_settings.view_transform = 'Standard'
    s.world = bpy.data.worlds.new('Daylight')
    s.world.use_nodes = True
    s.world.node_tree.nodes['Background'].inputs['Color'].default_value = (.79, .79, .75, 1)
    s.world.node_tree.nodes['Background'].inputs['Strength'].default_value = .65
    palette = {
        'desk': '#E7DFD2', 'edge': '#D1CEC3', 'page': '#FAF9F4', 'ink': '#173346',
        'muted': '#56707A', 'teal': '#276E60', 'green': '#338777', 'pale': '#DDECE4',
        'blue': '#DCEAF0', 'blue_dark': '#3F7286', 'track': '#B6CFC2', 'ghost': '#E9EFEB',
        'white': '#FFFFFF', 'gold': '#E7B962', 'amber': '#F6E9CC', 'red': '#9B5744',
    }
    p = {k: mat('Study / ' + k, v, roughness=.9) for k, v in palette.items()}
    slab('Paper ground', 36, 0, 200, 200, p['desk'], depth=.3, z=-.45, bevel=0)
    bpy.ops.object.camera_add(location=(0, 0, 30))
    cam = bpy.context.object
    cam.name = 'Camera / move across one continuous paper'
    cam.rotation_euler = (0, 0, 0)
    cam.data.type = 'ORTHO'
    cam.data.ortho_scale = 16.8
    s.camera = cam
    for sec, x in [(0,0), (22,0), (24,18), (40,18), (42,36), (59,36),
                   (61,54), (81,54), (83,72), (102,72)]:
        cam.location.x = x
        cam.keyframe_insert(data_path='location', frame=frame(sec))
    for center in (0, 18, 36, 54, 72):
        bpy.ops.object.light_add(type='AREA', location=(center-3, -4, 14))
        light = bpy.context.object
        light.name = 'Softbox / %d' % center
        light.data.energy, light.data.size = 1600, 15
        light.rotation_euler = (Vector((center, 0, 0)) - light.location).to_track_quat('-Z', 'Y').to_euler()
    return s, p


def build_prefix():
    c = 0
    title(c, 1, 'PREFIX CONFIDENCE', 'A later draft only helps if earlier drafts survive.', 4)
    txt('speculation introduction', 'A draft proposes tokens for the target to verify together.', c-7.0, 3.29, .43, P['ink'], end=3.9)
    txt('B label', 'REQUEST B  /  LOCAL CONFIDENCE', -6.8, 2.48, .24, P['muted'])
    card('B base', -5.6, 1.73, 2.3, .82, P['blue'], P['ink'], 'base', 'existing query', 0, .36)
    for i, (x, rate) in enumerate([(-2.25, '.80'), (1.15, '.40'), (4.55, '.90')], 1):
        card('B draft %d' % i, x, 1.73, 2.3, .82, P['ghost'], P['ink'], 'B%d' % i, rate + ' local', 0, .36)
    txt('B ribbon label', 'ESTIMATED PREFIX SCORE', -6.8, .86, .22, P['muted'])
    xs = [-6.0, -2.6, .8, 4.2]
    widths = [1.10, .88, .352, .3168]
    for i, (a, b) in enumerate([(4,6.6), (8,10.6), (12,14.6)]):
        ribbon('B ribbon %d' % i, xs[i], .10, 3.4, widths[i], widths[i+1], P['green'], a, b)
    for i, (x, score, when) in enumerate([(-6.0,'1.00',0),(-2.6,'.80',6.6),(.8,'.32',10.6),(4.2,'.288',14.6)]):
        txt('B prefix %d' % i, score, x, -.80, .36, P['teal'], 'CENTER', when)
    txt('B math', 'B3: .80 × .40 × .90 = .288', -6.8, -1.30, .39, P['ink'], start=15)
    txt('B insight', 'A high local score cannot undo a weak earlier step.', -6.8, -1.84, .31, P['muted'], start=15)
    txt('A row label', 'REQUEST A  /  LOCAL .90, .80, .70', -6.8, -2.52, .25, P['muted'], start=17.5)
    for i, (h0, h1) in enumerate([(1,.9),(.9,.72),(.72,.504)]):
        ribbon('A ribbon %d' % i, xs[i], -3.12, 3.4, .55*h0, .55*h1, P['blue_dark'], 17.5+i*.7, 18.2+i*.7)
    for i, (x, score) in enumerate([(-2.6,'.90'),(.8,'.72'),(4.2,'.504')]):
        txt('A prefix %d' % i, score, x, -3.68, .31, P['blue_dark'], 'CENTER', 18.2+i*.7)


def build_budget():
    c = 18
    title(c, 2, 'BUDGET SELECTION', 'How much verification work is worth doing?')
    txt('budget principle', 'CPU estimates generated tokens ÷ (forward + sampler time).', c-6.8, 2.59, .32, P['muted'], start=24)
    txt('budget formula', 'q=5:  (2 + .90 + .80 + .72) ÷ 1.40 ms = 3.16 tokens/ms', c-6.8, 1.78, .35, P['ink'], start=30.2)
    txt('baseline note', '2 expected target outputs  +  predicted accepted drafts', c-6.8, 1.25, .25, P['muted'], start=30.2)
    numbers = [(2, 2/1.3, 1.3), (3, 2.9/1.3, 1.3), (4, 3.7/1.3, 1.3), (5, 4.42/1.4, 1.4),
               (6, 4.924/1.8, 1.8), (7, 5.244/2.4, 2.4), (8, 5.532/2.4, 2.4)]
    base = -1.76
    stroke('budget axis', [(c-6.2,base), (c+6.15,base)], P['track'], .025, 25.0)
    for i, (q, rate, ms) in enumerate(numbers):
        x = c - 5.52 + i*1.84
        height = rate / 3.3 * 2.28
        material = P['green'] if q == 5 else P['pale']
        bar = slab('budget bar %s' % q, x, base+height/2, 1.28, height, material, depth=.08, z=.25)
        start = 25.4+i*.55
        show([bar], start)
        for sec, scale in [(start,.001), (start+.5,1)]:
            bar.scale.y = scale
            bar.location.y = base + height*scale/2
            bar.keyframe_insert(data_path='scale', frame=frame(sec))
            bar.keyframe_insert(data_path='location', frame=frame(sec))
        txt('budget value %s' % q, '%.2f' % rate, x, base+height+.22, .25, P['ink'], 'CENTER', start+.5)
        txt('budget q %s' % q, str(q), x, -2.18, .31, P['ink'], 'CENTER', 25.0)
        txt('budget time %s' % q, '%.2f' % ms, x, -2.65, .24, P['muted'], 'CENTER', 29.5)
    txt('budget q label', 'q', c-6.8, -2.18, .26, P['muted'], start=25)
    txt('budget time label', 'ms', c-6.8, -2.65, .24, P['muted'], start=29.5)
    txt('budget maximum', 'Choose q=5: highest estimated tokens / ms.', c-6.2, -3.24, .32, P['teal'], start=31)
    txt('budget toy note', 'Illustrative times; CPU and GPU scores assumed equal here.', c-6.2, -3.75, .23, P['muted'], start=31)


def build_rank():
    c = 36
    title(c, 3, 'BATCH-WIDE RANKING', 'Two requests share the five-query budget.')
    txt('rank rule', '5 queries  −  2 existing base queries  =  3 draft slots', c-6.8, 2.54, .37, P['ink'], start=42)
    txt('rank A label', 'A', c-6.5, 1.37, .36, P['blue_dark'], start=42.5)
    txt('rank B label', 'B', c-6.5, .10, .36, P['teal'], start=42.5)
    specs = [('A1','.90',c-4.45,1.35), ('A2','.72',c-.75,1.35), ('A3','.504',c+2.95,1.35),
             ('B1','.80',c-4.45,.08), ('B2','.32',c-.75,.08), ('B3','.288',c+2.95,.08)]
    ranked = ['A1','B1','A2','A3','B2','B3']
    moving = []
    for name, score, x, y in specs:
        card('source '+name, x, y, 2.35, .85, P['ghost'], P['muted'], name, score, 47.3, .34)
        fill = mat('Rank chip / '+name, '#EDF1EC', roughness=.9)
        ink = mat('Rank ink / '+name, '#173346', roughness=.9)
        root, pieces = card('rank '+name, x, y, 2.35, .85, fill, ink, name, score, 42.5, .34)
        rank = ranked.index(name)
        xend = c - 5.6 + rank*2.20
        place(root, [(42,(x,y,.32)),(47.2,(x,y,.32)),(51.8,(xend,-1.65,.32))])
        for seconds, value in [(47.2,1), (51.8,.80)]:
            root.scale = (value, value, value)
            root.keyframe_insert(data_path='scale', frame=frame(seconds))
        if rank < 3:
            change_color(fill,'#EDF1EC',51.7); change_color(fill,'#338777',52.1)
            change_color(ink,'#173346',51.7); change_color(ink,'#FFFFFF',52.1)
        moving.append(root)
    txt('rank caption', 'Rank all positions; keep the three highest scores.', c-6.8, -3.30, .30, P['muted'], start=46.5, end=51.5)
    txt('rank winners', 'A wins 2 slots    ·    B wins 1 slot', c-6.7, -2.70, .37, P['teal'], start=52)
    txt('rank caveat', 'The ranking chooses lengths; it does not reorder tokens.', c-6.7, -3.35, .29, P['muted'], start=53)


def build_verification():
    c = 54
    title(c, 4, 'TARGET VERIFICATION', 'Turn the winning scores back into ordered prefixes.')
    txt('verify A', 'A', c-6.7, 2.23, .36, P['blue_dark'], start=61)
    txt('verify B', 'B', c-6.7, 1.16, .36, P['teal'], start=61)
    for request, y, names in [('A',2.18,['base','A1','A2']),('B',1.11,['base','B1'])]:
        for i, word in enumerate(names):
            x=c-5.2+i*1.72
            fill = mat('Verify / '+request+' '+word, '#DCEAF0' if word=='base' else '#DDECE4', roughness=.9)
            ink = mat('Verify ink / '+request+' '+word, '#173346', roughness=.9)
            card('verify '+request+' '+word,x,y,1.48,.72,fill,ink,word,'',61,.30)
            if request == 'A' and word in ('A1', 'A2'):
                when = 68 if word == 'A1' else 72
                change_color(fill, '#DDECE4', when-.2)
                change_color(fill, '#338777' if word == 'A1' else '#9B5744', when+.2)
                change_color(ink, '#173346', when-.2)
                change_color(ink, '#FFFFFF', when+.2)
            if i:
                stroke('prefix coupling '+request+str(i),[(x-.95,y),(x-.77,y)],P['track'],.035,61)
    txt('query lengths', 'A=3   B=2 query inputs', c-6.7, .42, .28, P['muted'], start=62)
    arrow('prefix to target',c+.0,1.55,c+1.0,1.55,P['teal'],62)
    card('target forward', c+2.65, 1.58, 3.0, 1.45, P['blue'], P['ink'], 'TARGET', 'forward + sampling', 62, .35)
    arrow('target to output',c+4.25,1.55,c+4.65,1.55,P['teal'],75)
    card('A emitted output', c+5.75, 1.58, 1.9, .85, P['amber'], P['ink'], 'A1 + new', 'resampled', 75, .25)
    txt('verify rationale', 'Acceptance probability = min(1, target ÷ draft).', c-6.7, -.36, .31, P['ink'], start=64)
    txt('verification example', 'ONE POSSIBLE SAMPLING OUTCOME FOR A', c-6.7, -1.05, .24, P['muted'], start=66)
    txt('A1 calculation', 'A1   target .75 ÷ draft .60 → 1.00;  draw .50 → ACCEPT', c-6.7, -1.68, .31, P['teal'], start=67)
    txt('A2 calculation', 'A2   target .20 ÷ draft .80 → .25;  draw .60 → REJECT', c-6.7, -2.28, .31, P['red'], start=71)
    txt('verify result', 'Emit A1 + a residual-sampled token. B is not shown.', c-6.7, -2.95, .31, P['ink'], start=75)
    txt('verification note', 'The p/q numbers and draws are a separate illustrative example.', c-6.7, -3.55, .23, P['muted'], start=75)


def build_system():
    c = 72
    title(c, 5, 'THE COMPLETE DECODE LOOP', 'Budget, allocate, verify, then draft again.')
    txt('system top note', 'CPU uses older rates; the GPU uses the preceding step’s confidence.', c-6.8, 2.52, .28, P['muted'], start=83)
    centers = [c-5.35,c-1.8,c+1.75,c+5.3]
    descriptions = [('CPU','choose total_q'),('GPU','allocate lengths'),('TARGET','forward'),('SAMPLER','accept / resample')]
    for i, (x, (name, detail)) in enumerate(zip(centers, descriptions)):
        start=84.2+i*1.1
        card('system '+name,x,.88,2.75,1.38,P['blue'] if name in ('CPU','TARGET') else P['pale'],P['ink'],name,detail,start,.36)
        if i:
            arrow('system arrow '+str(i),centers[i-1]+1.43,.88,x-1.43,.88,P['teal'],start)
    txt('CPU detail', 'N−2 rates + timing', centers[0], -.28, .25, P['muted'], 'CENTER', 85)
    txt('GPU detail', 'N−1 confidence', centers[1]+.35, -.28, .25, P['muted'], 'CENTER', 86)
    txt('GPU result', 'A=3, B=2', centers[1]+.35, -.69, .28, P['teal'], 'CENTER', 87)
    card('next MTP',c+4.1,-1.75,3.40,1.10,P['amber'],P['ink'],'MTP DRAFT','next drafts + confidence',89,.31)
    arrow('sampler to mtp',centers[3],.04,centers[3],-.97,P['teal'],89)
    stroke('loop line',[(c+2.35,-1.75),(c-2.75,-1.75),(c-2.75,.19)],P['green'],.03,90)
    stroke('loop head',[(c-2.95,-.07),(c-2.75,.19),(c-2.55,-.07)],P['green'],.03,90)
    txt('loop label', 'confidence for the next step', c+.25, -2.18, .23, P['teal'], 'CENTER', 90)
    txt('system conclusion', 'The scheduler spends limited verification work where predicted return is highest.', c-6.8, -3.25, .31, P['ink'], start=91)


def build(out):
    global P
    scene, P = setup()
    for x in (0,18,36,54,72):
        stage(x)
    build_prefix()
    build_budget()
    build_rank()
    build_verification()
    build_system()
    for obj in bpy.data.objects:
        if obj.type in ('FONT', 'CURVE') or (obj.type == 'MESH' and not obj.name.startswith(('Page ', 'Page edge'))):
            obj.visible_shadow = False
    scene.frame_set(1)
    output = Path(out)
    output.mkdir(parents=True, exist_ok=True)
    bpy.ops.file.pack_all()
    bpy.ops.wm.save_as_mainfile(filepath=str(output / '03-allocation.blend'))


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    build(args[0] if args else ROOT / 'public/blender/dspark-study')
