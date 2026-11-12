/** Days and times as the issue writes them: in the realm's official time zone, in the reader's language. */

/** "11:30": the time of day of UTC seconds `at` in the realm's zone. */
export function timeOfDay(at: number, zone: string): string {
	return new Intl.DateTimeFormat('en-GB', { timeZone: zone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(
		new Date(at * 1000),
	);
}

/** The issue's day written out in the reader's language ("lunes, 9 de noviembre de 2026"). */
export function longDate(day: string, locale: string): string {
	return new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeZone: 'UTC' }).format(new Date(`${day}T00:00:00Z`));
}

/** The day of UTC seconds `at` in the realm's zone, written out in the reader's language ("1 de enero de 2027"). */
export function dayOf(at: number, zone: string, locale: string): string {
	return new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: zone }).format(new Date(at * 1000));
}

/** The day and the time of UTC seconds `at` in the realm's zone, in the reader's language ("9 de noviembre de 2026, 11:30"). */
export function momentOf(at: number, zone: string, locale: string): string {
	// Spelled-out fields, not `timeStyle`: some languages write the hour of 00:30 as 0:30 there, and the entries write 00:30.
	return new Intl.DateTimeFormat(locale, {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		hourCycle: 'h23',
		timeZone: zone,
	}).format(new Date(at * 1000));
}

/** "UTC+01:00": how far the realm's zone is from UTC at noon of `day`. (On the day a clock changes, the entries before the
 * change are an hour off it; each entry's own time carries its UTC time too.) */
export function utcOffset(day: string, zone: string): string {
	const parts = new Intl.DateTimeFormat('en', { timeZone: zone, timeZoneName: 'longOffset' }).formatToParts(
		new Date(`${day}T12:00:00Z`),
	);
	return (parts.find((part) => part.type === 'timeZoneName')?.value ?? 'GMT').replace('GMT', 'UTC');
}
