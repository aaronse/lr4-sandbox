// The plan, in mm: run 0 of LR4Hose.lacing at the build pose - the tape's points and their places along the hose, the
// stitches, the pitfall's bracket (TOP: its side), the close-ups' short lengths of hose, cord, sleeve and tape with
// their outline (plan), the cables' rise over a close-up's outline (riseOf), where a cable reaches an arc (cableCut),
// the plan from the hose's data alone (referencePlan, LR4Hose = web/js/hose_route.js), the U-turn's apex at a pose
// (apexOf), the run's tape generated whole (runOf: media-mesh body + rope.lace; RUN) and a lacing's runs at any pose
// (refsOf at the build pose, knotLace carrying them).
//   Uses vec3, timeline, curves, core, media-mesh rope / body. Tests: tests/test_lacing_tutorial.js --only plan, run, story, confirm.
(function (root) {
  "use strict";
  const NODE = typeof module !== "undefined" && module.exports, use = (f) => (NODE ? require(`./${f}.js`) : root.LR4Lacing[f]);
  const { clamp01, sub, add, mul, dot, cross, len, unit, dist, perp } = use("vec3");
  const { smooth } = use("timeline");
  const { hoseLine, cableSpan, profile, spline } = use("curves");
  const { DETAIL, HITCH, CLEAR } = use("core");
  const RP = NODE ? require("../lib/media-mesh/media-mesh-knots.min.js").rope : root.MediaMesh.rope, BD = NODE ? require("../lib/media-mesh/media-mesh-knots.min.js").body : root.MediaMesh.body;
  // ---- the plan, in mm ----
  // the side of the bundle the pitfall's bracket sits on: from above, a little behind (= the lock run's and the pitfall's
  // shots' az / el; the plan is made once, before any shot)
  const TOP = unit([0.1, 0.35, 1]);
  // curve = the hose's dense centre line the lacing was made on, lace = LR4Hose.lacing's result, L = LR4Hose.LACING,
  // cab = { cord: [pts], sleeve: [pts] | null } (cordRoute's), cabR = their radii (d / 2), hoseR = the hose's (od / 2).
  // Run 0 only: the cord + sleeve to the closing stitch. The bracket and the close-ups are built on the model's tape
  // (LR4Hose.lacing's rings); the tape drawn is the run generated on them (runOf).
  // -> { pts (the tape's centre line), C (length along it), total, s (each point's arc along the hose), line, stitches:
  //      [{ s, turns, i0, i1, f0, f1, c (hose centre), tan, r (wrap radius) }], bracket, details: { lock, close },
  //      knots: [{ k, at, make(lam) }] (each lockstitch: runOf), body (the run's media-mesh body) }
  function plan(curve, lace, L, cab = {}, cabR = {}, hoseR) {
    if (!(hoseR > 0)) throw new Error("lacing tutorial: plan needs the hose's radius (od / 2)");
    const run = lace.runs[0], ss = run.s, line = hoseLine(curve), { arc } = line;
    let pts = run.pts.map((p) => p.slice(0, 3)), s = arcsOf(pts, line, ss[0]);
    const C = [0];
    for (let i = 1; i < pts.length; i++) C.push(C[i - 1] + dist(pts[i], pts[i - 1]));
    let total = C[C.length - 1];
    const stitches = ringsOf(pts, s, ss, L).map((q, k) => {
      const c = line.at(ss[k]);
      let r = 0;
      for (let i = q.i0; i <= q.i1; i++) r = Math.max(r, dist(pts[i], c));
      return { s: ss[k], turns: q.turns, i0: q.i0, i1: q.i1, f0: C[q.i0] / total, f1: C[q.i1] / total, c, tan: line.tan(ss[k]), r };
    });
    const n = stitches.length;
    // the pitfall's bracket: on the bundle between the last two lock stitches (where the lock run ends, so the camera
    // stays), along the side facing the lock run's camera: at each end the bundle's extent that way (its stitch's ring),
    // a tick out from the bundle at each stitch
    const bk = Math.max(1, n - 3), A = stitches[bk], B = stitches[bk + 1];
    const extent = (st, d) => { let m = 0; for (let i = st.i0; i <= st.i1; i++) m = Math.max(m, dot(sub(pts[i], st.c), d)); return m; };
    const bpts = [];
    for (let q = 0; q <= 16; q++) {
      const sv = A.s + (B.s - A.s) * q / 16, c = line.at(sv), d = unit(perp(TOP, line.tan(sv)));
      const r = extent(A, unit(perp(TOP, A.tan))) * (1 - q / 16) + extent(B, unit(perp(TOP, B.tan))) * q / 16 + L.tape;
      bpts.push(add(c, mul(d, r)));
    }
    const out = (st) => unit(perp(TOP, st.tan));
    const bracket = { k: bk, gap: B.s - A.s, pts: bpts, ticks: [[bpts[0], add(bpts[0], mul(out(A), 6))], [bpts[16], add(bpts[16], mul(out(B), 6))]] };
    // the close-ups: a short length of hose, cord, sleeve and tape round one stitch, its outline and its camera's frame
    const details = {};
    for (const [id, D] of Object.entries(DETAIL)) {
      const k = D.k < 0 ? n + D.k : D.k, st = stitches[k], s0 = st.s - D.before, s1 = st.s + D.after;
      const hoseIn = (a0, a1) => curve.filter((_, i) => arc[i] >= a0 && arc[i] <= a1).map((p) => p.slice(0, 3));
      const hose = hoseIn(s0, s1);
      let a = 0;
      while (a < pts.length - 1 && s[a] < s0) a++;
      let b = pts.length - 1;
      while (b > a && s[b] > s1 + 2) b--;
      const pr = profile(pts.slice(st.i0, st.i1 + 1), st.c, st.tan);
      details[id] = { k, s: st.s, line, s0, s1, c: st.c, t: st.tan, u: pr.u, v: pr.v, R0: pr.R0, rho: pr.rho, hose,
        cord: cab.cord ? cableSpan(cab.cord, line, s0, s1, 110) : [], sleeve: cab.sleeve ? cableSpan(cab.sleeve, line, s0, s1, 110) : [],
        tape: pts.slice(a, b + 1), ta: a, tb: b, before: D.before, after: D.after };
      details[id].rise = riseOf(details[id], L.tape);
      if (D.view) {                                  // the longer piece drawn (lacing_anim.js), not measured
        const v0 = st.s - D.view[0], v1 = st.s + D.view[1];
        details[id].view = { hose: hoseIn(v0, v1), cord: cab.cord ? cableSpan(cab.cord, line, v0, v1, 110) : [],
          sleeve: cab.sleeve ? cableSpan(cab.sleeve, line, v0, v1, 110) : [] };
      }
    }
    // the cables' points' places along the hose (as the tape's: walked forward, so a cable never jumps to the other run;
    // -Infinity before it reaches the hose), for fading what is not laced yet
    const cabS = {};
    for (const [k, cp] of Object.entries(cab)) {
      if (!cp) continue;
      const out = [];
      let jj = -1, last = -Infinity;
      for (const p of cp) {
        if (jj < 0) { const q = line.nearest(p); if (q.d < 70 && q.s >= ss[0] - 120) jj = q.i; else { out.push(-Infinity); continue; } }
        let best = jj, bd = Infinity, bs = arc[jj];
        for (let q = Math.max(0, jj - 40); q < Math.min(curve.length - 1, jj + 80); q++) {
          if (Math.abs(arc[q] - arc[jj]) > 80) continue;
          const d0 = sub(curve[q + 1], curve[q]), kk = clamp01(dot(sub(p, curve[q]), d0) / (dot(d0, d0) || 1)), d = dist(p, add(curve[q], mul(d0, kk)));
          if (d < bd) { bd = d; best = q; bs = arc[q] + kk * (arc[q + 1] - arc[q]); }
        }
        jj = best; last = Math.max(last, bs); out.push(last);
      }
      cabS[k] = out;
    }
    // (d14b) the run generated whole (runOf), after the bracket and the close-ups: they keep the model's tape
    const K = runOf(line, ss, L, Object.keys(cabR).filter((k) => cab[k]).map((k) => ({ pts: cab[k], r: cabR[k] })), hoseR);
    pts = K.pts; s = K.s; C.length = 1;
    for (let i = 1; i < pts.length; i++) C.push(C[i - 1] + dist(pts[i], pts[i - 1]));
    total = C[C.length - 1];
    stitches.forEach((q, k) => Object.assign(q, { i0: K.rings[k].i0, i1: K.rings[k].i1, f0: C[K.rings[k].i0] / total, f1: C[K.rings[k].i1] / total }));
    return { pts, C, total, s, arc, curve, line, stitches, bracket, details, cab, cabS, knots: K.knots, body: K.B, spans: K.spans, hoseAt: line.at, tanAt: line.tan };
  }
  // each tape point's place along the hose: the nearest centre-line sample, walked forward from the first stitch's s0 (the
  // hose folds back under itself, so a free search could land on the other run), projected onto that segment
  function arcsOf(pts, line, s0) {
    const { curve, arc } = line, s = [];
    let j = line.nearArc(s0);
    for (const p of pts) {
      let best = j, bd = Infinity, bs = arc[j];
      for (let q = Math.max(0, j - 40); q < Math.min(curve.length - 1, j + 80); q++) {
        if (Math.abs(arc[q] - arc[j]) > 60) continue;
        const d0 = sub(curve[q + 1], curve[q]), k = clamp01(dot(sub(p, curve[q]), d0) / (dot(d0, d0) || 1));
        const d = dist(p, add(curve[q], mul(d0, k)));
        if (d < bd) { bd = d; best = q; bs = arc[q] + k * (arc[q + 1] - arc[q]); }
      }
      j = best;
      s.push(bs);
    }
    return s;
  }
  // each stitch's ring: the tape points within its wraps' width of its place ss[k] (lacing() wraps each stitch round the
  // hose at its exact place, hose_route.js) -> [{ turns, i0, i1 }]
  function ringsOf(pts, s, ss, L) {
    const adv = L.tape * 1.1, out = [];
    let from = 0;
    for (let k = 0; k < ss.length; k++) {
      const turns = k === 0 ? L.wraps[0] : k === ss.length - 1 ? L.wraps[2] : L.wraps[1], w = adv * turns / 2 + 2.0;
      let i0 = -1, i1 = -1;
      for (let i = from; i < pts.length; i++) {
        if (Math.abs(s[i] - ss[k]) <= w) { if (i0 < 0) i0 = i; i1 = i; }
        else if (i0 >= 0 && s[i] > ss[k] + w) break;
      }
      if (i0 < 0) throw new Error(`lacing tutorial: stitch ${k} at ${ss[k].toFixed(1)} mm has no tape points`);
      out.push({ turns, i0, i1, w });
      from = i1 + 1;
    }
    return out;
  }
  // (d14, the maintainer on draft 13: the run's lock stitches were flat rings, never knotted; d14b, on draft 14: knots
  // spliced into the model's ring tape left kinks and steps at every join, a loopy U-turn, and gaps where the strands
  // should lie tight - each join a patch) the run generated whole, from the stitches' arcs and the bundle alone: a
  // media-mesh body along the hose (body.ofTubes) with the cables beside it as the model's section lays them (hose_route.js
  // section: the hose od / 2 + half a tape, each cable d / 2 + half a tape, on the hose to L.near mm out of contact,
  // fading over L.fade), and rope.lace on it - one piece a stitch, the first and last the model's turns (L.wraps), the
  // rest lockstitches (marline hitches), the drawn tape's radius (HITCH.tr) and CLEAR between tapes. The BOM keeps the
  // model's lacing (LR4Hose.lacing); only the tutorial's tape is this one.
  // RUN: margin (mm of body past the first and last stitch), n (the outline's angle bins: at 72 a cable's crest read
  // 0.3 - 0.4 mm under the hull - media-mesh body "Not done"; at 144 the taut spans bent 0.05 /mm over a mm or two at each
  // bin's edge on the flank between the hose and a cable, 0.03 at 288 and 360 - at 360 the starting turns 2.097 mm apart), step (mm between the body's stations: 2 -> 3 took 5 ms off
  // a pose, the clearances the same to 0.02 mm), per (points a control point: at 4 the tape came 2.08 mm from itself,
  // under CLEAR's 2.15 less 0.05), tail (mm of tape past
  // the closing turns: the tape ends there, as the model's did at its last ring), taut (rope.taut on the spans between
  // knots: sweeps, nodes, and lead - mm along each knot's own line before the span turns to its path; 15 sweeps (knotLace
  // 27 ms a new pose for both runs, 33 at 20), 20 within
  // 0.03 mm of 400, 10 nodes within 0.2 mm of 20, 10 ms a run; null: as laced), cable (mm more on each cable's circle:
  // a binned outline laid out radially reads a cable's flank short - the starting turns 0.12 mm into the sleeve where it
  // rises 11 mm off the hose), squeeze (the least share of the outline's mm a lockstitch's top keeps two tapes up; on the
  // U-turn's inside, the cables' side, 0.72 at stitch 3: its crossings' lifts stacked 8.1 mm off the outline and the tape
  // came 0.89 mm through itself, so a knot there is turned round the hose to the least angle that keeps this share, found
  // in steps of `turn` degrees, then halved down: stitches 3 and 4, 35 degrees; at 0.9, 2.08 mm from itself), spread (a
  // gap's bend, as the share its outline's mm differ between th = 0 and the knot's angle: from the first, a neighbour
  // is turned with the knot, by the second as far: runOf)
  const RUN = { margin: 40, n: 288, step: 3, tail: 6, cable: 0.3, squeeze: 0.95, turn: 5, per: 6, spread: [0.05, 0.2], taut: { iters: 15, nodes: 10, lead: 3 } };
  // a lockstitch's angle round the body at arc s (0: the cables' side), its top turned off the inside of a bend
  function topOf(B, s) {
    const at = (sv, th, r) => { const f = B.frameAt(sv), c = Math.cos(th), sn = Math.sin(th); return f.c.map((v, k) => v + (c * f.u[k] + sn * f.v[k]) * (B.rhoAt(th, sv) + r)); };
    // (the least over the knot's length, 5 mm either side: a bend starting 3 mm past stitch 2, at the core's dx 210, lifted
    // its crossings 12.8 mm off the outline with the share at the stitch itself 0.95)
    const top = 3 * HITCH.tr + 2 * (2 * HITCH.tr + CLEAR), share1 = (sv, th) => dist(at(sv + 1, th, top), at(sv - 1, th, top)) / dist(at(sv + 1, th, HITCH.tr), at(sv - 1, th, HITCH.tr));
    const share = (th) => Math.min(share1(s - 4, th), share1(s - 2, th), share1(s, th), share1(s + 2, th), share1(s + 4, th));
    if (share(0) >= RUN.squeeze) return 0;
    // (turned the way the share grows, and to where it reaches squeeze, not to a whole step: the core's travel moves the
    // U-turn along the run, and a knot turned by whole steps jumped 19 mm in a frame of the opening - d14b's flicker)
    // (away from the bend's inside, from the line's turn over 12 mm - or -1 where it is straight: the side the share grows
    // on flipped between two stitches' worth at the core's dx 70 and 71, the U-turn's knots from +103 to -49 degrees)
    const t0 = B.line.tan(s - 6), t1 = B.line.tan(s + 6), F = B.frameAt(s), kv = t1.map((v, i) => v - t0[i]);
    const ku = dot(kv, F.u), kw = dot(kv, F.v), g = RUN.turn * Math.PI / 180, dir = Math.hypot(ku, kw) > 1e-3 && kw < 0 ? 1 : -1;
    let lo = 0, hi = g;
    while (hi < Math.PI && share(dir * hi) < RUN.squeeze) { lo = hi; hi += g; }
    if (hi >= Math.PI) return 0;
    for (let it = 0; it < 12; it++) { const m = (lo + hi) / 2; if (share(dir * m) >= RUN.squeeze) hi = m; else lo = m; }
    return dir * hi;
  }
  // the body round a run's stitches ss: cables [{ pts, r }] (r = d / 2), the hose's radius hoseR
  function bodyOf(line, ss, L, cables, hoseR) {
    const end = line.arc[line.arc.length - 1], s0 = Math.max(0, ss[0] - RUN.margin), s1 = Math.min(end, ss[ss.length - 1] + RUN.margin);
    // (each cable only where it can count: its stretches within reach of the body's line, each a tube of its own - the
    // body looks for every station's crossing along all of a tube, and the cord runs the machine's length: 12 ms of a
    // body's 17. A stretch's ends one point past the reach, so its crossings there are the whole cable's)
    const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < line.curve.length; i++) if (line.arc[i] >= s0 - 5 && line.arc[i] <= s1 + 5) for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], line.curve[i][k]); hi[k] = Math.max(hi[k], line.curve[i][k]); }
    const tubes = [];
    for (const c of cables) {
      const reach = hoseR + 2 * c.r + L.near + L.fade + 10, pts = spline(c.pts.map((p) => p.slice(0, 3)), 4);
      const inBox = pts.map((p) => p.every((v, k) => v >= lo[k] - reach && v <= hi[k] + reach));
      let run = null;
      pts.forEach((p, i) => {
        if (inBox[i] || inBox[i - 1] || inBox[i + 1]) (run = run || []).push(p);
        else if (run) { if (run.length > 1) tubes.push({ pts: run, c }); run = null; }
      });
      if (run && run.length > 1) tubes.push({ pts: run, c });
    }
    return BD.ofTubes(line, { r: hoseR + L.tape / 2, n: RUN.n, step: RUN.step, out: HITCH.tr, s0, s1, sides: RUN.sides,
      // (the body weighs a cable out to r + 2 r_tube + near: the model's od / 2 + d + L.near)
      tubes: tubes.map(({ pts, c }) => ({ pts, r: c.r + L.tape / 2 + RUN.cable, near: L.near - 1.5 * L.tape - 2 * RUN.cable, fade: L.fade })) });
  }
  // a run generated on its body -> { pts, s (each point's arc along the hose), rings: [{ i0, i1 }] (a stitch's own tape:
  // the turns, or a lockstitch's turn to where its end is clear; the first from the tape's start, the last to its end),
  // knots: [{ k, at (its piece's first point in pts), make(lam) (the piece's points at looseness lam: (lam - 1) R0 mm off
  // the outline, as many as at 1, so a loose knot stands in for the snug one point for point - draw.js tapeOf) }], B }
  function runOf(line, ss, L, cables, hoseR) {
    const B = bodyOf(line, ss, L, cables, hoseR), n = ss.length;
    // (a knot turned off a bend's inside turns its neighbours with it where the gap between them is bent: there the
    // outline's mm at one angle and another differ - 24 against 52 mm from stitch 2 to 3 on the U-turn - and a run stepping
    // round across it folded back on itself, 0.79 mm from its own standing part, and 2 mm into the sleeve. Weighed by how
    // bent, smoothly, so a knot's angle moves with the core's pose and never jumps: spread)
    const th = ss.map((s, k) => (k === 0 || k === n - 1 ? 0 : topOf(B, s)));
    const bent = ss.slice(1).map((s, k) => {
      const a = Math.abs(th[k]) > Math.abs(th[k + 1]) ? th[k] : th[k + 1], L0 = B.surf(ss[k], s, 0), L1 = B.surf(ss[k], s, a);
      return smooth((Math.abs(L1 - L0) / Math.max(L0, L1, 1e-9) - RUN.spread[0]) / (RUN.spread[1] - RUN.spread[0]));
    });
    for (let it = 0; it < 3; it++) th.forEach((t, k) => {
      for (const [j, b] of [[k - 1, bent[k - 1]], [k + 1, bent[k]]]) if (j >= 0 && j < n && Math.abs(th[j] * b) > Math.abs(th[k])) th[k] = th[j] * b;
    });
    const st = ss.map((s, k) => (k === 0 || k === n - 1 ? { s, kind: "turns", turns: L.wraps[k === 0 ? 0 : 2], w: th[k] * B.R0 } : { s, kind: "lock", w: th[k] * B.R0 }));
    const o = { tr: HITCH.tr, clear: CLEAR, tail: RUN.tail, n: RUN.per, level: 0, tight: !!RUN.taut };   // (level 0: steps round only in straight gaps - spread; at 0.2 a 30 mm tread mid-gap read as a stair)
    // (d14b, the maintainer on the finale's frames: the tape S-bent into and out of each knot, "real rope/tape pulled in
    // tension wouldn't have this extra slack wiggle" - the spans between the knots laid again taut, rope.taut: the
    // shortest path over the body from one knot's end to the next's standing part)
    const R0 = RP.lace(B, st, o), Tt = RUN.taut ? RP.taut(B, R0.pts, R0.s, R0.spans, Object.assign({ tr: HITCH.tr }, RUN.taut)) : R0, last = R0.pts.length - 1;
    const R = { pts: Tt.pts, s: Tt.s, pieces: R0.pieces }, dOf = (i) => sub(Tt.pts[i], R0.pts[i]);
    const rings = R.pieces.map((p, k) => ({ i0: k === 0 ? 0 : Math.round(p.ring[0]), i1: k === n - 1 ? last : Math.round(p.ring[1]) }));
    const knots = R.pieces.filter((p) => p.kind === "lock").map((p) => {
      const memo = new Map();                        // (lam -> points: a pull asks for each frame's lam, a still for one)
      // (loose: the knot laced loose, its spans moved as the taut run's - the same count, snug at lam 1)
      const make = (lam) => {
        if (lam === 1) return R.pts.slice(p.i0, p.i1 + 1);
        const key = +lam.toFixed(6);
        if (!memo.has(key)) {
          if (memo.size > 64) memo.delete(memo.keys().next().value);
          memo.set(key, RP.lace(B, st, Object.assign({ loose: { [p.k]: (lam - 1) * B.R0 } }, o)).pts.slice(p.i0, p.i1 + 1).map((q, i) => add(q, dOf(p.i0 + i))));
        }
        return memo.get(key);
      };
      return { k: p.k, at: p.i0, make };
    });
    return { pts: R.pts, s: R.s, rings, knots, B, ss, spans: R0.spans };
  }
  // a lacing's runs at the build pose (runOf each), for knotLace to carry to other poses: curve, lace, cables (per run,
  // [{ pts, r }]: the cord and sleeve to the breakout, then the cord - as LR4Hose.lacing's runs) and hoseR as plan's
  function refsOf(curve, lace, L, cables, hoseR) {
    const line = hoseLine(curve);
    return lace.runs.map((run, r) => runOf(line, run.s, L, cables[r] || [], hoseR));
  }
  // each point of a generated run in its body's terms: [arc, mm along the line there, angle, mm off the outline]
  function placesOf(R) {
    if (!R.places) R.places = R.pts.map((p, i) => {
      const f = R.B.frameAt(R.s[i]), d = sub(p, f.c), u = dot(d, f.u), v = dot(d, f.v), th = Math.atan2(v, u);
      return [R.s[i], dot(d, f.t), th, Math.hypot(u, v) - R.B.rhoAt(th, R.s[i])];
    });
    return R.places;
  }
  // a lacing's runs at any pose (the opening's ghost of run 0, the finale's real lacing): each run generated at the build
  // pose (refs: refsOf) and carried here - each point as many mm along the outline from its stitch (the build pose's
  // stitch arcs to this pose's), at the same angle round this pose's body and as far off its outline. (d14b: generated anew at each pose,
  // a knot turned off the U-turn's inside chose its angle afresh as the U-turn moved along the run - 19 to 33 mm jumps in
  // a mm of travel, and where the U-turn met a knot its crossings' lifts stacked 10 mm high and the run folded into the
  // sleeve; carried, the knots are the build pose's at every pose.) A run with a stitch more or less than its ref, or no
  // ref, is generated here. cables as refsOf's (or one list for every run); hoseR = od / 2 -> [pts] a run. The last few
  // calls kept by their inputs' values (the page sweeps anew each frame: a parked core asks for the same pose again)
  const LACED = [];
  function knotLace(curve, lace, L, cables, hoseR, refs = []) {
    const per = Array.isArray(cables[0]), mid = (q) => (q && q.length ? [q[0], q[q.length >> 1], q[q.length - 1]] : null);
    const key = JSON.stringify([curve.length, mid(curve), lace.runs.map((r) => r.s), (per ? cables.flat() : cables).map((c) => [c.r, c.pts.length, mid(c.pts)]), hoseR, L.tape]);
    let hit = LACED.find((e) => e.key === key && e.refs === refs);
    if (!hit) {
      const line = hoseLine(curve);
      hit = { key, refs, runs: lace.runs.map((run, r) => {
        const cab = per ? cables[r] || [] : cables, ref = refs[r], ss = run.s;
        if (!ref || ref.ss.length !== ss.length) return runOf(line, ss, L, cab, hoseR).pts;
        const B = bodyOf(line, ss, L, cab, hoseR), B0 = ref.B, S0 = ref.ss, n = ss.length;
        // (the build pose's arc -> this pose's: as many mm along the outline at the point's angle from its stitch - a knot
        // keeps its tape's spacing where the U-turn now bends under it, as rope.lace lays it by the outline's mm; mapped
        // stitch to stitch by arc, the U-turn squeezed a knot that had been on the straight to 0.73 mm through itself -
        // and between two stitches blended from one's to the next's over the middle, 8 mm clear of each)
        const from = (k, sv, th) => B.alongOf(ss[k], B0.surf(S0[k], sv, th), th);
        const map = (sv, th) => {
          if (sv <= S0[0]) return from(0, sv, th);
          if (sv >= S0[n - 1]) return from(n - 1, sv, th);
          let k = 0;
          while (k < n - 2 && S0[k + 1] < sv) k++;
          const f = smooth((sv - S0[k] - 8) / (S0[k + 1] - S0[k] - 16));
          return f <= 0 ? from(k, sv, th) : f >= 1 ? from(k + 1, sv, th) : from(k, sv, th) * (1 - f) + from(k + 1, sv, th) * f;
        };
        // (a span's inside is laid again by taut: not carried - half the points, 4 ms a pose)
        const inSpan = new Uint8Array(ref.pts.length);
        if (RUN.taut) for (const [a, b] of ref.spans) for (let i = a + 1; i < b; i++) inSpan[i] = 1;
        const S1 = [], carried = placesOf(ref).map(([sv, ta, th, h], i) => {
          if (inSpan[i]) { S1[i] = sv; return null; }
          const s1 = (S1[i] = map(sv, th)), f = B.frameAt(s1), r = B.rhoAt(th, s1) + h, c = Math.cos(th), sn = Math.sin(th);
          return [0, 1, 2].map((k) => f.c[k] + f.t[k] * ta + (c * f.u[k] + sn * f.v[k]) * r);
        });
        // (the knots carried, the spans between them pulled taut again on this pose's body: carried, a span taut at the
        // build pose bowed 6 - 10 mm off the shortest path where the U-turn had moved under it)
        return RUN.taut ? RP.taut(B, carried, S1, ref.spans, Object.assign({ tr: HITCH.tr }, RUN.taut)).pts : carried;
      }) };
      LACED.unshift(hit);
      if (LACED.length > 4) LACED.pop();
    }
    return hit.runs;
  }
  // (draft 11, clearance) how far a close-up's cables stand further out than at its stitch, where the outline rho was
  // taken: (a, th) -> mm to add to rho(th) there. The starting stitch's sleeve rises 4 mm over the clove hitch's 7 mm
  // (cordRoute's lift), and the clove's wraps, laid on rho, went 1.2 mm into it. Each cable's rise is its centre's, over
  // the angle it covers at the stitch (its top there is the outline: rho less half a tape, out from its centre), easing
  // to nothing over as much again either side. -> (a, th) => mm (0 where no cable rises)
  function riseOf(D, tape) {
    const flat = (p) => {                            // a point -> [a, th, r] in the close-up's frame (the hose bends:
      let sv = D.s + dot(sub(p, D.c), D.t);          // walked along it from the stitch, never to the other run)
      for (let k = 0; k < 8; k++) sv += dot(sub(p, D.line.at(sv)), D.line.tan(sv));
      const ta = D.line.tan(sv), ua = unit(perp(D.u, ta)), va = cross(ta, ua), r = sub(p, D.line.at(sv));
      return [sv - D.s, Math.atan2(dot(r, va), dot(r, ua)), len(r)];
    };
    const cabs = [D.cord, D.sleeve].filter((c) => c && c.length > 1).map((c) => {
      const q = c.map(flat).sort((x, y) => x[0] - y[0]);
      const at = (a) => {                            // [th, r] at a (held past its ends)
        if (a <= q[0][0]) return [q[0][1], q[0][2]];
        let i = 0;
        while (i < q.length - 2 && q[i + 1][0] < a) i++;
        const k = clamp01((a - q[i][0]) / ((q[i + 1][0] - q[i][0]) || 1));
        return [q[i][1] + (q[i + 1][1] - q[i][1]) * k, q[i][2] + (q[i + 1][2] - q[i][2]) * k];
      };
      const [th0, r0] = at(0), half = Math.asin(Math.min(0.5, Math.max(0.02, (D.rho(th0) - tape / 2 - r0) / r0)));
      return { at, r0, half, top: D.R0 - D.rho(th0) < 0.5 };
    }).filter((c) => c.top);                         // (only the cable the outline's top is: the hull bridges the others,
                                                     // so their size can't be read off it - the starting stitch's cord)
    return (a, th) => {
      let up = 0;
      for (const c of cabs) {
        const [tc, rc] = c.at(a), d = Math.abs(Math.atan2(Math.sin(th - tc), Math.cos(th - tc))) / c.half;
        if (rc > c.r0 && d < 2) up = Math.max(up, (rc - c.r0) * (1 - smooth(d - 1)));
      }
      return up;
    };
  }
  // the share of a cable's length (its polyline) where it first reaches arc s along the hose (1: never)
  function cableCut(P, which, sv) {
    const cp = P.cab[which], cs = P.cabS[which];
    if (!cp || !cs) return 1;
    let L = 0, tot = 0, at = -1;
    for (let i = 1; i < cp.length; i++) tot += dist(cp[i], cp[i - 1]);
    for (let i = 0; i < cp.length; i++) { if (i) L += dist(cp[i], cp[i - 1]); if (cs[i] >= sv) { at = L; break; } }
    return at < 0 ? 1 : at / (tot || 1);
  }
  // the plan on a hose from its data alone (LR4Hose's pure route; the page uses three.js's curve, the same line): the
  // tests and tools/lacing_voice.js transcript
  function referencePlan(H, h) {
    const curve = H.catmullRom(H.hoseRoute(h, 0, 0).map((p) => p.slice(0, 3)), 12), c = h.cord, sl = h.sleeve;
    const cp = H.cordRoute(curve, h, c, c.tip, c.tip2, 0), sp = sl ? H.cordRoute(curve, h, sl, null, null, 0, [0, 0, 0]) : null;
    const runs = sp ? [{ to: "breakout", x: sl.exit.x, cables: [{ pts: cp, d: c.d }, { pts: sp, d: sl.d }] }, { to: "exit", cables: [{ pts: cp, d: c.d }] }]
      : [{ to: "exit", cables: [{ pts: cp, d: c.d }] }];
    return Object.assign(plan(curve, H.lacing(curve, h, runs, 0), H.LACING, { cord: cp, sleeve: sp }, { cord: c.d / 2, sleeve: sl ? sl.d / 2 : 0 }, h.od / 2), { apexAt: apexOf(H, h, curve) });
  }
  // the hose's U-turn apex (its furthest point in +X) with the core dx out: hoseRoute re-swept at that pose, as updateHose
  // does (dx = 0: the plan's own curve) -> (dx) => [x, y, z] (remembers the poses it has seen: the same dx, the same point)
  function apexOf(H, h, curve0, dense = (pts) => H.catmullRom(pts, 12)) {
    const memo = new Map(), far = (c) => c.reduce((m, p) => (p[0] > m[0] ? p : m), c[0]).slice(0, 3);
    return (dx) => {
      const key = +dx.toFixed(6);
      if (!memo.has(key)) {
        if (memo.size > 4000) memo.clear();
        memo.set(key, key === 0 && curve0 ? far(curve0) : far(dense(H.hoseRoute(h, key, 0).map((p) => p.slice(0, 3)))));
      }
      return memo.get(key);
    };
  }
  const api = { apexOf, cableCut, plan, referencePlan, knotLace, refsOf, RUN };
  if (NODE) module.exports = api;
  else (root.LR4Lacing = root.LR4Lacing || {}).plan = api;
})(typeof self !== "undefined" ? self : this);
