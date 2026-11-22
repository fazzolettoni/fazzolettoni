import { describe, expect, it } from 'vitest';
import { completaMateriali, materialeDa } from './materiali';
import { testoMateriali } from '../design/materiali';
import { avvisiDesign } from '../design/render';
import type { Design } from '../design/schema';

const design = (): Design => ({
	forma: 'triangolo',
	dimensioni_mm: null,
	fronte: {
		fondo: { tipo: 'tinta_unita', colori: [{ hex: '#c00', nome: 'rosso' }] },
		fettucce: [
			{
				colori: [{ hex: '#fff', nome: 'bianco' }],
				larghezza_mm: 10,
				distanza_bordo_mm: 0,
				lati: ['corto_sx', 'corto_dx'],
				incrocio: 'angolo'
			}
		],
		elementi: []
	},
	retro: null
});

describe('materiali della raccolta siciliana', () => {
	it('riconosce i valori chiari e lascia gli altri sconosciuti', () => {
		expect(materialeDa('Cotone')).toBe('cotone');
		expect(materialeDa('COTONE')).toBe('cotone');
		expect(materialeDa('Cotonr')).toBe('cotone');
		expect(materialeDa('Tipo Raso')).toBe('raso');
		expect(materialeDa('Raso ambedue')).toBe('raso');
		expect(materialeDa('Cotone misto sintetico')).toBe('misto_sintetico');
		expect(materialeDa('Cordino di Nylon Bianco di diametro 0,3/0,5 cm')).toBe('nylon');
		for (const t of ['Cotone e raso', 'Sconosciuto', '?', '', undefined])
			expect(materialeDa(t)).toBeNull();
	});

	it('aggiunge solo i materiali mancanti', () => {
		const d = design();
		d.fronte.fondo.materiale = 'lana'; // scelto da un utente: resta
		const r = completaMateriali(d, { stoffa: 'Cotone', tipo_fettuccia: 'Raso' });
		expect(r.cambiato).toBe(true);
		expect(r.design.fronte.fondo.materiale).toBe('lana');
		expect(r.design.fronte.fettucce[0].materiale).toBe('raso');
		expect(d.fronte.fettucce[0].materiale).toBeUndefined(); // l'originale non cambia
		expect(completaMateriali(r.design, { stoffa: 'Cotone', tipo_fettuccia: 'Raso' }).cambiato).toBe(
			false
		);
		expect(testoMateriali(r.design)).toBe('Tessuto: lana · fettucce in raso');
	});
});

describe('avvisi di tutto il fazzolettone', () => {
	it('conta i valori sconosciuti (es. larghezza della fettuccia)', () => {
		const d = design();
		expect(avvisiDesign(d)).toEqual([]);
		d.fronte.fettucce[0].larghezza_mm = null;
		expect(avvisiDesign(d).join()).toContain('larghezza sconosciuta');
	});
});
