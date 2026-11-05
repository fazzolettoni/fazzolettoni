import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

/** Solo percorsi interni, per evitare redirect verso altri siti. */
const sicuro = (p: string | null) => (p && p.startsWith('/') && !p.startsWith('//') ? p : '/');

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.utente) redirect(303, sicuro(url.searchParams.get('poi')));
	return { poi: sicuro(url.searchParams.get('poi')) };
};

export const actions: Actions = {
	default: async ({ request, locals, url }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim();
		const poi = sicuro(String(form.get('poi') ?? '/'));
		if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
			return fail(400, { email, errore: 'Email non valida' });
		const { error } = await locals.supabase.auth.signInWithOtp({
			email,
			options: { emailRedirectTo: `${url.origin}/auth/conferma?poi=${encodeURIComponent(poi)}` }
		});
		if (error) return fail(400, { email, errore: error.message });
		return { inviata: true, email };
	}
};
