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

For the data explorer's organisations (`seed_organisations_of_each_kind`): one organisation of each kind the realm accepts (GGG
I-ORG-9), and one registered without a kind, as before kinds existed.

For the voting page's tags (`seed_tagged_proposals`): six proposals filed with the tags of a town's areas, one without tags
and one with the most a proposal can carry, 16; with `--bulk-proposals N`, N closed proposals more, two tags each, the
last also tagged "rare-last" (`seed_bulk_proposals`).

For the land registry's planning (`seed_planning`): two planning zones the realm defines (Seafront, Old town), an organisation that
owns four parcels, three of them in a zone or two, and two licences that name one of the parcels (one active until 2030, one applied for).
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

    def op(self, name, /, **args):
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


def seed_procurement_realm_settings(realm, prelude):
    """The realm's currency and time zone. A bare local realm has no token, so no currency and no decimals (a contract then
    reads in base units, with no symbol), and it keeps UTC: REALM with 8 decimals, as a realm that has its token, and Madrid."""
    realm.shell(prelude + '''
from ggg import Token
if Token["REALM"] is None:
    do("token_register", symbol="REALM", ledger="ryjl3-tyaaa-aaaaa-aaaba-cai", decimals=8, fee=10_000)
do("realm_configure_tokens", accounting_currency="REALM", accounting_currency_decimals=8)
do("realm_configure", timezone="Europe/Madrid")
''')


def seed_procurement_people_and_bodies(realm, prelude):
    """Four people, the departments Infrastructure and Finance (each decides alone) and Planning (two seats, which will decide
    by vote), the organizations BuildCo and RoadCorp with their administrators, and the Province as an outside body: the
    parties the procurement screens name."""
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
if Department["Planning"] is None:
    do("department_create", department="Planning", description="Plans the works and holds their contracts")
if Position["planning.officer"] is None:
    do("position_create", department="Planning", position="planning.officer", title="Planning officer", headcount=2)
    do("appoint", position="planning.officer", user=P[6])
    do("appoint", position="planning.officer", user=P[7])
    do("department_edit", department="Planning", head=P[6])
for name, admin in (("BuildCo", 2), ("RoadCorp", 3)):
    if Organization[name] is None:
        do("organization_register", organization=name, description=name, kind="company")
        do("organization_edit", organization=name, admins=[P[admin]])
if External["province"] is None:
    do("external_add", external="province", name="The Province", kind="authority", channel="manual")
