import { mount, unmount } from 'svelte';
import BudgetManager from './BudgetManager.svelte';

export default function mountExt(target: HTMLElement, ctx: Record<string, any>) {
	const component = mount(BudgetManager, { target, props: { ctx } });
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
