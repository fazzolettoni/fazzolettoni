/**
 * La texture del portafazzolettone: solo la sigla dell'associazione del gruppo, dritta e al
 * centro. Il modello originale portava il logo AGESCI, che è un marchio: qui non si usa.
 */
import * as THREE from 'three';
import fontUrl from '@fontsource/montserrat/files/montserrat-latin-800-normal.woff2?url';

const LATO = 1024;
const FONDO = '#a0844c';
const INCHIOSTRO = '#763910';
const FAMIGLIA = 'Montserrat Nodo';
/** La faccia frontale del portafazzolettone è un disco: la scritta resta dentro questa larghezza. */
const LARGHEZZA_MAX = LATO * 0.62;
const CORPO_MAX = LATO * 0.24;

let carattere: Promise<void> | null = null;

function caricaCarattere(): Promise<void> {
	carattere ??= new FontFace(FAMIGLIA, `url(${fontUrl})`, { weight: '800' })
		.load()
		.then((f) => void document.fonts.add(f));
	carattere.catch(() => (carattere = null));
	return carattere;
}

const cache = new Map<string, Promise<THREE.CanvasTexture>>();

/** La texture per una sigla (es. "agesci"); senza sigla, il portafazzolettone resta liscio. */
export function textureNodo(sigla: string | null | undefined): Promise<THREE.CanvasTexture> {
	const chiave = (sigla ?? '').trim().toUpperCase();
	let t = cache.get(chiave);
	if (!t) {
		t = (chiave ? caricaCarattere() : Promise.resolve()).then(() => {
			const canvas = document.createElement('canvas');
			canvas.width = canvas.height = LATO;
			const ctx = canvas.getContext('2d')!;
			ctx.fillStyle = FONDO;
			ctx.fillRect(0, 0, LATO, LATO);
			if (chiave) {
				// corpo massimo, ridotto se la sigla è lunga
				ctx.font = `800 100px "${FAMIGLIA}"`;
				const corpo = Math.min(CORPO_MAX, (LARGHEZZA_MAX / ctx.measureText(chiave).width) * 100);
				ctx.font = `800 ${corpo}px "${FAMIGLIA}"`;
				ctx.fillStyle = INCHIOSTRO;
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillText(chiave, LATO / 2, LATO / 2);
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
