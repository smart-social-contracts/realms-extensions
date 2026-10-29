# System Info Extension

Admin dashboard showing the realm's version, canister id, installed extensions and entity counts.

## Features

- **Realms** version
- **Installed extensions** with version and description
- **Database entities** — per-type counts

## Realm operations

| Operation | Description |
|---|---|
| `status` | Version and canister id |
| `realm_monitor` | Running version and row counts per entity |
| `extension_list` | Installed extensions, page by page |

## Access

`realm_monitor` needs `realm.monitor`. Available at `/extensions/system_info`.
