/**
 * Verifica delle regole di accesso sul database LOCALE (crea un utente di prova).
 * Uso: npm run verifica:permessi
 */
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';

const URL = process.env.PUBLIC_SUPABASE_URL!;
const PUB = process.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
if (!/127\.0\.0\.1|localhost/.test(URL)) throw new Error('Solo sul database locale');
const admin = createClient(URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
	auth: { persistSession: false }
});
const anon = createClient(URL, PUB, { auth: { persistSession: false } });

let ok = 0;
let ko = 0;
const atteso = (nome: string, riuscito: boolean) => {
	console.log(`${riuscito ? '✓' : '✗'} ${nome}`);
	riuscito ? ok++ : ko++;
};

// Utente di prova
const email = `prova-${Date.now()}@fazzolettoni.test`;
const password = randomBytes(18).toString('base64url');
const { data: creato, error: e1 } = await admin.auth.admin.createUser({
	email,
	password,
	email_confirm: true
});
if (e1) throw e1;
const utente = createClient(URL, PUB, { auth: { persistSession: false } });
await utente.auth.signInWithPassword({ email, password });

const { data: g } = await anon
	.from('gruppi')
	.select('id, nome, fazzolettoni(id, rev:revisione_corrente(dati))')
	.eq('slug', 'rosolini-1')
	.single();
const f = (
	g!.fazzolettoni as unknown as { id: string; rev: { dati: Record<string, unknown> } }[]
)[0];

// Anonimo
atteso(
	'anonimo: lettura pubblica',
	(await anon.from('gruppi').select('id').limit(1)).data?.length === 1
);
atteso(
	'anonimo: non può salvare',
	!!(
		await anon.rpc('salva_fazzolettone', {
			p_id: f.id,
			p_gruppo: g!.id,
			p_dati: f.rev.dati,
			p_commento: 'x'
		})
	).error
);
atteso(
	'anonimo: non può inserire gruppi',
	!!(
		await anon
			.from('gruppi')
			.insert({ associazione: 'agesci', nome: 'x', slug: 'x', regione: 'x', regione_slug: 'x' })
	).error
);

// Utente registrato
const upd = await utente.from('gruppi').update({ nome: 'Vandalo' }).eq('id', g!.id).select();
atteso('utente: update diretto bloccato', !!upd.error || upd.data?.length === 0);
const del = await utente.from('revisioni').delete().eq('entita_id', f.id).select();
atteso('utente: non può cancellare lo storico', !!del.error || del.data?.length === 0);
atteso(
	"utente: non può usare l'import",
	!!(
		await utente.rpc('importa', {
			p_associazione: 'agesci',
			p_gruppo: {},
			p_fazzolettone: null,
			p_fonte: 'x'
		})
	).error
);
atteso(
	'utente: non può sospendere',
	!!(await utente.rpc('imposta_ban', { p_utente: creato.user.id, p_bannato: true })).error
);
atteso(
	'utente: non può cambiarsi ruolo',
	!!(await utente.rpc('imposta_ruolo', { p_utente: creato.user.id, p_ruolo: 'amministratore' }))
		.error
);

const dati = structuredClone(f.rev.dati) as {
	design: { fronte: { fondo: { colori: { hex: string; nome: string }[] } } };
};
dati.design.fronte.fondo.colori[0] = { hex: '#ff00ff', nome: 'fucsia' };
const salvo = await utente.rpc('salva_fazzolettone', {
	p_id: f.id,
	p_gruppo: g!.id,
	p_dati: dati,
	p_commento: 'modifica di prova'
});
atteso('utente: può salvare tramite la funzione', !salvo.error);
// Il ripristino della versione precedente rimette a posto i dati di prova
const { data: rr } = await anon
	.from('revisioni')
	.select('id')
	.eq('entita_id', f.id)
	.order('id', { ascending: false })
	.limit(2);
atteso(
	'utente: può ripristinare',
	!(await utente.rpc('ripristina', { p_revisione: rr![1].id, p_commento: 'fine prova' })).error
);

// Sospeso
await admin.from('profili').update({ bannato: true }).eq('id', creato.user.id);
atteso(
	'sospeso: non può salvare',
	!!(
		await utente.rpc('salva_fazzolettone', {
			p_id: f.id,
			p_gruppo: g!.id,
			p_dati: f.rev.dati,
			p_commento: 'x'
		})
	).error
);

console.log(
	`\n${ok} ok, ${ko} falliti. Utente di prova: ${email} (sospeso; ${g!.nome} ripristinato)`
);
process.exit(ko ? 1 : 0);
