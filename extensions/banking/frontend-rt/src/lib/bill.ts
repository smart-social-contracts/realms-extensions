// Bills the realm issues as Swiss QR-bills: a tax, a fee or an invoice a resident or a company pays from any e-banking
// by scanning the QR code. The bill's reference names it (a QR reference with a QR-IBAN, else an RF creditor
// reference), so the statement import matches the payment to it.
//
// The realm's own invoices (GGG) are kept in the realm's token and only their payer can list them, so a bill is the
// Banking extension's own record, in CHF or EUR; it may name the realm invoice it settles.

import type { Data } from 'swissqrbill/types';
import { compactIban, ibanCountry, ibanProblem, isQrIban } from './iban.ts';
import { formatAmount, type Account, type Address, type Problem } from './order.ts';
import { invoiceQrr, invoiceReference } from './references.ts';

export interface Bill {
	/** BILL-1, BILL-2…: what its reference names. */
	id: string;
	/** Who is billed; left out, the bill's "Payable by" is blank and the payer fills it in. */
	payer?: Pick<Account, 'name' | 'address'>;
	/** In minor units; left out, the payer enters the amount (a donation, an open fee). */
	amount?: number;
	currency: 'CHF' | 'EUR';
	/** What the payment is for, printed on the bill and carried to the statement (at most 140 characters). */
	message?: string;
	/** YYYY-MM-DD. */
	dueDate?: string;
	/** The realm invoice (INV-…) this bill settles, if any. */
	invoice?: string;
}

/** The bill's reference: a QR reference when the realm's account is a QR-IBAN, else an RF creditor reference. */
export function referenceOfBill(bill: Bill, creditorIban: string): { kind: 'QRR' | 'SCOR'; value: string } {
	return isQrIban(creditorIban) ? { kind: 'QRR', value: invoiceQrr(bill.id)! } : { kind: 'SCOR', value: invoiceReference(bill.id) };
}

/** The highest amount a QR-bill takes. */
const MAX = 999_999_999_99;

function addressProblems(who: string, a: Address | undefined): Problem[] {
	if (!a?.town.trim() || !a.postCode?.trim() || !/^[A-Z]{2}$/.test(a.country)) {
		return [{ message: `${who}'s address needs a post code, a town and a two-letter country (a QR-bill takes structured addresses only)` }];
	}
	return [];
}

/** What stops the bill. ``creditor`` is the realm's own account from the register. */
export function billProblems(bill: Bill, creditor: Account | null): Problem[] {
	const out: Problem[] = [];
	if (!creditor) return [{ message: "The realm's own account is not in the register" }];
	const iban = compactIban(creditor.iban);
	if (ibanProblem(iban)) out.push({ message: `The realm's IBAN: ${ibanProblem(iban)}` });
	if (!['CH', 'LI'].includes(ibanCountry(iban))) out.push({ message: 'A QR-bill is paid into a Swiss or Liechtenstein account' });
	if (!/^BILL-[0-9]{1,10}$/.test(bill.id)) out.push({ message: 'A bill id is BILL- and a number' });
	out.push(...addressProblems("The realm's account", creditor.address));
	if (bill.payer) out.push(...addressProblems('The payer', bill.payer.address));
	if (bill.amount !== undefined && (!Number.isSafeInteger(bill.amount) || bill.amount <= 0 || bill.amount > MAX)) {
		out.push({ message: 'The amount is between 0.01 and 999,999,999.99, or left open' });
	}
	if ((bill.message ?? '').length > 140) out.push({ message: 'The message is longer than 140 characters' });
	if (bill.dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(bill.dueDate)) out.push({ message: 'The due date is YYYY-MM-DD' });
	return out;
}

function party(a: Pick<Account, 'name' | 'address'>) {
	const ad = a.address!;
	return { name: a.name.trim(), address: ad.street ?? '', buildingNumber: ad.building ?? '', zip: ad.postCode ?? '', city: ad.town,
		country: ad.country };
}

/** The bill as the Swiss QR Code holds it (swissqrbill's data: structured addresses, the reference, the message). */
export function qrDataOf(bill: Bill, creditor: Account): Data {
	const reference = referenceOfBill(bill, creditor.iban);
	const due = bill.dueDate ? `due ${bill.dueDate}` : '';
	const message = [bill.message?.trim(), due].filter(Boolean).join(', ').slice(0, 140);
	return {
		currency: bill.currency,
		...(bill.amount !== undefined ? { amount: Number(formatAmount(bill.amount, bill.currency)) } : {}),
		creditor: { account: compactIban(creditor.iban), ...party(creditor) },
		...(bill.payer ? { debtor: party(bill.payer) } : {}),
		reference: reference.value,
		...(message ? { message } : {}),
	};
}

/** "BILL-3": one more than the bills already issued. */
export function nextBillId(issued: number): string {
	return `BILL-${issued + 1}`;
}
