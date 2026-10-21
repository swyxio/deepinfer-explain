"""Build editable, source-synchronized DeepInfer module animations.

The source excerpts come from the repository's pinned source snapshots; a source
location is printed beside every excerpt. Each chapter has four 96-frame beats.
Run from the repository root:
  Blender -b --python blender/build_module_stories.py -- OUTPUT_DIRECTORY
"""
import json
import os
import sys
import textwrap
from pathlib import Path

import bpy

ROOT = Path(__file__).resolve().parents[1]
SOURCES = json.loads((ROOT / 'public/source-data.json').read_text())
PEERS = json.loads((ROOT / 'public/peer-source-data.json').read_text())
FONT = str(ROOT / 'blender/fonts/IBMPlexMono-Regular.ttf')


def deep(path, lines, fragments=None):
    return {'path': path, 'lines': lines, 'fragments': fragments or {}, 'origin': 'DEEPINFER SOURCE'}


def docs(lines, fragments):
    return {'path': 'doc/inference_deployment_qa.md', 'lines': lines, 'fragments': fragments, 'origin': 'DEEPSEEK PRODUCTION Q&A'}


def peer(key, lines):
    obj = PEERS[key]
    return {'path': obj['path'], 'lines': lines, 'origin': obj['system'].upper() + ' SOURCE', 'peer': key}


Q = 'doc/inference_deployment_qa.md'
W = 'deepinfer/worker/worker.py'
P = 'deepinfer/model_executor/eplb/policy.py'
D = 'deepinfer/model_executor/layers/tilelang_ops/schedule_mtp_varlen.py'
S = 'csrc/engine/scheduler.hpp'
E = 'deepinfer/engine/llm_engine.py'
C = 'csrc/engine/block_manager.hpp'
R = 'csrc/engine/input_metadata/prepare_tensor_input_v4.cpp'
L = 'deepinfer/entrypoints/llm.py'

