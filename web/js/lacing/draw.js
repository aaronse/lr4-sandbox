// What is drawn when: the lock run's split (lockK), the main tape drawn at t (drawAt / drawOf), the stitches tied
// (tiedAt, progressAt), the lock close-ups' hitch at t (hitchAt), the tape's end along the hose (tipS), the machine's
// pose (poseAt / poseOf: the core back and forth in the opening - opening.js travelOf - and out and back in the confirm
// scene).
//   Uses vec3, timeline, core, opening, knots. Tests: tests/test_lacing_tutorial.js --only frames, story, confirm.
(function (root) {
  "use strict";
  const NODE = typeof module !== "undefined" && module.exports, use = (f) => (NODE ? require(`./${f}.js`) : root.LR4Lacing[f]);
  const { clamp01 } = use("vec3");
  const { TOKENS, smooth, bodyOf } = use("timeline");
  const { SETTLE, MOVE_DX, HITCH, TIGHT, timing, sceneAt, workAt, settleOf } = use("core");
  const { travelOf } = use("opening");
  const { hitchPath } = use("knots");
  // ---- what is drawn when ----
  // the lock run's split (draft 7: two scenes, each with its line): the stitches to lockK in "lock", the rest round the
  // U-turn in "uturn" (half the run's lock stitches, rounded up; since d14 the tape's pace runs on across the two - runAt -
  // and lockK names the split the voice lines were written for)
  const lockK = (n) => Math.ceil((n - 2) / 2);
  // the main tape drawn at t, as a fraction of its length: the starting stitch over its scene, the running part and the
  // lock stitches over the lock run (the close-up before it teaches one, apart), the closing stitch in its close-up;
  // whole from then on
  function drawAt(t, P, tm = timing()) { const { scene, local } = sceneAt(t, tm); return drawOf(scene, local, P, tm); }
  // (d14, the maintainer on draft 13: "the animation seems paused" at 1:16 - each scene's work eased in and out, the tape
  // still for ~2 s across the cut) the lock run at one pace over both its scenes, linear: from the lock scene's camera
  // arrival to the U-turn's settle
  function runSpan(tm) {
    const L = tm.scenes.find((s) => s.id === "lock"), U = tm.scenes.find((s) => s.id === "uturn");
    return [L.start + TOKENS.slow, U.start + U.dur - settleOf(U)];
  }
  function runAt(scene, local, tm) { const [t0, t1] = runSpan(tm); return clamp01((scene.start + local - t0) / (t1 - t0)); }
  // (d14b, the maintainer on draft 14: "a quick pull to tighten the knot/stitch should be done after each lockstitch is
  // formed") each lock stitch of the run drawn on loose (PULL.loose x its outline) and pulled snug over PULL.s once the tape
  // is past its knot's end (its f1), the tape running on: -> [{ k, lam }], the knots not snug at that moment (the lock
  // run's scenes; none elsewhere)
  const PULL = { loose: 1.3, s: 0.35 };
  function pullsOf(scene, local, P, tm = timing()) {
    if ((scene.id !== "lock" && scene.id !== "uturn") || !P.knots) return [];
    const St = P.stitches, n = St.length, f = drawOf(scene, local, P, tm), [t0, t1] = runSpan(tm), now = scene.start + local, out = [];
    for (const K of P.knots) {
      const f1 = St[K.k].f1;
      if (f <= P.C[K.at] / P.total) continue;                           // (not drawn yet)
      if (f < f1) { out.push({ k: K.k, lam: PULL.loose }); continue; }
      const dt = now - (t0 + (t1 - t0) * (f1 - St[0].f1) / (St[n - 2].f1 - St[0].f1));
      if (dt < PULL.s) out.push({ k: K.k, lam: 1 + (PULL.loose - 1) * (1 - smooth(dt / PULL.s)) });
    }
    return out;
  }
  // the main tape with those knots at their looseness -> { pts, cum, total } (the last one kept), and a share f of the snug
  // tape as a share of it: the same point (the knots' points stand in point for point)
  let LAST = null;
  function tapeOf(P, pulls) {
    const key = JSON.stringify(pulls);
    if (LAST && LAST.P === P && LAST.key === key) return LAST.V;
    const pts = P.pts.slice();
    for (const q of pulls) { const K = P.knots.find((x) => x.k === q.k); K.make(q.lam).forEach((p, i) => { pts[K.at + i] = p; }); }
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
    const V = { pts, cum, total: cum[cum.length - 1] };
    LAST = { P, key, V };
    return V;
  }
  function onTape(P, V, f) {
    const L = f * P.total, C = P.C;
    let lo = 0, hi = C.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (C[m] <= L) lo = m; else hi = m; }
    const k = clamp01((L - C[lo]) / ((C[hi] - C[lo]) || 1));
    return (V.cum[lo] + (V.cum[hi] - V.cum[lo]) * k) / V.total;
  }
  function drawOf(scene, local, P, tm = timing()) {
    const St = P.stitches, n = St.length, w = workAt(scene, local);
    switch (scene.id) {
      case "goal": return 0;
      case "start": return St[0].f1 * w;
      case "clove": case "square": case "wrap": case "tuck": case "tight": return St[0].f1;   // (the close-ups teach on their own)
      case "lock": case "uturn": return St[0].f1 + (St[n - 2].f1 - St[0].f1) * runAt(scene, local, tm);
      case "spacing": return St[n - 2].f1;
      case "close": return St[n - 2].f1 + (1 - St[n - 2].f1) * w;
      default: return 1;
    }
  }
  const tiedAt = (t, P, tm = timing()) => { const f = drawAt(t, P, tm); return P.stitches.filter((q) => f >= q.f1 - 1e-9).length; };
  const progressAt = (t, P, tm = timing()) => tiedAt(t, P, tm) / P.stitches.length;
  // the close-up's hitch at t: { lam, e, draw (length drawn) } (the lock close-up's three scenes)
  function hitchAt(sc, local, D) {
    const w = workAt(sc, local);
    if (sc.id === "tight") {                         // the loop snug on the bundle by TIGHT of the work (draft 3 shrank it over
      const lam = HITCH.loose + (1 - HITCH.loose) * smooth(w / TIGHT), H = hitchPath(D, lam, w);   // all of it: still loose half way)
      return { H, draw: H.total, lam, e: w };
    }
    const H = hitchPath(D, HITCH.loose, 0), m = H.marks;
    return { H, draw: sc.id === "wrap" ? m.wrap0 + (m.wrapEnd - m.wrap0) * w : m.wrapEnd + (H.total - m.wrapEnd) * w, lam: HITCH.loose, e: 0 };
  }
  // the place along the hose of the tape's end when f of it is drawn
  function tipS(P, f) {
    const L = f * P.total;
    let i = 0;
    while (i < P.C.length - 2 && P.C[i + 1] < L) i++;
    const k = clamp01((L - P.C[i]) / ((P.C[i + 1] - P.C[i]) || 1));
    return P.s[i] + (P.s[i + 1] - P.s[i]) * k;
  }
  // the machine's pose (mm from the build pose): the core back and forth in the opening (d12), out along X and back in
  // the confirm scene
  function poseAt(t, tm = timing()) { const { scene, local } = sceneAt(t, tm); return poseOf(scene, local); }
  function poseOf(scene, local) {
    if (scene.purpose === "preview-goal") return [travelOf(scene, local).dx, 0, 0];
    if (scene.purpose !== "confirm") return [0, 0, 0];
    const k = clamp01((local - TOKENS.slow) / (bodyOf(scene) - TOKENS.slow - SETTLE));   // (draft 11: home before the credits)
    return [MOVE_DX * Math.sin(Math.PI * k) ** 2, 0, 0];
  }
  const api = { drawOf, tipS, poseOf, hitchAt, drawAt, tiedAt, poseAt, lockK, progressAt, PULL, pullsOf, tapeOf, onTape };
  if (NODE) module.exports = api;
  else (root.LR4Lacing = root.LR4Lacing || {}).draw = api;
})(typeof self !== "undefined" ? self : this);
