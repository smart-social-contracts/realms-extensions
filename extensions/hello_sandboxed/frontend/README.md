# hello_sandboxed — frontend

Reference sandboxed extension for the Realms bridge protocol. See `../manifest.json` for capabilities and `entry_access`.

## Build

```bash
npm install
npm run build   # emits dist/index.html with relative ./assets/ paths
```

Ensure `@realmsgos/extension-bridge` and `@realmsgos/extension-ui` are built in the monorepo (`packages/extension-bridge`, `packages/extension-ui`) before installing.

## Local development (mock host)

From the extensions repo root, use the shared dev-server with sandbox mode:

```bash
cd ../../dev-server
npm install
node bin/dev.js hello_sandboxed
```

Open http://localhost:5555 — the outer page is a mock realm host; the extension UI loads in a sandboxed iframe on port 5556.
