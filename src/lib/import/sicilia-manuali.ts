/**
 * Interpretazioni manuali delle schede siciliane descritte a parole.
 *
 * Ognuna parte dal risultato delle regole (forma, misura, fondo, logo restano quelli) e
 * sostituisce le fettucce con una lettura umana del testo. La `nota` spiega cosa è stato
 * dedotto: resta visibile nella scheda, così chi conosce il fazzolettone può correggere.
 *
 * Convenzioni: misure in mm; nell'array l'ultima fettuccia è disegnata sopra;
 * "destra/sinistra" = come si guarda il fazzolettone steso, vertice in basso.
 */
import { colore } from './sicilia';
import type { Design, Elemento, Fettuccia, Lato } from '../design/schema';

const CORTI: Lato[] = ['corto_sx', 'corto_dx'];
const QUATTRO: Lato[] = ['alto', 'destra', 'basso', 'sinistra'];

function f(
	colori: string | string[],
	larghezza_mm: number | null,
	distanza_bordo_mm: Fettuccia['distanza_bordo_mm'],
	opz: Partial<Pick<Fettuccia, 'lati' | 'incrocio' | 'tratto'>> = {}
): Fettuccia {
	return {
		colori: (Array.isArray(colori) ? colori : [colori]).map(colore),
		larghezza_mm,
		distanza_bordo_mm,
		lati: opz.lati ?? CORTI,
		incrocio: opz.incrocio ?? 'angolo',
		tratto: opz.tratto ?? null
	};
}
const X = { incrocio: 'incrociato' as const };

export interface Manuale {
	nota: string;
	fettucce: Fettuccia[];
	/** Se presente, sostituisce gli elementi dedotti dalle regole. */
	elementi?: Elemento[];
	/** Correzioni alla forma/fondo dedotti dalle regole. */
	design?: Partial<Pick<Design, 'forma'>>;
	/** Motivi per cui, anche dopo l'interpretazione, serve un controllo. */
	daRivedere?: string[];
	/** Colore base atteso: protegge dai gruppi con più righe (es. Palermo 6). */
	coloreBase?: string;
}

