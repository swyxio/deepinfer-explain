"""Render the six module scenes, encode MP4s, and create their combined film.

The Blender binary and output directory are positional arguments; renders use
isolated temporary directories so a failure never replaces a published asset.
"""
import concurrent.futures
import shutil
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
NAMES=['story-cache','story-replay','story-experts','story-dspark','story-overlap','story-system']
blender=Path(sys.argv[1]).resolve()
out=Path(sys.argv[2]).resolve()
out.mkdir(parents=True,exist_ok=True)


def render(name):
    with tempfile.TemporaryDirectory(prefix='deepinfer-frames-') as temp:
        frames=Path(temp)
        with open(frames/'blender.log','w') as log:
            subprocess.run([str(blender),'--background',str(out/(name+'.blend')),
                '--python',str(ROOT/'blender/render_module_stories.py'),'--',str(frames)],
                check=True,stdout=log,stderr=subprocess.STDOUT)
        video=out/(name+'.mp4')
        subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-framerate','24',
            '-i',str(frames/'frame-%04d.png'),'-c:v','libx264','-crf','18','-pix_fmt','yuv420p',
            '-movflags','+faststart',str(video)],check=True)
        subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss','1',
            '-i',str(video),'-frames:v','1','-q:v','2',str(out/(name+'.jpg'))],check=True)
    print('Rendered',name,flush=True)


with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
    list(executor.map(render,NAMES))

with tempfile.TemporaryDirectory(prefix='deepinfer-combine-') as temp:
    concat=Path(temp)/'concat.txt'
    concat.write_text(''.join("file '"+str(out/(n+'.mp4')).replace("'","'\\''")+"'\n" for n in NAMES))
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0',
        '-i',str(concat),'-c','copy','-movflags','+faststart',str(out/'story-full.mp4')],check=True)
with zipfile.ZipFile(out/'workshop-scenes.zip','w',zipfile.ZIP_DEFLATED) as archive:
    for name in NAMES:
        archive.write(out/(name+'.blend'),name+'.blend')
    archive.write(ROOT/'blender/README.md','README.md')
    archive.write(ROOT/'blender/licenses/APACHE-2.0.txt','licenses/APACHE-2.0.txt')
    archive.write(ROOT/'blender/fonts/OFL.txt','fonts/OFL.txt')
print('Built combined film and editable scene archive',flush=True)
