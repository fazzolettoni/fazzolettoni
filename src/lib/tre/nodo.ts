/**
 * La texture del portafazzolettone: l'emblema scout generico (disegnato per il progetto, senza
 * marchi di associazioni) e sotto, ad arco, la sigla dell'associazione del gruppo.
 * Il modello originale portava il logo AGESCI, che è un marchio: qui non si usa.
 */
import * as THREE from 'three';
import emblemaUrl from '../assets/emblema.svg?url';
import fontUrl from '@fontsource/montserrat/files/montserrat-latin-800-normal.woff2?url';

const LATO = 1024;
const FONDO = '#a0844c';
const INCHIOSTRO = '#763910';
const FAMIGLIA = 'Montserrat Nodo';

let risorse: Promise<HTMLImageElement> | null = null;

/** Emblema e carattere, caricati una volta. */
function carica(): Promise<HTMLImageElement> {
	risorse ??= (async () => {
		const font = new FontFace(FAMIGLIA, `url(${fontUrl})`, { weight: '800' });
		document.fonts.add(await font.load());
		const img = new Image();
		await new Promise<void>((ok, ko) => {
			img.onload = () => ok();
			img.onerror = () => ko(new Error('Emblema non caricabile'));
			img.src = emblemaUrl;
		});
		return img;
	})();
	risorse.catch(() => (risorse = null));
	return risorse;
}

/** Scrive un testo lungo la parte bassa di un cerchio, leggibile da sinistra a destra. */
function testoAdArco(
	ctx: CanvasRenderingContext2D,
	testo: string,
	cx: number,
	cy: number,
	raggio: number,
	spaziatura: number
) {
	const larghezze = [...testo].map((c) => ctx.measureText(c).width + spaziatura);
	const totale = larghezze.reduce((a, b) => a + b, 0) - spaziatura;
	// sul fondo del cerchio l'angolo cresce verso sinistra: si parte dall'angolo più grande
	let angolo = Math.PI / 2 + totale / raggio / 2;
	[...testo].forEach((c, i) => {
		const passo = larghezze[i] / raggio;
		const a = angolo - (larghezze[i] - spaziatura) / raggio / 2;
		ctx.save();
		ctx.translate(cx + raggio * Math.cos(a), cy + raggio * Math.sin(a));
		ctx.rotate(a - Math.PI / 2);
		ctx.fillText(c, 0, 0);
		ctx.restore();
		angolo -= passo;
	});
}

const cache = new Map<string, Promise<THREE.CanvasTexture>>();

/** La texture per una sigla (es. "agesci"); senza sigla, solo l'emblema. */
export function textureNodo(sigla: string | null | undefined): Promise<THREE.CanvasTexture> {
	const chiave = (sigla ?? '').trim().toUpperCase();
	let t = cache.get(chiave);
	if (!t) {
		t = carica().then((img) => {
			const canvas = document.createElement('canvas');
			canvas.width = canvas.height = LATO;
			const ctx = canvas.getContext('2d')!;
			ctx.fillStyle = FONDO;
			ctx.fillRect(0, 0, LATO, LATO);
			// stessa impaginazione del logo originale: emblema al centro, scritta sotto
			const cx = LATO / 2;
			const cy = LATO * 0.44;
			const lato = LATO * (chiave ? 0.64 : 0.74);
			ctx.drawImage(img, cx - lato / 2, (chiave ? cy : LATO / 2) - lato / 2, lato, lato);
			if (chiave) {
				ctx.fillStyle = INCHIOSTRO;
				ctx.font = `800 ${LATO * 0.1}px "${FAMIGLIA}"`;
				ctx.textAlign = 'center';
				ctx.textBaseline = 'alphabetic';
				testoAdArco(ctx, chiave, cx, cy, LATO * 0.38, LATO * 0.01);
			}
			const tex = new THREE.CanvasTexture(canvas);
			tex.flipY = false; // convenzione glTF
			tex.colorSpace = THREE.SRGBColorSpace;
			tex.anisotropy = 8;
			return tex;
		});
		t.catch(() => cache.delete(chiave));
		cache.set(chiave, t);
	}
	return t;
}
