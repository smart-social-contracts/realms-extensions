# journal

The realm's official journal: one issue a day with the latest news and changes of the realm's legislation. It is a core
extension, one per realm, installed by default. The design is in
[the layered codex](https://github.com/smart-social-contracts/realms-gos/blob/main/docs/codices/layered-codex.md)
(§9.6).

## What it does

- **The canister is the authority.** `journal_issue {day}` returns the issue of a day as JSON: its `number`, counted from
  the journal's first day, its `entries`, its `status` (`provisional`, `signed`, `unsigned`) and, when signed, its `proof`. `day` is the realm's local day on the capital's clock (`YYYY-MM-DD`,
  default today). Every day from the first to today has an issue, with or without entries; a later day has none. The
  page, the PDF and anything else are renderings of that JSON, never checksummed themselves: the canister signs the JSON of a
  closed day, and the sheet shows that signature.
- **A quarter issues nothing.** Its `journal_issue` says so (`issued: false`, and the `capital` whose journal it is), and
  the page asks the capital's issue through `journal_capital_issue`, an update the quarter makes to its capital because a
  read cannot call another canister. It needs a logged-in reader; a visitor is asked to log in. The sheet is headed with the
  capital's name (the issue carries the issuing realm's name) and has no logo and no links, since the quarter's logo,
  proposals and codices are not the capital's.
- **What it reports.** The realm's own installs and reverts, the releases its checks find in the records of its sync
  sources, and, on a sync source, the releases it publishes. Each is an entry stamped when the realm learned of it, so a
  past issue never changes.
- **The journal only reports.** Publishing changes nothing about when legislation applies: it applies when the
  realm's operations run it, at the install switch.

## The page and the print route

| Path | Shows |
|---|---|
| `/extensions/journal` | today's issue, with the day's neighbours, a date picker and the print button |
| `/extensions/journal/<YYYY-MM-DD>` | the issue of that day |
| `/extensions/journal/<YYYY-MM-DD>/print` | the sheet alone, with the button that prints it |

The sheet (`src/sheet.ts`) is a complete HTML page with its own style (`src/sheetStyle.ts`), shown in an iframe that runs
no script. The button prints that iframe, so the browser's "Save as PDF" makes a file of the paper and nothing of the
realm's page; every script the browser has a font for prints, Chinese included. The extension ships no stylesheet of its
own to the host: the page uses scoped styles, never a utility class the realm's build might not contain. The sheet's links
are followed by the page, through the realm's router, since the sheet itself runs no script.

An issue reads as an official gazette:

- **Masthead:** the realm's logo (not on a quarter, whose logo is not the capital's), "Official Journal of <realm>", the
  issue number, the weekday and date in the reader's language, the realm's official time zone with its offset (UTC only
  when the realm has not set one) and the realm's identity, the canister that issues the journal.
- **Sections:** I. Legislation (installs, reverts, releases found and published) and II. Notices (entries the realm could
  not record, kinds this version does not know). A section with no entries is left out and the others are numbered again.
- **Entries:** each has a reference, `2026/3-2` (the year of the day, the issue number and its place in the issue, in the
  order the entries were recorded; entries are never changed, so it is stable), a title, the facts as a short formal text
  (what, from when it is in force, by which proposal and how the vote went), the codex id (short on the screen with the
  whole id on hover, whole on paper) and, on the screen only, links to the proposal and to the codex page.
- **Paper:** A4 with margins; the foot of every page has the issue and its page number (in the browsers that print page
  margins), and the colophon ends the issue.
- **Signature and verification:** a marked slot, `data-slot="signature"`, whose `data-field`s (`issue_hash`, `signature`,
  `key_id`, `verification_code`, `verification_url`, `verification_qr`, and `batch_root` for an issue signed with others) are
  filled from the `proof` of `journal_issue` and shown only for an issue that carries a signature that is its own: the
  canister's, for this day, over the entries the sheet shows. The QR code is drawn on the sheet as an SVG from
  `qrcode-generator`, and the address and the code lead to the verify page (`VERIFY_URL` in `src/proof.ts`, a placeholder
  until it is published) as `?canister=<id>&code=<code>`. An issue without a signature of its own has the slot `hidden` and a
  line that says what it is: provisional (today's), not signed yet, or "the signature does not match". The sheet only shows
  the signature; the verify page, served from elsewhere, checks it.

The entry texts are in `src/entries.ts` (plain text, no markup), the page in `src/sheet.ts`. The seven languages are in
`frontend/i18n/locales/extensions/journal/`.

## Personal data

`manifest.json` has `config.personal_data.entry_fields`: the fields of an entry's `details` the journal may keep. The
realm applies it when an entry is **recorded**, so what it leaves out is never stored. No field names a person: an entry
says which legislation the realm runs, by which proposal and with how many votes for, against and abstaining, never who
proposed or voted for it. The config is part of the manifest, so a
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
