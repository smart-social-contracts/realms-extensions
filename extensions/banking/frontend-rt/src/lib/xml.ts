// A small XML writer and reader, enough for ISO 20022 payment files and statements.
//
// The writer is deterministic: the same tree gives the same bytes, so a payment file can be generated again and its
// sha256 compared with the one the realm committed. The reader takes the statements a bank hands out; it refuses a
// DOCTYPE (no bank file needs one) and keeps elements, attributes and text, with namespace prefixes dropped.

export type XmlNode = { name: string; attrs: Record<string, string>; children: XmlNode[]; text: string };

/** A child of an element being written: an element, or nothing (left out). */
type Child = Written | null | undefined | false;
type Written = { name: string; attrs?: Record<string, string>; text?: string; children?: Written[] };

/** An element with child elements; the children that are null, undefined or false are left out, and so is the
 * element itself when nothing is left in it (a payment file may not carry empty elements). */
export function el(name: string, ...children: Child[]): Written | null {
	const kept = children.filter((c): c is Written => !!c);
	return kept.length ? { name, children: kept } : null;
}

/** An element holding text; left out when the text is empty or missing. */
export function leaf(name: string, text: string | number | undefined | null, attrs?: Record<string, string>): Written | null {
	if (text === undefined || text === null || text === '') return null;
	return { name, text: String(text), ...(attrs ? { attrs } : {}) };
}

function escape(text: string): string {
	return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function attrsOf(attrs?: Record<string, string>): string {
	return Object.entries(attrs ?? {})
		.map(([k, v]) => ` ${k}="${escape(v)}"`)
		.join('');
}

function write(node: Written, depth: number, out: string[]): void {
	const pad = '  '.repeat(depth);
	if (node.children) {
		out.push(`${pad}<${node.name}${attrsOf(node.attrs)}>`);
		for (const child of node.children) write(child, depth + 1, out);
		out.push(`${pad}</${node.name}>`);
	} else {
		out.push(`${pad}<${node.name}${attrsOf(node.attrs)}>${escape(node.text ?? '')}</${node.name}>`);
	}
}

/** The document: the declaration, then ``root`` with ``attrs``, two spaces per level, one element per line. */
export function serialize(root: Written, attrs: Record<string, string>): string {
	const out = ['<?xml version="1.0" encoding="UTF-8"?>'];
	write({ ...root, attrs }, 0, out);
	return out.join('\n') + '\n';
}

// --- reading --------------------------------------------------------------------------------------------------------

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

function decode(text: string): string {
	return text.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-z]+);/g, (whole, ref: string) => {
		if (ref[0] === '#') return String.fromCodePoint(parseInt(ref.slice(ref[1] === 'x' ? 2 : 1), ref[1] === 'x' ? 16 : 10));
		if (ref in ENTITIES) return ENTITIES[ref];
		throw new Error(`unknown entity ${whole}`);
	});
}

function localName(qname: string): string {
	return qname.slice(qname.indexOf(':') + 1);
}

/** The root element of ``source``. Throws on anything that is not well-formed enough to trust. */
export function parse(source: string): XmlNode {
	const text = source.replace(/^﻿/, '');
	if (/<!DOCTYPE|<!ENTITY/i.test(text)) throw new Error('a statement with a DOCTYPE is refused');
	const stack: XmlNode[] = [];
	let root: XmlNode | null = null;
	const tag = /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!\[CDATA\[([\s\S]*?)\]\]>|<(\/?)([A-Za-z_][\w.:-]*)((?:\s+[\w.:-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)/g;
	let m: RegExpExecArray | null;
	let at = 0;
	while ((m = tag.exec(text))) {
		if (m.index !== at) throw new Error(`unexpected character at ${at}`);
		at = tag.lastIndex;
		const [, cdata, closing, qname, attrText, selfClosing, chars] = m;
		const top = stack[stack.length - 1];
		if (chars !== undefined || cdata !== undefined) {
			if (top) top.text += cdata ?? decode(chars);
			else if ((chars ?? '').trim()) throw new Error('text outside the root element');
			continue;
		}
		if (!qname) continue; // a comment or a processing instruction
		if (closing) {
			const open = stack.pop();
			if (!open || open.name !== localName(qname)) throw new Error(`</${qname}> closes nothing open`);
			continue;
		}
		const attrs: Record<string, string> = {};
		for (const a of attrText.matchAll(/([\w.:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
			attrs[localName(a[1])] = decode(a[2] ?? a[3]);
		}
		const node: XmlNode = { name: localName(qname), attrs, children: [], text: '' };
		if (top) top.children.push(node);
		else if (root) throw new Error('a second root element');
		else root = node;
		if (!selfClosing) stack.push(node);
	}
	if (at !== text.length || stack.length || !root) throw new Error('the document ends before its elements close');
	return root;
}

/** The first descendant along ``path`` (child names separated by "/"), or undefined. */
export function find(node: XmlNode | undefined, path: string): XmlNode | undefined {
	let here = node;
	for (const name of path.split('/')) {
		here = here?.children.find((c) => c.name === name);
		if (!here) return undefined;
	}
	return here;
}

/** Every child named ``name`` at the end of ``path`` ("A/B/C" gives every C under the first A/B). */
export function findAll(node: XmlNode | undefined, path: string): XmlNode[] {
	const parts = path.split('/');
	const last = parts.pop()!;
	const parent = parts.length ? find(node, parts.join('/')) : node;
	return parent ? parent.children.filter((c) => c.name === last) : [];
}

/** The trimmed text at ``path``, or "" when there is none. */
export function textAt(node: XmlNode | undefined, path: string): string {
	return find(node, path)?.text.trim() ?? '';
}
