/**
 * Schede importate dalla raccolta AGESCI Sicilia, pronte per la galleria.
 * Dati per il proof of concept privato: non pubblicare senza permesso (vedi SPEC §8).
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

export const fonteSicilia = (g: Grezzi) => ({
	url: g.url,
	aggiornata_al: g.aggiornata_al,
	curatore: g.curatore
});

/** Converte e porta i lati alla forma giusta (es. "lati corti" di un quadrato). */
export function converti(g: GruppoSicilia): Conversione {
	const c = convertiGrezzo(g);
	return { ...c, design: normalizzaDesign(c.design) };
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
