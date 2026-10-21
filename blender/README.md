# DeepInfer workshop animations

Six editable, silent Blender scenes tell one conceptual story: a returning conversation reuses a saved prefix, reconstructs a missing sliding window, shares expert work, verifies draft tokens, overlaps CPU and GPU work, and finally zooms out to the surrounding production system. They are illustrations, not runtime traces, performance measurements, or literal cluster topology.

| Scene | Mechanism | Primary source |
| --- | --- | --- |
| `story-cache.blend` | Repeated prefix and the production shared KV archive | [KV cache storage](https://github.com/deepseek-ai/DeepInfer/blob/774ce244b87cc0eb8d4b94ab9f5de2ab22049f01/doc/inference_deployment_qa.md#L129) |
| `story-replay.blend` | Approximate encoder SWA bounded replay after a local state miss | [KV recomputation](https://github.com/deepseek-ai/DeepInfer/blob/774ce244b87cc0eb8d4b94ab9f5de2ab22049f01/doc/inference_deployment_qa.md#L179) |
| `story-experts.blend` | Hot-expert replicas on physical GPUs | [Expert placement policy](https://github.com/deepseek-ai/DeepInfer/blob/774ce244b87cc0eb8d4b94ab9f5de2ab22049f01/deepinfer/model_executor/eplb/policy.py#L73) |
| `story-dspark.blend` | Confidence-guided draft selection and verification | [Speculative decoding](https://github.com/deepseek-ai/DeepInfer/blob/774ce244b87cc0eb8d4b94ab9f5de2ab22049f01/doc/inference_deployment_qa.md#L239) |
| `story-overlap.blend` | CPU scheduling overlaps device work | [Asynchronous scheduling](https://github.com/deepseek-ai/DeepInfer/blob/774ce244b87cc0eb8d4b94ab9f5de2ab22049f01/doc/inference_deployment_qa.md#L266) |
| `story-system.blend` | Zoom-out connecting the engine and production infrastructure | [System overview](https://github.com/deepseek-ai/DeepInfer/blob/774ce244b87cc0eb8d4b94ab9f5de2ab22049f01/doc/inference_deployment_qa.md#L23) |

Open a `.blend` from [`public/blender/`](../public/blender/) in Blender and play frames 1–240 (24 fps). Geometry, materials, typography and keyframes remain editable. The gallery also provides individual MP4s, a continuous silent film and the full explanatory text. The shared production cache and complete prefill/decode service are not included in the released engine. Replay is approximate and the sample draft acceptance and work distribution are illustrative.

To recreate the scene files, using Blender 5.2:

```sh
for scene in cache replay experts dspark overlap system; do
  blender --background --python "blender/scenes/story_${scene}.py" -- "$PWD/public/blender"
done
```

To render a 24-fps preview with Eevee and FFmpeg:

```sh
blender --background public/blender/story-cache.blend \
  --python blender/render_workshop.py -- "$PWD/blender/.preview-frames/story-cache"
ffmpeg -framerate 24 -i 'blender/.preview-frames/story-cache/frame-%04d.png' \
  -c:v libx264 -pix_fmt yuv420p -movflags +faststart public/blender/story-cache.mp4
```

The older independent studies remain in the directory, but the site now presents the workshop sequence. No narration or sound was produced. Sample frames and file structure can be checked programmatically, but they do not establish continuous playback quality.
