import {
	DEFAULT,
	type Colore,
	type Design,
	type Elemento,
	type Faccia,
	type Fettuccia,
	type Forma,
	type Lato
} from './schema';

/** Valori iniziali per l'editor e funzioni di supporto. */

export const ETICHETTE_LATI: Record<Lato, string> = {
	corto_sx: 'corto sinistro',
	corto_dx: 'corto destro',
	lungo: 'lungo',
	alto: 'alto',
	destra: 'destra',
	basso: 'basso',
	sinistra: 'sinistra'
};

export const LATI_PER_FORMA: Record<Forma, Lato[]> = {
	triangolo: ['corto_sx', 'corto_dx', 'lungo'],
	quadrato: ['alto', 'destra', 'basso', 'sinistra']
};

export const nuovoColore = (hex: string | null = null, nome: string | null = null): Colore => ({
	hex,
	nome
});

export function nuovaFettuccia(forma: Forma): Fettuccia {
	return {
		colori: [nuovoColore('#ffffff', 'bianco')],
		larghezza_mm: 25,
		distanza_bordo_mm: 0,
		lati: [...DEFAULT.lati[forma]],
		incrocio: 'angolo',
		tratto: null
	};
}

export function nuovoElemento(tipo: Elemento['tipo']): Elemento {
	if (tipo === 'scritta')
		return {
			tipo,
			testo: 'Testo',
			colore: nuovoColore('#ffffff', 'bianco'),
			posizione: { x: 0.5, y: 0.35 },
			scala: 0.12,
			rotazione: 0
		};
	return {
		tipo,
		asset: null,
		descrizione: '',
		posizione: { x: 0.5, y: 0.7 },
		scala: 0.25,
		rotazione: 0
	};
}

export function nuovaFaccia(): Faccia {
	return {
		fondo: { tipo: 'tinta_unita', colori: [nuovoColore('#3d8fd1', 'azzurro')] },
		fettucce: [],
		elementi: []
	};
}

export function nuovoDesign(): Design {
	const fronte = nuovaFaccia();
	fronte.fettucce.push(nuovaFettuccia('triangolo'));
	return { forma: 'triangolo', dimensioni_mm: null, fronte, retro: null };
}

/**
 * Cambia forma mantenendo il più possibile: i lati delle fettucce vengono riportati a quelli
 * standard della nuova forma, il retro esiste solo per il quadrato.
 */
export function cambiaForma(d: Design, forma: Forma) {
	if (d.forma === forma) return;
	d.forma = forma;
	d.dimensioni_mm = null;
	const facce = [d.fronte, d.retro].filter((f): f is Faccia => !!f);
	for (const f of facce)
		for (const fet of f.fettucce) if (fet.lati) fet.lati = [...DEFAULT.lati[forma]];
	if (forma === 'triangolo') d.retro = null;
}
