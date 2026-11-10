import type { Fonte } from '#lib/supabase/tipi.ts';

/** Solo link web: un indirizzo scritto da un utente finisce in un href. */
export const linkSicuro = (url: string | null | undefined): string | null => {
	const u = url?.trim();
	return u && /^https?:\/\/[^\s]+$/i.test(u) ? u : null;
};

/** Testo da mostrare per una fonte. */
export const testoFonte = (f: Fonte) => f.nota?.trim() || linkSicuro(f.url) || f.tipo;

/** Pulisce le fonti scritte nell'editor: niente righe vuote, link solo web. */
export function pulisciFonti(fonti: Fonte[]): Fonte[] {
	return fonti
		.map((f) => {
			const nota = f.nota?.trim();
			const url = linkSicuro(f.url);
			const pulita: Fonte = { tipo: f.tipo || 'libera' };
			if (nota) pulita.nota = nota;
			if (url) pulita.url = url;
			return pulita;
		})
		.filter((f) => f.nota || f.url);
}
