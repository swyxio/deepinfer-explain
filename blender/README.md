# DeepInfer Blender studies

Five editable, silent 3D animation studies. They are explanatory models, not measurements, execution traces, or literal physical layouts.

| Scene | Source | Animation |
| --- | --- | --- |
| `expert-traffic.blend` | [`eplb/policy.py`](https://github.com/deepseek-ai/DeepInfer/blob/774ce244b87cc0eb8d4b94ab9f5de2ab22049f01/deepinfer/model_executor/eplb/policy.py#L73) | A hot logical expert gets a second physical placement. |
| `near-far-attention.blend` | [`v4_modules/attn.py`](https://github.com/deepseek-ai/DeepInfer/blob/774ce244b87cc0eb8d4b94ab9f5de2ab22049f01/deepinfer/model_executor/models/v4_modules/attn.py#L594) | A sliding window and compressed history; selection is shown for sparse layers. The moving halo is illustrative. |
| `precision.blend` | [Deployment Q&A: low precision](https://github.com/deepseek-ai/DeepInfer/blob/774ce244b87cc0eb8d4b94ab9f5de2ab22049f01/doc/inference_deployment_qa.md#low-precision-computation) | FP4 representations for routed-expert weights, main KV and indexer KV. Packing is illustrative, not to scale. |
| `vision.blend` | [`ve/multimodal_processor.py`](https://github.com/deepseek-ai/DeepInfer/blob/774ce244b87cc0eb8d4b94ab9f5de2ab22049f01/deepinfer/ve/multimodal_processor.py#L105) | Image patches become visual features; text is tokenized separately. |
| `parallelism.blend` | [`prepare_cp_mirror.py`](https://github.com/deepseek-ai/DeepInfer/blob/774ce244b87cc0eb8d4b94ab9f5de2ab22049f01/deepinfer/model_executor/layers/tilelang_ops/cuda/prepare_cp_mirror.py#L64) | Early and late sequence slices pair across an illustrative four GPU ranks. |

The scene files and previews are in [`public/blender/`](../public/blender/). Open a `.blend` in Blender, select the camera view, and play frames 1–144 (24 fps). All geometry, materials, text, and keyframes remain editable. The online MP4s are silent, half-rate previews (12 fps); the scene files retain 24 fps. They were created with Blender 5.2.

To regenerate the scenes from the project root:

```sh
for scene in expert attention precision vision parallelism; do
  blender --background --python "blender/scenes/$scene.py" -- "$PWD/public/blender"
done
```

To regenerate one preview with Blender and FFmpeg:

```sh
blender --background public/blender/expert-traffic.blend \
  --python blender/render_preview.py -- "$PWD/blender/.preview-frames/expert-traffic"
ffmpeg -framerate 12 -pattern_type glob \
  -i 'blender/.preview-frames/expert-traffic/frame-*.png' \
  -c:v libx264 -pix_fmt yuv420p public/blender/expert-traffic.mp4
```

No narration or sound was produced. Blender rendering and FFmpeg are local build tools; the website plays the resulting files with native video controls.
