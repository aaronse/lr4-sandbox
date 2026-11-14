# Dev events

What this repo's tools record about themselves, so an agent can find what broke or got slower without reading logs.
The format and the reader are devlog's, outside this repo; this file is what lr4-sandbox emits and decided.

## Where

- `.logs/events.jsonl`, git-ignored, one JSON event a line. Written only when `DEVLOG_LIB` names the folder that holds
  `devlog.py` / `devlog.mjs`; without it every tool runs as before and writes nothing (CI, other machines).
- `.logs/raw/<tool>/`: raw output of long runs (the LAN server's stdout / stderr, a build's log).
- Read with `node $DEVLOG_LIB/devlog.mjs errors | check | summary | perf <tool/name> | tail`.

## What each tool emits

| Tool | Events |
|---|---|
| `tools/serve.py` | `start` (page, port, `--lan`); `http` for every 4xx / 5xx and any request over 1000 ms except a video's 206 chunks (path without its query, ms, client); `error` for a handler exception (a client disconnect is not one); `run` on Ctrl+C with the uptime |
| `tools/run.py` | one `run` per FreeCAD script (tool = the script's name: `build`, `source_frames`, ...): seconds, ok, exit, and on a failure the traceback's last line in `data.error`. Sets `DEVLOG_RUN`, so the script's own events share its run id |
| `freecad/build.py` | `perf stage.<name>` (seconds) from each `stage()` call; `check overlap` (intersecting pairs, ok when none, the first 20 pairs) |
| `tests/test_serve.js` | writes to a throwaway `DEVLOG_DIR` under `.cache/`, so its deliberate 404s never read as problems; asserts the start event, a 404 event, and no event for a fast 2xx |

## Decisions

- **`--lan` serves `.exports/` and refuses every other dot-folder** (`.git`, `.cache`, `.logs`) and `private/`
  (2026-11-09). The drafts moved from `exports/` to `.exports/` in 27c77e2 and the dot-folder guard answered 404 for
  every one; nothing recorded it until the maintainer opened the link on another device. That miss is why the server
  now logs every 4xx. Draft links: `http://<ip>:8767/.exports/<pipeline>_drafts/`.
- **No devlog code in this repo.** The writer is loaded from `DEVLOG_LIB`; the repo carries only the five-line loader in
  each tool, so nothing reusable lands in this public history.
- **A 4xx is listed, not a gate failure.** Browsers probe for files that do not exist; `devlog check` fails on failed
  runs, errors, failed checks, 5xx and perf past `devlog.baseline.json`.

## Open

| Id | Item | Needs |
|---|---|---|
| OB-1 | The overlap `check` event and a full build's stage series are unseen: `parts/lr4/` has been missing on the maintainer's PC since 2026-11-09, so `build.py` stops at `YZ_Plate_Min_V1.stl` (devlog recorded that run as failed with the `OSError`) | the part files, then `python tools/run.py freecad/build.py` and `devlog.mjs tail` |
| OB-2 | `devlog.baseline.json` at the repo root: budgets for the build stages, and later the page's frame rate (render-fps spec) | OB-1, then about five builds' `perf` series |
| — | The empty `exports/lacing_drafts/` left by the move could not be removed (another process holds it) | delete it when that process closes |
