import type { SupabaseClient } from '@supabase/supabase-js';
import { percorsoFazzolettone, percorsoGruppo } from '#lib/supabase/dati.ts';
import type { Gruppo, Revisione } from '#lib/supabase/tipi.ts';

export interface Modifica {
	id: number;
	tipo: Revisione['tipo'];
	entita: Revisione['entita'];
	creata_il: string;
	commento: string | null;
	autore: { id: string; nome: string; bannato: boolean } | null;
	autore_nome: string | null;
	/** Cosa è stato modificato, con il link alla pagina e alla storia. */
	titolo: string;
	percorso: string | null;
}

/** Ultime revisioni, con il nome del gruppo e i link: la "pagina delle modifiche recenti". */
export async function ultimeModifiche(
	db: SupabaseClient,
	{
		utente,
		conImport = false,
		limite = 100
	}: { utente?: string; conImport?: boolean; limite?: number }
): Promise<Modifica[]> {
	let q = db
		.from('revisioni')
		.select(
			'id, tipo, entita, entita_id, creata_il, commento, autore_nome, autore:autore(id, nome, bannato)'
		)
		.order('id', { ascending: false })
		.limit(limite);
	if (utente) q = q.eq('autore', utente);
	if (!conImport) q = q.neq('tipo', 'import');
	const { data } = await q;
	const righe = (data ?? []) as unknown as (Modifica & { entita_id: string })[];

	const idF = [
		...new Set(righe.filter((r) => r.entita === 'fazzolettone').map((r) => r.entita_id))
	];
	const idG = [...new Set(righe.filter((r) => r.entita === 'gruppo').map((r) => r.entita_id))];
	const [ff, gg] = await Promise.all([
		idF.length
			? db
					.from('fazzolettoni')
					.select('id, slug, gruppo:gruppo_id(nome, associazione, regione_slug, slug)')
					.in('id', idF)
			: { data: [] },
		idG.length
			? db.from('gruppi').select('id, nome, associazione, regione_slug, slug').in('id', idG)
			: { data: [] }
	]);
	const fazz = new Map((ff.data ?? []).map((f) => [f.id, f]));
	const grup = new Map((gg.data ?? []).map((g) => [g.id, g]));

	return righe.map((r) => {
		if (r.entita === 'fazzolettone') {
			const f = fazz.get(r.entita_id);
			const g = f?.gruppo as unknown as Gruppo | undefined;
			return {
				...r,
				titolo: g ? `${g.nome} · fazzolettone` : 'fazzolettone',
				percorso: f && g ? percorsoFazzolettone(g, f) : null
			};
		}
		const g = grup.get(r.entita_id);
		return {
			...r,
			titolo: g ? `${g.nome} · gruppo` : 'gruppo',
			percorso: g ? percorsoGruppo(g) : null
		};
	});
}
