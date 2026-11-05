<script lang="ts">
	import ModuloGruppo from '#lib/components/ModuloGruppo.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head><title>Nuovo gruppo · Fazzolettoni</title></svelte:head>

<main>
	<h1>Nuovo gruppo</h1>
	<p class="nota">
		Prima crea il gruppo, poi dalla sua pagina aggiungi uno o più fazzolettoni. Controlla che non
		esista già <a href="/">nell'elenco</a>.
	</p>
	<ModuloGruppo
		dati={{}}
		associazioni={data.associazioni}
		errore={form?.errore}
		testoBottone="Crea il gruppo"
	/>
</main>

<style>
	main {
		max-width: 36rem;
		margin: 0 auto;
		padding: 1.2rem 1.5rem 3rem;
	}
	.nota {
		color: #666;
		font-size: 0.9rem;
	}
	a {
		color: #2a5db0;
	}
</style>
