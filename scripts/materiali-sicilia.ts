/**
 * Aggiunge i materiali (stoffa del fondo, tipo di fettuccia) ai fazzolettoni importati dalla
 * raccolta AGESCI Sicilia, leggendoli dai campi originali salvati con l'import. Non serve il
 * file della tabella. Riempie solo i materiali mancanti, e se un fazzolettone viene modificato
 * mentre lo script gira lo salta (vedi completa_fazzolettone).
 *
 *   npx tsx --env-file=.env.local scripts/materiali-sicilia.ts            # prova, non scrive
 *   npx tsx --env-file=.env.local scripts/materiali-sicilia.ts --scrivi   # scrive
 */
import { createClient } from '@supabase/supabase-js';
import { completaMateriali } from '../src/lib/import/materiali';
import { testoMateriali } from '../src/lib/design/materiali';
import type { DatiFazzolettone } from '../src/lib/supabase/tipi';

const scrivi = process.argv.includes('--scrivi');
const FONTE = 'Raccolta AGESCI Sicilia';
const db = createClient(process.env.PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
	auth: { persistSession: false }
});

const { data, error } = await db
	.from('fazzolettoni')
	.select('id, gruppo:gruppi!inner(nome), rev:revisione_corrente(id, dati)')
	.not('revisione_corrente', 'is', null);
if (error) throw error;

console.log(
	`${process.env.PUBLIC_SUPABASE_URL} · ${scrivi ? 'SCRITTURA' : 'prova (aggiungi --scrivi)'}`
);
type Riga = { id: string; gruppo: { nome: string }; rev: { id: number; dati: DatiFazzolettone } };
let conOriginali = 0;
let aggiornati = 0;
const saltati: string[] = [];
for (const f of data as unknown as Riga[]) {
	const orig = f.rev.dati.dati_originali;
	if (!orig) continue;
	conOriginali++;
	const { design, cambiato } = completaMateriali(f.rev.dati.design, orig);
	if (!cambiato) continue;
	aggiornati++;
	console.log(`  ${f.gruppo.nome}: ${testoMateriali(design)}`);
	if (!scrivi) continue;
	const { data: ok, error: e } = await db.rpc('completa_fazzolettone', {
		p_id: f.id,
		p_dati: { ...f.rev.dati, design },
		p_revisione: f.rev.id,
		p_fonte: FONTE,
		p_commento: 'Tessuto del fondo e delle fettucce dalla raccolta AGESCI Sicilia'
	});
	if (e) console.error(`  ${f.gruppo.nome}: ${e.message}`);
	else if (!ok) saltati.push(f.gruppo.nome);
}
console.log(
	`\n${conOriginali} fazzolettoni importati · ${aggiornati} ${scrivi ? 'aggiornati' : 'da aggiornare'}`
);
if (saltati.length) console.log(`Saltati perché modificati nel frattempo: ${saltati.join(', ')}`);
