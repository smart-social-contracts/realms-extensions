/** Browser PDF renderer (pdf-lib via unpkg). The canister never sees PDF bytes. */

import { safeLetterFilename, type MintedLetter } from './letterJob.ts';
import { letterJoinUrlFromWindow } from './letterJoinUrl.ts';
import { encodeJoinQr, type QrMatrix } from './letterQr.ts';

const PDF_LIB_URL = 'https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js';

export type LetterBranding = {
	realmName: string;
	logoBytes?: Uint8Array | null;
	logoMime?: string;
};

export const LETTER_INSTRUCTIONS = [
	'Create an Internet Identity.',
	'This code binds that identity to the imported record.',
	'Keep this letter.',
] as const;

export function letterPrintModel(letter: MintedLetter & { join_url?: string }): {
	recipientName: string;
	address: string;
	code: string;
	joinUrl: string;
	instructions: readonly string[];
} {
	return {
		recipientName: letter.name || letter.id,
		address: letter.address,
		code: letter.code,
		joinUrl: letter.join_url || '',
		instructions: LETTER_INSTRUCTIONS,
	};
}

export function prepareLetterForPdf(letter: MintedLetter): MintedLetter & {
	join_url: string;
	qr: QrMatrix;
} {
	const join_url = letter.join_url || letterJoinUrlFromWindow(letter.code);
	return { ...letter, join_url, qr: encodeJoinQr(join_url) };
}

