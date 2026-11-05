<script lang="ts">
	import Disegno from './Disegno.svelte';
	import { renderDesign } from '#lib/design/render.ts';
	import { scaricaPng, scaricaSvg } from '#lib/design/export.ts';
	import { ETICHETTE_CAMPI, type Campo } from '#lib/import/sicilia.ts';
	import type { DatiFazzolettone } from '#lib/supabase/tipi.ts';

	let {
		dati,
		id,
		titolo,
		nomeFile
	}: { dati: DatiFazzolettone; id: string; titolo?: string; nomeFile: string } = $props();

	const avvisi = $derived(renderDesign(dati.design, { id: `${id}-av` }).avvisi);
	const quadrato = $derived(dati.design.forma === 'quadrato');
	const originali = $derived(
		Object.entries(dati.dati_originali ?? {}).filter(
			([k, v]) => v && !['gruppo', 'foto', 'associazione', 'note_storiche'].includes(k)
		)
	);
</script>

<section class="scheda">
	{#if titolo}<h2>{titolo}</h2>{/if}
	<div class="facce" class:quadrato>
		<figure class="fronte"><Disegno design={dati.design} id="{id}-f" /></figure>
		<figure class="retro">
			<Disegno design={dati.design} faccia="retro" id="{id}-r" />
			<figcaption>retro</figcaption>
		</figure>
	</div>

	<div class="azioni">
		<button
			type="button"
			onclick={() => scaricaSvg(renderDesign(dati.design, { id: 'x' }).svg, nomeFile)}>SVG</button
		>
		<button
			type="button"
			onclick={() => scaricaPng(renderDesign(dati.design, { id: 'x' }).svg, nomeFile)}>PNG</button
		>
		{#if dati.affidabilita === 'importato'}<span class="et">importato</span>{/if}
		{#if avvisi.length}<span class="et arancio" title={avvisi.join('\n')}>disegno approssimato</span
			>{/if}
	</div>

	{#if dati.da_rivedere?.length}
		<ul class="rivedi">
			{#each dati.da_rivedere as r}<li>{r}</li>{/each}
		</ul>
	{/if}
	{#if dati.significato}<p class="significato">«{dati.significato}»</p>{/if}
	{#each dati.note ?? [] as n}<p class="nota">{n}</p>{/each}

	{#if dati.fonti?.length}
		<p class="fonti">
			Fonte:
			{#each dati.fonti as f, i}{#if i},
				{/if}{#if f.url}<a href={f.url} target="_blank" rel="noreferrer">{f.nota ?? f.tipo}</a
					>{:else}{f.nota ?? f.tipo}{/if}{/each}
		</p>
	{/if}

	{#if originali.length}
		<details>
			<summary>Descrizione originale della fonte</summary>
			<table>
				<tbody>
					{#each originali as [k, v]}
						{@const c = dati.conflitti?.find((x) => x.campo === k)}
						<tr class:conflitto={c}>
							<th>{ETICHETTE_CAMPI[k as Campo] ?? k}</th>
							<td>
								{#if c}tab. 1: {c.dettagli}<br />tab. 2: {c.supsystic}{:else}{v}{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</details>
	{/if}
	{#if avvisi.length}
		<details>
			<summary>Cosa è approssimato nel disegno</summary>
			<ul class="avvisi">
				{#each avvisi as a}<li>{a}</li>{/each}
			</ul>
		</details>
	{/if}
</section>

<style>
	.scheda {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	h2 {
		margin: 0;
		font-size: 1.05rem;
	}
	.facce {
		display: flex;
		gap: 1rem;
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
		flex: 1.2;
		opacity: 0.85;
	}
	.quadrato .retro {
		flex: 1.6;
	}
	figcaption {
		font-size: 0.72rem;
		color: #999;
	}
	.azioni {
		display: flex;
		gap: 0.4rem;
		align-items: center;
		flex-wrap: wrap;
	}
	.azioni button {
		font: inherit;
		font-size: 0.8rem;
		padding: 0.2rem 0.6rem;
		border: 1px solid #ccc;
		background: #fff;
		border-radius: 5px;
		cursor: pointer;
	}
	.et {
		font-size: 0.72rem;
		padding: 0.05rem 0.5rem;
		border-radius: 999px;
		background: #eee;
		color: #555;
	}
	.et.arancio {
		background: #fff1d6;
		color: #8a5408;
	}
	.rivedi {
		margin: 0;
		padding: 0.4rem 0.6rem 0.4rem 1.4rem;
		background: #fff8ea;
		border-radius: 6px;
		font-size: 0.85rem;
		color: #7a4a06;
	}
	.significato {
		margin: 0;
		font-style: italic;
		color: #555;
	}
	.nota,
	.fonti {
		margin: 0;
		font-size: 0.85rem;
		color: #555;
	}
	.fonti a {
		color: #2a5db0;
	}
	details summary {
		font-size: 0.85rem;
		color: #666;
		cursor: pointer;
	}
	table {
		border-collapse: collapse;
		font-size: 0.8rem;
		margin-top: 0.3rem;
	}
	th {
		text-align: left;
		font-weight: 500;
		color: #777;
		padding: 0.15rem 0.8rem 0.15rem 0;
		vertical-align: top;
	}
	tr.conflitto td {
		color: #9b2a20;
	}
	.avvisi {
		font-size: 0.8rem;
		color: #555;
	}
</style>
