<script lang="ts">
	import { page } from '$app/state';
	import MisuraCm from './MisuraCm.svelte';
	import { DEFAULT, type Fantasia } from '#lib/design/schema.ts';
	import { urlTile } from '#lib/design/tile.svelte.ts';
	import { caricaFileTile, TIPI_TILE } from '#lib/supabase/tile.ts';

	/** Fantasia di un fondo o di una fettuccia: un'immagine che si ripete su una griglia. */
	let { fantasia = $bindable() }: { fantasia: Fantasia } = $props();

	// per ora le immagini le caricano solo gli amministratori (SPEC §11: pulizia degli SVG)
	const puoCaricare = $derived(page.data.profilo?.ruolo === 'amministratore');
	let caricando = $state(false);
	let errore = $state<string | null>(null);

	async function carica(e: Event & { currentTarget: HTMLInputElement }) {
		const file = e.currentTarget.files?.[0];
		e.currentTarget.value = '';
		if (!file) return;
		caricando = true;
		errore = null;
		try {
			fantasia.asset = await caricaFileTile(file);
			fantasia.larghezza_mm ??= DEFAULT.fantasia_mm;
		} catch (err) {
			errore = err instanceof Error ? err.message : String(err);
		} finally {
			caricando = false;
		}
	}
</script>

<div class="fantasia">
	{#if fantasia.asset}
		<div class="anteprima" style:background-image="url({urlTile(fantasia.asset)})"></div>
		<div class="riga">
			<MisuraCm etichetta="Si ripete ogni" bind:mm={fantasia.larghezza_mm} />
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
	{#if puoCaricare}
		<label class="carica">
			<input type="file" accept={TIPI_TILE.join(',')} onchange={carica} disabled={caricando} />
			{caricando ? 'Caricamento…' : fantasia.asset ? 'Sostituisci immagine' : 'Carica immagine'}
		</label>
		<p class="nota">
			PNG, JPG, WebP o SVG fino a 1 MB, disegnata per ripetersi su una griglia. «Si ripete ogni» è
			la larghezza reale di una ripetizione sulla stoffa.
		</p>
	{:else if !fantasia.asset}
		<p class="nota">Per ora le immagini delle fantasie le caricano gli amministratori.</p>
	{/if}
	{#if errore}<p class="errore">{errore}</p>{/if}
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
	input[type='text'] {
		font: inherit;
		font-size: 0.85rem;
		padding: 0.3rem 0.4rem;
		border: 1px solid #ccc;
		border-radius: 5px;
	}
	.carica {
		align-self: flex-start;
		font-size: 0.82rem;
		color: #2a5db0;
		border: 1px solid #ccc;
		border-radius: 5px;
		padding: 0.25rem 0.6rem;
		cursor: pointer;
		background: #fff;
	}
	.carica input {
		display: none;
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
	.nota {
		margin: 0;
		font-size: 0.75rem;
		color: #777;
	}
	.errore {
		margin: 0;
		font-size: 0.8rem;
		color: #b3261e;
	}
</style>
