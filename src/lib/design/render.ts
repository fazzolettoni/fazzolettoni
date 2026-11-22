import {
	assi,
	bandaDritta,
	percorso,
	rettangoloTratto,
	rientra,
	sagoma,
	type P,
	type Sagoma
} from './geometria';
import {
	DEFAULT,
	normalizzaLati,
	type Colore,
	type Design,
	type Faccia,
	type Fantasia,
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
	/** Per le texture 3D: niente margine né contorno, la sagoma riempie l'immagine. */
	texture?: boolean;
	/** Immagini delle fantasie già caricate, per nome del file (vedi design/tile.svelte.ts). */
	tile?: Record<string, TileCaricata>;
}

/** Una tile pronta da inserire nell'SVG: data URI e proporzioni. */
export interface TileCaricata {
	href: string;
	larghezza: number;
	altezza: number;
}

/** Nomi dei file delle tile: impronta SHA-256 più estensione. */
export const ASSET_TILE = /^[0-9a-f]{64}\.(png|jpg|webp|svg)$/;
const DATA_URI = /^data:image\/(png|jpeg|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/;

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

/**
 * Gli avvisi di tutto il fazzolettone: fronte e, se descritto, retro del quadrato.
 * Senza `tile` (sul server) non si contano le immagini non ancora scaricate: lì nessuna lo è.
 */
export function avvisiDesign(design: Design, tile?: Record<string, TileCaricata>): string[] {
	const tutti = renderDesign(design, { tile }).avvisi;
	if (design.forma === 'quadrato' && design.retro)
		tutti.push(...renderDesign(design, { faccia: 'retro', tile }).avvisi);
	const unici = [...new Set(tutti)];
	return tile ? unici : unici.filter((a) => !a.includes('non ancora caricata'));
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

	/**
	 * Motivo ripetuto di una fantasia, come riempimento SVG. `trasforma` orienta la griglia
	 * (per le fettucce: lungo il lato). null se l'immagine non c'è: si usa la resa di riserva.
	 */
	const motivo = (
		fant: Fantasia | null | undefined,
		dove: string,
		idMotivo: string,
		trasforma = ''
	): string | null => {
		if (!fant?.asset) return null;
		const t = ASSET_TILE.test(fant.asset) ? opzioni.tile?.[fant.asset] : undefined;
		if (!t || !DATA_URI.test(t.href)) {
			avvisi.push(`${dove}: immagine della fantasia non ancora caricata`);
			return null;
		}
		let l = num(fant.larghezza_mm, 0);
		if (l <= 0) {
			avvisi.push(`${dove}: ripetizione della fantasia sconosciuta, uso ${DEFAULT.fantasia_mm} mm`);
			l = DEFAULT.fantasia_mm;
		}
		const rapporto = num(t.altezza, 1) / num(t.larghezza, 1);
		const h = l * (Number.isFinite(rapporto) && rapporto > 0 ? rapporto : 1);
		const gradi = num(fant.rotazione, 0) % 360;
		const tutto = [trasforma, gradi ? `rotate(${gradi})` : ''].filter(Boolean).join(' ');
		const tr = tutto ? ` patternTransform="${tutto}"` : '';
		defs.push(
			`<pattern id="${idMotivo}" patternUnits="userSpaceOnUse" width="${l}" height="${h}"${tr}>` +
				`<image href="${t.href}" width="${l}" height="${h}" preserveAspectRatio="none"/></pattern>`
		);
		return `url(#${idMotivo})`;
	};
	/** Griglia allineata a un bordo: asse x lungo il lato, asse y verso l'interno. */
	const lungoIlBordo = (u: P, n: P, o: P) =>
		`matrix(${[u.x, u.y, n.x, n.y, o.x, o.y].map((v) => v.toFixed(4)).join(' ')})`;

	// --- forma e misure
	let forma = design.forma;
	if (forma !== 'triangolo' && forma !== 'quadrato') {
		avvisi.push(`Forma sconosciuta: disegnato come ${DEFAULT.forma}`);
		forma = DEFAULT.forma;
	}
	const misura =
		forma === 'triangolo'
			? num(design.dimensioni_mm?.cateto, DEFAULT.cateto_mm)
			: num(design.dimensioni_mm?.lato, DEFAULT.lato_mm);
	const sag = sagoma(forma, misura);

	// --- quale faccia disegnare
	let f: Faccia = design.fronte;
	let specchia = false;
	if (faccia === 'retro') {
		if (forma === 'triangolo') {
			// Visto da dietro: stesso fondo, con sinistra e destra invertite. Nelle texture no:
			// lì le coordinate sono quelle del tessuto, uguali sulle due facce.
			specchia = !opzioni.texture;
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
	} else if (fondo.tipo === 'fantasia' && fondo.fantasia?.asset) {
		const riempi = motivo(fondo.fantasia, 'Fondo', `${id}-fant`);
		const base = fondo.colori[0]?.hex && HEX.test(fondo.colori[0].hex) ? fondo.colori[0].hex : null;
		if (base || !riempi) corpo.push(`<path d="${pSag}" fill="${base ?? ignoto()}"/>`);
		if (riempi) corpo.push(`<path d="${pSag}" fill="${riempi}"/>`);
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
		// fantasia: un motivo per lato, orientato lungo il lato
		const conFantasia = fet.fantasia?.asset
			? sag.bordi.flatMap((b, j) => {
					if (!lati.includes(b.lato)) return [];
					const { u, n: nb } = assi(b, sag);
					const o = { x: b.a.x + nb.x * d, y: b.a.y + nb.y * d };
					const riempi = motivo(fet.fantasia, nome, `${id}-fm${n}-${j}`, lungoIlBordo(u, nb, o));
					return riempi ? [{ b, j, riempi }] : [];
				})
			: [];
		if (conFantasia.length) {
			const base = colori[0]?.hex && HEX.test(colori[0].hex) ? colori[0].hex : null;
			const fuori = rientra(
				sag,
				sag.bordi.map((b) => (lati.includes(b.lato) ? d : 0))
			);
			const dentro = rientra(
				sag,
				sag.bordi.map((b) => (lati.includes(b.lato) ? d + w : 0))
			);
			const k = sag.bordi.length;
			for (const { b, j, riempi } of conFantasia) {
				// "incrociato": banda dritta; "angolo": il pezzo di cornice di questo lato
				const pezzo =
					incrocio === 'incrociato'
						? bandaDritta(b, sag, d, d + w)
						: [fuori[j], fuori[(j + 1) % k], dentro[(j + 1) % k], dentro[j]];
				if (base) parti.push(`<path d="${percorso(pezzo)}" fill="${base}"/>`);
				parti.push(`<path d="${percorso(pezzo)}" fill="${riempi}"/>`);
			}
		} else
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
			const nome = `${el.tipo === 'logo' ? 'Logo' : 'Toppa'}${el.descrizione ? ` "${el.descrizione}"` : ''}`;
			// misura reale se c'è, altrimenti quella relativa dei dati vecchi
			const w = num(el.larghezza_mm, 0) > 0 ? num(el.larghezza_mm, 0) : 2 * r;
			const t = el.asset && ASSET_TILE.test(el.asset) ? opzioni.tile?.[el.asset] : undefined;
			if (t && DATA_URI.test(t.href)) {
				const rapporto = num(t.altezza, 1) / num(t.larghezza, 1);
				const h = w * (Number.isFinite(rapporto) && rapporto > 0 ? rapporto : 1);
				corpo.push(
					`<image href="${t.href}" x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"${rot}/>`
				);
			} else {
				avvisi.push(`${nome}: ${el.asset ? 'immagine non ancora caricata' : 'manca l’immagine'}`);
				const rr = w / 2;
				corpo.push(
					`<g${rot}><circle cx="${cx}" cy="${cy}" r="${rr}" fill="#ffffff" fill-opacity="0.75" stroke="#555" stroke-width="2" stroke-dasharray="8 6"/>` +
						`<text x="${cx}" y="${cy}" font-size="${rr / 3}" font-family="sans-serif" text-anchor="middle" dominant-baseline="middle" fill="#333">${esc(String(el.tipo))}</text></g>`
				);
			}
		}
	});

	// --- montaggio
	const m = opzioni.texture ? 0 : 4;
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
		(opzioni.texture
			? ''
			: `<path d="${pSag}" fill="none" stroke="#333" stroke-width="2" stroke-linejoin="round"/>`) +
		`</g>` +
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
	const ok = normalizzaLati(fet.lati, sag.forma).filter((l) => possibili.includes(l));
	if (ok.length < fet.lati.length)
		avvisi.push(`${nome}: alcuni lati non esistono per questa forma`);
	return ok;
}
