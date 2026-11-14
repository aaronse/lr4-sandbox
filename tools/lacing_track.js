// The lacing tutorial's tip track for media-anim's body dynamics (MA-11 C1, media-anim docs/bodies.md "Floppy
// motion"): the tape's live end (frameBase's tipAt), its end tangent, the camera's basis and px per mm at the tip's
// depth, at every 30 fps frame plus 120 Hz inside each change of end (jumpsOf .. + shots.tip.slide), the samples
// chosen from the timeline only, never from measured cost (so every machine bakes the same springs).
//   node tools/lacing_track.js [--out FILE] [--shots FILE] [--fps 30] [--dense 120]
//       FILE default .cache/lacing-tutorial/track/lr4-track.json; --shots: the shots drawn from (default data.js's
//       copy, as the golden dump). Prints the samples, the jumps, the cuts and the run time.
// Format (media-anim characters/body/fixtures/README.md): { source, fps, duration, jumps: [[t0, t1]], samples: [{ t,
// p (world mm; null: no tip; with tip 0, where the end is though not shown), tan (unit, the tape's end direction; null:
// no end), right, up, fwd (the camera's unit basis, as media-anim camera.ts projector: up +Z), pxPerMm (at the tip's
// depth, 720 lines; no tip: the camera target's), shot (the first scene of a run with no cut - a change marks a cut),
// tip (opacity 0..1) }] }, numbers to 4 decimals. Across a slide the tangent turns with the tip (the old end's -> the
// new end's, by the slide's own s).
// The samples are web/js/lacing/rider.js's (sampleOf: the page's rider bakes the same track), rounded. The jumps are
// rebuilt there from frame.js jumpsOf's rule (it is not exported: frame.js is a renderer file, so an edit
// would re-key the scene render cache); every sample checks them against frameBase's own tipSlide.
"use strict";
const fs = require("fs"), path = require("path"), { execSync } = require("child_process");
const ROOT = path.join(__dirname, "..");
const T = require("../web/js/lacing_tutorial.js"), H = require("../web/js/hose_route.js");
const RD = require("../web/js/lacing/rider.js");
const { sampleTimes, jumpsOf, shotsOf, tangentOf, basisOf, pointAt, lenOf } = RD;   // (the rider's: web/js/lacing/rider.js)
const r4 = (x) => Math.round(x * 1e4) / 1e4 + 0;   // (+ 0: no -0 in the JSON)
const r4v = (v) => (v ? v.map(r4) : null);

// -> { fixture, stats }
function track(opts = {}) {
  const fps = opts.fps || 30, dense = opts.dense || 120, shots = opts.shots || T.SHOTS;
  const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, "web", "data", "lr4_config.json"), "utf8"));
  const tm = T.timing(), P = T.referencePlan(H, cfg.hose), c = RD.contextOf(P, tm, shots, fps, dense), { spans, J } = c;
  const t0 = process.hrtime.bigint();
  let slideMiss = 0;
  const samples = c.times.map((t) => {
    const s = RD.sampleOf(t, c);
    if (!s.slideOk) slideMiss++;
    return { t: r4(t), p: r4v(s.p), tan: r4v(s.tan), right: r4v(s.right), up: r4v(s.up), fwd: r4v(s.fwd),
      pxPerMm: s.pxPerMm === null ? null : r4(s.pxPerMm), shot: s.shot, tip: r4(s.tip) };
  });
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  if (slideMiss) throw new Error(`lacing_track: ${slideMiss} samples where frameBase's tipSlide disagrees with the jumps rebuilt here (frame.js jumpsOf changed?)`);
  let source = "lr4-sandbox";
  try { source += " " + execSync("git rev-parse --short HEAD", { cwd: ROOT }).toString().trim(); } catch (e) { /* no git: no commit */ }
  const fixture = { source, fps, duration: r4(tm.duration), jumps: spans.map((s) => s.map(r4)), samples };
  return { fixture, stats: { ms, n: samples.length, frames: Math.ceil(tm.duration * fps - 1e-9), jumps: J.length, cuts: new Set(c.shotIds).size - 1 } };
}

if (require.main === module) {
  const args = process.argv.slice(2), flag = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
  const out = path.resolve(ROOT, flag("--out", ".cache/lacing-tutorial/track/lr4-track.json"));
  const shots = flag("--shots") ? JSON.parse(fs.readFileSync(path.resolve(ROOT, flag("--shots")), "utf8")) : undefined;
  const w0 = Date.now(), { fixture, stats } = track({ shots, fps: Number(flag("--fps", 30)), dense: Number(flag("--dense", 120)) });
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const text = JSON.stringify(fixture);
  fs.writeFileSync(out, text + "\n");
  console.log(`${path.relative(ROOT, out)}: ${stats.n} samples (${stats.frames} frames + ${stats.n - stats.frames} in ${stats.jumps} jumps), ` +
    `${stats.cuts} cuts, ${(text.length / 1e6).toFixed(2)} MB; frameBase ${(stats.ms / 1000).toFixed(2)} s (${(stats.ms / stats.n).toFixed(2)} ms a sample), all ${((Date.now() - w0) / 1000).toFixed(2)} s`);
}
module.exports = { track, sampleTimes, jumpsOf, shotsOf, tangentOf, basisOf, pointAt, lenOf };
