import { ALPHA_PASSWORD } from '$app/env/private';
import { fail, redirect } from '@sveltejs/kit';
import { COOKIE_ALPHA, impronta } from '#lib/server/alpha.ts';
import type { Actions, PageServerLoad } from './$types';

/** Solo percorsi interni, per non rimandare altrove dopo l'ingresso. */
const destinazione = (poi: string | null) =>
	poi?.startsWith('/') && !poi.startsWith('//') ? poi : '/';

export const load: PageServerLoad = async ({ url }) => {
	if (!ALPHA_PASSWORD) redirect(303, destinazione(url.searchParams.get('poi')));
};

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const dati = await request.formData();
		if (!ALPHA_PASSWORD || dati.get('password') !== ALPHA_PASSWORD)
			return fail(400, { errore: true });
		cookies.set(COOKIE_ALPHA, await impronta(ALPHA_PASSWORD), {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: url.protocol === 'https:',
			maxAge: 60 * 60 * 24 * 60
		});
		redirect(303, destinazione(url.searchParams.get('poi')));
	}
};
