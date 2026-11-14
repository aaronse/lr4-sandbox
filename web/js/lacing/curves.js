// Polylines and curves for the lacing: MediaMesh.curve (media-mesh-core.min.js, vendored) under the lacing's names -
// hoseLine (the hose's centre line: arc lengths, the point / tangent at an arc length, the nearest sample), cableSpan
// (a cable's run along the hose between two arcs), profile (a stitch's bundle outline by angle), spline (centripetal
// Catmull-Rom; extra values per point ride along), alongAt (the point L along a strand).
//   Uses MediaMesh.curve. Tests: media-mesh core/lib/curve.test.ts; tests/test_lacing_tutorial.js --only plan, knotgen, clearance.
(function (root) {
  "use strict";
  const NODE = typeof module !== "undefined" && module.exports;
  const CV = NODE ? require("../lib/media-mesh/media-mesh-core.min.js").curve : root.MediaMesh.curve;
  // the hose's centre line (tan: the chord over +-3 mm)
  const hoseLine = (curve) => CV.line(curve, 3);
  // the longest run of a cable's points that lies on the hose between arc s0 and s1 (within maxD of the centre line)
  const cableSpan = CV.span;
  // a stitch's bundle outline, from the tape's own ring (lacing() wrapped it round the hull of the hose and the
  // cables): radius by angle in its frame (u = the cables' side, v = t x u), 5 degree bins, gaps filled
  const profile = (ring, c, t) => CV.profile(ring, c, t, 72);
  const api = { hoseLine, cableSpan, profile, spline: CV.spline, alongAt: CV.alongAt };
  if (NODE) module.exports = api;
  else (root.LR4Lacing = root.LR4Lacing || {}).curves = api;
})(typeof self !== "undefined" ? self : this);
