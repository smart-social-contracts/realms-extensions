import { mount, unmount } from 'svelte';
import TaxManager from './TaxManager.svelte';

export default function mountExt(target: HTMLElement, ctx: Record<string, any>) {
	const component = mount(TaxManager, { target, props: { ctx } });
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
