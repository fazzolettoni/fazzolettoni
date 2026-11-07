<script lang="ts">
	import { onMount } from 'svelte';
	import * as THREE from 'three';
	import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
	import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
	import type { Design } from '#lib/design/schema.ts';
	import { renderDesign } from '#lib/design/render.ts';

	/**
	 * Prova 3D: il fazzolettone arrotolato del modello GLB con la texture generata dal renderer.
	 * Nel modello la sagoma occupa la metà superiore della texture (u 0–1, v 0–0,5), lato lungo
	 * in alto: la stessa forma del nostro SVG, che ha proporzioni 2:1.
	 */
	let { design, modello = '/modelli/fazzolettone.glb' }: { design: Design; modello?: string } =
		$props();

	const LATO = 2048;
	let contenitore: HTMLDivElement;
	let errore = $state<string | null>(null);
	let pronto = $state(false);

	let fronte: THREE.MeshStandardMaterial | null = null;
	let retro: THREE.MeshStandardMaterial | null = null;
	let ridisegna = () => {};

	async function texture(svg: string): Promise<THREE.CanvasTexture> {
		const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
		try {
			const img = new Image();
			await new Promise<void>((ok, ko) => {
				img.onload = () => ok();
				img.onerror = () => ko(new Error('SVG non caricabile'));
				img.src = url;
			});
			const canvas = document.createElement('canvas');
			canvas.width = canvas.height = LATO;
			const ctx = canvas.getContext('2d')!;
			ctx.drawImage(img, 0, 0, LATO, LATO / 2);
			const t = new THREE.CanvasTexture(canvas);
			t.flipY = false; // convenzione glTF
			t.colorSpace = THREE.SRGBColorSpace;
			t.anisotropy = 8;
			return t;
		} finally {
			URL.revokeObjectURL(url);
		}
	}

	async function applica(d: Design) {
		if (!fronte || !retro) return;
		const [tf, tr] = await Promise.all([
			texture(renderDesign(d, { faccia: 'fronte', id: 'f3d', texture: true }).svg),
			texture(renderDesign(d, { faccia: 'retro', id: 'r3d', texture: true }).svg)
		]);
		fronte.map?.dispose();
		retro.map?.dispose();
		fronte.map = tf;
		retro.map = tr;
		fronte.needsUpdate = retro.needsUpdate = true;
		ridisegna();
	}

	$effect(() => {
		const d = $state.snapshot(design) as Design;
		if (pronto) applica(d).catch((e) => (errore = String(e)));
	});

	onMount(() => {
		const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
		renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
		renderer.toneMapping = THREE.NeutralToneMapping;
		contenitore.appendChild(renderer.domElement);

		const scena = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100);
		scena.add(new THREE.HemisphereLight(0xffffff, 0x8a8070, 1.6));
		const sole = new THREE.DirectionalLight(0xffffff, 1.8);
		sole.position.set(1, 2, 2);
		scena.add(sole);

		const controlli = new OrbitControls(camera, renderer.domElement);
		controlli.enableDamping = true;

		ridisegna = () => renderer.render(scena, camera);
		const dimensiona = () => {
			const w = contenitore.clientWidth;
			const h = contenitore.clientHeight;
			renderer.setSize(w, h);
			camera.aspect = w / h;
			camera.updateProjectionMatrix();
			ridisegna();
		};
		const ro = new ResizeObserver(dimensiona);
		ro.observe(contenitore);

		let attivo = true;
		const ciclo = () => {
			if (!attivo) return;
			controlli.update();
			ridisegna();
			requestAnimationFrame(ciclo);
		};

		new GLTFLoader().load(
			modello,
			(gltf) => {
				const mesh: THREE.Mesh[] = [];
				gltf.scene.traverse((o) => {
					if (o instanceof THREE.Mesh) mesh.push(o);
				});
				mesh.forEach((o) => {
					const m = o.material as THREE.MeshStandardMaterial;
					if (m.name === 'FAZZOLETTONE') {
						// Due facce dello stesso tessuto: fronte e retro con texture diverse
						fronte = m.clone();
						fronte.side = THREE.FrontSide;
						retro = m.clone();
						retro.side = THREE.BackSide;
						o.material = fronte;
						const dietro = new THREE.Mesh(o.geometry, retro);
						o.add(dietro);
					} else if (m.name === 'fallback Material') {
						o.visible = false; // segnaposto del collo
					}
				});
				scena.add(gltf.scene);
				const box = new THREE.Box3().setFromObject(gltf.scene);
				const centro = box.getCenter(new THREE.Vector3());
				const r = box.getSize(new THREE.Vector3()).length();
				controlli.target.copy(centro);
				camera.position.copy(centro).add(new THREE.Vector3(0, r * 0.15, r * 1.3));
				camera.near = r / 100;
				camera.far = r * 10;
				camera.updateProjectionMatrix();
				pronto = true;
				dimensiona();
				ciclo();
			},
			undefined,
			(e) => (errore = `Modello non caricabile: ${e}`)
		);

		return () => {
			attivo = false;
			ro.disconnect();
			controlli.dispose();
			renderer.dispose();
			renderer.domElement.remove();
		};
	});
</script>

<div class="vista" bind:this={contenitore}>
	{#if errore}<p class="errore">{errore}</p>{:else if !pronto}<p class="attesa">
			Carico il modello…
		</p>{/if}
</div>

<style>
	.vista {
		position: relative;
		width: 100%;
		height: 100%;
		min-height: 320px;
	}
	.vista :global(canvas) {
		display: block;
		touch-action: none;
	}
	p {
		position: absolute;
		inset: 0;
		margin: auto;
		height: fit-content;
		text-align: center;
		color: #777;
	}
	.errore {
		color: #b3261e;
	}
</style>
