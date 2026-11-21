<script lang="ts">
	import MisuraCm from './MisuraCm.svelte';
	import CaricaImmagine from './CaricaImmagine.svelte';
	import { DEFAULT, type Fantasia } from '#lib/design/schema.ts';
	import { urlTile } from '#lib/design/tile.svelte.ts';

	/** Fantasia di un fondo o di una fettuccia: un'immagine che si ripete su una griglia. */
	let { fantasia = $bindable() }: { fantasia: Fantasia } = $props();
</script>

<div class="fantasia">
	{#if fantasia.asset}
		<div class="anteprima" style:background-image="url({urlTile(fantasia.asset)})"></div>
		<div class="riga">
			<MisuraCm etichetta="Si ripete ogni" bind:mm={fantasia.larghezza_mm} />
			<label class="gradi">
				<span>Rotazione</span>
				<span
					><input
						type="number"
						step="5"
						bind:value={
							() => fantasia.rotazione ?? 0, (v) => (fantasia.rotazione = Number(v) || null)
						}
					/> °</span
				>
			</label>
			<button type="button" class="link" onclick={() => (fantasia.asset = null)}
				>togli l'immagine</button
			>
		</div>
	{/if}
	<input
		type="text"
		placeholder="Descrizione (es. scozzese rosso e verde)"
		bind:value={() => fantasia.descrizione ?? '', (v) => (fantasia.descrizione = v || null)}
	/>
	<CaricaImmagine
		bind:asset={fantasia.asset}
		oncaricata={() => (fantasia.larghezza_mm ??= DEFAULT.fantasia_mm)}
		nota="Disegnata per ripetersi su una griglia; «si ripete ogni» è la larghezza reale di una ripetizione sulla stoffa."
	/>
</div>

<style>
	.fantasia {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.anteprima {
		height: 3.5rem;
		border-radius: 5px;
		border: 1px solid #ddd;
		background-size: 2.5rem auto;
		background-repeat: repeat;
	}
	.riga {
		display: flex;
		align-items: flex-end;
		gap: 0.8rem;
		flex-wrap: wrap;
	}
	.gradi {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		font-size: 0.8rem;
		color: #555;
	}
	.gradi input {
		width: 4rem;
		font: inherit;
		font-size: 0.9rem;
		padding: 0.25rem 0.35rem;
		border: 1px solid #ccc;
		border-radius: 5px;
	}
	input[type='text'] {
		font: inherit;
		font-size: 0.85rem;
		padding: 0.3rem 0.4rem;
		border: 1px solid #ccc;
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
</style>
