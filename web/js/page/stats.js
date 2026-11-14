// lr4-sandbox page: the mesh stats panel (index.html?stats; off without it), ported from new-zenxy
// web/src/app/statsOverlay.ts + meshStats.ts as plain JS. A live line - frames a second, draw calls and triangles from
// renderer.info, read right after the page's main render (js/page/scripting.js calls window.LR4StatsTick) - and two
// tables, biggest first: the groups (the parts' motion, plus hose / cord / sleeve / lacing / stock / unnamed) and the
// meshes, each with its triangles, vertices and mesh count (js/mesh_stats.js counts them). The tables count the meshes the
// camera can see (visible, on a layer it sees), before frustum culling; the live line is what was drawn, the shadow map's pass included. A row's click
// outlines that mesh (or group) in the accent colour and frames the camera on it (a part is also selected, as a click on
// it would); a second click lets it go. Works with the tutorial's preview too (?anim=lacing&play=1&tweak=1&stats), where
// the tutorial's camera has the view: the outline only.
// The page's scripts share one global scope (see the header of hose_bom.js): scene, camera, controls, renderer, meshes,
// select, camEase, css are theirs.
window.LR4Stats = (() => {
  if (!new URLSearchParams(location.search).has("stats")) return null;
  const MS = window.LR4MeshStats, MAX_ROWS = 40;
  const S = { frames: 0, calls: 0, tris: 0, fps: 0, last: performance.now(), lit: null, box: null, tab: "groups", data: null };
  const el = (tag, css, parent, text) => { const e = document.createElement(tag); if (css) e.style.cssText = css; if (text) e.textContent = text; if (parent) parent.append(e); return e; };

  // what the camera can see: meshes visible all the way up, on a layer it sees
  function census() {
    const items = [], byId = new Map();
    const walk = (o, ud, name) => {
      if (!o.visible) return;
      const u = o.userData && (o.userData.name || o.userData.motion || o.userData.stats) ? o.userData : ud;
      const nm = (o.userData && (o.userData.name || o.userData.statsName)) || o.name || name;
      if (o.isMesh && o.layers.test(camera.layers)) {
        const c = MS.meshCost(o.geometry, o.isInstancedMesh ? o.count : 1);
        const it = { id: o.uuid, name: nm || `(unnamed ${o.geometry ? o.geometry.type : "mesh"})`, group: MS.groupOf(u, nm), tris: c.tris, verts: c.verts };
        items.push(it); byId.set(it.id, o);
      }
      for (const ch of o.children) walk(ch, u, nm);
    };
    walk(scene, null, "");
    return { t: MS.tally(items), byId };
  }

  let P = null;
  function build() {
    P = el("div", "position:fixed;left:8px;bottom:8px;z-index:56;width:min(440px,calc(100vw - 16px));max-height:60vh;display:flex;" +
      "flex-direction:column;gap:4px;padding:8px 10px;border-radius:8px;background:rgb(0 0 0 / 0.72);color:#fff;" +
      "font:11px/1.35 ui-monospace,Consolas,monospace", document.body);
    P.id = "stats-panel";
    const head = el("div", "display:flex;gap:6px;align-items:center", P);
    P.live = el("span", "flex:1;font-weight:600", head, "…");
    P.live.id = "stats-live";
    for (const t of ["groups", "meshes"]) {
      const b = el("button", "font:inherit;padding:1px 6px", head, t);
      b.dataset.tab = t;
      b.onclick = () => { S.tab = t; render(); };
    }
    const fold = el("button", "font:inherit;padding:1px 6px", head, "–");
    fold.setAttribute("aria-label", "Fold the stats panel");
    fold.onclick = () => { const on = fold.textContent === "–"; P.wrap.style.display = on ? "none" : ""; P.sum.style.display = on ? "none" : ""; fold.textContent = on ? "+" : "–"; };
    P.sum = el("div", "opacity:0.8", P);
    P.sum.id = "stats-sum";
    P.wrap = el("div", "overflow:auto;min-height:0", P);
    P.table = el("table", "border-collapse:collapse;width:100%", P.wrap);
    P.table.id = "stats-table";
    P.table.addEventListener("click", (e) => { const tr = e.target.closest("tr[data-key]"); if (tr) pick(tr.dataset.key); });
  }
  function row(key, label, n, tris, verts, max) {
    const tr = el("tr", "cursor:pointer");
    tr.dataset.key = key;
    if (key === S.lit) tr.style.background = "rgb(255 255 255 / 0.18)";
    const td = (t, css) => el("td", "padding:1px 4px;white-space:nowrap;" + (css || ""), tr, t);
    td(label, "max-width:190px;overflow:hidden;text-overflow:ellipsis").title = label;
    td(String(n), "text-align:right"); td(MS.k(tris), "text-align:right"); td(MS.k(verts), "text-align:right");
    td("█".repeat(Math.max(tris ? 1 : 0, Math.round(10 * tris / Math.max(1, max)))), "color:#e0584f");
    return tr;
  }
  function render() {
    if (!P) return;
    S.data = census();
    const { t } = S.data, rows = [];
    const hd = el("tr", "opacity:0.7");
    for (const h of [S.tab === "groups" ? "group" : "mesh", "n", "tris", "verts", ""]) el("th", "text-align:left;padding:1px 4px;font-weight:400", hd, h);
    rows.push(hd);
    if (S.tab === "groups") for (const g of t.groups) rows.push(row("g:" + g.group, g.group, g.meshes, g.tris, g.verts, t.groups[0].tris));
    else {
      for (const m of t.meshes.slice(0, MAX_ROWS)) rows.push(row("m:" + m.id, `${m.name} · ${m.group}`, 1, m.tris, m.verts, t.meshes[0].tris));
      if (t.meshes.length > MAX_ROWS) { const tr = el("tr", "opacity:0.7"); el("td", "padding:1px 4px", tr, `… ${t.meshes.length - MAX_ROWS} more`).colSpan = 5; rows.push(tr); }
    }
    P.table.replaceChildren(...rows);
    for (const b of P.querySelectorAll("button[data-tab]")) b.style.fontWeight = b.dataset.tab === S.tab ? "700" : "400";
    P.sum.textContent = `seen: ${t.total.meshes} meshes, ${MS.k(t.total.tris)} triangles, ${MS.k(t.total.verts)} vertices (before culling)`;
  }

  // a row picked: its meshes outlined, the camera framed on them (unless a tutorial or a video has the view)
  function pick(key) {
    if (S.box) { scene.remove(S.box); S.box.geometry.dispose(); S.box = null; }
    if (key === S.lit || !S.data) { S.lit = null; if (typeof select === "function") select(null); render(); return; }
    S.lit = key;
    const objs = (key.startsWith("m:") ? S.data.t.meshes.filter((m) => m.id === key.slice(2)) : S.data.t.meshes.filter((m) => "g:" + m.group === key))
      .map((m) => S.data.byId.get(m.id)).filter(Boolean);
    const box = new THREE.Box3();
    for (const o of objs) { o.updateMatrixWorld(); box.expandByObject(o); }
    if (box.isEmpty()) { render(); return; }
    S.box = new THREE.Box3Helper(box, new THREE.Color(css("--accent") || "#c8241b"));
    S.box.layers.enableAll();
    S.box.userData.statsHelper = true;
    scene.add(S.box);
    const one = objs.length === 1 ? objs[0] : null;
    if (one && meshes.includes(one) && one.material && one.material.emissive && typeof select === "function") select(one);
    const busy = !!window.__anim || (window.LR4Director && LR4Director.running());
    if (!busy) {
      const c = box.getCenter(new THREE.Vector3()), r = Math.max(20, box.getSize(new THREE.Vector3()).length() / 2);
      const dir = camera.position.clone().sub(controls.target).normalize();
      const dist = r / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2)) * 1.1;
      const to = c.clone().addScaledVector(dir, dist);
      if (typeof camEase === "function") camEase(to, c); else { camera.position.copy(to); controls.target.copy(c); }
    }
    render();
  }

  // after the main render: renderer.info is that render's (it resets at each render call)
  window.LR4StatsTick = () => {
    S.frames++;
    S.calls = renderer.info.render.calls; S.tris = renderer.info.render.triangles;
  };
  setInterval(() => {                                // the live line twice a second (reading every frame would cost frames)
    const now = performance.now();
    S.fps = (S.frames * 1000) / Math.max(1, now - S.last);
    S.frames = 0; S.last = now;
    if (!P && document.body) { build(); render(); }
    if (P) P.live.textContent = `${S.fps.toFixed(0)} fps · ${S.calls} draw calls · ${MS.k(S.tris)} tris drawn (with the shadow pass)`;
  }, 500);
  setInterval(() => { if (P && !P.matches(":hover")) render(); }, 2000);   // the tables (not under the pointer: a click lands)

  return { state: () => ({ fps: S.fps, calls: S.calls, tris: S.tris, lit: S.lit }), census: () => census().t, pick, render };
})();
