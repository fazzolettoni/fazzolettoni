/**
 * Aggiunge sede e zona ai gruppi AGESCI Sicilia già presenti, dall'elenco
 * data/sicilia/indirizzi.tsv. Non sovrascrive niente: la funzione completa_gruppo riempie solo
 * i campi vuoti e crea una nuova revisione sopra quella corrente.
 *
 *   npx tsx --env-file=.env.local scripts/indirizzi-sicilia.ts            # prova, non scrive
 *   npx tsx --env-file=.env.local scripts/indirizzi-sicilia.ts --scrivi   # scrive
 */
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { chiaveNome, leggiIndirizzi } from '../src/lib/import/indirizzi';

const scrivi = process.argv.includes('--scrivi');
const FONTE = 'Elenco gruppi AGESCI Sicilia';
const db = createClient(process.env.PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
	auth: { persistSession: false }
});

const righe = leggiIndirizzi(readFileSync('data/sicilia/indirizzi.tsv', 'utf8'));
const perNome = new Map(righe.map((r) => [chiaveNome(r.gruppo), r]));

const { data: gruppi, error } = await db
	.from('gruppi')
	.select('id, nome, zona, revisione_corrente')
	.eq('associazione', 'agesci')
	.eq('regione_slug', 'sicilia')
	.order('nome');
if (error) throw error;

console.log(
	`${process.env.PUBLIC_SUPABASE_URL} · ${scrivi ? 'SCRITTURA' : 'prova (aggiungi --scrivi)'}`
);
let trovati = 0;
let aggiornati = 0;
const senza: string[] = [];
for (const g of gruppi) {
	const r = perNome.get(chiaveNome(g.nome));
	if (!r) {
		senza.push(g.nome);
		continue;
	}
	trovati++;
	const aggiunte = { indirizzo: r.indirizzo, zona: r.zona };
	if (!scrivi) {
		const { data: rev } = await db
			.from('revisioni')
			.select('dati')
			.eq('id', g.revisione_corrente)
			.single();
		const d = (rev?.dati ?? {}) as Record<string, unknown>;
		const campi = Object.keys(aggiunte).filter((k) => d[k] == null || d[k] === '');
		if (campi.length) aggiornati++;
		console.log(`  ${g.nome}: ${campi.length ? `+ ${campi.join(', ')}` : 'già completo'}`);
		continue;
	}
	const { data, error: e } = await db.rpc('completa_gruppo', {
		p_id: g.id,
		p_aggiunte: aggiunte,
		p_fonte: FONTE,
		p_commento: 'Sede e zona dall’elenco gruppi AGESCI Sicilia'
	});
	if (e) console.error(`  ${g.nome}: ${e.message}`);
	else {
		const campi = data as string[];
		if (campi.length) aggiornati++;
		console.log(`  ${g.nome}: ${campi.length ? `+ ${campi.join(', ')}` : 'già completo'}`);
	}
}
console.log(
	`\n${gruppi.length} gruppi AGESCI Sicilia · ${trovati} nell'elenco · ${aggiornati} ${scrivi ? 'aggiornati' : 'da aggiornare'}`
);
if (senza.length) console.log(`Non nell'elenco (probabilmente chiusi): ${senza.join(', ')}`);
