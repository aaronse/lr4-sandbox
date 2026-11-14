// The lacing tutorial's callout words, timed in the voice-over (docs/specs/lacing-tutorial.md, draft 10):
//   node tools/lacing_words.js [--dir exports/lacing_voice] [--dry]
// Each storyboard callout with a `word` pops in when its scene's line says that word. This measures when: the word
// timestamps of the scene's wav (media-anim audio/words.ts: faster-whisper small.en, int8 on the CPU, through
// media-gen's scripts/asr_align.py), then the callout's word found in them (words.ts find: the same occurrence as in
// the spoken line; a hyphenated word may come back as two words, "76" as "76mm") -> `wordS` (s into the line, its
// first ASR word's start) on the callout in docs/specs/lacing-tutorial.storyboard.json, as `audioS` is. This file keeps
// the lacing mapping: which callouts, which scene's wav, where the word sits in the line, the estimate beside it.
// Prints each word's measured time beside LR4LacingTut's estimate (the share of the spoken line's characters before
// it x audioS) and the estimate's error. --dry prints and writes nothing. Then: node tools/lacing_voice.js sync.
// Env: MEDIA_GEN (E:/git/media-gen), ASR_PYTHON (python: the system Python, which has faster-whisper), MEDIA_ROOT (where
// the media-anim sibling is; default this repo's parent).
// ~5 s to load the model, ~1.5 s a wav.
// (d29) Every line's words too, for the face rig's lip sync (the head and the rider: web/js/lacing/rider.js speechOf):
// docs/specs/lacing-tutorial.words.json { lines: { <id>: [{ w, t0, t1 }] } }, s into the line's wav (the wav the video
// plays: <id>.tight.wav with voice.tighten), copied into web/js/lacing/data.js as WORDS by tools/lacing_voice.js sync.
// --words-only writes it and leaves the storyboard alone. The ASR gives the words and their order; its times are
// coarse (abutting words, ~0.1 s early on these takes: .cache/lacing-tutorial/d29/lipsync.cjs), so each word is snapped
// to the wav's voiced runs (snapWords: media-anim pace.ts's 10 ms envelope over its quiet threshold, runs closer than
// RUN_GAP merged): a word goes to the run it overlaps most (in order), a run's words are spread over it by their ASR
// shares, and a run no word took joins its nearest neighbour (one under MIN_RUN, a click, is dropped). The mouth is then open where the voice is.
"use strict";
const fs = require("fs"), path = require("path");

const ROOT = path.join(__dirname, "..");
const SB_JSON = path.join(ROOT, "docs", "specs", "lacing-tutorial.storyboard.json");
const WORDS_JSON = path.join(ROOT, "docs", "specs", "lacing-tutorial.words.json");
const TUT_JS = path.join(ROOT, "web", "js", "lacing_tutorial.js");
const MEDIA_GEN = path.resolve(process.env.MEDIA_GEN || "E:/git/media-gen");
const PY = process.env.ASR_PYTHON || "python";
const WORDS = path.join(process.env.MEDIA_ROOT || path.join(ROOT, ".."), "media-anim", "audio", "words.ts");
const args = process.argv.slice(2);
const flag = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const dir = path.resolve(ROOT, flag("--dir", "exports/lacing_voice")), dry = args.includes("--dry"), wordsOnly = args.includes("--words-only");

