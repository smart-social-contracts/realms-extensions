/**
 * An issue of the journal as a sheet of paper: a complete HTML page with its own style, shown on screen and printed by
 * the browser, so that "Save as PDF" makes the file and every script the browser has a font for prints (Chinese
 * included). The issue's JSON, served by the realm, is the authority; this is only a rendering of it and is never
 * checksummed.
 */

export interface Entry {
	id: string;
	/** UTC seconds: when the realm learned of it. */
	at: number;
	kind: string;
	details: Record<string, any>;
}

export interface Issue {
	/** The name of the realm that issues it: on a quarter, the capital's. */
	realm: string;
	day: string;
	number: number;
	first_day: string;
	today: string;
	timezone: string;
	entries: Entry[];
}

export type Text = (key: string, vars?: Record<string, string | number>) => string;

export function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

/** "eu/es 2.4.0, eu/es/vc 1.1.0": the layers of a codex with the release versions they hold. */
function layersText(layers: any): string {
	if (!Array.isArray(layers)) return '';
	return layers
		.map((layer: any) => {
			const versions = Array.isArray(layer?.versions) ? layer.versions.join(', ') : '';
			return versions ? `${layer.source} ${versions}` : String(layer?.source ?? '');
		})
		.filter(Boolean)
		.join(', ');
}

/** The change a `not_recorded` entry stands for, named by its codices or its release: the realm made it, but not its entry. */
export function missedChange(entry: Entry, t: Text): string {
	const { kind, codex, reverted, source, version } = entry.details;
	if (kind === 'codex_reverted') return t('missed_codex_reverted', { codex: String(codex), reverted: String(reverted) });
	if (kind === 'codex_installed') return t('missed_codex_installed', { codex: String(codex) });
	if (kind === 'release_found' || kind === 'release_published') return t(`missed_${kind}`, { source: String(source), version: String(version) });
	return t('missed_unknown', { kind: String(kind) });
}

/** A release the realm found or published: which one, and the day it is in force from. Without the fields the
 * personal-data rules allow, only that there was one. */
function releaseText(entry: Entry, t: Text, day: (seconds: number) => string): string {
	const { source, version, effective_from } = entry.details;
	const key = `entry_${entry.kind}`;
	const known = typeof source === 'string' && typeof version === 'string' && typeof effective_from === 'number';
	return known ? t(key, { source, version, date: day(effective_from) }) : t(`${key}_plain`);
}

/** What an entry says, in the reader's language; `day` writes out a day for the dates it names. A kind this version
 * does not know is still shown. */
export function entryText(entry: Entry, t: Text, day: (seconds: number) => string): string {
	if (entry.kind === 'not_recorded') return t('entry_not_recorded', { change: missedChange(entry, t) });
	if (entry.kind === 'release_found' || entry.kind === 'release_published') return releaseText(entry, t, day);
	if (entry.kind === 'codex_installed' || entry.kind === 'codex_reverted') {
		const key = `entry_${entry.kind}`;
		const layers = layersText(entry.details.layers);
		return layers ? t(key, { layers }) : t(`${key}_plain`);
	}
	return t('entry_unknown', { kind: entry.kind });
}

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

const STYLE = `
@page { size: A4; margin: 18mm; }
* { box-sizing: border-box; }
body { margin: 0; padding: 12mm 14mm; color: #111; background: #fff; font: 11pt/1.5 Georgia, 'Times New Roman', serif; }
header { display: flex; gap: 14px; align-items: center; border-bottom: 2px solid #111; padding-bottom: 10px; }
header img { max-height: 18mm; max-width: 40mm; object-fit: contain; }
h1 { margin: 0; font-size: 18pt; line-height: 1.2; }
.meta { margin: 2px 0 0; font-size: 10pt; color: #444; }
ol { list-style: none; margin: 16px 0 0; padding: 0; }
li { display: flex; gap: 14px; padding: 8px 0; border-bottom: 1px solid #ccc; break-inside: avoid; }
time { flex: none; width: 3.2em; font-variant-numeric: tabular-nums; color: #444; }
.empty { margin: 16px 0 0; color: #444; font-style: italic; }
footer { margin-top: 18px; font-size: 9pt; color: #555; }
`;

/**
 * The whole page of an issue, for an iframe's `srcdoc` and for the browser to print. `logoUrl` is the logo of the realm
 * that issues it, as the realm serves it, or empty when there is none to show.
 */
export function sheetHtml(issue: Issue, logoUrl: string, t: Text, locale: string): string {
	const title = issue.realm ? t('journal_of', { realm: issue.realm }) : t('journal');
	const logo = logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="">` : '';
	const day = (seconds: number) => dayOf(seconds, issue.timezone, locale);
	const entries = issue.entries.length
		? `<ol>${issue.entries
				.map(
					(entry) =>
						`<li><time datetime="${new Date(entry.at * 1000).toISOString()}">${timeOfDay(entry.at, issue.timezone)}</time>` +
						`<span>${escapeHtml(entryText(entry, t, day))}</span></li>`,
				)
				.join('')}</ol>`
		: `<p class="empty">${escapeHtml(t('no_entries'))}</p>`;
	return (
		`<!doctype html><html lang="${escapeHtml(locale)}"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>` +
		`<style>${STYLE}</style></head><body>` +
		`<header>${logo}<div><h1>${escapeHtml(title)}</h1>` +
		`<p class="meta">${escapeHtml(t('issue_number', { number: issue.number }))} · ${escapeHtml(longDate(issue.day, locale))}</p></div></header>` +
		`${entries}` +
		`<footer>${escapeHtml(t('entries_count', { count: issue.entries.length }))} · ${escapeHtml(t('times_in', { zone: issue.timezone }))}</footer>` +
		`</body></html>`
	);
}
