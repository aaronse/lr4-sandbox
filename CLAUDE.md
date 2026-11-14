# LR4 Sandbox - notes for Claude

A V1 Engineering LowRider 4 modelled in FreeCAD from the official STLs, plus a browser sandbox page (LowRider 4 Sandbox) fed by fits
across many FreeCAD builds. See README.md for the layout. FreeCAD 1.1, Python 3, Node for tests.

## Start here

- **This is a fork** (origin aaronse/lr4-sandbox, upstream jeyeager65/lr4-sandbox). Before editing a file upstream
  owns, bumping `VERSION`, or merging upstream: `docs/FORK.md` (what the fork adds, where, and the merge steps).
- If `private/RESUME.md` exists (maintainer's git-ignored notes), read it first: state, open items, publish steps.
  Then `docs/PLAN.md` (settings, measurements, decisions). `private/LOG.md` is the history: grep it, don't read it.
- Big projects are worked in numbered parts (`private/CONFIGURATOR.md` "Work in parts"): "do part N" means read
  RESUME + that plan's decisions + that part only, finish by ticking it with a notes line, a LOG entry, and RESUME if
  the run or publish steps changed. Don't start the next part in the same session.

## Rules

- **Script-owned model.** Change `freecad/build.py` parameters or `freecad/lr4.py` constants and rebuild; never
  hand-edit `build/LowRider4.FCStd` (the next build overwrites it).
- **Measured, not assumed.** Every part frame in `lr4.py` was solved from hole patterns, sections and overlap scans,
  with a note on each. Don't re-derive them, and don't assume design angles: fit the real features.
- **`freecad/fclib/` is a vendored copy.** Don't edit it here. Change the source (the maintainer's FreeCAD workspace,
  `D:/FreeCAD/lib/fclib`), then `python tools/sync_fclib.py`.
- **`web/js/lib/cnc-gcode-tools/` is a vendored copy too**, pinned to a commit in its `SOURCE.json`. Change the source
  (`D:/GitHub/cnc-gcode-tools`) and commit there, then `python tools/sync_gcode_tools.py` (`--check` runs in CI).
- **No part files in git.** STL / STEP / DXF / OBJ / 3MF / FCStd, and `parts/`, `private/`, `vendor/`, `build/`,
  `exports/` are git-ignored, and `tools/check_no_parts.py` is the pre-commit hook. The V1E files are V1E's; users
  download their own. `web/data/` is committed: the page's data from `pipeline/share_data.py`, with no V1E geometry.
- **Commit or push only when the maintainer asks.** V1E has approved the public version; pushing and GitHub Pages
  still wait for the maintainer's go.
- **Keep JS and Python rules in step.** The page mirrors several Python rules (`lr4.hose_route` / `cord_route` /
  `jp3_shift` in `web/js/config_model.js`; `calculator.py` / `calculator.js`; `strut_plate.py` / `strut_plate.js`).
  Change both and run the tests.
- Units: mm inside; the cutting area and table are in inches. Axes: X along the beam, Y along the table (front 0),
  Z up.
- **Versions:** a user-visible page change bumps `VERSION` in `web/js/page/job.js` and gets a CHANGELOG.md entry; a new
  feature or a moved control also gets its README.md line (and a new screenshot in `docs/img/` if one shows it).
  CI (`.github/workflows/ci.yml`) runs only what works without part files: the guard, a Python compile, `npm test` (in `tests/`; the root `package.json` forwards to it).

## Running

- Build: `python tools/run.py freecad/build.py` (headless, ~1.5 min warm / ~4 min cold) - run it in the background
  with output to a log, then read the report lines (`[time]`, `flag`, `overlap`, `error`), not the whole log.
  `LR4_CHECK=0` skips the overlap check while iterating.
- Heavy work (builds, CAM, section sweeps, size builds) runs headless, never in the FreeCAD GUI: a long GUI call
  freezes it. Headless FCStd files carry no colours; open them in the GUI with `fclib.view.open_build`.
- After a model change that the sandbox page shows: `python pipeline/size_builds.py` (~55 min) ->
  `python pipeline/fit_config.py` -> `node tests/test_config_model.js` (must print "all N sizes match";
  it fails when there are no size builds to compare).
- Page: `python tools/serve.py sandbox`.
- Browser lock: `page_shot.js`, `record_demo.js`, the page tests and media-anim's stills / draft take one lock (vendored
  `tools/lib/media-anim/media-anim-browser.min.js`) and wait up to 600 s, printing the holder; `--wait 0` fails at once (tests: `BROWSER_LOCK_WAIT`).
- Waiting on a long job (a render, a draft, the lock, npm test): start it with the Bash tool's `run_in_background` and
  let its exit notify you; never a foreground `sleep` / `until grep` / `while ps` loop (`fab perf reflect` 2026-11-10:
  166 such loops, 203 min, across 5 sessions). Let the lock do the queueing (`node tools/lib/media-anim/media-anim-browser.min.js run --wait 600 -- <cmd>`); to wait for a free browser without taking it,
  `node tools/lib/media-anim/media-anim-browser.min.js wait --wait 600` in the background.
- Dev events (`docs/specs/dev-events.md`): `.logs/events.jsonl` (git-ignored). `serve.py`, `tools/run.py` and `build.py` write them when `DEVLOG_LIB`
  names the devlog folder: server 4xx / 5xx / errors, one `run` per FreeCAD script, build stages, the overlap check.
  When something breaks run `node $DEVLOG_LIB/devlog.mjs errors` first; `check` before handing off a server or build change.
- Page tests: `tests/test_page_*.js` drive headless Chrome (several need `parts/`; the FluidNC ones take minutes).
  Screenshots: `node tools/page_shot.js <url> <out.png> [--eval js --shot out2.png]...`.
- Videos: `python tools/serve.py sandbox --no-open`, then `node tools/record_demo.js <file.gcode> [out.mp4]` in the
  background (~6 min for 2 min of 1080p). The `(Video ...)` comment spec is the header of `web/js/demo_script.js` (the director: `web/js/page/director.js`);
  README's table follows it, so update both. Example: `docs/examples/feature_demo.gcode`. Send the video to the
  maintainer rather than analysing it. The maintainer watches on this PC: give the path, make no smaller copy.
- Files the pipeline makes live in the repo folder, git-ignored, so the maintainer sees what the agents see: drafts and
  contact sheets in `.exports/<pipeline>_drafts/`, every intermediate file (research downloads, stills rounds, notes,
  measuring and one-off scripts) in `.cache/<pipeline>/`, never a tool's temp directory. Brief subagents to write there
  too. The lacing tutorial's map (commands, outputs, measured times) is in `docs/specs/lacing-tutorial.md` "Pipeline".
- Changing the lacing tutorial: start at `docs/specs/lacing-tutorial.md` "Agent quickstart" (what to read, what to run
  after each kind of change). Brief subagents with it, not the whole spec; the drafts' record is
  `lacing-tutorial.history.md`. To see a changed scene, render just it: `node tools/lacing_voice.js render <out> --scenes <id>`
  (`scenes diff` prints the line; ~2 min for the goal, reused by the full render), never the whole video.

## Keeping context small

- `lr4.py`, `build.py`, `hardware.py` and the pages are big: grep for the constant or function and read that range.
- Query generated JSON (`build/fasteners.json`, `bom.json`, `web/data/*.json`) with a short script; don't read it.
- Screenshots: only the views that show the change, small.