// ---- the words snapped to the voiced runs (d29). db: the 10 ms envelope (dBFS), th its quiet threshold ----
const RUN_GAP = 0.06, MIN_RUN = 0.05, WIN_S = 0.01;
function runsOf(db, th, gap = RUN_GAP) {
  const runs = [];
  for (let i = 0; i < db.length; i++) {
    if (!(db[i] > th)) continue;
    const a = i * WIN_S, b = (i + 1) * WIN_S, last = runs[runs.length - 1];
    if (last && a - last[1] <= gap + 1e-9) last[1] = b; else runs.push([a, b]);
  }
  return runs;
}
function snapWords(words, runs) {
  if (!words.length || !runs.length) return words.map((q) => Object.assign({}, q));
  const ov = (q, r) => Math.max(0, Math.min(q.t1, r[1]) - Math.max(q.t0, r[0]));
  const dist = (q, r) => Math.max(0, r[0] - q.t1, q.t0 - r[1]);
  let k0 = 0;
  const at = words.map((q) => {                      // (in order: a word never goes to a run before its predecessor's)
    let best = k0;
    for (let k = k0; k < runs.length; k++) {
      const a = ov(q, runs[k]), b = ov(q, runs[best]);
      if (a > b + 1e-9 || (a === 0 && b === 0 && dist(q, runs[k]) < dist(q, runs[best]))) best = k;
    }
    k0 = best;
    return best;
  });
  // a run no word took: into its nearest taken run (the span joined)
  const span = runs.map((r) => r.slice()), taken = new Set(at);
  runs.forEach((r, k) => {
    if (taken.has(k) || r[1] - r[0] < MIN_RUN - 1e-9) return;   // (a click or a breath under MIN_RUN: dropped)
    let j = -1;
    for (const t of taken) if (j < 0 || Math.abs(t - k) < Math.abs(j - k) || (Math.abs(t - k) === Math.abs(j - k) && t < j)) j = t;
    span[j] = [Math.min(span[j][0], r[0]), Math.max(span[j][1], r[1])];
  });
  const out = [];
  for (const k of [...taken].sort((a, b) => a - b)) {
    const ws = words.map((q, i) => i).filter((i) => at[i] === k), [a, b] = span[k];
    const W0 = words[ws[0]].t0, W1 = words[ws[ws.length - 1]].t1, f = (t) => (W1 > W0 ? a + ((t - W0) * (b - a)) / (W1 - W0) : a);
    ws.forEach((i, n) => {
      const q = words[i], t0 = W1 > W0 ? f(q.t0) : a + ((b - a) * n) / ws.length, t1 = W1 > W0 ? f(q.t1) : a + ((b - a) * (n + 1)) / ws.length;
      out[i] = { w: q.w, t0: Math.round(t0 * 1000) / 1000, t1: Math.round(t1 * 1000) / 1000 };
    });
  }
  return out;
}

