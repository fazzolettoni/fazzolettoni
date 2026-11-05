/**
 * Carica nel database le schede della raccolta AGESCI Sicilia (vedi src/lib/import).
 * Ogni gruppo e fazzolettone nasce con una revisione di tipo "import".
 * Uso: npm run seed:sicilia   (richiede data/sicilia/grezzi.json e il database avviato)
 */
import { createClient } from '@supabase/supabase-js';
import { FONTE_SICILIA, SCHEDE_SICILIA } from '../src/lib/import/index';
import { vuoto } from '../src/lib/import/sicilia';
import type { DatiFazzolettone, DatiGruppo } from '../src/lib/supabase/tipi';

const db = createClient(process.env.PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
	auth: { persistSession: false }
});

const { count } = await db
	.from('gruppi')
	.select('*', { count: 'exact', head: true })
	.eq('regione_slug', 'sicilia');
if (count) {
	console.error(`Ci sono già ${count} gruppi siciliani. Per ripartire: npx supabase db reset`);
	process.exit(1);
}

const fonte = `Import AGESCI Sicilia (${FONTE_SICILIA.aggiornata_al})`;
let n = 0;
for (const { gruppo: g, conversione: c } of SCHEDE_SICILIA) {
	const associazione = (g.campi.associazione ?? 'AGESCI').toLowerCase();
	const datiGruppo: DatiGruppo = {
		nome: g.nome,
		regione: 'Sicilia',
		attivo: !/^no$/i.test(g.campi.esistenza ?? ''),
		link: []
	};
	const datiFazzolettone: DatiFazzolettone = {
		design: c.design,
		data_inizio: null,
		data_fine: null,
		significato: vuoto(g.campi.note_storiche) ? null : g.campi.note_storiche!,
		fonti: [
			{
				tipo: 'agesci-sicilia',
				url: FONTE_SICILIA.url,
				nota: `Tabella curata da ${FONTE_SICILIA.curatore}`
			}
		],
		affidabilita: 'importato',
		note: c.note,
		da_rivedere: c.daRivedere,
		dati_originali: g.campi,
		conflitti: g.conflitti
	};
	const { error } = await db.rpc('importa', {
		p_associazione: associazione,
		p_gruppo: datiGruppo,
		p_fazzolettone: datiFazzolettone,
		p_fonte: fonte
	});
	if (error) {
		console.error(`${g.nome}: ${error.message}`);
		continue;
	}
	n++;
}
console.log(`Importati ${n}/${SCHEDE_SICILIA.length} gruppi`);
