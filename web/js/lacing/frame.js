// Everything the picture shows at t: frameAt (frameBase + the callouts), frameBase (the scene and cue, the tape drawn,
// the close-up's hitch or knot strands, the tip and the light end, the bracket, the pose, the camera, the layers and
// colours, the reveal, the credits, the dip), and the framing check (framing: where the focus points land in the
// frame).
//   Uses data, vec3, timeline, curves, core, knots, draw, shots, blade, callouts, media-anim reveal / credits / camera. Tests:
//     tests/test_lacing_tutorial.js (most sections),
//   .cache/lacing-tutorial/refactor/golden.js (every frame at 30 fps).
(function (root) {
  "use strict";
  const NODE = typeof module !== "undefined" && module.exports, use = (f) => (NODE ? require(`./${f}.js`) : root.LR4Lacing[f]);
  const { SHOTS } = use("data");
  const lib = (f) => (NODE ? require("../lib/media-anim/media-anim-runtime.min.js")[f] : root.MediaAnim[f]);
  const { clamp01, lerp, dist } = use("vec3");
  const { TOKENS, easeInOut, easeOut } = use("timeline");
  const { alongAt } = use("curves");
  const revealAt = lib("reveal").at, creditsAt = lib("credits").at, CAM = lib("camera");
  const { DETAIL_OF, END, timing, sceneAt, workAt, localOfWork } = use("core");
  const { SQ, knotAt } = use("knots");
  const { drawAt, tiedAt, hitchAt, tipS, poseAt, pullsOf, tapeOf, onTape } = use("draw");
  const { dipAt, cameraAt, layersAt } = use("shots");
  const { bladeAt } = use("blade");
  const { calloutsAt } = use("callouts");
  const { cablesOf } = use("opening");

  // ---- everything the picture shows at t ----
  // -> { scene, cue, tt, f (main tape drawn), pulls (the run's lockstitches not snug: [{ k, lam }], draw.js pullsOf), tied, progress, tape / ghost / tip opacities, tipAt (point), bracket:
  //      { scale, opacity }, tipSlide (d14n: null | { from, s } across a change of end), tipScale (the ball's x, its
  //      minimum size on screen), tipCut (the tip on a trimmed end's falling offcut), endSeg (the main tape's last END mm), cueO, dip, detail: null | { id, hitch (lock: the
  //      path + length drawn) | null, frac (close: its tape drawn), strands (the knots'), work, endSeg (the working end's
  //      last END mm), hoseO, contextO, baseO },
  //      real (the model's own lacing shown, the core moving), pose, focus (the action point), cam, layers (each layer's
  //      opacity: tape, ghost, hose, cord, sleeve, context, base), colours (tape, left, end, tip, backdrop), cables (the opening's
//      loose cables: opening.js cablesOf; the goal scene only) }
  // shots = SHOTS, or the tweak panel's copy being edited; raw: the tip unslid (the slide's own start)
  // (draft 10: + callouts, the term cards on screen - calloutsAt; frameBase is the frame without them, which the cards'
  // placement samples)
  function frameAt(t, P, g, tm = timing(), shots = SHOTS) {
    const F = frameBase(t, P, g, tm, shots);
    F.callouts = calloutsAt(t, F, P, g, tm, shots);
    return F;
  }
  function frameBase(t, P, g, tm = timing(), shots = SHOTS, raw = false) {
    const { scene, local, tt } = sceneAt(t, tm), f = drawAt(t, P, tm), tied = tiedAt(t, P, tm), w = workAt(scene, local);
    const fadeIn = easeOut(local / TOKENS.standard), did = DETAIL_OF[scene.id] || null;
    // the layers' opacities and the colours from the scene's shot (the goal's ghost: the finished lacing, faint but plain;
    // the lock run's: only the tape not laced yet is see-through, nothing else fades - draft 5; the knots read against a
    // fainter hose, and what a knot is tied over steps back - context: the close-up's own tape, base: the strand a knot
    // is tied over)
    const layers = layersAt(scene, local, shots), colours = Object.assign({}, shots.colours, shots.scenes[scene.id].colours || {});
    // the tip (d14n, the maintainer): through the steps with no fades at the settles or the square knot's changes of end
    // (it slides instead - tipSlide); d14n review: only while a step works the tape - in over quick as the first step's
    // work starts (and the close's, after the pitfall), out over quick into the pitfall, none in the opening or the
    // finale; a trimmed end takes it with the offcut (below), and the next step brings it back as its work starts
    const prev = tm.scenes[tm.scenes.indexOf(scene) - 1], carried = carriesTip(prev, shots);
    let tip = scene.purpose === "step" ? (carried ? 1 : easeOut(clamp01((local - localOfWork(scene, 0)) / TOKENS.quick)))
      : (carried ? 1 - easeOut(clamp01(local / TOKENS.quick)) : 0);
    let ghost = layers.ghost, tape = layers.tape, bs = 0, bo = 0, detail = null, focus = null, real = false;
    let tipAt = null;                                // (the main tape's end: the page's curve at f)
    if (did === "lock") {
      const D = P.details.lock, h = hitchAt(scene, local, D);
      detail = { id: "lock", hitch: { pts: h.H.pts, draw: h.draw, total: h.H.total, lam: h.lam, e: h.e } };
      const L = h.draw;
      let i = 0;
      while (i < h.H.cum.length - 2 && h.H.cum[i + 1] < L) i++;
      tipAt = lerp(h.H.pts[i], h.H.pts[i + 1], clamp01((L - h.H.cum[i]) / ((h.H.cum[i + 1] - h.H.cum[i]) || 1)));
      focus = h.H.cross;
    } else if (did === "close") {
      // (draft 9: the close-up's model tape is whole to where the closing sequence's strand begins - tapeTo; it opens
      // inside the dip - and the strand does the rest: H and the last lockstitch, the half hitches, the trim)
      const K = knotAt(scene.id, w, P.details.close, shots);
      detail = { id: "close", frac: 1, strands: K.strands, work: K.work, cuts: K.cuts || [] };
      focus = K.focus;
    } else if (did === "start") {
      const K = knotAt(scene.id, w, P.details.start, shots);
      detail = { id: "start", strands: K.strands, work: K.work, cuts: K.cuts || [] };
      focus = K.focus;
    }
    const cam = cameraAt(t, P, g, tm, shots);
    if (detail) Object.assign(detail, { hoseO: layers.hose, contextO: layers.context, baseO: layers.base });
    // (a strand's context stretch is its own tube only while it is faded: two splines meet at the cut, each with its own
    // end tangent, a notch where lockstitch 8 runs on into H - 2026-11-10, the close; one tube while both are opaque)
    if (detail && detail.strands && detail.strands[0] && detail.strands[0].ctx !== undefined && Math.abs(layers.context - layers.base) < 1e-3) delete detail.strands[0].ctx;
    // the working end's last END mm, lighter (draft 4): the hitch's end, or the knot strand being worked
    // (its ends at exactly drawn - END and drawn - draft 6: cut at the samples, it slid in steps of a sample, up to 8 mm)
    const endOf = (pts, drawn) => {
      if (!(drawn > 0.5)) return null;
      const cum = [0];
      for (let j = 1; j < pts.length; j++) cum.push(cum[j - 1] + dist(pts[j], pts[j - 1]));
      const a = Math.max(0, drawn - END), s = { pts, cum }, out = [alongAt(s, a)];
      for (let j = 0; j < pts.length; j++) if (cum[j] > a + 1e-6 && cum[j] < drawn - 1e-6) out.push(pts[j]);
      out.push(alongAt(s, Math.min(drawn, cum[cum.length - 1])));
      return out.length >= 2 && drawn - a > 0.2 ? out : null;
    };
    // (d14n: the light end stays on the strand last worked as a knot is pulled snug, till the trim - the square knot
    // after h2, the tie - where drafts 6-9 dropped it and the tip)
    let endO = 1;
    if (detail && detail.hitch) detail.endSeg = endOf(detail.hitch.pts, detail.hitch.draw);
    else if (detail && detail.strands && detail.strands[detail.work]) { const q = detail.strands[detail.work]; detail.endSeg = endOf(q.pts, q.draw); }
    // the tape's live end (the white tip): the main tape's drawn end, the closing turns' as they go on, the hitch's, or
    // where the knot strand worked has got to (draft 7: every view says where it is)
    // (d14b: a lockstitch drawn loose and pulled snug - pulls; the live end on that tape)
    const pulls = detail ? [] : pullsOf(scene, local, P, tm);
    let endSeg = null;                               // (d14n: the main tape's light end too, as the close-ups')
    if (!detail) {
      const V = pulls.length ? tapeOf(P, pulls) : { pts: P.pts, cum: P.C, total: P.total }, drawn = (pulls.length ? onTape(P, V, f) : f) * V.total;
      tipAt = alongAt(V, drawn);
      endSeg = endOf(V.pts, drawn);
    }
    if (detail && detail.strands && detail.strands.length) {   // the tape's end: where the strand worked has got to
      const q = detail.strands[detail.work] || null;  // (not drawn yet: at its start)
      if (q) {
        let i = 0;
        const cum = [0];
        for (let j = 1; j < q.pts.length; j++) cum.push(cum[j - 1] + dist(q.pts[j], q.pts[j - 1]));
        while (i < cum.length - 2 && cum[i + 1] < q.draw) i++;
        tipAt = lerp(q.pts[i], q.pts[i + 1], clamp01((q.draw - cum[i]) / ((cum[i + 1] - cum[i]) || 1)));
      }
    }
    if (detail) Object.assign(detail, bladeAt(detail.cuts || [], scene, local, cam, shots));
    // (d14n review: the working end trimmed - the light end and the tip go with the offcut as it falls out of shot; the
    // stub left is the tape's own colour; once the offcut has gone, no tip till the next step's work)
    const trim = detail && (detail.cuts || []).find((c) => c.done && c.e === detail.work);
    let tipCut = false;                              // (the tip on the falling offcut)
    if (trim) {
      const oc = (detail.offcuts || []).find((o) => o.e === trim.e);
      if (oc) {
        let len = 0;
        for (let j = 1; j < oc.pts.length; j++) len += dist(oc.pts[j], oc.pts[j - 1]);
        tipAt = oc.pts[oc.pts.length - 1]; tip *= oc.o; endO = oc.o; detail.endSeg = endOf(oc.pts, len); tipCut = true;
      } else { tip = 0; detail.endSeg = null; }
    }
    if (detail) detail.endO = endO;
    // (d14o review: the ball goes wherever the light end shows - the pitfall, and the close and the wrap before their
    // work, had the end without it; the opening and the finale draw neither)
    if ((scene.purpose === "step" || scene.purpose === "pitfall") && (detail ? detail.endSeg : endSeg) && !tipCut) tip = 1;
    if (scene.id === "spacing") { bs = easeInOut((local - TOKENS.slow) / TOKENS.standard); bo = easeOut((local - TOKENS.slow) / TOKENS.quick); focus = P.bracket.pts[8]; }
    if (scene.purpose === "confirm") real = true;
    if (!detail && scene.purpose === "step") focus = P.line.at(tipS(P, f));
    // (draft 11: the opening's reveal on the music's hit - the goal's lacing (the ghost) 0 before it, flashing in, then
    // settled; the credits after the finale - the cue goes with the picture under the backdrop)
    // (d12: the hit is when the voice first says "cable lacing" - core.js timing; before it the cables hang loose and sway,
    // then draw in to the hose - opening.js cablesOf)
    const reveal = revealAt(scene, tt, tm), credits = creditsAt(scene, local, tm, g), cables = cablesOf(scene, local, tm);
    if (reveal) ghost = reveal.o * (ghost + (1 - ghost) * reveal.glow);
    const cueO = credits ? fadeIn * (1 - credits.backdrop) : fadeIn;
    // the tip across a change of end (d14n): from where it was just before (the end before, unslid) to the live end
    let tipSlide = null;
    const TP = shots.tip, J = raw ? undefined : jumpsOf(tm, shots).filter((j) => j <= t && t - j < TP.slide).pop();
    if (J !== undefined && tipAt) {
      const from = frameBase(J - 1e-4, P, g, tm, shots, true).tipAt;
      if (from) { const s = easeInOut((t - J) / TP.slide); tipSlide = { from, s }; tipAt = lerp(from, tipAt, s); }
    }
    // its size: the ball's own, or at least TP.minPx tall in a 720-line frame (d14n: in the wide shots it was a few px)
    const tz = tipAt ? CAM.depthOf(cam, tipAt) : 0, tipScale = tz > 0 ? Math.max(1, TP.minPx / CAM.sizePx(2 * TP.r, tz, g, 720)) : 1;
    const F = { scene: scene.id, cue: scene.cue, tt, f, pulls, tied, progress: tied / P.stitches.length, tape, ghost, tip, tipAt,
      tipSlide, tipScale, tipCut, endSeg, bracket: { scale: bs, opacity: bo }, cueO, dip: dipAt(t, tm), detail, real, pose: poseAt(t, tm), focus,
      cam, layers, colours, callouts: [], reveal, credits };
    if (cables) F.cables = cables;                   // (the goal's only: the other scenes' frames as before d12)
    return F;
  }
  // a scene that hands its tip on to the next (d14n review): a step whose working end is not trimmed
  const carriesTip = (sc, shots) => !!sc && sc.purpose === "step" && !((shots.blade && shots.blade.cuts[sc.id]) || []).length;
  // the times the tip changes end (d14n): each scene's start where the one before hands its tip on, and the square
  // knot's lay / h1 / endL
  function jumpsOf(tm, shots) {
    const J = [];
    tm.scenes.forEach((s, i) => {
      if (i > 0 && carriesTip(tm.scenes[i - 1], shots)) J.push(s.start);
      if (s.id === "square") for (const b of [SQ.lay, SQ.h1, SQ.endL]) J.push(s.start + localOfWork(s, b));
    });
    return J.sort((a, b) => a - b);
  }
  // ---- the framing check (draft 7: geometry in place of screenshot rounds for camera notes): the frame at t, its camera
  // as the page sets it (up +Z, g.fov vertical, g.aspect), and where its focus points land - the tape's live end (the white
  // tip), the scene's action point (the knot, the crossing, the bracket), and in the confirm scene the hose's U-turn at the
  // core's travel now. -> { scene, pts: [{ name, x, y (-1..1 across the frame), z (mm in front), margin (to the nearest
  // edge, a share of the half-frame; < 0 = out) }], cordPx (the cord's width in px at the frame's height px, at the
  // nearest focus point's depth; g.cordD mm, g.px the frame's height, 720 by default) }
  function framing(t, P, g, tm = timing(), shots = SHOTS) {
    const F = frameAt(t, P, g, tm, shots), N = CAM.ndc(F.cam, g), proj = (name, p) => Object.assign({ name }, N(p));
    const pts = [];
    if (F.tipAt && F.tip > 0.5) pts.push(proj("live end", F.tipAt));
    if (F.focus) pts.push(proj("focus", F.focus));
    if (F.real && P.apexAt) pts.push(proj("U-turn", P.apexAt(F.pose[0])));
    const z = Math.min(...pts.map((q) => q.z).filter((v) => v > 0), pts.length ? Infinity : CAM.depthOf(F.cam, F.cam[1]));   // (none: the target's depth)
    const cordPx = Number.isFinite(z) ? CAM.sizePx(g.cordD || 6.5, z, g, g.px || 720) : 0;
    return { scene: F.scene, t, pts, cordPx };
  }
  const api = { frameBase, framing, frameAt };
  if (NODE) module.exports = api;
  else (root.LR4Lacing = root.LR4Lacing || {}).frame = api;
})(typeof self !== "undefined" ? self : this);
