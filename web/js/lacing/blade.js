// The trim's blade (SHOTS.blade: locked in draft 7): the blade, its trail and the offcut at s since a cut (bladeAt),
// and the swipe sound cues (sfxAt).
//   Uses data, vec3, timeline, core. Tests: tests/test_lacing_tutorial.js --only blade, events.
(function (root) {
  "use strict";
  const NODE = typeof module !== "undefined" && module.exports, use = (f) => (NODE ? require(`./${f}.js`) : root.LR4Lacing[f]);
  const { SHOTS } = use("data");
  const { sub, add, mul, dot, cross, unit, rotAbout } = use("vec3");
  const { TOKENS, smooth } = use("timeline");
  const { timing, localOfWork } = use("core");
  // ---- the trim's blade (draft 6: an original, stylised slice - a short curved blade flies in on an arc and through the
  // cut, a swipe trail behind it, the cut end drops away): all of it a function of s since the cut (tau), from the cut's
  // point p and the tail's way out (dir) and the camera. The arc: a circle of radius r through p, square to the tail there
  // in the view's plane, bowing out past the cut (never over the knot), lifted towards the camera; the blade at angle
  // speed x tau on it. SHOTS.blade: { keep, r (mm), lift (mm), speed (rad/s), from / to (rad: in at, out at), trail (s of
  // path behind it), width (mm: the trail's at its head), fade (s: the trail after the cut), fall (s: the offcut drops and
  // fades), sfxLead (s: the swipe's wav before the cut), cuts }
  function bladeAt(cuts, sc, local, cam, shots = SHOTS) {
    const B = shots.blade, out = { blades: [], trails: [], offcuts: [] };
    if (!cuts.length || !B) return out;
    const vd = unit(sub(cam[1], cam[0])), toCam = mul(vd, -1), Z = [0, 0, 1];
    const upS = unit(sub(Z, mul(vd, dot(Z, vd))));
    const t0 = B.from / B.speed, t1 = B.to / B.speed;
    for (const c of cuts) {
      if (!c.p) continue;
      const tau = local - localOfWork(sc, c.w);
      if (tau < t0 || tau > Math.max(t1 + B.fade, B.fall)) continue;
      const e1 = unit(sub(c.dir, mul(vd, dot(c.dir, vd))));
      let e2 = unit(cross(vd, e1));
      if (dot(e2, upS) > 0) e2 = mul(e2, -1);          // (it slices down the screen)
      const C = add(c.p, mul(e1, B.r)), lift = mul(toCam, B.lift);
      const at = (ph) => add(add(add(C, mul(e1, -B.r * Math.cos(ph))), mul(e2, B.r * Math.sin(ph))), lift);
      const tan = (ph) => unit(add(mul(e1, Math.sin(ph)), mul(e2, Math.cos(ph))));
      const phOf = (tt) => B.speed * Math.min(t1, Math.max(t0, tt));
      if (tau <= t1) {                               // the blade: in over its first quick / 2, out over its last
        const q = TOKENS.quick / 2, o = smooth((tau - t0) / q) * (1 - smooth((tau - (t1 - q)) / q)), x = tan(phOf(tau));
        out.blades.push({ p: at(phOf(tau)), x, z: toCam, y: cross(toCam, x), o });
      }
      // the trail: the path the blade swept over the last B.trail s, fading to its tail, then all of it after the cut
      const pts = [], alpha = [], width = [], age = Math.min(B.trail, tau - t0), n = 18;
      const fade = 1 - smooth(tau / B.fade);
      if (age > 0.01 && fade > 0) {
        for (let i = 0; i <= n; i++) {
          const a = age * i / n, q = 1 - a / B.trail;
          pts.push(at(phOf(tau - a))); alpha.push(q * fade); width.push(B.width * q);
        }
        out.trails.push({ pts, alpha, width, z: toCam });
      }
      if (c.done && tau < B.fall && c.piece && c.piece.length > 1) {   // the offcut: pushed on down, tumbling, falling, fading
        const m = mul(c.piece.reduce((a, p) => add(a, p), [0, 0, 0]), 1 / c.piece.length);
        const d = add(add(mul(e2, 10 * tau), mul(upS, -0.5 * 140 * tau * tau)), mul(toCam, 4 * tau));
        out.offcuts.push({ e: c.e, pts: c.piece.map((p) => add(add(m, rotAbout(sub(p, m), toCam, 2.2 * tau)), d)), o: 1 - smooth(tau / B.fall) });
      }
    }
    return out;
  }
  // the sound cues (draft 6): a swipe at each cut - { id, t (the cut, s into the video), scene }; its wav starts
  // SHOTS.blade.sfxLead s before (the whoosh, then the slice on the cut)
  function sfxAt(tm = timing(), shots = SHOTS) {
    const out = [];
    for (const sc of tm.scenes) for (const c of (shots.blade && shots.blade.cuts[sc.id]) || []) out.push({ id: "swipe", t: sc.start + localOfWork(sc, c.w), scene: sc.id });
    return out.sort((a, b) => a.t - b.t);
  }
  const api = { bladeAt, sfxAt };
  if (NODE) module.exports = api;
  else (root.LR4Lacing = root.LR4Lacing || {}).blade = api;
})(typeof self !== "undefined" ? self : this);