''')


def seed_procurement_contracts(realm, prelude):
    """The fund ROADS with an adopted capital line; a plain tender of Planning and, from it, the contract "Bike lane works": 50 000
    spread over FY2026 and FY2027, 12 000 paid on it from the capital line, amended twice (the first decided by Planning at
    once; then Planning goes to a vote of 1 of its 2 seats, and the second is carried by a proposal) and a third attempt
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
        river = Tender[do("tender_create", title="Bike lane along the river", requester="Planning", kind="works",
                          procedure="open", opens_at=NOW - 40 * DAY, closes_at=NOW - 30 * DAY,
                          rubric={"price": 60_000_000, "quality": 40_000_000})["tender"]]
lane = titled(Contract, "Bike lane works")
if lane is None:
    with at(NOW - 30 * DAY):
        lane = Contract[do("contract_create", title="Bike lane works", parties=["Department:Planning", "Organization:BuildCo"],
                           value=50_000 * U, symbol=currency(), tender=river.id, starts_at=NOW - 30 * DAY, ends_at=NOW + 90 * DAY,
                           split=[{"period": "FY2026", "amount": 30_000 * U}, {"period": "FY2027", "amount": 20_000 * U}])["contract"]]
    with at(NOW - 20 * DAY):  # money paid on it from the capital line, so that its value cannot fall below it
        Transfer(id=next_id(Transfer, "TR"), sender="Fund:ROADS", to="Organization:BuildCo", symbol=currency(), amount=12_000 * U,
                 status="completed", at=NOW - 20 * DAY, contract=lane.id, budget=capital.id)
    with at(NOW - 12 * DAY):  # Planning still decides alone: applied at once
        do("contract_amend", contract=lane.id, ends_at=NOW + 150 * DAY)
    do("department_set_policy", department="Planning", m=1, n=2)
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
    seed_procurement_realm_settings(realm, prelude)
    seed_procurement_people_and_bodies(realm, prelude)
    seed_procurement_lots(realm, prelude)
    seed_procurement_contracts(realm, prelude)


# Organisations of each kind, for the data explorer's kind column and filter (ggg I-ORG-9), and one from before kinds existed.
ORGANISATIONS = [
    ("Clinic B", "A private clinic", "company"),
    ("Harbour Party", "The party of the harbour", "party"),
    ("Dockers", "The dockers' union", "union"),
    ("Friends of the Park", "A neighbours' association", "association"),
    ("Cooperativa del Mar", "A fishing cooperative, none of the four", "other"),
]
# A realm cannot reach a row without a kind (a new organisation is `other`, an older row is read as `other`): this one is written by hand, to see
# what the page does when the realm states none.
WITHOUT_KIND = """
from ggg import Organization
Organization(id="Old Registry", description="Registered before kinds existed", kind="")
"""


def seed_organisations_of_each_kind(realm):
    for name, description, kind in ORGANISATIONS:
        realm.op("organization_register", organization=name, description=description, kind=kind)
    realm.shell(WITHOUT_KIND)


# Proposals of the realm's own areas, for the voting page's tags (ggg I-GOV-15): a few filed as a member files them, and, with
# --bulk-proposals, as many closed ones as a town's year holds (the JGL files ~3,600) to measure what a tag filter costs.
TAGGED_PROPOSALS = [
    ("Bike lane on Main Street", ["mobility", "district-3"]),
    ("Plant 40 trees on Avenida del Puerto", ["parks", "district-3"]),
    ("Minutes of the October council", ["minutes"]),
    ("Close Carrer Major to traffic on Sundays", ["mobility"]),
    ("A proposal filed without tags", []),
    ("Every area at once", [f"area {i}" for i in range(1, 17)]),  # the most a proposal can carry
]
AREAS = [f"district-{i}" for i in range(1, 13)]
KINDS = ["mobility", "parks", "minutes", "licences", "budget", "culture"]

BULK_PROPOSALS = '''
import json
from core import chain
from core.db import next_id
from ggg import Proposal
areas, kinds, first, last, total = %(areas)r, %(kinds)r, %(first)d, %(last)d, %(total)d
now = chain.now()
for n in range(first, last + 1):
    tags = [areas[n %% len(areas)], kinds[n %% len(kinds)]]
    if n == total:
        tags.append("rare-last")  # carried by the last proposal only: a search for it reads every row before it
    Proposal(id=next_id(Proposal, "P"), title="Proposal %%d of the year" %% n, description="Filed by the town hall",
             proposer="town-hall", status="executed", opens_at=now - (total - n) * 3600, deadline=now - (total - n) * 3600 + 600,
             tags=tags, tally={"yes": 5, "no": 1, "abstain": 0, "eligible": 9})
print(json.dumps(Proposal.max_id()))
'''


def seed_tagged_proposals(realm):
    """The proposals the voting page's tags screens show: tagged by their proposers, one untagged, one with 16 tags."""
    for title, tags in TAGGED_PROPOSALS:
        realm.op("proposal_create", title=title, description=f"{title}: filed by the seed", **({"tags": tags} if tags else {}))


def seed_bulk_proposals(realm, total, batch=100):
    """``total`` closed proposals, two tags each from AREAS and KINDS, the last also tagged "rare-last"."""
    for first in range(1, total + 1, batch):
        code = BULK_PROPOSALS % {"areas": AREAS, "kinds": KINDS, "first": first, "last": min(first + batch - 1, total), "total": total}
        realm.shell(code)


# Planning zones and parcels for the land registry (ggg domain `planning`: Land.zones, set with land_zone_set; License.land, I-LIC-4).
PLANNING_ZONES = [("seafront", "Seafront", "planning"), ("old-town", "Old town", "heritage")]
PARCELS = [  # (x, kind, the zones it lies in)
    (0, "residential", ["seafront"]),
    (3, "commercial", ["seafront", "old-town"]),
    (6, "agricultural", []),
    (9, "residential", ["old-town"]),
]
LICENCE_FACTS = """
import json
from core import chain
from ggg import License
lic = License[%(licence)r]
lic.status, lic.issued_at, lic.expires_at = "active", chain.now(), %(until)d
print(json.dumps(lic.status))
"""


def seed_planning(realm):
    for zone, name, kind in PLANNING_ZONES:
        realm.op("zone_define", zone=zone, name=name, kind=kind)
    owner = "Seafront Estates"
    realm.op("organization_register", organization=owner, description="Owns the parcels of the seafront", kind="company")
    parcels = []
    for x, kind, zones in PARCELS:
        land = realm.op("land_register", x=x, y=0, width=3, height=2, kind=kind, owner=f"Organization:{owner}")["land"]
        if zones:
            realm.op("land_zone_set", land=land, zones=zones)
        parcels.append(land)
    # two licences name the second parcel (License.land): the building one is issued, until 1 January 2030; the other is applied for
    building = realm.op("license_apply", kind="building", holder=f"Organization:{owner}", land=parcels[1])["license"]
    realm.op("license_apply", kind="demolition", holder=f"Organization:{owner}", land=parcels[1])
    realm.shell(LICENCE_FACTS % {"licence": building, "until": 1_893_456_000})


# --- budget_manager 2.2.0: spending stages, scheduled payments, quarter sweeps (--budget-screens) -------------------

HOLDINGS = '''
import json
from ggg import Fund
for fund, tokens in %(balances)r.items():  # a scheduled payment is owed from what its fund holds
    Fund[fund].balances = {"REALM": tokens * 100}
