import PackageManager from './PackageManager.svelte';

export const metadata = {
  name: 'package_manager',
  version: '0.1.0',
  description: 'Install, update and uninstall extensions and codex packages from connected file registries',
  author: 'Realms Team',
  categories: ['other'],
  permissions: ['admin'],
  profiles: ['admin'],
  icon: 'layers',
  url_path: null,
  show_in_sidebar: true
};

export default PackageManager;
