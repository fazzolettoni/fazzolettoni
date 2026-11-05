import { describe, expect, it } from 'vitest';
import { rientra, sagoma } from './geometria';
import { renderDesign } from './render';
import { ESEMPI } from './esempi';
import type { Design } from './schema';

describe('geometria', () => {
	it('il quadrato rientrato di 10 mm su tutti i lati è un quadrato più piccolo', () => {
		const s = sagoma('quadrato', 100);
		const p = rientra(s, [10, 10, 10, 10]);
		expect(p.map((q) => [Math.round(q.x), Math.round(q.y)])).toEqual([
			[10, 10],
			[90, 10],
			[90, 90],
			[10, 90]
		]);
	});

	it('il triangolo ha il lato lungo in alto e il vertice in basso', () => {
		const s = sagoma('triangolo', 700);
		expect(s.larghezza).toBeCloseTo(700 * Math.SQRT2);
		expect(s.altezza).toBeCloseTo((700 * Math.SQRT2) / 2);
		expect(s.punti[2].y).toBeCloseTo(s.altezza);
	});
});

describe('renderDesign', () => {
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
