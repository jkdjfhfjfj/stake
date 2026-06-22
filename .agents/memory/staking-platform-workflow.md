---
name: Staking Platform workflow fix
description: restart_workflow and configureWorkflow with waitForPort fail for the staking-platform artifact; use configureWorkflow without waitForPort instead.
---

## The Rule

Do NOT use `restart_workflow` tool or `configureWorkflow({ waitForPort: N })` for the staking-platform frontend. Both always report "didn't open port N" even though the server IS running.

**Why:** The Replit port-detection mechanism used by `restart_workflow`/`configureWorkflow`'s `waitForPort` check cannot detect ports opened by this artifact. Even a trivial `node -e "http.createServer().listen(3000)"` fails the check. Root cause is unclear — likely a network namespace or external proxy issue specific to this environment.

**How to apply:** When restarting or starting the staking-platform frontend:
1. Use `configureWorkflow` WITHOUT `waitForPort`:
   ```javascript
   await configureWorkflow({
     name: "Staking Platform",
     command: "PORT=5173 BASE_PATH=/ pnpm --filter @workspace/staking-platform run dev",
     outputType: "webview",
     autoStart: true
     // no waitForPort
   });
   ```
2. The artifact-managed workflow "artifacts/staking-platform: web" will always show FAILED — this is expected and harmless. The "Staking Platform" workflow is the one that actually serves the app.
3. The dev server runs on port 5173 and is accessible via the proxy at `localhost:80/`.
4. Do NOT call `restart_workflow` for "artifacts/staking-platform: web" — it will always fail and kill the running process.

## Port

The app runs on port 5173 (set in artifact.toml and via `PORT=5173` in the workflow command). vite.config.ts now has `const port = Number(process.env.PORT ?? "5173")` (no throw).
