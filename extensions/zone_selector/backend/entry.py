"""
Zone Selector extension entry point

Zoning authority for the realm's territory (issue #254): admins define typed
zones (residential/commercial/…) on the H3 hexagonal grid. The backend stores
only the H3 cell index; all geometry is computed by the browser using h3-js.

Runs **sandboxed**. There are no host imports here: a subinterpreter has no
``ggg``, so realm data is reached through the ``ggg_sdk`` capability bridge,
which the manifest's ``capabilities`` list bounds.

The security consequence is the point of the port. This file used to decide
who owned a zone by comparing against a ``user_id`` taken from its own call
args, which let any member edit or delete any other member's zone. It now
cannot name a user at all: ``ctx`` scopes every read to the authenticated
caller, and ``ctx.zones.*`` checks ownership host-side. The bug is no longer
expressible rather than merely fixed.
"""

from ggg_sdk import ctx

ZONE_TYPES = (
    "unassigned",
    "residential",
    "commercial",
    "agricultural",
    "industrial",
    "public",
    "mixed",
)

# The sandbox stdlib is minimal; ``json`` is a builtin C module there.
import json


def _ok(data, **extra):
    return json.dumps(dict({"success": True, "data": data}, **extra))


def _err(message):
    return json.dumps({"success": False, "error": str(message)})


def _params(args):
    if isinstance(args, dict):
        return args
    if not args:
        return {}
    try:
        parsed = json.loads(args)
    except (ValueError, TypeError):
        return {}
    return parsed if isinstance(parsed, dict) else {}


def _serialize(row):
    return {
        "id": row.get("h3_index"),
        "h3_index": row.get("h3_index"),
        "name": row.get("name"),
        "description": row.get("description"),
        "zone_type": row.get("zone_type") or "unassigned",
        "metadata": row.get("metadata"),
    }


def _check_zone_type(params):
    """Returns (zone_type, error). Kept client-side for a friendly message;
    the host re-validates, so skipping it here would change nothing."""
    zone_type = (params.get("zone_type") or "unassigned").strip().lower()
    if zone_type not in ZONE_TYPES:
        return None, f"zone_type must be one of {', '.join(ZONE_TYPES)}"
    return zone_type, None


def get_my_zones(args: str) -> str:
    """Zones belonging to the caller.

    ``mine`` is resolved by the host against the authenticated principal, so
    there is no way to ask for someone else's.
    """
    try:
        rows = ctx.entities.rows("Zone", {"mine": True})
        return _ok([_serialize(r) for r in rows])
    except Exception as e:
        return _err(e)


def add_zone(args: str) -> str:
    """Add a typed territory zone owned by the caller."""
    try:
        params = _params(args)
        zone_type, error = _check_zone_type(params)
        if error:
            return _err(error)

        h3_index = params.get("h3_index")
        if not h3_index:
            return _err("h3_index is required (geometry is computed on the frontend)")

        # Ownership and the one-zone-per-cell invariant are enforced host-side.
        created = ctx.zones.create(
            h3_index=h3_index,
            name=params.get("name") or "Zone",
            description=params.get("description") or "",
            zone_type=zone_type,
            metadata=json.dumps(params.get("metadata") or {}),
        )
        return _ok(dict(_serialize(created), message="Zone added successfully"))
    except Exception as e:
        return _err(e)


def add_zones_batch(args: str) -> str:
    """Paint many H3 cells at once with the same type (freehand-fill tool).

    Cells already claimed by another territory zone are skipped rather than
    erroring the whole batch, so re-painting over an edited area is safe.
    """
    try:
        params = _params(args)
        zone_type, error = _check_zone_type(params)
        if error:
            return _err(error)

        h3_indexes = params.get("h3_indexes") or []
        if not isinstance(h3_indexes, list) or not h3_indexes:
            return _err("h3_indexes (non-empty list) is required")

        name = params.get("name") or "Zone"
        description = params.get("description") or ""

        created = []
        skipped = []
        # Cap defensively — a huge freehand fill shouldn't stall an update call.
        for h3_index in h3_indexes[:3000]:
            if not h3_index:
                skipped.append(h3_index)
                continue
            try:
                ctx.zones.create(
                    h3_index=h3_index,
                    name=name,
                    description=description,
                    zone_type=zone_type,
                    metadata="{}",
                )
                created.append(h3_index)
            except Exception:
                # Already claimed, per the host's realm-wide uniqueness check.
                skipped.append(h3_index)

        return _ok({
            "created_count": len(created),
            "skipped_count": len(skipped),
            "created": created,
            "message": (
                "Painted %d zone(s), skipped %d already-claimed cell(s)"
                % (len(created), len(skipped))
            ),
        })
    except Exception as e:
        return _err(e)


def update_zone(args: str) -> str:
    """Update a territory zone's type, name, or description.

    The host allows this for the zone's owner or a realm admin, and ignores
    any field outside its write allowlist — ``user`` among them, so ownership
    cannot be reassigned.
    """
    try:
        params = _params(args)
        zone_id = params.get("zone_id") or params.get("h3_index")
        if not zone_id:
            return _err("zone_id is required")

        fields = {}
        if "zone_type" in params:
            zone_type, error = _check_zone_type(params)
            if error:
                return _err(error)
            fields["zone_type"] = zone_type
        if "name" in params:
            fields["name"] = params.get("name")
        if "description" in params:
            fields["description"] = params.get("description") or ""

        row = ctx.zones.update(zone_id, **fields)
        return _ok(dict(_serialize(row),
                        updated_fields=row.get("updated_fields", [])))
    except Exception as e:
        return _err(e)


def remove_zone(args: str) -> str:
    """Remove a territory zone (owner or realm admin, decided host-side)."""
    try:
        params = _params(args)
        zone_id = params.get("zone_id")
        if not zone_id:
            return _err("zone_id is required")

        ctx.zones.delete(zone_id)
        return _ok({"message": "Zone removed successfully"})
    except Exception as e:
        return _err(e)


def get_all_zones(args: str) -> str:
    """All territory zones, for map visualization and zoning admin.

    Territory zones (``land is None``) are realm-public via the Zone policy.
    Parcel geometry lives on Land; land-linked Zone rows are hidden host-side
    and skipped here as belt-and-suspenders.
    """
    try:
        rows = ctx.entities.rows("Zone")
        zones = []
        for row in rows:
            if row.get("land") is not None or row.get("land_id") is not None:
                continue
            zone = _serialize(row)
            if row.get("owner_id"):
                zone["user_id"] = row["owner_id"]
            zones.append(zone)

        return _ok(
            zones,
            zone_types=list(ZONE_TYPES),
            is_admin=ctx.is_admin(),
        )
    except Exception as e:
        return _err(e)
