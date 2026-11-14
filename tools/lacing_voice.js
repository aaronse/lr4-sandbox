// The cable-lacing tutorial's voice-over, its storyboard timing and its transcript (docs/specs/lacing-tutorial.md):
//   node tools/lacing_voice.js tts [--dir exports/lacing_voice] [--only id,...] [--keep [--idle 900]]
//       each scene's spoken line (LR4LacingTut.spoken(narration): the inches in parentheses dropped) in the maintainer's
//       cloned voice through media-gen (scripts/voice/say.py --batch, one model load; contract: media-gen
//       docs/tts-worker.md), then each wav measured with ffprobe -> audioS in docs/specs/lacing-tutorial.storyboard.json
//       and its copy in web/js/lacing/data.js; then the TTS workers stopped (one GPU job at a time). Refuses unless
//       nvidia-smi says the GPU's power limit is 300 W. The wavs stay in --dir (git-ignored: exports/).
//       --keep (a draft session, R4): the worker left warm for the next tts, which skips the model load; it exits by
//       itself after --idle s unused (default 900), or now: node ../media-anim/audio/tts.ts --stop (before any
//       other NVIDIA GPU job). A stale or dead worker: a cold load (media-anim audio/tts.ts).
//   node tools/lacing_voice.js tighten [--only id,...]
//       (d27) each picked take tightened as the storyboard's voice.tighten { edge, wpm, maxPause } says (set to 0.05 s,
//       175 wpm, 0.35 s when missing): media-anim audio/words.ts (faster-whisper, CPU) for the pause cap, then
//       audio/tighten.ts -> <dir>/<id>.tight.wav beside the take (never touched); audioS = the tightened length. With
//       voice.tighten set, mux plays the .tight.wav files, tts tightens what it voices, and tools/lacing_words.js times
//       the callouts in them. Work files: .cache/lacing-tutorial/tighten/ (jobs.jsonl, words.json, tighten.json)
//   node tools/lacing_voice.js sync        the storyboard and the shots (docs/specs/lacing-tutorial.shots.json: cameras,
//       layer opacities, colours) into their copies in web/js/lacing/data.js (no TTS)
//   node tools/lacing_voice.js transcript  docs/specs/lacing-tutorial.transcript.json from the storyboard, the measured
//       timing and the plan's numbers (LR4Hose.LACING), with each scene's and line's sources (the storyboard's
//       `references` and its `sources` / `uncited`; the research: docs/specs/lacing-tutorial-research/)
//   node tools/lacing_voice.js sfx [--dir exports/lacing_voice]
//       <dir>/sfx/swipe.wav: the trim's sound (draft 6) - an original "whoosh + slice", synthesised here (seeded noise
//       through a band-pass swept 500 -> 4000 Hz, then a short bright ring on the cut, SHOTS.blade.sfxLead s in), its
//       peak 6 dB under the voice-over's (the voiced lines' median peak, ffmpeg volumedetect)
//   node tools/lacing_voice.js mux <video.mp4> <out.mp4> [--dir exports/lacing_voice] [--dry-run]
//       each scene's wav placed at its scene's start, and the swipe at each cut (LR4LacingTut.sfxAt, its lead before),
//       and the music's intro and outro (musicPlan) (the video's t = the tutorial's t: (Video Lacing:) is its intro);
//       the storyboard's loudness { I, TP, LRA } set: the mix normalised to it (media-anim mix.ts --loudnorm, two passes).
//       --dry-run prints the ffmpeg args as JSON and runs nothing.
//   node tools/lacing_voice.js draft <out.mp4> [--url http://127.0.0.1:8767/web/index.html?anim=lacing] [--no-voice]
//        [--size 1280x720] [--fps 30] [--quality 80] [--secs N] [--timeout 600] [--keep] [--work DIR] [--swiftshader]
//       a real-time draft of the page's ?anim=lacing (media-anim capture/draft.ts: needs python tools/serve.py
//       sandbox --no-open), then this file's mux on it (none with --no-voice). Prints "DRAFT: N of M frames held".
//   node tools/lacing_voice.js chapters    the storyboard's `chapters` timed by timing(): docs/specs/lacing-tutorial.chapters.vtt
//       (WebVTT, a cue a chapter, 0 to the video's end with no gaps) and lacing-tutorial.youtube.txt (description lines
//       "M:SS Title", floored to the second; refuses unless YouTube's rules hold: the first at 0:00, 3 or more, each 10 s+)
//   node tools/lacing_voice.js sidebar     docs/specs/lacing-tutorial.sidebar.json: references, the glossary (the terms with
//       their reference's title and url), and per chapter its lines (a scene's own and its later ones, the transcript's
//       times) with their sources resolved and the terms its callouts show (t_in / t_out from callout events, if any)
//   node tools/lacing_voice.js zoomtube [--video-id ID]
//       exports/lacing_zoomtube/proj-config-lr4-lacing.json: a ZoomTube schema-v2 manifest (E:/git/zt-web ProjectViewer.js),
//       a seq a scene, one 1.0x YouTube video (src null until --video-id), citations and glossary in fields the viewer
//       ignores (documents, glossary, seqs[].claims); and its README.md (how to view it, the viewer's gaps)
//   node tools/lacing_voice.js scenes [diff|check|accept|hashes|write <file>] [--against <dump.json.gz>] [--shots FILE]
//       the changed-scene diff (media-anim pipeline/golden.ts): every frameAt at 30 fps, the plan and the public
//       outputs against the accepted dump (.cache/lacing-tutorial/golden/accepted.json.gz, or --against). diff (the
//       default): a line a scene, its changed frames, first / last t and max numeric diff, or "identical", then the
//       render --scenes line that shows just the changed ones (also in brief); check: exit 1
//       unless every value is the same (a change meant to move no frame; prints "same:"); accept: the current output
//       becomes the baseline (after a draft is accepted; the one before kept as accepted.prev.json.gz); hashes: each
//       scene's hash (the scene render cache's key, MA-8); write <file>: a dump to diff against later. --shots: the dump
//       drawn from that shots file (a copy, or an older draft's), not data.js's
//   node tools/lacing_voice.js brief [--against <dump.json.gz>]
//       the stage brief: the changed scenes (scenes diff), each with its storyboard entry and its shots.json rows
//       (camera keys, layers, lead, knots, blade cuts), then the quickstart's "you change / then run" table
//   node tools/lacing_voice.js render <out.mp4> [--size 1280x720] [--url URL] [--shots FILE] [--force a,b] [--no-voice] [--no-head] [--rider 0|1] [--jensencam 0|1]
//        [--swiftshader] [--timeout 3600] [--scenes a,b] [--dry-run]
//       the scene render cache (media-anim capture/scenes.ts, MA-8): each scene frame-exact to
//       .cache/lacing-tutorial/scenes/<key>.mp4 (key: its golden scene hash with --shots, the renderer's files, size, fps,
//       encoder), a hit reused wherever the scene sits, the misses rendered in one browser, joined (concat -c copy) and
//       mux above. Needs python tools/serve.py sandbox --no-open (with LR4_SHOTS_FILE = --shots for a shots copy: the page's
//       shots are checked). Prints each scene's hit or render time. --scenes a,b: just those scenes rendered and joined,
//       the picture only (a one-scene review: its segment is the same one a full render reuses); --dry-run: each scene's
//       hit or miss, no browser, no server needed
//   node tools/lacing_voice.js clip <out.mp4> [--pad 1] [--against <dump>] [render's flags]
//       the review clip: the scenes changed against the accepted dump (scenes diff), --pad s either side, with sound
//   node tools/lacing_voice.js still <t> [t...] --out <dir> [--shots FILE]
//       frames pulled from the cached segments (ffmpeg, no browser) and contact-sheet.jpg
//   node tools/lacing_voice.js parts [--src dir,dir] [--target 0.05] [--no-measure]
//       the reduced parts (d12): the V1E files the page draws, found by SHA-256 in .cache/lacing-tutorial/parts_src/ and
//       parts/ (or --src), reduced by media-mesh mesh/tools/reduce.ts (MM-3) into .cache/lacing-tutorial/parts/<manifest path>,
//       DXFs and the bristle strip copied; the report: .cache/lacing-tutorial/parts_report.json (triangles, ms, the
//       face-sampled max / mean). While that folder has files, render / clip / iterate / still / draft load the page with
//       ?parts= on it, its files are in the render key, and render checks Full detail and the Parts chip's count
//   node tools/lacing_voice.js iterate [--against <dump>] [--shots FILE] [--url URL] [--pad 1] [--no-voice] [--no-log]
//       one command after a scene change (R8): the changed scenes, their checks (test sections), a server (unless --url),
//       render, the changed-scenes clip and stills + contact sheet (.exports/lacing_drafts/iterate_<stamp>_*), a timelog
//       stage (lacing-tutorial.timelog.jsonl); stops at the first failing step; one summary block
// Env: MEDIA_GEN (E:/git/media-gen), VOICE (voices/aza: media-gen's name for the owner's current voice), TTS_PYTHON (<media-gen>/envs/tts/...),
// MEDIA_ROOT (where the media-anim sibling is; default this repo's parent).
// The voice is a synthetic clone of the maintainer, with his consent: anything published carries the disclosure line in
// media-gen voices/aza/PROVENANCE.md (the storyboard's credits say it).
// The reusable halves live in the private media-anim sibling (MA-5): audio/ (tts, probe, sfx, mix: musicPlan,
// gainExpr, the ffmpeg graph), publish/exports.ts (chapters, sidebar, ZoomTube), capture/draft.ts. This
// file keeps the lacing tutorial's choices: which lines, its storyboard and page, its titles and paths. Every command
// but sync needs media-anim; without it they stop with a note (hasMediaAnim: the tests skip on CI).
"use strict";
const { spawnSync } = require("child_process"), fs = require("fs"), path = require("path");

