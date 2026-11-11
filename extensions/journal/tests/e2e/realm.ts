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

/** A codex id as realms-gos writes it: `sha256:` and 64 hex digits. */
export const CODEX_ID = 'sha256:4be1a2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f';
const EARLIER_CODEX_ID = 'sha256:9c0de1f2a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e';

/** An install the realm's members voted for, as realms-gos records it. */
export const INSTALL = {
  id: 'E-1',
  at: Date.UTC(2026, 10, 9, 10, 30) / 1000,
  kind: 'codex_installed',
  details: {
    codex: CODEX_ID,
    layers: [
      { source: 'eu/es', versions: ['2.4.0'] },
      { source: 'eu/es/vc', versions: ['1.1.0'] },
    ],
    proposal: 'P-12',
    vote: { yes: 5, no: 1, abstain: 1, eligible: 9 },
    activates_at: 0,
  },
};

/** A revert by a vote, and an entry the realm could not record. */
export const REVERT = {
  id: 'E-4',
  at: Date.UTC(2026, 10, 9, 13, 0) / 1000,
  kind: 'codex_reverted',
  details: {
    codex: EARLIER_CODEX_ID,
    reverted: CODEX_ID,
    layers: [{ source: 'eu/es', versions: ['2.3.0'] }],
    proposal: 'P-13',
    vote: { yes: 6, no: 2, abstain: 0, eligible: 9 },
  },
};
export const NOT_RECORDED = {
  id: 'E-5',
  at: Date.UTC(2026, 10, 9, 14, 20) / 1000,
  kind: 'not_recorded',
  details: { kind: 'release_found', source: 'eu/es/vc', version: '1.3.0' },
};

// 00:00 on 1 January 2027 in Madrid, the realm's zone in these scenarios.
const NEW_YEAR = Date.UTC(2026, 11, 31, 23, 0) / 1000;

/** A release the realm's check found, and one the realm published, as realms-gos records them. */
export const FOUND = {
  id: 'E-2',
  at: Date.UTC(2026, 10, 9, 8, 15) / 1000,
  kind: 'release_found',
  details: { source: 'eu/es', version: '2.5.0', effective_from: NEW_YEAR },
};
export const PUBLISHED = {
  id: 'E-3',
  at: Date.UTC(2026, 10, 9, 9, 45) / 1000,
  kind: 'release_published',
  details: { source: 'eu/es/vc', version: '1.2.0', effective_from: NEW_YEAR },
};

export interface Scenario {
  locale: string;
  realm: { name: string; logoUrl: string };
  /** The replies by operation name; a function answers by the arguments. */
  replies: Record<string, any>;
}

/** The scenario as JSON for an inline script: a "</script>" in the data (a hostile realm name) must not end the script. */
function embedded(scenario: Scenario): string {
  return JSON.stringify(scenario).replace(/</g, '\\u003c');
}

/** A page that plays the realm around the bundle: `ctx` answers from the scenario and records what it was asked. */
function page(scenario: Scenario): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>realm</title></head><body>
<div id="root"></div>
<script type="module">
  import mount from '/bundle/index.js';
  const scenario = ${embedded(scenario)};
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
    else if (/^(\/r\/[\w-]+)?\/extensions\/journal/.test(path)) send('text/html; charset=utf-8', page(scenario()));
    else send('text/plain', 'not found', 404);
  });
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
  const { port } = server.address() as { port: number };
  return { url: `http://127.0.0.1:${port}`, server };
}
