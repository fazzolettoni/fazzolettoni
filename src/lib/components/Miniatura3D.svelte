<script lang="ts">
	import { onMount } from 'svelte';
	import type { Design } from '#lib/design/schema.ts';
	import Disegno from './Disegno.svelte';
	import sagoma from '#lib/assets/sagoma.png';

	/**
	 * Immagine fissa del fazzolettone indossato, generata quando entra nello schermo con il
	 * renderer condiviso. Ogni gruppo ha una sua leggera rotazione, sempre la stessa. Se qualcosa
	 * va storto si ripiega sul disegno piatto.
	 */
	let {
		design,
		id,
		associazione = null
	}: { design: Design; id: string; associazione?: string | null } = $props();

	let elemento: HTMLDivElement;
	let src = $state<string | null>(null);
	let fallito = $state(false);

	onMount(() => {
		let attivo = true;
		let url: string | null = null;
		const oss = new IntersectionObserver(
			async ([voce]) => {
				if (!voce.isIntersecting) return;
				oss.disconnect();
				try {
					const { fotografa, gradiDa } = await import('#lib/tre/modello.ts');
					url = await fotografa($state.snapshot(design) as Design, {
						gradi: gradiDa(id),
						associazione
					});
					if (attivo) src = url;
					else URL.revokeObjectURL(url);
				} catch {
					fallito = true;
				}
			},
			{ rootMargin: '300px' }
		);
		oss.observe(elemento);
		return () => {
			attivo = false;
			oss.disconnect();
			if (url) URL.revokeObjectURL(url);
		};
	});
</script>

<div class="mini3d" bind:this={elemento}>
	{#if fallito}
		<div class="piano"><Disegno {design} id="m-{id}" /></div>
	{:else if src}
		<img {src} alt="" />
	{:else}
		<!-- mentre l'immagine 3D si genera: la sagoma di un fazzolettone generico -->
		<div class="attesa" style:--sagoma="url({sagoma})"></div>
	{/if}
</div>

<style>
	.mini3d {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		animation: compare 0.3s ease-out;
	}
	.piano {
		width: 80%;
	}
	.attesa {
		height: 82%;
		aspect-ratio: 232 / 450;
		background: #e4e0d8;
		mask: var(--sagoma) center / contain no-repeat;
		-webkit-mask: var(--sagoma) center / contain no-repeat;
		animation: respira 1.6s ease-in-out infinite alternate;
	}
	@keyframes respira {
		to {
			background: #eeebe5;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.attesa {
			animation: none;
		}
	}
	@keyframes compare {
		from {
			opacity: 0;
		}
	}
</style>