const ROOT = path.join(__dirname, "..");
const SB_JSON = path.join(ROOT, "docs", "specs", "lacing-tutorial.storyboard.json");
const TUT_JS = path.join(ROOT, "web", "js", "lacing_tutorial.js");
const TUT_DATA = path.join(ROOT, "web", "js", "lacing", "data.js");   // (the storyboard / shots copies sync writes)
const SHOTS_JSON = path.join(ROOT, "docs", "specs", "lacing-tutorial.shots.json");
const WORDS_JSON = path.join(ROOT, "docs", "specs", "lacing-tutorial.words.json");   // (d29: tools/lacing_words.js, the lip sync's word times)
const TRANSCRIPT = path.join(ROOT, "docs", "specs", "lacing-tutorial.transcript.json");
const MEDIA_GEN = path.resolve(process.env.MEDIA_GEN || "E:/git/media-gen");
const VOICE = path.resolve(MEDIA_GEN, process.env.VOICE || "voices/aza");
const PY = process.env.TTS_PYTHON || path.join(MEDIA_GEN, "envs", "tts", "Scripts", "python.exe");
const MEDIA_ANIM = path.join(process.env.MEDIA_ROOT || path.join(ROOT, ".."), "media-anim");
// a media-anim tool's module (ESM, loaded by require: Node 22.12+), or a stop that says where it was looked for
const hasMediaAnim = () => fs.existsSync(path.join(MEDIA_ANIM, "publish", "exports.ts"));
function MA(rel) {
  const p = path.join(MEDIA_ANIM, rel);
  if (!fs.existsSync(p)) throw new Error(`media-anim not found (${p}): clone it beside this repo or set MEDIA_ROOT`);
  return require(p);
}

const args = process.argv.slice(2), cmd = args[0];
const flag = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
// the positional arguments after the command (the flags and their values left out)
const VALUED = ["--scenes", "--dir", "--against", "--only", "--video-id", "--url", "--size", "--fps", "--quality", "--secs", "--timeout", "--work", "--bin", "--out", "--shots", "--force", "--pad", "--src", "--target"];
const positional = () => args.slice(1).filter((a, i, A) => !a.startsWith("--") && !(i > 0 && VALUED.includes(A[i - 1])));
const dir = path.resolve(ROOT, flag("--dir", "exports/lacing_voice"));
const readSb = () => JSON.parse(fs.readFileSync(SB_JSON, "utf8"));
const T = () => { delete require.cache[require.resolve(TUT_JS)]; return require(TUT_JS); };
// a line's take as voiced (tts writes it; the take the maintainer picked by seed: never rewritten but by tts), and the
// tightened copy beside it (tighten, d27): what the video plays when the storyboard's voice.tighten is set
const rawOf = (id) => path.join(dir, `${id}.wav`);
const tightOf = (id) => path.join(dir, `${id}.tight.wav`);
const wavOf = (id, sb = readSb()) => (sb.voice && sb.voice.tighten ? tightOf(id) : rawOf(id));
const seconds = (p) => MA("audio/probe.ts").seconds(p);   // what landed on disk, not what the generator reported

// the storyboard JSON -> its copy in web/js/lacing/data.js (between the <storyboard> markers), and the shots JSON -> its copy
// (between <shots>), and the words JSON's lines (d29) -> WORDS (between <words>); the test keeps each pair equal
function block(js, tag, body) {
  const a = `  // <${tag}>`, b = `  // </${tag}>`, i = js.indexOf(a), j = js.indexOf(b);
  if (i < 0 || j < i) throw new Error(`${TUT_JS}: no <${tag}> markers`);
  return js.slice(0, js.indexOf("\n", i) + 1) + body + js.slice(j);
}
const indent = (o) => JSON.stringify(o, null, 2).replace(/\n/g, "\n  ");
function sync(sb = readSb()) {
  const shots = JSON.parse(fs.readFileSync(SHOTS_JSON, "utf8"));
  let js = fs.readFileSync(TUT_DATA, "utf8");
  js = block(js, "storyboard", `  const STORYBOARD = ${indent(sb)};\n`);
  // (one line a scene: the copy is for the code; the JSON is the one to read)
  const line = (o, pad) => `{\n${Object.entries(o).map(([k, v]) => `${pad}  ${JSON.stringify(k)}: ${k === "scenes" ? line(v, pad + "  ") : JSON.stringify(v)}`).join(",\n")}\n${pad}}`;
  js = block(js, "shots", `  const SHOTS = ${line(shots, "  ")};\n`);
  // (d29: each voice line's words, s into its wav, one line a voice line: tools/lacing_words.js, the lip sync)
  const W = fs.existsSync(WORDS_JSON) ? JSON.parse(fs.readFileSync(WORDS_JSON, "utf8")).lines : {};
  js = block(js, "words", `  const WORDS = {\n${Object.entries(W).map(([id, ws]) => `    ${JSON.stringify(id)}: ${JSON.stringify(ws)}`).join(",\n")}\n  };\n`);
  fs.writeFileSync(TUT_DATA, js);
}

// the voice's version (media-gen <voice>/voice.json version.id: aza moves when the maintainer picks a new one), or null
function voiceVersion() {
  try { return JSON.parse(fs.readFileSync(path.join(VOICE, "voice.json"), "utf8")).version.id || null; } catch (e) { return null; }
}

function tts() {
  const sb = readSb(), { spoken } = T();
  // every line: a scene's own and its later ones (more); --only id,id voices just those, the other wavs kept
  const only = flag("--only") ? flag("--only").split(",") : null;
  const all = sb.scenes.flatMap((s) => [s, ...(s.more || [])]);
  if (only) for (const id of only) if (!all.some((l) => l.id === id)) throw new Error(`--only: no line ${id}`);
  const todo = all.filter((l) => !only || only.includes(l.id));
  // a line's `seed` is the take the maintainer picked by ear (media-gen gen_anchor_page.py / gen_reroll_page.py): the same
  // text, seed and voice version render byte-identical. The storyboard's `voice.version` is the version they were picked
  // in; another version makes them different takes, so it stops (re-pick, or VOICE=<that version's built_as dir>)
  const vv = voiceVersion();
  if (sb.voice && sb.voice.version && vv && sb.voice.version !== vv)
    throw new Error(`the storyboard's seeds were picked in ${sb.voice.name} ${sb.voice.version}; ${VOICE} is ${vv}: re-pick them, or set VOICE to the ${sb.voice.version} built_as dir (media-gen voices/aza/README.md)`);
  const jobs = todo.map((l) => ({ id: l.id, text: spoken(l.narration), voice: VOICE, out: rawOf(l.id), ...(l.seed != null ? { seed: l.seed } : {}) }));
  // media-anim tts.ts: the 300 W cap checked, jobs.jsonl written (the record of what was said), one say.py --batch,
  // the workers stopped (the GPU free before any render; --keep: left warm, idle exit --idle s), each wav measured with ffprobe
  const keep = args.includes("--keep"), idleS = Number(flag("--idle", 900));
  if (keep && !(idleS > 0)) throw new Error("--idle wants seconds");
  const r = MA("audio/tts.ts").ttsBatch(jobs, { jobsPath: path.join(dir, "jobs.jsonl"), dir, cap: 300, mediaGen: MEDIA_GEN, python: PY, keep, idleS });
  for (const l of todo) {
    l.audioS = r.seconds[l.id];
    console.log(`  ${l.id.padEnd(9)} ${l.audioS.toFixed(3).padStart(7)} s  ${spoken(l.narration)}`);
  }
  // the new takes tightened as the storyboard says (their audioS: the tightened length the video plays)
  if (sb.voice && sb.voice.tighten) tightenLines(sb, todo.map((l) => l.id));
  // a later line (more) is spoken in its scene's hold: say so when it doesn't fit (the hold is the author's to set)
  for (const s of sb.scenes) {
    let used = s.audioS || 0;
    for (const m of s.more || []) used += (m.gapS || 0) + (m.audioS || 0);
    if (used > (s.audioS || 0) + s.holdS) console.log(`  ${s.id}: its lines run ${used.toFixed(2)} s, past its ${((s.audioS || 0) + s.holdS).toFixed(2)} s: lengthen holdS`);
  }
  fs.writeFileSync(SB_JSON, JSON.stringify(sb, null, 2) + "\n");
  sync(sb);
  const vj = path.join(dir, "voice.json"), old = fs.existsSync(vj) ? JSON.parse(fs.readFileSync(vj, "utf8")).lines || [] : [];
  const lines = all.map((l) => ({ id: l.id, text: spoken(l.narration), seconds: l.audioS, ...(l.seed != null ? { seed: l.seed } : {}) }));
  for (const l of lines) { const o = old.find((q) => q.id === l.id); if (o && !jobs.some((j) => j.id === l.id)) l.text = o.text; }   // (kept: as voiced)
  fs.writeFileSync(vj, JSON.stringify({ voice: path.relative(MEDIA_GEN, VOICE).split(path.sep).join("/"), version: vv,
    note: "synthetic clone of the maintainer, with his consent: published media carry the disclosure in media-gen voices/aza/PROVENANCE.md", lines }, null, 2) + "\n");
}

// ---- the tightened takes (d27; practice youtube-videos PC-3b, PC-6, the owner's D7: 175 wpm, lines 160-190): each
// picked take's lead and trail cut to voice.tighten.edge, its pauses between words capped at maxPause, then sped up
// (pitch kept) toward wpm (media-anim audio/tighten.ts: tempo 1.00-1.20, never slower). The words for the pause cap
// come from audio/words.ts (faster-whisper on the CPU). The take stays as tts wrote it; the copy is <id>.tight.wav
// beside it, and the work files (jobs, words, the tighten map) are in .cache/lacing-tutorial/tighten/ ----
const TIGHT_DIR = path.join(ROOT, ".cache", "lacing-tutorial", "tighten");
function tightenLines(sb, ids = null) {
  const o = sb.voice && sb.voice.tighten;
  if (!o) throw new Error("the storyboard has no voice.tighten { edge, wpm, maxPause }");
  const { spoken } = T(), all = sb.scenes.flatMap((s) => [s, ...(s.more || [])]);
  if (ids) for (const id of ids) if (!all.some((l) => l.id === id)) throw new Error(`--only: no line ${id}`);
  const todo = all.filter((l) => !ids || ids.includes(l.id));
  for (const l of todo) if (!fs.existsSync(rawOf(l.id))) throw new Error(`no ${rawOf(l.id)}: run tts first`);
  fs.mkdirSync(TIGHT_DIR, { recursive: true });
  const jobs = path.join(TIGHT_DIR, "jobs.jsonl"), words = path.join(TIGHT_DIR, "words.json"), map = path.join(TIGHT_DIR, "tighten.json");
  fs.writeFileSync(jobs, todo.map((l) => JSON.stringify({ id: l.id, text: spoken(l.narration), voice: VOICE, out: rawOf(l.id) })).join("\n") + "\n");
  const run = (tool, a) => {
    const r = spawnSync(process.execPath, [path.join(MEDIA_ANIM, "audio", tool), ...a], { stdio: "inherit", windowsHide: true });
    if (r.status !== 0) throw new Error(`media-anim audio/${tool} exited ${r.status}`);
  };
  run("words.ts", [...todo.map((l) => rawOf(l.id)), "--out", words, "--media-gen", MEDIA_GEN]);
  run("tighten.ts", [jobs, "--edge", String(o.edge), "--wpm", String(o.wpm), "--max-pause", String(o.maxPause), "--words", words, "--json", map, "--force"]);
  for (const l of todo) l.audioS = seconds(tightOf(l.id));
  fs.writeFileSync(SB_JSON, JSON.stringify(sb, null, 2) + "\n");
  sync(sb);
  console.log(`${todo.length} lines tightened: audioS from ${path.relative(ROOT, dir)}/<id>.tight.wav; then node tools/lacing_words.js (the callouts' and the reveal's word times move with the cut)`);
}
function tightenCmd() {
  const sb = readSb();
  if (!sb.voice || !sb.voice.tighten) sb.voice = Object.assign({}, sb.voice, { tighten: { edge: 0.05, wpm: 175, maxPause: 0.35 } });
  tightenLines(sb, flag("--only") ? flag("--only").split(",") : null);
}

