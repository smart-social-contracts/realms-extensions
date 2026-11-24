// Banking runs in its sandboxed iframe: it reaches the realm only through its own backend (backend/entry.py), and the
// realm's page seals, opens and saves files for it (the bridge's capabilities vault and download).
import { mountSandboxed } from '../../../_shared/frontend/sandbox';
import Banking from './Banking.svelte';

void mountSandboxed(Banking);
