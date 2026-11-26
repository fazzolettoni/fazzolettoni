<script lang="ts">
	import { page } from '$app/state';
	import Disegno from '#lib/components/Disegno.svelte';
	import SchedaFazzolettone from '#lib/components/SchedaFazzolettone.svelte';
	import { renderDesign } from '#lib/design/render.ts';
	import { DEFAULT } from '#lib/design/schema.ts';
	import { TILE } from '#lib/design/tile.svelte.ts';
	import { scaricaPng, scaricaSvg } from '#lib/design/export.ts';
	import {
		percorsoFazzolettone,
		percorsoGruppo,
		testoPeriodo,
		type FazzolettoneConDati
	} from '#lib/supabase/dati.ts';
	import { testoAttivita, testoIndirizzo } from '#lib/gruppi.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const g = $derived(data.gruppo);
	const base = $derived(percorsoGruppo(g));
	const link = $derived(g.rev?.dati.link ?? []);
	const datiGruppo = $derived(g.rev?.dati ?? null);
	const indirizzo = $derived(testoIndirizzo(datiGruppo?.indirizzo));
	const attivita = $derived(
		testoAttivita(datiGruppo ? { ...datiGruppo, attivo: g.attivo } : { attivo: g.attivo })
	);

	// periodo mostrato: ?periodo=<slug>, altrimenti quello in uso
	const scelto = $derived(
		g.fazzolettoni.find((f) => f.slug === page.url.searchParams.get('periodo')) ??
			g.fazzolettoni.find((f) => data.inUso.includes(f.id)) ??
			g.fazzolettoni[0]
	);
	const nomeFile = $derived(scelto ? `${g.slug}-${scelto.slug}` : g.slug);

	const incerto = (f: FazzolettoneConDati) =>
		!f.data_inizio || !!f.data_inizio.circa || !!f.data_fine?.circa;
	const periodoBreve = (f: FazzolettoneConDati) =>
		f.data_inizio
			? `${f.data_inizio.anno}–${f.data_fine ? f.data_fine.anno : 'oggi'}`
			: testoPeriodo(f);
	const fondo = (f: FazzolettoneConDati) =>
		f.rev.dati.design.fronte.fondo.colori[0]?.hex ?? DEFAULT.colore_sconosciuto;
	const fettuccia = (f: FazzolettoneConDati) =>
		f.rev.dati.design.fronte.fettucce[0]?.colori[0]?.hex ?? 'transparent';

	// timeline dei periodi d'uso: dal 1945 (o prima, se serve) a oggi
	const oggi = new Date().getFullYear();
	const datati = $derived(g.fazzolettoni.filter((f) => f.data_inizio));
	const inizio = $derived(
		Math.min(1945, ...datati.map((f) => Math.floor(f.data_inizio!.anno / 10) * 10))
	);
	const decenni = $derived(
		Array.from({ length: Math.floor((oggi - inizio) / 10) + 1 }, (_, i) => inizio + i * 10)
	);
	const x = (anno: number) => ((anno - inizio) / (oggi - inizio)) * 100;
	// periodi sovrapposti vanno su righe diverse
	const segmenti = $derived.by(() => {
		const fine: number[] = [];
		return [...datati]
			.sort((a, b) => a.data_inizio!.anno - b.data_inizio!.anno)
			.map((f) => {
				const da = f.data_inizio!.anno;
				const a = f.data_fine?.anno ?? oggi;
				let riga = fine.findIndex((e) => e <= da);
				if (riga < 0) riga = fine.push(0) - 1;
				fine[riga] = a;
				return { f, da, a, riga };
			});
	});
	const righe = $derived(Math.max(1, ...segmenti.map((s) => s.riga + 1)));

	const svg = () => renderDesign(scelto.rev.dati.design, { id: 'x', tile: TILE }).svg;
</script>

<svelte:head><title>{g.nome} · {g.associazione.toUpperCase()} · Fazzolettoni</title></svelte:head>

