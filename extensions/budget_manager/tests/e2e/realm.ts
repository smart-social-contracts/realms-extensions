import { readFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { join } from 'node:path';

const ROOT = join(__dirname, '..', '..');
const BUNDLE = join(ROOT, 'frontend-rt', 'dist', 'index.js');
const MANIFEST = JSON.parse(readFileSync(join(ROOT, 'manifest.json'), 'utf8'));
const LOCALES = join(ROOT, 'frontend', 'i18n', 'locales', 'extensions', 'budget_manager');

/**
 * The replies by operation name. A reply that depends on one argument of the call is `{ by, cases }`: the case named
 * by that argument (`''` when the call leaves it out).
 */
export interface Scenario {
  locale: string;
  replies: Record<string, any>;
}

const by = (arg: string, cases: Record<string, any>) => ({ __by: arg, cases });

const at = (iso: string) => Date.parse(iso) / 1000;
/** The day the screens are read: the specs fix the browser's clock to it. */
export const NOW = new Date('2026-11-12T12:00:00Z');

// The realm's money has two decimals: 30_000_000 is 300,000 REALM.
const money = (tokens: number) => Math.round(tokens * 100);

const AGORA = 'rrkah-fqaaa-aaaaa-aaaaq-cai';
const NORTH = 'ryjl3-tyaaa-aaaaa-aaaba-cai';
const SOUTH = 'renrk-eyaaa-aaaaa-aaada-cai';

function budget(id: string, fund: string, category: string, kind: string, status: string, planned: number, over: Record<string, number> = {}) {
  return {
    id,
    fund,
    period: 'FY2026',
    category,
    kind,
    status,
    planned: money(planned),
    reserved: 0,
    committed: 0,
    actual: 0,
    proposal: '',
    ...Object.fromEntries(Object.entries(over).map(([stage, tokens]) => [stage, money(tokens)])),
  };
}

// Roads FY2026 as ggg's model has it: capital planned 300,000, reserved 40,000, committed 90,000, actual 120,500.
const CAPITAL = budget('B-1', 'ROADS', 'capital', 'expense', 'adopted', 300_000, { reserved: 40_000, committed: 90_000, actual: 120_500 });
const UPKEEP = budget('B-2', 'ROADS', 'upkeep', 'expense', 'adopted', 50_000, { actual: 10_000 });
const TOLLS = budget('B-3', 'ROADS', 'tolls', 'revenue', 'adopted', 80_000, { actual: 20_000 });
const CARE = budget('B-4', 'WELFARE', 'care', 'expense', 'extended', 120_000, { actual: 30_000 });
const OLD_CAPITAL = budget('B-5', 'ROADS', 'capital', 'expense', 'amended', 280_000);
const SCHOOLS = budget('B-6', 'WELFARE', 'schools', 'expense', 'proposed', 75_000);
const LIGHTING = budget('B-7', 'ROADS', 'street_lighting', 'expense', 'draft', 20_000);

const fund = (id: string, name: string, lines: unknown[], department = `D-${id.toLowerCase()}`) => ({
  id,
  name,
  kind: 'general',
  balances: { REALM: money(500_000) },
  department,
  rule: null,
  budgets: lines,
});

function budgetView(sweep: unknown[] = []) {
  return {
    ok: true,
    funds: [fund('ROOT', 'Root', [], 'D-root'), fund('ROADS', 'Roads', [CAPITAL, UPKEEP, TOLLS]), fund('WELFARE', 'Welfare', [CARE])],
    next: null,
    currency: 'REALM',
    decimals: 2,
    period: 'FY2026',
    periods: [{ id: 'FY2026', name: 'FY2026', starts_at: at('2026-01-01T00:00:00Z'), ends_at: at('2027-01-01T00:00:00Z'), status: 'open' }],
    config: { epoch: 'monthly', anchor_month: 1, source_fund: 'ROOT', auto_allocate: false, sweep },
    rule_drafts: [],
  };
}

const transfer = (id: string, sender: string, to: string, tokens: number, status: string, due: string, over: Record<string, unknown> = {}) => ({
  id,
  sender: `Fund:${sender}`,
  to,
  symbol: 'REALM',
  amount: money(tokens),
  ledger_tx: null,
  status,
  at: at('2026-10-01T09:00:00Z'),
  payroll: null,
  due_at: at(due),
  budget: null,
  committed: false,
  contract: null,
  ...over,
});

// Read on 12 November 2026, 13:00 in Madrid.
const SCHEDULED = [
  transfer('T-10', 'ROADS', 'Organization:O-3', 12_000, 'scheduled', '2026-11-30T09:00:00Z', { budget: 'B-1', committed: true, contract: 'C-1' }),
  transfer('T-11', 'ROADS', 'Organization:O-4', 4_500, 'scheduled', '2026-11-03T09:00:00Z', { budget: 'B-2' }), // overdue
  transfer('T-12', 'WELFARE', 'Organization:O-5', 8_000, 'scheduled', '2026-12-15T09:00:00Z', { budget: 'B-4' }),
  transfer('T-15', 'ROOT', 'Organization:O-6', 1_000, 'scheduled', '2026-11-20T09:00:00Z'), // charged to no line
];
const CANCELLED = [
  transfer('T-13', 'ROADS', 'Organization:O-3', 5_000, 'cancelled', '2026-10-15T09:00:00Z', { budget: 'B-5' }),
];

const entry = (id: string, transaction: string, category: string, kind: string, debit: number, credit: number, sweep: string) => ({
  id,
  transaction,
  kind,
  category,
  debit: money(debit),
  credit: money(credit),
  symbol: 'REALM',
  at: at('2026-11-01T11:00:00Z'),
  description: '',
  user: null,
  fund: 'ROADS',
  period: 'FY2026',
  sweep,
});

const sweep = (id: string, quarter: string, fundName: string, into: string, tokens: number, over: Record<string, unknown> = {}) => ({
  id,
  quarter,
  fund: fundName,
  symbol: 'REALM',
  into,
  to: { owner: AGORA, subaccount: null },
  epoch: at('2026-11-01T00:00:00Z'),
  amount: money(tokens),
  fee: 10,
  created_at: at('2026-11-01T11:00:00Z'),
  block: '90113',
  status: 'booked',
  reason: null,
  reported_at: at('2026-11-01T11:05:00Z'),
  ...over,
});

const RULES = [
  { fund: 'ROOT', symbol: 'REALM', into: 'ROADS', keep: money(100) },
  { fund: 'WELFARE', symbol: 'REALM', into: 'WELFARE', keep: 0 },
];

const directory = (capital: string, ...quarters: [string, string][]) => ({
  ok: true,
  capital,
  quarters: quarters.map(([id, name]) => ({ id, name, capital: id === capital })),
});

export const ME = (permissions: string[]) => ({ ok: true, user: { id: 'me' }, permissions });
const ADMIN = ['all'];
// A member may read the budget, not the treasury's books.
const MEMBER: string[] = [];

/** What every realm answers, whatever the screen. */
function common(permissions: string[], over: Record<string, any>): Record<string, any> {
  return {
    me: ME(permissions),
    department_list: { ok: true, departments: [{ id: 'D-root', is_root: true }], next: null },
    department_get: { ok: true, department: { id: 'D-root', policy: { m: 1, n: 1 } } },
    realm_info: { ok: true, realm: { name: 'Agora', timezone: 'Europe/Madrid' } },
    treasury_view: { ok: true, funds: {}, next: null, config: {}, tokens: [{ id: 'REALM', ledger: '', decimals: 2, fee: 10 }], nft_tokens: [] },
    ledger_view: { ok: true, entries: [], next: null },
    budget_list: { ok: true, budgets: [], next: null },
    transfer_list: { ok: true, transfers: [], next: null },
    sweep_list: { ok: true, sweeps: [], next: null },
    quarter_directory: directory(AGORA, [AGORA, 'Agora']),
    ...over,
  };
}

/** A realm that budgets, with a draft and a proposed line beside the lines in force; read by an admin or a member. */
export function budgeting(permissions: 'admin' | 'member', locale = 'en'): Scenario {
  const admin = permissions === 'admin';
  return {
    locale,
    replies: common(admin ? ADMIN : MEMBER, {
      budget_view: budgetView(),
      budget_list: { ok: true, budgets: [CAPITAL, UPKEEP, TOLLS, CARE, OLD_CAPITAL, SCHOOLS, LIGHTING], next: null },
    }),
  };
}

/** A realm whose only lines in force plan income. */
export function budgetingIncomeOnly(): Scenario {
  const view = budgetView();
  view.funds = [fund('ROADS', 'Roads', [TOLLS])];
  return { locale: 'en', replies: common(MEMBER, { budget_view: view }) };
}

/** A realm whose treasury owes scheduled payments, one of them overdue, and cancelled one. */
export function owing(locale = 'en'): Scenario {
  return {
    locale,
    replies: common(ADMIN, {
      budget_view: budgetView(),
      budget_list: { ok: true, budgets: [CAPITAL, UPKEEP, TOLLS, CARE, OLD_CAPITAL], next: null },
      transfer_list: by('status', {
        scheduled: { ok: true, transfers: SCHEDULED, next: null },
        cancelled: { ok: true, transfers: CANCELLED, next: null },
      }),
    }),
  };
}

/** A realm that owes nothing. */
export function owingNothing(): Scenario {
  return { locale: 'en', replies: common(ADMIN, { budget_view: budgetView() }) };
}

/** The capital of a federation: its sweep rules, and the sweeps its quarters reported, each booked as `<quarter>/<id>`. */
export function capital(permissions: 'admin' | 'member' = 'admin', locale = 'en'): Scenario {
  const north = (id: string) => `${NORTH}/${id}`;
  return {
    locale,
    replies: common(permissions === 'admin' ? ADMIN : MEMBER, {
      budget_view: budgetView(RULES),
      quarter_directory: directory(AGORA, [AGORA, 'Agora'], [NORTH, 'North'], [SOUTH, 'South']),
      sweep_list: {
        ok: true,
        sweeps: [
          sweep(north('SW-1'), NORTH, 'ROOT', 'ROADS', 890),
          sweep(`${SOUTH}/SW-1`, SOUTH, 'ROOT', 'ROADS', 420, { created_at: at('2026-11-02T08:00:00Z'), block: '90210' }),
          sweep(north('SW-2'), NORTH, 'ROOT', 'ROADS', 310, { created_at: at('2026-10-01T11:00:00Z'), block: '85002' }),
        ],
        next: null,
      },
      ledger_view: {
        ok: true,
        entries: [
          entry('LE-31', 'T-20', 'cash', 'asset', 890, 0, north('SW-1')),
          entry('LE-32', 'T-20', 'sweep', 'equity', 0, 890, north('SW-1')),
          entry('LE-33', 'T-21', 'cash', 'asset', 420, 0, `${SOUTH}/SW-1`),
          entry('LE-34', 'T-21', 'sweep', 'equity', 0, 420, `${SOUTH}/SW-1`),
          entry('LE-35', 'T-19', 'cash', 'asset', 310, 0, north('SW-2')),
          entry('LE-36', 'T-19', 'sweep', 'equity', 0, 310, north('SW-2')),
        ],
        next: null,
      },
    }),
  };
}

/** The same capital on a realm whose ledger entries do not name the sweep they book (before realms-gos names it). */
export function capitalWithoutBookings(): Scenario {
  const scenario = capital();
  scenario.replies.ledger_view.entries = scenario.replies.ledger_view.entries.map(({ sweep: _, ...entryWithoutSweep }: any) => entryWithoutSweep);
  return scenario;
}

/** A federation's capital that has set no sweep rule and has had no sweep reported. */
export function capitalWithoutSweeps(): Scenario {
  return { locale: 'en', replies: common(ADMIN, { budget_view: budgetView(), quarter_directory: directory(AGORA, [AGORA, 'Agora'], [NORTH, 'North']) }) };
}

/** A quarter: what it swept to its capital. A failed sweep moved nothing; one still sending may not have. */
export function quarter(): Scenario {
  return {
    locale: 'en',
    replies: common(ADMIN, {
      budget_view: budgetView(),
      quarter_directory: directory(AGORA, [NORTH, 'North'], [AGORA, 'Agora']),
      sweep_list: {
        ok: true,
        sweeps: [
          sweep('SW-1', NORTH, 'ROOT', 'ROADS', 890),
          sweep('SW-2', NORTH, 'ROOT', 'ROADS', 120, { created_at: at('2026-11-10T11:00:00Z'), block: null, status: 'failed', reason: 'InsufficientFunds' }),
          sweep('SW-3', NORTH, 'ROOT', 'ROADS', 75, { created_at: at('2026-11-12T08:00:00Z'), block: null, status: 'sending', reported_at: null }),
        ],
        next: null,
      },
      ledger_view: {
        ok: true,
        entries: [
          entry('LE-5', 'T-5', 'cash', 'asset', 0, 890.1, 'SW-1'),
          entry('LE-6', 'T-5', 'sweep', 'equity', 890, 0, 'SW-1'),
          entry('LE-7', 'T-5', 'ledger_fee', 'expense', 0.1, 0, 'SW-1'),
        ],
        next: null,
      },
    }),
  };
}

/** The scenario as JSON for an inline script: a "</script>" in the data must not end the script. */
function embedded(scenario: Scenario): string {
  return JSON.stringify(scenario).replace(/</g, '\\u003c');
}

/** A page that plays the realm around the bundle: `ctx` answers from the scenario and records what it was asked. */
function page(scenario: Scenario): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>realm</title>
<style>html,body{margin:0;height:100%}</style></head><body>
<div id="root"></div>
<script type="module">
  import mount from '/bundle/index.js';
  const scenario = ${embedded(scenario)};
  const store = (value) => ({ subscribe(run) { run(value); return () => {}; } });
  window.asked = [];
  const answer = (name, args = {}) => {
    window.asked.push([name, args]);
    let reply = scenario.replies[name];
    if (reply && reply.__by) reply = reply.cases[String(args[reply.__by] ?? '')];
    return Promise.resolve(reply === undefined ? { ok: false, error: name + ' is not open to you' } : reply);
  };
  window.notices = [];
  mount(document.getElementById('root'), {
    read: answer,
    run: answer,
    locale: store(scenario.locale),
    notify: (level, message) => window.notices.push([level, message]),
  });
</script></body></html>`;
}

/** Serve the bundle, its translations and the scenario's page; `scenario()` is read at each page load. */
export async function startRealm(scenario: () => Scenario): Promise<{ url: string; server: Server }> {
  const server = createServer((request, response) => {
    const path = new URL(request.url ?? '/', 'http://realm').pathname;
    const send = (type: string, body: string | Buffer, status = 200) => {
      response.writeHead(status, { 'content-type': type });
      response.end(body);
    };
    const words = path.match(new RegExp(`^/ext/budget_manager/${MANIFEST.version}/frontend/i18n/([\\w-]+)\\.json$`));
    if (path === '/bundle/index.js') send('text/javascript', readFileSync(BUNDLE));
    else if (words) send('application/json; charset=utf-8', readFileSync(join(LOCALES, `${words[1]}.json`)));
    else if (path.startsWith('/extensions/budget_manager')) send('text/html; charset=utf-8', page(scenario()));
    else send('text/plain', 'not found', 404);
  });
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
  const { port } = server.address() as { port: number };
  return { url: `http://127.0.0.1:${port}`, server };
}
