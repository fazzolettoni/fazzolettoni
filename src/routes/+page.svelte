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
	const PREDEFINITO: Chiave[] = ['regione', 'associazione'];

	// stato iniziale dalla query string (?q=&ordina=regione,associazione)
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
	type Sezione = { titolo: string | null; colore: string | null; gruppi: Gruppo[] };
	const sezioni = $derived.by(() => {
		const k = ordina[0];
		if (!k) return [{ titolo: null, colore: null, gruppi: visibili }] as Sezione[];
		const out: Sezione[] = [];
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

<main>
	{#if !data.profilo}
		<p class="intro">
			Archivio fazzolettoni è un progetto pensato per raccogliere informazioni sui fazzolettoni dei
			gruppi scout di oggi e del passato. Chiunque può contribuire: cliccando su
			<a href="/accedi">Accedi</a> puoi creare la tua utenza e inserire e modificare gruppi e fazzolettoni.
		</p>
	{/if}
	<div class="filtri">
		<input type="search" placeholder="Cerca un gruppo…" bind:value={cerca} />
		<span class="ordina">
			<span class="titoletto">Ordina per</span>
			{#each ordina as k, i (k)}
				{#if i}<span class="freccia">→</span>{/if}
				<span class="chip"
					>{CRITERI[k]}<button
						type="button"
						aria-label="Togli {CRITERI[k]}"
						onclick={() => (ordina = ordina.filter((x) => x !== k))}>×</button
					></span
				>
			{/each}
			{#if liberi.length}
				{#if ordina.length}<span class="freccia">→</span>{/if}
				<select onchange={aggiungi} aria-label="Aggiungi un criterio">
					<option value="">+ criterio</option>
					{#each liberi as k}<option value={k}>{CRITERI[k]}</option>{/each}
				</select>
			{/if}
		</span>
		<span class="conta">{visibili.length} gruppi</span>
		{#if data.profilo}<a class="nuovo" href="/nuovo-gruppo">+ Aggiungi un gruppo</a>{/if}
	</div>

	{#each sezioni as s (s.titolo)}
		<section>
			{#if s.titolo !== null}
				<h2>
					{#if ordina[0] === 'fondo'}<span
							class="colore"
							class:ignoto={!s.colore}
							style:background={s.colore}
						></span>{/if}
					{s.titolo}
					<span class="n">{s.gruppi.length}</span>
				</h2>
			{/if}
			<ul class="griglia">
				{#each s.gruppi as g (g.id)}
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
								>{[
									g.associazione.toUpperCase(),
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
		<p class="nessuno">Nessun gruppo con questo nome.</p>
	{/each}
</main>

<style>
	main {
		max-width: 1300px;
		margin: 0 auto;
		padding: 1.5rem;
	}
	.intro {
		max-width: 46rem;
		margin: 0 0 1rem;
		color: #555;
		line-height: 1.5;
		font-style: italic;
	}
	.intro a {
		color: #2a5db0;
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
	.ordina {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		flex-wrap: wrap;
	}
	.titoletto {
		font-size: 0.85rem;
		color: #777;
	}
	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.2rem;
		font-size: 0.85rem;
		background: #fff;
		border: 1px solid #ccc;
		border-radius: 6px;
		padding: 0.25rem 0.3rem 0.25rem 0.6rem;
	}
	.chip button {
		font: inherit;
		border: 0;
		background: none;
		color: #999;
		cursor: pointer;
		padding: 0 0.3rem;
	}
	.chip button:hover {
		color: #9b2a20;
	}
	.freccia {
		color: #aaa;
		font-size: 0.85rem;
	}
	select {
		font-size: 0.85rem;
		padding: 0.25rem 0.5rem;
		color: #555;
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
	section + section {
		margin-top: 1.6rem;
	}
	h2 {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 1rem;
		margin: 0 0 0.6rem;
	}
	h2 .n {
		font-weight: normal;
		font-size: 0.8rem;
		color: #999;
	}
	.colore {
		width: 0.9rem;
		height: 0.9rem;
		border-radius: 3px;
		border: 1px solid rgba(0, 0, 0, 0.2);
	}
	.colore.ignoto {
		background: #eee;
		border-style: dashed;
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
	.nessuno {
		color: #777;
	}
</style>
