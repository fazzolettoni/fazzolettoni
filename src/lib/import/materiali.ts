/**
 * Materiali dalla raccolta siciliana: "Stoffa" per il fondo, "Tipo fettuccia" per le fettucce.
 * Si riconoscono solo i valori chiari; il resto (es. "Cotone e raso", "Sconosciuto") resta
 * sconosciuto e il testo originale rimane in dati_originali.
 */
import type { Design, Materiale } from '../design/schema';

const REGOLE: [RegExp, Materiale][] = [
	[/^cotone misto sintetico$/, 'misto_sintetico'],
	[/^(tipo )?raso( ambedue)?$/, 'raso'],
	[/^coton[er]$/, 'cotone'],
	[/^gabardine$/, 'gabardine'],
	[/^(cordino di )?nylon\b/, 'nylon']
];

export function materialeDa(testo: string | null | undefined): Materiale | null {
	const t = (testo ?? '').trim().toLowerCase();
	for (const [re, m] of REGOLE) if (re.test(t)) return m;
	return null;
}

/**
 * Copia del design con i materiali aggiunti dove mancano: non sostituisce mai un materiale già
 * scelto da qualcuno. `cambiato` dice se c'è stato qualcosa da aggiungere.
 */
export function completaMateriali(
	design: Design,
	campi: { stoffa?: string | null; tipo_fettuccia?: string | null }
): { design: Design; cambiato: boolean } {
	const d = structuredClone(design);
	const fondo = materialeDa(campi.stoffa);
	const fettuccia = materialeDa(campi.tipo_fettuccia);
	let cambiato = false;
	for (const f of [d.fronte, d.retro]) {
		if (!f) continue;
		if (fondo && !f.fondo.materiale) {
			f.fondo.materiale = fondo;
			cambiato = true;
		}
		for (const fet of f.fettucce)
			if (fettuccia && !fet.materiale) {
				fet.materiale = fettuccia;
				cambiato = true;
			}
	}
	return { design: d, cambiato };
}
