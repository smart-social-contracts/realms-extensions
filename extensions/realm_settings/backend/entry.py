"""
Realm Settings Extension Backend Entry Point

Realm settings are managed directly via the backend's update_realm_config
and status endpoints. This extension provides lifecycle stage management
and delegates general settings to the core realm backend.
"""

import json

from ic_python_logging import get_logger

logger = get_logger("extensions.realm_settings")

VALID_STAGES = ["alpha", "beta", "production", "deprecation", "terminated"]
STAGE_ORDER = {stage: i for i, stage in enumerate(VALID_STAGES)}


def _caller() -> str:
    from _cdk import ic

    return ic.caller().to_str()


def _is_realm_admin(principal: str) -> bool:
    """Realm-admin check through the core RBAC (controllers included)."""
    try:
        from core.access import _check_access
        from ggg.system.user_profile import Operations

        return _check_access(principal, Operations.REALM_ADMIN)
    except Exception:
        return False


def _now_seconds() -> int:
    try:
        from _cdk import ic

        t = int(ic.time())
        if t > 0:
            return t // 1_000_000_000
    except Exception:
        pass
    import time

    return int(time.time())


def extension_sync_call(method_name: str, args: dict):
    """Synchronous extension API calls for realm settings."""
    methods = {
        "health": (health, False),
        "get_realm_stage": (get_realm_stage, False),
        "set_realm_stage": (set_realm_stage, True),
        "approve_stage_transition": (approve_stage_transition, True),
        "transfer_root": (transfer_root, True),
        "patch_manifest_data": (patch_manifest_data, True),
        "set_quarter_policy": (set_quarter_policy, True),
        "request_quarter_scale": (request_quarter_scale, True),
    }

    if method_name not in methods:
        return {"success": False, "error": f"Unknown method: {method_name}"}

    function, requires_args = methods[method_name]

    try:
        if requires_args:
            return function(args)
        else:
            return function()
    except Exception as e:
        return {"success": False, "error": f"Error calling {method_name}: {str(e)}"}


def health(args=None):
    """Health check."""
    return {"success": True, "data": {"status": "ok"}}


def get_realm_stage(args=None):
    """Return the current realm lifecycle stage and metadata."""
    from ggg import Realm, User

    try:
        realm = Realm.load("1")
        if not realm:
            return {"success": False, "error": "Realm not found"}

        stage = getattr(realm, "status", "alpha") or "alpha"
        manifest_raw = getattr(realm, "manifest_data", "{}") or "{}"
        try:
            manifest = json.loads(manifest_raw)
        except (json.JSONDecodeError, TypeError):
            manifest = {}

        lifecycle = dict(manifest.get("lifecycle", {}))
        # Deploy/test-time overrides (issue #253): patched into manifest_data
        # via patch_manifest_data, applied over the codex-declared values.
        overrides = manifest.get("lifecycle_overrides", {}) or {}
        if isinstance(overrides, dict):
            lifecycle.update(overrides)
        users_count = User.count()

        return {
            "success": True,
            "data": {
                "stage": stage,
                "stages": VALID_STAGES,
                "stage_index": STAGE_ORDER.get(stage, 0),
                "lifecycle": {
                    "critical_mass": lifecycle.get("critical_mass", 10000),
                    "registered_users": users_count,
                    "deposits_locked": lifecycle.get("deposits_locked", False),
                    "land_acquired": lifecycle.get("land_acquired", False),
                    "infrastructure_ready": lifecycle.get("infrastructure_ready", False),
                    "providers_ready": lifecycle.get("providers_ready", False),
                    "history": lifecycle.get("history", []),
                    # Codex-driven fields consumed by the input-driven public dashboard.
                    "population_target": lifecycle.get("population_target"),
                    "go_live_target": lifecycle.get("go_live_target"),
                    "deposit_label": lifecycle.get("deposit_label"),
                },
                # Presentation config written by the codex (see codices/*/init.py).
                # The public dashboard renders blocks based on this, with a
                # graceful fallback to the default layout when absent.
                "dashboard": manifest.get("dashboard", {}),
                "onboarding": manifest.get("onboarding", {}),
                "departments": manifest.get("departments", []),
            },
        }
    except Exception as e:
        logger.error(f"get_realm_stage error: {e}")
        return {"success": False, "error": str(e)}


