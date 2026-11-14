---
title: "LR4 Sandbox (aaronse fork) — State of the Project"
filename: "2026-11-11-lr4-sandbox-STATE-OF-PROJECT.md"
status: "point-in-time-assessment"
date: "2026-11-11"
generated_by: "claude-opus-5-5"
audience: ["Product Planner Agents", "Operator", "Dev Agents"]
purpose: >
  Snapshot of what the fork added since b3fdc16 (2026-11-01, Jason Yeager's last commit): cable lacing in the model
  and page, and the lacing tutorial video pipeline with its extraction into media-anim and media-mesh. It supports two
  decisions: what to do with draft 15 and branch ropepath, and how the fork relates to an upstream that kept moving.
sources:
  - "CLAUDE.md (lines 8, 20, 25-27, 32, 49, 61)"
  - "README.md (lines 1-25, 27, 272, 314, 324-327)"
  - "CHANGELOG.md (lines 1-40)"
  - "docs/PLAN.md (lines 98, 121-144)"
  - "docs/specs/lacing-tutorial.md (main, and branch ropepath in E:/git/wt/ropepath/lr4-sandbox: lines 1-80, 506-775)"
  - "docs/specs/lacing-tutorial.history.md (ropepath: lines 7-20, 947-1022, 1430-1449, 1576-1600)"
  - "docs/specs/render-fps.md (all)"
  - "docs/specs/lacing-tutorial.timelog.jsonl (through media-anim tools/anim/timelog.mjs report)"
  - "docs/specs/lacing-tutorial.youtube.txt"
  - "web/js/lacing_tutorial.js (lines 1-12), web/js/hose_route.js (grep: 2-3, 96, 237, 355), web/js/page/job.js:5, web/js/page/scene.js:28-29, 270, 318"
  - "freecad/lr4.py (grep: 958, 1129, 1144), tests/test_hose_route.js:1-4, tools/sync_media.js:1-20, tools/serve.py:19-33"
  - "git: log b3fdc16..main, main..ropepath, main..upstream/main, merge-tree main upstream/main, upstream/main:freecad/lr4.py:936-948"
  - "E:/git/media-anim/README.md:1-8, E:/git/media-anim/BACKLOG-INDEX.md:9, E:/git/media-anim/docs/gpu-pool.md (headings)"
  - "E:/git/media-mesh/README.md:1-12"
  - "Measured today: npm test on main and in the ropepath worktree; fab perf sessions --since 5d"
repo_activity:
  last_commit: "2026-11-11"
  quiet_days: 0
  is_active: true
invalidated_by: >
  The maintainer's verdict on draft 15 (merge of ropepath in lr4 and media-mesh, `scenes accept`); a decision on
  upstream (merge, rebase, PR, or stay a fork) or any fetch that moves upstream/main past 5e4a696; MA-5's history
  rewrite landing and the first push to origin; a 1080p render; a VERSION bump past 0.67.0.
---

# LR4 Sandbox (aaronse fork) — State of the Project

## 1. TLDR

LR4 Sandbox is Jason Yeager's browser page and FreeCAD model of the V1 Engineering LowRider 4 (MIT licence; 128
commits from 2026-10-20 to 2026-11-01, page 0.66.2). We forked it at b3fdc16. Since 2026-11-08 the fork has added
135 commits (+17,894 lines across 104 files) in two layers. The first is cable lacing in the model and the page: page
0.67.0, with `lr4.lacing` / `hose_route.js` twins and a BOM tape row. A twin test covers it; no FreeCAD build of it is
on record. The second, much larger layer is an agent-run pipeline for tutorial videos. It produced 15 drafts of a
137.8 s voiced lacing tutorial in four days. Draft 15 rendered 4,133 frames in 141.9 s on 7 RTX 3090 slots, is
unlisted on YouTube and is posted on the V1E forum. The pipeline's generic code moved into media-anim and media-mesh.
`npm test` passes 39/39 on main (18.3 s, measured today). The ropepath worktree fails 2 of 39, both from causes that
exist only in the worktree.

Nothing from the fork is pushed. Draft 15 waits on the maintainer's review and on unmerged `ropepath` branches in two
repos. The push waits on media-anim MA-5's history rewrite.

