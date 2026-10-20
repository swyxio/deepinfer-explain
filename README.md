# DeepInfer, explained

An independent, source-linked field guide to DeepSeek's DeepInfer inference engine. It maps the public offline release, its major code paths, the larger production system described by DeepSeek, and relevant research and comparisons.

The source tour is pinned to DeepInfer commit [`774ce244b87cc0eb8d4b94ab9f5de2ab22049f01`](https://github.com/deepseek-ai/DeepInfer/commit/774ce244b87cc0eb8d4b94ab9f5de2ab22049f01), inspected on October 20, 2026. It covers the major subsystems rather than every file or vendor kernel. Production figures are attributed to DeepSeek; the open release is not the full production service.

## Run locally

```sh
pnpm install
pnpm dev
```

`pnpm build` produces a static site in `dist/`; `pnpm preview` serves that build. The app and its checked-in excerpts build without access to the DeepInfer checkout or network APIs (the optional web fonts have system fallbacks).

## Update source excerpts

To regenerate and validate the source references, put a clean checkout of DeepInfer at `./DeepInfer` at the pinned commit, then run `pnpm verify:sources`. The script validates the revision, paths, and line ranges and writes `src/snippets.json`. Review the annotations and source links when changing the revision; line validity alone does not verify semantic accuracy. Vendor submodules were not inspected for this guide.

Source excerpts are from [DeepInfer](https://github.com/deepseek-ai/DeepInfer), licensed under the [Apache License 2.0](public/DEEPINFER-LICENSE.txt). The source remains the authoritative reference. This project is independent of DeepSeek.
