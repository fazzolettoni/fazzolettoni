/**
 * Schede importate dalla raccolta AGESCI Sicilia, pronte per la galleria.
 * Pubblicate con il permesso di AGESCI Sicilia e la citazione concordata (vedi SPEC §8).
 */
import {
	convertiConRegole,
	unisci,
	type Conversione,
	type GruppoSicilia,
	type RigaGrezza
} from './sicilia';
import { MANUALI } from './sicilia-manuali';
import { normalizzaDesign } from '../design/schema';
import { completaMateriali } from './materiali';

export interface SchedaSicilia {
	gruppo: GruppoSicilia;
	conversione: Conversione;
}

/** Il file estratto da scripts/sicilia/estrai.py (data/sicilia/grezzi.json, fuori dal repository). */
export interface Grezzi {
	url: string;
	aggiornata_al: string;
	curatore: string;
	righe: unknown[];
}

/** Citazione della fonte concordata con AGESCI Sicilia. */
export const CITAZIONE_SICILIA =
	'Tabella curata da A.F. Scalini (Centro regionale studi e documentazione - Agesci Sicilia)';

export const fonteSicilia = (g: Grezzi) => ({
	url: g.url,
	aggiornata_al: g.aggiornata_al,
	curatore: g.curatore
});

/** Converte e porta i lati alla forma giusta (es. "lati corti" di un quadrato). */
export function converti(g: GruppoSicilia): Conversione {
	const c = convertiGrezzo(g);
	return { ...c, design: completaMateriali(normalizzaDesign(c.design), g.campi).design };
}

function convertiGrezzo(g: GruppoSicilia): Conversione {
	const base = convertiConRegole(g);
	const m = MANUALI[g.id];
	if (!m || (m.coloreBase && g.campi.colore_base?.toLowerCase() !== m.coloreBase)) return base;
	const design = structuredClone(base.design);
	design.fronte.fettucce = structuredClone(m.fettucce);
	if (m.elementi) design.fronte.elementi = structuredClone(m.elementi);
	if (m.design?.forma) design.forma = m.design.forma;
	return {
		design,
		note: [
			m.nota,
			...base.note.filter((n) => !/fettucce|sarchiata|stacco|tricolore|strisce/i.test(n))
		],
		daRivedere: [
			...(m.daRivedere ?? []),
			...base.daRivedere.filter((r) => /logo|fantasia|sconosciute/i.test(r) && !m.elementi)
		],
		metodo: 'manuale'
	};
}

export const schedeSicilia = (g: Grezzi): SchedaSicilia[] =>
	unisci(g.righe as RigaGrezza[]).map((gr) => ({ gruppo: gr, conversione: converti(gr) }));
