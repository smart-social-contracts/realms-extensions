<script>
  import { onMount } from 'svelte';
  import { backend } from '$lib/canisters';
  import GenericEntityTable from '$lib/components/ggg/GenericEntityTable.svelte';
  
  let activeTab = 'users';
  let data = {
    users: [],
    organizations: [],
    mandates: [],
    instruments: [],
    transfers: []
  };
  let loading = false;
  
  // Map display names to API class names
  const classNames = {
    users: 'User',
    organizations: 'Organization',
    mandates: 'Mandate',
    instruments: 'Instrument',
    transfers: 'Transfer'
  };
  
  async function fetchData(entityType) {
    console.log(`📥 Fetching ${entityType}...`);
    try {
      const className = classNames[entityType];
      const result = await backend.get_objects_paginated(className, 0, 20, 'desc');
      
      if (result.success && result.data) {
        const objects = result.data.objectsListPaginated?.objects || [];
        data[entityType] = objects.map(obj => {
          try {
            return typeof obj === 'string' ? JSON.parse(obj) : obj;
          } catch (e) {
            return obj;
          }
        });
        console.log(`✅ Loaded ${data[entityType].length} ${entityType}`);
        data = { ...data }; // Trigger reactivity
      }
    } catch (error) {
      console.error(`❌ Error fetching ${entityType}:`, error);
    }
  }
  
  onMount(async () => {
    console.log('🚀 Simple AdminDashboard mounted');
    loading = true;
    await Promise.all([
      fetchData('users'),
      fetchData('organizations'),
      fetchData('mandates'),
      fetchData('instruments'),
      fetchData('transfers')
    ]);
    loading = false;
  });
  
  function switchTab(tab) {
    console.log(`🔄 Switching to tab: ${tab}`);
    activeTab = tab;
  }
</script>

<div class="w-full px-4 max-w-none">
  <div class="flex justify-between items-center mb-6">
    <div>
      <h1 class="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
      <p class="text-gray-600 mt-1">Manage realm entities</p>
    </div>
  </div>
  
  <!-- Tabs -->
  <div class="mb-6 border-b border-gray-200">
    <div class="flex flex-wrap">
      <button 
        class="px-4 py-2 mr-1 {activeTab === 'users' ? 'border-b-2 border-blue-500 font-medium text-blue-600' : 'text-gray-600 hover:text-gray-900'}"
        on:click={() => switchTab('users')}
      >
        👤 Users
      </button>
      <button 
        class="px-4 py-2 mr-1 {activeTab === 'organizations' ? 'border-b-2 border-blue-500 font-medium text-blue-600' : 'text-gray-600 hover:text-gray-900'}"
        on:click={() => switchTab('organizations')}
      >
        🏢 Organizations
      </button>
      <button 
        class="px-4 py-2 mr-1 {activeTab === 'mandates' ? 'border-b-2 border-blue-500 font-medium text-blue-600' : 'text-gray-600 hover:text-gray-900'}"
        on:click={() => switchTab('mandates')}
      >
        📜 Mandates
      </button>
      <button 
        class="px-4 py-2 mr-1 {activeTab === 'instruments' ? 'border-b-2 border-blue-500 font-medium text-blue-600' : 'text-gray-600 hover:text-gray-900'}"
        on:click={() => switchTab('instruments')}
      >
        💰 Instruments
      </button>
      <button 
        class="px-4 py-2 mr-1 {activeTab === 'transfers' ? 'border-b-2 border-blue-500 font-medium text-blue-600' : 'text-gray-600 hover:text-gray-900'}"
        on:click={() => switchTab('transfers')}
      >
        🔄 Transfers
      </button>
    </div>
  </div>
  
  <!-- Content -->
  <div class="bg-white shadow-sm rounded-lg">
    {#if loading}
      <div class="text-center py-10 p-6">
        <div class="inline-block animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        <p class="mt-2 text-gray-600">Loading data...</p>
      </div>
    {:else}
      <!-- Users Tab -->
      <div class:hidden={activeTab !== 'users'}>
        <GenericEntityTable 
          entityType="users"
          items={data.users}
          loading={false}
        />
      </div>
      
      <!-- Organizations Tab -->
      <div class:hidden={activeTab !== 'organizations'}>
        <GenericEntityTable 
          entityType="organizations"
          items={data.organizations}
          loading={false}
        />
      </div>
      
      <!-- Mandates Tab -->
      <div class:hidden={activeTab !== 'mandates'}>
        <GenericEntityTable 
          entityType="mandates"
          items={data.mandates}
          loading={false}
        />
      </div>
      
      <!-- Instruments Tab -->
      <div class:hidden={activeTab !== 'instruments'}>
        <GenericEntityTable 
          entityType="instruments"
          items={data.instruments}
          loading={false}
        />
      </div>
      
      <!-- Transfers Tab -->
      <div class:hidden={activeTab !== 'transfers'}>
        <GenericEntityTable 
          entityType="transfers"
          items={data.transfers}
          loading={false}
        />
      </div>
    {/if}
  </div>
</div>

<style>
  .hidden {
    display: none;
  }
</style>
