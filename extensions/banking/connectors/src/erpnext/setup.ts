// Prepares an empty ERPNext site for the demo: the company (if the setup wizard has not run), the two doctypes the
// connector works with, a company bank account, three suppliers with bank accounts and addresses, their purchase
// invoices, and one payment run in Draft. Every IBAN is a published documentation example; every name is made up.
// Safe to run again: what exists is left as it is.
//
//   npm run setup-erpnext        (ERPNEXT_URL, ERPNEXT_KEY, ERPNEXT_SECRET from .env or the environment, which wins)

import { existsSync, readFileSync } from 'node:fs';

const file = new URL('../../.env', import.meta.url);
const env: Record<string, string> = {
	...Object.fromEntries((existsSync(file) ? readFileSync(file, 'utf8') : '').split('\n').filter((l) => /^[A-Z_]+=/.test(l)).map((l) => l.split(/=(.*)/s))),
	...(process.env as Record<string, string>),
};
const BASE = env.ERPNEXT_URL.replace(/\/$/, '');
const AUTH = { Authorization: `token ${env.ERPNEXT_KEY}:${env.ERPNEXT_SECRET}` };

const COMPANY = 'Example Realm Association';
const ABBR = 'ERA';
const BANK = 'Example Bank';

async function api(method: string, path: string, body?: unknown) {
	const response = await fetch(BASE + path, {
		method,
		headers: { ...AUTH, Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
		body: body ? JSON.stringify(body) : undefined,
	});
	const text = await response.text();
	if (!response.ok) throw new Error(`${method} ${path}: ${response.status} ${text.slice(0, 400)}`);
	return JSON.parse(text);
}
const list = async (doctype: string, filters: unknown[] = []) =>
	(await api('GET', `/api/resource/${encodeURIComponent(doctype)}?filters=${encodeURIComponent(JSON.stringify(filters))}&limit_page_length=0`)).data as { name: string }[];
const create = async (doctype: string, values: Record<string, unknown>) => (await api('POST', `/api/resource/${encodeURIComponent(doctype)}`, values)).data;

/** Create unless ``filters`` already find one; returns the name either way. */
async function ensure(doctype: string, filters: unknown[], values: Record<string, unknown>): Promise<string> {
	const [found] = await list(doctype, filters);
	if (found) return found.name;
	const made = await create(doctype, values);
	console.log(`created ${doctype} ${made.name}`);
	return made.name;
}

async function setupWizard() {
	if ((await list('Company')).length) return;
	console.log('running the setup wizard…');
	await api('POST', '/api/method/frappe.desk.page.setup_wizard.setup_wizard.setup_complete', {
		args: JSON.stringify({
			language: 'English', country: 'Switzerland', timezone: 'Europe/Zurich', currency: 'CHF',
			company_name: COMPANY, company_abbr: ABBR, chart_of_accounts: 'Standard',
			fy_start_date: '2026-01-01', fy_end_date: '2026-12-31', bank_account: 'Realm Bank',
		}),
	});
	for (let i = 0; i < 60 && !(await list('Company')).length; i++) await new Promise((r) => setTimeout(r, 2000));
}

const field = (fieldname: string, label: string, fieldtype: string, extra: Record<string, unknown> = {}) =>
	({ fieldname, label, fieldtype, ...extra });

const STATUSES = ['Draft', 'Ready for approval', 'Awaiting the realm', 'Approved: file ready', 'Rejected by the realm', 'Problem'];

async function doctypes() {
	const permissions = ['System Manager', 'Accounts Manager'].map((role) => ({ role, read: 1, write: 1, create: 1, delete: 1 }));
	await ensure('DocType', [['name', '=', 'Realm Payment Run Item']], {
		name: 'Realm Payment Run Item', module: 'Custom', custom: 1, istable: 1, editable_grid: 1,
		fields: [
			field('supplier', 'Supplier', 'Link', { options: 'Supplier', reqd: 1, in_list_view: 1 }),
			field('purchase_invoice', 'Purchase Invoice', 'Link', { options: 'Purchase Invoice', in_list_view: 1 }),
			field('amount', 'Amount', 'Currency', { options: 'currency', reqd: 1, in_list_view: 1 }),
			field('currency', 'Currency', 'Link', { options: 'Currency', in_list_view: 1 }),
			field('reference_kind', 'Reference kind', 'Select', { options: '\nQRR\nSCOR' }),
			field('reference', 'Reference', 'Data', { in_list_view: 1 }),
			field('note', 'Note', 'Data'),
		],
	});
	await ensure('DocType', [['name', '=', 'Realm Payment Run']], {
		name: 'Realm Payment Run', module: 'Custom', custom: 1, autoname: 'RPR-.#####', naming_rule: 'Expression (old style)',
		track_changes: 1, title_field: 'company',
		permissions,
		fields: [
			field('company', 'Company', 'Link', { options: 'Company', reqd: 1, in_list_view: 1 }),
			field('currency', 'Currency', 'Link', { options: 'Currency', reqd: 1 }),
			field('execution_date', 'Execution date', 'Date', { reqd: 1, in_list_view: 1 }),
			field('column_break_1', '', 'Column Break'),
			field('realm_status', 'Status', 'Select', { options: STATUSES.join('\n'), default: 'Draft', in_list_view: 1, in_standard_filter: 1,
				description: 'Set "Ready for approval" to put the run to the realm\'s vote.' }),
			field('section_items', 'Payments', 'Section Break'),
			field('items', 'Payments', 'Table', { options: 'Realm Payment Run Item', reqd: 1 }),
			field('section_realm', 'Realm', 'Section Break', { description: 'Filled in by the connector.' }),
			field('realm_proposal', 'Realm proposal', 'Data', { read_only: 1 }),
			field('realm_votes', 'Votes', 'Data', { read_only: 1 }),
			field('realm_dispatch', 'Dispatch to the bank', 'Data', { read_only: 1 }),
			field('column_break_2', '', 'Column Break'),
			field('file_sha256', 'File sha256 (committed in the realm)', 'Data', { read_only: 1 }),
			field('file_created_at', 'File created at', 'Data', { read_only: 1, hidden: 1 }),
			field('realm_note', 'Note', 'Small Text', { read_only: 1 }),
		],
	});
}

const SUPPLIERS = [
	{ name: 'Ada Example', type: 'Individual', iban: 'CH5604835012345678009', street: 'Beispielweg 7', postCode: '8000', town: 'Zürich', amount: 4200 },
	{ name: 'Bruno Sample', type: 'Individual', iban: 'CH5800791123000889012', street: 'Musterweg 3', postCode: '4051', town: 'Basel', amount: 3850.5 },
	{ name: 'Example Printing Ltd', type: 'Company', iban: 'CH4431999123000889012', street: 'Industrieweg 12', postCode: '2500', town: 'Biel/Bienne', amount: 1250,
		qrr: '210000000003139471430009017' },
];

async function addressFor(doctype: string, name: string, street: string, postCode: string, town: string, own = false) {
	return ensure('Address', [['address_title', '=', name]], {
		address_title: name, address_type: 'Billing', address_line1: street, city: town, pincode: postCode, country: 'Switzerland',
		...(own ? { is_your_company_address: 1 } : {}), links: [{ link_doctype: doctype, link_name: name }],
	});
}

async function data() {
	await ensure('Bank', [['name', '=', BANK]], { bank_name: BANK });
	const [gl] = await list('Account', [['account_type', '=', 'Bank'], ['company', '=', COMPANY], ['is_group', '=', 0]]);
	await ensure('Bank Account', [['is_company_account', '=', 1], ['company', '=', COMPANY]], {
		account_name: 'Realm account', bank: BANK, is_company_account: 1, company: COMPANY, account: gl?.name,
		iban: 'CH9300762011623852957', is_default: 1,
	});
	await addressFor('Company', COMPANY, 'Musterstrasse 1', '3000', 'Bern', true);
	await ensure('Item', [['item_code', '=', 'Services']], {
		item_code: 'Services', item_name: 'Services', item_group: 'Services', is_stock_item: 0, stock_uom: 'Nos',
	});
	const items = [];
	for (const s of SUPPLIERS) {
		const supplier = await ensure('Supplier', [['supplier_name', '=', s.name]], {
			supplier_name: s.name, supplier_type: s.type, supplier_group: 'Services', country: 'Switzerland',
		});
		await addressFor('Supplier', supplier, s.street, s.postCode, s.town);
		await ensure('Bank Account', [['party_type', '=', 'Supplier'], ['party', '=', supplier]], {
			account_name: s.name, bank: BANK, party_type: 'Supplier', party: supplier, iban: s.iban, is_default: 1,
		});
		const invoice = await ensure('Purchase Invoice', [['supplier', '=', supplier], ['docstatus', '=', 1]], {
			supplier, company: COMPANY, posting_date: '2026-11-20', due_date: '2026-11-30', bill_no: `BILL-${supplier.slice(0, 3).toUpperCase()}`,
			items: [{ item_code: 'Services', qty: 1, rate: s.amount }], docstatus: 1,
		});
		items.push({ supplier, purchase_invoice: invoice, amount: s.amount, currency: 'CHF',
			...(s.qrr ? { reference_kind: 'QRR', reference: s.qrr } : { note: `Invoice ${invoice}` }) });
	}
	const run = await ensure('Realm Payment Run', [['realm_status', '=', 'Draft']], {
		company: COMPANY, currency: 'CHF', execution_date: '2026-11-27', realm_status: 'Draft', items,
	});
	console.log(`\nready: payment run ${run} in Draft, at ${BASE}/app/realm-payment-run/${run}`);
}

await setupWizard();
await doctypes();
await data();