print(json.dumps({"ok": True}))
'''

LINES_AND_DUE_DATES = '''
import json
from ggg import Budget, Transfer
for line, stage in %(lines)r.items():  # the charged amount of ggg's example set directly (it replaces what the payments booked)
    Budget[line].status = stage.get("status", Budget[line].status)
    if "actual" in stage:
        Budget[line].actual = stage["actual"] * 100
for transfer, days in %(due)r.items():  # the realm refuses a due date in the past: an overdue payment is made later
    Transfer[transfer].due_at = %(now)d + days * %(day)d
print(json.dumps({"ok": True}))
'''

FEDERATION = '''
import json
from ggg import Quarter, Realm
realm = Realm["1"]
realm.is_quarter, realm.is_capital = True, True  # the capital of a federation, which alone sets sweep rules
for cid, name, index in %(quarters)r:
    Quarter(id=cid, name=name, index=index, status="active")
print(json.dumps({"ok": True}))
'''

SWEEPS = '''
import json
from api import treasury
from core import chain
from ggg import Fund, Sweep
to = {"owner": chain.self_id(), "subaccount": None}
for key, quarter, fund, into, tokens, days_ago, block in %(sweeps)r:  # as quarter_sweep_report books what a quarter reports
    amount, at = tokens * 100, %(now)d - days_ago * %(day)d
    booked = Sweep(id=key, quarter=quarter, rule=f"{fund}:REALM", status="booked", reported_at=at + 300, fund=fund,
                   symbol="REALM", into=into, to=to, epoch=at - at %% (30 * %(day)d), amount=amount, fee=10,
                   created_at=at, block=str(block))
    lines = [("asset", "cash", amount, 0, Fund[into]), ("equity", "sweep", 0, amount, Fund[into])]
    treasury.post(treasury.booking_period(), lines, "REALM", f"sweep {booked.id} (block {block})", sweep=booked)
