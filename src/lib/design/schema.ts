/**
 * Descrizione parametrica di un fazzolettone (vedi SPEC.md §4).
 *
 * Convenzione: `null` significa SCONOSCIUTO. Il renderer usa un valore di
 * default e segnala l'immagine come approssimata.
 */

export type Forma = 'triangolo' | 'quadrato';

/** Lati del triangolo: il lato lungo sta in alto, il vertice in basso. */
export type LatoTriangolo = 'corto_sx' | 'corto_dx' | 'lungo';
/** Lati del quadrato, che si disegna a rombo: in senso orario dal vertice sinistro. */
export type LatoQuadrato = 'alto_sx' | 'alto_dx' | 'basso_dx' | 'basso_sx';
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
	/** In mm. triangolo: cateto; quadrato: lato. null = misura standard. */
	dimensioni_mm: { cateto?: number | null; lato?: number | null } | null;
	fronte: Faccia;
	/** Solo per il quadrato. Nel triangolo il retro è il solo colore di fondo. null = come il fronte. */
	retro: Faccia | null;
}

/** Valori di default usati quando un campo è sconosciuto. */
export const DEFAULT = {
	forma: 'triangolo' as Forma,
	/** Provvisori: vedi SPEC §11 "Dimensioni standard". */
	cateto_mm: 700,
	lato_mm: 700,
	larghezza_mm: 25,
	colore_sconosciuto: '#c8c8c8',
	lati: {
		triangolo: ['corto_sx', 'corto_dx'] as Lato[],
		// nel quadrato i lati sono tutti uguali: "i lati corti" sono tutti e quattro
		quadrato: ['alto_sx', 'alto_dx', 'basso_dx', 'basso_sx'] as Lato[]
	}
};

/**
 * Nomi usati prima che il quadrato fosse disegnato a rombo. Le revisioni salvate non si
 * riscrivono (sono immutabili): si traducono quando si leggono.
 */
const LATI_VECCHI: Record<string, Lato> = {
	alto: 'alto_sx',
	destra: 'alto_dx',
	basso: 'basso_dx',
	sinistra: 'basso_sx'
};

/**
 * Nel quadrato i lati sono tutti uguali, quindi "i lati corti" sono tutti e quattro. Il lato
 * corto sinistro diventa la metà sinistra del rombo, il destro la metà destra (per le
 * fettucce "una per lato"). Il "lato lungo" (la piega) sul quadrato non esiste.
 */
const LATI_CORTI_SU_QUADRATO: Record<string, Lato[]> = {
	corto_sx: ['alto_sx', 'basso_sx'],
	corto_dx: ['alto_dx', 'basso_dx'],
	lungo: []
};
const ORDINE_QUADRATO: Lato[] = ['alto_sx', 'alto_dx', 'basso_dx', 'basso_sx'];

/** Traduce i nomi vecchi e quelli del triangolo nei lati della forma indicata. */
export function normalizzaLati(lati: string[], forma: Forma | null): Lato[] {
	const out = lati.map((l) => LATI_VECCHI[l] ?? (l as Lato));
	if (forma !== 'quadrato') return out;
	if (!out.some((l) => l in LATI_CORTI_SU_QUADRATO)) return out;
	const insieme = new Set(out.flatMap((l) => LATI_CORTI_SU_QUADRATO[l] ?? [l]));
	return ORDINE_QUADRATO.filter((l) => insieme.has(l));
}

/** Porta un design salvato con convenzioni vecchie a quelle attuali (copia). */
export function normalizzaDesign(d: Design): Design {
	const c = structuredClone(d);
	for (const f of [c.fronte, c.retro])
		for (const fet of f?.fettucce ?? []) if (fet.lati) fet.lati = normalizzaLati(fet.lati, c.forma);
	return c;
}
