<script lang="ts">
	import Disegno from './Disegno.svelte';
	import { renderDesign } from '#lib/design/render.ts';
	import { scaricaPng, scaricaSvg } from '#lib/design/export.ts';
	import { ETICHETTE_CAMPI, type Campo } from '#lib/import/sicilia.ts';
	import type { DatiFazzolettone } from '#lib/supabase/tipi.ts';
	import { linkSicuro, testoFonte } from '#lib/fonti.ts';

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
	<div class="visuale">
		<!-- three.js si scarica a parte, solo nelle pagine che lo mostrano -->
		<div class="tre">
			{#await import('./Fazzolettone3D.svelte') then m}
				<m.default design={dati.design} />
			{/await}
			<span class="aiuto">trascina per ruotare · rotella per lo zoom</span>
		</div>
		<div class="facce" class:quadrato>
			<figure class="fronte">
				<Disegno design={dati.design} id="{id}-f" />
				<figcaption>fronte, steso</figcaption>
			</figure>
			<figure class="retro">
				<Disegno design={dati.design} faccia="retro" id="{id}-r" />
				<figcaption>retro</figcaption>
			</figure>
		</div>
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
			{dati.fonti.length > 1 ? 'Fonti' : 'Fonte'}:
			{#each dati.fonti as f, i}{#if i};
				{/if}{@const link = linkSicuro(f.url)}{#if link}<a
						href={link}
						target="_blank"
						rel="noreferrer nofollow">{testoFonte(f)}</a
					>{:else}{testoFonte(f)}{/if}{/each}
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
	.visuale {
		display: grid;
		grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
		gap: 1rem;
		align-items: center;
	}
	@media (max-width: 700px) {
		.visuale {
			grid-template-columns: 1fr;
		}
	}
	.tre {
		position: relative;
		height: min(65vh, 520px);
		background: #ece9e3;
		border-radius: 10px;
		overflow: hidden;
	}
	.aiuto {
		position: absolute;
		bottom: 0.4rem;
		left: 0;
		right: 0;
		text-align: center;
		font-size: 0.7rem;
		color: #888;
		pointer-events: none;
	}
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
		flex-direction: column;
		gap: 1rem;
		align-items: center;
	}
	figure {
		margin: 0;
		text-align: center;
	}
	.fronte {
		width: 100%;
	}
	.retro {
		width: 45%;
		opacity: 0.85;
	}
	.quadrato .fronte,
	.quadrato .retro {
		width: 60%;
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
