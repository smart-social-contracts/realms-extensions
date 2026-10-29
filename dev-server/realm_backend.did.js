export const idlFactory = ({ IDL }) =>
	IDL.Service({
		read: IDL.Func([IDL.Text, IDL.Text], [IDL.Text], ['query']),
		run: IDL.Func([IDL.Text, IDL.Text], [IDL.Text], []),
	});
