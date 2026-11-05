<script lang="ts">
	import type { SchedaSicilia } from '#lib/import/index.ts';
	import { ETICHETTE_CAMPI, vuoto, type Campo } from '#lib/import/sicilia.ts';
	import { renderDesign } from '#lib/design/render.ts';

	let { scheda }: { scheda: SchedaSicilia } = $props();

	const g = $derived(scheda.gruppo);
	const conv = $derived(scheda.conversione);
	const fronte = $derived(renderDesign(conv.design, { faccia: 'fronte', id: `si-${g.id}-f` }));
	const retro = $derived(renderDesign(conv.design, { faccia: 'retro', id: `si-${g.id}-r` }));

	const DESCRITTIVI: Campo[] = [
		'colore_base',
		'distribuzione',
		'colore_fettuccia',
		'numero_fettucce',
		'bordatura',
		'larghezza',
		'distanza',
		'lati_corti',
		'incrociata',
		'logo',
		'forma',
		'lato_corto',
		'stoffa',
		'tipo_fettuccia',
		'precedenti'
	];
	const campi = $derived(DESCRITTIVI.filter((c) => !vuoto(g.campi[c])));
	const conflitto = (c: Campo) => g.conflitti.find((x) => x.campo === c);
	const attivo = $derived(!/^no$/i.test(g.campi.esistenza ?? ''));
	const significato = $derived(vuoto(g.campi.note_storiche) ? null : g.campi.note_storiche);
</script>

<article class:rivedere={conv.daRivedere.length > 0}>
	<header>
		<h2>
			{g.nome}{#if g.variante}<small> ({g.variante})</small>{/if}
		</h2>
		<div class="etichette">
			<span class="et">{g.campi.associazione ?? '?'}</span>
			{#if !attivo}<span class="et grigia">non più attivo</span>{/if}
			{#if conv.metodo === 'manuale'}<span class="et blu" title="Testo libero interpretato a mano"
					>interpretato</span
				>{/if}
			{#if g.conflitti.length}<span class="et rossa">{g.conflitti.length} conflitti</span>{/if}
			{#if conv.daRivedere.length}<span class="et arancio">da rivedere</span>{/if}
		</div>
	</header>

	<div class="facce" class:quadrato={conv.design.forma === 'quadrato'}>
		<figure class="fronte">{@html fronte.svg}</figure>
		<figure class="retro">
			{@html retro.svg}
			<figcaption>retro</figcaption>
		</figure>
	</div>

	{#if conv.daRivedere.length}
		<ul class="rivedi">
			{#each conv.daRivedere as r}<li>{r}</li>{/each}
		</ul>
	{/if}
	{#each conv.note as n}<p class="nota">{n}</p>{/each}
	{#if significato}<p class="significato">«{significato}»</p>{/if}

	<details>
		<summary>Dati originali ({campi.length} campi)</summary>
		<table>
			<tbody>
				{#each campi as c}
					{@const x = conflitto(c)}
					<tr class:conflitto={x}>
						<th>{ETICHETTE_CAMPI[c]}</th>
						<td>
							{#if x}
								<span class="fonte">tab. 1</span>
								{x.dettagli}<br />
								<span class="fonte">tab. 2</span>
								{x.supsystic}
							{:else}
								{g.campi[c]}
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
		{#if fronte.avvisi.length}
			<p class="avvisi-t">Avvisi del disegno</p>
			<ul class="avvisi">
				{#each fronte.avvisi as a}<li>{a}</li>{/each}
			</ul>
		{/if}
	</details>

	<footer>
		{#if g.campi.foto && /^https:\/\//.test(g.campi.foto)}
			<a href={g.campi.foto} target="_blank" rel="noreferrer">Foto originale ↗</a>
		{/if}
		<a class="apri" href="/editor?sicilia={g.id}">Apri nell'editor →</a>
	</footer>
</article>

<style>
	article {
		background: #fff;
		border: 1px solid #e3e1dc;
		border-radius: 10px;
		padding: 0.9rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	article.rivedere {
		border-color: #f0c98a;
	}
	header {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}
	h2 {
		margin: 0;
		font-size: 1.05rem;
	}
	h2 small {
		color: #888;
		font-weight: normal;
	}
	.etichette {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}
	.et {
		font-size: 0.7rem;
		padding: 0.05rem 0.45rem;
		border-radius: 999px;
		background: #eee;
		color: #555;
	}
	.et.grigia {
		background: #ddd;
	}
	.et.blu {
		background: #e3ecfb;
		color: #1d4688;
	}
	.et.rossa {
		background: #fbe4e2;
		color: #9b2a20;
	}
	.et.arancio {
		background: #fff1d6;
		color: #8a5408;
	}
	.facce {
		display: flex;
		gap: 0.6rem;
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
	figure :global(svg) {
		width: 100%;
		height: auto;
		display: block;
	}
	figcaption {
		font-size: 0.7rem;
		color: #999;
	}
	.rivedi {
		margin: 0;
		padding: 0.4rem 0.6rem 0.4rem 1.4rem;
		background: #fff8ea;
		border-radius: 6px;
		font-size: 0.8rem;
		color: #7a4a06;
	}
	.nota {
		margin: 0;
		font-size: 0.82rem;
		color: #444;
	}
	.significato {
		margin: 0;
		font-size: 0.82rem;
		color: #666;
		font-style: italic;
	}
	details summary {
		font-size: 0.8rem;
		color: #666;
		cursor: pointer;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.78rem;
		margin-top: 0.3rem;
	}
	th {
		text-align: left;
		font-weight: 500;
		color: #777;
		width: 40%;
		vertical-align: top;
		padding: 0.15rem 0.4rem 0.15rem 0;
	}
	td {
		padding: 0.15rem 0;
	}
	tr.conflitto td {
		color: #9b2a20;
	}
	.fonte {
		font-size: 0.68rem;
		color: #999;
	}
	.avvisi-t {
		margin: 0.5rem 0 0;
		font-size: 0.75rem;
		color: #a6650a;
	}
	.avvisi {
		margin: 0.2rem 0 0;
		padding-left: 1.1rem;
		font-size: 0.75rem;
		color: #555;
	}
	footer {
		display: flex;
		justify-content: space-between;
		font-size: 0.82rem;
		margin-top: auto;
	}
	footer a {
		color: #2a5db0;
		text-decoration: none;
	}
	.apri {
		margin-left: auto;
	}
</style>
