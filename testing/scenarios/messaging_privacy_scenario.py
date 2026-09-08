#!/usr/bin/env python3
"""
Messaging & Notification Privacy Scenario
==========================================
Exercises all notification audience types and visibility rules.

  Actors
  ------
  - admin_a  : realm admin
  - member_a : member of dept_a
  - member_b : member of dept_b (different department)
  - outsider : registered member belonging to no department

  Notification matrix tested
  --------------------------
  | Sender   | Target   | audience_type | visibility | Expected readers            |
  |----------|----------|---------------|------------|-----------------------------|
  | member_a | member_b | user          | private    | only member_b               |
  | member_b | dept_a   | department    | private    | only dept_a members         |
  | admin_a  | dept_b   | department    | private    | only dept_b members         |
  | member_a | member_b | user          | public     | all registered users        |
  | admin_a  | realm    | realm         | public     | all registered users        |

Permission checks are enforced here exactly as in production — the test realm
seeds real admin/member profiles rather than disabling authorization — so the
assertions below describe production access rules.

Requirements:
  - Realm must have test_mode_user_self_registration enabled.
  - notifications extension v1.1.0 must be installed (supports audience_type,
    department, and visibility fields).

Run:
  python3 messaging_privacy_scenario.py
"""

import json

from realm_client import (
    ADMIN_CODE_CHECKSUM,
    MEMBER_CODE_CHECKSUM,
    Scenario,
    TestIdentity,
    call_backend,
    call_extension,
)


def _codex(codex_id: str, code: str, timeout: int = 60) -> str:
    files = {
        "init.py": code,
        "manifest.json": json.dumps({"name": codex_id, "version": "0.0.1"}),
    }
    return call_backend(
        "install_codex",
        json.dumps({"codex_id": codex_id, "files": files, "run_init": True}),
        timeout=timeout,
    )


def _notif_ids(identity: "TestIdentity", limit: int = 300) -> set:
    """Return the set of notification IDs visible to the given identity."""
    identity.use()
    resp = call_extension("notifications", "get_notifications", {"limit": limit})
    notifs = (resp or {}).get("notifications", [])
    return {str(n.get("id")) for n in notifs}


def _send(sender: "TestIdentity", params: dict) -> str:
    """Send a notification as *sender*, return the notification id (str)."""
    sender.use()
    result = call_extension("notifications", "create_notification", params)
    assert result and result.get("success"), f"create_notification failed: {result}"
    return str(result.get("id", ""))


def _send_expecting_denial(sender: "TestIdentity", params: dict) -> bool:
    """Attempt to send as *sender*; True when the realm refused the call."""
    sender.use()
    try:
        result = call_extension("notifications", "create_notification", params)
    except Exception:
        # A denied call surfaces as a raised AccessDenied from the host.
        return True
    return not (result and result.get("success"))


