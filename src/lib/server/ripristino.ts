import { fail, redirect, type RequestEvent } from '@sveltejs/kit';
import { percorsoFazzolettone, percorsoGruppo } from '#lib/supabase/dati.ts';
import type { Gruppo } from '#lib/supabase/tipi.ts';

/**
 * Azione comune "ripristina questa versione" per le pagine dello storico.
 * Il ripristino può cambiare l'URL (date o nome diversi): si torna allo storico all'indirizzo nuovo.
 */
export async function azioneRipristina({ request, locals, url }: RequestEvent) {
	if (!locals.utente) redirect(303, `/accedi?poi=${encodeURIComponent(url.pathname)}`);
	const revisione = Number((await request.formData()).get('revisione'));
	const { data: id, error } = await locals.supabase.rpc('ripristina', {
		p_revisione: revisione,
		p_commento: null
	});
	if (error) return fail(400, { errore: error.message });

	const { data: f } = await locals.supabase
		.from('fazzolettoni')
		.select('slug, gruppo:gruppo_id(associazione, regione_slug, slug)')
		.eq('id', id)
		.maybeSingle();
	if (f)
		redirect(
			303,
			`${percorsoFazzolettone(f.gruppo as unknown as Gruppo, f)}/storico?ripristinata=${revisione}`
		);
	const { data: g } = await locals.supabase
		.from('gruppi')
		.select('associazione, regione_slug, slug')
		.eq('id', id)
		.maybeSingle();
	redirect(303, g ? `${percorsoGruppo(g)}/storico?ripristinata=${revisione}` : '/');
}
