# welcome — runtime-loadable frontend bundle

Auto-scaffolded by `scripts/scaffold_runtime_bundles.py`.

Build:

```bash
npm install
npm run build
```

The output `dist/index.js` is the ESM bundle that `realm_frontend` dynamic-imports at runtime. It must keep the `mount(target, props)` contract in `src/index.ts`.
