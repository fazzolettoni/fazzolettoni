<script lang="ts">
	import SchedaSicilia from '#lib/components/SchedaSicilia.svelte';
	import { FONTE_SICILIA, SCHEDE_SICILIA } from '#lib/import/locale.ts';

	type Filtro = 'tutti' | 'rivedere' | 'conflitti' | 'interpretati' | 'puliti';
	let filtro = $state<Filtro>('tutti');
	let cerca = $state('');

	const conta = {
		tutti: SCHEDE_SICILIA.length,
		puliti: SCHEDE_SICILIA.filter((s) => !s.conversione.daRivedere.length).length,
		rivedere: SCHEDE_SICILIA.filter((s) => s.conversione.daRivedere.length).length,
		conflitti: SCHEDE_SICILIA.filter((s) => s.gruppo.conflitti.length).length,
		interpretati: SCHEDE_SICILIA.filter((s) => s.conversione.metodo === 'manuale').length
	};

	const visibili = $derived(
		SCHEDE_SICILIA.filter((s) => {
			if (filtro === 'rivedere' && !s.conversione.daRivedere.length) return false;
			if (filtro === 'puliti' && s.conversione.daRivedere.length) return false;
			if (filtro === 'conflitti' && !s.gruppo.conflitti.length) return false;
			if (filtro === 'interpretati' && s.conversione.metodo !== 'manuale') return false;
			const q = cerca.trim().toLowerCase();
			if (!q) return true;
			return (
				s.gruppo.nome.toLowerCase().includes(q) ||
				Object.values(s.gruppo.campi).some((v) => v?.toLowerCase().includes(q))
			);
		})
	);

	const ETICHETTE: Record<Filtro, string> = {
		tutti: 'Tutti',
		puliti: 'Convertiti senza dubbi',
		rivedere: 'Da rivedere',
		conflitti: 'Con conflitti tra tabelle',
		interpretati: 'Interpretati a mano'
	};
</script>

<svelte:head>
	<title>AGESCI Sicilia · Fazzolettoni</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main>
	<p class="nav"><a href="/">← Galleria</a> · <a href="/editor">Editor</a></p>
	<h1>Raccolta AGESCI Sicilia</h1>
	<p class="intro">
		{SCHEDE_SICILIA.length} fazzolettoni importati dalla
		<a href={FONTE_SICILIA.url} target="_blank" rel="noreferrer">tabella di AGESCI Sicilia</a>
		(curata da {FONTE_SICILIA.curatore}, aggiornata al {FONTE_SICILIA.aggiornata_al}). La pagina
		contiene due tabelle con gli stessi gruppi: dove dicono cose diverse è segnalato un conflitto.
		Colori stimati dal nome, foto non importate.
	</p>
	<p class="privato">
		Proof of concept privato: non pubblicare senza il permesso di AGESCI Sicilia.
	</p>

	<div class="filtri">
		{#each Object.keys(ETICHETTE) as f}
			<button type="button" class:attivo={filtro === f} onclick={() => (filtro = f as Filtro)}>
				{ETICHETTE[f as Filtro]} <span>{conta[f as Filtro]}</span>
			</button>
		{/each}
		<input type="search" placeholder="Cerca gruppo, colore…" bind:value={cerca} />
	</div>

	<div class="griglia">
		{#each visibili as s (s.gruppo.id)}
			<SchedaSicilia scheda={s} />
		{:else}
			<p>Nessun risultato.</p>
		{/each}
	</div>
</main>

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
	main {
		max-width: 1400px;
		margin: 0 auto;
		padding: 1.2rem 1.5rem 3rem;
	}
	.nav a {
		color: #2a5db0;
		text-decoration: none;
		font-size: 0.9rem;
	}
	h1 {
		margin: 0.3rem 0;
	}
	.intro {
		color: #555;
		max-width: 80ch;
		margin: 0 0 0.5rem;
	}
	.intro a {
		color: #2a5db0;
	}
	.privato {
		display: inline-block;
		margin: 0 0 1rem;
		padding: 0.3rem 0.7rem;
		background: #fff1d6;
		color: #8a5408;
		border-radius: 6px;
		font-size: 0.85rem;
	}
	.filtri {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin-bottom: 1rem;
		align-items: center;
	}
	.filtri button {
		font: inherit;
		font-size: 0.85rem;
		padding: 0.3rem 0.75rem;
		border: 1px solid #ccc;
		border-radius: 999px;
		background: #fff;
		cursor: pointer;
	}
	.filtri button span {
		color: #888;
		margin-left: 0.2rem;
	}
	.filtri button.attivo {
		border-color: #2a5db0;
		background: #eaf1fc;
		color: #1d4688;
	}
	.filtri input {
		margin-left: auto;
		font: inherit;
		font-size: 0.9rem;
		padding: 0.35rem 0.6rem;
		border: 1px solid #ccc;
		border-radius: 6px;
		min-width: 14rem;
	}
	.griglia {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 1rem;
		align-items: start;
	}
</style>
