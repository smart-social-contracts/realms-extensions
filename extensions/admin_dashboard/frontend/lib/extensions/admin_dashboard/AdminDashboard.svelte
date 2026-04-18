<script>
  import { onMount } from 'svelte';
  import { backend } from '$lib/canisters';
  import { ClipboardListOutline } from 'flowbite-svelte-icons';
  
  let selectedType = 'User';
  let items = [];
  let loading = false;
  let loadingTypes = true;
  let expandedItem = null;
  
  // Pagination state
  let currentPage = 0;
  let pageSize = 10;
  let totalItems = 0;
  let totalPages = 0;
  
  // Entity types - loaded dynamically from backend
  let entityTypes = [];
  
  // Active tab: 'browse', 'export', 'import'
  let activeTab = 'browse';
  
  // Export state
  let exporting = false;
  let exportResult = null;
  
  // Import state
  let importMode = 'file'; // 'file' or 'editor'
  let importText = '';
  const importPlaceholder = 'Paste JSON here, e.g.\n[\n  {"_type": "User", "_id": "1", "name": "Alice"},\n  {"_type": "User", "_id": "2", "name": "Bob"}\n]';
  let importFileName = '';
  let importPreview = null;
  let importing = false;
  let importResult = null;
  let fileInput;
  let dragOver = false;
  
  // Delete state
  let deletingId = null;
  let confirmDeleteItem = null;
  
  // Toast notifications
  let toasts = [];
  let toastCounter = 0;
  
  function addToast(message, type = 'success') {
    const id = ++toastCounter;
    toasts = [...toasts, { id, message, type }];
    setTimeout(() => {
      toasts = toasts.filter(t => t.id !== id);
    }, 4000);
  }
  
  // Icon mapping for entity types
  const entityIcons = {
    'Balance': '💵',
    'Call': '📞',
    'Codex': '📚',
    'Contract': '📝',
    'Dispute': '⚖️',
    'Human': '🧑',
    'Identity': '🆔',
    'Instrument': '💰',
    'Invoice': '🧾',
    'Land': '🏞️',
    'License': '📃',
    'Mandate': '📜',
    'Member': '👥',
    'Notification': '🔔',
    'Organization': '🏢',
    'PaymentAccount': '💳',
    'Permission': '🔐',
    'Proposal': '🗳️',
    'Realm': '🏛️',
    'Registry': '📋',
    'Service': '⚙️',
    'Task': '📋',
    'TaskExecution': '▶️',
    'TaskSchedule': '⏰',
    'TaskStep': '📌',
    'Token': '🪙',
    'Trade': '🤝',
    'Transfer': '🔄',
    'Treasury': '🏦',
    'User': '👤',
    'UserProfile': '📋',
    'Vote': '✅',
    'Zone': '🗺️',
  };
  
  function getEntityIcon(className) {
    return entityIcons[className] || '📊';
  }
  
  function formatLabel(className) {
    return className.replace(/([A-Z])/g, ' $1').trim();
  }
  
  async function loadEntityTypes() {
    try {
      const result = await backend.extension_call({ extension_name: 'admin_dashboard', function_name: 'get_entity_types', args: '{}' });
      if (result.success && result.response) {
        const data = typeof result.response === 'string' ? JSON.parse(result.response) : result.response;
        const classes = data.data || data;
        entityTypes = classes.map(className => ({
          value: className,
          label: `${getEntityIcon(className)} ${formatLabel(className)}`,
          className: className
        }));
        console.log(`Loaded ${entityTypes.length} entity types`);
      }
    } catch (error) {
      console.error('Error loading entity types:', error);
      entityTypes = [{ value: 'User', label: '👤 User', className: 'User' }];
    } finally {
      loadingTypes = false;
    }
  }
  
  async function loadData() {
    loading = true;
    expandedItem = null;
    const entityConfig = entityTypes.find(t => t.value === selectedType) || { className: selectedType, label: selectedType };
    
    try {
      const result = await backend.get_objects_paginated(
        entityConfig.className,
        currentPage,
        pageSize,
        'desc'
      );
      
      if (result.success && result.data) {
        const objects = result.data.objectsListPaginated?.objects || [];
        items = objects.map(obj => {
          try {
            return typeof obj === 'string' ? JSON.parse(obj) : obj;
          } catch (e) {
            return obj;
          }
        });
        
        const pagination = result.data.objectsListPaginated?.pagination;
        if (pagination) {
          totalItems = Number(pagination.total_items || 0);
          totalPages = Number(pagination.total_pages || 0);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      items = [];
    } finally {
      loading = false;
    }
  }
  
  function toggleExpand(index) {
    expandedItem = expandedItem === index ? null : index;
  }
  
  function copyJSON(item) {
    const json = JSON.stringify(item, null, 2);
    navigator.clipboard.writeText(json);
    addToast('JSON copied to clipboard');
  }
  
  function goToPage(page) {
    currentPage = page;
    loadData();
  }
  
  function nextPage() {
    if (currentPage < totalPages - 1) goToPage(currentPage + 1);
  }
  
  function prevPage() {
    if (currentPage > 0) goToPage(currentPage - 1);
  }
  
  function firstPage() {
    goToPage(0);
  }
  
  function lastPage() {
    goToPage(totalPages - 1);
  }
  
  // --- Export ---
  async function exportEntities() {
    exporting = true;
    exportResult = null;
    try {
      const exportArgs = { entity_types: [selectedType], include_codexes: true };
      const result = await backend.extension_call({
        extension_name: 'admin_dashboard',
        function_name: 'export_data',
        args: JSON.stringify(exportArgs)
      });
      
      if (result.success && result.response) {
        const parsed = typeof result.response === 'string' ? JSON.parse(result.response) : result.response;
        if (parsed.success && parsed.data) {
          const exportData = typeof parsed.data === 'string' ? JSON.parse(parsed.data) : parsed.data;
          exportResult = exportData;
          addToast(`Exported ${exportData.total_entities} entities`);
        } else {
          addToast(parsed.error || 'Export failed', 'error');
        }
      } else {
        addToast('Export call failed', 'error');
      }
    } catch (error) {
      console.error('Export error:', error);
      addToast(`Export error: ${error.message}`, 'error');
    } finally {
      exporting = false;
    }
  }
  
  async function exportAllEntities() {
    exporting = true;
    exportResult = null;
    try {
      const exportArgs = { include_codexes: true };
      const result = await backend.extension_call({
        extension_name: 'admin_dashboard',
        function_name: 'export_data',
        args: JSON.stringify(exportArgs)
      });
      
      if (result.success && result.response) {
        const parsed = typeof result.response === 'string' ? JSON.parse(result.response) : result.response;
        if (parsed.success && parsed.data) {
          const exportData = typeof parsed.data === 'string' ? JSON.parse(parsed.data) : parsed.data;
          exportResult = exportData;
          addToast(`Exported ${exportData.total_entities} entities, ${exportData.total_codexes} codexes`);
        } else {
          addToast(parsed.error || 'Export failed', 'error');
        }
      }
    } catch (error) {
      console.error('Export error:', error);
      addToast(`Export error: ${error.message}`, 'error');
    } finally {
      exporting = false;
    }
  }
  
  function downloadExport() {
    if (!exportResult) return;
    const json = JSON.stringify(exportResult, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    a.download = `export_${selectedType}_${timestamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Download started');
  }
  
  function downloadExportAll() {
    if (!exportResult) return;
    const json = JSON.stringify(exportResult, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    a.download = `export_all_${timestamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Download started');
  }
  
  // --- Import ---
  function handleFileSelect(event) {
    const file = event.target.files?.[0];
    if (file) readFile(file);
  }
  
  function handleDrop(event) {
    event.preventDefault();
    dragOver = false;
    const file = event.dataTransfer.files?.[0];
    if (file) readFile(file);
  }
  
  function handleDragOver(event) {
    event.preventDefault();
    dragOver = true;
  }
  
  function handleDragLeave() {
    dragOver = false;
  }
  
  function readFile(file) {
    importFileName = file.name;
    const reader = new FileReader();
    reader.onload = (e) => {
      importText = e.target.result;
      parseImportPreview();
    };
    reader.readAsText(file);
  }
  
  function parseImportPreview() {
    importPreview = null;
    importResult = null;
    if (!importText.trim()) return;
    
    try {
      const parsed = JSON.parse(importText);
      
      // Handle both formats: direct array or {entities: [...], codexes: [...]}
      let entities = [];
      let codexes = [];
      
      if (Array.isArray(parsed)) {
        entities = parsed;
      } else if (parsed.entities) {
        entities = parsed.entities || [];
        codexes = parsed.codexes || [];
      } else {
        // Single object
        entities = [parsed];
      }
      
      // Count by type
      const typeCounts = {};
      for (const ent of entities) {
        const t = ent._type || 'unknown';
        typeCounts[t] = (typeCounts[t] || 0) + 1;
      }
      
      importPreview = {
        totalEntities: entities.length,
        totalCodexes: codexes.length,
        typeCounts,
        valid: true,
        entities,
        codexes,
      };
    } catch (e) {
      importPreview = { valid: false, error: e.message };
    }
  }
  
  async function executeImport() {
    if (!importPreview || !importPreview.valid) return;
    importing = true;
    importResult = null;
    
    try {
      // Combine entities + codexes into a single array for import
      const allRecords = [...importPreview.entities];
      if (importPreview.codexes.length > 0) {
        for (const codex of importPreview.codexes) {
          allRecords.push({ ...codex, _type: 'Codex' });
        }
      }
      
      const importArgs = {
        format: 'json',
        data: JSON.stringify(allRecords),
      };
      
      const result = await backend.extension_call({
        extension_name: 'admin_dashboard',
        function_name: 'import_data',
        args: JSON.stringify(importArgs)
      });
      
      if (result.success && result.response) {
        const parsed = typeof result.response === 'string' ? JSON.parse(result.response) : result.response;
        importResult = parsed;
        if (parsed.success) {
          const d = parsed.data || {};
          addToast(`Imported ${d.successful || 0} of ${d.total_records || 0} records`);
        } else {
          addToast(parsed.error || 'Import failed', 'error');
        }
      }
    } catch (error) {
      console.error('Import error:', error);
      importResult = { success: false, error: error.message };
      addToast(`Import error: ${error.message}`, 'error');
    } finally {
      importing = false;
    }
  }
  
  function clearImport() {
    importText = '';
    importFileName = '';
    importPreview = null;
    importResult = null;
    if (fileInput) fileInput.value = '';
  }
  
  // --- Delete ---
  function requestDelete(item) {
    confirmDeleteItem = item;
  }
  
  function cancelDelete() {
    confirmDeleteItem = null;
  }
  
  async function confirmDelete() {
    if (!confirmDeleteItem) return;
    const item = confirmDeleteItem;
    const entityType = item._type;
    const entityId = item._id;
    confirmDeleteItem = null;
    deletingId = entityId;
    
    try {
      const result = await backend.extension_call({
        extension_name: 'admin_dashboard',
        function_name: 'delete_entity',
        args: JSON.stringify({ entity_type: entityType, entity_id: String(entityId) })
      });
      
      if (result.success && result.response) {
        const parsed = typeof result.response === 'string' ? JSON.parse(result.response) : result.response;
        if (parsed.success) {
          items = items.filter(i => !(i._type === entityType && i._id === entityId));
          totalItems = Math.max(0, totalItems - 1);
          addToast(`Deleted ${entityType}#${entityId}`);
        } else {
          addToast(parsed.error || 'Delete failed', 'error');
        }
      }
    } catch (error) {
      console.error('Delete error:', error);
      addToast(`Delete error: ${error.message}`, 'error');
    } finally {
      deletingId = null;
    }
  }
  
  // -----------------------------------------------------------------
  // Packages widget — links to the package_manager extension
  //
  // Surfaces a one-line summary of installed runtime extensions /
  // codex packages on top of admin_dashboard, plus how many of them
  // have a newer version available in any linked file_registry.
  // The actual install/update/uninstall UI lives in the dedicated
  // `package_manager` extension; this widget just deep-links to it.
  // -----------------------------------------------------------------
  let pkgInstalledCount = null;
  let pkgUpdateCount = 0;
  let pkgWidgetLoading = true;
  let pkgWidgetError = '';

  function _parseSemverParts(v) {
    return (v || '').split('-', 1)[0].split('.').map(n => parseInt(n, 10) || 0);
  }

  function _versionGreater(a, b) {
    const pa = _parseSemverParts(a);
    const pb = _parseSemverParts(b);
    const len = Math.max(pa.length, pb.length);
    for (let i = 0; i < len; i++) {
      const x = pa[i] ?? 0;
      const y = pb[i] ?? 0;
      if (x !== y) return x > y;
    }
    return false;
  }

  async function _registryBaseUrl(canisterId) {
    if (typeof window === 'undefined') return null;
    const host = window.location.host;
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
    if (isLocal) {
      const port = host.split(':')[1] ?? '4943';
      return `http://${canisterId}.localhost:${port}`;
    }
    return `https://${canisterId}.icp0.io`;
  }

  async function loadPackagesWidget() {
    pkgWidgetLoading = true;
    pkgWidgetError = '';
    try {
      const [extRaw, codexRaw, statusResp] = await Promise.all([
        backend.list_runtime_extensions().catch(() => '{}'),
        backend.list_codex_packages().catch(() => '{}'),
        backend.status().catch(() => null),
      ]);

      const extParsed = JSON.parse(extRaw || '{}');
      const codexParsed = JSON.parse(codexRaw || '{}');
      const installedExt = extParsed?.success ? (extParsed.runtime_extensions ?? []) : [];
      const installedCodex = codexParsed?.success ? (codexParsed.codex_packages ?? []) : [];
      const extManifests = extParsed?.success ? (extParsed.all_manifests ?? {}) : {};
      const codexManifests = codexParsed?.success ? (codexParsed.manifests ?? {}) : {};
      pkgInstalledCount = installedExt.length + installedCodex.length;

      // Compare against linked registries to count available updates.
      const registries = (statusResp?.success && statusResp.data?.status?.registries) || [];
      let updates = 0;
      for (const reg of registries) {
        try {
          const base = await _registryBaseUrl(reg.canister_id);
          if (!base) continue;
          const [extResp, codexResp] = await Promise.all([
            fetch(`${base}/api/extensions`, { headers: { Accept: 'application/json' } }),
            fetch(`${base}/api/codices`, { headers: { Accept: 'application/json' } }),
          ]);
          if (extResp.ok) {
            const exts = await extResp.json();
            for (const e of exts) {
              if (!installedExt.includes(e.ext_id)) continue;
              const installedVersion = extManifests?.[e.ext_id]?.version;
              if (installedVersion && e.latest && _versionGreater(e.latest, installedVersion)) {
                updates++;
              }
            }
          }
          if (codexResp.ok) {
            const codices = await codexResp.json();
            for (const c of codices) {
              if (!installedCodex.includes(c.codex_id)) continue;
              const installedVersion = codexManifests?.[c.codex_id]?.version;
              if (installedVersion && c.latest && _versionGreater(c.latest, installedVersion)) {
                updates++;
              }
            }
          }
        } catch (_e) {
          // A single unreachable registry must not break the widget.
        }
      }
      pkgUpdateCount = updates;
    } catch (e) {
      pkgWidgetError = e?.message ?? String(e);
    } finally {
      pkgWidgetLoading = false;
    }
  }

  onMount(() => {
    loadEntityTypes();
    loadPackagesWidget();
  });
</script>

<!-- Toast notifications -->
{#if toasts.length > 0}
  <div class="fixed top-4 right-4 z-50 flex flex-col gap-2">
    {#each toasts as toast (toast.id)}
      <div class="px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all
        {toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}">
        {toast.message}
      </div>
    {/each}
  </div>
{/if}

<!-- Delete confirmation modal -->
{#if confirmDeleteItem}
  <div class="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center">
    <div class="bg-white rounded-xl shadow-xl p-6 max-w-md mx-4">
      <h3 class="text-lg font-bold text-gray-900 mb-2">Confirm Delete</h3>
      <p class="text-gray-600 mb-4">
        Are you sure you want to delete <strong>{confirmDeleteItem._type}#{confirmDeleteItem._id}</strong>?
        {#if confirmDeleteItem.name}
          <br><span class="text-gray-500">({confirmDeleteItem.name})</span>
        {/if}
      </p>
      <p class="text-red-600 text-sm mb-4">This action cannot be undone.</p>
      <div class="flex justify-end gap-3">
        <button 
          on:click={cancelDelete}
          class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
        >
          Cancel
        </button>
        <button 
          on:click={confirmDelete}
          class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
{/if}

<div class="w-full px-4 max-w-none">
  <div class="flex justify-between items-center mb-6">
    <div>
      <h1 class="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
      <p class="text-gray-600 mt-1">Manage realm entities</p>
    </div>
  </div>

  <!-- Packages widget — links to the package_manager extension -->
  <a
    href="/extensions/package_manager"
    data-sveltekit-reload
    class="block mb-4 bg-white shadow-sm rounded-lg p-4 border border-gray-200 hover:border-blue-400 hover:shadow transition-all"
  >
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
          📦
        </div>
        <div>
          <div class="text-sm font-medium text-gray-700">Packages</div>
          {#if pkgWidgetLoading}
            <div class="text-xs text-gray-400">Loading…</div>
          {:else if pkgWidgetError}
            <div class="text-xs text-red-500">{pkgWidgetError}</div>
          {:else}
            <div class="text-xs text-gray-500">
              {pkgInstalledCount ?? 0} installed{#if pkgUpdateCount > 0} · <span class="text-yellow-600 font-medium">{pkgUpdateCount} update{pkgUpdateCount === 1 ? '' : 's'} available</span>{/if}
            </div>
          {/if}
        </div>
      </div>
      <span class="text-blue-600 text-sm font-medium">Manage →</span>
    </div>
  </a>

  <!-- Entity type selector -->
  <div class="mb-4 bg-white shadow-sm rounded-lg p-4">
    <div class="flex items-center gap-4 flex-wrap">
      <label for="entity-type-select" class="font-medium text-gray-700">Entity Type:</label>
      <select 
        id="entity-type-select"
        bind:value={selectedType}
        class="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {#each entityTypes as type}
          <option value={type.value}>{type.label}</option>
        {/each}
      </select>
    </div>
  </div>
  
  <!-- Tab navigation -->
  <div class="mb-4 border-b border-gray-200">
    <nav class="flex gap-1" aria-label="Tabs">
      <button 
        on:click={() => activeTab = 'browse'}
        class="px-5 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors
          {activeTab === 'browse' ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
      >
        Browse
      </button>
      <button 
        on:click={() => activeTab = 'export'}
        class="px-5 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors
          {activeTab === 'export' ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
      >
        Export
      </button>
      <button 
        on:click={() => activeTab = 'import'}
        class="px-5 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors
          {activeTab === 'import' ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
      >
        Import
      </button>
    </nav>
  </div>
  
  <!-- ==================== BROWSE TAB ==================== -->
  {#if activeTab === 'browse'}
    <div class="mb-4 flex items-center gap-4">
      <button 
        on:click={loadData}
        disabled={loading}
        class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
      >
        {loading ? 'Loading...' : 'Load Data'}
      </button>
      
      <div class="ml-auto text-gray-600 text-sm">
        {#if totalItems >= 0}
          Showing {items.length} of {totalItems} items
        {/if}
      </div>
    </div>
    
    <div class="bg-white shadow-sm rounded-lg">
      {#if loading}
        <div class="text-center py-10 p-6">
          <div class="inline-block animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <p class="mt-2 text-gray-600">Loading data...</p>
        </div>
      {:else if items.length === 0}
        <div class="text-center py-10 p-6">
          <p class="text-gray-500 text-lg">No items loaded. Select an entity type and click "Load Data".</p>
        </div>
      {:else}
        <div class="divide-y divide-gray-200">
          {#each items as item, index}
            <div class="p-4 hover:bg-gray-50 transition">
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-3">
                    <button 
                      on:click={() => toggleExpand(index)}
                      class="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {expandedItem === index ? '▼' : '▶'} 
                      {item._type || 'Entity'} #{item._id || index + 1}
                    </button>
                    {#if item.name}
                      <span class="text-gray-700">- {item.name}</span>
                    {/if}
                    {#if item.id}
                      <span class="text-xs text-gray-500">({item.id})</span>
                    {/if}
                  </div>
                </div>
                
                <div class="flex items-center gap-1">
                  <button 
                    on:click={() => copyJSON(item)}
                    class="p-1.5 hover:bg-gray-100 text-gray-600 hover:text-gray-900 rounded transition-colors"
                    title="Copy JSON"
                  >
                    <ClipboardListOutline class="w-4 h-4" />
                  </button>
                  <button 
                    on:click={() => requestDelete(item)}
                    disabled={deletingId === item._id}
                    class="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded transition-colors disabled:opacity-50"
                    title="Delete entity"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {#if expandedItem === index}
                <div class="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {#each Object.entries(item) as [key, value]}
                      <div>
                        <span class="font-semibold text-gray-700">{key}:</span>
                        <span class="text-gray-600 ml-2">
                          {typeof value === 'object' ? JSON.stringify(value) : value}
                        </span>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}
            </div>
          {/each}
        </div>
        
        <!-- Pagination Controls -->
        {#if totalPages > 1}
          <div class="border-t border-gray-200 p-4 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <button 
                on:click={firstPage}
                disabled={currentPage === 0}
                class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                First
              </button>
              <button 
                on:click={prevPage}
                disabled={currentPage === 0}
                class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Prev
              </button>
            </div>
            
            <span class="text-sm text-gray-600">Page {currentPage + 1} of {totalPages}</span>
            
            <div class="flex items-center gap-2">
              <button 
                on:click={nextPage}
                disabled={currentPage >= totalPages - 1}
                class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Next
              </button>
              <button 
                on:click={lastPage}
                disabled={currentPage >= totalPages - 1}
                class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Last
              </button>
            </div>
          </div>
        {/if}
      {/if}
    </div>
  
  <!-- ==================== EXPORT TAB ==================== -->
  {:else if activeTab === 'export'}
    <div class="bg-white shadow-sm rounded-lg p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Export Entities</h2>
      <p class="text-gray-600 text-sm mb-6">
        Export entities as a JSON file. You can export a single entity type or all types at once.
      </p>
      
      <div class="flex gap-3 mb-6">
        <button
          on:click={exportEntities}
          disabled={exporting}
          class="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
        >
          {exporting ? 'Exporting...' : `Export ${selectedType}`}
        </button>
        <button
          on:click={exportAllEntities}
          disabled={exporting}
          class="px-5 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
        >
          {exporting ? 'Exporting...' : 'Export All Types'}
        </button>
      </div>
      
      {#if exporting}
        <div class="flex items-center gap-3 text-gray-600">
          <div class="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          Exporting...
        </div>
      {/if}
      
      {#if exportResult}
        <div class="border border-gray-200 rounded-lg overflow-hidden">
          <div class="bg-gray-50 px-4 py-3 flex items-center justify-between border-b border-gray-200">
            <div class="text-sm text-gray-700">
              <strong>{exportResult.total_entities}</strong> entities
              {#if exportResult.total_codexes > 0}
                , <strong>{exportResult.total_codexes}</strong> codexes
              {/if}
            </div>
            <div class="flex gap-2">
              <button
                on:click={downloadExport}
                class="px-4 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 font-medium"
              >
                Download JSON
              </button>
              <button
                on:click={() => { navigator.clipboard.writeText(JSON.stringify(exportResult, null, 2)); addToast('Copied to clipboard'); }}
                class="px-4 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 font-medium"
              >
                Copy to Clipboard
              </button>
            </div>
          </div>
          <div class="max-h-96 overflow-auto">
            <pre class="p-4 text-xs text-gray-800 font-mono whitespace-pre-wrap">{JSON.stringify(exportResult, null, 2)}</pre>
          </div>
        </div>
      {/if}
    </div>
  
  <!-- ==================== IMPORT TAB ==================== -->
  {:else if activeTab === 'import'}
    <div class="bg-white shadow-sm rounded-lg p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Import Entities</h2>
      <p class="text-gray-600 text-sm mb-6">
        Import entities from a JSON file or paste JSON directly. Existing entities with the same type and ID will be updated (upsert).
      </p>
      
      <!-- Import mode toggle -->
      <div class="flex gap-2 mb-4">
        <button
          on:click={() => { importMode = 'file'; clearImport(); }}
          class="px-4 py-2 text-sm font-medium rounded-lg transition-colors
            {importMode === 'file' ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
        >
          Upload File
        </button>
        <button
          on:click={() => { importMode = 'editor'; clearImport(); }}
          class="px-4 py-2 text-sm font-medium rounded-lg transition-colors
            {importMode === 'editor' ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
        >
          JSON Editor
        </button>
      </div>
      
      {#if importMode === 'file'}
        <!-- File upload / drag-and-drop -->
        <div 
          on:drop={handleDrop}
          on:dragover={handleDragOver}
          on:dragleave={handleDragLeave}
          class="border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
            {dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}"
          on:click={() => fileInput?.click()}
          role="button"
          tabindex="0"
          on:keydown={(e) => e.key === 'Enter' && fileInput?.click()}
        >
          <input
            bind:this={fileInput}
            type="file"
            accept=".json"
            on:change={handleFileSelect}
            class="hidden"
          />
          {#if importFileName}
            <p class="text-blue-600 font-medium">{importFileName}</p>
            <p class="text-sm text-gray-500 mt-1">Click or drop to replace</p>
          {:else}
            <svg class="mx-auto h-10 w-10 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p class="text-gray-600 font-medium">Drop a JSON file here or click to browse</p>
            <p class="text-sm text-gray-400 mt-1">Accepts .json files</p>
          {/if}
        </div>
      {:else}
        <!-- JSON text editor -->
        <div class="relative">
          <textarea
            bind:value={importText}
            on:input={parseImportPreview}
            placeholder={importPlaceholder}
            class="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            spellcheck="false"
          ></textarea>
          {#if importText}
            <button
              on:click={clearImport}
              class="absolute top-2 right-2 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded"
            >
              Clear
            </button>
          {/if}
        </div>
      {/if}
      
      <!-- Import preview -->
      {#if importPreview}
        <div class="mt-4 border rounded-lg overflow-hidden {importPreview.valid ? 'border-green-200' : 'border-red-200'}">
          {#if importPreview.valid}
            <div class="bg-green-50 px-4 py-3 border-b border-green-200">
              <p class="text-sm font-medium text-green-800">
                Ready to import: {importPreview.totalEntities} entities
                {#if importPreview.totalCodexes > 0}, {importPreview.totalCodexes} codexes{/if}
              </p>
            </div>
            <div class="px-4 py-3">
              <div class="flex flex-wrap gap-2">
                {#each Object.entries(importPreview.typeCounts) as [type, count]}
                  <span class="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                    {getEntityIcon(type)} {type}: {count}
                  </span>
                {/each}
              </div>
              
              <div class="mt-4 flex gap-3">
                <button
                  on:click={executeImport}
                  disabled={importing}
                  class="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                >
                  {importing ? 'Importing...' : 'Confirm Import'}
                </button>
                <button
                  on:click={clearImport}
                  disabled={importing}
                  class="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          {:else}
            <div class="bg-red-50 px-4 py-3">
              <p class="text-sm font-medium text-red-800">Invalid JSON</p>
              <p class="text-sm text-red-600 mt-1">{importPreview.error}</p>
            </div>
          {/if}
        </div>
      {/if}
      
      <!-- Import result -->
      {#if importResult}
        <div class="mt-4 border rounded-lg overflow-hidden {importResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}">
          <div class="px-4 py-3">
            {#if importResult.success}
              <p class="text-sm font-medium text-green-800">Import complete</p>
              {#if importResult.data}
                <div class="mt-2 text-sm text-green-700">
                  <p>Total records: {importResult.data.total_records || 0}</p>
                  <p>Successful: {importResult.data.successful || 0}</p>
                  {#if importResult.data.failed > 0}
                    <p class="text-red-600">Failed: {importResult.data.failed}</p>
                    {#if importResult.data.errors?.length}
                      <ul class="mt-1 list-disc list-inside text-red-600">
                        {#each importResult.data.errors as err}
                          <li>{err}</li>
                        {/each}
                      </ul>
                    {/if}
                  {/if}
                </div>
              {/if}
            {:else}
              <p class="text-sm font-medium text-red-800">Import failed</p>
              <p class="text-sm text-red-600 mt-1">{importResult.error}</p>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>
