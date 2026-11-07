import { describe, expect, it } from 'vitest';
import { misure, unisci, type RigaGrezza } from './sicilia';
import { SCHEDE_SICILIA } from './locale';
import { MANUALI } from './sicilia-manuali';
import { renderDesign } from '../design/render';

describe('import Sicilia', () => {
	it('legge le misure in mm', () => {
		expect(misure('1,5 cm')).toEqual([15]);
		expect(misure('Circa 12 mm')).toEqual([12]);
		expect(misure('0,4 cm per un totale di 2 cm')).toEqual([4, 20]);
	});

	it('unisce le due tabelle e registra i conflitti', () => {
		const righe: RigaGrezza[] = [
			{
				fonte: 'dettagli',
				campi: { gruppo: 'ACI SANT ANTONIO 1', larghezza: '1', colore_base: 'Rosso' }
			},
			{
				fonte: 'supsystic',
				campi: { gruppo: "ACI SANT'ANTONIO 1", larghezza: '1,5 cm', colore_base: 'Rosso' }
			}
		];
		const [g] = unisci(righe);
		expect(g.nome).toBe("Aci Sant'Antonio 1");
		expect(g.campi.larghezza).toBe('1');
		expect(g.conflitti).toEqual([{ campo: 'larghezza', dettagli: '1', supsystic: '1,5 cm' }]);
	});

	// servono i dati grezzi, che non sono nel repository
	it.skipIf(!SCHEDE_SICILIA.length)('stesso nome in associazioni diverse = gruppi diversi', () => {
		const ids = SCHEDE_SICILIA.filter((s) => s.gruppo.nome === 'Palermo 6').map((s) => s.gruppo.id);
		expect(ids.sort()).toEqual(['palermo-6', 'palermo-6-fse']);
	});

	it.skipIf(!SCHEDE_SICILIA.length)('ogni interpretazione manuale corrisponde a un gruppo', () => {
		const ids = new Set(SCHEDE_SICILIA.map((s) => s.gruppo.id));
		for (const id of Object.keys(MANUALI)) expect(ids.has(id), id).toBe(true);
	});

	it.skipIf(!SCHEDE_SICILIA.length)('tutte le schede si disegnano', () => {
		for (const s of SCHEDE_SICILIA) {
			const { svg } = renderDesign(s.conversione.design, { id: s.gruppo.id });
			expect(svg, s.gruppo.id).not.toContain('NaN');
		}
	});
});
