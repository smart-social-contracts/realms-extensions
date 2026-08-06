# Extension dev-server

Local development server for Realms extensions.

## In-process extensions (default)

For extensions with `frontend-rt/` (legacy in-process runtime):

```bash
node bin/dev.js hello_world
# or from frontend-rt/: npx realms-ext-dev
```

Opens http://localhost:5555 with a mock `RealmExtensionContext` backed by the test canister.

## Sandboxed extensions

For extensions with `manifest.json` `"runtime": "sandboxed"` and a `frontend/` Vite app:

```bash
node bin/dev.js hello_sandboxed
```

- **Port 5555** — mock realm host page with bridge server, toast area, confirm modal, and bridge log
- **Port 5556** — extension Vite dev server, loaded in a sandboxed iframe (`sandbox="allow-scripts"`)

The mock host enforces manifest `capabilities` and `entry_access.functions`, returns mock results for declared functions (e.g. `greet`), and logs all bridge traffic.

## Setup

```bash
npm install
```

Requires `@realms/extension-bridge` (linked via `file:../../packages/extension-bridge`). Build it first if needed:

```bash
cd ../../packages/extension-bridge && npm run build
```