const RENDER_SOURCE = `
function wrapLetterLines(text, font, size, maxWidth) {
  const lines = [];
  const paragraphs = String(text || '').split('\\n');
  for (let p = 0; p < paragraphs.length; p++) {
    const words = paragraphs[p].split(/\\s+/).filter(Boolean);
    if (!words.length) { lines.push(''); continue; }
    let current = words[0];
    for (let i = 1; i < words.length; i++) {
      const trial = current + ' ' + words[i];
      if (font.widthOfTextAtSize(trial, size) <= maxWidth) current = trial;
      else { lines.push(current); current = words[i]; }
    }
    lines.push(current);
  }
  return lines;
}

function wrapMono(text, font, size, maxWidth) {
  const raw = String(text || '');
  const lines = [];
  let current = '';
  for (let i = 0; i < raw.length; i++) {
    const trial = current + raw[i];
    if (current && font.widthOfTextAtSize(trial, size) > maxWidth) {
      lines.push(current);
      current = raw[i];
    } else current = trial;
  }
  if (current) lines.push(current);
  return lines;
}

function drawLocalQr(page, qr, x, y, size, black, white) {
  if (!qr || !qr.size || !qr.modules) return;
  const n = qr.size;
  const quiet = 2;
  const cells = n + quiet * 2;
  const cell = size / cells;
  page.drawRectangle({ x: x, y: y, width: size, height: size, color: white });
  for (let r = 0; r < n; r++) {
    const row = qr.modules[r] || [];
    for (let c = 0; c < n; c++) {
      if (!row[c]) continue;
      page.drawRectangle({
        x: x + (c + quiet) * cell,
        y: y + size - (r + 1 + quiet) * cell,
        width: cell,
        height: cell,
        color: black,
      });
    }
  }
}

async function renderRegistrationLetter(PDFLib, letter, branding) {
  const doc = await PDFLib.PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]);
  const size = page.getSize();
  const font = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
  const bold = await doc.embedFont(PDFLib.StandardFonts.HelveticaBold);
  const mono = await doc.embedFont(PDFLib.StandardFonts.Courier);
  const ink = PDFLib.rgb(0.12, 0.12, 0.14);
  const muted = PDFLib.rgb(0.35, 0.35, 0.38);
  const paper = PDFLib.rgb(0.97, 0.97, 0.98);
  const white = PDFLib.rgb(1, 1, 1);
  const margin = 56;
  let y = size.height - margin;
  const maxWidth = size.width - margin * 2;
  const logoBytes = branding && branding.logoBytes;
  if (logoBytes && logoBytes.length) {
    try {
      const mime = (branding.logoMime || '');
      const img = (mime.indexOf('jpeg') >= 0 || mime.indexOf('jpg') >= 0)
        ? await doc.embedJpg(logoBytes)
        : await doc.embedPng(logoBytes);
      const scale = Math.min(120 / img.width, 56 / img.height, 1);
      const w = img.width * scale;
      const h = img.height * scale;
      page.drawImage(img, { x: margin, y: y - h, width: w, height: h });
      y -= h + 14;
    } catch (e) {}
  }
  const realm = (branding && branding.realmName) || 'Realm';
  page.drawText(realm, { x: margin, y: y, size: 18, font: bold, color: ink });
  y -= 36;

  const recipient = letter.name || letter.id || '';
  if (recipient) {
    page.drawText(recipient, { x: margin, y: y, size: 13, font: bold, color: ink });
    y -= 18;
  }
  const addrLines = wrapLetterLines(letter.address || '', font, 11, maxWidth);
  for (let i = 0; i < addrLines.length; i++) {
    if (y < margin + 220) break;
    page.drawText(addrLines[i], { x: margin, y: y, size: 11, font: font, color: ink });
    y -= 15;
  }
  y -= 22;

  const qrSize = 132;
  const boxH = 112;
  const gap = 18;
  const boxW = maxWidth - qrSize - gap;
  const boxY = y - boxH;
  page.drawRectangle({
    x: margin,
    y: boxY,
    width: boxW,
    height: boxH,
    borderColor: ink,
    borderWidth: 1.25,
    color: paper,
  });
  page.drawText('One-use registration code', {
    x: margin + 14,
    y: boxY + boxH - 22,
    size: 9,
    font: font,
    color: muted,
  });
  const code = String(letter.code || '');
  let codeSize = 22;
  while (codeSize > 11 && bold.widthOfTextAtSize(code, codeSize) > boxW - 28) codeSize -= 1;
  page.drawText(code, {
    x: margin + 14,
    y: boxY + 42,
    size: codeSize,
    font: bold,
    color: ink,
  });
  drawLocalQr(page, letter.qr, margin + boxW + gap, boxY - (qrSize - boxH) / 2, qrSize, ink, white);
  y = Math.min(boxY, boxY - (qrSize - boxH) / 2) - 22;

  const joinUrl = letter.join_url || '';
  const urlLines = wrapMono(joinUrl, mono, 8, maxWidth);
  for (let i = 0; i < urlLines.length; i++) {
    page.drawText(urlLines[i], { x: margin, y: y, size: 8, font: mono, color: ink });
    y -= 11;
  }
  y -= 18;

  const notes = [
    'Create an Internet Identity.',
    'This code binds that identity to the imported record.',
    'Keep this letter.',
  ];
  for (let i = 0; i < notes.length; i++) {
    page.drawText(notes[i], { x: margin, y: y, size: 11, font: font, color: ink });
    y -= 16;
  }
  return doc.save();
}
`;

type PdfLibNs = {
	PDFDocument: unknown;
	StandardFonts: unknown;
	rgb: unknown;
};

let pdfLibPromise: Promise<PdfLibNs> | null = null;
let worker: Worker | null = null;
let jobSeq = 0;
const pending = new Map<number, { resolve: (b: Uint8Array) => void; reject: (e: Error) => void }>();

function loadPdfLib(): Promise<PdfLibNs> {
	if (pdfLibPromise) return pdfLibPromise;
	pdfLibPromise = (async () => {
		const existing = (globalThis as unknown as { PDFLib?: PdfLibNs }).PDFLib;
		if (existing) return existing;
		const res = await fetch(PDF_LIB_URL);
		if (!res.ok) throw new Error(`Failed to load pdf-lib (${res.status})`);
		const src = await res.text();
		const fn = new Function(`${src}\nreturn globalThis.PDFLib;`);
		const lib = fn() as PdfLibNs;
		if (!lib) throw new Error('pdf-lib did not initialize');
		return lib;
	})();
	return pdfLibPromise;
}

