/**
 * Tile delle fantasie: si scaricano dallo storage "tile" una volta sola e si tengono qui,
 * pronte da inserire negli SVG come data URI (un SVG mostrato come immagine o disegnato su
 * un canvas non può caricare file esterni). Lo stato è reattivo: i disegni si aggiornano
 * appena una tile arriva.
 */
import { PUBLIC_SUPABASE_URL } from '$app/env/public';
import { ASSET_TILE, type TileCaricata } from './render';
import type { Design, Fantasia } from './schema';

export const TILE: Record<string, TileCaricata> = $state({});
const inCorso = new Map<string, Promise<void>>();

export const urlTile = (asset: string) =>
	`${PUBLIC_SUPABASE_URL}/storage/v1/object/public/tile/${asset}`;

/** Le tile usate da un design (fondo e fettucce, fronte e retro). */
export function assetDi(d: Design | null | undefined): string[] {
	const fantasie: (Fantasia | null | undefined)[] = [];
	for (const f of [d?.fronte, d?.retro]) {
		if (!f) continue;
		fantasie.push(f.fondo?.fantasia);
		for (const fet of f.fettucce ?? []) fantasie.push(fet.fantasia);
	}
	return [
		...new Set(fantasie.map((x) => x?.asset).filter((a): a is string => !!a && ASSET_TILE.test(a)))
	];
}

const comeDataUri = (blob: Blob) =>
	new Promise<string>((ok, ko) => {
		const r = new FileReader();
		r.onload = () => ok(String(r.result));
		r.onerror = () => ko(r.error);
		r.readAsDataURL(blob);
	});

/** Proporzioni: per gli SVG dal viewBox (o da width/height), per le altre dall'immagine. */
async function dimensioni(
	blob: Blob,
	svg: boolean
): Promise<{ larghezza: number; altezza: number }> {
	if (svg) {
		const testo = await blob.text();
		const vb = /viewBox\s*=\s*["']\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(testo);
		if (vb) return { larghezza: Number(vb[1]), altezza: Number(vb[2]) };
		const w = /\swidth\s*=\s*["']([\d.]+)/i.exec(testo);
		const h = /\sheight\s*=\s*["']([\d.]+)/i.exec(testo);
		return { larghezza: Number(w?.[1] ?? 1), altezza: Number(h?.[1] ?? 1) };
	}
	const bmp = await createImageBitmap(blob);
	const r = { larghezza: bmp.width, altezza: bmp.height };
	bmp.close();
	return r;
}

async function scarica(asset: string): Promise<void> {
	const risposta = await fetch(urlTile(asset));
	if (!risposta.ok) throw new Error(`Tile ${asset}: ${risposta.status}`);
	const svg = asset.endsWith('.svg');
	// il tipo si decide dall'estensione, non da quello che dichiara il server
	const tipo = svg
		? 'image/svg+xml'
		: asset.endsWith('.png')
			? 'image/png'
			: asset.endsWith('.webp')
				? 'image/webp'
				: 'image/jpeg';
	const blob = new Blob([await risposta.arrayBuffer()], { type: tipo });
	const [href, dim] = await Promise.all([comeDataUri(blob), dimensioni(blob, svg)]);
	TILE[asset] = { href, ...dim };
}

/** Scarica le tile mancanti di un design e restituisce quelle disponibili. */
export async function caricaTile(
	d: Design | null | undefined
): Promise<Record<string, TileCaricata>> {
	if (typeof window === 'undefined') return {};
	await Promise.all(
		assetDi(d)
			.filter((a) => !TILE[a])
			.map((a) => {
				let p = inCorso.get(a);
				if (!p) {
					p = scarica(a).catch((e) => {
						inCorso.delete(a); // si riprova alla prossima richiesta
						console.warn(e);
					});
					inCorso.set(a, p);
				}
				return p;
			})
	);
	return $state.snapshot(TILE) as Record<string, TileCaricata>;
}

/** Per i componenti: avvia il download senza aspettare (i disegni si aggiornano da soli). */
export function richiediTile(d: Design | null | undefined) {
	void caricaTile(d);
}
