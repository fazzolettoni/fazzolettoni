<script lang="ts">
	import { STIMA_COLORI } from '#lib/design/colori.ts';
	import type { Colore } from '#lib/design/schema.ts';

	/**
	 * Il datalist "nomi-colori" (suggerimenti) è definito una volta sola nella pagina dell'editor.
	 * Colore = hex scelto con il selettore + nome libero usato dal gruppo.
	 * "Non so" azzera l'hex (colore sconosciuto) ma conserva il nome.
	 */
	let { colore = $bindable(), onrimuovi }: { colore: Colore; onrimuovi?: () => void } = $props();

	const sconosciuto = $derived(!colore.hex);

	function scegli(hex: string) {
		colore.hex = hex;
		colore.approssimato = false;
	}

	function cambiaNome(nome: string) {
		colore.nome = nome.trim() || null;
		// Se il colore non è ancora scelto, proponi l'hex indicativo del nome
		const stima = colore.nome ? STIMA_COLORI[colore.nome.toLowerCase()] : undefined;
		if (!colore.hex && stima) {
			colore.hex = stima;
			colore.approssimato = true;
		}
	}
</script>

<div class="colore" class:sconosciuto>
	<label class="campione" title="Scegli il colore">
		<input
			type="color"
			value={colore.hex ?? '#c8c8c8'}
			oninput={(e) => scegli(e.currentTarget.value)}
		/>
	</label>
	<input
		class="nome"
		type="text"
		list="nomi-colori"
		value={colore.nome ?? ''}
		placeholder="nome (es. azzurro)"
		onchange={(e) => cambiaNome(e.currentTarget.value)}
	/>
	<button
		type="button"
		class="nonso"
		class:attivo={sconosciuto}
		title="Colore sconosciuto"
		onclick={() => {
			colore.hex = null;
			colore.approssimato = false;
		}}>?</button
	>
	{#if colore.approssimato && colore.hex}<span class="stima" title="Colore stimato dal nome">≈</span
		>{/if}
	{#if onrimuovi}
		<button type="button" class="rimuovi" title="Rimuovi colore" onclick={onrimuovi}>×</button>
	{/if}
</div>

<style>
	.colore {
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}
	.campione {
		width: 2rem;
		height: 2rem;
		border-radius: 6px;
		overflow: hidden;
		border: 1px solid #bbb;
		flex: none;
		position: relative;
	}
	.campione input {
		position: absolute;
		inset: -8px;
		width: calc(100% + 16px);
		height: calc(100% + 16px);
		border: 0;
		padding: 0;
		cursor: pointer;
	}
	.sconosciuto .campione {
		background: repeating-linear-gradient(45deg, #c8c8c8 0 5px, #a9a9a9 5px 7px);
	}
	.sconosciuto .campione input {
		opacity: 0;
	}
	.nome {
		flex: 1;
		min-width: 0;
		font: inherit;
		font-size: 0.9rem;
		padding: 0.3rem 0.4rem;
		border: 1px solid #ccc;
		border-radius: 5px;
	}
	button {
		font: inherit;
		width: 1.8rem;
		height: 1.8rem;
		border: 1px solid #ccc;
		border-radius: 5px;
		background: #f7f6f3;
		cursor: pointer;
		flex: none;
		padding: 0;
	}
	.nonso.attivo {
		background: #fff1d6;
		border-color: #e0a640;
		color: #a6650a;
		font-weight: bold;
	}
	.stima {
		color: #a6650a;
		font-size: 0.9rem;
	}
</style>