<main>
	<p class="briciole etichetta">
		<a href="/">Archivio</a> › {g.associazione} › {g.regione} › <span>{g.nome}</span>
	</p>

	<header>
		<div class="titolo">
			<p class="etichetta">
				Fazzolettone{#if scelto}&nbsp;· {periodoBreve(scelto)}{/if}
			</p>
			<h1>{g.nome}</h1>
			<p class="meta">
				{g.associazione.toUpperCase()} · {g.regione}{#if g.zona}{` · zona ${g.zona}`}{/if} ·
				<span class:chiuso={!g.attivo}>{attivita}</span>{#if indirizzo}<br />{indirizzo}{/if}
			</p>
			<p class="meta">
				{#each link as l}<a href={l.url} target="_blank" rel="noreferrer nofollow">{l.tipo}</a
					>{' · '}{/each}<a href="{base}/modifica">modifica gruppo</a> ·
				<a href="{base}/storico">storico del gruppo</a>
			</p>
		</div>
		{#if scelto}
			<div class="azioni">
				<a class="bottone primario" href="/editor?fazzolettone={scelto.id}">Modifica</a>
				<button type="button" class="bottone" onclick={() => scaricaSvg(svg(), nomeFile)}
					>SVG</button
				>
				<button type="button" class="bottone" onclick={() => scaricaPng(svg(), nomeFile)}
					>PNG</button
				>
				<p class="meta">
					<a href="{percorsoFazzolettone(g, scelto)}/storico">storico</a> ·
					<a href={percorsoFazzolettone(g, scelto)}>link permanente</a>
				</p>
			</div>
		{/if}
	</header>

	{#if segmenti.length}
		<div class="timeline" style:--righe={righe}>
			<span class="etichetta titoletto">Periodi d'uso</span>
			<div class="banda">
				{#each decenni as anno}
					<span class="decennio" style:left="{x(anno)}%"><span class="etichetta">{anno}</span></span
					>
				{/each}
				{#each segmenti as s (s.f.id)}
					<a
						class="segmento"
						class:incerto={incerto(s.f)}
						class:scelto={s.f.id === scelto?.id}
						href="?periodo={s.f.slug}"
						data-sveltekit-noscroll
						data-sveltekit-replacestate
						title={testoPeriodo(s.f)}
						style:left="{x(s.da)}%"
						style:width="max(6px, {x(s.a) - x(s.da)}%)"
						style:--riga={s.riga}
						style:--c={fondo(s.f)}
						style:--fettuccia={fettuccia(s.f)}
					></a>
				{/each}
			</div>
		</div>
	{/if}

	{#if scelto}
		{#key scelto.id}
			<SchedaFazzolettone
				dati={{ ...scelto.rev.dati, data_inizio: scelto.data_inizio, data_fine: scelto.data_fine }}
				id="g-{scelto.id}"
				associazione={g.associazione}
			/>
		{/key}
	{:else}
		<p class="vuoto">Nessun fazzolettone descritto per questo gruppo.</p>
	{/if}

	{#if g.fazzolettoni.length > 1}
		<section class="altri">
			<h2 class="etichetta">Altri fazzolettoni del gruppo</h2>
			<ul>
				{#each g.fazzolettoni as f (f.id)}
					<li class:incerto={incerto(f)} class:scelto={f.id === scelto?.id}>
						<a href="?periodo={f.slug}" data-sveltekit-noscroll data-sveltekit-replacestate>
							<div class="mini"><Disegno design={f.rev.dati.design} id="p-{f.id}" /></div>
							<span class="etichetta">{testoPeriodo(f)}</span>
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	<p class="aggiungi meta">
		<a href="/editor?gruppo={g.id}">+ Aggiungi un altro fazzolettone</a> (per esempio uno usato in passato)
	</p>
</main>

<style>
	main {
		max-width: var(--contenitore);
		margin: 0 auto;
		padding: 18px var(--margine) 0;
		box-sizing: border-box;
	}
	.briciole {
		margin: 0;
	}
	.briciole a {
		color: inherit;
		text-decoration: none;
	}
	.briciole a:hover,
	.briciole span {
		color: var(--inchiostro);
	}

	header {
		display: grid;
		grid-template-columns: repeat(12, minmax(0, 1fr));
		gap: 24px;
		padding: 56px 0 32px;
		align-items: end;
	}
	.titolo {
		grid-column: 1 / 9;
	}
	.titolo .etichetta {
		margin: 0 0 12px;
	}
	h1 {
		font-size: 80px;
		line-height: 0.95;
		font-weight: 300;
		letter-spacing: -0.035em;
		margin: 0 0 18px;
	}
	.meta {
		margin: 4px 0 0;
		font-size: 13px;
		color: var(--inchiostro-2);
	}
	.chiuso {
		color: var(--ocra);
	}
	.azioni {
		grid-column: 9 / 13;
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		justify-content: flex-end;
		align-items: center;
	}
	.azioni .meta {
		flex-basis: 100%;
		text-align: right;
	}
	@media (max-width: 800px) {
		h1 {
			font-size: 48px;
		}
		.titolo,
		.azioni {
			grid-column: 1 / -1;
			justify-content: flex-start;
		}
		.azioni .meta {
			text-align: left;
		}
	}
	.bottone {
		font: inherit;
		font-size: 12px;
		font-weight: 500;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		padding: 8px 14px;
		border: 1px solid var(--inchiostro);
		border-radius: 0;
		background: var(--bianco);
		color: var(--inchiostro);
		text-decoration: none;
		cursor: pointer;
	}
	.bottone:hover {
		background: var(--inchiostro);
		color: var(--bianco);
	}
	.bottone.primario {
		background: var(--blu-notte);
		border-color: var(--blu-notte);
		color: var(--bianco);
	}
	.bottone.primario:hover {
		background: var(--blu-notte-scuro);
	}

	/* timeline: banda tra filetto d'inchiostro e filetto chiaro, decenni puntinati */
	.timeline {
		margin-bottom: 48px;
	}
	.titoletto {
		display: block;
		margin-bottom: 6px;
	}
	.banda {
		position: relative;
		height: calc(40px + (var(--righe) - 1) * 26px);
		border-top: 1px solid var(--inchiostro);
		border-bottom: 1px solid var(--filo);
		margin-bottom: 20px;
	}
	.decennio {
		position: absolute;
		top: 0;
		bottom: 0;
		border-left: 1px dotted var(--filo-griglia);
	}
	.decennio .etichetta {
		position: absolute;
		top: 100%;
		margin-top: 4px;
		transform: translateX(-50%);
		font-size: 10px;
	}
	.segmento {
		position: absolute;
		top: calc(14px + var(--riga) * 26px);
		height: 12px;
		box-sizing: border-box;
		background: var(--c);
		border: 1px solid var(--inchiostro);
		border-top: 3px solid var(--fettuccia);
	}
	.segmento.incerto {
		background: repeating-linear-gradient(45deg, var(--c) 0 2px, transparent 2px 5px);
		border-style: dashed;
		border-top-style: solid;
	}
	.segmento.scelto {
		top: calc(8px + var(--riga) * 26px);
		height: 24px;
		outline: 1px solid var(--inchiostro);
		outline-offset: 2px;
	}

	.vuoto {
		color: var(--inchiostro-2);
	}

	.altri {
		margin-top: 56px;
		border-top: 1px solid var(--inchiostro);
		padding-top: 12px;
	}
	.altri h2 {
		margin: 0 0 12px;
	}
	.altri ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		border-left: 1px solid var(--filo);
		border-top: 1px solid var(--filo);
	}
	.altri li {
		border-right: 1px solid var(--filo);
		border-bottom: 1px solid var(--filo);
	}
	.altri li.incerto {
		border-top: 1px dashed var(--inchiostro);
		margin-top: -1px;
	}
	.altri a {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 14px;
		color: inherit;
		text-decoration: none;
		height: 100%;
		box-sizing: border-box;
	}
	.altri a:hover,
	.altri li.scelto a {
		background: var(--carta);
	}
	.mini {
		aspect-ratio: 16 / 10;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.mini :global(.disegno) {
		width: 100%;
	}
	.aggiungi {
		margin-top: 32px;
	}
</style>
