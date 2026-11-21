<script lang="ts">
	import ColoreInput from './ColoreInput.svelte';
	import CaricaImmagine from './CaricaImmagine.svelte';
	import MisuraCm from './MisuraCm.svelte';
	import { urlTile } from '#lib/design/tile.svelte.ts';
	import { nuovoColore } from '#lib/design/nuovo.ts';
	import type { Elemento } from '#lib/design/schema.ts';

	let { elemento = $bindable(), onelimina }: { elemento: Elemento; onelimina: () => void } =
		$props();

	const NOMI = { scritta: 'Scritta', toppa: 'Toppa', logo: 'Logo' };
</script>

<div class="elemento">
	<header>
		<strong>{NOMI[elemento.tipo]}</strong>
		<button type="button" class="elimina" title="Elimina" onclick={onelimina}>×</button>
	</header>

	{#if elemento.tipo === 'scritta'}
		<input type="text" class="testo" bind:value={elemento.testo} placeholder="Testo" />
		{#if elemento.colore}
			<ColoreInput bind:colore={elemento.colore} />
		{:else}
			<button type="button" onclick={() => (elemento.colore = nuovoColore('#ffffff', 'bianco'))}
				>Scegli colore</button
			>
		{/if}
	{:else}
		<input
			type="text"
			class="testo"
			bind:value={elemento.descrizione}
			placeholder="Descrizione (es. Madonna delle Lacrime)"
		/>
		{#if elemento.asset}
			<div class="immagine">
				<img src={urlTile(elemento.asset)} alt={elemento.descrizione ?? ''} />
				<button type="button" class="link" onclick={() => (elemento.asset = null)}
					>togli l'immagine</button
				>
			</div>
		{/if}
		<CaricaImmagine
			bind:asset={elemento.asset}
			oncaricata={() => (elemento.larghezza_mm ??= 80)}
			nota="Meglio con lo sfondo trasparente."
		/>
		<MisuraCm etichetta="Larghezza reale" bind:mm={elemento.larghezza_mm} />
	{/if}

	<div class="cursori">
		<label>
			<span>Orizzontale</span>
			<input type="range" min="0" max="1" step="0.01" bind:value={elemento.posizione.x} />
		</label>
		<label>
			<span>Verticale</span>
			<input type="range" min="0" max="1" step="0.01" bind:value={elemento.posizione.y} />
		</label>
		{#if elemento.tipo === 'scritta' || !elemento.larghezza_mm}
			<label>
				<span>Dimensione</span>
				<input type="range" min="0.03" max="0.9" step="0.01" bind:value={elemento.scala} />
			</label>
		{/if}
		<label>
			<span>Rotazione</span>
			<input
				type="range"
				min="-180"
				max="180"
				step="1"
				bind:value={() => elemento.rotazione ?? 0, (v) => (elemento.rotazione = v)}
			/>
		</label>
	</div>
</div>

<style>
	.elemento {
		background: #fff;
		border: 1px solid #e3e1dc;
		border-radius: 8px;
		padding: 0.5rem 0.7rem 0.7rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.9rem;
	}
	.elimina {
		width: 1.6rem;
		height: 1.6rem;
		padding: 0;
		border: 1px solid #ddd;
		border-radius: 5px;
		background: #f7f6f3;
		cursor: pointer;
	}
	.testo {
		font: inherit;
		font-size: 0.9rem;
		padding: 0.3rem 0.4rem;
		border: 1px solid #ccc;
		border-radius: 5px;
	}
	.immagine {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}
	.immagine img {
		width: 3.5rem;
		height: 3.5rem;
		object-fit: contain;
		background: #f2f0ec;
		border-radius: 5px;
	}
	.link {
		background: none;
		border: 0;
		padding: 0;
		color: #2a5db0;
		font: inherit;
		font-size: 0.82rem;
		cursor: pointer;
	}
	.cursori {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.3rem 0.8rem;
	}
	.cursori label {
		display: flex;
		flex-direction: column;
		font-size: 0.75rem;
		color: #666;
	}
</style>