// ---- the transcript: one entry per scene, times of the final video, the numbers on screen with their code source,
// and the sources the step relies on: the storyboard's `references: [{ id, title, revision, date, url, pages, kind }]`
// and each scene's and later line's `sources: [{ ref, where, page, says }]` / `uncited` (a reason no source states) ----
// a scene's or line's sources as the transcript gives them: { source: "<title>, <revision>", ref, where, page, says, url }
const citeOf = (sb, line) => MA("publish/exports.ts").citeOf(sb, line);
// what a scene says that the picture does not show (docs/PLAN.md "Not modelled")
const NOTE_KNOT = "the model's lacing draws a stitch as its turns (docs/PLAN.md, Cable lacing: \"Not modelled: the knot itself\"); the knots are drawn in the close-ups that follow";
const NOTE_SHAPE = "the knot's shape is drawn by the tutorial (web/js/lacing_tutorial.js, the shots' knots), not traced: NASA's figures are small line drawings and its text gives no steps";
const NOT_DRAWN = { start: NOTE_KNOT, close: NOTE_KNOT, clove: NOTE_SHAPE, square: NOTE_SHAPE + "; the square knot's crossings alternate over and under along each end (a reef knot)",
  seal: NOTE_SHAPE + "; the two half hitches are drawn round the tape's own standing part, read from NASA Fig. 9-3 (no text gives steps)",
  tie: NOTE_SHAPE + "; one tie-off end, trimmed; no square knot (NASA Fig. 9-3)",
  wrap: "the lock stitch is taught on its own, enlarged and with the tuck drawn; the model's stitches are drawn as one wrap each",
  tuck: "as wrap; the tuck is drawn over the standing part, then under the turn's start, read from NASA Fig. 9-5 (draft 9; before, the reverse, which slid off as a half hitch)",
  tight: "the tape's tension (docs/PLAN.md: not modelled); the loop is drawn shrinking from 1.45 x the bundle's radius to it" };
function transcript() {
  const t = T(), H = require(path.join(ROOT, "web", "js", "hose_route.js")), L = H.LACING, sb = readSb(), tm = t.timing(sb);
  // (a scene without audioS: new words, TTS deferred; timed at 150 words a minute, audio_s null)
  const P = t.referencePlan(H, JSON.parse(fs.readFileSync(path.join(ROOT, "web", "data", "lr4_config.json"), "utf8")).hose);
  const LR = "web/js/hose_route.js LACING (twin: freecad/lr4.py LACING)", TUT = "web/js/lacing_tutorial.js";
  const inch = (mm) => +(mm / 25.4).toFixed(2);
  const num = (value, unit, what, source) => Object.assign({ value, unit }, unit === "mm" ? { in: inch(value) } : {}, { what, source });
  const gaps = P.stitches.slice(1).map((q, k) => q.s - P.stitches[k].s);
  const NUMS = {
    start: [num(L.wraps[0], "turns", "turns in the starting stitch", `${LR}.wraps[0]`),
      num(L.start, "mm", "the starting stitch past the core's last zip tie (the core's +X end)", `${LR}.start`)],
    wrap: [num(L.wraps[1], "turns", "turns in a lock stitch", `${LR}.wraps[1]`)],
    tuck: [num(L.wraps[1], "turns", "turns in a lock stitch", `${LR}.wraps[1]`)],
    tight: [num(L.tape, "mm", "the tape's thickness as modelled", `${LR}.tape`)],
    uturn: [num(L.pitch, "mm", "lock stitch pitch, the same round the U-turn", `${LR}.pitch`)],
    lock: [num(L.pitch, "mm", "lock stitch pitch (shown: 68 mm (2.7\"))", `${LR}.pitch`),
      num(P.stitches.length, "stitches", "stitches on the cord + sleeve run at the reference size (26 x 50 in)", `${TUT} referencePlan (web/data/lr4_config.json hose)`)],
    spacing: [num(t.MAX_GAP, "mm", "the most between stitches (shown: 76 mm (3\")): NASA-STD-8739.4A Table 9-1, harness over 25.4 mm", `${TUT} MAX_GAP`),
      num(+Math.max(...gaps).toFixed(1), "mm", "the widest gap in the model", `${TUT} plan (stitch s)`),
      num(L.close, "mm", "the least between the last lock stitch and the closing stitch", `${LR}.close`)],
    clove: [num(L.wraps[0], "turns", "turns in the starting stitch (the clove hitch)", `${LR}.wraps[0]`)],
    square: [num(L.tail, "mm", "tape allowed per knot (tails trimmed) in the BOM's length", `${LR}.tail`)],
    seal: [num(L.wraps[2], "turns", "turns the marline hitch locks", `${LR}.wraps[2]`)],
    tie: [num(L.tail, "mm", "tape allowed per knot (tails trimmed) in the BOM's length", `${LR}.tail`)],
    close: [num(L.wraps[2], "turns", "turns in the closing stitch", `${LR}.wraps[2]`),
      num(L.gap, "mm", "the closing stitch before the sleeve's breakout", `${LR}.gap`)],
    done: [], goal: [],
  };
  const cues = sfxCues(t, tm), EV = t.eventsOf(tm);
  const entries = tm.scenes.map((s, i) => {
    const raw = sb.scenes[i], rawLine = (id) => (raw.more || []).find((m) => m.id === id) || {};
    return { index: i, id: s.id, purpose: s.purpose, t_start: +s.start.toFixed(3), t_end: +s.end.toFixed(3), caption: raw.cue,
      spoken: t.spoken(raw.narration), audio_s: typeof raw.audioS === "number" ? raw.audioS : null,
      ...(s.lines.length > 1 ? { more: s.lines.slice(1).map((l) => ({ id: l.id, t_start: +l.at.toFixed(3), t_end: +(l.at + l.dur).toFixed(3), spoken: l.text,
        audio_s: l.voiced ? l.dur : null, sources: citeOf(sb, rawLine(l.id)), ...(rawLine(l.id).uncited ? { uncited: rawLine(l.id).uncited } : {}) })) } : {}),
      numbers: NUMS[s.id] || [],
      sources: citeOf(sb, raw),
      cues: cues.filter((q) => q.scene === s.id).map((q) => ({ sfx: "swipe", t: +q.t.toFixed(3), spoken: false, what: "the blade cuts an end (the wav starts " + t.SHOTS.blade.sfxLead + " s before)" })),
      ...(NOT_DRAWN[s.id] ? { not_drawn: NOT_DRAWN[s.id] } : {}), ...(raw.uncited ? { uncited: raw.uncited } : {}),
      // (draft 11: the credits on screen, the scene's last credits.holdS - LR4LacingTut.creditsAt)
      ...(s.credits && sb.credits ? { credits: { t_start: +(s.start + s.body).toFixed(3), t_end: +s.end.toFixed(3), title: sb.credits.title,
        items: sb.credits.items.map((q) => Object.assign({ role: q.role, text: q.text }, q.url ? { url: q.url } : {})) } } : {}),
      events: EV[i].events };
  });
  const out = { title: "Lacing the cables to the hose (LR4 Sandbox)", spec: "docs/specs/lacing-tutorial.md",
    storyboard: "docs/specs/lacing-tutorial.storyboard.json", survey: "docs/PLAN.md, Cable lacing (survey, 2026-11-08)",
    generated_by: "node tools/lacing_voice.js transcript", duration_s: +tm.duration.toFixed(3),
    note: "t_start / t_end are seconds of the video (the director records (Video Lacing:) from t = 0; HOLD= adds a still tail after the last entry)",
    events_note: "each entry's events (LR4LacingTut.eventsOf: the shots' keys and layer tracks, the knots' phases, the blade's cuts, sfxAt, the voice's lines): at_rel = the share of the scene, t = s into the video; kinds camera, layer, knot, draw, pose (the core's travel: the opening's legs, the finale's out and back), cut, sfx, voice, callout, reveal (the opening's flash as the voice first says \"cable lacing\", the music's hit on it; the loose cables neat), credits (in, out). Where each is authored: docs/specs/lacing-tutorial.md 'Where the events come from'",
    entries };
  fs.writeFileSync(TRANSCRIPT, JSON.stringify(out, null, 2) + "\n");
  console.log(`${TRANSCRIPT}: ${entries.length} entries, ${tm.duration.toFixed(2)} s`);
}

