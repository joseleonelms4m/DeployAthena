# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Deploy Athena is a Node.js web app (no frontend framework, no build step) that automates deploying/updating the "Athena" drowsiness-detection software onto a fleet of remote Linux machines ("HUBs") over SSH. An operator opens the dashboard in a browser, picks HUBs from a table, and triggers deploy/update/perclos/vibration actions; the server runs SSH commands against each HUB in the background and the browser polls for status.

License note (`manual3.md`): this software is owned by **MS4M**, private license.

## Commands

```bash
npm install       # install deps (node-ssh is the only runtime dependency)
npm start          # nodemon server.js  → http://localhost:3000
npm run dev         # same as start
```

There are no tests, no lint config, and no build step in this repo. This directory is not a git repository (no `.git`).

## Runtime architecture

Plain Node.js `http` server (ESM, `"type": "module"` in package.json) — no Express. Request flow:

```
server.js → routes/router.js (manual route table, if/else on req.method + req.url)
              → controllers/*.controller.js   (parse request body/multipart, drive response + background work)
                  → services/*.service.js      (the actual SSH/business logic per action, returns a status string)
                      → tools/tools.js Tools    (shared statics: SSH connect w/ password fallback, CSV parsing, state persistence, logging, status badges)
              → views/buildPage.js + views/page.html (server-rendered HTML dashboard, {{ROWS}}/{{MESSAGE}} templating)
              → views/polling.js (client-side JS served to the browser to poll /state and /logs)
```

Every controller follows the same shape: read the POSTed `hub` IPs, filter `hubs` (parsed from `hubs.csv`) against selection, immediately respond with an "in progress" render of `buildPage`, then loop over selected hubs **after** responding, updating `state.json` (via `Tools.saveState`) before/after each hub and appending to `logs/<hubName>.log` (via `Tools.logToFile`) as it goes. The browser has already gotten its response by the time the SSH work runs — it polls `GET /state` and `GET /logs` (see `views/polling.js`) to reflect progress.

Routes (`routes/router.js`): `GET /`, `GET /state`, `GET /logs`, `POST /deploy`, `POST /update`, `POST /perclos-on`, `POST /perclos-off`, `POST /vibration-on`, `POST /vibration-off`, `POST /upload` (CSV replace via a hand-rolled multipart parser in `services/parseMultipart.service.js`).

### Config (`config/`)

- `config/config.js` — SSH credentials tried in order (`config.passwords` array — the code falls back through this list until one works, for both SSH login and `sudo`), remote path, max attempts, port. **Currently checked in with deploy values** (`username: "ms4m"`, port `22`) — `manual3.md` documents separate dev vs. deploy values (dev used `username: "root"`, port `2222`). Check this file's actual contents before assuming which mode it's in — it has been swapped between dev/deploy values before and will be again.
- `config/variables.js` — path constants (`CSV_FILE`, `LOG_DIR`, `STATE_FILE`, `UPDATE_TAR`) resolved relative to the project root via `import.meta.url`, plus `TIMEOUT`.

### State & data files (project root)

