import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.utente) redirect(303, '/accedi?poi=/profilo');
	return {};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const nome = String((await request.formData()).get('nome') ?? '');
		const { error } = await locals.supabase.rpc('cambia_nome', { p_nome: nome });
		if (error) return fail(400, { errore: error.message, nome });
		return { salvato: true };
	}
};
