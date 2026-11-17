/**
 * What an entry says, written as a gazette would: the section it belongs to, a title, the facts as short sentences, the
 * codices it names and the pages that tell more. All of it is plain text in the reader's language; the sheet sets it.
 */

import type { Entry, Text } from './issue.ts';

export type Section = 'legislation' | 'notices';

/** The sections of an issue, in the order they are printed. */
export const SECTIONS: Section[] = ['legislation', 'notices'];

/** Days and moments written in the reader's language and the realm's zone. */
export interface Clock {
	day: (seconds: number) => string;
	moment: (seconds: number) => string;
}

export interface Described {
	section: Section;
	title: string;
	/** Short sentences, to be read one after the other. */
	facts: string[];
	/** The codices the entry names, each with what it was to the change. */
	codices: { label: string; id: string }[];
	/** Pages of the realm that tell more; `path` is from the realm's root. */
	links: { label: string; path: string }[];
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

/** A codex id for the screen: "sha256:4be1a2c3…". Any other id (`test@1.0.0`) is short already. */
export function shortId(id: string): string {
	return /^sha256:[0-9a-f]{16,}$/.test(id) ? `${id.slice(0, 15)}…` : id;
}

/** The sentences for the decision behind a change: the proposal that carried it and, if the realm kept it, how the vote went. */
function decision(details: Record<string, any>, t: Text): string[] {
	const { proposal, vote } = details;
	if (typeof proposal !== 'string' || !proposal) return [];
	const counted = ['yes', 'no', 'abstain', 'eligible'].every((name) => Number.isInteger(vote?.[name]));
	return [t('fact_decided', { proposal }), ...(counted ? [t('fact_vote', vote)] : [])];
}

function proposalLink(details: Record<string, any>, t: Text) {
	const { proposal } = details;
	if (typeof proposal !== 'string' || !proposal) return [];
	return [{ label: t('link_proposal', { proposal }), path: `/extensions/voting/proposals/${encodeURIComponent(proposal)}` }];
}

function codexLink(id: unknown, t: Text) {
	return typeof id === 'string' && id ? [{ label: t('link_codex'), path: `/extensions/codex_viewer?codex=${encodeURIComponent(id)}` }] : [];
}

function named(label: string, id: unknown, t: Text) {
	return typeof id === 'string' && id ? [{ label: t(label), id }] : [];
}

function installed(entry: Entry, t: Text, clock: Clock): Described {
	const { codex, activates_at } = entry.details;
	const layers = layersText(entry.details.layers);
	// A codex staged for a time switches then; one without a time switches when it is installed.
	const inForce = typeof activates_at === 'number' && activates_at > 0 ? activates_at : entry.at;
	return {
		section: 'legislation',
		title: t('title_codex_installed'),
		facts: [
			layers ? t('entry_codex_installed', { layers }) : t('entry_codex_installed_plain'),
			t('fact_in_force', { moment: clock.moment(inForce) }),
			...decision(entry.details, t),
		],
		codices: named('label_codex', codex, t),
		links: [...proposalLink(entry.details, t), ...codexLink(codex, t)],
	};
}

function reverted(entry: Entry, t: Text): Described {
	const { codex, reverted: replaced } = entry.details;
	const layers = layersText(entry.details.layers);
	return {
		section: 'legislation',
		title: t('title_codex_reverted'),
		facts: [layers ? t('entry_codex_reverted', { layers }) : t('entry_codex_reverted_plain'), ...decision(entry.details, t)],
		codices: [...named('label_codex_restored', codex, t), ...named('label_codex_replaced', replaced, t)],
		links: [...proposalLink(entry.details, t), ...codexLink(codex, t)],
	};
}

/** A release the realm found or published: which one, and the day it is in force from. Without the fields the
 * personal-data rules allow, only that there was one. */
function release(entry: Entry, t: Text, clock: Clock): Described {
	const { source, version, effective_from } = entry.details;
	const key = `entry_${entry.kind}`;
	const known = typeof source === 'string' && typeof version === 'string' && typeof effective_from === 'number';
	return {
		section: 'legislation',
		title: t(`title_${entry.kind}`),
		facts: [known ? t(key, { source, version, date: clock.day(effective_from) }) : t(`${key}_plain`)],
		codices: [],
		links: [{ label: t('link_legislation'), path: '/extensions/codex_viewer' }],
	};
}

function notice(title: string, fact: string): Described {
	return { section: 'notices', title, facts: [fact], codices: [], links: [] };
}

/** What an entry says, in the reader's language. A kind this version does not know is still shown. */
export function describe(entry: Entry, t: Text, clock: Clock): Described {
	switch (entry.kind) {
		case 'codex_installed':
			return installed(entry, t, clock);
		case 'codex_reverted':
			return reverted(entry, t);
		case 'release_found':
		case 'release_published':
			return release(entry, t, clock);
		case 'not_recorded':
			return notice(t('title_not_recorded'), t('entry_not_recorded', { change: missedChange(entry, t) }));
		default:
			return notice(t('title_unknown'), t('entry_unknown', { kind: entry.kind }));
	}
}
