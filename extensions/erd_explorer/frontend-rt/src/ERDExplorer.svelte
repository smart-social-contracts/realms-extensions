<script lang="ts">
	import { description as extensionDescription } from '../../manifest.json';
	import { onMount } from 'svelte';

	let { ctx }: { ctx: any } = $props();

	let entities: Record<string, any> = $state({});
	let entityData: Record<string, any> = $state({});
	let loading = $state(true);
	let error = $state('');
	let accessDeniedOp = $state('');

	let selectedEntity = $state('');
	let selectedRecord: any = $state(null);
	let currentPage = $state(1);
	const pageSize = 10;
	let isDragging = $state(false);
	let dragOffset = { x: 0, y: 0 };

	const svgWidth = 900;
	const svgHeight = 600;

	const REL_COLORS: Record<string, string> = {
		OneToOne: '#4F46E5',
		OneToMany: '#059669',
		ManyToOne: '#DC2626',
		ManyToMany: '#7C2D12',
	};
	const ENTITY_COLORS: Record<string, string> = {
		Realm: '#8B5CF6',
		User: '#3B82F6',
		Human: '#10B981',
		Identity: '#F59E0B',
	};

	async function callExt(fn: string, args: Record<string, unknown> = {}) {
		return await ctx.callSync(fn, args);
	}

	async function loadEntitySchema() {
		loading = true;
		error = '';
		accessDeniedOp = '';
		try {
			const response = await callExt('get_entity_schema');
			const schema = response?.entities ?? response?.data?.entities ?? response?.data ?? response;

			if (schema && typeof schema === 'object') {
				let col = 0;
				let row = 0;
				const perRow = 4;
				const newEntities: Record<string, any> = {};

				for (const [name, data] of Object.entries(schema)) {
					if (name.startsWith('_')) continue;
					const eData = data as any;
					newEntities[name] = {
						...eData,
						fields: eData.fields || [],
						relationships: eData.relationships || {},
						position: { x: 80 + col * 200, y: 80 + row * 160 },
						expanded: false,
					};
					col++;
					if (col >= perRow) { col = 0; row++; }
				}
				entities = newEntities;
			}
		} catch (e: any) {
			const op = ctx.ui?.accessDeniedOperation?.(e);
			if (op != null) {
				accessDeniedOp = op;
				error = '';
			} else {
				accessDeniedOp = '';
				error = e?.message ?? String(e);
			}
		} finally {
			loading = false;
		}
	}

	async function loadEntityData(entityType: string, page: number = 0) {
		try {
			const response = await callExt('get_entity_data', {
				entity_type: entityType,
				page_num: page,
				page_size: pageSize,
			});
			if (response) {
				entityData = { ...entityData, [entityType]: response?.data ?? response };
			}
		} catch (e: any) {
			console.error(`Failed to load ${entityType} data:`, e);
		}
	}

	function handleEntityClick(name: string) {
		if (selectedEntity === name) {
			entities[name].expanded = !entities[name].expanded;
		} else {
			if (selectedEntity && entities[selectedEntity]) entities[selectedEntity].expanded = false;
			selectedEntity = name;
			entities[name].expanded = true;
			selectedRecord = null;
			currentPage = 1;
			loadEntityData(name, 0);
		}
		entities = { ...entities };
	}

	function getEntityColor(name: string) {
		return ENTITY_COLORS[name] || '#6B7280';
	}

	function getRelColor(type: string) {
		return REL_COLORS[type] || '#6B7280';
	}

	function getPaginatedData(name: string): any[] {
		return entityData[name]?.items || entityData[name]?.data || [];
	}

	function getTotalPages(name: string): number {
		return entityData[name]?.total_pages || 0;
	}

	function getTotalCount(name: string): number {
		return entityData[name]?.total_items_count || entityData[name]?.total_count || 0;
	}

	async function changePage(name: string, newPage: number) {
		currentPage = newPage;
		await loadEntityData(name, newPage - 1);
	}

	function startDrag(event: MouseEvent, entityName: string) {
		isDragging = true;
		dragOffset.x = event.clientX - entities[entityName].position.x;
		dragOffset.y = event.clientY - entities[entityName].position.y;

		function onMove(e: MouseEvent) {
			if (isDragging) {
				entities[entityName].position.x = e.clientX - dragOffset.x;
				entities[entityName].position.y = e.clientY - dragOffset.y;
				entities = { ...entities };
			}
		}
		function onUp() {
			isDragging = false;
			document.removeEventListener('mousemove', onMove);
			document.removeEventListener('mouseup', onUp);
		}
		document.addEventListener('mousemove', onMove);
		document.addEventListener('mouseup', onUp);
	}

	let entityEntries = $derived(Object.entries(entities));
	let selectedFields = $derived(
		selectedEntity && entities[selectedEntity]
			? (Array.isArray(entities[selectedEntity].fields)
				? entities[selectedEntity].fields
				: Object.keys(entities[selectedEntity].fields || {}))
			: []
	);
	let selectedRels = $derived(
		selectedEntity && entities[selectedEntity]?.relationships
			? Object.entries(entities[selectedEntity].relationships)
			: []
	);

	onMount(async () => {
		await loadEntitySchema();
		const names = Object.keys(entities);
		if (names.length > 0) {
			selectedEntity = names[0];
			entities[names[0]].expanded = true;
			entities = { ...entities };
			await loadEntityData(names[0], 0);
		}
	});
