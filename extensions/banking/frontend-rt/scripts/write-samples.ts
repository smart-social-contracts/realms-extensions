// Writes the sample orders as payment and direct debit files into the directory given, for tests/xsd/check.sh.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { collectionFormatById, formatById } from '../src/lib/formats.ts';
import { CHDD_ORDER, SEPA_DD_ORDER, SEPA_ORDER, SWISS_ORDER, WORLD_ORDER } from '../src/lib/samples.ts';

const dir = process.argv[2];
writeFileSync(join(dir, 'sps.xml'), formatById('sps-2025').write(SWISS_ORDER));
writeFileSync(join(dir, 'sepa.xml'), formatById('sepa-2025').write(SEPA_ORDER));
writeFileSync(join(dir, 'cgi.xml'), formatById('iso-cgi').write(WORLD_ORDER));
writeFileSync(join(dir, 'sepa-dd.xml'), collectionFormatById('sepa-dd-2025').write(SEPA_DD_ORDER));
writeFileSync(join(dir, 'ch-dd.xml'), collectionFormatById('ch-dd').write(CHDD_ORDER));