def set_realm_stage(args: dict):
    """Advance the realm to a new lifecycle stage.

    Callable by realm admins. After root handover (``transfer_root``) the
    governance-org members hold the admin profile, so lifecycle control
    follows the root organization.

    Gates (issue #253):
      - alpha→beta ``checklist`` mode: readiness checklist must pass (#241).
      - alpha→beta ``auto_milestones`` mode: declared milestones (e.g.
        ``critical_mass``) must be met.
      - beta→production: proving period elapsed + governance vote satisfied
        (approvals recorded via ``approve_stage_transition`` checked against
        the root organization's policy).
    """
    from ggg import Realm

    try:
        if isinstance(args, str):
            try:
                args = json.loads(args)
            except Exception:
                return {"success": False, "error": "args is not valid JSON"}

        realm = Realm.load("1")
        if not realm:
            return {"success": False, "error": "Realm not found"}

        caller = _caller()
        if not _is_realm_admin(caller):
            return {
                "success": False,
                "error": f"Access denied: {caller} is not a realm admin",
            }

        new_stage = args.get("stage", "").strip().lower()
        reason = args.get("reason", "Admin action")

        if new_stage not in VALID_STAGES:
            return {
                "success": False,
                "error": f"Invalid stage '{new_stage}'. Valid stages: {VALID_STAGES}",
            }

        current_stage = getattr(realm, "status", "alpha") or "alpha"
        current_idx = STAGE_ORDER.get(current_stage, 0)
        new_idx = STAGE_ORDER.get(new_stage, 0)

        if new_idx <= current_idx:
            return {
                "success": False,
                "error": f"Cannot move from '{current_stage}' to '{new_stage}'. "
                         f"Stage can only advance forward.",
            }

        if new_idx > current_idx + 1:
            return {
                "success": False,
                "error": f"Cannot skip stages. Current: '{current_stage}', "
                         f"next allowed: '{VALID_STAGES[current_idx + 1]}'.",
            }

        # Hard gates: codex-declared transition modes (issues #241/#253).
        try:
            from core.lifecycle_gate import alpha_to_beta_ready, transition_mode

            mode = transition_mode(realm, current_stage, new_stage)

            if mode == "checklist":
                ready, missing = alpha_to_beta_ready(realm)
                if not ready:
                    return {
                        "success": False,
                        "error": (
                            f"Readiness checklist not passed for {current_stage}→{new_stage}. "
                            f"Missing: {'; '.join(missing)}"
                        ),
                        "checklist_blocked": True,
                        "missing": missing,
                    }
            elif mode == "auto_milestones":
                from core.lifecycle_gate import auto_milestones_ready

                ready, missing = auto_milestones_ready(
                    realm, current_stage, new_stage
                )
                if not ready:
                    return {
                        "success": False,
                        "error": (
                            f"Milestones not met for {current_stage}→{new_stage}. "
                            f"Missing: {'; '.join(missing)}"
                        ),
                        "milestones_blocked": True,
                        "missing": missing,
                    }

            if current_stage == "beta" and new_stage == "production":
                from core.lifecycle_gate import beta_to_production_ready

                ready, missing = beta_to_production_ready(realm)
                if not ready:
                    return {
                        "success": False,
                        "error": (
                            f"beta→production gate not passed. "
                            f"Missing: {'; '.join(missing)}"
                        ),
                        "vote_blocked": True,
                        "missing": missing,
                    }
        except ImportError:
            pass  # older backend without the gate module

        realm.status = new_stage

        manifest_raw = getattr(realm, "manifest_data", "{}") or "{}"
        try:
            manifest = json.loads(manifest_raw)
        except (json.JSONDecodeError, TypeError):
            manifest = {}

        lifecycle = manifest.setdefault("lifecycle", {})
        history = lifecycle.setdefault("history", [])
        history.append({"stage": new_stage, "reason": reason, "at": _now_seconds()})

        if new_stage == "beta":
            lifecycle["deposits_locked"] = True

        # Consumed approvals don't carry over to the next transition.
        lifecycle.pop("stage_approvals", None)

        realm.manifest_data = json.dumps(manifest)

        logger.info(f"Realm stage advanced: {current_stage} -> {new_stage} ({reason})")

        # Let the codex react to the transition (issue #253): e.g. start tax /
        # membership invoicing when the realm enters beta.
        try:
            from core.codex_hooks import call_hook

            call_hook(
                "on_stage_change",
                {"from_stage": current_stage, "to_stage": new_stage},
            )
        except Exception as e:
            logger.warning(f"on_stage_change codex hook failed: {e}")

        return {
            "success": True,
            "data": {
                "previous_stage": current_stage,
                "new_stage": new_stage,
                "reason": reason,
            },
        }
    except Exception as e:
        logger.error(f"set_realm_stage error: {e}")
        return {"success": False, "error": str(e)}


