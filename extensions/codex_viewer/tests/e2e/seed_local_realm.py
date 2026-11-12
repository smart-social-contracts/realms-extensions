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


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--network", required=True, choices=["local"], help="only a local network is accepted")
    parser.add_argument("--identity", required=True, help="the local network's identity, a controller of the realm")
    parser.add_argument("--home", required=True, help="the directory of the local realm's icp.yaml")
    parser.add_argument("--backend", required=True, help="the realm backend's canister id")
    parser.add_argument("--fixture", required=True, type=Path, help="tests/fixtures/legislation/valencia of realms-gos")
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
    print(json.dumps({"older": older["codex"], "newer": newer["codex"]}))


if __name__ == "__main__":
    sys.exit(main())
