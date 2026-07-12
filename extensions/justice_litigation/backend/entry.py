"""
Justice Litigation extension entry point

Redesigned to use the modular GGG Justice System entities:
- JusticeSystem, Court, Judge, Case, Verdict, Penalty, Appeal, License

Cross-quarter model
-------------------
Cross-quarter cases live on the plaintiff's quarter.
defendant_quarter_id is the home canister of the defendant.

When defendant_quarter_id is supplied and differs from the current canister's
ID the case is tagged ``scope_tag = "cross_quarter"`` in its metadata.
Penalty execution against a cross-quarter defendant requires a separate
inter-canister call to that quarter; this is currently stubbed with a TODO.
"""

import json
import traceback
from datetime import datetime
from typing import Any, Dict, List, Optional

from ggg import (
    JusticeSystem,
    JusticeSystemType,
    Court,
    CourtLevel,
    Judge,
    Case,
    CaseStatus,
    Verdict,
    Penalty,
    PenaltyType,
    Appeal,
    AppealStatus,
    License,
    LicenseType,
    User,
    Member,
    Department,
    case_file,
    case_assign_judges,
    case_issue_verdict,
    penalty_execute,
    penalty_waive,
    appeal_file,
    appeal_decide,
)
from ic_python_logging import get_logger

logger = get_logger("extensions.justice_litigation")

try:
    from _cdk import ic as _ic
except ImportError:  # unit-test / non-canister context
    _ic = None

# The department whose members may read every litigation (alongside the
# submitter). A litigation is private by default and shared only with the
# submitter and this department. Configurable by renaming the realm's
# Department; falls back to realm administrators when it is not seeded yet.
JUSTICE_DEPARTMENT_NAME = "Justice"


# ============================================================================
# Self-contained encrypted storage + sharing policy (no host edits needed)
# ============================================================================
#
# This extension owns everything it needs for end-to-end-encrypted, private
# litigations:
#   1. its OWN entity for the opaque ciphertext (LitigationContent), and
#   2. its OWN sharing-scope policy (the `litigation:` scope kind),
# both registered into the host's generic facilities at load/init time. The
# host's crypto endpoints and the Case entity are reused unchanged.

from ic_python_db import String  # noqa: E402
from core.extensions import create_extension_entity_class  # noqa: E402
from core.crypto_scopes import scope_kind, ScopeAuthContext  # noqa: E402

ExtensionEntity = create_extension_entity_class("justice_litigation")


class LitigationContent(ExtensionEntity):
    """Encrypted title/description for a private litigation.

    Stored namespaced as ``ext_justice_litigation::LitigationContent``. The
    ``ciphertext`` is an opaque AES-GCM ``enc:v=2:...`` blob (the canister never
    sees plaintext, the DEK, or any vetKey). Read access is governed by
    KeyEnvelope records at ``scope`` (``litigation:<dept>:<submitter>:<case_id>``).
    Keyed by the host ``Case`` id so the public Case record stays unchanged.
    """

    __alias__ = "case_id"
    case_id = String(max_length=64)
    ciphertext = String()
    scope = String(max_length=512)
    created_by = String(max_length=128)


def register_entities():
    """Register this extension's entity types (called by the host at init)."""
    from ic_python_db import Database

    Database.get_instance().register_entity_type(LitigationContent)


@scope_kind("litigation")
def _manage_litigation_scope(parts, caller, ctx: ScopeAuthContext) -> bool:
    """``litigation:<department>:<submitter>:<case_id>``.

    A litigation is private by default: only its *submitter* and the justice
    *department* may read it. Managing read access (grant/revoke) is allowed
    for the submitter (``parts[2]``), the justice department head (``parts[1]``),
    or a realm admin. Department *members* are recipients, not managers.
    """
    if len(parts) < 4 or not parts[1] or not parts[2]:
        return False
    department, submitter = parts[1], parts[2]
    return (
        caller == submitter
        or ctx.is_realm_admin(caller)
        or ctx.is_department_head(department, caller)
    )


def _litigation_content(case_id: str):
    """Return the LitigationContent for a case id, or None."""
    try:
        return LitigationContent[str(case_id)]
    except Exception:
        return None


# ============================================================================
# Privacy helpers — caller identity, justice-department resolution, read auth
# ============================================================================

def _caller_principal() -> str:
    """The authenticated caller's principal (never trust a client-supplied one)."""
    if _ic is not None:
        try:
            return _ic.caller().to_str()
        except Exception:
            pass
    return ""


def _auth_ctx():
    """Reuse the realm's pluggable scope-authorization context."""
    from core.crypto_scopes import production_context

    return production_context()


def _is_realm_admin(caller: str) -> bool:
    if not caller:
        return False
    try:
        return _auth_ctx().is_realm_admin(caller)
    except Exception:
        return False


def _is_justice_head(caller: str) -> bool:
    if not caller:
        return False
    try:
        return _auth_ctx().is_department_head(JUSTICE_DEPARTMENT_NAME, caller)
    except Exception:
        return False


def _justice_member_principals() -> List[str]:
    """Principals that make up the justice department (members + head).

    These are the recipients (besides the submitter) for whom a litigation's
    data-encryption key is IBE-wrapped, so they can decrypt it. When no
    ``Justice`` department has been seeded yet, fall back to the realm
    administrators (the ``member_data_readers`` crypto group) so the feature
    still works out of the box.
    """
    principals: List[str] = []
    try:
        from ggg import Department

        dept = None
        try:
            dept = Department[JUSTICE_DEPARTMENT_NAME]
        except Exception:
            dept = None
        if dept is not None:
            try:
                from core.membership import department_member_principals

                principals = department_member_principals(dept, include_head=True)
            except Exception:
                pass
    except Exception as e:
        logger.warning(f"_justice_member_principals: {e}")

    if not principals:
        try:
            from api.crypto import group_members

            res = group_members("member_data_readers")
            for m in res.get("members", []):
                pid = m.get("principal")
                if pid and pid not in principals:
                    principals.append(pid)
        except Exception as e:
            logger.warning(f"_justice_member_principals admin fallback: {e}")

    return principals


