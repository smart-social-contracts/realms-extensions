#!/usr/bin/env python3
"""Seed a local realm for the browser walkthrough of the codex page (`specs/legislation.local.spec.ts`).

The realm must be launched on a local network (`realms local start`, then `realms local setup`) from a realm wasm that
has `codex_views` and a test build (the controller's `__shell__`). The script runs Python in that realm as the
controller to write what a real install would leave (it fetches nothing: an install fetches over https), and calls
operations as that same identity. Nothing but a local network is accepted.

    seed_local_realm.py --network local --identity <local identity> --home <dir of the local realm's icp.yaml> \\
        --backend <realm backend canister id> --fixture <realms-gos>/tests/fixtures/legislation/valencia

With `--only procurement --principals <realms-gos>/config/deterministic-test-identity-principals.json` (and no
`--fixture`) it seeds only what the procurement screens show (see `seed_procurement` below), on a realm that was launched.

It leaves: two layered codices of València's example legislation (the later replaced the earlier, which has no tax
chapter of the town's own), on Madrid time; an IT admin team (department `IT`, seat `it.seat`, which a test fills);
a sync source, Spain, that has published a release the realm runs behind; the check schedule; a failing method of the
codex, which notifies the team; and an install job that an upgrade paused.
"""

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

LAYERS = ["eu", "eu/es", "eu/es/vc", "eu/es/vc/46250-valencia"]
OWN = LAYERS[-1]
# Who vouches for each layer: the capital of the sync source that relays it, none for the realm's own layer.
SPAIN = "ryjl3-tyaaa-aaaaa-aaaba-cai"
VOUCHER = {"eu": SPAIN, "eu/es": SPAIN, "eu/es/vc": SPAIN, OWN: ""}
DAY = 86400


class Realm:
    def __init__(self, network, identity, home, backend):
        self.base = ["icp", "canister", "call", backend]
        self.tail = ["-e", network, "--identity", identity]
        self.home = home

    def icp(self, method, arg):
        out = subprocess.run(self.base + [method, arg] + self.tail, cwd=self.home, capture_output=True, text=True)
        text = out.stdout.strip()
        assert out.returncode == 0, (method, out.stdout, out.stderr)
        match = re.search(r'"(.*)"', text, re.S)  # the candid text the realm answers with
        return match.group(1).encode().decode("unicode_escape") if match else text

    def shell(self, code):
        """Run ``code`` in the realm's heap as the controller, a hex string so that no quoting is needed."""
        reply = self.icp("__shell__", f'("exec(bytes.fromhex(\'{code.encode().hex()}\').decode())")')
        assert "Traceback" not in reply, reply
        return reply

    def op(self, name, **args):
        reply = json.loads(self.icp("run", f"({json.dumps(name)}, {json.dumps(json.dumps(args))})"))
        assert reply.get("ok", True) is not False, (name, reply)
        return reply


INSTALL = '''
import json
from core import chain, layered_codex as store, legislation
from core.op import run
from ggg import LayeredCodex
chapters, calendars, layers, previous, versions, vouchers = %(chapters)r, %(calendars)r, %(layers)r, %(previous)r, %(versions)r, %(vouchers)r
entries, paths = {}, {}
def entry(source, text):
    return {"source": source, "version": versions[source], "sha256": store.store_chapter(store.checksum(text), text).sha256,
            "vouched_by": vouchers[source], "route": "capital" if vouchers[source] else "https", "fetched_at": chain.now()}
for source, domain, text in chapters:
    entries[f"{source}/{domain}"] = entry(source, text)
    paths.setdefault(domain, []).append(source)
for source, text in calendars:
    entries[f"{source}/calendar"] = entry(source, text)
cid = store.codex_id(layers, paths, entries)
for other in LayeredCodex.load_some(1, max(LayeredCodex.max_id(), 1)):
    if other.status == "active":
        other.status = "inactive"
codex = LayeredCodex[cid] or LayeredCodex(id=cid, layers=layers, layer_paths=paths, chapters=entries, installed_at=chain.now() - %(age)d)
codex.status, codex.previous, codex.proposal = "active", previous, %(proposal)r
legislation.load(codex)
run(legislation.activate(codex))
store.remember_source(layers[-1])
print(json.dumps({"codex": cid, "failures": codex.failures}))
'''