// the swipe (media-anim audio/sfx.ts swipeWav: 48 kHz mono, deterministic), its peak SFX_GAP_DB under the voice's
const SFX_GAP_DB = 6;                                // the swipe's peak this far under the voice's
function sfx() {
  const P = MA("audio/probe.ts"), { swipeWav } = MA("audio/sfx.ts");
  const sb = readSb(), voiced = sb.scenes.filter((s) => typeof s.audioS === "number" && fs.existsSync(wavOf(s.id)));
  if (!voiced.length) throw new Error(`no voice wavs in ${dir}: the swipe's level follows them`);
  const med = P.median(voiced.map((s) => P.peakDb(wavOf(s.id))));
  const out = path.join(dir, "sfx", "swipe.wav"), lead = T().SHOTS.blade.sfxLead;
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, swipeWav(med - SFX_GAP_DB, lead));
  console.log(`${out}: ${seconds(out)} s, peak ${P.peakDb(out).toFixed(1)} dBFS (the voice's median peak ${med.toFixed(1)} - ${SFX_GAP_DB} dB), the cut ${lead} s in`);
}
// the swipes on the timeline: [{ t (the cut), at (the wav's start) }]
const sfxCues = (t = T(), tm = t.timing()) => t.sfxAt(tm).map((q) => ({ t: q.t, at: q.t - t.SHOTS.blade.sfxLead, scene: q.scene }));

// ---- the music (draft 11): storyboard `music` { file, intro: { from, hitInS, ringS (d12: its hit on the reveal), gainDb, duckDb, duckS, fadeAfter, fadeS },
// outro: { from, gainDb, fadeInS, fadeOutS } }: media-anim audio/mix.ts musicPlan (the intro ducked under the
// first scene's lines, the outro in with the credits) and gainExpr (the envelope as an ffmpeg volume expression) ----
const musicPlan = (sb, tm) => MA("audio/mix.ts").musicPlan(sb, tm);
const gainExpr = (keys) => MA("audio/mix.ts").gainExpr(keys);
// the soundtrack's clips on the video's t: every voiced line, the swipes, the music's parts (media-anim mix.ts runs them)
function mux(video, outp, dryRun = false) {
  const sb = readSb(), tm = T().timing(sb), clips = [];
  // every voiced line at its place (LR4LacingTut.voiceLines: a scene's own line at its start, a later one in its hold); a
  // line without a measured audioS has new words (TTS deferred): no wav, the caption carries it
  const voiced = T().voiceLines(tm), all = tm.scenes.flatMap((s) => s.lines);
  if (!voiced.length) throw new Error("no voiced lines");
  for (const l of voiced) {
    const w = wavOf(l.id, sb);
    if (!fs.existsSync(w)) throw new Error(`no ${w}: run ${sb.voice && sb.voice.tighten ? "tighten" : "tts"} first`);
    clips.push({ file: w, at: l.at });
  }
  // the swipes (draft 6), each at its cut less its lead (none made: none placed, said)
  const sw = path.join(dir, "sfx", "swipe.wav"), cues = fs.existsSync(sw) ? sfxCues(T(), tm) : [];
  for (const q of cues) clips.push({ file: sw, at: q.at });
  // the music's intro and outro (draft 11; none when its file is missing, said)
  const mf = sb.music && sb.music.file, music = mf && fs.existsSync(mf) ? musicPlan(sb, tm) : [];
  for (const m of music) clips.push({ file: mf, at: m.at, trim: { from: m.from, dur: m.dur }, keys: m.keys });
  // (the output lasts the video's length - a cut shorter than the voice-over ends with the video, a longer one keeps its tail)
  // the storyboard's loudness { I, TP, LRA } (d27, practice youtube-videos SD-1: -14 LUFS): mix.ts's two-pass loudnorm,
  // linear, on the whole mix; none set: the mix as it was
  const L = sb.loudness, loudnorm = L ? { I: L.I, TP: L.TP === undefined ? -1.5 : L.TP, LRA: L.LRA === undefined ? 11 : L.LRA } : undefined;
  MA("audio/mix.ts").mix({ video, clips, out: outp, dryRun, videoS: seconds(video), loudnorm });
  console.log(`${path.resolve(outp)}: ${voiced.length} of ${all.length} lines placed at ${voiced.map((l) => l.at.toFixed(2)).join(", ")} s` +
    (voiced.length < all.length ? ` (silent, TTS deferred: ${all.filter((l) => !l.voiced).map((l) => l.id).join(", ")})` : "") +
    (cues.length ? `; ${cues.length} swipes at ${cues.map((q) => q.t.toFixed(2)).join(", ")} s` : `; no swipes (no ${sw}: run sfx)`) +
    (music.length ? `; music ${music.map((m) => `${m.id} ${m.at.toFixed(2)}-${(m.at + m.dur).toFixed(2)} s`).join(", ")}` : sb.music ? `; no music (no ${mf})` : "") +
    (sb.voice && sb.voice.tighten ? "; the tightened takes" : "") + (loudnorm ? `; loudnorm I ${loudnorm.I} TP ${loudnorm.TP}` : ""));
}

// ---- the draft: media-anim capture/draft.ts on the page's ?anim=lacing (its player, play=1, no bar, no sound, the
// t stamp on), then mux above on the same t timeline ----
const DRAFT_URL = "http://127.0.0.1:8767/web/index.html?anim=lacing";
function draft() {
  const out = positional()[0];
  if (!out) throw new Error("usage: node tools/lacing_voice.js draft <out.mp4> [--url URL] [--no-voice] [draft.ts flags]");
  const pass = args.slice(1).filter((a, i, A) => a !== out && a !== "--no-voice" && a !== "--url" && A[i - 1] !== "--url" && a !== "--dir" && A[i - 1] !== "--dir");
  const tool = path.join(MEDIA_ANIM, "capture", "draft.ts");
  if (!fs.existsSync(tool)) throw new Error(`media-anim not found (${tool}): clone it beside this repo or set MEDIA_ROOT`);
  const muxCmd = `"${process.execPath}" "${__filename}" mux${flag("--dir") ? ` --dir "${dir}"` : ""}`;
  const a = [tool, flag("--url", DRAFT_URL), "--out", path.resolve(out), "--player", "__player", "--global", "__anim",
    "--param", "play=1", "--param", "bar=0", "--param", "voice=0", "--param", "stamp=1", ...partsParams().flatMap(([k, v]) => ["--param", `${k}=${v}`]),
    ...(args.includes("--no-voice") ? [] : ["--mux", muxCmd]), ...pass];
  const r = spawnSync(process.execPath, a, { stdio: "inherit", windowsHide: true });
  if (r.status !== 0) throw new Error(`draft.ts exited ${r.status}`);
}

// ---- chapters, the sidebar feed and a ZoomTube manifest (media-anim publish/exports.ts): the storyboard's
// `chapters` ([{ id, title, scenes }], each a run of scenes in scene order) timed by timing(); every line's times = the
// transcript's (a scene's own line: its scene's start and end; a later line: its at and at + dur). This keeps the
// lacing tutorial's titles, paths and its own timing, spoken() and eventsOf (the callouts' times) ----
const SPECS = path.join(ROOT, "docs", "specs");
const CHAPTERS_VTT = path.join(SPECS, "lacing-tutorial.chapters.vtt");
const YOUTUBE_TXT = path.join(SPECS, "lacing-tutorial.youtube.txt");
const SIDEBAR = path.join(SPECS, "lacing-tutorial.sidebar.json");
const ZT_DIR = path.join(ROOT, "exports", "lacing_zoomtube"), ZT_PROJ = "lr4-lacing";
const ZT_JSON = path.join(ZT_DIR, `proj-config-${ZT_PROJ}.json`);
const TITLE = "Lacing the cables to the hose (LR4 Sandbox)";
const X = () => MA("publish/exports.ts");
// the page's spoken() and its events (a scene's callout times), as the exports read them
const lacingOf = (t, tm) => ({ spoken: t.spoken, events: typeof t.eventsOf === "function" ? t.eventsOf(tm) : [] });
const youtubeRules = (marks, dur) => X().youtubeRules(marks, dur);
function chaptersFiles(sb = readSb(), t = T()) {
  return X().chaptersFiles(sb, t.timing(sb), { note: "the lacing tutorial's chapters (docs/specs/lacing-tutorial.storyboard.json): node tools/lacing_voice.js chapters" });
}
function sidebarOf(sb = readSb(), t = T()) {
  const tm = t.timing(sb);
  return X().sidebarOf(sb, tm, { title: TITLE, generatedBy: "node tools/lacing_voice.js sidebar", storyboard: "docs/specs/lacing-tutorial.storyboard.json", ...lacingOf(t, tm) });
}
// the ZoomTube viewer's schema-v2 manifest (E:/git/zt-web/src/components/ProjectViewer.js): a seq a scene titled
// "Lacing — <chapter> » <cue>"; citations and the glossary in fields the viewer ignores
function zoomtubeOf(sb = readSb(), t = T(), videoId = null, now = new Date()) {
  const tm = t.timing(sb);
  return X().zoomtubeOf(sb, tm, { videoId, now, title: TITLE, prefix: "Lacing",
    description: "Lacing a LowRider 4's cables to its vacuum hose with one tape: NASA-STD-8739.4A's starting stitch, running lockstitches and closing stitch, timed to the voice-over.",
    attribution: "LR4 Sandbox, lacing tutorial", tool: "tools/lacing_voice.js zoomtube", projId: ZT_PROJ,
    provenance: "seqs and times from docs/specs/lacing-tutorial.storyboard.json and LR4LacingTut.timing() (= the transcript's); claims cite the storyboard's sources (documents, type \"doc\"), not transcript Segments",
    ...lacingOf(t, tm) });
}
const ztReadme = () => X().zoomtubeReadme({ heading: "ZoomTube manifest: the lacing tutorial (node tools/lacing_voice.js zoomtube [--video-id <youtube id>])",
  projId: ZT_PROJ, ztWeb: "E:/git/zt-web" });
function chapters() {
  const { vtt, youtube, spans, duration } = chaptersFiles();
  fs.writeFileSync(CHAPTERS_VTT, vtt);
  fs.writeFileSync(YOUTUBE_TXT, youtube);
  console.log(`${CHAPTERS_VTT}: ${spans.length} chapters, 0 to ${duration.toFixed(2)} s`);
  console.log(`${YOUTUBE_TXT}: ${youtube.trim().split("\n").join(" | ")}`);
}
function sidebar() {
  const out = sidebarOf();
  fs.writeFileSync(SIDEBAR, JSON.stringify(out, null, 2) + "\n");
  const ls = out.chapters.flatMap((c) => c.lines);
  console.log(`${SIDEBAR}: ${out.chapters.length} chapters, ${ls.length} lines, ${ls.reduce((n, l) => n + l.terms.length, 0)} callout terms, ${out.glossary.length} glossary terms, ${out.references.length} references`);
}
function zoomtube() {
  const id = flag("--video-id");
  if (id !== undefined && !X().isVideoId(id)) throw new Error(`--video-id "${id}": not a YouTube id (11 of [A-Za-z0-9_-])`);
  const out = zoomtubeOf(readSb(), T(), id);
  fs.mkdirSync(ZT_DIR, { recursive: true });
  fs.writeFileSync(ZT_JSON, JSON.stringify(out, null, 2) + "\n");
  fs.writeFileSync(path.join(ZT_DIR, "README.md"), ztReadme());
  console.log(`${ZT_JSON}: ${out.chapters.length} chapters, ${out.seqs.length} seqs, ${out.vids[0].rtDur} ms, video ${id || "none (src null)"}`);
}

