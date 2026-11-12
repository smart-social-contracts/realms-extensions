import { readFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { join } from 'node:path';

const ROOT = join(__dirname, '..', '..');
const BUNDLE = join(ROOT, 'frontend-rt', 'dist', 'index.js');
const MANIFEST = JSON.parse(readFileSync(join(ROOT, 'manifest.json'), 'utf8'));
const LOCALES = join(ROOT, 'frontend', 'i18n', 'locales', 'extensions', 'procurement');

export const SECONDS = (iso: string) => Date.parse(iso) / 1000;
export const SPAIN = 'rrkah-fqaaa-aaaaa-aaaaq-cai';
export const OTHER_REALM = 'ryjl3-tyaaa-aaaaa-aaaba-cai';

export interface Scenario {
  locale: string;
  /**
   * The replies by operation name. A reply may be `{ byArgs: [{ when, reply }, ...] }`: the first entry whose `when` fields
   * all equal the call's arguments answers, the last one (without `when`) otherwise; or `{ seq: [first, second, ...] }`: each
   * call gets the next reply, the last one again after that. `{ delay: ms, reply }` answers after that long.
   */
  replies: Record<string, any>;
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
  window.navigated = [];
  window.granted = [];
  const matches = (when, args) => Object.entries(when ?? {}).every(([key, value]) => JSON.stringify(args?.[key]) === JSON.stringify(value));
  const answer = (name, args) => {
    window.asked.push([name, args]);
    let reply = scenario.replies[name];
    if (reply?.byArgs) reply = reply.byArgs.find((entry) => matches(entry.when, args))?.reply;
    else if (reply?.seq) reply = reply.seq[Math.min(window.asked.filter(([asked]) => asked === name).length - 1, reply.seq.length - 1)];
    if (reply?.delay) return new Promise((resolve) => setTimeout(() => resolve(reply.reply), reply.delay));
    return Promise.resolve(reply === undefined ? { ok: false, error: name + ' is not open to you' } : reply);
  };
  mount(document.getElementById('root'), {
    read: answer,
    run: answer,
    principal: store('carla'),
    locale: store(scenario.locale),
    navigate: async (path) => window.navigated.push(path),
    // Sealing is the host's: here it only records which scope a bid was granted at.
    crypto: {
      encryptForRecipients: async (recipients, payload) => ({ ciphertext: 'enc:' + JSON.stringify(payload), wrappedDeks: { recipients } }),
      grantScope: async (scope, wrapped, options) => window.granted.push([scope, options]),
      decryptScope: async () => null,
    },
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
    const words = path.match(new RegExp(`^/ext/procurement/${MANIFEST.version}/frontend/i18n/([\\w-]+)\\.json$`));
    if (path === '/bundle/index.js') send('text/javascript', readFileSync(BUNDLE));
    else if (words) send('application/json; charset=utf-8', readFileSync(join(LOCALES, `${words[1]}.json`)));
    else if (path.startsWith('/extensions/procurement')) send('text/html; charset=utf-8', page(scenario()));
    else send('text/plain', 'not found', 404);
  });
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
  const { port } = server.address() as { port: number };
  return { url: `http://127.0.0.1:${port}`, server };
}

// ---- what the realm answers -------------------------------------------------------------------------------------

export const ME = (permissions: string[]) => ({ ok: true, user: { id: 'carla' }, permissions });

export const INFO = (over: Record<string, unknown> = {}) => ({
  ok: true,
  realm: {
    name: 'València',
    timezone: 'Europe/Madrid',
    official_timezone: 'Europe/Madrid',
    accounting_currency: 'REALM',
    accounting_currency_decimals: 2,
    ...over,
  },
  sync_sources: [{ source: { Realm: SPAIN }, name: 'Spain', status: 'active' }],
});

export const EXTERNALS = {
  ok: true,
  externals: [{ id: 'province', name: 'Province of Alicante', kind: 'authority', channel: 'manual' }],
  next: null,
};

export const DEPARTMENTS = {
  ok: true,
  departments: [{ id: 'Administration', is_root: true }, { id: 'Infrastructure' }],
  next: null,
};
export const ORGANIZATIONS = {
  ok: true,
  organizations: [{ id: 'buildco', status: 'active' }, { id: 'roadco', status: 'active' }],
  next: null,
};

const day = (iso: string) => SECONDS(`${iso}T00:00:00+01:00`);

/** A contract as `contract_list` and `contract_get` give it. */
export function contract(over: Record<string, unknown> = {}) {
  return {
    id: 'C-9',
    title: 'Bike lane works',
    parties: ['Department:Infrastructure', 'Organization:buildco'],
    mandate: null,
    kind: 'works',
    procedure: 'open',
    tender: 'T-5',
    lot: '',
    value: 5_000_000,
    symbol: 'REALM',
    status: 'active',
    starts_at: day('2026-01-01'),
    ends_at: SECONDS('2027-03-31T00:00:00+02:00'),
    split: [
      { period: 'FY2026', amount: 3_000_000 },
      { period: 'FY2027', amount: 2_000_000 },
    ],
    framework: null,
    ...over,
  };
}

export const CALL_OFF = contract({
  id: 'C-14',
  title: 'Electricity for the town hall',
  tender: '',
  value: 900_000,
  split: [],
  ends_at: 0,
  framework: { holder: { External: 'province' }, reference: 'AM-2025/04', winners: ['buildco', 'roadco'] },
});

export const REALM_CALL_OFF = contract({
  id: 'C-15',
  title: 'Street lighting',
  tender: '',
  value: 120_000,
  split: [],
  framework: { holder: { Realm: SPAIN }, reference: 'T-12', winners: [] },
});

export const UNNAMED_REALM_CALL_OFF = contract({
  id: 'C-16',
  title: 'Waste collection',
  tender: '',
  value: 80_000,
  split: [],
  framework: { holder: { Realm: OTHER_REALM }, reference: 'T-7', winners: ['roadco'] },
});

export const LIST = (contracts: unknown[]) => ({ ok: true, contracts, next: null });

/** The two amendments of `C-9`: a re-spread carried by a proposal, then a longer term decided by the department itself. */
export const AMENDMENTS = [
  {
    id: 'C-9.1',
    contract: 'C-9',
    before: { value: 5_000_000, split: [{ period: 'FY2026', amount: 3_000_000 }, { period: 'FY2027', amount: 2_000_000 }], starts_at: day('2026-01-01'), ends_at: SECONDS('2026-03-31T00:00:00+02:00') },
    after: { value: 5_000_000, split: [{ period: 'FY2026', amount: 1_000_000 }, { period: 'FY2027', amount: 4_000_000 }], starts_at: day('2026-01-01'), ends_at: SECONDS('2026-03-31T00:00:00+02:00') },
    proposal: 'P-31',
    at: SECONDS('2026-01-23T10:30:00+01:00'),
  },
  {
    id: 'C-9.2',
    contract: 'C-9',
    before: { value: 5_000_000, split: [{ period: 'FY2026', amount: 1_000_000 }, { period: 'FY2027', amount: 4_000_000 }], starts_at: day('2026-01-01'), ends_at: SECONDS('2026-03-31T00:00:00+02:00') },
    after: { value: 5_000_000, split: [{ period: 'FY2026', amount: 1_000_000 }, { period: 'FY2027', amount: 4_000_000 }], starts_at: day('2026-01-01'), ends_at: SECONDS('2027-03-31T00:00:00+02:00') },
    proposal: '',
    at: SECONDS('2026-02-02T09:00:00+01:00'),
  },
];

/** What `contract_get` answers: the contract, its amendments, and what an amendment of it is held to. */
export function detail(c: Record<string, unknown>, over: Record<string, unknown> = {}) {
  return {
    ok: true,
    contract: c,
    amendments: [],
    next: null,
    paid: 1_200_000,
    governed_by: 'Infrastructure',
    needs_vote: true,
    budgets: [{ id: 'B-3', fund: 'ROADS', period: 'FY2026', category: 'capital' }],
    ...over,
  };
}

/** A tender with two lots, as `tender_get` answers it in evaluation: lot 1 awarded (contract C-10), lot 2 still open. */
export function tender(status = 'evaluation', over: Record<string, unknown> = {}) {
  const evaluated = status !== 'open';
  const bid = (id: string, vendor: string, lot: string, score: number | null) => ({
    id,
    vendor,
    lot,
    submitted_at: SECONDS('2026-10-05T10:00:00+02:00'),
    sealed: !evaluated,
    payload_hash: `sha256:${id}`,
    ...(evaluated ? { payload_ref: '', price: 100_000, score } : {}),
  });
  return {
    id: 'T-5',
    title: 'Bike lane works',
    description: 'A lane along the river, and racks for it.',
    requester: 'Infrastructure',
    kind: 'works',
    procedure: 'open',
    estimated_value: 6_000_000,
    status,
    opens_at: SECONDS('2026-10-01T09:00:00+02:00'),
    // An open tender still takes bids whenever the test runs: its closing time is far ahead.
    closes_at: evaluated ? SECONDS('2026-10-31T17:00:00+01:00') : SECONDS('2035-10-31T17:00:00+01:00'),
    notices: [],
    rubric: { price: 60_000_000, quality: 40_000_000 },
    winner: null,
    contract: null,
    lots: [
      { id: '1', title: 'Road works', estimated_value: 5_000_000, status: evaluated ? 'awarded' : 'open', winner: evaluated ? 'B-2' : null, contract: evaluated ? 'C-10' : null },
      { id: '2', title: 'Bike racks', estimated_value: 1_000_000, status: 'open', winner: null, contract: null },
    ],
    bids: [bid('B-1', 'roadco', '1', 71), bid('B-2', 'buildco', '1', 88), bid('B-3', 'buildco', '2', 80)],
    ...over,
  };
}

/** The same tender without lots. */
export const PLAIN_TENDER = (status = 'evaluation') =>
  tender(status, { id: 'T-6', title: 'Office chairs', lots: [], bids: [] });

export const TENDERS = (items: Record<string, unknown>[]) => ({
  ok: true,
  tenders: items.map(({ bids, description, rubric, ...listed }) => listed),
  next: null,
});
