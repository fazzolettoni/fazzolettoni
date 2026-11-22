/**
 * Le schede della Sicilia per i test (src/lib/import/sicilia.spec.ts).
 * I dati grezzi non sono nel repository: se il file manca (per esempio nella build online) le
 * schede sono semplicemente vuote. Solo per Vite e Vitest; gli script usano index.ts.
 */
import { fonteSicilia, schedeSicilia, type Grezzi } from './index';

const file = import.meta.glob<Grezzi>('../../../data/sicilia/grezzi.json', {
	eager: true,
	import: 'default'
});
const grezzi: Grezzi = Object.values(file)[0] ?? {
	url: '',
	aggiornata_al: '',
	curatore: '',
	righe: []
};

export const SCHEDE_SICILIA = schedeSicilia(grezzi);
export const FONTE_SICILIA = fonteSicilia(grezzi);
