# Changelog

All notable changes to the journal extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.4.0] - 2026-11-11

### Changed
- An issue reads and prints like an official gazette (think BOE, DOGV, Journal officiel, Amtsblatt), in the seven
  languages. The masthead has the realm's logo, "Official Journal of <realm>", the issue number, the weekday and date in
  the reader's language, the realm's official time zone with its offset (UTC only when the realm has not set a zone, and
  as each entry's hover) and the realm's identity, the canister, small. Entries are grouped in numbered sections
  (I. Legislation, II. Notices; a section with no entries is left out) and each has a reference of the issue and its
  place in it, "2026/3-2", that never changes: a title, then the facts as a short formal text, the codex id (short on the
  screen with the whole id on hover, whole on paper) and, on the screen, links to the proposal and the codex page. A day
  with no entries says "No entries were published on this day." The sheet is serif, justified, responsive down to a phone
  and prints on A4 with margins and, in the foot of every page, the issue and "Page 1 of 2".
- An entry says what happened: for an install, what the realm runs, from when it is in force, by which proposal and how
  the vote went; for a revert, the codex it went back to and the one it left, and the same decision.
- The sheet has a marked place, `data-slot="signature"`, for the issue's signature and its verification (hash,
  signature, key, verification code, address and QR). It is hidden until the signing work fills it.
- On a quarter, which shows its capital's issue, the sheet has no links: the proposals and codices an entry names are the
  capital's, and the quarter's own pages are not.

### Added
- The personal-data rules allow `vote`: the votes for, against and abstaining on the proposal that decided an install or
  a revert, and how many could vote. Counts only; it names no person.
- The links of the sheet go through the realm's router, also when the realm is served under a path (`/r/<slug>`).

### Fixed
- The sheet follows the width of the window: it was measured once, when it loaded.

## [1.3.0] - 2026-11-11

### Added
- The releases of the realm's sync sources are entries, as its checks find them: "The realm learned of a release of
  legislation from eu/es: version 2.4.0, in force from 1 January 2027." A realm that is a sync source itself has an
  entry for each release it publishes. Both are in the seven languages, and the notice of one that could not be
  recorded names the release it misses.
- The personal-data rules allow `source`, `version` and `effective_from`, the three fields that name a release and
  say when it is in force. None names a person.

## [1.2.1] - 2026-11-10

### Fixed
- The notice of a revert whose entry could not be recorded says which codex the realm left and which it went back to:
  "the revert from the codex A back to the codex B", where "B, which replaced A" read either way.

## [1.2.0] - 2026-11-10

### Added
- A change whose entry the realm could not record (`not_recorded`) is a line of its issue and a notice on the page:
  which revert or install it misses, and when. The reason is for the realm's IT admin team, in the codex status.

## [1.1.0] - 2026-11-10

### Added
- A revert is an entry: "The realm went back to earlier legislation", with the layers of the codex restored (none for
  a legacy codex), in the seven languages.
- The personal-data rules allow `reverted`, the id of the codex a revert replaced. It names no person.

## [1.0.0] - 2026-11-09

### Added
- The realm's official journal, a core extension: one issue a day, served by the canister as JSON, with the page,
  the print route and its PDF, and a quarter that shows its capital's issue.
- The personal-data rules in `config.personal_data.entry_fields`: `codex`, `layers`, `proposal`, `activates_at`.
