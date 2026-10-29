# Realms Extensions Repository

Welcome to the consolidated Realms extensions repository! This repository contains all official extensions for the Smart Social Contracts platform.

## 📦 Available Extensions

This repository includes the following extensions:

- **admin_dashboard** - Administrative dashboard for realm management
- **member_dashboard** - Member-facing dashboard for personal account management
- **erd_explorer** - Entity Relationship Diagram explorer for the realm database
- **justice_litigation** - Justice and litigation management system
- **land_registry** - Land registry and property management
- **llm_chat** - AI-powered chat assistant
- **market_place** - Marketplace for goods and services
- **metrics** - Analytics and metrics dashboard
- **notifications** - Notification system for realm events
- **passport_verification** - Identity verification and passport services
- **public_dashboard** - Public-facing dashboard for realm statistics
- **test_bench** - Testing and development utilities
- **vault** - Secure vault for digital assets and credentials
- **voting** - Voting and governance system
- **welcome** - Welcome screen and onboarding

## 🚀 Quick Start

1. **Clone this repository** to get all extensions
2. **Navigate to an extension** folder to view its specific implementation
3. **Create your own extension** following the structure below
4. **Test locally** using the provided CLI tools
5. **Package and distribute** your extension

## 📁 Extension Structure

Each extension follows a standardized directory structure:

```
extensions/{your_extension_id}/
├── manifest.json          # Metadata, the realm operations it calls, its runtime
├── frontend-rt/           # Frontend bundle (Svelte + Vite)
│   ├── package.json
│   └── src/               # In-process: index.ts exports mount(target, ctx)
│                          # Sandboxed: index.html + main.ts, talks to the host through the bridge
├── backend/
│   └── entry.py           # Optional: sandboxed Python functions ("backend": true)
└── tests/                 # Optional
```

Every realm feature is an **operation**, called by name with JSON arguments. A reply is
`{"ok": true, ...}` or `{"ok": false, "error": "..."}`. Lists are paginated: `from` and
`count` in, `next` out (null at the end). The `ops_list` operation lists them all with their
permission; their arguments are in realms-gos `src/realm_backend/api/<domain>.py`.

An extension calls operations as the signed-in user, so it can do only what that user may do.
Most extensions need no backend: the frontend calls the operations directly.

## 📋 Manifest Configuration

### Root Manifest (`manifest.json`)

```json
{
  "name": "proposal_board",
  "version": "1.0.0",
  "description": "Brief description of your extension",
  "author": "Your Name",
  "profiles": ["member", "admin"],
  "categories": ["public_services", "finances", "oversight", "system", "other"],
  "icon": "table",
  "doc_url": "https://github.com/yourname/your-extension",
  "show_in_sidebar": true,
  "runtime": "sandboxed",
  "sdk_version": "1",
  "capabilities": ["call_operation"],
  "operations": ["proposal_list", "proposal_vote"]
}
```

**Fields:**
- `name`: Extension identifier (use underscores, no hyphens)
- `version`: Semantic version (x.y.z)
- `description`: User-facing description
- `author`: Your name or organization
- `profiles`: User profiles that can access this extension
- `categories`: Grouping categories for sidebar organization
- `icon`: Icon name (from Flowbite icons) (optional) (default: a default icon will be used)
- `doc_url`: Documentation URL (optional)
- `show_in_sidebar`: Whether to show the extension in the sidebar (optional) (default: true)
- `operations`: The realm operations the extension may call, from its frontend and its backend.
  The realm refuses every other one, so list exactly what the code calls.
