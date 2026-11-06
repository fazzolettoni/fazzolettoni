import { describe, expect, it } from 'vitest';
import { rientra, sagoma } from './geometria';
import { renderDesign } from './render';
import { ESEMPI } from './esempi';
import type { Design } from './schema';

describe('geometria', () => {
	it('il quadrato è a rombo e rientra di 10 mm su tutti i lati', () => {
		const s = sagoma('quadrato', 100); // diagonale ≈ 141 mm
		expect(s.punti.map((q) => [Math.round(q.x), Math.round(q.y)])).toEqual([
			[0, 71],
			[71, 0],
			[141, 71],
			[71, 141]
		]);
		const p = rientra(s, [10, 10, 10, 10]);
		expect(p.map((q) => [Math.round(q.x), Math.round(q.y)])).toEqual([
			[14, 71],
			[71, 14],
			[127, 71],
			[71, 127]
		]);
	});

	it('il quadrato diviso separa il triangolo sinistro da quello destro', () => {
		const [sx, dx] = sagoma('quadrato', 100).meta;
		expect(Math.max(...sx.map((p) => p.x))).toBeCloseTo(70.71, 1);
		expect(Math.min(...dx.map((p) => p.x))).toBeCloseTo(70.71, 1);
	});

	it('il triangolo ha il lato lungo in alto e il vertice in basso', () => {
		const s = sagoma('triangolo', 700);
		expect(s.larghezza).toBeCloseTo(700 * Math.SQRT2);
		expect(s.altezza).toBeCloseTo((700 * Math.SQRT2) / 2);
		expect(s.punti[2].y).toBeCloseTo(s.altezza);
	});
});

describe('renderDesign', () => {
	it('i nomi vecchi dei lati del quadrato danno lo stesso disegno', () => {
		const design = (lati: string[]) =>
			({
				forma: 'quadrato',
				dimensioni_mm: null,
				fronte: {
					fondo: { tipo: 'tinta_unita', colori: [{ hex: '#123456', nome: 'blu' }] },
					fettucce: [
						{
							colori: [{ hex: '#ffffff', nome: 'bianco' }],
							larghezza_mm: 20,
							distanza_bordo_mm: 0,
							lati,
							incrocio: 'angolo'
						}
					],
					elementi: []
				},
				retro: null
			}) as unknown as Design;
		expect(renderDesign(design(['alto', 'destra', 'basso', 'sinistra'])).svg).toBe(
			renderDesign(design(['alto_sx', 'alto_dx', 'basso_dx', 'basso_sx'])).svg
		);
	});

	it('disegna tutti gli esempi, fronte e retro, senza errori', () => {
		for (const e of ESEMPI) {
			for (const faccia of ['fronte', 'retro'] as const) {
				const r = renderDesign(e.design, { faccia, id: e.id });
				expect(r.svg.startsWith('<svg')).toBe(true);
				expect(r.svg).not.toContain('NaN');
			}
		}
	});

	it('un design completo non produce avvisi', () => {
		const d: Design = {
			forma: 'triangolo',
			dimensioni_mm: null,
			fronte: {
				fondo: { tipo: 'tinta_unita', colori: [{ hex: '#123456', nome: 'blu' }] },
				fettucce: [
					{
						colori: [{ hex: '#ffffff', nome: 'bianco' }],
						larghezza_mm: 20,
						distanza_bordo_mm: 0,
						lati: ['corto_sx', 'corto_dx'],
						incrocio: 'angolo'
					}
				],
				elementi: []
			},
			retro: null
		};
		expect(renderDesign(d).avvisi).toEqual([]);
	});

	it('neutralizza input malevoli', () => {
		const d = {
			forma: 'triangolo',
			dimensioni_mm: { cateto: '1"/><script>' },
			fronte: {
				fondo: {
					tipo: 'tinta_unita',
					colori: [{ hex: 'red"/><script>alert(1)</script>', nome: 'x' }]
				},
				fettucce: [],
				elementi: [
					{
						tipo: 'scritta',
						testo: '<script>alert(1)</script>',
						posizione: { x: 0.5, y: 0.5 },
						scala: 0.1,
						rotazione: '0)"/><script>'
					}
				]
			},
			retro: null
		} as unknown as Design;
		const { svg } = renderDesign(d);
		expect(svg).not.toContain('<script');
	});
});
