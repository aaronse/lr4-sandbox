# The fork

`origin` = aaronse/lr4-sandbox (this fork), `upstream` = jeyeager65/lr4-sandbox (Jason Yeager's, announced on the V1E
forum: "LowRider 4 Sandbox (virtual, in browser)"). The fork adds the cable-lacing tutorial and its tooling; upstream
owns the machine, the page and the data. The rule that keeps merges cheap: **fork work goes in fork-only files**, and
the few hunks the fork needs in upstream's files stay small and listed below.

## Last merge

2026-11-12: upstream `ceaee06` (page 0.70.12) into the fork's main (136 commits ahead, 47 behind). Conflicts were in
CHANGELOG.md, freecad/lr4.py, tests/package.json, tests/test_page_fluidnc.js, web/js/page/hose_bom.js,
web/js/page/job.js and web/js/page/panel.js. They came from the fork's in-page cable lacing (page 0.67.0, fork-only)
on upstream's hose code, which upstream rewrote as ropes (Parts 52-53). Decisions:

- **The page's cable lacing is gone** (the `Cable_Lacing` mesh, the BOM's waxed tape row, the Layers toggle, the
  routes split out of hose_bom.js). Upstream's hose_bom.js, panel.js, bom.py, config_model.js and lr4.py are taken as
  they are. On the forum Jason turned down a cable-lacing tutorial ("probably a bit much for the simulator").
- **The tutorial owns its geometry.** `web/js/hose_route.js` (`LR4Hose`) and its Python twins in `freecad/lacing.py`
  are frozen copies of the hose and cord routes as page 0.66.2 had them. `web/js/page/lacing_anim.js` draws its own
  hose, cord and sleeve from them (the rig). While the tutorial is on, it hides the page's hose, cords, ties and wires
  and shows the router's cord stub. Checked with page stills at 0 / 12 / 35.5 / 70 / 100 / 125 s against the
  pre-merge main.
- **VERSION and CHANGELOG.md are upstream's.** Both sides had a 0.67.0. The fork doesn't bump them; its page changes
  are listed below.
- **tests/package.json is upstream's** (`npm test` = run.js, every `test_*.js` but the page tests, one at a time).
  The fork's parallel runner `tests/run_tests.js` picks the same files. The media sync check became
  `tests/test_media_sync.js`, so both runners run it.

## Open

- **F1. Verification draft of the merge: done (2026-11-12).** Draft 14m matched 14b (stills 0.03-2.3 % of pixels; the
  green tip and end, and the hose placed by upstream's hub settle). The merge had taken upstream's `panel.js` `devFiles`
  (one 404 dropped every `?parts=` file): the fork's version restored, now in the table below.
- **F2. Draft 15's run on main: done the other way round (2026-11-12).** Main took `ropepath` (b310461; the
  `lacing_anim.js` rig kept, knotLace refs taken); draft 16 rendered from it. Left: the worktree
  `E:\git\wt\ropepath\lr4-sandbox` holds another session's uncommitted edits (lacing/core.js, plan.js,
  page/lacing_anim.js: the start close-up's longer hose): ported to main in 3b12b66 (d17), so the worktree and
  branch can go once that session confirms nothing else is in it. media-mesh merged
  its own `ropepath` (2026-11-13): `sync_media.js --check` passes. jensen-head merged too (fcaf9bf, the head optional).
- **F3. Upstream PR candidates** (the table above): ask Jason first.
- **F4. `test_sim_config.js` crashed once on exit** under `run_tests.js`, after 142/142 checks passed (libuv
  `UV_HANDLE_CLOSING`, Node 24). It passed on 3 separate re-runs, and upstream's own file is unchanged. Watch for it.