CHECKS = '''
import json
from api import sync_checks
from core import chain, compliance, legislation
from ggg import InstallJob, SyncSource
now = chain.now()
SyncSource(id=%(spain)r, name="Spain", status="active", checked_at=now - 2 * 3600,
           compliance=compliance.valid({"NonCompliant": {"since": now - 3 * %(day)d, "stale": ["eu/es"]}}),
           installable=[{"source": "eu/es", "version": "2.4.0", "effective_from": now - 3 * %(day)d}])
sync_checks.remember(interval=24, due=now + 20 * 3600)
InstallJob(id="J-1", proposal="P-12", change_list={"url": "https://raw.example.org/change.json", "checksum": "sha256:" + "0" * 64},
           step="build", status="paused", started_at=now - 4 * 3600)
legislation._record("eu/es/vc/46250-valencia/tax.py", "compute_tax_assess", "ValueError: no rate for ibi_urban")
legislation._record("eu/es/procedure.py", "check_proposal_create", "KeyError: working_days")
from ggg import Notification
print(json.dumps(sorted({n.href for n in Notification.instances() if n.topic == "codex.failing"})))
'''


# ---- procurement (extensions/procurement): contracts, amendments, lots and framework call-offs ---------------------------
#
# Each step runs Python in the realm as the controller, like the legislation above, and calls operations as a member of the
# town (`do`) or as the controller (`do` without `who`); `at` runs a block as of another time, so that what it writes
# carries that time. The people are the realm's test identities: identity N is number N of the principals file.

PROCUREMENT_PRELUDE = '''
import json
from core import chain
from core.db import next_id
from core.op import call
FOUNDER = %(founder)r
P = %(principals)r  # identity number -> principal
_now = chain.now
NOW = _now()
DAY = 86400


class at:
    def __init__(self, t):
        self.t = t
    def __enter__(self):
        chain.now = lambda: self.t
    def __exit__(self, *a):
        chain.now = _now


def do(operation, /, who=None, **args):
    out = call(operation, args, user=P[who] if who else FOUNDER)
    assert out.get("ok", True) is not False, (operation, who, args, out)
    return out


def titled(cls, title):
    # The row of cls with this title, or None: the step that made it is done. Ids are the realm's to give.
    return next((row for row in cls.instances() if row.title == title), None)
'''


def seed_procurement_people_and_bodies(realm, prelude):
    """Four people, the departments Infrastructure (head and one more seat holder) and Finance, the organizations BuildCo and
    RoadCorp with their administrators, and the Province as an outside body: the parties the procurement screens name."""
    realm.shell(prelude + '''
from ggg import Department, External, Organization, Position, User
NAMES = {2: "Jordi", 3: "Laia", 6: "Biel", 7: "Aina"}
for n, name in NAMES.items():
    if User[P[n]] is None:
        do("user_add", user=P[n])
        User[P[n]].nickname = name
for department, description in (("Finance", "Budgets, funds and payments"), ("Infrastructure", "Roads, lanes and works")):
    if Department[department] is None:
        do("department_create", department=department, description=description)
if Position["infrastructure.planning_officer"] is None:
    do("position_create", department="Infrastructure", position="infrastructure.planning_officer", title="Planning officer", headcount=2)
    do("appoint", position="infrastructure.planning_officer", user=P[6])
    do("appoint", position="infrastructure.planning_officer", user=P[7])
    do("department_edit", department="Infrastructure", head=P[6])
for name, admin in (("BuildCo", 2), ("RoadCorp", 3)):
    if Organization[name] is None:
        do("organization_register", organization=name, description=name, kind="company")
        do("organization_edit", organization=name, admins=[P[admin]])
if External["province"] is None:
    do("external_add", external="province", name="The Province", kind="authority", channel="manual")
''')


