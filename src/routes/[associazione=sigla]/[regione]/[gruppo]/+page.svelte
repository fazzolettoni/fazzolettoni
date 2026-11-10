<script lang="ts">
	import Disegno from '#lib/components/Disegno.svelte';
	import SchedaFazzolettone from '#lib/components/SchedaFazzolettone.svelte';
	import { percorsoFazzolettone, percorsoGruppo, testoPeriodo } from '#lib/supabase/dati.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const g = $derived(data.gruppo);
	const base = $derived(percorsoGruppo(g));
	const inUso = $derived(g.fazzolettoni.filter((f) => data.inUso.includes(f.id)));
	const altri = $derived(g.fazzolettoni.filter((f) => !data.inUso.includes(f.id)));
	const link = $derived(g.rev?.dati.link ?? []);
</script>

<svelte:head><title>{g.nome} · {g.associazione.toUpperCase()} · Fazzolettoni</title></svelte:head>

<main>
	<p class="briciole">
		<a href="/">Gruppi</a> › {g.associazione.toUpperCase()} › {g.regione}
	</p>
	<header>
		<div>
			<h1>{g.nome}</h1>
			<p class="meta">
				{g.associazione.toUpperCase()} · {g.regione}{#if g.zona}{` · zona ${g.zona}`}{/if}
				{#if !g.attivo}<span class="et">non più attivo</span>{/if}
			</p>
			{#if link.length}
				<p class="link">
					{#each link as l, i}{#if i}
							·
						{/if}<a href={l.url} target="_blank" rel="noreferrer nofollow">{l.tipo}</a>{/each}
				</p>
			{/if}
		</div>
		<nav>
			<a href="{base}/modifica">Modifica gruppo</a>
			<a href="{base}/storico">Storico del gruppo</a>
		</nav>
	</header>

	{#each inUso as f (f.id)}
		<article class="principale">
			<div class="testa">
				<h2>
					{inUso.length > 1 || altri.length ? 'Fazzolettone' : 'Il fazzolettone'}
					<span class="periodo">{testoPeriodo(f)}</span>
				</h2>
				<nav>
					<a class="bottone" href="/editor?fazzolettone={f.id}">Modifica</a>
					<a href="{percorsoFazzolettone(g, f)}/storico">Storico</a>
					<a href={percorsoFazzolettone(g, f)}>Link</a>
				</nav>
			</div>
			<SchedaFazzolettone
				dati={f.rev.dati}
				id="g-{f.id}"
				nomeFile="{g.slug}-{f.slug}"
				associazione={g.associazione}
			/>
		</article>
	{:else}
		<p class="vuoto">Nessun fazzolettone descritto per questo gruppo.</p>
	{/each}

	{#if altri.length}
		<h2 class="sezione">Fazzolettoni precedenti</h2>
		<ul class="precedenti">
			{#each altri as f (f.id)}
				<li>
					<a href={percorsoFazzolettone(g, f)}>
						<Disegno design={f.rev.dati.design} id="p-{f.id}" />
						<span>{testoPeriodo(f)}</span>
					</a>
				</li>
			{/each}
		</ul>
	{/if}

	<p class="aggiungi">
		<a href="/editor?gruppo={g.id}">+ Aggiungi un altro fazzolettone</a> (per esempio uno usato in passato)
	</p>
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
	.briciole a,
	nav a,
	.link a,
	.aggiungi a {
		color: #2a5db0;
		text-decoration: none;
	}
	header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		flex-wrap: wrap;
	}
	h1 {
		margin: 0.3rem 0 0.2rem;
	}
	.meta,
	.link {
		margin: 0;
		color: #666;
		font-size: 0.9rem;
	}
	nav {
		display: flex;
		gap: 0.9rem;
		align-items: center;
		font-size: 0.9rem;
	}
	.et {
		font-size: 0.72rem;
		padding: 0.05rem 0.5rem;
		border-radius: 999px;
		background: #ddd;
		color: #555;
		margin-left: 0.3rem;
	}
	.principale {
		background: #fff;
		border: 1px solid #e3e1dc;
		border-radius: 10px;
		padding: 1rem 1.2rem;
		margin-top: 1.2rem;
	}
	.testa {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.6rem;
		gap: 1rem;
		flex-wrap: wrap;
	}
	.testa h2 {
		margin: 0;
		font-size: 1.1rem;
	}
	.periodo {
		font-weight: normal;
		color: #777;
		font-size: 0.9rem;
		margin-left: 0.4rem;
	}
	.bottone {
		background: #2a5db0;
		color: #fff !important;
		padding: 0.3rem 0.8rem;
		border-radius: 6px;
	}
	.sezione {
		font-size: 1rem;
		margin: 1.6rem 0 0.6rem;
	}
	.precedenti {
		list-style: none;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		gap: 0.8rem;
	}
	.precedenti a {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		background: #fff;
		border: 1px solid #e3e1dc;
		border-radius: 8px;
		padding: 0.6rem;
		text-decoration: none;
		color: #555;
		font-size: 0.85rem;
	}
	.vuoto {
		color: #777;
		margin-top: 1.5rem;
	}
	.aggiungi {
		margin-top: 1.5rem;
		font-size: 0.9rem;
		color: #777;
	}
</style>
