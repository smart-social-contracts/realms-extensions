# Proposal for GGG after 0.3.0: bank-settled transfers and encrypted bank payout accounts

Status: **proposal, not implemented.** Written from the Banking extension prototype (this directory), which runs on
GGG as it is by keeping its own records in Documents. Nothing here touches 0.3.0 or its draft (ggg#75).

## Why

The prototype shows that a realm can pay through an ordinary bank account. It does so beside GGG rather than inside it:

- A GGG `Transfer` always settles on a ledger. realms-gos `api/treasury.py` `send()` makes every transfer an
  `icrc1_transfer`; there is no other way to settle. So a bank payment is not a `Transfer`: it is not booked against
  a budget line, not in the ledger entries, and not in a financial report.
- `PaymentAccount` (ggg.did 626) holds `address` in clear, and realms-gos `payment_account_add` validates nothing.
  An IBAN stored with a token `symbol` would be handed to that token's ledger as a principal. The prototype therefore
  keeps the payees' bank details in an encrypted Document the treasury fills in, and a member cannot enter their own.
- An incoming bank payment cannot mark an `Invoice` paid: `invoice_check` asks a ledger.

## The change

### 1. A transfer settled at a bank

- `Token` gains a kind: a **fiat** token has no `ledger` (`opt principal`) and is never sent to one. CHF and EUR
  are fiat tokens with their ISO 4217 decimals.
- A transfer in a fiat token is **bank-settled**. `TransferStatus` gains `Ordered` (in a committed payment order) and
  `Returned` (the bank sent it back); `Completed` means booked on a statement.
- `transfer_create` books and reserves a bank-settled transfer exactly as today (fund, budget line, contract limits),
  but `send()` does not run: the transfer waits, `Scheduled` or `Pending`, for an order.
- New operation `bank_order_create` (`treasury.manage`): takes transfers that are due, records the payment file's
  `sha256`, format and `MsgId`, sets them `Ordered`, and queues a `Dispatch` to an `External` of kind `bank` (channel
  `manual`). Each transfer's id is its `EndToEndId`. The file itself is an encrypted `Document`.
- New operation `transfer_settle` (`treasury.manage`): given a statement's evidence (`evidence_ref`, a Document), marks
  transfers `Completed` (booked, with the entry's reference and date) or `Returned` (with the bank's reason, reversing
  the books as `reverse()` does for a failed ledger call). A group booked as one entry settles every transfer of that
  payment group at once, on the condition that the amounts add up.
- Invariant: a bank-settled transfer is never sent to a ledger, and a ledger transfer is never put in a payment order.

### 2. Bank payout accounts, encrypted

- `PaymentAccount` gains a bank form: `network = "bank"`, no `symbol` (a ledger never pays it), `address` empty, and
  `sealed : text` (the IBAN, the name at the bank and the postal address, encrypted) with its key at the scope
  `user:<member>:bank` (or `org:<id>:bank`), wrapped by the owner for themselves and for the staff of the departments
  holding `treasury.manage`, as `user:<member>:private` is wrapped today.
- `payment_account_add` validates what it stores: a bank account carries no `symbol` and no clear `address`; a ledger
  account's `address` must be a principal or account identifier of the token's ledger. That closes the IBAN-as-principal
  trap whatever comes of the rest.
- New read `payment_account_list`: the owner's accounts, and for treasury staff the bank accounts of a payee with the
  caller's wrapped key, so the payment file is still written in the browser.
- Members enter their own bank details in member_dashboard. That screen is sandboxed, so this needs the host
  capability "seal for these principals" first (see the extension's README): bundling vetKeys into the frame would
  give it the member's whole vetKey.

### 3. Incoming payments

- `Invoice` gains `reference`: the ISO 11649 creditor reference made from its id ("RF..INV12"), and the QR reference
  when the realm's account is a QR-IBAN. The prototype derives them the same way (`lib/references.ts`).
- New operation `invoice_settle` (`treasury.manage`): marks an invoice paid from a statement's evidence, with the
  amount and booking date in `payment`. A partial or excess payment stays on the review list.

### 4. Statements

`external_report` stays the record of what the bank said. The only addition is that `transfer_settle` and
`invoice_settle` name the report's `evidence_ref`, so each settlement points to the statement that proved it.

## What does not change

- Per-person amounts stay in clear, as transfers are today. Only bank details and statement files are encrypted.
- No connector, no operator service: the bank is an outside body (GGG §11 as realms-gos pins it, domain 10 from 0.3.0),
  reached through Dispatches that an
  operator delivers (`manual`). Realms GOS holds that the realm calls no outside body (`api/external.py`, I-EXT-6).
- Existing transfers, tokens and accounts are untouched; every field above is new and optional.

## Open questions

1. Should `bank_order_create` be governed (a proposal, two signatures in the realm) in addition to the two signatures
   in the e-banking, or is the realm's commit plus the bank's dual control enough?
2. Fiat tokens and the books: one fiat token per currency, or per bank account? Two accounts in CHF at two banks need
   separate balances.
3. A pain.002 status report (the bank's acceptance or rejection per payment) could settle `Ordered` → `Pending` or
   `Failed` before the statement arrives. Worth a second report topic?
4. Who may read a payee's bank account: the whole treasury department, or only the seats a codex names?
