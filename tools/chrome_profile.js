// A throwaway Chrome profile for the headless tools / page tests, cleaned up for sure (user 2026-10-31: 159 leftover
// profiles = 30 GB in %TEMP%: the old cleanup deleted 0.5 s after the kill, while Chrome still held its files, and
// scripts that process.exit()ed never got there).
//   const P = profile("fluidnc_test_");  spawn(CHROME, [`--user-data-dir=${P.dir}`, ...]) -> P.own(chrome)
//   await P.drop();                      // kill Chrome, wait for it to exit, delete (retried)
// Making one also sweeps that prefix's leftovers over an hour old (a crashed run's); on exit anything left is deleted.
// P.own also starts a guard: a tiny detached node that kills Chrome's tree (and deletes the profile) once the tool's
// node is gone - a timeout or a killed shell ends node with no exit handlers (Windows TerminateProcess), and Chrome
// then rendered on with nobody reading it (mg-app-2e 2026-11-08: an orphan page_shot Chrome at ~40% of 32 threads).
"use strict";
const fs = require("fs"), os = require("os"), path = require("path"), { spawn, spawnSync } = require("child_process");

// the guard (node -e): every 2 s, the tool's node alive? Chrome still Chrome (not a reused pid)? Tool gone: kill
// Chrome's tree, delete the profile, exit; Chrome gone first: just exit. windowsHide on its tasklist / taskkill: the
// guard has no console, so each call flashed a console window (user 2026-11-08)
const GUARD = `
const [parent, child, dir] = process.argv.slice(1), { spawnSync } = require("child_process"), fs = require("fs");
const alive = (p) => { try { process.kill(+p, 0); return true; } catch (e) { return e.code === "EPERM"; } };
const isChrome = (p) => process.platform !== "win32" ? alive(p) :
  /(chrome|msedge)\\.exe/i.test(spawnSync("tasklist", ["/FI", "PID eq " + p, "/FO", "CSV", "/NH"], { encoding: "utf8", windowsHide: true }).stdout || "");
setInterval(() => {
  if (!isChrome(child)) process.exit(0);
  if (alive(parent)) return;
  if (process.platform === "win32") spawnSync("taskkill", ["/pid", child, "/T", "/F"], { stdio: "ignore", windowsHide: true });
  else try { process.kill(+child, "SIGKILL"); } catch (e) {}
  let n = 0;                                         // its helpers hold the files a few s after the kill: retry, <= 30 s
  setInterval(() => { try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {} if (!fs.existsSync(dir) || ++n >= 30) process.exit(0); }, 1000);
}, 2000);`;
function guard(chrome, dir) {
  if (!chrome || !chrome.pid) return;
  try {
    spawn(process.execPath, ["-e", GUARD, String(process.pid), String(chrome.pid), dir],
      { detached: true, stdio: "ignore", windowsHide: true }).unref();
  } catch (e) { /* no guard: the exit handler still kills it on a normal exit */ }
}

const OLD = 60 * 60 * 1000;
const live = new Set();
const rm = (dir) => { try { fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }); return true; } catch (e) { return false; } };

// Chrome + its helpers (GPU, renderers: they hold the profile too); Windows: the whole tree, synchronously
function kill(c) {
  if (!c || c.exitCode !== null || c.signalCode !== null) return;
  if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(c.pid), "/T", "/F"], { stdio: "ignore" });
  else try { c.kill(); } catch (e) { /* gone */ }
}
function sweep(prefix) {
  const tmp = os.tmpdir(), now = Date.now();
  let names = [];
  try { names = fs.readdirSync(tmp); } catch (e) { return; }
  for (const n of names) {
    if (!n.startsWith(prefix)) continue;
    const p = path.join(tmp, n);
    try { if (now - fs.statSync(p).mtimeMs > OLD) rm(p); } catch (e) { /* gone / held */ }
  }
}

function profile(prefix) {
  sweep(prefix);
  const P = { dir: fs.mkdtempSync(path.join(os.tmpdir(), prefix)), chrome: null };
  P.own = (chrome) => { P.chrome = chrome; guard(chrome, P.dir); return chrome; };
  P.drop = async () => {
    const c = P.chrome;
    if (c && c.exitCode === null && c.signalCode === null) {
      const gone = new Promise((r) => c.once("exit", r));
      kill(c);
      await Promise.race([gone, new Promise((r) => setTimeout(r, 5000))]);
    }
    if (rm(P.dir)) live.delete(P);
  };
  live.add(P);
  return P;
}

process.on("exit", () => {                           // (sync only: kill, then the retried delete)
  for (const P of live) { kill(P.chrome); rm(P.dir); }
});
// Ctrl+C / a polite kill: exit through the handler above (Node skips it on a signal by default)
for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) process.on(sig, () => process.exit(130));

module.exports = { profile, sweep };
