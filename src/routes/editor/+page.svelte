<script lang="ts">
	import { page } from '$app/state';
	import FacciaEditor from '#lib/components/editor/FacciaEditor.svelte';
	import MisuraCm from '#lib/components/editor/MisuraCm.svelte';
	import { STIMA_COLORI } from '#lib/design/colori.ts';
	import { ESEMPI } from '#lib/design/esempi.ts';
	import { SCHEDE_SICILIA } from '#lib/import/index.ts';
	import { scaricaPng, scaricaSvg } from '#lib/design/export.ts';
	import { cambiaForma, nuovoDesign } from '#lib/design/nuovo.ts';
	import { renderDesign } from '#lib/design/render.ts';
	import { DEFAULT, type Design, type Forma } from '#lib/design/schema.ts';

	const CHIAVE_BOZZA = 'fazzolettoni:bozza';

	function iniziale(): { design: Design; nome: string } {
		const da = page.url.searchParams.get('da');
		const es = da ? ESEMPI.find((e) => e.id === da) : undefined;
		if (es) return { design: structuredClone(es.design), nome: es.gruppo };
		const si = page.url.searchParams.get('sicilia');
		const sc = si ? SCHEDE_SICILIA.find((s) => s.gruppo.id === si) : undefined;
		if (sc) return { design: structuredClone(sc.conversione.design), nome: sc.gruppo.nome };
		try {
			const salvata = localStorage.getItem(CHIAVE_BOZZA);
			if (salvata) return JSON.parse(salvata);
		} catch {
			// bozza illeggibile: si riparte da zero
		}
		return { design: nuovoDesign(), nome: '' };
	}

	const partenza = iniziale();
	let design = $state<Design>(partenza.design);
	let nome = $state(partenza.nome);
	let lato = $state<'fronte' | 'retro'>('fronte');

	// Bozza salvata automaticamente nel browser
	$effect(() => {
		localStorage.setItem(CHIAVE_BOZZA, JSON.stringify({ design: $state.snapshot(design), nome }));
	});

	const forma = $derived<Forma>(design.forma ?? DEFAULT.forma);
	const fronte = $derived(renderDesign(design, { faccia: 'fronte', id: 'ed-f' }));
	const retro = $derived(renderDesign(design, { faccia: 'retro', id: 'ed-r' }));
	const fileNome = $derived(
		(nome || 'fazzolettone')
			.toLowerCase()
			.normalize('NFD')
			.replace(/[̀-ͯ]/g, '')
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '')
	);

	function nuovo() {
		if (!confirm('Ricominciare da un fazzolettone nuovo? La bozza attuale verrà persa.')) return;
		design = nuovoDesign();
		nome = '';
		lato = 'fronte';
	}

	function carica(id: string) {
		const es = ESEMPI.find((e) => e.id === id);
		if (!es) return;
		design = structuredClone(es.design);
		nome = es.gruppo;
		lato = 'fronte';
	}

	function impostaRetro(personalizzato: boolean) {
		design.retro = personalizzato ? $state.snapshot(design.fronte) : null;
		lato = personalizzato ? 'retro' : 'fronte';
	}

	let testoJson = $state('');
	let erroreJson = $state<string | null>(null);
	function importaJson() {
		try {
			design = JSON.parse(testoJson);
			erroreJson = null;
		} catch (e) {
			erroreJson = (e as Error).message;
		}
	}
</script>

<svelte:head>
	<title>Editor · Fazzolettoni</title>
</svelte:head>

