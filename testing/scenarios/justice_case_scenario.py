#!/usr/bin/env python3
"""
Scenario: Justice case lifecycle

A cross-extension test driven against a *deployed* realm on the `test`/`ic`
network. Two freshly-provisioned members walk the full case lifecycle:

  file_case → assign_judge → issue_verdict (with penalty) → get_case (read-back)

Extensions / GGG modules exercised:
  - realm_backend (join_realm)
  - justice_litigation (file_case, assign_judge, issue_verdict, get_case,
                        get_verdicts, get_penalties)

Who calls what matters here. Since the extension was sandboxed (issue #272) the
host derives every identity from `ic.caller()`, so the scenario has to *act as*
each party rather than naming them in the request:

  - `file_case` records the caller as plaintiff. A `plaintiff_id` in the request
    is ignored, and step 1 asserts that by trying to file in the defendant's name.
  - `issue_verdict` requires the caller to be a judge assigned to that case, or a
    realm admin. The scenario does not control the seeded judge's key, so it rules
    as the operator (an admin) and separately checks that a member who is neither
    is refused.

Design:
  - Self-provisioning: creates two throwaway identities (plaintiff + defendant),
    both held open so the scenario can switch between them.
  - Uses seeded courts and judges (always present on the Dominion realm) so the
    scenario does not need to set up a justice system.
  - State-tolerant: asserts only on the case this run created (identified by its
    auto-generated case_number, which is unique per run).
  - Also exercises the authorization boundary: a forged plaintiff is ignored, a
    non-judge cannot rule, and a missing case ID is rejected cleanly.

Prerequisite:
  A realm running justice_litigation 0.5.0 or later (the sandboxed port). Against
  0.4.x and earlier the forged-plaintiff check fails, which is the point.

Usage:
  REALM_CANISTER_ID=ku6cv-2iaaa-aaaab-agrpa-cai DFX_NETWORK=ic \\
      python3 justice_case_scenario.py

Exit code is the number of failed assertions (0 == success).
"""

import sys

from realm_client import (
    MEMBER_CODE_CHECKSUM,
    Scenario,
    TestIdentity,
    call_backend,
    call_extension,
    resolve_user_id,
)


def _first_court():
    """Return (id, name) of the first active seeded court.

    Uses the justice_litigation get_courts endpoint (an update call, 40B
    instruction budget) rather than the generic find_objects query (5B budget):
    on a long-lived realm the entity store grows large enough that a full-class
    scan + cascade serialization exceeds the per-query instruction limit.
    """
    resp = call_extension("justice_litigation", "get_courts", {"status": "active"}, timeout=180)
    courts = ((resp or {}).get("data") or {}).get("courts", [])
    if not courts:
        raise RuntimeError("No active court found on realm")
    return courts[0]["id"], courts[0].get("name", "")


def _first_judge():
    """Return id of the first active seeded judge (via get_judges update call)."""
    resp = call_extension("justice_litigation", "get_judges", {"status": "active"}, timeout=180)
    judges = ((resp or {}).get("data") or {}).get("judges", [])
    if not judges:
        raise RuntimeError("No active judge found on realm")
    return judges[0]["id"]


