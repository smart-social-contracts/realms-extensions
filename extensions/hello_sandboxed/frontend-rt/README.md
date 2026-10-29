# hello_sandboxed — frontend

Reference sandboxed extension for the Realms bridge protocol. See `../manifest.json` for capabilities, `operations` and `entry_access`, and `../backend/entry.py` for the `greet` function it calls with `callExtension`.

## Build

```bash
# @realmsgos/extension-bridge 0.3.0 is not on npm yet: install it from a realms-gos checkout
# (this installs the other dependencies too; plain `npm install` works once 0.3.0 is published)
npm install --no-save ../../../../realms-gos/packages/extension-bridge
npm run build   # emits dist/index.html with relative ./assets/ paths
```

## Local development (mock host)

From the extensions repo root, use the shared dev-server with sandbox mode:

```bash
cd ../../dev-server
npm install
node bin/dev.js hello_sandboxed
```

Open http://localhost:5555 — the outer page is a mock realm host; the extension UI loads in a sandboxed iframe on port 5556.
