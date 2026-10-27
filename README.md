# realms-extensions

The first-party extensions of [Realms GOS](https://github.com/smart-social-contracts/realms-gos):
37 packages in [`extensions/`](extensions), one folder each. An extension adds features to a realm,
a UI, and optionally Python functions that run in the realm's sandbox. It acts only through the
realm's operations, under the realm's Cedar policies.

```text
extensions/<id>/
├── manifest.json        id, version, who sees it, which operations it may call
├── backend/entry.py     optional: Python functions (manifest "backend": true)
└── frontend/            optional: the UI; its build goes to frontend/dist/
```

> Most packages here still follow the legacy contract (no `operations` list in the manifest).
> They are being migrated to the one documented below.

## Documentation

In realms-gos, [`docs/extensions/`](https://github.com/smart-social-contracts/realms-gos/tree/main/docs/extensions):

- [What an extension is](https://github.com/smart-social-contracts/realms-gos/blob/main/docs/extensions/README.md): manifest, operations, sandbox
- [Manifest](https://github.com/smart-social-contracts/realms-gos/blob/main/docs/extensions/manifest.md)
- [Backend](https://github.com/smart-social-contracts/realms-gos/blob/main/docs/extensions/backend.md)
- [Frontend](https://github.com/smart-social-contracts/realms-gos/blob/main/docs/extensions/frontend.md)
- [Build, test, publish](https://github.com/smart-social-contracts/realms-gos/blob/main/docs/extensions/build-test-publish.md)

Also here: [CONTRIBUTING.md](CONTRIBUTING.md), [AGENTS.md](AGENTS.md), and
[`lint_all_extensions.sh`](lint_all_extensions.sh).
