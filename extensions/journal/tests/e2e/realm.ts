import { readFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { join } from 'node:path';

const ROOT = join(__dirname, '..', '..');
const BUNDLE = join(ROOT, 'frontend-rt', 'dist', 'index.js');
const MANIFEST = JSON.parse(readFileSync(join(ROOT, 'manifest.json'), 'utf8'));
const LOCALES = join(ROOT, 'frontend', 'i18n', 'locales', 'extensions', 'journal');

// The realm's logo as a realm stores it: a data URL.
export const LOGO =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><circle cx="32" cy="32" r="30" fill="#1d4ed8"/>' +
      '<text x="32" y="42" font-size="30" text-anchor="middle" fill="#fff">A</text></svg>',
  );

export const CAPITAL = 'rrkah-fqaaa-aaaaa-aaaaq-cai';

/** What `journal_issue` answers on a capital, as realms-gos serves it. */
export function issueOf(day: string, number: number, entries: any[] = [], realm = 'Agora') {
  return {
    ok: true,
    issued: true,
    capital: CAPITAL,
    issue: { realm, day, number, first_day: '2026-11-07', today: '2026-11-09', timezone: 'Europe/Madrid', entries },
  };
}

export const INSTALL = {
  id: 'E-1',
  at: Date.UTC(2026, 10, 9, 10, 30) / 1000,
  kind: 'codex_installed',
  details: {
    codex: 'sha256:4be1',
    layers: [
      { source: 'eu/es', versions: ['2.4.0'] },
      { source: 'eu/es/vc', versions: ['1.1.0'] },
    ],
    proposal: 'P-12',
    activates_at: 0,
  },
};

export interface Scenario {
  locale: string;
  realm: { name: string; logoUrl: string };
  /** The replies by operation name; a function answers by the arguments. */
  replies: Record<string, any>;
}

/** A page that plays the realm around the bundle: `ctx` answers from the scenario and records what it was asked. */
function page(scenario: Scenario): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>realm</title></head><body>
<div id="root"></div>
<script type="module">
  import mount from '/bundle/index.js';
  const scenario = ${JSON.stringify(scenario)};
  const store = (value) => ({ subscribe(run) { run(value); return () => {}; } });
  window.asked = [];
  window.printed = 0;
  const answer = (name, args) => {
    window.asked.push([name, args]);
    const reply = scenario.replies[name];
    return Promise.resolve(typeof reply === 'object' && reply.byDay ? (reply.byDay[args.day] ?? reply.byDay['']) : reply);
  };
  mount(document.getElementById('root'), {
    read: answer,
    run: answer,
    locale: store(scenario.locale),
    realmInfo: store(scenario.realm),
    navigate: async (path) => history.pushState(null, '', path),
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
    const words = path.match(new RegExp(`^/ext/journal/${MANIFEST.version}/frontend/i18n/([\\w-]+)\\.json$`));
    if (path === '/bundle/index.js') send('text/javascript', readFileSync(BUNDLE));
    else if (words) send('application/json; charset=utf-8', readFileSync(join(LOCALES, `${words[1]}.json`)));
    else if (path.startsWith('/extensions/journal')) send('text/html; charset=utf-8', page(scenario()));
    else send('text/plain', 'not found', 404);
  });
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
  const { port } = server.address() as { port: number };
  return { url: `http://127.0.0.1:${port}`, server };
}