<datalist id="nomi-colori">
	{#each Object.keys(STIMA_COLORI) as n}<option value={n}></option>{/each}
</datalist>

<div class="pagina">
	<header class="barra">
		<a href="/">← Galleria</a>
		<input
			class="nome"
			type="text"
			bind:value={nome}
			placeholder="Nome del gruppo (es. Rosolini 1)"
		/>
		<select onchange={(e) => (carica(e.currentTarget.value), (e.currentTarget.value = ''))}>
			<option value="">Carica un esempio…</option>
			{#each ESEMPI as e}<option value={e.id}>{e.gruppo}</option>{/each}
		</select>
		<button type="button" onclick={nuovo}>Nuovo</button>
	</header>

	<div class="layout">
		<aside class="anteprima">
			<div class="facce" class:quadrato={forma === 'quadrato'}>
				<figure class="fronte">
					{@html fronte.svg}
					<figcaption>fronte</figcaption>
				</figure>
				<figure class="retro">
					{@html retro.svg}
					<figcaption>retro</figcaption>
				</figure>
			</div>
			{#if fronte.avvisi.length}
				<details class="avvisi">
					<summary>Approssimato · {fronte.avvisi.length} avvisi</summary>
					<ul>
						{#each fronte.avvisi as a}<li>{a}</li>{/each}
					</ul>
				</details>
			{:else}
				<p class="fedele">Disegno fedele alla descrizione</p>
			{/if}
			<div class="azioni">
				<button type="button" onclick={() => scaricaSvg(fronte.svg, fileNome)}>Scarica SVG</button>
				<button type="button" onclick={() => scaricaPng(fronte.svg, fileNome)}>Scarica PNG</button>
				{#if forma === 'quadrato'}
					<button type="button" onclick={() => scaricaSvg(retro.svg, `${fileNome}-retro`)}
						>SVG retro</button
					>
				{/if}
			</div>
		</aside>

		<main class="controlli">
			<section>
				<h3>Forma</h3>
				<div class="riga">
					<div class="tipi">
						{#each ['triangolo', 'quadrato'] as f}
							<label class:attivo={forma === f}>
								<input
									type="radio"
									name="forma"
									checked={forma === f}
									onchange={() => cambiaForma(design, f as Forma)}
								/>
								{f === 'triangolo' ? '◣ triangolare' : '◼ quadrato'}
							</label>
						{/each}
					</div>
					{#if forma === 'triangolo'}
						<MisuraCm
							etichetta="Cateto (lato corto)"
							segnaposto="std {DEFAULT.cateto_mm / 10}"
							bind:mm={
								() => design.dimensioni_mm?.cateto ?? null,
								(v) => (design.dimensioni_mm = v == null ? null : { cateto: v })
							}
						/>
					{:else}
						<MisuraCm
							etichetta="Lato"
							segnaposto="std {DEFAULT.lato_mm / 10}"
							bind:mm={
								() => design.dimensioni_mm?.lato ?? null,
								(v) => (design.dimensioni_mm = v == null ? null : { lato: v })
							}
						/>
					{/if}
				</div>
				{#if forma === 'triangolo'}
					<p class="nota">Nel triangolare il retro mostra solo il colore di fondo.</p>
				{:else}
					<div class="riga">
						<label class="check">
							<input
								type="checkbox"
								checked={!!design.retro}
								onchange={(e) => impostaRetro(e.currentTarget.checked)}
							/>
							retro diverso dal fronte
						</label>
						{#if design.retro}
							<div class="tipi">
								{#each ['fronte', 'retro'] as l}
									<label class:attivo={lato === l}>
										<input
											type="radio"
											name="lato"
											checked={lato === l}
											onchange={() => (lato = l as 'fronte' | 'retro')}
										/>
										modifica {l}
									</label>
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			</section>

			{#if lato === 'retro' && design.retro}
				<FacciaEditor bind:faccia={design.retro} {forma} chiave="retro" />
			{:else}
				<FacciaEditor bind:faccia={design.fronte} {forma} chiave="fronte" />
			{/if}

			<details class="json">
				<summary>JSON (avanzato)</summary>
				<pre>{JSON.stringify(design, null, 2)}</pre>
				<textarea
					bind:value={testoJson}
					spellcheck="false"
					placeholder="Incolla qui un JSON per importarlo"></textarea>
				{#if erroreJson}<p class="errore">{erroreJson}</p>{/if}
				<button type="button" onclick={importaJson} disabled={!testoJson.trim()}>Importa</button>
			</details>
		</main>
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		background: #f4f2ee;
		font-family:
			system-ui,
			-apple-system,
			sans-serif;
		color: #222;
	}
	.pagina {
		max-width: 1300px;
		margin: 0 auto;
		padding: 0.8rem 1rem 3rem;
	}
	.barra {
		display: flex;
		gap: 0.6rem;
		align-items: center;
		flex-wrap: wrap;
		margin-bottom: 0.8rem;
	}
	.barra a {
		color: #2a5db0;
		text-decoration: none;
		font-size: 0.9rem;
	}
	.barra .nome {
		flex: 1;
		min-width: 12rem;
		font: inherit;
		font-size: 1.1rem;
		font-weight: 600;
		padding: 0.35rem 0.5rem;
		border: 1px solid #ccc;
		border-radius: 6px;
	}
	.barra select,
	.barra button,
	.azioni button,
	.json button {
		font: inherit;
		font-size: 0.85rem;
		padding: 0.35rem 0.7rem;
		border: 1px solid #ccc;
		background: #fff;
		border-radius: 6px;
		cursor: pointer;
	}
	.layout {
		display: grid;
		grid-template-columns: minmax(0, 1.2fr) minmax(320px, 1fr);
		gap: 1.2rem;
		align-items: start;
	}
	.anteprima {
		position: sticky;
		top: 0.8rem;
		background: #fff;
		border: 1px solid #e3e1dc;
		border-radius: 10px;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
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
	.facce.quadrato .retro {
		flex: 1.6;
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
		flex-wrap: wrap;
	}
	.controlli {
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
	}
	section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	h3 {
		margin: 0;
		font-size: 0.95rem;
	}
	.riga {
		display: flex;
		gap: 1rem;
		align-items: flex-end;
		flex-wrap: wrap;
	}
	.tipi {
		display: flex;
		gap: 0.3rem;
		flex-wrap: wrap;
	}
	.tipi label {
		font-size: 0.85rem;
		padding: 0.3rem 0.7rem;
		border: 1px solid #ccc;
		border-radius: 999px;
		cursor: pointer;
		background: #fff;
	}
	.tipi label.attivo {
		border-color: #2a5db0;
		background: #eaf1fc;
		color: #1d4688;
	}
	.tipi input {
		display: none;
	}
	.check {
		font-size: 0.9rem;
	}
	.nota {
		margin: 0;
		font-size: 0.8rem;
		color: #888;
	}
	.json summary {
		font-size: 0.85rem;
		color: #555;
		cursor: pointer;
	}
	.json pre {
		max-height: 16rem;
		overflow: auto;
		background: #fff;
		border: 1px solid #e3e1dc;
		border-radius: 6px;
		padding: 0.5rem;
		font-size: 0.72rem;
	}
	.json textarea {
		width: 100%;
		box-sizing: border-box;
		height: 6rem;
		font-family: ui-monospace, monospace;
		font-size: 0.75rem;
	}
	.errore {
		color: #b3261e;
		font-size: 0.8rem;
		margin: 0;
	}

	/* Telefono: anteprima in alto, compatta, controlli sotto */
	@media (max-width: 760px) {
		.layout {
			grid-template-columns: 1fr;
		}
		.anteprima {
			top: 0;
			z-index: 2;
			border-radius: 0 0 10px 10px;
			padding: 0.6rem;
		}
		.avvisi,
		.fedele,
		.azioni {
			display: none;
		}
	}
</style>
