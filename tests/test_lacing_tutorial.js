// The cable-lacing tutorial's pure parts (web/js/lacing_tutorial.js) on the reference hose: the storyboard is the JSON
// the text gate checks (a teaching video timed by its measured voice-over), the spoken rule (= media-anim
// tools/anim/storyboard.mjs spoken()), the plan (stitches found, spaced as LR4Hose.LACING says, the close-ups' short
// lengths, the lock stitch a marline hitch - over its standing part, under the turn's start), frameAt as a pure function of t (same answer in any order;
// draw and stitches never fall; the camera with no jumps outside a dip; the pose back home), the transcript current,
// and (Video Lacing:)'s length.
//   node tests/test_lacing_tutorial.js                         (all of it: npm test)
//   node tests/test_lacing_tutorial.js --only knotgen,callouts (those sections; --list names them all)
// Each section prints its seconds; the shared setup (the storyboard, timing, the plan, g) runs every time.
// The knot determinant and the clearance grid are media-mesh's (knotdet, clearance), in the vendored knots bundle
// (web/js/lib/media-mesh/media-mesh-knots.min.js): the checks on them run on CI too.
// The clearance section measures its close-up frames in worker threads (R12: CLEARANCE_JOBS=N workers, default 8, at
// most the cores - 1; CLEARANCE_TASK=M frames a task, default 15; --serial or N = 0: in process, a scene a task); the rows come
// back in the serial run's order, so its output is the serial run's.
"use strict";
const fs = require("fs"), path = require("path"), WT = require("worker_threads");
const WK = !WT.isMainThread && WT.workerData && WT.workerData.clearance;   // (a clearance worker: this file, that section's tasks, silent)
if (WK) console.log = () => {};
const H = require("../web/js/hose_route.js"), T = require("../web/js/lacing_tutorial.js"), DS = require("../web/js/demo_script.js");

const ROOT = path.join(__dirname, "..");
const P0 = () => T.referencePlan(H, JSON.parse(fs.readFileSync(path.join(ROOT, "web", "data", "lr4_config.json"), "utf8")).hose);
let fails = 0, checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) { fails++; console.log("FAIL " + msg); } };
const near = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol;
const words = (s) => s.trim().split(/\s+/).filter(Boolean).length;

// ---- sections: --only a,b runs those (in this file's order), --list names them ----
const SECTIONS = {
  storyboard: "the spoken rule, the storyboard = its JSON, timing, sceneAt",
  plan: "the plan on the reference hose: stitches, the bracket, the close-ups",
  hitch: "the knot determinant, the lock stitch's marline hitch",
  run: "the run generated whole: its lockstitches, clearance, the core's other poses",
  frames: "frameAt pure; the story frame by frame at 30 fps",
  story: "draft 4's notes: the lock run, tight, the square knot, the last lockstitch, the finale",
  confirm: "the confirm scene's lacing frame by frame, the finale's framing",
  tape: "one tape at the boundaries (DEBUG handovers)",
  framing: "framing: focus points in frame, the cord's width",
  closing: "the closing sequence: clipped tape, determinants, half hitches, the trim",
  blade: "the blade (locked) and its swipes",
  knotgen: "knots as steps: lap notation, drawn on, pulled, crossings",
  shots: "the shots = their JSON; edits as data, addKey, layer tracks",
  callouts: "the callouts' timing, layout and motion",
  events: "the script view's events",
  draft11: "the opening's flash, the dips and dead time at the cuts, the credits",
  opening: "d12: the reveal on the spoken word, the core back and forth, the cables loose before it and laced after",
  clearance: "clearance between tapes, cables, hose and outline",
  stills: "the stills rules as numbers: dots on drawn tape, knot and tape size, cards off the knot, the action in frame and in sight, the cue",
  transcript: "the transcript is current",
};
if (process.argv.includes("--list")) { for (const [k, v] of Object.entries(SECTIONS)) console.log(`${k.padEnd(11)} ${v}`); process.exit(0); }
const onlyArg = process.argv.indexOf("--only"), only = WK ? new Set(["clearance"]) : onlyArg >= 0 ? new Set(String(process.argv[onlyArg + 1] || "").split(",").filter(Boolean)) : null;
for (const k of only || []) if (!SECTIONS[k]) { console.log(`no section "${k}" (--list)`); process.exit(2); }
const secTimes = [];
function section(name, fn) {
  if (only && !only.has(name)) return;
  const t = Date.now();
  fn();
  secTimes.push(`${name} ${((Date.now() - t) / 1000).toFixed(1)}`);
  console.log(`  [${name}] ${((Date.now() - t) / 1000).toFixed(1)} s`);
}

// ---- the shared setup: the storyboard and its timing, the plan on the reference hose, the camera's frame ----
const sb = JSON.parse(fs.readFileSync(path.join(ROOT, "docs", "specs", "lacing-tutorial.storyboard.json"), "utf8"));
const tm = T.timing();
const sc = (id) => tm.scenes.find((s) => s.id === id);
const h = JSON.parse(fs.readFileSync(path.join(ROOT, "web", "data", "lr4_config.json"), "utf8")).hose;
const P = T.referencePlan(H, h), St = P.stitches, n = St.length;
const g = { fov: 35, aspect: 16 / 9 }, fps = 30;
const done = sc("done");
let maxJump = null, cuts = null;                    // (the frames section's: the summary line)
// the knot determinant (media-mesh knotdet: the research's hitch_knot.py, ported in draft 9) and the clearance grid
// (clearance) are in the vendored knots bundle, the spline in core's; without the bundles the checks on them are
// skipped, each named once
const MESH = path.join(ROOT, "web", "js", "lib", "media-mesh");
const meshLib = (file, name) => (fs.existsSync(path.join(MESH, file)) ? require(path.join(MESH, file))[name] : null);
const KD = meshLib("media-mesh-knots.min.js", "knotdet"), CL = meshLib("media-mesh-knots.min.js", "clearance"), CV = meshLib("media-mesh-core.min.js", "curve"), skipped = new Set();
const skip = (what) => { if (!skipped.has(what)) { skipped.add(what); console.log(`  (no media-mesh bundles at ${MESH}: ${what} skipped)`); } };
// a path slid off its (straight) bundle, its two ends joined far away round over everything: its determinant in 4 views
// x 3 closings (media-mesh knotdet.slidOff; null without the sibling)
const slidOff = (pts) => (KD ? KD.slidOff(pts) : (skip("the slid-off knot determinants (hitch, closing)"), null));

