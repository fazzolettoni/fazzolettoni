import { attuali, ordinaFazzolettoni, type GruppoConDati } from '#lib/supabase/dati.ts';
import { avvisiDesign } from '#lib/design/render.ts';
import { normalizzaNomeColore, STIMA_COLORI } from '#lib/design/colori.ts';

const ORDINE_COLORI = Object.keys(STIMA_COLORI);
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
		const dati = attuale?.rev?.dati;
		// da rivedere: le note lasciate da chi l'ha inserito più tutto ciò che nel disegno è
		// sconosciuto o stimato (anche i colori dedotti dal nome): invita a completare i dati.
		const avvisi = [
			...(dati?.da_rivedere ?? []),
			...(dati?.design ? avvisiDesign(dati.design) : [])
		];
		// colore di fondo, per raggruppare e ordinare la griglia: l'ordine è quello di colori.ts
		const c = dati?.design?.fronte.fondo.colori[0];
		const nomeFondo = c?.nome ? normalizzaNomeColore(c.nome) : null;
		const i = nomeFondo ? ORDINE_COLORI.indexOf(nomeFondo) : -1;
		const fondo = {
			nome: nomeFondo,
			hex: c?.hex ?? (nomeFondo ? STIMA_COLORI[nomeFondo] : null) ?? null,
			ordine: i < 0 ? ORDINE_COLORI.length : i
		};
		return {
			id: g.id,
			fondo,
			associazione: g.associazione,
			nome: g.nome,
			slug: g.slug,
			regione: g.regione,
			regione_slug: g.regione_slug,
			attivo: g.attivo,
			n: ff.length,
			design: dati?.design ?? null,
			avvisi
		};
	});
	gruppi.sort((a, b) => a.nome.localeCompare(b.nome, 'it', { numeric: true }));
	return { gruppi };
};
