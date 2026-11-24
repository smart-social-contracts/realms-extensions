#!/usr/bin/env bash
# Validates the sample payment files and the sample statements against the published schemas:
#   - the SPS file against SIX's pain.001.001.09.ch.03.xsd (SPS 2025, IG v2.2) and ISO's pain.001.001.09.xsd;
#   - the generic ISO file (CGI-MP) against ISO's pain.001.001.09.xsd;
#   - the SEPA file against ISO's pain.001.001.09.xsd (the EPC's own XSD is not downloadable by a script, so the EPC
#     rules are checked in sepa.ts instead);
#   - the SEPA direct debit against ISO's pain.008.001.08.xsd (EPC rules in sdd.ts), the PostFinance CH-DD file against
#     SIX's pain.008.001.02.ch.03.xsd (Swiss direct debits, SPS 2018);
#   - the camt samples against ISO's camt.052/053/054.001.08 schemas, the status report against pain.002.001.10.
# The schemas are downloaded once into .cache and pinned by sha256. Validation uses the JDK, because libxml2 (xmllint)
# cannot compile the SPS schema: its character-set pattern subtracts a class ("[...-[\p{C}]]").
set -euo pipefail
cd "$(dirname "$0")"
CACHE="${BANKING_XSD_CACHE:-$PWD/.cache}"
mkdir -p "$CACHE"

fetch() { # url file sha256
	if [ ! -f "$CACHE/$2" ]; then
		curl -fsSL --max-time 60 "$1" -o "$CACHE/$2.part"
		mv "$CACHE/$2.part" "$CACHE/$2"
	fi
	echo "$3  $CACHE/$2" | sha256sum --check --quiet -
}

SIX=https://www.six-group.com/dam/download/banking-services/standardization/sps
ISO=https://www.iso20022.org/sites/default/files/documents/messages
fetch "$SIX/ig-credit-transfer-xml-schema-sps-2025-en.zip" sps-2025.zip \
	bb02cc24bda59d04e7ad51a1706d68901a4517b0be8a1da55b055390e5e35f68
unzip -o -q -d "$CACHE" "$CACHE/sps-2025.zip" pain.001.001.09.ch.03.xsd
echo "8daf0973bc1d8eaec5b494214d843d1dd4ccfe10b2bf61739004fa0c9f30d675  $CACHE/pain.001.001.09.ch.03.xsd" \
	| sha256sum --check --quiet -
fetch "$SIX/ig-swiss-direct-debits-xml-schema-examples-sps2018-en.zip" swiss-dd-2018.zip \
	3ec1c788d055bac4b849f653cbec5dab8e560c24abe6d9a43cd17d8cd4e63ce3
unzip -o -q -d "$CACHE" "$CACHE/swiss-dd-2018.zip" pain.008.001.02.ch.03.xsd
echo "7b3c9bfd8fdbf44b6a83f496e6e03d3fe9948426e1429258095d872bef76163e  $CACHE/pain.008.001.02.ch.03.xsd" \
	| sha256sum --check --quiet -
fetch "$ISO/pain/schemas/pain.001.001.09.xsd" pain.001.001.09.xsd \
	de038b373e47b0077b1832ddd81f4b2f1eb25d35721f62da1e38b7f5a09fda24
fetch "$ISO/camt/schemas/camt.053.001.08.xsd" camt.053.001.08.xsd \
	338e9cb0c9989b5181802a7b773eece070d6815fc9d6483ac0579117bc24ccba
fetch "$ISO/camt/schemas/camt.054.001.08.xsd" camt.054.001.08.xsd \
	13d220337d47e22cf25788807c136794a76955791df612c6947277272d440da6
fetch "$ISO/camt/schemas/camt.052.001.08.xsd" camt.052.001.08.xsd \
	9bb093a0c39cd278d25b40d9ec8c59d1e8f6ab37536c83b84d41bbf5c7f8bd6c
fetch "$ISO/pain/schemas/pain.002.001.10.xsd" pain.002.001.10.xsd \
	2f9f8d0e9891fa9f31ccf0576397afe501614384d688ae6e43ba694b3d24b0cf
fetch "$ISO/pain/schemas/pain.008.001.08.xsd" pain.008.001.08.xsd \
	7edf4e4ce34c47a5567af6a327e22af4ed4007f715822af9f353c94ecc10f5ba

OUT="$(mktemp -d)"
trap 'rm -rf "$OUT"' EXIT
(cd ../../frontend-rt && node --experimental-strip-types --disable-warning=ExperimentalWarning scripts/write-samples.ts "$OUT")

java Validate.java "$CACHE/pain.001.001.09.ch.03.xsd" "$OUT/sps.xml"
java Validate.java "$CACHE/pain.001.001.09.xsd" "$OUT/sps.xml" "$OUT/sepa.xml" "$OUT/cgi.xml"
java Validate.java "$CACHE/pain.008.001.08.xsd" "$OUT/sepa-dd.xml"
java Validate.java "$CACHE/pain.008.001.02.ch.03.xsd" "$OUT/ch-dd.xml"
java Validate.java "$CACHE/camt.052.001.08.xsd" ../fixtures/camt052-sample.xml
java Validate.java "$CACHE/camt.053.001.08.xsd" ../fixtures/camt053-sample.xml
java Validate.java "$CACHE/camt.054.001.08.xsd" ../fixtures/camt054-sample.xml
java Validate.java "$CACHE/pain.002.001.10.xsd" ../fixtures/pain002-sample.xml
