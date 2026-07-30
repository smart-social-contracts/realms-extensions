"""Land Registry extension entry point, sandboxed.

Parcel registration, ownership transfer, and NFT bookkeeping.

The registry's invariants — one parcel per H3 cell, no two parcels on the same
coordinates, members own only residential land, an NFT is minted once — now
live in the host's ``land.*`` verbs rather than in this file. That matters
beyond tidiness: the write functions here were gated only by ``entry_access``
in this extension's own manifest, so the gate travelled with the code it was
meant to restrain. The host re-checks ``realm.admin`` where the extension
cannot reach it, and ``registered_by`` is now the authenticated caller instead
of a request field.
"""

import json

from ggg_sdk import ctx

DEFAULT_PAGE_SIZE = 10


def _params(args):
    return json.loads(args) if args else {}


def _ok(data, **extra):
    return json.dumps(dict({"success": True, "data": data}, **extra))


def _err(e):
    ctx.log(f"land_registry error: {e}")
    return json.dumps({"success": False, "error": str(e)})


def get_lands(args: str) -> str:
    """Get a page of land parcels, or all of them with ``{"all": true}``."""
    try:
        params = _params(args)
        if params.get("all"):
            result = ctx.lands.list(
                all=True, page_size=int(params.get("page_size", 100))
            )
            return _ok(result["lands"], count=result["count"])

        result = ctx.lands.list(
            from_id=int(params.get("from_id", 1)),
            page_size=int(params.get("page_size", DEFAULT_PAGE_SIZE)),
        )
        return _ok(
            result["lands"],
            max_id=result.get("max_id"),
            next_from_id=result.get("next_from_id"),
            has_more=result.get("has_more", False),
        )
    except Exception as e:
        return _err(e)


def get_land(args: str) -> str:
    """Get a single land parcel by ID with all details."""
    try:
        params = _params(args)
        if not params.get("land_id"):
            return json.dumps({"success": False, "error": "land_id is required"})
        return _ok(ctx.lands.get(params["land_id"]))
    except Exception as e:
        return _err(e)


def get_land_map(args: str) -> str:
    """Get land map data for visualization."""
    try:
        params = _params(args)
        result = ctx.lands.map(
            min_x=params.get("min_x", 0),
            max_x=params.get("max_x", 20),
            min_y=params.get("min_y", 0),
            max_y=params.get("max_y", 20),
            from_id=int(params.get("from_id", 1)),
            page_size=int(params.get("page_size", DEFAULT_PAGE_SIZE)),
        )
        return _ok(
            {"bounds": result["bounds"], "lands": result["lands"]},
            max_id=result.get("max_id"),
            next_from_id=result.get("next_from_id"),
            has_more=result.get("has_more", False),
        )
    except Exception as e:
        return _err(e)


def create_land(args: str) -> str:
    """Create a new land parcel, over H3 cells or at bare x/y coordinates."""
    try:
        params = _params(args)
        land = ctx.lands.create(
            land_type=params.get("land_type"),
            name=params.get("name", ""),
            id=params.get("id", ""),
            h3_index=params.get("h3_index"),
            h3_indexes=params.get("h3_indexes"),
            metadata=params.get("metadata"),
            x_coordinate=params.get("x_coordinate"),
            y_coordinate=params.get("y_coordinate"),
            size_width=params.get("size_width", 1),
            size_height=params.get("size_height", 1),
        )
        cells = land.get("h3_indexes") or []
        message = (
            f"Land created with {len(cells)} H3 cell(s)" if cells
            else "Land created successfully"
        )
        return _ok({
            "id": land["id"],
            "h3_index": land.get("h3_index"),
            "h3_indexes": cells,
            "message": message,
        })
    except Exception as e:
        return _err(e)


def update_land(args: str) -> str:
    """Update land parcel properties (type, status, metadata)."""
    try:
        params = _params(args)
        if not params.get("land_id"):
            return json.dumps({"success": False, "error": "land_id is required"})

        fields = {
            key: params[key]
            for key in ("land_type", "status", "metadata", "registered_by")
            if key in params
        }
        result = ctx.lands.update(params["land_id"], **fields)
        updated = result.get("updated_fields", [])
        return _ok({
            "message": f"Land updated successfully. Fields: {', '.join(updated)}",
            "updated_fields": updated,
        })
    except Exception as e:
        return _err(e)


def update_land_ownership(args: str) -> str:
    """Update land ownership.

    The user/organization split is enforced host-side, so an invalid transfer
    surfaces as an error here rather than being silently written.
    """
    try:
        params = _params(args)
        if not params.get("land_id"):
            return json.dumps({"success": False, "error": "land_id is required"})

        ctx.lands.set_owner(
            params["land_id"],
            owner_user_id=params.get("owner_user_id"),
            owner_organization_id=params.get("owner_organization_id"),
        )
        return _ok({"message": "Ownership updated successfully"})
    except Exception as e:
        return _err(e)


def register_land_nft(args: str) -> str:
    """Prepare a land parcel for NFT registration.

    Returns what the frontend needs to call ``mint_land_nft_for_parcel``.
    """
    try:
        params = _params(args)
        result = ctx.lands.prepare_nft(
            params.get("land_id", ""), params.get("owner_principal", "")
        )
        return _ok(dict(
            result,
            message="Land prepared for NFT minting. Call mint_land_nft_for_parcel.",
        ))
    except Exception as e:
        return _err(e)


def update_land_nft_token(args: str) -> str:
    """Record the NFT token ID for a land parcel after minting."""
    try:
        params = _params(args)
        result = ctx.lands.set_nft_token(
            params.get("land_id", ""), params.get("nft_token_id", "")
        )
        return _ok({
            "message": f"NFT token ID updated for land {result['land_id']}",
            "land_id": result["land_id"],
            "nft_token_id": result["nft_token_id"],
        })
    except Exception as e:
        return _err(e)
