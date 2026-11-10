/**
 * Il fazzolettone indossato in 3D: modello GLB + texture generate dal renderer SVG.
 *
 * Nel modello la sagoma occupa la metà superiore della texture (u 0–1, v 0–0,5), lato lungo in
 * alto: la stessa forma del nostro SVG, che ha proporzioni 2:1. Il modello si scarica una volta
 * sola e si condivide tra tutte le viste.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { Design } from '../design/schema';
import { renderDesign } from '../design/render';
import { textureNodo } from './nodo';

export const MODELLO = '/modelli/fazzolettone.glb';
const LATO_TEXTURE = 2048;

/**
 * Il tessuto del modello è un solido sottile: le due facce hanno le stesse UV ma specchiate.
 * Il verso dei triangoli nello spazio UV le distingue: gruppo 0 = fronte, 1 = retro.
 * I triangoli del bordo (UV degeneri) vanno col fronte.
 */
function dividiFacce(g: THREE.BufferGeometry) {
	const uv = g.getAttribute('uv');
	const idx = g.getIndex();
	if (!uv || !idx) return;
	const a = idx.array;
	const fronte: number[] = [];
	const retro: number[] = [];
	for (let t = 0; t < a.length; t += 3) {
		const [i, j, k] = [a[t], a[t + 1], a[t + 2]];
		const u1 = uv.getX(j) - uv.getX(i);
		const v1 = uv.getY(j) - uv.getY(i);
		const u2 = uv.getX(k) - uv.getX(i);
		const v2 = uv.getY(k) - uv.getY(i);
		(u1 * v2 - u2 * v1 > 0 ? retro : fronte).push(i, j, k);
	}
	g.setIndex([...fronte, ...retro]);
	g.clearGroups();
	g.addGroup(0, fronte.length, 0);
	g.addGroup(fronte.length, retro.length, 1);
}

const caricati = new Map<string, Promise<THREE.Group>>();

/** Il modello preparato (facce divise, collo nascosto), scaricato una volta per URL. */
function modello(url: string): Promise<THREE.Group> {
	let p = caricati.get(url);
	if (!p) {
		p = new GLTFLoader().loadAsync(url).then((gltf) => {
			const mesh: THREE.Mesh[] = [];
			gltf.scene.traverse((o) => {
				if (o instanceof THREE.Mesh) mesh.push(o);
			});
			for (const o of mesh) {
				const m = o.material as THREE.MeshStandardMaterial;
				if (m.name === 'FAZZOLETTONE') dividiFacce(o.geometry);
				else if (m.name === 'fallback Material') o.visible = false; // segnaposto del collo
			}
			return gltf.scene;
		});
		p.catch(() => caricati.delete(url));
		caricati.set(url, p);
	}
	return p;
}

export interface Istanza {
	oggetto: THREE.Object3D;
	centro: THREE.Vector3;
	/** Diagonale del riquadro: serve a inquadrare. */
	misura: number;
	/** Applica fronte e retro di un design e la sigla dell'associazione sul portafazzolettone. */
	applica(d: Design, associazione?: string | null): Promise<void>;
	dispose(): void;
}

/** Una copia del modello con materiali propri (la geometria è condivisa). */
export async function istanza(url = MODELLO): Promise<Istanza> {
	const oggetto = (await modello(url)).clone(true);
	let fronte: THREE.MeshStandardMaterial | null = null;
	let retro: THREE.MeshStandardMaterial | null = null;
	let nodo: THREE.MeshStandardMaterial | null = null;
	oggetto.traverse((o) => {
		if (!(o instanceof THREE.Mesh)) return;
		const m = o.material as THREE.MeshStandardMaterial;
		if (m.name === 'FAZZOLETTONE') {
			fronte = m.clone();
			retro = m.clone();
			o.material = [fronte, retro];
		} else if (m.name === 'BLOCCO') {
			// il portafazzolettone: mai la texture del modello (logo AGESCI, un marchio)
			nodo = m.clone();
			nodo.map = null;
			o.material = nodo;
		}
	});
	const box = new THREE.Box3().setFromObject(oggetto);
	return {
		oggetto,
		centro: box.getCenter(new THREE.Vector3()),
		misura: box.getSize(new THREE.Vector3()).length(),
		async applica(d, associazione) {
			if (!fronte || !retro) return;
			const f: THREE.MeshStandardMaterial = fronte;
			const r: THREE.MeshStandardMaterial = retro;
			const n = nodo as THREE.MeshStandardMaterial | null;
			const [[tf, tr], tn] = await Promise.all([textureDi(d), textureNodo(associazione)]);
			if (n && n.map !== tn) {
				n.map = tn; // condivisa tra le viste: non si libera
				n.needsUpdate = true;
			}
			f.map?.dispose();
			r.map?.dispose();
			f.map = tf;
			r.map = tr;
			f.needsUpdate = r.needsUpdate = true;
		},
		dispose() {
			for (const m of [fronte, retro] as (THREE.MeshStandardMaterial | null)[]) {
				m?.map?.dispose();
				m?.dispose();
			}
			(nodo as THREE.MeshStandardMaterial | null)?.dispose();
		}
	};
}

/**
 * Le due texture (faccia esterna e interna del modello) per un design.
 *
 * Il modello usa le stesse UV sulle due facce: un punto del tessuto ha la stessa coordinata
 * davanti e dietro, quindi il retro si disegna senza specchiarlo.
 *
 * Il quadrato si indossa piegato lungo la diagonale orizzontale: fuori resta la metà inferiore
 * del fronte (già con il lato lungo in alto), dentro finisce la metà superiore, ribaltata dalla
 * piega. Il retro del quadrato resta chiuso tra i due strati e non si vede.
 */
