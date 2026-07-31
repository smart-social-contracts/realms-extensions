import { mount, unmount } from 'svelte';
import ImportExport from './ImportExport.svelte';

export default function mountExt(target: HTMLElement, ctx: Record<string, any>) {
	const component = mount(ImportExport, { target, props: { ctx } });
	return {
		unmount() {
			try {
				unmount(component);
			} catch {
				/* already torn down */
			}
		},
	};
}
