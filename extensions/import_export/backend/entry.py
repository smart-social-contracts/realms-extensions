"""
Import & Export Extension — bulk entity and citizen census I/O (issue #14).
"""

import base64
import csv
import json
import traceback
from io import StringIO
from typing import Any, Dict, List

from basilisk import ic
from ggg import Realm, User
from ic_python_db import Database, Entity
from ic_python_logging import get_logger

logger = get_logger("extensions.import_export")


def _parse_args(args):
    if isinstance(args, str) and args.strip():
        return json.loads(args)
    if isinstance(args, dict):
        return args
    return {}


def _get_caller_user() -> User:
    principal = ic.caller().to_str()
    user = User[principal]
    if not user:
        raise PermissionError(f"User {principal} not found")
    return user


def _get_realm():
    realms = Realm.instances()
    return realms[0] if realms else None


def _frontend_base_url(realm) -> str:
    fid = (getattr(realm, "frontend_canister_id", "") or "").strip()
    return f"https://{fid}.icp0.io" if fid else ""


def _invite_url(code, base_url: str) -> str:
    if not code.code:
        return ""
    base = (code.frontend_url or base_url or "").rstrip("/")
    if not base:
        return ""
    return f"{base}/join?invite={code.code}"


def get_entity_types(args=None):
    db = Database.get_instance()
    seen = set()
    types = []
    for cls in db._entity_types.values():
        name = cls.__name__
        if name not in seen:
            seen.add(name)
            types.append(name)
    return {"success": True, "data": sorted(types)}


def export_data(args):
    try:
        if isinstance(args, str):
            args = json.loads(args)

        requested_types = args.get("entity_types", None)
        include_codexes = args.get("include_codexes", True)

        db = Database.get_instance()
        all_entities = []
        codexes = []

        seen = set()
        for cls in db._entity_types.values():
            name = cls.__name__
            if name in seen:
                continue
            seen.add(name)

            if requested_types and name not in requested_types:
                continue

            try:
                for instance in cls.instances():
                    try:
                        serialized = instance.serialize()
                        if name == "Codex" and include_codexes:
                            codexes.append({
                                "name": serialized.get("name", ""),
                                "code": serialized.get("code", ""),
                                "_id": serialized.get("_id", ""),
                            })
                        else:
                            all_entities.append(serialized)
                    except Exception as e:
                        logger.error(f"Error serializing {name} instance: {e}")
            except Exception as e:
                logger.error(f"Error processing entity class {name}: {e}")

        response_data = {
            "entities": all_entities,
            "codexes": codexes,
            "total_entities": len(all_entities),
            "total_codexes": len(codexes),
        }

        return {
            "success": True,
            "message": f"Successfully exported {len(all_entities)} entities and {len(codexes)} codexes",
            "data": json.dumps(response_data),
        }
    except Exception as e:
        logger.error(f"export_data error: {e}\n{traceback.format_exc()}")
        return {"success": False, "error": str(e)}


def process_bulk_import(data: List[Dict[str, Any]]) -> Dict[str, Any]:
    successful = 0
    failed = 0
    errors = []

    for record in data:
        try:
            entity = Entity.deserialize(record, level=1)
            if record.get("_type") == "Codex" and "code" in record:
                code_val = record["code"]
                if isinstance(code_val, str) and code_val.startswith("base64:"):
                    entity.code = base64.b64decode(code_val[7:]).decode()
            successful += 1
        except Exception as e:
            logger.error(f"Error creating entity: {e}\n{traceback.format_exc()}")
            failed += 1
            errors.append(f"{record.get('_type', '?')}#{record.get('_id', '?')}: {e}")

    return {"successful": successful, "failed": failed, "errors": errors[:10]}


def import_data(args):
    try:
        if isinstance(args, str):
            if args.startswith("base64:"):
                args = base64.b64decode(args[7:]).decode("utf-8")
            args = json.loads(args)

        data_format = args.get("format", "json")
        data_content = args.get("data", "")

        if not data_content:
            return {"success": False, "error": "No data provided"}

        parsed_data = []
        if data_format == "csv":
            csv_reader = csv.DictReader(StringIO(data_content))
            parsed_data = list(csv_reader)
        else:
            parsed_data = json.loads(data_content) if isinstance(data_content, str) else data_content
            if not isinstance(parsed_data, list):
                parsed_data = [parsed_data]

        sort_records = args.get("sort_records", True)
        warnings = []
        if sort_records and data_format == "json":
            from core.entity_import import topological_sort_records

            parsed_data, warnings = topological_sort_records(parsed_data)

        results = process_bulk_import(parsed_data)
        Entity._context.clear()

        return {
            "success": True,
            "message": "Successfully imported records",
            "data": {
                "total_records": len(parsed_data),
                "successful": results["successful"],
                "failed": results["failed"],
                "errors": results["errors"],
                "warnings": warnings,
            },
        }
    except Exception as e:
        logger.error(f"import_data error: {e}\n{traceback.format_exc()}")
        return {"success": False, "error": str(e)}


