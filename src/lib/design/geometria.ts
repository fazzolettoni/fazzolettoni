import type { Forma, Lato } from './schema';

export interface P {
	x: number;
	y: number;
}

export interface Bordo {
	lato: Lato;
	a: P;
	b: P;
	/** Estremo da cui si misurano i tratti parziali. */
	origine: 'a' | 'b';
}

export interface Sagoma {
	forma: Forma;
	/** Vertici del poligono, nello stesso ordine dei bordi (bordo i va da punti[i] a punti[i+1]). */
	punti: P[];
	bordi: Bordo[];
	larghezza: number;
	altezza: number;
	/** Le due metà per il fondo "diviso" (sinistra, destra). */
	meta: [P[], P[]];
}

/** Costruisce la sagoma in millimetri. Triangolo: lato lungo in alto, vertice in basso. */
export function sagoma(forma: Forma, misura_mm: number): Sagoma {
	if (forma === 'triangolo') {
		const c = misura_mm;
		const h = c * Math.SQRT2; // ipotenusa
		const A = { x: 0, y: 0 };
		const B = { x: h, y: 0 };
		const V = { x: h / 2, y: h / 2 };
		const M = { x: h / 2, y: 0 };
		return {
			forma,
			punti: [A, B, V],
			bordi: [
				{ lato: 'lungo', a: A, b: B, origine: 'a' },
				{ lato: 'corto_dx', a: B, b: V, origine: 'b' },
				{ lato: 'corto_sx', a: V, b: A, origine: 'a' }
			],
			larghezza: h,
			altezza: h / 2,
			meta: [
				[A, M, V],
				[M, B, V]
			]
		};
	}
	const l = misura_mm;
	const p = [
		{ x: 0, y: 0 },
		{ x: l, y: 0 },
		{ x: l, y: l },
		{ x: 0, y: l }
	];
	return {
		forma,
		punti: p,
		bordi: [
			{ lato: 'alto', a: p[0], b: p[1], origine: 'a' },
			{ lato: 'destra', a: p[1], b: p[2], origine: 'a' },
			{ lato: 'basso', a: p[2], b: p[3], origine: 'a' },
			{ lato: 'sinistra', a: p[3], b: p[0], origine: 'a' }
		],
		larghezza: l,
		altezza: l,
		meta: [
			[p[0], { x: l / 2, y: 0 }, { x: l / 2, y: l }, p[3]],
			[{ x: l / 2, y: 0 }, p[1], p[2], { x: l / 2, y: l }]
		]
	};
}

const sub = (p: P, q: P): P => ({ x: p.x - q.x, y: p.y - q.y });
const add = (p: P, q: P): P => ({ x: p.x + q.x, y: p.y + q.y });
const mul = (p: P, k: number): P => ({ x: p.x * k, y: p.y * k });
const cross = (p: P, q: P) => p.x * q.y - p.y * q.x;
const len = (p: P) => Math.hypot(p.x, p.y);
const unit = (p: P) => mul(p, 1 / len(p));

function centroide(punti: P[]): P {
	const s = punti.reduce((acc, p) => add(acc, p), { x: 0, y: 0 });
	return mul(s, 1 / punti.length);
}

/** Direzione e normale verso l'interno di un bordo. */
export function assi(bordo: Bordo, sag: Sagoma): { u: P; n: P } {
	const u = unit(sub(bordo.b, bordo.a));
	let n = { x: -u.y, y: u.x };
	const c = centroide(sag.punti);
	if ((c.x - bordo.a.x) * n.x + (c.y - bordo.a.y) * n.y < 0) n = mul(n, -1);
	return { u, n };
}

function intersezione(p1: P, u1: P, p2: P, u2: P): P {
	const d = cross(u1, u2);
	if (Math.abs(d) < 1e-9) return p2; // linee parallele: non dovrebbe succedere su forme convesse
	const t = cross(sub(p2, p1), u2) / d;
	return add(p1, mul(u1, t));
}

/**
 * Sposta ogni bordo verso l'interno della sua distanza e ricalcola i vertici.
 * Valido per poligoni convessi con spostamenti contenuti.
 */
export function rientra(sag: Sagoma, distanze: number[]): P[] {
	const linee = sag.bordi.map((b, i) => {
		const { u, n } = assi(b, sag);
		return { p: add(b.a, mul(n, distanze[i])), u };
	});
	const k = linee.length;
	return linee.map((l, i) => {
		const prec = linee[(i - 1 + k) % k];
		return intersezione(prec.p, prec.u, l.p, l.u);
	});
}

/**
 * Banda dritta parallela a un bordo, tra le distanze d0 e d1, prolungata oltre i vertici
 * (va poi ritagliata con la sagoma).
 */
export function bandaDritta(bordo: Bordo, sag: Sagoma, d0: number, d1: number): P[] {
	const { u, n } = assi(bordo, sag);
	const extra = sag.larghezza + sag.altezza;
	const a = add(bordo.a, mul(u, -extra));
	const b = add(bordo.b, mul(u, extra));
	return [add(a, mul(n, d0)), add(b, mul(n, d0)), add(b, mul(n, d1)), add(a, mul(n, d1))];
}

/**
 * Rettangolo che delimita un tratto parziale lungo un bordo, misurato dall'origine.
 * `prof` = profondità verso l'interno: va limitata allo spessore della fettuccia, altrimenti
 * il rettangolo di un lato copre anche i lati adiacenti.
 */
export function rettangoloTratto(
	bordo: Bordo,
	sag: Sagoma,
	da: number,
	a: number,
	prof: number
): P[] {
	const { u, n } = assi(bordo, sag);
	const o = bordo.origine === 'a' ? bordo.a : bordo.b;
	const dir = bordo.origine === 'a' ? u : mul(u, -1);
	const p0 = add(o, mul(dir, da));
	const p1 = add(o, mul(dir, a));
	return [add(p0, mul(n, -10)), add(p1, mul(n, -10)), add(p1, mul(n, prof)), add(p0, mul(n, prof))];
}

export function percorso(punti: P[]): string {
	return (
		punti.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ') +
		' Z'
	);
}