// ---- the changed-scene diff (media-anim pipeline/golden.ts, MA-7): every frameAt at 30 fps over the video, the plan
// and the public outputs; per scene, its own outputs made scene-local (its timing entry, phases, events, callouts) and
// the frame's tt as s into the scene, so a scene that only moved hashes and diffs the same ----
const GOLDEN_DIR = path.join(ROOT, ".cache", "lacing-tutorial", "golden");
const ACCEPTED = path.join(GOLDEN_DIR, "accepted.json.gz"), GOLDEN_FPS = 30;
const hasGolden = () => fs.existsSync(path.join(MEDIA_ANIM, "pipeline", "golden.ts"));
// golden.ts's source: { timing, frameAt, plan, outputs, sceneOutputs, timeKeys } (opts.storyboard: another storyboard;
// opts.shots: the shots frameAt draws from, as the page fetches them, else data.js's copy)
function golden(opts = {}) {
  const t = T(), H = require(path.join(ROOT, "web", "js", "hose_route.js"));
  const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, "web", "data", "lr4_config.json"), "utf8"));
  const tm = opts.storyboard ? t.timing(opts.storyboard) : t.timing(), P = t.referencePlan(H, cfg.hose), g = { fov: 35, aspect: 16 / 9 };
  const events = t.eventsOf(tm), callouts = t.calloutsOf(tm);
  // (times made scene-local to the ns; the events' and callouts' absolute times are rounded to 1 / 10 ms, so they are left
  // out: their at_rel and the frames carry them)
  const rel = (o, keys, s) => { const r = { ...o }; for (const k of keys) if (typeof r[k] === "number") r[k] = Math.round((r[k] - s) * 1e9) / 1e9; return r; };
  const drop = (o, keys) => { const r = { ...o }; for (const k of keys) delete r[k]; return r; };
  return { timing: tm, plan: P, timeKeys: ["tt"], frameAt: opts.shots ? (x) => t.frameAt(x, P, g, tm, opts.shots) : (x) => t.frameAt(x, P, g, tm),
    outputs: { timing: tm, voiceLines: t.voiceLines(tm), events, phases: tm.scenes.map((s) => t.phasesOf(s.id)), calloutsOf: callouts, credits: t.creditsLayout(tm.credits, 16 / 9) },
    sceneOutputs: (sc) => ({ scene: rel({ ...sc, lines: sc.lines.map((l) => rel(l, ["at"], sc.start)) }, ["start", "end"], sc.start), phases: t.phasesOf(sc.id),
      events: ((events.find((e) => e.id === sc.id) || {}).events || []).map((e) => drop(e, ["t", "cut_t"])),
      callouts: callouts.filter((c) => c.scene === sc.id).map((c) => drop(c, ["tIn", "tOut", "tGone", "want", "start"])) }) };
}
// golden()'s opts for the scenes command: --shots FILE draws the dump from that file
const shotsOpts = () => (flag("--shots") ? { shots: JSON.parse(fs.readFileSync(path.resolve(ROOT, flag("--shots")), "utf8")) } : {});
// the changed scenes (diffScenes rows) -> the command that renders just them (render --scenes), with its time (d13: 0.13 s
// a frame on the iGPU, ~20 s to start): printed by scenes diff and brief, so a review of one scene isn't a full render
function reviewHint(rows) {
  const ch = rows.filter((r) => r.status !== "identical" && r.status !== "gone");
  if (!ch.length) return "";
  const s = Math.round(20 + 0.13 * ch.reduce((n, r) => n + r.n, 0));
  return `see just ${ch.length > 1 ? "these" : "it"}: node tools/lacing_voice.js render .exports/lacing_drafts/<name>.mp4 --scenes ${ch.map((r) => r.id).join(",")} --url http://127.0.0.1:<port>/web/index.html?anim=lacing` +
    ` (~${s} s if not cached, the picture only; the segments a full render reuses; --dry-run: hit or miss)`;
}
// the current dump and its diff against a baseline (--against, default the accepted one)
function goldenDiff(dumped) {
  const G = MA("pipeline/golden.ts"), against = path.resolve(ROOT, flag("--against", ACCEPTED));
  if (!fs.existsSync(against)) throw new Error(`${against}: no baseline (node tools/lacing_voice.js scenes accept)`);
  const dump = dumped || G.dumpOf(golden(shotsOpts()), { fps: GOLDEN_FPS });
  return { G, dump, base: G.load(against), against };
}
function scenes() {
  if (!hasGolden()) { console.log(`scenes: skipped (media-anim pipeline/golden.ts not found under ${MEDIA_ANIM})`); return; }
  const sub = positional()[0] || "diff", t0 = Date.now(), took = () => `${((Date.now() - t0) / 1000).toFixed(1)} s`;
  const rel = (f) => path.relative(ROOT, f).split(path.sep).join("/");
  if (["accept", "write", "hashes"].includes(sub)) {
    const G = MA("pipeline/golden.ts"), dump = G.dumpOf(golden(shotsOpts()), { fps: GOLDEN_FPS });
    if (sub === "hashes") { for (const h of G.sceneHashes(dump)) console.log(`${h.hash.slice(0, 16)}  ${h.id} ${h.start.toFixed(2)}-${h.end.toFixed(2)} s, ${h.n} frames`); return; }
    const file = sub === "write" ? path.resolve(ROOT, positional()[1] || "") : ACCEPTED;
    if (sub === "write" && !positional()[1]) throw new Error("usage: node tools/lacing_voice.js scenes write <dump.json.gz>");
    if (sub === "accept" && fs.existsSync(ACCEPTED)) fs.copyFileSync(ACCEPTED, path.join(GOLDEN_DIR, "accepted.prev.json.gz"));
    G.save(file, dump);
    console.log(`${sub === "accept" ? "accepted" : "wrote"} ${rel(file)}: ${dump.frames.length} frames at ${GOLDEN_FPS} fps, ${dump.scenes.length} scenes (${took()})`);
    return;
  }
  const { G, dump, base, against } = goldenDiff();
  if (sub === "check") {
    const r = G.compare(dump, base);
    if (r.diffs) { console.log(`DIFF against ${rel(against)}: ${r.diffs} values (max numeric ${r.maxd}) (${took()})\n` + r.first.map((l) => "  " + l).join("\n")); process.exitCode = 1; }
    else console.log(`same: ${dump.frames.length} frames, ${dump.scenes.length} scenes, outputs, plan against ${rel(against)} (max numeric diff 0) (${took()})`);
  } else if (sub === "diff") {
    const d = G.diffScenes(dump, base), hint = reviewHint(d.scenes);
    console.log(`against ${rel(against)}:\n${G.diffText(d)} (${took()})${hint ? "\n" + hint : ""}`);
  }
  else throw new Error("usage: node tools/lacing_voice.js scenes [diff|check|accept|hashes|write <file>] [--against <dump.json.gz>]");
}

