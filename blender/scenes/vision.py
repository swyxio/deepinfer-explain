"""An editable, conceptual image-to-model scene.

The processor reserves an image span and separately retains text segments:
deepinfer/ve/multimodal_processor.py:105-163.  A vision encoder produces visual
embeddings for those positions; this is not a picture-to-words conversion.
"""
from pathlib import Path
import sys

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from scene_core import setup, mat, cube, sphere, label, line, overlay, save


scene = setup('How the model sees an image',
              'Visual features and text representations take different paths into the model')
ink = mat('Vision | ink', '#223B53')
blue = mat('Vision | ocean', '#326885')
blue_light = mat('Vision | sky', '#86B3C3')
blue_dark = mat('Vision | dark ocean', '#294C69')
rust = mat('Vision | terracotta', '#CB7152')
gold = mat('Vision | sun', '#E7B65F')
paper = mat('Vision | paper', '#F9F3E7')
white = mat('Vision | porcelain', '#FFFDF7')
edge = mat('Vision | muted blue', '#B9CDD1')

# A 4-by-4 miniature picture has a sun, sky, mountain silhouette and sea.
# Every pixel-patch is an independently editable cube.
cube('Image | picture frame', (-4.95, 0.65, 0.12), (2.58, 2.58, 0.22), white)
cube('Image | inset', (-4.95, 0.65, 0.24), (2.18, 2.18, 0.05), blue_dark, 0.02)
label('Image | caption', 'IMAGE', (-4.95, 2.38, 0.04), 0.25, ink)
label('Image | detail', 'pixels / patches', (-4.95, -0.95, 0.04), 0.19, ink)
# Row 0 is the top of the image (farther from the camera).
picture = [
    [blue_light, blue_light, gold, blue_light],
    [blue_light, blue_dark, blue_dark, blue_light],
    [blue_dark, blue, blue, blue_dark],
    [blue, blue, blue_light, blue],
]

# A tiny landscape makes the original image recognizable before it separates
# into patches. These are meshes, not a baked texture, so they remain editable.
def picture_shape(name, points, material):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata([(x + 4.95, y - .65, z - .43) for x, y, z in points],
                     [], [list(range(len(points)))])
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = (-4.95, .65, .43)
    mesh.materials.append(material)
    return obj

image_shapes = [
    picture_shape('Image | distant mountain', [(-5.86, .18, .43), (-5.28, 1.05, .43),
                  (-4.71, .18, .43)], blue_dark),
    picture_shape('Image | near mountain', [(-5.20, .18, .44), (-4.57, 1.30, .44),
                  (-4.04, .18, .44)], blue),
    sphere('Image | sun', (-4.39, 1.36, .45), .20, gold),
]
image_shapes[-1].scale.z = .12
for obj in image_shapes:
    obj.keyframe_insert(data_path='scale', frame=1)
    obj.keyframe_insert(data_path='scale', frame=20)
    obj.scale = (.001, .001, .001)
    obj.keyframe_insert(data_path='scale', frame=30)

for row in range(4):
    for col in range(4):
        initial = (-4.95 + (col - 1.5) * .49, 0.65 + (1.5 - row) * .49, .33)
        target = (-1.65 + (col - 1.5) * .22, 0.65 + (1.5 - row) * .22, .73)
        tile = cube('Image patch %02d' % (row * 4 + col + 1), initial,
                    (.455, .455, .13), picture[row][col], .025)
        tile.keyframe_insert(data_path='location', frame=1)
        tile.keyframe_insert(data_path='scale', frame=1)
        tile.keyframe_insert(data_path='location', frame=25)
        tile.location = target
        tile.keyframe_insert(data_path='location', frame=62)
        tile.keyframe_insert(data_path='scale', frame=62)
        tile.scale = (.001, .001, .001)
        tile.keyframe_insert(data_path='scale', frame=72)

# The image's own tower encodes the patches into a visual feature sequence.
cube('Encoder | shadow', (-1.65, 0.65, .13), (2.65, 2.14, .25), blue_dark)
cube('Encoder | top', (-1.65, 0.65, .28), (2.46, 1.94, .10), blue)
label('Encoder | heading', 'VISION', (-1.65, 1.16, .35), .27, white)
label('Encoder | subheading', 'ENCODER', (-1.65, .81, .35), .25, white)
label('Encoder | caption', 'image representations', (-1.65, -0.95, .04), .19, ink)

# Model block uses separate visible lanes so the two representations remain distinct.
cube('Model | body', (4.15, .30, .20), (3.72, 2.85, .38), blue_dark)
cube('Model | face', (4.15, .30, .41), (3.48, 2.61, .07), paper)
label('Model | heading', 'MODEL INPUT', (4.15, 1.22, .46), .26, ink)
label('Model | visual lane label', 'VISUAL FEATURES', (4.15, .72, .46), .17, blue_dark)
label('Model | text lane label', 'TEXT TOKENS', (4.15, -.37, .46), .17, rust)
label('Model | caption', 'one multimodal sequence', (4.15, -1.67, .04), .20, ink)

# Visual feature bars emerge only after encoding, then join the image span.
for i in range(5):
    source = (-1.65 + (i - 2) * .32, .30, .76)
    dest = (4.15 + (i - 2) * .37, .28, .56)
    o = cube('Encoded visual feature %d' % (i + 1), source,
             (.27, .58, .18), blue_light if i % 2 == 0 else blue, .035)
    o.scale = (.001, .001, .001)
    o.keyframe_insert(data_path='scale', frame=1)
    o.keyframe_insert(data_path='location', frame=1)
    o.keyframe_insert(data_path='scale', frame=65)
    o.scale = (1, 1, 1)
    o.keyframe_insert(data_path='scale', frame=76)
    o.keyframe_insert(data_path='location', frame=76)
    o.location = dest
    o.keyframe_insert(data_path='location', frame=118)

# Text takes its own route; text blocks never turn into image patches.
label('Text | caption', 'TEXT PROMPT', (-4.95, -1.54, .04), .22, ink)
for i, word in enumerate(('WHAT', 'IS', 'THIS?')):
    source = (-4.95 + (i - 1) * .7, -2.08, .21)
    target = (4.15 + (i - 1) * .74, -.78, .56)
    token = cube('Text token %d' % (i + 1), source, (.62, .48, .16), rust, .04)
    text = label('Text token | ' + word, word, (source[0], source[1], .305), .14, white)
    for o, z_offset in ((token, 0), (text, .095)):
        o.keyframe_insert(data_path='location', frame=1)
        o.keyframe_insert(data_path='location', frame=76)
        o.location = (target[0], target[1], target[2] + z_offset)
        o.keyframe_insert(data_path='location', frame=118)

line('Image path', [(-3.45, .66, .02), (-3.05, .66, .02)], edge, .035)
line('Encoder path', [(-.13, .66, .02), (2.05, .66, .02)], edge, .035)
overlay('Vision | key idea', 'Image patches become visual features; text is tokenized separately.',
        -7.25, -3.84, .20, ink)
overlay('Vision | disclaimer', 'Conceptual: layouts and feature counts are illustrative.',
        -7.25, -4.16, .16, ink)

scene.frame_set(1)
output = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else str(Path(__file__).resolve().parents[1] / 'output')
save('vision', output)
