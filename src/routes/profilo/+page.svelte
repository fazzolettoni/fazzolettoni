<script lang="ts">
	import type { PageProps } from './$types';
	let { data, form }: PageProps = $props();
</script>

<svelte:head><title>Profilo · Fazzolettoni</title></svelte:head>

<main>
	<h1>Il tuo profilo</h1>
	<p>Il nome compare nello storico accanto alle tue modifiche. L'email resta privata.</p>
	<form method="POST">
		<label>
			Nome pubblico
			<input name="nome" value={form?.nome ?? data.profilo?.nome} minlength="2" maxlength="40" />
		</label>
		{#if form?.errore}<p class="errore">{form.errore}</p>{/if}
		{#if form?.salvato}<p class="ok">Salvato.</p>{/if}
		<button>Salva</button>
	</form>
	<p class="nota">Ruolo: {data.profilo?.ruolo}</p>
</main>

<style>
	main {
		max-width: 28rem;
		margin: 3rem auto;
		padding: 0 1rem;
	}
	form {
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		font-size: 0.9rem;
	}
	input {
		font: inherit;
		padding: 0.5rem;
		border: 1px solid #ccc;
		border-radius: 6px;
	}
	button {
		font: inherit;
		padding: 0.55rem;
		background: #2a5db0;
		color: #fff;
		border: 0;
		border-radius: 6px;
		cursor: pointer;
	}
	.ok {
		color: #2c7a3f;
		margin: 0;
	}
	.errore {
		color: #b3261e;
		margin: 0;
	}
	.nota {
		color: #777;
		font-size: 0.85rem;
	}
</style>
