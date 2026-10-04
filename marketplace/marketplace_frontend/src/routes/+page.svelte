<script>
  import { onMount } from 'svelte';
  import extensionsData from '$lib/extensions.json';
  
  let extensions = [];
  let filteredExtensions = [];
  let selectedCategory = 'all';
  let searchQuery = '';
  
  let stats = {
    totalExtensions: 0,
    totalDevelopers: 0,
    totalPurchases: 0
  };
  
  let activeTab = 'browse';
  let loading = true;

  // Get unique categories
  $: categories = ['all', ...new Set(extensions.flatMap(e => e.categories))];
  
  // Filter extensions
  $: {
    filteredExtensions = extensions.filter(ext => {
      const matchesCategory = selectedCategory === 'all' || ext.categories.includes(selectedCategory);
      const matchesSearch = !searchQuery || 
        ext.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ext.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }

  // Get unique developers count
  $: uniqueDevelopers = new Set(extensions.map(e => e.author)).size;

  onMount(async () => {
    // Load extensions from generated JSON
    extensions = extensionsData.extensions || [];
    stats.totalExtensions = extensions.length;
    stats.totalDevelopers = uniqueDevelopers;
    loading = false;
  });
  
  function formatPrice(priceE8s) {
    if (priceE8s === 0) return 'Free';
    return `${(priceE8s / 100_000_000).toFixed(2)} ICP`;
  }
  
  function formatCategory(cat) {
    return cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
</script>

<div class="container">
  <!-- Header -->
  <header class="header">
    <div class="header-top">
      <a href="/" class="logo-link">
        <img src="/images/logo_horizontal.svg" alt="Realms" class="logo" />
      </a>
      <button class="btn btn-primary sign-in-btn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        Sign In
      </button>
    </div>
    <div class="header-content">
      <h1>Extensions Marketplace</h1>
    </div>
    <p class="subtitle">Discover, purchase, and publish extensions for Realms</p>
  </header>

  <!-- Controls -->
  <div class="controls">
    <div class="search-section">
      <div class="search-wrapper">
        <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <input 
          type="text" 
          placeholder="Search extensions..." 
          bind:value={searchQuery}
          class="search-input"
        />
        {#if searchQuery}
          <button class="search-clear" on:click={() => searchQuery = ''}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        {/if}
      </div>
    </div>
    <div class="view-toggle">
      {#each categories as category}
        <button 
          class="toggle-btn"
          class:active={selectedCategory === category}
          on:click={() => selectedCategory = category}
        >
          {formatCategory(category)}
        </button>
      {/each}
    </div>
  </div>

  <!-- Stats Bar -->
  <div class="stats-bar">
    <div class="stat-item">
      <span class="stat-value">{stats.totalExtensions}</span>
      <span class="stat-label">Extensions</span>
    </div>
    <div class="stat-item">
      <span class="stat-value">{stats.totalDevelopers}</span>
      <span class="stat-label">Developers</span>
    </div>
    <div class="stat-item">
      <span class="stat-value">{stats.totalPurchases}</span>
      <span class="stat-label">Installs</span>
    </div>
  </div>

  <!-- Main Content -->
  <main class="main-content">
    <!-- Navigation Tabs -->
    <div class="tab-bar">
      <button 
        class="tab-btn"
        class:active={activeTab === 'browse'}
        on:click={() => activeTab = 'browse'}
      >
        Browse
      </button>
      <button 
        class="tab-btn"
        class:active={activeTab === 'purchases'}
        on:click={() => activeTab = 'purchases'}
      >
        My Purchases
      </button>
      <button 
        class="tab-btn"
        class:active={activeTab === 'developer'}
        on:click={() => activeTab = 'developer'}
      >
        Developer Dashboard
      </button>
    </div>

    {#if loading}
      <div class="loading">
        <div class="spinner"></div>
        <p>Loading extensions...</p>
      </div>
    {:else if activeTab === 'browse'}
      {#if filteredExtensions.length === 0}
        <div class="empty-state">
          <h2>🔍 No Results</h2>
          <p>No extensions found matching your criteria.</p>
        </div>
      {:else}
        <div class="extensions-grid">
          {#each filteredExtensions as ext}
            <a href="/extension/{ext.id}" class="extension-card">
              <div class="card-accent"></div>
              <div class="extension-header">
                <div class="extension-icon">
                  <span>{ext.icon}</span>
                </div>
                <div class="price-badge" class:free={ext.price_e8s === 0}>
                  {formatPrice(ext.price_e8s)}
                </div>
              </div>
              <div class="extension-content">
                <h3 class="extension-name">{ext.name}</h3>
                <p class="extension-meta">v{ext.version} · {ext.author}</p>
                <p class="extension-description">{ext.description}</p>
                <div class="extension-categories">
                  {#each ext.categories as cat}
                    <span class="category-tag">{formatCategory(cat)}</span>
                  {/each}
                </div>
              </div>
              <div class="extension-actions">
                <span class="download-count">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  {ext.downloads}
                </span>
                <span class="view-details">
                  View Details →
                </span>
              </div>
            </a>
          {/each}
        </div>
        <div class="results-info">
          <p>Showing {filteredExtensions.length} of {extensions.length} extensions</p>
        </div>
      {/if}
    {:else if activeTab === 'purchases'}
      <div class="empty-state">
        <h2>🔐 Authentication Required</h2>
        <p>Connect your wallet to view your purchases.</p>
        <button class="btn btn-primary">Connect Wallet</button>
      </div>
    {:else if activeTab === 'developer'}
      <div class="empty-state">
        <h2>👨‍💻 Developer Portal</h2>
        <p>Connect your wallet and purchase a developer license to publish extensions.</p>
        <button class="btn btn-primary">Connect Wallet</button>
      </div>
    {/if}
  </main>

  <!-- Footer -->
  <footer class="footer">
    <div class="footer-top">
      <div class="footer-logo">
        <img src="/images/logo_horizontal.svg" alt="Realms GOS" class="footer-logo-img" />
      </div>
      <div class="footer-links">
        <a href="https://github.com/smart-social-contracts/realms-gos" target="_blank" rel="noopener noreferrer" class="github-link" aria-label="GitHub">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        </a>
        <a href="https://docs.realmsgos.org" target="_blank" rel="noopener noreferrer" class="docs-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
          Docs
        </a>
      </div>
    </div>
    <div class="footer-bottom">
      <a href="https://internetcomputer.org" target="_blank" rel="noopener noreferrer" class="ic-link">
        Built on the <img src="/images/internet-computer-icp-logo.svg" alt="Internet Computer" class="ic-logo" /> Internet Computer with ❤️ from 🇨🇭
      </a>
      <div class="footer-opensource">Open source software for a better world</div>
      <div class="footer-version">
        Realms Marketplace dev (local) - {new Date().toISOString().replace('T', ' ').substring(0, 19)}{typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname.endsWith('.localhost')) ? ' - Local deployment' : ''}
      </div>
    </div>
  </footer>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background: #FAFAFA;
    min-height: 100vh;
    color: #171717;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .logo-link {
    display: flex;
    align-items: center;
  }

  .logo {
    height: 40px;
    width: auto;
  }

  .sign-in-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .header-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
  }

  .header h1 {
    font-size: 2.5rem;
    margin: 0;
    font-weight: 700;
    color: #171717;
  }

  .subtitle {
    font-size: 1.2rem;
    margin: 1rem 0 0 0;
    color: #525252;
    font-weight: 400;
  }

  .controls {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .search-section {
    flex: 1;
    min-width: 300px;
  }

  .search-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-icon {
    position: absolute;
    left: 1rem;
    color: #A3A3A3;
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    padding: 1rem 2.5rem 1rem 3rem;
    font-size: 1rem;
    border: 1px solid #E5E5E5;
    border-radius: 0.75rem;
    background: #FFFFFF;
    color: #171717;
    font-family: inherit;
    transition: all 0.2s ease;
  }

  .search-input:focus {
    outline: none;
    border-color: #525252;
    box-shadow: 0 0 0 3px rgba(82, 82, 82, 0.1);
  }

  .search-clear {
    position: absolute;
    right: 0.75rem;
    background: none;
    border: none;
    padding: 0.25rem;
    cursor: pointer;
    color: #A3A3A3;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
  }

  .search-clear:hover {
    color: #525252;
    background: #F5F5F5;
  }

  .view-toggle {
    display: flex;
    background: #F5F5F5;
    border-radius: 0.5rem;
    padding: 0.25rem;
    gap: 0.25rem;
    flex-wrap: wrap;
  }

  .toggle-btn {
    padding: 0.5rem 0.75rem;
    border: none;
    background: transparent;
    color: #737373;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: all 0.15s ease;
    font-size: 0.875rem;
    font-family: inherit;
    font-weight: 500;
  }

  .toggle-btn:hover {
    color: #525252;
    background: rgba(255, 255, 255, 0.5);
  }

  .toggle-btn.active {
    background: #FFFFFF;
    color: #171717;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  }

  .stats-bar {
    display: flex;
    justify-content: center;
    gap: 3rem;
    padding: 1.5rem;
    background: #FFFFFF;
    border: 1px solid #E5E5E5;
    border-radius: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .stat-item {
    text-align: center;
  }

  .stat-value {
    display: block;
    font-size: 2rem;
    font-weight: 700;
    color: #171717;
  }

  .stat-label {
    font-size: 0.875rem;
    color: #737373;
  }

  .main-content {
    flex: 1;
    background: #FFFFFF;
    border-radius: 0.75rem;
    padding: 2rem;
    border: 1px solid #E5E5E5;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08);
  }

  .tab-bar {
    display: flex;
    gap: 0.25rem;
    background: #F5F5F5;
    padding: 0.25rem;
    border-radius: 0.5rem;
    width: fit-content;
    margin-bottom: 2rem;
  }

  .tab-btn {
    padding: 0.65rem 1.25rem;
    border: none;
    background: transparent;
    color: #737373;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: all 0.15s ease;
    font-size: 0.875rem;
    font-family: inherit;
    font-weight: 500;
  }

  .tab-btn:hover {
    color: #525252;
  }

  .tab-btn.active {
    background: #FFFFFF;
    color: #171717;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  }

  .loading, .empty-state {
    text-align: center;
    padding: 3rem;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #F5F5F5;
    border-top: 4px solid #525252;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .empty-state h2 {
    margin: 0 0 0.5rem 0;
    color: #171717;
  }

  .empty-state p {
    color: #525252;
    margin: 0 0 1.5rem 0;
  }

  .extensions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
  }

  .extension-card {
    display: block;
    text-decoration: none;
    background: #FFFFFF;
    border-radius: 1rem;
    border: 1px solid #E5E5E5;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.08);
    overflow: hidden;
    transition: all 0.2s ease;
    color: inherit;
  }

  .extension-card:hover {
    border-color: #D4D4D4;
    box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  .extension-card:hover .view-details {
    color: #171717;
  }

  .card-accent {
    height: 4px;
    background: linear-gradient(90deg, #404040 0%, #737373 100%);
  }

  .extension-header {
    padding: 1.5rem 1.5rem 0;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .extension-icon {
    width: 56px;
    height: 56px;
    border-radius: 0.75rem;
    background: linear-gradient(135deg, #525252 0%, #737373 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
  }

  .price-badge {
    padding: 0.35rem 0.75rem;
    border-radius: 2rem;
    background: #F5F5F5;
    color: #525252;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .price-badge.free {
    background: #DCFCE7;
    color: #166534;
  }

  .extension-content {
    padding: 1rem 1.5rem;
  }

  .extension-name {
    margin: 0 0 0.25rem;
    color: #171717;
    font-size: 1.15rem;
    font-weight: 600;
  }

  .extension-meta {
    margin: 0 0 0.75rem;
    font-size: 0.8rem;
    color: #737373;
  }

  .extension-description {
    margin: 0 0 1rem;
    font-size: 0.875rem;
    color: #525252;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .extension-categories {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .category-tag {
    padding: 0.25rem 0.5rem;
    background: #F5F5F5;
    color: #525252;
    font-size: 0.75rem;
    border-radius: 0.25rem;
    font-weight: 500;
  }

  .extension-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem 1.5rem;
    border-top: 1px solid #F5F5F5;
  }

  .download-count {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    color: #737373;
    font-size: 0.8rem;
  }

  .view-details {
    color: #525252;
    font-size: 0.8rem;
    font-weight: 500;
    transition: color 0.2s;
  }

  .btn {
    padding: 0.65rem 1.25rem;
    border: 1px solid transparent;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.15s ease-in-out;
    font-weight: 500;
    font-family: inherit;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .btn-sm {
    padding: 0.5rem 1rem;
    font-size: 0.8rem;
  }

  .btn-primary {
    background: #171717;
    color: #FFFFFF;
    border-color: #171717;
  }

  .btn-primary:hover {
    background: #262626;
    border-color: #262626;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.12);
  }

  .results-info {
    text-align: center;
    margin-top: 2rem;
    color: #737373;
    font-size: 0.875rem;
  }

  .footer {
    margin-top: 2rem;
    padding: 2rem 0;
    border-top: 1px solid #E5E5E5;
    background: #FFFFFF;
  }

  .footer-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1.5rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid #E5E5E5;
  }

  .footer-logo-img {
    height: 48px;
    width: auto;
  }

  .footer-links {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }

  .github-link {
    color: #737373;
    transition: color 0.2s;
  }

  .github-link:hover {
    color: #171717;
  }

  .docs-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #737373;
    text-decoration: none;
    font-size: 0.875rem;
    transition: color 0.2s;
  }

  .docs-link:hover {
    color: #171717;
  }

  .footer-bottom {
    padding-top: 2rem;
    text-align: center;
  }

  .ic-link {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    color: #525252;
    text-decoration: none;
    font-size: 0.875rem;
    transition: color 0.2s;
  }

  .ic-link:hover {
    color: #171717;
  }

  .ic-logo {
    height: 16px;
    width: 16px;
    margin: 0 0.25rem;
  }

  .footer-opensource {
    margin-top: 0.5rem;
    color: #737373;
    font-size: 0.875rem;
  }

  .footer-version {
    margin-top: 0.5rem;
    color: #A3A3A3;
    font-size: 0.75rem;
  }

  @media (max-width: 768px) {
    .container {
      padding: 1rem;
    }

    .header h1 {
      font-size: 1.75rem;
    }

    .controls {
      flex-direction: column;
    }

    .search-section {
      min-width: 100%;
    }

    .view-toggle {
      width: 100%;
      justify-content: center;
    }

    .stats-bar {
      gap: 1.5rem;
    }

    .stat-value {
      font-size: 1.5rem;
    }

    .extensions-grid {
      grid-template-columns: 1fr;
    }

    .footer {
      flex-direction: column;
      text-align: center;
    }
  }
</style>
