// The ?stats panel (js/page/stats.js) and the flat stock top (job.js stockFlat) in headless Chrome:
//  - index.html?stats: the panel opens, its live line and census have positive totals, the stock group is there;
//  - the spoilboard's height field, uncut, draws as its 2 corner triangles, the same picture as the grid (pixel for pixel);
//    a cut switches it to the grid, a reset (a whole update of a flat board) back;
//  - ?stockgrid=1 keeps the grid (the before / after measure);
//  - a group row's click outlines it;
//  - ?anim=lacing&play=1&tweak=1&stats: the panel with the tutorial's tweak panel.
//   node tests/test_page_stats.js [--gpu]   (not in npm test: needs Chrome + Python; ~2 min on SwiftShader)
"use strict";
const { CHROME, sleep, server, chromePage } = require("./test_page_fluidnc.js");

let fails = 0, checks = 0;
const ok = (cond, msg) => { checks++; console.log((cond ? "  ok   " : "  FAIL ") + msg); if (!cond) fails++; };

(async () => {
  if (!CHROME) { console.log("Chrome not found (set CHROME)"); process.exit(1); }
  const port = 8690 + Math.floor(Math.random() * 100), srv = server("headers", port);
  const page = await chromePage(9500 + Math.floor(Math.random() * 100), { gpu: process.argv.includes("--gpu") });
  const open = async (q, ready) => {
    await page.send("Page.navigate", { url: `http://127.0.0.1:${port}/web/index.html?${q}` });
    for (let i = 0; i < 400; i++) {
      await sleep(500);
      try { if (await page.val(`location.search === ${JSON.stringify("?" + q)} && (${ready})`)) return true; } catch (e) { /* loading */ }
    }
    return false;
  };
  const loaded = `document.getElementById("status") && document.getElementById("status").hidden && !!document.getElementById("stats-panel")
    && typeof SPOIL !== "undefined" && !!SPOIL.mesh`;
  try {
    await sleep(800);
    ok(await open("stats", loaded), "?stats: the page loads with the panel");
    await sleep(1500);
    const a = await page.val(`(() => { LR4Stats.render(); const c = LR4Stats.census(), s = LR4Stats.state();
      return { s, total: c.total, groups: c.groups.map((g) => [g.group, g.tris, g.meshes]), live: document.getElementById("stats-live").textContent,
        rows: document.querySelectorAll("#stats-table tr[data-key]").length }; })()`);
    ok(a.s.fps > 0 && a.s.calls > 0 && a.s.tris > 0, `live: ${a.live}`);
    ok(a.total.tris > 0 && a.total.verts > 0 && a.total.meshes > 0, `census: ${a.total.meshes} meshes, ${a.total.tris} triangles, ${a.total.verts} vertices`);
    const stock = a.groups.find((g) => g[0] === "stock");
    ok(!!stock && a.rows === a.groups.length, `a row a group (${a.groups.map((g) => g[0]).join(", ")})`);
    ok(stock && stock[1] < 100, `the stock group, uncut: ${stock && stock[1]} triangles (2 for the top + the walls and bottom)`);

    // the flat top and the grid: the same picture inside the board; at its outline the antialiased edge pixels may differ a
    // little (the depth there, interpolated over 2 triangles or 1.2 M, decides some samples against the walls beside it)
    const px = await page.val(`(() => {
      const m = SPOIL.mesh, g = m.geometry, b = m.userData.box, c = b.getCenter(new THREE.Vector3());
      const was = [camera.position.clone(), controls.target.clone()];
      camera.position.set(c.x + 300, c.y - 900, c.z + 500); controls.target.copy(c); camera.lookAt(c); camera.updateMatrixWorld();
      const W = renderer.domElement.width, H = renderer.domElement.height;
      const grab = () => { renderer.render(scene, camera); const k = document.createElement("canvas"); k.width = W; k.height = H;
        const x = k.getContext("2d"); x.drawImage(renderer.domElement, 0, 0); return x.getImageData(0, 0, W, H).data; };
      const flat = g.index === g.userData.flat, A = grab();
      g.setIndex(g.userData.grid); const B = grab(); g.setIndex(g.userData.flat);
      // the top's outline on screen (its 4 corners at the top's height)
      const P = [[b.min.x, b.min.y], [b.max.x, b.min.y], [b.max.x, b.max.y], [b.min.x, b.max.y]].map(([x, y]) => {
        const v = new THREE.Vector3(x, y, b.max.z).project(camera); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; });
      const edge = (q) => Math.min(...P.map((p, i) => { const r = P[(i + 1) % 4], d = [r[0] - p[0], r[1] - p[1]];
        const t = Math.max(0, Math.min(1, ((q[0] - p[0]) * d[0] + (q[1] - p[1]) * d[1]) / (d[0] * d[0] + d[1] * d[1])));
        return Math.hypot(q[0] - p[0] - t * d[0], q[1] - p[1] - t * d[1]); }));
      let diff = 0, max = 0, far = 0, pix = new Set();
      for (let i = 0; i < A.length; i++) { const d = Math.abs(A[i] - B[i]); if (!d) continue;
        diff++; max = Math.max(max, d); const k = i >> 2; if (pix.has(k)) continue; pix.add(k);
        if (edge([k % W + 0.5, Math.floor(k / W) + 0.5]) > 2) far++; }
      camera.position.copy(was[0]); controls.target.copy(was[1]);
      return { flat, diff, max, pixels: pix.size, far, n: W * H, tris: g.userData.grid.count / 3 }; })()`);
    ok(px.flat, `the uncut spoilboard draws flat: 2 triangles for ${px.tris} in the grid`);
    ok(px.far === 0, `flat and grid, the same picture: ${px.pixels} of ${px.n} pixels differ (max ${px.max} / 255), ` +
      `all within 2 px of the board's outline (${px.far} further in)`);

    // a cut: the grid; a fresh board (a whole update, flat): the two triangles again
    const cut = await page.val(`(() => {
      const s = SPOIL.sim, g = SPOIL.mesh.geometry, k = (s.vy >> 1) * s.vx + (s.vx >> 1);
      s.heights[k] -= 1.5; s.markAllDirty(); meshUpdate(s, SPOIL.mesh, false);
      const afterCut = g.index === g.userData.grid;
      s.heights[k] += 1.5; s.markAllDirty(); meshUpdate(s, SPOIL.mesh, false);
      const stays = g.index === g.userData.grid;
      meshUpdate(s, SPOIL.mesh, true);
      return { afterCut, stays, back: g.index === g.userData.flat }; })()`);
    ok(cut.afterCut, "a cut in the middle: the grid");
    ok(cut.stays && cut.back, "a partial update back to flat stays the grid; a whole update finds it flat again");

    // a row's click: the group outlined
    const lit = await page.val(`(() => { const tr = document.querySelector('#stats-table tr[data-key="g:stock"]'); tr.click();
      return { lit: LR4Stats.state().lit, box: scene.children.some((o) => o.userData.statsHelper) }; })()`);
    ok(lit.lit === "g:stock" && lit.box, "the stock row's click: outlined");

    ok(await open("stats&stockgrid=1", loaded), "?stats&stockgrid=1 loads");
    await sleep(1500);
    const g1 = await page.val(`(() => { const c = LR4Stats.census(), g = SPOIL.mesh.geometry;
      return { grid: g.index === g.userData.grid, tris: (c.groups.find((x) => x.group === "stock") || {}).tris }; })()`);
    ok(g1.grid && g1.tris > 100000, `?stockgrid=1: the grid (${g1.tris} triangles in the stock group)`);

    ok(await open("anim=lacing&play=1&tweak=1&stats", `${loaded} && !!window.__player && __player.ready() && !!document.getElementById("anim-tweak")`),
      "?anim=lacing&play=1&tweak=1&stats: the tutorial, its tweak panel and the stats panel");
    await page.val("__player.seek(60)");
    await sleep(1500);
    const t = await page.val(`(() => { const c = LR4Stats.census(); return { s: LR4Stats.state(), lacing: (c.groups.find((g) => g.group === "lacing") || {}).tris,
      stock: (c.groups.find((g) => g.group === "stock") || {}).tris }; })()`);
    ok(t.s.calls > 0 && t.s.tris > 0, `in the tutorial at 60 s: ${t.s.calls} draw calls, ${t.s.tris} triangles drawn`);
    ok(t.lacing > 0 && t.stock < 100, `the lacing group (${t.lacing} triangles) and the stock flat (${t.stock})`);
  } catch (e) {
    ok(false, "error: " + (e && e.stack || e));
  } finally {
    await page.close();
    srv.kill();
    console.log(`${checks - fails}/${checks} ok`);
    process.exit(fails ? 1 : 0);
  }
})();
