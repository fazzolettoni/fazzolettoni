import { redirect } from '@sveltejs/kit';
import { salvaGruppo } from '#lib/server/gruppo.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.utente) redirect(303, '/accedi?poi=/nuovo-gruppo');
	const { data } = await locals.supabase.from('associazioni').select('sigla, nome').order('sigla');
	return { associazioni: data ?? [] };
};

export const actions: Actions = { default: (event) => salvaGruppo(event, null, null) };
