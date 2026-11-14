// What the scene costs to draw, mesh by mesh (pure: no THREE / DOM; tests/test_mesh_stats.js). The page's ?stats panel
// (js/page/stats.js, ported from new-zenxy web/src/app/statsOverlay.ts + meshStats.ts) feeds it the visible meshes and
// shows the groups and the meshes, biggest first. A mesh's cost is what its draw call draws: the index (or position)
// count inside its draw range, times its instances.
(function (root) {
  "use strict";
  // geometry-like { index: { count } | null, attributes: { position: { count } }, drawRange: { start, count } }, instances
  // -> { tris, verts }
  function meshCost(geo, instances = 1) {
    if (!geo || !geo.attributes || !geo.attributes.position) return { tris: 0, verts: 0 };
    const verts = geo.attributes.position.count, n = geo.index ? geo.index.count : verts;
    const dr = geo.drawRange || { start: 0, count: Infinity }, drawn = Math.max(0, Math.min(dr.count, n - dr.start));
    return { tris: Math.floor(drawn / 3) * instances, verts: verts * instances };
  }
  // the group a mesh is counted in: the hose's own parts by name, the stock height fields (userData.stats), the lacing
  // (the model's and the tutorial's), else the part's motion (core, gantry, beam, table ...), else "unnamed".
  // ud = the nearest userData that says something (the mesh's or an ancestor's), name = its name
  const BY_NAME = [[/^Vacuum_Hose/, "hose"], [/^Router_Cord_Run/, "cord"], [/^Cable_Sleeve/, "sleeve"], [/^(Cable_Lacing|Lacing_Tutorial)/, "lacing"]];
  function groupOf(ud, name) {
    const n = name || "";
    for (const [re, g] of BY_NAME) if (re.test(n)) return g;
    if (ud && ud.stats) return ud.stats;
    if (ud && ud.motion) return ud.motion;
    return "unnamed";
  }
  // items [{ id, name, group, tris, verts }] -> { total: { tris, verts, meshes }, groups: [{ group, tris, verts, meshes }],
  // meshes: items sorted by triangles (then vertices, then name) }
  function tally(items) {
    const by = new Map(), total = { tris: 0, verts: 0, meshes: 0 };
    for (const it of items) {
      const g = by.get(it.group) || { group: it.group, tris: 0, verts: 0, meshes: 0 };
      g.tris += it.tris; g.verts += it.verts; g.meshes++;
      by.set(it.group, g);
      total.tris += it.tris; total.verts += it.verts; total.meshes++;
    }
    const order = (a, b) => b.tris - a.tris || b.verts - a.verts || String(a.name || a.group).localeCompare(String(b.name || b.group));
    return { total, groups: [...by.values()].sort(order), meshes: items.slice().sort(order) };
  }
  const k = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(2)} M` : n >= 1000 ? `${(n / 1000).toFixed(1)} k` : String(n));

  const api = { meshCost, groupOf, tally, k, BY_NAME };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.LR4MeshStats = api;
})(typeof self !== "undefined" ? self : this);
