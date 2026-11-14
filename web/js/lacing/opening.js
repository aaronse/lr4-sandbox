// The opening (d12; the maintainer: the first seconds explain the problem with no lacing in view, the core and router
// moving along the gantry and the router cord and wiring flapping about; the lacing flashes in exactly as "cable lacing"
// is first said, the cables then neat on the hose while the core goes on moving). Frame maths only: the core's travel in
// the goal scene (travelOf) and the cables' state (cablesOf: hanging loose and swaying behind the core until the reveal,
// then drawn in to the hose). The cables' shape from that state is the page's: lacing/slack.js.
//   Uses core, media-anim timeline / swing. Tests: tests/test_lacing_tutorial.js --only opening, frames, events.
(function (root) {
  "use strict";
  const NODE = typeof module !== "undefined" && module.exports, use = (f) => (NODE ? require(`./${f}.js`) : root.LR4Lacing[f]);
  const lib = (f) => (NODE ? require("../lib/media-anim/media-anim-runtime.min.js")[f] : root.MediaAnim[f]);
  const { clamp01, easeInOut } = lib("timeline");
  const SW = lib("swing");
  const { MOVE_DX } = use("core");
  // legS: one way, 0 -> MOVE_DX or back, on a smootherstep (draft 11's finale is one slow out-and-back; here several, quick
  // enough that each start and stop swings the cables); dwellS at each end, long enough to see the swing die away (d13);
  // as many out-and-backs as fit before parkS before the scene ends (stretched to fill it: the core home and still for the
  // move into the start scene's close view). drawIn: s from the word to the cables neat on the hose.
  // The swing (d13, the maintainer on d12: it swung on undamped while the core stood still; zeta 0.12 kept 70 % of it
  // through a 0.45 s dwell): damped springs in the gantry's frame, driven by the core's motion along it (media-anim
  // swing.js). sway: the loose loop as a pendulum swayLen mm long (~1 Hz), its lean k x the true one (a/g x its length:
  // ~8 mm at this travel, too small to read across the gantry), damped by zeta (the cable's own friction) and drag (the
  // still air: it also trails the loop behind the moving core, -2 drag k v / w, ~3 mm at full speed) - its envelope
  // falls to 5 % in swing.settleS(1, 0.665) = 0.72 s once the core stops (d13c, the maintainer: damped 50 % faster than
  // d13's 0.42 + 0.025, 1.07 s). flap: the sag bouncing at a higher mode (5 % in 0.41 s, was 0.62). The sag itself is gravity's: it stays when the core is still. tapS / taps: the swing sampled back in time for
  // the wave that runs down the cable (the page reads tap s / wave mm/s at a point s mm from the core; 2 m/s: the loop
  // past the U-turn stills ~0.25 s after the core). k: 2 (the maintainer on d13's 6: the loop swung ~80 mm, comically far
  // and through the parts beside it; a third of it, ~27 mm drawn).
  // d27 (the re-time, the owner's D7: speed the settles): dwellS 1.4 -> 1.2 (still 1.0 s after legsOf's squeeze: the
  // swing dies in 0.72 s, the opening test's SETTLE_S + 0.3) and parkS 1.0 -> 0.6 (the camera's lead into the start
  // scene), so three out-and-backs fit an 18.85 s goal (the tightened lines end at 16.94 s); legsOf squeezes the legs to
  // 2.03 s (d26 2.41: its own whole-number fit, s 0.85)
  const OPENING = { legS: 2.4, dwellS: 1.2, parkS: 0.6, drawIn: 0.7, sag: 60, wave: 2000, tapS: 0.1, taps: 10,
    sway: { swayLen: 250, zeta: 0.64, drag: 0.025, k: 2 }, flap: { hz: 1.7, zeta: 0.68, k: 8 } };
  const S5 = (u) => u * u * u * (u * (6 * u - 15) + 10), S5d = (u) => 30 * u * u * (u - 1) * (u - 1), S5dd = (u) => 60 * u * (2 * u - 1) * (u - 1);
  // the legs of a goal scene `dur` s long -> { n (out-and-backs), leg, dwell, cycle }
  function legsOf(dur, O = OPENING) {
    const c0 = 2 * (O.legS + O.dwellS), avail = Math.max(c0, dur - O.parkS), n = Math.max(1, Math.round(avail / c0)), s = avail / (n * c0);
    return { n, leg: O.legS * s, dwell: O.dwellS * s, cycle: c0 * s };
  }
  // the core's travel at local s into the goal scene: { dx (mm out along +X), v (mm/s), a (mm/s^2) } (O.dx: the travel,
  // MOVE_DX unless a test scales it)
  function travelOf(sc, local, O = OPENING) {
    const L = legsOf(sc.dur, O), still = { dx: 0, v: 0, a: 0 };
    if (!(local > 0) || local >= L.n * L.cycle) return still;
    const q = local % L.cycle, half = L.leg + L.dwell, back = q >= half, u = (back ? q - half : q) / L.leg, D = O.dx === undefined ? MOVE_DX : O.dx;
    if (u >= 1) return { dx: back ? 0 : D, v: 0, a: 0 };
    const sg = back ? -1 : 1;
    return { dx: back ? D * (1 - S5(u)) : D * S5(u), v: sg * D * S5d(u) / L.leg, a: sg * D * S5dd(u) / (L.leg * L.leg) };
  }
  // the swings for a scene of this length (made once each: a pure function of the length)
  const memo = new Map();
  function swingsOf(sc, O = OPENING) {
    const key = `${sc.dur}`;
    if (O === OPENING && memo.has(key)) return memo.get(key);
    const a = (t) => travelOf(sc, t, O).a, v = (t) => travelOf(sc, t, O).v;
    const S = { sway: SW.track(a, sc.dur, { hz: SW.hzOf(O.sway.swayLen), zeta: O.sway.zeta, k: O.sway.k, drag: O.sway.drag, v }),
      flap: SW.track(a, sc.dur, { hz: O.flap.hz, zeta: O.flap.zeta, k: O.flap.k }) };
    if (O === OPENING) { if (memo.size > 8) memo.clear(); memo.set(key, S); }
    return S;
  }
  // the cables at local s into the goal scene (null in any other): k (0 loose -> 1 laced: eased over drawIn from the
  // reveal, tm.hit), sag (mm the loose loop hangs off the hose), taps ([{ x (sway along +X), y (the sag's bounce) }] in mm
  // at the loop's peak, tap i at local - i tapS); all of them x (1 - k), so laced is zeros
  function cablesOf(sc, local, tm, O = OPENING) {
    if (sc.purpose !== "preview-goal") return null;
    const hitL = typeof tm.hit === "number" ? tm.hit - sc.start : Infinity, k = easeInOut(clamp01((local - hitL) / O.drawIn)), m = 1 - k;
    const S = swingsOf(sc, O), taps = [];
    for (let i = 0; i < O.taps; i++) { const t = local - i * O.tapS; taps.push({ x: m * S.sway.x(t), y: m * S.flap.x(t) }); }
    return { k, sag: m * O.sag, taps, tapS: O.tapS, wave: O.wave };
  }
  const api = { OPENING, legsOf, travelOf, cablesOf };
  if (NODE) module.exports = api;
  else (root.LR4Lacing = root.LR4Lacing || {}).opening = api;
})(typeof self !== "undefined" ? self : this);
