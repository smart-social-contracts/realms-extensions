# Extension dev-server

Local development server for Realms extensions. Both modes call the realm set in
`dev-config.json` (`backendCanisterId`, `host`) as a deterministic test identity
(`testIdentityIndex`), through the realm's `read` / `run` endpoints, and refuse the
operations the extension's manifest does not declare, as the realm frontend does.

## In-process extensions (default)

For extensions whose `frontend-rt/src/index.ts` mounts with a `ctx`:

```bash
node bin/dev.js task_monitor
# or from frontend-rt/: npx realms-ext-dev
```

Opens http://localhost:5555 with a `RealmExtensionContext`: `ctx.read` / `ctx.run` for
operations, `ctx.callSync` for the extension's backend (the realm's `extension_call`).

## Sandboxed extensions

For extensions with `manifest.json` `"runtime": "sandboxed"` and a Vite app in
`frontend-rt/` (or `frontend/`):

```bash
node bin/dev.js hello_sandboxed
```

- **Port 5555** — mock realm host page with bridge server, confirm modal, and bridge log
- **Port 5556** — extension Vite dev server, loaded in a sandboxed iframe (`sandbox="allow-scripts"`)

The mock host enforces manifest `capabilities`, `operations` and `entry_access.functions`,
sends `client.read` / `client.run` and `client.callExtension` to the realm, and logs all
bridge traffic. Without a configured realm the extension still loads; its calls fail.

## Setup

```bash
# @realmsgos/extension-bridge 0.3.0 is not on npm yet: install it from a realms-gos checkout
# (this installs the other dependencies too; plain `npm install` works once 0.3.0 is published)
npm install --no-save ../../realms-gos/packages/extension-bridge
```
