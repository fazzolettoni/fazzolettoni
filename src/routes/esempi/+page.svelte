<script lang="ts">
	import Scheda from '#lib/components/Scheda.svelte';
	import { ESEMPI } from '#lib/design/esempi.ts';
</script>

<svelte:head>
	<title>Fazzolettoni · fase 0</title>
</svelte:head>

<main>
	<h1>Fazzolettoni · fase 0</h1>
	<p class="intro">
		Prova dello schema parametrico e del renderer SVG su {ESEMPI.length} casi reali (AGESCI Sicilia e
		ScoutWiki). Le trascrizioni sono da verificare sulle fonti; i colori sono stimati dal nome. Ogni scheda
		ha un editor JSON con anteprima live.
	</p>
	<p>
		<a class="cta" href="/editor">Crea un fazzolettone nell'editor →</a>
		<a class="cta secondaria" href="/sicilia">Raccolta AGESCI Sicilia →</a>
	</p>
	<div class="griglia">
		{#each ESEMPI as e (e.id)}
			<Scheda esempio={e} />
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
		padding: 1.5rem;
	}
	h1 {
		margin: 0 0 0.3rem;
	}
	.intro {
		color: #555;
		max-width: 70ch;
		margin: 0 0 1.5rem;
	}
	.cta {
		display: inline-block;
		margin-bottom: 1.2rem;
		padding: 0.5rem 0.9rem;
		background: #2a5db0;
		color: #fff;
		border-radius: 8px;
		text-decoration: none;
	}
	.cta.secondaria {
		background: #fff;
		color: #2a5db0;
		border: 1px solid #2a5db0;
		margin-left: 0.5rem;
	}
	.griglia {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
		gap: 1rem;
		align-items: start;
	}
</style>
