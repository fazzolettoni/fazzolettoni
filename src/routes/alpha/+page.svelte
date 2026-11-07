<script lang="ts">
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<svelte:head><title>Fazzolettoni · alpha</title></svelte:head>

<main>
	<h1>Fazzolettoni</h1>
	<p>Versione alpha riservata: serve la password che ti è stata data.</p>
	<form method="POST">
		<!-- svelte-ignore a11y_autofocus -->
		<input type="password" name="password" placeholder="password" autofocus required />
		<button>Entra</button>
	</form>
	{#if form?.errore}<p class="errore">Password sbagliata.</p>{/if}
</main>

<style>
	main {
		max-width: 22rem;
		margin: 15vh auto;
		padding: 1.5rem;
		text-align: center;
	}
	h1 {
		margin: 0 0 0.4rem;
	}
	p {
		color: #555;
	}
	form {
		display: flex;
		gap: 0.5rem;
	}
	input {
		flex: 1;
		font: inherit;
		padding: 0.45rem 0.6rem;
		border: 1px solid #ccc;
		border-radius: 6px;
	}
	button {
		font: inherit;
		padding: 0.45rem 0.9rem;
		border: 0;
		border-radius: 6px;
		background: #2a5db0;
		color: #fff;
		cursor: pointer;
	}
	.errore {
		color: #b3261e;
	}
</style>