def approve_stage_transition(args: dict):
    """Record the caller's approval for an upcoming stage transition.

    Only members of the root (governance) organization may approve — this is
    the "Congress votes to go live" mechanism (issue #253). Approvals are
    stored in ``manifest_data.lifecycle.stage_approvals.<stage>`` and are
    checked against the root organization's policy by ``set_realm_stage``.

    Args: {"stage": "production", "approve": true}
    """
    from ggg import Realm

    try:
        if isinstance(args, str):
            try:
                args = json.loads(args)
            except Exception:
                return {"success": False, "error": "args is not valid JSON"}

        realm = Realm.load("1")
        if not realm:
            return {"success": False, "error": "Realm not found"}

        stage = (args.get("stage") or "").strip().lower()
        approve = bool(args.get("approve", True))
        if stage not in VALID_STAGES:
            return {
                "success": False,
                "error": f"Invalid stage '{stage}'. Valid stages: {VALID_STAGES}",
            }

        caller = _caller()

        # Only root-org (governance authority) members can vote.
        from ggg import Department, ROOT_ORG_NAME

        root = next(
            (
                d for d in Department.instances()
                if getattr(d, "is_root", False) or d.name == ROOT_ORG_NAME
            ),
            None,
        )
        if root is None:
            return {"success": False, "error": "Root organization not found"}

        from core.membership import department_member_principals

        eligible = department_member_principals(root)
        if caller not in eligible:
            return {
                "success": False,
                "error": (
                    f"Access denied: {caller} is not a member of the "
                    f"governance (root) organization"
                ),
            }

        manifest_raw = getattr(realm, "manifest_data", "{}") or "{}"
        try:
            manifest = json.loads(manifest_raw)
        except (json.JSONDecodeError, TypeError):
            manifest = {}

        lifecycle = manifest.setdefault("lifecycle", {})
        approvals_by_stage = lifecycle.setdefault("stage_approvals", {})
        approvals = approvals_by_stage.setdefault(stage, [])

        if approve and caller not in approvals:
            approvals.append(caller)
        elif not approve and caller in approvals:
            approvals.remove(caller)

        realm.manifest_data = json.dumps(manifest)

        logger.info(
            f"Stage-transition vote: {caller} "
            f"{'approved' if approve else 'withdrew approval for'} '{stage}' "
            f"({len(approvals)} of {len(eligible)} eligible)"
        )

        return {
            "success": True,
            "data": {
                "stage": stage,
                "approvals": list(approvals),
                "eligible": eligible,
            },
        }
    except Exception as e:
        logger.error(f"approve_stage_transition error: {e}")
        return {"success": False, "error": str(e)}


