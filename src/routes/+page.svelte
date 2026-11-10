<script lang="ts">
	import Miniatura3D from '#lib/components/Miniatura3D.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let cerca = $state('');
	let associazione = $state('');

	const associazioni = $derived([...new Set(data.gruppi.map((g) => g.associazione))].sort());
	const visibili = $derived(
		data.gruppi.filter(
			(g) =>
				(!associazione || g.associazione === associazione) &&
				(!cerca.trim() || g.nome.toLowerCase().includes(cerca.trim().toLowerCase()))
		)
	);
</script>

<svelte:head><title>Fazzolettoni</title></svelte:head>

<main>
	<h1>Fazzolettoni dei gruppi scout</h1>
	<p class="intro">
		Un archivio aperto dei fazzolettoni scout italiani. Chiunque può aggiungere o correggere un
		gruppo: ogni modifica resta nello storico.
	</p>

	<div class="filtri">
		<input type="search" placeholder="Cerca un gruppo…" bind:value={cerca} />
		<select bind:value={associazione}>
			<option value="">Tutte le associazioni</option>
			{#each associazioni as a}<option value={a}>{a.toUpperCase()}</option>{/each}
		</select>
		<span class="conta">{visibili.length} gruppi</span>
		<a class="nuovo" href="/nuovo-gruppo">+ Aggiungi un gruppo</a>
	</div>

	<ul class="griglia">
		{#each visibili as g (g.id)}
			<li>
				<a href="/{g.associazione}/{g.regione_slug}/{g.slug}">
					<div class="mini">
						{#if g.design}<Miniatura3D
								design={g.design}
								id={g.id}
								associazione={g.associazione}
							/>{:else}<div class="vuoto"></div>{/if}
					</div>
					<strong>{g.nome}</strong>
					<span class="meta"
						>{g.associazione.toUpperCase()} · {g.regione}{#if !g.attivo}
							· non più attivo{/if}{#if g.n > 1}
							· {g.n} fazzolettoni{/if}</span
					>
					{#if g.daRivedere}<span class="rivedere">da rivedere</span>{/if}
				</a>
			</li>
		{/each}
	</ul>
</main>

<style>
	main {
		max-width: 1300px;
		margin: 0 auto;
		padding: 1.5rem;
	}
	h1 {
		margin: 0 0 0.3rem;
	}
	.intro {
		color: #555;
		margin: 0 0 1.2rem;
	}
	.filtri {
		display: flex;
		gap: 0.6rem;
		align-items: center;
		flex-wrap: wrap;
		margin-bottom: 1rem;
	}
	input,
	select {
		font: inherit;
		font-size: 0.9rem;
		padding: 0.4rem 0.6rem;
		border: 1px solid #ccc;
		border-radius: 6px;
		background: #fff;
	}
	input {
		min-width: 16rem;
	}
	.conta {
		color: #888;
		font-size: 0.85rem;
	}
	.nuovo {
		margin-left: auto;
		color: #2a5db0;
		text-decoration: none;
	}
	.griglia {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
		gap: 0.8rem;
	}
	.griglia a {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		background: #fff;
		border: 1px solid #e3e1dc;
		border-radius: 8px;
		padding: 0.7rem;
		text-decoration: none;
		color: inherit;
		height: 100%;
		box-sizing: border-box;
	}
	.griglia a:hover {
		border-color: #2a5db0;
	}
	.mini {
		aspect-ratio: 4 / 5;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 0.3rem;
	}
	.vuoto {
		width: 100%;
		height: 100%;
		background: #eee;
		border-radius: 4px;
	}
	strong {
		font-size: 0.92rem;
	}
	.meta {
		font-size: 0.75rem;
		color: #777;
	}
	.rivedere {
		font-size: 0.7rem;
		color: #8a5408;
	}
</style>
