// The cable-lacing tutorial's exports (node tools/lacing_voice.js chapters | sidebar | zoomtube): the chapters (every
// scene in exactly one, in scene order), the WebVTT chapters track (valid, 0 to the video's end with no gaps), the
// YouTube description lines (YouTube's rules), the sidebar feed (every source and glossary ref resolves, its times =
// timing()'s = the transcript's), the ZoomTube manifest (seqs tile the clock, each in one chapter by the viewer's include
// rule, tags arrays), and the committed files current. The generic rules (YouTube's, the gain envelope, the music plan
// on a made-up storyboard) are media-anim's tests (tools/publish/exports.test.mjs, tools/audio/mix.test.mjs); the checks
// that build through media-anim are skipped with a note when it is absent (CI), the ones on the committed files run.
//   node tests/test_lacing_exports.js
"use strict";
const fs = require("fs"), path = require("path");
const T = require("../web/js/lacing_tutorial.js");
const X = require("../tools/lacing_voice.js");

const ROOT = path.join(__dirname, "..");
const sb = JSON.parse(fs.readFileSync(path.join(ROOT, "docs", "specs", "lacing-tutorial.storyboard.json"), "utf8"));
const tr = JSON.parse(fs.readFileSync(path.join(ROOT, "docs", "specs", "lacing-tutorial.transcript.json"), "utf8"));
const read = (p) => (fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null);
let fails = 0, checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) { fails++; console.log("FAIL " + msg); } };
const near = (a, b, tol = 1e-3) => Math.abs(a - b) <= tol;
const tm = T.timing(sb), dur = tm.duration;
const MA = X.hasMediaAnim();

// ---- the chapters: every one's scenes exist, each scene in exactly one chapter, the chapters in scene order ----
const ids = sb.scenes.map((s) => s.id), count = new Map(ids.map((id) => [id, 0]));
ok(Array.isArray(sb.chapters) && sb.chapters.length > 0, "storyboard: no chapters");
for (const c of sb.chapters || []) {
  ok(c.id && c.title && Array.isArray(c.scenes) && c.scenes.length, `chapter ${JSON.stringify(c)}: wants id, title, scenes`);
  for (const id of c.scenes || []) { ok(count.has(id), `chapter ${c.id}: no scene ${id}`); if (count.has(id)) count.set(id, count.get(id) + 1); }
}
for (const [id, n] of count) ok(n === 1, `scene ${id}: in ${n} chapters, wants exactly 1`);
ok((sb.chapters || []).flatMap((c) => c.scenes).join(",") === ids.join(","), "chapters: their scenes are not in scene order");

// ---- the WebVTT chapters track: a header, a cue a chapter, HH:MM:SS.mmm, 0 to the video's end with no gaps ----
const vtt = read(X.CHAPTERS_VTT) || "";
ok(/^WEBVTT(\s|$)/.test(vtt), "chapters.vtt: no WEBVTT header");
const sec = (h, m, s, ms) => +h * 3600 + +m * 60 + +s + +ms / 1000;
const cues = [...vtt.matchAll(/^(\d{2}):([0-5]\d):([0-5]\d)\.(\d{3}) --> (\d{2}):([0-5]\d):([0-5]\d)\.(\d{3})\n(.+)$/gm)]
  .map((m) => ({ a: sec(m[1], m[2], m[3], m[4]), b: sec(m[5], m[6], m[7], m[8]), text: m[9] }));
ok((vtt.match(/-->/g) || []).length === cues.length, "chapters.vtt: a cue's timing line is not HH:MM:SS.mmm --> HH:MM:SS.mmm then its text");
ok(cues.length === (sb.chapters || []).length, `chapters.vtt: ${cues.length} cues for ${(sb.chapters || []).length} chapters`);
cues.forEach((q, i) => {
  ok(q.b > q.a, `chapters.vtt cue ${i}: ends before it starts`);
  ok(i ? near(q.a, cues[i - 1].b, 1e-9) : q.a === 0, `chapters.vtt cue ${i}: a gap or overlap at ${q.a}`);
  ok(q.text === (sb.chapters[i] || {}).title, `chapters.vtt cue ${i}: "${q.text}" is not the chapter's title`);
});
ok(cues.length && near(cues[cues.length - 1].b, dur), `chapters.vtt: ends at ${cues.length && cues[cues.length - 1].b}, the video at ${dur}`);

