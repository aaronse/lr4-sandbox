// js/mesh_stats.js (the ?stats panel's counting): a mesh's triangles within its draw range and instances, the group rules,
// the tally biggest first.   node tests/test_mesh_stats.js
"use strict";
const MS = require("../web/js/mesh_stats.js");

let fails = 0, checks = 0;
const ok = (cond, msg) => { checks++; console.log((cond ? "  ok   " : "  FAIL ") + msg); if (!cond) fails++; };
const geo = (verts, idx, dr) => ({ attributes: { position: { count: verts } }, index: idx === null ? null : { count: idx }, drawRange: dr || { start: 0, count: Infinity } });

let c = MS.meshCost(geo(4, 6));
ok(c.tris === 2 && c.verts === 4, "indexed quad: 2 triangles, 4 vertices");
c = MS.meshCost(geo(9, null));
ok(c.tris === 3 && c.verts === 9, "non-indexed: position count / 3");
c = MS.meshCost(geo(100, 600, { start: 0, count: 120 }));
ok(c.tris === 40, "a draw range counts only what it draws (the tutorial's tape drawn on)");
c = MS.meshCost(geo(100, 600, { start: 590, count: Infinity }));
ok(c.tris === 3, "a draw range near the end is clipped to the index");
c = MS.meshCost(geo(8, 36), 5);
ok(c.tris === 60 && c.verts === 40, "instances multiply");
ok(MS.meshCost(null).tris === 0 && MS.meshCost({}).tris === 0, "no geometry: 0");
// a flat stock top (its two corner triangles) against the grid it replaces: 675 x 1284 cells
const vx = 676, vy = 1285;
ok(MS.meshCost(geo(vx * vy, 6)).tris === 2 && MS.meshCost(geo(vx * vy, 675 * 1284 * 6)).tris === 1733400, "stock: 2 triangles flat, 1.73 M as the grid");

ok(MS.groupOf({ motion: "hose" }, "Vacuum_Hose") === "hose", "the hose by name (its motion is hose too)");
ok(MS.groupOf({ motion: "hose" }, "Router_Cord_Run") === "cord" && MS.groupOf({ motion: "hose" }, "Cable_Sleeve") === "sleeve", "cord and sleeve by name");
ok(MS.groupOf({ motion: "hose" }, "Cable_Lacing") === "lacing" && MS.groupOf({ group: "Tutorial" }, "Lacing_Tutorial_ghost") === "lacing", "the lacing: the model's and the tutorial's");
ok(MS.groupOf({ stats: "stock", z: 0 }, "") === "stock", "a stock height field by its userData.stats");
ok(MS.groupOf({ motion: "core" }, "Router_MotorCap") === "core", "a part by its motion");
ok(MS.groupOf(null, "") === "unnamed" && MS.groupOf({}, "x") === "unnamed", "nothing to go by: unnamed");

const t = MS.tally([
  { id: "a", name: "A", group: "core", tris: 10, verts: 30 }, { id: "b", name: "B", group: "stock", tris: 1000, verts: 900 },
  { id: "c", name: "C", group: "core", tris: 50, verts: 60 }, { id: "d", name: "D", group: "hose", tris: 50, verts: 70 }]);
ok(t.total.tris === 1110 && t.total.verts === 1060 && t.total.meshes === 4, "totals");
ok(t.groups.map((g) => g.group).join() === "stock,core,hose" && t.groups[1].meshes === 2 && t.groups[1].tris === 60, "groups biggest first, counted");
ok(t.meshes.map((m) => m.id).join() === "b,d,c,a", "meshes biggest first (a tie on triangles: more vertices first)");
ok(MS.k(1733400) === "1.73 M" && MS.k(14640) === "14.6 k" && MS.k(12) === "12", "k / M labels");

console.log(`${checks - fails}/${checks} ok`);
process.exit(fails ? 1 : 0);
