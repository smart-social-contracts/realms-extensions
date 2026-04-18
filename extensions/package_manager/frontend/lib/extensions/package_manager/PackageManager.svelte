<script lang="ts">
  /**
   * Package Manager — admin UI for installing, updating and uninstalling
   * runtime extensions and codex packages on this realm.
   *
   * Backend contract (already implemented in src/realm_backend/main.py):
   *   - install_extension({ extension_id, files })
   *   - install_extension_from_registry({ registry_canister_id, ext_id, version? })
   *   - uninstall_extension({ extension_id })
   *   - list_runtime_extensions()
   *   - install_codex({ codex_id, files, run_init? })
   *   - install_codex_from_registry({ registry_canister_id, codex_id, version?, run_init? })
   *   - uninstall_codex({ codex_id })
   *   - reload_codex({ codex_id, run_init? })
   *   - list_codex_packages()
   *
   * Each method is gated by the EXTENSION_INSTALL / CODEX_INSTALL operations,
   * which are granted to the admin profile by default — so this whole
   * extension is only sidebar-visible to admins (see manifest.json).
   *
   * Registry catalog comes from the file_registry HTTP API
   * (`/api/extensions`, `/api/codices`) via $lib/file-registry-client.
   */
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { backend } from '$lib/canisters';
  import { realmInfo } from '$lib/stores/realmInfo';
  import {
    listRegistryExtensions,
    listRegistryCodices,
    compareVersions,
    type RegistryExtension,
    type RegistryCodex,
  } from '$lib/file-registry-client';
  import { Tabs, TabItem, Button, Badge, Card, Spinner, Alert, Input, Toggle } from 'flowbite-svelte';

  // ---------------------------------------------------------------------
  // Types
  // ---------------------------------------------------------------------

  type Kind = 'extension' | 'codex';

  interface InstalledItem {
    kind: Kind;
    id: string;
    version: string;
    source: { registry_canister_id?: string; version?: string } | null;
    manifest: Record<string, any> | null;
  }

  interface CatalogEntry {
    kind: Kind;
    id: string;
    versions: string[];
    latest: string;
    manifest: Record<string, any> | null;
    registryCanisterId: string;
  }

  interface Toast {
    id: number;
    type: 'success' | 'error' | 'info';
    text: string;
  }

  // ---------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------

  let installed: InstalledItem[] = [];
  let installedLoading = true;
  let installedError = '';

  let registryEntries: CatalogEntry[] = [];
  let registryLoading = false;
  let registryErrors: string[] = [];

  // Per-row busy state, keyed by `${kind}:${id}`.
  let busy: Record<string, string> = {};

  let toasts: Toast[] = [];
  let toastCounter = 0;

  // Upload tab state.
  let uploadKind: Kind = 'extension';
  let uploadId = '';
  let uploadFiles: { path: string; size: number; content: string }[] = [];
  let uploadRunInit = true;
  let uploadBusy = false;
  let fileInput: HTMLInputElement | null = null;

  // ---------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------

  function rowKey(kind: Kind, id: string): string {
    return `${kind}:${id}`;
  }

  function setBusy(kind: Kind, id: string, label: string) {
    busy = { ...busy, [rowKey(kind, id)]: label };
  }
  function clearBusy(kind: Kind, id: string) {
    const next = { ...busy };
    delete next[rowKey(kind, id)];
    busy = next;
  }

  function pushToast(type: Toast['type'], text: string) {
    const id = ++toastCounter;
    toasts = [...toasts, { id, type, text }];
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id);
    }, 5000);
  }

  function tt(key: string, vars: Record<string, string | number> = {}): string {
    let s = $_(key) ?? key;
    for (const [k, v] of Object.entries(vars)) {
      s = s.replaceAll(`{${k}}`, String(v));
    }
    return s;
  }

  function fmtSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function notifySidebarRefresh() {
    // Sidebar.svelte loads from get_sidebar_manifests() once on mount; emit
    // a custom event so it can re-fetch after install/uninstall without a
    // full page reload. (The current Sidebar doesn't yet listen for this,
    // but emitting it now means a tiny patch there is enough to make the
    // new entry appear immediately.)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('realms:extensions-changed'));
    }
  }

  // ---------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------

  async function loadInstalled() {
    installedLoading = true;
    installedError = '';
    try {
      const [extRaw, codexRaw] = await Promise.all([
        (backend as any).list_runtime_extensions(),
        (backend as any).list_codex_packages(),
      ]);

      const items: InstalledItem[] = [];

      const extParsed = JSON.parse(extRaw);
      if (extParsed?.success) {
        const ids: string[] = extParsed.runtime_extensions ?? [];
        const manifests: Record<string, any> = extParsed.all_manifests ?? {};
        const sources: Record<string, any> = extParsed.sources ?? {};
        for (const id of ids) {
          const m = manifests?.[id] ?? {};
          items.push({
            kind: 'extension',
            id,
            version: m?.version ?? '',
            source: sources?.[id] ?? null,
            manifest: m,
          });
        }
      }

      const codexParsed = JSON.parse(codexRaw);
      if (codexParsed?.success) {
        const ids: string[] = codexParsed.codex_packages ?? [];
        const manifests: Record<string, any> = codexParsed.manifests ?? {};
        for (const id of ids) {
          const m = manifests?.[id] ?? {};
          items.push({
            kind: 'codex',
            id,
            version: m?.version ?? '',
            source: null,
            manifest: m,
          });
        }
      }

      installed = items.sort((a, b) =>
        a.kind === b.kind ? a.id.localeCompare(b.id) : a.kind.localeCompare(b.kind),
      );
    } catch (e: any) {
      installedError = e?.message ?? String(e);
    } finally {
      installedLoading = false;
    }
  }

  async function loadRegistries() {
    registryLoading = true;
    registryErrors = [];
    const out: CatalogEntry[] = [];

    const registries = $realmInfo.registries ?? [];
    for (const reg of registries) {
      try {
        const [exts, codices] = await Promise.all([
          listRegistryExtensions(reg.canister_id),
          listRegistryCodices(reg.canister_id),
        ]);
        for (const e of exts as RegistryExtension[]) {
          out.push({
            kind: 'extension',
            id: e.ext_id,
            versions: e.versions,
            latest: e.latest,
            manifest: e.manifest,
            registryCanisterId: reg.canister_id,
          });
        }
        for (const c of codices as RegistryCodex[]) {
          out.push({
            kind: 'codex',
            id: c.codex_id,
            versions: c.versions,
            latest: c.latest,
            manifest: null,
            registryCanisterId: reg.canister_id,
          });
        }
      } catch (e: any) {
        registryErrors = [
          ...registryErrors,
          tt('extensions.package_manager.messages.registry_load_failed', {
            id: reg.canister_id,
            error: e?.message ?? String(e),
          }),
        ];
      }
    }

    registryEntries = out.sort((a, b) =>
      a.kind === b.kind ? a.id.localeCompare(b.id) : a.kind.localeCompare(b.kind),
    );
    registryLoading = false;
  }

  async function refreshAll() {
    await Promise.all([loadInstalled(), loadRegistries()]);
  }

  // ---------------------------------------------------------------------
  // Mutations — installed tab
  // ---------------------------------------------------------------------

  async function uninstall(item: InstalledItem) {
    const confirmed = confirm(
      tt('extensions.package_manager.messages.confirm_uninstall', { id: item.id }),
    );
    if (!confirmed) return;

    setBusy(item.kind, item.id, tt('extensions.package_manager.messages.uninstalling', { id: item.id }));
    try {
      const args = JSON.stringify(
        item.kind === 'extension' ? { extension_id: item.id } : { codex_id: item.id },
      );
      const raw =
        item.kind === 'extension'
          ? await (backend as any).uninstall_extension(args)
          : await (backend as any).uninstall_codex(args);
      const parsed = JSON.parse(raw);
      if (!parsed?.success) {
        throw new Error(parsed?.error ?? 'Unknown error');
      }
      pushToast('success', tt('extensions.package_manager.messages.uninstall_success', { id: item.id }));
      notifySidebarRefresh();
      await refreshAll();
    } catch (e: any) {
      pushToast('error', e?.message ?? String(e));
    } finally {
      clearBusy(item.kind, item.id);
    }
  }

  async function reloadCodex(item: InstalledItem) {
    setBusy(item.kind, item.id, tt('extensions.package_manager.messages.reloading', { id: item.id }));
    try {
      const raw = await (backend as any).reload_codex(
        JSON.stringify({ codex_id: item.id, run_init: false }),
      );
      const parsed = JSON.parse(raw);
      if (!parsed?.success) {
        throw new Error(parsed?.error ?? 'Unknown error');
      }
      if (parsed.init_warning) {
        pushToast(
          'info',
          tt('extensions.package_manager.messages.init_warning', { warning: parsed.init_warning }),
        );
      }
      pushToast('success', tt('extensions.package_manager.messages.reload_success', { id: item.id }));
    } catch (e: any) {
      pushToast('error', e?.message ?? String(e));
    } finally {
      clearBusy(item.kind, item.id);
    }
  }

  async function updateInstalled(item: InstalledItem) {
    const candidate = registryEntries.find((c) => c.kind === item.kind && c.id === item.id);
    if (!candidate || !candidate.latest) return;
    if (item.version && compareVersions(candidate.latest, item.version) <= 0) return;

    const ok = confirm(
      tt('extensions.package_manager.messages.confirm_update', {
        id: item.id,
        from: item.version || '?',
        to: candidate.latest,
      }),
    );
    if (!ok) return;

    await installFromRegistry(candidate, candidate.latest);
  }

  // ---------------------------------------------------------------------
  // Mutations — browse tab
  // ---------------------------------------------------------------------

  async function installFromRegistry(entry: CatalogEntry, version: string) {
    setBusy(entry.kind, entry.id, tt('extensions.package_manager.messages.installing', { id: entry.id }));
    try {
      let raw: string;
      if (entry.kind === 'extension') {
        raw = await (backend as any).install_extension_from_registry(
          JSON.stringify({
            registry_canister_id: entry.registryCanisterId,
            ext_id: entry.id,
            version,
          }),
        );
      } else {
        raw = await (backend as any).install_codex_from_registry(
          JSON.stringify({
            registry_canister_id: entry.registryCanisterId,
            codex_id: entry.id,
            version,
            run_init: true,
          }),
        );
      }
      const parsed = JSON.parse(raw);
      if (!parsed?.success) {
        throw new Error(parsed?.error ?? 'Unknown error');
      }
      if (parsed.init_warning) {
        pushToast(
          'info',
          tt('extensions.package_manager.messages.init_warning', { warning: parsed.init_warning }),
        );
      }
      pushToast(
        'success',
        tt('extensions.package_manager.messages.install_success', {
          id: entry.id,
          version,
        }),
      );
      notifySidebarRefresh();
      await loadInstalled();
    } catch (e: any) {
      pushToast('error', e?.message ?? String(e));
    } finally {
      clearBusy(entry.kind, entry.id);
    }
  }

  // ---------------------------------------------------------------------
  // Upload tab
  // ---------------------------------------------------------------------

  async function readFileAsText(file: File): Promise<string> {
    return await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result ?? ''));
      r.onerror = () => reject(r.error);
      r.readAsText(file);
    });
  }

  async function onFilesSelected(evt: Event) {
    const input = evt.target as HTMLInputElement;
    if (!input.files) return;
    const collected: typeof uploadFiles = [];
    for (const f of Array.from(input.files)) {
      // Strip the leading top-level folder name from webkitRelativePath so
      // the install endpoint receives keys like "manifest.json" /
      // "backend/entry.py" rather than "my-ext/manifest.json".
      const rel = (f as any).webkitRelativePath as string | undefined;
      let path = rel && rel.length > 0 ? rel : f.name;
      const slash = path.indexOf('/');
      if (rel && slash >= 0) path = path.slice(slash + 1);
      collected.push({
        path,
        size: f.size,
        content: await readFileAsText(f),
      });
    }
    uploadFiles = collected;
  }

  function clearUpload() {
    uploadFiles = [];
    if (fileInput) fileInput.value = '';
  }

  $: uploadTotalBytes = uploadFiles.reduce((acc, f) => acc + f.size, 0);
  $: uploadOverIngressLimit = uploadTotalBytes > 1.8 * 1024 * 1024;

  async function performUpload() {
    if (!uploadId || uploadFiles.length === 0) return;
    uploadBusy = true;
    try {
      const filesMap: Record<string, string> = {};
      for (const f of uploadFiles) filesMap[f.path] = f.content;

      let raw: string;
      if (uploadKind === 'extension') {
        raw = await (backend as any).install_extension(
          JSON.stringify({ extension_id: uploadId, files: filesMap }),
        );
      } else {
        raw = await (backend as any).install_codex(
          JSON.stringify({ codex_id: uploadId, files: filesMap, run_init: uploadRunInit }),
        );
      }
      const parsed = JSON.parse(raw);
      if (!parsed?.success) {
        throw new Error(parsed?.error ?? 'Unknown error');
      }
      if (parsed.init_warning) {
        pushToast(
          'info',
          tt('extensions.package_manager.messages.init_warning', { warning: parsed.init_warning }),
        );
      }
      pushToast(
        'success',
        tt('extensions.package_manager.messages.install_success', {
          id: uploadId,
          version: '?',
        }),
      );
      notifySidebarRefresh();
      clearUpload();
      uploadId = '';
      await loadInstalled();
    } catch (e: any) {
      pushToast('error', e?.message ?? String(e));
    } finally {
      uploadBusy = false;
    }
  }

  // ---------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------

  function findCatalogEntry(item: InstalledItem): CatalogEntry | undefined {
    return registryEntries.find((c) => c.kind === item.kind && c.id === item.id);
  }

  function statusFor(item: InstalledItem): 'installed' | 'outdated' | 'unknown' {
    const c = findCatalogEntry(item);
    if (!c || !c.latest) return 'unknown';
    if (!item.version) return 'unknown';
    return compareVersions(c.latest, item.version) > 0 ? 'outdated' : 'installed';
  }

  function isInstalled(entry: CatalogEntry): InstalledItem | undefined {
    return installed.find((i) => i.kind === entry.kind && i.id === entry.id);
  }

  // ---------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------

  onMount(async () => {
    if (!$realmInfo || $realmInfo.loading) {
      try {
        await realmInfo.fetch();
      } catch (_e) {
        // realmInfo.fetch() handles its own error state
      }
    }
    await refreshAll();
  });
