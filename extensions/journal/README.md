# journal

The realm's official journal: one issue a day with the latest news and changes of the realm's legislation. It is a core
extension, one per realm, installed by default. The design is in
[the layered codex](https://github.com/smart-social-contracts/realms-gos/blob/main/docs/codices/layered-codex.md)
(§9.6).

## What it does

- **The canister is the authority.** `journal_issue {day}` returns the issue of a day as JSON: its `number`, counted from
  the journal's first day, and its `entries`. `day` is the realm's local day on the capital's clock (`YYYY-MM-DD`,
  default today). Every day from the first to today has an issue, with or without entries; a later day has none. The
  page, the PDF and anything else are renderings of that JSON and are never checksummed.
- **A quarter issues nothing.** Its `journal_issue` says so (`issued: false`, and the `capital` whose journal it is), and
  the page asks the capital's issue through `journal_capital_issue`, an update the quarter makes to its capital because a
  read cannot call another canister. It needs a logged-in reader; a visitor is asked to log in. The sheet is headed with the
  capital's name (the issue carries the issuing realm's name) and has no logo, since the quarter's is not the capital's.
- **The journal only reports.** Publishing changes nothing about when legislation applies: it applies when the
  realm's operations run it, at the install switch.

## The page and the print route

| Path | Shows |
|---|---|
| `/extensions/journal` | today's issue, with the day's neighbours, a date picker and the print button |
| `/extensions/journal/<YYYY-MM-DD>` | the issue of that day |
| `/extensions/journal/<YYYY-MM-DD>/print` | the sheet alone, with the button that prints it |

The sheet (`src/sheet.ts`) is a complete HTML page with its own style and the realm's logo, shown in an iframe that runs no
script. The button prints that iframe, so the browser's "Save as PDF" makes a file of the paper and nothing of the
realm's page; every script the browser has a font for prints, Chinese included. The extension ships no stylesheet of its
own to the host: the page uses scoped styles, never a utility class the realm's build might not contain.

## Personal data

`manifest.json` has `config.personal_data.entry_fields`: the fields of an entry's `details` the journal may keep. The
realm applies it when an entry is **recorded**, so what it leaves out is never stored. No field names a person: an entry
says which legislation the realm runs, never who proposed or voted for it. The config is part of the manifest, so a
change to it is a new version of the extension, which the realm's trust policy approves like any other. A realm without
the extension has no rules, and records no details.

## Develop

```bash
cd frontend-rt
npm install
npm test          # the route and the sheet, on node:test
npm run build     # dist/index.js
cd ../tests/e2e
npm install && npx playwright test   # the page, the print route and a PDF, on the built bundle with a canned realm
```