</script>

<div class="max-w-6xl mx-auto p-4">
	<!-- Header -->
	<div class="mb-6">
		<div class="flex items-center gap-3 flex-wrap">
			<h2 class="text-2xl font-bold text-gray-900">ERD Explorer</h2>
			<button onclick={loadEntitySchema} disabled={loading} class="ml-auto px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-lg text-xs hover:bg-gray-200 transition-colors disabled:opacity-50">Refresh</button>
		</div>
		<p class="text-gray-600 text-sm mt-1">{extensionDescription}</p>
	</div>

	{#if accessDeniedOp}
		{#if ctx.ui?.AccessDenied}
			<svelte:component this={ctx.ui.AccessDenied} operation={accessDeniedOp} />
		{:else}
			<p class="text-sm text-gray-500">You need additional permissions to view this page.</p>
		{/if}
	{:else if error}
		<div class="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-lg mb-4 text-sm">
			{error}
			<button class="ml-3 underline text-sm" onclick={loadEntitySchema}>Retry</button>
		</div>
	{/if}

	{#if loading}
		<div class="flex items-center justify-center py-16">
			<svg class="animate-spin h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
			</svg>
			<span class="ml-3 text-gray-500">Loading entity schema...</span>
		</div>
	{:else}
		<div class="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4" style="min-height:calc(100vh - 220px)">

			<!-- ERD SVG Panel -->
			<div class="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col">
				<div class="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between flex-wrap gap-2">
					<h3 class="text-sm font-semibold text-gray-700">Entity Relationship Diagram</h3>
					<div class="flex gap-3 text-xs">
						{#each Object.entries(REL_COLORS) as [type, color]}
							<div class="flex items-center gap-1">
								<span class="w-3 h-3 rounded-sm" style="background-color:{color}"></span>
								<span class="text-gray-500">{type}</span>
							</div>
						{/each}
					</div>
				</div>
				<div class="flex-1 overflow-auto bg-gray-50/50">
					<svg width={svgWidth} height={svgHeight} class="block">
						<defs>
							{#each Object.entries(REL_COLORS) as [type, color]}
								<marker id="arrow-{type}" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
									<polygon points="0 0, 10 3.5, 0 7" fill={color} />
								</marker>
							{/each}
						</defs>

						<!-- Relationship lines -->
						{#each entityEntries as [name, entity]}
							{#each Object.entries(entity.relationships || {}) as [, rel]}
								{@const relObj = typeof rel === 'object' ? rel : { target: rel, type: 'OneToMany' }}
								{@const target = relObj.target}
								{#if entities[target]}
									<line
										x1={entity.position.x + 75}
										y1={entity.position.y + 40}
										x2={entities[target].position.x + 75}
										y2={entities[target].position.y + 40}
										stroke={getRelColor(relObj.type)}
										stroke-width="2"
										marker-end="url(#arrow-{relObj.type})"
									/>
								{/if}
							{/each}
						{/each}

						<!-- Entity nodes -->
						{#each entityEntries as [name, entity]}
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<g
								transform="translate({entity.position.x}, {entity.position.y})"
								class="cursor-move"
								onmousedown={(e) => startDrag(e, name)}
							>
								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<rect
									width="150" height="80" rx="8"
									fill={getEntityColor(name)}
									stroke={selectedEntity === name ? '#1F2937' : '#E5E7EB'}
									stroke-width={selectedEntity === name ? 3 : 1}
									class="cursor-pointer drop-shadow-sm"
									onclick={() => handleEntityClick(name)}
									onkeydown={(e) => { if (e.key === 'Enter') handleEntityClick(name); }}
									role="button"
									tabindex="0"
								/>
								<text x="75" y="25" text-anchor="middle" fill="white" font-weight="600" font-size="14">{name}</text>
								<text x="75" y="45" text-anchor="middle" fill="white" opacity="0.8" font-size="11">{getTotalCount(name) || 0} records</text>
								<text x="75" y="65" text-anchor="middle" fill="white" opacity="0.9" font-size="10">Click to explore</text>
							</g>
						{/each}
					</svg>
				</div>
			</div>

			<!-- Data Panel -->
			<div class="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col">
				{#if selectedEntity}
					<div class="px-4 py-3 border-b border-gray-200 bg-gray-50">
						<h3 class="text-sm font-semibold text-gray-700">
							{selectedEntity} Data
							<span class="text-xs text-gray-400 font-normal ml-1">({getTotalCount(selectedEntity)} total)</span>
						</h3>
					</div>

					{#if entities[selectedEntity]?.expanded}
						<div class="flex-1 p-4 overflow-y-auto space-y-5">
							<!-- Fields -->
							<div>
								<h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Fields</h4>
								<div class="flex flex-wrap gap-1.5">
									{#each selectedFields as field}
										<span class="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-mono">{typeof field === 'string' ? field : field.name || field}</span>
									{/each}
								</div>
							</div>

							<!-- Relationships -->
							{#if selectedRels.length > 0}
								<div>
									<h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Relationships</h4>
									<div class="space-y-1.5">
										{#each selectedRels as [relName, rel]}
											{@const relObj = typeof rel === 'object' ? rel : { target: rel, type: 'OneToMany' }}
											<div class="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
												<span class="font-medium text-gray-700">{relName}</span>
												<span class="font-semibold" style="color:{getRelColor(relObj.type)}">{relObj.type}</span>
												<span class="text-gray-500">{relObj.target}</span>
											</div>
										{/each}
									</div>
								</div>
							{/if}

							<!-- Data Table -->
							<div>
								<h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Entity Data</h4>
								{#if getPaginatedData(selectedEntity).length > 0}
									<div class="overflow-x-auto border border-gray-200 rounded">
										<table class="min-w-full text-xs">
											<thead>
												<tr class="bg-gray-50">
													{#each selectedFields.slice(0, 4) as field}
														<th class="px-3 py-2 text-left font-semibold text-gray-600 border-b border-gray-200">{typeof field === 'string' ? field : field.name || field}</th>
													{/each}
													<th class="px-3 py-2 text-left font-semibold text-gray-600 border-b border-gray-200">Actions</th>
												</tr>
											</thead>
											<tbody>
												{#each getPaginatedData(selectedEntity) as record}
													<tr
														class="hover:bg-gray-50 transition-colors cursor-pointer {selectedRecord === record ? 'bg-blue-50' : ''}"
														onclick={() => selectedRecord = record}
													>
														{#each selectedFields.slice(0, 4) as field}
															{@const key = typeof field === 'string' ? field : field.name || field}
															<td class="px-3 py-2 border-b border-gray-100 max-w-[150px] truncate">{record[key] ?? '-'}</td>
														{/each}
														<td class="px-3 py-2 border-b border-gray-100">
															<button class="text-blue-600 hover:underline" onclick={() => selectedRecord = record}>View</button>
														</td>
													</tr>
												{/each}
											</tbody>
										</table>
									</div>

									{#if getTotalPages(selectedEntity) > 1}
										<div class="flex justify-between items-center mt-3 text-xs">
											<button
												class="px-3 py-1 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
												disabled={currentPage === 1}
												onclick={() => changePage(selectedEntity, Math.max(1, currentPage - 1))}
											>Previous</button>
											<span class="text-gray-500">Page {currentPage} of {getTotalPages(selectedEntity)}</span>
											<button
												class="px-3 py-1 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
												disabled={currentPage === getTotalPages(selectedEntity)}
												onclick={() => changePage(selectedEntity, Math.min(getTotalPages(selectedEntity), currentPage + 1))}
											>Next</button>
										</div>
									{/if}
								{:else}
									<p class="text-gray-500 text-center py-4 text-sm">No data available for {selectedEntity}</p>
								{/if}
							</div>
						</div>
					{:else}
						<div class="flex-1 flex items-center justify-center p-4">
							<p class="text-gray-500 text-sm">Click on the {selectedEntity} node to expand and view data</p>
						</div>
					{/if}
				{:else}
					<div class="flex-1 flex items-center justify-center p-4">
						<p class="text-gray-500 text-sm">Select an entity from the diagram to view its data</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- Record Details Popup -->
		{#if selectedRecord}
			<div class="fixed bottom-4 right-4 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
				<div class="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between rounded-t-lg">
					<h4 class="text-sm font-semibold text-gray-700">Record Details</h4>
					<button class="text-gray-400 hover:text-gray-700 text-xl leading-none" onclick={() => selectedRecord = null}>&times;</button>
				</div>
				<div class="p-4 max-h-72 overflow-y-auto space-y-1.5">
					{#each Object.entries(selectedRecord) as [key, value]}
						<div class="flex text-xs">
							<span class="font-medium text-gray-700 min-w-[80px] shrink-0">{key}:</span>
							<span class="text-gray-500 break-all">{value}</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>