# Diagram examples are explicitly labeled illustrative; source text itself is
# selected directly from public/source-data.json and peer-source-data.json.
CHAPTERS = [
    {'id':'story-cache','title':'PREFIX CACHE / THE DATA PATH','beats':[
        {'title':'Match before routing','desc':'The entrypoint checks prefix metadata before selecting a prefill worker.',
         'nodes':[('REQUEST','A B C + D'),('HASH-CHAIN MATCH','A B C already cached'),('ROUTE','send matched length to prefill')],
         'example':'EXAMPLE  /  3 cached blocks + 1 new block',
         'src':docs([157,157], {0:'hash-chain prefix match over metadata only',1:'hit length has to be computed before routing'})},
        {'title':'Fetch and swap in KV','desc':'A separate process fetches KV; the engine swaps layers into HBM.',
         'nodes':[('3FS','read matched KV blocks'),('HOST SHARED MEMORY','fetch asynchronously'),('GPU HBM','GDR swap-in per layer')],
         'example':'FLOW  /  3FS  →  host  →  GPU',
         'src':docs([157,157], {0:'moving the KV cache from 3FS into host shared memory',1:'per-layer H2D (host-to-device) transfers with forward computation'})},
        {'title':'Allocate and release blocks','desc':'The released engine tracks local block ownership by reference count.',
         'nodes':[('FREE LIST','pop a block for allocation'),('PIN BLOCK','share: refcount 1 → 2'),('RELEASE TWICE','refcount 2 → 1 → 0; free')],
         'example':'REFCOUNTS  /  1 → 2 → 1 → 0',
         'src':deep(C,[83,84,92,98,100,101])},
        {'title':'Compare prefix lookup','desc':'vLLM finds the longest hit from request block hashes.',
         'nodes':[('DEEPSEEK PRODUCTION','metadata hash-chain match'),('vLLM','block hashes → longest hit'),('SGLANG','radix tree prefix match')],
         'example':'SGLANG  /  radix_cache.py : 411',
         'src':peer('cache-vllm-lookup',[295,297,298,299])},
    ]},
    {'id':'story-replay','title':'SWA / BOUNDED REPLAY','beats':[
        {'title':'Block hit, SWA miss','desc':'The block KV determines the hit; missing SWA forces one-block backoff.',
         'nodes':[('BLOCK KV','matched prefix: 1,024 tokens'),('SWA STATE','missing for the recent window'),('HIT POLICY','back off by one 128-token block')],
         'example':'EXAMPLE  /  1,024 − 128 = 896',
         'src':docs([191,191],{0:'if the SWA KV cache misses, back off by one block and recompute',1:'otherwise it is L1 − 128'})},
        {'title':'Replay the recent edge','desc':'Reuse block KV and recompute the last 128 tokens of the hit prefix.',
         'nodes':[('PREFIX 0–896','reuse existing block KV'),('TOKENS 896–1,024','rebuild SWA with replay'),('NEW SUFFIX','continue prefill')],
         'example':'EXAMPLE  /  replay 128 tokens',
         'src':docs([185,185],{0:'the last 128 tokens of the hit prefix are recomputed',1:'the block KV cache is reused as-is'})},
        {'title':'Clamp the attention window','desc':'valid_start prevents attention from reading invalid SWA slots.',
         'nodes':[('WINDOW BOUND','position − window + 1'),('REPLAY BOUND','max with valid_start'),('VISIBLE RANGE','clamp to [0, position + 1]')],
         'example':'EXAMPLE  /  max(900, 896, 896) = 900',
         'src':deep(R,[149,150,155])},
        {'title':'Compare vLLM replay','desc':'vLLM also marks a bounded prefix replay when the window is missing.',
         'nodes':[('WINDOW LOADED','no replay needed'),('WINDOW MISSING','min(configured replay, hit)'),('REPLAY START','hit length − replay length')],
         'example':'vLLM  /  replay is implemented in scheduler.py',
         'src':peer('replay-vllm-mark',[3205,3207,3208,3210,3211,3212])},
    ]},
    {'id':'story-experts','title':'MOE / EXPERT REPLICAS','beats':[
        {'title':'Map logical to physical experts','desc':'The policy initializes mappings and a copy count for every expert.',
         'nodes':[('LOAD HISTORY','A: 12   B: 4   C: 2'),('LOGICAL EXPERTS','A, B, C start with one copy'),('PHYSICAL SLOTS','one extra slot available')],
         'example':'ILLUSTRATIVE  /  one layer, one load sample',
         'src':deep(P,[90,97,102,103])},
        {'title':'Choose a replica','desc':'Score the load per copy and choose the replica that reduces peak load.',
         'nodes':[('CURRENT LOAD','A: 12   B: 4   C: 2'),('TRY REPLICATING A','12 / 2 = 6 per copy'),('CHOSEN REPLICA','A lowers peak from 12 to 6')],
         'example':'ILLUSTRATIVE  /  [12, 4, 2] → [6, 4, 2, 6]',
         'src':deep(P,[110,111,112,117])},
        {'title':'Place replicas across ranks','desc':'The greedy policy evaluates candidate ranks and chooses the lowest score.',
         'nodes':[('CANDIDATE RANKS','add expert load to each rank'),('CAPACITY','mask ranks that are full'),('PLACEMENT','choose lowest peak-load score')],
         'example':'POLICY  /  candidate scores → selected rank',
         'src':deep(P,[58,59,60,62,63,65])},
        {'title':'Compare vLLM EPLB','desc':'vLLM also computes per-copy load and populates replica mappings.',
         'nodes':[('DEEPINFER','evaluate peak over load history'),('vLLM','choose max weight / copy count'),('BOTH','logical experts → physical slots')],
         'example':'vLLM  /  default.py  ·  replica policy',
         'src':peer('experts-vllm-replicate',[96,97,98,99,100])},
    ]},
    {'id':'story-dspark','title':'DSPARK / VERIFY A BUDGET','beats':[
        {'title':'Remap confidence to the batch','desc':'Map previous-step confidence into the current sequence order.',
         'nodes':[('PREVIOUS CONFIDENCE A','[.9, .8, .7]'),('PREVIOUS CONFIDENCE B','[.8, .4, .9]'),('REMAP TO CURRENT','fresh sequences get zero confidence')],
         'example':'INPUT  /  2 sequences; 3 draft positions',
         'src':deep(D,[57,60,62,65])},
        {'title':'Compute prefix survival','desc':'Multiply probabilities along each draft prefix.',
         'nodes':[('A CONFIDENCE','[.9, .8, .7]'),('CUMULATIVE PRODUCT','[.9, .72, .504]'),('B SURVIVAL','[.8, .32, .288]')],
         'example':'A THIRD DRAFT  /  .9 × .8 × .7 = .504',
         'src':deep(D,[67,68])},
        {'title':'Rank and distribute extra work','desc':'Rank all candidate positions, then add wins to one base token.',
         'nodes':[('TOTAL Q = 5','2 base tokens + 3 extra'),('TOP 3 SURVIVAL','A .9, B .8, A .72'),('QUERY LENGTHS','A: 1 + 2 = 3   B: 1 + 1 = 2')],
         'example':'OUTPUT  /  query lengths [3, 2]',
         'src':deep(D,[72,85,95,98])},
        {'title':'Compare vLLM selection','desc':'vLLM also ranks survival scores and counts each request’s wins.',
         'nodes':[('CUMPROD','score each draft prefix'),('GLOBAL TOP-K','allocate the draft budget'),('COUNT WINNERS','per-request verification length')],
         'example':'vLLM  /  adaptive_verification.py',
         'src':peer('dspark-vllm-budget',[69,70,71,72])},
    ]},
    {'id':'story-overlap','title':'SCHEDULER / CPU–GPU OVERLAP','beats':[
        {'title':'Schedule and launch forward','desc':'The engine schedules a batch; the worker launches the current forward.',
         'nodes':[('CPU SCHEDULER','select the next batch'),('MODEL RUNNER','launch current forward'),('GPU','execute batch N')],
         'example':'ENGINE  /  llm_engine.py : 881–885',
         'src':deep(W,[120,121,122,123,124])},
        {'title':'Process the previous step','desc':'The worker post-processes the saved previous result after launching forward.',
         'nodes':[('CURRENT STEP','forward has been launched'),('PREVIOUS STEP','consume prev_step_state'),('OUTPUTS','commit results ready for CPU')],
         'example':'PIPELINE  /  current forward + previous result',
         'src':deep(W,[143,144])},
        {'title':'Sample and defer','desc':'Sample the current step; decode can defer its post-processing.',
         'nodes':[('SAMPLE','select output for current step'),('PROMPT / NO OVERLAP','post-process immediately'),('OVERLAPPED DECODE','save current state for next step')],
         'example':'STATE  /  curr_step_state → prev_step_state',
         'src':deep(W,[183,184,185,186,187])},
        {'title':'Compare SGLang overlap','desc':'SGLang launches a batch and processes the prior result from a queue.',
         'nodes':[('SGLANG RUN_BATCH','launch current batch'),('RESULT QUEUE','append the current result'),('PREVIOUS BATCH','pop and process')],
         'example':'SGLANG  /  scheduler.py : 2057–2070',
         'src':peer('overlap-sglang-previous',[2067,2068,2069,2070])},
    ]},
    {'id':'story-system','title':'END TO END / THE ENGINE LOOP','beats':[
        {'title':'Add a request','desc':'The offline API adds each request and then drives the engine loop.',
         'nodes':[('LLM.GENERATE','accept prompts or token IDs'),('_ADD_REQUEST','enqueue each sequence'),('_RUN_ENGINE','advance until completion')],
         'example':'ENTRYPOINT  /  deepinfer/entrypoints/llm.py',
         'src':deep(L,[129,130,131,135,142])},
        {'title':'Choose prefill or decode','desc':'The native scheduler branches on the engine type.',
         'nodes':[('PROMPT ENGINE','schedule prefill'),('COMPLETION ENGINE','schedule decode'),('NORMAL ENGINE','coordinate prompt or decode')],
         'example':'BRANCH  /  scheduler.hpp : 288–295',
         'src':deep(S,[288,289,291,292,294,295])},
        {'title':'Connect the mechanisms','desc':'Cache state and expert placement feed forward; sampling feeds the next step.',
         'nodes':[('CACHE + SWA REPLAY','block KV + rebuilt SWA → attention'),('ATTENTION / MOE','forward uses placed expert replicas'),('SAMPLE + DSPARK','confidence + overlap → next step')],
         'example':'WORKER  /  forward → post-process → sample',
         'src':deep(W,[121,122,123,124])},
        {'title':'Compare the vLLM loop','desc':'vLLM schedules and dispatches a batch through its model executor.',
         'nodes':[('SCHEDULER','schedule token work'),('MODEL EXECUTOR','execute model asynchronously'),('OUTPUT','collect model result and sample')],
         'example':'vLLM  /  v1/engine/core.py',
         'src':peer('system-vllm-execute',[651,652,658,659,660])},
    ]},
]