</script>

<div class="p-6 max-w-6xl mx-auto">
  <div class="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        {$_('extensions.package_manager.title')}
      </h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {$_('extensions.package_manager.subtitle')}
      </p>
    </div>
    <Button on:click={refreshAll} size="sm" color="light" disabled={installedLoading || registryLoading}>
      {$_('extensions.package_manager.actions.refresh')}
    </Button>
  </div>

  <!-- Toasts -->
  {#if toasts.length > 0}
    <div class="fixed top-20 right-6 z-50 space-y-2 w-80">
      {#each toasts as toast (toast.id)}
        <Alert
          color={toast.type === 'success' ? 'green' : toast.type === 'error' ? 'red' : 'blue'}
          dismissable
        >
          {toast.text}
        </Alert>
      {/each}
    </div>
  {/if}

  <Tabs style="underline" contentClass="mt-4">
    <!-- ============================================================ -->
    <!-- Tab 1: Installed                                               -->
    <!-- ============================================================ -->
    <TabItem open title={$_('extensions.package_manager.tabs.installed')}>
      {#if installedLoading}
        <div class="flex justify-center items-center py-16"><Spinner size="10" /></div>
      {:else if installedError}
        <Alert color="red">{installedError}</Alert>
      {:else if installed.length === 0}
        <Card class="text-center py-12">
          <p class="text-gray-500 dark:text-gray-400">
            {$_('extensions.package_manager.messages.no_installed')}
          </p>
        </Card>
      {:else}
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th class="px-4 py-3">{$_('extensions.package_manager.labels.kind_label')}</th>
                <th class="px-4 py-3">{$_('extensions.package_manager.labels.id')}</th>
                <th class="px-4 py-3">{$_('extensions.package_manager.labels.installed_version')}</th>
                <th class="px-4 py-3">{$_('extensions.package_manager.labels.latest_version')}</th>
                <th class="px-4 py-3">{$_('extensions.package_manager.labels.status')}</th>
                <th class="px-4 py-3">{$_('extensions.package_manager.labels.source')}</th>
                <th class="px-4 py-3 text-right">{$_('extensions.package_manager.labels.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {#each installed as item (rowKey(item.kind, item.id))}
                {@const status = statusFor(item)}
                {@const catalog = findCatalogEntry(item)}
                {@const rowBusy = busy[rowKey(item.kind, item.id)]}
                <tr class="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                  <td class="px-4 py-3">
                    <Badge color={item.kind === 'extension' ? 'indigo' : 'purple'}>
                      {$_(`extensions.package_manager.kind.${item.kind}`)}
                    </Badge>
                  </td>
                  <td class="px-4 py-3 font-mono">{item.id}</td>
                  <td class="px-4 py-3">{item.version || '—'}</td>
                  <td class="px-4 py-3">{catalog?.latest ?? '—'}</td>
                  <td class="px-4 py-3">
                    {#if status === 'outdated'}
                      <Badge color="yellow">{$_('extensions.package_manager.status.outdated')}</Badge>
                    {:else if status === 'installed'}
                      <Badge color="green">{$_('extensions.package_manager.status.installed')}</Badge>
                    {:else}
                      <Badge color="gray">{$_('extensions.package_manager.status.unknown')}</Badge>
                    {/if}
                  </td>
                  <td class="px-4 py-3 text-xs font-mono">
                    {#if item.source?.registry_canister_id}
                      {item.source.registry_canister_id.slice(0, 5)}…
                    {:else}
                      —
                    {/if}
                  </td>
                  <td class="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                    {#if rowBusy}
                      <span class="inline-flex items-center gap-2 text-xs">
                        <Spinner size="4" /> {rowBusy}
                      </span>
                    {:else}
                      {#if status === 'outdated'}
                        <Button size="xs" color="yellow" on:click={() => updateInstalled(item)}>
                          {$_('extensions.package_manager.actions.update')}
                        </Button>
                      {/if}
                      {#if item.kind === 'codex'}
                        <Button size="xs" color="alternative" on:click={() => reloadCodex(item)}>
                          {$_('extensions.package_manager.actions.reload')}
                        </Button>
                      {/if}
                      <Button size="xs" color="red" on:click={() => uninstall(item)}>
                        {$_('extensions.package_manager.actions.uninstall')}
                      </Button>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </TabItem>

    <!-- ============================================================ -->
    <!-- Tab 2: Browse                                                  -->
    <!-- ============================================================ -->
    <TabItem title={$_('extensions.package_manager.tabs.browse')}>
      {#if registryErrors.length > 0}
        <div class="space-y-2 mb-4">
          {#each registryErrors as err}
            <Alert color="red">{err}</Alert>
          {/each}
        </div>
      {/if}

      {#if registryLoading}
        <div class="flex justify-center items-center py-16"><Spinner size="10" /></div>
      {:else if ($realmInfo.registries ?? []).length === 0}
        <Card class="text-center py-12">
          <p class="text-gray-500 dark:text-gray-400">
            {$_('extensions.package_manager.messages.no_browse')}
          </p>
        </Card>
      {:else if registryEntries.length === 0}
        <Card class="text-center py-12">
          <p class="text-gray-500 dark:text-gray-400">
            {$_('extensions.package_manager.messages.no_browse_results')}
          </p>
        </Card>
      {:else}
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th class="px-4 py-3">{$_('extensions.package_manager.labels.kind_label')}</th>
                <th class="px-4 py-3">{$_('extensions.package_manager.labels.id')}</th>
                <th class="px-4 py-3">{$_('extensions.package_manager.labels.latest_version')}</th>
                <th class="px-4 py-3">{$_('extensions.package_manager.labels.registry')}</th>
                <th class="px-4 py-3">{$_('extensions.package_manager.labels.status')}</th>
                <th class="px-4 py-3 text-right">{$_('extensions.package_manager.labels.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {#each registryEntries as entry (rowKey(entry.kind, entry.id) + ':' + entry.registryCanisterId)}
                {@const installedItem = isInstalled(entry)}
                {@const installedVersion = installedItem?.version ?? ''}
                {@const isOutdated =
                  installedItem &&
                  entry.latest &&
                  installedVersion &&
                  compareVersions(entry.latest, installedVersion) > 0}
                {@const rowBusy = busy[rowKey(entry.kind, entry.id)]}
                <tr class="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                  <td class="px-4 py-3">
                    <Badge color={entry.kind === 'extension' ? 'indigo' : 'purple'}>
                      {$_(`extensions.package_manager.kind.${entry.kind}`)}
                    </Badge>
                  </td>
                  <td class="px-4 py-3 font-mono">{entry.id}</td>
                  <td class="px-4 py-3">{entry.latest || '—'}</td>
                  <td class="px-4 py-3 text-xs font-mono">
                    {entry.registryCanisterId.slice(0, 5)}…
                  </td>
                  <td class="px-4 py-3">
                    {#if installedItem && isOutdated}
                      <Badge color="yellow">{$_('extensions.package_manager.status.outdated')}</Badge>
                    {:else if installedItem}
                      <Badge color="green">{$_('extensions.package_manager.status.installed')}</Badge>
                    {:else}
                      <Badge color="gray">{$_('extensions.package_manager.status.not_installed')}</Badge>
                    {/if}
                  </td>
                  <td class="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                    {#if rowBusy}
                      <span class="inline-flex items-center gap-2 text-xs">
                        <Spinner size="4" /> {rowBusy}
                      </span>
                    {:else if !installedItem}
                      <Button
                        size="xs"
                        color="green"
                        on:click={() => installFromRegistry(entry, entry.latest)}
                        disabled={!entry.latest}
                      >
                        {$_('extensions.package_manager.actions.install')}
                      </Button>
                    {:else if isOutdated}
                      <Button
                        size="xs"
                        color="yellow"
                        on:click={() => installFromRegistry(entry, entry.latest)}
                      >
                        {$_('extensions.package_manager.actions.update')}
                      </Button>
                    {:else}
                      <span class="text-xs text-gray-400">v{installedVersion}</span>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </TabItem>

    <!-- ============================================================ -->
    <!-- Tab 3: Upload                                                  -->
    <!-- ============================================================ -->
    <TabItem title={$_('extensions.package_manager.tabs.upload')}>
      <div class="space-y-4 max-w-2xl">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {$_('extensions.package_manager.messages.upload_select_kind')}
          </label>
          <div class="flex gap-2">
            <Button
              size="sm"
              color={uploadKind === 'extension' ? 'blue' : 'alternative'}
              on:click={() => (uploadKind = 'extension')}
            >
              {$_('extensions.package_manager.kind.extension')}
            </Button>
            <Button
              size="sm"
              color={uploadKind === 'codex' ? 'blue' : 'alternative'}
              on:click={() => (uploadKind = 'codex')}
            >
              {$_('extensions.package_manager.kind.codex')}
            </Button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {uploadKind === 'extension'
              ? $_('extensions.package_manager.messages.upload_extension_id')
              : $_('extensions.package_manager.messages.upload_codex_id')}
          </label>
          <Input bind:value={uploadId} placeholder="my_extension" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {$_('extensions.package_manager.messages.upload_dropzone')}
          </label>
          <input
            bind:this={fileInput}
            type="file"
            multiple
            webkitdirectory
            on:change={onFilesSelected}
            class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {#if uploadFiles.length > 0}
            <div class="mt-2 text-xs text-gray-600 dark:text-gray-400">
              {tt('extensions.package_manager.messages.upload_files_count', { count: uploadFiles.length })}
              · {fmtSize(uploadTotalBytes)}
              <button class="ml-2 underline" on:click={clearUpload}>
                {$_('extensions.package_manager.messages.upload_clear')}
              </button>
            </div>
            {#if uploadOverIngressLimit}
              <Alert color="yellow" class="mt-2">
                {tt('extensions.package_manager.messages.upload_size_warning', {
                  size: fmtSize(uploadTotalBytes),
                })}
              </Alert>
            {/if}
            <ul class="mt-2 max-h-40 overflow-auto text-xs font-mono text-gray-500 dark:text-gray-400 border rounded p-2 dark:border-gray-700">
              {#each uploadFiles as f}
                <li>{f.path} <span class="text-gray-400">({fmtSize(f.size)})</span></li>
              {/each}
            </ul>
          {/if}
        </div>

        {#if uploadKind === 'codex'}
          <div class="flex items-center gap-2">
            <Toggle bind:checked={uploadRunInit} />
            <span class="text-sm text-gray-700 dark:text-gray-300">
              {$_('extensions.package_manager.messages.upload_run_init')}
            </span>
          </div>
        {/if}

        <div>
          <Button
            color="green"
            on:click={performUpload}
            disabled={!uploadId || uploadFiles.length === 0 || uploadBusy}
          >
            {#if uploadBusy}
              <Spinner size="4" class="mr-2" /> {$_('extensions.package_manager.messages.loading')}
            {:else}
              {$_('extensions.package_manager.actions.install')}
            {/if}
          </Button>
        </div>
      </div>
    </TabItem>
  </Tabs>
</div>
