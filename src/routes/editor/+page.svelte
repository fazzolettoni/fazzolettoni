<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import PannelloSalva from '#lib/components/editor/PannelloSalva.svelte';
	import { supabaseBrowser } from '#lib/supabase/browser.ts';
	import { percorsoFazzolettone, percorsoGruppo } from '#lib/supabase/dati.ts';
	import type { DatiFazzolettone, Gruppo } from '#lib/supabase/tipi.ts';
	import FacciaEditor from '#lib/components/editor/FacciaEditor.svelte';
	import MisuraCm from '#lib/components/editor/MisuraCm.svelte';
	import { STIMA_COLORI } from '#lib/design/colori.ts';
	import { ESEMPI } from '#lib/design/esempi.ts';
	import { scaricaPng, scaricaSvg } from '#lib/design/export.ts';
	import { cambiaForma, nuovoDesign } from '#lib/design/nuovo.ts';
	import { renderDesign } from '#lib/design/render.ts';
	import { TILE, richiediTile } from '#lib/design/tile.svelte.ts';
	import { DEFAULT, normalizzaDesign, type Design, type Forma } from '#lib/design/schema.ts';

	// Contesto: un fazzolettone esistente (?fazzolettone=id) o uno nuovo per un gruppo (?gruppo=id)
	const idFazzolettone = page.url.searchParams.get('fazzolettone');
	const idGruppo = page.url.searchParams.get('gruppo');
	type GruppoBreve = Pick<Gruppo, 'id' | 'nome' | 'associazione' | 'regione_slug' | 'slug'>;
	let contesto = $state<{ gruppo: GruppoBreve; base: DatiFazzolettone | null } | null>(null);
	let erroreCaricamento = $state<string | null>(null);
	let bozzaRipresa = $state(false);

	// Una bozza per ogni fazzolettone, così aprirne un altro non cancella il lavoro
	const CHIAVE_BOZZA = idFazzolettone
		? `fazzolettoni:bozza:f:${idFazzolettone}`
		: idGruppo
			? `fazzolettoni:bozza:g:${idGruppo}`
			: 'fazzolettoni:bozza';
	const leggiBozza = (): { design: Design; nome: string } | null => {
		try {
			const s = localStorage.getItem(CHIAVE_BOZZA);
			return s ? JSON.parse(s) : null;
		} catch {
			return null;
		}
	};

	function iniziale(): { design: Design; nome: string } {
		if (idFazzolettone || idGruppo) return { design: nuovoDesign(), nome: '' };
		const da = page.url.searchParams.get('da');
		const es = da ? ESEMPI.find((e) => e.id === da) : undefined;
		if (es) return { design: structuredClone(es.design), nome: es.gruppo };
		try {
			const salvata = localStorage.getItem(CHIAVE_BOZZA);
			if (salvata) return JSON.parse(salvata);
		} catch {
			// bozza illeggibile: si riparte da zero
		}
		return { design: nuovoDesign(), nome: '' };
	}

	const partenza = iniziale();
	let design = $state<Design>(normalizzaDesign(partenza.design));
	let nome = $state(partenza.nome);
	let lato = $state<'fronte' | 'retro'>('fronte');
	// Finché il fazzolettone arriva dal database, non salvare bozze
	let pronto = $state(!idFazzolettone && !idGruppo);

	async function caricaContesto() {
		const db = supabaseBrowser();
		const campiGruppo = 'id, nome, associazione, regione_slug, slug';
		if (idFazzolettone) {
			const { data } = await db
				.from('fazzolettoni')
				.select(`id, rev:revisione_corrente(dati), gruppo:gruppo_id(${campiGruppo})`)
				.eq('id', idFazzolettone)
				.maybeSingle();
			if (!data) return (erroreCaricamento = 'Fazzolettone non trovato');
			const base = (data.rev as unknown as { dati: DatiFazzolettone }).dati;
			contesto = { gruppo: data.gruppo as unknown as GruppoBreve, base };
			design = normalizzaDesign(base.design);
		} else if (idGruppo) {
			const { data } = await db.from('gruppi').select(campiGruppo).eq('id', idGruppo).maybeSingle();
			if (!data) return (erroreCaricamento = 'Gruppo non trovato');
			contesto = { gruppo: data as GruppoBreve, base: null };
		}
		nome = contesto?.gruppo.nome ?? '';
		const bozza = leggiBozza();
		if (bozza) {
			design = normalizzaDesign(bozza.design);
			bozzaRipresa = true;
		}
		pronto = true;
	}
	if (idFazzolettone || idGruppo) caricaContesto();

	function scartaBozza() {
		localStorage.removeItem(CHIAVE_BOZZA);
		bozzaRipresa = false;
		design = contesto?.base ? normalizzaDesign(contesto.base.design) : nuovoDesign();
	}

	// Bozza salvata automaticamente nel browser
	$effect(() => {
		const snap = { design: $state.snapshot(design), nome };
		if (pronto) localStorage.setItem(CHIAVE_BOZZA, JSON.stringify(snap));
	});

	async function salvato(id: string) {
		localStorage.removeItem(CHIAVE_BOZZA);
		const { data } = await supabaseBrowser()
			.from('fazzolettoni')
			.select('slug, gruppo:gruppo_id(associazione, regione_slug, slug)')
			.eq('id', id)
			.single();
		goto(data ? percorsoFazzolettone(data.gruppo as unknown as Gruppo, data) : '/');
	}

	const forma = $derived<Forma>(design.forma ?? DEFAULT.forma);
	const fronte = $derived(renderDesign(design, { faccia: 'fronte', id: 'ed-f', tile: TILE }));
	const retro = $derived(renderDesign(design, { faccia: 'retro', id: 'ed-r', tile: TILE }));
	$effect(() => richiediTile($state.snapshot(design) as typeof design));
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
			design = normalizzaDesign(JSON.parse(testoJson));
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
	{#if contesto}
		<header class="barra">
			<a href={percorsoGruppo(contesto.gruppo)}>← {contesto.gruppo.nome}</a>
			<h1>
				{idFazzolettone ? 'Modifica il fazzolettone' : 'Nuovo fazzolettone'} di {contesto.gruppo
					.nome}
			</h1>
		</header>
		{#if bozzaRipresa}
			<p class="bozza">
				Hai ripreso una bozza non salvata di questo fazzolettone.
				<button type="button" onclick={scartaBozza}>Scarta la bozza</button>
			</p>
		{/if}
	{:else if erroreCaricamento}
		<p class="bozza">{erroreCaricamento}</p>
	{:else if !idFazzolettone && !idGruppo}
		<header class="barra">
			<a href="/">← Gruppi</a>
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
		<p class="bozza">
			Editor libero: per salvare nell'archivio apri il fazzolettone dalla pagina del suo gruppo.
		</p>
	{/if}

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
			{#if contesto}<a class="vai-salva" href="#salva">Salva nell'archivio ↓</a>{/if}
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

			{#if contesto}
				<div id="salva">
					<PannelloSalva
						design={$state.snapshot(design)}
						fazzolettoneId={idFazzolettone}
						gruppoId={contesto.gruppo.id}
						base={contesto.base}
						onsalvato={salvato}
					/>
				</div>
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
	.barra h1 {
		margin: 0;
		font-size: 1.15rem;
	}
	.vai-salva {
		color: #2a5db0;
		font-size: 0.88rem;
		text-decoration: none;
	}
	.bozza {
		background: #fff1d6;
		color: #7a4a06;
		padding: 0.5rem 0.8rem;
		border-radius: 8px;
		font-size: 0.88rem;
		margin: 0 0 0.8rem;
	}
	.bozza button {
		font: inherit;
		font-size: 0.82rem;
		margin-left: 0.5rem;
		padding: 0.15rem 0.6rem;
		border: 1px solid #e0a640;
		border-radius: 5px;
		background: #fff;
		cursor: pointer;
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