def material(name, value):
    color = value.lstrip('#')
    rgb = [int(color[i:i+2],16)/255 for i in (0,2,4)]
    linear = tuple(v/12.92 if v <= 0.04045 else ((v+0.055)/1.055)**2.4 for v in rgb) + (1,)
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.diffuse_color = linear
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    em = nt.nodes.new('ShaderNodeEmission')
    em.inputs['Color'].default_value = linear
    nt.links.new(em.outputs[0],out.inputs['Surface'])
    return m


def rectangle(name,x,y,w,h,color,z=0.0):
    bpy.ops.mesh.primitive_plane_add(size=1, location=(x,y,z))
    obj=bpy.context.object
    obj.name=name
    obj.scale=(w,h,1)
    obj.data.materials.append(color)
    return obj


def label(name,content,x,y,size,color,align='LEFT',font=None,z=.2):
    curve=bpy.data.curves.new(name,'FONT')
    curve.body=content
    curve.size=size
    curve.align_x=align
    curve.align_y='CENTER'
    if font is not None: curve.font=font
    ob=bpy.data.objects.new(name,curve)
    bpy.context.collection.objects.link(ob)
    ob.location=(x,y,z)
    ob.data.materials.append(color)
    return ob


def hide_outside(objects, start, end):
    for obj in objects:
        for frame, hidden in ((1,start>1),(max(start-1,1),start>1),(start,False),(end,False),(min(end+1,385),True)):
            obj.hide_render=hidden
            obj.hide_viewport=hidden
            obj.keyframe_insert(data_path='hide_render',frame=frame)
            obj.keyframe_insert(data_path='hide_viewport',frame=frame)


