"""A single editable DSpark budget animation, modeled on the material study.

Build with:
  Blender -b --python blender/build_dspark_study.py -- OUTPUT_DIR

Six illustrative cumulative survival scores are ranked across two requests.
The scene selects work for target verification; it does not depict acceptance.
"""
import sys
from pathlib import Path

import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
from scene_core import mat, cube, label, overlay, sphere, line


ROOT = Path(__file__).resolve().parents[1]
FRAMES = 528


def visible(objects, first=1, last=FRAMES):
    for obj in objects:
        states = [(1, first > 1)]
        if first > 1:
            states += [(first - 1, True), (first, False)]
        if last < FRAMES:
            states += [(last, False), (last + 1, True)]
        for frame, hidden in states:
            obj.hide_render = obj.hide_viewport = hidden
            obj.keyframe_insert(data_path='hide_render', frame=frame)
            obj.keyframe_insert(data_path='hide_viewport', frame=frame)


def move(root, keys):
    for frame, position in keys:
        root.location = position
        root.keyframe_insert(data_path='location', frame=frame)


def scale(root, keys):
    for frame, value in keys:
        root.scale = (value, value, value)
        root.keyframe_insert(data_path='scale', frame=frame)


def colored(name, color, roughness=.75):
    return mat(name, color, roughness=roughness)


def surface_color(material, color, frame):
    rgb = [int(color[i:i+2], 16) / 255 for i in (1, 3, 5)]
    rgba = tuple(v / 12.92 if v <= .04045 else ((v+.055)/1.055)**2.4 for v in rgb) + (1,)
    slot = material.node_tree.nodes['Principled BSDF'].inputs['Base Color']
    slot.default_value = rgba
    slot.keyframe_insert(data_path='default_value', frame=frame)


def attach(root, obj, loc):
    obj.parent = root
    obj.location = loc
    return obj


def tile(name, mark, score, formula, xyz, kind, p):
    root = bpy.data.objects.new('Tile / ' + name, None)
    bpy.context.collection.objects.link(root)
    root.location = xyz
    width = 1.65 if kind == 'base' else 1.88
    fill = colored('Tile / %s / surface' % name, '#e7eeea' if kind == 'base' else '#f2f2ed')
    typography = colored('Tile / %s / ink' % name, '#173e4a')
    edge = p['base_edge'] if kind == 'base' else p['sage']
    parts = [attach(root, cube(name + ' / edge', (0, 0, 0), (width, .92, .15), edge, .075), (0, 0, 0)),
             attach(root, cube(name + ' / face', (0, 0, 0), (width-.05, .87, .10), fill, .065), (0, 0, .09))]
    if kind == 'base':
        parts.append(attach(root, label(name + ' / text', mark, (0,0,0), .25, typography), (0,0,.15)))
    else:
        parts.append(attach(root, label(name + ' / mark', mark, (0,0,0), .27, typography, 'LEFT'), (-.70,.15,.15)))
        parts.append(attach(root, label(name + ' / score', score, (0,0,0), .31, typography, 'RIGHT'), (.70,.15,.15)))
        parts.append(attach(root, label(name + ' / formula', formula, (0,0,0), .19, typography, 'LEFT'), (-.70,-.24,.15)))
    return root, parts, fill, typography


def caption(text, first, last, ink):
    obj = overlay('Caption / ' + text, text, -7.25, -4.23, .30, ink)
    visible([obj], first, last)