def transfer_root(args: dict):
    """Hand root over to a governance organization (issue #253).

    The creator (a realm admin) transfers all root permissions to the target
    organization — typically **Congress**. Effects:

      1. Every member of the target org joins the root organization and is
         granted the ``admin`` profile (full permissions follow the org).
      2. The root org's head becomes the target org's head (or its first
         member).
      3. The caller is demoted: ``admin`` profile revoked, ``member`` profile
         ensured, removed from the root org. From this point the creator has
         no elevated permissions.

    Args: {"target_org": "Congress"}
    Irreversible from the creator's side — only the governance org (whose
    members now hold admin) could re-grant anything.
    """
    from ggg import Realm

    try:
        if isinstance(args, str):
            try:
                args = json.loads(args)
            except Exception:
                return {"success": False, "error": "args is not valid JSON"}

        realm = Realm.load("1")
        if not realm:
            return {"success": False, "error": "Realm not found"}

        caller = _caller()
        if not _is_realm_admin(caller):
            return {
                "success": False,
                "error": f"Access denied: {caller} is not a realm admin",
            }

        target_name = (args.get("target_org") or "Congress").strip()
        from ggg import Department, ROOT_ORG_NAME, User, UserProfile

        target = Department[target_name]
        if not target:
            return {
                "success": False,
                "error": f"Organization '{target_name}' not found",
            }
        if getattr(target, "is_root", False) or target.name == ROOT_ORG_NAME:
            return {
                "success": False,
                "error": "Target organization is already the root organization",
            }

        from core.membership import (
            add_department_member,
            department_members,
            remove_department_member,
            user_in_department,
        )

        members = department_members(target)
        successors = [m for m in members if str(getattr(m, "id", "")) != caller]
        if not successors:
            return {
                "success": False,
                "error": (
                    f"Organization '{target_name}' has no members besides the "
                    f"caller — transferring root would leave the realm without "
                    f"a governing authority"
                ),
            }

        try:
            from core.org_policy import ensure_root_org

            root = ensure_root_org()
        except Exception as e:
            return {"success": False, "error": f"Root organization unavailable: {e}"}

        admin_profile = UserProfile["admin"]
        member_profile = UserProfile["member"]
        if admin_profile is None:
            return {"success": False, "error": "admin profile not found"}

        # 1. Governance-org members join root and receive full permissions.
        promoted = []
        for m in successors:
            add_department_member(root, m)
            if admin_profile not in m.profiles:
                m.profiles.add(admin_profile)
            promoted.append(str(getattr(m, "id", "")))

        # 2. Root org head follows the governance org.
        new_head = getattr(target, "head", None) or successors[0]
        root.head = new_head

        # 3. Demote the caller: no admin profile, no root-org membership.
        creator = User[caller]
        if creator is not None:
            if admin_profile in creator.profiles:
                creator.profiles.remove(admin_profile)
            if member_profile is not None and member_profile not in creator.profiles:
                creator.profiles.add(member_profile)
            if user_in_department(creator, root):
                remove_department_member(root, creator)
            if getattr(root, "head", None) is not None and (
                str(getattr(root.head, "id", "")) == caller
            ):
                root.head = new_head

        # Record the handover in the lifecycle history.
        manifest_raw = getattr(realm, "manifest_data", "{}") or "{}"
        try:
            manifest = json.loads(manifest_raw)
        except (json.JSONDecodeError, TypeError):
            manifest = {}
        lifecycle = manifest.setdefault("lifecycle", {})
        lifecycle["root_transferred_to"] = target_name
        lifecycle["root_transfer_at"] = _now_seconds()
        history = lifecycle.setdefault("history", [])
        history.append({
            "event": "root_transfer",
            "to": target_name,
            "by": caller,
            "at": _now_seconds(),
        })
        realm.manifest_data = json.dumps(manifest)

        logger.info(
            f"Root transferred to '{target_name}' by {caller}: "
            f"{len(promoted)} member(s) promoted, creator demoted"
        )

        return {
            "success": True,
            "data": {
                "target_org": target_name,
                "promoted": promoted,
                "demoted": caller,
                "root_head": str(getattr(new_head, "id", "")),
            },
        }
    except Exception as e:
        logger.error(f"transfer_root error: {e}")
        return {"success": False, "error": str(e)}


