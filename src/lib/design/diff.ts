/** Differenze leggibili tra due revisioni (SPEC §6: "fettuccia 1: colore da blu ad azzurro"). */

export interface Differenza {
	campo: string;
	prima: string | null;
	dopo: string | null;
}

/** Metadati dell'import: non interessano a chi legge lo storico. */
const IGNORA = new Set(['dati_originali', 'conflitti', 'note']);

const NOMI: Record<string, string> = {
	design: '',
	fronte: 'fronte',
	retro: 'retro',
	fondo: 'fondo',
	forma: 'forma',
	dimensioni_mm: 'dimensioni',
	cateto: 'cateto',
	lato: 'lato',
	larghezza_mm: 'larghezza',
	distanza_bordo_mm: 'distanza dal bordo',
	lati: 'lati',
	incrocio: 'agli angoli',
	tratto: 'tratto',
	da_mm: 'da',
	a_mm: 'a',
	hex: 'colore',
	nome: 'nome',
	approssimato: 'stimato',
	tipo: 'tipo',
	descrizione: 'descrizione',
	testo: 'testo',
	posizione: 'posizione',
	scala: 'dimensione',
	rotazione: 'rotazione',
	data_inizio: 'inizio',
	data_fine: 'fine',
	anno: 'anno',
	circa: 'circa',
	significato: 'significato',
	affidabilita: 'affidabilità',
	da_rivedere: 'da rivedere',
	regione: 'regione',
	zona: 'zona',
	attivo: 'attivo',
	link: 'link',
	url: 'link',
	nota: 'descrizione'
};

const ELENCHI: Record<string, string> = {
	fettucce: 'fettuccia',
	colori: 'colore',
	elementi: 'elemento',
	link: 'link',
	fonti: 'fonte'
};

function appiattisci(v: unknown, percorso: string[], out: Map<string, string>) {
	if (v === null || v === undefined) return;
	if (Array.isArray(v)) {
		// Liste di valori semplici (es. lati): un solo campo
		if (v.every((x) => typeof x !== 'object' || x === null)) {
			out.set(percorso.join(' · '), v.join(', '));
			return;
		}
		const k = percorso[percorso.length - 1];
		v.forEach((x, i) =>
			appiattisci(x, [...percorso.slice(0, -1), `${ELENCHI[k] ?? k} ${i + 1}`], out)
		);
		return;
	}
	if (typeof v === 'object') {
		for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
			if (percorso.length === 0 && IGNORA.has(k)) continue;
			const nome = NOMI[k] ?? k;
			appiattisci(x, nome ? [...percorso, nome] : percorso, out);
		}
		return;
	}
	out.set(percorso.join(' · ') || 'valore', String(v));
}

export function differenze(prima: unknown, dopo: unknown): Differenza[] {
	const a = new Map<string, string>();
	const b = new Map<string, string>();
	appiattisci(prima, [], a);
	appiattisci(dopo, [], b);
	const campi = [...new Set([...a.keys(), ...b.keys()])];
	const MISURE = /(larghezza|distanza dal bordo|cateto|lato|tratto · da|tratto · a)$/;
	const leggibile = (c: string, v: string | undefined) => {
		if (v == null) return null;
		const n = Number(v);
		return MISURE.test(c) && Number.isFinite(n) ? `${String(n / 10).replace('.', ',')} cm` : v;
	};
	return (
		campi
			.filter((c) => a.get(c) !== b.get(c))
			// un "no" aggiunto dove prima non c'era nulla non è un cambiamento
			.filter((c) => !(a.get(c) == null && b.get(c) === 'false'))
			.map((c) => ({ campo: c, prima: leggibile(c, a.get(c)), dopo: leggibile(c, b.get(c)) }))
	);
}
