import { readFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { join } from 'node:path';

const ROOT = join(__dirname, '..', '..');
const BUNDLE = join(ROOT, 'frontend-rt', 'dist', 'index.js');
const MANIFEST = JSON.parse(readFileSync(join(ROOT, 'manifest.json'), 'utf8'));
const LOCALES = join(ROOT, 'frontend', 'i18n', 'locales', 'extensions', 'voting');

export interface Scenario {
  locale: string;
  /**
   * The replies by operation name, or by the arguments of the call: `(args, data) => reply`. A function is sent to the
   * page as its source and run there, so it sees only its arguments and `data`, nothing of the spec around it.
   */
  replies: Record<string, any>;
  /** What the function replies read, such as the proposals the realm holds. */
  data?: unknown;
}

function embedded(scenario: Scenario): string {
  const source = (_key: string, value: unknown) => (typeof value === 'function' ? { __function: value.toString() } : value);
  return JSON.stringify(scenario, source).replace(/</g, '\\u003c');
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
  const answer = (name, args) => {
    window.asked.push([name, args]);
    const reply = scenario.replies[name];
    if (reply === undefined) return Promise.resolve({ ok: false, error: name + ' is not open to you' });
    return Promise.resolve(reply && reply.__function ? (0, eval)('(' + reply.__function + ')')(args, scenario.data) : reply);
  };
  mount(document.getElementById('root'), {
    read: answer,
    run: answer,
    principal: store('carla'),
    locale: store(scenario.locale),
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
    const words = path.match(new RegExp(`^/ext/voting/${MANIFEST.version}/frontend/i18n/([\\w-]+)\\.json$`));
    if (path === '/bundle/index.js') send('text/javascript', readFileSync(BUNDLE));
    else if (words) send('application/json; charset=utf-8', readFileSync(join(LOCALES, `${words[1]}.json`)));
    else if (path.startsWith('/extensions/voting')) send('text/html; charset=utf-8', page(scenario()));
    else send('text/plain', 'not found', 404);
  });
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
  const { port } = server.address() as { port: number };
  return { url: `http://127.0.0.1:${port}`, server };
}