def set_quarter_policy(args: dict):
    """Enable/disable the realm's quarter auto-scaling. Admin only.

    Args (JSON): {"auto_scale_enabled": bool}

    Toggles ``Realm.auto_scale_enabled`` (issue #156). When disabled, new user
    registrations no longer set the ``scale_in_flight`` guard, so the federation
    stops requesting new quarters. Writing the realm field directly mirrors how
    ``set_realm_stage`` updates ``Realm.status``; access is gated by the
    extension's ``admin`` profile/permission.
    """
    from ggg import Realm

    try:
        if isinstance(args, str):
            try:
                args = json.loads(args)
            except Exception:
                return {"success": False, "error": "args is not valid JSON"}

        realm = Realm.load("1")
        if not realm:
            return {"success": False, "error": "Realm not found"}

        if "auto_scale_enabled" not in args:
            return {"success": False, "error": "auto_scale_enabled is required"}

        enabled = bool(args.get("auto_scale_enabled"))
        realm.auto_scale_enabled = enabled
        logger.info(f"Quarter auto-scaling set to {enabled}")

        return {
            "success": True,
            "data": {"auto_scale_enabled": enabled},
        }
    except Exception as e:
        logger.error(f"set_quarter_policy error: {e}")
        return {"success": False, "error": str(e)}


def request_quarter_scale(args: dict):
    """Manually queue a quarter scale-out. Admin only.

    Sets the idempotent ``scale_in_flight`` flag on the Realm so the existing
    ``process_quarter_scaling`` flow (the "Provision queued quarter" action)
    can perform the Casals provisioning. This is the explicit-admin counterpart
    to the automatic trigger that runs on new user registration: on a realm that
    was already populated before auto-scaling shipped, the automatic hook never
    fired, so an admin can request a shard on demand here.
    """
    from ggg import Realm

    try:
        realm = Realm.load("1")
        if not realm:
            return {"success": False, "error": "Realm not found"}

        if bool(getattr(realm, "scale_in_flight", False)):
            return {
                "success": True,
                "data": {"scale_in_flight": True, "already_pending": True},
            }

        realm.scale_in_flight = True
        try:
            from _cdk import ic

            realm.scale_requested_at = str(int(ic.time()))
        except Exception:
            pass
        logger.info("Quarter scale manually requested by admin")

        return {
            "success": True,
            "data": {"scale_in_flight": True, "already_pending": False},
        }
    except Exception as e:
        logger.error(f"request_quarter_scale error: {e}")
        return {"success": False, "error": str(e)}


def patch_manifest_data(args: dict):
    """Merge top-level keys into Realm.manifest_data. Admin only.

    Args (JSON): {"fields": {"dashboard": {...}, "onboarding": {...}, ...}}
    This is used to bootstrap codex-driven config when the codex is too large
    to reinstall in a single IC message (instruction-limit workaround).
    """
    from ggg import Realm

    try:
        realm = Realm.load("1")
        if not realm:
            return {"success": False, "error": "Realm not found"}

        caller = _caller()
        if not _is_realm_admin(caller):
            return {
                "success": False,
                "error": f"Access denied: {caller} is not a realm admin",
            }

        # args may arrive as a raw JSON string (direct dfx call) or parsed dict
        if isinstance(args, str):
            try:
                args = json.loads(args)
            except Exception:
                return {"success": False, "error": "args is not valid JSON"}

        fields = args.get("fields", {})
        if not fields:
            return {"success": False, "error": "fields is required"}

        manifest_raw = getattr(realm, "manifest_data", "{}") or "{}"
        try:
            manifest = json.loads(manifest_raw)
        except (json.JSONDecodeError, TypeError):
            manifest = {}

        manifest.update(fields)

        serialized = json.dumps(manifest)
        if len(serialized) > 4096:
            return {
                "success": False,
                "error": f"manifest_data would exceed 4096 chars ({len(serialized)})",
            }

        realm.manifest_data = serialized
        logger.info(f"patch_manifest_data: updated keys {list(fields.keys())}")

        return {
            "success": True,
            "data": {"updated_keys": list(fields.keys()), "manifest_size": len(serialized)},
        }
    except Exception as e:
        logger.error(f"patch_manifest_data error: {e}")
        return {"success": False, "error": str(e)}
