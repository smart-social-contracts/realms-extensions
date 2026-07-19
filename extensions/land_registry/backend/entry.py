"""
Land Registry extension entry point
"""

import json
import traceback
from typing import Any, Dict

from ggg import Land, LandType, LandStatus, Organization, User, Zone
from ic_python_logging import get_logger

logger = get_logger("extensions.land_registry")

DEFAULT_PAGE_SIZE = 10


def get_lands(args: str) -> str:
    """Get a page of land parcels using load_some pagination"""
    logger.info(f"land_registry.get_lands called with args: {args}")

    try:
        params = json.loads(args) if args else {}
        from_id = int(params.get("from_id", 1))
        page_size = int(params.get("page_size", DEFAULT_PAGE_SIZE))

        max_id = Land.max_id()
        batch = Land.load_some(from_id=from_id, count=page_size)

        land_data = []
        for land in batch:
            # Get zone data for this land (zones associated with this land parcel)
            land_zones = list(land.zones) if hasattr(land, 'zones') and land.zones else []
            zone_data = []
            for zone in land_zones:
                zone_data.append({
                    "h3_index": zone.h3_index,
                    "name": zone.name,
                    "zone_type": getattr(zone, "zone_type", None) or "unassigned",
                })

            # Parse metadata to get price info
            try:
                metadata_obj = json.loads(land.metadata) if land.metadata else {}
            except:
                metadata_obj = {}

            land_dict = {
                "id": land.id,
                "x_coordinate": land.x_coordinate,
                "y_coordinate": land.y_coordinate,
                "land_type": land.land_type,
                "status": land.status,
                "size_width": land.size_width,
                "size_height": land.size_height,
                "metadata": land.metadata,
                "registered_by": land.registered_by,
                "nft_token_id": land.nft_token_id,
                "owner_user_id": land.owner_user.id if land.owner_user else None,
                "owner_organization_id": (
                    land.owner_organization.id if land.owner_organization else None
                ),
                # Zone/geographic data: backend stores only the H3 index.
                "zones": zone_data,
                "h3_index": zone_data[0]["h3_index"] if zone_data else None,
                # Parsed metadata fields
                "price_realm_tokens": metadata_obj.get("price_realm_tokens"),
                "for_sale": metadata_obj.get("for_sale", False),
            }
            land_data.append(land_dict)

        next_from_id = (int(batch[-1]._id) + 1) if batch else None
        if next_from_id and next_from_id > max_id:
            next_from_id = None

        return json.dumps({
            "success": True,
            "data": land_data,
            "max_id": max_id,
            "next_from_id": next_from_id,
            "has_more": next_from_id is not None,
        })

    except Exception as e:
        logger.error(f"Error in get_lands: {str(e)}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def create_land(args: str) -> str:
    """Create a new land parcel"""
    logger.info(f"land_registry.create_land called with args: {args}")

    try:
        params = json.loads(args) if args else {}

        x_coord = params.get("x_coordinate")
        y_coord = params.get("y_coordinate")
        land_type = params.get("land_type", LandType.UNASSIGNED)

        if x_coord is None or y_coord is None:
            return json.dumps(
                {
                    "success": False,
                    "error": "x_coordinate and y_coordinate are required",
                }
            )

        # Check for duplicate coordinates using load_some batches
        check_from = 1
        land_max = Land.max_id()
        while check_from <= land_max:
            check_batch = Land.load_some(from_id=check_from, count=DEFAULT_PAGE_SIZE)
            if not check_batch:
                break
            for existing_land in check_batch:
                if (
                    existing_land.x_coordinate == x_coord
                    and existing_land.y_coordinate == y_coord
                ):
                    return json.dumps(
                        {
                            "success": False,
                            "error": "Land already exists at these coordinates",
                        }
                    )
            check_from = int(check_batch[-1]._id) + 1

        land = Land(
            x_coordinate=x_coord,
            y_coordinate=y_coord,
            land_type=land_type,
            size_width=params.get("size_width", 1),
            size_height=params.get("size_height", 1),
            metadata=params.get("metadata", "{}"),
        )

        # `id` is Land's __alias__ field; if the caller didn't provide one, derive
        # a stable handle from the primary key so the response is usable for lookups.
        land.id = params.get("id") or str(land._id)

        return json.dumps(
            {
                "success": True,
                "data": {"id": land.id, "message": "Land created successfully"},
            }
        )

    except Exception as e:
        logger.error(f"Error in create_land: {str(e)}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def update_land_ownership(args: str) -> str:
    """Update land ownership"""
    logger.info(f"land_registry.update_land_ownership called with args: {args}")

    try:
        params = json.loads(args) if args else {}

        land_id = params.get("land_id")
        owner_user_id = params.get("owner_user_id")
        owner_organization_id = params.get("owner_organization_id")

        if not land_id:
            return json.dumps({"success": False, "error": "land_id is required"})

        land = Land.load(land_id)
        if not land:
            return json.dumps({"success": False, "error": "Land not found"})

        if owner_user_id and owner_organization_id:
            return json.dumps(
                {
                    "success": False,
                    "error": "Land cannot be owned by both user and organization",
                }
            )

        if owner_user_id:
            if land.land_type != LandType.RESIDENTIAL:
                return json.dumps(
                    {
                        "success": False,
                        "error": "Members can only own residential land",
                    }
                )

            user = User.load(owner_user_id)
            if not user:
                return json.dumps({"success": False, "error": "User not found"})

            land.owner_user = user
            land.owner_organization = None

        elif owner_organization_id:
            if land.land_type == LandType.RESIDENTIAL:
                return json.dumps(
                    {
                        "success": False,
                        "error": "Organizations cannot own residential land",
                    }
                )

            org = Organization.load(owner_organization_id)
            if not org:
                return json.dumps({"success": False, "error": "Organization not found"})

            land.owner_organization = org
            land.owner_user = None

        else:
            land.owner_user = None
            land.owner_organization = None

        # ggg entities persist on attribute assignment; there is no save().

        return json.dumps(
            {"success": True, "data": {"message": "Ownership updated successfully"}}
        )

    except Exception as e:
        logger.error(
            f"Error in update_land_ownership: {str(e)}\n{traceback.format_exc()}"
        )
        return json.dumps({"success": False, "error": str(e)})


def get_land_map(args: str) -> str:
    """Get land map data for visualization"""
    logger.info(f"land_registry.get_land_map called with args: {args}")

    try:
        params = json.loads(args) if args else {}

        min_x = params.get("min_x", 0)
        max_x = params.get("max_x", 20)
        min_y = params.get("min_y", 0)
        max_y = params.get("max_y", 20)

        from_id = int(params.get("from_id", 1))
        page_size = int(params.get("page_size", DEFAULT_PAGE_SIZE))

        land_max_id = Land.max_id()
        batch = Land.load_some(from_id=from_id, count=page_size)
        map_data = {}

        for land in batch:
            if (
                min_x <= land.x_coordinate <= max_x
                and min_y <= land.y_coordinate <= max_y
            ):
                key = f"{land.x_coordinate},{land.y_coordinate}"
                map_data[key] = {
                    "id": land.id,
                    "x": land.x_coordinate,
                    "y": land.y_coordinate,
                    "type": land.land_type,
                    "owner_type": (
                        "user"
                        if land.owner_user
                        else "organization" if land.owner_organization else "none"
                    ),
                    "owner_name": (
                        land.owner_user.id
                        if land.owner_user
                        else (
                            land.owner_organization.name
                            if land.owner_organization
                            else None
                        )
                    ),
                }

        next_from_id = (int(batch[-1]._id) + 1) if batch else None
        if next_from_id and next_from_id > land_max_id:
            next_from_id = None

        return json.dumps(
            {
                "success": True,
                "data": {
                    "bounds": {
                        "min_x": min_x,
                        "max_x": max_x,
                        "min_y": min_y,
                        "max_y": max_y,
                    },
                    "lands": map_data,
                },
                "max_id": land_max_id,
                "next_from_id": next_from_id,
                "has_more": next_from_id is not None,
            }
        )

    except Exception as e:
        logger.error(f"Error in get_land_map: {str(e)}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def get_land(args: str) -> str:
    """Get a single land parcel by ID with all details"""
    logger.info(f"land_registry.get_land called with args: {args}")

    try:
        params = json.loads(args) if args else {}
        land_id = params.get("land_id")

        if not land_id:
            return json.dumps({"success": False, "error": "land_id is required"})

        land = Land[land_id]
        if not land:
            return json.dumps({"success": False, "error": "Land not found"})

        # Get zone data for this land via reverse relation
        zone_data = {}
        land_zones = list(land.zones) if hasattr(land, 'zones') and land.zones else []
        if land_zones:
            zone = land_zones[0]
            zone_data = {
                "h3_index": zone.h3_index,
                "name": zone.name,
                "zone_type": getattr(zone, "zone_type", None) or "unassigned",
            }

        # Parse metadata for price and for_sale
        metadata_parsed = {}
        if land.metadata:
            try:
                metadata_parsed = json.loads(land.metadata)
            except json.JSONDecodeError:
                pass

        land_data = {
            "id": land.id,
            "x_coordinate": land.x_coordinate,
            "y_coordinate": land.y_coordinate,
            "land_type": land.land_type,
            "status": land.status,
            "size_width": land.size_width,
            "size_height": land.size_height,
            "metadata": land.metadata,
            "registered_by": land.registered_by,
            "nft_token_id": land.nft_token_id,
            "owner_user_id": land.owner_user.id if land.owner_user else None,
            "owner_organization_id": (
                land.owner_organization.id if land.owner_organization else None
            ),
            "owner_user_name": land.owner_user.nickname if land.owner_user else None,
            "owner_organization_name": (
                land.owner_organization.name if land.owner_organization else None
            ),
            # Zone data: H3 index only; geometry is computed on the frontend.
            "h3_index": zone_data.get("h3_index"),
            # Parsed metadata
            "price_realm_tokens": metadata_parsed.get("price_realm_tokens"),
            "for_sale": metadata_parsed.get("for_sale", False),
        }
        return json.dumps({"success": True, "data": land_data})

    except Exception as e:
        logger.error(f"Error in get_land: {str(e)}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def update_land(args: str) -> str:
    """Update land parcel properties (type, status, metadata)"""
    logger.info(f"land_registry.update_land called with args: {args}")

    try:
        params = json.loads(args) if args else {}
        land_id = params.get("land_id")

        if not land_id:
            return json.dumps({"success": False, "error": "land_id is required"})

        land = Land[land_id]
        if not land:
            return json.dumps({"success": False, "error": "Land not found"})

        updated_fields = []

        if "land_type" in params:
            land.land_type = params["land_type"]
            updated_fields.append("land_type")
        if "status" in params:
            land.status = params["status"]
            updated_fields.append("status")
        if "metadata" in params:
            land.metadata = params["metadata"]
            updated_fields.append("metadata")
        if "registered_by" in params:
            land.registered_by = params["registered_by"]
            updated_fields.append("registered_by")

        return json.dumps({
            "success": True,
            "data": {
                "message": f"Land updated successfully. Fields: {', '.join(updated_fields)}",
                "updated_fields": updated_fields
            }
        })

    except Exception as e:
        logger.error(f"Error in update_land: {str(e)}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def register_land_nft(args: str) -> str:
    """
    Prepare a land parcel for NFT registration.
    Returns info needed for frontend to call mint_land_nft_for_parcel on backend.
    """
    logger.info(f"land_registry.register_land_nft called with args: {args}")

    try:
        params = json.loads(args) if args else {}
        land_id = params.get("land_id")
        owner_principal = params.get("owner_principal")
        registered_by = params.get("registered_by", "")

        if not land_id:
            return json.dumps({"success": False, "error": "land_id is required"})

        if not owner_principal:
            return json.dumps({"success": False, "error": "owner_principal is required"})

        land = Land[land_id]
        if not land:
            return json.dumps({"success": False, "error": "Land not found"})

        if land.nft_token_id:
            return json.dumps({
                "success": False,
                "error": f"Land already has NFT minted (token_id: {land.nft_token_id})"
            })

        # Update registration info
        if registered_by:
            land.registered_by = registered_by
        land.status = LandStatus.ACTIVE

        # Generate a token_id based on coordinates (unique per land)
        token_id = land.x_coordinate * 10000 + land.y_coordinate

        return json.dumps({
            "success": True,
            "data": {
                "land_id": land_id,
                "owner_principal": owner_principal,
                "token_id": token_id,
                "x_coordinate": land.x_coordinate,
                "y_coordinate": land.y_coordinate,
                "message": "Land prepared for NFT minting. Call mint_land_nft_for_parcel.",
                "requires_mint": True
            }
        })

    except Exception as e:
        logger.error(f"Error in register_land_nft: {str(e)}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def update_land_nft_token(args: str) -> str:
    """Update the NFT token ID for a land parcel after minting"""
    logger.info(f"land_registry.update_land_nft_token called with args: {args}")

    try:
        params = json.loads(args) if args else {}
        land_id = params.get("land_id")
        nft_token_id = params.get("nft_token_id")

        if not land_id:
            return json.dumps({"success": False, "error": "land_id is required"})

        if not nft_token_id:
            return json.dumps({"success": False, "error": "nft_token_id is required"})

        land = Land[land_id]
        if not land:
            return json.dumps({"success": False, "error": "Land not found"})

        land.nft_token_id = str(nft_token_id)

        return json.dumps({
            "success": True,
            "data": {
                "message": f"NFT token ID updated for land {land_id}",
                "land_id": land_id,
                "nft_token_id": nft_token_id
            }
        })

    except Exception as e:
        logger.error(f"Error in update_land_nft_token: {str(e)}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})
