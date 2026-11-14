// tools/serve.py: Range requests (seek in a video / the voice wavs; iOS Safari won't play a video without them), the
// 8 MB cap per response, keep-alive, private/ refused under --lan, and the one POST (the lacing tutorial's shots file:
// loopback, this server's pages, JSON with scenes; written to a copy in .cache/velocity/serve/ that LR4_SHOTS_FILE puts
// behind the URL, so the real file is never touched and this test runs beside the ones that read it). Starts serve.py
// on a spare port.
// Its dev events (devlog, when DEVLOG_LIB is set) go to a throwaway DEVLOG_DIR: the deliberate 404s here are not problems.
"use strict";
const { spawn } = require("child_process"), fs = require("fs"), path = require("path"), http = require("http");
const ROOT = path.resolve(__dirname, "..");
const PY = process.env.PYTHON || (process.platform === "win32" ? "python" : "python3");

let pass = 0, fail = 0;
const ok = (c, msg) => { if (c) pass++; else { fail++; console.log("FAIL", msg); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const agent = new http.Agent({ keepAlive: true, maxSockets: 1 });

function post(port, url, body, headers = {}, host = "127.0.0.1") {
  return new Promise((resolve, reject) => {
    const b = Buffer.from(body);
    const req = http.request({ host, port, path: url, method: "POST", headers: Object.assign({ "Content-Length": b.length }, headers) }, (res) => {
      const parts = [];
      res.on("data", (d) => parts.push(d));
      res.on("end", () => resolve({ status: res.statusCode, body: Buffer.concat(parts).toString() }));
    });
    req.on("error", reject);
    req.end(b);
  });
}
const REAL = path.join(ROOT, "docs", "specs", "lacing-tutorial.shots.json"), SHOTS_URL = "/docs/specs/lacing-tutorial.shots.json";

function get(port, url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.get({ host: "127.0.0.1", port, path: url, headers, agent }, (res) => {
      const parts = [];
      res.on("data", (d) => parts.push(d));
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(parts), socket: req.socket }));
    });
    req.on("error", reject);
  });
}

