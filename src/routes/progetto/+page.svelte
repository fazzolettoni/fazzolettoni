<script lang="ts">
	const EMAIL = 'archiviofazzolettoni@gmail.com';
</script>

<svelte:head><title>Il progetto · Fazzolettoni</title></svelte:head>

<main>
	<h1>Il progetto</h1>
	<p>
		Fazzolettoni è un archivio aperto dei fazzolettoni dei gruppi scout italiani: colori, fettucce,
		simboli e la loro storia nel tempo. È un progetto volontario e <strong
			>senza scopo di lucro</strong
		>.
	</p>
	<p>
		Chiunque può contribuire: basta <a href="/accedi">iscriversi</a> per aggiungere un gruppo o correggere
		un fazzolettone. Ogni modifica resta nello storico e si può sempre ripristinare.
	</p>
	<p>
		Per domande, dubbi o suggerimenti scrivi a <a href="mailto:{EMAIL}">{EMAIL}</a>.
	</p>
	<p class="nota">
		I disegni e i contenuti sono pubblicati con licenza
		<a href="https://creativecommons.org/licenses/by/4.0/deed.it" target="_blank" rel="noreferrer"
			>CC BY 4.0</a
		>. I nomi e i simboli delle associazioni appartengono alle rispettive associazioni.
	</p>
</main>

<style>
	main {
		max-width: 38rem;
		margin: 0 auto;
		padding: 1.5rem 1.5rem 3rem;
		line-height: 1.55;
	}
	h1 {
		margin: 0.3rem 0 1rem;
	}
	a {
		color: #2a5db0;
	}
	.nota {
		font-size: 0.85rem;
		color: #666;
		border-top: 1px solid #e3e1dc;
		padding-top: 0.8rem;
		margin-top: 1.5rem;
	}
</style>
