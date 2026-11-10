<script lang="ts">
	import SchedaFazzolettone from '#lib/components/SchedaFazzolettone.svelte';
	import { percorsoFazzolettone, percorsoGruppo, testoPeriodo } from '#lib/supabase/dati.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const g = $derived(data.gruppo);
	const f = $derived(data.fazzolettone);
	const dati = $derived(data.versione?.dati ?? f.rev.dati);
	const base = $derived(percorsoFazzolettone(g, f));
</script>

<svelte:head><title>{g.nome} · {testoPeriodo(f)} · Fazzolettoni</title></svelte:head>

<main>
	<p class="briciole">
		<a href="/">Gruppi</a> › <a href={percorsoGruppo(g)}>{g.nome}</a> › {testoPeriodo(f)}
	</p>
	<header>
		<h1>{g.nome} <span>{testoPeriodo(f)}</span></h1>
		<nav>
			<a class="bottone" href="/editor?fazzolettone={f.id}">Modifica</a>
			<a href="{base}/storico">Storico</a>
		</nav>
	</header>
	{#if data.versione}
		<p class="vecchia">
			Stai vedendo una versione del {new Date(data.versione.creata_il).toLocaleString('it-IT')}.
			<a href={base}>Vai alla versione attuale</a> · <a href="{base}/storico">storico</a>
		</p>
	{/if}
	<article>
		<SchedaFazzolettone
			{dati}
			id="fz-{f.id}"
			nomeFile="{g.slug}-{f.slug}"
			associazione={g.associazione}
		/>
	</article>
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
	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}
	h1 span {
		font-weight: normal;
		color: #777;
		font-size: 1rem;
	}
	nav {
		display: flex;
		gap: 0.9rem;
		align-items: center;
	}
	.bottone {
		background: #2a5db0;
		color: #fff;
		padding: 0.3rem 0.8rem;
		border-radius: 6px;
	}
	.vecchia {
		background: #fff1d6;
		color: #7a4a06;
		padding: 0.5rem 0.8rem;
		border-radius: 8px;
		font-size: 0.9rem;
	}
	article {
		background: #fff;
		border: 1px solid #e3e1dc;
		border-radius: 10px;
		padding: 1rem 1.2rem;
	}
</style>
