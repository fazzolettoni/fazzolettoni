/**
 * Elenco delle sedi dei gruppi AGESCI Sicilia (data/sicilia/indirizzi.tsv, fuori dal
 * repository): lettura, pulizia e abbinamento ai gruppi per nome.
 */
import type { Indirizzo } from '../supabase/tipi';

export interface RigaIndirizzo {
	gruppo: string;
	zona: string | null;
	indirizzo: Indirizzo;
}

/** Chiave per abbinare i nomi: "Capo D'Orlando 1" e "CAPO D ORLANDO 1" coincidono. */
export const chiaveNome = (nome: string) =>
	nome
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toUpperCase()
		.replace(/[^A-Z0-9]+/g, ' ')
		.trim();

const MINUSCOLE = new Set([
	'di',
	'del',
	'della',
	'delle',
	'dello',
	'dei',
	'degli',
	'la',
	'lo',
	'le',
	'e',
	'al',
	'd',
	'in'
]);
/** Comuni scritti senza accento nell'elenco. */
const ACCENTI: Record<string, string> = {
	Canicatti: 'Canicattì',
	Paterno: 'Paternò',
	Cefalu: 'Cefalù',
	Liberta: 'Libertà'
};

/** Da "ACI SANT ANTONIO" a "Aci Sant'Antonio"; sigle e numeri romani restano maiuscoli. */
/** `iniziaMinuscola`: per le zone, che si leggono dopo la parola «zona» ("zona dei Fenici"). */
export function maiuscoleNomi(testo: string, iniziaMinuscola = false): string {
	const parole = testo
		.replace(/\s+/g, ' ')
		.trim()
		.split(' ')
		.map((p, i) => {
			if (/^[IVXL]+°?$/.test(p) || /[/.]/.test(p) || /\d/.test(p)) return p.toUpperCase();
			const m = p.toLowerCase();
			if ((i > 0 || iniziaMinuscola) && MINUSCOLE.has(m)) return m;
			const t = m.replace(/(^|['-])(\p{L})/gu, (_, a, b) => a + b.toUpperCase());
			return ACCENTI[t] ?? t;
		})
		.join(' ');
	// apostrofi persi: "Sant Antonio", "D Orlando", "Dell Airone"
	return parole
		.replace(/\b(Sant|Dell|Nell|Sull|Dall|All)\s(?=\p{L})/gu, "$1'")
		.replace(/\b([Dd])\s(?=[AEIOUaeiou])/g, "$1'");
}

/** "05-giu" (trasformato da un foglio di calcolo) torna "5/6"; "snc", "sn", "--" diventano "snc". */
export function pulisciCivico(c: string): string | null {
	const t = c.trim();
	if (!t || t === '--') return null;
	if (/^s\.?n\.?c?\.?$/i.test(t)) return 'snc';
	const mesi = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
	const m = /^(\d{1,2})-([a-z]{3})$/i.exec(t);
	if (m && mesi.includes(m[2].toLowerCase()))
		return `${Number(m[1])}/${mesi.indexOf(m[2].toLowerCase()) + 1}`;
	return t.replace(/\s+/g, ' ').toUpperCase();
}

/** Primo CAP valido di 5 cifre ("9805798057" → "98057"). */
export const pulisciCap = (c: string) => /\d{5}/.exec(c)?.[0] ?? null;

/** Testo con caratteri rovinati da una codifica sbagliata ("IÂ°" → "I°"). */
const ripara = (t: string) => t.replace(/Â(?=[°ª])/g, '').trim();

export function leggiIndirizzi(tsv: string): RigaIndirizzo[] {
	return tsv
		.split(/\r?\n/)
		.slice(1)
		.filter((r) => r.trim())
		.map((r) => {
			const [gruppo, zona, via, civico, cap, comune, provincia] = r
				.split('\t')
				.map((c) => ripara(c ?? ''));
			const z = zona.replace(/^ZONA\s+/i, '');
			return {
				gruppo,
				zona: z ? maiuscoleNomi(z, true) : null,
				indirizzo: {
					via: via ? maiuscoleNomi(via) : null,
					civico: pulisciCivico(civico),
					cap: pulisciCap(cap),
					comune: comune ? maiuscoleNomi(comune) : null,
					provincia: provincia ? provincia.toUpperCase() : null
				}
			};
		});
}
