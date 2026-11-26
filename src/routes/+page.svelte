<script lang="ts">
	import { page } from '$app/state';
	import { replaceState } from '$app/navigation';
	import Miniatura3D from '#lib/components/Miniatura3D.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	type Gruppo = (typeof data.gruppi)[number];

	type Chiave = 'regione' | 'associazione' | 'fondo' | 'stato' | 'avvisi';
	const CRITERI: Record<Chiave, string> = {
		regione: 'Regione',
		associazione: 'Associazione',
		fondo: 'Colore fondo',
		stato: 'Stato',
		avvisi: 'Avvisi'
	};
	const PREDEFINITO: Chiave[] = ['regione', 'associazione', 'fondo'];

	// stato iniziale dalla query string (?q=&ordina=regione,associazione,fondo)
	const iniziale = page.url.searchParams;
	let cerca = $state(iniziale.get('q') ?? '');
	let ordina = $state<Chiave[]>(
		(() => {
			const v = iniziale.get('ordina');
			if (v === null) return PREDEFINITO;
			return v.split(',').filter((k): k is Chiave => k in CRITERI);
		})()
	);
	const liberi = $derived((Object.keys(CRITERI) as Chiave[]).filter((k) => !ordina.includes(k)));

	$effect(() => {
		const url = new URL(page.url.href);
		const q = cerca.trim();
		if (q) url.searchParams.set('q', q);
		else url.searchParams.delete('q');
		if (ordina.join() === PREDEFINITO.join()) url.searchParams.delete('ordina');
		else url.searchParams.set('ordina', ordina.join());
		if (url.search !== page.url.search) replaceState(url, {});
	});

	const maiuscola = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
	const testo = (a: string, b: string) => a.localeCompare(b, 'it', { numeric: true });
	const confronta: Record<Chiave, (a: Gruppo, b: Gruppo) => number> = {
		regione: (a, b) => testo(a.regione, b.regione),
		associazione: (a, b) => testo(a.associazione, b.associazione),
		fondo: (a, b) =>
			a.fondo.ordine - b.fondo.ordine || testo(a.fondo.nome ?? '', b.fondo.nome ?? ''),
		stato: (a, b) => Number(b.attivo) - Number(a.attivo),
		avvisi: (a, b) => b.avvisi.length - a.avvisi.length
	};
	const etichetta: Record<Chiave, (g: Gruppo) => string> = {
		regione: (g) => g.regione,
		associazione: (g) => g.associazione.toUpperCase(),
		fondo: (g) => maiuscola(g.fondo.nome ?? 'colore sconosciuto'),
		stato: (g) => (g.attivo ? 'Attivi' : 'Non più attivi'),
		avvisi: (g) => (g.avvisi.length ? 'Da rivedere' : 'Senza avvisi')
	};

	const visibili = $derived.by(() => {
		const q = cerca.trim().toLowerCase();
		return data.gruppi
			.filter((g) => !q || g.nome.toLowerCase().includes(q))
			.sort((a, b) => {
				for (const k of ordina) {
					const d = confronta[k](a, b);
					if (d) return d;
				}
				return testo(a.nome, b.nome);
			});
	});

	// raggruppati per il primo criterio (già ordinati, quindi basta spezzare la sequenza)
	const sezioni = $derived.by(() => {
		const k = ordina[0];
		if (!k)
			return [{ titolo: null as string | null, colore: null as string | null, gruppi: visibili }];
		const out: { titolo: string | null; colore: string | null; gruppi: Gruppo[] }[] = [];
		for (const g of visibili) {
			const t = etichetta[k](g);
			const ultima = out.at(-1);
			if (ultima?.titolo === t) ultima.gruppi.push(g);
			else out.push({ titolo: t, colore: k === 'fondo' ? g.fondo.hex : null, gruppi: [g] });
		}
		return out;
	});

	function aggiungi(e: Event) {
		const sel = e.currentTarget as HTMLSelectElement;
		if (sel.value) ordina = [...ordina, sel.value as Chiave];
		sel.value = '';
	}
