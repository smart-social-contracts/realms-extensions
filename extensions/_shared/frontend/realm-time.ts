/**
 * The realm's official time: an IANA zone (`realm_info.timezone`) that times of day are entered and shown in.
 * The browser's Intl knows the zones; the realm stores and compares only UTC seconds.
 */

export const UTC = 'UTC';

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;
// "YYYY-MM-DDTHH:mm", the value of a datetime-local input.
const LOCAL_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(zone: string): Intl.DateTimeFormat {
	let formatter = formatters.get(zone);
	if (!formatter) {
		formatter = new Intl.DateTimeFormat('en-US', {
			timeZone: zone,
			hourCycle: 'h23',
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
		});
		formatters.set(zone, formatter);
	}
	return formatter;
}

/** Whether the browser knows ``zone``, an IANA name such as ``Europe/Madrid``. */
export function isKnownZone(zone: string): boolean {
	try {
		formatterFor(zone);
		return true;
	} catch {
		return false;
	}
}

/** The wall clock of ``zone`` at ``epochMs``, read as if it were UTC. */
function wallClockAsUtc(epochMs: number, zone: string): number {
	const parts: Record<string, number> = {};
	for (const part of formatterFor(zone).formatToParts(new Date(epochMs))) {
		if (part.type !== 'literal') parts[part.type] = Number(part.value);
	}
	return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
}

/** Minutes ``zone`` is ahead of UTC at ``epochMs``. */
export function offsetMinutes(epochMs: number, zone: string): number {
	const wholeSecond = Math.floor(epochMs / 1000) * 1000;
	return Math.round((wallClockAsUtc(epochMs, zone) - wholeSecond) / MINUTE_MS);
}

/** "UTC+01:00", "UTC-03:30". */
export function formatOffset(minutes: number): string {
	const sign = minutes < 0 ? '-' : '+';
	const abs = Math.abs(minutes);
	return `UTC${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
}

/** What a wall-clock time of a zone is: one instant, none (the clocks skip it) or two (the clocks repeat it). */
export type LocalTime =
	| { kind: 'ok'; epoch: number }
	| { kind: 'gap' }
	| { kind: 'twice'; first: number; second: number }
	| { kind: 'invalid' };

/**
 * The instant, in epoch seconds, of the wall-clock time ``value`` ("YYYY-MM-DDTHH:mm") in ``zone``.
 * A time the clocks skip (spring forward) or repeat (fall back) names no single instant: it is not guessed.
 */
export function resolveLocalTime(value: string, zone: string): LocalTime {
	const match = LOCAL_TIME.exec(value);
	if (!match || !isKnownZone(zone)) return { kind: 'invalid' };
	const [year, month, day, hour, minute] = match.slice(1).map(Number);
	const wall = Date.UTC(year, month - 1, day, hour, minute);
	const written = new Date(wall);
	if (written.getUTCDate() !== day || written.getUTCMonth() !== month - 1 || hour > 23 || minute > 59) {
		return { kind: 'invalid' }; // 30 February, 24:00 ...
	}
	// The zone's offset before and after any change of the day around it; each offset that holds at the instant it
	// gives is a reading of the wall clock.
	const instants = new Set<number>();
	for (const probe of [wall - DAY_MS, wall + DAY_MS]) {
		const offset = offsetMinutes(probe, zone);
		const instant = wall - offset * MINUTE_MS;
		if (offsetMinutes(instant, zone) === offset) instants.add(instant / 1000);
	}
	const found = [...instants].sort((a, b) => a - b);
	if (found.length === 0) return { kind: 'gap' };
	if (found.length === 1) return { kind: 'ok', epoch: found[0] };
	return { kind: 'twice', first: found[0], second: found[1] };
}

/** "2026-11-07 10:30": the wall clock of ``zone`` at ``epoch`` seconds. */
function formatWallClock(epoch: number, zone: string): string {
	return new Date(wallClockAsUtc(epoch * 1000, zone)).toISOString().slice(0, 16).replace('T', ' ');
}

/** "2026-11-07 10:30 UTC" */
export function formatUtc(epoch: number): string {
	return `${formatWallClock(epoch, UTC)} UTC`;
}

/** "2026-11-07 11:30 Europe/Madrid (UTC+01:00)" */
export function formatInZone(epoch: number, zone: string): string {
	if (zone === UTC) return formatUtc(epoch);
	return `${formatWallClock(epoch, zone)} ${zone} (${formatOffset(offsetMinutes(epoch * 1000, zone))})`;
}

/** The realm's time and the UTC instant it stands for: "2026-11-07 11:30 Europe/Madrid (UTC+01:00) · 2026-11-07 10:30 UTC". */
export function formatWithUtc(epoch: number, zone: string): string {
	return zone === UTC ? formatUtc(epoch) : `${formatInZone(epoch, zone)} · ${formatUtc(epoch)}`;
}

/** A realm-wide time as people read it: the official time, and the quarter's own beside it when its clock differs then. */
export interface RealmWideTime {
	official: string;
	local: string | null;
}

/**
 * ``epoch`` seconds in the official zone (the capital's), with the quarter's local time beside it when the two clocks
 * show different times at that instant (layered-codex.md §4.5). A zone the browser does not know reads as UTC.
 */
export function formatRealmWide(epoch: number, officialZone: string, localZone: string): RealmWideTime {
	const official = isKnownZone(officialZone) ? officialZone : UTC;
	const local = isKnownZone(localZone) ? localZone : UTC;
	const differs = offsetMinutes(epoch * 1000, official) !== offsetMinutes(epoch * 1000, local);
	return { official: formatInZone(epoch, official), local: differs ? formatInZone(epoch, local) : null };
}

/** The zones to choose from: UTC, then the browser's IANA zones (Chrome lists no UTC). */
export function timeZoneChoices(): string[] {
	const supported: string[] =
		typeof (Intl as any).supportedValuesOf === 'function' ? (Intl as any).supportedValuesOf('timeZone') : [];
	return [UTC, ...supported.filter((zone) => zone !== UTC).sort()];
}

/** The choice that ``text`` names, ignoring case and surrounding spaces; null when there is none. */
export function matchZone(choices: string[], text: string): string | null {
	const wanted = text.trim().toLowerCase();
	return choices.find((zone) => zone.toLowerCase() === wanted) ?? null;
}
