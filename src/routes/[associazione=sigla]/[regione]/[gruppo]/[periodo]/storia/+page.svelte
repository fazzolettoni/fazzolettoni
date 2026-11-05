<script lang="ts">
	import { page } from '$app/state';
	import Storia from '#lib/components/Storia.svelte';
	import { percorsoFazzolettone, percorsoGruppo, testoPeriodo } from '#lib/supabase/dati.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const g = $derived(data.gruppo);
	const f = $derived(data.fazzolettone);
</script>

<svelte:head><title>Storia · {g.nome} · Fazzolettoni</title></svelte:head>

<main>
	<p class="briciole">
		<a href="/">Gruppi</a> › <a href={percorsoGruppo(g)}>{g.nome}</a> ›
		<a href={percorsoFazzolettone(g, f)}>{testoPeriodo(f)}</a> › storia
	</p>
	<h1>Storia delle modifiche</h1>
	{#if form?.errore}<p class="errore">{form.errore}</p>{/if}
	{#if page.url.searchParams.get('ripristinata')}
		<p class="ok">Ripristinata la versione {page.url.searchParams.get('ripristinata')}.</p>
	{/if}
	<Storia
		revisioni={data.revisioni}
		puoRipristinare={!!data.profilo && !data.profilo.bannato}
		percorso={percorsoFazzolettone(g, f)}
	/>
</main>

<style>
	main {
		max-width: 900px;
		margin: 0 auto;
		padding: 1.2rem 1.5rem 3rem;
	}
	.briciole {
		font-size: 0.85rem;
		color: #777;
		margin: 0;
	}
	a {
		color: #2a5db0;
		text-decoration: none;
	}
	.errore {
		color: #b3261e;
	}
	.ok {
		color: #2c7a3f;
	}
</style>
