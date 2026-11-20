import type { DatiGruppo, Indirizzo } from '#lib/supabase/tipi.ts';

/** "Via Roma 12, 95021 Aci Castello (CT)", o null se non c'è niente. */
export function testoIndirizzo(i: Indirizzo | null | undefined): string | null {
	if (!i) return null;
	const strada = [i.via, i.civico].filter(Boolean).join(' ');
	const luogo = [i.cap, i.comune].filter(Boolean).join(' ');
	const prov = i.provincia ? `(${i.provincia})` : '';
	const testo = [strada, [luogo, prov].filter(Boolean).join(' ')].filter(Boolean).join(', ');
	return testo || null;
}

/** "Fondato nel 1974 · in attività", "1974–1996", "chiuso, anno non noto"… */
export function testoAttivita(d: Partial<DatiGruppo> | null | undefined): string {
	const f = d?.anno_fondazione;
	const c = d?.anno_chiusura;
	if (c) return f ? `attivo dal ${f} al ${c}` : `chiuso nel ${c}`;
	if (d?.attivo === false)
		return f ? `fondato nel ${f} · chiuso, anno non noto` : 'chiuso, anno non noto';
	return f ? `fondato nel ${f} · in attività` : 'in attività';
}

/** Anni plausibili per un gruppo scout (il primo in Italia è del 1910). */
export const annoValido = (a: number) => Number.isInteger(a) && a >= 1900 && a <= 2100;
