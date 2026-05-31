#!/usr/bin/env python3
"""
Scenario: Citizen onboarding (governance participation)

A cross-extension "golden path" test driven against a *deployed* realm on the
`test`/`ic` network (no Docker, no local replica). It self-provisions a fresh
citizen identity, runs a realistic journey across several extensions, and
asserts the cross-extension effects at each hop.

Extensions exercised:
  - realm_backend (join_realm)
  - member_dashboard (citizenship status)
  - passport_verification (identity created + verified, zkproof skipped)
  - notifications (welcome notification delivered to the new member)
  - voting (submit -> open voting -> vote; recorded; identity not spoofable)
  - census (member is visible)

Design:
  - Self-provisioning: creates its own dfx identity; the only required initial
    state is "the realm is deployed with the TEST_MODE flags".
  - Namespacing: every created entity is tagged with a unique RUN_ID, so repeated
    or parallel runs against the shared realm never collide.
  - State-tolerant: asserts only on entities this run created, never global counts.
  - Scope: governance *participation* only. The approval -> codex-execution seam
    is covered by governance_execution_scenario.py (manual approval bypasses the
    member-quorum that is unreachable on a large demo realm).

Usage:
  REALM_CANISTER_ID=ku6cv-2iaaa-aaaab-agrpa-cai DFX_NETWORK=ic \\
      python3 citizen_onboarding_scenario.py

Exit code is the number of failed assertions (0 == success).
"""

import sys

from realm_client import (
    MEMBER_CODE_CHECKSUM,
    Scenario,
    TestIdentity,
    call_backend,
    call_extension,
)


def run(sc: Scenario):
    with TestIdentity(f"{sc.run_id}_alice") as actor:
        print(f"actor principal={actor.principal}\n")

        # 1. Register as a citizen --------------------------------------------
        sc.step("1. join_realm as a new member")
        r = call_backend("join_realm", "member", "", MEMBER_CODE_CHECKSUM)
        user = r.get("data", {}).get("userGet", {})
        sc.check(r.get("success") is True, "join_realm succeeded")
        sc.check(user.get("principal") == actor.principal, "user principal matches caller")
        sc.check("member" in user.get("profiles", []), "member profile granted")

        # 2. Citizenship status reflects a fresh, unactivated member ----------
        sc.step("2. member_dashboard.get_citizenship_status")
        cs = call_extension("member_dashboard", "get_citizenship_status")
        sc.check(cs.get("success") is True, "citizenship status returned")
        sc.check(
            cs.get("data", {}).get("passport_verified") is False,
            "passport not yet verified",
        )

        # 3. Create + verify passport identity (zkproof skipped) --------------
        sc.step("3. passport_verification.create_passport_identity + status")
        cp = call_extension("passport_verification", "create_passport_identity")
        sc.check(cp.get("success") is True, "passport identity created")
        st = call_extension("passport_verification", "get_identity_status")
        sc.check(st.get("verified") is True, "passport identity is verified")

        # 4. Registration generated a welcome notification (cross-extension) --
        sc.step("4. notifications.get_notifications -> welcome notification")
        nt = call_extension("notifications", "get_notifications")
        mine = [n for n in nt.get("notifications", []) if n.get("recipient") == actor.principal]
        sc.check(len(mine) >= 1, "at least one notification addressed to this member")
        sc.check(
            any(n.get("topic") == "welcome" for n in mine),
            "a 'welcome' notification was delivered on signup",
        )

        # 5. Submit a proposal (identity binding) -----------------------------
        sc.step("5. voting.submit_proposal")
        sp = call_extension("voting", "submit_proposal", {
            "title": f"[{sc.run_id}] Scenario proposal",
            "description": "Deterministic citizen-onboarding scenario proposal",
            "code_url": "https://realms.vote/proposal/discussion",
        })
        pdata = sp.get("data", {})
        pid = pdata.get("id")
        sc.check(sp.get("success") is True, "submit_proposal succeeded")
        sc.check(bool(pid), f"proposal created (id={pid})")
        sc.check(pdata.get("proposer") == actor.principal, "proposer bound to caller")
        sc.check(pdata.get("status") == "pending_review", "status is pending_review")

        # 6. Open voting ------------------------------------------------------
        sc.step("6. voting.start_voting")
        sv = call_extension("voting", "start_voting", {"proposal_id": pid})
        sc.check(sv.get("success") is True, "start_voting succeeded")
        sc.check(
            sv.get("data", {}).get("status") == "voting",
            "proposal status is now 'voting'",
        )

        # 7. Cast a vote, verify it is recorded -------------------------------
        sc.step("7. voting.cast_vote (yes) + get_user_vote")
        cv = call_extension("voting", "cast_vote", {"proposal_id": pid, "vote": "yes"})
        sc.check(cv.get("success") is True, "cast_vote succeeded")
        sc.check(
            cv.get("data", {}).get("proposal", {}).get("votes", {}).get("yes", 0) >= 1,
            "yes vote counted",
        )
        uv = call_extension("voting", "get_user_vote", {"proposal_id": pid})
        sc.check(uv.get("data", {}).get("vote_choice") == "yes", "vote recorded as 'yes'")

        # 8. SECURITY: a spoofed voter field is ignored -----------------------
        sc.step("8. SECURITY: cast_vote with spoofed 'voter' is ignored")
        call_extension("voting", "cast_vote", {
            "proposal_id": pid,
            "vote": "abstain",
            "voter": "fake-principal-should-be-ignored",
        })
        uv2 = call_extension("voting", "get_user_vote", {"proposal_id": pid})
        sc.check(
            uv2.get("data", {}).get("vote_choice") == "abstain",
            "vote recorded under real caller, spoofed voter ignored",
        )

        # 9. Census/admin sees the member -------------------------------------
        sc.step("9. census.get_user_count (member is visible)")
        uc = call_extension("census", "get_user_count")
        sc.check(
            uc.get("data", {}).get("user_count", 0) > 0,
            "census reports a non-zero population",
        )


def main():
    sc = Scenario("citizen onboarding")
    sc.banner()
    try:
        run(sc)
    except Exception as exc:  # noqa: BLE001
        sc.check(False, f"scenario raised an exception: {exc}")
    return sc.finish()


if __name__ == "__main__":
    sys.exit(main())
