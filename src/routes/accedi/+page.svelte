<script lang="ts">
	import type { PageProps } from './$types';
	let { data, form }: PageProps = $props();
</script>

<svelte:head><title>Accedi · Fazzolettoni</title></svelte:head>

<main>
	<h1>Accedi</h1>
	{#if form?.inviata}
		<p class="ok">
			Ti abbiamo mandato un link di accesso a <strong>{form.email}</strong>. Aprilo da questo
			browser per entrare.
		</p>
		{#if import.meta.env.DEV}<p class="nota">
				In sviluppo le email non partono davvero: si leggono nella casella di prova su
				<a href="http://127.0.0.1:54324" target="_blank" rel="noreferrer">127.0.0.1:54324</a>.
			</p>{/if}
	{:else}
		<p>
			Per modificare serve un account. Non c'è nessuna password: inserisci l'email e ricevi un link
			per entrare. L'email non viene mai mostrata pubblicamente.
		</p>
		<form method="POST">
			<input type="hidden" name="poi" value={data.poi} />
			<label>
				Email
				<input type="email" name="email" required value={form?.email ?? ''} autocomplete="email" />
			</label>
			{#if form?.errore}<p class="errore">{form.errore}</p>{/if}
			<button>Mandami il link</button>
		</form>
		<p class="nota">
			Registrandoti accetti che i tuoi contributi siano pubblicati con licenza CC BY 4.0.
		</p>
	{/if}
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
		background: #e6f4ea;
		padding: 0.8rem;
		border-radius: 8px;
	}
	.nota {
		font-size: 0.85rem;
		color: #666;
	}
	.errore {
		color: #b3261e;
		margin: 0;
	}
</style>
