"""
Admin Dashboard Backend Extension Entry Point

Provides a web UI for administrative operations: entity browsing,
export/import, and data exploration.

Note: Invitation management has moved to the `role_manager` extension.
Realm settings have moved to the `realm_settings` extension.
"""

import base64
import csv
import json
import traceback
from io import StringIO
from typing import Any, Dict, List

from ic_python_db import Database, Entity
from ic_python_logging import get_logger

logger = get_logger("extensions.admin_dashboard")


def get_entity_types(args=None):
    """Return available entity types for the admin dashboard dropdown.

    Uses ic_python_db's entity type registry directly instead of
    ggg.classes(), making this portable across any basilisk canister.
    """
    db = Database.get_instance()
    seen = set()
    types = []
    for cls in db._entity_types.values():
        name = cls.__name__
        if name not in seen:
            seen.add(name)
            types.append(name)
    return {"success": True, "data": sorted(types)}


def extension_sync_call(method_name: str, args: dict):
    """Synchronous extension API calls for admin operations."""
    methods = {
        "import_data": (import_data, True),
        "export_data": (export_data, True),
        "delete_entity": (delete_entity, True),
        "get_entity_types": (get_entity_types, False),
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


def export_data(args):
    """Export entities from the database.

    Uses ic_python_db's entity type registry directly.  Codex entities
    are separated into their own list when ``include_codexes`` is True.

    Equivalent CLI: ``%db export <Type> [file.json]``
    """
    try:
        if isinstance(args, str):
            args = json.loads(args)

        requested_types = args.get("entity_types", None)
        include_codexes = args.get("include_codexes", True)

        logger.debug(f"Exporting data - entity_types: {requested_types}, include_codexes: {include_codexes}")

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
                instances = cls.instances()
                logger.debug(f"Found {len(instances)} instances of {name}")

                for instance in instances:
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

        logger.debug(f"Export complete - {len(all_entities)} entities, {len(codexes)} codexes")

        return {
            "success": True,
            "message": f"Successfully exported {len(all_entities)} entities and {len(codexes)} codexes",
            "data": json.dumps(response_data),
        }

    except Exception as e:
        logger.error(f"Error exporting data: {e}\n{traceback.format_exc()}")
        return {"success": False, "error": str(e)}


def import_data(args):
    """Import entities via Entity.deserialize (upsert semantics).

    Supports JSON and CSV formats.  Base64-encoded args are accepted
    to avoid shell escaping issues.

    Equivalent CLI: ``%db import <file.json>``
    """
    try:
        if isinstance(args, str):
            if args.startswith("base64:"):
                args = base64.b64decode(args[7:]).decode("utf-8")
            args = json.loads(args)

        data_format = args.get("format", "json")
        data_content = args.get("data", "")

        logger.debug(f"data_format: {data_format}")

        if not data_content:
            return {"success": False, "error": "No data provided"}

        parsed_data = []
        if data_format == "csv":
            csv_reader = csv.DictReader(StringIO(data_content))
            parsed_data = list(csv_reader)
        else:
            try:
                parsed_data = json.loads(data_content) if isinstance(data_content, str) else data_content
                if not isinstance(parsed_data, list):
                    parsed_data = [parsed_data]
            except json.JSONDecodeError as e:
                return {"success": False, "error": f"Invalid JSON data: {e}"}

        logger.debug(f"Importing {len(parsed_data)} records")
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
            },
        }

    except Exception as e:
        logger.error(f"Error processing import data: {e}\n{traceback.format_exc()}")
        return {"success": False, "error": str(e)}


def process_bulk_import(data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Deserialize a list of entity dicts via Entity.deserialize (upsert).

    Handles Codex entities specially: decodes base64-encoded code fields.
    """
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

    return {
        "successful": successful,
        "failed": failed,
        "errors": errors[:10],
    }


def delete_entity(args):
    """Delete a single entity by type and id.

    Equivalent CLI: ``%db delete <Type> <id>``
    """
    try:
        if isinstance(args, str):
            args = json.loads(args)

        entity_type = args.get("entity_type")
        entity_id = args.get("entity_id")

        if not entity_type or entity_id is None:
            return {"success": False, "error": "entity_type and entity_id are required"}

        db = Database.get_instance()
        cls = db._entity_types.get(entity_type)
        if not cls:
            return {"success": False, "error": f"Unknown entity type: {entity_type}"}

        instance = cls.load(entity_id)
        if instance is None:
            return {"success": False, "error": f"{entity_type}#{entity_id} not found"}

        instance.delete()
        Entity._context.clear()

        return {
            "success": True,
            "message": f"Deleted {entity_type}#{entity_id}",
        }
    except Exception as e:
        logger.error(f"Error deleting entity: {e}\n{traceback.format_exc()}")
        return {"success": False, "error": str(e)}
