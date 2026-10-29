# llm_chat — runtime-loadable frontend bundle

Build:

```bash
npm install
npm run build
```

The output `dist/index.js` is the ESM bundle that `realm_frontend` dynamic-imports at runtime. `src/index.ts` keeps the `mount(target, ctx)` contract.