def setup():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    s = bpy.context.scene
    s.name = 'DSpark / shared verification budget'
    s.frame_start, s.frame_end, s.render.fps = 1, FRAMES, 24
    s.render.engine = 'BLENDER_EEVEE'
    s.eevee.taa_render_samples = 16
    s.render.use_sequencer = s.render.use_compositing = False
    s.render.resolution_x, s.render.resolution_y, s.render.resolution_percentage = 1280, 720, 100
    s.render.image_settings.file_format = 'PNG'
    s.view_settings.view_transform = 'Standard'
    s.world = bpy.data.worlds.new('Warm daylight')
    s.world.use_nodes = True
    s.world.node_tree.nodes['Background'].inputs['Color'].default_value = (.78,.76,.70,1)
    s.world.node_tree.nodes['Background'].inputs['Strength'].default_value = .53
    p = {
        'paper': colored('Warm paper desk', '#E6D9C9'),
        'board': colored('Porcelain board', '#F2EFE8'),
        'shadow': colored('Board edge', '#C6BAA9'),
        'ink': colored('Typography / navy', '#102C3D'),
        'muted': colored('Typography / slate', '#3B5865'),
        'base_edge': colored('Base / edge', '#CBD7D2'),
        'sage': colored('Draft / edge', '#D4E0DA'),
        'recess': colored('Budget / empty slots', '#CFDBD3'),
        'blue': colored('Target / blue porcelain', '#D8E7EF'),
        'green': colored('Selection / forest green', '#267F6D'),
    }
    cube('Desk', (0,0,-.36), (200,200,.5), p['paper'], 0)
    bpy.ops.object.camera_add(location=(0,-8,27))
    camera = bpy.context.object
    camera.name = 'Camera / paper tableau'
    camera.rotation_euler = (Vector((0,0,0)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
    camera.data.type = 'ORTHO'
    camera.data.ortho_scale = 16.6
    s.camera = camera
    for name, location, energy, size in [('Window',(-5,-5,12),1100,8), ('Bounce',(5,4,10),550,9)]:
        bpy.ops.object.light_add(type='AREA', location=location)
        light=bpy.context.object
        light.name='Light / '+name
        light.data.energy, light.data.size = energy, size
        light.rotation_euler = (Vector((0,0,0)) - light.location).to_track_quat('-Z','Y').to_euler()
    overlay('Title', 'DSpark: one verification budget, two requests', -7.25, 4.10, .43, p['ink'])
    overlay('Subtitle', 'Choose draft positions by cumulative prefix confidence.', -7.25, 3.60, .25, p['muted'])
    return s, p


def build(out):
    s,p=setup()
    # The two boards and shallow recesses are actual ceramic objects, not a
    # composited graphic. Lifted tiles travel between them during the scene.
    cube('Score board / edge', (0,1.31,.00), (14.7,3.35,.20), p['shadow'], .14)
    cube('Score board / porcelain', (0,1.31,.11), (14.7,3.35,.13), p['board'], .14)
    label('Request A', 'REQUEST A', (-6.93,1.91,.20), .25, p['ink'], 'LEFT')
    label('Request B', 'REQUEST B', (-6.93,.57,.20), .25, p['ink'], 'LEFT')
    label('A confidence', '.90 x .80 x .70', (-6.12,1.57,.20), .18, p['muted'])
    label('B confidence', '.80 x .40 x .90', (-6.12,.23,.20), .18, p['muted'])
    label('Score heading', 'LOCAL CONFIDENCE  ->  PREFIX SURVIVAL', (-.25,2.72,.20), .20, p['muted'])
    # A physical mini-chart shows expected prefix survivors, not measured
    # acceptances. Its sequential reveal follows B1 -> B2 -> B3.
    label('Cohort / heading', 'PREDICTED REACH / 1,000', (5.13,2.59,.20), .18, p['muted'])
    cohort=[(3.62,1000,'START',1),(4.60,800,'B1',18),(5.58,320,'B2',37),(6.56,288,'B3',66)]
    for i,(x,n,word,first) in enumerate(cohort):
        height=1.40*n/1000
        bar=cube('Cohort / '+word, (x,.43+height/2,.26), (.57,height,.12), p['green'], .045)
        number=label('Cohort / count '+word, str(n), (x,2.03,.20), .19, p['ink'])
        name=label('Cohort / step '+word, word, (x,.10,.20), .17, p['muted'])
        visible([bar],first,FRAMES)
        visible([number,name],first+(14 if i else 0),FRAMES)
        if i:
            prev_x,prev_n,_,_=cohort[i-1]
            prev_h=1.40*prev_n/1000
            move(bar,[(first,(prev_x,.43+prev_h/2,.26)),(first+14,(x,.43+height/2,.26))])
            for frame,value in [(first,prev_h/height),(first+14,1)]:
                bar.scale.y=value
                bar.keyframe_insert(data_path='scale',frame=frame)
    for x in (-4.52,-2.55,-.42,1.71):
        for y in (1.85,.49):
            cube('Score board / tile well', (x,y,.19), (1.88,.95,.025), p['recess'], .07)

    cube('Budget board / edge', (0,-2.14,.00), (14.7,2.44,.20), p['shadow'], .14)
    cube('Budget board / porcelain', (0,-2.14,.11), (14.7,2.44,.13), p['board'], .14)
    budget_heading = label('Budget heading', 'SHARED BUDGET  /  5 QUERY TOKENS', (-4.77,-1.32,.20), .21, p['ink'], 'LEFT')
    for i,x in enumerate((-5.25,-3.15,-1.05,1.05,3.15)):
        well=cube('Budget / slot %d' % (i+1), (x,-2.15,.20), (1.91,.99,.035), p['recess'], .08)
        visible([well],1,324)
    count = label('Budget / explanation', '2 BASE + 3 DRAFT', (5.65,-2.15,.20), .21, p['muted'])
    visible([count], 1, 324)

    specs = [
        ('A-base','A BASE','','',(-4.52,1.85,.35),'base'),
        ('A1','A1','.90','.90',(-2.55,1.85,.35),'draft'),
        ('A2','A2','.72','.90 x .80',(-.42,1.85,.35),'draft'),
        ('A3','A3','.504','.90 x .80 x .70',(1.71,1.85,.35),'draft'),
        ('B-base','B BASE','','',(-4.52,.49,.35),'base'),
        ('B1','B1','.80','.80',(-2.55,.49,.35),'draft'),
        ('B2','B2','.32','.80 x .40',(-.42,.49,.35),'draft'),
        ('B3','B3','.288','.80 x .40 x .90',(1.71,.49,.35),'draft'),
    ]
    tiles={name:tile(name,mark,score,formula,xyz,kind,p) for name,mark,score,formula,xyz,kind in specs}
    # All five slot allocations are moves of the actual objects. Two bases are
    # reserved first, then A1, B1, A2 are selected in descending score order.
    moves = {
        'A-base': (100,132,(-5.25,-2.15,.35)),
        'B-base': (113,145,(-3.15,-2.15,.35)),
        'A1': (166,195,(-1.05,-2.15,.35)),
        'B1': (214,243,(1.05,-2.15,.35)),
        'A2': (262,291,(3.15,-2.15,.35)),
    }
    grouped={'A-base':(-5.45,-1.85,.35),'A1':(-4.02,-1.85,.35),'A2':(-2.59,-1.85,.35),
             'B-base':(-5.45,-2.89,.35),'B1':(-4.02,-2.89,.35)}
    for name,(first,last,slot) in moves.items():
        root,parts,fill,ink=tiles[name]
        start=tuple(root.location)
        group=grouped[name]
        # Each tile lifts slightly, slides into its slot, and later regroups by
        # request before being passed to the target model.
        move(root, [(1,start),(first,start),(first+7,(start[0],start[1],.55)),
                    (last-7,(slot[0],slot[1],.55)),(last,slot),(324,slot),
                    (371,group),(411,group),
                    (470,(group[0]+7.4,group[1],.55)),
                    (500,(5.25,group[1],.55))])
        scale(root,[(1,1),(324,1),(371,.68),(FRAMES,.68)])
        visible(parts,1,499)
        if name not in ('A-base','B-base'):
            surface_color(fill,'#F2F2ED',last-1)
            surface_color(fill,'#267F6D',last+2)
            surface_color(ink,'#173E4A',last-1)
            surface_color(ink,'#FFFFFF',last+2)

    # Each initial number is a local conditional confidence. After the bead
    # crosses the sequence, later positions flip to cumulative prefix scores.
    # In particular B3's .90 local confidence becomes .288 after .80 x .40.
    for name,local,flip in [('A2','.80',37),('B2','.40',37),('A3','.70',66),('B3','.90',66)]:
        root,parts,fill,ink=tiles[name]
        score=bpy.data.objects[name + ' / score']
        formula=bpy.data.objects[name + ' / formula']
        visible([score,formula],flip,499 if name=='A2' else FRAMES)
        local_obj=attach(root,label(name+' / local score',local,(0,0,0),.31,ink,'RIGHT'),(.70,.15,.15))
        visible([local_obj],1,flip-1)
    dependency=line('Prefix dependency / B', [(-2.55,-.08,.25),(1.71,-.08,.25)], p['green'], .02)
    bead=sphere('Prefix dependency / advancing product',(-2.55,-.08,.30),.09,p['green'])
    visible([dependency,bead],20,96)
    move(bead,[(20,(-2.55,-.08,.30)),(37,(-.42,-.08,.30)),(66,(1.71,-.08,.30)),(96,(1.71,-.08,.30))])
    # The destination appears only after the budget is complete, maintaining
    # the clear five-slot comparison before regrouping begins.
    target=[cube('Target / edge',(5.22,-2.35,.24),(2.55,1.23,.18),p['base_edge'],.12),
            cube('Target / surface',(5.22,-2.35,.35),(2.47,1.14,.12),p['blue'],.10),
            label('Target / title','TARGET MODEL',(5.22,-2.35,.43),.25,p['ink'])]
    visible(target,325,FRAMES)
    visible([budget_heading],1,324)
    result_a=label('Result / A','A = 3',(-6.35,-1.85,.23),.22,p['ink'])
    result_b=label('Result / B','B = 2',(-6.35,-2.89,.23),.22,p['ink'])
    visible([result_a,result_b],325,FRAMES)
    caption('Scores multiply along the prefix: B3 .80 x .40 x .90 = .288.',1,96,p['ink'])
    caption('Reserve one base query for each continuing request.',97,165,p['ink'])
    caption('Highest scores take the 3 remaining slots: .90, .80, .72.',166,324,p['ink'])
    caption('Regroup: A gets 3 query tokens; B gets 2.',325,410,p['ink'])
    caption('The target verifies these prefixes; selection is not acceptance.',411,FRAMES,p['ink'])
    s.frame_set(1)
    out=Path(out)
    out.mkdir(parents=True,exist_ok=True)
    bpy.ops.file.pack_all()
    bpy.ops.wm.save_as_mainfile(filepath=str(out/'03-allocation.blend'))


if __name__ == '__main__':
    args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
    build(args[0] if args else ROOT/'public/blender/dspark-study')
