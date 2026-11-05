<script lang="ts">
	import ColoreInput from './ColoreInput.svelte';
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
		<p class="nota">
			Il caricamento delle immagini arriverà con il backend: per ora è un segnaposto.
		</p>
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
		<label>
			<span>Dimensione</span>
			<input type="range" min="0.03" max="0.9" step="0.01" bind:value={elemento.scala} />
		</label>
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
	.nota {
		margin: 0;
		font-size: 0.75rem;
		color: #888;
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
