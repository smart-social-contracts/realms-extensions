# UI tests on a local realm

`local-realm.ts` drives an extension in a browser against a realm started with `realms local start` (icp-cli and
PocketIC, no Casals, no dfx). It logs in through the portal bridge as a fresh admin, or with `asMember` as a fresh
plain member, and `realmCall` runs a realm operation as the local identity to seed a realm and to read back what a
flow did.

```bash
realms local start --yes                              # a realm in setup
realms local publish extensions/tax_manager extensions/budget_manager <codex dir> --install
realms local setup --codex <codex id>                 # launch it
(cd extensions/tax_manager/tests/e2e && npm install && npx playwright install chromium && npx playwright test)
```

Every test records a screenshot and a video, and a trace; they land in `test-results/`.

A governed extension (one that changes the realm through department-approved operations) is tested under both policies:
`setRootPolicy(1, 1)` makes a change apply at once, `setRootPolicy(1, 2)` makes it a proposal, and
`passTheOpenProposal()` votes it through as the local identity. Call `makeOneYesDecideAtOnce()` first, while the root
still approves alone, so that one yes settles a vote. Under a voting root a login cannot add an admin (that is a
proposal too): sign in first, then change the policy and `page.reload()`.

`tax_manager` and `budget_manager` need a realm that has `tax_policy_view` and `budget_view`
(smart-social-contracts/realms-gos#495), and their specs run once on a fresh realm: the tax spec starts with no tax
policy, the budget spec opens a fiscal period. The codex needs `codex_api_version` 2 and a `backend/hooks.py`; one
without hooks is enough, but it seeds no fund, so the budget spec creates `ROOT` itself.

To try an extension against a realm built from a branch of realms-gos, put the built `realm-backend-<tag>.wasm.gz`,
the frontend `realm-frontend-<tag>.tar.gz` and a matching `checksums-<tag>.txt` in
`$REALMS_HOME/cache/realms-gos/<tag>/` (`REALMS_HOME` and `REALMS_LOCAL_HOME` keep it apart from your own local
realm) before `realms local start --version <tag>`.
