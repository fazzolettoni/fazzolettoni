import { attuali, ordinaFazzolettoni, type GruppoConDati } from '#lib/supabase/dati.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { data, error } = await locals.supabase
		.from('gruppi')
		.select(
			'id, associazione, nome, slug, regione, regione_slug, zona, attivo, fazzolettoni(id, slug, data_inizio, data_fine, rev:revisione_corrente(id, dati))'
		)
		.order('nome');
	if (error) throw error;
	const gruppi = (data as unknown as GruppoConDati[]).map((g) => {
		const ff = ordinaFazzolettoni(g.fazzolettoni);
		const [attuale] = attuali(ff);
		return {
			id: g.id,
			associazione: g.associazione,
			nome: g.nome,
			slug: g.slug,
			regione: g.regione,
			regione_slug: g.regione_slug,
			attivo: g.attivo,
			n: ff.length,
			design: attuale?.rev?.dati.design ?? null,
			daRivedere: !!attuale?.rev?.dati.da_rivedere?.length
		};
	});
	gruppi.sort((a, b) => a.nome.localeCompare(b.nome, 'it', { numeric: true }));
	return { gruppi };
};
