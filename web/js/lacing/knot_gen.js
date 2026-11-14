// Knots as steps (SHOTS.knots; docs/specs/lacing-tutorial.md "Shots and knots as data"): MediaMesh.rope's generator
// (media-mesh-knots.min.js, vendored) with the lacing's tape - lap notation (lapW), the steps' control points (stepCps),
// a flat point laid on the bundle (layKnot), and knotGen (the strands at work w: drawn, crossings found and lifted
// clear, the first grown from the tape's end, checked by the handover).
//   Uses MediaMesh.rope / bundle, core. Tests: media-mesh knots/lib/rope.test.ts; tests/test_lacing_tutorial.js --only knotgen,
//   closing, tape, clearance.
(function (root) {
  "use strict";
  const NODE = typeof module !== "undefined" && module.exports, use = (f) => (NODE ? require(`./${f}.js`) : root.LR4Lacing[f]);
  const mm = (f) => (NODE ? require("../lib/media-mesh/media-mesh-knots.min.js")[f] : root.MediaMesh[f]);
  const RP = mm("rope"), BU = mm("bundle");
  const { HITCH, CLEAR, handover } = use("core");

  // ---- knots as steps (SHOTS.knots; docs/specs/lacing-tutorial.md "Shots and knots as data"): a knot is a short list of
  // steps per strand, drawn by one generator on the close-up's bundle outline - the same outline the model's lacing()
  // wrapped its stitch round (D.rho: the tape's own ring), so a knot sits where the lacing does. A point is [a (mm along
  // the hose from the stitch), w (mm round the bundle from the cables' side; "C-10" = a lap less 10 mm), h (layers)].
  // Steps: { op: "start", a, w, h } the strand's free end; { op: "to", pts: [[a, w, h?]] } through points; { op: "wrap",
  // to: w | turns: n (signed), a } turns round the bundle (points every 1/16 turn), drifting to a; { op: "arc", c: [a, w],
  // r, from, sweep (deg) } a flat bend (a bight); any step may say loose: true (its points stand off the outline by the
  // knot's "loose" mm, which the pull shrinks to 0) or loose: mm (its own), under: true (it passes under what it crosses;
  // else over), until: work (the strand is drawn to the step's end by then), from: work (its drawing starts then, not
  // at the step before's until: a hold between, draft 9) and what (its phase's words in the transcript); a "to" point's
  // 4th value is its share of the step's looseness (0 - 1); a "to" step's snug: [[a, w, h?]], one a point, is where its
  // points go as its pull runs (draft 12: the half hitches drawn open, pulled closed onto H, not only down onto the
  // bundle, which seen from above barely moved). { op: "pull", from, to, out } the looseness of the loose
  // steps since the pull before goes from 1 to 0 over that work (one knot can be pulled in stages: draft 9), the end
  // drawn out by out mm at the last pull. A step's end: "<name>" names the strand's free end from there (a cut's end). Crossings are found, not typed: where the strand crosses itself or an
  // earlier strand (round the bundle: laps apart are the same place), the one on top is lifted a tape's thickness there
  // (a signed radial offset, bump layers, Gaussian over bw mm along it); a strand with alternate: "under" | "over" takes
  // its crossings in turn, from that one. A knot: { detail, at (a offset), w0 (w offset), loose (mm), unit (mm a unit of
  // the steps' numbers, from unitPull: [loose, snug] when it is pulled), sx: "screen" (a mirrored so the knot reads from
  // its scene's camera), h0 (layers under it all), draw: [from, to] (no step until: the strand drawn evenly over that), strands: [{ steps }] |
  // steps }.
  // (the generator's history - draft 9's staged pulls and step from, draft 11's clearance: wraps every 1/16 turn, points
  // laid no lower than the outline, a crossing's top strand lifted to a tube's diameter + CLEAR over the one under,
  // measured in place - is in media-mesh knots/lib/README.md "rope")
  // (n: spline points a control-point span; bw: a crossing's bump, mm along the strand at least)
  const KNOT_GEN = { bump: 1.0, bw: 2.4, n: 6 };
  const OPTS = { tr: HITCH.tr, clear: CLEAR, n: KNOT_GEN.n, bw: KNOT_GEN.bw, pinned: (pin, p0) => handover("the knot", pin, p0) };
  // a flat knot point [a, w, h, f] on the bundle: the outline + a tube radius + its layers (+ dh) + the looseness left (f mm)
  const layKnot = (D, p, dh) => BU.lay(D, p, dh, HITCH.tr);
  // the knot at work w -> { strands: [{ pts, cum, total, draw }], flat: [{ cps, dense, ends }], crossings, pull (the last
  // pull's) }
  const knotGen = (K, D, w, sx = 1) => RP.knotGen(K, D, w, sx, OPTS);
  // a knot's steps: K.steps, else its macro sequence expanded (K.sequence: rope.expand; the closing stitch, 2026-11-10)
  const stepsOf = RP.stepsOf, macrosOf = (K) => (K.sequence ? RP.expand(K.sequence).macros : []);
  const api = { KNOT_GEN, knotGen, lapW: RP.lapW, stepCps: RP.stepCps, layKnot, stepsOf, macrosOf };
  if (NODE) module.exports = api;
  else (root.LR4Lacing = root.LR4Lacing || {}).knot_gen = api;
})(typeof self !== "undefined" ? self : this);
