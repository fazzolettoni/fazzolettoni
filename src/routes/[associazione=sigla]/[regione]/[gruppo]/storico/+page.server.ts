import { error, redirect } from '@sveltejs/kit';
import { caricaGruppo, caricaRevisioni, redirectStorico } from '#lib/supabase/dati.ts';
import { azioneRipristina } from '#lib/server/ripristino.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params, url }) => {
	const g = await caricaGruppo(locals.supabase, params.associazione, params.regione, params.gruppo);
	if (!g) {
		const nuovo = await redirectStorico(
			locals.supabase,
			`${params.associazione}/${params.regione}/${params.gruppo}`
		);
		if (nuovo) redirect(301, `${nuovo}/storico${url.search}`);
		error(404, 'Gruppo non trovato');
	}
	return { gruppo: g, revisioni: await caricaRevisioni(locals.supabase, 'gruppo', g.id) };
};

export const actions: Actions = { ripristina: azioneRipristina };
