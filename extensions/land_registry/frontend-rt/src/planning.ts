/**
 * What the registry shows of planning (GGG domain `planning`, I-AST-6, I-LIC-4): the zones a parcel lies in, which the
 * realm sets with `land_zone_set`, and the licences that name a parcel (`License.land`). GGG keeps no plan or boundary,
 * only which parcels lie in which zone, so a planning zone has no shape to draw on the map.
 */

/** The most zones a parcel lies in (realms-gos `api/assets.py` ZONES_MAX, ggg I-AST-6). */
export const MAX_ZONES = 8;

export type Zone = { id: string; name: string; kind: string };
export type Licence = { id: string; kind: string; holder: string; status: string; expires_at: number; land: string };

/** Whether an id is that of a member's home cell, an h3 index: 15 hex digits, the first an 8. */
export function isHomeCell(id: string): boolean {
	return /^8[0-9a-f]{14}$/i.test(id);
}

/**
 * Whether a zone `land_map` lists is one the realm defines (`zone_define`) rather than a member's home cell: the realm says so
 * with `defined`. A realm whose `land_map` does not say yet (it lists both kinds with the same fields and no flag, and no
 * other read lists the defined zones alone) is read by the shape of the id, which is all there is to go by.
 */
export function isDefinedZone(row: unknown): boolean {
	const { id, defined } = (row ?? {}) as { id?: unknown; defined?: unknown };
	if (typeof defined === 'boolean') return defined;
	return !isHomeCell(String(id ?? ''));
}

/** The zones the realm defines among the zones `land_map` lists, by name. */
export function planningZones(rows: unknown[]): Zone[] {
	return rows
		.filter((row: any) => row?.id && isDefinedZone(row))
		.map((row: any) => ({ id: String(row.id), name: String(row.name ?? ''), kind: String(row.kind ?? '') }))
		.sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id));
}

/** The zones a parcel lies in as the realm sends them (`lies_in`); none for a row that has no list of text. */
export function zonesOf(raw: unknown): string[] {
	return Array.isArray(raw) ? raw.filter((zone): zone is string => typeof zone === 'string') : [];
}

/** A zone's name, or its id when the realm lists no such zone. */
export function zoneName(zones: Zone[], id: string): string {
	return zones.find((zone) => zone.id === id)?.name || id;
}

/** ``chosen`` with ``zone`` taken out if it is in, put in if it is not and the parcel has room. */
export function toggleZone(chosen: string[], zone: string, max = MAX_ZONES): string[] {
	if (chosen.includes(zone)) return chosen.filter((id) => id !== zone);
	return chosen.length < max ? [...chosen, zone] : chosen;
}

/** Whether two lists name the same zones, whatever the order. */
export function sameZones(a: string[], b: string[]): boolean {
	return a.length === b.length && a.every((zone) => b.includes(zone));
}

/** The filter's value for the parcels in no zone: a control character, which no zone a person defines starts with. */
export const NO_ZONE = '\u0001no-zone';

/** The parcels ``lands`` that lie in ``zone``, in none of them for `NO_ZONE`, or all of them for no zone. */
export function inZone<T extends { zones: string[] }>(lands: T[], zone: string): T[] {
	if (!zone) return lands;
	return zone === NO_ZONE ? lands.filter((land) => !land.zones.length) : lands.filter((land) => land.zones.includes(zone));
}

/** The licences that name a parcel, by parcel, from the rows of `license_list` (each says its `land`, or has none). */
export function licencesByParcel(rows: unknown[]): Map<string, Licence[]> {
	const byParcel = new Map<string, Licence[]>();
	for (const row of rows as any[]) {
		const land = String(row?.land ?? '');
		if (!land || !row?.id) continue;
		const licence: Licence = {
			id: String(row.id),
			kind: String(row.kind ?? ''),
			holder: String(row.holder ?? ''),
			status: String(row.status ?? ''),
			expires_at: Number(row.expires_at) || 0,
			land,
		};
		byParcel.set(land, [...(byParcel.get(land) ?? []), licence]);
	}
	return byParcel;
}
