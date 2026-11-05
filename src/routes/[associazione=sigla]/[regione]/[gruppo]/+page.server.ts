import { error, redirect } from '@sveltejs/kit';
import { attuali, caricaGruppo, redirectStorico } from '#lib/supabase/dati.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const g = await caricaGruppo(locals.supabase, params.associazione, params.regione, params.gruppo);
	if (!g) {
		const nuovo = await redirectStorico(
			locals.supabase,
			`${params.associazione}/${params.regione}/${params.gruppo}`
		);
		if (nuovo) redirect(301, nuovo);
		error(404, 'Gruppo non trovato');
	}
	const inUso = new Set(attuali(g.fazzolettoni).map((f) => f.id));
	return { gruppo: g, inUso: [...inUso] };
};