print(json.dumps({"ok": True}))
'''

BUDGET_FUNDS = {"ROOT": "Root", "ROADS": "Roads", "WELFARE": "Welfare"}
NORTH = "ryjl3-tyaaa-aaaaa-aaaba-cai"
SOUTH = "renrk-eyaaa-aaaaa-aaada-cai"


def seed_budget_screens(realm):
    """What the screens of budget_manager 2.2.0 show (`budget_manager/tests/e2e/specs/screens.local.spec.ts`): REALM, a
    token of two decimals, and three funds; FY2026 with Roads' capital and upkeep, a toll revenue line and Welfare's care,
    stages on the capital line (reserved 40,000, committed 90,000 of which the 12,000 payment below draws on, and 120,500
    charged: the figure of ggg's example, set directly, since this realm pays nothing through a ledger), a drafted and a
    proposed line that are not in force; payments owed (two fall due this month, one of them overdue, one next month) and one cancelled
    unpaid; and a capital with two quarters, its sweep rules and the three sweeps they reported, booked."""
    now = int(realm.shell("from core import chain\nprint(chain.now())").strip())
    realm.op("token_register", symbol="REALM", ledger="aaaaa-aa", decimals=2, fee=10)
    realm.op("realm_configure_tokens", accounting_currency="REALM")
    for fund, name in BUDGET_FUNDS.items():
        realm.op("fund_create", fund=fund, name=name)
    assert json.loads(realm.shell(HOLDINGS % {"balances": {"ROADS": 500_000, "WELFARE": 200_000}}))["ok"]
    realm.op("period_open", period="FY2026", starts_at=now - 60 * DAY, ends_at=now + 300 * DAY)

    def line(fund, category, kind, tokens):
        return realm.op("budget_draft", fund=fund, period="FY2026", category=category, kind=kind, planned=tokens * 100)["budget"]

    capital, upkeep = line("ROADS", "capital", "expense", 300_000), line("ROADS", "upkeep", "expense", 50_000)
    line("ROADS", "tolls", "revenue", 80_000)
    care = line("WELFARE", "care", "expense", 120_000)
    realm.op("budget_propose", period="FY2026")  # the root approves alone: the lines are adopted at once
    lighting = line("ROADS", "street_lighting", "expense", 20_000)  # drafted, not proposed
    schools = line("WELFARE", "schools", "expense", 75_000)  # proposed, as when a vote has yet to decide it

    realm.op("budget_stage", budget=capital, reserve=40_000 * 100, commit=90_000 * 100)

    def payment(fund, to, tokens, category, days, **more):
        return realm.op("transfer_create", fund=fund, to=to, amount=tokens * 100, category=category,
                        due_at=now + days * DAY, **more)["transfer"]

    payment("ROADS", "buildco", 12_000, "capital", 17, committed=True)  # falls due this month, from committed money
    overdue = payment("ROADS", "buildco", 4_500, "upkeep", 1)
    payment("WELFARE", "carehome", 8_000, "care", 33)
    revoked = payment("ROADS", "buildco", 5_000, "upkeep", 20)
    realm.op("transfer_revert", transfer=revoked)  # cancelled, unpaid

    lines = {capital: {"actual": 120_500}, schools: {"status": "proposed"}}
    done = json.loads(realm.shell(LINES_AND_DUE_DATES % {"lines": lines, "due": {overdue: -9}, "now": now, "day": DAY}))
    assert done["ok"], done
    done = json.loads(realm.shell(FEDERATION % {"quarters": [(NORTH, "North", 1), (SOUTH, "South", 2)]}))
    assert done["ok"], done
    realm.op("treasury_configure", config={"sweep": [
        {"fund": "ROOT", "symbol": "REALM", "into": "ROADS", "keep": 100 * 100},
        {"fund": "WELFARE", "symbol": "REALM", "into": "WELFARE", "keep": 0}]})
    done = json.loads(realm.shell(SWEEPS % {
        "now": now, "day": DAY,
        "sweeps": [(f"{NORTH}/SW-1", NORTH, "ROOT", "ROADS", 890, 11, 90113), (f"{SOUTH}/SW-1", SOUTH, "ROOT", "ROADS", 420, 10, 90210),
                   (f"{NORTH}/SW-2", NORTH, "ROOT", "ROADS", 310, 42, 85002)],
    }))
    assert done["ok"], done
    print(json.dumps({"budget_screens": {"capital": capital, "upkeep": upkeep, "care": care, "lighting": lighting,
                                         "schools": schools}}))


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--network", required=True, choices=["local"], help="only a local network is accepted")
    parser.add_argument("--identity", required=True, help="the local network's identity, a controller of the realm")
    parser.add_argument("--home", required=True, help="the directory of the local realm's icp.yaml")
    parser.add_argument("--backend", required=True, help="the realm backend's canister id")
    parser.add_argument("--fixture", type=Path, help="tests/fixtures/legislation/valencia of realms-gos (not with --only)")
    parser.add_argument("--only", choices=["procurement"], help="seed only what one extension's screens show")
    parser.add_argument("--principals", type=Path, help="config/deterministic-test-identity-principals.json of realms-gos (--only)")
    parser.add_argument("--bulk-proposals", type=int, default=0, help="also file this many closed, tagged proposals (voting tags)")
    parser.add_argument("--budget-screens", action="store_true", help="also seed what budget_manager 2.2.0 shows (the budget, "
                        "its payments and the sweeps): for a realm of its own, since it makes the realm a capital")
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
    seed_organisations_of_each_kind(realm)
    seed_planning(realm)
    older = install([(OWN, "tax")], "", 5 * DAY, "P-3")
    newer = install([], older["codex"], 2 * DAY, "P-12")
    realm.op("department_create", department="IT")
    realm.op("position_create", department="IT", position="it.seat")
    realm.op("it_team_set", department="IT")
    alert_links = json.loads(realm.shell(CHECKS % {"spain": SPAIN, "day": DAY}))
    assert alert_links == ["/extensions/codex_viewer"], alert_links  # the team's alert links to the codex page
    seed_tagged_proposals(realm)
    if args.bulk_proposals:
        seed_bulk_proposals(realm, args.bulk_proposals)
    print(json.dumps({"older": older["codex"], "newer": newer["codex"]}))
    if args.budget_screens:
        seed_budget_screens(realm)


if __name__ == "__main__":
    sys.exit(main())
