<script lang="ts">
	import ElencoModifiche from '#lib/components/ElencoModifiche.svelte';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
</script>

<svelte:head><title>Ultime modifiche · Fazzolettoni</title></svelte:head>

<main>
	<h1>
		{#if data.utente}Modifiche di {data.nomeUtente ?? 'utente'}{:else}Ultime modifiche{/if}
	</h1>
	<p class="filtri">
		{#if data.utente}<a href="/modifiche">tutte le modifiche</a> ·{/if}
		{#if data.conImport}
			<a href="?{data.utente ? `utente=${data.utente}` : ''}">nascondi gli import</a>
		{:else}
			<a href="?import{data.utente ? `&utente=${data.utente}` : ''}">mostra anche gli import</a>
		{/if}
	</p>
	<ElencoModifiche modifiche={data.modifiche} />
</main>

<style>
	main {
		max-width: 1000px;
		margin: 0 auto;
		padding: 1.2rem 1.5rem 3rem;
	}
	.filtri {
		font-size: 0.88rem;
	}
	a {
		color: #2a5db0;
		text-decoration: none;
	}
</style>
