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

/**
 * Fantasia (tartan, quadretti…): un'immagine che si ripete su una griglia rettangolare.
 * Il file sta nello storage "tile" e si chiama con l'impronta del contenuto (vedi SPEC §4).
 */
export interface Fantasia {
	/** Nome del file, es. "3f9a….svg". null = fantasia descritta ma senza immagine. */
	asset?: string | null;
	/** Ogni quanti mm si ripete in larghezza (l'altezza segue le proporzioni dell'immagine). */
	larghezza_mm?: number | null;
	/** Rotazione del motivo in gradi (es. 45 per un tartan in diagonale). Sulle fettucce è relativa al lato. */
	rotazione?: number | null;
	descrizione?: string | null;
}

/**
 * Tessuto del fondo o della fettuccia. Per ora è solo un dato; più avanti potrà dare al 3D
 * lucentezza e trama (bump e reflection map).
 */
export type Materiale =
	'cotone' | 'raso' | 'gabardine' | 'lana' | 'seta' | 'nylon' | 'poliestere' | 'misto_sintetico';

export const MATERIALI: Record<Materiale, string> = {
	cotone: 'Cotone',
	raso: 'Raso',
	gabardine: 'Gabardine',
	lana: 'Lana',
	seta: 'Seta',
	nylon: 'Nylon',
	poliestere: 'Poliestere',
	misto_sintetico: 'Cotone misto sintetico'
};

export interface Fondo {
	tipo: 'tinta_unita' | 'diviso' | 'fantasia';
	/** 1 colore per tinta unita, 2 per diviso (sinistra, destra). Con la fantasia: colore di base. */
	colori: Colore[];
	fantasia?: Fantasia | null;
	/** null o assente = sconosciuto. */
	materiale?: Materiale | null;
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
	/** Fettuccia con una fantasia: il motivo segue la direzione di ogni lato; i colori fanno da riserva. */
	fantasia?: Fantasia | null;
	/** null o assente = sconosciuto. */
	materiale?: Materiale | null;
}

export interface Elemento {
	tipo: 'logo' | 'toppa' | 'scritta';
	/** Immagine di logo o toppa: file nello storage (impronta del contenuto + estensione, come le tile). */
	asset?: string | null;
	/** Larghezza reale in mm (l'altezza segue le proporzioni dell'immagine). Se manca si usa `scala`. */
	larghezza_mm?: number | null;
	/** Descrizione testuale (usata come segnaposto se l'asset manca). */
	descrizione?: string | null;
	/** Per le scritte. */
	testo?: string | null;
	colore?: Colore | null;
	/** Coordinate normalizzate 0–1 sul riquadro della faccia. */
	posizione: { x: number; y: number };
	/** Dimensione relativa al lato più corto del riquadro (0–1): per le scritte, e per i dati vecchi. */
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
	/** Ripetizione di una fantasia quando la misura manca. */
	fantasia_mm: 50,
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
