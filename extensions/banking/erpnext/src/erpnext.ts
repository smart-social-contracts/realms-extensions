// The part of ERPNext's REST API the connector uses (Frappe: /api/resource and /api/method), with an API key.

export interface ErpNext {
	list(doctype: string, filters: unknown[], fields?: string[]): Promise<any[]>;
	get(doctype: string, name: string): Promise<any>;
	update(doctype: string, name: string, values: Record<string, unknown>): Promise<any>;
	/** Attach ``text`` to a document as a private file. */
	attach(doctype: string, name: string, fileName: string, text: string): Promise<any>;
}

export function erpNextAt(url: string, key: string, secret: string): ErpNext {
	const base = url.replace(/\/$/, '');
	const headers = { Authorization: `token ${key}:${secret}`, Accept: 'application/json' };

	async function call(path: string, init: RequestInit = {}) {
		const response = await fetch(base + path, { ...init, headers: { ...headers, ...(init.headers ?? {}) } });
		const body = await response.text();
		if (!response.ok) throw new Error(`ERPNext ${init.method ?? 'GET'} ${path}: ${response.status} ${body.slice(0, 300)}`);
		return JSON.parse(body);
	}
	const json = (method: string, values: unknown) => ({
		method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values),
	});
	const resource = (doctype: string, name = '') => `/api/resource/${encodeURIComponent(doctype)}${name ? `/${encodeURIComponent(name)}` : ''}`;

	return {
		async list(doctype, filters, fields = ['name']) {
			const query = new URLSearchParams({ filters: JSON.stringify(filters), fields: JSON.stringify(fields), limit_page_length: '0' });
			return (await call(`${resource(doctype)}?${query}`)).data;
		},
		async get(doctype, name) {
			return (await call(resource(doctype, name))).data;
		},
		async update(doctype, name, values) {
			return (await call(resource(doctype, name), json('PUT', values))).data;
		},
		async attach(doctype, name, fileName, text) {
			const form = new FormData();
			form.append('file', new Blob([text], { type: 'application/xml' }), fileName);
			form.append('doctype', doctype);
			form.append('docname', name);
			form.append('is_private', '1');
			return (await call('/api/method/upload_file', { method: 'POST', body: form })).message;
		},
	};
}