def _is_justice_member(caller: str) -> bool:
    """Forward membership check (cheap) with the admin-group fallback of
    ``_justice_member_principals`` when no Justice department exists."""
    if not caller:
        return False
    try:
        from core.membership import user_in_department
        from ggg import Department, User

        dept = Department[JUSTICE_DEPARTMENT_NAME]
        if dept is not None:
            head = getattr(dept, "head", None)
            if head is not None and getattr(head, "id", None) == caller:
                return True
            return user_in_department(User[caller], dept)
    except Exception:
        pass
    return caller in _justice_member_principals()


def _case_submitter(case: "Case") -> str:
    plaintiff = getattr(case, "plaintiff", None)
    return str(plaintiff._id) if plaintiff else ""


def _can_view_case(case: "Case", caller: str) -> bool:
    """Who may *see* a litigation: its submitter, the justice department, or an
    admin. (The defendant is intentionally NOT granted access.)"""
    if not caller:
        return False
    if _is_realm_admin(caller) or _is_justice_member(caller):
        return True
    return _case_submitter(case) == caller


def _can_manage_case(case: "Case", caller: str) -> bool:
    """Who may set a litigation's ciphertext / manage its sharing: the
    submitter, the justice department head, or a realm admin."""
    if not caller:
        return False
    return (
        _is_realm_admin(caller)
        or _is_justice_head(caller)
        or _case_submitter(case) == caller
    )


# ============================================================================
# Helper Functions - Entity to Dict Converters
# ============================================================================

def _court_to_dict(court: Court) -> Dict[str, Any]:
    """Convert Court entity to dictionary format"""
    return {
        "id": court._id,
        "name": court.name,
        "description": court.description or "",
        "jurisdiction": court.jurisdiction or "",
        "level": court.level or "",
        "status": court.status or "",
        "justice_system_id": court.justice_system._id if court.justice_system else None,
        "justice_system_name": court.justice_system.name if court.justice_system else None,
        "license_valid": court.license.is_valid() if court.license else False,
        "case_count": len(list(court.cases)) if hasattr(court, 'cases') else 0,
        "judge_count": len(list(court.judges)) if hasattr(court, 'judges') else 0,
    }


def _judge_to_dict(judge: Judge) -> Dict[str, Any]:
    """Convert Judge entity to dictionary format"""
    return {
        "id": judge._id,
        "appointment_date": judge.appointment_date or "",
        "status": judge.status or "",
        "specialization": judge.specialization or "",
        "court_id": judge.court._id if judge.court else None,
        "court_name": judge.court.name if judge.court else None,
        "member_id": judge.member._id if judge.member else None,
        "is_active": judge.is_active(),
        "case_count": len(list(judge.cases_assigned)) if hasattr(judge, 'cases_assigned') else 0,
    }


def _case_to_dict(case: Case) -> Dict[str, Any]:
    """Convert Case entity to dictionary format"""
    judges = list(case.judges) if hasattr(case, 'judges') else []
    verdicts = list(case.verdicts) if hasattr(case, 'verdicts') else []
    appeals = list(case.appeals) if hasattr(case, 'appeals') else []
    
    return {
        "id": case._id,
        "case_number": case.case_number or "",
        "title": case.title or "",
        "description": case.description or "",
        "status": case.status or "",
        "filed_date": case.filed_date or "",
        "closed_date": case.closed_date or "",
        "court_id": case.court._id if case.court else None,
        "court_name": case.court.name if case.court else None,
        "plaintiff_id": case.plaintiff._id if case.plaintiff else None,
        "defendant_id": case.defendant._id if case.defendant else None,
        "judges": [{"id": j._id, "specialization": j.specialization} for j in judges],
        "verdict_count": len(verdicts),
        "appeal_count": len(appeals),
        "has_verdict": len(verdicts) > 0,
        "has_appeal": len(appeals) > 0,
    }


def _verdict_to_dict(verdict: Verdict) -> Dict[str, Any]:
    """Convert Verdict entity to dictionary format"""
    penalties = list(verdict.penalties) if hasattr(verdict, 'penalties') else []
    
    return {
        "id": verdict._id,
        "decision": verdict.decision or "",
        "reasoning": verdict.reasoning or "",
        "issued_date": verdict.issued_date or "",
        "case_id": verdict.case._id if verdict.case else None,
        "case_number": verdict.case.case_number if verdict.case else None,
        "issued_by_id": verdict.issued_by._id if verdict.issued_by else None,
        "penalties": [_penalty_to_dict(p) for p in penalties],
        "penalty_count": len(penalties),
    }


def _penalty_to_dict(penalty: Penalty) -> Dict[str, Any]:
    """Convert Penalty entity to dictionary format"""
    return {
        "id": penalty._id,
        "penalty_type": penalty.penalty_type or "",
        "amount": penalty.amount or 0,
        "currency": penalty.currency or "",
        "description": penalty.description or "",
        "status": penalty.status or "",
        "due_date": penalty.due_date or "",
        "executed_date": penalty.executed_date or "",
        "target_user_id": penalty.target_user._id if penalty.target_user else None,
        "verdict_id": penalty.verdict._id if penalty.verdict else None,
    }


