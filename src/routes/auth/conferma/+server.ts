import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/** Arrivo dal link nell'email: scambia il codice con una sessione. */
export const GET: RequestHandler = async ({ url, locals }) => {
	const code = url.searchParams.get('code');
	const poi = url.searchParams.get('poi') ?? '/';
	const destinazione = poi.startsWith('/') && !poi.startsWith('//') ? poi : '/';
	if (code) {
		const { error } = await locals.supabase.auth.exchangeCodeForSession(code);
		if (!error) redirect(303, destinazione);
	}
	redirect(303, '/accedi?errore=link');
};
