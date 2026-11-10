# Changelog

All notable changes to the journal extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
