// The part of Odoo's external API the connector uses: JSON-RPC to /jsonrpc, logged in as the connector's own Odoo user.

export interface Odoo {
	/** ``model.method(*args, **kwargs)`` as the connector's user. */
	call(model: string, method: string, args: unknown[], kwargs?: Record<string, unknown>): Promise<any>;
}

export async function odooAt(url: string, db: string, login: string, password: string): Promise<Odoo> {
	const endpoint = `${url.replace(/\/$/, '')}/jsonrpc`;
	let id = 0;
	async function rpc(service: string, method: string, args: unknown[]) {
		const response = await fetch(endpoint, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ jsonrpc: '2.0', method: 'call', id: ++id, params: { service, method, args } }),
		});
		const reply = await response.json();
		if (reply.error) throw new Error(`Odoo ${method}: ${reply.error.data?.message ?? reply.error.message}`);
		return reply.result;
	}
	const uid = await rpc('common', 'login', [db, login, password]);
	if (!uid) throw new Error(`Odoo refused the login ${login} on ${db}`);
	return { call: (model, method, args, kwargs = {}) => rpc('object', 'execute_kw', [db, uid, password, model, method, args, kwargs]) };
}
