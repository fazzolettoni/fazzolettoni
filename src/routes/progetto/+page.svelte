<script lang="ts">
	const EMAIL = 'archiviofazzolettoni@gmail.com';
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
</style>