def _appeal_to_dict(appeal: Appeal) -> Dict[str, Any]:
    """Convert Appeal entity to dictionary format"""
    return {
        "id": appeal._id,
        "grounds": appeal.grounds or "",
        "status": appeal.status or "",
        "filed_date": appeal.filed_date or "",
        "decision_date": appeal.decision_date or "",
        "decision": appeal.decision or "",
        "original_case_id": appeal.original_case._id if appeal.original_case else None,
        "original_case_number": appeal.original_case.case_number if appeal.original_case else None,
        "original_verdict_id": appeal.original_verdict._id if appeal.original_verdict else None,
        "appellate_court_id": appeal.appellate_court._id if appeal.appellate_court else None,
        "appellate_court_name": appeal.appellate_court.name if appeal.appellate_court else None,
        "appellant_id": appeal.appellant._id if appeal.appellant else None,
    }


def _justice_system_to_dict(js: JusticeSystem) -> Dict[str, Any]:
    """Convert JusticeSystem entity to dictionary format"""
    courts = list(js.courts) if hasattr(js, 'courts') else []
    
    return {
        "id": js._id,
        "name": js.name or "",
        "description": js.description or "",
        "system_type": js.system_type or "",
        "status": js.status or "",
        "court_count": len(courts),
    }


# ============================================================================
# Entry Points - Courts
# ============================================================================

