import { error, redirect } from '@sveltejs/kit';
import { caricaGruppo, caricaRevisioni, redirectStorico } from '#lib/supabase/dati.ts';
import { azioneRipristina } from '#lib/server/ripristino.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params, url }) => {
	const g = await caricaGruppo(locals.supabase, params.associazione, params.regione, params.gruppo);
	const f = g?.fazzolettoni.find((x) => x.slug === params.periodo);
	if (!g || !f) {
		const nuovo = await redirectStorico(
			locals.supabase,
			`${params.associazione}/${params.regione}/${params.gruppo}/${params.periodo}`
		);
		if (nuovo) redirect(301, `${nuovo}/storia${url.search}`);
		error(404, 'Fazzolettone non trovato');
	}
	return {
		gruppo: g,
		fazzolettone: f,
		revisioni: await caricaRevisioni(locals.supabase, 'fazzolettone', f.id)
	};
};

export const actions: Actions = { ripristina: azioneRipristina };
