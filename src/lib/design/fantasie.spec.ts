import { describe, expect, it } from 'vitest';
import { renderDesign, type TileCaricata } from './render';
import type { Design } from './schema';

const ASSET = 'a'.repeat(64) + '.svg';
const TILE: Record<string, TileCaricata> = {
	[ASSET]: { href: 'data:image/svg+xml;base64,PHN2Zy8+', larghezza: 220, altezza: 110 }
};
const fettucciaConFantasia = (incrocio: 'angolo' | 'incrociato'): Design => ({
	forma: 'triangolo',
	dimensioni_mm: null,
	fronte: {
		fondo: { tipo: 'tinta_unita', colori: [{ hex: '#ffffff', nome: 'bianco' }] },
		fettucce: [
			{
				colori: [{ hex: '#791f23', nome: 'rosso' }],
				larghezza_mm: 20,
				distanza_bordo_mm: 0,
				lati: ['corto_sx', 'corto_dx'],
				incrocio,
				fantasia: { asset: ASSET, larghezza_mm: 50 }
			}
		],
		elementi: []
	},
	retro: null
});

describe('fantasie', () => {
	it('sulla fettuccia: un motivo per lato, orientato lungo il lato, con le proporzioni della tile', () => {
		for (const incrocio of ['angolo', 'incrociato'] as const) {
			const { svg, avvisi } = renderDesign(fettucciaConFantasia(incrocio), { tile: TILE });
			expect(svg.match(/<pattern /g)).toHaveLength(2);
			expect(svg).toContain('width="50" height="25"');
			expect(svg).toContain('patternTransform="matrix(');
			expect(avvisi).toEqual([]);
		}
	});

	it('ruota il motivo: sul fondo da solo, sulle fettucce dopo l’allineamento al lato', () => {
		const d = fettucciaConFantasia('angolo');
		d.fronte.fettucce[0].fantasia!.rotazione = 45;
		expect(renderDesign(d, { tile: TILE }).svg).toMatch(
			/patternTransform="matrix\([^)]*\) rotate\(45\)"/
		);
		d.fronte.fettucce = [];
		d.fronte.fondo = {
			tipo: 'fantasia',
			colori: [],
			fantasia: { asset: ASSET, larghezza_mm: 50, rotazione: 30 }
		};
		expect(renderDesign(d, { tile: TILE }).svg).toContain('patternTransform="rotate(30)"');
	});

	it("senza l'immagine caricata usa i colori e lo segnala", () => {
		const { svg, avvisi } = renderDesign(fettucciaConFantasia('angolo'));
		expect(svg).not.toContain('<pattern id="fz-fm');
		expect(svg).toContain('#791f23');
		expect(avvisi.join()).toContain('non ancora caricata');
	});

	it('sul fondo, e senza misura usa quella predefinita', () => {
		const d = fettucciaConFantasia('angolo');
		d.fronte.fettucce = [];
		d.fronte.fondo = { tipo: 'fantasia', colori: [], fantasia: { asset: ASSET } };
		const { svg, avvisi } = renderDesign(d, { tile: TILE });
		expect(svg).toContain('<pattern id="fz-fant"');
		expect(avvisi.join()).toContain('ripetizione della fantasia sconosciuta');
	});

	it('rifiuta nomi di file e immagini non validi', () => {
		const d = fettucciaConFantasia('angolo');
		d.fronte.fettucce[0].fantasia = { asset: '../x"/><script>', larghezza_mm: 50 };
		const male = { '../x"/><script>': { href: 'javascript:alert(1)', larghezza: 1, altezza: 1 } };
		const { svg } = renderDesign(d, { tile: male });
		expect(svg).not.toContain('script');
		expect(svg).not.toContain('<pattern id="fz-fm');
	});
});
