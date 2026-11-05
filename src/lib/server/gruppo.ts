import { fail, redirect, type RequestEvent } from '@sveltejs/kit';
import { caricaGruppoPerId, percorsoGruppo } from '#lib/supabase/dati.ts';
import type { DatiGruppo, Link } from '#lib/supabase/tipi.ts';

const TIPI_LINK = ['sito', 'scoutwiki', 'facebook', 'instagram', 'altro'];

/** Legge il modulo del gruppo; restituisce i dati o un errore da mostrare. */
export function leggiModulo(
	form: FormData
): { dati: DatiGruppo; commento: string } | { errore: string } {
	const nome = String(form.get('nome') ?? '').trim();
	const regione = String(form.get('regione') ?? '').trim();
	if (!nome || !regione) return { errore: 'Nome e regione sono obbligatori' };
	const link: Link[] = [];
	const tipi = form.getAll('link_tipo').map(String);
	const urls = form.getAll('link_url').map((u) => String(u).trim());
	for (let i = 0; i < urls.length; i++) {
		if (!urls[i]) continue;
		if (!/^https?:\/\/[^\s]+$/.test(urls[i])) return { errore: `Link non valido: ${urls[i]}` };
		link.push({ tipo: TIPI_LINK.includes(tipi[i]) ? tipi[i] : 'altro', url: urls[i] });
	}
	return {
		dati: {
			nome,
			regione,
			zona: String(form.get('zona') ?? '').trim() || null,
			attivo: form.get('attivo') === 'on',
			link
		},
		commento: String(form.get('commento') ?? '')
	};
}

/** Salva e porta alla pagina del gruppo (l'URL può essere cambiato). */
export async function salvaGruppo(
	{ request, locals, url }: RequestEvent,
	id: string | null,
	associazioneFissa: string | null
) {
	if (!locals.utente) redirect(303, `/accedi?poi=${encodeURIComponent(url.pathname)}`);
	const form = await request.formData();
	const letto = leggiModulo(form);
	const associazione = associazioneFissa ?? String(form.get('associazione') ?? '');
	if ('errore' in letto) return fail(400, { errore: letto.errore });
	const { data, error } = await locals.supabase.rpc('salva_gruppo', {
		p_id: id,
		p_associazione: associazione,
		p_dati: letto.dati,
		p_commento: letto.commento
	});
	if (error) return fail(400, { errore: error.message });
	const g = await caricaGruppoPerId(locals.supabase, data as string);
	redirect(303, g ? percorsoGruppo(g) : '/');
}