def run(sc: Scenario):
    court_id, court_name = _first_court()
    judge_id = _first_judge()

    # 0. Provision two members (plaintiff + defendant) -----------------------
    # Both identities stay open: the host takes the plaintiff from the caller, so
    # the scenario switches between them with .use() rather than naming them.
    sc.step("0. provision plaintiff and defendant identities")
    with TestIdentity(f"{sc.run_id}_plaintiff") as plaintiff_actor, \
            TestIdentity(f"{sc.run_id}_defendant") as defendant_actor:
        defendant_actor.use()
        r = call_backend("join_realm", "member", "", MEMBER_CODE_CHECKSUM)
        sc.check(r.get("success") is True, "defendant joined realm")
        defendant_uid = resolve_user_id(defendant_actor.principal)
        sc.check(bool(defendant_uid), f"defendant user_id resolved ({defendant_uid})")

        plaintiff_actor.use()
        r = call_backend("join_realm", "member", "", MEMBER_CODE_CHECKSUM)
        sc.check(r.get("success") is True, "plaintiff joined realm")
        plaintiff_uid = resolve_user_id(plaintiff_actor.principal)
        sc.check(bool(plaintiff_uid), f"plaintiff user_id resolved ({plaintiff_uid})")
        sc.check(plaintiff_uid != defendant_uid, "plaintiff and defendant are distinct")

        # 1. File the case, as the plaintiff ---------------------------------
        # `plaintiff_id` is sent deliberately and names the *defendant*. The host
        # derives the plaintiff from the caller, so a forged one must be ignored;
        # before the sandboxed port it was honoured.
        sc.step(f"1. file_case at court '{court_name}' (id={court_id})")
        fc = call_extension("justice_litigation", "file_case", {
            "court_id": court_id,
            "plaintiff_id": defendant_uid,
            "defendant_id": defendant_uid,
            "title": f"[{sc.run_id}] Scenario dispute",
            "description": "Automated scenario — not a real case",
        })
        case_data = (fc.get("data") or {}).get("case", {})
        case_id = case_data.get("id")
        case_number = case_data.get("case_number", "")
        sc.check(fc.get("success") is True, "file_case succeeded")
        sc.check(bool(case_id), f"case created (id={case_id})")
        sc.check(bool(case_number), f"case_number auto-generated ({case_number})")
        sc.check(case_data.get("status") == "filed", "initial status is 'filed'")
        sc.check(
            case_data.get("court_id") == court_id,
            "case is bound to the correct court",
        )
        sc.check(
            str(case_data.get("plaintiff_id")) == str(plaintiff_uid),
            "plaintiff is the caller, not the forged plaintiff_id",
        )

        # 2. NEGATIVE: a member who is not a judge cannot rule ---------------
        sc.step("2. NEGATIVE: issue_verdict as a non-judge member is refused")
        defendant_actor.use()
        bad_verdict = call_extension("justice_litigation", "issue_verdict", {
            "case_id": case_id,
            "judge_id": judge_id,
            "decision": "in_favor_of_plaintiff",
            "reasoning": "Should fail — caller is not an assigned judge",
        })
        sc.check(
            bad_verdict.get("success") is False,
            "verdict refused to a caller who is not an assigned judge",
        )

        # 3. NEGATIVE: the defendant cannot read the case --------------------
        # Being accused does not grant read access; the plaintiff and the justice
        # department see it.
        sc.step("3. NEGATIVE: get_case as the defendant is refused")
        hidden = call_extension("justice_litigation", "get_case",
                                {"case_id": case_id})
        sc.check(
            hidden.get("success") is False,
            "defendant cannot read the case filed against them",
        )

        # 4. The plaintiff sees their own case -------------------------------
        sc.step("4. get_cases as the plaintiff lists their own case")
        plaintiff_actor.use()
        mine = call_extension("justice_litigation", "get_cases", {})
        my_cases = (mine.get("data") or {}).get("cases", [])
        sc.check(mine.get("success") is True, "get_cases succeeded")
        sc.check(
            any(str(c.get("id")) == str(case_id) for c in my_cases),
            "plaintiff's own case appears in their listing",
        )

    # Back on the operator identity (a realm admin) for the remaining steps.

    # 5. Assign a judge ------------------------------------------------------
    sc.step(f"5. assign_judge (judge_id={judge_id})")
    aj = call_extension("justice_litigation", "assign_judge", {
        "case_id": case_id,
        "judge_id": judge_id,
    })
    aj_case = (aj.get("data") or {}).get("case", {})
    sc.check(aj.get("success") is True, "assign_judge succeeded")
    sc.check(
        aj_case.get("status") in ("assigned", "in_progress"),
        f"status advanced after assignment ({aj_case.get('status')})",
    )
    sc.check(
        aj_case.get("judges", []) != [],
        "judge list is non-empty after assignment",
    )

    # 6. Issue a verdict with a symbolic penalty -----------------------------
    # As the operator, who is a realm admin: the seeded judge's key is not ours,
    # and an admin may rule so a stuck case can always be unstuck.
    sc.step("6. issue_verdict with a fine penalty, as an admin")
    iv = call_extension("justice_litigation", "issue_verdict", {
        "case_id": case_id,
        "decision": "in_favor_of_plaintiff",
        "reasoning": f"Automated scenario verdict [{sc.run_id}]",
        "penalties": [{
            "type": "fine",
            "amount": 100.0,
            "currency": "SMPL",
            "description": "Symbolic scenario penalty",
            "target_user_id": defendant_uid,
        }],
    })
    verdict_data = (iv.get("data") or {}).get("verdict", {})
    verdict_id = verdict_data.get("id")
    sc.check(iv.get("success") is True, "issue_verdict succeeded")
    sc.check(bool(verdict_id), f"verdict created (id={verdict_id})")
    sc.check(verdict_data.get("decision") == "in_favor_of_plaintiff", "decision persisted")
    sc.check(verdict_data.get("penalty_count", 0) >= 1, "penalty attached to verdict")

    # 7. Read the case back — status advanced; verdict queryable separately --
    sc.step("7. get_case — status advanced after verdict; get_verdicts returns it")
    gc = call_extension("justice_litigation", "get_case", {"case_id": case_id})
    gc_case = (gc.get("data") or {}).get("case", {})
    sc.check(gc.get("success") is True, "get_case succeeded")
    sc.check(
        gc_case.get("status") in ("verdict_issued", "closed"),
        f"case status advanced after verdict (got {gc_case.get('status')!r})",
    )
    # get_verdicts is the reliable endpoint (case.verdicts OneToMany lazy-loads differently)
    gv = call_extension("justice_litigation", "get_verdicts", {"case_id": case_id})
    verdicts = (gv.get("data") or {}).get("verdicts", [])
    sc.check(gv.get("success") is True, "get_verdicts succeeded")
    sc.check(len(verdicts) >= 1, "at least one verdict for this case")
    sc.check(
        any(v.get("id") == verdict_id for v in verdicts),
        f"our verdict (id={verdict_id}) appears in get_verdicts",
    )

    # 8. Penalty is queryable by verdict ------------------------------------
    sc.step("8. get_penalties for the verdict")
    gp = call_extension("justice_litigation", "get_penalties", {"verdict_id": str(verdict_id)})
    penalties = (gp.get("data") or {}).get("penalties", [])
    sc.check(gp.get("success") is True, "get_penalties succeeded")
    sc.check(len(penalties) >= 1, "at least one penalty returned")
    sc.check(
        any(str(p.get("target_user_id")) == str(defendant_uid) for p in penalties),
        "penalty is addressed to the defendant",
    )

    # 9. NEGATIVE: get_case on unknown id is rejected cleanly ----------------
    # Same refusal as a case the caller may not see, so ids cannot be probed.
    sc.step("9. NEGATIVE: get_case on non-existent id")
    missing = call_extension("justice_litigation", "get_case", {"case_id": "no-such-case-zzz"})
    sc.check(missing.get("success") is False, "missing case returns failure")


def main():
    sc = Scenario("justice case lifecycle")
    sc.banner()
    try:
        run(sc)
    except Exception as exc:  # noqa: BLE001
        sc.check(False, f"scenario raised an exception: {exc}")
    return sc.finish()


if __name__ == "__main__":
    sys.exit(main())
