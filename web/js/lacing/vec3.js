// 3-vector helpers on plain [x, y, z] arrays: MediaMesh.vec3 (media-mesh-core.min.js, vendored in web/js/lib/media-mesh/
// by tools/sync_media.js), kept under this module's name so every lacing module's use("vec3") is unchanged - clamp01,
// smooth, lerp, sub, add, mul, dot, cross, len, unit, dist, perp, rotAbout, dirIn / azElIn (az / el in a frame).
//   Uses MediaMesh.vec3. Tests: media-mesh core/lib/vec3.test.ts; tests/test_lacing_tutorial.js (every section uses them).
(function (root) {
  "use strict";
  const NODE = typeof module !== "undefined" && module.exports;
  const api = NODE ? require("../lib/media-mesh/media-mesh-core.min.js").vec3 : root.MediaMesh.vec3;
  if (NODE) module.exports = api;
  else (root.LR4Lacing = root.LR4Lacing || {}).vec3 = api;
})(typeof self !== "undefined" ? self : this);
