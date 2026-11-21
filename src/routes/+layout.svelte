<script lang="ts">
	import favicon from '#lib/assets/favicon.svg';
	import { page } from '$app/state';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if page.url.pathname !== '/alpha'}
	<nav class="barra-sito">
		<a class="marchio" href="/">Fazzolettoni</a>
		<a href="/progetto">Il progetto</a>
		<span class="spazio"></span>
		{#if data.profilo}
			<a href="/nuovo-gruppo">Nuovo gruppo</a>
			<a href="/modifiche">Ultime modifiche</a>
			{#if data.profilo.ruolo !== 'utente'}<a href="/moderazione">Moderazione</a>{/if}
			<a href="/profilo">{data.profilo.nome}</a>
			<form method="POST" action="/esci"><button>Esci</button></form>
		{:else}
			<a href="/accedi">Accedi</a>
		{/if}
	</nav>
{/if}

{@render children()}

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
	.barra-sito {
		display: flex;
		gap: 1rem;
		align-items: center;
		flex-wrap: wrap;
		padding: 0.5rem 1.5rem;
		background: #1f3a63;
		font-size: 0.88rem;
	}
	.barra-sito a {
		color: #dfe8f6;
		text-decoration: none;
	}
	.barra-sito .marchio {
		color: #fff;
		font-weight: 700;
		font-size: 1rem;
	}
	.spazio {
		flex: 1;
	}
	form {
		margin: 0;
	}
	button {
		font: inherit;
		font-size: 0.85rem;
		background: none;
		border: 1px solid #5b7aa8;
		color: #dfe8f6;
		border-radius: 5px;
		padding: 0.15rem 0.6rem;
		cursor: pointer;
	}
</style>
