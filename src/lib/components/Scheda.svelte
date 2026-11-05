<script lang="ts">
	import { untrack } from 'svelte';
	import type { Esempio } from '#lib/design/esempi.ts';
	import { renderDesign } from '#lib/design/render.ts';
	import type { Design } from '#lib/design/schema.ts';
	import { scaricaPng, scaricaSvg } from '#lib/design/export.ts';

	let { esempio }: { esempio: Esempio } = $props();

	// Valori iniziali: la scheda poi vive di stato proprio
	const iniziale = untrack(() => JSON.stringify(esempio.design, null, 2));
	let testo = $state(iniziale);
	let errore = $state<string | null>(null);
	let design = $state<Design>(JSON.parse(iniziale));

	function aggiorna(nuovo: string) {
		testo = nuovo;
		try {
			design = JSON.parse(nuovo);
			errore = null;
		} catch (e) {
			errore = (e as Error).message;
		}
	}

	const render = $derived.by(() => {
		try {
			return {
				fronte: renderDesign(design, { faccia: 'fronte', id: `${esempio.id}-f` }),
				retro: renderDesign(design, { faccia: 'retro', id: `${esempio.id}-r` })
			};
		} catch (e) {
			return { errore: (e as Error).message };
		}
	});
</script>

<article>
	<header>
		<h2>{esempio.gruppo}</h2>
		<span class="meta">
			{esempio.associazione} · {esempio.regione} ·
			<a href={esempio.fonte.url} target="_blank" rel="noreferrer">{esempio.fonte.tipo}</a>
		</span>
	</header>

	{#if 'errore' in render}
		<p class="errore">Errore di rendering: {render.errore}</p>
	{:else}
		<div class="facce">
			<figure class="fronte">
				{@html render.fronte.svg}
				<figcaption>fronte</figcaption>
			</figure>
			<figure class="retro">
				{@html render.retro.svg}
				<figcaption>retro</figcaption>
			</figure>
		</div>

		<p class="note">{esempio.note}</p>

		{#if render.fronte.avvisi.length}
			<details class="avvisi">
				<summary>Approssimato · {render.fronte.avvisi.length} avvisi</summary>
				<ul>
					{#each render.fronte.avvisi as a}<li>{a}</li>{/each}
				</ul>
			</details>
		{:else}
			<p class="fedele">Disegno fedele alla descrizione</p>
		{/if}

		<div class="azioni">
			<button onclick={() => scaricaSvg(render.fronte.svg, esempio.id)}>SVG</button>
			<button onclick={() => scaricaPng(render.fronte.svg, esempio.id)}>PNG</button>
		</div>
	{/if}

	<details class="json">
		<summary>Modifica JSON</summary>
		<textarea spellcheck="false" value={testo} oninput={(e) => aggiorna(e.currentTarget.value)}
		></textarea>
		{#if errore}<p class="errore">{errore}</p>{/if}
		<button onclick={() => aggiorna(iniziale)}>Ripristina</button>
	</details>
</article>

<style>
	article {
		background: #fff;
		border: 1px solid #e3e1dc;
		border-radius: 10px;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	header {
		display: flex;
		flex-direction: column;
	}
	h2 {
		margin: 0;
		font-size: 1.15rem;
	}
	.meta {
		color: #777;
		font-size: 0.85rem;
	}
	.facce {
		display: flex;
		gap: 0.75rem;
		align-items: flex-start;
	}
	figure {
		margin: 0;
		text-align: center;
	}
	.fronte {
		flex: 3;
	}
	.retro {
		flex: 1.4;
		opacity: 0.85;
	}
	figure :global(svg) {
		width: 100%;
		height: auto;
		display: block;
	}
	figcaption {
		font-size: 0.75rem;
		color: #999;
	}
	.note {
		margin: 0;
		font-size: 0.9rem;
		color: #333;
	}
	.avvisi summary {
		color: #a6650a;
		font-size: 0.85rem;
		cursor: pointer;
	}
	.avvisi ul {
		margin: 0.3rem 0 0;
		padding-left: 1.2rem;
		font-size: 0.8rem;
		color: #555;
	}
	.fedele {
		margin: 0;
		color: #2c7a3f;
		font-size: 0.85rem;
	}
	.azioni {
		display: flex;
		gap: 0.4rem;
	}
	button {
		font: inherit;
		font-size: 0.8rem;
		padding: 0.25rem 0.7rem;
		border: 1px solid #ccc;
		background: #f7f6f3;
		border-radius: 6px;
		cursor: pointer;
	}
	.json summary {
		font-size: 0.85rem;
		cursor: pointer;
		color: #555;
	}
	textarea {
		width: 100%;
		box-sizing: border-box;
		height: 18rem;
		font-family: ui-monospace, monospace;
		font-size: 0.75rem;
		margin: 0.4rem 0;
	}
	.errore {
		color: #b3261e;
		font-size: 0.8rem;
		margin: 0;
	}
</style>
