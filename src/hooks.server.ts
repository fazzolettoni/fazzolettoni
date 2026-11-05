import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from '$app/env/public';
import type { Handle } from '@sveltejs/kit/hooks';
import type { Profilo } from '#lib/supabase/tipi.ts';

export const handle: Handle = async ({ event, resolve }) => {
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
