/** IndexedDB cursor + minted codes so a closed tab can resume without reminting. */

import type { LetterJobState } from './letterJob.ts';

const DB_NAME = 'realms-registration-letters';
const DB_VERSION = 1;
const STORE = 'jobs';
export const ACTIVE_JOB_KEY = 'active';

function openDb(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, DB_VERSION);
		req.onupgradeneeded = () => {
			const db = req.result;
			if (!db.objectStoreNames.contains(STORE)) {
				db.createObjectStore(STORE);
			}
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}

export async function loadLetterJob(key = ACTIVE_JOB_KEY): Promise<LetterJobState | null> {
	const db = await openDb();
	try {
		return await new Promise((resolve, reject) => {
			const tx = db.transaction(STORE, 'readonly');
			const req = tx.objectStore(STORE).get(key);
			req.onsuccess = () => resolve((req.result as LetterJobState) || null);
			req.onerror = () => reject(req.error);
		});
	} finally {
		db.close();
	}
}

export async function saveLetterJob(job: LetterJobState, key = ACTIVE_JOB_KEY): Promise<void> {
	const db = await openDb();
	try {
		await new Promise<void>((resolve, reject) => {
			const tx = db.transaction(STORE, 'readwrite');
			tx.objectStore(STORE).put(job, key);
			tx.oncomplete = () => resolve();
			tx.onerror = () => reject(tx.error);
		});
	} finally {
		db.close();
	}
}

export async function clearLetterJob(key = ACTIVE_JOB_KEY): Promise<void> {
	const db = await openDb();
	try {
		await new Promise<void>((resolve, reject) => {
			const tx = db.transaction(STORE, 'readwrite');
			tx.objectStore(STORE).delete(key);
			tx.oncomplete = () => resolve();
			tx.onerror = () => reject(tx.error);
		});
	} finally {
		db.close();
	}
}
