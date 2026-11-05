<script lang="ts">
	/**
	 * Campo numerico mostrato in cm, salvato in mm. Vuoto = sconosciuto (null).
	 * Si aggiorna alla conferma (invio o uscita dal campo), così si può scrivere "2,5" senza salti.
	 */
	let {
		mm = $bindable(),
		etichetta,
		segnaposto = 'non so'
	}: { mm: number | null | undefined; etichetta: string; segnaposto?: string } = $props();

	const valore = $derived(mm == null ? '' : String(Math.round(mm * 10) / 100).replace('.', ','));

	function cambia(testo: string) {
		const v = parseFloat(testo.replace(',', '.'));
		mm = Number.isFinite(v) ? Math.round(v * 100) / 10 : null;
	}
</script>

<label class="misura">
	<span>{etichetta}</span>
	<span class="campo">
		<input
			type="text"
			inputmode="decimal"
			value={valore}
			placeholder={segnaposto}
			onchange={(e) => cambia(e.currentTarget.value)}
		/>
		<span class="unita">cm</span>
	</span>
</label>

<style>
	.misura {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		font-size: 0.8rem;
		color: #555;
	}
	.campo {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}
	input {
		width: 5.5rem;
		font: inherit;
		font-size: 0.9rem;
		padding: 0.25rem 0.4rem;
		border: 1px solid #ccc;
		border-radius: 5px;
	}
	.unita {
		color: #888;
	}
</style>
