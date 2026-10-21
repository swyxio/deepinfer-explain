# DSpark visual study

One worked example follows the decode path in DeepInfer commit `774ce244b87cc0eb8d4b94ab9f5de2ab22049f01`. Two continuing sequences share a five-query-token budget; the example uses three draft positions rather than the production draft count of five. The top three cumulative scores are A1, B1 and A2; each query length includes one existing base token. Selection allocates work and the target model subsequently decides acceptance.

The 102-second silent film builds the example in five layers:

1. **Prefix confidence (0:00):** B's estimated per-position rates `.80, .40, .90` yield cumulative scores `.80, .32, .288`; A's `.90, .80, .70` yield `.90, .72, .504`. The ribbons visualize predicted scores, not observed acceptances. See [`torch.cumprod`](https://github.com/deepseek-ai/DeepInfer/blob/774ce244b87cc0eb8d4b94ab9f5de2ab22049f01/deepinfer/model_executor/layers/tilelang_ops/schedule_mtp_varlen.py#L54-L68).
2. **CPU budget (0:24):** given illustrative total times of 1.30 ms for query counts 2–4, 1.40 ms for 5, 1.80 ms for 6, and 2.40 ms for 7–8, the toy maximum occurs at five queries: `(2 + .90 + .80 + .72) / 1.40 = 3.16` expected tokens/ms. The baseline two are expected target outputs, distinct from the two base query inputs. The example assumes the older rates used for the CPU budget match the newer rates used for GPU allocation. The actual scheduler uses a profiled, runtime-adjusted curve and estimates the best throughput; see [`mtp_varlen.hpp`](https://github.com/deepseek-ai/DeepInfer/blob/774ce244b87cc0eb8d4b94ab9f5de2ab22049f01/csrc/engine/mtp_varlen.hpp#L195-L265).
3. **GPU allocation (0:42):** after two base inputs, the remaining three positions are A1, B1 and A2. The ranking wall illustrates the result; it does not reorder tokens. The Python reference sorts scores, while the CUDA kernel computes each candidate's rank by comparisons. See the [reference](https://github.com/deepseek-ai/DeepInfer/blob/774ce244b87cc0eb8d4b94ab9f5de2ab22049f01/deepinfer/model_executor/layers/tilelang_ops/schedule_mtp_varlen.py#L70-L98) and [CUDA kernel](https://github.com/deepseek-ai/DeepInfer/blob/774ce244b87cc0eb8d4b94ab9f5de2ab22049f01/deepinfer/model_executor/layers/tilelang_ops/cuda/schedule_mtp_varlen.py#L39-L81).
4. **Target verification (1:01):** A's query inputs remain `[base, A1, A2]`; B's remain `[base, B1]`. In a separate hypothetical sampling outcome, A1 has target probability `.75`, draft probability `.60`, and draw `.50`, so its clipped acceptance probability is `1`. A2 has `.20`, `.80`, and draw `.60`, so its acceptance probability is `.25` and it is rejected. A emits A1 plus a residual-sampled token. These are different numbers from the confidence-head estimates used for scheduling. See [rejection sampling](https://github.com/deepseek-ai/DeepInfer/blob/774ce244b87cc0eb8d4b94ab9f5de2ab22049f01/deepinfer/model_executor/layers/tilelang_ops/fused_sample.py#L227-L246) and [prefix acceptance](https://github.com/deepseek-ai/DeepInfer/blob/774ce244b87cc0eb8d4b94ab9f5de2ab22049f01/deepinfer/model_executor/layers/tilelang_ops/sampler.py#L227-L248).
5. **The decode loop (1:23):** the worker takes the CPU's total budget, remaps the preceding step's GPU confidence and computes per-request query lengths before the main forward; sampling then verifies, resamples if needed and produces the next draft and confidence. See [worker correction](https://github.com/deepseek-ai/DeepInfer/blob/774ce244b87cc0eb8d4b94ab9f5de2ab22049f01/deepinfer/worker/worker.py#L191-L219) and [sampler flow](https://github.com/deepseek-ai/DeepInfer/blob/774ce244b87cc0eb8d4b94ab9f5de2ab22049f01/deepinfer/model_executor/layers/sampler.py#L74-L83).

- [SVG explanation](../public/blender/dspark-study/01-budget.svg)
- [ImageGen visual study](../public/blender/dspark-study/02-imagegen.png)
- [Editable Blender scene](../public/blender/dspark-study/03-allocation.blend) and [animation](../public/blender/dspark-study/03-allocation.mp4)
- [DeepInfer allocation reference](https://github.com/deepseek-ai/DeepInfer/blob/774ce244b87cc0eb8d4b94ab9f5de2ab22049f01/deepinfer/model_executor/layers/tilelang_ops/schedule_mtp_varlen.py#L54-L98), [budget selection](https://github.com/deepseek-ai/DeepInfer/blob/774ce244b87cc0eb8d4b94ab9f5de2ab22049f01/csrc/engine/mtp_varlen.hpp#L228-L265), and [acceptance sampling](https://github.com/deepseek-ai/DeepInfer/blob/774ce244b87cc0eb8d4b94ab9f5de2ab22049f01/deepinfer/model_executor/layers/sampler.py#L427-L480)

## ImageGen prompt

The built-in image generation tool edited a PNG export of the initial SVG with this prompt. The final SVG adds probability bars and a B3 callout; the current Blender animation extends the example to budget selection, sampling and the full loop:

> Use case: sketch-to-render. Asset type: one art-direction study for an educational Blender animation. Image 1 is the diagram to upgrade, not a source of new concepts. Transform this exact DSpark allocation example into a calm, precise, tactile 3D editorial illustration, as if the diagram were made from simple matte ceramic and paper on a light warm tabletop. Preserve its three-stage reading order, the two rows of three draft pieces, the two base pieces, the shared strip of five slots with the first two reserved and the last three selected, and the target-model verification destination. The winning draft pieces are A1 (0.90), B1 (0.80), and A2 (0.72); do not show them as already accepted. Keep the two rows clearly aligned and selection visually obvious. Match the diagram's restrained dark ink, pale green, deep green, and light blue palette; use soft natural studio light, gentle shadows, almost orthographic viewpoint, ample space, and geometric components that are easy to recreate and animate in Blender. Prioritize legible educational structure over visual spectacle. No futuristic or sci-fi machinery, neon, robots, space themes, code, fake charts, invented numbers, decorative cables, or excessive ornament. Keep any text to the existing concise labels if legible; do not introduce new claims.

The scene models the diagram as editable Blender objects; the generated image is a visual reference, not a source of technical evidence.

[Other diagramming directions](dspark-visual-ideas.md) and a [visual comparison sheet](../public/blender/dspark-study/04-visual-directions.svg) explore ways to show the same example.

## Rebuild

From the repository root, use Blender 5.2 and FFmpeg. The scene builder writes an editable `.blend`; the render uses 8 EEVEE samples and 15 frames per second:

```sh
mkdir -p /tmp/dspark-study-render
blender -b --python blender/build_dspark_study.py -- public/blender/dspark-study
blender -b public/blender/dspark-study/03-allocation.blend \
  -o '/tmp/dspark-study-render/frame-####' -F PNG \
  --python-expr 'import bpy; s=bpy.context.scene; s.render.engine="BLENDER_EEVEE"; s.eevee.taa_render_samples=8; s.render.image_settings.color_mode="RGB"; s.render.image_settings.compression=30; bpy.ops.render.render(animation=True)'
ffmpeg -framerate 15 -i /tmp/dspark-study-render/frame-%04d.png -c:v libx264 -crf 18 -pix_fmt yuv420p -movflags +faststart public/blender/dspark-study/03-allocation.mp4
ffmpeg -ss 1 -i public/blender/dspark-study/03-allocation.mp4 -frames:v 1 -q:v 2 public/blender/dspark-study/03-allocation.jpg
```