def seed_procurement_contracts(realm, prelude):
    """The fund ROADS with an adopted capital line; a plain tender and, from it, the contract "Bike lane works": 50 000 spread
    over FY2026 and FY2027, 12 000 paid on it from the capital line, amended twice (the first decided by the department at
    once; then Infrastructure goes to a vote of 1 of its 2 seats, and the second is carried by a proposal) and a third attempt
    refused for going below what was paid; two call-offs under a framework agreement, one held by the Province and one by
    another realm. The payment is written as a Transfer row: a local network has no ledger to pay through, so the fund's
    balance and the line's actual do not move. Ids come from the realm's replies; a step is done when its title exists."""
    print(realm.shell(prelude + '''
from api.treasury import currency, decimals_of
from ggg import Budget, Contract, ContractAmendment, FiscalPeriod, Fund, Tender, Transfer
U = 10 ** decimals_of(currency())  # one unit of the realm's currency, in its base units
YEAR = 365 * DAY
start = 1767225600  # 1 Jan 2026
if Fund["ROADS"] is None:
    do("fund_create", fund="ROADS", name="Roads", department="Infrastructure")
if FiscalPeriod["FY2026"] is None:
    do("period_open", period="FY2026", starts_at=start, ends_at=start + YEAR)


def capital_line():
    return next((b for b in Budget.instances() if b.fund.id == "ROADS" and b.category == "capital" and b.status == "adopted"), None)


if capital_line() is None:
    do("budget_draft", fund="ROADS", period="FY2026", category="capital", kind="expense", planned=300_000 * U)
    do("budget_propose", period="FY2026", fund="ROADS")
capital = capital_line()
river = titled(Tender, "Bike lane along the river")
if river is None:
    with at(NOW - 40 * DAY):
        river = Tender[do("tender_create", title="Bike lane along the river", requester="Infrastructure", kind="works",
                          procedure="open", opens_at=NOW - 40 * DAY, closes_at=NOW - 30 * DAY,
                          rubric={"price": 60_000_000, "quality": 40_000_000})["tender"]]
lane = titled(Contract, "Bike lane works")
if lane is None:
    with at(NOW - 30 * DAY):
        lane = Contract[do("contract_create", title="Bike lane works", parties=["Department:Infrastructure", "Organization:BuildCo"],
                           value=50_000 * U, symbol=currency(), tender=river.id, starts_at=NOW - 30 * DAY, ends_at=NOW + 90 * DAY,
                           split=[{"period": "FY2026", "amount": 30_000 * U}, {"period": "FY2027", "amount": 20_000 * U}])["contract"]]
    with at(NOW - 20 * DAY):  # money paid on it from the capital line, so that its value cannot fall below it
        Transfer(id=next_id(Transfer, "TR"), sender="Fund:ROADS", to="Organization:BuildCo", symbol=currency(), amount=12_000 * U,
                 status="completed", at=NOW - 20 * DAY, contract=lane.id, budget=capital.id)
    with at(NOW - 12 * DAY):  # Infrastructure still decides alone: applied at once
        do("contract_amend", contract=lane.id, ends_at=NOW + 150 * DAY)
    do("department_set_policy", department="Infrastructure", m=1, n=2)
    with at(NOW - 5 * DAY):  # now a vote of its seats: the amendment is a proposal, carried by one yes
        filed = do("contract_amend", contract=lane.id,
                   split=[{"period": "FY2026", "amount": 12_000 * U}, {"period": "FY2027", "amount": 38_000 * U}])
        assert filed.get("requires_vote"), filed
        decided = do("proposal_vote", 6, proposal=filed["proposal"], choice="yes")
        assert decided["status"] == "executed", decided
    refused = call("contract_amend", {"contract": lane.id, "value": 10_000 * U, "split": []}, user=FOUNDER)
    assert refused.get("kind") == "conflict" and "paid" in refused["error"], refused
if titled(Contract, "Electricity for the council buildings") is None:
    with at(NOW - 15 * DAY):
        do("contract_create", title="Electricity for the council buildings", parties=["Department:Finance", "Organization:BuildCo"],
           value=9_000 * U, symbol=currency(), kind="supplies",
           framework={"holder": {"External": "province"}, "reference": "AM-2025/04", "winners": ["BuildCo", "RoadCorp"]})
if titled(Contract, "Street lighting") is None:
    with at(NOW - 10 * DAY):
        do("contract_create", title="Street lighting", parties=["Department:Infrastructure", "Organization:RoadCorp"],
           value=4_000 * U, symbol=currency(), kind="supplies",
           framework={"holder": {"Realm": "rrkah-fqaaa-aaaaa-aaaaq-cai"}, "reference": "T-12", "winners": []})
print([(c.id, c.title, c.value // U, c.lot, c.framework and c.framework["reference"]) for c in Contract.instances()],
      [(a.id, a.proposal) for a in ContractAmendment.instances()], capital.id)
'''))


def seed_procurement_lots(realm, prelude):
    """A tender "Bike lane works in the old town" in three lots, bid on, scored and revealed: lot 1 awarded (its contract names
    the lot), lots 2 and 3 still open with their scored bids, so that the award and the leave-unawarded screens have
    something to do. Done once its title exists."""
    print(realm.shell(prelude + '''
from api.procurement import seal
from api.treasury import currency, decimals_of
from ggg import Contract, Tender
U = 10 ** decimals_of(currency())
if titled(Tender, "Bike lane works in the old town") is None:
    rubric = {"price": 60_000_000, "quality": 40_000_000}
    lots = [{"id": "1", "title": "Bike lanes", "estimated_value": 40_000 * U}, {"id": "2", "title": "Bike racks", "estimated_value": 10_000 * U},
            {"id": "3", "title": "Signs", "estimated_value": 5_000 * U}]
    with at(NOW - 10 * DAY):
        t = do("tender_create", title="Bike lane works in the old town", requester="Infrastructure", kind="works", procedure="open",
               estimated_value=55_000 * U, opens_at=NOW - 10 * DAY, closes_at=NOW - 3 * DAY, rubric=rubric, lots=lots)["tender"]
        do("tender_open", tender=t)
    offers = {"b1": (2, "BuildCo", "1", 48_000), "b2": (2, "BuildCo", "2", 9_000), "b3": (3, "RoadCorp", "1", 52_000),
              "b4": (3, "RoadCorp", "2", 9_500), "b5": (3, "RoadCorp", "3", 4_000)}
    ids = {}
    with at(NOW - 6 * DAY):
        for key, (who, vendor, lot, price) in offers.items():
            ids[key] = do("bid_submit", who, tender=t, vendor=vendor, lot=lot, payload_ref=f"vetkey:{vendor}:{t}:{lot}",
                          payload_hash=seal(price * U, key))["bid"]
    with at(NOW - 2 * DAY):
        do("bids_reveal", tender=t, openings={ids[k]: {"price": offers[k][3] * U, "nonce": k} for k in offers})
        for key, marks in (("b1", (9, 8)), ("b3", (7, 7)), ("b2", (6, 7)), ("b4", (8, 5)), ("b5", (6, 6))):
            do("bid_score", bid=ids[key], scores={"price": marks[0], "quality": marks[1]})
    with at(NOW - 1 * DAY):
        do("tender_award", tender=t, lot="1")
t = titled(Tender, "Bike lane works in the old town")
print(t.id, t.status, [(l["id"], l["status"], l["winner"], l["contract"]) for l in t.lots], [(c.id, c.value // U, c.lot) for c in Contract.instances() if c.lot])
'''))


