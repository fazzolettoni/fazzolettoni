import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from '$app/env/public';
import { ALPHA_PASSWORD } from '$app/env/private';
import { redirect } from '@sveltejs/kit';
import { sequence, type Handle } from '@sveltejs/kit/hooks';
import { COOKIE_ALPHA, impronta } from '#lib/server/alpha.ts';
import type { Profilo } from '#lib/supabase/tipi.ts';

/**
 * Versione alpha privata: se ALPHA_PASSWORD è impostata, ogni pagina chiede la password.
 * Il cookie contiene un'impronta della password: cambiandola, tutti devono rientrare.
 */
const alpha: Handle = async ({ event, resolve }) => {
	if (!ALPHA_PASSWORD || event.url.pathname === '/alpha') return resolve(event);
	if (event.cookies.get(COOKIE_ALPHA) !== (await impronta(ALPHA_PASSWORD))) {
		if (event.request.method !== 'GET') return new Response('Accesso riservato', { status: 403 });
		redirect(303, `/alpha?poi=${encodeURIComponent(event.url.pathname + event.url.search)}`);
	}
	const risposta = await resolve(event);
	risposta.headers.set('X-Robots-Tag', 'noindex, nofollow');
	return risposta;
};

const supabase: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookies) =>
				cookies.forEach(({ name, value, options }) =>
					event.cookies.set(name, value, { ...options, path: '/' })
				)
		}
	});

	// getUser verifica il token con il server di autenticazione (non si fida del cookie)
	const {
		data: { user }
	} = await event.locals.supabase.auth.getUser();
	event.locals.utente = user;
	event.locals.profilo = null;
	if (user) {
		const { data } = await event.locals.supabase
			.from('profili')
			.select('id, nome, ruolo, bannato')
			.eq('id', user.id)
			.single();
		event.locals.profilo = (data as Profilo) ?? null;
	}

	return resolve(event, {
		filterSerializedResponseHeaders: (name) =>
			name === 'content-range' || name === 'x-supabase-api-version'
	});
};

export const handle = sequence(alpha, supabase);