// ---- the reduced parts (d12): the V1E files the page draws, found by SHA-256 in the source folders (the maintainer's
// downloads, extracted: .cache/lacing-tutorial/parts_src/<zip>/; and parts/), reduced by media-mesh mesh/tools/reduce.ts
// (MM-3: meshoptimizer edge collapse, ErrorAbsolute 0.05 mm, the practice's pick) into .cache/lacing-tutorial/parts/<manifest
// path>, the report in .cache/lacing-tutorial/parts_report.json (outside the folder: its ms would move the render key).
// DXFs and the bristle strip (the page bends it along a path: a collapsed strip's long triangles would cut the curve)
// are copied as they are. A file with no checksum match is used
// only from PARTS_NEAR, after its placed box was checked against the part's lo_ref / hi_ref. When the folder has files,
// render / clip / iterate / still / draft load the page with ?parts=<its URL> and the files go into the render key ----
const PARTS_DIR = path.join(ROOT, ".cache", "lacing-tutorial", "parts"), PARTS_URL = "/.cache/lacing-tutorial/parts/";
const PARTS_SRC = [path.join(ROOT, ".cache", "lacing-tutorial", "parts_src"), path.join(ROOT, "parts")];
const PARTS_REPORT = path.join(ROOT, ".cache", "lacing-tutorial", "parts_report.json");
const MEDIA_MESH = path.join(process.env.MEDIA_ROOT || path.join(ROOT, ".."), "media-mesh");
// manifest path -> a source file's base name: the zip's XZ Min DXF differs in bytes from the tested V1, but placed by
// its A its box is lo_ref / hi_ref to 0.004 mm (2026-11-10). The zip's Jackpot box and lid are another version (their
// boxes 25 mm off in Y and Z): left out, so they stay grey boxes.
const PARTS_NEAR = { "lr4/XZ_Min_DXF_V1.dxf": "xz-min-dxf.dxf" };
function reducedParts() {
  if (!fs.existsSync(PARTS_DIR)) return [];
  const out = [], walk = (d) => { for (const n of fs.readdirSync(d).sort()) { const p = path.join(d, n); if (fs.statSync(p).isDirectory()) walk(p); else out.push(path.relative(PARTS_DIR, p).split(path.sep).join("/")); } };
  walk(PARTS_DIR);
  return out;
}
const partsParams = () => (reducedParts().length ? [["parts", PARTS_URL]] : []);
function partsCmd() {
  const t0 = Date.now(), crypto = require("crypto"), rel = (p) => path.relative(ROOT, p).split(path.sep).join("/");
  const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, "web", "data", "lr4_config.json"), "utf8")), files = cfg.files.files;
  const drawn = new Set(), bent = new Set();                // the page's `needed` (panel.js setupFiles): the Kobalt set
  for (const p of cfg.parts) if (p.src) {
    for (const r of p.src.kind === "peter" ? [p.src.open, p.src.closed] : [p.src]) drawn.add(r.file);
    if (p.src.kind === "bent") bent.add(p.src.file);
  }
  const bySha = new Map();
  for (const [p, f] of Object.entries(files)) for (const h of f.sha256) bySha.set(h, p);
  const srcDirs = flag("--src") ? flag("--src").split(",").map((d) => path.resolve(ROOT, d)) : PARTS_SRC;
  const found = new Map(), byBase = new Map();
  const walk = (d) => { if (fs.existsSync(d)) for (const n of fs.readdirSync(d).sort()) {
    const p = path.join(d, n);
    if (fs.statSync(p).isDirectory()) { if (path.resolve(p) !== path.resolve(PARTS_DIR)) walk(p); continue; }
    if (!/\.(stl|dxf)$/i.test(n)) continue;
    if (!byBase.has(n.toLowerCase())) byBase.set(n.toLowerCase(), p);
    const m = bySha.get(crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex"));
    if (m && !found.has(m)) found.set(m, { from: p, match: "sha256" });
  } };
  srcDirs.forEach(walk);
  for (const [m, base] of Object.entries(PARTS_NEAR)) if (!found.has(m) && byBase.has(base)) found.set(m, { from: byBase.get(base), match: "near (PARTS_NEAR)" });
  const use = [...drawn].filter((p) => found.has(p)).sort(), missing = [...drawn].filter((p) => !found.has(p)).sort();
  fs.rmSync(PARTS_DIR, { recursive: true, force: true });
  const jobs = [], copied = [];
  for (const p of use) {
    const out = path.join(PARTS_DIR, ...p.split("/"));
    if (/\.stl$/i.test(p) && !bent.has(p)) { jobs.push({ in: found.get(p).from, out }); continue; }
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.copyFileSync(found.get(p).from, out);
    copied.push(p);
  }
  const work = path.join(ROOT, ".cache", "lacing-tutorial", "parts_work"), map = path.join(work, "map.json");
  fs.mkdirSync(work, { recursive: true });
  fs.writeFileSync(map, JSON.stringify(jobs, null, 1));
  const tool = path.join(MEDIA_MESH, "mesh", "tools", "reduce.ts");
  if (!fs.existsSync(tool)) throw new Error(`media-mesh not found (${tool}): clone it beside this repo or set MEDIA_ROOT`);
  const r = spawnSync(process.execPath, [tool, "--map", map, "--report", PARTS_REPORT, "--target", flag("--target", "0.05"), ...(args.includes("--no-measure") ? ["--no-measure"] : [])],
    { stdio: "inherit", windowsHide: true });
  if (r.status !== 0) throw new Error(`reduce.ts exited ${r.status}`);
  const rep = JSON.parse(fs.readFileSync(PARTS_REPORT, "utf8"));
  for (const f of rep.files) f.path = rel(f.out).replace(/^\.cache\/lacing-tutorial\/parts\//, "");
  rep.lr4 = { made: new Date().toISOString(), url: PARTS_URL, sources: Object.fromEntries(use.map((p) => [p, { from: rel(found.get(p).from), match: found.get(p).match }])),
    copied, missing, secs: +((Date.now() - t0) / 1000).toFixed(1) };
  fs.writeFileSync(PARTS_REPORT, JSON.stringify(rep, null, 1) + "\n");
  console.log(`${rel(PARTS_DIR)}: ${jobs.length} reduced, ${copied.length} copied (${copied.join(", ")}); missing ${missing.length}: ${missing.join(", ") || "none"}`);
  console.log(`${rel(PARTS_REPORT)} (${rep.lr4.secs} s)`);
}

// ---- the scene render cache (media-anim capture/scenes.ts, MA-8): each scene frame-exact (capture/step.ts) to
// .cache/lacing-tutorial/scenes/<key>.mp4, key = its golden scene hash (scenes hashes, with the shots the page draws) +
// the renderer's hash + size, fps, encoder, grab, GPU; joined with concat -c copy, then mux above. The renderer's files
// (renderFiles): every file under web/ but help/ (gcode help, never drawn), *.md (never loaded) and FRAME_MATHS, and every
// file under parts/ (the STLs the page builds the machine from); plus the shots key lacing_anim.js build() reads once
// (colours) and BUILD_VALUES (knots.closing it reads only through tapeTo: closingTape; the knot itself is frameAt's, in
// the golden hash). Not in it: Chrome's version and the GPU driver (a segment's .json names the renderer).
// FRAME_MATHS (R1): the files golden() runs in Node that the page runs only through LR4LacingTut's maths, never to draw:
// their effect on a frame is in frameAt's output, so the scene hashes hold it, and a change to one re-renders only the
// scenes whose frames moved. data.js: its storyboard and shots reach the picture through frameAt too. Not in the list
// (they draw, or feed the page other than through the dump): hose_route.js and web/data/ (the page's hose and machine),
// media-anim callout.js / credits.js (the cards' and credits' DOM), halo / tube / occluder (three.js), and shots.js:
// its focusOf takes the page's machine box (g.machine), which golden() has not, so its machine-focus branch draws on the
// page only. The page's own plan differs from golden()'s by float noise (THREE's Catmull-Rom: up to 7e-4 mm, measured
// 2026-11-10, .cache/velocity/r1/), so a maths change that moves the page's frames moves the dump's too. BUILD_VALUES:
// what lacing_anim.js takes from LR4LacingTut outside frameAt (its meshes' sizes and colours); LT_USES: the names it may
// use, checked each render, so a new one fails until its value is in BUILD_VALUES or its file is back in the key ----
const SCENES_DIR = path.join(ROOT, ".cache", "lacing-tutorial", "scenes"), SCENE_WORK = path.join(ROOT, ".cache", "scene-cache");
const S_ = () => MA("capture/scenes.ts");
const FRAME_MATHS = ["web/js/lacing_tutorial.js",
  ...["data", "vec3", "timeline", "curves", "knot_flat", "core", "opening", "plan", "knot_gen", "knots", "draw", "blade", "callouts", "frame", "events"].map((f) => `web/js/lacing/${f}.js`),
  ...["media-mesh-core.min", "media-mesh-knots.min"].map((f) => `web/js/lib/media-mesh/${f}.js`),
  ...["media-anim-runtime.min"].map((f) => `web/js/lib/media-anim/${f}.js`)];
const LT_USES = ["END", "HITCH", "REVEAL", "SHOTS", "addKey", "apexOf", "frameAt", "knotLace", "onTape", "plan", "refsOf", "setDebug", "sfxAt", "tapeOf", "tapeTo", "timing", "voiceLines"];
// (d14: knotLace, the finale's real lacing knotted at the core's pose - its settings and the plan's run 0 it knots at the
// build pose, the same function; d14b: tapeOf, the run with a lockstitch loose - one stitch at the loosest; refsOf, the
// runs at the build pose that knotLace carries to a pose - plan.js's code, RUN its settings, knotted run 0 the same)
const BUILD_VALUES = (t, P, shots) => ({ REVEAL: t.REVEAL, HITCH: t.HITCH, END: t.END, closingTape: t.tapeTo(P.details.close, (shots.knots || {}).closing),
  RUN: t.RUN, knotted: P.pts, PULL: t.PULL, loose: P.knots && P.knots.length ? t.tapeOf(P, [{ k: P.knots[0].k, lam: t.PULL.loose }]).pts : null });
function renderFiles() {
  const S = S_(), rel = (p) => path.relative(ROOT, p).split(path.sep).join("/"), skip = new Set([...FRAME_MATHS, "web/js/lib/media-mesh/SOURCE.json"]);   // (SOURCE.json: the bundles' provenance, not a renderer file)
  const web = S.walk(path.join(ROOT, "web"), (p) => !skip.has(rel(p)) && !rel(p).startsWith("web/help/") && !rel(p).endsWith(".md"));
  return web.concat(fs.existsSync(path.join(ROOT, "parts")) ? S.walk(path.join(ROOT, "parts")) : [], reducedParts().map((f) => path.join(PARTS_DIR, f)));
}
// the FRAME_MATHS rule's checks (after golden() has run): each file loaded by it in Node, and lacing_anim.js using no
// LR4LacingTut name but LT_USES -> '' or the error
function frameMathsCheck() {
  const gone = FRAME_MATHS.filter((f) => !require.cache[path.join(ROOT, ...f.split("/"))]);
  const used = [...new Set([...fs.readFileSync(path.join(ROOT, "web", "js", "page", "lacing_anim.js"), "utf8").matchAll(/\bLT\.([A-Za-z_$][\w$]*)/g)].map((m) => m[1]))];
  const extra = used.filter((u) => !LT_USES.includes(u));
  return [gone.length ? `FRAME_MATHS not loaded by golden(): ${gone.join(", ")} (put them back in the renderer's files)` : "",
    extra.length ? `lacing_anim.js uses LR4LacingTut.${extra.join(", .")}: add its value to BUILD_VALUES (and LT_USES), or take its module out of FRAME_MATHS` : ""].filter(Boolean).join("; ");
}
// -> { plan (scenes.ts's), dump, shots, shotsFile, verify(page) }; --shots: the file the server serves (LR4_SHOTS_FILE)
function scenePlan() {
  const S = S_(), G = MA("pipeline/golden.ts"), crypto = require("crypto");
  const shotsFile = path.resolve(ROOT, flag("--shots", SHOTS_JSON)), shots = JSON.parse(fs.readFileSync(shotsFile, "utf8"));
  const size = flag("--size", "1280x720").split("x").map(Number), fps = GOLDEN_FPS, gpu = !args.includes("--swiftshader");
  if (size.length !== 2 || size.some((n) => !(n >= 16))) throw new Error("--size wants WxH");
  const src = golden({ shots }), dump = G.dumpOf(src, { fps }), files = S.filesHash(renderFiles(), ROOT), bad = frameMathsCheck();
  if (bad) throw new Error(`the render key: ${bad}`);
  // the character head (shots.head.on; --no-head: the page's ?head=0) is the page's own drawing, not in the frames' maths:
  // it goes in the renderer's hash so a scene cached with it is not reused without it
  const head = !args.includes("--no-head") && !!(shots.head && shots.head.on);
  // the rider and Jensen Cam (MA-11: shots.rider / shots.jensenCam on, or --rider / --jensencam 0|1: the page's ?rider=,
  // ?jensencam=) are its drawing too: their blocks join the hash while on (off: the hash as before they existed)
  const onOf = (k, block) => (flag("--" + k) !== undefined ? flag("--" + k) !== "0" : !!(block && block.on));
  const rider = onOf("rider", shots.rider), cam = onOf("jensencam", shots.jensenCam);
  const renderer = crypto.createHash("sha256").update(files.hash + "\n" + G.canonical(Object.assign({ colours: shots.colours,
    build: BUILD_VALUES(T(), src.plan, shots), head }, rider ? { rider: shots.rider } : {}, cam ? { jensenCam: shots.jensenCam } : {}))).digest("hex");
  const scenes = G.sceneHashes(dump).map((h) => ({ id: h.id, i0: h.i0, n: h.n, key: S.cacheKey({ sceneHash: h.hash, renderer, size, fps, gpu }) }));
  const plan = { url: flag("--url", DRAFT_URL), params: [...partsParams(), ["head", head ? "1" : "0"], ["rider", rider ? "1" : "0"], ["jensencam", cam ? "1" : "0"]], global: "__anim", size, fps, gpu, cache: SCENES_DIR, work: SCENE_WORK, scenes };
  // the page must draw these shots (the server's LR4_SHOTS_FILE = --shots), in Full detail (Lite would cluster the
  // reduced parts a second time), with every file of the reduced set placed (the Parts chip's count)
  const nParts = reducedParts().length;
  const verify = async (page) => {
    const got = JSON.parse(await page.cdp.eval("JSON.stringify(__anim.tweak.shots())"));
    if (G.canonical(got) !== G.canonical(shots)) return `its shots are not ${path.relative(ROOT, shotsFile)} (start the server with LR4_SHOTS_FILE=${path.relative(ROOT, shotsFile)}, or pass --shots)`;
    const st = JSON.parse(await page.cdp.eval(`JSON.stringify({ lite: (document.querySelector('#detail button[data-v="lite"]') || {}).ariaPressed,
      chip: (document.querySelector('#parts-chip .pc-n') || {}).textContent || '' })`));
    if (st.lite === "true") return "it drew in Lite (clustered meshes): render on the GPU, not --swiftshader";
    const hd = JSON.parse(await page.cdp.eval("JSON.stringify(!!(__anim.headOn && __anim.headOn()))"));
    if (hd !== head) return `the head is ${hd ? "on" : "off"}, the render wants it ${head ? "on" : "off"} (?head=, js/lib/media-anim/)`;
    const rc = JSON.parse(await page.cdp.eval("JSON.stringify([!!(__anim.riderOn && __anim.riderOn()), !!(__anim.camOn && __anim.camOn())])"));
    if (rc[0] !== rider || rc[1] !== cam) return `the rider / Jensen Cam are ${rc.map((x) => (x ? "on" : "off")).join(" / ")}, the render wants ${[rider, cam].map((x) => (x ? "on" : "off")).join(" / ")} (?rider=, ?jensencam=)`;
    const have = Number((st.chip.match(/^(\d+)\//) || [])[1] || 0);
    if (nParts && have < nParts) return `${have} part files placed (Parts chip "${st.chip.trim()}"), the reduced set has ${nParts} (${path.relative(ROOT, PARTS_DIR)})`;
    return "";
  };
  return { plan, dump, shots, shotsFile, verify, files: files.files.length, head, rider, cam };
}
// the cache's segments joined and the soundtrack laid on them (--no-voice: the joined picture only)
async function renderTo(out, sp = scenePlan(), log = (l) => console.log(l)) {
  const only = (flag("--scenes", "") || "").split(",").filter(Boolean), dry = args.includes("--dry-run");
  const S = S_(), noVoice = args.includes("--no-voice") || only.length > 0 || dry, t0 = Date.now();
  const silent = noVoice ? path.resolve(out) : path.join(SCENE_WORK, path.basename(out).replace(/(\.\w+)?$/, ".silent.mp4"));
  log(`scenes: ${sp.plan.scenes.length}, ${sp.plan.size.join("x")} at ${sp.plan.fps} fps, renderer hash over ${sp.files} files, shots ${path.relative(ROOT, sp.shotsFile)}, head ${sp.head ? "on" : "off"}, rider ${sp.rider ? "on" : "off"}, Jensen Cam ${sp.cam ? "on" : "off"}`);
  const force = (flag("--force", "") || "").split(",").filter(Boolean);
  const r = await S.render(sp.plan, silent, { verify: sp.verify, force, only, dry, timeout: Number(flag("--timeout", 3600)), log });
  if (dry) return { ...r, sp };
  if (!noVoice) { mux(silent, out); fs.rmSync(silent); }
  log(`${path.resolve(out)}: ${r.probe.frames} frames, ${r.probe.vdur.toFixed(3)} s; wall ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  return { ...r, sp };
}
async function renderCmd() {
  const out = positional()[0];
  if (!out && !args.includes("--dry-run")) throw new Error("usage: node tools/lacing_voice.js render <out.mp4> [--size 1280x720] [--url URL] [--shots FILE] [--force a,b] [--no-voice] [--swiftshader] [--timeout 3600] [--scenes a,b] [--dry-run]");
  await renderTo(out || "dry.mp4");
}
// the maintainer's review clip: the scenes changed against the accepted dump (scenes diff), --pad s (1) either side, with
// their sound, cut from the full render (all cache hits but the changed scenes)
async function clipCmd() {
  const out = positional()[0];
  if (!out) throw new Error("usage: node tools/lacing_voice.js clip <out.mp4> [--pad 1] [--against <dump>] [render's flags]");
  const sp = scenePlan(), { G, base, against } = goldenDiff(sp.dump), d = G.diffScenes(sp.dump, base);
  const changed = d.scenes.filter((r) => r.status === "changed" || r.status === "new").map((r) => r.id);
  if (!changed.length) { console.log(`clip: no scene changed against ${path.relative(ROOT, against)}; nothing to review`); return; }
  const full = path.join(SCENE_WORK, "clip_full.mp4"), pad = Number(flag("--pad", 1)), fps = sp.plan.fps;
  await renderTo(full, sp);
  const spans = changed.map((id) => { const s = sp.plan.scenes.find((x) => x.id === id); return [s.i0 / fps - pad, (s.i0 + s.n) / fps + pad]; });
  const r = S_().clipOf(full, spans, out, { fps });
  console.log(`${path.resolve(out)}: ${changed.join(", ")} changed; ${r.spans.map(([a, b]) => `${a.toFixed(2)}-${b.toFixed(2)} s`).join(", ")}; ${r.probe.frames} frames, ${r.probe.duration.toFixed(2)} s`);
}
// stills from the cached segments (ffmpeg, no browser): still <t...> --out <dir> (+ contact-sheet.jpg)
function stillCmd() {
  const ts = positional().map(Number), dir = flag("--out");
  if (!ts.length || ts.some((t) => !(t >= 0)) || !dir) throw new Error("usage: node tools/lacing_voice.js still <t> [t...] --out <dir> [--shots FILE] [--size 1280x720]");
  const t0 = Date.now(), sp = scenePlan();
  for (const s of S_().stillsFrom(sp.plan, ts, path.resolve(dir))) console.log(`${path.relative(ROOT, s.png)}: ${s.id} frame ${s.j}`);
  console.log(`${path.relative(ROOT, path.join(path.resolve(dir), "contact-sheet.jpg"))} (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
}

// ---- iterate (R8): one command per iteration after a scene change, the steps of the quickstart in order through
// media-anim pipeline/pipeline.ts (timed, stopped at the first failure with its output, a timelog stage with each
// step's seconds, one summary block): changed (scenes diff against the accepted dump or --against, with --shots), checks
// (the test sections the quickstart's storyboard / shots / knots rows name, every frame: ~7 s, so all of them, on
// data.js: a --shots copy is not what they check), server (python tools/serve.py on a free port with LR4_SHOTS_FILE =
// --shots, unless --url names one), render (the scene cache: the misses rendered, joined, mux), clip (the changed scenes,
// --pad s either side, with sound) and stills (each changed scene at 0.25 s in, its middle and 0.25 s before its end,
// from the cached segments, and the contact sheet). Outputs: .exports/lacing_drafts/iterate_<stamp>_clip.mp4 and
// _sheet.jpg; the stills in .cache/lacing-tutorial/iterate/<stamp>/; --no-log: no timelog line ----
const ITER_SECTIONS = "storyboard,callouts,events,transcript,shots,frames,framing,blade,knotgen,closing,tape,story,stills";
const TIMELOG = path.join(SPECS, "lacing-tutorial.timelog.jsonl");
function freePort() {
  return new Promise((res, rej) => { const s = require("net").createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => res(p)); }); s.on("error", rej); });
}
async function startServer(shotsFile) {
  const port = await freePort(), env = { ...process.env };
  if (path.resolve(shotsFile) !== path.resolve(SHOTS_JSON)) env.LR4_SHOTS_FILE = path.resolve(shotsFile);
  const proc = require("child_process").spawn(process.env.PYTHON || "python", [path.join(ROOT, "tools", "serve.py"), "sandbox", "--no-open", `--port=${port}`],
    { cwd: ROOT, env, stdio: "ignore", windowsHide: true });
  const url = `http://127.0.0.1:${port}/web/index.html?anim=lacing`, stop = () => {
    if (proc.exitCode !== null) return;
    if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(proc.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true }); else proc.kill();
  };
  process.on("exit", stop);
  for (let i = 0; i < 150; i++) {
    try { if ((await fetch(`http://127.0.0.1:${port}/web/index.html`)).ok) return { url, port, stop }; } catch (e) { /* not up yet */ }
    if (proc.exitCode !== null) break;
    await new Promise((r) => setTimeout(r, 100));
  }
  stop();
  throw new Error(`serve.py did not come up on port ${port}`);
}
async function iterateCmd() {
  const P = MA("pipeline/pipeline.ts"), pad = Number(flag("--pad", 1)), rel = (f) => path.relative(ROOT, f).split(path.sep).join("/");
  const d = new Date(), z = (n) => String(n).padStart(2, "0"), stamp = `${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}-${z(d.getHours())}${z(d.getMinutes())}${z(d.getSeconds())}`;
  const drafts = path.join(ROOT, ".exports", "lacing_drafts"), work = path.join(ROOT, ".cache", "lacing-tutorial", "iterate", stamp);
  const quiet = [], log = (l) => quiet.push(l);
  let server = null;
  const spanOf = (sp, id) => { const s = sp.plan.scenes.find((x) => x.id === id); return [s.i0 / sp.plan.fps, (s.i0 + s.n) / sp.plan.fps]; };
  const steps = [
    { name: "changed", run: async (c) => {
      c.sp = scenePlan();
      const { G, base, against } = goldenDiff(c.sp.dump), D = G.diffScenes(c.sp.dump, base);
      c.changed = D.scenes.filter((r) => r.status === "changed" || r.status === "new").map((r) => r.id);
      return { line: `${c.changed.length ? c.changed.join(", ") : "none"} of ${D.scenes.length} against ${rel(against)}` };
    } },
    P.cmdStep("checks", process.execPath, [path.join(ROOT, "tests", "test_lacing_tutorial.js"), "--only", ITER_SECTIONS], { cwd: ROOT,
      line: (out) => (out.trim().split(/\r?\n/).pop() || "").replace(/ \(.*$/, "") + (flag("--shots") ? " (data.js, not --shots)" : "") }),
    { name: "server", run: async (c) => {
      if (flag("--url")) { c.url = flag("--url"); return { skip: `--url ${c.url}` }; }
      server = await startServer(c.sp.shotsFile); c.url = server.url; return { line: `port ${server.port}` + (flag("--shots") ? `, LR4_SHOTS_FILE=${rel(c.sp.shotsFile)}` : "") };
    } },
    { name: "render", run: async (c) => {
      c.sp.plan.url = c.url;
      c.full = path.join(SCENE_WORK, "iterate_full.mp4");
      const r = await renderTo(c.full, c.sp, log), miss = r.rows.filter((x) => !x.hit);
      c.render = `${r.rows.length - miss.length} hits, ${miss.length} rendered (${miss.reduce((a, x) => a + x.n, 0)} frames)`;
      return { line: c.render };
    } },
    { name: "clip", run: async (c) => {
      if (!c.changed.length) return { skip: "no scene changed" };
      c.clip = path.join(drafts, `iterate_${stamp}_clip.mp4`);
      const r = S_().clipOf(c.full, c.changed.map((id) => { const [a, b] = spanOf(c.sp, id); return [a - pad, b + pad]; }), c.clip, { fps: c.sp.plan.fps });
      return { line: `${r.probe.duration.toFixed(1)} s (${r.spans.map(([a, b]) => `${a.toFixed(1)}-${b.toFixed(1)}`).join(", ")})` };
    } },
    { name: "stills", run: async (c) => {
      if (!c.changed.length) return { skip: "no scene changed" };
      const ts = c.changed.flatMap((id) => { const [a, b] = spanOf(c.sp, id); return [a + 0.25, (a + b) / 2, b - 0.25]; });
      const st = S_().stillsFrom(c.sp.plan, ts, work);
      c.sheet = path.join(drafts, `iterate_${stamp}_sheet.jpg`);
      fs.copyFileSync(path.join(work, "contact-sheet.jpg"), c.sheet);
      return { line: `${st.length} stills in ${rel(work)}` };
    } },
  ];
  let r;
  try {
    r = await P.runSteps(steps, { log: (l) => console.log(l), timelog: args.includes("--no-log") ? null : { file: TIMELOG, stage: `iterate-${stamp}`, kind: "check", source: "lacing_voice.js iterate" } });
  } finally { if (server) server.stop(); }
  if (!r.ok && quiet.length) console.log(quiet.slice(-15).join("\n"));
  const c = r.ctx;
  console.log("\n" + P.summaryBlock(r, { title: `iterate ${stamp}`, extra: [
    c.changed ? `changed: ${c.changed.length ? c.changed.join(", ") : "none"}` : "",
    c.clip && fs.existsSync(c.clip) ? `clip:   ${rel(c.clip)}` : "", c.sheet ? `sheet:  ${rel(c.sheet)}` : "",
    r.logged ? `timelog: ${r.logged.stage} (${rel(TIMELOG)})` : ""] }));
  if (!r.ok) process.exitCode = 1;
}

// ---- the stage brief: the changed scenes and, for each, its storyboard entry and its shots rows (camera keys, layers,
// lead, knots, blade cuts), then the quickstart's "you change / then run" table: what an agent resumed after a compaction
// reads, in place of the module set ----
const short = (v, n = 150) => { const s = typeof v === "string" ? v : JSON.stringify(v); return s.length > n ? s.slice(0, n - 3) + "..." : s; };
function brief() {
  if (!hasGolden()) { console.log(`brief: skipped (media-anim pipeline/golden.ts not found under ${MEDIA_ANIM})`); return; }
  const { G, dump, base, against } = goldenDiff(), d = G.diffScenes(dump, base);
  const sb = readSb(), shots = JSON.parse(fs.readFileSync(SHOTS_JSON, "utf8")), out = [];
  const changed = d.scenes.filter((r) => r.status !== "identical");
  out.push(`# stage brief against ${path.relative(ROOT, against).split(path.sep).join("/")}: ${changed.length} of ${d.scenes.length} scenes changed` +
    (changed.length < d.scenes.length ? ` (identical: ${d.scenes.filter((r) => r.status === "identical").map((r) => r.id).join(", ")})` : ""));
  for (const r of changed) {
    out.push("", "## " + G.diffText({ scenes: [r], outputs: {}, plan: 0 }).split("\n").slice(0, -1).join("\n"));
    const s = sb.scenes.find((x) => x.id === r.id);
    if (s) {
      out.push(`storyboard: ${s.purpose}, cue "${s.cue}", holdS ${s.holdS}, audioS ${s.audioS}`, `  narration: ${s.narration}`);
      for (const m of s.more || []) out.push(`  more ${m.id} (gapS ${m.gapS || 0}): ${m.narration}`);
      for (const c of s.callouts || []) out.push(`  callout ${short(c)}`);
    }
    const sh = shots.scenes[r.id];
    if (sh) {
      if (sh.lead !== undefined) out.push(`shots.scenes.${r.id}.lead: ${sh.lead}`);
      const cam = sh.camera || {};
      out.push(`shots.scenes.${r.id}.camera: ${short(Object.fromEntries(Object.entries(cam).filter(([k]) => k !== "keys")))}`);
      for (const k of cam.keys || []) out.push(`  key ${short(k)}`);
      for (const [k, v] of Object.entries(sh).filter(([k]) => !["lead", "camera"].includes(k))) out.push(`shots.scenes.${r.id}.${k}: ${short(v)}`);
    }
    for (const [k, kn] of Object.entries(shots.knots || {})) if (k === r.id || (kn.scenes || []).includes(r.id)) {
      out.push(`shots.knots.${k}: ${short(Object.fromEntries(Object.entries(kn).filter(([x]) => x !== "steps" && x !== "sequence")))}`);
      for (const st of kn.steps || []) out.push(`  step ${short(st)}`);
      for (const m of kn.sequence || []) out.push(`  ${m.do} ${short(Object.fromEntries(Object.entries(m).filter(([x]) => x !== "do")))}`);
    }
    const cuts = ((shots.blade || {}).cuts || {})[r.id];
    if (cuts) out.push(`shots.blade.cuts.${r.id}: ${short(cuts)}`);
  }
  if (changed.length) out.push("", reviewHint(changed));
  if (Object.keys(d.outputs).length || d.plan) out.push("", `outputs changed: ${Object.entries(d.outputs).map(([k, v]) => `${k} (${v})`).join(", ") || "none"}; plan: ${d.plan ? `${d.plan} values` : "same"}`);
  // the quickstart's table, read from the spec so it stays the one copy
  const spec = fs.readFileSync(path.join(SPECS, "lacing-tutorial.md"), "utf8").split("\n"), i = spec.findIndex((l) => l.startsWith("| you change |"));
  if (i >= 0) { out.push("", "then run (docs/specs/lacing-tutorial.md, Agent quickstart):"); for (let j = i + 2; j < spec.length && spec[j].startsWith("|"); j++) out.push("  " + spec[j]); }
  console.log(out.join("\n"));
}

module.exports = { citeOf, musicPlan, gainExpr, chaptersFiles, sidebarOf, zoomtubeOf, youtubeRules,   // (tests/test_lacing_sources.js, test_lacing_exports.js)
  CHAPTERS_VTT, YOUTUBE_TXT, SIDEBAR, ZT_JSON, hasMediaAnim, MEDIA_ANIM, golden };
if (require.main === module) try {
  if (cmd === "tts") tts();
  else if (cmd === "tighten") tightenCmd();
  else if (cmd === "sync") sync();
  else if (cmd === "transcript") transcript();
  else if (cmd === "sfx") sfx();
  else if (cmd === "mux" && positional().length === 2) mux(path.resolve(positional()[0]), positional()[1], args.includes("--dry-run"));
  else if (cmd === "draft") draft();
  else if (cmd === "chapters") chapters();
  else if (cmd === "sidebar") sidebar();
  else if (cmd === "zoomtube") zoomtube();
  else if (cmd === "scenes") scenes();
  else if (cmd === "brief") brief();
  else if (cmd === "render" || cmd === "clip") (cmd === "render" ? renderCmd() : clipCmd()).catch((e) => { console.error(String(e.message || e)); process.exit(1); });
  else if (cmd === "still") stillCmd();
  else if (cmd === "parts") partsCmd();
  else if (cmd === "iterate") iterateCmd().catch((e) => { console.error(String(e.message || e)); process.exit(1); });
  else { console.log("usage: node tools/lacing_voice.js tts | tighten [--only id,...] | sync | transcript | sfx | mux <video.mp4> <out.mp4> [--dir DIR] [--dry-run] | draft <out.mp4> [--no-voice] | chapters | sidebar | zoomtube [--video-id ID] | scenes [diff|check|accept|hashes|write <file>] [--against <dump>] | brief [--against <dump>] | render <out.mp4> | clip <out.mp4> | still <t...> --out <dir> | parts [--src a,b] [--target 0.05] [--no-measure] | iterate [--against <dump>] [--shots FILE] [--url URL]"); process.exit(2); }
} catch (e) { console.error(String(e.message || e)); process.exit(1); }
