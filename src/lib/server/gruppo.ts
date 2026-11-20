import { fail, redirect, type RequestEvent } from '@sveltejs/kit';
import { caricaGruppoPerId, percorsoGruppo } from '#lib/supabase/dati.ts';
import type { DatiGruppo, Indirizzo, Link } from '#lib/supabase/tipi.ts';
import { annoValido } from '#lib/gruppi.ts';

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
	const testo = (k: string) => String(form.get(k) ?? '').trim() || null;
	const anno = (k: string): number | null | 'errore' => {
		const t = testo(k);
		if (!t) return null;
		const n = Number(t);
		return annoValido(n) ? n : 'errore';
	};
	const fondazione = anno('anno_fondazione');
	const chiusura = anno('anno_chiusura');
	if (fondazione === 'errore' || chiusura === 'errore')
		return { errore: 'Gli anni vanno scritti per intero, es. 1974' };
	if (fondazione && chiusura && chiusura < fondazione)
		return { errore: "L'anno di chiusura viene prima di quello di fondazione" };
	const indirizzo: Indirizzo = {
		via: testo('via'),
		civico: testo('civico'),
		cap: testo('cap'),
		comune: testo('comune'),
		provincia: testo('provincia')?.toUpperCase() ?? null
	};
	const conIndirizzo = Object.values(indirizzo).some(Boolean);
	return {
		dati: {
			nome,
			regione,
			zona: testo('zona'),
			// senza anno di chiusura il gruppo è attivo, salvo "chiuso, anno non noto"
			attivo: !chiusura && form.get('chiuso_senza_anno') !== 'on',
			indirizzo: conIndirizzo ? indirizzo : null,
			anno_fondazione: fondazione,
			anno_chiusura: chiusura,
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
