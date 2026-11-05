import { error, redirect } from '@sveltejs/kit';
import { caricaGruppo, redirectStorico } from '#lib/supabase/dati.ts';
import type { DatiFazzolettone, Revisione } from '#lib/supabase/tipi.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params, url }) => {
	const g = await caricaGruppo(locals.supabase, params.associazione, params.regione, params.gruppo);
	const f = g?.fazzolettoni.find((x) => x.slug === params.periodo);
	if (!g || !f) {
		const nuovo = await redirectStorico(
			locals.supabase,
			`${params.associazione}/${params.regione}/${params.gruppo}/${params.periodo}`
		);
		if (nuovo) redirect(301, nuovo + url.search);
		error(404, 'Fazzolettone non trovato');
	}
	// ?rev=123: una versione passata
	type Versione = Pick<Revisione<DatiFazzolettone>, 'id' | 'dati' | 'creata_il'>;
	let versione: Versione | null = null;
	const rev = Number(url.searchParams.get('rev'));
	if (rev && rev !== f.revisione_corrente) {
		const { data } = await locals.supabase
			.from('revisioni')
			.select('id, dati, creata_il')
			.eq('id', rev)
			.eq('entita', 'fazzolettone')
			.eq('entita_id', f.id)
			.maybeSingle();
		if (!data) error(404, 'Versione non trovata');
		versione = data as Versione;
	}
	return { gruppo: g, fazzolettone: f, versione };
};
