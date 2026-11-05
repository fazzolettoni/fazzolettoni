import { error, fail } from '@sveltejs/kit';
import { ultimeModifiche } from '#lib/server/modifiche.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.profilo || locals.profilo.ruolo === 'utente') error(403, 'Solo per i moderatori');
	const { data: utenti } = await locals.supabase
		.from('profili')
		.select('id, nome, ruolo, bannato, creato_il')
		.order('creato_il', { ascending: false })
		.limit(200);
	return {
		utenti: utenti ?? [],
		modifiche: await ultimeModifiche(locals.supabase, { limite: 30 })
	};
};

const utente = async (request: Request) => String((await request.formData()).get('utente'));

export const actions: Actions = {
	sospendi: async ({ request, locals }) => {
		const { error: e } = await locals.supabase.rpc('imposta_ban', {
			p_utente: await utente(request),
			p_bannato: true
		});
		return e ? fail(400, { errore: e.message }) : { messaggio: 'Utente sospeso' };
	},
	riattiva: async ({ request, locals }) => {
		const { error: e } = await locals.supabase.rpc('imposta_ban', {
			p_utente: await utente(request),
			p_bannato: false
		});
		return e ? fail(400, { errore: e.message }) : { messaggio: 'Utente riattivato' };
	},
	annulla: async ({ request, locals }) => {
		const { data, error: e } = await locals.supabase.rpc('annulla_utente', {
			p_utente: await utente(request)
		});
		return e ? fail(400, { errore: e.message }) : { messaggio: `Ripristinate ${data} schede` };
	},
	ruolo: async ({ request, locals }) => {
		const form = await request.formData();
		const { error: e } = await locals.supabase.rpc('imposta_ruolo', {
			p_utente: String(form.get('utente')),
			p_ruolo: String(form.get('ruolo'))
		});
		return e ? fail(400, { errore: e.message }) : { messaggio: 'Ruolo aggiornato' };
	}
};
