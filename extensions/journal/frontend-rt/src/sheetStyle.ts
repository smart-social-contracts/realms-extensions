/**
 * The style of the sheet: a serif page with rules, like a gazette, that reads on a phone and prints on A4. It is the
 * sheet's own (the sheet is a document of its own in an iframe), so no class of the realm's page reaches it or needs
 * to exist there.
 */

/** A string for CSS `content`. Text from the realm (its name) must not end the string or the style element. */
function cssString(text: string): string {
	return `"${text.replace(/[\\"]/g, '\\$&').replace(/[\r\n\f]/g, ' ').replace(/</g, '\\3c ')}"`;
}

/** The CSS `content` of a translated "Page {page} of {pages}": its words as strings, its two counters as counters. */
function pageCounters(template: string): string {
	return template
		.split(/\{(pages?)\}/)
		.flatMap((part, index) => (index % 2 ? [`counter(${part})`] : part ? [cssString(part)] : []))
		.join(' ');
}

/** The paper: A4 with margins, and in the foot of every printed page the issue and its page number (in the browsers that
 * print page margins; the others print the pages without them, and the colophon has the issue too). */
export function pageRules(footer: string, pageNumber: string): string {
	return `@page { size: A4; margin: 16mm 18mm 20mm;
		@bottom-left { content: ${cssString(footer)}; font: 8.5pt Georgia, 'Times New Roman', serif; color: #444; }
		@bottom-right { content: ${pageCounters(pageNumber)}; font: 8.5pt Georgia, 'Times New Roman', serif; color: #444; } }`;
}

export const SHEET_STYLE = `
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; padding: 28px 36px 24px; color: #111; background: #fff; font: 11pt/1.55 Georgia, 'Times New Roman', 'Noto Serif', serif; }
h1, h2, h3, p, dl, dd { margin: 0; }
a { color: #0b3d91; }
.mono { font-family: ui-monospace, 'DejaVu Sans Mono', Menlo, Consolas, monospace; overflow-wrap: anywhere; }

.masthead { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 16px; padding: 12px 0; border-top: 4px double #111; border-bottom: 1px solid #111; }
.masthead img { justify-self: start; max-height: 22mm; max-width: 36mm; object-fit: contain; }
.masthead .title { text-align: center; }
h1 { font-size: 22pt; line-height: 1.15; }
.identity { margin-top: 4px; font-size: 8pt; color: #4a4a4a; }
.number { justify-self: end; font-size: 13pt; font-weight: 700; text-align: right; white-space: nowrap; }
.dateline { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 2px 16px; padding: 6px 0; border-bottom: 2px solid #111; font-size: 10pt; }
.dateline .day { font-weight: 700; }

.section-title { margin: 22px 0 4px; padding: 3px 0; border-top: 1px solid #111; border-bottom: 1px solid #111; font-size: 11pt; letter-spacing: .12em; text-align: center; text-transform: uppercase; break-after: avoid; }
article { padding: 12px 0; border-bottom: 1px solid #bbb; break-inside: avoid; }
.ref { font-size: 9pt; color: #4a4a4a; letter-spacing: .03em; font-variant-numeric: tabular-nums; }
h3 { margin: 2px 0 6px; font-size: 12.5pt; line-height: 1.25; break-after: avoid; }
.facts { text-align: justify; hyphens: auto; }
.codices { margin-top: 6px; font-size: 9pt; }
.codices div { display: flex; flex-wrap: wrap; gap: 0 6px; }
.codices dt { font-weight: 700; }
.full { display: none; }
.links { margin-top: 6px; font-size: 9.5pt; }
.links a + a { margin-left: 14px; }
.empty { margin: 28px 0; text-align: center; font-style: italic; color: #4a4a4a; }

.colophon { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 2px 16px; margin-top: 22px; padding-top: 8px; border-top: 1px solid #111; font-size: 9pt; color: #4a4a4a; }
.authentication { display: grid; grid-template-columns: 1fr 30mm; gap: 8px 14px; margin-top: 14px; padding: 10px 12px; border: 1px solid #111; font-size: 9pt; break-inside: avoid; }
.authentication[hidden] { display: none; }
.authentication h2 { grid-column: 1 / -1; font-size: 9.5pt; letter-spacing: .08em; text-transform: uppercase; }
.authentication dl { display: grid; grid-template-columns: max-content 1fr; gap: 3px 12px; align-content: start; }
.authentication dt { font-weight: 700; }
.qr { width: 30mm; height: 30mm; border: 1px dashed #777; }

@media (max-width: 560px) {
	body { padding: 16px 14px; }
	.masthead { grid-template-columns: 1fr; text-align: center; }
	.masthead img, .number { justify-self: center; text-align: center; }
	h1 { font-size: 17pt; }
	.authentication { grid-template-columns: 1fr; }
}

@media print {
	body { padding: 0; font-size: 10pt; line-height: 1.45; }
	.masthead { padding: 8px 0; }
	h1 { font-size: 20pt; }
	.section-title { margin-top: 14px; }
	article { padding: 8px 0; }
	h3 { font-size: 12pt; }
	.colophon { margin-top: 14px; }
	a { color: inherit; text-decoration: none; }
	.links { display: none; }
	.short { display: none; }
	.full { display: inline; }
}
`;
