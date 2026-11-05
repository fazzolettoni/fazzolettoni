import { error, redirect } from '@sveltejs/kit';
import { caricaGruppo } from '#lib/supabase/dati.ts';
import { salvaGruppo } from '#lib/server/gruppo.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params, url }) => {
	if (!locals.utente) redirect(303, `/accedi?poi=${encodeURIComponent(url.pathname)}`);
	const g = await caricaGruppo(locals.supabase, params.associazione, params.regione, params.gruppo);
	if (!g) error(404, 'Gruppo non trovato');
	return { gruppo: g };
};

export const actions: Actions = {
	default: async (event) => {
		const { params, locals } = event;
		const g = await caricaGruppo(
			locals.supabase,
			params.associazione,
			params.regione,
			params.gruppo
		);
		if (!g) error(404, 'Gruppo non trovato');
		return salvaGruppo(event, g.id, g.associazione);
	}
};