def seed_procurement(realm, home, principals_file):
    """What the screens of the procurement extension show: see the three steps above. Run it on a launched realm."""
    founder = json.loads((Path(home) / "state.json").read_text())["principal"]
    identities = json.loads(Path(principals_file).read_text())["identities"]
    prelude = PROCUREMENT_PRELUDE % {"founder": founder, "principals": {i["index"] + 1: i["principal"] for i in identities}}
    seed_procurement_people_and_bodies(realm, prelude)
    # The lots first: the contracts' step ends with Infrastructure deciding by a vote, after which it files a proposal
    # instead of creating a tender.
    seed_procurement_lots(realm, prelude)
    seed_procurement_contracts(realm, prelude)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--network", required=True, choices=["local"], help="only a local network is accepted")
    parser.add_argument("--identity", required=True, help="the local network's identity, a controller of the realm")
    parser.add_argument("--home", required=True, help="the directory of the local realm's icp.yaml")
    parser.add_argument("--backend", required=True, help="the realm backend's canister id")
    parser.add_argument("--fixture", type=Path, help="tests/fixtures/legislation/valencia of realms-gos (not with --only)")
    parser.add_argument("--only", choices=["procurement"], help="seed only what one extension's screens show")
    parser.add_argument("--principals", type=Path, help="config/deterministic-test-identity-principals.json of realms-gos (--only)")
    args = parser.parse_args()
    realm = Realm(args.network, args.identity, args.home, args.backend)
    if args.only == "procurement":
        return seed_procurement(realm, args.home, args.principals)
    if not args.fixture:
        parser.error("--fixture is required unless --only is given")

    # eu/es/register: its hook sends a notification to a Ref, which the realm cannot take yet as an effect's argument
    # (the operation raises and, instead of failing the chapter, traps the caller's message: `user_add` with it).
    left_out = [("eu/es", "register")]

    def chapters(omit=()):
        return [(s, p.stem, p.read_text()) for s in LAYERS for p in sorted((args.fixture / s).glob("*.py"))
                if (s, p.stem) not in omit + left_out]

    calendars = [(s, (args.fixture / s / "calendar.json").read_text()) for s in LAYERS if (args.fixture / s / "calendar.json").exists()]
    versions = {s: (json.loads((args.fixture / s / "releases.json").read_text())[-1]["version"]
                    if (args.fixture / s / "releases.json").exists() else "") for s in LAYERS}

    def install(omit, previous, age, proposal):
        code = INSTALL % {"chapters": chapters(omit), "calendars": calendars, "layers": LAYERS, "previous": previous,
                          "versions": versions, "vouchers": VOUCHER, "age": age, "proposal": proposal}
        return json.loads(realm.shell(code))

    # A realm in setup took a legacy codex; only one kind runs at a time.
    realm.shell("from ggg import Codex\nfor c in Codex.instances():\n    c.status = 'inactive'")
    realm.op("realm_configure", timezone="Europe/Madrid")
    older = install([(OWN, "tax")], "", 5 * DAY, "P-3")
    newer = install([], older["codex"], 2 * DAY, "P-12")
    realm.op("department_create", department="IT")
    realm.op("position_create", department="IT", position="it.seat")
    realm.op("it_team_set", department="IT")
    alert_links = json.loads(realm.shell(CHECKS % {"spain": SPAIN, "day": DAY}))
    assert alert_links == ["/extensions/codex_viewer"], alert_links  # the team's alert links to the codex page
    print(json.dumps({"older": older["codex"], "newer": newer["codex"]}))


if __name__ == "__main__":
    sys.exit(main())