// ---- the YouTube lines: "M:SS Title", the first at 0:00, at least 3, ascending, each at least 10 s ----
const yt = (read(X.YOUTUBE_TXT) || "").split("\n").filter(Boolean);
const marks = yt.map((l) => { const m = /^(?:(\d+):)?(\d{1,2}):(\d\d) (\S.*)$/.exec(l); return m && { at: +(m[1] || 0) * 3600 + +m[2] * 60 + +m[3], title: m[4] }; });
ok(yt.length && marks.every(Boolean), `youtube.txt: a line is not "M:SS Title": ${JSON.stringify(yt)}`);
const mk = marks.filter(Boolean);
ok(mk.length >= 3, `youtube.txt: ${mk.length} chapters, YouTube wants at least 3`);
ok(mk.length && mk[0].at === 0 && yt[0].startsWith("0:00 "), "youtube.txt: the first is not at 0:00");
mk.forEach((c, i) => {
  const end = i + 1 < mk.length ? mk[i + 1].at : Math.floor(dur);
  ok(end - c.at >= 10, `youtube.txt "${c.title}": ${end - c.at} s, YouTube wants at least 10`);
  ok(c.title === (sb.chapters[i] || {}).title, `youtube.txt line ${i}: "${c.title}" is not the chapter's title`);
  ok(Math.abs(c.at - (cues[i] || {}).a) < 1, `youtube.txt line ${i}: ${c.at} s, its cue at ${(cues[i] || {}).a}`);
});

// ---- the sidebar: every source and glossary ref resolves; its times = timing()'s = the transcript's ----
const sd = JSON.parse(read(X.SIDEBAR) || "{}");
const refs = new Map((sb.references || []).map((r) => [r.id, r])), terms = new Set((sb.terms || []).map((g) => g.id));
ok(near(sd.duration_s, dur), `sidebar: duration ${sd.duration_s}, timing ${dur}`);
ok((sd.glossary || []).length === (sb.terms || []).length, "sidebar: a glossary entry a term");
for (const g of sd.glossary || []) {
  const r = refs.get(g.ref);
  ok(r && g.title === r.title && g.url === r.url && g.def && g.quote, `sidebar glossary ${g.id}: ref "${g.ref}" does not resolve`);
}
const sl = (sd.chapters || []).flatMap((c) => c.lines);
const want = tm.scenes.flatMap((s) => s.lines.map((l, k) => ({ id: l.id, a: k ? l.at : s.start, b: k ? l.at + l.dur : s.end })));
ok(sl.map((l) => l.id).join(",") === want.map((l) => l.id).join(","), "sidebar: its lines are not timing()'s, in order");
for (const l of sl) {
  const w = want.find((x) => x.id === l.id) || {};
  ok(near(l.t_start, w.a) && near(l.t_end, w.b), `sidebar ${l.id}: ${l.t_start}-${l.t_end}, timing() ${w.a}-${w.b}`);
  for (const q of l.sources || []) {
    const r = refs.get(q.ref);
    ok(r && q.title === r.title && q.url === r.url && q.where && q.says, `sidebar ${l.id}: source "${q.ref}" does not resolve`);
  }
  ok((l.sources || []).length || l.uncited, `sidebar ${l.id}: no sources and no uncited`);
  for (const g of l.terms || []) {
    ok(terms.has(g.id), `sidebar ${l.id}: term "${g.id}" is not in the storyboard's terms`);
    ok((g.t_in === undefined || (g.t_in >= l.t_start - 1e-3 && g.t_in <= l.t_end + 1e-3)) && (g.t_out === undefined || g.t_in === undefined || g.t_out > g.t_in),
      `sidebar ${l.id}: term ${g.id} t_in ${g.t_in} / t_out ${g.t_out}`);
  }
}
for (const [i, c] of (sd.chapters || []).entries()) {
  const ss = ((sb.chapters || [])[i] || {}).scenes || [], sc = tm.scenes.filter((s) => ss.includes(s.id));
  ok(sc.length && near(c.t_start, sc[0].start) && near(c.t_end, sc[sc.length - 1].end), `sidebar chapter ${c.id}: ${c.t_start}-${c.t_end}`);
}
// (= the transcript's: a scene's own line its entry's t_start / t_end, a later line its more[])
for (const e of tr.entries) {
  const l = sl.find((x) => x.id === e.id) || {};
  ok(l.t_start === e.t_start && l.t_end === e.t_end && l.spoken === e.spoken && l.caption === e.caption, `sidebar ${e.id}: differs from the transcript's entry`);
  for (const m of e.more || []) {
    const lm = sl.find((x) => x.id === m.id) || {};
    ok(lm.t_start === m.t_start && lm.t_end === m.t_end && lm.spoken === m.spoken, `sidebar ${m.id}: differs from the transcript's more`);
  }
}

