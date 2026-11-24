// Writes the sample orders as payment files into the directory given, for tests/xsd/check.sh to validate.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { formatById } from '../src/lib/formats.ts';
import { SEPA_ORDER, SWISS_ORDER } from '../src/lib/samples.ts';

const dir = process.argv[2];
writeFileSync(join(dir, 'sps.xml'), formatById('sps-2025').write(SWISS_ORDER));
writeFileSync(join(dir, 'sepa.xml'), formatById('sepa-2025').write(SEPA_ORDER));
