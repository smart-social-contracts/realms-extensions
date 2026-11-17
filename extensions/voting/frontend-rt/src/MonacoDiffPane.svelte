<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import loader from '@monaco-editor/loader';
	import type * as Monaco from 'monaco-editor';

	let {
		original = '',
		modified = '',
		language = 'python',
		readOnly = true,
		theme = 'vs',
	}: {
		original?: string;
		modified?: string;
		language?: string;
		readOnly?: boolean;
		theme?: string;
	} = $props();

	let container: HTMLDivElement | undefined = $state();
	let diffEditor: Monaco.editor.IStandaloneDiffEditor | undefined = $state();
	let monacoApi: typeof Monaco | undefined = $state();
	let loadError = $state('');

	const MONACO_VERSION = '0.52.2';
	const MONACO_VS = `https://unpkg.com/monaco-editor@${MONACO_VERSION}/min/vs`;

	function formatLoadError(e: unknown): string {
		if (e instanceof Error) return e.message;
		if (e && typeof e === 'object' && 'type' in e) {
			return 'Failed to load the diff editor script (check Content Security Policy or network).';
		}
		return String(e);
	}

	function setModels(orig: string, mod: string) {
		if (!diffEditor || !monacoApi) return;
		const previous = diffEditor.getModel();
		diffEditor.setModel({
			original: monacoApi.editor.createModel(orig, language),
			modified: monacoApi.editor.createModel(mod, language),
		});
		// The editor lets go of a model when it is given others: disposing one it still holds is an error.
		previous?.original?.dispose();
		previous?.modified?.dispose();
	}

	onMount(() => {
		let disposed = false;

		(async () => {
			if (!container) return;
			try {
				loader.config({ paths: { vs: MONACO_VS } });
				const monaco = await loader.init();
				if (disposed || !container) return;

				monacoApi = monaco;
				monaco.editor.setTheme(theme);

				diffEditor = monaco.editor.createDiffEditor(container, {
					readOnly,
					theme,
					automaticLayout: true,
					renderSideBySide: true,
					originalEditable: false,
					minimap: { enabled: true },
					scrollBeyondLastLine: false,
					fontSize: 13,
					renderOverviewRuler: true,
				});

				setModels(original, modified);
				diffEditor.layout();
				requestAnimationFrame(() => diffEditor?.layout());
			} catch (e: unknown) {
				loadError = formatLoadError(e);
			}
		})();

		return () => {
			disposed = true;
		};
	});

	$effect(() => {
		if (!diffEditor) return;
		const current = diffEditor.getModel();
		const origVal = current?.original?.getValue() ?? '';
		const modVal = current?.modified?.getValue() ?? '';
		if (original !== origVal || modified !== modVal) {
			setModels(original, modified);
			diffEditor.layout();
		}
	});

	$effect(() => {
		diffEditor?.updateOptions({ readOnly });
	});

	$effect(() => {
		monacoApi?.editor.setTheme(theme);
	});

	onDestroy(() => {
		const model = diffEditor?.getModel();
		diffEditor?.setModel(null);
		model?.original?.dispose();
		model?.modified?.dispose();
		diffEditor?.dispose();
		diffEditor = undefined;
	});
</script>

{#if loadError}
	<div class="monaco-error">
		<p>Failed to load diff editor.</p>
		<pre>{loadError}</pre>
	</div>
{:else}
	<div class="monaco-diff-host" bind:this={container}></div>
{/if}

<style>
	.monaco-diff-host {
		width: 100%;
		height: 28rem;
		min-height: 28rem;
	}

	.monaco-error {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		min-height: 12rem;
		padding: 24px;
		background: #f3f3f3;
		color: #b91c1c;
		font-size: 0.875rem;
		text-align: center;
	}

	.monaco-error pre {
		margin-top: 8px;
		font-size: 0.75rem;
		color: #6b7280;
		white-space: pre-wrap;
		max-width: 100%;
	}
</style>
