import { describe, expect, it } from 'vitest';
import { chiaveNome, leggiIndirizzi, maiuscoleNomi, pulisciCap, pulisciCivico } from './indirizzi';

describe('indirizzi Sicilia', () => {
	it('abbina nomi scritti in modo diverso', () => {
		expect(chiaveNome("Capo D'Orlando 1")).toBe(chiaveNome('CAPO D ORLANDO 1'));
		expect(chiaveNome("Aci Sant'Antonio 1")).toBe('ACI SANT ANTONIO 1');
	});

	it('mette le maiuscole e gli apostrofi', () => {
		expect(maiuscoleNomi('ACI SANT ANTONIO')).toBe("Aci Sant'Antonio");
		expect(maiuscoleNomi('CAPO D ORLANDO')).toBe("Capo d'Orlando");
		expect(maiuscoleNomi('VIA PIO IX')).toBe('Via Pio IX');
		expect(maiuscoleNomi('VIA SAN PIETRO C/O ORATORIO MARIA SS. DEL ROSARIO')).toBe(
			'Via San Pietro C/O Oratorio Maria SS. del Rosario'
		);
		expect(maiuscoleNomi('CANICATTI')).toBe('Canicattì');
		expect(maiuscoleNomi('CASTELLAMMARE DEL GOLFO')).toBe('Castellammare del Golfo');
	});

	it('ripulisce civici e CAP', () => {
		expect(pulisciCivico('05-giu')).toBe('5/6');
		expect(pulisciCivico('SNC')).toBe('snc');
		expect(pulisciCivico('sn')).toBe('snc');
		expect(pulisciCivico('--')).toBeNull();
		expect(pulisciCivico('339 a')).toBe('339 A');
		expect(pulisciCap('9805798057')).toBe('98057');
	});

	it('legge le righe del file', () => {
		const [r] = leggiIndirizzi(
			'GRUPPO\tZONA\tINDIRIZZO\tCIVICO\tCAP\tRESIDENZA\tPROVINCIA\nMILAZZO 2\tZONA DELLO STRETTO\tVIA UMBERTO IÂ°\t45\t98057\tMILAZZO\tME\n'
		);
		expect(r).toEqual({
			gruppo: 'MILAZZO 2',
			zona: 'dello Stretto',
			indirizzo: {
				via: 'Via Umberto I°',
				civico: '45',
				cap: '98057',
				comune: 'Milazzo',
				provincia: 'ME'
			}
		});
	});
});
