#!/usr/bin/env python3
"""
Scenario: Governance decision causes a real, verifiable effect

The highest-value cross-extension seam: prove that an approved proposal
actually *executes code* and changes realm state. Runs against a deployed
realm on the `test` network (no Docker, no replica).

Flow:
  1. Self-provision an admin citizen (sha256("admin") self-registration code).
  2. Submit a proposal carrying inline Python (`code_inline`) whose effect is
     to create a uniquely-named marker Codex.
  3. Approve the proposal (manual approval bypasses the member-quorum, which on
     a large demo realm is otherwise unreachable with a handful of voters).
  4. Wait for the scheduled execution to run the inline code.
  5. Assert the proposal reached `executed` AND the marker Codex now exists —
     i.e. the governance action produced a real, queryable effect.

Why inline + marker codex:
  - `code_inline` needs no external hosting/checksum, so the test is hermetic.
  - A uniquely-named Codex is trivially queryable via codex_viewer, and the
    unique name keeps repeated/parallel runs from colliding.

Usage:
  REALM_CANISTER_ID=ku6cv-2iaaa-aaaab-agrpa-cai DFX_NETWORK=test \\
      python3 governance_execution_scenario.py

Exit code is the number of failed assertions (0 == success).
"""

import sys
import time

from realm_client import (
    ADMIN_CODE_CHECKSUM,
    Scenario,
    TestIdentity,
    call_backend,
    call_extension,
)


def run(sc: Scenario):
    marker = f"scenario_marker_{sc.run_id}"
    inline_code = (
        "def main():\n"
        "    from ggg import Codex\n"
        f"    Codex(name='{marker}', description='governance execution scenario marker',"
        " code='# marker created by approved proposal')\n"
        "    logger.info('scenario marker codex created')\n"
    )

    with TestIdentity(f"{sc.run_id}_admin") as actor:
        print(f"actor principal={actor.principal}\n")

        # 1. Register as admin (so manual approval is permitted) --------------
        sc.step("1. join_realm as admin")
        r = call_backend("join_realm", "admin", "", ADMIN_CODE_CHECKSUM)
        profiles = r.get("data", {}).get("userGet", {}).get("profiles", [])
        sc.check(r.get("success") is True, "join_realm succeeded")
        sc.check("admin" in profiles, "admin profile granted")

        # 2. Submit a proposal carrying inline executable code ----------------
        sc.step("2. voting.submit_proposal with inline code")
        sp = call_extension("voting", "submit_proposal", {
            "title": f"[{sc.run_id}] execute marker codex",
            "description": "Governance-execution scenario: create a marker codex",
            "code_inline": inline_code,
            "codex_name": marker,
        })
        pid = sp.get("data", {}).get("id")
        sc.check(sp.get("success") is True, "submit_proposal succeeded")
        sc.check(bool(pid), f"proposal created (id={pid})")
        sc.check(
            sp.get("data", {}).get("proposer") == actor.principal,
            "proposer bound to caller",
        )

        # Marker must NOT exist yet (guards against false positives) ----------
        sc.step("3. precondition: marker codex does not exist yet")
        before = _codex_names()
        sc.check(marker not in before, "marker codex absent before execution")

        # 4. Approve -> schedules execution -----------------------------------
        sc.step("4. voting.approve_proposal")
        ap = call_extension("voting", "approve_proposal", {"proposal_id": pid})
        sc.check(ap.get("success") is True, "approve_proposal succeeded")
        sc.check(
            ap.get("data", {}).get("proposal", {}).get("status") == "accepted",
            "proposal status is 'accepted'",
        )

        # 5. Wait for execution to complete -----------------------------------
        sc.step("5. wait for proposal to reach 'executed'")
        status = _wait_for_status(pid, target="executed", timeout_s=45)
        sc.check(status == "executed", f"proposal executed (final status={status})")

        # 6. The effect happened: marker codex now exists ---------------------
        sc.step("6. assert governance effect: marker codex created")
        after = _codex_names()
        sc.check(marker in after, "marker codex exists after execution")


def _codex_names():
    allc = call_extension("codex_viewer", "get_all_codexes", {})
    return {c.get("name") for c in allc.get("codexes", [])}


def _wait_for_status(pid, target, timeout_s=45, interval_s=3):
    deadline = time.time() + timeout_s
    status = None
    while time.time() < deadline:
        time.sleep(interval_s)
        gp = call_extension("voting", "get_proposal", {"proposal_id": pid})
        status = gp.get("data", {}).get("status")
        print(f"   poll: status={status}")
        if status in (target, "failed"):
            return status
    return status


def main():
    sc = Scenario("governance decision causes a real effect")
    sc.banner()
    try:
        run(sc)
    except Exception as exc:  # noqa: BLE001
        sc.check(False, f"scenario raised an exception: {exc}")
    return sc.finish()


if __name__ == "__main__":
    sys.exit(main())
