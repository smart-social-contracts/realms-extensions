# Changelog

All notable changes to the procurement extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
- Unit tests (`npm test` in `frontend-rt`) and browser tests on a canned realm (`npm test` in `tests/e2e`).

### Changed
- The manifest lists the operations the new screens call: `contract_list`, `contract_get`, `contract_amend`,
  `tender_lot_void`, `realm_info`, `external_list`. `contract_list` and the fields `contract_get` gained (`paid`,
  `governed_by`, `needs_vote`, `budgets`) are in realms-gos from the pull request that adds them: an older realm answers
  neither, and the page then says that it cannot propose amendments.
