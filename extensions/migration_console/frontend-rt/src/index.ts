import { mount, unmount } from 'svelte';
import MigrationConsole from './MigrationConsole.svelte';

export default function mountExt(target: HTMLElement, ctx: Record<string, any>) {
	const component = mount(MigrationConsole, { target, props: { ctx } });
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