async function textureDi(d: Design): Promise<[THREE.CanvasTexture, THREE.CanvasTexture]> {
	const r = (faccia: 'fronte' | 'retro', id: string) =>
		renderDesign(d, { faccia, id, texture: true }).svg;
	if (d.forma === 'quadrato') {
		const img = await immagine(r('fronte', 'q3d'));
		return [texture(img, 'sotto'), texture(img, 'sopra')];
	}
	const [f, b] = await Promise.all([immagine(r('fronte', 'f3d')), immagine(r('retro', 'r3d'))]);
	return [texture(f, 'tutta'), texture(b, 'tutta')];
}

async function immagine(svg: string): Promise<HTMLImageElement> {
	const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
	try {
		const img = new Image();
		await new Promise<void>((ok, ko) => {
			img.onload = () => ok();
			img.onerror = () => ko(new Error('SVG non caricabile'));
			img.src = url;
		});
		return img;
	} finally {
		URL.revokeObjectURL(url);
	}
}

/** La sagoma va nella metà superiore della texture (u 0–1, v 0–0,5). */
function texture(img: HTMLImageElement, parte: 'tutta' | 'sotto' | 'sopra'): THREE.CanvasTexture {
	const L = LATO_TEXTURE;
	const canvas = document.createElement('canvas');
	canvas.width = canvas.height = L;
	const ctx = canvas.getContext('2d')!;
	const w = img.width;
	const h = img.height;
	if (parte === 'tutta') ctx.drawImage(img, 0, 0, L, L / 2);
	else if (parte === 'sotto') ctx.drawImage(img, 0, h / 2, w, h / 2, 0, 0, L, L / 2);
	else {
		// ribaltata attorno alla piega: la diagonale orizzontale resta in alto
		ctx.translate(0, L / 2);
		ctx.scale(1, -1);
		ctx.drawImage(img, 0, 0, w, h / 2, 0, 0, L, L / 2);
	}
	const t = new THREE.CanvasTexture(canvas);
	t.flipY = false; // convenzione glTF
	t.colorSpace = THREE.SRGBColorSpace;
	t.anisotropy = 8;
	return t;
}

/** Luci e camera comuni a tutte le viste. */
export function scena() {
	const s = new THREE.Scene();
	s.add(new THREE.HemisphereLight(0xffffff, 0x8a8070, 1.6));
	const sole = new THREE.DirectionalLight(0xffffff, 1.8);
	sole.position.set(1, 2, 2);
	s.add(sole);
	return s;
}

export function inquadra(camera: THREE.PerspectiveCamera, i: Istanza, distanza = 1.3) {
	camera.position.copy(i.centro).add(new THREE.Vector3(0, i.misura * 0.15, i.misura * distanza));
	camera.near = i.misura / 100;
	camera.far = i.misura * 10;
	camera.lookAt(i.centro);
	camera.updateProjectionMatrix();
}

export function nuovoRenderer(opzioni: THREE.WebGLRendererParameters = {}) {
	const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, ...opzioni });
	r.toneMapping = THREE.NeutralToneMapping;
	return r;
}

// ------------------------------------------------------------------ foto per le gallerie

/**
 * Un solo renderer per tutte le miniature: i browser reggono pochi contesti WebGL per pagina.
 * Le richieste passano una alla volta.
 */
let fotografo: Promise<{
	renderer: THREE.WebGLRenderer;
	s: THREE.Scene;
	camera: THREE.PerspectiveCamera;
	i: Istanza;
	perno: THREE.Group;
}> | null = null;
let coda: Promise<unknown> = Promise.resolve();

function preparaFotografo() {
	fotografo ??= istanza().then((i) => {
		const renderer = nuovoRenderer({ preserveDrawingBuffer: true });
		const s = scena();
		// la rotazione avviene attorno al centro del modello
		const perno = new THREE.Group();
		perno.position.copy(i.centro);
		i.oggetto.position.sub(i.centro);
		perno.add(i.oggetto);
		s.add(perno);
		const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 100);
		inquadra(camera, i, 1.25);
		return { renderer, s, camera, i, perno };
	});
	return fotografo;
}

export interface OpzioniFoto {
	/** Rotazione attorno all'asse verticale, in gradi. */
	gradi?: number;
	/** Sigla dell'associazione, scritta sul portafazzolettone. */
	associazione?: string | null;
	larghezza?: number;
	altezza?: number;
}

/** Un'immagine PNG (object URL) del fazzolettone indossato. Va liberata con revokeObjectURL. */
export function fotografa(d: Design, o: OpzioniFoto = {}): Promise<string> {
	const lavoro = coda.then(async () => {
		const { renderer, s, camera, i, perno } = await preparaFotografo();
		const w = o.larghezza ?? 360;
		const h = o.altezza ?? 450;
		renderer.setPixelRatio(1);
		renderer.setSize(w, h, false);
		camera.aspect = w / h;
		camera.updateProjectionMatrix();
		perno.rotation.y = THREE.MathUtils.degToRad(o.gradi ?? 0);
		await i.applica(d, o.associazione);
		renderer.render(s, camera);
		const blob = await new Promise<Blob | null>((ok) =>
			renderer.domElement.toBlob(ok, 'image/png')
		);
		if (!blob) throw new Error('Immagine non generata');
		return URL.createObjectURL(blob);
	});
	coda = lavoro.catch(() => {});
	return lavoro;
}

/** Rotazione stabile e mai nulla (tra 15° e 32°, a destra o a sinistra) ricavata da un testo. */
export function gradiDa(chiave: string): number {
	let h = 2166136261;
	for (const c of chiave) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
	const x = (h >>> 0) / 2 ** 32;
	const ampiezza = 15 + (x * 2 - Math.floor(x * 2)) * 17;
	return x < 0.5 ? -ampiezza : ampiezza;
}
