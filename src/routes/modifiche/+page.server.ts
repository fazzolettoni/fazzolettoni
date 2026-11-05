import { ultimeModifiche } from '#lib/server/modifiche.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const utente = url.searchParams.get('utente') ?? undefined;
	const conImport = url.searchParams.has('import');
	let nomeUtente: string | null = null;
	if (utente) {
		const { data } = await locals.supabase
			.from('profili')
			.select('nome')
			.eq('id', utente)
			.maybeSingle();
		nomeUtente = data?.nome ?? null;
	}
	return {
		modifiche: await ultimeModifiche(locals.supabase, { utente, conImport }),
		utente,
		nomeUtente,
		conImport
	};
};
