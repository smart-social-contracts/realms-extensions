/**
 * An issue of the journal as a sheet of paper: a complete HTML page with its own style, shown on screen and printed by
 * the browser, so that "Save as PDF" makes the file and every script the browser has a font for prints (Chinese
 * included). The issue's JSON, served by the realm, is the authority; this is only a rendering of it and is never
 * checksummed.
 */

import { dayOf, longDate, momentOf, timeOfDay, utcOffset } from './dates.ts';
import { describe, SECTIONS, shortId, type Described } from './entries.ts';
import { entryReference, issueReference, type Entry, type Issue, type Text } from './issue.ts';
import { pageRules, SHEET_STYLE } from './sheetStyle.ts';

/** What the sheet shows of the realm that issues the journal besides the issue. */
export interface Issuer {
	/** The realm's logo as the realm serves it, or empty when there is none to show. */
	logoUrl: string;
	/** The realm's identity: the canister that issues the journal. */
	canisterId: string;
	/** Where the realm is served from: empty, or `/r/<slug>`. The sheet's links are paths on the realm's origin. */
	prefix: string;
}

interface View {
	issue: Issue;
	issuer: Issuer;
	t: Text;
	locale: string;
}

/** An entry of the issue with its place in it and what it says. */
interface Item {
	entry: Entry;
	position: number;
	described: Described;
}

/** The numerals of the sections, one for each of `SECTIONS`. */
const NUMERALS = ['I', 'II'];

export function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

const esc = escapeHtml;

function mastheadHtml({ issue, issuer, t }: View, title: string): string {
	const logo = issuer.logoUrl ? `<img src="${esc(issuer.logoUrl)}" alt="">` : '<span></span>';
	const identity = issuer.canisterId ? `<p class="identity mono">${esc(t('identity', { id: issuer.canisterId }))}</p>` : '';
	return (
		`<header class="masthead">${logo}<div class="title"><h1>${esc(title)}</h1>${identity}</div>` +
		`<p class="number">${esc(t('issue_number', { number: issue.number }))}</p></header>`
	);
}

/** The day, and the zone the times of the issue are in. A realm that has not set a zone is on UTC, and says so. */
function datelineHtml({ issue, t, locale }: View): string {
	const zone =
		issue.timezone === 'UTC'
			? t('times_in_utc')
			: t('official_time', { zone: issue.timezone, offset: utcOffset(issue.day, issue.timezone) });
	return (
		`<p class="dateline"><time class="day" datetime="${esc(issue.day)}">${esc(longDate(issue.day, locale))}</time>` +
		`<span>${esc(zone)}</span></p>`
	);
}

/** The ids of the codices an entry names: short on the screen with the whole id on hover, whole on paper. */
function codicesHtml({ codices }: Described): string {
	const rows = codices.map(
		({ label, id }) =>
			`<div><dt>${esc(label)}</dt><dd class="mono"><abbr class="short" title="${esc(id)}">${esc(shortId(id))}</abbr>` +
			`<span class="full">${esc(id)}</span></dd></div>`,
	);
	return rows.length ? `<dl class="codices">${rows.join('')}</dl>` : '';
}

/** Links to the pages of the realm that tell more: on the screen only, since paper has nowhere to follow them. */
function linksHtml({ links }: Described, prefix: string): string {
	const anchors = links.map(({ label, path }) => `<a href="${esc(prefix + path)}">${esc(label)}</a>`);
	return anchors.length ? `<p class="links">${anchors.join('')}</p>` : '';
}

function entryHtml({ entry, position, described }: Item, { issue, issuer }: View): string {
	const instant = new Date(entry.at * 1000).toISOString();
	return (
		`<article><p class="ref">${esc(entryReference(issue, position))} · ` +
		`<time datetime="${instant}" title="${instant.slice(11, 16)} UTC">${timeOfDay(entry.at, issue.timezone)}</time></p>` +
		`<h3>${esc(described.title)}</h3><p class="facts">${described.facts.map(esc).join(' ')}</p>` +
		`${codicesHtml(described)}${linksHtml(described, issuer.prefix)}</article>`
	);
}

/** The sections that have entries, numbered in the order they are printed. */
function sectionsHtml(items: Item[], view: View): string {
	const present = SECTIONS.filter((section) => items.some((item) => item.described.section === section));
	return present
		.map(
			(section, index) =>
				`<section aria-labelledby="section-${section}"><h2 class="section-title" id="section-${section}">` +
				`${NUMERALS[index]}. ${esc(view.t(`section_${section}`))}</h2>` +
				`${items
					.filter((item) => item.described.section === section)
					.map((item) => entryHtml(item, view))
					.join('')}</section>`,
		)
		.join('');
}

/** What the signature of an issue is made of, each a field of the slot below. */
const SIGNATURE_FIELDS = ['issue_hash', 'signature', 'key_id', 'verification_code', 'verification_url'];

/**
 * The place of the issue's signature and its verification. The signing work fills each `data-field` of it: the hash of the
 * issue, the realm's signature of it, the id of the key that made it, a code to check it by and the address that checks it,
 * with its QR in `verification_qr`. Until then the fields are empty.
 */
function signatureSlotHtml({ t }: View): string {
	const fields = SIGNATURE_FIELDS.map(
		(field) => `<dt>${esc(t(`signature_${field}`))}</dt><dd class="mono" data-field="${field}">—</dd>`,
	);
	return (
		`<section class="authentication" data-slot="signature" aria-labelledby="authentication-title">` +
		`<h2 id="authentication-title">${esc(t('signature_title'))}</h2><dl>${fields.join('')}</dl>` +
		`<div class="qr" data-field="verification_qr" aria-hidden="true"></div></section>`
	);
}

function colophonHtml({ issue, t }: View, title: string): string {
	return (
		`<footer class="colophon"><span>${esc(title)} · ${esc(issueReference(issue))}</span>` +
		`<span>${esc(t('entries_count', { count: issue.entries.length }))}</span></footer>`
	);
}

/**
 * The whole page of an issue, for an iframe's `srcdoc` and for the browser to print. `issuer` says what the page shows of
 * the realm that issues it, as the realm serves it.
 */
export function sheetHtml(issue: Issue, issuer: Issuer, t: Text, locale: string): string {
	const view = { issue, issuer, t, locale };
	const title = issue.realm ? t('journal_of', { realm: issue.realm }) : t('journal');
	const clock = {
		day: (seconds: number) => dayOf(seconds, issue.timezone, locale),
		moment: (seconds: number) => momentOf(seconds, issue.timezone, locale),
	};
	const items = issue.entries.map((entry, index) => ({ entry, position: index + 1, described: describe(entry, t, clock) }));
	const body = items.length ? sectionsHtml(items, view) : `<p class="empty">${esc(t('no_entries'))}</p>`;
	const footer = `${title} · ${issueReference(issue)}`;
	return (
		`<!doctype html><html lang="${esc(locale)}"><head><meta charset="utf-8"><title>${esc(title)} · ${esc(issue.day)}</title>` +
		`<style>${pageRules(footer, t('page_of', { page: '{page}', pages: '{pages}' }))}${SHEET_STYLE}</style></head><body>` +
		`${mastheadHtml(view, title)}${datelineHtml(view)}<main>${body}</main>${signatureSlotHtml(view)}${colophonHtml(view, title)}` +
		`</body></html>`
	);
}