def get_courts(args: str) -> str:
    """Get list of courts with optional filtering"""
    logger.info(f"justice_litigation.get_courts called with args: {args}")
    
    try:
        params = json.loads(args) if args else {}
        
        justice_system_id = params.get("justice_system_id")
        status = params.get("status")
        level = params.get("level")
        
        courts = list(Court.instances())
        
        # Apply filters
        if justice_system_id:
            courts = [c for c in courts if c.justice_system and c.justice_system._id == justice_system_id]
        if status:
            courts = [c for c in courts if c.status == status]
        if level:
            courts = [c for c in courts if c.level == level]
        
        return json.dumps({
            "success": True,
            "data": {
                "courts": [_court_to_dict(c) for c in courts],
                "total_count": len(courts),
            }
        })
        
    except Exception as e:
        logger.error(f"Error in get_courts: {str(e)}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def get_justice_systems(args: str) -> str:
    """Get list of justice systems"""
    logger.info(f"justice_litigation.get_justice_systems called with args: {args}")
    
    try:
        params = json.loads(args) if args else {}
        system_type = params.get("system_type")
        
        systems = list(JusticeSystem.instances())
        
        if system_type:
            systems = [s for s in systems if s.system_type == system_type]
        
        return json.dumps({
            "success": True,
            "data": {
                "justice_systems": [_justice_system_to_dict(s) for s in systems],
                "total_count": len(systems),
            }
        })
        
    except Exception as e:
        logger.error(f"Error in get_justice_systems: {str(e)}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


# ============================================================================
# Entry Points - Judges
# ============================================================================

def get_judges(args: str) -> str:
    """Get list of judges with optional filtering"""
    logger.info(f"justice_litigation.get_judges called with args: {args}")
    
    try:
        params = json.loads(args) if args else {}
        
        court_id = params.get("court_id")
        status = params.get("status")
        specialization = params.get("specialization")
        
        judges = list(Judge.instances())
        
        # Apply filters
        if court_id:
            judges = [j for j in judges if j.court and j.court._id == court_id]
        if status:
            judges = [j for j in judges if j.status == status]
        if specialization:
            judges = [j for j in judges if j.specialization and specialization.lower() in j.specialization.lower()]
        
        return json.dumps({
            "success": True,
            "data": {
                "judges": [_judge_to_dict(j) for j in judges],
                "total_count": len(judges),
            }
        })
        
    except Exception as e:
        logger.error(f"Error in get_judges: {str(e)}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


# ============================================================================
# Entry Points - Cases
# ============================================================================

def get_cases(args: str) -> str:
    """Get list of cases with optional filtering"""
    logger.info(f"justice_litigation.get_cases called with args: {args}")
    
    try:
        params = json.loads(args) if args else {}
        
        court_id = params.get("court_id")
        status = params.get("status")
        plaintiff_id = params.get("plaintiff_id")
        defendant_id = params.get("defendant_id")
        user_id = params.get("user_id")  # Cases where user is plaintiff OR defendant
        
        cases = list(Case.instances())
        
        # Apply filters
        if court_id:
            cases = [c for c in cases if c.court and c.court._id == court_id]
        if status:
            cases = [c for c in cases if c.status == status]
        if plaintiff_id:
            cases = [c for c in cases if c.plaintiff and c.plaintiff._id == plaintiff_id]
        if defendant_id:
            cases = [c for c in cases if c.defendant and c.defendant._id == defendant_id]
        if user_id:
            cases = [c for c in cases if 
                     (c.plaintiff and c.plaintiff._id == user_id) or 
                     (c.defendant and c.defendant._id == user_id)]
        
        return json.dumps({
            "success": True,
            "data": {
                "cases": [_case_to_dict(c) for c in cases],
                "total_count": len(cases),
            }
        })
        
    except Exception as e:
        logger.error(f"Error in get_cases: {str(e)}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def get_case(args: str) -> str:
    """Get a single case with full details including verdicts and appeals"""
    logger.info(f"justice_litigation.get_case called with args: {args}")
    
    try:
        params = json.loads(args) if args else {}
        case_id = params.get("case_id")
        
        if not case_id:
            return json.dumps({"success": False, "error": "case_id is required"})
        
        # Try to find by ID first, then by case_number
        case = None
        try:
            case = Case[case_id]
        except (KeyError, Exception):
            pass
        
        # If not found by ID, search by case_number
        if not case:
            cases = Case.find({"case_number": case_id})
            case = cases[0] if cases else None
        
        if not case:
            return json.dumps({"success": False, "error": f"Case {case_id} not found"})
        
        # Get full details
        case_data = _case_to_dict(case)
        
        # Add verdicts
        verdicts = list(case.verdicts) if hasattr(case, 'verdicts') else []
        case_data["verdicts"] = [_verdict_to_dict(v) for v in verdicts]
        
        # Add appeals
        appeals = list(case.appeals) if hasattr(case, 'appeals') else []
        case_data["appeals"] = [_appeal_to_dict(a) for a in appeals]
        
        return json.dumps({
            "success": True,
            "data": {"case": case_data}
        })
        
    except Exception as e:
        logger.error(f"Error in get_case: {str(e)}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def file_case(args: str) -> str:
    """File a new case"""
    logger.info(f"justice_litigation.file_case called with args: {args}")
    
    try:
        params = json.loads(args) if args else {}
        
        court_id = params.get("court_id")
        plaintiff_id = params.get("plaintiff_id")
        defendant_id = params.get("defendant_id")
        title = params.get("title")
        description = params.get("description", "")
        
        if not all([court_id, plaintiff_id, defendant_id, title]):
            return json.dumps({
                "success": False,
                "error": "court_id, plaintiff_id, defendant_id, and title are required"
            })
        
        # Find entities
        court = Court[court_id]
        if not court:
            return json.dumps({"success": False, "error": f"Court {court_id} not found"})
        
        plaintiff = User[plaintiff_id]
        if not plaintiff:
            return json.dumps({"success": False, "error": f"Plaintiff user {plaintiff_id} not found"})
        
        defendant = User[defendant_id]
        if not defendant:
            return json.dumps({"success": False, "error": f"Defendant user {defendant_id} not found"})
        
        # File the case using GGG function
        new_case = case_file(
            court=court,
            plaintiff=plaintiff,
            defendant=defendant,
            title=title,
            description=description
        )
        
        return json.dumps({
            "success": True,
            "data": {
                "case": _case_to_dict(new_case),
                "message": f"Case {new_case.case_number} filed successfully"
            }
        })
        
    except ValueError as e:
        logger.warning(f"Validation error in file_case: {str(e)}")
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"Error in file_case: {str(e)}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def assign_judge(args: str) -> str:
    """Assign a judge to a case"""
    logger.info(f"justice_litigation.assign_judge called with args: {args}")
    
    try:
        params = json.loads(args) if args else {}
        
        case_id = params.get("case_id")
        judge_id = params.get("judge_id")
        
        if not all([case_id, judge_id]):
            return json.dumps({
                "success": False,
                "error": "case_id and judge_id are required"
            })
        
        case = Case[case_id]
        if not case:
            return json.dumps({"success": False, "error": f"Case {case_id} not found"})
        
        judge = Judge[judge_id]
        if not judge:
            return json.dumps({"success": False, "error": f"Judge {judge_id} not found"})
        
        # Assign judge using GGG function
        updated_case = case_assign_judges(case=case, judges=[judge])
        
        return json.dumps({
            "success": True,
            "data": {
                "case": _case_to_dict(updated_case),
                "message": f"Judge {judge_id} assigned to case {case.case_number}"
            }
        })
        
    except ValueError as e:
        logger.warning(f"Validation error in assign_judge: {str(e)}")
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"Error in assign_judge: {str(e)}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


# ============================================================================
# Entry Points - Verdicts
# ============================================================================

def get_verdicts(args: str) -> str:
    """Get list of verdicts with optional filtering"""
    logger.info(f"justice_litigation.get_verdicts called with args: {args}")
    
    try:
        params = json.loads(args) if args else {}
        case_id = params.get("case_id")
        
        verdicts = list(Verdict.instances())
        
        if case_id:
            verdicts = [v for v in verdicts if v.case and v.case._id == case_id]
        
        return json.dumps({
            "success": True,
            "data": {
                "verdicts": [_verdict_to_dict(v) for v in verdicts],
                "total_count": len(verdicts),
            }
        })
        
    except Exception as e:
        logger.error(f"Error in get_verdicts: {str(e)}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def issue_verdict(args: str) -> str:
    """Issue a verdict for a case"""
    logger.info(f"justice_litigation.issue_verdict called with args: {args}")
    
    try:
        params = json.loads(args) if args else {}
        
        case_id = params.get("case_id")
        judge_id = params.get("judge_id")
        decision = params.get("decision")
        reasoning = params.get("reasoning", "")
        penalties = params.get("penalties", [])  # List of {type, amount, currency, description, target_user_id}
        
        if not all([case_id, judge_id, decision]):
            return json.dumps({
                "success": False,
                "error": "case_id, judge_id, and decision are required"
            })
        
        case = Case[case_id]
        if not case:
            return json.dumps({"success": False, "error": f"Case {case_id} not found"})
        
        judge = Judge[judge_id]
        if not judge:
            return json.dumps({"success": False, "error": f"Judge {judge_id} not found"})
        
        # Build penalty list
        penalty_list = []
        for p in penalties:
            target_user = User[p.get("target_user_id")] if p.get("target_user_id") else None
            penalty_list.append({
                "penalty_type": p.get("type", PenaltyType.FINE),
                "amount": p.get("amount", 0),
                "currency": p.get("currency", "ckBTC"),
                "description": p.get("description", ""),
                "target_user": target_user,
            })
        
        # Warn if this is a cross-quarter case — penalty execution will need an
        # inter-canister call to the defendant's home quarter.
        try:
            case_meta = json.loads(case.metadata) if case.metadata else {}
        except (ValueError, TypeError):
            case_meta = {}
        _dq_id = case_meta.get("defendant_quarter_id", "")
        if _dq_id:
            logger.warning(
                f"issue_verdict: case {case.case_number} is cross-quarter "
                f"(defendant_quarter_id={_dq_id}). "
                # TODO: cross-quarter call to defendant_quarter_id
                "Penalty execution against the remote quarter is not yet implemented."
            )

        # Issue verdict using GGG function (judge already assigned via assign_judge)
        verdict = case_issue_verdict(
            case=case,
            decision=decision,
            reasoning=reasoning,
            penalties=penalty_list
        )

        return json.dumps({
            "success": True,
            "data": {
                "verdict": _verdict_to_dict(verdict),
                "message": f"Verdict issued for case {case.case_number}"
            }
        })

    except ValueError as e:
        logger.warning(f"Validation error in issue_verdict: {str(e)}")
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"Error in issue_verdict: {str(e)}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


# ============================================================================
# Entry Points - Penalties
# ============================================================================

def get_penalties(args: str) -> str:
    """Get list of penalties with optional filtering"""
    logger.info(f"justice_litigation.get_penalties called with args: {args}")
    
    try:
        params = json.loads(args) if args else {}
        
        verdict_id = params.get("verdict_id")
        target_user_id = params.get("target_user_id")
        status = params.get("status")
        
        penalties = list(Penalty.instances())
        
        if verdict_id:
            penalties = [p for p in penalties if p.verdict and p.verdict._id == verdict_id]
        if target_user_id:
            penalties = [p for p in penalties if p.target_user and p.target_user._id == target_user_id]
        if status:
            penalties = [p for p in penalties if p.status == status]
        
        return json.dumps({
            "success": True,
            "data": {
                "penalties": [_penalty_to_dict(p) for p in penalties],
                "total_count": len(penalties),
            }
        })
        
    except Exception as e:
        logger.error(f"Error in get_penalties: {str(e)}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def execute_penalty(args: str) -> str:
    """Execute a penalty"""
    logger.info(f"justice_litigation.execute_penalty called with args: {args}")
    
    try:
        params = json.loads(args) if args else {}
        
        penalty_id = params.get("penalty_id")
        executor_id = params.get("executor_id")
        
        if not penalty_id:
            return json.dumps({"success": False, "error": "penalty_id is required"})
        
        penalty = Penalty[penalty_id]
        if not penalty:
            return json.dumps({"success": False, "error": f"Penalty {penalty_id} not found"})

        # Check whether the associated case is cross-quarter and warn accordingly.
        try:
            _case_for_penalty = penalty.verdict.case if (penalty.verdict and penalty.verdict.case) else None
            if _case_for_penalty:
                _pm = json.loads(_case_for_penalty.metadata) if _case_for_penalty.metadata else {}
                _dq = _pm.get("defendant_quarter_id", "")
                if _dq:
                    logger.warning(
                        f"execute_penalty: penalty {penalty_id} belongs to cross-quarter case "
                        f"(defendant_quarter_id={_dq}). "
                        # TODO: cross-quarter call to defendant_quarter_id
                        "Cross-quarter penalty execution requires a separate inter-canister call."
                    )
        except Exception:
            pass

        # Execute penalty using GGG function
        updated_penalty = penalty_execute(penalty)

        return json.dumps({
            "success": True,
            "data": {
                "penalty": _penalty_to_dict(updated_penalty),
                "message": f"Penalty {penalty_id} executed successfully"
            }
        })

    except ValueError as e:
        logger.warning(f"Validation error in execute_penalty: {str(e)}")
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"Error in execute_penalty: {str(e)}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def waive_penalty(args: str) -> str:
    """Waive a penalty"""
    logger.info(f"justice_litigation.waive_penalty called with args: {args}")
    
    try:
        params = json.loads(args) if args else {}
        
        penalty_id = params.get("penalty_id")
        reason = params.get("reason", "")
        
        if not penalty_id:
            return json.dumps({"success": False, "error": "penalty_id is required"})
        
        penalty = Penalty[penalty_id]
        if not penalty:
            return json.dumps({"success": False, "error": f"Penalty {penalty_id} not found"})
        
        # Waive penalty using GGG function
        updated_penalty = penalty_waive(penalty, reason)
        
        return json.dumps({
            "success": True,
            "data": {
                "penalty": _penalty_to_dict(updated_penalty),
                "message": f"Penalty {penalty_id} waived"
            }
        })
        
    except ValueError as e:
        logger.warning(f"Validation error in waive_penalty: {str(e)}")
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"Error in waive_penalty: {str(e)}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


# ============================================================================
# Entry Points - Appeals
# ============================================================================

def get_appeals(args: str) -> str:
    """Get list of appeals with optional filtering"""
    logger.info(f"justice_litigation.get_appeals called with args: {args}")
    
    try:
        params = json.loads(args) if args else {}
        
        case_id = params.get("case_id")
        appellant_id = params.get("appellant_id")
        status = params.get("status")
        court_id = params.get("court_id")
        
        appeals = list(Appeal.instances())
        
        if case_id:
            appeals = [a for a in appeals if a.original_case and a.original_case._id == case_id]
        if appellant_id:
            appeals = [a for a in appeals if a.appellant and a.appellant._id == appellant_id]
        if status:
            appeals = [a for a in appeals if a.status == status]
        if court_id:
            appeals = [a for a in appeals if a.appellate_court and a.appellate_court._id == court_id]
        
        return json.dumps({
            "success": True,
            "data": {
                "appeals": [_appeal_to_dict(a) for a in appeals],
                "total_count": len(appeals),
            }
        })
        
    except Exception as e:
        logger.error(f"Error in get_appeals: {str(e)}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def file_appeal(args: str) -> str:
    """File an appeal for a case"""
    logger.info(f"justice_litigation.file_appeal called with args: {args}")
    
    try:
        params = json.loads(args) if args else {}
        
        case_id = params.get("case_id")
        appellant_id = params.get("appellant_id")
        grounds = params.get("grounds")
        appellate_court_id = params.get("appellate_court_id")
        
        if not all([case_id, appellant_id, grounds]):
            return json.dumps({
                "success": False,
                "error": "case_id, appellant_id, and grounds are required"
            })
        
        case = Case[case_id]
        if not case:
            return json.dumps({"success": False, "error": f"Case {case_id} not found"})
        
        appellant = User[appellant_id]
        if not appellant:
            return json.dumps({"success": False, "error": f"Appellant user {appellant_id} not found"})
        
        appellate_court = Court[appellate_court_id] if appellate_court_id else None
        
        # Get the original verdict
        verdicts = list(case.verdicts) if hasattr(case, 'verdicts') else []
        if not verdicts:
            return json.dumps({"success": False, "error": "Cannot appeal a case without a verdict"})
        
        original_verdict = verdicts[-1]  # Most recent verdict
        
        # File appeal using GGG function
        appeal = appeal_file(
            case=case,
            verdict=original_verdict,
            appellant=appellant,
            grounds=grounds,
            appellate_court=appellate_court
        )
        
        return json.dumps({
            "success": True,
            "data": {
                "appeal": _appeal_to_dict(appeal),
                "message": f"Appeal filed for case {case.case_number}"
            }
        })
        
    except ValueError as e:
        logger.warning(f"Validation error in file_appeal: {str(e)}")
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"Error in file_appeal: {str(e)}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def decide_appeal(args: str) -> str:
    """Decide an appeal"""
    logger.info(f"justice_litigation.decide_appeal called with args: {args}")
    
    try:
        params = json.loads(args) if args else {}
        
        appeal_id = params.get("appeal_id")
        decision = params.get("decision")  # "upheld", "overturned", "remanded"
        reasoning = params.get("reasoning", "")
        
        if not all([appeal_id, decision]):
            return json.dumps({
                "success": False,
                "error": "appeal_id and decision are required"
            })
        
        appeal = Appeal[appeal_id]
        if not appeal:
            return json.dumps({"success": False, "error": f"Appeal {appeal_id} not found"})
        
        # Decide appeal using GGG function
        updated_appeal = appeal_decide(appeal, decision, reasoning)
        
        return json.dumps({
            "success": True,
            "data": {
                "appeal": _appeal_to_dict(updated_appeal),
                "message": f"Appeal {appeal_id} decided: {decision}"
            }
        })
        
    except ValueError as e:
        logger.warning(f"Validation error in decide_appeal: {str(e)}")
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"Error in decide_appeal: {str(e)}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


# ============================================================================
# Entry Points - Statistics
# ============================================================================

def get_statistics(args: str) -> str:
    """Get justice system statistics"""
    logger.info(f"justice_litigation.get_statistics called with args: {args}")
    
    try:
        cases = list(Case.instances())
        verdicts = list(Verdict.instances())
        penalties = list(Penalty.instances())
        appeals = list(Appeal.instances())
        courts = list(Court.instances())
        judges = list(Judge.instances())
        
        # Case statistics by status
        case_stats = {}
        for case in cases:
            status = case.status or "unknown"
            case_stats[status] = case_stats.get(status, 0) + 1
        
        # Penalty statistics
        total_penalty_amount = sum(p.amount or 0 for p in penalties)
        pending_penalties = [p for p in penalties if p.status == "pending"]
        executed_penalties = [p for p in penalties if p.status == "executed"]
        
        # Appeal statistics
        appeal_stats = {}
        for appeal in appeals:
            status = appeal.status or "unknown"
            appeal_stats[status] = appeal_stats.get(status, 0) + 1
        
        return json.dumps({
            "success": True,
            "data": {
                "overview": {
                    "total_cases": len(cases),
                    "total_verdicts": len(verdicts),
                    "total_penalties": len(penalties),
                    "total_appeals": len(appeals),
                    "total_courts": len(courts),
                    "total_judges": len(judges),
                },
                "cases_by_status": case_stats,
                "penalties": {
                    "total_amount": total_penalty_amount,
                    "pending_count": len(pending_penalties),
                    "executed_count": len(executed_penalties),
                },
                "appeals_by_status": appeal_stats,
            }
        })
        
    except Exception as e:
        logger.error(f"Error in get_statistics: {str(e)}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


# ============================================================================
# Legacy Support - Deprecated functions for backwards compatibility
# ============================================================================

DEFAULT_LITIGATIONS_PAGE_SIZE = 25


def _parse_case_metadata(case: "Case") -> Dict[str, Any]:
    try:
        return json.loads(case.metadata) if case.metadata else {}
    except (ValueError, TypeError):
        return {}


def _defendant_fields(case: "Case", meta: Dict[str, Any]) -> Dict[str, str]:
    if meta.get("defendant_kind") == "department":
        return {
            "defendant_kind": "department",
            "defendant_principal": "",
            "defendant_label": meta.get("defendant_department") or "Department",
        }
    defendant_principal = (
        case.defendant._id
        if case.defendant
        else (meta.get("defendant_principal") or "unknown")
    )
    return {
        "defendant_kind": "user",
        "defendant_principal": defendant_principal,
        "defendant_label": defendant_principal,
    }


def _verdict_decision(case: "Case") -> Optional[str]:
    try:
        verdict = getattr(case, "verdict", None)
        if verdict is not None:
            return getattr(verdict, "decision", None)
        if hasattr(case, "verdicts"):
            verdicts = list(case.verdicts)
            if verdicts:
                return getattr(verdicts[0], "decision", None)
    except Exception:
        pass
    return None


def _case_to_litigation_row(case: "Case") -> Dict[str, Any]:
    content = _litigation_content(case._id)
    is_private = content is not None
    meta = _parse_case_metadata(case)
    defendant = _defendant_fields(case, meta)
    return {
        "id": str(case._id),
        "case_number": case.case_number or "",
        "requester_principal": case.plaintiff._id if case.plaintiff else "unknown",
        "defendant_principal": defendant["defendant_principal"],
        "defendant_kind": defendant["defendant_kind"],
        "defendant_label": defendant["defendant_label"],
        "case_title": "" if is_private else (case.title or ""),
        "description": "" if is_private else (case.description or ""),
        "content_scope": (content.scope or "") if is_private else "",
        "content_ciphertext": (content.ciphertext or "") if is_private else "",
        "is_private": is_private,
        "status": case.status or "filed",
        "requested_at": case.filed_date or "",
        "verdict": _verdict_decision(case),
        "actions_taken": [],
    }


def _load_cases_for_caller(
    caller: str, sees_all: bool, from_id: int, page_size: int
) -> tuple:
    """Return (cases, next_from_id, has_more) without scanning the full store.

    Members load only their own cases via the User→Case relation. Justice
    members and admins page through cases with load_some to stay under the IC
    40B-instruction per-message limit on long-lived realms.
    """
    if sees_all:
        max_id = Case.max_id()
        if max_id == 0:
            return [], None, False
        batch = Case.load_some(from_id=from_id, count=page_size)
        if not batch:
            return [], None, False
        last_id = int(batch[-1]._id)
        next_from = last_id + 1
        has_more = next_from <= max_id
        return batch, (next_from if has_more else None), has_more

    try:
        user = User[caller]
    except Exception:
        user = None
    if not user:
        return [], None, False
    try:
        cases = list(user.cases_as_plaintiff) if user.cases_as_plaintiff else []
    except Exception:
        cases = []
    return cases, None, False


def get_litigations(args: str) -> str:
    """List the litigations the caller may access.

    Privacy model: a litigation is visible only to its **submitter** and the
    **justice department** (and realm admins). Members see their own cases;
    justice members / admins see all. The encrypted ``content_ciphertext`` and
    its ``content_scope`` are returned so the client can decrypt the title and
    description for principals that hold a key; the canister never returns the
    plaintext for private cases.
    """
    logger.info("justice_litigation.get_litigations called")

    try:
        params = json.loads(args) if args else {}
        caller = _caller_principal() or params.get("user_principal", "")
        from_id = max(1, int(params.get("from_id", 1)))
        page_size = max(1, min(int(params.get("page_size", DEFAULT_LITIGATIONS_PAGE_SIZE)), 100))

        # Compute the justice audience once (it is the same for every case).
        sees_all = _is_realm_admin(caller) or _is_justice_member(caller)

        cases, next_from_id, has_more = _load_cases_for_caller(
            caller, sees_all, from_id, page_size
        )
        litigations = [_case_to_litigation_row(case) for case in cases]
        total_count = Case.count() if sees_all else len(litigations)

        return json.dumps(
            {
                "success": True,
                "data": {
                    "litigations": litigations,
                    "total_count": total_count,
                    "user_profile": "admin" if sees_all else "member",
                    "can_view_all": sees_all,
                    "next_from_id": next_from_id,
                    "has_more": has_more,
                },
            }
        )

    except Exception as e:
        logger.error(f"Error in get_litigations: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def get_justice_audience(args: str = "") -> str:
    """Return the justice department's recipient principals.

    The frontend needs these (plus the submitter) to IBE-wrap a litigation's
    data-encryption key for everyone allowed to read it.
    """
    try:
        return json.dumps(
            {
                "success": True,
                "data": {
                    "department": JUSTICE_DEPARTMENT_NAME,
                    "principals": _justice_member_principals(),
                },
            }
        )
    except Exception as e:
        logger.error(f"Error in get_justice_audience: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def create_litigation(args: str) -> str:
    """Open a new private litigation (step 1 of 2).

    The case is created with *no* plaintext title/description; the real content
    is encrypted client-side and attached via :func:`set_litigation_content`.
    Returns the new case id plus the ``content_scope`` and the recipient
    principals (submitter + justice department) the client must wrap the DEK
    for.
    """
    logger.info("justice_litigation.create_litigation called")

    try:
        params = json.loads(args) if args else {}

        # The submitter is always the authenticated caller — never trust a
        # client-supplied principal for who owns the case.
        submitter = _caller_principal() or params.get("requester_principal", "")
        if not submitter:
            return json.dumps({"success": False, "error": "Unable to determine caller principal"})

        defendant_id = params.get("defendant_principal") or params.get("defendant_id")
        # A defendant may be a person (User principal) or a department. The host
        # Case.defendant relation only points to a User, so we record department
        # defendants in this extension's own metadata instead of that relation.
        defendant_kind = (params.get("defendant_kind") or "").strip().lower()
        defendant_department = (params.get("defendant_department") or "").strip()
        defendant_department_id = str(params.get("defendant_department_id") or "").strip()
        if not defendant_kind:
            defendant_kind = "department" if (defendant_department or defendant_department_id) else "user"

        # Cross-quarter: optional canister ID of the defendant's home quarter.
        defendant_quarter_id = str(params.get("defendant_quarter_id") or "").strip()
        own_canister_id = _ic.id().to_str() if _ic else ""
        is_cross_quarter = bool(defendant_quarter_id and defendant_quarter_id != own_canister_id)

        court_id = params.get("court_id")

        # If no court specified, use the first available court.
        if not court_id:
            courts = list(Court.instances())
            if courts:
                court_id = courts[0]._id
            else:
                return json.dumps(
                    {"success": False, "error": "No courts available. Please create a court first."}
                )

        court = Court[court_id]
        if not court:
            return json.dumps({"success": False, "error": f"Court {court_id} not found"})

        plaintiff = User[submitter]
        if not plaintiff:
            return json.dumps({"success": False, "error": f"Submitter {submitter} is not a registered user"})

        # Resolve the defendant. For a department we leave the host's User
        # relation empty (it can't reference a Department) and capture the
        # department in metadata; for a person we set the User relation.
        # Either way the defendant is recorded but NEVER granted read access,
        # so the litigation stays private regardless of defendant type.
        if defendant_kind == "department":
            if not (defendant_department or defendant_department_id):
                return json.dumps({"success": False, "error": "Department defendant requires a name or id"})
            dept = None
            if defendant_department_id:
                dept = Department[defendant_department_id]
            if dept is None and defendant_department:
                dept = Department[defendant_department]
            dept_label = getattr(dept, "name", None) or defendant_department or defendant_department_id
            dept_ident = str(getattr(dept, "_id", "") or defendant_department_id or "")
            defendant = None
            meta_dict = {
                "defendant_kind": "department",
                "defendant_department": dept_label,
                "defendant_department_id": dept_ident,
            }
            if is_cross_quarter:
                meta_dict["defendant_quarter_id"] = defendant_quarter_id
                meta_dict["scope_tag"] = "cross_quarter"
            metadata = json.dumps(meta_dict)
        else:
            defendant = User[defendant_id] if defendant_id else None
            meta_dict = {"defendant_kind": "user", "defendant_principal": defendant_id} if defendant_id else {}
            if is_cross_quarter:
                meta_dict["defendant_quarter_id"] = defendant_quarter_id
                meta_dict["scope_tag"] = "cross_quarter"
            metadata = json.dumps(meta_dict) if meta_dict else ""

        # Create the public Case with empty title/description; the real content
        # lives encrypted in this extension's own LitigationContent entity.
        new_case = case_file(
            court=court,
            plaintiff=plaintiff,
            defendant=defendant,
            title="",
            description="",
            metadata=metadata,
        )

        scope = f"litigation:{JUSTICE_DEPARTMENT_NAME}:{submitter}:{new_case._id}"
        LitigationContent(
            case_id=str(new_case._id),
            ciphertext="",
            scope=scope,
            created_by=submitter,
        )

        recipients = list(_justice_member_principals())
        if submitter not in recipients:
            recipients.append(submitter)

        if is_cross_quarter:
            logger.warning(
                f"Cross-quarter litigation {new_case.case_number}: defendant is on "
                f"quarter {defendant_quarter_id}. Penalty execution requires a "
                f"separate inter-canister call to that quarter."
            )

        result_data = {
            "id": str(new_case._id),
            "case_number": new_case.case_number or "",
            "scope": scope,
            "recipients": recipients,
            "message": f"Litigation {new_case.case_number} opened",
        }
        if is_cross_quarter:
            result_data["defendant_quarter_id"] = defendant_quarter_id
            result_data["scope_tag"] = "cross_quarter"

        return json.dumps({"success": True, "data": result_data})

    except ValueError as e:
        logger.warning(f"Validation error in create_litigation: {e}")
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"Error in create_litigation: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def set_litigation_content(args: str) -> str:
    """Attach (or replace) the encrypted title/description blob (step 2 of 2).

    ``ciphertext`` is an opaque ``enc:v=2:...`` AES-GCM blob produced in the
    browser; the canister never sees the plaintext or the DEK. Only the
    submitter, the justice department head, or a realm admin may set it.
    """
    logger.info("justice_litigation.set_litigation_content called")

    try:
        params = json.loads(args) if args else {}
        case_id = params.get("id") or params.get("case_id")
        ciphertext = params.get("ciphertext") or ""
        if not case_id:
            return json.dumps({"success": False, "error": "id is required"})

        case = None
        try:
            case = Case[case_id]
        except (KeyError, Exception):
            case = None
        if not case:
            return json.dumps({"success": False, "error": f"Case {case_id} not found"})

        caller = _caller_principal()
        if not _can_manage_case(case, caller):
            return json.dumps({"success": False, "error": "Not allowed to edit this litigation"})

        content = _litigation_content(case._id)
        if content is None:
            return json.dumps({"success": False, "error": "Litigation has no private content record"})
        content.ciphertext = ciphertext
        return json.dumps({"success": True, "data": {"id": str(case._id)}})

    except Exception as e:
        logger.error(f"Error in set_litigation_content: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def execute_verdict(args: str) -> str:
    """
    DEPRECATED: Use issue_verdict() instead.
    """
    logger.info(f"justice_litigation.execute_verdict called (DEPRECATED - use issue_verdict)")
    return json.dumps({
        "success": False,
        "error": "This function is deprecated. Use issue_verdict() instead."
    })


def load_demo_litigations(args: str) -> str:
    """
    DEPRECATED: Demo data is now loaded via realm_generator.py
    """
    logger.info(f"justice_litigation.load_demo_litigations called (DEPRECATED)")
    
    cases_count = len(list(Case.instances()))
    
    return json.dumps({
        "success": True,
        "message": f"Demo data is now loaded via realm_generator.py. Current cases: {cases_count}",
        "data": {
            "total_loaded": cases_count,
            "note": "This function is deprecated."
        }
    })