def run_messaging_privacy():
    sc = Scenario("Messaging & Notification Privacy")
    sc.banner()
    run_id = sc.run_id
    dept_a_name = f"dept_a_{run_id}"
    dept_b_name = f"dept_b_{run_id}"

    # ------------------------------------------------------------------ #
    # Setup: two departments and four actors                               #
    # ------------------------------------------------------------------ #
    sc.step("Setup: create departments via codex")
    dept_code = f"""
from ggg import Department
da = Department(name={dept_a_name!r}, description='Dept A {run_id}')
db = Department(name={dept_b_name!r}, description='Dept B {run_id}')
ic.print('depts_created da=' + str(da._id) + ' db=' + str(db._id))
"""
    r_depts = _codex(f"mp_depts_{run_id}", dept_code)
    sc.check("init_warning" not in r_depts, "Departments created without error")

    with TestIdentity(f"mp_admin_{run_id}") as admin_a:
        call_backend("join_realm", "admin", "", ADMIN_CODE_CHECKSUM)

        with TestIdentity(f"mp_ma_{run_id}") as member_a:
            call_backend("join_realm", "member", "", MEMBER_CODE_CHECKSUM)
            ma_principal = member_a.principal

            with TestIdentity(f"mp_mb_{run_id}") as member_b:
                call_backend("join_realm", "member", "", MEMBER_CODE_CHECKSUM)
                mb_principal = member_b.principal

                with TestIdentity(f"mp_out_{run_id}") as outsider:
                    call_backend("join_realm", "member", "", MEMBER_CODE_CHECKSUM)

                    # Assign member_a → dept_a, member_b → dept_b
                    sc.step("Setup: assign members to departments via codex")
                    assign_code = f"""
from ggg import Department, User
da = Department[{dept_a_name!r}]
db = Department[{dept_b_name!r}]
ma = User[{ma_principal!r}]
mb = User[{mb_principal!r}]
errors = []
if da and ma:
    da.members.add(ma)
else:
    errors.append('da/ma: da=' + str(da) + ' ma=' + str(ma))
if db and mb:
    db.members.add(mb)
else:
    errors.append('db/mb: db=' + str(db) + ' mb=' + str(mb))
if errors:
    ic.print('ERROR: ' + '; '.join(errors))
else:
    ic.print('members_assigned ok')
"""
                    r_assign = _codex(f"mp_assign_{run_id}", assign_code)
                    sc.check("init_warning" not in r_assign, "Member→dept assignments ran without error")

                    # ----------------------------------------------------------
                    # Case 1: user → user (private)
                    # member_a → member_b (private): only member_b sees it
                    # ----------------------------------------------------------
                    sc.step("Case 1: user→user private message")
                    n1_id = _send(member_a, {
                        "title": "Private DM",
                        "message": f"Hello member_b from member_a [{run_id}]",
                        "audience_type": "user",
                        "user_id": mb_principal,
                        "visibility": "private",
                    })
                    sc.check(bool(n1_id), "user→user private notification created")

                    mb_ids = _notif_ids(member_b)
                    sc.check(n1_id in mb_ids, "member_b sees user→user private notification")

                    admin_ids = _notif_ids(admin_a)
                    sc.check(n1_id not in admin_ids, "admin_a does NOT see user→user private notification")

                    out_ids = _notif_ids(outsider)
                    sc.check(n1_id not in out_ids, "outsider does NOT see user→user private notification")

                    # ----------------------------------------------------------
                    # Case 2: user → department (private)
                    # member_b → dept_a: only dept_a members (member_a) see it
                    # ----------------------------------------------------------
                    sc.step("Case 2: user→dept_a private message")
                    n2_id = _send(member_b, {
                        "title": "Message to Dept A",
                        "message": f"Hello dept_a from member_b [{run_id}]",
                        "audience_type": "department",
                        "department": dept_a_name,
                        "visibility": "private",
                    })
                    sc.check(bool(n2_id), "user→dept_a private notification created")

                    ma_ids = _notif_ids(member_a)
                    sc.check(n2_id in ma_ids, "member_a (dept_a member) sees user→dept_a notification")

                    mb_ids2 = _notif_ids(member_b)
                    sc.check(n2_id not in mb_ids2, "member_b (not in dept_a) does NOT see dept_a notification")

                    out_ids2 = _notif_ids(outsider)
                    sc.check(n2_id not in out_ids2, "outsider does NOT see dept_a private notification")

                    # ----------------------------------------------------------
                    # Case 3: dept → dept via admin (private)
                    # admin_a → dept_b: only dept_b members (member_b) see it
                    # ----------------------------------------------------------
                    sc.step("Case 3: admin→dept_b private message (dept-to-dept pattern)")
                    n3_id = _send(admin_a, {
                        "title": "Message to Dept B",
                        "message": f"Hello dept_b from admin [{run_id}]",
                        "audience_type": "department",
                        "department": dept_b_name,
                        "visibility": "private",
                    })
                    sc.check(bool(n3_id), "admin→dept_b private notification created")

                    mb_ids3 = _notif_ids(member_b)
                    sc.check(n3_id in mb_ids3, "member_b (dept_b member) sees dept_b notification")

                    ma_ids3 = _notif_ids(member_a)
                    sc.check(n3_id not in ma_ids3, "member_a (not in dept_b) does NOT see dept_b notification")

                    out_ids3 = _notif_ids(outsider)
                    sc.check(n3_id not in out_ids3, "outsider does NOT see dept_b private notification")

                    # ----------------------------------------------------------
                    # Case 4: user → user (public)
                    # Public notifications are visible to all registered users.
                    # ----------------------------------------------------------
                    sc.step("Case 4: user→user public message")
                    n4_id = _send(member_a, {
                        "title": "Public announcement",
                        "message": f"Public message from member_a to member_b [{run_id}]",
                        "audience_type": "user",
                        "user_id": mb_principal,
                        "visibility": "public",
                    })
                    sc.check(bool(n4_id), "user→user public notification created")

                    mb_ids4 = _notif_ids(member_b)
                    sc.check(n4_id in mb_ids4, "member_b (target) sees public notification")

                    ma_ids4 = _notif_ids(member_a)
                    sc.check(n4_id in ma_ids4, "member_a sees public notification (visibility=public)")

                    out_ids4 = _notif_ids(outsider)
                    sc.check(n4_id in out_ids4, "outsider sees public notification (visibility=public)")

                    # ----------------------------------------------------------
                    # Case 5: realm-wide broadcast (public)
                    # Visible to ALL registered users. Only admins may send one.
                    # ----------------------------------------------------------
                    sc.step("Case 5: realm-wide public broadcast")
                    n5_id = _send(admin_a, {
                        "title": "Realm announcement",
                        "message": f"Realm-wide message [{run_id}]",
                        "audience_type": "realm",
                        "visibility": "public",
                    })
                    sc.check(bool(n5_id), "realm-wide notification created")

                    ma_ids5 = _notif_ids(member_a)
                    sc.check(n5_id in ma_ids5, "member_a sees realm-wide notification")

                    mb_ids5 = _notif_ids(member_b)
                    sc.check(n5_id in mb_ids5, "member_b sees realm-wide notification")

                    out_ids5 = _notif_ids(outsider)
                    sc.check(n5_id in out_ids5, "outsider sees realm-wide notification")

                    # ----------------------------------------------------------
                    # Case 6: realm-wide broadcast is admin-only.
                    # This is the check that the old skip_authentication flag
                    # made impossible to write: with authorization disabled a
                    # plain member could broadcast to the whole realm.
                    # ----------------------------------------------------------
                    sc.step("Case 6: non-admin realm-wide broadcast is refused")
                    denied = _send_expecting_denial(member_a, {
                        "title": "Unauthorized broadcast",
                        "message": f"member_a should not be able to send this [{run_id}]",
                        "audience_type": "realm",
                        "visibility": "public",
                    })
                    sc.check(denied, "member_a (non-admin) cannot send a realm-wide broadcast")

    return sc.finish()


if __name__ == "__main__":
    import sys
    sys.exit(run_messaging_privacy())
