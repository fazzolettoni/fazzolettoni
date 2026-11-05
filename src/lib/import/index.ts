/**
 * Schede importate dalla raccolta AGESCI Sicilia, pronte per la galleria.
 * Dati per il proof of concept privato: non pubblicare senza permesso (vedi SPEC §8).
 */
import grezzi from '../../../data/sicilia/grezzi.json';
import {
	convertiConRegole,
	unisci,
	type Conversione,
	type GruppoSicilia,
	type RigaGrezza
} from './sicilia';
import { MANUALI } from './sicilia-manuali';

export interface SchedaSicilia {
	gruppo: GruppoSicilia;
	conversione: Conversione;
}

export const FONTE_SICILIA = {
	url: grezzi.url,
	aggiornata_al: grezzi.aggiornata_al,
	curatore: grezzi.curatore
};

export function converti(g: GruppoSicilia): Conversione {
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

export const SCHEDE_SICILIA: SchedaSicilia[] = unisci(grezzi.righe as RigaGrezza[]).map((g) => ({
	gruppo: g,
	conversione: converti(g)
}));