def get_import_type_graph(args=None):
    from core.entity_import import get_import_type_graph as _graph

    return {"success": True, "data": _graph()}


def plan_import_batches_api(args):
    try:
        args = _parse_args(args)
        records = args.get("records")
        if records is None and args.get("data"):
            raw = args.get("data")
            records = json.loads(raw) if isinstance(raw, str) else raw
        if not isinstance(records, list):
            return {"success": False, "error": "records (array) is required"}

        batch_size = max(1, min(500, int(args.get("batch_size", 200))))
        from core.entity_import import plan_import_batches

        return {"success": True, "data": plan_import_batches(records, batch_size=batch_size)}
    except Exception as e:
        logger.error(f"plan_import_batches error: {e}\n{traceback.format_exc()}")
        return {"success": False, "error": str(e)}


def import_status(args=None):
    from core.citizen_import import import_status as _status

    return {"success": True, "data": _status()}


def import_citizens(args):
    try:
        args_dict = _parse_args(args)
        records = args_dict.get("citizens")
        if records is None:
            return {"success": False, "error": "citizens (array) is required"}

        realm = _get_realm()
        base_url = _frontend_base_url(realm) if realm else ""

        from core.citizen_import import DEFAULT_EXPIRES_HOURS, import_citizens as _import

        result = _import(
            records,
            created_by=ic.caller().to_str(),
            frontend_url=args_dict.get("frontend_url") or base_url,
            expires_in_hours=int(args_dict.get("expires_in_hours", DEFAULT_EXPIRES_HOURS)),
        )
        return result if isinstance(result, dict) else json.loads(result)
    except Exception as e:
        logger.error(f"import_citizens error: {e}\n{traceback.format_exc()}")
        return {"success": False, "error": str(e)}


def list_citizen_invites(args):
    try:
        args_dict = _parse_args(args)
        offset = max(0, int(args_dict.get("offset", 0)))
        limit = min(500, max(1, int(args_dict.get("limit", 100))))
        only_pending = bool(args_dict.get("only_pending", False))

        realm = _get_realm()
        base_url = _frontend_base_url(realm) if realm else ""

        from core.citizen_import import _citizen_codes

        rows = []
        for code, meta in _citizen_codes():
            claimed = bool(code.uses_count and code.uses_count > 0)
            if only_pending and (claimed or code.revoked == 1):
                continue
            rows.append({
                "id": code.user_id or "",
                "name": meta.get("name", ""),
                "quarter": meta.get("quarter", ""),
                "email": code.email or "",
                "claimed": claimed,
                "claimed_by": (code.principals_redeemed or "").split(",")[0] if claimed else "",
                "revoked": code.revoked == 1,
                "url": _invite_url(code, base_url),
            })
        rows.sort(key=lambda r: r["id"])
        total = len(rows)
        page = rows[offset:offset + limit]

        return {
            "success": True,
            "data": {"citizens": page, "total": total, "offset": offset, "limit": limit},
        }
    except Exception as e:
        logger.error(f"list_citizen_invites error: {e}\n{traceback.format_exc()}")
        return {"success": False, "error": str(e)}


def extension_sync_call(method_name: str, args: dict):
    methods = {
        "get_entity_types": (get_entity_types, False),
        "export_data": (export_data, True),
        "import_data": (import_data, True),
        "get_import_type_graph": (get_import_type_graph, False),
        "plan_import_batches": (plan_import_batches_api, True),
        "import_status": (import_status, False),
        "import_citizens": (import_citizens, True),
        "list_citizen_invites": (list_citizen_invites, True),
    }

    if method_name not in methods:
        return {"success": False, "error": f"Unknown method: {method_name}"}

    fn, requires_args = methods[method_name]
    try:
        return fn(args) if requires_args else fn()
    except Exception as e:
        logger.error(f"import_export.{method_name} error: {e}\n{traceback.format_exc()}")
        return {"success": False, "error": str(e)}
