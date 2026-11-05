<script lang="ts">
	import ModuloGruppo from '#lib/components/ModuloGruppo.svelte';
	import { percorsoGruppo } from '#lib/supabase/dati.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const g = $derived(data.gruppo);
</script>

<svelte:head><title>Modifica · {g.nome} · Fazzolettoni</title></svelte:head>

<main>
	<p class="briciole"><a href={percorsoGruppo(g)}>← {g.nome}</a></p>
	<h1>Modifica gruppo</h1>
	<ModuloGruppo dati={g.rev?.dati ?? g} errore={form?.errore} testoBottone="Salva" />
</main>

<style>
	main {
		max-width: 36rem;
		margin: 0 auto;
		padding: 1.2rem 1.5rem 3rem;
	}
	.briciole a {
		color: #2a5db0;
		text-decoration: none;
		font-size: 0.9rem;
	}
</style>
