import { describe, expect, it } from 'vitest';
import { leggiModulo } from './gruppo';

const modulo = (campi: Record<string, string>) => {
	const f = new FormData();
	for (const [k, v] of Object.entries({ nome: 'Rosolini 1', regione: 'Sicilia', ...campi }))
		f.set(k, v);
	return f;
};

describe('modulo del gruppo', () => {
	it('senza anno di chiusura il gruppo è attivo', () => {
		const r = leggiModulo(modulo({ anno_fondazione: '1974' }));
		expect('dati' in r && r.dati).toMatchObject({
			anno_fondazione: 1974,
			anno_chiusura: null,
			attivo: true,
			indirizzo: null
		});
	});

	it('con anno di chiusura, o «chiuso senza anno», non è attivo', () => {
		const a = leggiModulo(modulo({ anno_chiusura: '1996' }));
		expect('dati' in a && a.dati.attivo).toBe(false);
		const b = leggiModulo(modulo({ chiuso_senza_anno: 'on' }));
		expect('dati' in b && b.dati).toMatchObject({ attivo: false, anno_chiusura: null });
	});

	it('controlla gli anni', () => {
		expect(leggiModulo(modulo({ anno_fondazione: '74' }))).toHaveProperty('errore');
		expect(leggiModulo(modulo({ anno_fondazione: '1990', anno_chiusura: '1980' }))).toHaveProperty(
			'errore'
		);
	});

	it('legge la sede e mette la provincia in maiuscolo', () => {
		const r = leggiModulo(
			modulo({ via: 'Via Sipione', civico: 'snc', comune: 'Rosolini', provincia: 'sr' })
		);
		expect('dati' in r && r.dati.indirizzo).toEqual({
			via: 'Via Sipione',
			civico: 'snc',
			cap: null,
			comune: 'Rosolini',
			provincia: 'SR'
		});
	});
});
