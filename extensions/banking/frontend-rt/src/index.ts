import { mount, unmount } from 'svelte';
import Banking from './Banking.svelte';

export default function mountExt(target: HTMLElement, ctx: Record<string, any>) {
	const component = mount(Banking, { target, props: { ctx } });
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
