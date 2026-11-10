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

	it('mostra le fonti aggiunte', () => {
		const a = { fonti: [{ tipo: 'agesci-sicilia', nota: 'Tabella' }] };
		const b = {
			fonti: [
				{ tipo: 'agesci-sicilia', nota: 'Tabella' },
				{ tipo: 'libera', nota: 'Foto del gruppo', url: 'https://x.it' }
			]
		};
		const d = differenze(a, b);
		expect(d).toContainEqual({
			campo: 'fonte 2 · descrizione',
			prima: null,
			dopo: 'Foto del gruppo'
		});
		expect(d).toContainEqual({ campo: 'fonte 2 · link', prima: null, dopo: 'https://x.it' });
	});
});
