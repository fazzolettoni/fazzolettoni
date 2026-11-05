/**
 * Descrizione parametrica di un fazzolettone (vedi SPEC.md §4).
 *
 * Convenzione: `null` significa SCONOSCIUTO. Il renderer usa un valore di
 * default e segnala l'immagine come approssimata.
 */

export type Forma = 'triangolo' | 'quadrato';

/** Lati del triangolo: il lato lungo sta in alto, il vertice in basso. */
export type LatoTriangolo = 'corto_sx' | 'corto_dx' | 'lungo';
/** Lati del quadrato, in senso orario dall'alto. */
export type LatoQuadrato = 'alto' | 'destra' | 'basso' | 'sinistra';
export type Lato = LatoTriangolo | LatoQuadrato;

export interface Colore {
	/** Colore esadecimale, es. "#4FA3D9". null = sconosciuto. */
	hex: string | null;
	/** Nome usato dal gruppo, stringa libera. */
	nome: string | null;
	/** true se l'hex è stimato (es. dedotto dal solo nome). */
	approssimato?: boolean;
}

export interface Fondo {
	tipo: 'tinta_unita' | 'diviso' | 'fantasia';
	/** 1 colore per tinta unita, 2 per diviso (sinistra, destra). */
	colori: Colore[];
	/** Rimandato: riferimento a una fantasia (tartan ecc.). */
	fantasia?: { descrizione: string } | null;
}

export interface Fettuccia {
	/** Più colori = strisce longitudinali affiancate (es. tricolore). Il primo è il più esterno. */
	colori: Colore[];
	larghezza_mm: number | null;
	/**
	 * Distanza dal bordo:
	 * - 0 = "bordato" (sul bordo)
	 * - > 0 = "sarchiato" (cucito a una certa distanza)
	 * - 'adiacente' = subito all'interno della fettuccia precedente
	 * - null = sconosciuta (0 per la prima, adiacente per le altre)
	 */
	distanza_bordo_mm: number | 'adiacente' | null;
	/** null = sconosciuti (default: i due lati corti / tutti e 4 i lati). */
	lati: Lato[] | null;
	/**
	 * Comportamento agli angoli tra due lati:
	 * - 'angolo': le fettucce si uniscono con un taglio a 45° (unghiatura)
	 * - 'incrociato': ogni fettuccia prosegue dritta fino al bordo, sovrapponendosi all'altra
	 * Questione aperta in SPEC §11.
	 */
	incrocio: 'angolo' | 'incrociato' | null;
	/** Fettuccia parziale: tratto misurato lungo il lato dal vertice (triangolo) o dall'angolo. */
	tratto?: { da_mm: number; a_mm: number } | null;
}

export interface Elemento {
	tipo: 'logo' | 'toppa' | 'scritta';
	/** Riferimento a un asset caricato: "asset-id@versione". Nel PoC non esiste ancora. */
	asset?: string | null;
	/** Descrizione testuale (usata come segnaposto se l'asset manca). */
	descrizione?: string | null;
	/** Per le scritte. */
	testo?: string | null;
	colore?: Colore | null;
	/** Coordinate normalizzate 0–1 sul riquadro della faccia. */
	posizione: { x: number; y: number };
	/** Dimensione relativa al lato più corto del riquadro (0–1). */
	scala: number;
	rotazione?: number;
}

export interface Faccia {
	fondo: Fondo;
	fettucce: Fettuccia[];
	elementi: Elemento[];
}

export interface Design {
	forma: Forma | null;
	/** triangolo: cateto; quadrato: lato. null = misura standard. */
	dimensioni_cm: { cateto?: number; lato?: number } | null;
	fronte: Faccia;
	/** Solo per il quadrato. Nel triangolo il retro è il solo colore di fondo. null = come il fronte. */
	retro: Faccia | null;
}

/** Valori di default usati quando un campo è sconosciuto. */
export const DEFAULT = {
	forma: 'triangolo' as Forma,
	cateto_cm: 70,
	lato_cm: 70,
	larghezza_mm: 25,
	colore_sconosciuto: '#c8c8c8',
	lati: {
		triangolo: ['corto_sx', 'corto_dx'] as Lato[],
		quadrato: ['alto', 'destra', 'basso', 'sinistra'] as Lato[]
	}
};
