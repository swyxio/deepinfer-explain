# DeepInfer module animations

The six editable Blender scenes follow the same four timed steps as the site’s source walkthroughs. Each step shows a moving module flow, an illustrative example, and the relevant lines from a pinned DeepInfer source or a corresponding vLLM/SGLang implementation. Production cache infrastructure is attributed to DeepSeek’s deployment Q&A.

| Scene | Flow | Comparison |
| --- | --- | --- |
| `story-cache` | Prefix matching, 3FS fetch and swap-in, block ownership | vLLM block-hash lookup and SGLang radix matching |
| `story-replay` | SWA miss, 128-token replay, attention visibility | vLLM bounded prefix replay |
| `story-experts` | Expert load, replica selection, rank placement | vLLM expert placement policy |
| `story-dspark` | Confidence remapping, cumulative probabilities, budget | vLLM adaptive verification |
| `story-overlap` | Forward, previous result processing, sampling and deferral | SGLang overlap scheduler |
| `story-system` | Request, scheduler, worker, connected mechanisms | vLLM engine loop |

Each scene runs for 384 frames at 24 fps: four phases of four seconds. The objects, text, highlighted lines, and motion remain editable in Blender. The snippets come from `public/source-data.json` and `public/peer-source-data.json`; path and line numbers are shown in each scene. The examples are illustrative and are not benchmark measurements.

Rebuild with Blender 5.2 and FFmpeg, from the repository root:

```sh
BLENDER=/Applications/Blender.app/Contents/MacOS/Blender
"$BLENDER" --background --python blender/build_module_stories.py -- public/blender
python3 blender/render_all_modules.py "$BLENDER" public/blender
"$BLENDER" --background --python blender/verify_scenes.py -- public/blender
```

The render script creates each chapter MP4 and poster, the combined film, and the downloadable scene archive. It renders two chapters at a time in temporary directories and removes the image sequences after encoding.

The excerpts are from [DeepInfer at `774ce24`](https://github.com/deepseek-ai/DeepInfer/tree/774ce244b87cc0eb8d4b94ab9f5de2ab22049f01), [vLLM at `c835207`](https://github.com/vllm-project/vllm/tree/c835207fccae327531d7d64d2d6fe719a601477f), and [SGLang at `9308890`](https://github.com/sgl-project/sglang/tree/93088901fb413e5a81eeb81b675fc21b4adc5b1f), each under the [Apache License 2.0](licenses/APACHE-2.0.txt). Source paths and line numbers are displayed in the corresponding scenes; exact revision links are retained in `public/peer-source-data.json`.

The Blender scenes embed [IBM Plex Mono](https://github.com/IBM/plex), distributed under the [SIL Open Font License](fonts/OFL.txt).
