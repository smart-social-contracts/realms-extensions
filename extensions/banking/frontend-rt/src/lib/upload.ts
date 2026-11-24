// A payment or direct debit file made by another system, the public body's own ERP (Abacus, SAP, Odoo, ERPNext…):
// read, checked and put to the treasury's vote as it is. The realm does not write it, so it can only check what any
// pain.001 or pain.008 must hold together: the counts and the sum, the IBANs, the account it pays from, and that the
// bank has not seen its message id or the file itself already. Where a payee is also in the realm's register, the file
// must pay that payee's registered IBAN: a changed IBAN of a known payee (a diverted salary) passes every check digit.

import { compactIban, ibanProblem } from './iban.ts';
import { controlSum, parseAmount, type Problem } from './order.ts';
import { sepaText } from './sepa.ts';
import type { Doc, OrderFacts, Register } from './realm.ts';
import { readOrderFile, type FileSummary } from './review.ts';
import { parse } from './xml.ts';

export interface FileCheck {
	summary: FileSummary | null;
	/** The file's ISO 20022 message, from its namespace: pain.001.001.09, pain.008.001.02.ch.03… */
	message: string;
	/** What stops the vote. */
	problems: Problem[];
	/** What the treasury should look at before voting, but may accept. */
	warnings: string[];
	/** How many of the file's payees are in the realm's register (and pay to their registered IBAN). The others are only
	 * in the ERP, which is normal: the ERP keeps the suppliers. */
	known: number;
}

/** A name as two systems may write it: SEPA drops accents, and spacing and case vary. */
function sameName(a: string, b: string): boolean {
	const key = (s: string) => sepaText(s).toLowerCase().replace(/\s+/g, ' ').trim();
	return key(a) === key(b);
}

function messageOf(xml: string): string {
	const ns = parse(xml).attrs.xmlns ?? '';
	return /(pain\.\d{3}\.\d{3}\.\d{2}(\.ch\.\d{2})?)/.exec(ns)?.[1] ?? ns;
}

/** Every check a file made elsewhere must pass before the treasury votes on it. */
export function checkFile(xml: string, register: Register | null, orders: Doc[], sha256: string): FileCheck {
	let summary: FileSummary;
	try {
		summary = readOrderFile(xml);
	} catch (e) {
		return { summary: null, message: '', problems: [{ message: `This is not a pain.001 or pain.008 file: ${(e as Error).message}` }], warnings: [], known: 0 };
	}
	const problems: Problem[] = [];
	const warnings: string[] = [];
	const committed = orders.find((d) => d.facts.file_sha256 === sha256);
	if (committed) problems.push({ message: `This exact file is already ${committed.id}` });
	const sameId = orders.find((d) => d.facts.message_id === summary.messageId);
	if (sameId && !committed) problems.push({ message: `Message id ${summary.messageId} is already ${sameId.id}: a bank refuses a message id twice` });
	if (!summary.lines.length) problems.push({ message: 'The file holds no payments' });
	if (summary.count !== summary.lines.length) {
		problems.push({ message: `The file says ${summary.count} payments but holds ${summary.lines.length}` });
	}
	const amounts = summary.lines.map((l) => ({ amount: parseAmount(l.amount, l.currency), currency: l.currency, line: l.id }));
	for (const a of amounts) if (a.amount === null || a.amount <= 0) problems.push({ line: a.line, message: 'An amount is not a positive amount' });
	if (summary.controlSum && amounts.every((a) => a.amount !== null)) {
		const sum = controlSum(amounts as { amount: number; currency: string }[]);
		if (Number(sum) !== Number(summary.controlSum)) problems.push({ message: `The control sum ${summary.controlSum} is not the sum of the payments, ${sum}` });
	}
	let known = 0;
	for (const l of summary.lines) {
		const bad = ibanProblem(l.iban);
		if (bad) problems.push({ line: l.id, message: `${l.name}'s IBAN: ${bad}` });
		const registered = register?.payees.find((p) => sameName(p.name, l.name));
		if (!registered) continue;
		if (compactIban(registered.iban) === compactIban(l.iban)) known += 1;
		else problems.push({ line: l.id, message: `${l.name} is in the realm's register with IBAN ${compactIban(registered.iban)}, but the file pays ${compactIban(l.iban)}` });
	}
	const own = register?.account?.iban;
	if (own && compactIban(own) !== compactIban(summary.account.iban)) {
		warnings.push(`The file uses account ${summary.account.iban}, not the realm's account in the register (${compactIban(own)})`);
	}
	const ids = summary.lines.map((l) => l.id);
	if (ids.some((id) => !id || id === 'NOTPROVIDED')) warnings.push('Some payments have no EndToEndId: statements cannot match them one by one');
	if (new Set(ids).size !== ids.length) warnings.push('Some payments share an EndToEndId: statements cannot tell them apart');
	return { summary, message: messageOf(xml), problems, warnings, known };
}

/** What the realm keeps in clear of a file put to the vote: as for its own orders, ids and amounts only. */
export function factsOfFile(check: FileCheck, sha256: string): OrderFacts {
	const summary = check.summary!;
	return {
		kind: summary.kind,
		source: 'erp',
		format: check.message,
		message_id: summary.messageId,
		file_sha256: sha256,
		execution_date: summary.lines[0]?.executionDate ?? '',
		created_at: summary.createdAt,
		lines: summary.lines.map((l) => [l.id, parseAmount(l.amount, l.currency) ?? 0, l.currency, l.group, '', l.salary]),
	};
}

/** The committed order a file is, by its sha256: what anyone can check before the bank gets it. */
export function committedAs(orders: Doc[], sha256: string): Doc | undefined {
	return orders.find((d) => d.facts.file_sha256 === sha256);
}