def source_lines(source):
    if 'peer' in source:
        entry=PEERS[source['peer']]
        return [(n,entry['lines'][n-entry['start']].lstrip()) for n in source['lines']]
    raw=SOURCES[source['path']].splitlines()
    result=[]
    for idx,n in enumerate(source['lines']):
        line=raw[n-1]
        if idx in source['fragments']:
            fragment=source['fragments'][idx]
            assert fragment in line, (source['path'],n,fragment)
            line='… '+fragment+' …'
        else:
            line=line.lstrip()
            # Preserve the code while marking comments omitted for readability.
            # The bundled monospaced font does not contain the source's CJK glyphs.
            if any(ord(char) > 127 for char in line):
                for marker in (' //', '  #'):
                    if marker in line:
                        line=line.split(marker,1)[0]+marker+' …'
                        break
            if len(line)>82 and '  #' in line:
                line=line.split('  #',1)[0]+'  # …'
        result.append((n,line))
    return result


def path_lines(path):
    parts=path.split('/')
    lines=[]
    current=''
    for part in parts:
        item=(current+'/' if current else '')+part
        if len(item)>47 and current:
            lines.append(current+'/')
            current=part
        else:
            current=item
    if current: lines.append(current)
    return lines[-3:]


def build(chapter,outdir):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene=bpy.context.scene
    scene.name=chapter['title']
    scene.render.engine='BLENDER_EEVEE'
    scene.render.use_sequencer=False
    scene.render.use_compositing=False
    scene.eevee.taa_render_samples=8
    scene.render.resolution_x=1280
    scene.render.resolution_y=720
    scene.render.resolution_percentage=100
    scene.frame_start=1
    scene.frame_end=384
    scene.render.fps=24
    scene.render.image_settings.file_format='PNG'
    scene.render.film_transparent=False
    scene.world=bpy.data.worlds.new('World')
    scene.world.color=(0,0,0)
    scene.view_settings.view_transform='Standard'
    # Orthographic top-down camera: every label remains editable text.
    bpy.ops.object.camera_add(location=(0,0,20))
    camera=bpy.context.object
    camera.name='Camera / module walk-through'
    camera.data.type='ORTHO'
    camera.data.ortho_scale=16
    scene.camera=camera
    font=bpy.data.fonts.load(FONT)
    bg=material('Canvas / ink','#0b1727')
    panel=material('Card / slate','#14273c')
    inner=material('Node / blue','#1c344d')
    code=material('Code / midnight','#0b1929')
    rail=material('Rail / muted','#3b5866')
    ink=material('Text / light','#edf5f6')
    muted=material('Text / muted','#a9c0cd')
    teal=material('Accent / teal','#5ce0c4')
    amber=material('Accent / amber','#f6bf75')
    strip=material('Code / highlight','#22433f')
    active=material('Node / active','#235650')
    rectangle('Canvas',0,0,16,9,bg,-.1)
    label('Series','DEEPINFER   /   SOURCE WALKTHROUGH',-7.25,4.05,.20,teal,font=font)
    label('Chapter title',chapter['title'],-7.25,3.63,.38,ink,font=font)
    rectangle('Diagram panel',-3.60,-.35,7.20,6.05,panel,-.02)
    rectangle('Code panel',3.80,-.35,7.00,6.05,code,-.02)
    label('Diagram label','MODULE FLOW',-7.05,2.44,.17,muted,font=font)
    label('Code label','SOURCE AT THIS STEP',.48,2.44,.17,muted,font=font)
    # Timeline establishes exactly 4 seconds per highlighted phase.
    for i in range(4):
        x=-5.68+i*3.85
        rectangle('Progress / track %d'%i,x,-4.02,3.55,.055,rail,0)
        label('Progress / number %d'%i,'0%d'%(i+1),x-1.72,-3.78,.16,muted,font=font)
    for index,beat in enumerate(chapter['beats']):
        start=1+index*96
        end=start+95
        objs=[]
        objs.append(label('Beat %d / title'%index,beat['title'],-7.0,2.03,.28,ink,font=font))
        wrapped=textwrap.wrap(beat['desc'],width=46)
        for j,line in enumerate(wrapped[:2]):
            objs.append(label('Beat %d / desc %d'%(index,j),line,-7.0,1.66-j*.24,.18,muted,font=font))
        objs.append(label('Beat %d / count'%index,'%d / 4'%(index+1),7.22,3.63,.22,teal,'RIGHT',font))
        # Vertical rails are meaningful within a flow; the colored packet moves
        # along the three cards as the related state advances.
        ys=[.92,-.12,-1.16]
        objs.append(rectangle('Beat %d / rail'%index,-6.72,-.12,.045,2.06,rail,0))
        for i,((node,detail),y) in enumerate(zip(beat['nodes'],ys)):
            objs.append(rectangle('Beat %d / node %d'%(index,i),-3.79,y,5.40,.83,inner,0))
            highlight=rectangle('Beat %d / active node %d'%(index,i),-3.79,y,5.40,.83,active,.02)
            hide_outside([highlight], start + i*32, min(end, start + (i+1)*32 - 1))
            objs.append(label('Beat %d / node title %d'%(index,i),node,-6.28,y+.15,.21,teal,font=font))
            objs.append(label('Beat %d / node detail %d'%(index,i),detail,-6.28,y-.17,.20,ink,font=font))
        objs.append(label('Beat %d / example'%index,beat['example'],-7.0,-2.52,.19,amber,font=font))
        # A packet visibly travels across the module pipeline on every beat.
        dot=rectangle('Beat %d / moving packet'%index,-6.72,ys[0],.20,.20,teal,.10)
        for f,y in ((start+8,ys[0]),(start+42,ys[1]),(start+78,ys[2]),(end,ys[2])):
            dot.location.y=y
            dot.keyframe_insert(data_path='location',frame=f)
        objs.append(dot)
        x=-5.68+index*3.85
        objs.append(rectangle('Beat %d / progress'%index,x,-4.02,3.55,.07,teal,.1))
        source=beat['src']
        objs.append(label('Beat %d / origin'%index,source['origin'],.48,2.02,.19,amber,font=font))
        paths=path_lines(source['path'])
        for j,line in enumerate(paths):
            objs.append(label('Beat %d / path %d'%(index,j),line,.48,1.69-j*.24,.19,muted,font=font))
        y=1.69-len(paths)*.24-.28
        for n,line in source_lines(source):
            wrapped=textwrap.wrap(line,width=48,break_long_words=True,break_on_hyphens=False,replace_whitespace=False,drop_whitespace=False) or ['']
            for j,fragment in enumerate(wrapped):
                if y < -3.05:
                    raise RuntimeError('Source excerpt does not fit: '+chapter['id']+' '+beat['title'])
                objs.append(rectangle('Beat %d / code highlight'%index,3.81,y,6.85,.35,strip,0))
                objs.append(label('Beat %d / line'%index,str(n) if j==0 else '↳',.50,y,.18,teal,font=font))
                objs.append(label('Beat %d / code'%index,fragment,1.02,y,.21,ink,font=font))
                y-=.38
        hide_outside(objs,start,end)
    scene.frame_set(1)
    bpy.ops.file.pack_all()
    bpy.ops.wm.save_as_mainfile(filepath=str(outdir/(chapter['id']+'.blend')))


if __name__=='__main__':
    args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
    outdir=Path(args[0] if args else ROOT/'public/blender').resolve()
    outdir.mkdir(parents=True,exist_ok=True)
    ids=set(args[1:])
    manifest = {'fps':24, 'phaseFrames':96, 'chapters':[]}
    for chapter in CHAPTERS:
        beats=[]
        for beat in chapter['beats']:
            source=beat['src']
            data={'path':source['path'], 'lines':list(dict.fromkeys(source['lines']))}
            if 'peer' in source: data['peerId']=source['peer']
            beats.append({'title':beat['title'], 'source':data})
        manifest['chapters'].append({'id':chapter['id'], 'beats':beats})
    (outdir/'module-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    for chapter in CHAPTERS:
        if not ids or chapter['id'] in ids:
            build(chapter,outdir)