export const MANUALI: Record<string, Manuale> = {
	'acireale-2': {
		nota: "Due fettucce bianche da 0,2 cm: la prima a 0,7 cm dal bordo, la seconda 0,7 cm più all'interno. Entrambe incrociate.",
		fettucce: [f('bianco', 2, 7, X), f('bianco', 2, 16, X)]
	},
	'adrano-1': {
		nota: "Una bianca sul bordo, la seconda 2 cm più all'interno; incrociata solo quella interna.",
		fettucce: [f('bianco', 10, 0), f('bianco', 10, 30, X)]
	},
	'augusta-4': {
		nota: 'Blu da 1,5 cm sul bordo per tutta la lunghezza; verde da 0,8 cm a 2 cm dal bordo, solo per 8 cm a partire da 2 cm dal vertice.',
		fettucce: [f('blu', 15, 0), f('verde', 8, 20, { tratto: { da_mm: 20, a_mm: 100 } })]
	},
	'belpasso-2': {
		nota: 'Confermato a voce: bianca da 0,5 cm a 1 cm dal bordo, incrociata, coperta dalla rossa da 0,5 cm sul bordo. La tabella indica "a 1 mm".',
		fettucce: [f('bianco', 5, 10, { lati: QUATTRO, ...X }), f('rosso', 5, 0, { lati: QUATTRO })],
		design: { forma: 'quadrato' }
	},
	'caltanissetta-1': {
		nota: '"Una su entrambi i lati corti, adiacenti": una fettuccia lilla sui due lati corti; posizione non indicata.',
		fettucce: [f('lilla', 24, null)]
	},
	'caltanissetta-9': {
		nota: "Gialla a 0,5 cm dal bordo, azzurra più all'interno: la distanza tra le due non è indicata (ipotizzato 1 cm).",
		fettucce: [f('giallo', 15, 5), f('azzurro', 15, 30)],
		daRivedere: ['Distanza tra le due fettucce ipotizzata']
	},
	'carini-2': {
		nota: 'Rossa esterna da 1 cm sul bordo, gialla interna da 1,5 cm adiacente.',
		fettucce: [f('rosso', 10, 0), f('giallo', 15, 'adiacente')]
	},
	'catania-5': {
		nota: "Due bianche da 1,5 cm: la prima a 1 cm dal bordo, la seconda 2 cm più all'interno.",
		fettucce: [f('bianco', 15, 10), f('bianco', 15, 45)],
		daRivedere: ['Lati corti: "No" (significato non chiaro): disegnate sui lati corti']
	},
	'catania-13': {
		nota: "Fettuccia tricolore da 1 cm a 1 cm dal bordo, rosso all'esterno.",
		fettucce: [f(['rosso', 'bianco', 'verde'], 10, 10)]
	},
	'catania-19': {
		nota: 'Amaranto da 1 cm sul bordo, sopra una bianca da 2 cm che parte a 0,5 cm dal bordo (sovrapposizione ipotizzata di 0,5 cm).',
		fettucce: [f('bianco', 20, 5), f('amaranto', 10, 0)]
	},
	'gela-5': {
		nota: 'Rossa esterna da 1 cm sul bordo; verde da 1 cm a 1 cm di distanza dalla rossa, incrociata.',
		fettucce: [f('rosso', 10, 0), f('verde', 10, 20, X)]
	},
	'gibellina-1': {
		nota: "Tre fettucce da 0,5 cm adiacenti, dall'esterno: blu, verde, gialla; incrociata la gialla.",
		fettucce: [f('blu', 5, null), f('verde', 5, 'adiacente'), f('giallo', 5, 'adiacente', X)]
	},
	'mazara-del-vallo-4': {
		nota: 'Blu esterna e verde interna da 0,5 cm; "distanza 0,5 cm" letta come distanza dal bordo della blu. Entrambe incrociate, la verde sopra.',
		fettucce: [f('blu', 5, 5, X), f('verde', 5, 'adiacente', X)],
		daRivedere: ['Non è chiaro se 0,5 cm sia la distanza dal bordo o tra le due fettucce']
	},
	'messina-2-cngei': {
		nota: 'Verde da 2,5 cm sul bordo; rossa da 2,5 cm distanziata. "2,5 cm (rossa)" letto come distanza tra le due.',
		fettucce: [f('verde', 25, 0), f('rosso', 25, 50)],
		daRivedere: ['Non è chiaro se 2,5 cm sia la distanza dal bordo o tra le due fettucce']
	},
	'paceco-1': {
		nota: "Gialla esterna da 0,7 cm a 1 cm dal bordo; argento (grigia) da 1,4 cm, 1 cm più all'interno.",
		fettucce: [f('giallo', 7, 10), f('argento', 14, 27)]
	},
	'pachino-1': {
		nota: 'Una fettuccia per lato: bianca a destra, rossa a sinistra, da 1,5 cm a 1 cm dal bordo, incrociate con la rossa sopra.',
		fettucce: [
			f('bianco', 15, 10, { lati: ['corto_dx'], ...X }),
			f('rosso', 15, 10, { lati: ['corto_sx'], ...X })
		],
		daRivedere: ['Destra/sinistra: da verificare se viste da chi guarda o da chi indossa']
	},
	'palagonia-1': {
		nota: 'Blu da 1 cm sul bordo; gialla da 1 cm adiacente, incrociata.',
		fettucce: [f('blu', 10, 0), f('giallo', 10, 'adiacente', X)]
	},
	'palermo-2': {
		nota: 'Tre fettucce da 1 cm adiacenti a 2,5 cm dal bordo, dall\'esterno: gialla, celeste, rossa; incrociate, con la rossa sopra tutte. Il testo dice "bianco su giallo": letto come celeste.',
		fettucce: [
			f('giallo', 10, 25, X),
			f('celeste', 10, 'adiacente', X),
			f('rosso', 10, 'adiacente', X)
		],
		daRivedere: ['"Bianco su giallo" ma tra i colori non c\'è il bianco']
	},
	'palermo-3': {
		nota: 'Rossa esterna e bianca da 1 cm: 1 cm dal bordo e 1 cm tra le due.',
		fettucce: [f('rosso', 10, 10), f('bianco', 10, 30)]
	},
	'palermo-6': {
		coloreBase: 'blu',
		nota: 'Gialla esterna e rossa da 2 cm, adiacenti, a 1 cm dal bordo; incrociate con la rossa sopra.',
		// La rossa è più interna ma va disegnata sopra: posizioni assolute
		fettucce: [f('giallo', 20, 10, X), f('rosso', 20, 30, X)]
	},
	'palermo-10': {
		nota: "Bianca da 1 cm a 5 cm dal bordo, incrociata; toppa in stoffa con il simbolo del gruppo sull'incrocio.",
		fettucce: [f('bianco', 10, 50, X)],
		elementi: [
			{
				tipo: 'toppa',
				descrizione: 'simbolo del gruppo',
				posizione: { x: 0.5, y: 0.8 },
				scala: 0.16
			}
		]
	},
	'rosolini-1': {
		nota: "Cinque fettucce contigue da 0,4 cm sul bordo, nell'ordine indicato dall'esterno: blu, giallo, verde, rosso, bianco. ScoutWiki indica la prima azzurra.",
		fettucce: ['blu', 'giallo', 'verde', 'rosso', 'bianco'].map((c, i) =>
			f(c, 4, i === 0 ? 0 : 'adiacente')
		),
		daRivedere: ['Conflitto con ScoutWiki: prima fettuccia blu o azzurra?']
	},
	'san-giovanni-la-punta-1': {
		nota: '"Due per lato, parallele": due fettucce viola da 1,5 cm per lato, a 3 cm dal bordo, lette come adiacenti; incrociate.',
		fettucce: [f('viola', 15, 30, X), f('viola', 15, 'adiacente', X)],
		daRivedere: ['Non è chiaro se le due fettucce siano adiacenti o distanziate']
	},
	'santa-maria-di-licodia-1': {
		nota: 'Due fettucce unite da 1 cm a 2 cm dal bordo, giallo oro e blu (ordine come nel testo); incrociate.',
		fettucce: [f('giallo oro', 10, 20, X), f('blu', 10, 'adiacente', X)]
	},
	'siracusa-13': {
		nota: 'Rossa esterna e gialla adiacenti a 1 cm dal bordo; incrociate con la rossa sopra. Larghezze non indicate (2,5 cm).',
		fettucce: [f('giallo', null, 35, X), f('rosso', null, 10, X)]
	},
	'siracusa-15': {
		nota: 'Una fettuccia per lato: gialla a destra, rossa a sinistra.',
		fettucce: [
			f('giallo', 10, null, { lati: ['corto_dx'] }),
			f('rosso', 10, null, { lati: ['corto_sx'] })
		],
		daRivedere: ['Destra/sinistra: da verificare se viste da chi guarda o da chi indossa']
	},
	'solarino-8': {
		nota: "Bianca da 1,5 cm sul bordo; blu da 1,5 cm 0,5 cm più all'interno, incrociata. Toppa stampata della Madonna delle Lacrime sulla punta.",
		fettucce: [f('bianco', 15, 0), f('blu', 15, 20, X)],
		elementi: [
			{
				tipo: 'toppa',
				descrizione: 'Madonna delle Lacrime',
				posizione: { x: 0.5, y: 0.74 },
				scala: 0.24
			}
		]
	},
	'torrenova-1': {
		nota: 'Una fettuccia per lato da 2,5 cm: verde a sinistra, gialla a destra.',
		fettucce: [
			f('verde', 25, null, { lati: ['corto_sx'] }),
			f('giallo', 25, null, { lati: ['corto_dx'] })
		],
		daRivedere: ['Destra/sinistra: da verificare se viste da chi guarda o da chi indossa']
	},
	'trapani-1': {
		nota: 'Rossa da 1,5 cm a 0,5 cm dal bordo; blu da 1,5 cm a 1 cm dalla rossa.',
		fettucce: [f('rosso', 15, 5), f('blu', 15, 30)]
	},
	'zafferana-etnea-1': {
		nota: "Due gialle da 0,5 cm: una sul bordo, la seconda 0,5 cm più all'interno, incrociata.",
		fettucce: [f('giallo', 5, 0), f('giallo', 5, 10, X)]
	}
};