function main() {
  if (!fs.existsSync(WORDS)) throw new Error(`media-anim not found (${WORDS}): clone it beside this repo or set MEDIA_ROOT`);
  const { asrWords, tokensOf, occurrence, find } = require(WORDS);
  const sb = JSON.parse(fs.readFileSync(SB_JSON, "utf8")), T = require(TUT_JS), tm = T.timing(sb);
  // (d12: the opening's reveal - the scene's `reveal: { line, word }`, the lacing flashing in as that later line says
  // the word - is timed the same way, from its line's own wav)
  const jobs = [];
  sb.scenes.forEach((s, i) => (s.callouts || []).forEach((c) => { if (c.word) jobs.push({ s, i, c, id: c.line || s.id }); }));   // (d14: a callout's line)
  sb.scenes.forEach((s, i) => { if (s.reveal && s.reveal.word) jobs.push({ s, i, c: s.reveal, id: s.reveal.line || s.id }); });
  // (d27: with the storyboard's voice.tighten the video plays <id>.tight.wav, tools/lacing_voice.js tighten: time the words there)
  const wavOf = (id) => path.join(dir, sb.voice && sb.voice.tighten ? `${id}.tight.wav` : `${id}.wav`);
  const lineIds = sb.scenes.flatMap((s) => [s.id, ...(s.more || []).map((m) => m.id)]);
  const wavs = [...new Set([...jobs.map((j) => wavOf(j.id)), ...lineIds.map(wavOf)])];
  for (const w of wavs) if (!fs.existsSync(w)) throw new Error(`${w}: no wav (node tools/lacing_voice.js tts, then tighten)`);
  const { words, seconds, device } = asrWords(wavs, { mediaGen: MEDIA_GEN, python: PY, model: "small.en" });
  console.log(`asr: ${wavs.length} wavs in ${seconds.toFixed(1)} s (faster-whisper small.en, ${device || "CPU int8"})`);
  const r3 = (x) => Math.round(x * 1000) / 1000, lines = {}, PACE = path.join(path.dirname(WORDS), "pace.ts");
  const { decode, envelope, thresholdOf } = require(PACE);
  for (const id of lineIds) {
    const db = envelope(decode(wavOf(id))), runs = runsOf(db, thresholdOf(db).dBFS);
    lines[id] = snapWords((words[wavOf(id)] || []).map((q) => ({ w: q.w, t0: r3(q.start), t1: r3(q.end) })), runs);
  }
  const n = Object.values(lines).reduce((a, l) => a + l.length, 0);
  if (!dry) {
    const head = { about: "Every voice line's words, timed in the wav the video plays (s into the line), for the face rig's lip sync. Generated by node tools/lacing_words.js (media-anim audio/words.ts, faster-whisper small.en); copied into web/js/lacing/data.js as WORDS by node tools/lacing_voice.js sync. Don't edit.",
      model: "small.en", wavs: sb.voice && sb.voice.tighten ? "<id>.tight.wav" : "<id>.wav" };
    // (a line a voice line: the file is read by the sync and the tests, diffed by people)
    fs.writeFileSync(WORDS_JSON, JSON.stringify(head, null, 2).replace(/\n}$/, ",\n  \"lines\": {\n") +
      lineIds.map((id) => `    ${JSON.stringify(id)}: ${JSON.stringify(lines[id])}`).join(",\n") + "\n  }\n}\n");
    console.log(`${path.relative(ROOT, WORDS_JSON)}: ${n} words in ${lineIds.length} lines`);
  }
  if (wordsOnly) return;
  if (!jobs.length) { console.log("no callout or reveal has a word"); return; }
  const rows = [];
  for (const { s, i, c, id } of jobs) {
    const line = tm.scenes[i].lines.find((l) => l.id === id), tokens = tokensOf(c.word);
    if (!line) throw new Error(`${s.id}: no line ${id} for "${c.word}"`);
    // (which occurrence: the spoken line's words before it that start the same phrase)
    const k = occurrence(line.text, tokens, T.wordIndex(line.text, c.word));
    const m = find(tokens, words[wavOf(id)], k);
    const est = T.wordAt(Object.assign({}, c, { wordS: undefined }), line);
    rows.push({ scene: id === s.id ? s.id : `${s.id}/${id}`, word: c.word, wordS: m ? +m.start.toFixed(3) : null, est: +est.toFixed(3), err: m ? +(est - m.start).toFixed(3) : null });
    if (m) {                                       // (wordS right after word: the callout's keys in their order)
      const o = {};
      for (const [key, v] of Object.entries(c)) { if (key === "wordS") continue; o[key] = v; if (key === "word") o.wordS = +m.start.toFixed(3); }
      for (const key of Object.keys(c)) delete c[key];
      Object.assign(c, o);
    }
  }
  console.log("scene         word           wordS (s)  estimate (s)  error (s)");
  for (const q of rows) console.log(`${q.scene.padEnd(13)} ${JSON.stringify(q.word).padEnd(14)} ${String(q.wordS === null ? "not found" : q.wordS.toFixed(2)).padStart(9)}  ${q.est.toFixed(2).padStart(12)}  ${q.err === null ? "-" : (q.err >= 0 ? "+" : "") + q.err.toFixed(2)}`);
  const errs = rows.filter((q) => q.err !== null).map((q) => Math.abs(q.err));
  if (errs.length) console.log(`estimate error over ${errs.length} words: mean ${(errs.reduce((a, b) => a + b, 0) / errs.length).toFixed(2)} s, max ${Math.max(...errs).toFixed(2)} s`);
  const missed = rows.filter((q) => q.wordS === null);
  if (missed.length) console.log(`not found (left to the estimate): ${missed.map((q) => `${q.scene} "${q.word}"`).join(", ")}`);
  if (dry) return;
  fs.writeFileSync(SB_JSON, JSON.stringify(sb, null, 2) + "\n");
  console.log(`${SB_JSON}: wordS on ${rows.length - missed.length} callouts; now node tools/lacing_voice.js sync`);
}
if (require.main === module) main();
module.exports = { runsOf, snapWords, RUN_GAP };
