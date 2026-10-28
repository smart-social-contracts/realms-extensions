/**
 * Playwright fixture for a realm started with `realms local start` (see .github/actions/local-realm).
 *
 * The released realm is a production build: there is no test-mode login. Like the realm's own e2e, this
 * plays a federation portal host, which the realm frontend accepts through its portal bridge. The host
 * page embeds the realm with ?portal=1 and signs delegations with a fresh Ed25519 key, which
 * `realms local add-admin` makes an admin first.
 */
import { execFileSync } from 'node:child_process';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { Actor, HttpAgent } from '@dfinity/agent';
import { DelegationChain, Ed25519KeyIdentity } from '@dfinity/identity';
import type { FrameLocator, Page } from '@playwright/test';

const REALMS = process.env.REALMS_BIN || 'realms';

interface LocalStatus {
  running: boolean;
  launch: string;
  url: string;
  canisters: { realm_backend: string; realm_frontend: string };
}

export function localStatus(): LocalStatus {
  const status = JSON.parse(execFileSync(REALMS, ['local', 'status', '--json'], { encoding: 'utf8' }));
  if (!status.running) throw new Error('no local realm is running: realms local start');
  if (status.launch !== 'completed') throw new Error(`the realm is not launched (launch: ${status.launch})`);
  return status;
}

function hostHtml(status: LocalStatus, path: string): string {
  const sep = path.includes('?') ? '&' : '?';
  const { realm_backend: backend, realm_frontend: frontend } = status.canisters;
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>Realms portal (extension e2e)</title>
<style>html,body{margin:0;height:100%}iframe{border:0;width:100%;height:100%}</style></head>
<body>
<iframe id="realm" src="${status.url}${path}${sep}portal=1"></iframe>
<script>
  const realm = document.getElementById('realm');
  window.addEventListener('message', (ev) => {
    if (ev.source !== realm.contentWindow || ev.data?.type !== 'bridge:hello') return;
    const channel = new MessageChannel();
    channel.port1.onmessage = async (m) => {
      const msg = m.data || {};
      if (msg.type === 'auth:request-delegation') {
        const signed = await window.__signDelegation(msg.payload.sessionPublicKeyDer);
        channel.port1.postMessage({
          type: 'auth:delegation',
          payload: { ...signed, backendCanisterId: ${JSON.stringify(backend)} },
        });
      }
    };
    realm.contentWindow.postMessage({ type: 'bridge:init' }, '*', [channel.port2]);
    channel.port1.postMessage({
      type: 'config:realm',
      payload: {
        backendCanisterId: ${JSON.stringify(backend)},
        frontendCanisterId: ${JSON.stringify(frontend)},
        env: 'local',
        path: ${JSON.stringify(path)},
      },
    });
  });
</script>
</body></html>`;
}

export interface OpenedExtension {
  /** Where the extension's UI is: its own sandboxed frame, or the realm's frame when it is not sandboxed. */
  ext: FrameLocator;
  /** The realm's frame around it. */
  realm: FrameLocator;
  /** The signed-in admin. */
  user: Ed25519KeyIdentity;
  principal: string;
  close: () => Promise<void>;
}

/** Log in as a fresh admin and open `/extensions/<id>` (or `path`) in the portal host. */
export async function openExtension(page: Page, id: string, path = `/extensions/${id}`): Promise<OpenedExtension> {
  const status = localStatus();
  const user = Ed25519KeyIdentity.generate();
  const principal = user.getPrincipal().toText();
  execFileSync(REALMS, ['local', 'add-admin', principal], { stdio: 'ignore' });

  await page.exposeFunction('__signDelegation', async (sessionPublicKeyDer: number[]) => {
    const der = new Uint8Array(sessionPublicKeyDer);
    const sessionKey = { toDer: () => der, rawKey: der, derKey: der } as never;
    const expiresAt = Date.now() + 60 * 60 * 1000;
    const chain = await DelegationChain.create(user, sessionKey, new Date(expiresAt));
    return { delegation: chain.toJSON(), expiresAt };
  });

  const html = hostHtml(status, path);
  const server = http.createServer((_req, res) => {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(html);
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  await page.goto(`http://localhost:${(server.address() as AddressInfo).port}/`);

  const realm = page.frameLocator('#realm');
  // A sandboxed extension runs in a frame of its own, inside the realm's; any other renders in the realm's frame.
  const sandbox = realm.locator(`iframe[title="Extension ${id}"]`);
  const inRealm = realm.locator(`[data-extension-id="${id}"]`);
  const deadline = Date.now() + 120_000;
  while ((await sandbox.count()) === 0 && (await inRealm.count()) === 0 && Date.now() < deadline) {
    await page.waitForTimeout(1_000);
  }
  return {
    ext: (await sandbox.count()) > 0 ? realm.frameLocator(`iframe[title="Extension ${id}"]`) : realm,
    realm,
    user,
    principal,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

const readIdl = ({ IDL }: { IDL: typeof import('@dfinity/candid').IDL }) =>
  IDL.Service({ read: IDL.Func([IDL.Text, IDL.Text], [IDL.Text], ['query']) });

/** A public read operation of the realm, as anonymous: the state to check after a flow. */
export async function readOp(name: string, args: Record<string, unknown> = {}): Promise<Record<string, any>> {
  const status = localStatus();
  const host = `http://127.0.0.1:${new URL(status.url).port || 8000}`;
  const agent = await HttpAgent.create({ host, shouldFetchRootKey: true });
  const actor = Actor.createActor<{ read: (n: string, a: string) => Promise<string> }>(readIdl as never, {
    agent,
    canisterId: status.canisters.realm_backend,
  });
  return JSON.parse(await actor.read(name, JSON.stringify(args)));
}
