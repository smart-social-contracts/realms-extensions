/** Local QR matrix for the letter PDF. No network, no Google Charts. */

import qrcode from 'qrcode-generator';

export type QrMatrix = {
	size: number;
	modules: boolean[][];
};

export function encodeJoinQr(text: string): QrMatrix {
	const qr = qrcode(0, 'M');
	qr.addData(text);
	qr.make();
	const size = qr.getModuleCount();
	const modules: boolean[][] = [];
	for (let row = 0; row < size; row++) {
		const line: boolean[] = [];
		for (let col = 0; col < size; col++) {
			line.push(qr.isDark(row, col));
		}
		modules.push(line);
	}
	return { size, modules };
}