section("storyboard", () => {
// ---- the spoken rule: the inches in parentheses are shown, not said (media-anim's cases + this video's lines) ----
for (const [a, b] of [['Never over 76 mm (3") apart', "Never over 76 mm apart"], ['Lock stitch every 68 mm (2.7").', "Lock stitch every 68 mm."],
  ["A 2.5 mm (~0.1 in) tape, 1 m (3 ft) long", "A 2.5 mm tape, 1 m long"], ["Wrap twice (two turns) then knot", "Wrap twice (two turns) then knot"],
  ['every 68 millimetres (2.7"), round', "every 68 millimetres, round"], ["Lace the cables to the hose", "Lace the cables to the hose"]])
  ok(T.spoken(a) === b, `spoken(${JSON.stringify(a)}) = ${JSON.stringify(T.spoken(a))}, want ${JSON.stringify(b)}`);

// ---- the storyboard = docs/specs/lacing-tutorial.storyboard.json: a teaching video, timed by its voice-over ----
ok(JSON.stringify(sb) === JSON.stringify(T.STORYBOARD), "STORYBOARD differs from the JSON (node tools/lacing_voice.js sync)");
ok(sb.kind === "video", "kind video");
// (d29) the lip sync's words: data.js WORDS = docs/specs/lacing-tutorial.words.json's lines (tools/lacing_words.js), a
// line's words for each voice line, in order, inside its wav (audioS), each snapped to a voiced run (t1 > t0)
{
  const WJ = JSON.parse(fs.readFileSync(path.join(ROOT, "docs", "specs", "lacing-tutorial.words.json"), "utf8")).lines;
  const WD = require("../web/js/lacing/data.js").WORDS;
  ok(JSON.stringify(WJ) === JSON.stringify(WD), "WORDS differs from lacing-tutorial.words.json (node tools/lacing_voice.js sync)");
  for (const l of sb.scenes.flatMap((s) => [s, ...(s.more || [])])) {
    const ws = WJ[l.id] || [];
    ok(ws.length >= Math.max(1, words(T.spoken(l.narration)) - 3), `${l.id}: ${ws.length} timed words for ${words(T.spoken(l.narration))} spoken (node tools/lacing_words.js)`);
    ok(ws.every((q, k) => q.t1 > q.t0 && q.t0 >= 0 && q.t1 <= l.audioS + 0.02 && (k === 0 || q.t0 >= ws[k - 1].t1 - 1e-9)), `${l.id}: its words in order, inside its ${l.audioS} s`);
  }
}
let t0 = 0;
for (const [i, s] of sb.scenes.entries()) {
  // a measured voice-over, or none yet (new words: TTS deferred till the maintainer approves the picture; 150 wpm)
  ok(s.audioS === undefined || (typeof s.audioS === "number" && s.audioS > 0), `scene ${s.id}: audioS ${s.audioS}`);
  const dur = (s.audioS === undefined ? words(T.spoken(s.narration)) / T.WPM * 60 : s.audioS) + s.holdS;
  // (2026-11-09: each start on a whole frame, the storyboard's sum snapped - media-anim timing's fps - so each end is
  // within 1/60 s of the sum and a scene's length within 1/30 s of voice + hold)
  const fr = (x) => Math.round(x * 30) / 30;
  ok(near(tm.scenes[i].start, fr(t0)) && near(tm.scenes[i].dur, fr(t0 + dur) - fr(t0)) && Math.abs(tm.scenes[i].start - t0) <= 1 / 60 + 1e-9,
    `scene ${s.id}: start ${tm.scenes[i].start} dur ${tm.scenes[i].dur}, want ${fr(t0)} ${fr(t0 + dur) - fr(t0)} (the sum ${t0} + ${dur} on whole frames)`);
  ok(dur >= 3 && dur <= 30, `scene ${s.id}: ${dur.toFixed(2)} s, outside 3 to 30`);
  ok(words(T.spoken(s.cue)) <= 6 && !s.cue.trim().endsWith("."), `scene ${s.id}: cue "${s.cue}"`);
  ok(words(T.spoken(s.narration)) <= 20, `scene ${s.id}: narration ${words(T.spoken(s.narration))} words`);
  for (const m of (s.cue + " " + s.narration).matchAll(/(\d+(?:\.\d+)?)\s*(?:mm|millimetres)\b(\s*\(([\d.]+)"\))?/g))
    ok(m[2] && near(+m[3], +(m[1] / 25.4).toFixed(m[3].includes(".") ? 1 : 0)), `scene ${s.id}: ${m[0]} wants its inches, metric first`);
  // a later line (draft 8: "more", the finale's tip): its own wav id, the same word and inch rules, spoken in the hold
  for (const m of s.more || []) {
    ok(typeof m.id === "string" && !sb.scenes.some((q) => q.id === m.id) && typeof m.audioS === "number" && m.audioS > 0, `${s.id}: later line ${m.id}`);
    ok(words(T.spoken(m.narration)) <= 20, `${m.id}: narration ${words(T.spoken(m.narration))} words`);
    for (const q of m.narration.matchAll(/(\d+(?:\.\d+)?)\s*(?:mm|millimetres)\b(\s*\(([\d.]+)"\))?/g)) ok(q[2], `${m.id}: ${q[0]} wants its inches`);
  }
  const ls = tm.scenes[i].lines;
  // (draft 11: 0.4 s - the dip across a cut starts 0.19 s before the scene ends, and the holds before a cut were trimmed;
  // the credits are music only, after the lines. In scene-local time against the storyboard's voice + hold: the frame
  // snap moves the scene's end by up to 1/30 s against its start)
  // d29 (a default the owner may reverse, practice PC-3a: 0.25 s between lines, ~0.4 s at a cut): 0.25 s where the next
  // scene follows with no cut (no dip); 0.4 s before a dip and before the credits
  const lineEnd = ls[ls.length - 1].at + ls[ls.length - 1].dur - tm.scenes[i].start + t0;
  const tail = i < tm.scenes.length - 1 && !require("../web/js/lacing/shots.js").isCut(tm, i, i + 1) ? 0.25 : 0.4;
  ok(lineEnd <= t0 + dur - tm.scenes[i].credits - tail + 1e-9, `scene ${s.id}: its lines end ${(lineEnd - t0).toFixed(2)} s in, past its ${(dur - tm.scenes[i].credits).toFixed(2)} s less ${tail}`);
  t0 += dur;
}
// the finale (draft 8): its tip fills the silence after its first line, and it stays 14-16 s (draft 11: before the
// credits, the storyboard's credits.holdS in its hold)
{ const d = tm.scenes[tm.scenes.length - 1]; ok(d.lines.length === 2 && d.body >= 14 && d.body <= 16 && near(d.credits, sb.credits.holdS) && near(d.body + d.credits, d.dur), `finale ${d.body.toFixed(2)} s + credits ${d.credits} s, ${d.lines.length} lines`); }
ok(sb.scenes[0].purpose === "preview-goal" && sb.scenes[sb.scenes.length - 1].purpose === "confirm", "goal first, confirm last");
ok(near(tm.duration, Math.round(t0 * 30) / 30), `duration ${tm.duration}, want ${t0} on a whole frame`);
ok(near(tm.still, tm.scenes.find((s) => s.purpose === "confirm").start + 0.6), `still ${tm.still}`);
ok(near(DS.LACING_SECS, tm.duration), `demo_script LACING_SECS ${DS.LACING_SECS} is not the video's ${tm.duration}`);
const ids = tm.scenes.map((s) => s.id).join();
ok(ids.indexOf("spacing") < ids.indexOf("close") && ids.indexOf("lock") < ids.indexOf("spacing"), `the pitfall follows the lock run, before close: ${ids}`);
// the lock run: at least 1.5 x draft 1's (5.2 s scene, 3.8 s of drawing); each close-up phase's work at least 2 s
// (draft 7: the run in two scenes, each with its line - lock to the U-turn, uturn round it and back)
const runDur = sc("lock").dur + sc("uturn").dur, work = (id) => sc(id).dur - T.SETTLE - T.TOKENS.slow, nSt = P0().stitches.length, kL = T.lockK(nSt);
ok(runDur >= 1.5 * 5.2 && work("lock") + work("uturn") >= 1.5 * 3.8, `lock run ${runDur.toFixed(2)} s`);
ok(work("lock") / kL >= 1.0 && work("uturn") / (nSt - 2 - kL) >= 1.0, "the lock run: at least 1 s a stitch (countable)");
for (const id of ["wrap", "tuck", "tight"]) ok(sc(id).dur - T.SETTLE - T.TOKENS.slow >= 2, `${id}: ${(sc(id).dur - T.SETTLE - T.TOKENS.slow).toFixed(2)} s of work`);
for (const s of tm.scenes) {
  ok(T.sceneAt(s.start, tm).scene.id === s.id, `sceneAt(${s.start}) is not ${s.id}`);
  ok(T.sceneAt(s.end - 1e-3, tm).scene.id === s.id, `sceneAt(${s.end} - 1 ms) is not ${s.id}`);
}
});

section("plan", () => {
// ---- the plan on the reference hose ----
const L = H.LACING;
ok(n >= 4, `${n} stitches`);
ok(St[0].turns === L.wraps[0] && St[n - 1].turns === L.wraps[2] && St.slice(1, -1).every((q) => q.turns === L.wraps[1]), "wraps per stitch");
for (let k = 1; k < n; k++) {
  const gap = St[k].s - St[k - 1].s;
  ok(gap > 0 && gap <= T.MAX_GAP + 1e-6, `stitches ${k - 1}-${k} are ${gap.toFixed(1)} mm apart (NASA-STD-8739.4 Table 9-1: <= ${T.MAX_GAP})`);
  ok(St[k].i0 > St[k - 1].i1 && St[k].f0 >= St[k - 1].f1, `stitch ${k} overlaps stitch ${k - 1} on the tape`);
}
for (const [k, q] of St.entries()) {
  const tape = (q.f1 - q.f0) * P.total;
  ok(tape >= q.turns * Math.PI * h.od && tape <= q.turns * 2 * Math.PI * q.r * 1.2, `stitch ${k}: ${tape.toFixed(0)} mm of tape for ${q.turns} turn(s)`);
}
ok(St[0].f0 === 0 && near(St[n - 1].f1, 1), "the tape starts at the first stitch and ends at the last");
// the bracket: between two neighbouring stitches, on the bundle (outside the hose, no further out than the stitches)
const B = P.bracket;
ok(near(B.gap, St[B.k + 1].s - St[B.k].s) && B.gap <= T.MAX_GAP, `bracket gap ${B.gap}`);
for (const p of B.pts) {
  const q = P.line.nearest(p);
  ok(q.d >= h.od / 2 && q.d <= Math.max(St[B.k].r, St[B.k + 1].r) + L.tape + 0.5, `the bracket floats: ${q.d.toFixed(1)} mm from the hose's centre (od ${h.od})`);
}
// the close-ups: 100 - 150 mm of hose, the cord on it, the tape round the stitch; the lock close-up's cables both on the
// hose (inside its lacing)
for (const [id, D] of Object.entries(P.details)) {
  const hl = D.hose.slice(1).reduce((a, p, i) => a + Math.hypot(...p.map((v, k) => v - D.hose[i][k])), 0);
  ok(hl >= 90 && hl <= 150, `${id} close-up: ${hl.toFixed(0)} mm of hose`);
  ok(D.cord.length > 2 && D.tape.length > 10, `${id} close-up: cord ${D.cord.length} points, tape ${D.tape.length}`);
}
for (const [what, pts, d] of [["cord", P.details.lock.cord, h.cord.d], ["sleeve", P.details.lock.sleeve, h.sleeve.d]]) {
  const q = Math.min(...pts.map((p) => P.line.nearest(p).d));
  ok(q <= h.od / 2 + d / 2 + 3, `the lock close-up's ${what} is ${q.toFixed(1)} mm from the hose's centre: off the hose`);
}
});

section("hitch", () => {
// (the determinant's own check - a trefoil 3, a figure-eight 5, a circle 1 - is media-mesh lib/knotdet.test.js)
// the lock stitch (draft 9: NASA-STD-8739.4A Fig. 9-5, the Navy's marline-hitch rule): slid off a straight bundle it is an
// overhand knot - a marline hitch (determinant 3), loose and pulled. Draft 3-8's hitch (under the standing part, then over
// the turn's start) slid off as the unknot (1): a half hitch
{
  const R0 = 6, Ds = { s: 0, u: [0, 0, 1], R0, rho: () => R0, line: { at: (sv) => [sv, 0, 0], tan: () => [1, 0, 0] } };
  for (const lam of [1, T.HITCH.loose]) {
    const d = slidOff(T.hitchPath(Ds, lam, 1).pts);
    if (d) ok(d.every((x) => x === 3), `hitch (loose ${lam}) slid off: determinants ${d.join(",")}, want 3 (a marline hitch)`);
  }
}
// the lock stitch's hitch: snug on the bundle when pulled, loose before; at the crossing the end passes over the
// standing part (draft 9; draft 3-8: under); no breaks in the path
{
  const D = P.details.lock, tr = T.HITCH.tr, r = (p) => Math.hypot(...p.map((v, k) => v - D.c[k]));
  for (const lam of [T.HITCH.loose, 1]) {
    const hp = T.hitchPath(D, lam, lam === 1 ? 1 : 0);
    let step = 0;
    for (let i = 1; i < hp.pts.length; i++) step = Math.max(step, Math.hypot(...hp.pts[i].map((v, k) => v - hp.pts[i - 1][k])));
    ok(step < 8, `hitch (loose ${lam}): a ${step.toFixed(1)} mm break in its path`);
    const sp = hp.pts[30 - Math.round(30 * T.HITCH.gap * 2 / (T.HITCH.lead + T.HITCH.gap))];   // the standing part near a = -gap
    ok(r(hp.cross) > r(sp) + 1.5 * tr, `hitch (loose ${lam}): the end at the crossing (${r(hp.cross).toFixed(1)}) is not over the standing part (${r(sp).toFixed(1)})`);
    const mid = hp.pts[30 + 60];                     // half way round
    if (lam === 1) ok(r(mid) <= D.rho(Math.PI) + 2 * tr + 0.5, `hitch pulled: ${r(mid).toFixed(1)} mm out half way round (bundle ${D.rho(Math.PI).toFixed(1)})`);
    else ok(r(mid) >= D.rho(Math.PI) * 1.3, `hitch loose: only ${r(mid).toFixed(1)} mm out half way round`);
  }
}
});

section("run", () => {
// ---- the run (d14b): generated whole on a media-mesh body (plan.js runOf: body.ofTubes + rope.lace), no longer spliced
// into the model's rings - every lockstitch a marline hitch, the tape clear of itself, the cables and the hose, at the
// build pose and carried to the core's other poses (knotLace: the opening's ghost, the finale), moving little a mm of travel
{
  const tr = T.HITCH.tr, CLEAR = require("../web/js/lacing/core.js").CLEAR, B = P.body, PULL = T.PULL;
  const d3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  // a stretch slid off its body: each point at (its arc + along, u, v) of the body's frame there - a straight core
  const straight = (pts, s) => pts.map((p, i) => { const f = B.frameAt(s[i]), d = p.map((v, k) => v - f.c[k]), dot = (a) => d[0] * a[0] + d[1] * a[1] + d[2] * a[2]; return [s[i] + dot(f.t), dot(f.u), dot(f.v)]; });
  // tape to tape (points further apart along it than 3 tr at least 2 tr + CLEAR, less 0.05: media-mesh rope.test's lace
  // rule), to the cord, sleeve (radius + tr) and hose (od / 2 + tr), sampled as the clearance section samples -> numbers
  const clearOf = (pts, cab, curve) => {
    if (!CL) return skip("the run's clearance"), null;
    const S = CL.sample(pts, Infinity, { n: 4, step: 0.5 });
    let tape = Infinity, cable = Infinity, hose = Infinity;
    CL.pairs(S, 2 * tr + CLEAR, (a, b, d) => { tape = Math.min(tape, d); }, { skip: (a, b) => Math.abs(a.s - b.s) <= 3 * tr });
    // (the cables as the page sweeps them, a curve through cordRoute's points - its 15 mm chords cut 0.7 mm inside it
    // where the sleeve rises - and as the run's body takes them: media-mesh curve.spline, 4 a span)
    const near = [[cab.cord, h.cord.d], [cab.sleeve, h.sleeve.d]].filter((c) => c[0]).map(([q, d]) => [CL.nearOf(CV.spline(q.map((p) => p.slice(0, 3)), 4)), d / 2 + tr]), nh = CL.nearOf(curve, 20);
    for (const x of S) { for (const [f, r] of near) cable = Math.min(cable, f(x.p, r + 2) - r); hose = Math.min(hose, nh(x.p, h.od / 2 + tr + 2) - h.od / 2 - tr); }
    return { tape, cable, hose };
  };
  // (at the core's other poses the run is the build pose's carried, and where the U-turn now bends under a knot laid on
  // the straight, or the sleeve rises off the hose on its inside - the bend's centre 52 mm from the hose's, the sleeve's
  // 48 - it is held to what it measures, as the model's tape is in the clearance section: POSE, over dx 0 - 280 every 2 mm)
  const POSE = { tape: 1.2, cable: -2.6 };
  const want = (c, what, lim = { tape: 2 * tr + CLEAR - 0.05, cable: 0 }) => {
    if (!c) return;
    ok(c.tape >= lim.tape || c.tape === Infinity, `run ${what}: the tape ${c.tape.toFixed(3)} mm from itself (want ${lim.tape.toFixed(2)})`);
    ok(c.cable >= lim.cable, `run ${what}: the tape ${(-c.cable).toFixed(3)} mm into a cable (at most ${-lim.cable})`);
    ok(c.hose >= 0, `run ${what}: the tape ${(-c.hose).toFixed(3)} mm into the hose`);
  };
  const snug = clearOf(P.pts, P.cab, P.curve);
  want(snug, "snug");
  ok(P.knots.length === n - 2 && P.knots.every((K, i) => K.k === i + 1), `a knot for every lockstitch: ${P.knots.map((K) => K.k)}`);
  let looseTape = Infinity;
  for (const K of P.knots) {
    const a = K.make(1), b = K.make(PULL.loose), q = St[K.k];
    ok(a.length === b.length && a.every((p, i) => p === P.pts[K.at + i] || d3(p, P.pts[K.at + i]) === 0), `knot ${K.k}: make(1) is the plan's tape, ${a.length} points, make(${PULL.loose}) ${b.length}`);
    ok(d3(b[0], a[0]) < 1e-9 && d3(b[b.length - 1], a[a.length - 1]) < 1e-9 && Math.max(...b.map((p, i) => d3(p, a[i]))) > 3, `knot ${K.k}: loose, its ends in place and its turn off the outline`);
    ok(q.i0 >= K.at && q.i1 <= K.at + a.length - 1, `knot ${K.k}: its stitch's ring ${q.i0}-${q.i1} in its piece ${K.at}-${K.at + a.length - 1}`);
    const s = P.s.slice(K.at, K.at + a.length);
    for (const [lam, pts] of [[1, a], [PULL.loose, b]]) {
      const dk = slidOff(straight(pts, s));
      if (dk) ok(dk.every((x) => x === 3), `knot ${K.k} (loose ${lam}) slid off: determinants ${dk.join(",")}, want 3 (a marline hitch)`);
    }
    // (each pulled alone, as frameAt's pulls draw it: off the cables and the hose; its loop 15 mm out may meet the run
    // across the U-turn or its own turn - measured, not held: see the spec's Open)
    const c = clearOf(T.tapeOf(P, [{ k: K.k, lam: PULL.loose }]).pts, P.cab, P.curve);
    if (c) { ok(c.cable >= 0 && c.hose >= 0, `knot ${K.k} loose: ${Math.min(c.cable, c.hose).toFixed(3)} mm into a cable or the hose`); looseTape = Math.min(looseTape, c.tape); }
  }
  // one generator: knotLace at the build pose is the plan's run; at the core's other poses (the opening's travel) as
  // clear, and a mm of travel moves its shape little (d14b: the ghost's knots changed shape as the core moved)
  const sweep = (dx) => {
    const dense = H.catmullRom(H.hoseRoute(h, dx, 0).map((p) => p.slice(0, 3)), 12), sh = (q) => [q[0] + dx, q[1], q[2]], c = h.cord, sl = h.sleeve;
    const cp = H.cordRoute(dense, h, c, sh(c.tip), sh(c.tip2), dx), sp = H.cordRoute(dense, h, sl, null, null, dx, [0, 0, 0]);
    const lace = H.lacing(dense, h, [{ to: "breakout", x: sl.exit.x, cables: [{ pts: cp, d: c.d }, { pts: sp, d: sl.d }] }], dx);
    const cables = [[{ pts: cp, r: c.d / 2 }, { pts: sp, r: sl.d / 2 }]];
    return { dense, lace, cables, cab: { cord: cp, sleeve: sp }, run: refs && T.knotLace(dense, lace, H.LACING, cables, h.od / 2, refs)[0] };
  };
  let refs = null;
  const W0 = sweep(0);
  refs = T.refsOf(W0.dense, W0.lace, H.LACING, W0.cables, h.od / 2);
  ok(refs[0].pts.length === P.pts.length && refs[0].pts.every((p, i) => d3(p, P.pts[i]) < 1e-9), "refsOf's run 0 is the plan's run");
  const at0 = T.knotLace(W0.dense, W0.lace, H.LACING, W0.cables, h.od / 2, refs)[0];
  ok(at0.length === P.pts.length && at0.every((p, i) => d3(p, P.pts[i]) < 1e-6), `knotLace at the build pose is the plan's run (${Math.max(...at0.map((p, i) => d3(p, P.pts[i]))).toExponential(1)} mm)`);
  // the spans pulled taut (d14b, the maintainer on the finale's frames: "real rope/tape pulled in tension wouldn't have
  // this extra slack wiggle"): on each span (rope.taut: one knot's end to the next's standing part), every 0.5 mm along
  // the page's curve through the points, the sideways bend - the curvature on n x t, n the body's outline normal: the
  // bend that is not the surface's own - its mean over 10 mm at most 0.02 /mm (a 50 mm radius: the laced run's S-bends
  // were 0.036 - 0.046, 22 - 28 mm) and its turn, between the directions 1 mm before and after, at most 6 degrees,
  // 12 mm from either end; in those 12 mm, where it leaves or meets its knot's line, at most 20 (the U-turn's knots meet
  // their spans 20 - 28 degrees off, turned over about two tape widths; laced, the turn into or out of a knot reached
  // 45 degrees a mm in one 0.5 mm sample). (The body's outline is bilinear between its stations and angle bins: laid on
  // it, the tape kinks 2 - 3 degrees where it crosses their lines - 11 degrees a mm over a 0.3 mm segment, 3 over a mm)
  const spanBend = (pts, spans, B) => {
    const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const nz = (a) => { const l = Math.hypot(...a); return a.map((v) => v / l); }, crs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const surf = (sv, th) => { const f = B.frameAt(sv); return f.c.map((v, k) => v + (Math.cos(th) * f.u[k] + Math.sin(th) * f.v[k]) * B.rhoAt(th, sv)); };
    let w10 = 0, turnMax = 0, turnEnd = 0;
    for (const [a, b] of spans) {
      // (the curve from 3 points before to 3 after, as the page's through all of them; measured from a to b)
      const a3 = Math.max(0, a - 3), Q = CV.spline(pts.slice(a3, b + 4), 4), cum = [0], R = [];
      for (let i = 1; i < Q.length; i++) cum.push(cum[i - 1] + Math.hypot(...sub3(Q[i], Q[i - 1])));
      const La = cum[4 * (a - a3)], Lz = cum[4 * (b - a3)];
      for (let L = La, i = 0; L <= Lz; L += 0.5) { while (i < cum.length - 2 && cum[i + 1] < L) i++; const f = (L - cum[i]) / ((cum[i + 1] - cum[i]) || 1); R.push(Q[i].map((v, k) => v + (Q[i + 1][k] - v) * f)); }
      let sv = null; const kg = [];
      for (let i = 4; i < R.length - 4; i++) {
        const p = R[i], t1 = nz(sub3(p, R[i - 4])), t2 = nz(sub3(R[i + 4], p)), t = nz(sub3(R[i + 4], R[i - 4]));
        sv = sv === null ? B.line.nearest(p).s : sv;
        for (let k = 0; k < 8; k++) sv += dot3(sub3(p, B.line.at(sv)), B.line.tan(sv));
        const fr = B.frameAt(sv), d = sub3(p, fr.c), th = Math.atan2(dot3(d, fr.v), dot3(d, fr.u));
        const n = nz(crs(sub3(surf(sv + 0.5, th), surf(sv - 0.5, th)), sub3(surf(sv, th + 0.02), surf(sv, th - 0.02))));
        const turn = Math.acos(Math.min(1, dot3(nz(sub3(R[i + 2], p)), nz(sub3(p, R[i - 2]))))) * 180 / Math.PI / 1, bl = 24, inner = i >= bl && i < R.length - bl;
        if (inner) { kg.push(dot3(sub3(t2, t1).map((v) => v / 2), crs(n, t))); turnMax = Math.max(turnMax, turn); } else turnEnd = Math.max(turnEnd, turn);
      }
      for (let i = 0; i + 20 <= kg.length; i++) { let m = 0; for (let j = i; j < i + 20; j++) m += kg[j]; w10 = Math.max(w10, Math.abs(m / 20)); }
    }
    return { w10, turnMax, turnEnd };
  };
  if (CV) {
    const bend = spanBend(P.pts, P.spans, P.body);
    ok(bend.w10 <= 0.02, `run: a span bends sideways ${bend.w10.toFixed(4)} /mm over 10 mm (radius ${(1 / bend.w10).toFixed(0)} mm; at most 0.02 /mm)`);
    ok(bend.turnMax <= 6, `run: a span turns ${bend.turnMax.toFixed(1)} degrees a mm (at most 6)`);
    ok(bend.turnEnd <= 20, `run: a span leaves or meets its knot turning ${bend.turnEnd.toFixed(1)} degrees a mm (at most 20)`);
    console.log(`  run: the spans bend sideways at most ${bend.w10.toFixed(4)} /mm over 10 mm (radius ${(1 / bend.w10).toFixed(0)} mm), turn at most ${bend.turnMax.toFixed(1)} degrees a mm, ${bend.turnEnd.toFixed(1)} where they meet the knots`);
  } else skip("the spans' bend");
  // the knots as flat and compact wherever they sit (d14b, the maintainer on 115 s: the U-turn's knots "read as a loopy
  // chain"): each lockstitch's tape within 12 mm of its top (its turn's start), its height off the outline and its
  // footprint along the hose; the U-turn's (turned off the cables, topOf) no taller than the straight run's and no longer
  // by more than 3 mm (measured 2.34 - 2.42 mm over a tape on the outline and 22 - 23 mm long; the straight run's 2.67 -
  // 2.85 and 22.5 - 23.4: they are not what reads as loops at 115 s - three of them line up along that camera's view)
  {
    const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const knotOf = (k) => {
      const q = St[k], top = P.pts[q.i0];
      let hmax = 0, a0 = Infinity, a1 = -Infinity, th0 = null;
      for (let i = Math.max(0, q.i0 - 400); i < Math.min(P.pts.length, q.i1 + 400); i++) {
        const p = P.pts[i];
        if (Math.hypot(...sub3(p, top)) > 12) continue;
        const f = P.body.frameAt(P.s[i]), d = sub3(p, f.c), u = dot3(d, f.u), v = dot3(d, f.v), th = Math.atan2(v, u);
        hmax = Math.max(hmax, Math.hypot(u, v) - P.body.rhoAt(th, P.s[i]) - T.HITCH.tr);
        if (th0 === null) th0 = th;
        const a = P.body.surf(q.s, P.s[i], th0);
        a0 = Math.min(a0, a); a1 = Math.max(a1, a);
      }
      return { h: hmax, along: a1 - a0, th: th0 };
    };
    const ks = P.knots.map((K) => K.k), K_ = ks.map((k) => Object.assign({ k }, knotOf(k)));
    const flat = K_.filter((q) => Math.abs(q.th) < 0.1), turned = K_.filter((q) => Math.abs(q.th) >= 0.1);
    const hRef = Math.max(...flat.map((q) => q.h)), aRef = Math.max(...flat.map((q) => q.along));
    ok(turned.length >= 1, `run: the U-turn's knots turned off the cables (${turned.map((q) => q.k)})`);
    for (const q of turned) {
      ok(q.h <= hRef + 1e-9, `run: knot ${q.k} on the U-turn stands ${q.h.toFixed(2)} mm off the outline (the straight run's ${hRef.toFixed(2)})`);
      ok(q.along <= aRef + 3, `run: knot ${q.k} on the U-turn is ${q.along.toFixed(1)} mm long (the straight run's ${aRef.toFixed(1)})`);
    }
    console.log(`  run: knots off the outline ${K_.map((q) => `${q.k} ${q.h.toFixed(2)}`).join(", ")} mm (a tape over its radius); along ${K_.map((q) => q.along.toFixed(1)).join(", ")} mm`);
  }
  let move = 0, t0 = Date.now(), calls = 0, worst = { tape: Infinity, cable: Infinity };
  for (const dx of [70, 140, 210, T.MOVE_DX]) {
    const W = sweep(dx), W1 = sweep(dx + 1);
    calls += 2;
    const c = clearOf(W.run, W.cab, W.dense);
    want(c, `at dx ${dx}`, POSE);
    if (c) { worst.tape = Math.min(worst.tape, c.tape); worst.cable = Math.min(worst.cable, c.cable); }
    if (CL) { const nr = CL.nearOf(W.run, 4); for (const p of W1.run) move = Math.max(move, nr(p, 50)); }
  }
  ok(move < 2, `run: 1 mm of the core's travel moves the run's shape ${move.toFixed(2)} mm`);
  if (snug) console.log(`  run: the tape at least ${snug.tape.toFixed(2)} mm from itself (${looseTape.toFixed(2)} with a knot loose; ${worst.tape.toFixed(2)} carried to the core's poses), ${snug.cable.toFixed(2)} off a cable (${worst.cable.toFixed(2)} carried), ${snug.hose.toFixed(2)} off the hose; 1 mm of travel moves it ${move.toFixed(2)} mm`);
}
});

section("frames", () => {
// ---- frameAt: pure, and the picture's story holds frame by frame (30 fps over the video and a bit) ----
const a = JSON.stringify(T.frameAt(30.1, P, g, tm));
T.frameAt(3, P, g, tm); T.frameAt(60, P, g, tm);
ok(JSON.stringify(T.frameAt(30.1, P, g, tm)) === a, "frameAt(30.1) changed after other calls");
let prev = null, at = 0;
maxJump = 0; cuts = 0;
for (let f = 0; f <= Math.round((tm.duration + 2) * fps); f++) {
  const t = f / fps, F = T.frameBase(t, P, g, tm);   // (frameAt less its callouts: the fields read here are the same)
  ok(F.cam.flat().every(Number.isFinite) && F.pose.every(Number.isFinite), `t=${t}: camera / pose not finite`);
  ok(F.f >= 0 && F.f <= 1 && F.tied >= 0 && F.tied <= n && F.dip >= 0 && F.dip <= 1, `t=${t}: f ${F.f} tied ${F.tied} dip ${F.dip}`);
  ok(F.scene === "done" || F.scene === "goal" || F.pose.every((v) => v === 0), `t=${t}: the machine moved in ${F.scene}`);
  if (prev && F.tt > prev.tt) {                     // within the video: draw and stitches never fall
    ok(F.f >= prev.f - 1e-12, `t=${t}: the tape drawn fell ${prev.f} -> ${F.f}`);
    ok(F.tied >= prev.tied, `t=${t}: stitches tied fell ${prev.tied} -> ${F.tied}`);
  }
  if (prev && F.tt > prev.tt) {                     // a step as a share of the view's distance (a cut would be ~1; the
                                                    // video's end back to its start is not a step: a video, not a loop)
    const d = Math.hypot(...prev.cam[0].map((v, i) => v - prev.cam[1][i]));
    const j = Math.max(Math.hypot(...F.cam[0].map((v, i) => v - prev.cam[0][i])), Math.hypot(...F.cam[1].map((v, i) => v - prev.cam[1][i]))) / d;
    if (j > 0.5) { cuts++; ok(Math.max(F.dip, prev.dip) >= 0.95, `t=${t}: the camera cuts (${(100 * j).toFixed(0)}%) with the dip at ${Math.max(F.dip, prev.dip).toFixed(2)}`); }
    else if (j > maxJump) { maxJump = j; at = t; }
  }
  prev = F;
}
ok(maxJump < 0.1, `the camera moves ${(100 * maxJump).toFixed(0)}% of its distance in one frame at t=${at.toFixed(2)}`);
ok(cuts === 5, `${cuts} cuts to and from the close-ups, want 5`);
const S = T.frameAt(tm.still, P, g, tm);
ok(S.scene === "done" && S.f === 1 && S.tied === n && S.real && S.progress === 1, `the still: ${JSON.stringify({ scene: S.scene, f: S.f, tied: S.tied, real: S.real })}`);
ok(T.frameAt(0, P, g, tm).f === 0 && T.frameAt(0, P, g, tm).tied === 0, "t=0: nothing drawn");
ok(Math.max(...[0.3, 0.5, 0.7].map((k) => T.poseAt(done.start + k * done.dur, tm)[0])) > 0.8 * T.MOVE_DX && T.poseAt(done.end - 1e-3, tm)[0] < 1e-6, "the core moves out and back in the confirm scene");
const sp0 = sc("spacing"), lockEnd = T.frameAt(sc("uturn").end - 0.7, P, g, tm).cam, spc = T.frameAt(sp0.end - 0.7, P, g, tm).cam;
const dirOf = (c) => { const d = c[0].map((v, i) => v - c[1][i]), l = Math.hypot(...d); return d.map((v) => v / l); };
ok(dirOf(lockEnd).every((v, i) => near(v, dirOf(spc)[i], 1e-9)), "the pitfall keeps the lock run's camera angle");
ok(T.frameAt(sp0.start + 0.2, P, g, tm).bracket.opacity === 0 && T.frameAt(sp0.end - 0.1, P, g, tm).bracket.scale === 1, "the bracket comes in after the camera arrives");
for (const id of ["wrap", "tuck", "tight", "close"]) ok(T.frameAt(sc(id).start + 1, P, g, tm).detail, `${id} is a close-up`);
const tl = sc("tight"), h0 = T.frameAt(tl.start + 0.65, P, g, tm).detail.hitch, h1 = T.frameAt(tl.end - 0.81, P, g, tm).detail.hitch;
ok(h0.lam > 1.4 && near(h1.lam, 1, 1e-3), `tight: the loop shrinks ${h0.lam.toFixed(2)} -> ${h1.lam.toFixed(2)}`);
});

section("story", () => {
// ---- draft 4: the maintainer's notes on draft 3 ----
// (1) the lock run 25% slower than draft 3's 10.64 s, its voice kept (the hold takes the rest); the tape not laced yet (the
// ghost ahead of it) is the only thing see-through (draft 5: the hose, cord and sleeve keep their look - no fade field)
// (draft 7: lock + uturn, each voiced)
ok(sc("lock").dur + sc("uturn").dur >= 1.25 * 10.64 - 0.01 && sc("lock").voiced && sc("uturn").voiced, `lock run ${(sc("lock").dur + sc("uturn").dur).toFixed(2)} s (draft 3: 10.64)`);
{
  const lk = sc("lock"), mid = T.frameAt(lk.start + lk.dur / 2, P, g, tm);
  ok(mid.ghost <= T.SHOTS.scenes.lock.layers.ghost.slice(-1)[0][1] + 1e-9 && mid.tape === 1, `lock: the ghost ahead ${mid.ghost}, the laced tape opaque (${mid.tape})`);
  for (const s_ of tm.scenes) {
    const F = T.frameAt(s_.start + s_.dur / 2, P, g, tm);
    ok(F.ahead === undefined && (!F.detail || F.detail.hoseO === undefined || F.detail.hoseO >= 0.45 - 1e-9), `${s_.id}: no hose / cable fade beyond the knots' 0.45`);
  }
  const camD = Math.hypot(...mid.cam[0].map((v, i) => v - mid.cam[1][i]));
  ok(camD <= 0.65 * 420, `lock: the camera ${camD.toFixed(0)} mm from the bundle (draft 3: 420)`);
  let last = -1, mono = true;                       // the cables' cut moves on with the tape's end
  for (let k = 0; k <= 20; k++) { const sv = St[0].s + (St[n - 2].s - St[0].s) * k / 20, c = T.cableCut(P, "cord", sv); if (c < last - 1e-9) mono = false; last = c; }
  ok(mono && T.cableCut(P, "cord", St[0].s) < T.cableCut(P, "cord", St[n - 2].s) && T.cableCut(P, "sleeve", St[n - 2].s) <= 1, "lock: where the cables pass the tape's end moves on with it");
}
// (3) "pull it tight": the loop snug on the bundle by TIGHT of its work, then held (draft 3 was still loose half way)
{
  const tl2 = sc("tight"), w2t = (w) => tl2.start + T.TOKENS.slow + w * (tl2.dur - T.settleOf(tl2) - T.TOKENS.slow);   // (draft 11: tight's settle 0.65)
  const inv = (k) => { let lo = 0, hi = 1; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (T.easeInOut(m) < k) lo = m; else hi = m; } return hi; };
  ok(T.frameAt(w2t(inv(T.TIGHT) + 0.01), P, g, tm).detail.hitch.lam <= 1 + 1e-6, "tight: snug by TIGHT of the work");
  ok(T.frameAt(tl2.start + tl2.dur * 0.6, P, g, tm).detail.hitch.lam < 1.05, "tight: snug by 60% of the scene");
}
// (2) the square knots (draft 5: the textbook reef, not freehand): two U-bights interlocked, each end out beside its own
// standing part and both ends on one side (a thief knot has them on opposite sides); six crossings, over and under in
// turn along each strand, the working end under L's bight first and then over L's standing part (right over left); tied
// in phases - the first half knot (L to its bight, then R to its own), the second (L's end round and back, then R's
// round, over and under it and out), pulled snug, trimmed - seen from one fixed angle straight at the cables' side
{
  const F = T.reefFlat(1, 0, 0, 1, 1), xs = (q) => q.map((p) => p[0]);
  ok(F.L[0][0] < 0 && F.L[F.L.length - 1][0] < 0 && F.R[0][0] > 0 && F.R[F.R.length - 1][0] > 0, "reef: each end leaves beside its own standing part");
  ok(F.L[0][1] < 0 && F.R[0][1] < 0 && F.L[F.L.length - 1][1] > 0 && F.R[F.R.length - 1][1] > 0, "reef: both standing parts on one side, both ends on the other (not a thief knot)");
  ok(Math.max(...xs(F.L)) > 1.9 && Math.min(...xs(F.R)) < -1.9 && near(F.L[F.mid][0], 2, 1e-9) && near(F.R[F.mid][0], -2, 1e-9), "reef: each bight's far point past the other's legs");
  const K = T.knotCps([[-20, 10, 0]], [[20, 10, 0]], T.KNOT.kSnug, 0, 0, [6, 6], 1);
  ok(K.crossings.length === 6 && K.crossings.every((x, i) => x.over === (i % 2 ? 1 : -1)), `reef: ${K.crossings.length} crossings, under / over along the working end`);
  const c2 = K.crossings[1];
  ok(c2.over === 1 && Math.abs(c2.at[0]) < 1e-6, "reef: the working end's second crossing is over L's standing part, on the knot's middle (right over left)");
  ok(T.KNOT.kSnug * 2 * T.REEF.P >= 2 * T.HITCH.tr, "reef: snug, a bight's two legs are a tape's width apart");
}
for (const [id, det] of [["square", "start"]]) {     // (draft 9: the tie is no longer a square knot)
  const D = P.details[det], at = (w) => T.knotAt(id, w, D), Q = T.SQ, d = (w, i) => at(w).strands[i].draw / at(w).strands[i].total;
  const grows = (i, a, b) => d(b, i) > d(a, i) + 0.02, still = (i, a, b) => Math.abs(d(b, i) - d(a, i)) < 0.01;
  // (draft 6: both drawn on from nothing - the right end's lead comes in beside the left end's first stretch)
  ok(grows(1, 0.001, Q.lay) && d(Q.lay, 2) < d(Q.h1, 2) - 0.1, `${id}: the left end laid first`);
  ok(grows(2, Q.lay + 0.001, Q.h1) && still(1, Q.lay + 0.001, Q.h1), `${id}: then the right end over and under it (the first half knot)`);
  ok(grows(1, Q.h1 + 0.001, Q.endL) && still(2, Q.h1 + 0.001, Q.endL) && d(Q.endL, 1) >= 1 - 1e-6, `${id}: the left end round and back`);
  ok(grows(2, Q.endL + 0.001, Q.h2) && d(Q.h2, 2) >= 1 - 1e-6, `${id}: the right end round, over and under it (the second half knot)`);
  ok(near(at(Q.h2).k, T.KNOT.kLoose) && near(at(Q.pull).k, T.KNOT.kSnug) && T.KNOT.kSnug < 0.7 * T.KNOT.kLoose, `${id}: pulled from ${T.KNOT.kLoose} to ${T.KNOT.kSnug} mm a unit`);
  const tails = (k) => k.strands.slice(1).map((q) => q.total);
  ok(tails(at(1)).some((l, i) => l < tails(at(Q.pull))[i] - 5), `${id}: an end trimmed (${tails(at(Q.pull)).map((v) => v.toFixed(0))} -> ${tails(at(1)).map((v) => v.toFixed(0))} mm)`);
  const kn = at(Q.pull).strands.slice(1).flatMap((q) => q.pts), m = kn.reduce((s, p) => s.map((v, i) => v + p[i] / kn.length), [0, 0, 0]);
  const side = T.SHOTS.scenes[id].camera.keys[0].focus.a, c = D.line.at(D.s + side), off = m.map((v, i) => v - c[i]), ol = Math.hypot(...off);
  ok(off.reduce((s, v, i) => s + v * D.u[i], 0) / ol > 0.9, `${id}: the knot on the cables' side`);
  const s_ = sc(id), cam = (w) => T.frameAt(s_.start + T.TOKENS.slow + w * (s_.dur - T.SETTLE - T.TOKENS.slow), P, g, tm).cam;
  ok([0.3, 0.5, 0.8, 0.95].every((w) => cam(w).flat().every((v, i) => near(v, cam(0.15).flat()[i], 1e-6))), `${id}: one fixed camera`);
  const tip = (w) => T.frameAt(s_.start + T.TOKENS.slow + w * (s_.dur - T.SETTLE - T.TOKENS.slow), P, g, tm).tip;
  ok(tip(0.44) === 1 && tip(0.8) === 1, `${id}: the tape's end marked while an end is worked and pulled snug (d14n), till the trim`);
}
{                                                    // the last lockstitch: loose in the close, then pulled snug
  // (the loose wrap: stitch 8's, before it, is snug; out from the hose's centre line within 12 mm of the last stitch)
  const KC = T.SHOTS.knots.closing, KS = T.stepsOf(KC), form = KS.find((q) => q.op === "wrap" && q.loose).until, pull = KS.filter((q) => q.op === "pull")[1];
  const D = P.details.close, a = T.knotAt("close", form, D).strands[0], b = T.knotAt("close", pull.to, D).strands[0];
  const rmax = (q) => Math.max(...q.pts.map((p) => { const fa = T.flatOf(D, p).a; return Math.abs(fa) < 12 ? Math.hypot(...p.map((v, i) => v - D.line.at(D.s + fa)[i])) : 0; }));
  ok(rmax(a) > rmax(b) + 5, `close: the turn loose (${rmax(a).toFixed(1)} mm out) then snug (${rmax(b).toFixed(1)})`);
}
// (4) the finale: 14 - 16 s, round the bundle (one view low and close) and back to the whole machine
{
  const fin = sc("done"), gm = Object.assign({ machine: { c: [600, 500, 300], r: 1500 } }, g);
  ok(fin.body >= 14 && fin.body <= 16, `the finale lasts ${fin.body.toFixed(2)} s (before the credits)`);
  let low = false, prevC = null, worst = 0;
  const nf = Math.round(fin.body * fps);            // frame by frame (draft 11: the finale's keys span its body, not the credits)
  for (let k = 0; k <= nf; k++) {
    const c = T.finaleAt(k / nf, P, gm, 0), d = c[0].map((v, i) => v - c[1][i]), dl = Math.hypot(...d);
    // (draft 6: pulled out to keep the U-turn in frame - low and close is now within 450 mm)
    if (Math.asin(d[2] / dl) < 16 * Math.PI / 180 && dl < 450) low = true;
    if (prevC) worst = Math.max(worst, Math.hypot(...c[0].map((v, i) => v - prevC[0][i])) / dl);
    prevC = c;
  }
  const endC = T.finaleAt(1, P, gm, 0);
  ok(low, "the finale passes low and close along the bundle");
  ok(worst < 0.06, `the finale's camera moves ${(100 * worst).toFixed(1)}% of its distance in a frame`);
  ok(near(Math.hypot(...endC[1].map((v, i) => v - gm.machine.c[i])), 0, 1e-6), "the finale ends on the whole machine");
  ok(JSON.stringify(T.frameAt(fin.end - 0.05, P, g, tm).cam) === JSON.stringify(T.frameAt(fin.end - 0.05, P, g, tm).cam), "the finale: same t, same camera");
}
});

section("confirm", () => {
// ---- the confirm scene's lacing, frame by frame (draft 2 jittered here): the model's lacing at each frame's pose (as
// updateHose sweeps it) is the same at two frames with the same pose, and between frames moves no more than the hose
// under it can (1.5 x the core's step at the U-turn's outside) ----
{
  const laceAt = (dx, withCurve) => {
    const curve = H.catmullRom(H.hoseRoute(h, dx, 0).map((p) => p.slice(0, 3)), 12), c = h.cord, sl = h.sleeve, shf = (p) => [p[0] + dx, p[1], p[2]];
    const cp = H.cordRoute(curve, h, c, shf(c.tip), shf(c.tip2), dx), sp = H.cordRoute(curve, h, sl, null, null, dx, [0, 0, 0]);
    const L = H.lacing(curve, h, [{ to: "breakout", x: sl.exit.x, cables: [{ pts: cp, d: c.d }, { pts: sp, d: sl.d }] }, { to: "exit", cables: [{ pts: cp, d: c.d }] }], dx);
    return withCurve ? Object.assign(L, { curve }) : L;
  };
  const laceMemo = new Map(), laceM = (dx) => { if (!laceMemo.has(dx)) laceMemo.set(dx, laceAt(dx, true)); return laceMemo.get(dx); };   // (a pose's lacing once: the sweeps share poses)
  // the finale's framing (draft 6): at every 0.25 s the hose's U-turn apex (at that pose) and the laced stitch either side of
  // it project inside the frame, 15 % in from its edges, in front of the camera
  {
    const proj = (cam, p) => {
      const F_ = cam[1].map((v, i) => v - cam[0][i]), fl = Math.hypot(...F_), fw = F_.map((v) => v / fl);
      const r0 = [fw[1], -fw[0], 0], rl = Math.hypot(...r0), r = r0.map((v) => v / rl), u = [r[1] * fw[2] - r[2] * fw[1], r[2] * fw[0] - r[0] * fw[2], r[0] * fw[1] - r[1] * fw[0]];
      const v = p.map((q, i) => q - cam[0][i]), z = v[0] * fw[0] + v[1] * fw[1] + v[2] * fw[2], th = Math.tan(17.5 * Math.PI / 180);
      return { z, x: (v[0] * r[0] + v[1] * r[1] + v[2] * r[2]) / z / (th * 16 / 9), y: (v[0] * u[0] + v[1] * u[1] + v[2] * u[2]) / z / th };
    };
    let worstF = 0, atF = 0, nF = 0;
    for (let t = done.start; t < done.end; t += 0.25) {
      const dx = T.poseAt(t, tm)[0], L = laceM(dx), cv = L.curve, arc = [0];
      for (let i = 1; i < cv.length; i++) arc.push(arc[i - 1] + Math.hypot(...cv[i].map((v, k) => v - cv[i - 1][k])));
      let ia = 0;
      for (let i = 1; i < cv.length; i++) if (cv[i][0] > cv[ia][0]) ia = i;
      const ptAt = (sv) => { let i = 0; while (i < arc.length - 2 && arc[i + 1] < sv) i++; return cv[i]; };
      const ss = L.runs[0].s, below = ss.filter((v) => v <= arc[ia]), above = ss.filter((v) => v > arc[ia]);
      const pts = [cv[ia], ...(below.length ? [ptAt(below[below.length - 1])] : []), ...(above.length ? [ptAt(above[0])] : [])];
      const cam = T.frameAt(t, P, g, tm).cam;
      for (const p of pts) {
        const q = proj(cam, p), m = q.z > 0 ? Math.max(Math.abs(q.x), Math.abs(q.y)) : Infinity;
        if (m > worstF) { worstF = m; atF = t; }
      }
      nF++;
    }
    console.log(`  finale framing: the U-turn + nearest stitches at most ${(100 * worstF).toFixed(0)} % of the half-frame (t=${atF.toFixed(2)}, ${nF} samples)`);
    ok(worstF <= 0.85, `the finale: the U-turn and its nearest stitches reach ${(100 * worstF).toFixed(0)} % of the half-frame at t=${atF.toFixed(2)} (${nF} samples; at most 85 %)`);
  }
  const segD = (p, a, b) => {
    const ab = [0, 1, 2].map((k) => b[k] - a[k]), l2 = ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2 || 1;
    const f = Math.max(0, Math.min(1, ((p[0] - a[0]) * ab[0] + (p[1] - a[1]) * ab[1] + (p[2] - a[2]) * ab[2]) / l2));
    return Math.hypot(...[0, 1, 2].map((k) => p[k] - a[k] - ab[k] * f));
  };
  const segD3 = (p, a, b) => {                       // (= segD, the same arithmetic in the same order, no arrays)
    const ab0 = b[0] - a[0], ab1 = b[1] - a[1], ab2 = b[2] - a[2], l2 = ab0 ** 2 + ab1 ** 2 + ab2 ** 2 || 1;
    const f = Math.max(0, Math.min(1, ((p[0] - a[0]) * ab0 + (p[1] - a[1]) * ab1 + (p[2] - a[2]) * ab2) / l2));
    return Math.hypot(p[0] - a[0] - ab0 * f, p[1] - a[1] - ab1 * f, p[2] - a[2] - ab2 * f);
  };
  // (exact: the search for a point's nearest segment starts at the point before's and stops once within the running max -
  // that point can no longer raise it; a point that does raise it is searched in full)
  const hd = (A, B) => {
    let m = 0, j0 = 1;
    const nS = B.length - 1;
    for (const p of A) {
      let d = Infinity, jb = j0;
      for (let k = 0; k < 2 * nS; k++) {
        const j = j0 + (k & 1 ? -((k + 1) >> 1) : k >> 1);
        if (j < 1 || j > nS) continue;
        const e = segD3(p, B[j - 1], B[j]);
        if (e < d) { d = e; jb = j; }
        if (d <= m) break;
      }
      j0 = jb; m = Math.max(m, d);
    }
    return m;
  };
  const t1 = done.end - 0.4, t2 = t1 + 1 / 30;     // the end hold: the core is home
  ok(T.poseAt(t1, tm)[0] === T.poseAt(t2, tm)[0] && JSON.stringify(laceAt(T.poseAt(t1, tm)[0])) === JSON.stringify(laceAt(T.poseAt(t2, tm)[0])),
    "the confirm scene's hold: consecutive frames, the same lacing");
  let worst = 0, at = 0, prevL = null, prevX = 0;
  for (let t = done.start + 0.5; t < done.end; t += 3 / 30) {   // out to the far end and back, every 3rd frame
    const x = T.poseAt(t, tm)[0], L = laceM(x);
    if (prevL) {
      const step = Math.abs(x - prevX), m = Math.max(...L.runs.map((r, i) => hd(r.pts, prevL.runs[i].pts)));
      if (m - 1.6 * step > worst) { worst = m - 1.6 * step; at = t; }
    }
    prevL = L; prevX = x;
  }
  ok(worst <= 0.05, `the confirm scene: the lacing moves ${worst.toFixed(2)} mm more than 1.6 x the core's step at t=${at.toFixed(2)}`);
}
});

section("tape", () => {
// ---- one tape, at the boundaries (draft 7; the user: test where jumps can happen, not every frame): every scene's start
// and its work's start and end, and inside the knot scenes each phase and step boundary (the square knot's lay / h1 /
// endL / h2 / pull and its cuts, the knot steps' untils and pulls, the lock stitch's TIGHT); at each, t - 1 frame, t,
// t + 1 frame. With DEBUG on, frameAt's own handover checks run too (a strand's start = the end it grows from, 0.5 mm).
// Checked: a strand that starts growing starts on an end of the tape already laid (another strand's start or drawn end,
// the closing turns' live end; the clove alone starts the tape, a free end) within HANDOVER; a strand on both frames moves
// at most MOVE mm a point and grows at most GROW mm; across a cut into a knot the strands go on as they were; the white
// tip never jumps over GROW mm while it shows; a layer's opacity moves at most 0.15 a frame ----
{
  const tB = Date.now(), MOVE = 3, GROW = 20, KNOTS = ["clove", "square", "seal", "tie"];
  T.setDebug(true);
  const d3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const endOf = (q) => T.alongAt({ pts: q.pts, cum: q.cum || q.pts.map((_, j) => 0) }, q.draw);
  const cumOf = (q) => { const c = [0]; for (let j = 1; j < q.pts.length; j++) c.push(c[j - 1] + d3(q.pts[j], q.pts[j - 1])); return c; };
  const at = (q, L) => T.alongAt({ pts: q.pts, cum: q.cum || cumOf(q) }, L);
  const ws = (id) => {                               // the work boundaries of a scene, w in 0 - 1
    const out = [0, 1], K = T.SHOTS.knots;
    if (id === "square" || id === "tie") out.push(T.SQ.lay, T.SQ.h1, T.SQ.endL, T.SQ.h2, T.SQ.pull, ...(T.SHOTS.blade.cuts[id] || []).map((c) => c.w));
    const kn = id === "clove" ? K.clove : K.closing.scenes.includes(id) ? K.closing : null, i0 = kn && kn.scenes ? kn.scenes.indexOf(id) : 0;
    if (kn) for (const st of T.stepsOf(kn)) for (const u of [st.until, st.from, st.op === "pull" ? st.to : undefined]) if (u !== undefined && u >= i0 && u <= i0 + 1) out.push(u - i0);
    if (kn && kn.draw) out.push(...kn.draw);
    if (id === "tight") out.push(T.TIGHT);
    return out;
  };
  const tsB = [];
  for (const s_ of tm.scenes) { tsB.push(s_.start); for (const w of ws(s_.id)) tsB.push(s_.start + T.localOfWork(s_, w)); }
  let bad = { start: [0, ""], move: [0, ""], grow: [0, ""], tip: [0, ""], layer: [0, ""], into: [0, ""] }, pairs = 0;
  const worse = (k, v, where) => { if (v > bad[k][0]) bad[k] = [v, where]; };
  for (const tb of tsB) {
    const fr = [-1, 0, 1].map((k) => tb + k / fps).filter((t) => t >= 0 && t < tm.duration).map((t) => [t, T.frameAt(t, P, g, tm)]);
    for (let k = 1; k < fr.length; k++) {
      const [ta, A] = fr[k - 1], [tb_, B] = fr[k], where = `${B.scene} ${tb_.toFixed(3)}`;
      pairs++;
      // (d14n: the tip slides across a change of end - frameAt's tipSlide; its first frame is where it was, the rest
      // move on as they ease)
      if (A.tip > 0.5 && B.tip > 0.5 && A.tipAt && B.tipAt && !(B.tipSlide && B.tipSlide.s > 0)) worse("tip", d3(A.tipAt, B.tipAt), where);
      if (A.scene === B.scene) for (const q of ["hose", "context", "base", "cord", "sleeve", "ghost", "tape"]) worse("layer", Math.abs(A.layers[q] - B.layers[q]), `${where} ${q}`);
      const SA = (A.detail && A.detail.strands) || [], SB = (B.detail && B.detail.strands) || [], same = A.scene === B.scene;
      const into = !same && A.detail && B.detail && A.detail.id === B.detail.id && KNOTS.concat(["close"]).includes(A.scene);
      SB.forEach((q, i) => {
        const p = SA[i];
        const cutNow = (B.detail.cuts || []).some((c) => c.e === i && c.done) && !((A.detail && A.detail.cuts) || []).some((c) => c.e === i && c.done);
        if (same && p && p.draw > 0.05 && q.draw > 0.05 && !cutNow) {   // on both frames: no jump (a cut: the offcut takes the piece)
          if (p.pts.length === q.pts.length) worse("move", Math.max(...q.pts.map((v, j) => d3(v, p.pts[j]))), `${where} strand ${i}`);
          else worse("move", Infinity, `${where} strand ${i}: ${p.pts.length} -> ${q.pts.length} points`);
          worse("grow", q.draw - p.draw, `${where} strand ${i}`);
        }
        if (into && i > 0 && p && Math.abs(q.draw - p.draw) > 0.05) worse("into", Math.abs(q.draw - p.draw), `${A.scene} -> ${where} strand ${i}`);
        // it starts growing: from a laid end (not: the clove, the tape's free end; what is already laid when a close-up opens
        // - the spare tail under the closing turns - comes in with the view, in the dip)
        const opens = !A.detail || A.detail.id !== B.detail.id;
        if (q.draw > 0.05 && (!p || p.draw <= 0.05) && !(B.scene === "clove" && i === 0) && !opens) {
          const ends = [];
          SB.forEach((r, j) => { if (j !== i && r.draw > 0.05) ends.push(r.pts[0], at(r, r.draw)); });
          if (B.detail.id === "close") { const tp = T.tapeTo(P.details.close, T.SHOTS.knots.closing); ends.push(tp[tp.length - 1]); }
          worse("start", ends.length ? Math.min(...ends.map((e) => d3(e, q.pts[0]))) : Infinity, `${where} strand ${i}`);
        }
      });
    }
  }
  T.setDebug(false);
  const ms = Date.now() - tB;
  ok(bad.start[0] <= T.HANDOVER, `one tape: a strand starts ${bad.start[0].toFixed(2)} mm from the laid end it grows from (${bad.start[1]}; at most ${T.HANDOVER})`);
  ok(bad.move[0] <= MOVE, `one tape: a strand's points move ${bad.move[0].toFixed(2)} mm in a frame (${bad.move[1]}; at most ${MOVE})`);
  ok(bad.grow[0] <= GROW, `one tape: drawn on ${bad.grow[0].toFixed(1)} mm in a frame (${bad.grow[1]}; at most ${GROW})`);
  ok(bad.into[0] <= 0.05, `one tape: across a cut into a knot a strand's drawn length changes ${bad.into[0].toFixed(2)} mm (${bad.into[1]})`);
  ok(bad.tip[0] <= GROW, `one tape: the tip jumps ${bad.tip[0].toFixed(1)} mm in a frame while it shows (${bad.tip[1]})`);
  // (a fade from 1 to 0.3 over slow, eased out: about 0.12 in its first frame)
  ok(bad.layer[0] <= 0.15, `one tape: a layer's opacity jumps ${bad.layer[0].toFixed(2)} in a frame (${bad.layer[1]})`);
  // the handover check itself: it throws with DEBUG on and a gap, and is silent without DEBUG
  T.setDebug(true);
  let threw = false;
  try { T.handover("a test strand", [0, 0, 0], [0, 0, 1]); } catch (e) { threw = /1\.00 mm/.test(e.message); }
  T.setDebug(false);
  let quiet = true;
  try { T.handover("a test strand", [0, 0, 0], [0, 0, 1]); } catch (e) { quiet = false; }
  ok(threw && quiet, "handover: throws on a 1 mm gap with DEBUG, silent without");
  console.log(`  one tape at ${tsB.length} boundaries (${pairs} frame pairs, ${ms} ms): start ${bad.start[0].toFixed(3)} mm, move ${bad.move[0].toFixed(2)} mm (${bad.move[1]}), grow ${bad.grow[0].toFixed(1)} mm, tip ${bad.tip[0].toFixed(1)} mm (${bad.tip[1]}), layer ${bad.layer[0].toFixed(3)}`);
}
});

section("framing", () => {
// ---- framing (draft 7: geometry, not screenshot rounds): at each scene's key times - the camera arrived (start + slow),
// the middle, the work done (end - SETTLE), and every 0.5 s in the finale (the U-turn across the core's whole travel) - the
// live end, the action point and the U-turn land at least 5 % of the half-frame inside every edge, and the cord is at least
// 4 px wide at 720p ----
{
  const tF = Date.now(), gF = Object.assign({ cordD: h.cord.d, px: 720, machine: { c: [600, 500, 300], r: 1500 } }, g);
  const times = [];
  for (const s_ of tm.scenes) {
    times.push(s_.start + T.TOKENS.slow + 0.05, s_.start + s_.dur / 2, s_.end - T.SETTLE);
    if (s_.purpose === "confirm") for (let t = s_.start + 0.5; t < s_.end - 1.6; t += 0.5) times.push(t);
  }
  let low = { m: Infinity, at: "" }, thin = { px: Infinity, at: "" };
  const rows = [];
  for (const t of times) {
    const f = T.framing(t, P, gF, tm);
    for (const q of f.pts) if (q.margin < low.m) low = { m: q.margin, at: `${f.scene} ${t.toFixed(2)} ${q.name}` };
    // (the finale's last stretch pulls back to the whole machine - its last key - where the cord is a line, not a part to read)
    const dn = sc("done"), K = T.SHOTS.scenes.done.camera.keys, xK = K[K.length - 2].x;
    let q0 = 0, q1 = 1;
    for (let i = 0; i < 40; i++) { const m = (q0 + q1) / 2; if (T.EASE.smooth(m) < xK) q0 = m; else q1 = m; }
    const pull = f.scene === dn.id && t > dn.start + q0 * dn.body;   // (draft 11: the finale's keys span its body)
    if (!pull && f.cordPx < thin.px) thin = { px: f.cordPx, at: `${f.scene} ${t.toFixed(2)}` };
    rows.push(f);
  }
  const ms = Date.now() - tF;
  ok(low.m >= 0.05, `framing: a focus point ${(100 * low.m).toFixed(0)} % of the half-frame inside the edge (${low.at}; at least 5 %)`);
  ok(thin.px >= 4, `framing: the cord ${thin.px.toFixed(1)} px wide at 720p (${thin.at}; at least 4)`);
  console.log(`  framing: ${times.length} times in ${ms} ms; nearest an edge ${(100 * low.m).toFixed(0)} % (${low.at}); thinnest cord ${thin.px.toFixed(1)} px (${thin.at})`);
}
});

section("closing", () => {
// the closing sequence grows from the close-up's own tape, clipped where the strand begins (draft 9: between stitch 8's
// turn and the last stitch, so H - the tape along the bundle - is the strand's own, for the half hitches to go round;
// 2026-11-10: before stitch 8, so stitch 8 is tied as a lockstitch too, not the model's plain turn, drawn whole from the
// close's first frame)
{
  const D = P.details.close, KC = T.SHOTS.knots.closing, KS = T.stepsOf(KC), tp = T.tapeTo(D, KC), e = tp[tp.length - 1], s_ = sc("close");
  const F = T.frameAt(s_.start + T.TOKENS.slow + 1, P, g, tm), m = F.detail.strands[0], fa = T.flatOf(D, e).a;
  ok(m.draw > 0.05 && Math.hypot(...m.pts[0].map((v, i) => v - e[i])) < 1e-6, "close: the closing sequence starts at the close-up's tape's end");
  ok(near(fa, KS[0].a, 0.3) && fa > (P.stitches[n - 3].s - D.s) + 2 && fa < (P.stitches[n - 2].s - D.s) - 6 && tp.length < D.tape.length,
    `close: the tape clipped at a = ${fa.toFixed(2)} mm (want ${KS[0].a}, between stitches ${n - 3} and ${n - 2})`);
  const K0 = T.fromEnd(KC, D), G0 = T.knotGen(K0, D, 0), i8 = KS.map((q) => /^lockstitch 8:/.test(q.what || "")).lastIndexOf(true);
  const L8 = G0.strands[0].cum[Math.round(G0.flat[0].ends[i8] * 6)];
  ok(i8 > 0 && G0.strands[0].draw >= L8 - 0.5, `close: stitch 8 drawn whole from the close's first frame (${G0.strands[0].draw.toFixed(1)} of its ${L8.toFixed(1)} mm)`);
  // (its steps are context: the page draws them faded with the close-up's tape layer, as the model's tape it replaced)
  const cx = (t) => T.frameAt(t, P, g, tm).detail.strands[0].ctx;
  // (a tube of its own only while faded - the seal, the tie: in the close, opaque, one tube, no notch at the cut)
  const k0 = T.knotAt("close", 0, D).strands[0].ctx;
  ok(KS.filter((q) => q.context).length === 5 && near(k0, L8, 0.6) && cx(s_.start + 0.3) === undefined && cx(sc("seal").start + 1) > 0 && cx(sc("tie").end - 0.1) > 0,
    `close, seal, tie: strand 0's context (lockstitch 8, before its pull) ${k0.toFixed(1)} mm, its steps ${L8.toFixed(1)}; split off in the seal and tie only`);
  ok(F.detail.strands.length === 1 && T.frameAt(sc("tie").end - 0.1, P, g, tm).detail.strands.length === 1, "close, seal, tie: one strand (no second end)");
}
// the closing sequence (draft 9, NASA-STD-8739.4A Fig. 9-3): stitch 8 and the last lockstitch are the lock stitch's knot -
// over the standing part, under the turn's start; slid off a straight bundle each is an overhand knot (determinant 3); then two half
// hitches round H, each over H, round under it and up over its own leg (out through its loop), the second (nearer the
// stitch) first; one tie-off end, trimmed. A half hitch round the tape's own standing part is an overhand knot in the
// tape, so the whole strand slides off as four: 3 x 3 x 3 x 3 = 81 (draft 9-12 tucked under the leg: beneath the loop,
// no knot - .cache/lacing-tutorial/halfhitch/REPORT.md)
{
  const KC = T.SHOTS.knots.closing, KS = T.stepsOf(KC), D = P.details.close, K = T.fromEnd(KC, D), R0 = 48;
  const Ds = { s: 0, u: [0, 0, 1], R0, rho: () => R0, line: { at: (sv) => [sv, 0, 0], tan: () => [1, 0, 0] } };
  const iU = KS.map((q, i) => (q.under ? i : -1)).filter((i) => i >= 0);   // (stitch 8's tuck, the last lockstitch's)
  const upTo = (i, w) => Object.assign({}, KC, { from: undefined, steps: KS.slice(0, i + 1).concat([{ op: "to", pts: [[KS[i].pts.at(-1)[0] + 4, w], [60, w]] }]) });
  // (the whole strand once drawn: a step's under is laid as the strand is drawn past it)
  for (const [what, KK, us, want] of [["stitch 8", upTo(iU[0], "C+1"), [0.7, 3], 3], ["stitch 8 and its last lockstitch", upTo(iU[1], "2C+1"), [0.7, 3], 9],
    ["the whole strand", Object.assign({}, KC, { from: undefined }), [1.92, 3], 81]]) for (const u of us) {
    let pts = T.knotGen(KK, Ds, u).strands[0].pts;
    const a0 = pts[0], e = pts[pts.length - 1], r = Math.hypot(e[1], e[2]);
    pts = [[a0[0] - 80, a0[1], a0[2]], ...pts, [e[0], e[1] * 200 / r, e[2] * 200 / r]];   // (its start led back along, its end out)
    const d = slidOff(pts);
    if (d) ok(d.every((x) => x === want), `closing, ${what} (u ${u}) slid off: determinants ${d.join(",")}, want ${want}`);
  }
  // (pulled tight on the close-up's own bundle - knots.closing.tighten - the knot is the same: the strand straightened
  // by its flat a, w, r onto a straight core, then slid off; and tightened, it is shorter)
  if (KC.tighten) for (const u of [1, 3]) {
    const s = T.knotGen(K, D, u).strands[0], s0 = T.knotGen(Object.assign({}, K, { tighten: undefined }), D, u).strands[0], C = 2 * Math.PI * D.R0;
    let prevW = null;
    const q = s.pts.slice(0, Math.floor(s.at) + 1).map((p) => { const f = T.flatOf(D, p); let w = f.w; if (prevW !== null) { while (w - prevW > C / 2) w -= C; while (prevW - w > C / 2) w += C; } prevW = w; return [f.a, f.r * Math.cos(w / D.R0), f.r * Math.sin(w / D.R0)]; });
    const e = q[q.length - 1], rr = Math.hypot(e[1], e[2]), d = slidOff([[q[0][0] - 80, q[0][1], q[0][2]], ...q, [e[0], e[1] * 300 / rr, e[2] * 300 / rr]]);
    if (d) ok(d.every((x) => x === (u < 2 ? 9 : 81)), `closing, tightened (u ${u}) on its bundle, slid off: determinants ${[...new Set(d)].join(",")}, want ${u < 2 ? 9 : 81}`);
    ok(s.total < s0.total - 5, `closing, tightened (u ${u}): ${s0.total.toFixed(1)} -> ${s.total.toFixed(1)} mm`);
  }
  const G = T.knotGen(Object.assign({}, K, { tighten: undefined }), D, 3), ends = G.flat[0].ends, stepOf = (x) => { let i = 0; while (i < ends.length && ends[i] * 6 < x) i++; return i; };
  const X = G.crossings.map((x) => ({ a: stepOf(x.i), b: stepOf(x.j), over: x.over })), name = (i) => KS[i].what || "";
  const iH = KS.findIndex((q) => /^lockstitch 9: the tape on along the bundle \(H\)/.test(q.what || "")), i8 = KS.findIndex((q) => /^lockstitch 8: the tape on/.test(q.what || ""));
  const onH = (b, over) => X.some((x) => x.a === iH && x.b === b && x.over === over);
  ok(i8 >= 0 && X.some((x) => x.a === i8 && /^lockstitch 8: the end over its standing part/.test(name(x.b)) && x.over > 0) && X.some((x) => x.a === i8 && /^lockstitch 8: under the turn's start/.test(name(x.b)) && x.over < 0),
    "closing: stitch 8's end over its standing part, then under the turn's start");
  ok(iH >= 0 && X.some((x) => x.a === iH && /^lockstitch 9: the end over the standing part/.test(name(x.b)) && x.over > 0) && X.some((x) => x.a === iH && /^lockstitch 9: under the turn's start/.test(name(x.b)) && x.over < 0),
    "closing: the last lockstitch's end over H (its standing part), then under the turn's start");
  ok(X.some((x) => /^lockstitch 9: one turn round/.test(name(x.a)) && /bight/.test(name(x.b)) && x.over > 0), "closing: the bight crosses over the last lockstitch's turn");
  for (const hh of ["half hitch 1", "half hitch 2"]) {
    const st = KS.map((q, i) => (name(i).startsWith(hh) ? i : -1)).filter((i) => i >= 0), [down, round, up] = st;
    ok(st.length === 3 && onH(down, 1) && onH(round, -1) && X.some((x) => x.a === down && x.b === up && x.over > 0), `closing: ${hh} goes over H, round under it and up over its own leg`);
  }
  const at = (hh) => KS.find((q) => (q.what || "").startsWith(hh + ": down")).pts.find((p) => p[1] === "2C")[0];   // (on H: a lap on, past stitch 8)
  ok(at("half hitch 1") > at("half hitch 2") && at("half hitch 2") > KS[0].a && at("half hitch 1") < -5, `closing: half hitch 1 (a ${at("half hitch 1")}, tied first) nearer the stitch than half hitch 2 (${at("half hitch 2")}), both on H`);
  const tie = T.SHOTS.blade.cuts.tie;
  ok(tie.length === 1 && tie[0].end === "tie-off" && KS.filter((q) => q.end).length === 1, "tie: one cut, the one tie-off end");
  const sT = sc("tie"), before = T.frameAt(sT.start + T.localOfWork(sT, tie[0].w) - 0.05, P, g, tm).detail, after = T.frameAt(sT.end - 0.1, P, g, tm).detail;
  ok(after.strands[0].draw < before.strands[0].draw - 5 && near(after.strands[0].draw, after.cuts[0].L, 1e-6), `tie: the tie-off end trimmed (${before.strands[0].draw.toFixed(1)} -> ${after.strands[0].draw.toFixed(1)} mm drawn)`);
}
});

section("blade", () => {
// ---- the trim's blade and its sound (draft 6), LOCKED in draft 7 (the maintainer: "perfect, pure gold"): SHOTS.blade as
// it was, bladeAt's frames for a fixed cut as they were (tests/fixtures/lacing_blade_d6.json, made from d6's code), and the
// swipes at each cut's w (their t follow the scenes' new starts) ----
{
  const fx = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", "lacing_blade_d6.json"), "utf8"));
  // (draft 9: the cuts follow the knots - the tie's square knot's two ends became the closing sequence's one tie-off end;
  // the blade's look and motion stay locked)
  const noCuts = (b) => JSON.stringify(Object.assign({}, b, { cuts: null }));
  ok(noCuts(T.SHOTS.blade) === noCuts(fx.blade) && JSON.stringify(T.SHOTS.blade.cuts.square) === JSON.stringify(fx.blade.cuts.square), "the blade's settings are draft 6's (locked)");
  ok(Math.abs(T.localOfWork(fx.sc, fx.cut.w) - fx.tc) < 1e-12, "the cut's moment in its scene, as draft 6 found it");
  let worst = 0;
  for (const q of fx.frames) {
    const r = T.bladeAt([Object.assign({}, fx.cut, { done: q.tau >= 0 })], fx.sc, fx.tc + q.tau, fx.cam);
    const nums = (o) => (JSON.stringify(o).match(/-?\d+(\.\d+)?(e-?\d+)?/g) || []).map(Number), a = nums(r), b = nums(q.r);
    worst = a.length === b.length ? Math.max(worst, ...a.map((v, i) => Math.abs(v - b[i]))) : Infinity;
  }
  ok(worst < 1e-9, `bladeAt: the blade, trail and offcut as draft 6 drew them (worst ${worst})`);
  const sfx = T.sfxAt(tm), cuts = tm.scenes.flatMap((s_) => (T.SHOTS.blade.cuts[s_.id] || []).map((c) => ({ scene: s_.id, t: s_.start + T.localOfWork(s_, c.w) })));
  ok(JSON.stringify(sfx.map((q) => [q.scene, +q.t.toFixed(6)])) === JSON.stringify(cuts.map((q) => [q.scene, +q.t.toFixed(6)])) && T.SHOTS.blade.sfxLead === 0.25,
    `the swipes at the cuts (${sfx.map((q) => q.t.toFixed(2)).join(", ")} s), each wav ${T.SHOTS.blade.sfxLead} s before`);
}
// ---- the trim's blade and its sound (draft 6) ----
{
  const sfx = T.sfxAt(tm), B = T.SHOTS.blade;
  ok(sfx.length === 2 && sfx.every((q) => q.id === "swipe"), `sfx: ${sfx.length} swipes`);
  // (the knot holds still from: the square knot's pull, the closing sequence's last pull)
  const pulls = T.stepsOf(T.SHOTS.knots.closing).filter((q) => q.op === "pull"), stillW = (id) => (id === "square" ? T.SQ.pull : pulls[pulls.length - 1].to - T.SHOTS.knots.closing.scenes.indexOf(id));
  for (const q of sfx) {
    const s_ = sc(q.scene), local = q.t - s_.start, w = T.workAt(s_, local);
    ok(w >= stillW(q.scene) && local + B.from / B.speed >= T.localOfWork(s_, stillW(q.scene)) - 1e-9, `sfx ${q.scene} ${q.t.toFixed(2)}: the blade flies only once the knot holds still (w ${w.toFixed(3)})`);
    const F = T.frameAt(q.t - 0.05, P, g, tm), Fa = T.frameAt(q.t + 0.1, P, g, tm), Fz = T.frameAt(q.t + B.fall + 0.05, P, g, tm);
    ok(F.detail.blades.length >= 1 && F.detail.trails.length >= 1, `${q.scene} ${q.t.toFixed(2)}: the blade and its trail just before the cut`);
    ok(Fa.detail.offcuts.length >= 1 && Fa.detail.offcuts.every((o) => o.o > 0 && o.o < 1), `${q.scene}: the offcut falling, fading just after`);
    ok(!Fz.detail.offcuts.some((o) => Math.abs(T.frameAt(q.t, P, g, tm).tt - Fz.tt) < 1e-9 && o.o > 0), `${q.scene}: gone after the fall`);
    // (d14n review: the trimmed working end takes the tip and the light end with it; the stub stays the tape's colour)
    const oc = Fa.detail.offcuts[0], ocEnd = oc && oc.pts[oc.pts.length - 1];
    ok(Fa.tipCut && ocEnd && Math.hypot(...Fa.tipAt.map((v, i) => v - ocEnd[i])) < 1e-9 && Math.abs(Fa.tip - oc.o) < 1e-9 && Fa.detail.endSeg && Math.hypot(...Fa.detail.endSeg[Fa.detail.endSeg.length - 1].map((v, i) => v - ocEnd[i])) < 1e-6,
      `${q.scene}: the tip and the light end ride the offcut`);
    ok(Fz.tip === 0 && !Fz.detail.endSeg, `${q.scene}: no tip or light end on the stub after the fall (tip ${Fz.tip})`);
    // the cut point is on the strand's tail, keep mm past the knot; the blade passes it at the cut
    const c = T.frameAt(q.t + 1e-4, P, g, tm).detail;
    const bl = T.frameAt(q.t - 1e-4, P, g, tm).detail.blades, cc = (c.cuts || []).filter((x) => x.p);
    ok(bl.length && cc.some((x) => Math.hypot(...bl[0].p.map((v, i) => v - x.p[i] - (bl[0].z[i] * B.lift))) < 0.05), `${q.scene}: the blade passes the cut point at the cut`);
  }
  ok(JSON.stringify(T.frameAt(sfx[0].t + 0.07, P, g, tm).detail.offcuts) === JSON.stringify(T.frameAt(sfx[0].t + 0.07, P, g, tm).detail.offcuts), "the offcut: same t, same frame");
}
});

section("knotgen", () => {
// ---- knots as steps (SHOTS.knots through knotGen): the clove hitch and the closing sequence ----
{
  ok(T.lapW("C-10", 300) === 290 && T.lapW("-2C+6", 300) === -594 && T.lapW(12, 300) === 12 && T.lapW("C", 300) === 300, "lap notation");
  for (const [id, det] of [["clove", "start"], ["closing", "close"]]) {
    // (the closing sequence: its work over its three scenes, 0 - 3; loose = its lockstitch's turn laid, before its pull)
    const D = P.details[det], K = T.fromEnd(T.SHOTS.knots[id], D), U = K.scenes ? K.scenes.length : 1;
    // (out from the hose's centre at the point's own place along it - draft 9: the closing sequence reaches 30 mm from its stitch)
    const r = (p, q) => { const c = D.line.at(D.s + q[0]); return Math.hypot(...p.map((v, i) => v - c[i])); };
    let last = -1, mono = true;
    for (let k = 0; k <= 40 * U; k++) { const g_ = T.knotGen(K, D, k / 40).strands[0], at_ = g_.at / (g_.pts.length - 1); if (at_ < last - 1e-9) mono = false; last = at_; }
    ok(mono && last >= 1 - 1e-9, `${id}: drawn on as the work goes, whole by the end`);
    const loose = T.knotGen(K, D, U > 1 ? 0.7 : 0.5), snug = T.knotGen(K, D, U);
    ok(loose.pull === 0 && snug.pull === 1, `${id}: loose, then pulled`);
    const out = (G) => Math.max(...G.strands[0].pts.map((p, m) => r(p, G.flat[0].dense[m]) - D.rho(G.flat[0].dense[m][1] / D.R0)));
    ok(out(loose) > out(snug) + 8 && out(snug) < 3 * T.HITCH.tr * 2 + 1, `${id}: ${out(loose).toFixed(1)} mm off the bundle loose, ${out(snug).toFixed(1)} snug`);
    // the crossings it was told: the strand on top lifted a tape's thickness over the one under, at each (as laid, before
    // a knot's tighten: tightening slides the crossings along the strands; the closing section checks its topology)
    const laid = T.knotGen(Object.assign({}, K, { tighten: undefined }), D, U), X = laid.crossings, flat = laid.flat[0].dense, pts = laid.strands[0].pts;
    ok(X.length >= (id === "clove" ? 2 : 9), `${id}: ${X.length} crossings found`);
    for (const x of X) {
      const hi = x.over > 0 ? x.j : x.i, lo = x.over > 0 ? x.i : x.j, rr = (m) => r(pts[Math.round(m)], flat[Math.round(m)]) - D.rho(flat[Math.round(m)][1] / D.R0);
      ok(rr(hi) - rr(lo) > 1.2 * T.HITCH.tr, `${id}: at a crossing the top strand ${rr(hi).toFixed(1)} mm out, the one under ${rr(lo).toFixed(1)}`);
    }
  }
  ok(T.SHOTS.knots.square.use === "reef", "the square knots stay draft 5's reef (the generator's read less well on one still)");
}
});

section("shots", () => {
// ---- the shots (docs/specs/lacing-tutorial.shots.json: cameras, layer opacities, colours as data) ----
{
  const shotsJson = JSON.parse(fs.readFileSync(path.join(ROOT, "docs", "specs", "lacing-tutorial.shots.json"), "utf8"));
  ok(JSON.stringify(shotsJson) === JSON.stringify(T.SHOTS), "SHOTS differs from the JSON (node tools/lacing_voice.js sync)");
  ok(tm.scenes.every((s) => T.SHOTS.scenes[s.id] && T.SHOTS.scenes[s.id].camera.keys.length >= 1), "a shot for every scene");
  for (const [id, q] of Object.entries(T.SHOTS.scenes)) {
    const K = q.camera.keys;
    ok(K.every((k, i) => i === 0 || k.x > K[i - 1].x), `${id}: keys in order`);
    ok(K.every((k) => [k.dist, k.fit, k.fitFocus].filter((v) => v !== undefined).length === 1), `${id}: each key one of dist / fit / fitFocus`);
    for (const [name, tr] of Object.entries(q.layers || {})) ok(T.LAYERS.includes(name) && (typeof tr === "number" || tr.every((k) => typeof k[0] === "number")), `${id}: layer ${name}`);
    const lead = q.lead === undefined ? T.SHOTS.defaults.lead : q.lead;   // durations from the motion tokens
    ok(Object.values(T.TOKENS).some((v) => Math.abs(lead / v - Math.round(lead / v)) < 1e-9), `${id}: lead ${lead} s is not a token multiple`);
  }
  // (draft 5's frozen frames, tests/fixtures/lacing_frames_d5.json, retired in draft 7: the new voice re-timed every scene;
  // the data reproduced draft 5's code to 2e-6 mm at 100dd80)
  // edits are data: a changed distance moves the camera there; "add keyframe at t" leaves the frame at t as it was
  const S2 = JSON.parse(JSON.stringify(T.SHOTS)), sp = sc("spacing"), tS = sp.start + sp.dur / 2;
  S2.scenes.spacing.camera.keys[0].dist = 450;
  const c2 = T.frameAt(tS, P, g, tm, S2).cam;
  ok(near(Math.hypot(...c2[0].map((v, i) => v - c2[1][i])), 450, 1e-6), "a shot's dist moves the camera");
  ok(near(Math.hypot(...T.frameAt(tS, P, g, tm).cam[0].map((v, i) => v - T.frameAt(tS, P, g, tm).cam[1][i])), 300, 1e-6), "the shots passed in, not SHOTS, changed");
  for (const [id, share] of [["goal", 0.5], ["seal", 0.55], ["done", 0.37], ["lock", 0.5], ["tight", 0.6]]) {
    // (t on the key's own clock: addKey keeps x to 1e-4, so a t off that grid lands its key up to ~0.5 ms away - up to
    // ~0.6 mm of the finale's orbit and travel; the done sample passed at 0.013 mm before the frame snap by where its
    // rounding fell, 0.57 mm after. On the grid every sample is within 0.004 mm, before the snap and after)
    const s_ = sc(id), x = T.addKey(JSON.parse(JSON.stringify(T.SHOTS)), id, s_.dur * share, P, g, tm), local = T.keyLocal(T.SHOTS.scenes[id].camera, s_, x.keys[x.i].x);
    const t = s_.start + local, S3 = JSON.parse(JSON.stringify(T.SHOTS)), before = T.frameAt(t, P, g, tm, S3).cam;
    const r = T.addKey(S3, id, local, P, g, tm);
    S3.scenes[id].camera.keys = r.keys;
    const after = T.frameAt(t, P, g, tm, S3).cam, d = Math.max(...[0, 1].map((k) => Math.hypot(...after[k].map((v, i) => v - before[k][i]))));
    ok(d < 0.05 && r.keys.length >= 1, `${id}: add keyframe at ${t.toFixed(2)} s moved the camera ${d.toFixed(3)} mm`);
  }
  const L0 = T.layersAt(sc("seal"), 0.3), L1 = T.layersAt(sc("seal"), 0.3, Object.assign({}, T.SHOTS, { scenes: Object.assign({}, T.SHOTS.scenes, { seal: Object.assign({}, T.SHOTS.scenes.seal, { layers: { hose: 0.2 } }) }) }));
  ok(L0.hose > 0.45 && L1.hose === 0.2 && L1.context === 1, "a layer track is data");
}
});

section("callouts", () => {
// ---- the callouts (draft 10): a term card with a leader to a point in the scene ----
{
  const CO = T.CO, COS = T.calloutsOf(tm), A = g.aspect, refs = new Set((sb.references || []).map((r) => r.id)), terms = new Map((sb.terms || []).map((q) => [q.id, q]));
  const nCallouts = sb.scenes.reduce((k, s) => k + (s.callouts || []).length, 0);
  ok(COS.length === nCallouts && nCallouts > 0, `callouts: ${COS.length} on the timeline, ${nCallouts} in the storyboard`);
  for (const s of sb.scenes) for (const c of s.callouts || []) {
    const q = terms.get(c.term);
    ok(q && refs.has(q.ref), `${s.id}: callout term "${c.term}" resolves${q ? `, its ref "${q.ref}"` : ""}`);
    ok((c.word === undefined) !== (c.at === undefined) && c.holdS > 0, `${s.id} ${c.term}: word or at, and holdS`);
    const said = c.line ? ((s.more || []).find((m) => m.id === c.line) || {}).narration || "" : s.narration;   // (d14: a callout's line)
    if (c.word) ok(T.wordIndex(T.spoken(said), c.word) >= 0, `${s.id}: "${c.word}" is in its line${c.line ? ` ${c.line}` : ""}`);
  }
  const W = 1280, Hpx = 720, short = [];
  let worstDot = { px: 0, at: "" }, worstAcc = { px: 0, at: "" }, worstMm = { mm: 0, at: "" }, samples = 0, minFocus = Infinity, minLead = Infinity;
  COS.forEach((co, k) => {
    ok(co.tIn >= tm.scenes[co.i].start && co.tGone <= tm.scenes[co.i].end + 1e-9, `${co.term}: inside its scene (${co.tIn.toFixed(2)} - ${co.tGone.toFixed(2)})`);
    if (k) ok(co.tIn >= COS[k - 1].tGone - 1e-9, `${co.term} pops in at ${co.tIn.toFixed(2)} before ${COS[k - 1].term} is gone (${COS[k - 1].tGone.toFixed(2)})`);
    if (co.tOut - co.tIn < 1.0) short.push(`${co.term} held ${(co.tOut - co.tIn).toFixed(2)} s (${co.short.toFixed(2)} s short to end in ${co.scene})`);
    // the layout: at the span's two ends (a ms in) and at every frame between, in the frame loop below (draft 10: 12 samples)
    const layout = (t, F, c) => {
      samples++;
      ok(c, `${co.term} at ${t.toFixed(3)}: not on screen`);
      if (!c) return;
      const R = c.card, m = CO.margin;
      ok(R.x >= m - 1e-9 && R.x + R.w <= 1 - m + 1e-9 && R.y >= m - 1e-9 && R.y + R.h <= 1 - m + 1e-9, `${co.term} at ${t.toFixed(2)}: the card ${JSON.stringify([R.x, R.y, R.w, R.h].map((v) => +v.toFixed(3)))} outside the frame's ${m * 100} % margins`);
      ok(R.y + R.h <= CO.cueTop - CO.cueGap + 1e-9, `${co.term} at ${t.toFixed(2)}: the card reaches ${(R.y + R.h).toFixed(3)} of the height, into the cue's band (${CO.cueTop})`);
      ok(c.anchor.z > 0 && c.anchor.x >= 0.02 && c.anchor.x <= 0.98 && c.anchor.y >= 0.02 && c.anchor.y <= 0.98, `${co.term} at ${t.toFixed(2)}: the anchor at (${c.anchor.x.toFixed(3)}, ${c.anchor.y.toFixed(3)}) is out of the frame`);
      const rd = (p) => Math.hypot(Math.max(R.x * A - p.x * A, 0, p.x * A - (R.x + R.w) * A), Math.max(R.y - p.y, 0, p.y - (R.y + R.h)));
      ok(rd(c.anchor) >= CO.clearA - 1e-9, `${co.term} at ${t.toFixed(2)}: the card covers its anchor (${rd(c.anchor).toFixed(3)})`);
      minLead = Math.min(minLead, rd(c.anchor));
      if (F.focus) {
        const f = T.projector(F.cam, g)(F.focus);
        if (f.z > 0) { minFocus = Math.min(minFocus, rd(f)); ok(rd(f) >= CO.clearF - 1e-9, `${co.term} at ${t.toFixed(2)}: the card ${rd(f).toFixed(3)} from the focus point (at least ${CO.clearF})`); }
      }
      ok(c.card.scale <= 1.04 && c.card.scale >= 0 && c.card.opacity >= 0 && c.card.opacity <= 1 && c.leader.draw >= 0 && c.leader.draw <= 1, `${co.term} at ${t.toFixed(2)}: scale ${c.card.scale} opacity ${c.card.opacity}`);
    };
    for (const t of [co.tIn + 1e-3, co.tGone - 1e-3]) { const F = T.frameAt(t, P, g, tm); layout(t, F, F.callouts.find((q) => q.term === co.term)); }
    // frame by frame at 30 fps from a frame before to a frame after: one callout at most, the card still; the anchor's
    // point in the world moves at most 1 mm a frame, and the dot's and the leader end's speed on screen changes by at most
    // 10 px a frame at 720p (no jump: a jump changes it by tens of px; the close scene's zoom, eased, sweeps the breakout
    // at up to 16 px a frame, its speed changing 6 px a frame; the pop-in starts from nothing)
    let prevC = null, prevA = null, prevV = null;
    for (let f = Math.floor(co.tIn * fps) - 1; f <= Math.ceil(co.tGone * fps) + 1; f++) {
      const t = f / fps, F = T.frameAt(t, P, g, tm), c = F.callouts.find((q) => q.term === co.term);
      if (t > co.tIn + 1e-3 && t < co.tGone - 1e-3) layout(t, F, c);
      ok(F.callouts.length <= 1, `t=${t.toFixed(3)}: ${F.callouts.length} callouts on screen`);
      if (c && prevC) {
        ok(c.card.x === prevC.card.x && c.card.y === prevC.card.y, `${co.term} t=${t.toFixed(3)}: the card moved`);
        const v = [(c.dot.x - prevC.dot.x) * W, (c.dot.y - prevC.dot.y) * Hpx, (c.leader.x2 - prevC.leader.x2) * W, (c.leader.y2 - prevC.leader.y2) * Hpx];
        const d = Math.max(Math.hypot(v[0], v[1]), Math.hypot(v[2], v[3]));
        if (d > worstDot.px) worstDot = { px: d, at: `${co.term} ${t.toFixed(3)}` };
        if (prevV) { const acc = Math.max(Math.hypot(v[0] - prevV[0], v[1] - prevV[1]), Math.hypot(v[2] - prevV[2], v[3] - prevV[3])); if (acc > worstAcc.px) worstAcc = { px: acc, at: `${co.term} ${t.toFixed(3)}` }; }
        prevV = v;
      } else prevV = null;
      const a = c ? T.anchorOf(co.anchor, F, P, tm) : null;
      if (a && prevA) { const mm = Math.hypot(...a.map((x, q) => x - prevA[q])); if (mm > worstMm.mm) worstMm = { mm, at: `${co.term} ${t.toFixed(3)}` }; }
      prevA = a;
      prevC = c || null;
    }
  });
  ok(worstMm.mm <= 1, `callouts: an anchor moves ${worstMm.mm.toFixed(2)} mm in a frame (${worstMm.at}; at most 1)`);
  ok(worstAcc.px <= 10, `callouts: the dot's or the leader end's speed changes ${worstAcc.px.toFixed(1)} px a frame at 720p (${worstAcc.at}; at most 10)`);
  // pure: the same t gives the same callouts, in any order
  const tc = COS.map((c) => (c.tIn + c.tOut) / 2), one = tc.map((t) => JSON.stringify(T.frameAt(t, P, g, tm).callouts));
  ok(tc.slice().reverse().map((t) => JSON.stringify(T.frameAt(t, P, g, tm).callouts)).reverse().every((s, i) => s === one[i]), "callouts: frameAt gives the same callouts in any order");
  ok(T.frameAt(T.calloutsOf(tm)[0].tIn - 0.5, P, g, tm).callouts.length === 0 && T.frameAt(0, P, g, tm).callouts.length === 0, "callouts: none before the first");
  ok(T.wordAt({ word: "trim" }, { text: "pull snug and trim the end", dur: 2.6 }) === 14 / 26 * 2.6 && T.wordAt({ word: "x", wordS: 1.25 }, { text: "", dur: 1 }) === 1.25, "wordAt: the estimate and the measured wordS");
  ok(T.sourceOf({ ref: "r", where: "§9.2.6.a, Fig. 9-3", page: "34" }, new Map([["r", { title: "NASA-STD-8739.4A, Workmanship" }]])) === "NASA-STD-8739.4A §9.2.6.a, p. 34", "sourceOf: short");
  console.log(`  callouts: ${COS.length}, ${samples} layout samples; card at least ${minFocus.toFixed(3)} of the height from the focus, ${minLead.toFixed(3)} from its anchor; the dot at most ${worstDot.px.toFixed(1)} px a frame at 720p (${worstDot.at}), its speed changes at most ${worstAcc.px.toFixed(1)} px a frame (${worstAcc.at}), an anchor at most ${worstMm.mm.toFixed(2)} mm a frame (${worstMm.at})`);
  for (const s of short) console.log(`  NOTE callout ${s}`);
}
});

section("events", () => {
// ---- the script view (draft 8): each event's t is what the picture and the sound do then ----
{
  const EV = T.eventsOf(tm), sfx = T.sfxAt(tm), VL = T.voiceLines(tm), lead = (id) => (T.SHOTS.scenes[id].lead !== undefined ? T.SHOTS.scenes[id].lead : T.SHOTS.defaults.lead);
  const camOf = (k, sc, local) => { const c = T.keyCam(k, { P, g, sc, local, dx: T.poseOf(sc, local)[0] }); return c.tgt.map((v, q) => v + c.dir[q] * c.d); };
  const kinds = {}, held = [];
  let worst = 0, skipped = 0;
  ok(EV.length === tm.scenes.length, "eventsOf: a list a scene");
  EV.forEach((E, i) => {
    const sc = tm.scenes[i];
    ok(E.id === sc.id && E.events.every((e, j) => j === 0 || e.t >= E.events[j - 1].t), `${E.id}: events in order`);
    for (const e of E.events) {
      kinds[e.kind] = (kinds[e.kind] || 0) + 1;
      const local = e.t - sc.start;
      ok(near(e.at_rel, Math.max(0, Math.min(1, local / sc.dur)), 1e-3), `${E.id} ${e.kind}: at_rel ${e.at_rel}`);
      if (e.kind === "camera") {                    // the camera there is the key's (in a move between scenes: once arrived)
        const k = T.SHOTS.scenes[sc.id].camera.keys[e.key], nx = tm.scenes[i + 1];
        // (the key's own local s, not the event's t rounded to the ms; the last key: just before the video ends - at its end
        // t wraps to the start)
        let tl = Math.min(T.keyLocal(T.SHOTS.scenes[sc.id].camera, sc, k.x), sc.dur - 1e-6);
        ok(near(sc.start + T.keyLocal(T.SHOTS.scenes[sc.id].camera, sc, k.x), e.t, 6e-4), `${E.id} camera key ${e.key}: at ${e.t}`);
        const inMove = (l) => (i > 0 && l < lead(sc.id)) || (nx && sc.dur - l < lead(nx.id));
        if (inMove(tl) && T.SHOTS.scenes[sc.id].camera.keys.length === 1) { tl = lead(sc.id) + 0.01; held.push(sc.id); }
        if (inMove(tl) || T.frameAt(sc.start + tl, P, g, tm).dip > 0) { skipped++; continue; }
        const F = T.frameAt(sc.start + tl, P, g, tm).cam[0], K = camOf(k, sc, tl), d = Math.hypot(...F.map((v, q) => v - K[q]));
        worst = Math.max(worst, d);
        ok(d < 0.01, `${E.id} camera key ${e.key}: the frame's camera ${d.toFixed(3)} mm from the key's at ${(sc.start + tl).toFixed(3)} s`);
      } else if (e.kind === "layer") {              // (the event's t is rounded to the ms: held inside its scene, which
        const te = Math.min(Math.max(e.t, sc.start), sc.end - 1e-6);   // starts on a whole frame, k / 30, since 2026-11-09)
        ok(near(T.frameAt(te, P, g, tm).layers[e.layer], e.value, 2e-3), `${E.id} layer ${e.layer}: ${T.frameAt(te, P, g, tm).layers[e.layer]}, want ${e.value}`);
      }
      else if (e.kind === "knot" || e.kind === "draw") ok(near(T.workAt(sc, local), e.w, 2e-3), `${E.id} ${e.what}: the work there ${T.workAt(sc, local).toFixed(4)}, want ${e.w}`);
      else if (e.kind === "cut") {
        const F = T.frameAt(e.t, P, g, tm);
        ok(sfx.some((q) => near(q.t, e.t, 1e-3)) && F.detail && F.detail.blades.length > 0, `${E.id}: a cut at ${e.t} (sfxAt's, the blade drawn)`);
      } else if (e.kind === "sfx") ok(sfx.some((q) => near(q.t - T.SHOTS.blade.sfxLead, e.t, 1e-3) && near(q.t, e.cut_t, 1e-3)), `${E.id}: a swipe's wav at ${e.t}`);
      else if (e.kind === "voice") { const l = VL.find((q) => q.id === e.line) || sc.lines.find((q) => q.id === e.line); ok(l && near(e.edge === "start" ? l.at : l.at + l.dur, e.t, 1e-3), `${E.id}: voice ${e.line} ${e.edge} at ${e.t}`); }
      else if (e.kind === "reveal") {                // (draft 11) the flash: nothing before, the lacing coming in after; settled: the glow gone
        const F0 = T.frameAt(e.t - 0.01, P, g, tm), F1 = T.frameAt(e.t + 0.05, P, g, tm);   // (d12) neat: the cables drawn in
        ok(e.edge === "flash" ? F0.ghost === 0 && F1.ghost > 0.2 && F1.reveal.glow > 0.5 && F0.cables.k === 0 && F1.cables.k > 0
          : e.edge === "neat" ? F0.cables.k < 1 && F1.cables.k === 1 && F1.cables.sag === 0
          : F0.reveal.glow > 0 && F1.reveal.glow === 0 && near(F1.ghost, F1.layers.ghost, 1e-9), `${E.id}: reveal ${e.edge} at ${e.t}`);
      } else if (e.kind === "pose" && e.edge) {      // (d12) the opening's legs: off from home or the far end; parked
        const p = (t) => T.frameAt(Math.min(Math.max(t, sc.start), sc.end - 1e-6), P, g, tm).pose[0];
        ok(e.edge === "out" ? near(p(e.t), 0, 1e-3) && p(e.t + 0.3) > 1 : e.edge === "back" ? near(p(e.t), T.MOVE_DX, 1e-3) && p(e.t + 0.3) < T.MOVE_DX - 1
          : near(p(e.t), 0, 1e-9) && near(p(sc.end - 1e-6), 0, 1e-9), `${E.id}: pose ${e.edge} at ${e.t} (dx ${p(e.t).toFixed(3)})`);
      } else if (e.kind === "credits") {              // (draft 11) in: the backdrop starts; out: the fade to black starts
        const F0 = T.frameAt(e.t - 0.01, P, g, tm), F1 = T.frameAt(e.t + 0.02, P, g, tm);
        ok(e.edge === "in" ? F0.credits.backdrop === 0 && F1.credits.backdrop > 0 : F0.credits.black === 0 && F1.credits.black > 0, `${E.id}: credits ${e.edge} at ${e.t}`);
      }
      else if (e.kind === "callout") {               // (draft 10) in: not on screen just before, on just after; out: the reverse
        const on = (t) => T.frameAt(t, P, g, tm).callouts.some((q) => q.term === e.term && q.anchor.name === e.anchor);
        const [pre, post] = e.edge === "in" ? [false, true] : [true, false];
        ok(on(e.t - (e.edge === "in" ? 2e-3 : 0.02)) === pre && on(e.t + (e.edge === "in" ? 0.02 : 2e-3)) === post, `${E.id}: callout ${e.term} ${e.edge} at ${e.t}`);
      }
    }
  });
  ok(kinds.camera && kinds.layer && kinds.knot && kinds.cut === sfx.length && kinds.sfx === sfx.length && kinds.voice === 2 * tm.scenes.reduce((a, s) => a + s.lines.length, 0) && kinds.callout === 2 * T.calloutsOf(tm).length && kinds.reveal === 3 && kinds.credits === 2, `event kinds ${JSON.stringify(kinds)}`);
  console.log(`  events: ${Object.entries(kinds).map(([k, v]) => `${v} ${k}`).join(", ")}; camera keys within ${worst.toFixed(4)} mm (${held.length} held keys checked once arrived, ${skipped} in a move skipped)`);
}
});

section("draft11", () => {
// ---- draft 11: the opening's flash, the faster cuts, the credits ----
{
  // the opening: the goal's lacing (the ghost; nothing else of it is drawn there) at 0 before the music's hit, then a
  // warm-white flash with its halo, back to the tape's colour and the goal's opacity
  const goal = sc("goal"), R = T.REVEAL, rv = sb.scenes.find((s) => s.id === "goal").reveal;
  const hit = goal.lines.find((l) => l.id === rv.line).at + rv.wordS;   // (d12: the hit is the spoken word's)
  ok(near(tm.hit, hit) && hit > goal.start && hit < goal.end - 4, `the hit ${tm.hit} s, in the goal`);
  for (let t = 0; t < hit; t += 1 / fps) {
    const F = T.frameAt(t, P, g, tm);
    ok(F.ghost === 0 && F.f === 0 && F.tip === 0 && !F.real && F.reveal.halo.o === 0, `t=${t.toFixed(3)}: the lacing drawn before the hit (ghost ${F.ghost}, f ${F.f}, tip ${F.tip}, halo ${F.reveal.halo.o})`);
  }
  const at = (u) => T.frameAt(hit + u, P, g, tm);
  ok(at(T.TOKENS.quick).reveal.glow > 0.95 && at(T.TOKENS.quick).ghost > 0.95, `the flash: glow ${at(T.TOKENS.quick).reveal.glow.toFixed(2)}, opacity ${at(T.TOKENS.quick).ghost.toFixed(2)} a quick after the hit`);
  ok(at(0.1).reveal.halo.o > 0.3 && at(0.6).reveal.halo.scale > at(0.1).reveal.halo.scale && at(0.6).reveal.halo.o < at(0.1).reveal.halo.o, "the halo widens and fades");
  const settled = at(R.settle + 0.01), gone = at(Math.max(R.settle, R.halo.s) + 0.01);
  ok(R.settle >= 1.2 && R.settle <= 1.8 && settled.reveal.glow === 0 && near(settled.ghost, settled.layers.ghost, 1e-12) && gone.reveal.halo.o === 0, `settled ${R.settle} s after the hit: glow ${settled.reveal.glow}, ghost ${settled.ghost} (layer ${settled.layers.ghost}), halo ${gone.reveal.halo.o}`);
  let prevG = null, worstG = 0;                     // no jump in the flash: at most a quick's rise a frame
  for (let t = hit - 0.1; t < hit + 2; t += 1 / fps) { const F = T.frameAt(t, P, g, tm); if (prevG) worstG = Math.max(worstG, Math.abs(F.ghost - prevG.ghost)); prevG = F; }
  ok(worstG <= 3 / (T.TOKENS.quick * fps) + 1e-9, `the flash (ease-out over quick): the ghost's opacity changes ${worstG.toFixed(2)} a frame`);
  ok(T.frameAt(goal.end - 0.7, P, g, tm).reveal.glow === 0 && T.frameAt(sc("start").start + 0.1, P, g, tm).reveal === null, "the reveal is the goal's");
  // the goal's camera never stops (draft 11: the 22 s intro, no dead picture)
  let still = 0, worstStill = 0;
  for (let t = goal.start; t < goal.end - 0.6; t += 1 / fps) {
    const a = T.cameraAt(t, P, g, tm), b = T.cameraAt(t + 1 / fps, P, g, tm);   // (frameAt's cam is cameraAt's)
    if (Math.hypot(...a[0].map((v, i) => v - b[0][i])) < 0.05) { still += 1 / fps; worstStill = Math.max(worstStill, still); } else still = 0;
  }
  ok(worstStill < 0.2, `the goal's camera stands still ${worstStill.toFixed(2)} s`);

  // the dip: out, held, in - 0.4 s or less; full across the scenes' boundary, where the camera jumps
  const D = T.DIP, dipLen = D.out + D.hold + D.in;
  ok(dipLen <= 0.4 + 1e-9 && D.hold / 2 > 1 / fps, `the dip ${dipLen.toFixed(3)} s (its hold ${D.hold} s spans a frame either side)`);
  // dead time at each cut: no line and nothing moving before the dip starts / after it ends, 0.5 s or less (the lines at
  // their audioS, the wavs' own silences aside; a callout held still is not a change, its pop in or out is)
  const dt = 1 / 60, cutsAt = [];
  const D3 = (a, b) => Math.hypot(...a.map((v, i) => v - b[i]));
  // (frameAt is pure in t: the walks and the 3 s scan share their frames - a probe's t + dt is the next probe's t)
  const fmemo = new Map(), frameM = (t) => { let F = fmemo.get(t); if (!F) fmemo.set(t, (F = T.frameAt(t, P, g, tm))); return F; };
  const moving = (t) => {
    const A = frameM(t), B = frameM(t + dt);
    if (A.scene !== B.scene || D3(A.cam[0], B.cam[0]) > 0.05 || D3(A.cam[1], B.cam[1]) > 0.05) return true;
    if (Math.abs(A.f - B.f) > 1e-5 || Math.abs(A.tip - B.tip) > 0.002 || Math.abs(A.ghost - B.ghost) > 0.002 || Math.abs(A.cueO - B.cueO) > 0.002) return true;
    if (A.tipAt && B.tipAt && A.tip > 0.01 && D3(A.tipAt, B.tipAt) > 0.01) return true;
    if (Object.keys(A.layers).some((k) => Math.abs(A.layers[k] - B.layers[k]) > 0.002)) return true;
    if (A.detail && B.detail) {
      if ((A.detail.strands || []).some((q, i) => { const r = (B.detail.strands || [])[i]; return !r || Math.abs(q.draw - r.draw) > 0.01 || q.pts.some((p, j) => r.pts[j] && D3(p, r.pts[j]) > 0.01); })) return true;
      if (A.detail.hitch && (Math.abs(A.detail.hitch.draw - B.detail.hitch.draw) > 0.01 || Math.abs(A.detail.hitch.lam - B.detail.hitch.lam) > 1e-4)) return true;
      if ((A.detail.blades || []).length || (A.detail.trails || []).length || (A.detail.offcuts || []).length || Math.abs((A.detail.endO || 0) - (B.detail.endO || 0)) > 0.002) return true;
    }
    if (Math.abs(A.bracket.scale - B.bracket.scale) > 1e-3 || Math.abs(A.bracket.opacity - B.bracket.opacity) > 2e-3 || A.callouts.length !== B.callouts.length) return true;
    return A.callouts.some((c, i) => Math.abs(c.card.opacity - B.callouts[i].card.opacity) > 1e-3 || Math.abs(c.dot.scale - B.callouts[i].dot.scale) > 1e-3);
  };
  const speaking = (t) => tm.scenes.some((s_) => s_.lines.some((l) => t >= l.at && t < l.at + l.dur));
  tm.scenes.forEach((A, i) => {
    const B = tm.scenes[i + 1];
    fmemo.clear();
    if (!B || (T.DETAIL_OF[A.id] || "") === (T.DETAIL_OF[B.id] || "")) return;
    const d0 = A.end - D.out - D.hold / 2, d1 = A.end + D.hold / 2 + D.in;
    ok(T.dipAt(d0 - 1e-6, tm) === 0 && T.dipAt(A.end - D.hold / 2 + 1e-6, tm) === 1 && T.dipAt(A.end + D.hold / 2 - 1e-6, tm) === 1 && T.dipAt(d1 + 1e-6, tm) === 0, `${A.id} -> ${B.id}: the dip ${d0.toFixed(3)} - ${d1.toFixed(3)}`);
    let tb = d0, ta = d1;
    while (tb - dt > A.start && !speaking(tb - dt) && !moving(tb - dt)) tb -= dt;
    while (ta < B.end && !speaking(ta) && !moving(ta)) ta += dt;
    let run = 0, longest = 0;                        // the longest still, silent stretch in the 3 s before the dip
    for (let t = Math.max(A.start, d0 - 3); t < d0; t += dt) { if (!speaking(t) && !moving(t)) { run += dt; longest = Math.max(longest, run); } else run = 0; }
    cutsAt.push(`${A.id}->${B.id} ${(d0 - tb).toFixed(2)}/${longest.toFixed(2)}/${(ta - d1).toFixed(2)}`);
    ok(d0 - tb <= 0.5 + 1e-9 && longest <= 0.5 + 1e-9 && ta - d1 <= 0.5 + 1e-9, `${A.id} -> ${B.id}: dead ${(d0 - tb).toFixed(2)} s before the dip (the longest still stretch ${longest.toFixed(2)}), ${(ta - d1).toFixed(2)} s after (at most 0.5)`);
  });
  ok(cutsAt.length === 5, `${cutsAt.length} cuts`);
  // the blade's cuts are all on screen: the cut, its trail and the offcut's fall end before the dip
  for (const q of T.sfxAt(tm)) {
    const s_ = sc(q.scene), B = T.SHOTS.blade, endFall = q.t + Math.max(B.to / B.speed + B.fade, B.fall);
    ok(endFall <= s_.end - D.out - D.hold / 2 + 1e-9, `${q.scene}: the cut at ${q.t.toFixed(2)} s is over at ${endFall.toFixed(2)}, before the dip (${(s_.end - D.out - D.hold / 2).toFixed(2)})`);
  }
  console.log(`  cuts (dead before / longest still / after, s): ${cutsAt.join(", ")}; the dip ${dipLen.toFixed(3)} s`);

  // the credits: the done scene's last credits.holdS; the finale's keys on its first body s (as draft 10's 15.74)
  const dn = sc("done"), c0 = dn.start + dn.body, CR = T.CR;
  // (draft 10's 15.74 s, from the storyboard's sum; since 2026-11-09 the scene's two ends are on whole frames, each within
  // 1/60 s of the sum: 15.733)
  ok(near(dn.end - c0, sb.credits.holdS) && Math.abs(dn.body - 15.74) <= 1 / 30 + 1e-9,
    `the credits from ${c0.toFixed(2)} s (the finale ${dn.body.toFixed(2)} s)`);
  ok(T.frameAt(c0 - 0.01, P, g, tm).credits === null || T.frameAt(c0 - 0.01, P, g, tm).credits.backdrop === 0, "no credits before the finale ends");
  const lastLine = dn.lines[dn.lines.length - 1];
  ok(lastLine.at + lastLine.dur <= c0 + 1e-9, `the finale's tip ends ${(lastLine.at + lastLine.dur).toFixed(2)} s, before the credits`);
  const ins = T.creditsIn(tm), lastIn = c0 + ins[ins.length - 1], outAt = dn.end - CR.black;
  // (one composed panel: every line fully on from its own in to the fade, 1.5 s or more; the last one in has the least)
  ok(outAt - lastIn >= 1.5 && ins.every((v, i) => i === 0 || v >= ins[i - 1]), `the credits fully in at ${lastIn.toFixed(2)} s, ${(outAt - lastIn).toFixed(2)} s before the fade (at least 1.5 s a line)`);
  const mid = T.frameAt((lastIn + outAt) / 2, P, g, tm), cr = mid.credits;
  ok(cr && cr.backdrop === 1 && cr.black === 0 && cr.title.o === 1 && cr.items.every((q) => q.o === 1 && q.dy === 0) && mid.cueO === 0 && mid.callouts.length === 0, "the credits' middle: all on, the backdrop full, no cue");
  for (const [aspect, name] of [[16 / 9, "16:9"], [4 / 3, "4:3"]]) {   // inside the frame, 4 % margins; the boxes apart
    const L = T.frameAt((lastIn + outAt) / 2, P, Object.assign({}, g, { aspect }), tm).credits;
    const boxes = [L.title, ...L.items];
    ok(boxes.every((b) => b.x >= 0.04 - 1e-9 && b.x + b.w <= 0.96 + 1e-9 && b.y >= 0.04 - 1e-9 && b.y + b.h <= 0.96 + 1e-9), `credits ${name}: a line outside the frame's 4 % margins ${JSON.stringify(boxes.map((b) => [b.x, b.y, b.w, b.h].map((v) => +v.toFixed(3))))}`);
    ok(boxes.every((a, i) => boxes.every((b, j) => j <= i || a.x + a.w <= b.x + 1e-9 || b.x + b.w <= a.x + 1e-9 || a.y + a.h <= b.y + 1e-9 || b.y + b.h <= a.y + 1e-9)), `credits ${name}: two lines overlap`);
    ok(L.size.role * 720 >= 11 && L.size.url * 720 >= 11 && L.size.text * 720 >= 17, `credits ${name}: the smallest type ${(Math.min(L.size.role, L.size.url) * 720).toFixed(1)} px at 720p`);
  }
  ok(sb.credits.items.every((q, i) => cr.items[i].text === q.text && cr.items[i].role === q.role && (!q.url || q.url.endsWith(cr.items[i].url))), "the credits are the storyboard's");
  const end = T.frameAt(dn.end - 1e-3, P, g, tm), pre = T.frameAt(outAt - 1e-3, P, g, tm);
  ok(end.credits.black > 0.999 && pre.credits.black === 0 && CR.black >= 0.8 && CR.black <= 1.2, `the fade to black: ${pre.credits.black} -> ${end.credits.black.toFixed(4)} over the last ${CR.black} s`);
  let prevC = null, worstO = 0;                       // pure from t, and smooth: opacities a slow's step a frame at most
  for (let t = c0 - 0.1; t < dn.end; t += 1 / fps) {
    const F = T.frameAt(t, P, g, tm).credits;
    if (F && prevC) worstO = Math.max(worstO, Math.abs(F.backdrop - prevC.backdrop), Math.abs(F.black - prevC.black), ...F.items.map((q, i) => Math.abs(q.o - prevC.items[i].o)));
    prevC = F;
  }
  ok(worstO <= 3 / (T.TOKENS.slow * fps) + 1e-9, `the credits' opacities change ${worstO.toFixed(3)} a frame`);
  ok(JSON.stringify(T.frameAt(c0 + 3, P, g, tm).credits) === JSON.stringify(T.frameAt(c0 + 3, P, g, tm).credits), "the credits: same t, same frame");
  console.log(`  credits: ${c0.toFixed(2)} - ${dn.end.toFixed(2)} s, all in by ${lastIn.toFixed(2)}, held ${(outAt - lastIn).toFixed(2)} s; the panel ${(cr.panel.w * 100).toFixed(0)} % x ${(cr.panel.h * 100).toFixed(0)} % of the frame`);
}
});

section("opening", () => {
// ---- d12 (the maintainer: the first seconds explain the problem with no lacing, the core moving and the cords flapping;
// the lacing flashes in exactly as "cable lacing" is first said; then the cables neat while the core keeps moving) ----
const SL = require("../web/js/lacing/slack.js"), goal = sc("goal"), R = sb.scenes.find((s) => s.id === "goal").reveal;
const line = goal.lines.find((l) => l.id === R.line), O = T.OPENING;
// the reveal t is the word's t: its line's start + the word's time measured in its wav; nowhere earlier is it said
ok(typeof R.wordS === "number" && tm.hit === line.at + R.wordS, `the reveal ${tm.hit} s = ${R.line} at ${line.at} + "${R.word}" at ${R.wordS} s in its wav`);
const said = (l) => l.text.toLowerCase().includes(R.word.toLowerCase());
ok(said(line) && tm.scenes.flatMap((s) => s.lines).filter((l) => l.at < line.at).every((l) => !said(l)), `"${R.word}" first said in ${R.line}`);
const prob = goal.lines[goal.lines.indexOf(line) - 1];
// d19 (the maintainer: tighter, the reveal sooner): the problem in one line, told by 7 s (d18: two lines, 11.62 s;
// azab2c-private practices/youtube-videos.md OP-2 / OP-3)
ok(prob.at + prob.dur <= 7, `the problem told by ${(prob.at + prob.dur).toFixed(2)} s`);
// the core: back and forth through the scene (several out-and-backs, at home at its start), parked and still before the move
// into the start scene; smooth (no frame steps more than the legs' top speed allows)
const L = T.legsOf(goal.dur);
let turns = 0, lastV = 0, worstStep = 0, prev = null;
for (let t = goal.start; t < goal.end; t += 1 / fps) {
  const q = T.travelOf(goal, t - goal.start);
  if (q.v && lastV && Math.sign(q.v) !== Math.sign(lastV)) turns++;
  if (q.v) lastV = q.v;
  if (prev) worstStep = Math.max(worstStep, Math.abs(q.dx - prev.dx));
  ok(q.dx >= -1e-9 && q.dx <= T.MOVE_DX + 1e-9 && near(T.frameAt(t, P, g, tm).pose[0], q.dx, 1e-3), `t=${t.toFixed(3)}: the core at ${q.dx}`);
  prev = q;
}
ok(L.n >= 3 && turns === 2 * L.n - 1, `the core out and back ${L.n} times (${turns} reversals)`);
ok(worstStep <= 1.9 * T.MOVE_DX / L.leg / fps + 1e-6, `the core steps at most ${worstStep.toFixed(2)} mm a frame`);
for (let u = O.parkS; u >= 0; u -= 0.05) { const q = T.travelOf(goal, goal.dur - u); ok(q.dx === 0 && q.v === 0, `parked ${u.toFixed(2)} s before the goal ends`); }
ok(T.travelOf(goal, 0).dx === 0 && T.frameAt(sc("start").start, P, g, tm).pose.every((v) => v === 0), "home at the goal's start and the start scene's");
ok(Math.abs(T.travelOf(goal, tm.hit - goal.start).v) > 50 && Math.abs(T.travelOf(goal, tm.hit + O.drawIn + 1 - goal.start).dx - T.travelOf(goal, tm.hit + O.drawIn - goal.start).dx) > 20,
  "the core moving at the reveal and after it");
// the cables: loose before the word (no lacing drawn, the swing alive), drawn in after it, laced (zeros) from hit + drawIn;
// the swing at most 30 mm (d13 review: ~80 mm swung the loop through the parts beside it)
let swing = 0, bounce = 0, worstJump = 0, kPrev = 0, pc = null;
for (let t = goal.start; t < goal.end; t += 1 / fps) {
  const F = T.frameAt(t, P, g, tm), C = F.cables;
  if (t < tm.hit) {
    ok(C.k === 0 && C.sag === O.sag && F.ghost === 0 && F.f === 0 && F.tip === 0, `t=${t.toFixed(3)}: before the word: loose (k ${C.k}, sag ${C.sag}), no lacing (ghost ${F.ghost})`);
    swing = Math.max(swing, ...C.taps.map((q) => Math.abs(q.x))); bounce = Math.max(bounce, ...C.taps.map((q) => Math.abs(q.y)));
  } else if (t >= tm.hit + O.drawIn) ok(C.k === 1 && C.sag === 0 && C.taps.every((q) => q.x === 0 && q.y === 0) && F.ghost > 0, `t=${t.toFixed(3)}: after the word: laced (k ${C.k})`);
  ok(C.k >= kPrev && C.taps.length === O.taps, `t=${t.toFixed(3)}: k never falls`);
  if (pc) worstJump = Math.max(worstJump, ...C.taps.map((q, i) => Math.abs(q.x - pc.taps[i].x) + Math.abs(q.y - pc.taps[i].y)));
  kPrev = C.k; pc = C;
}
ok(swing >= 8 && swing <= 30 && bounce <= O.sag, `the loose loop swings up to ${swing.toFixed(1)} mm, its sag bounces ${bounce.toFixed(1)} mm (of ${O.sag}) before the word`);
// (no step: at most a damped swing's fastest, 2 pi f A a second, for both modes, + 30 % for the draw-in and the wave's lag)
const fastest = 1.3 * 2 * Math.PI * (swing * require("../web/js/lib/media-anim/media-anim-runtime.min.js").swing.hzOf(O.sway.swayLen) + bounce * O.flap.hz) / fps;
ok(worstJump <= fastest, `the swing moves at most ${worstJump.toFixed(2)} mm a frame (a damped swing's fastest ${fastest.toFixed(2)})`);
// d13 (the maintainer on d12: the cord and sleeve swung on, undamped, while the core stood still): damped springs driven by
// the core's motion along the gantry - the swing dies away within SETTLE_S of the core stopping and scales with the move
const SW = require("../web/js/lib/media-anim/media-anim-runtime.min.js").swing, SETTLE_S = 0.7;   // (d13c: 1.0 -> 0.7, damped 50 % faster)
const settle = SW.settleS(SW.hzOf(O.sway.swayLen), O.sway.zeta + (O.sway.drag || 0)), settleF = SW.settleS(O.flap.hz, O.flap.zeta);
ok(settle <= SETTLE_S + 0.1 && settleF <= SETTLE_S && L.dwell >= SETTLE_S + 0.3, `the swing's envelope at 5 % in ${settle.toFixed(2)} s (the flap's ${settleF.toFixed(2)}), the core still ${L.dwell.toFixed(2)} s at each end`);
// (the stops before the word; the loop: the taps the cable reads to its U-turn, 0.23 s down the cord at 2 m/s, the
// sleeve 0.12 + 0.14 s)
const stops = [];
for (let c = 0; c < L.n; c++) for (const t0 of [c * L.cycle + L.leg, c * L.cycle + 2 * L.leg + L.dwell]) if (goal.start + t0 + L.dwell < tm.hit) stops.push(t0);
let leftX = 0, leftY = 0;
for (const t0 of stops) for (let u = SETTLE_S; u < L.dwell - 1e-6; u += 1 / fps) {
  const C = T.cablesOf(goal, t0 + u, tm), loop = C.taps.filter((_, i) => i * O.tapS <= 0.3 + 1e-9);
  ok(T.travelOf(goal, t0 + u).v === 0, `t=${(t0 + u).toFixed(2)}: the core still`);
  leftX = Math.max(leftX, ...loop.map((q) => Math.abs(q.x))); leftY = Math.max(leftY, ...loop.map((q) => Math.abs(q.y)));
}
ok(stops.length >= 2 && leftX <= 0.05 * swing && leftY <= 0.05 * bounce, `${SETTLE_S} s after each of ${stops.length} stops the loop swings ${leftX.toFixed(2)} mm (of ${swing.toFixed(1)} moving), bounces ${leftY.toFixed(2)} (of ${bounce.toFixed(1)})`);
// linear in the move: half the travel, half the swing; none, none (the sag stays: gravity's)
for (const u of [0.7, 2.9, 4.4, 6.5, 8.0].filter((x) => x < tm.hit - goal.start)) {   // (before the word: d19's at 8.55 s, 2 stops before it; d27's at 6.85 s)
  const A = T.cablesOf(goal, u, tm), B = T.cablesOf(goal, u, tm, { ...O, dx: T.MOVE_DX / 2 }), Z = T.cablesOf(goal, u, tm, { ...O, dx: 0 });
  ok(A.taps.some((q) => Math.abs(q.x) > 1) && A.taps.every((q, i) => near(B.taps[i].x, q.x / 2, 1e-9) && near(B.taps[i].y, q.y / 2, 1e-9)) && Z.taps.every((q) => q.x === 0 && q.y === 0) && Z.sag === O.sag,
    `t=${u}: the swing scales with the core's travel (half: half; none: none)`);
}
ok(!("cables" in T.frameAt(sc("start").start + 0.01, P, g, tm)) && !("cables" in T.frameAt(sc("done").start + 3, P, g, tm)), "the cables' state is the goal's");
// their shape on the reference hose: hanging off it before the word (pinned at both ends, never inside the hose), the
// laced points themselves after; SETTLE_S after each stop, the swing gone from what is drawn (within 3 mm of the
// sag-only shape)
const curveAt = (dx) => H.catmullRom(H.hoseRoute(h, dx, 0).map((p) => p.slice(0, 3)), 12);
const D3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
let hang = 0, worstIn = Infinity, drawnLeft = 0;
const settled = new Set(stops.map((t0) => goal.start + t0 + SETTLE_S));
for (const t of [0.5, 2.2, 3.5, 6.1, 9.3, tm.hit - goal.start - 0.05, tm.hit - goal.start + O.drawIn / 2, tm.hit - goal.start + O.drawIn + 0.5].map((v) => goal.start + v).concat([...settled])) {
  const F = T.frameAt(t, P, g, tm), dx = F.pose[0], curve = curveAt(dx), sh = (q) => [q[0] + dx, q[1], q[2]];
  const cp = H.cordRoute(curve, h, h.cord, sh(h.cord.tip), sh(h.cord.tip2), dx), sp = H.cordRoute(curve, h, h.sleeve, null, null, dx, [0, 0, 0]);
  for (const [w, pts, d, pinX] of [["cord", cp, h.cord.d, h.exit_x], ["sleeve", sp, h.sleeve.d, undefined]]) {
    const lo = SL.looseOf(pts, F.cables, w, { pts: curve, r: h.od / 2, d, trayZ: h.tray_z, pinX }), sl = SL.slackOf(pts, lo);
    ok(lo.length === pts.length && D3(lo[0], pts[0]) < 1e-9 && D3(lo.at(-1), pts.at(-1)) < 1e-9, `t=${t.toFixed(2)} ${w}: pinned at both ends`);
    if (F.cables.k === 0) { hang = Math.max(hang, sl); ok(sl >= 15, `t=${t.toFixed(2)} ${w}: loose, ${sl.toFixed(1)} mm off its laced line`); }
    if (settled.has(t)) {
      const still = SL.looseOf(pts, { ...F.cables, taps: F.cables.taps.map(() => ({ x: 0, y: 0 })) }, w, { pts: curve, r: h.od / 2, d, trayZ: h.tray_z, pinX });
      drawnLeft = Math.max(drawnLeft, SL.slackOf(still, lo));
    }
    if (F.cables.k === 1) ok(sl === 0, `t=${t.toFixed(2)} ${w}: laced (${sl} mm off)`);
    if (F.cables.k < 1) for (const q of lo) for (const c of curve) worstIn = Math.min(worstIn, D3(q, c) - h.od / 2 - d / 2);
  }
}
ok(worstIn >= -0.01, `the loose cables kept out of the hose (nearest ${worstIn.toFixed(2)} mm)`);
ok(drawnLeft <= 3, `${SETTLE_S} s after each stop the drawn cord and sleeve within ${drawnLeft.toFixed(2)} mm of their sag-only shape`);
console.log(`  opening: the reveal ${tm.hit.toFixed(3)} s on "${R.word}"; the core ${L.n} out-and-backs of ${L.cycle.toFixed(2)} s, parked ${O.parkS} s; swing up to ${swing.toFixed(1)} mm, the cables up to ${hang.toFixed(1)} mm off the hose; drawn in over ${O.drawIn} s; ${SETTLE_S} s after a stop the loop ${leftX.toFixed(2)} mm, drawn ${drawnLeft.toFixed(2)} mm`);
});

section("clearance", () => {
// ---- draft 11: clearance (the maintainer: "the lace cord should not merge with adjacent/intersecting objects (including
// itself, other lacing or other objects)"; the white tip may touch). Every close-up frame at 30 fps, the drawn tape as the
// page draws it (a 2 mm round tube, HITCH.tr, through a centripetal Catmull-Rom): two points of tape further apart along
// it than 3 radii at least a diameter apart (one tape: the square knot's ends grow from the clove's, the closing sequence
// from the close-up's model tape - each joined into one); a cable's centre line at least its radius + r away, the hose's
// od / 2 + r, and a knot strand no deeper than the outline it is laid on (rho, + the cables' rise) + r. Tolerances: 0.1 mm
// between tapes only while a pull presses them together (the square knot from SQ.h2, the closing sequence's pulls, the
// tight scene); 0.25 mm on the outline (5-degree bins, a hull's corners: no object there - the hose and cables are
// checked themselves); none on the hose and cables. The model's own tape (run 0, the machine view and the close-up's
// clipped piece) is LR4Hose.lacing's 1.2 mm tape drawn 2 mm round: its turns lie 1.32 mm apart, so it is held to its
// measured numbers here, not to the rule (docs/specs/lacing-tutorial.md "Clearance").
if (!CL) skip("the clearance section");
else {
  const r = T.HITCH.tr, GAP = 2 * r, SNUG = 0.1, OUT = 0.25, CR = (pts, nn = 4) => CV.spline(pts, nn);   // (= lacing/curves.js spline)
  const dst = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  // a piece's first L mm (of its polyline's length), through the spline, every 0.5 mm -> [{ p, s }]
  const sampleOf = (pts, L) => CL.sample(pts, L, { n: 4, step: 0.5 });
  // a point -> { a, w, r } in a close-up's frame (walked along the hose from the stitch: never onto the other run)
  const flatIn = (D, p) => {
    let sv = D.s + ((p[0] - D.c[0]) * D.t[0] + (p[1] - D.c[1]) * D.t[1] + (p[2] - D.c[2]) * D.t[2]);
    const dt = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    for (let k = 0; k < 8; k++) { const c = D.line.at(sv); sv += dt(p.map((v, i) => v - c[i]), D.line.tan(sv)); }
    const ta = D.line.tan(sv), u0 = D.u.map((v, i) => v - ta[i] * dt(D.u, ta)), ul = Math.hypot(...u0), ua = u0.map((v) => v / ul);
    const va = [ta[1] * ua[2] - ta[2] * ua[1], ta[2] * ua[0] - ta[0] * ua[2], ta[0] * ua[1] - ta[1] * ua[0]], c = D.line.at(sv), rr = p.map((v, i) => v - c[i]);
    return { a: sv - D.s, w: Math.atan2(dt(rr, va), dt(rr, ua)) * D.R0, r: Math.hypot(...rr) };
  };
  // a polyline's distance to p, if under R (a grid of its segments; media-mesh clearance.nearOf)
  const nearOf = CL.nearOf;
  // what a close-up's point measures - its flat place (flatIn) and each cable's distance - kept per close-up (its D and
  // cables) by the point's exact coordinates: the same point, the same bits (V2, 2026-11-10: the closing's model tape and
  // the square knot's clove come back in every frame measured, a held run's samples in the next run's; 59 % of 1.1 M)
  const MEMO = new Map();
  const measure = (D, cabs, p) => ({ f: flatIn(D, p), cab: cabs.map((cb) => cb.near(p, cb.rad + r + 0.5)) });
  const measureOf = (D, cabs, p) => {
    if (p.length !== 3 || Object.is(p[0], -0) || Object.is(p[1], -0) || Object.is(p[2], -0)) return measure(D, cabs, p);   // (-0: Map and === take it for 0)
    let m = MEMO.get(D);
    if (!m) MEMO.set(D, (m = { cabs, x: new Map() }));
    if (m.cabs !== cabs) return measure(D, cabs, p);
    let row = m.x.get(p[0]);
    if (!row) m.x.set(p[0], (row = []));
    for (let i = 0; i < row.length; i += 3) if (row[i] === p[1] && row[i + 1] === p[2]) return row[i + 2];
    const v = measure(D, cabs, p);
    row.push(p[1], p[2], v);
    return v;
  };
  // tapes: [[{ name, pts, L, model }]] (a tape's pieces end to start) -> the worst of each kind: { kind, d, need, tol, at }
  function clearance(tapes, cabs, D, tip, tolTape, hoseNear) {
    const S = [], worst = {};
    tapes.forEach((pieces, ti) => {
      let s0 = 0;
      for (const pc of pieces) {
        if (!pc.pts || pc.pts.length < 2 || !(pc.L > 0)) continue;
        const sm = pc.sampled || sampleOf(pc.pts, pc.L);
        sm.forEach((q, qi) => { const t0 = typeof tip === "function" ? tip(ti, pieces.indexOf(pc), qi, q) : (!tip || dst(q.p, tip.p) > tip.r ? null : undefined); if (t0 !== undefined) S.push({ p: q.p, s: s0 + q.s, ls: q.s, t: ti, piece: pc.name, model: pc.model, t0 }); });
        s0 += sm[sm.length - 1].s;
      }
    });
    const note = (kind, d, need, tol, a, b) => { const w = worst[kind]; if (!w || d - need < w.d - w.need) worst[kind] = { kind, d, need, tol, a, b }; };
    // (two points of one tape within 3 radii along it are its own neighbours, not a clearance)
    CL.pairs(S, GAP, (q, o, d) => note(q.model && o.model ? "model / model" : "tape / tape", d, GAP, tolTape, q, o),
      { cell: 2.5, skip: (q, o) => o.t === q.t && Math.abs(o.s - q.s) <= 3 * r });
    for (const q of S) {
      const kind = (what) => (q.model ? "model / " : "tape / ") + what, M = D ? measureOf(D, cabs, q.p) : null;
      cabs.forEach((cb, ci) => { const need = cb.rad + r, d = M ? M.cab[ci] : cb.near(q.p, need + 0.5); if (d < need) note(kind(cb.name), d, need, 0, q); });
      if (D) {
        const f = M.f, th = f.w / D.R0;
        if (f.r < h.od / 2 + r) note(kind("hose"), f.r, h.od / 2 + r, 0, q);
        const need = D.rho(th) + (D.rise ? D.rise(f.a, th) : 0) + r;
        if (!q.model && !(q.piece === "closing" && q.ls < 8) && f.r < need) note("tape / outline", f.r, need, OUT, q);
      } else if (hoseNear) { const d = hoseNear(q.p, h.od / 2 + r + 0.5); if (d < h.od / 2 + r) note(kind("hose"), d, h.od / 2 + r, 0, q); }
    }
    return Object.values(worst);
  }
  const cabsOf = (D) => [["cord", D.cord, h.cord.d], ["sleeve", D.sleeve, h.sleeve.d]].filter((c) => c[1].length > 1).map(([name, pts, d]) => ({ name, near: nearOf(CR(pts, 8)), rad: d / 2 }));
  const CABS = Object.fromEntries(Object.entries(P.details).map(([k, D]) => [k, cabsOf(D)]));
  const KC = T.SHOTS.knots.closing, pulls = T.stepsOf(KC).filter((q) => q.op === "pull");
  // (2026-11-09, the same rows and worst cases, 2.5x faster: a frame whose strands, tolerance and close-up are the frame
  // before's and whose only change is its last drawn piece growing - drawn on, or held - only adds points to what is
  // checked (the samples are a prefix of the longer draw's; nothing drawn moves), so a run of them is measured once, at its
  // last frame, on the union of what each frame checked: a sample counts if a frame of the run had it drawn and outside
  // that frame's tip; a row's t is the first frame with both its samples. Frames whose points move are measured each.
  // Seeded defects - a strand into the bundle, through the clove, in a pull - fail the same way before and after:
  // .cache/velocity/proto_square.js)
  const t0c = Date.now();
  // a run: frames with the same close-up, tolerance and strand points, only the last drawn piece growing
  const shapeOf = (x) => x.shape || (x.shape = JSON.stringify([x.did, x.snug, x.tapes.map((pcs) => pcs.map((pc) => pc.pts))]));
  const growsOnly = (a, b) => {                      // b is a's frame with only its last drawn piece longer (or the same)
    if (shapeOf(a) !== shapeOf(b)) return false;
    const La = a.tapes.flat().map((pc) => pc.L), Lb = b.tapes.flat().map((pc) => pc.L);
    const last = Lb.reduce((k, v, i) => (v > 0 ? i : k), -1);
    return La.every((v, i) => (i === last ? Lb[i] >= v : Lb[i] === v));
  };
  // a close-up frame -> what it checks: { t, scene, did, D, tapes, snug, tip } (null: no close-up drawn)
  const frameOf = (f) => {
    const t = f / fps, { scene, local } = T.sceneAt(t, tm), did = T.DETAIL_OF[scene.id];
    if (!did) return null;
    const F = T.frameBase(t, P, g, tm), d = F.detail, D = P.details[did], w = T.workAt(scene, local);
    if (!d) return null;
    let tapes, snug;
    if (d.hitch) { tapes = [[{ name: "hitch", pts: d.hitch.pts, L: d.hitch.draw }]]; snug = scene.id === "tight"; }
    else if (did === "close") {
      const tp = T.tapeTo(D, KC), u = KC.scenes.indexOf(scene.id) + w;
      tapes = [[{ name: "model", pts: tp, L: Infinity, model: true }, ...d.strands.map((q) => ({ name: "closing", pts: q.pts, L: q.draw }))]];
      // (a pull's window: from its start to its scene's end; lockstitch 8's - shown tied, pulled in the close's first 0.7 s -
      // to its own end)
      snug = pulls.some((p) => u >= p.from && u < (p.from === 0 ? p.to : Math.floor(p.from) + 1));
    } else if (d.strands.length === 1) { tapes = [[{ name: "clove", pts: d.strands[0].pts, L: d.strands[0].draw }]]; snug = w >= T.SHOTS.knots.clove.steps.find((q) => q.op === "pull").from; }
    else {
      const sx = T.knotView(D, "square").sx, iA = sx > 0 ? 1 : 2, cut = (q) => sampleOf(q.pts, q.draw).map((x) => x.p);
      const A = cut(d.strands[iA]).reverse(), Bp = cut(d.strands[3 - iA]);
      // (the ends are already 0.5 mm samples: used as they are - re-splined, they were sampled every 0.125 mm, 8,042 points
      // a frame and half the section's time; the worst tape / tape moves 1.968443 -> 1.968489 mm)
      const samp = (pts) => { let s = 0; return pts.map((p, i) => ({ p, s: i ? (s += dst(p, pts[i - 1])) : 0 })); };
      tapes = [[{ name: "short end", pts: A, L: Infinity, sampled: samp(A) }, { name: "clove", pts: d.strands[0].pts, L: d.strands[0].draw }, { name: "long end", pts: Bp, L: Infinity, sampled: samp(Bp) }]];
      snug = w >= T.SQ.h2;
    }
    const tip = F.tip > 0.01 && F.tipAt ? { p: F.tipAt, r: 2 * T.HITCH.tr } : null;   // (the strand's diameter, not the ball's)
    const x = { t, scene: scene.id, did, D, tapes, snug, tip };
    return x;
  };
  // a run starts at a frame that does not only grow the measured frame before it (the serial loop's flush), so a scene's
  // frames split anywhere: a task fr[a..b) measures the runs that start in it, each to its end (past b if it goes on),
  // and skips the frames of a run begun before a (the task before measures them) -> { rows, frames, held, measured }
  // (R12, 2026-11-10: a task in a worker thread or here; the tasks' rows in their order are the serial loop's)
  const taskRows = (fr, a, b) => {
    const rows = [];
    let frames = 0, held = 0, measured = 0, runF = [], prev = null, on = false;
    const flush = () => {
      if (!runF.length) return;
      const e = runF[runF.length - 1];
      // per frame, per piece: how many samples it has drawn (a prefix of the last frame's)
      // (the run's frames have the same points, so a piece drawn to the same length has the same samples: counted once)
      const nL = new Map(), countOf = (ti, pi, pc) => {
        if (pc.sampled) return pc.sampled.length;
        const k = `${ti} ${pi} ${pc.L}`;
        if (!nL.has(k)) nL.set(k, sampleOf(pc.pts, pc.L).length);
        return nL.get(k);
      };
      const nOf = runF.map((x) => x.tapes.map((pcs, ti) => pcs.map((pc, pi) => (pc.pts && pc.pts.length >= 2 && pc.L > 0 ? countOf(ti, pi, pc) : 0))));
      const keep = (ti, pi, qi, q) => {
        for (let j = 0; j < runF.length; j++) if (qi < nOf[j][ti][pi] && (!runF[j].tip || dst(q.p, runF[j].tip.p) > runF[j].tip.r)) return runF[j].t;
        return undefined;
      };
      measured++;
      for (const q of clearance(e.tapes, CABS[e.did], e.D, keep, e.snug ? SNUG : 0)) rows.push(Object.assign(q, { scene: e.scene, t: Math.max(q.a.t0, q.b ? q.b.t0 : -Infinity), did: e.did }));
      runF = [];
    };
    for (let i = a - 1; i >= 0 && !prev; i--) prev = frameOf(fr[i]);
    for (let i = a; i < fr.length; i++) {
      const x = frameOf(fr[i]);
      if (!x) continue;
      const starts = !prev || !(prev.scene === x.scene && growsOnly(prev, x));
      prev = x;
      if (!on) { if (i >= b) break; if (!starts) continue; on = true; }
      else if (starts) { if (i >= b) break; flush(); }
      else held++;
      frames++;
      runF.push(x);
    }
    flush();
    return { rows, frames, held, measured };
  };
  // the close-up frames by scene, in order (a run never spans scenes), cut into tasks of TASK frames (in process: a scene)
  const env = process.env.CLEARANCE_JOBS, nW = WK || process.argv.includes("--serial") ? 0
    : Math.max(0, Math.min(require("os").cpus().length - 1, env === undefined || env === "" ? 8 : Math.floor(+env) || 0));
  const scenes = [], tasks = [], TASK = WK ? WK.task : nW ? Math.max(1, Math.floor(+process.env.CLEARANCE_TASK) || 15) : Infinity;
  for (let f = 0; f <= Math.round(tm.duration * fps); f++) {
    const id = T.sceneAt(f / fps, tm).scene.id;
    if (!T.DETAIL_OF[id]) continue;
    if (!scenes.length || scenes[scenes.length - 1].id !== id) scenes.push({ id, f: [] });
    scenes[scenes.length - 1].f.push(f);
  }
  // (were an id to come back after another scene, all the frames in one list: taskRows breaks the runs at the scenes)
  if (new Set(scenes.map((q) => q.id)).size !== scenes.length) scenes.splice(0, scenes.length, { id: "all", f: scenes.flatMap((q) => q.f) });
  for (const s of scenes) for (let a = 0; a < s.f.length; a += TASK) tasks.push({ s, a, b: Math.min(a + TASK, s.f.length) });
  // a shared queue, each scene's last tasks first (more tape drawn, the longer to measure): ctl[0] the next in that
  // order, ctl[1 + k] set once task k's rows are posted
  const order = tasks.map((q, k) => k).sort((i, j) => tasks[j].a - tasks[i].a || i - j);
  const take = (ctl, out) => { for (let i; (i = Atomics.add(ctl, 0, 1)) < order.length;) out(order[i]); };
  const rowsOf = (k) => taskRows(tasks[k].s.f, tasks[k].a, tasks[k].b);
  if (WK) {                                          // a worker: its tasks' rows to the main thread, no checks
    const ctl = new Int32Array(WK.ctl), set = (k) => { Atomics.store(ctl, 1 + k, 1); Atomics.notify(ctl, 1 + k); };
    let k = -1;
    try { take(ctl, (k_) => { k = k_; WK.port.postMessage({ k, r: rowsOf(k) }); set(k); }); }
    catch (e) { WK.port.postMessage({ k, error: String((e && e.stack) || e) }); if (k >= 0) set(k); }
    return;
  }
  const ctl = new Int32Array(new SharedArrayBuffer(4 * (1 + tasks.length))), res = new Array(tasks.length), ports = [];
  for (let i = 0; i < nW; i++) {
    const ch = new WT.MessageChannel();
    new WT.Worker(__filename, { workerData: { clearance: { ctl: ctl.buffer, port: ch.port2, task: TASK } }, transferList: [ch.port2] }).unref();
    ports.push(ch.port1);
  }
  take(ctl, (k) => { res[k] = rowsOf(k); });
  let err = null;
  for (let k = 0; k < tasks.length; k++) {
    if (res[k]) continue;
    if (Atomics.wait(ctl, 1 + k, 0, 600e3) === "timed-out") throw new Error(`clearance: no rows from a worker in 600 s (${tasks[k].s.id} frames ${tasks[k].a}-${tasks[k].b})`);
    for (const pt of ports) for (let m; (m = WT.receiveMessageOnPort(pt));) if (m.message.error) err = err || m.message.error; else res[m.message.k] = m.message.r;
    if (err) throw new Error(`clearance: a worker failed: ${err}`);
  }
  ports.forEach((pt) => pt.close());
  const rows = [];
  let frames = 0, held = 0, measured = 0;
  for (const r of res) { for (const q of r.rows) rows.push(Object.assign(q, { D: P.details[q.did] })); frames += r.frames; held += r.held; measured += r.measured; }
  const fl = (q) => { const f_ = flatIn(q.D, q.a.p); return `a ${f_.a.toFixed(1)} w ${f_.w.toFixed(1)}`; };
  const bad = rows.filter((q) => !/^model/.test(q.kind) && q.d < q.need - q.tol - 1e-9);
  const worstBy = (list) => { const m = new Map(); for (const q of list) { const k = q.scene + q.kind; if (!m.has(k) || q.d - q.need < m.get(k).d - m.get(k).need) m.set(k, q); } return [...m.values()].sort((a, b) => (a.d - a.need) - (b.d - b.need)); };
  for (const q of worstBy(bad).slice(0, 8)) ok(false, `clearance: ${q.scene} t ${q.t.toFixed(2)} ${q.kind} ${q.d.toFixed(2)} mm, want ${q.need.toFixed(2)}${q.tol ? ` less ${q.tol}` : ""} (${fl(q)})`);
  ok(frames > 1000, `clearance: ${frames} close-up frames`);
  // the model's tape: run 0 on the machine view, whole, and the close-up's piece - held to what it measures (draft 11)
  const main = clearance([[{ name: "run 0", pts: P.pts, L: P.total, model: true }]], [["cord", P.cab.cord], ["sleeve", P.cab.sleeve]].filter((c) => c[1])
    .map(([name, pts]) => ({ name, near: nearOf(pts.map((p) => p.slice(0, 3))), rad: h[name].d / 2 })), null, null, 0, nearOf(P.curve, 20));
  const MODEL = { "model / model": 0.96, "model / hose": 0.47, "model / cord": 0.84, "model / sleeve": 1.03 };   // (mm short, at most: draft 11 measured 0.94, 0.45, 0.82, 1.01)
  for (const q of main.concat(rows.filter((x) => /^model/.test(x.kind)))) ok(q.need - q.d <= (MODEL[q.kind] || 0) + 1e-9, `clearance: the model's tape ${q.kind} ${q.d.toFixed(2)} mm, want ${q.need.toFixed(2)} less at most ${MODEL[q.kind] || 0} (LR4Hose.lacing)`);
  const top = worstBy(rows.filter((q) => !/^model/.test(q.kind)))[0];
  console.log(`  clearance: ${frames} close-up frames (${measured} measured: ${held} only drew on or held the frame before) in ${Date.now() - t0c} ms; nearest ${top ? `${top.d.toFixed(2)} mm of ${top.need.toFixed(2)} (${top.scene} ${top.t.toFixed(2)} ${top.kind})` : "all clear"}; the model's tape at worst ${main.map((q) => `${q.kind.slice(8)} ${(q.need - q.d).toFixed(2)}`).join(", ")} mm short`);
}
});

section("stills", () => {
// ---- the stills round's rules as numbers (velocity R2, 2026-11-10): what a stills round and its contact sheet checked,
// on frameAt and the page's camera, every frame at 30 fps, no browser. 720p, the cue as the page styles it (lacing_anim.js
// overlay: 4.2 vh type, 0.35 / 0.9 em padding, 6 % up, centred, at most 90 % wide; a character 0.6 em, generous). What
// still needs eyes or the page (the renderer, the machine's meshes in the way, a knot against its figure, the reveal's
// look, the credits' composition, colours) stays in one stills.mjs run before a draft goes to the maintainer.
{
  const t0s = Date.now(), A = g.aspect, PX = 720, CO = T.CO, CAM = require("../web/js/lib/media-anim/media-anim-runtime.min.js").camera;
  const TAPE_D = 2 * T.HITCH.tr, DOT = CO.dot * PX, EM = 0.042, N = Math.round(tm.duration * fps);
  // (draft 11's worst: tape 12.6 px, knot 0.73, bracket 0.36 / 11.3 px, a card 6.2 % / 0.196, the live end 0.23 s; the
  // rules, what each replaces and the seeded defects that fail them: docs/specs/lacing-tutorial.md "f-h. Checks")
  const LIM = { tapePx: 8, knotH: 0.4, bracketH: 0.2, bracketPx: 6, cover: 0.12, coverF: 0.15, endOff: 0.3, enclosed: 0.25 };
  const d3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  // a polyline's first L mm (its drawn part)
  const drawnOf = (pts, L) => {
    if (!(L > 0)) return [];
    const out = [pts[0]];
    for (let i = 1, c = 0; i < pts.length; i++) { const d = d3(pts[i], pts[i - 1]); if (c + d >= L) { out.push(pts[i - 1].map((v, q) => v + (pts[i][q] - v) * (L - c) / (d || 1))); break; } c += d; out.push(pts[i]); }
    return out;
  };
  // the tape drawn: the main tape, the lock's hitch, or the knot strands (+ the closing close-up's own model tape, whole)
  const closeTape = T.tapeTo(P.details.close, T.SHOTS.knots.closing);
  const inkOf = (F) => (F.detail ? (F.detail.hitch ? [drawnOf(F.detail.hitch.pts, F.detail.hitch.draw)] : (F.detail.strands || []).map((s) => drawnOf(s.pts, s.draw)).concat(F.detail.id === "close" && F.detail.frac > 0 ? [closeTape] : [])) : [drawnOf(P.pts, F.f * P.total)]);
  // the ray from o along u (px) meets the segment a-b at this distance (px), or Infinity
  const rayHit = (o, u, a, b) => { const e = [b.x - a.x, b.y - a.y], den = u[0] * e[1] - u[1] * e[0]; if (Math.abs(den) < 1e-12) return Infinity; const w = [a.x - o.x, a.y - o.y], s = (w[0] * e[1] - w[1] * e[0]) / den, k = (w[0] * u[1] - w[1] * u[0]) / den; return s >= 0 && k >= 0 && k <= 1 ? s : Infinity; };
  const seg2 = (p, a, b) => { const ab = [b.x - a.x, b.y - a.y], L = ab[0] ** 2 + ab[1] ** 2, k = L ? Math.max(0, Math.min(1, ((p.x - a.x) * ab[0] + (p.y - a.y) * ab[1]) / L)) : 0; return Math.hypot(p.x - a.x - ab[0] * k, p.y - a.y - ab[1] * k); };
  const cueBox = (txt) => { const w = Math.min(0.9 * A, (txt.length * 0.6 + 1.8) * EM); return { w, x0: 0.5 - w / A / 2, x1: 0.5 + w / A / 2, y0: 0.94 - 1.9 * EM, y1: 0.94 }; };
  const inFrame = (q) => q.z > 0 && q.x >= 0 && q.x <= 1 && q.y >= 0 && q.y <= 1;
  const underCue = (F, q, B) => F.cueO > 0.5 && q.x >= B.x0 && q.x <= B.x1 && q.y >= B.y0 && q.y <= B.y1;
  const sbCue = new Map(sb.scenes.map((s) => [s.id, s.cue]));
  const COS = T.calloutsOf(tm), TAPE_ANCHOR = (a) => a !== "bracket" && a !== "breakout" && a !== "ghost_close";   // (ghost_close: the opening's lacing is its ghost, no tape drawn - d14)
  const W = { tape: { px: Infinity }, knot: {}, focus: [], endRun: { s: 0 }, sight: { opaque: [], see: 0, n: 0 }, cover: {}, anchor: {} };
  const frames = [];                                 // (the stills samples' frames, kept for "differ")
  const samples = new Set([tm.still].concat(...tm.scenes.map((s) => [s.start + 0.7, s.start + s.dur / 2])).map((t) => Math.round(t * fps)));
  const endRun = new Map();                          // (scene -> frames the live end has been off screen or under the cue)
  for (let fi = 0; fi < N; fi++) {
    const t = fi / fps, F = T.frameAt(t, P, g, tm), pr = T.projector(F.cam, g), did = T.DETAIL_OF[F.scene];
    if (samples.has(fi)) frames.push({ t, F });
    if (F.dip >= 0.5) { endRun.set(F.scene, 0); continue; }
    const B = cueBox(F.cue);
    // the action point in frame and clear of the cue at every frame (framing: 5 % inside at key times)
    if (F.focus) { const q = pr(F.focus); if (!inFrame(q) || underCue(F, q, B)) W.focus.push(`${F.scene} ${t.toFixed(2)} (${q.x.toFixed(3)}, ${q.y.toFixed(3)})`); }
    // the live end, once shown, off screen or under the cue at most endOff s at a time (it goes round the bundle)
    if (F.tip > 0.5 && F.tipAt && !F.tipCut) {      // (d14n review: an offcut takes it out of shot)
      const q = pr(F.tipAt), off = !inFrame(q) || underCue(F, q, B), k = off ? (endRun.get(F.scene) || 0) + 1 : 0;
      endRun.set(F.scene, k);
      if (k / fps > W.endRun.s) W.endRun = { s: k / fps, at: `${F.scene} ${t.toFixed(2)}` };
    } else endRun.set(F.scene, 0);
    // a close-up: the tape's width at the action point's depth; nothing opaque in the way of the action point (HT-5:
    // the page's occluder() on the close-up's own hose, cord and sleeve; the machine views stay with occluder())
    if (did && F.focus) {
      const px = CAM.sizePx(TAPE_D, CAM.depthOf(F.cam, F.focus), g, PX);
      if (px < W.tape.px) W.tape = { px, at: `${F.scene} ${t.toFixed(2)}` };
      if (CL && CL.sight) {
        const D = P.details[did], tubes = [["hose", D.hose, h.od / 2], ["cord", D.cord, h.cord.d / 2], ["sleeve", D.sleeve, h.sleeve.d / 2]]
          .filter(([k]) => F.layers[k] > 0.01).map(([name, pts, r]) => ({ name, pts, r }));
        const hit = CL.sight(F.cam[0], F.focus, tubes);
        W.sight.n++;
        if (hit && F.layers[hit.name] >= 0.6) W.sight.opaque.push(`${F.scene} ${t.toFixed(2)} ${hit.name} at ${hit.at.toFixed(1)} of ${hit.to.toFixed(1)} mm`);
        else if (hit) W.sight.see++;
      } else skip("the close-ups' line of sight (stills)");
    }
    // the callouts: the dot on what it names, the card off the knot being taught
    for (const c of F.callouts) {
      const co = COS.find((q) => q.term === c.term), an = W.anchor[c.term] || (W.anchor[c.term] = { gap: -Infinity, at: "", bad: [] });
      const cv = W.cover[c.term] || (W.cover[c.term] = { share: 0, near: Infinity, tip: 0, at: "" });
      const ink = inkOf(F), S = (p) => { const q = pr(p); return { x: q.x * A * PX, y: q.y * PX, z: q.z }; };
      if (TAPE_ANCHOR(co.anchor)) {                  // the dot's edge within a tape's width of the drawn tape's, as seen
        const a = S(T.anchorOf(co.anchor, F, P, tm));
        let gap = Infinity, wpx = 0;
        for (const L of ink) for (let i = 1; i < L.length; i++) {
          const p = S(L[i - 1]), q = S(L[i]);
          if (p.z <= 0 || q.z <= 0) continue;
          const half = CAM.sizePx(TAPE_D, (p.z + q.z) / 2, g, PX) / 2, d = seg2(a, p, q) - half - DOT;
          if (d < gap) { gap = d; wpx = 2 * half; }
        }
        // (or inside the knot: the square knot's dot sits in the middle of its bights, 47 px from their edges but drawn
        // tape within 0.21 of the height in each of 8 directions)
        let enc = 0;
        if (gap > wpx) for (let k = 0; k < 8; k++) {
          const u = [Math.cos(k * Math.PI / 4), Math.sin(k * Math.PI / 4)];
          let m = Infinity;
          for (const L of ink) for (let i = 1; i < L.length; i++) { const p = S(L[i - 1]), q = S(L[i]); if (p.z > 0 && q.z > 0) m = Math.min(m, rayHit(a, u, p, q)); }
          enc = Math.max(enc, m / PX);
        }
        const over = gap <= wpx ? gap - wpx : enc <= LIM.enclosed ? 0 : gap - wpx;   // (<= 0: on it)
        if (!(over <= an.gap)) { an.gap = over; an.at = `${t.toFixed(2)}: ${Number.isFinite(gap) ? gap.toFixed(0) : "no tape"} px past the tape's edge (the tape ${wpx.toFixed(0)} px), not inside the knot (a direction with no tape for ${Number.isFinite(enc) ? enc.toFixed(2) : "ever"} of the height)`; }
      } else if (co.anchor === "bracket" && !(F.bracket.opacity >= 0.99 && F.bracket.scale >= 0.99)) an.bad.push(`${t.toFixed(2)} bracket ${F.bracket.opacity.toFixed(2)} / ${F.bracket.scale.toFixed(2)}`);
      else if (co.anchor === "breakout" && !(F.layers.sleeve >= 0.5)) an.bad.push(`${t.toFixed(2)} sleeve ${F.layers.sleeve}`);
      // the card: at most cover of the drawn tape on screen (by length), none within coverF of the action point, never
      // the live end
      // (2026-11-10: not the faded context - lockstitch 8 under the seal's and tie's cards, drawn at contextO as the model
      // tape it replaced, which this rule does not count either)
      const R = c.card, inR = (m) => m.x >= R.x && m.x <= R.x + R.w && m.y >= R.y && m.y <= R.y + R.h, fo = F.focus && pr(F.focus);
      const faded = F.detail && F.detail.contextO < 0.5, inkC = faded ? (F.detail.strands || []).map((q) => {
        if (!(q.ctx > 0)) return drawnOf(q.pts, q.draw);
        const L = drawnOf(q.pts, q.draw), keep = [];
        for (let i = 0, cc = 0; i < L.length; i++) { if (i) cc += d3(L[i], L[i - 1]); if (cc >= q.ctx) keep.push(L[i]); }
        return keep;
      }) : ink;
      let all = 0, under = 0;
      for (const L of inkC) for (let i = 1; i < L.length; i++) {
        const a = pr(L[i - 1]), b = pr(L[i]), m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        if (a.z <= 0 || b.z <= 0 || m.x < 0 || m.x > 1 || m.y < 0 || m.y > 1) continue;
        const len = Math.hypot((b.x - a.x) * A, b.y - a.y);
        all += len;
        if (inR(m)) { under += len; if (fo && fo.z > 0) cv.near = Math.min(cv.near, Math.hypot((m.x - fo.x) * A, m.y - fo.y)); }
      }
      if (all && under / all > cv.share) { cv.share = under / all; cv.at = t.toFixed(2); }
      if (F.tip > 0.5 && F.tipAt && !F.tipCut && inR(pr(F.tipAt))) cv.tip++;
    }
  }
  // the knot's size: the drawn knot at its scene's work end spans knotH of the frame's height or more (HT-1: it fills
  // the close-up); the bracket, once shown, bracketH of the height and bracketPx wide
  for (const s_ of tm.scenes.filter((x) => T.DETAIL_OF[x.id])) {
    const t = s_.end - T.SETTLE, F = T.frameAt(t, P, g, tm), pr = T.projector(F.cam, g);
    const qs = inkOf(F).flat().map(pr).filter((q) => q.z > 0).map((q) => [Math.min(Math.max(q.x, 0), 1) * A, Math.min(Math.max(q.y, 0), 1)]);
    const ext = qs.length ? Math.max(Math.max(...qs.map((q) => q[0])) - Math.min(...qs.map((q) => q[0])), Math.max(...qs.map((q) => q[1])) - Math.min(...qs.map((q) => q[1]))) : 0;
    W.knot[s_.id] = ext;
    ok(ext >= LIM.knotH, `stills ${s_.id} ${t.toFixed(2)}: the drawn knot spans ${ext.toFixed(2)} of the frame's height (at least ${LIM.knotH})`);
  }
  const spc = tm.scenes.find((s) => s.id === "spacing");
  let brk = { h: Infinity, px: Infinity };
  for (let fi = Math.ceil(spc.start * fps); fi < spc.end * fps; fi += 3) {
    const F = T.frameAt(fi / fps, P, g, tm);
    if (F.bracket.opacity < 0.99 || F.dip >= 0.5) continue;
    const pr = T.projector(F.cam, g), a = pr(P.bracket.pts[0]), b = pr(P.bracket.pts[P.bracket.pts.length - 1]);
    brk = { h: Math.min(brk.h, Math.hypot((b.x - a.x) * A, b.y - a.y)), px: Math.min(brk.px, CAM.sizePx(3, Math.max(a.z, b.z), g, PX)) };
  }
  ok(brk.h >= LIM.bracketH && brk.px >= LIM.bracketPx, `stills spacing: the bracket spans ${brk.h.toFixed(2)} of the height, ${brk.px.toFixed(1)} px wide (at least ${LIM.bracketH}, ${LIM.bracketPx})`);
  ok(W.tape.px >= LIM.tapePx, `stills: the tape ${W.tape.px.toFixed(1)} px wide at the action point (${W.tape.at}; at least ${LIM.tapePx} at 720p)`);
  ok(!W.focus.length, `stills: the action point off screen or under the cue at ${W.focus.length} frames (${W.focus.slice(0, 3).join(", ")})`);
  ok(W.endRun.s <= LIM.endOff + 1e-9, `stills: the live end off screen or under the cue ${W.endRun.s.toFixed(2)} s in a row (${W.endRun.at}; at most ${LIM.endOff})`);
  ok(!W.sight.opaque.length, `stills: something opaque in the way of the action point at ${W.sight.opaque.length} close-up frames (${W.sight.opaque.slice(0, 3).join("; ")})`);
  for (const co of COS) {
    const an = W.anchor[co.term], cv = W.cover[co.term];
    ok(an && cv, `stills ${co.term}: never on screen`);
    if (!an) continue;
    if (TAPE_ANCHOR(co.anchor)) ok(an.gap <= 0, `stills ${co.term}: the dot is off the drawn tape at ${an.at} (at most a tape's width off, or tape within ${LIM.enclosed} of the height all round)`);
    else ok(!an.bad.length, `stills ${co.term}: its ${co.anchor} not shown under the dot at ${an.bad.slice(0, 3).join(", ")}`);
    ok(cv.share <= LIM.cover && cv.near >= LIM.coverF && !cv.tip, `stills ${co.term}: the card covers ${(100 * cv.share).toFixed(1)} % of the drawn tape on screen (${cv.at}; at most ${100 * LIM.cover}), tape ${cv.near.toFixed(3)} of the height from the action point (at least ${LIM.coverF}), the live end at ${cv.tip} frames`);
  }
  // the stills.mjs canvas rules at its samples (each scene's start + 0.7 and middle, the still): the cue is the scene's
  // storyboard line and fits one row; consecutive samples differ (no frozen picture), and the confirm scene's do too
  const key = (F) => JSON.stringify(Object.assign({}, F, { tt: 0 }));
  frames.forEach(({ t, F }, i) => {
    ok(F.cue === sbCue.get(F.scene), `stills ${t.toFixed(2)}: the cue "${F.cue}" is not ${F.scene}'s "${sbCue.get(F.scene)}"`);
    if (i) ok(key(F) !== key(frames[i - 1].F), `stills ${t.toFixed(2)}: the same picture as ${frames[i - 1].t.toFixed(2)}`);
  });
  for (const s_ of tm.scenes) { const w = cueBox(s_.cue).w; ok(w < 0.9 * A, `stills ${s_.id}: the cue "${s_.cue}" ${(w * PX).toFixed(0)} px wide at 720p, over 90 % of the frame (${(0.9 * A * PX).toFixed(0)})`); }
  const conf = [];
  for (let t = done.start + T.TOKENS.slow; t < done.start + done.body; t += 1) conf.push(JSON.stringify(T.frameAt(t, P, g, tm).pose));
  ok(conf.every((p, i) => !i || p !== conf[i - 1]), `stills done: the pose stands still between two of its ${conf.length} samples`);
  const worstCue = Math.max(...tm.scenes.map((s_) => cueBox(s_.cue).w)) * PX;
  console.log(`  stills: ${N} frames in ${Date.now() - t0s} ms; tape at least ${W.tape.px.toFixed(1)} px (${W.tape.at}); knots ${Object.entries(W.knot).map(([k, v]) => `${k} ${v.toFixed(2)}`).join(", ")} of the height; bracket ${brk.h.toFixed(2)}, ${brk.px.toFixed(1)} px; live end off at most ${W.endRun.s.toFixed(2)} s (${W.endRun.at}); sight ${W.sight.n} close-up frames, ${W.sight.see} past a see-through hose; dots ${COS.map((co) => `${co.term} ${TAPE_ANCHOR(co.anchor) && W.anchor[co.term] ? W.anchor[co.term].gap.toFixed(0) : "ok"}`).join(", ")} px; cards (tape covered, nearest it to the action point) ${COS.map((co) => W.cover[co.term] ? `${(100 * W.cover[co.term].share).toFixed(1)}% ${Number.isFinite(W.cover[co.term].near) ? W.cover[co.term].near.toFixed(2) : "-"}` : "-").join(", ")}; widest cue ${worstCue.toFixed(0)} px; ${frames.length} samples`);
}
});

section("transcript", () => {
// ---- the transcript (docs/specs/lacing-tutorial.transcript.json: node tools/lacing_voice.js transcript) is current ----
const tr = JSON.parse(fs.readFileSync(path.join(ROOT, "docs", "specs", "lacing-tutorial.transcript.json"), "utf8"));
ok(tr.entries.length === tm.scenes.length && near(tr.duration_s, tm.duration, 1e-3), "transcript: entries / duration");
for (const [i, e] of tr.entries.entries()) {
  const s = tm.scenes[i], raw = sb.scenes[i];
  ok(e.index === i && e.id === s.id && near(e.t_start, s.start, 1e-3) && near(e.t_end, s.end, 1e-3) && e.caption === raw.cue && e.spoken === T.spoken(raw.narration),
    `transcript entry ${i} (${e.id}) is stale`);
  const cues = T.sfxAt(tm).filter((q) => q.scene === e.id);
  ok(JSON.stringify((e.cues || []).map((c) => [c.sfx, c.t, c.spoken])) === JSON.stringify(cues.map((q) => ["swipe", +q.t.toFixed(3), false])), `transcript ${e.id}: its sound cues`);
  for (const q of e.numbers) ok(q.source && (q.unit !== "mm" || near(q.in, q.value / 25.4, 0.006)), `transcript ${e.id}: ${JSON.stringify(q)}`);
  ok(JSON.stringify(e.events) === JSON.stringify(T.eventsOf(tm)[i].events), `transcript ${e.id}: its events are stale`);
  ok(JSON.stringify((e.more || []).map((m) => [m.id, m.t_start, m.spoken])) === JSON.stringify(s.lines.slice(1).map((l) => [l.id, +l.at.toFixed(3), l.text])) &&
    (e.more || []).every((m) => m.sources.length), `transcript ${e.id}: its later lines, each cited`);
}
});

const camNote = maxJump === null ? "" : `, camera at most ${(100 * maxJump).toFixed(0)}% of its distance a frame outside the ${cuts} cuts`;
console.log(`  sections (s): ${secTimes.join(", ")}`);
console.log(`${checks - fails}/${checks} checks passed (${n} stitches, tape ${P.total.toFixed(0)} mm, ${tm.duration.toFixed(2)} s${camNote})`);
process.exit(fails ? 1 : 0);
