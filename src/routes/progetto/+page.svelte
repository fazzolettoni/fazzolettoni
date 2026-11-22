<script lang="ts">
	import { DISCUSSIONI, EMAIL, REPOSITORY, SEGNALAZIONI } from '#lib/progetto.ts';
</script>

<svelte:head><title>Il progetto · Fazzolettoni</title></svelte:head>

<main>
	<h1>Il progetto</h1>
	<p>
		Fazzolettoni è un archivio aperto dei fazzolettoni dei gruppi scout italiani: colori, fettucce,
		simboli e la loro storia nel tempo. È un progetto volontario e senza scopo di lucro.
	</p>
	<p>
		Chiunque può contribuire: basta <a href="/accedi">iscriversi</a> per aggiungere e modificare gruppi
		e fazzolettoni. Le modifiche sono visibili in tempo reale ma possono essere cambiate o eliminate dai
		moderatori se ritenute errate o offensive.
	</p>
	<p>Per domande, dubbi o suggerimenti scrivi a <a href="mailto:{EMAIL}">{EMAIL}</a>.</p>

	<h2>Come contribuire</h2>
	<ul>
		<li>
			<strong>Gruppi e fazzolettoni</strong>: aggiungili o correggili direttamente qui sul sito,
			dopo esserti <a href="/accedi">iscritto</a>.
		</li>
		<li>
			<strong>Errori nei dati, domande, idee per migliorare le informazioni</strong>: nelle
			<a href={DISCUSSIONI}>discussioni</a> su GitHub.
		</li>
		<li>
			<strong>Cose del sito che non funzionano o nuove funzionalità</strong>: apri una
			<a href={SEGNALAZIONI}>issue</a> su GitHub.
		</li>
		<li>
			<strong>Codice</strong>: il sito è open source, il codice è su
			<a href={REPOSITORY}>GitHub</a> con licenza EUPL 1.2. Le pull request sono benvenute.
		</li>
	</ul>
	<p class="licenza">
		I disegni e le descrizioni dei fazzolettoni sono pubblicati con licenza
		<a href="https://creativecommons.org/licenses/by/4.0/deed.it">CC BY 4.0</a>.
	</p>
</main>

<style>
	main {
		max-width: 38rem;
		margin: 0 auto;
		padding: 1.5rem 1.5rem 3rem;
		line-height: 1.55;
	}
	h2 {
		font-size: 1.15rem;
		margin: 2rem 0 0.5rem;
	}
	ul {
		padding-left: 1.2rem;
	}
	li {
		margin-bottom: 0.4rem;
	}
	.licenza {
		font-size: 0.85rem;
		color: #666;
	}
	h1 {
		margin: 0.3rem 0 1rem;
	}
	a {
		color: #2a5db0;
	}
</style>
