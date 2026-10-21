# DSpark visual study

One worked example follows the reference allocator in DeepInfer commit `774ce244b87cc0eb8d4b94ab9f5de2ab22049f01`: two continuing sequences share a five-query-token budget. The inputs and scores are illustrative, and use three draft positions rather than the production draft count of five. The top three cumulative scores are A1, B1 and A2; each query length includes one existing base token. Selection allocates work and the target model subsequently decides acceptance.

- [SVG explanation](../public/blender/dspark-study/01-budget.svg)
- [ImageGen visual study](../public/blender/dspark-study/02-imagegen.png)
- [Editable Blender scene](../public/blender/dspark-study/03-allocation.blend) and [animation](../public/blender/dspark-study/03-allocation.mp4)
- [DeepInfer allocation reference](https://github.com/deepseek-ai/DeepInfer/blob/774ce244b87cc0eb8d4b94ab9f5de2ab22049f01/deepinfer/model_executor/layers/tilelang_ops/schedule_mtp_varlen.py#L54-L98), [budget selection](https://github.com/deepseek-ai/DeepInfer/blob/774ce244b87cc0eb8d4b94ab9f5de2ab22049f01/csrc/engine/mtp_varlen.hpp#L228-L265), and [acceptance sampling](https://github.com/deepseek-ai/DeepInfer/blob/774ce244b87cc0eb8d4b94ab9f5de2ab22049f01/deepinfer/model_executor/layers/sampler.py#L427-L480)

## ImageGen prompt

The built-in image generation tool edited a PNG export of the initial SVG with this prompt. The final SVG adds probability bars and a B3 callout:

> Use case: sketch-to-render. Asset type: one art-direction study for an educational Blender animation. Image 1 is the diagram to upgrade, not a source of new concepts. Transform this exact DSpark allocation example into a calm, precise, tactile 3D editorial illustration, as if the diagram were made from simple matte ceramic and paper on a light warm tabletop. Preserve its three-stage reading order, the two rows of three draft pieces, the two base pieces, the shared strip of five slots with the first two reserved and the last three selected, and the target-model verification destination. The winning draft pieces are A1 (0.90), B1 (0.80), and A2 (0.72); do not show them as already accepted. Keep the two rows clearly aligned and selection visually obvious. Match the diagram's restrained dark ink, pale green, deep green, and light blue palette; use soft natural studio light, gentle shadows, almost orthographic viewpoint, ample space, and geometric components that are easy to recreate and animate in Blender. Prioritize legible educational structure over visual spectacle. No futuristic or sci-fi machinery, neon, robots, space themes, code, fake charts, invented numbers, decorative cables, or excessive ornament. Keep any text to the existing concise labels if legible; do not introduce new claims.

The scene models the diagram as editable Blender objects; the generated image is a visual reference, not a source of technical evidence.

[Other diagramming directions](dspark-visual-ideas.md) and a [visual comparison sheet](../public/blender/dspark-study/04-visual-directions.svg) explore ways to show the same example.

## Rebuild

From the repository root, use Blender 5.2 and FFmpeg. The scene builder writes an editable `.blend`; the render uses 8 EEVEE samples and 24 frames per second:

```sh
mkdir -p /tmp/dspark-study-render
blender -b --python blender/build_dspark_study.py -- public/blender/dspark-study
blender -b public/blender/dspark-study/03-allocation.blend \
  -o '/tmp/dspark-study-render/frame-####' -F PNG \
  --python-expr 'import bpy; s=bpy.context.scene; s.render.engine="BLENDER_EEVEE"; s.eevee.taa_render_samples=8; s.render.image_settings.color_mode="RGB"; s.render.image_settings.compression=30; bpy.ops.render.render(animation=True)'
ffmpeg -framerate 24 -i /tmp/dspark-study-render/frame-%04d.png -c:v libx264 -crf 18 -pix_fmt yuv420p -movflags +faststart public/blender/dspark-study/03-allocation.mp4
ffmpeg -ss 1 -i public/blender/dspark-study/03-allocation.mp4 -frames:v 1 -q:v 2 public/blender/dspark-study/03-allocation.jpg
```
