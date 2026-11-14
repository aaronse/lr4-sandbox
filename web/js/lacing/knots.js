// The knots drawn large: the lock stitch's marline hitch (hitchPath), the square knot's constants and phases (KNOT,
// SQ), a close-up's flat frame (flatOf), the tape clipped where a knot grows from it (tapeTo, fromEnd), a point on the
// bundle (surfaceAt), a knot scene's view (knotView), a strand laid on the bundle (strand), the square knot's control
// points (knotCps, layered with CLEAR), and knotAt (a scene's knots at work w: the clove and closing sequence through
// knotGen, the square knot tied, the cuts) with its cuts (namedEnd, endAt, cutsOf, cutPieces).
// The marline hitch, the bundle's frame (flatOf, surfaceAt) and strand are MediaMesh.rope / bundle (media-mesh-knots.min.js,
// vendored) with the lacing's tape (HITCH, CLEAR).
//   Uses data, vec3, timeline, curves, knot_flat, core, knot_gen, MediaMesh.rope / bundle. Tests: media-mesh lib
//     rope.test.js, bundle.test.js; tests/test_lacing_tutorial.js --only hitch, story, closing, tape, clearance.
(function (root) {
  "use strict";
  const NODE = typeof module !== "undefined" && module.exports, use = (f) => (NODE ? require(`./${f}.js`) : root.LR4Lacing[f]);
  const { SHOTS } = use("data");
  const mm = (f) => (NODE ? require("../lib/media-mesh/media-mesh-knots.min.js")[f] : root.MediaMesh[f]);
  const RP = mm("rope"), BU = mm("bundle");
  const { clamp01, lerp, sub, mul, dot, cross, unit, dirIn } = use("vec3");
  const { smooth } = use("timeline");
  const { alongAt } = use("curves");
  const { reefFlat, denseIdx, flatTo } = use("knot_flat");
  const { HITCH, CLEAR, handover } = use("core");
  const { KNOT_GEN, knotGen, stepsOf } = use("knot_gen");
  const KF = use("knot_flat");

  // ---- the lock stitch in enlarged detail: a marline hitch round the bundle, as NASA-STD-8739.4A Fig. 9-5 draws it
  // (draft 9; the Navy's rule: "the end of the line goes over the standing part and under the round turn"). The standing
  // part comes along the top (the cables' side), turns once round the bundle drifting back along the hose, the end
  // crosses OVER the standing part at a = -g (the lock's crossing, `cross`), steps 9 mm aside and runs on UNDER the turn's
  // start (raised a layer there) towards the next stitch. Slid off the bundle it is an overhand knot (knot determinant 3,
  // tests/test_lacing_tutorial.js); draft 3-8's crossings, under then over, made a half hitch (determinant 1: the unknot).
  // lam = how loose the loop is (1 = snug on the bundle), e = how far the end has been pulled through (0 - 1). -> { pts,
  // cum (length along), marks: { wrap0, wrapEnd, tuckEnd } (lengths), cross (the crossing over the standing part) }
  // (draft 11, clearance: the end's crossing clear of the standing part where it still rises, 3 mm on - draft 9-10's rS(-g)
  // left the end 1.7 mm off it; the turn's start raised so the end passes under it a tube's diameter + CLEAR clear, both
  // measured on the outline there, rho(dth), which falls off the cables' side - draft 9-10 laid the end on R0 and the turn
  // on rho, 0.4 mm apart at the tuck - square to the turn, and never less than a layer, so the end under it still clears
  // the bundle)
  const hitchPath = (D, lam, e) => RP.marline(D, lam, e, { tr: HITCH.tr, gap: HITCH.gap, lead: HITCH.lead, endMin: HITCH.endMin, endMax: HITCH.endMax, clear: CLEAR });
  // ---- the knots drawn large (draft 3): the starting stitch's spot tie (a clove hitch, then a square knot: NASA-STD-8739.4
  // 9.2.1 / 9.2.2, WireCare step 1) and the closing sequence (draft 9: NASA-STD-8739.4A Fig. 9-3 - the last lockstitch,
  // then two half hitches round the tape's own standing part, one tie-off end trimmed; draft 3-8 drew a marline hitch on
  // the model's two closing turns and a square knot with a second, spare end). A strand is a list of control points
  // [a (mm along the hose from the stitch), w (mm round the bundle from the cables' side, on its surface), h (layers of
  // tape under it)] through a centripetal Catmull-Rom (in mm: h counts 2 tube radii), then laid on the close-up's
  // bundle: out from the hose's centre to its outline (rho) x lam + a tube radius per layer. ----
  // (the clove hitch and the closing sequence are steps: SHOTS.knots through knotGen, below.) KNOT: the square knot's
  // scale (mm a unit of reefFlat: kLoose while it is tied, kSnug pulled tight), its layers (h0 on the turns, bump at a
  // crossing) (draft 5: the square knot sits on the cables' side, w 0, flat on the bundle: h0 1.6 layers clears the tape under it,
  // bump 0.5 a side = one tape's thickness between the strands at a crossing; kLoose / kSnug its unit while tied / pulled)
  const KNOT = { kLoose: 4.0, kSnug: 2.4, h0: 1.6, bump: 0.5, tailN: 16 };   // (tailN: samples on a tail, any length)
  // the square knot's phases, as shares of its scene's work (draft 5): the left end laid to its bight's far point (to
  // lay), the right end over it and under it to its own (to h1: the first half knot, right over left), the left end round
  // and back across (to endL), the right end round, over it and under it and out (to h2: the second half knot, left over
  // right), both pulled snug (to pull), then the short ends trimmed
  const SQ = { lay: 0.12, h1: 0.38, endL: 0.5, h2: 0.7, pull: 0.88, swap: 0.03 };   // (swap: the tip's fade across a change of end, in w)
  // (the knot scenes' cameras are shots - SHOTS: a "surface" focus - a, w on the bundle, lifted - and az / el in the
  // surface's frame)
  // a point on a close-up's bundle -> its place in the knots' flat frame: a (mm along the hose from the stitch), w (mm
  // round it from the cables' side; the tape's ring D.R0), r (mm out from the hose's centre)
  const flatOf = BU.flatOf;
  // a knot that continues the tape (SHOTS.knots.<id>.from: "tape"; draft 9: the closing sequence): the close-up's own
  // model tape (D.tape, the plan's) is clipped where it first reaches the knot's start step's a (mm along the hose from
  // the stitch), and the knot grows from that end. -> the clipped tape's points (memoised a close-up and an a)
  const CLIPS = new WeakMap();
  function tapeTo(D, K) {
    if (!K || K.from !== "tape") return D.tape;
    const a0 = stepsOf(K)[0].a, memo = CLIPS.get(D) || new Map();
    CLIPS.set(D, memo);
    if (!memo.has(a0)) {
      let out = D.tape, prevA = -Infinity;
      for (let i = 0; i < D.tape.length; i++) {
        const fa = flatOf(D, D.tape[i]).a;
        if (i && fa >= a0 && prevA < a0) { out = D.tape.slice(0, i).concat([lerp(D.tape[i - 1], D.tape[i], (a0 - prevA) / (fa - prevA))]); break; }
        prevA = fa;
      }
      memo.set(a0, out);
    }
    return memo.get(a0);
  }
  // ... its frame moved so its first step lands on that end, and its first point pinned to it (pin)
  function fromEnd(K, D) {
    if (K.from !== "tape") return K;
    const T = tapeTo(D, K), e = T[T.length - 1], f = flatOf(D, e), steps = stepsOf(K), s0 = steps[0];
    return Object.assign({}, K, { steps, at: f.a - (s0.a || 0), w0: f.w - (s0.w || 0), pin: e });
  }
  // a point on a close-up's bundle: a mm along the hose from its stitch, w mm round it from the cables' side, lift mm out
  // from its outline -> { p, n (out), b (round, t x n), t (along) }: a "surface" focus and its frame
  const surfaceAt = BU.surfaceAt;
  // where a knot scene's camera looks from (its first key): { tgt, dir (unit, from the target), sx (+1: the hose's +a runs
  // to the screen's right, -1: to its left; the camera's up is +Z) } - the square knot is laid out in the screen's frame,
  // so "right over left" is the viewer's right
  function knotView(D, id, shots = SHOTS) {
    const k = shots.scenes[id].camera.keys[0], f = k.focus, S = surfaceAt(D, f.a, f.w, f.lift), dir = dirIn([S.n, S.b, S.t], k.az, k.el);
    return { tgt: S.p, dir, sx: dot(S.t, cross(mul(dir, -1), [0, 0, 1])) >= 0 ? 1 : -1 };
  }
  // a strand's control points -> { pts (world), cum (length along), total }; lam = how loose (x the outline)
  // (a 4th value per control point = how much of the looseness it takes, 0 - 1: 1 when left out)
  const strand = (D, cps, lam = 1, n = 6) => BU.strand(D, cps, lam, n, HITCH.tr);
  // the reef's layers with the lacing's clearance (knot_flat.js layered; clear = CLEAR in tube diameters)
  const layered = (Ls, Rs, h0, rDrawn, first, bw) => KF.layered(Ls, Rs, h0, rDrawn, first, bw, CLEAR / (2 * HITCH.tr));
  // a square knot tied on top (reefFlat, centred on (ac, wc), the standing parts towards +w): L from the lead points fromL
  // (the end that comes in from the screen's left), R from fromR (the working end, from the right); [a, w, h] each;
  // k = mm a unit (loose = bigger), tails = [L's, R's] end past the knot (mm); runL: L's end runs on along the bundle to a
  // = runL (the starting stitch's running end); rAt = how far R is laid (an index into R's control points: L bends round
  // the crossings it has reached). -> { L: cps, R: cps, l0 / r0 (each standing part's first point in the knot), lMid / rMid
  // (each bight's far point), crossings }
  function knotCps(fromL, fromR, k, ac, wc, tails, sx, runL, rAt = Infinity) {
    const F = reefFlat(k, ac, wc, sx, -1), ext = (p, q, mm) => { const d = Math.hypot(p[0] - q[0], p[1] - q[1]) || 1; return [p[0] + (p[0] - q[0]) / d * mm, p[1] + (p[1] - q[1]) / d * mm]; };
    const sc = KNOT.kLoose / k, tn = KNOT.tailN;
    const dL = denseIdx([...F.L, ext(F.L[F.L.length - 1], F.L[F.L.length - 2], tails[0])], 1.2, sc, tn);
    const dR = denseIdx([...F.R, ext(F.R[F.R.length - 1], F.R[F.R.length - 2], tails[1])], 1.2, sc, tn);
    // (draft 11, clearance: a lead comes into the knot along its standing part's line, from 5 mm back, up at the knot's
    // layer by half way - draft 5-10 ran straight to the standing part's first point and turned back on itself there, a
    // kink, and crossed the clove's last wrap 0.1 mm low)
    // (it turns in onto that line round a quarter circle, 2.5 mm radius, from the side it comes from)
    const leadOf = (from, dd) => {
      const e = from[from.length - 1], s0 = dd[0], s1 = dd[1], dl = Math.hypot(s1[0] - s0[0], s1[1] - s0[1]) || 1;
      const d = [(s1[0] - s0[0]) / dl, (s1[1] - s0[1]) / dl], back = [s0[0] - d[0] * 5, s0[1] - d[1] * 5];
      let n = [-d[1], d[0]];
      if (n[0] * (e[0] - back[0]) + n[1] * (e[1] - back[1]) < 0) n = [-n[0], -n[1]];
      const R = 2.5, P = (u, v) => [back[0] - d[0] * u + n[0] * v, back[1] - d[1] * u + n[1] * v, KNOT.h0];
      const q0 = P(R, R + 2);
      return from.concat([[(e[0] + q0[0]) / 2, (e[1] + q0[1]) / 2, KNOT.h0], q0, P(R, R), P(R * Math.SQRT1_2, R * (1 - Math.SQRT1_2)), P(0, 0)]);
    };
    const lL = leadOf(fromL, dL.pts), lR = leadOf(fromR, dR.pts);
    const Ly = layered(dL.pts, dR.pts, KNOT.h0, flatTo(dR.pts, rAt - lR.length), -1, k);
    const Lc = [...lL, ...Ly.L], Rc = [...lR, ...Ly.R];
    if (runL !== undefined) { const e = Lc[Lc.length - 1]; Lc.push([e[0] - sx * 10, e[1] + (wc - e[1]) * 0.5, 0.6], [runL, wc, 0.2]); }
    return { L: Lc, R: Rc, l0: lL.length, r0: lR.length, lMid: lL.length + dL.at[F.mid], rMid: lR.length + dR.at[F.mid], crossings: Ly.crossings };
  }
  // the share of a strand's length to its control point j (strand(): n points a span)
  const cpShare = (s, j, n = 6) => {                 // (j fractional: between its neighbours)
    const x = Math.min(s.cum.length - 1, Math.max(0, j * n)), i = Math.floor(x), c = s.cum[i] + ((s.cum[Math.min(i + 1, s.cum.length - 1)] - s.cum[i]) * (x - i));
    return c / (s.total || 1);
  };
  // the close-ups' knots at a scene's work w (0 - 1) -> { strands: [{ pts, draw (mm drawn), total, cum }], focus, work
  // (the index of the strand being worked: its end gets the light tip) }
  function knotAt(id, w, D, shots = SHOTS) {
    const C = 2 * Math.PI * D.R0, S = (cps, lam, draw) => { const s = strand(D, cps, lam); return { pts: s.pts, total: s.total, cum: s.cum, draw: s.total * clamp01(draw) }; };
    const top = (a, wv) => { const s = strand(D, [[a, wv, KNOT.h0], [a + 0.01, wv, KNOT.h0]], 1, 1); return s.pts[0]; };
    // the clove hitch and the closing sequence: steps (SHOTS.knots) through the generator (knotGen); drawn on loose, then pulled
    const KN = shots.knots;
    if (id === "clove") return { strands: knotGen(KN.clove, D, w).strands, focus: top(0, KN.clove.w0), work: 0 };
    if (KN.closing && KN.closing.scenes.includes(id)) {
      // the closing sequence (draft 9, NASA-STD-8739.4A Fig. 9-3): one strand from the close-up's tape - the tape along the
      // bundle (H), the last lockstitch (close), a bight back over it and two half hitches round H (seal), pulled snug and
      // the one tie-off end trimmed (tie). Its steps run on the knot's own work u = the scene's place in K.scenes + w.
      const K = fromEnd(KN.closing, D), u = K.scenes.indexOf(id) + w, G = knotGen(K, D, u), F = (a, wv) => surfaceAt(D, K.at + a, K.w0 + wv, 2 * HITCH.tr).p;
      const pulls = K.steps.filter((s) => s.op === "pull"), still = pulls[pulls.length - 1].to - K.scenes.indexOf(id);
      const pieces = cutPieces(cutsOf(id, 1, shots), w >= still, w, (c) => ({ s: G.strands[c.e], L: endAt(G, c, shots.blade.keep) }));
      for (const c of pieces) if (c.done) G.strands[c.e].draw = Math.min(G.strands[c.e].draw, c.L);
      // the action point: the lockstitch's crossing over H, the half hitches, the tie-off end
      const fo = K.focus && K.focus[id] ? F(K.focus[id][0], K.focus[id][1]) : F(0, 0);
      // (ctx: mm of strand 0 from its start through its last context step - earlier stitches, drawn as the close-up's
      // context, faded with it: 2026-11-10, stitch 8 tied in the strand, as the model's tape it replaced was)
      const ic = K.steps.map((q) => !!q.context).lastIndexOf(true), s0 = G.strands[0];
      if (ic >= 0) s0.ctx = s0.cum[Math.min(s0.cum.length - 1, Math.round(G.flat[0].ends[ic] * KNOT_GEN.n))];
      return { strands: G.strands, focus: fo, work: 0, cuts: pieces, u };
    }
    // the square knot (draft 5): the first half knot - L laid to its bight's far point, R over and under it to its own
    // (right over left); the second - L's end round and back across, R's end round, over it and under it and out (left
    // over right); both pulled snug (k shrinks; the ends come out as much as the bights give); the short ends trimmed
    const k = KNOT.kLoose + (KNOT.kSnug - KNOT.kLoose) * smooth((w - SQ.h2) / (SQ.pull - SQ.h2)), give = 6 * (KNOT.kLoose - k);
    // the trim (draft 6): a blade cuts each end the scene's shot says (SHOTS.blade.cuts) at its work w - before it the tail
    // is whole (full), from it the end is keep mm past the knot and the rest (the offcut) falls away (frameAt). The ends
    // are cut once the knot is snug (w >= SQ.pull: k no longer changes, so the knot holds still)
    const sx = knotView(D, id, shots).sx, full = 8 + give, keep = shots.blade.keep, cuts = cutsOf(id, sx, shots);
    const tl = (e, w_) => (cuts.some((c) => c.e === e && w_ >= c.w) ? keep : full);
    const span = (a, b) => clamp01((w - a) / (b - a));
    // (both strands drawn on from nothing at the scene's start - draft 6: their leads were there whole on the first frame,
    // a stub popping up across the cut from the knot before; L laid to its bight's far point over lay, R's lead over it)
    // (laidL / laidR: how many of a strand's control points were laid before the scene - the tie's spare end lies under the
    // closing turns from the close on: it grows on from there, draft 7)
    const tie = (fromL, fromR, ac, tails, runL, laidL = 0, laidR = 0) => {
      // each phase draws its stretch evenly by length (draft 6: by control point, the starting stitch's running end - one
      // 50 mm step - went on in a frame or two, 35 mm a frame); R's index (where L bends round its crossings) from its share
      const K0 = knotCps(fromL, fromR, k, ac, 0, tails, sx, runL), rEnd = K0.R.length - 1;
      const s0L = S(K0.L, 1, 1), s0R = S(K0.R, 1, 1), lm = cpShare(s0L, K0.lMid), r0 = cpShare(s0R, K0.r0), rm = cpShare(s0R, K0.rMid);
      const aL = laidL ? cpShare(s0L, laidL) : 0, aR = laidR ? cpShare(s0R, laidR) : 0;
      const fL = w < SQ.h1 ? aL + (lm - aL) * span(0, SQ.lay) : lm + (1 - lm) * span(SQ.h1, SQ.endL);
      const fR = w < SQ.lay ? aR + (r0 - aR) * span(0, SQ.lay) : w < SQ.endL ? r0 + (rm - r0) * span(SQ.lay, SQ.h1) : rm + (1 - rm) * span(SQ.endL, SQ.h2);
      let lo = 0, hi = rEnd;
      for (let q = 0; q < 40; q++) { const m = (lo + hi) / 2; if (cpShare(s0R, m) < fR) lo = m; else hi = m; }
      const K = knotCps(fromL, fromR, k, ac, 0, tails, sx, runL, (lo + hi) / 2), sl = S(K.L, 1, 1), sr = S(K.R, 1, 1);
      sl.draw = sl.total * fL; sr.draw = sr.total * fR;
      return [sl, sr];
    };
    const work = w < SQ.lay || (w >= SQ.h1 && w < SQ.endL) ? 1 : 2;
    if (id === "square") {                           // the clove's two ends: A (short) leaves it at -a, B (long, laces on) at +a
      const G = knotGen(KN.clove, D, 1), cl = G.flat[0].cps, eA = cl[0], eB = cl[cl.length - 1], A = [eA[0], eA[1], 0.4], B = [eB[0], eB[1] + 2 * C, 0.4];
      if (KN.square && KN.square.use === "gen") return { strands: [G.strands[0], ...knotGen(KN.square, D, w, sx).strands], focus: top(0, 0), work: 1, k };
      const run = D.after * 0.9;                     // (the screen's left end comes in first; the right one works)
      // (with B on the screen's right its long end stops past the knot: the reference hose's close-ups have it on the left)
      // (draft 11, clearance: A leaves the clove's start the way the clove's lead points, away from the knot - draft 5-10
      // ran it straight back along that lead, the two tubes 0.4 mm apart - so it folds back over itself, a tape's
      // thickness up, and lies on the lead till it heads for the knot)
      const o = [eA[0] - cl[1][0], eA[1] - cl[1][1]], ol = Math.hypot(o[0], o[1]) || 1, oa = o[0] / ol, ow = o[1] / ol;
      const fold = (d, h) => [eA[0] + oa * d, eA[1] + ow * d, h];
      // (then high enough to pass over the clove's crossing, itself a layer up, at w ~34)
      const Af = [A, fold(2.2, 0.4), fold(3.7, 1.15), fold(2.2, 1.9), fold(-2, 1.85), fold(-6, 1.95), [eA[0] + 0.6, eA[1] - 13.5, 2.45], [eA[0] - 0.6, eA[1] - 22, 2.1]];
      // (B on along the clove's last stretch, rising clear of the clove's wrap beside it)
      const ob = [eB[0] - cl[cl.length - 2][0], eB[1] - cl[cl.length - 2][1]], obl = Math.hypot(ob[0], ob[1]) || 1;
      const Bf = [B, [B[0] + ob[0] / obl * 3, B[1] + ob[1] / obl * 3, 1.3]];
      const mk = (w_) => (sx > 0 ? tie(Af, Bf, 0, [tl(1, w_), tl(2, w_)]) : tie(Bf, Af, 0, [tl(1, w_), tl(2, w_)], run));
      const st = mk(w), cs = G.strands[0];
      // (the ends grow from the clove's two ends: A from its start, B from its end)
      const iA = sx > 0 ? 0 : 1, iB = 1 - iA;
      handover("the square knot's short end", cs.pts[0], st[iA].pts[0]);
      handover("the square knot's long end", cs.pts[cs.pts.length - 1], st[iB].pts[0]);
      let U = null;                                  // (the uncut ends, made once a cut needs them)
      const at = (c) => { U = U || mk(-1); const s = U[c.e - 1]; return { s, L: s.total - (full - keep) }; };
      return { strands: [G.strands[0], ...st], focus: top(0, 0), work, k, cuts: cutPieces(cuts, w >= SQ.pull, w, at) };
    }
    throw new Error(`lacing tutorial: no knot for scene ${id}`);
  }
  // a knotGen strand's named free end (a step's end: "tie-off") -> { e (the strand), step (its index) } | null
  function namedEnd(name, shots = SHOTS) {
    for (const K of Object.values(shots.knots)) {
      const list = K.strands || [{ steps: stepsOf(K) }];
      for (let e = 0; e < list.length; e++) { const i = list[e].steps.findIndex((s) => s.end === name); if (i > 0) return { e, step: i }; }
    }
    return null;
  }
  // where a named end is cut: keep mm past the knot (the length along its strand where its step starts, + keep)
  function endAt(G, c, keep) {
    const s = G.strands[c.e], i = G.flat[c.e].ends[c.step - 1] * KNOT_GEN.n;
    return Math.min(s.total, s.cum[Math.min(i, s.cum.length - 1)] + keep);
  }
  // the scene's cuts (SHOTS.blade.cuts[id]: [{ w, end: "short" | "L" | "R" | a named end }]) -> [{ w, e (the strand in the
  // scene's knot: 1 the square knot's left end, 2 its right; a named end's own strand), step }]; "short" = the square
  // knot's short end (the clove's A: on the screen's left when sx > 0); a named end: a knotGen step's "end" (draft 9:
  // "tie-off", the closing sequence's one free end)
  function cutsOf(id, sx, shots = SHOTS) {
    return ((shots.blade && shots.blade.cuts[id]) || []).map((c) => {
      const n = c.end === "short" || c.end === "L" || c.end === "R" ? null : namedEnd(c.end, shots);
      if (n) return { w: c.w, e: n.e, step: n.step, end: c.end };
      return { w: c.w, e: c.end === "short" ? (sx > 0 ? 1 : 2) : c.end === "L" ? 1 : 2 };
    });
  }
  // each cut once the knot holds still (ready): where it cuts - p, dir (the tail's way out) - and the offcut, from the
  // strand with no end cut yet: at(c) -> { s (that strand), L (mm along it where it is cut) }
  function cutPieces(cuts, ready, w, at) {
    if (!cuts.length || !ready) return cuts.map((c) => Object.assign({}, c, { done: false, p: null }));
    return cuts.map((c) => {
      const { s, L } = at(c), a = alongAt(s, L), b = alongAt(s, Math.min(s.total, L + 1));
      const piece = [a];
      for (let i = 0; i < s.pts.length; i++) if (s.cum[i] > L + 1e-6) piece.push(s.pts[i]);
      return Object.assign({}, c, { done: w >= c.w, p: a, dir: unit(sub(b, a)), piece, L });
    });
  }
  const api = { hitchPath, surfaceAt, KNOT, fromEnd, knotView, strand, namedEnd, endAt, SQ, knotAt, flatOf, cutsOf,
    tapeTo, layered, knotCps };
  if (NODE) module.exports = api;
  else (root.LR4Lacing = root.LR4Lacing || {}).knots = api;
})(typeof self !== "undefined" ? self : this);
