import { describe, expect, it } from 'vitest';
import { differenze } from './diff';

describe('differenze', () => {
	it('descrive i cambi in modo leggibile', () => {
		const a = {
			design: {
				fronte: { fettucce: [{ colori: [{ nome: 'blu', hex: '#00f' }], larghezza_mm: 10 }] }
			}
		};
		const b = {
			design: {
				fronte: { fettucce: [{ colori: [{ nome: 'azzurro', hex: '#00f' }], larghezza_mm: 10 }] }
			}
		};
		expect(differenze(a, b)).toEqual([
			{ campo: 'fronte · fettuccia 1 · colore 1 · nome', prima: 'blu', dopo: 'azzurro' }
		]);
	});

	it("ignora i metadati dell'import", () => {
		expect(differenze({ dati_originali: { a: '1' } }, { dati_originali: { a: '2' } })).toEqual([]);
	});
});
