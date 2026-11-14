// The camera from the shots (SHOTS.scenes[id].camera): a key's focus (focusOf: "lacing", "machine", a stitch, a
// close-up, a surface point, the tape's end, the U-turn ...) and frame (frameOf), a key's camera (keyCam), the scene's
// clock (clockOf), the scene's camera at local s (shotOf: eased keys or a spline), the tweak panel's new key (addKey),
// the finale's camera (finaleAt), the cuts and their dips (isCut, dipAt), the moves between scenes (leadOf, cameraAt),
// and the layers' opacities (LAYERS, layersAt). The interpolation, the keys' clock, the moves and the dip are media-anim's
// camera / timeline, given this video's foci, frames, work clock, DETAIL_OF and DIP.
//   Uses data, vec3, core, knots, draw, media-anim timeline / camera. Tests: tests/test_lacing_tutorial.js --only frames,
//     shots, framing, events.
(function (root) {
  "use strict";
  const NODE = typeof module !== "undefined" && module.exports, use = (f) => (NODE ? require(`./${f}.js`) : root.LR4Lacing[f]);
  const { SHOTS } = use("data");
  const lib = (f) => (NODE ? require("../lib/media-anim/media-anim-runtime.min.js")[f] : root.MediaAnim[f]);
  const { lerp, add, mul, dist } = use("vec3");
  const TL = lib("timeline"), CAM = lib("camera"), { bodyOf } = TL;
  const { DIP, DETAIL_OF, HITCH, timing, workAt } = use("core");
  const { hitchPath, surfaceAt } = use("knots");
  const { drawOf, tipS, poseOf } = use("draw");

  // ---- the camera: [[position], [target]] per scene, a pure function of t, from the scene's shot (SHOTS = docs/specs/
  // lacing-tutorial.shots.json). g = { fov (vertical, deg), aspect, machine: { c, r } (the page's machine box) } ----
  // a key's focus -> { p (the target), r (its radius: "lacing", "machine"), frame (a surface's [n, b, t]) }. ctx = { P, g,
  // sc, local, dx (the core's travel now) }. A focus is a name or an object:
  //   "lacing"   the laced run's box (widened by the core's travel), r its half diagonal; "machine" the page's machine box
  //   "cross"    the lock stitch's crossing (its hitch, loose); "bracket" the pitfall's bracket's middle
  //   { stitch: k, move }   stitch k's centre (k < 0: from the end), x + move x the core's travel
  //   { detail: id, aim }   a close-up's stitch, aim x the bundle's radius out towards the cables
  //   { surface: id, a, w, lift }   a point on a close-up's bundle (surfaceAt); "surface" keys turn in its frame
  //   { tape: s }   the hose under the tape's end, its mean over +-s in the scene (glides past the stitches it pauses at)
  //   { between: [f1, f2], k }   between two foci; { point: [x, y, z] } a fixed point (mm)
  //   { uturn: { back, lift, r } }   the hose's U-turn (its apex: the far point in +X) at the core's travel now, back mm
  //              towards the core, lift mm up; r its radius for fitFocus (draft 6: the finale keeps the bend in frame)
  function focusOf(f, ctx) {
    const { P, g, sc, local, dx } = ctx, St = P.stitches, n = St.length;
    if (f === "lacing" || f === "machine") {
      let lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
      for (const p of P.pts) { lo = lo.map((v, k) => Math.min(v, p[k])); hi = hi.map((v, k) => Math.max(v, p[k] + (k ? 0 : dx))); }
      const L = { p: lerp(lo, hi, 0.5), r: dist(lo, hi) / 2 };
      return f === "lacing" ? L : g.machine ? { p: g.machine.c, r: g.machine.r } : { p: L.p, r: dist(lo, hi) * 1.6 };
    }
    if (f === "cross") return { p: hitchPath(P.details.lock, HITCH.loose, 0).cross };
    if (f === "bracket") return { p: P.bracket.pts[8] };
    if (f.stitch !== undefined) {
      const k = Math.max(0, Math.min(n - 1, f.stitch < 0 ? n + f.stitch : f.stitch)), c = St[k].c;
      return { p: f.move ? [c[0] + dx * f.move, c[1], c[2]] : c };
    }
    if (f.detail) { const D = P.details[f.detail]; return { p: add(D.c, mul(D.u, D.R0 * (f.aim || 0))) }; }
    if (f.surface) { const S = surfaceAt(P.details[f.surface], f.a, f.w, f.lift); return { p: S.p, frame: [S.n, S.b, S.t] }; }
    if (f.tape !== undefined) {
      let m = [0, 0, 0];
      for (let q = -4; q <= 4; q++) {
        const lt = Math.min(sc.dur, Math.max(0, local + f.tape * q / 4));
        m = add(m, mul(P.hoseAt(tipS(P, drawOf(sc, lt, P, ctx.tm))), 1 / 9));
      }
      return { p: m };
    }
    if (f.point) return { p: f.point.slice(0, 3) };
    if (f.uturn) {                                   // the hose's U-turn at the core's travel now (it moves with the core)
      const a = P.apexAt ? P.apexAt(dx) : P.apex0.map((v, k) => v + (k ? 0 : dx / 2));
      return { p: [a[0] - (f.uturn.back || 0), a[1], a[2] + (f.uturn.lift || 0)], r: f.uturn.r || 110 };
    }
    if (f.between) { const A = focusOf(f.between[0], ctx), B = focusOf(f.between[1], ctx); return { p: lerp(A.p, B.p, f.k === undefined ? 0.5 : f.k) }; }
    throw new Error(`lacing tutorial: unknown focus ${JSON.stringify(f)}`);
  }
  // a key's frame for its az / el: "world" (az round from +X, el up), "detail:<id>" (a close-up's [cables' side u, round
  // v, along the hose t]), "surface" (its surface focus's [out n, round b, along t])
  const frameOf = (k, F, P) => CAM.frameOf(k, F, (name) => { const D = P.details[name.slice(7)]; return [D.u, D.v, D.t]; });
  // the rig media-anim camera reads the keys through (ctx = { P, g, sc, local, dx })
  const RIG = { focusOf: (f, ctx) => focusOf(f, ctx), frameOf: (k, F, ctx) => frameOf(k, F, ctx.P), work: (sc, local) => workAt(sc, local) };
  // a key -> { tgt, dir, d, F } (dist mm; fit: fits a sphere of that radius (mm); fitFocus: x the fit of the focus's radius)
  const keyCam = (k, ctx) => CAM.keyCam(k, ctx, RIG);
  // the scene's clock for its keys: "share" (of the scene), "work" (its step's work, 0 - 1), "s" (s into it: the default)
  // (draft 11: a share of the scene's body - the confirm scene's credits are not the finale's)
  const clockOf = (cam, sc, local) => CAM.clockOf(cam, sc, local, workAt);
  // a scene's camera at local s: its keys on its clock (eased by "time" first, if it says). One key: held. Else between
  // the two keys around it, by the later key's ease: the target straight across, the direction turned, the distance lin
  // or log ("dist"); or with "path": "spline" a Catmull-Rom through all of them (target, azimuth the shorter way,
  // elevation, log distance): it never stops between keys. dxAt: the core's travel (else the pose's at local)
  function shotOf(i, local, P, g, tm, shots = SHOTS, dxAt) {
    const sc = tm.scenes[i], cam = shots.scenes[sc.id].camera, ctx = { P, g, sc, local, tm, dx: dxAt === undefined ? poseOf(sc, local)[0] : dxAt };
    return CAM.shotAt(cam, sc, local, ctx, RIG);
  }
  // the tweak panel's "add keyframe at t": a key at the scene's clock now that holds the camera where it is - the focus
  // and frame of the key before it (or the first), az / el / distance from the camera now (dist in mm; fit / fitFocus
  // keys keep their kind, scaled) - into a copy of the scene's camera -> { keys, i (the new key's index) }; a key already
  // at that x is replaced. The frame at t is unchanged (tests/test_lacing_tutorial.js).
  function addKey(shots, id, local, P, g, tm = timing()) {
    const i = tm.scenes.findIndex((s) => s.id === id), sc = tm.scenes[i];
    return CAM.addKey(shots.scenes[id].camera, sc, local, { P, g, sc, local, dx: poseOf(sc, local)[0] }, RIG);
  }
  // the finale's camera at share q of its scene (the done scene's shot), the core dx out
  function finaleAt(q, P, g, dx, shots = SHOTS) {
    const tm = timing(), i = tm.scenes.findIndex((s) => s.id === "done");
    return shotOf(i, q * bodyOf(tm.scenes[i]), P, g, tm, shots, dx);
  }
  // a cut between the machine and a close-up dips to the background: out, held across the scenes' boundary, in (DIP;
  // draft 10: out over slow, held for quick, in over slow - 1.35 s)
  const isCut = (tm, i, j) => TL.isCut(tm, i, j, (sc) => DETAIL_OF[sc.id]);
  const dipAt = (t, tm = timing()) => TL.dipAt(t, tm, DIP, (i, j) => isCut(tm, i, j));
  // a move between scenes takes 2 x slow: it starts slow before the scene ends (in its hold, the step already done) and
  // arrives slow into the next; across a cut the camera jumps while the dip hides it
  // (into the square knots' close views - a long way round the bundle for a camera a few cm off it - 2 x slow either side)
  // (the move's half is the scene's shot's lead: into the square knots' close views - a long way round the bundle for a
  // camera a few cm off it - 2 x slow)
  const leadOf = (tm, j, shots) => { const q = shots.scenes[tm.scenes[j].id].lead; return q === undefined ? shots.defaults.lead : q; };
  function cameraAt(t, P, g, tm = timing(), shots = SHOTS) {
    return CAM.cameraAt(t, tm, { shot: (i, local) => shotOf(i, local, P, g, tm, shots), lead: (j) => leadOf(tm, j, shots), cut: (i, j) => isCut(tm, i, j) });
  }
  const LAYERS = ["tape", "ghost", "hose", "cord", "sleeve", "context", "base"];
  const layersAt = (scene, local, shots = SHOTS) => TL.tracksAt(LAYERS, shots.scenes[scene.id].layers || {}, shots.defaults.layers, local);
  const api = { isCut, dipAt, cameraAt, layersAt, leadOf, LAYERS, finaleAt, shotOf, keyCam, addKey, focusOf, frameOf,
    clockOf };
  if (NODE) module.exports = api;
  else (root.LR4Lacing = root.LR4Lacing || {}).shots = api;
})(typeof self !== "undefined" ? self : this);
