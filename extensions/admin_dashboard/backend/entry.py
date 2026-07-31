"""
Admin Dashboard Backend Extension Entry Point

Browse, inspect, and delete entities. Bulk import/export moved to import_export.
"""

import json
import traceback

from ic_python_db import Database, Entity
from ic_python_logging import get_logger

logger = get_logger("extensions.admin_dashboard")


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


def extension_sync_call(method_name: str, args: dict):
    methods = {
        "delete_entity": (delete_entity, True),
        "get_entity_types": (get_entity_types, False),
    }

    if method_name not in methods:
        return {
            "success": False,
            "error": f"Unknown method: {method_name}. Import/export moved to import_export extension.",
        }

    function, requires_args = methods[method_name]
    try:
        return function(args) if requires_args else function()
    except Exception as e:
        return {"success": False, "error": f"Error calling {method_name}: {str(e)}"}


def delete_entity(args):
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

        return {"success": True, "message": f"Deleted {entity_type}#{entity_id}"}
    except Exception as e:
        logger.error(f"Error deleting entity: {e}\n{traceback.format_exc()}")
        return {"success": False, "error": str(e)}