- `hubs.csv` — HUB registry, `name,ip` CSV with a mandatory header line. No native comment support (`#` lines will error, not skip) — remove a line to exclude a HUB. Must use Unix (LF) line endings or IPs pick up a trailing `\r`.
- `state.json` — persisted per-HUB status keyed by IP (`status`, `attempts`, `lastAttempt`, plus per-feature `updateStatus`/`perclosStatus`/`vibrationStatus`). Safe to hand-edit to reset a HUB to `PENDING`/`attempts: 0` to force a redeploy, or delete/`{}` to reset everything.
- `logs/<hubName>.log` — one append-only log file per HUB, timestamped (UTC-5, see `Tools.now()`), written via `Tools.logToFile`. `GET /logs` merges and sorts all of them and returns the last 200 lines as JSON.
- `athena.zip` — the deploy payload uploaded to each HUB via SFTP and unzipped/installed remotely (~430 MB; see `manual.md` for a full breakdown of its size and what's safe to strip out of it).
- `fcsv143.tar` — payload used by the (currently broken, see below) update flow.
- `hubs_last.csv` — a saved copy of a prior `hubs.csv`, not read by any code path. Reference only.
- `connections.log`, `app.log`, `server.log` — plain-text runtime logs written at the project root (not under `logs/`). `connections.log` is written by `Tools.logConnection` (hardcoded path `./connections.log`, used only by `ws-server.js` to log WS client connect/disconnect); `app.log`/`server.log` appear to be process stdout/stderr redirection from prior runs, not written by app code directly.
- `empaquetar.bat` — Windows packaging script; tars up the project (excluding `logs/`, `state.json`, itself) into `../DeployAthena_<timestamp>.tar.gz` for a clean-state handoff/deploy bundle.

Status values used across `state.json`: `PENDING`, `IN_PROGRESS`, `UPLOADED`, `INSTALLED`, `SUCCESS`, `FAILED`, `OFFLINE` (deploy), plus feature-specific variants like `UPDATE_OK`/`UPDATE_FAILED`, `PERCLOS_ON_OK`/`PERCLOS_OFF_OK`, `VIB_ON_OK`/`VIB_OFF_OK`.

### Adding a new remote action (e.g. a new toggle like perclos/vibration)

Follow the existing perclos/vibration pair as a template: add `controllers/<name>.controller.js` (parses selected hubs, responds immediately, then loops calling the service and persisting `state[hub.ip].<x>Status` + `Tools.saveState`), `services/<name>.service.js` (opens a `NodeSSH` connection via `Tools.connectSSH`, runs commands, logs via `Tools.logToFile`, returns a status string, always `ssh.dispose()`s), and wire the route into `routes/router.js`.

### Known issue

`services/updateHub.service.js` calls `connectSSH(...)` and uses `path`/`__dirname` without importing them (unlike every other service, which imports `Tools` and destructures `connectSSH`, or derives `__dirname` from `import.meta.url`). The `/update` flow will throw at runtime as currently written.

### WebSocket prototype (parallel, not wired into the main app)

A second, independent server exists alongside the `server.js`/`router.js` HTTP+polling app described above, exploring a push-based alternative to polling `/state`. It is **not** started by `npm start`/`npm run dev` and shares no entrypoint with `server.js` — run it separately with `node ws-server.js` if you need it.

```
ws-server.js → ws.js (WebSocketServer — hand-rolled RFC6455 server/frame parser, no dependency)
                 → controllers/upgrade/deployHubWs.controller.js (mirrors deployHub.controller.js, but takes a `reply` callback instead of an http res)
                 → controllers/upgrade/updatePage.controller.js  (buildPage/buildStateUpdate — mirrors views/buildPage.js + polling.js's GET /state shape, but pushes over the socket)
                 → views/upgrade/ws-page.html (client page; connects to the WS port and renders push updates instead of polling)
```

`deployHubWs.controller.js`/`updatePage.controller.js` and `ws-page.html` live under `upgrade/` subfolders (`controllers/upgrade/`, `views/upgrade/`) rather than directly in `controllers/`/`views/` — a mid-refactor relocation that once left the cross-references between `ws-server.js`, `ws.js`, and these two controllers broken (ENOENT on `ws-page.html`, since fixed). If this prototype throws a path-related error again, check that these four relative imports/`new URL(...)` calls agree with wherever the files currently sit.

- Listens on port `8080` (hardcoded in `ws-server.js`), separate from the HTTP app's port `3000`.
- Protocol: client sends `{"task": "init" | "deploy" | "binaries"}` JSON messages; server replies over the same socket. `"init"` returns a full state snapshot (`buildStateUpdate`), `"deploy"` runs `DeployHubController` from `deployHubWs.controller.js` and pushes state after each hub. Only `deploy` is implemented end-to-end today — no WS equivalents yet for update/perclos/vibration/upload.
- `Tools.logConnection` (in `tools/tools.js`) logs WS connect/disconnect events to `./connections.log` at the project root — separate from the per-hub `logs/<hubName>.log` files.
- See `manual-ws.md` for the (minimal) protocol notes.
- Treat this as an in-progress prototype, not a replacement for the HTTP flow — don't assume routes/behavior from `router.js` apply here, and don't assume this is exercised by any deploy the operator actually runs unless told otherwise.

### Orphaned / unused files

These exist in the tree but are not imported by anything reachable from `server.js` or `ws-server.js` — don't assume they run unless you're specifically working on them:

- `ping.js` — standalone ICMP ping utility (`node ping.js <ip>`), not imported by any controller/service.
- `services/pingHub.service.js` — work-in-progress; has a hardcoded IP/host and commented-out logging, not called from any controller or route.
- `views/buildPageLegacy.js`, `views/pollingLegacy.js` — earlier versions of `views/buildPage.js`/`views/polling.js`, kept for reference, not referenced by `router.js` (which uses `buildPage.js`) or `page.html`.

### Docs in this repo worth reading before changing deploy behavior

- `manual.md` — what `auto-deploy2.js` (an earlier, single-file version of the deploy flow — since refactored into `controllers/`+`services/`) did, why deploys are slow, and a breakdown of `athena.zip` contents/size.
- `manual2.md` — configuration reference: credentials, `hubs.csv` format, timeout tuning, `state.json` semantics, troubleshooting by symptom.
- `manual3.md` — dev vs. deploy credential/port values.
- `deploy-athena-runtime.architecture.json` — a diagram-tool JSON describing the same request flow as above (operator → Web UI → Deploy Athena server → router → hubs.csv/state.json/logs, SSH layer → remote hubs → Athena app), useful as a quick visual cross-check.

Note: `manual.md`/`manual2.md` reference `auto-deploy2.js` and hardcoded timeout constants (`CONNECT_TIMEOUT_MS`, `UPLOAD_IDLE_TIMEOUT_MS`, `INSTALL_TIMEOUT_MS`, `VALIDATE_TIMEOUT_MS`) that no longer exist as a single file in this codebase — the logic they describe now lives split across `services/deployHub.service.js` and `tools/tools.js` (`Tools.connectSSH` takes a `timeoutMs` argument, currently called with `10000`). Treat those two manuals as background/design docs, not a literal map of current file layout.

# Manual Server.js

