// The callouts on this video: the term cards on the timeline (calloutsOf: media-anim callout.schedule, each gone before
// its scene's dip or credits), their anchors in the scene's world (anchorOf; topOf, closingFrame, breakoutOf), a card
// laid out once over its span (placeOf: media-anim callout.place over samples of frameBase), and the cards on screen at
// t (calloutsAt: callout.onScreen). The card's sizes, wrap and pop are media-anim callout.js (lib/README.md).
//   Uses data, vec3, curves, core, knot_gen, knots, draw, shots, frame (lazily), media-anim camera / callout.
//   Tests: tests/test_lacing_tutorial.js --only callouts, events.
(function (root) {
  "use strict";
  const NODE = typeof module !== "undefined" && module.exports, use = (f) => (NODE ? require(`./${f}.js`) : root.LR4Lacing[f]);
  const { STORYBOARD, SHOTS } = use("data");
  const lib = (f) => (NODE ? require("../lib/media-anim/media-anim-runtime.min.js")[f] : root.MediaAnim[f]);
  const { lerp, dist } = use("vec3");
  const { alongAt } = use("curves");
  const { projector } = lib("camera"), CA = lib("callout");
  const { DIP, HITCH, timing, sceneAt, workAt } = use("core");
  const { lapW, knotGen } = use("knot_gen");
  const { KNOT, fromEnd, surfaceAt, knotView, strand, namedEnd, endAt, knotAt } = use("knots");
  const { hitchAt } = use("draw");
  const { isCut } = use("shots");
  let FR = null;                                     // (frame.js loads after this file: it calls calloutsAt)
  const frameBase = (...a) => (FR = FR || use("frame")).frameBase(...a);
  // the callouts on the video's timeline -> [{ scene, i, term, anchor, title, def, source, word, tIn (pops in), tOut (pops
  // out), tGone, want (the word's or the share's t), waited (s it waited for the one before), short (s its hold was cut
  // to end in its scene) }]: gone before the dip across a cut (DIP's out and half its hold) or the credits begin
  const WHO = "lacing tutorial: ";
  function calloutsOf(tm = timing(), sb = STORYBOARD) {
    const n = tm.scenes.length;
    const less = (i, sc) => (i < n - 1 && isCut(tm, i, i + 1) ? DIP.out + DIP.hold / 2 : 0) + (sc.credits || 0);
    // (limitLocal: the same limit as s into the scene from its dur, whole frames on the fps clock: bit-equal wherever it sits)
    return CA.schedule(tm, sb, { who: WHO, limit: (sc, i) => sc.end - less(i, sc), limitLocal: (sc, i) => sc.dur - less(i, sc) });
  }
  const wordAt = (c, line) => CA.wordAt(c, line, WHO);
  const sourceOf = (term, refs) => CA.sourceOf(term, refs, WHO);
  // a point on a close-up's bundle, the tape's top (the knots' focus: knotAt's top)
  const topOf = (D, a, wv) => strand(D, [[a, wv, KNOT.h0], [a + 0.01, wv, KNOT.h0]], 1, 1).pts[0];
  // the closing sequence's frame: a step point [a, w] -> the world (knotAt's F), and the steps' a / w as numbers
  function closingFrame(D, shots) {
    const K = fromEnd(shots.knots.closing, D), C = 2 * Math.PI * D.R0;
    return { K, at: (a, wv) => surfaceAt(D, K.at + a, K.w0 + wv, 2 * HITCH.tr).p, aw: (p) => [p[0], lapW(p[1], C)] };
  }
  // where the sleeve leaves the hose in the close-up (the breakout): along the close-up's sleeve, the first point that
  // stands 0.5 mm further off the hose's centre than the sleeve has lain so far (memoised a close-up)
  const BREAKOUT = new WeakMap();
  // the clove hitch's point on its strand (d14n review: the leader's end rides the strand as the hitch is laid and
  // pulled snug, not a fixed point on the hose): the strand's point nearest the hitch's top once snug (w 1) - its index,
  // the same at every w (the generator's points stand in point for point)
  const CLOVE_I = new WeakMap();
  function cloveIndex(D, shots) {
    let byS = CLOVE_I.get(D);
    if (!byS) CLOVE_I.set(D, (byS = new WeakMap()));
    if (!byS.has(shots)) {
      const c = topOf(D, 0, shots.knots.clove.w0), q = knotAt("clove", 1, D, shots).strands[0];
      let bi = 0, bd = Infinity;
      q.pts.forEach((p, i) => { const d = dist(p, c); if (d < bd) { bd = d; bi = i; } });
      byS.set(shots, bi);
    }
    return byS.get(shots);
  }
  function breakoutOf(D) {
    if (!BREAKOUT.has(D)) {
      const S = D.sleeve;
      let lo = Infinity, at = S[S.length - 1];
      outer: for (let i = 1; i < S.length; i++) for (let k = 0; k <= 20; k++) {
        const p = lerp(S[i - 1], S[i], k / 20), d = D.line.nearest(p).d;
        if (d > lo + 0.5) { at = p; break outer; }
        lo = Math.min(lo, d);
      }
      BREAKOUT.set(D, at);
    }
    return BREAKOUT.get(D);
  }
  // a callout's anchor at the frame F (frameBase's): the point in its scene's world (mm) | null (not drawn yet)
  //   stitch0       the starting stitch on the machine view: its tape's point nearest the camera
  //   clove         the clove hitch's cross: in its scene the strand's point there once snug, riding the strand as it is laid and
  //                 pulled (d14n review); else the bundle's top at a 0, the knot's w0
  //   square_knot   the square knot's centre (its focus)
  //   running_end   the long end leaving the square knot: 9 mm out of the knot along it, past where it last leaves 7 mm of the centre
  //   lock_cross    the lockstitch's over-crossing: its hitch's cross now
  //   ghost_close   the closing stitch's ring, its front (as stitch0): the opening's lacing, shown as its ghost, where it
  //                 stands still as the core travels (1 mm over the 280 mm; the U-turn moved 5.3 mm a frame - d14, the NASA card)
  //   bracket       the bracket's middle
  //   breakout      where the sleeve leaves the hose in the close-up (breakoutOf)
  //   half_hitches  on H (w 0), half way between the two half hitches' middles (the steps named "half hitch 1 / 2")
  //   tie_off_end   the tie-off end where the blade cuts it (its root: keep mm along it; endAt)
  //   closing_knot  the closing knot's middle along the hose (its steps from the last lockstitch's turn on, but the
  //                 tie-off end: trimmed, and pulled in by the tighten), on H
  function anchorOf(name, F, P, tm, shots = SHOTS) {
    const { scene, local } = sceneAt(F.tt, tm), D = (id) => P.details[id];
    switch (name) {
      case "stitch0": case "ghost_close": {        // (its tape's point nearest the camera: the ring's front, not its centre)
        const q = P.stitches[name === "stitch0" ? 0 : P.stitches.length - 1];
        // (on its segments, not only at its points: the generated run's turns have a point every 3 mm - d14b - and the
        // nearest point jumped 2.3 mm a frame as the camera moved)
        let best = q.c, bd = Infinity;
        const c = F.cam[0];
        for (let i = q.i0; i < q.i1 && i + 1 < P.pts.length; i++) {
          const a = P.pts[i], b = P.pts[i + 1], e = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], ee = e[0] * e[0] + e[1] * e[1] + e[2] * e[2];
          const k = ee > 0 ? Math.max(0, Math.min(1, ((c[0] - a[0]) * e[0] + (c[1] - a[1]) * e[1] + (c[2] - a[2]) * e[2]) / ee)) : 0;
          const p = [a[0] + e[0] * k, a[1] + e[1] * k, a[2] + e[2] * k], d = dist(p, c);
          if (d < bd) { bd = d; best = p; }
        }
        return best;
      }
      case "clove": {                              // (on its strand while the clove's close-up shows it; else the hose's top)
        const q = scene.id === "clove" && F.detail && F.detail.strands && F.detail.strands[0];
        return q ? q.pts[cloveIndex(D("start"), shots)] : topOf(D("start"), 0, shots.knots.clove.w0);
      }
      case "square_knot": return topOf(D("start"), 0, 0);
      case "running_end": {
        const sx = knotView(D("start"), "square", shots).sx, s = F.detail && F.detail.strands && F.detail.strands[sx > 0 ? 2 : 1];
        if (!s || !(s.draw > 1)) return null;
        const c = topOf(D("start"), 0, 0);
        let exit = 0;
        for (let i = 0; i < s.pts.length && s.cum[i] <= s.draw; i++) if (dist(s.pts[i], c) <= 7) exit = s.cum[i];
        return alongAt(s, Math.min(s.draw, exit + 9));
      }
      case "lock_cross": return hitchAt(scene, local, D("lock")).H.cross;
      case "bracket": return P.bracket.pts[8];
      case "breakout": return breakoutOf(D("close"));
      case "half_hitches": case "closing_knot": case "tie_off_end": {
        const cf = closingFrame(D("close"), shots), st = cf.K.steps;
        const as = (pred) => st.filter(pred).flatMap((q) => (q.pts || []).map((p) => p[0]).concat(q.a !== undefined ? [q.a] : []));
        const mid = (v) => (Math.min(...v) + Math.max(...v)) / 2;
        if (name === "half_hitches") return cf.at((mid(as((q) => /^half hitch 1/.test(q.what || ""))) + mid(as((q) => /^half hitch 2/.test(q.what || "")))) / 2, 0);
        if (name === "closing_knot") return cf.at(mid(as((q, i) => i >= st.map((x) => x.op === "wrap").lastIndexOf(true) && q.op !== "pull" && !q.end)), 0);   // (the last wrap: stitch 8's comes first)
        // (where the blade cuts the tie-off end: its root, keep mm along it - the same point before and after the cut. Draft
        // 10: the nearest drawn point to the end's middle jumped 80 px as the pull moved the stretches, and a point back from
        // the drawn end jumped 190 px at the cut)
        const ci = cf.K.scenes.indexOf(scene.id), ne = namedEnd("tie-off", shots);
        if (ci < 0 || !ne) { const e = st.find((q) => q.end === "tie-off"), m = cf.aw(e.pts[Math.floor(e.pts.length / 2)]); return cf.at(m[0], m[1]); }
        const G = knotGen(cf.K, D("close"), ci + workAt(scene, local)), s = G.strands[ne.e];
        return alongAt(s, Math.min(s.draw, endAt(G, ne, shots.blade.keep)));
      }
      default: throw new Error(`lacing tutorial: unknown callout anchor "${name}"`);
    }
  }
  // a callout's card, laid out once (x the height; x in 0 - A): of the leads x directions - the card put beside the
  // anchor at the middle of its span, then moved into the frame's margins and above the cue's band - the one that stays
  // clear of the focus point and the anchor at every sample over its span and covers the least drawn tape and live end
  // (memoised: the shots, the plan, the frame's shape, the callout)
  const PLACES = new WeakMap();
  function placeOf(co, P, g, tm, shots) {
    const A = g.aspect || 16 / 9, key = `${g.fov}|${A}|${co.term}|${co.tIn}|${co.tOut}|${co.anchor}`;
    let byP = PLACES.get(shots);
    if (!byP) PLACES.set(shots, (byP = new WeakMap()));
    let memo = byP.get(P);
    if (!memo) byP.set(P, (memo = new Map()));
    if (memo.has(key)) return memo.get(key);
    // a sample at t: the anchor and the focus point projected (x 0 - A), and the ink - the tape drawn (the close-up's hitch
    // or knot strands, else the main tape) and the live end, x 5
    const out = CA.place(co, A, (t) => {
      const F = frameBase(t, P, g, tm, shots), pr = projector(F.cam, g);
      const a = anchorOf(co.anchor, F, P, tm, shots), q = a && pr(a), f = F.focus && pr(F.focus);
      const ink = [], put = (p, wt = 1) => { const v = pr(p); if (v.z > 0 && v.x >= 0 && v.x <= 1 && v.y >= 0 && v.y <= 1) ink.push({ x: v.x * A, y: v.y, wt }); };
      const drawn = (pts, L) => { let c = 0; for (let i = 0; i < pts.length; i++) { if (i) c += dist(pts[i], pts[i - 1]); if (c > L) break; put(pts[i]); } };
      if (F.detail && F.detail.hitch) drawn(F.detail.hitch.pts, F.detail.hitch.draw);
      else if (F.detail) for (const st of F.detail.strands || []) drawn(st.pts, st.draw);
      else for (let i = 0; i < P.pts.length && P.C[i] <= F.f * P.total; i += 3) put(P.pts[i]);
      if (F.tipAt && F.tip > 0.5) put(F.tipAt, 5);
      return { a: q && q.z > 0 ? { x: q.x * A, y: q.y } : null, f: f && f.z > 0 ? { x: f.x * A, y: f.y } : null, ink };
    });
    memo.set(key, out);
    return out;
  }
  // the callouts on screen at t (frameBase's F) -> [{ term, title, def, source, anchor: { name, x, y, z }, card: { x, y,
  // w, h (shares of the frame's width / height), scale, opacity, origin: [x, y] (the share of the card it scales from:
  // the corner or edge the leader meets) }, dot: { x, y, scale, opacity }, leader: { x1, y1 (the dot), x2, y2 (the
  // card's nearest edge), draw (0 - 1, from the dot) }, lines, size: { term, def, source (font, x the height), ... } }]
  function calloutsAt(t, F, P, g, tm = timing(), shots = SHOTS) {
    const s = sceneAt(t, tm);                         // (scene-local: a scene that moves keeps its cards' bits, MA-8)
    return CA.onScreen(calloutsOf(tm), { tt: F.tt, scene: s.scene.id, local: s.local }, (co) => { const a = anchorOf(co.anchor, F, P, tm, shots); return a && projector(F.cam, g)(a); },
      (co) => placeOf(co, P, g, tm, shots), g.aspect || 16 / 9);
  }
  const api = { calloutsAt, calloutsOf, anchorOf, placeOf, breakoutOf, wordAt, sourceOf };
  if (NODE) module.exports = api;
  else (root.LR4Lacing = root.LR4Lacing || {}).callouts = api;
})(typeof self !== "undefined" ? self : this);
