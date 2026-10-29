# Zone Selector Extension

Allow users to set their "zones of influence" via browser geolocation or manual map selection.

## Features

- **Geolocation Support**: Request browser location permission (voluntary) to quickly add a zone at the user's current location
- **Manual Map Selection**: Click on an interactive map to select H3 hexagonal areas as zones of influence
- **Zone Management**: View, add, and remove your zones
- **H3 Integration**: Uses Uber's H3 hexagonal hierarchical geospatial indexing system

## Realm operations

The extension has no backend. It pages through the realm's zones with `land_map` and draws them on the map.
Editing zones (painting, retyping, renaming, removing) is not supported by this realm version: the realm's
`Zone` is a member's home cell, set with `zone_set` / `zone_clear`, and has no operation for territory zoning.

## Usage

### Adding a Zone via Geolocation

1. Navigate to the Zone Selector extension
2. Click "Use My Location" button
3. Grant browser location permission when prompted
4. Confirm to add the zone at your current location

### Adding a Zone via Map

1. Navigate to the Zone Selector extension  
2. Click on the map at your desired location
3. Enter a name for the zone when prompted
4. The zone will be created with an H3 hexagonal boundary

### Removing a Zone

1. Go to "My Zones" tab
2. Click the trash icon next to the zone you want to remove
3. Confirm the deletion

## Data Model

Zones are stored using the `Zone` GGG entity with the following fields:

- `h3_index`: H3 hexagonal index at resolution 6
- `name`: User-provided zone name
- `description`: Auto-generated or user-provided description
- `latitude`: Center latitude
- `longitude`: Center longitude
- `resolution`: H3 resolution (default: 6)
- `user`: Reference to the User who owns the zone

## Privacy

- Location permission is **voluntary** - users can always select zones manually on the map
- Zone data is stored in the realm's backend canister
- All zones are visible on the realm registry map (aggregate view)
