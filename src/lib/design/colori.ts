/**
 * Dizionario minimo nome → hex indicativo. Serve per i dati importati (che hanno solo il nome)
 * e come suggerimento di nomi nell'editor. Non è vincolante: il nome resta libero.
 */
export const STIMA_COLORI: Record<string, string> = {
	azzurro: '#3d8fd1',
	celeste: '#8fcbea',
	blu: '#1d3f8f',
	bianco: '#ffffff',
	giallo: '#f5c400',
	verde: '#1f8a3b',
	'verde bandiera': '#009246',
	rosso: '#d0201a',
	nero: '#1a1a1a',
	grigio: '#8a8d91',
	amaranto: '#9f1d35',
	bordeaux: '#6d1a2c',
	arancione: '#ef7d00',
	marrone: '#6b4226',
	rosa: '#f29bb5',
	viola: '#6a3d8f',
	'blu elettrico': '#1f4fd8',
	'blu notte': '#14213d',
	'verde bottiglia': '#0b4a2e',
	'giallo oro': '#d4a017',
	oro: '#c9a227',
	argento: '#c0c0c0',
	'blu scuro': '#14306b',
	'blu chiaro': '#6fa8dc',
	bluette: '#3a5fcd',
	borgogna: '#800020',
	'rosso bordeaux': '#7b1e2b',
	lilla: '#c8a2c8',
	salmone: '#fa8072'
};

/** Forme alternative dei nomi (femminile, abbreviazioni) → forma del dizionario. */
export const SINONIMI_COLORI: Record<string, string> = {
	rossa: 'rosso',
	gialla: 'giallo',
	bianca: 'bianco',
	nera: 'nero',
	arancio: 'arancione',
	grigia: 'grigio',
	'giallo oro': 'giallo oro'
};

/** Normalizza un nome di colore scritto a mano ("Rossa", "BLU ") → "rosso", "blu". */
export function normalizzaNomeColore(nome: string): string {
	const n = nome.trim().toLowerCase().replace(/\s+/g, ' ');
	return SINONIMI_COLORI[n] ?? n;
}