// ---- the ZoomTube manifest (built here; exports/ is git-ignored): seqs tile 0..duration, each in exactly one chapter
// by the viewer's rule (E:/git/zt-web/src/components/ProjectViewer.js 1786-1842), tags arrays, one 1.0x video ----
// the viewer's short title (getShortTitle(item, null, true): the text after the first "—") and its include match
const shortTitle = (t) => (t.indexOf("—") !== -1 ? t.split("—", 2)[1].trim() : t);
function chapterOfSeqs(m) {
  const parent = new Map();
  for (const c of m.chapters) {
    if (!c.include) { for (const q of m.seqs) if (shortTitle(q.title).startsWith(c.title)) parent.set(q.key, [...(parent.get(q.key) || []), c.key]); continue; }
    for (const ex of c.include) {
      ok(typeof ex === "string" && ex.endsWith("*"), `zoomtube chapter ${c.key}: include "${ex}" is not a pattern the viewer supports`);
      const mid = ex.startsWith("*"), p = ex.slice(mid ? 1 : 0, -1).toLowerCase();
      for (const q of m.seqs) {
        const s = shortTitle(q.title).toLowerCase();
        if (!parent.has(q.key) && (mid ? s.includes(p) : s.startsWith(p))) parent.set(q.key, [c.key]);
      }
    }
  }
  return parent;
}
function checkManifest(m, what) {
  const durMs = Math.round(dur * 1000);
  ok(m.schemaVersion === 2 && m.title && Array.isArray(m.chapters) && Array.isArray(m.seqs) && Array.isArray(m.vids), `${what}: not a schema-v2 manifest`);
  ok(m.seqs.length === tm.scenes.length, `${what}: ${m.seqs.length} seqs for ${tm.scenes.length} scenes`);
  m.seqs.forEach((q, i) => {
    ok(Array.isArray(q.tags), `${what} ${q.key}: tags is not an array`);
    ok(Number.isInteger(q.rts) && Number.isInteger(q.rtDur) && q.rtDur > 0, `${what} ${q.key}: rts ${q.rts} rtDur ${q.rtDur}`);
    ok(i ? q.rts === m.seqs[i - 1].rts + m.seqs[i - 1].rtDur : q.rts === 0, `${what} ${q.key}: a gap or overlap at ${q.rts} ms`);
    ok(q.rts === Math.round(tm.scenes[i].start * 1000), `${what} ${q.key}: rts ${q.rts}, the scene at ${tm.scenes[i].start} s`);
    ok(/^\d+:\d\d:\d\d\.\d{3}$/.test(q.rtsStr), `${what} ${q.key}: rtsStr "${q.rtsStr}"`);
    for (const c of q.claims || []) for (const s of c.sources || [])
      ok(s.type === "doc" && refs.has(s.docId) && s.url === refs.get(s.docId).url, `${what} ${q.key}: claim source ${s.docId} does not resolve`);
  });
  const last = m.seqs[m.seqs.length - 1] || {};
  ok(last.rts + last.rtDur === durMs, `${what}: the seqs end at ${last.rts + last.rtDur} ms, the video at ${durMs}`);
  ok([...m.seqs].sort((a, b) => a.key.localeCompare(b.key)).map((q) => q.key).join() === m.seqs.map((q) => q.key).join(), `${what}: seq keys do not sort in scene order (the viewer sorts by key)`);
  const parent = chapterOfSeqs(m);
  m.seqs.forEach((q, i) => {
    const want = (sb.chapters.find((c) => c.scenes.includes(tm.scenes[i].id)) || {}).title;
    const got = (parent.get(q.key) || []).map((k) => (m.chapters.find((c) => c.key === k) || {}).title);
    ok(got.length === 1 && got[0] === want, `${what} ${q.key}: in chapters ${JSON.stringify(got)}, wants "${want}"`);
  });
  ok(m.vids.length === 1 && m.vids[0].speed === 1 && m.vids[0].seqKey === null && m.vids[0].rts === 0 && m.vids[0].rtDur === durMs,
    `${what}: wants one 1.0x video spanning 0..${durMs} ms: ${JSON.stringify(m.vids)}`);
  for (const d of m.documents || []) ok(refs.has(d.docId), `${what}: document ${d.docId} is not a reference`);
  for (const g of m.glossary || []) ok(refs.has(g.docId) && terms.has(g.id), `${what}: glossary ${g.id} does not resolve`);
}
const zt = MA ? X.zoomtubeOf(sb, T, "abcdefghijk", new Date(0)) : null;
if (zt) checkManifest(zt, "zoomtube");
if (zt) ok(zt.vids[0].src === "abcdefghijk" && X.zoomtubeOf(sb, T).vids[0].src === null && X.zoomtubeOf(sb, T).vids[0].note, "zoomtube: src from --video-id, else null with a note");
if (fs.existsSync(X.ZT_JSON)) checkManifest(JSON.parse(fs.readFileSync(X.ZT_JSON, "utf8")), "exports zoomtube");

