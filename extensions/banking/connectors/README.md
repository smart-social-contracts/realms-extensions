# ERP connectors (demos)

A public body that keeps its books in an ERP keeps them there; the realm decides whether a payment run may be paid,
and records the exact file that leaves. One small process per ERP, between the ERP's API and the realm:

- [ERPNext](ERPNEXT.md): a run made in ERPNext becomes a realm motion; once approved, the connector writes the file
  with the Banking extension's writers and attaches it to the run.
- [Odoo](ODOO.md): the realm's vote is the review OCA's tier validation waits for; Odoo writes the file, and the
  connector checks it against what was approved before committing its hash.

Any other ERP that exports pain.001 can use *From the ERP* in the Banking screen instead, with no connector.

```
npm install
npm start -- erpnext     # or: npm start -- odoo      (settings in .env; --once for one pass)
npm test                 # both connectors on an in-memory ERP and realm
```

[`../demo/up.sh`](../demo/up.sh) starts both ERPs, a local realm and both connectors, set up and ready to try: see
*Try it on your machine* in the [Banking README](../README.md#try-it-on-your-machine).

The connector is a member of the realm with `notification.send`, under its own key (`REALM_IDENTITY`, a path outside the
repository); the realm's treasury department decides under its own policy. See the README of each ERP for its setup.
