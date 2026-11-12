#!/usr/bin/env python3
"""Seed a local realm for the browser walkthrough of the codex page (`specs/legislation.local.spec.ts`).

The realm must be launched on a local network (`realms local start`, then `realms local setup`) from a realm wasm that
has `codex_views` and a test build (the controller's `__shell__`). The script runs Python in that realm as the
controller to write what a real install would leave (it fetches nothing: an install fetches over https), and calls
operations as that same identity. Nothing but a local network is accepted.

    seed_local_realm.py --network local --identity <local identity> --home <dir of the local realm's icp.yaml> \\
        --backend <realm backend canister id> --fixture <realms-gos>/tests/fixtures/legislation/valencia

It leaves: two layered codices of València's example legislation (the later replaced the earlier, which has no tax
chapter of the town's own), on Madrid time; an IT admin team (department `IT`, seat `it.seat`, which a test fills);
a sync source, Spain, that has published a release the realm runs behind; the check schedule; a failing method of the
codex, which notifies the team; and an install job that an upgrade paused.

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
    parser.add_argument("--fixture", required=True, type=Path, help="tests/fixtures/legislation/valencia of realms-gos")
    parser.add_argument("--bulk-proposals", type=int, default=0, help="also file this many closed, tagged proposals (voting tags)")
    parser.add_argument("--budget-screens", action="store_true", help="also seed what budget_manager 2.2.0 shows (the budget, "
                        "its payments and the sweeps): for a realm of its own, since it makes the realm a capital")
    args = parser.parse_args()
    realm = Realm(args.network, args.identity, args.home, args.backend)

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
