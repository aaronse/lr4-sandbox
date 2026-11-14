// The vendored media-anim / media-mesh files match their sources (tools/sync_media.js --check; fork-only).
"use strict";
const { spawnSync } = require("child_process"), path = require("path");
const r = spawnSync(process.execPath, [path.join(__dirname, "..", "tools", "sync_media.js"), "--check"], { stdio: "inherit" });
process.exit(r.status === null ? 1 : r.status);
