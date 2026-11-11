import { mount, unmount } from 'svelte';
import CodexPage from './CodexPage.svelte';

export default function mountExt(target: HTMLElement, ctx: Record<string, any>) {
	const component = mount(CodexPage, { target, props: { ctx } });
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
