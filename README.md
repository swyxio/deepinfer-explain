# DeepInfer, explained

An independent, source-linked field guide to DeepSeek's DeepInfer inference engine. It starts with the supplied text of Latent Space's English translation of DeepSeek's deployment article and four supplied DeepSeek figures, with margin annotations, highlighted passages and explainers. The guide connects the wider production system to the public offline release, research and alternative approaches.

The source tour is pinned to DeepInfer commit [`774ce244b87cc0eb8d4b94ab9f5de2ab22049f01`](https://github.com/deepseek-ai/DeepInfer/commit/774ce244b87cc0eb8d4b94ab9f5de2ab22049f01), inspected on October 20, 2026. The codemap includes an interactive request flow with prefill/decode branches and a return-to-scheduling loop; each component links to annotated code and research. It indexes all 342 first-party files and their folders, including configuration, examples, tests and assets. It includes 822 source-anchored symbol, branch and documentation notes across 314 files, plus ten execution maps. Six vendor submodules are documented at their integration boundaries; their internals were not inspected. Execution maps trace source paths and branch conditions, not observed accelerator runs. Production figures are attributed to DeepSeek; the open release is not the full production service.

The models and hardware explorer compares a selection of architectures from [Sebastian Raschka's gallery](https://sebastianraschka.com/llm-architecture-gallery/) with the release's documented V4.1-Flash target, and links platform and feature coverage to the pinned source. Architecture comparisons do not imply DeepInfer compatibility, and no accelerator runs were performed for this guide.

Five visual stories use playable, step-by-step diagrams to explain cache reuse, disaggregation, bounded replay, speculative verification and scheduling overlap. A curated set of public launch posts provides context; the diagrams are conceptual and link to the source and research behind the claims.

## Run locally

```sh
pnpm install
pnpm dev
```

`pnpm build` produces a static site in `dist/`; `pnpm preview` serves that build. The app and its checked-in source snapshot build without access to the DeepInfer checkout or network APIs (the optional web fonts have system fallbacks). Source text is fetched only when an execution map or file is opened.

## Update and verify source annotations

To regenerate and validate the source references, put a clean checkout of DeepInfer at `./DeepInfer` at the pinned commit, then run `pnpm verify:sources`. The scripts validate the revision, complete file/folder coverage, chapter links, request-flow graph and research references, symbol, trace, article, model-support and visual-story links, and translation note placement, and write `src/snippets.json`, `src/source-manifest.json` and `public/source-data.json`. Curated notes live in `src/file-notes.ts`, `src/symbol-notes-*.ts`, `src/request-flow.ts`, `src/execution-paths.ts`, `src/article-notes.ts`, `src/modules.ts`, `src/model-support.ts` and `src/visual-stories-data.ts`; the supplied translation and its annotation placement live in `src/article-translation.txt` and `src/translation.ts`, with diagrams in `src/article-diagrams.tsx`. Review the annotations and source links when changing the revision; a valid line number does not establish semantic accuracy or prove a runtime branch was executed.

Source excerpts are from [DeepInfer](https://github.com/deepseek-ai/DeepInfer), licensed under the [Apache License 2.0](public/DEEPINFER-LICENSE.txt). The source remains the authoritative reference. This project is independent of DeepSeek.
