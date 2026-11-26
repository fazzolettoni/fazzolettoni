<script lang="ts">
	import favicon from '#lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { DISCUSSIONI, EMAIL, REPOSITORY } from '#lib/progetto.ts';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();
	const qui = (p: string) => page.url.pathname === p;
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if page.url.pathname !== '/alpha'}
	<nav class="barra-sito">
		<a class="marchio" href="/">Fazzolettoni</a>
		<a class="voce" class:attiva={qui('/')} href="/">Archivio</a>
		<a class="voce" class:attiva={qui('/progetto')} href="/progetto">Il progetto</a>
		<a class="voce" href={DISCUSSIONI} target="_blank" rel="noreferrer">Discuti</a>
		<span class="spazio"></span>
		{#if data.profilo}
			<a class="voce" class:attiva={qui('/nuovo-gruppo')} href="/nuovo-gruppo">Nuovo gruppo</a>
			<a class="voce" class:attiva={qui('/modifiche')} href="/modifiche">Ultime modifiche</a>
			{#if data.profilo.ruolo !== 'utente'}<a
					class="voce"
					class:attiva={qui('/moderazione')}
					href="/moderazione">Moderazione</a
				>{/if}
			<a class="utente" href="/profilo">{data.profilo.nome}</a>
			<form method="POST" action="/esci"><button>Esci</button></form>
		{:else}
			<a class="utente" href="/accedi">Accedi</a>
		{/if}
	</nav>
{/if}

{@render children()}

{#if page.url.pathname !== '/alpha'}
	<footer class="piede">
		<p>
			Disegni e descrizioni:
			<a href="https://creativecommons.org/licenses/by/4.0/deed.it">CC BY 4.0</a>. Codice:
			<a href={REPOSITORY}>EUPL 1.2</a>.
		</p>
		<p class="destra"><a href="mailto:{EMAIL}">{EMAIL}</a></p>
	</footer>
{/if}

<style>
	/* Sistema visivo: bianco e nero su fondo bianco, filetti sottili, raggio 0, nessuna ombra.
	   L'unico colore pieno è quello dei fazzolettoni; l'incertezza è un tratteggio. */
	:global(:root) {
		--bianco: #ffffff;
		--carta: #f2f2f0;
		--inchiostro: #161616;
		--inchiostro-2: #5a5853;
		--testo-2: #3b3935;
		--filo: #bdb8ae;
		--filo-chiaro: #ddd8cf;
		--filo-griglia: #cfc9be;
		--blu-notte: #1f3a63;
		--blu-notte-scuro: #14213d;
		--ocra: #8a5408;
		--cancellato: #9b2a20;
		--aggiunto: #2c7a3f;
		--carattere: 'HK Grotesk', 'Hanken Grotesk', sans-serif;
		/* campitura incerta (da scrivere sull'elemento, che definisce --c):
		   repeating-linear-gradient(45deg, var(--c) 0 2px, transparent 2px 5px) */
		--contenitore: 1240px;
		--margine: 32px;
	}
	@media (max-width: 800px) {
		:global(:root) {
			--margine: 16px;
		}
	}
	:global(body) {
		margin: 0;
		background: var(--bianco);
		font-family: var(--carattere);
		font-variant-numeric: tabular-nums;
		color: var(--inchiostro);
		font-size: 15px;
		line-height: 1.45;
	}
	:global(::selection) {
		background: #d6deea;
	}
	:global(:focus-visible) {
		outline: 1px solid var(--inchiostro);
		outline-offset: 2px;
	}
	:global(a) {
		color: var(--blu-notte);
	}
	:global(a:hover) {
		color: var(--blu-notte-scuro);
	}
	/* etichetta/dato in piccolo maiuscolo, riusabile in tutte le pagine */
	:global(.etichetta) {
		font-size: 10.5px;
		font-weight: 500;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--inchiostro-2);
	}

	.barra-sito {
		display: flex;
		gap: 22px;
		align-items: baseline;
		flex-wrap: wrap;
		padding: 18px var(--margine);
		border-bottom: 1px solid var(--inchiostro);
	}
	.marchio {
		font-weight: 600;
		font-size: 20px;
		line-height: 1;
		letter-spacing: -0.01em;
		color: var(--inchiostro);
		text-decoration: none;
		margin-right: 14px;
	}
	.voce {
		font-size: 12px;
		font-weight: 500;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--inchiostro-2);
		text-decoration: none;
	}
	.voce:hover,
	.voce.attiva {
		color: var(--inchiostro);
	}
	.utente {
		font-size: 13px;
		color: var(--inchiostro);
		text-underline-offset: 3px;
	}
	.spazio {
		flex: 1;
	}
	form {
		margin: 0;
	}
	button {
		font: inherit;
		font-size: 12px;
		font-weight: 500;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		background: none;
		border: 1px solid var(--inchiostro);
		color: var(--inchiostro);
		border-radius: 0;
		padding: 3px 8px;
		cursor: pointer;
	}
	button:hover {
		background: var(--inchiostro);
		color: var(--bianco);
	}

	.piede {
		display: grid;
		grid-template-columns: repeat(12, minmax(0, 1fr));
		gap: 24px;
		max-width: var(--contenitore);
		margin: 64px auto 0;
		padding: 18px var(--margine) 32px;
		border-top: 1px solid var(--inchiostro);
		font-size: 12px;
		color: var(--inchiostro-2);
		box-sizing: border-box;
	}
	.piede p {
		margin: 0;
		grid-column: 1 / 7;
	}
	.piede .destra {
		grid-column: 7 / 13;
		text-align: right;
	}
	.piede a {
		color: inherit;
	}
	@media (max-width: 700px) {
		.piede p,
		.piede .destra {
			grid-column: 1 / -1;
			text-align: left;
		}
	}
</style>
