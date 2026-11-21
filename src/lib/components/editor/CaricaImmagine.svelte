<script lang="ts">
	import { page } from '$app/state';
	import { caricaFileTile, TIPI_TILE } from '#lib/supabase/tile.ts';

	/**
	 * Caricamento di un'immagine nello storage (fantasie, loghi, toppe): il file prende come
	 * nome l'impronta del contenuto. Per ora solo gli amministratori (SPEC §11: pulizia SVG).
	 */
	let {
		asset = $bindable(),
		oncaricata,
		nota
	}: { asset: string | null | undefined; oncaricata?: () => void; nota?: string } = $props();

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
			asset = await caricaFileTile(file);
			oncaricata?.();
		} catch (err) {
			errore = err instanceof Error ? err.message : String(err);
		} finally {
			caricando = false;
		}
	}
</script>

{#if puoCaricare}
	<label class="carica">
		<input type="file" accept={TIPI_TILE.join(',')} onchange={carica} disabled={caricando} />
		{caricando ? 'Caricamento…' : asset ? 'Sostituisci immagine' : 'Carica immagine'}
	</label>
	<p class="nota">PNG, JPG, WebP o SVG fino a 1 MB.{nota ? ` ${nota}` : ''}</p>
{:else if !asset}
	<p class="nota">Per ora le immagini le caricano gli amministratori.</p>
{/if}
{#if errore}<p class="errore">{errore}</p>{/if}

<style>
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