</script>

<svelte:head><title>Fazzolettoni</title></svelte:head>

<div class="fascia">
	<div class="strumenti">
		<label class="campo cerca">
			<span class="etichetta">Cerca</span>
			<input type="search" placeholder="Nome del gruppo…" bind:value={cerca} />
		</label>
		<div class="campo ordina">
			<span class="etichetta">Ordina per · in sequenza</span>
			<div class="catena">
				{#each ordina as k, i (k)}
					{#if i}<span class="freccia">→</span>{/if}
					<span class="chip">
						<span class="n">{i + 1}</span>
						{CRITERI[k]}
						<button
							type="button"
							aria-label="Togli {CRITERI[k]}"
							onclick={() => (ordina = ordina.filter((x) => x !== k))}>×</button
						>
					</span>
				{/each}
				{#if liberi.length}
					<select class="aggiungi" onchange={aggiungi} aria-label="Aggiungi un criterio">
						<option value="">+ aggiungi criterio</option>
						{#each liberi as k}<option value={k}>{CRITERI[k]}</option>{/each}
					</select>
				{/if}
			</div>
		</div>
		<div class="campo vista">
			<span class="etichetta">Visualizza</span>
			<div class="segmenti">
				<button type="button" class="attivo" aria-pressed="true">Griglia</button>
				<button type="button" disabled title="In futuro">Mappa</button>
				<button type="button" disabled title="In futuro">Timeline</button>
			</div>
		</div>
	</div>
</div>

<main>
	<p class="conta etichetta">
		{visibili.length}
		{visibili.length === 1 ? 'gruppo' : 'gruppi'}
		{#if data.profilo}· <a href="/nuovo-gruppo">aggiungi un gruppo</a>{/if}
	</p>

	{#each sezioni as s (s.titolo)}
		<section>
			{#if s.titolo !== null}
				<h2>
					{#if ordina[0] === 'fondo'}<span
							class="quadratino"
							class:ignoto={!s.colore}
							style:background={s.colore}
						></span>{/if}
					{s.titolo}
					<span class="etichetta">{s.gruppi.length}</span>
				</h2>
			{/if}
			<ul class="griglia">
				{#each s.gruppi as g (g.id)}
					<li class:chiuso={!g.attivo}>
						<a href="/{g.associazione}/{g.regione_slug}/{g.slug}">
							<div class="mini">
								{#if g.design}<Miniatura3D
										design={g.design}
										id={g.id}
										associazione={g.associazione}
									/>{/if}
							</div>
							<span class="nome">{g.nome}</span>
							<span class="etichetta meta"
								>{[
									g.associazione,
									g.regione,
									!g.attivo && 'non più attivo',
									g.n > 1 && `${g.n} fazzolettoni`
								]
									.filter(Boolean)
									.join(' · ')}</span
							>
							{#if g.avvisi.length}<span class="rivedere" title={g.avvisi.join('\n')}
									>da rivedere · {g.avvisi.length}
									{g.avvisi.length === 1 ? 'avviso' : 'avvisi'}</span
								>{/if}
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{:else}
		<p class="vuoto">Nessun gruppo con questo nome.</p>
	{/each}
</main>

<style>
	main {
		max-width: var(--contenitore);
		margin: 0 auto;
		padding: 0 var(--margine);
		box-sizing: border-box;
	}

	/* barra strumenti: campi separati da filetti grigi, poi un filetto d'inchiostro da bordo a bordo */
	.fascia {
		border-bottom: 1px solid var(--inchiostro);
	}
	.strumenti {
		display: flex;
		flex-wrap: wrap;
		max-width: var(--contenitore);
		margin: 0 auto;
		padding: 0 var(--margine);
		box-sizing: border-box;
	}
	.campo {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 12px 18px 14px;
		border-left: 1px solid var(--filo);
		min-width: 0;
		box-sizing: border-box;
	}
	.campo:first-child {
		border-left: 0;
		padding-left: 0;
	}
	.cerca {
		flex: 1 1 220px;
	}
	.ordina {
		flex: 2 1 380px;
	}
	.vista {
		flex: 0 0 auto;
	}
	input {
		font: inherit;
		font-size: 18px;
		border: 0;
		padding: 0;
		background: none;
		color: var(--inchiostro);
		width: 100%;
	}
	input::placeholder {
		color: var(--filo);
	}
	input:focus {
		outline: none;
	}
	.catena {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px;
	}
	.chip {
		display: inline-flex;
		align-items: baseline;
		gap: 6px;
		border: 1px solid var(--inchiostro);
		padding: 2px 4px 2px 8px;
		font-size: 13px;
		font-weight: 500;
	}
	.chip .n {
		font-size: 10px;
		color: var(--inchiostro-2);
	}
	.chip button {
		font: inherit;
		background: none;
		border: 0;
		padding: 0 4px;
		cursor: pointer;
		color: var(--inchiostro-2);
	}
	.chip button:hover {
		color: var(--cancellato);
	}
	.freccia {
		color: var(--inchiostro-2);
		font-size: 13px;
	}
	.aggiungi {
		font: inherit;
		font-size: 13px;
		border: 1px dashed var(--inchiostro-2);
		border-radius: 0;
		background: none;
		padding: 2px 6px;
		color: var(--inchiostro-2);
		cursor: pointer;
		appearance: none;
	}
	.segmenti {
		display: flex;
	}
	.segmenti button {
		font: inherit;
		font-size: 13px;
		font-weight: 500;
		border: 1px solid var(--inchiostro);
		border-radius: 0;
		background: var(--bianco);
		color: var(--inchiostro);
		padding: 3px 10px;
		cursor: pointer;
	}
	.segmenti button + button {
		border-left: 0;
	}
	.segmenti button.attivo {
		background: var(--inchiostro);
		color: var(--bianco);
	}
	.segmenti button:disabled {
		opacity: 0.4;
		cursor: default;
	}

	.conta {
		margin: 12px 0 0;
	}
	.conta a {
		color: inherit;
	}

	section {
		margin-top: 40px;
	}
	h2 {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 18px;
		font-weight: 600;
		margin: 0 0 12px;
	}
	.quadratino {
		width: 14px;
		height: 14px;
		border: 1px solid var(--inchiostro);
		box-sizing: border-box;
	}
	.quadratino.ignoto {
		--c: var(--inchiostro-2);
		background: repeating-linear-gradient(45deg, var(--c) 0 2px, transparent 2px 5px);
		border-style: dashed;
	}

	/* griglia: filetto d'inchiostro sopra, celle a filo */
	.griglia {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
		border-top: 1px solid var(--filo);
		border-left: 1px solid var(--filo);
	}
	.griglia li {
		border-right: 1px solid var(--filo);
		border-bottom: 1px solid var(--filo);
	}
	.griglia a {
		display: flex;
		flex-direction: column;
		gap: 4px;
		height: 100%;
		box-sizing: border-box;
		padding: 16px 14px 14px;
		text-decoration: none;
		color: inherit;
	}
	.griglia a:hover {
		background: var(--carta);
	}
	.mini {
		aspect-ratio: 5 / 4;
		margin-bottom: 8px;
	}
	.chiuso .mini {
		opacity: 0.55;
	}
	.nome {
		font-size: 16px;
		font-weight: 500;
		line-height: 1.2;
	}
	.meta {
		font-size: 10px;
	}
	.rivedere {
		align-self: flex-start;
		margin-top: 2px;
		font-size: 11px;
		color: var(--ocra);
		text-decoration: underline dashed;
		text-underline-offset: 3px;
	}
	.vuoto {
		margin-top: 40px;
		color: var(--inchiostro-2);
	}
	@media (max-width: 800px) {
		.campo {
			border-left: 0;
			padding-left: 0;
			padding-right: 0;
			flex-basis: 100%;
		}
		.campo + .campo {
			border-top: 1px solid var(--filo);
		}
	}
</style>
