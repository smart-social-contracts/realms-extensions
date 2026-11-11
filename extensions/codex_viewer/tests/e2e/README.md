# Browser tests of the codex page

- `npm test`: the built bundle (`npm run build` in `frontend-rt`) on a page that plays the realm, with the replies the
  canister gives. No realm needed.
- `npm run test:local`: the page, and the install proposal of `voting` (`../../../voting/tests/e2e`), on a real local realm
  under the realm frontend's own content security policy.

## A local realm for `test:local`

The realm must be built from a realms-gos branch that has `codex_views` and `official_timezone`, as a **test** build
(the seed runs Python in the realm as its controller):

```bash
# in realms-gos, with PYTHONPATH unset
python3 scripts/pack_realm_backend.py --variant test --version 0.8.0-rc3 --gzip
# put the wasm.gz, the realm frontend's tar.gz and their checksums in $REALMS_HOME/cache/realms-gos/v0.8.0-rc3/
# (see ../../../_shared/testing/e2e/local-realm.md), on a private REALMS_HOME and REALMS_LOCAL_HOME
realms local start --version v0.8.0-rc3 --port <port> --yes --no-core-ui
realms local publish <an empty codex> extensions/codex_viewer extensions/voting --install   # the bundles built here
realms local setup --codex <that codex>
python3 seed_local_realm.py --network local --identity <the local identity> --home $REALMS_LOCAL_HOME \
    --backend <realm_backend id> --fixture <realms-gos>/tests/fixtures/legislation/valencia
(cd ../../../_shared/testing/e2e && npm install)
REALMS_BIN=<the realms command, with the same homes> npm run test:local
```

The tests run in order and the last of the codex page's reverts the codex, so the realm is seeded again (a fresh
`realms local start --fresh`) before each run.
