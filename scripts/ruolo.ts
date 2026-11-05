/**
 * Assegna un ruolo a un utente già registrato (serve per il primo amministratore).
 * Uso: npm run ruolo -- email@esempio.it amministratore|moderatore|utente
 */
import { createClient } from '@supabase/supabase-js';

const [email, ruolo] = process.argv.slice(2);
if (!email || !['utente', 'moderatore', 'amministratore'].includes(ruolo)) {
	console.error('Uso: npm run ruolo -- <email> <utente|moderatore|amministratore>');
	process.exit(1);
}
const db = createClient(process.env.PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
	auth: { persistSession: false }
});
const { data, error } = await db.auth.admin.listUsers({ perPage: 1000 });
if (error) throw error;
const u = data.users.find((x) => x.email?.toLowerCase() === email.toLowerCase());
if (!u) {
	console.error(`Nessun utente con email ${email}: prima deve accedere almeno una volta.`);
	process.exit(1);
}
const r = await db.from('profili').update({ ruolo }).eq('id', u.id);
if (r.error) throw r.error;
console.log(`${email} → ${ruolo}`);
