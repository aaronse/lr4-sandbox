# Render fps for real-time tutorial capture

Started 2026-11-09. **Goal:** wide shots keep a high frame rate while the page plays a tutorial in real time and is
screen-captured to MP4, so the real-time capture (media-anim `capture/draft.ts`, through `node tools/lacing_voice.js draft`) holds few or no frames, for every video the
page makes (`record_demo` feature demos and the lacing tutorial alike).

## What is measured

The wide shots are **fill-bound on the AMD iGPU**: drawing 60% fewer triangles left the fps unchanged, while half
resolution doubled it. The time goes to fragments (MSAA, the shadow map's PCF, the clear hose drawn over the parts).
Numbers:
- this page: [lacing-tutorial.history.md](lacing-tutorial.history.md#capture-cost-2026-11-08-before-draft-3) "Capture cost" and
  [lacing-tutorial.history.md](lacing-tutorial.history.md#mesh-stats-and-the-stocks-flat-top-2026-11-09) "Mesh stats and the stock's
  flat top";
- the general findings (capture cost, fill-bound): the sibling repo media-anim, `docs/capture.md`;
- mesh reduction (it pays only after fill cost is cut): azab2c-private `practices/geometry/mesh-reduction.md` §3.

Chrome picks the iGPU (ANGLE D3D11); the RTX 3090 is not used (D2).

## What the page does today (web/js/page/scene.js)

- **Renderer** (line 28): `antialias: true` (MSAA), `preserveDrawingBuffer: true`, `stencil: true` (Inspect's section
  caps). Pixel ratio `min(devicePixelRatio, 2)`, 1 in Lite.
- **Lighting:**
  - Realistic: the RoomEnvironment PMREM, ACES filmic at 0.7, hemisphere 0.3π, sun 1.1π casting PCF shadows at 4096²,
    fill 0.25π.
  - The workshop adds 4 RectAreaLights and a spot with a 4096² shadow.
  - Simple: no environment on the plain parts, no tone mapping, no shadows.
- **Printed parts:** `MeshPhysicalMaterial`, with clearcoat for PETG, plus the printed-look shader (layer lines, bed
  face, fiber specks, PETG's edge glow; `fwidth` per fragment). Non-indexed geometry from `creaseNormals`.
- **The clear hose:** transparent, drawn over the parts.
- **Lite:** vertex clustering on a 1 mm grid (`LR4Files.decimate`), pixel ratio 1, no shadows.

## Tools

| Tool | What it measures |
|---|---|
| `?stats` panel (`js/page/stats.js`) | Live fps, draw calls, triangles per group and per mesh |
| `node tools/page_shot.js <url> <png> --gpu --eval js` | Probes and numbers from the real GPU; read the numbers, not the picture |
| `node tools/record_demo.js <gcode> --timing --secs 10 [--no-vsync] [--grab overlap]` | Per-frame director, draw, grab and pipe ms |
| `node tools/lacing_voice.js draft` (media-anim `capture/draft.ts`) | Real-time capture: held slots and unique fps |
| media-anim `node capture/fps.ts <url> --shots ... --seek ... [--lever x]` | Live fps per shot and size, levers applied from outside the page |
| `?stockgrid=1` | Forces the spoilboard grid, for before/after |

Rules: one browser at a time, with a hard timeout and the power watchdog; no `--swiftshader` (its fps is not wall-clock
time); every lever measured on the same shot list (t = 3, 27, 58, 100) at 720p and 1080p.

## Levers to try, cheapest first

1. **Capture resolution against device pixel ratio.** Confirm the capture renders at DPR 1. Try rendering at 1/√2 of
   the pixels and upscaling the encode.
2. **Shadows:**
   - map size 4096 → 2048 or 1024;
   - PCF → Basic or VSM;
   - stop re-rendering the shadow map every frame when nothing that casts has moved (`shadowMap.autoUpdate = false`
     plus `needsUpdate` when the gantry moves).
3. **MSAA off, with FXAA or SMAA as a post pass,** or MSAA kept with fewer samples. Measure the picture with SSIM
   against today's.
4. **`preserveDrawingBuffer: false`** for the capture path, if the grab doesn't need it. Check `record_demo`'s grab and
   the page's own screenshot features first.
5. **Overdraw:**
   - the clear hose: draw it after the opaque parts with depth test, or as one pass;
   - the printed-look shader's cost on wide shots: its lines fade out under ~3 px, so skip the bump work when `fade` is 0;
   - clearcoat only on PETG parts.
6. **The physical material:** try `MeshStandardMaterial` where clearcoat is 0. Physical costs more per fragment.
7. **Capture path:** grab frames in the page (`readPixels` into a worker, or WebCodecs `VideoEncoder`) instead of a CDP
   screenshot. Built once for every page as media-anim MA-2, then used here.
8. **The RTX 3090** (`--force_high_performance_gpu`): not tried (D2).
9. **Triangles last:** Lite with meshoptimizer at 0.05 mm, indexing after `creaseNormals`. They will matter only once
   fill is no longer the limit.

A lever that holds beyond this page goes into media-anim `docs/capture.md` as a general rule.

## Levers measured (O1, 2026-11-09)

**How.** media-anim `capture/fps.ts` (MA-1): headless Chrome on the AMD iGPU (`ANGLE (AMD, AMD Radeon(TM) Graphics
(0x0000164E) Direct3D11)`, checked each run), `index.html?anim=lacing&play=1&bar=0&voice=0`, `__player.seek(t)` then
1.5 s settle, then requestAnimationFrame counted for 3 s; 3 runs a shot, median; vsync on. Each lever is applied from
outside the page (`tools/fps/levers.mjs`: context attributes before the page's scripts, or a change to `renderer` /
`scene` once it is ready), so no page code changed. The JSON per run is in `exports/fps/` (git-ignored).

**The shot list** moved with draft 8's timing: the old t = 27, 58 and 100 now land in the start, tuck and seal scenes. It is
now one t per scene: goal 3, start 27, square 42 (the close-up), lock 70, done 112. "Wide" = 3, 27, 70, 112.

**Noise.** The baseline measured 21.9 / 11.5 fps (720p / 1080p wide mean) before the lacing refactor (d0de1a8) and
23.1 / 12.2 after it. Changes under ~5% are noise.

Wide shots, fps (min = the slowest wide shot). Changes against the post-refactor baseline:

| Lever | 720p mean | 720p min | 1080p mean | 1080p min |
|---|--:|--:|--:|--:|
| as is | 23.1 | 20.4 | 12.2 | 10.2 |
| 1. `dpr=0.7071` (half the pixels) | 37.6 (+63%) | 32.8 | 21.5 (+76%) | 19.3 |
| 2. `shadowsOff` (bound on all shadow work) | 25.8 (+12%) | 21.1 | 12.9 (+6%) | 11.1 |
| 2. `shadowFreeze` (map drawn once a shot) | 25.3 (+10%) | 21.5 | 12.6 (+3%) | 10.5 |
| 2. `shadowSize=1024` | 24.0 (+4%) | 20.8 | 12.8 (+5%) | 10.7 |
| 2. `shadowType=Basic` | 24.1 (+5%) | 20.4 | 12.1 (-1%) | 10.3 |
| 2. `shadowSize=2048` | 22.6 (-2%) | 19.0 | 12.2 (+0%) | 10.1 |
| 2. `shadowType=VSM` | 11.3 (-51%) | 10.5 | 8.7 (-29%) | 7.6 |
| 3. `msaaOff` | 29.4 (+28%) | 25.1 | 15.2 (+25%) | 12.8 |
| 4. `pdbOff` (preserveDrawingBuffer) | 23.5 (+2%) | 20.2 | 12.4 (+1%) | 10.4 |
| 5. `transparentOff` (the clear hose hidden: bound on its overdraw) | 24.6 (+7%) | 21.8 | 12.3 (+1%) | 10.0 |
| 5. `clearcoatOff` | 22.8 (-1%) | 19.5 | 12.1 (-1%) | 9.8 |
| 6. `physicalOff` (physical drawn as standard) | 23.6 (+2%) | 20.3 | 12.1 (-1%) | 10.0 |
| `msaaOff` + `shadowSize=1024` | 30.5 (+32%) | 25.0 | 15.6 (+28%) | 12.8 |
| `msaaOff` + `shadowSize=1024` + `dpr=0.85` | 41.8 (+81%) | 34.8 | 20.7 (+69%) | 17.0 |
| `msaaOff` + `shadowSize=1024` + `dpr=0.7071` | 51.8 (+124%) | 46.4 | 28.6 (+134%) | 23.8 |

Per shot, the baseline and the combinations (fps):

| Run | Size | goal 3 | start 27 | square 42 | lock 70 | done 112 |
|---|---|--:|--:|--:|--:|--:|
| as is | 720p | 26.5 | 20.5 | 51.5 | 20.4 | 24.9 |
| `msaaOff` + `shadowSize=1024` | 720p | 36.6 | 25.9 | 57.9 | 25.0 | 34.7 |
| + `dpr=0.85` | 720p | 49.8 | 34.8 | 57.2 | 35.2 | 47.4 |
| + `dpr=0.7071` | 720p | 57.1 | 46.4 | 57.1 | 46.6 | 57.1 |
| as is | 1080p | 14.7 | 10.4 | 23.6 | 10.2 | 13.5 |
| `msaaOff` + `shadowSize=1024` | 1080p | 19.4 | 12.8 | 25.3 | 12.8 | 17.3 |
| + `dpr=0.85` | 1080p | 25.2 | 17.0 | 36.1 | 17.4 | 23.0 |
| + `dpr=0.7071` | 1080p | 34.5 | 23.8 | 52.1 | 23.9 | 32.1 |

What this says:
- **Pixels and MSAA are the cost.** Only resolution (lever 1) and MSAA (lever 3) move the wide shots by more than
  noise at 1080p. Shadows, the hose's overdraw, clearcoat, the physical material and preserveDrawingBuffer are each
  ≤6% at 1080p.
- **D1 is not reached on the iGPU.** The best combination at 1080p (MSAA off, 1024² shadows, rendered at 1357 x 763 and
  upscaled) averages 28.6 fps, with start and lock at 24. That is before the capture's own cost (the screencast) is added.
- **The 720p fallback is reached:** MSAA off + 1024² shadows + `dpr=0.85` (1088 x 612 upscaled) holds ≥34.8 fps on
  every wide shot. MSAA off + 1024² alone at full 720p reaches 30.5 mean but 25 at start and lock.
- **VSM is a regression** (−51% at 720p): its blur passes cost more than PCF here.
- **Lever 5b is already in:** the printed-look shader skips its bump work when `fade` is 0 (`if (fade > 0.0)`,
  scene.js ~line 735).
- **preserveDrawingBuffer** gains nothing. Keep it: Save image (`ui.js` `saveImage`, `canvas.toBlob`) needs it.
- Not measured: the picture. MSAA off and a lower pixel ratio change edges. Lever 3 asks for SSIM against today's
  picture, and FXAA / SMAA as the replacement costs its own pass.
- NVIDIA peaked at 101 W in two runs (the discarded `--no-vsync` run and `msaaOff` + `shadowSize=1024`), with the
  renderer on the AMD iGPU and no compute process listed. Every other run peaked at ~20 W. Cause unverified: another
  session's GPU work is the likely source.

## Decisions

- **D1 (2026-11-09, the maintainer): the target** is 1080p at 30 fps on the AMD iGPU in the real-time capture, with ≤2% held
  slots on the wide shots; 720p if 1080p can't reach it.
- **D2 (2026-11-09, the maintainer): stay on the iGPU.** The RTX 3090 (lever 8) is not tried; revisit only after the
  cheap levers are in.

## Open

- **O1:** done 2026-11-09 for live fps ("Levers measured" above). Left: the winners in the page as a capture
  option (MSAA off, 1024² shadows, pixel ratio 0.85), then the real-time capture's held slots at 720p, and SSIM of the
  picture against today's.
- **The target is 720p (D1's fallback).** 1080p30 on the iGPU is out of reach with these levers (28.6 fps mean, 24 at
  the slowest shot). 720p with MSAA off, 1024² shadows and pixel ratio 0.85 holds ≥34.8 fps on every wide shot. 1080p
  comes back only if D2 is revisited.
- **O2:** correct Lite's page text ("about a fifth of the triangles"; six V1E parts measured 4.5–17% kept) when Lite is
  next touched. It needs the VERSION bump and a CHANGELOG entry.

- **O3 (2026-11-13):** frame render speed and its ranked improvement list now live in media-anim `docs/render-perf.md`. The finale's wide frames at 720p:
  `step.ts` 669 ms a frame on SwiftShader, 209 ms on the iGPU, 3 iGPU pages 2.4x; a per-frame `page_shot.js` loop 3,570 ms, so render sequences through `step.ts` / `lacing_voice.js render`. Open there: the 3090 (needs `gpu-lock.ps1`
  in an admin shell after the reboot), why concurrent iGPU pages' pixels disagree, and lr4's lost accepted baseline (`lacing_voice.js scenes accept` after the owner accepts a draft).
