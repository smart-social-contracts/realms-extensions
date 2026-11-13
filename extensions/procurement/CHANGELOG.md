# Changelog

All notable changes to the procurement extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.6.2] - 2026-11-13

### Fixed
- An action or a bid on a request reloads that request only while it is the one open: a late reply no longer takes the
  user back to a request they left.
- The reply of a request that was left while it was read (its refusal too) is dropped, so its error does not show on the
  list of requests.
- Opening a request clears what the last one said (its message and its error); a late reply lands after that and names its request.
- What an action or a bid answers is about its own request: when that is not the one open, the message names it
  (`T-5: Lot 2 awarded to B-3 — contract C-11 signed`), instead of reading as a message about the open request.
- The real-realm specs refuse a blank screenshot by a capture of the extension's own element (floor 40 KB: the pages are
  56 to 102 KB, the extension painted white 6.5 KB, reduced to its header 20.8 KB), not by the whole viewport, whose
  sidebar, breadcrumb and footer encode to more than a white extension; a spec checks that a painted page is refused.

## [0.6.1] - 2026-11-12

### Fixed
- A request opened from the list shows `…` in the lots table's bids and winner columns, and in the Bids section, until
  its bids have been read; before, it showed 0 bids and no winner (or the previous request's bids).
- Awarding a lot and leaving it unawarded are offered only once the bids are read and to a caller known to hold
  `tender.manage`, not while the caller's permissions are unknown.
- A request the realm does not give (also a failed reload after an action) shows `…` and the error, no bids, and no award
  or leave-unawarded button: `Bids (0)` and an enabled button on a lot that has bids were shown.
- The reply of an earlier request that comes late (a request opened, left, another opened) no longer replaces the one now open.
- Three of the real-realm screenshots (the call-offs filter, a member's contract, the decided lots) were blank: the page is a
  100 %-high frame around the realm, so a full-page capture captured nothing. They are viewport captures now and the
  spec fails a blank one.
- The real-realm specs: the member's view of the lots is taken while the lots are open and after the bids are read, and
  asserts that no award is offered where an admin has them; screenshots wait for the page to settle (one came out blank).

## [0.6.0] - 2026-11-12

### Added
- A **Contracts** tab: the realm's contracts, with a filter for the call-offs under a framework agreement, and a page for each
  contract: supplier, value, split by fiscal period, dates in the realm's time zone, status, the request and lot it came
  from, what has been paid on it and the budget line charged.
- The **amendments** of a contract (ggg I-GOV-16), oldest first: the terms before and after, the proposal that carried each
  one (a link into the voting extension) and when it took effect. The realm's journal publishes no entry for a contract
  amendment, so none is shown.
- A **Propose amendment** form for callers holding `contract.amend`. It states the rule the realm applies, read from
  `contract_get`: the least the value may be amended to, and whether the governing department decides by vote or directly.
- **Lots** (ggg I-PRC-5): a request with lots shows a table of its lots with their budget, bids, winner and contract; each lot
  is awarded on its own or left without an award; a bid names the lot it prices (its sealed scope names the lot too, since a
  scope's keys are replaced when it is granted again); the form that creates a request takes lots.
- **Framework call-offs** (ggg I-PRC-6): the holder of the agreement (an outside body of the realm, or another realm by name or
  capital), its reference and its winners.
- The texts of these screens are translated into the seven languages of the realm (en, es, ca-valencia, de, fr, it,
  zh-CN); the screens that existed keep their English texts.
- A contract that has ended (terminated or fulfilled) shows that it is not amended instead of the form.
- Amounts are shown in the decimals of the realm's currency as the budget page has them (`budget_view`), and in a token's
  own decimals when the realm says them (`treasury_view`).
- Unit tests (`npm test` in `frontend-rt`), browser tests on a canned realm (`npm test` in `tests/e2e`) and on a real local
  realm (`npm run test:local`, seeded by `seed_local_realm.py --only procurement` of codex_viewer), run on pull requests
  (`run_tests.sh`) but for the real-realm ones.

### Changed
- The manifest lists the operations the new screens call: `contract_list`, `contract_get`, `contract_amend`,
  `tender_lot_void`, `realm_info`, `external_list`, `budget_view`, `treasury_view`. `contract_list` and the fields `contract_get` gained (`paid`,
  `governed_by`, `needs_vote`, `budgets`) are in realms-gos from the pull request that adds them: an older realm answers
  neither, and the page then says that it cannot propose amendments.
