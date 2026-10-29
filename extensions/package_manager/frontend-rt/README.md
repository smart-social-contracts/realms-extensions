# package_manager — runtime-loadable frontend bundle

This is the Layer-2 (runtime extension) build of the `package_manager`
admin UI. It produces a single self-contained ESM bundle (`dist/index.js`)
that is uploaded to a `file_registry` canister and dynamic-imported by
`realm_frontend` at runtime — no host WASM rebuild required.

## Build

```bash
npm install
npm run build
```

`dist/index.js` is the bundle. The `realms extension publish` /
`scripts/build_runtime_bundles.py + scripts/publish_layered.py` pipeline
builds and uploads it to `ext/package_manager/<version>/frontend/dist/index.js`.

## Mount contract

The bundle's default export matches `realm_frontend`'s extension-loader
contract: `mount(target, ctx)` returning `{ unmount() }`. It calls the realm
through `ctx.read` / `ctx.run` (only the operations its manifest declares) and
the marketplace canister through `ctx.marketplace`.

The realm's file registry comes from `setup_state`; installs pull from it.
