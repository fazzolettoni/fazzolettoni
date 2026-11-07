<script lang="ts">
	import { onMount } from 'svelte';
	import * as THREE from 'three';
	import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
	import type { Design } from '#lib/design/schema.ts';
	import {
		MODELLO,
		inquadra,
		istanza,
		nuovoRenderer,
		scena,
		type Istanza
	} from '#lib/tre/modello.ts';

	/** Vista 3D interattiva del fazzolettone indossato (trascina per ruotare). */
	let { design, modello = MODELLO }: { design: Design; modello?: string } = $props();

	let contenitore: HTMLDivElement;
	let errore = $state<string | null>(null);
	let pronto = $state(false);
	let fazz: Istanza | null = null;
	let ridisegna = () => {};

	$effect(() => {
		const d = $state.snapshot(design) as Design;
		if (pronto && fazz)
			fazz
				.applica(d)
				.then(() => ridisegna())
				.catch((e) => (errore = String(e)));
	});

	onMount(() => {
		const renderer = nuovoRenderer();
		renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
		contenitore.appendChild(renderer.domElement);
		const s = scena();
		const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100);
		const controlli = new OrbitControls(camera, renderer.domElement);
		controlli.enableDamping = true;

		ridisegna = () => renderer.render(s, camera);
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

		istanza(modello)
			.then((i) => {
				if (!attivo) return i.dispose();
				fazz = i;
				s.add(i.oggetto);
				inquadra(camera, i);
				controlli.target.copy(i.centro);
				pronto = true;
				dimensiona();
				ciclo();
			})
			.catch((e) => (errore = `Modello non caricabile: ${e}`));

		return () => {
			attivo = false;
			ro.disconnect();
			controlli.dispose();
			fazz?.dispose();
			renderer.dispose();
			renderer.domElement.remove();
		};
	});
</script>

<div class="vista" bind:this={contenitore}>
	{#if errore}<p class="errore">{errore}</p>{:else if !pronto}<p>Carico il modello…</p>{/if}
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