// ---- the music (draft 11): the intro full to the hit, ducked under every line of the first scene, gone after its fade;
// the outro in with the credits and silent at the video's end ----
const tmM = T.timing(sb), mus = MA ? X.musicPlan(sb, tmM) : [], dbAt = (m, t) => {
  const k = m.keys, u = t - m.at;
  if (u <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) if (u <= k[i][0]) return k[i - 1][1] + (k[i][1] - k[i - 1][1]) * (u - k[i - 1][0]) / (k[i][0] - k[i - 1][0]);
  return k[k.length - 1][1];
};
if (sb.music && MA) {
  const I = mus.find((m) => m.id === "intro"), O = mus.find((m) => m.id === "outro"), M = sb.music;
  // (d12: the file's hit, hitInS into it, lands on the reveal - tm.hit, the spoken "cable lacing" - and ducks ringS after
  // it; the lines before the intro starts play under no music)
  ok(I && Math.abs(I.at + M.intro.hitInS - M.intro.from - tmM.hit) < 1e-6 && Math.abs(dbAt(I, tmM.hit) - M.intro.gainDb) < 0.01, `music: the intro's hit on the reveal ${tmM.hit} s, full there (${I && dbAt(I, tmM.hit).toFixed(1)} dB)`);
  const duck0 = tmM.hit + M.intro.ringS + M.intro.duckS * 0.7;
  ok(I.at > tmM.scenes[0].lines[0].at + tmM.scenes[0].lines[0].dur - 1, `music: the intro starts at ${I.at.toFixed(2)} s, under the problem's last words at the earliest`);
  for (const l of tmM.scenes[0].lines) for (let q = 0; q <= 10; q++) {
    const t = l.at + M.intro.duckS + (l.dur - M.intro.duckS) * q / 10;
    if (t < duck0) continue;                         // (before the intro, its hit's ring, or the duck's ramp)
    ok(dbAt(I, t) <= M.intro.duckDb + 0.01, `music: ducked under ${l.id} at ${t.toFixed(2)} s (${dbAt(I, t).toFixed(1)} dB)`);
  }
  ok(I.at + I.dur <= tmM.scenes[1].lines[0].at + 2 && dbAt(I, I.at + I.dur) <= -90 + 1e-6, "music: the intro is gone soon after the first scene");   // (1e-6: at + dur - at in floats, d27: -89.9999999)
  const cs = tmM.scenes[tmM.scenes.length - 1].end - sb.credits.holdS;
  ok(O && Math.abs(O.at + M.outro.fadeInS - cs) < 1e-6 && Math.abs(O.at + O.dur - tmM.duration) < 1e-6 && dbAt(O, tmM.duration) <= -90,
    `music: the outro comes in with the credits (${cs.toFixed(2)} s) and is silent at the end`);
}

// ---- the committed files are current (regenerated in memory) ----
if (MA) {
  const cf = X.chaptersFiles(sb, T);
  ok(read(X.CHAPTERS_VTT) === cf.vtt, "chapters.vtt is stale (node tools/lacing_voice.js chapters)");
  ok(read(X.YOUTUBE_TXT) === cf.youtube, "youtube.txt is stale (node tools/lacing_voice.js chapters)");
  ok(read(X.SIDEBAR) === JSON.stringify(X.sidebarOf(sb, T), null, 2) + "\n", "sidebar.json is stale (node tools/lacing_voice.js sidebar)");
} else console.log(`(no media-anim at ${X.MEDIA_ANIM}: the built manifest, the music and the staleness checks skipped; the committed files checked)`);

console.log(`${checks - fails}/${checks} checks passed (${cues.length} chapters, ${sl.length} lines, ${zt ? zt.seqs.length : "no"} seqs)`);
process.exit(fails ? 1 : 0);
