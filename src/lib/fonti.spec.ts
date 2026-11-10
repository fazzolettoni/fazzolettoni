import { describe, expect, it } from 'vitest';
import { linkSicuro, pulisciFonti } from './fonti';

describe('fonti', () => {
	it('accetta solo link web', () => {
		expect(linkSicuro('https://esempio.it/a')).toBe('https://esempio.it/a');
		expect(linkSicuro(' http://x.it ')).toBe('http://x.it');
		expect(linkSicuro('javascript:alert(1)')).toBeNull();
		expect(linkSicuro('data:text/html,x')).toBeNull();
		expect(linkSicuro('')).toBeNull();
	});

	it('toglie righe vuote e link non validi, conserva il tipo', () => {
		expect(
			pulisciFonti([
				{ tipo: 'agesci-sicilia', nota: ' Tabella ', url: 'https://sicilia.agesci.it' },
				{ tipo: '', nota: '', url: '' },
				{ tipo: '', nota: 'Foto del gruppo', url: 'javascript:x' }
			])
		).toEqual([
			{ tipo: 'agesci-sicilia', nota: 'Tabella', url: 'https://sicilia.agesci.it' },
			{ tipo: 'libera', nota: 'Foto del gruppo' }
		]);
	});
});
