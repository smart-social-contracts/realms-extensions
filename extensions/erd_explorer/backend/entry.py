"""
ERD Explorer Extension Backend
Provides entity relationship data and metadata for the ERD visualization

Runs **sandboxed**. Building the ERD means inspecting live ORM descriptors,
which by design cannot cross into a subinterpreter, so the reflection happens
host-side behind the ``schema.entities`` capability and this file just renders
the plain-data result.
"""

from ggg_sdk import ctx

import json


def extension_sync_call(method_name: str, args: dict):
    """
    Synchronous extension API calls for ERD Explorer operations
    """
    # Method mapping with argument requirements
    methods = {
        "get_entity_schema": (get_entity_schema, False),
        "get_entity_data": (get_entity_data, True),
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


def get_entity_schema(args=None):
    """
    Returns the complete entity schema with relationships
    """
    return ctx.entities.erd()


def get_entity_data(args):
    """
    Returns actual entity data from the database.

    Only types the bridge exposes a read policy for are fetchable, and the
    host scopes rows to the caller before returning them — an explorer must
    not become a way to read the whole realm.
    """
    parsed_args = args
    if isinstance(args, str):
        try:
            parsed_args = json.loads(args) if args else {}
        except (ValueError, TypeError):
            parsed_args = {}
    if not isinstance(parsed_args, dict):
        parsed_args = {}

    entity_type = parsed_args.get("entity_type", "User")
    page_num = parsed_args.get("page_num", 0)
    page_size = parsed_args.get("page_size", 10)

    try:
        result = ctx.entities.list(entity_type)
        rows = result.get("rows", [])
        total = result.get("total", len(rows))
    except Exception:
        # Type has no read policy: report empty rather than leaking that the
        # type exists but is closed.
        rows, total = [], 0

    start = max(0, int(page_num)) * max(1, int(page_size))
    page = rows[start:start + max(1, int(page_size))]

    return {
        "items": page,
        "page_num": page_num,
        "page_size": page_size,
        "total_items_count": total,
        "total_pages": (total + page_size - 1) // page_size if page_size else 0,
    }
