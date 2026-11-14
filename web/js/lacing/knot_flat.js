// Flat knots in (a, w) for the lacing: MediaMesh.knot (media-mesh-knots.min.js, vendored) under the lacing's names - the
// square (reef) knot's textbook figure (reefFlat, its shape REEF in units), two strands' over / under layers from their
// crossings (layered: clear passed in; knots.js's layered passes the lacing's), a flat polyline densified (denseIdx) and
// its length to an index (flatTo).
//   Uses MediaMesh.knot. Tests: media-mesh knots/lib/knot.test.ts; tests/test_lacing_tutorial.js --only story (the reef's shape
//   and crossings), clearance.
(function (root) {
  "use strict";
  const NODE = typeof module !== "undefined" && module.exports;
  const KN = NODE ? require("../lib/media-mesh/media-mesh-knots.min.js").knot : root.MediaMesh.knot;
  // the square knot (a reef knot), flat (draft 5: the textbook figure - two U-bights interlocked, each end leaving beside
  // its own standing part, both ends on one side - not drawn freehand). In units, x to the screen's right, y away from the
  // standing parts: L's standing part comes in from the left at y -P, crosses to the right and turns up round its bight
  // (centre (1, 0), radius 1), and its end goes back out to the left at y +P; R is L mirrored (x -> -x). The legs close in
  // to +-P past the other's bight, so each bight holds the other's two legs: six crossings, over and under in turn
  // (layered). Mapped to a = ac + sx x k along the hose, w = wc + sy y k round it (sy -1: the standing parts towards +w).
  // -> { L, R ([[a, w]], standing part first), mid (each bight's far point: its index - the first half knot ties to it) }
  // (draft 11, clearance: a 2 mm tube needs room - each bight RY units tall, the other's legs a tube's diameter + CLEAR
  // inside it at the snug size, its own legs P apart, the knot about four tubes tall snug. Draft 5-10's bights were 1 unit
  // tall, legs 0.45: the legs ran 0.96 mm from the other's bight, and a bight changed layer between two legs 2.2 mm apart)
  const REEF = KN.REEF, reefFlat = KN.reef;            // (REEF = { P: 0.75, X0: 2.4, RY: 1.9 })
  // the layers of two flat strands from their crossings: the working end R under at its first crossing (first -1: in
  // the reef, R's standing part passes under L's bight, then over L's standing part - right over left - and so on), then
  // alternating along it (L the other way: a reef knot alternates along each strand), a bump round each crossing (width
  // bw mm) on top of base layer h0. rDrawn = how far along R (mm, flat) is laid: L only bends round the crossings R has
  // reached. -> { L: [[a, w, h]], R, crossings: [{ at, lr (mm along R), over (+1: R over) }] }; clear = the air kept
  // between two strands at a crossing, x a tube's diameter (knots.js passes CLEAR / 2 HITCH.tr)
  // (draft 11, clearance: each side gives half a tube's diameter + CLEAR - draft 5-10 gave half a diameter, the tubes
  // touching - and L makes room before R's end reaches it: draft 5-10 bent L only as R passed, R's end 0.7 mm from L
  // for a frame or two. The bumps are bw wide and flat-topped: wider ones cancel each other between the reef's
  // crossings, over and under in turn)
  const layered = KN.layered;
  // densify a flat polyline to about every `step` mm (so the bumps sit on the crossings, not between control points) ->
  // { pts, at (each input point's index in pts) }
  // (scale: the segments' lengths are counted x scale - the reef's at its loose size, so the count stays the same as it is
  // pulled snug; tailN: the last segment's count, fixed - draft 6: a count that changed with k or the tail resampled the
  // strand each frame, 319 -> 223 points over the tie's pull)
  const denseIdx = KN.densify;
  const api = { layered, reefFlat, denseIdx, flatTo: KN.flatTo, REEF };
  if (NODE) module.exports = api;
  else (root.LR4Lacing = root.LR4Lacing || {}).knot_flat = api;
})(typeof self !== "undefined" ? self : this);
