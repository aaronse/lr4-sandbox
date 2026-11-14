// lr4-sandbox page: the cable-lacing tutorial, drawn in the page's own scene (docs/specs/lacing-tutorial.md).
// js/lacing_tutorial.js (LR4LacingTut) is the storyboard, the plan and frameAt(t); this builds the meshes once and
// applies a frame: the tape drawn on (drawRange) in the accent colour, its ghost, the tape's end, the pitfall's bracket,
// the close-ups (a short length of hose, cord, sleeve and tape on their own layer, everything else out of view), the
// machine's pose, the camera, the dip across a cut and the cue. No clock here: whoever shows it supplies t - the check
// page's setT (index.html?anim=lacing, for media-anim tools/anim/stills.mjs) or the video director's frames
// ((Video Lacing:), js/page/director.js).
// The page's scripts share one global scope (see the header of hose_bom.js): meta, scene, camera, controls, move, HOME
// are theirs; hoseMesh, cordMesh, sleeveMesh, tieMesh, reliefMesh, wireMesh are only hidden while the tutorial is on.
// The hose, cord and sleeve it shows are its own (the rig below, from js/hose_route.js): the page's are upstream's ropes,
// which the plan's tape doesn't lie on. The generic parts (tubes, ribbon, halo, callout card, credits, occluder) are
// media-anim's lib (js/lib/media-anim/, tools/sync_media.js).
window.LR4LacingAnim = (() => {
  const LT = window.LR4LacingTut, MA = window.MediaAnim, TU = MA.tube, H = window.LR4Hose;
  // ---- the rig (fork, 2026-11-12): the hose, cord and sleeve as page 0.66.2 drew them, swept from LR4Hose (the routes the
  // plan is made on) at the tutorial's pose - kept apart from js/page/hose_bom.js so upstream's hose can change freely ----
  const laceParams = () => H.LACING;
  // the lacing (LR4Hose.lacing): the cord + sleeve to the closing stitch by the sleeve's breakout, then the cord alone
  function laceAt(dense, cp, sp, dx) {
    const h = meta.hose, cord = { pts: cp, d: h.cord.d };
    const runs = sp ? [{ to: "breakout", x: h.sleeve.exit.x, cables: [cord, { pts: sp, d: h.sleeve.d }] }, { to: "exit", cables: [cord] }]
      : [{ to: "exit", cables: [cord] }];
    return H.lacing(dense, h, runs, dx, laceParams());
  }
  function mergeGeos(geos) {                         // indexed BufferGeometries -> one (position, normal, uv)
    const out = new THREE.BufferGeometry(), at = { position: [], normal: [], uv: [] }, idx = [];
    let base = 0;
    for (const g of geos) {
      for (const k of Object.keys(at)) at[k].push(g.attributes[k].array);
      for (const i of g.index.array) idx.push(i + base);
      base += g.attributes.position.count;
    }
    for (const [k, n] of [["position", 3], ["normal", 3], ["uv", 2]]) {
      const a = new Float32Array(at[k].reduce((s, x) => s + x.length, 0));
      let o = 0;
      for (const x of at[k]) { a.set(x, o); o += x.length; }
      out.setAttribute(k, new THREE.BufferAttribute(a, n));
    }
    out.setIndex(idx);
    return out;
  }
  function rigMake() {
    // clear PVC with a steel wire helix: one tile = one turn (u along the hose, v round it), the wire a diagonal line
    // across it, the rest translucent
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d");
    g.fillStyle = "rgba(225,233,238,0.30)"; g.fillRect(0, 0, 64, 64);
    g.strokeStyle = "rgba(95,100,106,1)"; g.lineWidth = 7;
    for (const o of [-64, 0, 64]) { g.beginPath(); g.moveTo(o, 0); g.lineTo(o + 64, 64); g.stroke(); }
    const wire = new THREE.CanvasTexture(c);
    wire.wrapS = wire.wrapT = THREE.RepeatWrapping;
    wire.colorSpace = THREE.SRGBColorSpace;
    const mesh = (name, m) => { const x = new THREE.Mesh(new THREE.BufferGeometry(), m); x.name = "Lacing_Tutorial_" + name; return x; };
    const hose = mesh("hose", new THREE.MeshStandardMaterial({ map: wire, transparent: true, depthWrite: false, roughness: 0.25, metalness: 0.1, side: THREE.DoubleSide }));
    hose.renderOrder = 1;
    const cable = (name, rgb, rough) => mesh(name, new THREE.MeshStandardMaterial({ color: new THREE.Color(...rgb).convertSRGBToLinear(), roughness: rough, metalness: 0 }));
    const h = meta.hose;
    return { wire, hose, cord: h.cord ? cable("cord", [0.07, 0.07, 0.08], 0.6) : null, sleeve: h.sleeve ? cable("sleeve", [0.12, 0.12, 0.13], 0.85) : null };
  }
  // the hose, cord and sleeve at the pose (page 0.66.2's updateHose: the beam's dy / dz carry all but the table's points)
  function rigSweep(R, dx, dy, dz) {
    const h = meta.hose, pts = H.hoseRoute(h, dx, dz).map(([x, y, z, f]) => (f === "table" ? new THREE.Vector3(x, y, z) : new THREE.Vector3(x, y + dy, z + dz)));
    const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal"), len = curve.getLength();
    R.hose.geometry.dispose();
    R.hose.geometry = new THREE.TubeGeometry(curve, Math.ceil(len / 4), h.od / 2, 28, false);
    R.wire.repeat.set(len / 10, 1);                  // wire pitch ~10 mm
    const dense = curve.getPoints(12 * (pts.length - 1)).map((p) => [p.x, p.y, p.z]), sh = (p) => [p[0] + dx, p[1] + dy, p[2] + dz];
    if (R.cord) cableTube(R.cord, H.cordRoute(dense, h, h.cord, sh(h.cord.tip), sh(h.cord.tip2), dx), h.cord.d);
    if (R.sleeve) cableTube(R.sleeve, H.cordRoute(dense, h, h.sleeve, null, null, dx, [0, dy, dz]), h.sleeve.d);
  }
  // the page's own hose and what hangs on it (upstream's ropes, ties, wires), hidden while the tutorial is on
  const pageHose = () => [typeof hoseMesh !== "undefined" && hoseMesh, typeof cordMesh !== "undefined" && cordMesh,
    typeof sleeveMesh !== "undefined" && sleeveMesh, typeof tieMesh !== "undefined" && tieMesh,
    typeof reliefMesh !== "undefined" && reliefMesh, typeof wireMesh !== "undefined" && wireMesh].filter(Boolean);
  // ... and the router's cord stub and strain relief, which upstream hides for its cord rope: the rig's cord starts at the
  // stub's end (meta.hose.cord.tip), so they show while it's on
  const routerStub = () => meshes.filter((m) => /^Router_(StrainRelief|Cord)$/.test(m.userData.name));
  if (/[?&]debug(=|&|$)/.test(location.search)) LT.setDebug(true);   // ?debug: the tape's handovers checked (throws)
  const RADIAL = 6;                                  // the tape tube's sides: 6 * RADIAL indices per tubular segment
  const LAYER = 1;                                   // the close-ups' layer: the camera sees only it in a close-up
  let A = null;                                      // on: { P, tm, curve, segs, meshes, detail, cue, dip, root, was, ... }
  // the shots (cameras, layer opacities, colours): docs/specs/lacing-tutorial.shots.json when the page is served from the
  // repo (tools/serve.py: the file as it is on disk, so a saved edit shows on reload), else the copy in js/lacing/data.js;
  // the tweak panel (js/page/anim_tweak.js) edits this object and redraws
  let SH = LT.SHOTS, shotsP = null;
  function ready() {
    if (!shotsP) shotsP = (async () => {
      try {
        const r = await fetch(new URL("../docs/specs/lacing-tutorial.shots.json", location.href), { cache: "no-store" });
        if (r.ok) { const j = await r.json(); if (j && j.scenes) { SH = j; return "file"; } }
      } catch (e) { /* not served from the repo */ }
      return "copy";
    })();
    return shotsP;
  }

  // the character head over the tip ball (branch jensen-head: media-anim research/jensen, vendored to js/lib/media-anim/ (media-anim-characters.min.js) by
  // tools/sync_media.js): the art drawn once (MediaAnim.faceRig.loadParts), then MediaAnim.faceOverlay.attach on Lacing_Tutorial_tip, its
  // cover circle shots.head.scale x the ball's silhouette so the face reads; it lip-syncs the voice-over's lines
  // on unless ?head=0 (?head=1 forces it on), else shots.head.on - the render's --no-head (lacing_voice.js)
  let headP = null, headParts = null;
  const headOn = () => {
    const q = new URLSearchParams(location.search).get("head");
    return q === null ? !!(SH.head && SH.head.on) : q !== "0";
  };
  function headLoad() {
    if (!headP) headP = (async () => {
      if (!(headOn() || riderOn()) || !self.MediaAnim.faceRig || !self.MediaAnim.faceOverlay) return null;   // (the rider's head-only LOD is this head)
      const r = await fetch(new URL("js/lib/media-anim/jensen-head-only.svg", location.href));
      headParts = await self.MediaAnim.faceRig.loadParts(await r.text());
      return headParts;
    })().catch((e) => { console.error("head:", e); return null; });
    return headP;
  }
  function headOf() {                                // the overlay, made once the art is in (null without it)
    if (A.head !== undefined || !headParts) return A.head || null;
    const HD = SH.head, moods = A.tm.scenes.map((s) => ({ t: s.start, mood: (HD.moods || {})[s.id] || "neutral" }));
    // (d29: the words' real times, rider.js speechOf; without rider.js, d28's text spread over each line)
    const speech = window.LR4Lacing && LR4Lacing.rider ? LR4Lacing.rider.speechOf(A.tm) : LT.voiceLines(A.tm).map((l) => ({ t0: l.at, t1: l.at + l.dur, text: l.text }));
    const rig = self.MediaAnim.faceRig.rig({ seed: HD.seed || 1, moods, speech });
    const ov = self.MediaAnim.faceOverlay.attach({ THREE, target: A.meshes.tip, camera, FaceRig: self.MediaAnim.faceRig, parts: headParts, rig, margin: HD.scale || 1 });
    ov.sprite.name = "Lacing_Tutorial_head";
    ov.sprite.layers.mask = A.meshes.tip.layers.mask;  // (the main view and the close-ups, as the ball)
    scene.add(ov.sprite);
    A.head = ov;
    return ov;
  }
  // the rider (media-anim MA-11 C3, C4: js/lacing/rider.js, MediaAnim.body / bodyOverlay / cast): Jensen riding the running
  // end like a bucking horse (the rodeo posture) in the main view whenever the tip and its green tail show, close-ups
  // included - shots.rider, ?rider=0/1, the head above for its head-only LOD (wherever the rider would cover the action
  // point, or the tail is not drawn) - and in Jensen Cam, an inset from a chase camera - shots.jensenCam, ?jensencam=0/1,
  // each flag alone (d23 review, 2026-11-13: both, at once). Both on by default (shots.json); both off, nothing here runs
  // and the page draws as before
  const flagOn = (k, block) => { const q = new URLSearchParams(location.search).get(k); return q === null ? !!(block && block.on) : q !== "0"; };
  const riderOn = () => flagOn("rider", SH.rider), camOn = () => flagOn("jensencam", SH.jensenCam);
  const CAM_LAYER = 2;                               // Jensen Cam's scenery: the rig, the tape, the tip and the inset's rider
  let bodyP = null, bodyParts = null;
  function bodyLoad() {
    if (!bodyP) bodyP = (async () => {
      const MB = self.MediaAnim;
      if (!(riderOn() || camOn()) || !MB.body || !MB.bodyOverlay || !MB.cast || !(window.LR4Lacing && LR4Lacing.rider)) return null;
      const get = async (f) => (await fetch(new URL("js/lib/media-anim/" + f, location.href))).text();
      const [torso, face] = await Promise.all([get("jensen-torso.svg"), get("jensen-head-only.svg")]);
      // (the outline's colour: whichever of the outfit's two reads better on the page's backdrop - cast.outlineOn)
      bodyParts = await MB.body.loadBodyParts(MB.cast.JENSEN, { torso, face, backdrop: [css("--scene-top", "#262b31"), css("--scene-bottom", "#121417")] });
      return bodyParts;
    })().catch((e) => { console.error("rider:", e); return null; });
    return bodyP;
  }
  // the bakes (the track, springs, LOD, chase camera, inset plan: rider.js, lazily to a horizon past t), made once the art is in
  function rideOf() {
    if (A.ride !== undefined) return A.ride;
    if (!bodyParts) return null;
    const RD = LR4Lacing.rider, def = self.MediaAnim.cast.JENSEN, T = RD.trackOf(RD.contextOf(A.P, A.tm, SH));
    A.ride = { RD, def, main: riderOn() ? RD.mainRide(T, def, bodyParts) : null, cam: camOn() ? RD.camRide(T, def) : null,
      rider: null, camRider: null, chase: null, inset: null, frame: null };
    return A.ride;
  }
  function rideDrop() {
    const RS = A && A.ride;
    if (RS) {
      for (const ov of [RS.rider, RS.camRider]) if (ov) ov.dispose();
      if (RS.riderGhost) { if (RS.riderGhost.parent) RS.riderGhost.parent.remove(RS.riderGhost); RS.riderGhost.material.dispose(); }
      if (RS.inset) self.MediaAnim.inset.dispose(RS.inset);
    }
    if (A) delete A.ride;
  }
  // the rider at t (after the head: the LOD crossfades the two)
  function riding(t, F, M, head) {
    const RS = riderOn() || camOn() ? rideOf() : null;
    if (!RS) return;
    const MB = self.MediaAnim, shown = M.tip.visible, R = RS.RD.configOf(SH).rider;
    if (RS.main) {                                   // (with Jensen Cam on too: the owner wants him in both, d23 review)
      const st = RS.main.at(t);
      if (!RS.rider) {
        RS.rider = MB.bodyOverlay.attach({ THREE, target: M.tip, camera, def: RS.def, parts: bodyParts, perf: st.perf, baked: st.baked, anchor: R.anchor, maxPx: R.maxPx, scale: R.scale });
        RS.rider.sprite.name = "Lacing_Tutorial_rider";
        RS.rider.sprite.layers.set(0);               // (the main view; the close-ups too only when the LOD keeps it there)
        if (!R.lod.detail) RS.rider.sprite.layers.enable(LAYER);
        RS.rider.sprite.material.depthTest = !R.onTop;
        scene.add(RS.rider.sprite);
        // (d29, the owner: the geometry in front of him hides him, depth-tested above) the ghost: the same canvas drawn
        // first without the depth test at shots.rider.ghost of his opacity, so a hidden part reads as behind, not gone;
        // where he shows, the depth-tested sprite covers it
        if (!R.onTop && R.ghost > 0) {
          const g = new THREE.Sprite(RS.rider.sprite.material.clone());   // (the map shared: update(t) draws both)
          g.material.depthTest = false; g.material.depthWrite = false;
          g.name = "Lacing_Tutorial_riderGhost"; g.frustumCulled = false; g.renderOrder = RS.rider.sprite.renderOrder - 1;
          g.layers.mask = RS.rider.sprite.layers.mask;
          scene.add(g);
          RS.riderGhost = g;
        }
      }
      const ov = RS.rider, o = shown ? F.tip * st.riderO : 0;
      ov.setPerformance(st.perf, st.baked);
      if (o > 0) ov.update(t);
      ov.sprite.visible = o > 0 && ov.sprite.visible;
      ov.sprite.material.opacity = o;
      const g = RS.riderGhost;
      if (g) {
        g.visible = ov.sprite.visible; g.material.opacity = o * R.ghost;
        g.position.copy(ov.sprite.position); g.scale.copy(ov.sprite.scale); g.center.copy(ov.sprite.center);
      }
      if (head) { const ho = F.tip * st.headO; head.sprite.material.opacity = ho; head.sprite.visible = head.sprite.visible && ho > 0; }
    }
    RS.frame = null;
    if (!RS.cam) return;
    const st = RS.cam.at(t), C = RS.cam.config;
    if (!RS.chase) {
      RS.chase = new THREE.PerspectiveCamera(C.fov, 16 / 9, 0.5, 20000);
      RS.inset = MB.inset.create(THREE);
      for (const m of [...A.looks.map((l) => l.m), M.tube, M.ghost, M.end, M.tip, M.bracket, M.real]) m.layers.enable(CAM_LAYER);
    }
    // in a close-up the inset sees the close-up's own hose, cord, sleeve and strands (its group; the others are hidden)
    // and not the page's copies, as the main view does (the inset throughout, d24 review)
    const det = F.detail ? A.details[F.detail.id] : null;
    if (RS.camDet !== det) {
      for (const m of [...A.looks.map((l) => l.m), M.tube, M.ghost, M.end, M.bracket, M.real]) if (m) m.layers[det ? "disable" : "enable"](CAM_LAYER);
      if (det && !det.camLayer) { det.group.traverse((o) => o.layers.enable(CAM_LAYER)); det.camLayer = true; }
      RS.camDet = det;
    }
    const v = st.view, ch = RS.chase;
    ch.position.set(...v.pos); ch.up.set(...v.up); ch.lookAt(...v.target);
    if (ch.aspect !== 16 / 9) { ch.aspect = 16 / 9; ch.updateProjectionMatrix(); }
    ch.updateMatrixWorld();
    if (!RS.camRider) {
      RS.camRider = MB.bodyOverlay.attach({ THREE, target: M.tip, camera: ch, def: RS.def, parts: bodyParts, perf: st.perf, baked: st.baked,
        anchor: R.anchor, maxPx: C.riderPx, lines: C.lines, radius: SH.tip.r });
      RS.camRider.sprite.name = "Lacing_Tutorial_camRider";
      RS.camRider.sprite.layers.set(CAM_LAYER);
      RS.camRider.sprite.material.depthTest = !C.onTop;
      scene.add(RS.camRider.sprite);
    }
    const ov = RS.camRider, f = st.frame, on = shown && !!f && f.opacity > 0;
    ov.setPerformance(st.perf, st.baked);
    if (on) ov.update(t);
    ov.sprite.visible = on && ov.sprite.visible;
    ov.sprite.material.opacity = F.tip;
    RS.frame = on ? f : null;
  }
  // the inset's pass, after the page's render (js/page/scripting.js tick: window.LR4AfterRender): the chase camera's view
  // of CAM_LAYER in its corner, the ball at its own size
  function drawInset() {
    const RS = A && A.ride;
    if (!RS || !RS.frame || !RS.chase) return;
    const M = A.meshes, k = M.tip.scale.x, size = renderer.getSize(new THREE.Vector2()), C = RS.cam.config;
    scene.traverse((o) => { if (o.isLight) o.layers.enable(CAM_LAYER); });
    M.tip.scale.setScalar(1);
    try {
      self.MediaAnim.inset.draw(RS.inset, renderer, scene, RS.chase, RS.frame, Object.assign({ W: size.x, H: size.y, layer: CAM_LAYER },
        C.background ? { background: new THREE.Color(C.background) } : {}));
    } finally { M.tip.scale.setScalar(k); }
  }
  window.LR4AfterRender = () => { if (A) drawInset(); };
  const css = (name, def) => (getComputedStyle(document.documentElement).getPropertyValue(name).trim() || def);
  const V3 = (p) => new THREE.Vector3(p[0], p[1], p[2]);
  const curveOf = (pts) => TU.curve(THREE, pts);
  const GHOST_R = 1.0;                               // mm: the ghost and halo's tube (the tape's TAPE_R / HITCH.tr)
  const FADE = 70;                                   // mm: a close-up view's hose and cables fade out over their last FADE
  function endFade(len) {                            // (an alpha map along a tube's length, u 0..1: the green channel)
    const n = 256, data = new Uint8Array(4 * n);
    for (let i = 0; i < n; i++) {
      const e = Math.min(1, (Math.min(i, n - 1 - i) / (n - 1)) * len / FADE), a = Math.round(255 * e * e * (3 - 2 * e));
      data.set([a, a, a, 255], 4 * i);
    }
    const tx = new THREE.DataTexture(data, n, 1);
    tx.magFilter = tx.minFilter = THREE.LinearFilter; tx.needsUpdate = true;
    return tx;
  }
  // the plan at the build pose (dx = dy = dz = 0): the hose's dense line as updateHose makes it, the cord + sleeve on
  // it, and the lacing round them (laceAt)
  function planNow() {
    const h = meta.hose, pts = H.hoseRoute(h, 0, 0).map(([x, y, z]) => new THREE.Vector3(x, y, z));
    const dense = new THREE.CatmullRomCurve3(pts, false, "centripetal").getPoints(12 * (pts.length - 1)).map((p) => [p.x, p.y, p.z]);
    const c = h.cord, sl = h.sleeve;
    const cp = H.cordRoute(dense, h, c, c.tip, c.tip2, 0), sp = sl ? H.cordRoute(dense, h, sl, null, null, 0, [0, 0, 0]) : null;
    const P = LT.plan(dense, laceAt(dense, cp, sp, 0), laceParams(), { cord: cp, sleeve: sp }, { cord: c.d / 2, sleeve: sl ? sl.d / 2 : 0 }, h.od / 2);
    // the U-turn's apex at a pose (the finale's camera follows it): the hose re-swept as updateHose does it
    P.apexAt = LT.apexOf(H, h, dense, (q) => new THREE.CatmullRomCurve3(q.map(V3), false, "centripetal").getPoints(12 * (q.length - 1)).map((v) => [v.x, v.y, v.z]));
    return P;
  }
  const mat = (o) => new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.6, metalness: 0 }, o));
  function build() {
    // the tape in the tutorial's red (the shots' colours, draft 4: the maintainer's pick over the page's accent, which reads orange
    // in the dark theme), 2 mm round (the tape: 1.2 mm thick, ~2.5 mm wide) so it reads at a 1 m view; it lies on the
    // plan's centre line
    const P = planNow(), TAPE_R = 1.0, col = (c) => new THREE.Color(c).convertSRGBToLinear();
    const accent = col(SH.colours.tape);
    const warn = new THREE.Color(css("--warn", "#9a5b00")).convertSRGBToLinear();
    const curve = curveOf(P.pts), segs = 2 * P.pts.length, geo = new THREE.TubeGeometry(curve, segs, TAPE_R, RADIAL, false);
    const tapeMat = () => mat({ color: accent, emissive: accent, emissiveIntensity: 0.3, transparent: true });
    const tube = new THREE.Mesh(geo, tapeMat());
    // the ghost (the finished lacing, previewed): the tape's own size (d17, the maintainer: draft 2's 2.4 mm read as a
    // thicker cord than the tape drawn after it)
    const ghost = new THREE.Mesh(new THREE.TubeGeometry(curve, segs, GHOST_R, RADIAL, false), mat({ color: accent, emissive: accent, emissiveIntensity: 0.5, transparent: true, opacity: 0.3, depthWrite: false }));
    ghost.renderOrder = 2;
    // the opening's halo (draft 11: the lacing flashes in on the music's hit - LR4LacingTut.revealAt) along the ghost
    const halo = MA.halo.create(THREE, curve, { segs, radius: 1.4 * GHOST_R, radial: 12, colour: col(LT.REVEAL.halo.colour) });
    // the tape's end: a ball in the shots' tip colour (white before d15)
    const tipC = col(SH.colours.tip || "#ffffff");
    const tip = new THREE.Mesh(new THREE.SphereGeometry(SH.tip.r, 16, 12), mat({ color: tipC, emissive: tipC, emissiveIntensity: 0.05, transparent: true }));
    tip.layers.enable(LAYER);                        // the tape's end in the close-ups too
    // the main tape's working end, lighter (d14n: as the close-ups' - their end below)
    const endC = col(SH.colours.end);
    const end = new THREE.Mesh(new THREE.BufferGeometry(), mat({ color: endC, emissive: endC, emissiveIntensity: 0.1, transparent: true }));
    end.name = "Lacing_Tutorial_end"; end.visible = false;
    // the bracket: on the bundle from one lock stitch to the next, a tick out at each end (the warning colour: the tape
    // has the accent)
    const b = P.bracket, mid = b.pts[8], V = (p) => V3(p.map((v, i) => v - mid[i])), path = new THREE.CurvePath();
    path.add(new THREE.LineCurve3(V(b.ticks[0][1]), V(b.ticks[0][0])));
    path.add(new THREE.CatmullRomCurve3(b.pts.map(V), false, "centripetal"));
    path.add(new THREE.LineCurve3(V(b.ticks[1][0]), V(b.ticks[1][1])));
    const bracket = new THREE.Mesh(new THREE.TubeGeometry(path, 64, 1.5, 6, false), mat({ color: warn, emissive: warn, emissiveIntensity: 0.4, transparent: true }));
    bracket.position.set(...mid);
    const real = new THREE.Mesh(new THREE.BufferGeometry(), mat({ color: accent, emissive: accent, emissiveIntensity: 0.3, roughness: 0.7 }));
    real.name = "Lacing_Tutorial_real"; real.visible = false;
    const meshes = { tube, ghost, halo, tip, end, bracket, real };
    // the close-ups: their own layer, so a close-up shows them and nothing else
    const h = meta.hose, details = {}, rig = rigMake();
    for (const [id, D] of Object.entries(P.details)) {
      const g = new THREE.Group(), add = (name, m) => { m.name = `Lacing_Tutorial_${id}_${name}`; m.layers.set(LAYER); g.add(m); return m; };
      const V = D.view || D;                         // the hose, cord and sleeve drawn (plan.js details: view - d17, the
      const hc = curveOf(V.hose), hl = hc.getLength(), wire = rig.wire.clone();   // start's 105 mm read as a cup)
      wire.repeat.set(hl / 10, 1); wire.needsUpdate = true;
      const hm = rig.hose.material.clone(); hm.map = wire;
      if (D.view) hm.alphaMap = endFade(hl);
      add("hose", new THREE.Mesh(new THREE.TubeGeometry(hc, Math.ceil(hl / 2), h.od / 2, 40, false), hm)).renderOrder = 1;
      const det = { group: g, D };                   // (the cord and sleeve on their own materials: their opacity is a layer)
      const cable = (pts, d, src) => {               // (a view's cable fades out at its ends too: see-through always)
        const c = curveOf(pts), m = src.material.clone();
        if (D.view) { m.alphaMap = endFade(c.getLength()); m.transparent = true; }
        return new THREE.Mesh(new THREE.TubeGeometry(c, 4 * pts.length, d / 2, 16, false), m);
      };
      if (V.cord.length > 1 && rig.cord) det.cord = add("cord", cable(V.cord, h.cord.d, rig.cord));
      if (V.sleeve.length > 1 && rig.sleeve) det.sleeve = add("sleeve", cable(V.sleeve, h.sleeve.d, rig.sleeve));
      if (id === "close") {                          // the plan's own tape up to where the closing sequence's strand
        const tp = LT.tapeTo(D, SH.knots.closing);   // begins (draft 9: LR4LacingTut.tapeTo), drawn on
        det.curve = curveOf(tp); det.segs = 3 * tp.length;
        det.tape = add("tape", new THREE.Mesh(new THREE.TubeGeometry(det.curve, det.segs, TAPE_R, RADIAL, false), tapeMat()));
      } else det.tape = add("tape", new THREE.Mesh(new THREE.BufferGeometry(), tapeMat()));   // the hitch: rebuilt per frame
      // the knots (start: clove hitch + square knot; close: the closing sequence, one strand): up to 3 strands, rebuilt per frame
      // (strand 1 = the short end in a lighter tint of the accent, so the two ends read apart in the square knot)
      // (strand 1 = the square knot's left end, a deeper red, so its two ends read apart; the working end's last
      // LT.END mm lighter, its own short tube)
      det.strands = [0, 1, 2].map((i) => {
        const m = add("strand" + i, new THREE.Mesh(new THREE.BufferGeometry(), tapeMat()));
        if (i === 1) { const c = col(SH.colours.left); m.material.color.copy(c); m.material.emissive.copy(c); }
        return m;
      });
      // (strand 0's context stretch - its earlier stitches, ctx mm from its start - its own tube, faded as the model's tape)
      det.ctx = add("strandCtx", new THREE.Mesh(new THREE.BufferGeometry(), tapeMat()));
      const ec = col(SH.colours.end);
      det.end = add("end", new THREE.Mesh(new THREE.BufferGeometry(), mat({ color: ec, emissive: ec, emissiveIntensity: 0.1 })));
      det.hoseMat = hm;
      g.visible = false;
      details[id] = det;
    }
    // the trim's blade (draft 6: original and stylised - a short crescent, flat to the camera), its swipe trail (a ribbon,
    // each vertex's alpha from frameAt) and the offcuts (a cut end falling away): the close-ups' layer
    const blade = (() => {
      const sh = new THREE.Shape(), L = 7, n = 12;
      for (let i = 0; i <= n; i++) { const x = -L / 2 + L * i / n, k = 1 - (2 * x / L) ** 2; i ? sh.lineTo(x, 1.3 * k) : sh.moveTo(x, 1.3 * k); }
      for (let i = n; i >= 0; i--) { const x = -L / 2 + L * i / n, k = 1 - (2 * x / L) ** 2; sh.lineTo(x, 0.35 * k); }
      const c = col(SH.colours.blade || "#eef3f7");
      const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshBasicMaterial({ color: c, transparent: true, side: THREE.DoubleSide, depthTest: false }));
      m.renderOrder = 6;
      return m;
    })();
    const TRAIL_N = 19, trail = TU.ribbon(THREE, TRAIL_N);
    const offcuts = [0, 1].map(() => new THREE.Mesh(new THREE.BufferGeometry(), tapeMat()));
    for (const [k, m] of [["blade", blade], ["trail", trail], ["offcut0", offcuts[0]], ["offcut1", offcuts[1]]]) {
      m.name = "Lacing_Tutorial_" + k; m.layers.set(LAYER); m.visible = false;
    }
    // a light from the camera for the close-ups (the lock stitch is seen from below: the cables hang under the hose)
    const lamp = new THREE.DirectionalLight(0xffffff, 1.6);
    lamp.layers.set(LAYER);
    for (const m of Object.values(meshes)) m.userData = Object.assign(m.userData || {}, { name: m.name, group: "Tutorial" });
    for (const [k, m] of Object.entries(meshes)) m.name = "Lacing_Tutorial_" + k;
    // (the lacing's runs at the build pose, generated once: knotLace carries them to the core's other poses)
    const W0 = sweepAt(0), refs = LT.refsOf(W0.dense, W0.lace, laceParams(), cablesOf(W0), meta.hose.od / 2);
    return { P, refs, curve, segs, meshes, details, lamp, accent, col, rig, slice: { blade, trail, offcuts, n: TRAIL_N } };
  }

  function overlay(root, part) {                     // the cue (the one line of text) and the dip (no text)
    const e = document.createElement("div");
    if (part) e.dataset.part = part;
    Object.assign(e.style, part ? { position: "absolute", left: "50%", bottom: "6%", transform: "translateX(-50%)", maxWidth: "90%",
      whiteSpace: "nowrap", overflow: "hidden", padding: "0.35em 0.9em", borderRadius: "8px", pointerEvents: "none", zIndex: 5,
      font: "600 clamp(18px, 4.2vh, 60px) var(--font-display), system-ui, sans-serif", lineHeight: "1.2", color: "#fff",
      background: "rgb(0 0 0 / 0.6)" }
      : { position: "absolute", inset: "0", pointerEvents: "none", zIndex: 4, background: "var(--scene-bottom, #f1f2f3)", opacity: "0" });
    root.append(e);
    return e;
  }

  // the callouts (draft 10: frameAt's callouts, at most one) and the credits (draft 11: LR4LacingTut.creditsAt): media-anim's
  // callout and credits layers, sized from the frame, in the tape's colour. No data-part: media-anim's stills.mjs would
  // read the page as a DOM picture and drop its canvas rules (not-blank, frames-differ)
  const stageAt = (F) => ({ W: A.root.clientWidth, H: A.root.clientHeight, colour: F.colours.tape });
  const drawCallouts = (F) => MA.callout.draw(A.callout, F.callouts && F.callouts[0], stageAt(F));
  const drawCredits = (F) => MA.credits.draw(A.credits, F.credits, stageAt(F));

  // the tutorial on: the page at the build pose, its hose hidden, the rig's in its place
  function on() {
    if (A) return api;
    const root = document.querySelector("main.stage"), pose = HOME.pose;
    A = Object.assign(build(), { tm: LT.timing(), root, pose, last: null, layers: camera.layers.mask,
      hidden: pageHose().map((m) => ({ m, visible: m.visible, show: false })).concat(routerStub().map((m) => ({ m, visible: m.visible, show: true }))),
      bg: scene.background, colours: "" });
    A.looks = [A.rig.hose, A.rig.cord, A.rig.sleeve].filter(Boolean).map((m) => ({ m, opacity: m.material.opacity, transparent: m.material.transparent }));
    move([0, 0, 0]);
    for (const h of A.hidden) h.m.visible = h.show;
    for (const l of A.looks) scene.add(l.m);
    rigSweep(A.rig, 0, 0, 0);
    for (const m of Object.values(A.meshes)) scene.add(m);
    for (const d of Object.values(A.details)) scene.add(d.group);
    scene.add(A.slice.blade, A.slice.trail, ...A.slice.offcuts);
    { const b = LR4Demo.machineBox(), c = b.getCenter(new THREE.Vector3()); A.machine = { c: c.toArray(), r: b.getSize(new THREE.Vector3()).length() / 2 }; }
    scene.add(A.lamp, A.lamp.target);
    A.geo0 = Object.fromEntries([A.meshes.ghost, A.meshes.halo, A.meshes.tube].map((m) => [m.name, m.geometry]));   // (the opening's re-sweeps and the pulls swap these)
    A.dip = overlay(root, null);
    A.cue = overlay(root, "cue");
    A.callout = MA.callout.create(root);
    A.credits = MA.credits.create(root);
    root.dataset.anim = "lacing";
    api.duration = A.tm.duration; api.still = A.tm.still;
    api.scenes = A.tm.scenes.map((s) => ({ id: s.id, start: s.start, cue: s.cue, purpose: s.purpose, voiced: s.voiced }));
    // the voice-over's lines (draft 8: a scene's later lines in its hold): { id (<id>.wav), scene, at, dur (estimated) }
    api.lines = LT.voiceLines(A.tm).map((l) => ({ id: l.id, scene: l.scene, at: l.at, dur: l.dur }));
    // the sound cues (draft 6: the trim's swipe), on the voice's timeline: at = when its wav starts (lead before the cut)
    api.sfx = LT.sfxAt(A.tm, SH).map((q) => ({ id: q.id, t: q.t, at: q.t - SH.blade.sfxLead, scene: q.scene }));
    return api;
  }
  function off() {
    if (!A) return;
    if (A.swept) { swap(A.meshes.ghost, A.geo0[A.meshes.ghost.name]); swap(A.meshes.halo, A.geo0[A.meshes.halo.name]); }
    const gone = (m) => { scene.remove(m); if (m.geometry) m.geometry.dispose(); };
    for (const m of Object.values(A.meshes)) { gone(m); m.material.dispose(); }
    for (const d of Object.values(A.details)) { scene.remove(d.group); d.group.traverse((m) => { if (m.geometry) m.geometry.dispose(); }); }
    for (const m of [A.slice.blade, A.slice.trail, ...A.slice.offcuts]) { gone(m); m.material.dispose(); }
    scene.remove(A.lamp, A.lamp.target);
    if (A.head) A.head.dispose();
    rideDrop();
    camera.layers.mask = A.layers;
    for (const l of A.looks) { gone(l.m); l.m.material.dispose(); }
    A.rig.wire.dispose();
    for (const { m, visible } of A.hidden) m.visible = visible;
    scene.background = A.bg;
    A.cue.remove(); A.dip.remove(); MA.callout.remove(A.callout); MA.credits.remove(A.credits);
    for (const k of ["anim", "scene", "t", "reached"]) delete A.root.dataset[k];
    if (A.pose) move([A.pose.x, A.pose.y, A.pose.z]);
    A = null;
  }

  const gNow = () => ({ fov: camera.fov, aspect: camera.aspect, machine: A.machine });
  const opacity = TU.opacity;                        // (see-through only below 1: a change of transparent recompiles it)
  // the frame's layers and colours: the hose, cord and sleeve (the close-up's own copies, or the page's), the colours of
  // the tape, the square knot's left end and the working end, the close-ups' backdrop
  function looks(F, det) {
    const L = F.layers;
    if (det) {                                       // (a faded cable stays see-through: no recompile a frame)
      const op = (m, o) => { if (m.alphaMap) m.opacity = o; else opacity(m, o); };
      if (det.cord) op(det.cord.material, L.cord);
      if (det.sleeve) op(det.sleeve.material, L.sleeve);
    }
    for (const l of A.looks) opacity(l.m.material, l.m === A.rig.hose ? L.hose : l.m === A.rig.cord ? L.cord : L.sleeve, l.opacity);
    const key = JSON.stringify(F.colours);
    if (key !== A.colours) {
      A.colours = key;
      const C = F.colours, set = (m, c) => { const v = A.col(c); m.material.color.copy(v); m.material.emissive.copy(v); };
      A.accent = A.col(C.tape);
      for (const m of [A.meshes.tube, A.meshes.ghost, A.meshes.real]) set(m, C.tape);
      if (C.tip) set(A.meshes.tip, C.tip);
      set(A.meshes.end, C.end);
      A.glow = 0;                                    // (the ghost's base colour: the flash mixes from it)
      for (const d of Object.values(A.details)) { set(d.tape, C.tape); set(d.strands[0], C.tape); set(d.strands[2], C.tape); set(d.strands[1], C.left); set(d.end, C.end); }
    }
    scene.background = det && F.colours.backdrop ? A.col(F.colours.backdrop) : A.bg;
  }
  // ---- the opening (d12): the cord and sleeve loose and swaying until the reveal, then drawn in to the hose (frameAt's
  // cables, shaped by lacing/slack.js: the page's drawing, not frame maths - LR4Lacing.slack, not LR4LacingTut); the
  // lacing's ghost and halo (built at the build pose) re-swept as the core travels, the originals back after ----
  // the hose's dense line, the cord, the sleeve and the lacing's run 0 with the core dx out (as rigSweep: dy = dz = 0)
  // the cables of a sweep's runs, as knotLace lays each run's bundle (laceAt's runs: the cord and sleeve to the breakout,
  // then the cord alone)
  const cablesOf = (W) => {
    const h = meta.hose, cord = { pts: W.cp, r: h.cord.d / 2 };
    return W.sp ? [[cord, { pts: W.sp, r: h.sleeve.d / 2 }], [cord]] : [[cord]];
  };
  function sweepAt(dx) {
    const h = meta.hose, pts = H.hoseRoute(h, dx, 0).map(([x, y, z]) => new THREE.Vector3(x, y, z));
    const dense = new THREE.CatmullRomCurve3(pts, false, "centripetal").getPoints(12 * (pts.length - 1)).map((v) => [v.x, v.y, v.z]);
    const c = h.cord, sl = h.sleeve, sh = (q) => [q[0] + dx, q[1], q[2]];
    const cp = H.cordRoute(dense, h, c, sh(c.tip), sh(c.tip2), dx), sp = sl ? H.cordRoute(dense, h, sl, null, null, dx, [0, 0, 0]) : null;
    return { dense, cp, sp, lace: laceAt(dense, cp, sp, dx) };
  }
  function cableTube(mesh, pts, d) {                 // (rigSweep's tube: the same segments and sides)
    const cc = new THREE.CatmullRomCurve3(pts.map(V3), false, "centripetal");
    mesh.geometry.dispose();
    mesh.geometry = new THREE.TubeGeometry(cc, Math.ceil(cc.getLength() / 12), d / 2, 8, false);
  }
  function swap(m, geo) { if (m.geometry !== geo) { if (m.geometry !== A.geo0[m.name]) m.geometry.dispose(); m.geometry = geo; } }
  function opening(F) {
    const C = F.cables || null, dx = F.pose[0], swept = F.scene === "goal" && Math.abs(dx) > 1e-9, M = A.meshes, h = meta.hose, R = A.rig;
    if (!C && A.slack) { rigSweep(R, F.pose[0], F.pose[1], F.pose[2]); A.slack = false; }   // (laced again)
    if (!C && !swept) { if (A.swept) { swap(M.ghost, A.geo0[M.ghost.name]); swap(M.halo, A.geo0[M.halo.name]); A.swept = false; } return; }
    const W = sweepAt(dx), SL = window.LR4Lacing.slack, near = (d) => ({ pts: W.dense, r: h.od / 2, d, trayZ: h.tray_z });
    if (C && R.cord) cableTube(R.cord, SL.looseOf(W.cp, C, "cord", Object.assign(near(h.cord.d), { pinX: h.exit_x })), h.cord.d);
    if (C && R.sleeve && W.sp) cableTube(R.sleeve, SL.looseOf(W.sp, C, "sleeve", near(h.sleeve.d)), h.sleeve.d);
    A.slack = !!C;
    if (swept) {
      // (run 0 as the plan's, carried to this pose - d14b: the raw run here and the knotted plan parked swapped the
      // stitches' shape each time the core stopped or set off; knotLace keeps its last poses)
      const run = LT.knotLace(W.dense, { runs: [W.lace.runs[0]] }, laceParams(), cablesOf(W), h.od / 2, A.refs)[0], curve = curveOf(run), segs = 2 * run.length;
      swap(M.ghost, new THREE.TubeGeometry(curve, segs, GHOST_R, RADIAL, false));
      swap(M.halo, new THREE.TubeGeometry(curve, segs, M.halo.userData.r, 12, false));
      A.swept = true;
    } else if (A.swept) { swap(M.ghost, A.geo0[M.ghost.name]); swap(M.halo, A.geo0[M.halo.name]); A.swept = false; }
  }
  // the model's own lacing once it is done (the finale), at the core's pose, in the tape's colour: its lock stitches
  // knotted as the tutorial's tape (LR4LacingTut.knotLace: generated at the build pose, carried to this one - d14:
  // the page's lacingMesh draws them as flat rings) and as thick
  // (HITCH.tr, the knots' own: at the page's 0.6 mm the crossings read as scribbles - d14b), each
  // run its own tape as updateHose's; rebuilt when the pose moves
  function real(F) {
    const M = A.meshes;
    M.real.visible = F.real;
    if (!F.real) return;
    const key = F.pose[0].toFixed(6);
    if (A.realKey === key) return;
    const W = sweepAt(F.pose[0]), r = LT.HITCH.tr, geos = LT.knotLace(W.dense, W.lace, laceParams(), cablesOf(W), meta.hose.od / 2, A.refs).map((pts) =>
      new THREE.TubeGeometry(curveOf(pts), 2 * pts.length, r, 6, false));
    M.real.geometry.dispose();
    M.real.geometry = mergeGeos(geos);
    geos.forEach((g) => g.dispose());
    A.realKey = key;
  }
  // the run's lockstitch being pulled snug (d14b: frameAt's pulls): the tape and its ghost from the main tape with those
  // knots at their looseness (LR4LacingTut.tapeOf, the same point count), the originals back after -> the share drawn of it
  function pulled(F) {
    const M = A.meshes;
    if (!F.pulls || !F.pulls.length) {
      if (A.pulled) { swap(M.tube, A.geo0[M.tube.name]); if (!A.swept) swap(M.ghost, A.geo0[M.ghost.name]); A.pulled = null; }
      return F.f;
    }
    const V = LT.tapeOf(A.P, F.pulls);
    if (A.pulled !== V) {
      const curve = curveOf(V.pts);
      swap(M.tube, new THREE.TubeGeometry(curve, A.segs, LT.HITCH.tr, RADIAL, false));
      swap(M.ghost, new THREE.TubeGeometry(curve, A.segs, GHOST_R, RADIAL, false));
      A.pulled = V;
    }
    return LT.onTape(A.P, V, F.f);
  }
  const drawCount = (frac, segs) => TU.drawCount(frac, segs, RADIAL);
  const retube = (m, pts, segs, r, frac) => TU.retube(THREE, m, pts, { segs, r, radial: RADIAL, frac });
  // the frame at t seconds (LR4LacingTut.frameAt), applied
  function setT(t) {
    if (!A) on();
    const F = LT.frameAt(t, A.P, gNow(), A.tm, SH), M = A.meshes, p = HOME.pose;
    // the machine's pose (the confirm scene moves the core; the rig's hose, cord and sleeve re-swept with it)
    if (!p || Math.abs(p.x - F.pose[0]) + Math.abs(p.y - F.pose[1]) + Math.abs(p.z - F.pose[2]) > 1e-6) {
      move(F.pose);
      rigSweep(A.rig, F.pose[0], F.pose[1], F.pose[2]);
    }
    opening(F);
    real(F);
    const det = F.detail ? A.details[F.detail.id] : null;
    // a close-up: the camera sees its layer only (the lights joined to it); else the page's own layers
    if (det) { scene.traverse((o) => { if (o.isLight) o.layers.enable(LAYER); }); camera.layers.set(LAYER); }
    else camera.layers.mask = A.layers;
    for (const d of Object.values(A.details)) d.group.visible = d === det;
    looks(F, det);
    const f = pulled(F);
    M.tube.geometry.setDrawRange(0, drawCount(f, A.segs));
    M.tube.material.opacity = F.tape;
    M.tube.visible = !det && F.f > 0 && F.tape > 0;
    M.ghost.material.opacity = F.ghost;              // (only ahead of the tape: the drawn tape is the rest)
    M.ghost.geometry.setDrawRange(drawCount(f, A.segs), Infinity);
    M.ghost.visible = !det && F.ghost > 0 && F.f < 1;
    // the opening's flash (draft 11): the ghost's core toward the warm white, its emissive up; the halo widened and faded
    const rv = F.reveal, glow = rv ? rv.glow : 0;
    if (glow !== A.glow) {
      A.glow = glow;
      const c = A.accent.clone().lerp(A.col(LT.REVEAL.flash), glow);
      M.ghost.material.color.copy(c); M.ghost.material.emissive.copy(c);
      M.ghost.material.emissiveIntensity = 0.5 + 0.6 * glow;
    }
    MA.halo.set(M.halo, rv ? rv.halo : null, !det);
    let tipAt = A.curve.getPointAt(Math.min(1, Math.max(0, F.f)));
    if (det && F.detail.hitch) {                     // the lock stitch: its path at t, drawn to its length so far
      const hz = F.detail.hitch, fr = hz.draw / hz.total, c = retube(det.tape, hz.pts, 3 * hz.pts.length, LT.HITCH.tr, fr);
      tipAt = c.getPointAt(Math.min(1, Math.max(0, fr)));
    } else if (det && det.curve) {                   // the closing stitch: the plan's tape to the strand's start, drawn on
      det.tape.geometry.setDrawRange(0, drawCount(F.detail.frac, det.segs));
      tipAt = det.curve.getPointAt(Math.min(1, Math.max(0, F.detail.frac)));
    }
    if (det) {                                       // the knots' strands at t (none: hidden)
      const ss = (F.detail.strands || []);
      if (!F.detail.hitch && !det.curve) det.tape.visible = false;
      const q0 = ss[0], cut = q0 && q0.ctx > 0 ? Math.max(1, q0.cum.findIndex((c) => c >= q0.ctx)) : 0;
      det.ctx.visible = cut > 0 && q0.draw > 0.05;
      if (det.ctx.visible) { const pc = q0.pts.slice(0, cut + 1); retube(det.ctx, pc, Math.max(8, Math.round(pc.length * 1.5)), LT.HITCH.tr, Math.min(1, q0.draw / q0.cum[cut])); }
      det.strands.forEach((m, i) => {
        const q = ss[i], c0 = i === 0 ? cut : 0, L0 = c0 ? q.cum[c0] : 0;
        m.visible = !!(q && q.draw - L0 > 0.05);
        if (!m.visible) return;
        const pp = c0 ? q.pts.slice(c0) : q.pts;
        retube(m, pp, Math.max(8, Math.round(pp.length * 1.5)), LT.HITCH.tr, (q.draw - L0) / (q.total - L0));
      });

      det.hoseMat.opacity = F.detail.hoseO === undefined ? 1 : F.detail.hoseO;
      const cO = F.detail.contextO === undefined ? 1 : F.detail.contextO, bO = F.detail.baseO === undefined ? 1 : F.detail.baseO;
      det.tape.material.opacity = cO; det.tape.material.depthWrite = cO > 0.99;
      det.strands[0].material.opacity = bO; det.strands[0].material.depthWrite = bO > 0.99;
      det.ctx.material.opacity = cO; det.ctx.material.depthWrite = cO > 0.99;
      const es = F.detail.endSeg;                    // the working end, lighter (faded across a change of end)
      const eo = F.detail.endO === undefined ? 1 : F.detail.endO;
      det.end.visible = !!es && eo > 0.01;
      opacity(det.end.material, eo);
      if (es) retube(det.end, es, 2 * es.length, LT.HITCH.tr * 1.25);   // (past 1 / cos 30 with margin for the bends: the tape's hexagon twisted against it pokes through)
    }
    if (F.tipAt) tipAt = V3(F.tipAt);           // (frameAt's live end, every view - draft 7)
    slice(F, det);
    M.tip.position.copy(tipAt);
    M.tip.scale.setScalar(F.tipScale || 1);
    M.tip.material.opacity = F.tip;
    M.tip.visible = F.tip > 0;
    M.end.visible = !det && !!F.endSeg && M.tube.visible;
    if (M.end.visible) { opacity(M.end.material, F.tape); retube(M.end, F.endSeg, 2 * F.endSeg.length, LT.HITCH.tr * 1.25); }
    M.bracket.scale.setScalar(Math.max(1e-3, F.bracket.scale));
    M.bracket.material.opacity = F.bracket.opacity;
    M.bracket.visible = !det && F.bracket.opacity > 0;
    camera.position.set(...F.cam[0]);
    controls.target.set(...F.cam[1]);
    controls.update();
    A.lamp.position.copy(camera.position); A.lamp.target.position.set(...F.cam[1]);
    const head = headOf();                           // (after the camera: it sizes the head from this view)
    if (head) {
      head.update(t);
      // at most head.maxPx tall at 720 lines (d17h: in the knots' close-ups scale x the ball covered the knot), never
      // less than covers the ball (the overlay's own margin 1.06); scaled about the sprite's centre, the cover circle's
      const sp = head.sprite, HD = SH.head, cw = (sp.scale.x * 2 * self.MediaAnim.faceRig.GEO.cover.r) / self.MediaAnim.faceOverlay.SIZE;
      const z = -sp.position.clone().applyMatrix4(camera.matrixWorldInverse).z;
      const px = z > 0 ? (cw / (2 * z * Math.tan((camera.fov * Math.PI) / 360))) * 720 : 0;
      if (HD.maxPx && px > HD.maxPx) { const k = Math.max(1.06 / (HD.scale || 1), HD.maxPx / px); sp.scale.x *= k; sp.scale.y *= k; }
      head.sprite.visible = head.sprite.visible && M.tip.visible;
      head.sprite.material.opacity = F.tip;
    }
    riding(t, F, M, head);                           // (the rider and Jensen Cam: off, nothing)
    A.dip.style.opacity = F.dip.toFixed(3);
    A.cue.textContent = F.cue;
    A.cue.style.opacity = F.cueO.toFixed(3);
    drawCallouts(F);
    drawCredits(F);
    Object.assign(A.root.dataset, { scene: F.scene, t: F.tt.toFixed(2), reached: String(F.tied) });
    A.last = F;
    return F;
  }
  // the trim (frameAt's detail.blades / trails / offcuts): the blade posed on its arc, the trail's ribbon (its alpha per
  // vertex), the offcuts as short tubes in their strand's colour
  function slice(F, det) {
    const S = A.slice, d = det ? F.detail : {}, bl = (d.blades || [])[0], tr = (d.trails || [])[0], oc = d.offcuts || [];
    S.blade.visible = !!bl && bl.o > 0.01;
    if (S.blade.visible) {
      S.blade.position.set(...bl.p);
      S.blade.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(V3(bl.x), V3(bl.y), V3(bl.z)));
      S.blade.material.opacity = bl.o;
      S.blade.material.color.copy(A.col(F.colours.blade || "#eef3f7"));
    }
    S.trail.visible = !!tr;
    if (tr) TU.setRibbon(THREE, S.trail, S.n, tr, A.col(F.colours.trail || "#ffffff"));
    S.offcuts.forEach((m, i) => {
      const q = oc[i];
      m.visible = !!q && q.o > 0.01;
      if (!m.visible) return;
      retube(m, q.pts, Math.max(6, 2 * q.pts.length), LT.HITCH.tr);
      const c = A.col(q.e === 1 ? F.colours.left : F.colours.tape);
      m.material.color.copy(c); m.material.emissive.copy(c);
      m.material.opacity = q.o; m.material.transparent = true;
    });
  }
  // the camera of the last frame, as the director's frame() takes it: [[position], [target]]
  const cameraNow = () => (A && A.last ? A.last.cam : null);
  // practice tutorial-animations §9.5: a ray from the camera to the frame's action point (the crossing, the tape's end,
  // the bracket) - the first visible mesh it meets before it, other than the tutorial's own (null = nothing in the way)
  const OWN = /^Lacing_Tutorial_(tube|ghost|halo|tip|bracket|blade|trail|offcut\d|\w+_tape|\w+_end|\w+_strand\d)$/;
  const occluder = () => (A && A.last && A.last.focus ? MA.occluder.find(THREE, { camera, scene, focus: A.last.focus, skip: OWN }) : null);

  // the tweak panel's hooks: the shots in use, swap them (it redraws), a key at the camera now, the last frame
  const tweak = {
    shots: () => SH,
    setShots(s) { SH = s; if (A) { A.colours = ""; rideDrop(); } },
    addKey: (id, local) => LT.addKey(SH, id, local, A.P, gNow(), A.tm),
    frame: () => (A ? A.last : null),
    timing: () => (A ? A.tm : LT.timing()),
  };
  const api = { on, off, setT, ready, tweak, camera: cameraNow, occluder, duration: 0, still: 0, scenes: [], sfx: [], reducedMotion: false, active: () => !!A, headOn: () => headOn() && !!headParts,
    riderOn: () => riderOn() && !!bodyParts, camOn: () => camOn() && !!bodyParts,
    // the rider's box (viewport px) and Jensen Cam's inset (callout units) at the last frame, for page checks
    ride: () => { const RS = A && A.ride; return RS ? { rider: RS.rider && RS.rider.sprite.visible ? RS.rider.rect() : null, inset: RS.frame } : null; } };

  // index.html?anim=lacing: the check page - window.__anim once the machine and its hose are built; no clock (setT only);
  // under prefers-reduced-motion the still, held
  if (new URLSearchParams(location.search).get("anim") === "lacing") {
    const status = document.getElementById("status");
    const loaded = () => status && status.hidden && typeof meta !== "undefined" && meta && meta.hose && meta.hose.cord && hoseMesh;
    let going = false;
    const start = async () => {
      if (window.__anim || going || !loaded()) return;
      going = true;
      // the finale's room as the sandbox draws it with its under-the-table options on: the hub (switch panel, outlets,
      // cords) and the shop vac + separator. The page's saved options are put back (the change handler stores them).
      const kept = kvGet("lr4-opts");
      for (const k of ["hub", "vac"]) { const o = document.getElementById("opt-" + k); o.checked = true; o.dispatchEvent(new Event("change")); }
      kvSet("lr4-opts", kept ?? "{}");
      await ready();
      await headLoad();
      await bodyLoad();
      if (window.LR4Demo) LR4Demo.recording(true);  // the 3D view, the whole window
      const w = document.getElementById("welcome");
      if (w) w.hidden = true;
      on();
      api.reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
      setT(api.reducedMotion ? api.still : 0);
      window.__anim = api;
    };
    if (status) new MutationObserver(start).observe(status, { attributes: true, attributeFilter: ["hidden"] });
    document.addEventListener("DOMContentLoaded", start);
  }
  return api;
})();
