/** Letture comuni dal database (lato server o browser: riceve il client). */
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
	DataParziale,
	DatiFazzolettone,
	DatiGruppo,
	Fazzolettone,
	Gruppo,
	Revisione
} from './tipi';

export type FazzolettoneConDati = Fazzolettone & {
	rev: Pick<Revisione<DatiFazzolettone>, 'id' | 'dati' | 'creata_il'>;
};
export type GruppoConDati = Gruppo & {
	rev: Pick<Revisione<DatiGruppo>, 'id' | 'dati'>;
	fazzolettoni: FazzolettoneConDati[];
};

const SELECT_GRUPPO =
	'*, rev:revisione_corrente(id, dati), fazzolettoni(*, rev:revisione_corrente(id, dati, creata_il))';

export function percorsoGruppo(g: Pick<Gruppo, 'associazione' | 'regione_slug' | 'slug'>) {
	return `/${g.associazione}/${g.regione_slug}/${g.slug}`;
}
export function percorsoFazzolettone(
	g: Pick<Gruppo, 'associazione' | 'regione_slug' | 'slug'>,
	f: Pick<Fazzolettone, 'slug'>
) {
	return `${percorsoGruppo(g)}/${f.slug}`;
}

/** Ordine: prima i più recenti; quelli in uso (senza data di fine) in testa. */
export function ordinaFazzolettoni<
	T extends Pick<Fazzolettone, 'data_inizio' | 'data_fine' | 'slug'>
>(ff: T[]): T[] {
	const anno = (d: DataParziale | null, def: number) => d?.anno ?? def;
	return [...ff].sort(
		(a, b) =>
			Number(!!a.data_fine) - Number(!!b.data_fine) ||
			anno(b.data_inizio, -1) - anno(a.data_inizio, -1) ||
			a.slug.localeCompare(b.slug, 'it', { numeric: true })
	);
}

/** In uso = senza data di fine. Se nessuno lo è, il più recente. */
export function attuali<T extends Pick<Fazzolettone, 'data_fine'>>(ff: T[]): T[] {
	const senzaFine = ff.filter((f) => !f.data_fine);
	return senzaFine.length ? senzaFine : ff.slice(0, 1);
}

export function testoPeriodo(f: Pick<Fazzolettone, 'data_inizio' | 'data_fine'>): string {
	const d = (x: DataParziale) => `${x.circa ? 'circa ' : ''}${x.anno}`;
	if (f.data_inizio && f.data_fine) return `${d(f.data_inizio)} – ${d(f.data_fine)}`;
	if (f.data_inizio) return `dal ${d(f.data_inizio)}`;
	if (f.data_fine) return `fino al ${d(f.data_fine)}`;
	return 'periodo sconosciuto';
}

export async function caricaGruppo(
	db: SupabaseClient,
	associazione: string,
	regione: string,
	slug: string
) {
	const { data } = await db
		.from('gruppi')
		.select(SELECT_GRUPPO)
		.eq('associazione', associazione)
		.eq('regione_slug', regione)
		.eq('slug', slug)
		.maybeSingle();
	if (!data) return null;
	const g = data as GruppoConDati;
	g.fazzolettoni = ordinaFazzolettoni(g.fazzolettoni);
	return g;
}

export async function caricaGruppoPerId(db: SupabaseClient, id: string) {
	const { data } = await db.from('gruppi').select(SELECT_GRUPPO).eq('id', id).maybeSingle();
	if (!data) return null;
	const g = data as GruppoConDati;
	g.fazzolettoni = ordinaFazzolettoni(g.fazzolettoni);
	return g;
}

/** Un URL vecchio (gruppo rinominato, date corrette…) → URL attuale, se esiste. */
export async function redirectStorico(
	db: SupabaseClient,
	percorso: string
): Promise<string | null> {
	const { data } = await db
		.from('slug_storici')
		.select('entita, entita_id')
		.eq('percorso', percorso)
		.maybeSingle();
	if (!data) {
		// sottopagina di un gruppo che ha cambiato URL (nome, regione o associazione):
		// /vecchio-gruppo/1974-1996 → /nuovo-gruppo/1974-1996
		const parti = percorso.split('/');
		if (parti.length <= 3) return null;
		const gruppo = await redirectStorico(db, parti.slice(0, 3).join('/'));
		return gruppo ? [gruppo, ...parti.slice(3)].join('/') : null;
	}
	if (data.entita === 'gruppo') {
		const { data: g } = await db
			.from('gruppi')
			.select('associazione, regione_slug, slug')
			.eq('id', data.entita_id)
			.maybeSingle();
		return g ? percorsoGruppo(g) : null;
	}
	const { data: f } = await db
		.from('fazzolettoni')
		.select('slug, gruppo:gruppo_id(associazione, regione_slug, slug)')
		.eq('id', data.entita_id)
		.maybeSingle();
	const gr = f?.gruppo as unknown as Gruppo | undefined;
	return f && gr ? percorsoFazzolettone(gr, f) : null;
}

export type RevisioneConAutore = Revisione & { profilo: { nome: string } | null };

export async function caricaRevisioni(
	db: SupabaseClient,
	entita: 'gruppo' | 'fazzolettone',
	id: string
) {
	const { data } = await db
		.from('revisioni')
		.select('*, profilo:autore(nome)')
		.eq('entita', entita)
		.eq('entita_id', id)
		.order('id', { ascending: false });
	return (data ?? []) as RevisioneConAutore[];
}
