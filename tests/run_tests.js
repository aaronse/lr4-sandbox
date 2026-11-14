// The fork's fast npm test: the files upstream's run.js picks (every tests/test_*.js but the page tests; LOCAL's only with
// --local), several at a time. package.json stays upstream's (npm test = run.js, one at a time); run this one by hand.
// test_lacing_tutorial.js runs as one process per group of its sections (--list), so its slowest section is the wait.
// Its clearance section gets 2 worker threads here (CLEARANCE_JOBS, if unset; alone it takes 8): the other files share
// the cores, and npm test measured 6.6-7.6 s with 1-2 against 8.1-8.5 s with 8 (R12, 2026-11-10).
// A pass prints one line; a failure prints that command's whole output. Exit 1 on any failure.
//   node tests/run_tests.js [--local] [-j N] [--verbose]      (TEST_JOBS=N also sets the jobs; default 6)
"use strict";
const { spawn, execFileSync } = require("child_process"), path = require("path");
const args = process.argv.slice(2), verbose = args.includes("--verbose");
const jArg = args.indexOf("-j"), JOBS = Math.max(1, +(jArg >= 0 ? args[jArg + 1] : process.env.TEST_JOBS || 6) || 6);
// = run.js's pick (its LOCAL: what CI doesn't have)
const LOCAL = ["config_model", "parts_files", "strut_plate"];
const cmds = require("fs").readdirSync(__dirname).filter((f) => /^test_(?!page_).*\.js$/.test(f)).sort()
  .filter((f) => args.includes("--local") || !LOCAL.includes(f.slice(5, -3))).map((f) => ["node", f]);
const LACING = "test_lacing_tutorial.js";
const SLOW = new Set(["test_strut_cam.js", "test_router_body.js", "test_config_model.js", "test_strut_plate.js"]);   // (2-7 s each, measured 2026-11-10)
// the lacing file's heavy sections each get a process; the rest share one (names it no longer has are ignored)
const GROUPS = [["clearance"], ["callouts", "frames"], ["draft11", "events", "knotgen", "tape"]];
const first = [], par = [];
for (const c of cmds) {
  const file = c[1] || "";
  if (!/^test_.*\.js$/.test(file)) first.push(c);
  else if (file === LACING && c.length === 2) {
    const names = execFileSync(c[0], [file, "--list"], { cwd: __dirname, encoding: "utf8" }).trim().split(/\r?\n/).map((l) => l.split(/\s+/)[0]);
    const used = new Set(), groups = GROUPS.map((g) => g.filter((n) => names.includes(n))).filter((g) => g.length);
    groups.forEach((g) => g.forEach((n) => used.add(n)));
    groups.push(names.filter((n) => !used.has(n)));
    for (const g of groups.filter((x) => x.length)) par.push([c[0], file, "--only", g.join(",")]);
  } else par.push(c);
}
const t0 = Date.now(), done = [], env = Object.assign({}, process.env, { CLEARANCE_JOBS: process.env.CLEARANCE_JOBS || "2" });
const runOne = (c) => new Promise((res) => {
  const s = Date.now(), p = spawn(c[0], c.slice(1), { cwd: __dirname, windowsHide: true, env });
  let out = "";
  p.stdout.on("data", (d) => (out += d)); p.stderr.on("data", (d) => (out += d));
  p.on("close", (code) => { const r = { cmd: c.join(" "), code, sec: (Date.now() - s) / 1000, out }; done.push(r); if (verbose) console.log(`${r.sec.toFixed(1).padStart(6)} s  ${code ? "FAIL" : "ok  "}  ${r.cmd}`); res(r); });
});
(async () => {
  for (const c of first) { const r = await runOne(c); if (r.code) break; }
  if (!done.some((r) => r.code)) {
    const rank = (c) => (c[1] === LACING ? 2 : SLOW.has(c[1]) ? 1 : 0), queue = par.slice().sort((a, b) => rank(b) - rank(a));   // (the long ones first)
    await Promise.all(Array.from({ length: Math.min(JOBS, queue.length) }, async () => { while (queue.length) await runOne(queue.shift()); }));
  }
  const bad = done.filter((r) => r.code);
  for (const r of bad) console.log(`---- FAIL (exit ${r.code}): ${r.cmd}\n${r.out.trim()}\n`);
  const slow = done.slice().sort((a, b) => b.sec - a.sec)[0];
  console.log(`${bad.length ? `${bad.length} of ${done.length} failed` : `all ${done.length} passed`} in ${((Date.now() - t0) / 1000).toFixed(1)} s, ${JOBS} at a time (slowest: ${slow.cmd.replace(/^node /, "")} ${slow.sec.toFixed(1)} s)`);
  process.exit(bad.length || done.length < first.length + par.length ? 1 : 0);
})();