(async () => {
  fs.mkdirSync(path.join(ROOT, "exports"), { recursive: true });
  const dir = fs.mkdtempSync(path.join(ROOT, "exports", ".test_serve_"));   // git-ignored; dotted so --lan refuses it
  const name = "exports/" + path.basename(dir);
  const big = Buffer.alloc(9 * 1024 * 1024 + 123);
  for (let i = 0; i < big.length; i++) big[i] = (i * 31 + (i >> 11)) & 255;
  fs.writeFileSync(path.join(dir, "v.mp4"), big);
  fs.mkdirSync(path.join(ROOT, ".cache"), { recursive: true });
  const logDir = fs.mkdtempSync(path.join(ROOT, ".cache", "test_serve_devlog_"));
  fs.mkdirSync(path.join(ROOT, ".cache", "velocity", "serve"), { recursive: true });
  const shotsDir = fs.mkdtempSync(path.join(ROOT, ".cache", "velocity", "serve", "shots_")), SHOTS = path.join(shotsDir, "shots.json");
  fs.copyFileSync(REAL, SHOTS);   // the file behind SHOTS_URL for both servers (LR4_SHOTS_FILE): GET and POST
  const env = Object.assign({}, process.env, { DEVLOG_DIR: logDir, LR4_SHOTS_FILE: SHOTS });
  const port = 8790 + Math.floor(Math.random() * 100);
  const srv = spawn(PY, ["tools/serve.py", "sandbox", "--no-open", `--port=${port}`], { cwd: ROOT, env, stdio: "ignore", windowsHide: true });
  try {
    let up = false;
    for (let i = 0; i < 50 && !up; i++) { try { await get(port, "/web/index.html"); up = true; } catch (e) { await sleep(100); } }
    ok(up, "serve.py --port came up");

    const f = `/${name}/v.mp4`;
    const all = await get(port, f);
    ok(all.status === 200 && all.body.equals(big), "a plain GET: 200, the whole file");
    ok(all.headers["accept-ranges"] === "bytes", "Accept-Ranges: bytes on a plain GET");
    ok(all.headers["cross-origin-opener-policy"] === "same-origin", "COOP still sent");

    const r = await get(port, f, { Range: "bytes=100-199" });
    ok(r.status === 206 && r.body.equals(big.subarray(100, 200)), "bytes=100-199: 206, those 100 bytes");
    ok(r.headers["content-range"] === `bytes 100-199/${big.length}`, `Content-Range ${r.headers["content-range"]}`);
    ok(r.headers["content-type"] === "video/mp4", `Content-Type ${r.headers["content-type"]}`);

    const open = await get(port, f, { Range: "bytes=1000-" });
    ok(open.status === 206 && open.body.length === 8 * 1024 * 1024, `bytes=1000-: capped at 8 MB (${open.body.length})`);
    ok(open.body.equals(big.subarray(1000, 1000 + 8 * 1024 * 1024)), "bytes=1000-: the right bytes");

    const tail = await get(port, f, { Range: "bytes=-50" });
    ok(tail.status === 206 && tail.body.equals(big.subarray(big.length - 50)), "bytes=-50: the last 50 bytes");

    const past = await get(port, f, { Range: `bytes=${big.length}-` });
    ok(past.status === 416 && past.headers["content-range"] === `bytes */${big.length}`, "past the end: 416 with the size");

    const a = await get(port, f, { Range: "bytes=0-9" }), b = await get(port, f, { Range: "bytes=10-19" });
    ok(a.socket === b.socket, "keep-alive: two Range requests on one connection");
    ok(Buffer.concat([a.body, b.body]).equals(big.subarray(0, 20)), "consecutive ranges join up");

    // the one write: the shots file, from this machine, from this server's page, as JSON with scenes
    const J = { "Content-Type": "application/json" }, me = { Origin: `http://127.0.0.1:${port}` };
    {
      const doc = JSON.parse(fs.readFileSync(SHOTS, "utf8")), edited = Object.assign({}, doc, { about: doc.about + " (test_serve)" });
      const w = await post(port, SHOTS_URL, JSON.stringify(edited), Object.assign({}, J, me));
      ok(w.status === 200 && JSON.parse(fs.readFileSync(SHOTS, "utf8")).about.endsWith("(test_serve)"), `POST the shots: ${w.status}, written`);
      const back = await get(port, SHOTS_URL);
      ok(back.status === 200 && back.body.toString() === fs.readFileSync(SHOTS, "utf8"), "GET the shots: the file the POST wrote");
      ok(!fs.readFileSync(REAL, "utf8").includes("(test_serve)"), "the real shots file untouched");
      ok((await post(port, SHOTS_URL, JSON.stringify(doc), Object.assign({}, J, { Origin: `http://localhost:${port}` }))).status === 200, "localhost's page may save too");
      ok((await post(port, "/web/index.html", "{}", Object.assign({}, J, me))).status === 404, "POST elsewhere: 404");
      ok((await post(port, SHOTS_URL + "/../../../README.md", JSON.stringify(doc), Object.assign({}, J, me))).status === 404, "POST a path past the file: 404");
      ok((await post(port, SHOTS_URL, JSON.stringify(doc), Object.assign({}, J, { Origin: "https://example.com" }))).status === 403, "another site's page: 403");
      ok((await post(port, SHOTS_URL, JSON.stringify(doc), Object.assign({ "Content-Type": "text/plain" }, me))).status === 415, "not JSON's type: 415");
      ok((await post(port, SHOTS_URL, "{nope", Object.assign({}, J, me))).status === 400, "not JSON: 400");
      ok((await post(port, SHOTS_URL, JSON.stringify({ about: "x" }), Object.assign({}, J, me))).status === 400, "no scenes: 400");
      ok((await post(port, SHOTS_URL, JSON.stringify({ scenes: { a: 1 }, pad: "x".repeat(300 * 1024) }), Object.assign({}, J, me))).status === 413, "over 256 KB: 413");
      ok(fs.readFileSync(SHOTS, "utf8") === JSON.stringify(doc) + "\n", "the refused POSTs left the file alone");
    }
  } finally {
    srv.kill();
    agent.destroy();
    fs.rmSync(dir, { recursive: true, force: true });
  }

  // --lan refuses private/ and dotfiles (bound to every interface: only checked when the port is free)
  const lport = 8890 + Math.floor(Math.random() * 100);
  const lan = spawn(PY, ["tools/serve.py", "sandbox", "--no-open", "--lan", `--port=${lport}`], { cwd: ROOT, env, stdio: "ignore", windowsHide: true });
  fs.mkdirSync(path.join(ROOT, ".exports"), { recursive: true });
  const exp = fs.mkdtempSync(path.join(ROOT, ".exports", "test_serve_"));
  fs.writeFileSync(path.join(exp, "a.txt"), "ok");
  try {
    let up = false;
    for (let i = 0; i < 50 && !up; i++) { try { await get(lport, "/web/index.html"); up = true; } catch (e) { await sleep(100); } }
    ok(up, "serve.py --lan came up");
    ok((await get(lport, "/.git/HEAD")).status === 404, "--lan: .git refused");
    ok((await get(lport, "/.git/HEAD", { Range: "bytes=0-3" })).status === 404, "--lan: .git refused for a Range too");
    ok((await get(lport, "/.logs/events.jsonl")).status === 404, "--lan: .logs refused");
    ok((await get(lport, `/.exports/${path.basename(exp)}/a.txt`)).status === 200, "--lan: .exports served (the drafts)");
    // a save from another computer: refused (this machine's LAN address stands in for one)
    const ip = Object.values(require("os").networkInterfaces()).flat().find((i) => i && i.family === "IPv4" && !i.internal);
    if (ip) {
      const was = fs.readFileSync(SHOTS);
      const r = await post(lport, SHOTS_URL, was.toString(), { "Content-Type": "application/json" }, ip.address);
      ok(r.status === 403 && fs.readFileSync(SHOTS).equals(was), `--lan: a save from ${ip.address} refused (${r.status})`);
    }
  } finally {
    lan.kill();
    fs.rmSync(exp, { recursive: true, force: true });
    fs.rmSync(logDir, { recursive: true, force: true });
    fs.rmSync(shotsDir, { recursive: true, force: true });
  }
  console.log(`${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.log("FAIL", e.message); process.exit(1); });