- `runtime`: `"sandboxed"` runs the frontend in an iframe that talks to the host through
  `@realmsgos/extension-bridge`. Leave it out for an in-process bundle mounted with a `ctx`
  (first-party extensions on the host's allowlist).
- `sdk_version`, `capabilities` (sandboxed only): the bridge protocol version, and what the
  frontend may ask the host for: `call_operation` (realm operations), `call_extension` (its
  own backend), `navigate`, `notify`, `modal`.
- `backend`: `true` when the extension ships `backend/entry.py` (optional).
- `entry_access.functions` (with a backend): the backend functions a sandboxed frontend may
  call, each with the permission it is meant for.


**Available Categories:**
- `public_services`: Government and public sector functionality (member services, land registry, justice, identity verification)
- `finances`: Financial and economic tools (vault management, treasury, payments)
- `oversight`: Monitoring, analytics, and intelligence tools (dashboards, metrics, AI assistants)
- `system`: Platform administration and management (marketplace, configuration, deployment)
- `other`: General purpose extensions and utilities

## 🎨 Frontend: calling the realm

Use `read` for read operations (queries) and `run` for the rest. Both return the reply and
refuse operations the manifest does not declare.

**In-process bundle** (`frontend-rt/src/index.ts` exports `mount(target, ctx)`):

```ts
const reply = await ctx.read('proposal_list', { status: 'voting', count: 50 });
if (reply.ok) proposals = reply.proposals;

const vote = await ctx.run('proposal_vote', { proposal: 'P-7', choice: 'yes' });
if (!vote.ok) error = vote.error;
```

**Sandboxed bundle** (declare `"capabilities": ["call_operation"]`):

```ts
import { createExtensionClient } from '@realmsgos/extension-bridge';

const client = await createExtensionClient();
const reply = await client.read('realm_info');
```

`@realmsgos/extension-bridge` 0.3.0 is not on npm yet: depend on `^0.3.0` and install it from
a realms-gos checkout with `npm install --no-save <realms-gos>/packages/extension-bridge`.
See `extensions/hello_world` for a complete sandboxed frontend.

A list comes a page at a time; follow `next` for more:

```ts
for (let from: number | null = 1; from != null; ) {
  const page = await ctx.read('proposal_list', { from, count: 100 });
  proposals.push(...page.proposals);
  from = page.next;
}
```

## 🐍 Backend (only when the extension needs one)

Keep a backend for logic that is the extension's own (generating, computing, combining), not
to pass calls through to realm features: the frontend calls those directly.

`backend/entry.py` is the only backend file the realm installs. It runs in a sandboxed
subinterpreter with CPython builtins only: no `json`, no `random`, no `ggg`, no third-party
imports. Each public function takes keyword arguments and returns plain data
(dict, list, str, number). `rpc(op, **args)` calls one of the manifest's `operations` as the
calling user and returns its reply. `rpc` is synchronous, so operations that call other
canisters (a ledger transfer, for instance) cannot be used from a backend: call them from
the frontend.

```python
def greet(name="World"):
    realm = rpc("realm_info")["realm"]
    return f"Hello, {name}! Welcome to {realm['name']}."
```

The frontend calls it with `ctx.callSync('greet', { name })` (in-process; it resolves to the
function's return value) or `client.callExtension('greet', { name })` (sandboxed, with the
`call_extension` capability and `greet` in `entry_access.functions`). Both go through the
realm's `extension_call` operation (`{extension, function, args}`, reply `result`). A realm
task can also run a backend function on a schedule, with a step
`{"op": "extension_call", "args": {...}}`: see `extensions/demo_simulator`.
`extensions/hello_sandboxed` is the reference sandboxed backend.

Test a backend against the realm's own operations with `testing/realm_harness.py`
(see `testing/README.md`).

## 🌍 Internationalization

Create translation files in `frontend/i18n/`:

### English (`en.json`)
```json
{
  "title": "Your Extension",
  "description": "Extension description",
  "buttons": {
    "save": "Save",
    "cancel": "Cancel"
  }
}
```

### Chinese (`zh-CN.json`)
```json
{
  "title": "您的扩展",
  "description": "扩展描述",
  "buttons": {
    "save": "保存",
    "cancel": "取消"
  }
}
```

Use translations in your Svelte components:
```svelte
<script>
  import { t } from '$lib/i18n';
</script>

<h1>{$t('extensions.your_extension_name.title')}</h1>
```

## 🛠️ Development Tools

### CLI Commands

From the project root directory:

```bash
# List all installed extensions
realms extension list

# Install all extensions from source
realms extension install-from-source

# Create a new realm with demo data for testing
realms create --members 25 --organizations 3 --transactions 50
```