- **F5. The media libs become paid; lr4 gets minified bundles (2026-11-13).** media-mesh and media-anim are private paid
  repos; lr4 (public, MIT) is to vendor a minified bundle a domain, with its own notice, never source (media-mesh
  `docs/LAYOUT.md`; BACKLOG MM-8 the build, MM-9 lr4's switch with its golden frame dump). **media-mesh done (MM-9,
  2026-11-13):** `web/js/lib/media-mesh/` holds `media-mesh-core.min.js`, `media-mesh-knots.min.js`, `LICENSE-BUNDLE.md` and
  `SOURCE.json` (from media-mesh's local build at 0.1.0, commit 98c9fdc6, until a release exists: set `MEDIA_MESH_TAG` in
  `tools/sync_media.js`, then `node tools/sync_media.js` fetches it with `gh`); `sync_media.js --check` compares their sha256
  with `SOURCE.json`, offline, so CI needs no sibling; the golden dump (`scenes write`, Node, 4227 frames) is byte-identical
  before and after; `test_lacing_tutorial.js` takes knotdet / clearance from the knots bundle (its 53 checks on them now run
  on CI too); `lacing_voice.js parts` calls `mesh/tools/reduce.ts`.
  **media-anim done (MM-14 / MA-10, 2026-11-13):** `web/js/lib/media-anim/` holds `media-anim-runtime.min.js` (`MediaAnim.timeline` ... `.tweak`),
  `media-anim-characters.min.js` (`MediaAnim.faceRig`, `.faceOverlay`), `jensen-head-only.svg`, `LICENSE-BUNDLE.md` and `SOURCE.json`;
  `tools/lib/media-anim/` holds `media-anim-browser.min.js` (the browser lock; also `node ... run|wait|status`). Same `sync_media.js`
  (`MEDIA_ANIM_TAG`, or the sibling's `dist/` until a release exists), same `--check`. The golden dump is byte-identical before and after
  (4227 frames, 14 scenes; both dumped from one frozen copy of this repo, since another session's `END = 15` moves `endSeg`). The sibling's
  tools are now loaded by their new paths (`audio/probe.ts`, `pipeline/golden.ts`, `capture/scenes.ts`, ...: `.ts`, run by Node 24).
  `web/js/lib/jensen/` is gone (the head is in the characters bundle). A scene render cache made before this has other keys (the
  renderer's file list names the runtime bundle): its segments miss once.
- **Push.** The history was rebuilt on 2026-11-14 (media-anim MA-12) from the final tree, never replayed: three commits
  on upstream `ceaee06`, each one reviewable on its own: (1) recording and dev-server fixes and `?stats`, (2) the lacing
  tutorial with the vendored bundles, (3) the fork's tooling and notes; then this paragraph. Commit 1 is an upstream
  pull request as it stands, commits 1-2 a second. The rebuilt tree equals the old one (`git diff` empty), no object
  holds media-* source (only the `.min.js` bundles), and the golden dump, `run_tests` and `sync_media.js --check` match.
  The old history is the local tag `pre-ma12-main` and the bundles in `C:\backup\lr4-sandbox-2026-11-14*`: it carries
  media-mesh's and media-anim's source, so **never push that tag**, and never `git push --all`, `--tags` or `--mirror`
  from this clone. Push named refs only: `git push origin main`, a fast-forward of `origin/main`. Push only on the
  owner's go. Main's commits after this one are ordinary; squash a run of them before a push when they are noise.

## Fork-only files

| what | files |
|---|---|
| lacing tutorial | `web/js/lacing/`, `web/js/lacing_tutorial.js`, `web/js/page/lacing_anim.js`, `anim_player.js`, `anim_tweak.js`, `web/js/hose_route.js`, `freecad/lacing.py`, `docs/specs/lacing-tutorial*`, `docs/examples/lacing_tutorial.gcode`, `tools/lacing_*.js`, `tests/test_lacing_*.js`, `test_hose_route.js`, `test_anim_player.js`, `test_page_anim_play.js`, `tests/fixtures/lacing_*` |
| vendored media libs | `web/js/lib/media-anim/`, `web/js/lib/media-mesh/`, `tools/lib/media-anim/`, `tools/sync_media.js`, `tests/test_media_sync.js` |
| mesh stats (`?stats`) | `web/js/mesh_stats.js`, `web/js/page/stats.js`, `tests/test_mesh_stats.js`, `test_page_stats.js` |
| dev tooling | `tests/run_tests.js`, `tests/test_serve.js`, `test_rec_frames.js`, root `package.json`, `.gitattributes`, `docs/specs/dev-events.md`, `render-fps.md` |
| notes | `docs/FORK.md`, `docs/state/`, `research/scout/` |

## Upstream files the fork changes

Keep each hunk small and in one place. When a change grows, move it into a fork-only file and leave a one-line hook.

| file | the fork's hunk | why |
|---|---|---|
| `web/index.html` | script tags: hose_route, mesh_stats, the media libs, the lacing modules, lacing_anim, anim_player / tweak, stats | the page loads them |
| `web/js/page/director.js`, `web/js/demo_script.js` | `(Video Lacing: LOOPS=)`; recording without part files | the tutorial's video |
| `web/js/page/scripting.js` | a stopped clock skips redraws; `LR4AnimTick` / `LR4StatsTick` hooks | recording speed, live preview, stats |
| `web/js/page/table.js` | `statsName` on the two height fields | stats labels |
| `freecad/build.py`, `tools/run.py`, `tools/serve.py` | devlog events (when `DEVLOG_LIB` is set); serve.py: HTTP Range, keep-alive, `--lan`, the shots file | dev events, phone preview |
| `tools/page_shot.js`, `tools/record_demo.js`, `tools/chrome_profile.js`, `tests/test_page_fluidnc.js` | the browser lock; record_demo `--timing` and friends | one headless browser at a time |
| `tests/test_router_body.js`, `tests/test_demo_script.js` | worker threads (9.7 to 2.0 s); the Lacing command's checks | test speed |
| `web/js/page/panel.js` | `devFiles` skips a file the `?parts=` folder lacks (upstream drops them all on one 404) | drafts use a reduced part set |
| `CLAUDE.md`, `README.md`, `docs/PLAN.md`, `.gitignore` | the fork's lines | docs |

These could go upstream as pull requests, which would shrink this table: serve.py's Range and keep-alive,
test_router_body's worker threads, record_demo's `--timing`, and the director recording without part files. Jason's
only stated wish for contributions is "If you happen to update/improve a model, please export and share." Ask him
before opening PRs.

## Fork page changes (not in CHANGELOG.md)

- `?anim=lacing` (the tutorial's check page; `&play=1` the live preview with its voice-over), `(Video Lacing:)`.
- `?stats`: the mesh stats panel.
- `tools/serve.py --lan`.

## Merging upstream

1. `git fetch upstream`, then work in a worktree so main stays usable:
   `git worktree add ../lr4-merge -b merge-upstream main`, then `cd ../lr4-merge && git merge upstream/main`.
2. Resolve: upstream wins in its own files; put back only the fork hunks in the table above. If a conflict is in a
   file the fork shouldn't touch, the fork code belongs in a fork-only file.
3. The data the tutorial reads: `meta.hose` (web/data/lr4_config.json). Compare its keys before and after the merge.
   The rig needs `od`, `port`, `cuff_in`, `top`, `clear`, `loop_r`, the tray / bump / clamp keys, `cord` (`d`, `tip`,
   `tip2`, places) and `sleeve` (`d`, `exit`). `node tests/test_hose_route.js` fails if they're gone.
4. `node tests/run_tests.js` (about 17 s), then `npm test` in `tests/` (upstream's runner, what CI runs).
5. Tutorial stills against the old main: serve both trees (`python tools/serve.py sandbox --no-open --port=N`), then
   `node tools/page_shot.js "http://127.0.0.1:N/web/index.html?anim=lacing" out.png --size 960x540 --eval
   "await new Promise(r=>{const w=()=>window.__anim?r():setTimeout(w,200);w();}); __anim.setT(12)" --shot t12.png ...`.
   Compare the pairs. The rig's hose, cord, sleeve and tape should match; upstream's own parts may differ.
6. Fast-forward main to the merge (`git merge --ff-only merge-upstream` in the main tree), then remove the worktree.
   After a merge, main contains `origin/main`, so pushing to the fork is a fast-forward (push only when the
   maintainer asks).
