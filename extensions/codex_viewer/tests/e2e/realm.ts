import { readFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { join } from 'node:path';

const ROOT = join(__dirname, '..', '..');
const BUNDLE = join(ROOT, 'frontend-rt', 'dist', 'index.js');
const MANIFEST = JSON.parse(readFileSync(join(ROOT, 'manifest.json'), 'utf8'));
const LOCALES = join(ROOT, 'frontend', 'i18n', 'locales', 'extensions', 'codex_viewer');

const NOW = Date.UTC(2026, 10, 11, 12, 0) / 1000;
const SECONDS = (iso: string) => Date.parse(iso) / 1000;
const SPAIN = 'rrkah-fqaaa-aaaaa-aaaaq-cai';
const VALENCIAN_COMMUNITY = 'ryjl3-tyaaa-aaaaa-aaaba-cai';

const chapter = (source: string, version: string, vouched_by: string) => ({
  source,
  version,
  sha256: `sha256:${source.length.toString(16).padStart(2, '0')}${version.replace(/\W/g, '')}`,
  vouched_by,
  route: 'capital',
});

export const CODEX = {
  id: 'sha256:3f1c9a7be2d04c11aa90',
  status: 'active',
  layers: ['eu/es', 'eu/es/vc', 'eu/es/vc/46250-valencia'],
  layer_paths: {},
  chapters: {
    'eu/es/tax': chapter('eu/es', '2.3.0', SPAIN),
    'eu/es/procedure': chapter('eu/es', '2.3.0', SPAIN),
    'eu/es/vc/tax': chapter('eu/es/vc', '1.1.0', VALENCIAN_COMMUNITY),
    'eu/es/vc/46250-valencia/tax': chapter('eu/es/vc/46250-valencia', '', ''), // the realm's own layer: nobody vouches for it
  },
  previous: 'sha256:0123456789abcdef0123',
  installed_at: SECONDS('2026-11-09T09:30:00Z'),
  activates_at: null,
  proposal: 'P-12',
};

/** What `codex_status` answers on a realm that runs the layered codex above, all well. */
export function status(over: Record<string, unknown> = {}) {
  return {
    ok: true,
    codex: CODEX,
    healthy: true,
    problem: {},
    failures: {},
    hooks: [],
    config: {},
    history: [],
    next: null,
    pending: null,
    job: null,
    it_team: 'IT',
    journal_failure: null,
    sync_sources: [
      {
        source: SPAIN,
        name: 'Spain',
        compliance: { NonCompliant: { since: SECONDS('2026-11-01T00:00:00Z'), stale: ['eu/es'] } },
        checked_at: SECONDS('2026-11-11T10:00:00Z'),
        error: '',
        installable: [{ source: 'eu/es', version: '2.4.0', effective_from: SECONDS('2026-11-01T00:00:00Z') }],
      },
    ],
    check: { interval: 24, due: SECONDS('2026-11-12T10:00:00Z') },
    ...over,
  };
}

/** What `codex_views` answers for the codex above: the tax domain, València filling what Spain asks. */
export const VIEWS = {
  ok: true,
  views: {
    tax: {
      domain: 'tax',
      path: ['eu/es', 'eu/es/vc/46250-valencia'],
      members: [
        { name: 'capital', kind: 'setting', mark: null, value: true, layers: [
          { source: 'eu/es', legislation: null, value: null },
          { source: 'eu/es/vc/46250-valencia', legislation: null, value: true },
        ] },
        { name: 'ibi_urban_cap', kind: 'forbid', mark: 'fixed', layers: [{ source: 'eu/es', legislation: 'TRLRHL Art. 72.3' }] },
        { name: 'compute_tax_assess', kind: 'compute', mark: 'fixed', layers: [{ source: 'eu/es', legislation: 'TRLRHL Arts. 61, 65, 71, 74' }] },
        { name: 'ibi_bonus', kind: 'helper', mark: null, layers: [
          { source: 'eu/es', legislation: 'TRLRHL Art. 74' },
          { source: 'eu/es/vc/46250-valencia', legislation: null },
        ] },
      ],
    },
    procedure: {
      domain: 'procedure',
      path: ['eu/es'],
      members: [{ name: 'check_proposal_create', kind: 'guard', mark: 'extension', layers: [{ source: 'eu/es', legislation: 'Ley 39/2015 Art. 30' }] }],
    },
  },
};

export const ME = (permissions: string[]) => ({ ok: true, user: { id: 'me' }, permissions });
export const INFO = (timezone: string, official?: string) => ({
  ok: true,
  realm: { name: 'València', timezone, ...(official ? { official_timezone: official } : {}) },
  sync_sources: [],
});

export interface Scenario {
  locale: string;
  /** What the host hands the extension as `ctx.config`, such as `fileRegistryCanisterId`. */
  config?: Record<string, unknown>;
  /**
   * The replies by operation name. An operation asked more than once, with different arguments, answers through
   * `{ byArgs: { field, replies, delay } }`: the value of `args[field]` picks the reply, and `delay` holds it back
   * that many milliseconds. The Source tab reads one chapter per file, so it asks `legislation_chapter` once per
   * file, each with a different checksum.
   */
  replies: Record<string, any>;
}

/** A reply chosen by one of the call's arguments, optionally made slow: for an operation asked more than once. */
export function byArgs(field: string, replies: Record<string, any>, delay: Record<string, number> = {}) {
  return { byArgs: { field, replies, delay } };
}

export { NOW, SECONDS, SPAIN };

/** The scenario as JSON for an inline script: a "</script>" in the data must not end the script. */
function embedded(scenario: Scenario): string {
  return JSON.stringify(scenario).replace(/</g, '\\u003c');
}

/** A page that plays the realm around the bundle: `ctx` answers from the scenario and records what it was asked. */
function page(scenario: Scenario): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>realm</title>
<style>html,body{margin:0;height:100%}#root{height:100%}</style></head><body>
<div id="root"></div>
<script type="module">
  import mount from '/bundle/index.js';
  const scenario = ${embedded(scenario)};
  const store = (value) => ({ subscribe(run) { run(value); return () => {}; } });
  window.asked = [];
  window.notices = [];
  window.navigated = [];
  // What the extension asked the host to do (ctx.host.dispatch) and the focus it published.
  window.dispatched = [];
  window.focused = [];
  // A copy, so that what was asked stays what it was: a caller may hand the same object to its next call.
  const copy = (value) => { try { return JSON.parse(JSON.stringify(value ?? {})); } catch (e) { return value; } };
  const answer = async (name, args) => {
    window.asked.push([name, copy(args)]);
    let reply = scenario.replies[name];
    if (reply && reply.byArgs) {
      const key = (args || {})[reply.byArgs.field];
      const wait = (reply.byArgs.delay || {})[key] || 0;
      if (wait) await new Promise((done) => setTimeout(done, wait));
      reply = reply.byArgs.replies[key];
    }
    return reply === undefined ? { ok: false, error: name + ' is not open to you' } : reply;
  };
  let focus = null;
  mount(document.getElementById('root'), {
    read: answer,
    run: answer,
    config: scenario.config || {},
    locale: store(scenario.locale),
    notify: (level, message) => window.notices.push([level, message]),
    navigate: async (path) => window.navigated.push(path),
    // The realm host: it records what it is asked for, as the realm page's own
    // host-bridge does before it sends anything to the portal.
    host: {
      focus: { subscribe(run) { run(focus); return () => {}; } },
      setFocus: (next) => { focus = next; window.focused.push(copy(next)); },
      dispatch: (action) => window.dispatched.push(copy(action)),
      pendingPrompt: store(null),
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
    const words = path.match(new RegExp(`^/ext/codex_viewer/${MANIFEST.version}/frontend/i18n/([\\w-]+)\\.json$`));
    if (path === '/bundle/index.js') send('text/javascript', readFileSync(BUNDLE));
    else if (words) send('application/json; charset=utf-8', readFileSync(join(LOCALES, `${words[1]}.json`)));
    else if (path.startsWith('/extensions/codex_viewer')) send('text/html; charset=utf-8', page(scenario()));
    else send('text/plain', 'not found', 404);
  });
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
  const { port } = server.address() as { port: number };
  return { url: `http://127.0.0.1:${port}`, server };
}
