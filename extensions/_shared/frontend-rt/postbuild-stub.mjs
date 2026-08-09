/**
 * App-mode Vite builds emit index.html + assets/* but not dist/index.js.
 * GaaS seed and realms publish still use index.js as a "built" sentinel.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

writeFileSync(join('dist', 'index.js'), 'export default {};\n');
