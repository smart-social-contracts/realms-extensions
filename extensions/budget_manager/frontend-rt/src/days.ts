import { offsetMinutes } from '../../../_shared/frontend/realm-time.ts';

const MINUTE_MS = 60_000;

/** "2026-11-30": the day of ``epoch`` seconds in ``zone``, the realm's own time zone. */
export function dayInZone(epoch: number, zone: string): string {
	return new Date(epoch * 1000 + offsetMinutes(epoch * 1000, zone) * MINUTE_MS).toISOString().slice(0, 10);
}