The gate no doc names is upstream. It has moved 30 commits ahead, to page 0.70.2. It redrew the hose and router cord
as rope simulations (`cable_sim.js`; `cordRoute` is now the rope's guide) and deleted the Python `cord_route`, which
was unused at our fork point. Our lacing made it live again (`freecad/build.py:949`) and ties to the static route, not
the settled rope upstream now draws. A trial merge conflicts in 7
files, and both sides shipped different changes under the number 0.67.0. The lacing feature has no path upstream or to
a public page until someone decides whether to stay a fork or rebase.

## 2. What it is intended to do

**The baseline (pre-fork, Jason Yeager's project).** You enter a cutting area and the page draws the whole LowRider 4
from V1E's real printed part files. It gives the cut list, strut plates, BOM and a FluidNC `config.yaml`, plays
G-code with a stock simulation, and runs the real FluidNC firmware compiled to wasm. A FreeCAD model sits behind it and
places every part by measured mating features (README.md:3-8, 18-23). Fits across many size builds feed the page.

**What the fork set out to add:**
- **Cable lacing on the machine.** The router cord and cable sleeve are laced to the vacuum hose with one waxed tape,
  spaced by NASA-STD-8739.4A Table 9-1 (CHANGELOG.md:6-14, PLAN.md:121-144). The model and the page draw it, and the
  BOM counts it.
- **A teaching video for it, made by agents from the page's own scene.** The picture is a pure function of t
  (lacing_tutorial.js:1-5). It is voiced in the maintainer's cloned voice, with the knots taught in close-up, and
  recorded to MP4 (lacing-tutorial.md:1-7).
- **Faster iteration on that video.** Changed-scene diffs, a scene render cache, a browser lock, stills rules as
  numbers, a timelog, and later a GPU render server. The reusable parts went out to sibling repos.

**Deliberate stances (load-bearing):**
- **No V1E part files in git.** STL, STEP, DXF, OBJ, 3MF and FCStd are git-ignored, with a pre-commit guard; users
  download their own (CLAUDE.md, README.md:27). The video pipeline keeps the V1E downloads, extracted, under
  `.cache/lacing-tutorial/parts_src/`, also git-ignored (lacing-tutorial.md@ropepath:580).
- **Script-owned, measured model.** Never hand-edit the FCStd, and never assume design angles (CLAUDE.md).
- **No reusable code in lr4.** Shared tools go to media-anim and media-mesh. The page gets an unmodified minimal
  vendored copy through `tools/sync_media.js` (sync_media.js:1-7), because the public page can't reach the private
  siblings.
- **Render review checkpoints.** Stop at a 720p draft and contact sheet, with no 1080p before the maintainer approves
  (lacing-tutorial.md@ropepath:641). Make no smaller copies; the maintainer watches on this PC (CLAUDE.md:61).
- **Pushes held.** Commit only, and push only on the maintainer's go (CLAUDE.md:25).
- **JS and Python twins kept in step.** `hose_route.js` mirrors `lr4.hose_route` / `cord_route` / `lacing`
  (hose_route.js:2-3, CLAUDE.md:27).

## 3. What is actually built

Labels: **real** = I read code, tests or output that proves it · **seam** = interface exists, the thing behind it does
not · **claimed** = a doc says so, not verified · **aspirational** = future tense.

### 3a. Lacing in the model and page (page 0.67.0, 2026-11-08)

| Item | Label | Evidence |
|---|---|---|
| `lr4.lacing` / `LACING` in Python, `lacing()` in `web/js/hose_route.js`, its twin | real | lr4.py:1129, 1144; hose_route.js:237, 355; test_hose_route.js compares them through Python (passes in today's npm test) |
| Routes moved out of `hose_bom.js` into `hose_route.js` (`hoseRoute`, `cordRoute`) | real | hose_route.js:9, 96; commit 0a709be |
| BOM "waxed lacing tape" row, ~6.5 m at 26 x 50 in | claimed | CHANGELOG.md:10-12; bom.py changed in 0a709be; the length not checked |
| `Cable_Lacing` mesh in the FreeCAD build | claimed | commit 0a709be subject. `parts/` holds no STLs on this PC and `build/` no FCStd, so the fork has no build on record |
| Layers > Vacuum hose + cables > Cable lacing toggle | claimed | CHANGELOG.md:9-10; not opened in a browser |
| `?stats` mesh stats panel; the page doesn't redraw while the clock is stopped | real (code), unreleased | README.md:272; commits c17fa76, 5e07111; VERSION still 0.67.0 (job.js:5) |
| Dev events (`.logs/events.jsonl` when `DEVLOG_LIB` is set) from serve.py, run.py, build.py | real | serve.py:19-33; commits 88667d7, b3f6634 |

### 3b. The lacing tutorial pipeline

| Item | Label | Evidence / numbers |
|---|---|---|
| The pure picture: `web/js/lacing/` (17 modules) + facade `lacing_tutorial.js`, `page/lacing_anim.js` (442 lines) | real | file count; facade header 1-12; 39/39 tests |
| Storyboard and shots as data (`*.storyboard.json`, `*.shots.json`), with `data.js` generated by `sync` | real | quickstart table, lacing-tutorial.md@ropepath:30-45 |
| `tools/lacing_voice.js` (748 lines): tts, sync, transcript, chapters, scenes diff/check/accept, render, clip, still, iterate, brief, parts | real (code), timings claimed | Pipeline table @ropepath:511-528 |
| Tests: `tests/test_lacing_tutorial.js` (1,458 lines, by section), npm test in parallel | real | **measured today: main 39/39 passed in 18.3 s** (the spec says 7-8 s; one run, machine load unknown). **ropepath: 2 of 39 fail in 28.0 s**: `test_serve.js` (`--lan` .exports) and `test_lacing_exports.js` (CRLF chapters/youtube) |
| Scene render cache (MA-8), frame-exact segments, render key | real (code), timings claimed | cold 394-407 s on iGPU; warm 3.5 s; one camera key 49-63 s (@ropepath:523-524) |
| Render server on the RTX 3090 (media-anim `docs/gpu-pool.md`) | claimed (history) | d13: 79.0 s for 3,469 frames on 7 slots; d14b: 4,133 frames in 149.4 s; d15: 4,133 frames in 141.9 s (history@ropepath:1436-1440, 1580, 1598) |
| Drafts 2-15 (plus 11s, 13b/c, 14b) at 720p | claimed (files git-ignored, not opened) | d2 3.2 min for 64.87 s on iGPU, 99 ms a frame (history:9-12); d12 cold 516.9 s with real parts; d15 137.767 s |
| Reduced real V1E parts for renders (media-mesh MM-3) | claimed | 37 files, 42.3 -> 5.1 MB; 910,856 -> 81,002 triangles with the Jackpot3 box (@ropepath:527, 685) |
| YouTube chapters / sidebar / ZoomTube exports | real (files) | lacing-tutorial.youtube.txt: 4 chapters, 0:00-1:51 |
| Draft 15 published | claimed (cited, not fetched) | unlisted https://youtu.be/-B1061TznS0; V1E forum https://forum.v1e.com/t/lowrider-4-sandbox-virtual-in-browser/55073/54 (@ropepath:590) |
| Generated run of knots (`plan.js runOf`, media-mesh `body.ofTubes`, `rope.lace`, `rope.taut`) | real on branch only | ropepath f0434df, c6a9172, 822120e; media-mesh `ropepath` 8c8c3b1, not on media-mesh main (`lib/` has no `body.js`) |
| 1080p final | aspirational | "not run: 720p only so far" (@ropepath:528) |

### 3c. Extraction into sibling repos

| Item | Label | Evidence |
|---|---|---|
| media-anim `lib/` (timeline, camera, reveal, swing, tube, halo, callout, credits, occluder, player, tweak) vendored to `web/js/lib/media-anim/` | real | sync_media.js:16-20; folder listing |
| media-anim `tools/` (capture, anim/golden, scenes, timelog, audio tts/mix/words, publish exports, fps) taken from lr4 (MA-5) | real (files exist), "byte-identical" claimed | media-anim README:7-8; BACKLOG-INDEX:9 (MA-5 ◐) |
| Browser lock (MA-6) vendored to `tools/lib/media-anim/browser_lock.js` | real | listing; commits c08efbd, ce26255 |
| media-mesh `lib/` vec3, curve, knot, bundle, rope vendored; knotdet, clearance test-only | real | sync_media.js:19; media-mesh lib listing |
| media-mesh `tools/reduce.mjs` (MM-3) | real (file), numbers claimed | media-mesh README:12 |
| Knot vocabulary `media-mesh/lib/knot-terms.md` | real | listing; commit c5bd91d |

### 3d. Where the agent time went (measured from logs)

| Source | Number |
|---|---|
| timelog report (`docs/specs/lacing-tutorial.timelog.jsonl`) | 1,445.9 min logged, 128.5 avoidable (9 %); build 498.4, tooling 481.6, scene 140.5, check 123.6, render 54.3 min |
| top stages | velocity R8-R9 iterate 74.3 min; MA-8 scene cache 72; draft 11 geometry clearance 59; velocity tests/docs 50; d12 opening 47.1 |
| `fab perf sessions --since 5d` (this repo) | 15 sessions, ~1.71 B tokens (mostly cache reads; this scout's parent session e1318d51 included); top waste "polling" 1.8 h + 1.5 h + 29.7 min + 1.8 min |
| CLAUDE.md:49-50 (fab perf reflect 2026-11-10) | 166 foreground poll loops, 203 min, 5 sessions |

## 4. Ambition vs. implemented reality — the gaps

1. **Upstream diverged under the lacing. This is drift, and no doc mentions it.** `main` is `[upstream/main: ahead
   135, behind 30]`. Upstream (jeyeager65) commit a30c88f draws "the vac hose and router cord as ropes" (`cable_sim.js`).
   Its lr4.py:942 says "Python's cord_route went in Part 53c". Our `lr4.lacing` and `hose_route.js` `lacing` are built
   on the static `cord_route` / `cordRoute` (lr4.py:958, hose_route.js:96), and CLAUDE.md:27 still names `cord_route`
   as a twin to keep in step. `git merge-tree` reports content conflicts in 7 files: CHANGELOG.md, freecad/lr4.py,
   tests/package.json, tests/test_page_fluidnc.js, hose_bom.js, job.js and panel.js.
   - **Version collision:** upstream 5dc8a23 is "page 0.67.0" (hose length per size, hub wiring); ours is 0.67.0
     (cable lacing). Upstream is now at 0.70.2 (5e4a696).
   - **UI rename:** upstream renamed Layers to the "Show panel" (ed7fa3d), and our CHANGELOG.md:9 tells users "Layers >
     Vacuum hose + cables > Cable lacing".
   - Upstream/main was last fetched 2026-11-10 20:15; it may be further ahead now.
2. **Page changes since 0.67.0 have no version or changelog. This is drift, and only partly acknowledged.** 34 commits
   touched `web/js/page`, `web/index.html` or `web/css` after 0.67.0. `?stats` has a README line (272) but no VERSION
   bump and no CHANGELOG entry, against CLAUDE.md:32. The spec admits it only for the drafts ("no VERSION / CHANGELOG
   entry for the drafts (none since draft 1)", @ropepath:728).
3. **render-fps.md is doc rot.** It says "Chrome picks the iGPU; the RTX 3090 is not used (D2)" (render-fps.md:18,
   144), but drafts 13-15 rendered on "7 nvidia slots (the 3090)" through media-anim's render server
   (history@ropepath:1432-1434). Its Open O1 says to put "the winners in the page as a capture option" (MSAA off, 1024²
   shadows, DPR 0.85). scene.js still has `antialias: true` (28) and 4096² shadows (270, 318), so that was never done.
   The live fps work moved to media-anim `docs/gpu-pool.md`, and this file was not updated to say so.
4. **No 1080p video exists. The gap is spec-compliant.** D1's target was 1080p30. It is "out of reach" on the iGPU
   (render-fps.md:152-154), and 1080p waits on the maintainer's approval of a draft. Every draft so far is 720p.
5. **Draft 15's code is unmerged in two repos. The gap is spec-compliant.** lr4 `ropepath` (9 commits) and media-mesh
   `ropepath` (`body.js`, `rope.lace`, `rope.taut`) wait on the maintainer's OK. Problems the branch leaves open:
   - the tape runs up to 2.55 mm into the sleeve at carried poses, and the test holds the measured values, not the
     clearance rule (@ropepath:596-597);
   - the rings fan out at the U-turn (@ropepath:593-595);
   - knots 3-5 line up with the camera at 115 s.
   The spec says to "check them on main before the merge" for the 2 failing tests. Main passes 39/39 today, so both
   failures belong to the worktree (CRLF checkout and the junctioned `.exports`).
6. **The push gate is a seam, not a schedule.** lr4 has no origin remote-tracking ref (`git branch -r` lists only
   upstream). MA-5 must rewrite lr4's unpushed history before any push (@ropepath:642, BACKLOG-INDEX:9 ◐). The only
   public artefacts of the fork are the unlisted video and the forum post.
7. **Inherited instructions point at things that aren't here. This is drift.**
   - CLAUDE.md:8 says to read `private/RESUME.md` first; `private/` does not exist in this checkout.
   - CLAUDE.md:20 says to change fclib at `D:/FreeCAD/lib/fclib`; that path does not exist on this PC.
   - In the inherited CLAUDE.md, "the maintainer" and "V1E has approved the public version" (CLAUDE.md:25) were
     Jason's (`git show b3fdc16:CLAUDE.md:25-26`). The fork's docs now use "the maintainer" for this PC's owner.
     Whether V1E's approval covers the fork's lacing and video is unverified.
8. **The FreeCAD side of lacing has not been exercised. This is claimed.** Only the pure-Python twin runs in tests.
   The fork has not run the CLAUDE.md flow for a model change the page shows (size builds, then `fit_config`, then
   `test_config_model`): `web/data/` has no commit after the fork, and `parts/` has no STLs here.
9. **CI covers less than local.** The clearance section and the slid-off knot determinants need the media-mesh
   sibling. CI skips them "with a note" (@ropepath:559-560). For the knots, a CI pass is weaker than a local pass. The
   gap is spec-compliant.
10. **Known open defects carried in the spec.** None of these is on fire:
    - the `done` scene is nondeterministic on the `scenes.mjs` reload path, with 348 of 802 frames differing
      (@ropepath:701-708);
    - `test_sim_config.js` crashes at exit after its checks pass, now and then (@ropepath:711-712);
    - the scene cache is never pruned (59 MB, 14 of 60 segments stale);
    - D1-D4 have been waiting on the maintainer since 2026-11-09/10.

## 5. Age and activity

- **The repo is 22 days old. The fork's work is 4 days old (2026-11-08 to 2026-11-11), 0 quiet days.** Every
  post-fork file is under 4 days old, so age can't separate cold from hot here. The only cold layer is the pre-fork
  baseline (FluidNC wasm, fclib, calculator, strut plates), which the fork never touched.
- **In flight:** the draft 15 review on branch `ropepath` (worktree `E:\git\wt\ropepath\lr4-sandbox`, head 239a6f5,
  2026-11-11). The resume point is lacing-tutorial.md "Pipeline Open", first item.
- **Paused:**
  - render-fps O1 ("winners in the page"), since 2026-11-09;
  - D1-D4 (the confirm check, `run_tests.js` placement, seeded textures, the browser pool);
  - learnings 1-8 from the d13 swing session ("each one is later work, not started", @ropepath:662-679);
  - the zt-web gaps (`exports/lacing_zoomtube/README.md`).
- **Abandoned:** nothing clearly. `tools/record_demo.js` (feature demos) has been quiet since 2026-11-09. The lacing
  work superseded its `--timing` experiments.
- **The oldest load-bearing thing nobody revisited:** the inherited CLAUDE.md "Start here" and fclib rules
  (2026-10-20 / 11-01). They assume Jason's machine and private notes.
- **Assumptions that may have expired:**
  - The V1E approval, given to Jason's public version.
  - The hose and cord geometry, which upstream rewrote between 2026-11-02 and 11-05.
  - Upstream/main as of the last fetch (2026-11-10).
  - meshoptimizer 1.3.0 and Chrome / GPU driver versions. The render key does not include those versions
    (@ropepath:739), so a Chrome update can silently change cached segments.

## 6. What is next

**The project's own answer** (lacing-tutorial.md@ropepath:588-600): the maintainer reviews draft 15. On an OK:
1. merge media-mesh `ropepath`, then run `node tools/sync_media.js` and the tests;
2. merge lr4 `ropepath` into main;
3. run `scenes accept`;
4. render 1080p only after approval;
5. push only after MA-5's history rewrite.

**Credibility:** credible for the video. Steps 1-3 are small, and main's tests are green. The answer is incomplete for
the feature, though. It does not mention upstream. Pushing to origin would publish a fork that is 30 commits behind,
on a hose model upstream has replaced, with a clashing version number.

**Kind of next step:**
- the draft 15 review is operator work;
- the upstream question is a decision, the larger one;
- the merge steps and the VERSION/CHANGELOG catch-up are dev work.

## 7. Cross-project relationships

| Sibling | Relationship |
|---|---|
| **upstream jeyeager65/lr4-sandbox** | The parent. Active, 30 commits since the fork. It overlaps our hose, cord, BOM, panel and job files (gap 1) |
| **media-anim** | Runtime lib vendored unmodified; owns capture, golden, scenes, timelog, audio, publish, fps and the browser lock; render server (`docs/gpu-pool.md`, MA-9). MA-5 gates lr4's push. Local main is 3 commits ahead of its origin |
| **media-mesh** | rope / knot / bundle / curve / vec3 vendored; knotdet and clearance used by tests; `tools/reduce.mjs` for the parts; `knot-terms.md`. Its `ropepath` branch holds draft 15's `body.js` |
| **media-gen** | TTS of the maintainer's cloned voice (through media-anim `audio/tts.mjs`); serve.py's Range handling ported from it |
| **craftcraft** | Source of the `spoken()` rule and the voice-gap check (commits 9f127a1, 0391ab1) |
| **azab2c-private** | Practices `tutorial-animations.md`, `geometry/mesh-reduction.md`, observability/devlog; the `/tutorial-animation` skill |
| **llm-fab** | `fab perf reflect` produced the polling rule in CLAUDE.md:49 |
| **zt-web** | Target of the ZoomTube export; its gaps are listed, not fixed |

**Divergences a planner must not paper over:**
- **"rope".** In media-mesh it is the geometry of a knotted strand (`rope.lace`, `rope.taut`). In upstream lr4 it is a
  physics simulation of the hose and cord (`cable_sim.js`). Merging upstream means the lacing has to sit on upstream's
  simulated cord, not on media-mesh's ropes.
- **"the maintainer".** In the inherited CLAUDE.md lines it meant Jason Yeager; in the fork's docs it is this PC's
  owner.
- **"0.67.0".** It names two different releases.
- **"Layers" vs "Show panel".**

## 8. Reading list + authority chains

**Read in order:**
1. CLAUDE.md. Treat lines 8 and 20 as stale (gap 7).
2. docs/specs/lacing-tutorial.md, **on branch ropepath**: "Agent quickstart" (20-55), then "Pipeline" and its
   **Open** list (506-729). Main's copy is one resume-pointer behind.
3. web/js/lacing_tutorial.js lines 1-34: "to change X, edit Y, test with Z".
4. media-mesh `lib/knot-terms.md`, for the knot words.
5. docs/specs/lacing-tutorial.history.md. Grep it by heading, don't read it.
6. media-anim `docs/gpu-pool.md` "Open", for rendering. render-fps.md only for the iGPU lever table.
7. CHANGELOG.md and README.md, for the page's released behaviour.
8. `git log main..upstream/main`, before touching hose, cord, BOM or panel code.

**Authority, by area:**
- **Video behaviour:** the storyboard and shots JSON are the source. The transcript, `data.js`, chapters and sidebar
  are generated and lose to their source. Tests beat the spec's prose. The ropepath spec beats main's until the merge.
- **Timings:** a fresh run beats a spec number. The spec's "npm test 7-8 s" measured 18.3 s today.
- **Page release state:** `VERSION` in job.js plus CHANGELOG.md. Today both lag the code; the code wins.
- **Hose and cord geometry:** within the fork, `lr4.py` and `hose_route.js` must agree (test_hose_route.js). Across
  repos, upstream's `cable_sim.js` route is the newer design and does not agree with ours.
- **GPU and render policy:** media-anim `docs/gpu-pool.md` and the drafts' history beat render-fps.md D2.
- **Push and publish:** CLAUDE.md:25 and the maintainer's word in the current session. MA-5's status is in
  media-anim BACKLOG-INDEX.md.
