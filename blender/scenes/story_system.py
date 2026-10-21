"""Scene 6: pull back to the conceptual DeepInfer workshop.

This assembles simplified ideas, not an execution trace, accelerator topology,
or measured pipeline. The archive is outside the engine boundary because the
production KV storage service and complete disaggregated serving system are not
fully released. Whether a short SWA replay is needed depends on cache state.
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
    out = nodes.new('ShaderNodeOutputMaterial')
    m.node_tree.links.new(source.outputs[0], out.inputs['Surface'])
    return m


def show_during(obj, start, end):
    for frame, hidden in [(1, start != 1), (max(1, start - 1), start != 1),
                          (start, False), (end, False), (end+1, True)]:
        obj.hide_render = hidden
        obj.keyframe_insert(data_path='hide_render', frame=frame)


def move(obj, positions):
    for frame, pos in positions:
        obj.location = pos
        obj.keyframe_insert(data_path='location', frame=frame)


def packet(name, color, ink, char='', size=.60):
    root = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(root)
    tile = cube(name + ' | paper', (0,0,0), (size,size*.72,.10), color,.045)
    tile.parent = root
    tile.location = (0,0,.07)
    tab = cube(name + ' | tab', (0,0,0), (size*.16,size*.55,.025), ink,.014)
    tab.parent = root
    tab.location = (-size*.36,0,.14)
    if char:
        mark = label(name + ' | mark',char,(0,0,0),size*.38,ink)
        mark.parent = root
        mark.location = (size*.10,0,.14)
    return root


def dashed_segment(name, start, end, material, count=12):
    for i in range(count):
        f1 = i/count
        f2 = (i+.57)/count
        p1 = tuple(start[j]+(end[j]-start[j])*f1 for j in range(3))
        p2 = tuple(start[j]+(end[j]-start[j])*f2 for j in range(3))
        line(name + ' %02d' % i,[p1,p2],material,.025)


def machine(name, x, y, width, depth, color, title, ink):
    base = mat('System | machine', '#1D3045')
    cube(name + ' | base', (x,y,.28),(width,depth,.56),base,.09)
    cube(name + ' | top', (x,y,.59),(width-.14,depth-.14,.09),color,.055)
    label(name + ' | title',title,(x,y,.67),.27,ink)


def anchor_to_zoom(obj, x, y):
    # Parent overlay typography to the camera and scale/translate with the
    # orthographic view: captions hold their on-screen size during zoom out.
    for frame, factor in [(1,15.0/19.5),(72,1.0),(240,1.0)]:
        obj.location = (x*factor,y*factor,-5)
        obj.scale = (factor,factor,factor)
        obj.keyframe_insert(data_path='location',frame=frame)
        obj.keyframe_insert(data_path='scale',frame=frame)


def caption(text, first, last, ink):
    obj = overlay('Stage | '+text,text,-9.0,-4.68,.34,ink)
    anchor_to_zoom(obj,-9.0,-4.68)
    show_during(obj,first,last)


def build(output_dir):
    scene = setup('06  |  THE WHOLE WORKSHOP',
                  'One request brings the five ideas together', frames=240)
    ink = text_material('Type | ink', '#1D3045')
    muted = text_material('Type | muted', '#526875')
    navy = mat('Workshop | navy', '#1D3045')
    paper = mat('Workshop | paper', '#FAF5E9')
    stage = mat('Workshop | table', '#EADFCB')
    track = mat('Workshop | path', '#9EADA9')
    teal = mat('Workshop | archive', '#52A99A')
    pale_teal = mat('Workshop | archive paper', '#CDE7DC')
    amber = mat('Workshop | new work', '#E6AA51')
    purple = mat('Workshop | experts', '#A28DCA')
    pale_purple = mat('Workshop | expert light', '#E6DFF2')
    blue = mat('Workshop | output', '#76ACD2')
    pale_blue = mat('Workshop | output light', '#DCEAF3')

    camera = scene.camera
    camera.data.ortho_scale = 15.0
    camera.data.keyframe_insert(data_path='ortho_scale',frame=1)
    camera.data.ortho_scale = 19.5
    camera.data.keyframe_insert(data_path='ortho_scale',frame=72)
    camera.data.keyframe_insert(data_path='ortho_scale',frame=240)
    for frame,x,y in [(1,-3.3,-10.6),(72,0,-12),(240,0,-12)]:
        camera.location.x = x
        camera.location.y = y
        camera.keyframe_insert(data_path='location',frame=frame)
    for name,x,y in [('Header | title',-9.0,4.63),('Header | context',-9.0,4.04)]:
        anchor_to_zoom(bpy.data.objects[name],x,y)

    cube('Workshop | plinth',(0,0,-.12),(17.85,7.85,.24),stage,.14)
    # Rounded directional routes stay physically connected to the machines.
    line('Request path',[(-7.6,0,.14),(-4.0,0,.14),(-1.1,0,.14),(2.8,0,.14),(7.3,0,.14)],track,.045)
    line('Prefix path',[(-5.0,2.24,.14),(-4.5,1.45,.14),(-4.0,0,.14)],teal,.04)
    line('Replay branch',[(-4.5,1.45,.14),(-3.2,1.2,.14),(-4.0,0,.14)],amber,.025)
    # The compact dashed outline is a conceptual release boundary, not an
    # implementation or hardware mapping; storage remains outside it.
    dashed_segment('Release boundary top',(-5.65,1.85,.12),(5.65,1.85,.12),navy,23)
    dashed_segment('Release boundary bottom',(-5.65,-2.45,.12),(5.65,-2.45,.12),navy,23)
    dashed_segment('Release boundary left',(-5.65,-2.45,.12),(-5.65,1.85,.12),navy,10)
    dashed_segment('Release boundary right',(5.65,-2.45,.12),(5.65,1.85,.12),navy,10)
    label('Engine scope', 'RELEASED ENGINE', (-3.75,-2.12,.20), .24, ink)
    label('Request label','REQUEST',(-7.2,-.63,.19),.27,ink)
    label('Response label','OUTPUT',(7.2,-.63,.19),.27,ink)

    # Archive cabinet: the reused data is separate from the amber new work.
    cube('Shared KV archive | cabinet',(-5.0,2.7,.38),(2.0,1.15,.76),navy,.10)
    cube('Shared KV archive | face',(-5.0,2.7,.81),(1.82,1.0,.10),teal,.055)
    for i in range(4):
        cube('Shared KV archive | dossier %d'%i,(-5.6+i*.4,2.7,.91),(.26,.67,.08),pale_teal,.035)
    label('Archive top label','SHARED KV',(-5.0,2.83,1.01),.24,ink)
    label('Archive scope','PRODUCTION SERVICE',(-5.0,2.47,1.01),.18,ink)

    # Production routing is shown separately from the engine: the full
    # disaggregation service is outside the release. Lines are logical.
    cube('Production routing | base',(2.4,2.7,.28),(2.8,.90,.56),navy,.08)
    cube('Production routing | face',(2.4,2.7,.59),(2.62,.72,.08),paper,.05)
    label('Production routing | name','P/D ROUTING',(2.4,2.83,.66),.23,ink)
    label('Production routing | scope','PRODUCTION SERVICE',(2.4,2.48,.66),.18,ink)
    line('Routing | logical connection',[(2.4,2.21,.14),(2.4,1.99,.14)],track,.022)

    machine('Prefill',-4.0,0,1.65,1.2,amber,'PREFILL',ink)
    # An optional replay work area sits on a path to prefill. It is a
    # conceptual path; bounded replay only occurs for the relevant cache case.
    machine('SWA replay',-3.05,1.20,1.45,.66,pale_teal,'REPLAY',ink)
    label('Replay note','WHEN NEEDED',(-3.05,1.68,.19),.18,muted)
    machine('Router',-1.8,0,1.05,.9,paper,'ROUTE',ink)
    for idx,y in enumerate([.8,0,-.8]):
        machine('Expert '+str(idx+1),-.35,y,1.13,.64,purple,'E'+str(idx+1),ink)
        line('Expert in '+str(idx),[(-1.3,0,.15),(-1.05,y,.15),(-.96,y,.15)],purple,.025)
        line('Expert out '+str(idx),[(.25,y,.15),(.65,y,.15),(1.0,0,.15)],purple,.025)
    label('Expert group label','EXPERTS',(-.35,1.37,.19),.24,ink)
    machine('Draft',2.12,-.72,1.35,.72,pale_purple,'DRAFT',ink)
    machine('Decode verify',3.45,0,1.65,1.2,blue,'VERIFY',ink)
    line('Draft to verify',[(2.12,-.72,.15),(2.8,-.72,.15),(3.45,0,.15)],purple,.032)
    label('Decode label','DECODE / DSPARK',(3.1,1.12,.19),.25,ink)
    # Two short rails underneath depict overlap rather than a claim about
    # physical processor locations or queue implementations.
    label('CPU label','CPU',(1.3,-1.75,.17),.20,muted)
    label('GPU label','GPU',(1.3,-2.05,.17),.20,muted)
    line('CPU work rail',[(1.6,-1.75,.15),(4.8,-1.75,.15)],track,.025)
    line('GPU work rail',[(1.6,-2.05,.15),(4.8,-2.05,.15)],track,.025)
    cpu = cube('CPU | next batch signal',(1.7,-1.75,.22),(.35,.19,.12),amber,.035)
    gpu = cube('GPU | current batch signal',(1.7,-2.05,.22),(.35,.19,.12),blue,.035)
    show_during(cpu,150,240)
    show_during(gpu,150,240)
    move(cpu,[(150,(1.7,-1.75,.22)),(198,(4.5,-1.75,.22)),(240,(4.5,-1.75,.22))])
    move(gpu,[(150,(1.7,-2.05,.22)),(198,(4.0,-2.05,.22)),(240,(4.0,-2.05,.22))])

    prefix = packet('Reused prefix',pale_teal,ink,'K',.54)
    move(prefix,[(1,(-5.0,2.18,.25)),(18,(-5.0,2.18,.25)),(33,(-4.5,1.45,.35)),
                 (47,(-3.05,1.2,.72)),(64,(-4.0,0,.76)),(84,(-4.0,0,.76))])
    for child in prefix.children:
        show_during(child,1,83)
    new = packet('Request dossier',amber,ink,'N',.63)
    move(new,[(1,(-7.3,0,.25)),(26,(-7.3,0,.25)),(56,(-4.0,0,.77)),
              (74,(-4.0,0,.77)),(92,(-1.8,0,.72)),(116,(-.35,0,.76)),
              (135,(1.0,0,.35)),(158,(3.45,0,.77)),(176,(3.45,0,.77)),
              (204,(7.1,0,.25)),(240,(7.1,0,.25))])
    # Split markers show the conceptual fan-out across expert workers.
    for i,y in enumerate([.8,0,-.8]):
        expert = packet('Expert routing '+str(i+1),purple,ink,'',.32)
        move(expert,[(92,(-1.8,0,.73)),(102,(-.35,y,.76)),(116,(-.35,y,.76)),(129,(1.0,0,.35))])
        for child in expert.children:
            show_during(child,92,128)
    for i in range(3):
        candidate = packet('DSpark candidate '+str(i+1),pale_purple,ink,'',.26)
        move(candidate,[(128+i*4,(2.12,-.72,.80)),(150+i*4,(3.45,0,.80)),(169+i*2,(3.45,0,.80))])
        for child in candidate.children:
            show_during(child,128+i*4,169+i*2)
    out = packet('Output token',pale_blue,ink,'',.31)
    move(out,[(173,(3.45,0,.82)),(198,(7.0,0,.30)),(240,(7.0,0,.30))])
    for child in out.children:
        show_during(child,173,240)

    caption('Shared KV returns a matching prefix; sometimes replay restores the recent window.',1,64,ink)
    caption('Prefill handles new work, then routes tokens to expert workers.',65,123,ink)
    caption('In decode, DSpark drafts candidates for the target to verify.',124,173,ink)
    caption('Scheduling overlaps CPU planning with GPU work as output emerges.',174,212,ink)
    caption('A connected system: model + engine + production services.',213,240,ink)
    caveat = overlay('Conceptual disclaimer','CONCEPTUAL PATH  /  NOT A TRACE OR TOPOLOGY',-9.0,-4.13,.20,muted)
    anchor_to_zoom(caveat,-9.0,-4.13)
    scene.frame_set(1)
    save('story-system', output_dir)


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    build(str(Path(args[0]).resolve()) if args else str(Path(__file__).resolve().parents[2] / 'public/blender'))
