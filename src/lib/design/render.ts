import { bandaDritta, percorso, rettangoloTratto, rientra, sagoma, type Sagoma } from './geometria';
import {
	DEFAULT,
	type Colore,
	type Design,
	type Faccia,
	type Fettuccia,
	type Lato
} from './schema';

export type QualeFaccia = 'fronte' | 'retro';

export interface Risultato {
	svg: string;
	/** Cosa è stato dedotto o approssimato. Vuoto = disegno fedele alla descrizione. */
	avvisi: string[];
}

export interface Opzioni {
	faccia?: QualeFaccia;
	/** Prefisso per gli id interni (clipPath ecc.): deve essere unico nella pagina. */
	id?: string;
}

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

function esc(s: string): string {
	return s.replace(
		/[&<>"']/g,
		(c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!
	);
}

/** Numero finito oppure il default: i dati arrivano dagli utenti e finiscono dentro l'SVG. */
function num(v: unknown, def: number): number {
	return typeof v === 'number' && Number.isFinite(v) ? v : def;
}

function idSicuro(s: string): string {
	return s.replace(/[^a-zA-Z0-9_-]/g, '_');
}

export function renderDesign(design: Design, opzioni: Opzioni = {}): Risultato {
	const faccia = opzioni.faccia ?? 'fronte';
	const id = idSicuro(opzioni.id ?? 'fz');
	const avvisi: string[] = [];
	const stimati = new Set<string>();
	let usaIgnoto = false;
	/** Colore sconosciuto: tratteggio grigio, così si distingue da un grigio vero. */
	const ignoto = () => {
		usaIgnoto = true;
		return `url(#${id}-ignoto)`;
	};

	const colore = (c: Colore | null | undefined, dove: string): string => {
		if (!c || !c.hex) {
			avvisi.push(`${dove}: colore sconosciuto${c?.nome ? ` ("${c.nome}")` : ''}`);
			return ignoto();
		}
		if (!HEX.test(c.hex)) {
			avvisi.push(`${dove}: colore non valido "${c.hex}"`);
			return ignoto();
		}
		if (c.approssimato) stimati.add(c.nome ?? c.hex);
		return c.hex;
	};

	// --- forma e misure
	let forma = design.forma;
	if (forma !== 'triangolo' && forma !== 'quadrato') {
		avvisi.push(`Forma sconosciuta: disegnato come ${DEFAULT.forma}`);
		forma = DEFAULT.forma;
	}
	const misura =
		forma === 'triangolo'
			? num(design.dimensioni_cm?.cateto, DEFAULT.cateto_cm)
			: num(design.dimensioni_cm?.lato, DEFAULT.lato_cm);
	const sag = sagoma(forma, misura);

	// --- quale faccia disegnare
	let f: Faccia = design.fronte;
	let specchia = false;
	if (faccia === 'retro') {
		specchia = true;
		if (forma === 'triangolo') {
			f = { fondo: design.fronte.fondo, fettucce: [], elementi: [] };
		} else if (design.retro) {
			f = design.retro;
		} else {
			avvisi.push('Retro non descritto: mostrato come il fronte');
		}
	}

	const defs: string[] = [];
	const corpo: string[] = [];

	// --- fondo
	const fondo = f.fondo;
	const pSag = percorso(sag.punti);
	if (fondo.tipo === 'diviso') {
		const [sx, dx] = sag.meta;
		corpo.push(`<path d="${percorso(sx)}" fill="${colore(fondo.colori[0], 'Fondo sinistro')}"/>`);
		corpo.push(`<path d="${percorso(dx)}" fill="${colore(fondo.colori[1], 'Fondo destro')}"/>`);
	} else if (fondo.tipo === 'fantasia') {
		avvisi.push(
			`Fantasia${fondo.fantasia?.descrizione ? ` "${fondo.fantasia.descrizione}"` : ''}: resa indicativa`
		);
		const base = colore(fondo.colori[0], 'Fondo');
		const righe = fondo.colori.slice(1).map((c, i) => colore(c, `Fantasia, colore ${i + 2}`));
		const passo = 60;
		const strisce = righe
			.map((c, i) => {
				const o = (i * passo) / Math.max(righe.length, 1);
				return (
					`<rect x="0" y="${o}" width="${passo}" height="${passo / 6}" fill="${c}" opacity="0.6"/>` +
					`<rect x="${o}" y="0" width="${passo / 6}" height="${passo}" fill="${c}" opacity="0.6"/>`
				);
			})
			.join('');
		defs.push(
			`<pattern id="${id}-fant" width="${passo}" height="${passo}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">` +
				`<rect width="${passo}" height="${passo}" fill="${base}"/>${strisce}</pattern>`
		);
		corpo.push(`<path d="${pSag}" fill="url(#${id}-fant)"/>`);
	} else {
		corpo.push(`<path d="${pSag}" fill="${colore(fondo.colori[0], 'Fondo')}"/>`);
	}

	// --- fettucce
	let prossima = 0; // distanza dal bordo subito dopo l'ultima fettuccia
	f.fettucce.forEach((fet, i) => {
		const n = i + 1;
		const nome = `Fettuccia ${n}`;
		let w = fet.larghezza_mm == null ? null : num(fet.larghezza_mm, DEFAULT.larghezza_mm);
		if (w == null) {
			avvisi.push(`${nome}: larghezza sconosciuta, uso ${DEFAULT.larghezza_mm} mm`);
			w = DEFAULT.larghezza_mm;
		}
		let d: number;
		if (fet.distanza_bordo_mm === 'adiacente') d = prossima;
		else if (fet.distanza_bordo_mm == null) {
			d = i === 0 ? 0 : prossima;
			avvisi.push(
				`${nome}: posizione sconosciuta, ${i === 0 ? 'sul bordo' : 'adiacente alla precedente'}`
			);
		} else d = num(fet.distanza_bordo_mm, 0);
		prossima = d + w;

		const lati = latiValidi(fet, sag, nome, avvisi);
		const colori = fet.colori.length ? fet.colori : [null];
		const incrocio = fet.incrocio ?? 'angolo';
		if (fet.incrocio == null && lati.length > 1)
			avvisi.push(`${nome}: incrocio agli angoli sconosciuto, uso "angolo"`);

		let clip = '';
		if (fet.tratto) {
			const da = num(fet.tratto.da_mm, 0);
			const a = num(fet.tratto.a_mm, 0);
			const rett = sag.bordi
				.filter((b) => lati.includes(b.lato))
				.map((b) => `<path d="${percorso(rettangoloTratto(b, sag, da, a, d + w + 1))}"/>`)
				.join('');
			defs.push(`<clipPath id="${id}-tr${n}">${rett}</clipPath>`);
			clip = ` clip-path="url(#${id}-tr${n})"`;
		}

		const parti: string[] = [];
		const ws = w / colori.length;
		colori.forEach((c, k) => {
			const fill = colore(c, colori.length > 1 ? `${nome}, colore ${k + 1}` : nome);
			const d0 = d + k * ws;
			const d1 = d0 + ws;
			if (incrocio === 'incrociato') {
				for (const b of sag.bordi.filter((b) => lati.includes(b.lato))) {
					parti.push(`<path d="${percorso(bandaDritta(b, sag, d0, d1))}" fill="${fill}"/>`);
				}
			} else {
				const fuori = rientra(
					sag,
					sag.bordi.map((b) => (lati.includes(b.lato) ? d0 : 0))
				);
				const dentro = rientra(
					sag,
					sag.bordi.map((b) => (lati.includes(b.lato) ? d1 : 0))
				);
				parti.push(
					`<path d="${percorso(fuori)} ${percorso(dentro.slice().reverse())}" fill="${fill}" fill-rule="evenodd"/>`
				);
			}
		});
		corpo.push(`<g${clip}>${parti.join('')}</g>`);
	});

	// --- elementi
	const lmin = Math.min(sag.larghezza, sag.altezza);
	f.elementi.forEach((el, i) => {
		const cx = num(el.posizione?.x, 0.5) * sag.larghezza;
		const cy = num(el.posizione?.y, 0.5) * sag.altezza;
		const r = (num(el.scala, 0.2) * lmin) / 2;
		const gradi = num(el.rotazione, 0);
		const rot = gradi ? ` transform="rotate(${gradi} ${cx} ${cy})"` : '';
		if (el.tipo === 'scritta') {
			const fill = colore(el.colore, `Scritta ${i + 1}`);
			corpo.push(
				`<text x="${cx}" y="${cy}" font-size="${r}" font-family="sans-serif" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="${fill}"${rot}>${esc(String(el.testo ?? ''))}</text>`
			);
		} else {
			// Nel PoC gli asset non esistono ancora: segnaposto
			avvisi.push(
				`${el.tipo === 'logo' ? 'Logo' : 'Toppa'}${el.descrizione ? ` "${el.descrizione}"` : ''}: immagine non ancora caricata`
			);
			corpo.push(
				`<g${rot}><circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffff" fill-opacity="0.75" stroke="#555" stroke-width="2" stroke-dasharray="8 6"/>` +
					`<text x="${cx}" y="${cy}" font-size="${r / 3}" font-family="sans-serif" text-anchor="middle" dominant-baseline="middle" fill="#333">${esc(String(el.tipo))}</text></g>`
			);
		}
	});

	// --- montaggio
	const m = 4;
	const W = sag.larghezza;
	const H = sag.altezza;
	defs.unshift(`<clipPath id="${id}-sag"><path d="${pSag}"/></clipPath>`);
	if (usaIgnoto)
		defs.push(
			`<pattern id="${id}-ignoto" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">` +
				`<rect width="16" height="16" fill="${DEFAULT.colore_sconosciuto}"/><rect width="5" height="16" fill="#a9a9a9"/></pattern>`
		);
	const trasf = specchia ? ` transform="translate(${W} 0) scale(-1 1)"` : '';
	const svg =
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-m} ${-m} ${W + 2 * m} ${H + 2 * m}" width="${(W + 2 * m).toFixed(0)}" height="${(H + 2 * m).toFixed(0)}">` +
		`<defs>${defs.join('')}</defs>` +
		`<g${trasf}><g clip-path="url(#${id}-sag)">${corpo.join('')}</g>` +
		`<path d="${pSag}" fill="none" stroke="#333" stroke-width="2" stroke-linejoin="round"/></g>` +
		`</svg>`;

	if (stimati.size) avvisi.push(`Colori stimati dal nome: ${[...stimati].join(', ')}`);
	return { svg, avvisi: [...new Set(avvisi)] };
}

function latiValidi(fet: Fettuccia, sag: Sagoma, nome: string, avvisi: string[]): Lato[] {
	const possibili = sag.bordi.map((b) => b.lato);
	if (!fet.lati) {
		avvisi.push(`${nome}: lati sconosciuti, uso quelli standard`);
		return DEFAULT.lati[sag.forma];
	}
	const ok = fet.lati.filter((l) => possibili.includes(l));
	if (ok.length < fet.lati.length)
		avvisi.push(`${nome}: alcuni lati non esistono per questa forma`);
	return ok;
}