export async function renderLetterPdf(
	letter: MintedLetter,
	branding: LetterBranding,
): Promise<Uint8Array> {
	const prepared = prepareLetterForPdf(letter);
	const PDFLib = await loadPdfLib();
	const fn = new Function('PDFLib', 'letter', 'branding', `${RENDER_SOURCE}\nreturn renderRegistrationLetter(PDFLib, letter, branding);`);
	return fn(PDFLib, prepared, branding);
}

async function ensureWorker(): Promise<Worker> {
	if (worker) return worker;
	const libRes = await fetch(PDF_LIB_URL);
	if (!libRes.ok) throw new Error(`Failed to load pdf-lib (${libRes.status})`);
	const libSrc = await libRes.text();
	const src = `
		${libSrc}
		${RENDER_SOURCE}
		self.onmessage = async function (event) {
			var data = event.data || {};
			try {
				var bytes = await renderRegistrationLetter(globalThis.PDFLib, data.letter, data.branding);
				self.postMessage({ id: data.id, ok: true, bytes: bytes }, [bytes.buffer]);
			} catch (err) {
				self.postMessage({ id: data.id, ok: false, error: String(err && err.message ? err.message : err) });
			}
		};
	`;
	const blob = new Blob([src], { type: 'application/javascript' });
	worker = new Worker(URL.createObjectURL(blob));
	worker.onmessage = (event: MessageEvent) => {
		const { id, ok, bytes, error } = event.data || {};
		const wait = pending.get(id);
		if (!wait) return;
		pending.delete(id);
		if (ok) wait.resolve(new Uint8Array(bytes));
		else wait.reject(new Error(error || 'PDF worker failed'));
	};
	worker.onerror = (event) => {
		const err = new Error(event.message || 'PDF worker crashed');
		for (const wait of pending.values()) wait.reject(err);
		pending.clear();
		worker = null;
	};
	return worker;
}

export async function renderLetterPdfInWorker(
	letter: MintedLetter,
	branding: LetterBranding,
): Promise<Uint8Array> {
	try {
		const w = await ensureWorker();
		const id = ++jobSeq;
		return await new Promise((resolve, reject) => {
			pending.set(id, { resolve, reject });
			const logo = branding.logoBytes ? branding.logoBytes.slice() : null;
			const prepared = prepareLetterForPdf(letter);
			w.postMessage(
				{
					id,
					letter: prepared,
					branding: {
						realmName: branding.realmName,
						logoBytes: logo,
						logoMime: branding.logoMime,
					},
				},
				logo ? [logo.buffer] : [],
			);
		});
	} catch {
		return renderLetterPdf(letter, branding);
	}
}

export function downloadPdfBytes(filename: string, bytes: Uint8Array): void {
	const copy = bytes.slice();
	const blob = new Blob([copy], { type: 'application/pdf' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.rel = 'noopener';
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export function downloadLetterPdf(letter: MintedLetter, bytes: Uint8Array): void {
	downloadPdfBytes(safeLetterFilename(letter), bytes);
}

export async function loadLogoBytes(logoUrl?: string): Promise<{ bytes: Uint8Array; mime: string } | null> {
	const urls = [logoUrl, '/custom/logo.png'].filter((u, i, all) => !!u && all.indexOf(u) === i) as string[];
	for (const url of urls) {
		try {
			const res = await fetch(url);
			if (!res.ok) continue;
			const mime = res.headers.get('content-type') || 'image/png';
			return { bytes: new Uint8Array(await res.arrayBuffer()), mime };
		} catch {
			continue;
		}
	}
	return null;
}
