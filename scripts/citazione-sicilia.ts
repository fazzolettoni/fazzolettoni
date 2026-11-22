/**
 * Aggiorna la citazione della fonte AGESCI Sicilia in tutti i fazzolettoni importati, con la
 * formula concordata con loro. Crea una revisione nuova solo dove il testo è ancora diverso.
 *
 *   npx tsx --env-file=.env.local scripts/citazione-sicilia.ts
 */
import { createClient } from '@supabase/supabase-js';
import { CITAZIONE_SICILIA } from '../src/lib/import/index';

const db = createClient(process.env.PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
	auth: { persistSession: false }
});
const { data, error } = await db.rpc('aggiorna_fonte', {
	p_tipo: 'agesci-sicilia',
	p_nota: CITAZIONE_SICILIA,
	p_fonte: 'AGESCI Sicilia',
	p_commento: 'Citazione della fonte concordata con AGESCI Sicilia'
});
if (error) throw error;
console.log(`${process.env.PUBLIC_SUPABASE_URL} · ${data} fazzolettoni aggiornati`);
