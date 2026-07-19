"""
Zone Selector extension entry point

Zoning authority for the realm's territory (issue #254): admins define typed
zones (residential/commercial/…) on the H3 hexagonal grid. The backend stores
only the H3 cell index; all geometry is computed by the browser using h3-js.
"""

import json
import traceback
from typing import Any, Dict

from ggg import Zone, User
from ic_python_logging import get_logger

logger = get_logger("extensions.zone_selector")

ZONE_TYPES = (
    "unassigned",
    "residential",
    "commercial",
    "agricultural",
    "industrial",
    "public",
    "mixed",
)


def _is_territory_zone(zone) -> bool:
    """Territory zones classify realm land; parcel-geometry zones belong to a Land."""
    try:
        return zone.land is None
    except Exception:
        return True


def _caller_is_admin() -> bool:
    try:
        from basilisk import ic
        from ggg.system.user_profile import OPERATIONS_SEPARATOR, Operations

        user = User[ic.caller().to_str()]
        if not user:
            return False
        for profile in user.profiles:
            allowed = str(profile.allowed_to or "").split(OPERATIONS_SEPARATOR)
            if Operations.ALL in allowed:
                return True
            if getattr(profile, "name", "") == "admin":
                return True
    except Exception as e:
        logger.warning(f"admin check failed: {e}")
    return False


def _serialize_zone(zone) -> Dict[str, Any]:
    return {
        "id": zone.h3_index,
        "h3_index": zone.h3_index,
        "name": zone.name,
        "description": zone.description,
        "zone_type": getattr(zone, "zone_type", "") or "unassigned",
        "metadata": zone.metadata,
    }


def get_my_zones(args: str) -> str:
    """Get zones for the current user."""
    logger.info(f"zone_selector.get_my_zones called with args: {args}")

    try:
        params = json.loads(args) if args else {}
        user_id = params.get("user_id")

        if not user_id:
            return json.dumps({"success": False, "error": "user_id is required"})

        zones = []
        for zone in Zone.instances():
            if zone.user and zone.user.id == user_id and _is_territory_zone(zone):
                zones.append(_serialize_zone(zone))

        return json.dumps({"success": True, "data": zones})

    except Exception as e:
        logger.error(f"Error in get_my_zones: {str(e)}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def add_zone(args: str) -> str:
    """Add a typed territory zone. Requires an explicit h3_index from the caller."""
    logger.info(f"zone_selector.add_zone called with args: {args}")

    try:
        params = json.loads(args) if args else {}

        user_id = params.get("user_id")
        h3_index = params.get("h3_index")
        name = params.get("name", "Zone")
        description = params.get("description", "")
        zone_type = (params.get("zone_type") or "unassigned").strip().lower()

        if zone_type not in ZONE_TYPES:
            return json.dumps({
                "success": False,
                "error": f"zone_type must be one of {', '.join(ZONE_TYPES)}",
            })

        if not user_id:
            return json.dumps({"success": False, "error": "user_id is required"})
        if not h3_index:
            return json.dumps({
                "success": False,
                "error": "h3_index is required (geometry is computed on the frontend)",
            })

        user = None
        for u in User.instances():
            if u.id == user_id:
                user = u
                break
        if not user:
            return json.dumps({"success": False, "error": "User not found"})

        # One territory zone per cell, realm-wide.
        for existing_zone in Zone.instances():
            if existing_zone.h3_index == h3_index and _is_territory_zone(existing_zone):
                return json.dumps({
                    "success": False,
                    "error": "A zone already exists at this location",
                })

        zone = Zone(
            h3_index=h3_index,
            name=name,
            description=description,
            zone_type=zone_type,
            metadata=json.dumps(params.get("metadata", {})),
            user=user,
        )

        return json.dumps({
            "success": True,
            "data": {
                "id": zone.h3_index,
                "h3_index": zone.h3_index,
                "name": zone.name,
                "zone_type": zone.zone_type,
                "message": "Zone added successfully",
            }
        })

    except Exception as e:
        logger.error(f"Error in add_zone: {str(e)}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def add_zones_batch(args: str) -> str:
    """Paint many H3 cells at once with the same type (freehand-fill tool).

    Cells already claimed by another territory zone are skipped rather than
    erroring the whole batch, so re-painting over an edited area is safe.
    """
    logger.info(f"zone_selector.add_zones_batch called with {len(args or '')} bytes")

    try:
        params = json.loads(args) if args else {}

        user_id = params.get("user_id")
        h3_indexes = params.get("h3_indexes") or []
        name = params.get("name", "Zone")
        description = params.get("description", "")
        zone_type = (params.get("zone_type") or "unassigned").strip().lower()

        if zone_type not in ZONE_TYPES:
            return json.dumps({
                "success": False,
                "error": f"zone_type must be one of {', '.join(ZONE_TYPES)}",
            })
        if not user_id:
            return json.dumps({"success": False, "error": "user_id is required"})
        if not isinstance(h3_indexes, list) or not h3_indexes:
            return json.dumps({"success": False, "error": "h3_indexes (non-empty list) is required"})

        user = None
        for u in User.instances():
            if u.id == user_id:
                user = u
                break
        if not user:
            return json.dumps({"success": False, "error": "User not found"})

        existing_cells = {
            z.h3_index for z in Zone.instances() if _is_territory_zone(z)
        }

        created = []
        skipped = []
        # Cap defensively — a huge freehand fill shouldn't stall an update call.
        for h3_index in h3_indexes[:3000]:
            if not h3_index or h3_index in existing_cells:
                skipped.append(h3_index)
                continue

            zone = Zone(
                h3_index=h3_index,
                name=name,
                description=description,
                zone_type=zone_type,
                metadata="{}",
                user=user,
            )
            existing_cells.add(h3_index)
            created.append(zone.h3_index)

        return json.dumps({
            "success": True,
            "data": {
                "created_count": len(created),
                "skipped_count": len(skipped),
                "created": created,
                "message": f"Painted {len(created)} zone(s), skipped {len(skipped)} already-claimed cell(s)",
            },
        })

    except Exception as e:
        logger.error(f"Error in add_zones_batch: {str(e)}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def update_zone(args: str) -> str:
    """Update a territory zone's type, name, or description (creator or admin)."""
    logger.info(f"zone_selector.update_zone called with args: {args}")

    try:
        params = json.loads(args) if args else {}
        zone_id = params.get("zone_id") or params.get("h3_index")
        if not zone_id:
            return json.dumps({"success": False, "error": "zone_id is required"})

        zone = None
        for z in Zone.instances():
            if z.h3_index == zone_id and _is_territory_zone(z):
                zone = z
                break
        if not zone:
            return json.dumps({"success": False, "error": "Zone not found"})

        user_id = params.get("user_id")
        is_owner = zone.user and user_id and zone.user.id == user_id
        if not is_owner and not _caller_is_admin():
            return json.dumps({
                "success": False,
                "error": "You don't have permission to update this zone",
            })

        updated = []
        if "zone_type" in params:
            zone_type = (params.get("zone_type") or "unassigned").strip().lower()
            if zone_type not in ZONE_TYPES:
                return json.dumps({
                    "success": False,
                    "error": f"zone_type must be one of {', '.join(ZONE_TYPES)}",
                })
            zone.zone_type = zone_type
            updated.append("zone_type")
        if "name" in params:
            zone.name = params.get("name") or zone.name
            updated.append("name")
        if "description" in params:
            zone.description = params.get("description") or ""
            updated.append("description")

        return json.dumps({
            "success": True,
            "data": {**_serialize_zone(zone), "updated_fields": updated},
        })

    except Exception as e:
        logger.error(f"Error in update_zone: {str(e)}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def remove_zone(args: str) -> str:
    """Remove a territory zone (creator or admin)."""
    logger.info(f"zone_selector.remove_zone called with args: {args}")

    try:
        params = json.loads(args) if args else {}

        user_id = params.get("user_id")
        zone_id = params.get("zone_id")

        if not zone_id:
            return json.dumps({"success": False, "error": "zone_id is required"})

        zone = None
        for z in Zone.instances():
            if z.h3_index == zone_id and _is_territory_zone(z):
                zone = z
                break

        if not zone:
            return json.dumps({"success": False, "error": "Zone not found"})

        # Creator may remove their own zone; admins may remove any.
        is_owner = zone.user and user_id and zone.user.id == user_id
        if not is_owner and not _caller_is_admin():
            return json.dumps({
                "success": False,
                "error": "You don't have permission to remove this zone",
            })

        # Delete the zone
        zone.delete()

        return json.dumps({
            "success": True,
            "data": {"message": "Zone removed successfully"}
        })

    except Exception as e:
        logger.error(f"Error in remove_zone: {str(e)}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def get_all_zones(args: str) -> str:
    """Get all territory zones (for map visualization and zoning admin)."""
    logger.info(f"zone_selector.get_all_zones called with args: {args}")

    try:
        params = json.loads(args) if args else {}

        zones = []
        for zone in Zone.instances():
            if not _is_territory_zone(zone):
                continue  # parcel geometry owned by land_registry
            zone_data = _serialize_zone(zone)
            if zone.user:
                zone_data["user_id"] = zone.user.id
            zones.append(zone_data)

        return json.dumps({
            "success": True,
            "data": zones,
            "zone_types": list(ZONE_TYPES),
            "is_admin": _caller_is_admin(),
        })

    except Exception as e:
        logger.error(f"Error in get_all_zones: {str(e)}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})
