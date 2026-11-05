<script lang="ts">
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import type { Design } from '#lib/design/schema.ts';
	import { supabaseBrowser } from '#lib/supabase/browser.ts';
	import type { DataParziale, DatiFazzolettone } from '#lib/supabase/tipi.ts';

	/**
	 * Salvataggio di un fazzolettone come nuova revisione. I campi non visuali (fonti, dati
	 * originali dell'import…) si conservano da `base`.
	 */
	let {
		design,
		fazzolettoneId,
		gruppoId,
		base,
		onsalvato
	}: {
		design: Design;
		fazzolettoneId: string | null;
		gruppoId: string;
		base: DatiFazzolettone | null;
		onsalvato: (id: string) => void;
	} = $props();

	type Data = { anno: string; circa: boolean };
	const daData = (d: DataParziale | null | undefined): Data => ({
		anno: d?.anno ? String(d.anno) : '',
		circa: !!d?.circa
	});
	const aData = (d: Data): DataParziale | null => {
		const anno = parseInt(d.anno);
		return Number.isInteger(anno) && anno > 1900 && anno < 2200 ? { anno, circa: d.circa } : null;
	};

	// Valori iniziali dai dati salvati; poi il pannello vive di stato proprio
	let inizio = $state<Data>(untrack(() => daData(base?.data_inizio)));
	let fine = $state<Data>(untrack(() => daData(base?.data_fine)));
	let significato = $state(untrack(() => base?.significato ?? ''));
	let commento = $state('');
	let verificato = $state(false);
	let salvando = $state(false);
	let errore = $state<string | null>(null);

	const accesso = $derived(!!page.data.profilo);
	const daRivedere = $derived(base?.da_rivedere ?? []);

	async function salva() {
		salvando = true;
		errore = null;
		const dati: DatiFazzolettone = {
			...(base ?? {}),
			design,
			data_inizio: aData(inizio),
			data_fine: aData(fine),
			significato: significato.trim() || null,
			da_rivedere: verificato ? [] : daRivedere,
			affidabilita: verificato
				? 'verificato'
				: base?.affidabilita === 'verificato'
					? 'verificato'
					: 'da_verificare'
		};
		const { data, error } = await supabaseBrowser().rpc('salva_fazzolettone', {
			p_id: fazzolettoneId,
			p_gruppo: gruppoId,
			p_dati: dati,
			p_commento: commento
		});
		salvando = false;
		if (error) errore = error.message;
		else onsalvato(data as string);
	}
</script>

<section class="salva">
	<h3>Salva nell'archivio</h3>
	<div class="date">
		<label>
			In uso dal
			<span
				><input inputmode="numeric" placeholder="anno" bind:value={inizio.anno} maxlength="4" />
				<label class="circa"><input type="checkbox" bind:checked={inizio.circa} /> circa</label
				></span
			>
		</label>
		<label>
			fino al
			<span
				><input inputmode="numeric" placeholder="oggi" bind:value={fine.anno} maxlength="4" />
				<label class="circa"><input type="checkbox" bind:checked={fine.circa} /> circa</label></span
			>
		</label>
	</div>
	<label>
		Storia e significato
		<textarea rows="3" bind:value={significato} placeholder="perché questi colori, da quando…"
		></textarea>
	</label>
	<label>
		Commento alla modifica
		<input bind:value={commento} placeholder="cosa hai cambiato e come lo sai" />
	</label>
	{#if daRivedere.length}
		<label class="verifica">
			<input type="checkbox" bind:checked={verificato} />
			Ho controllato su un fazzolettone vero: rimuovi gli avvisi «da rivedere» ({daRivedere.length})
		</label>
	{/if}
	{#if errore}<p class="errore">{errore}</p>{/if}
	{#if accesso}
		<button type="button" onclick={salva} disabled={salvando}>
			{salvando ? 'Salvataggio…' : 'Salva'}
		</button>
		<p class="nota">Pubblicato con licenza CC BY 4.0. Lo storico conserva tutte le versioni.</p>
	{:else}
		<p class="nota">
			Per salvare serve <a
				href="/accedi?poi={encodeURIComponent(page.url.pathname + page.url.search)}">l'accesso</a
			>. Intanto la bozza resta in questo browser.
		</p>
	{/if}
</section>

<style>
	.salva {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		border-top: 1px solid #eee;
		padding-top: 0.8rem;
	}
	h3 {
		margin: 0;
		font-size: 0.95rem;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		font-size: 0.82rem;
		color: #555;
	}
	.date {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}
	.date span {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}
	.date input:not([type='checkbox']) {
		width: 4.5rem;
	}
	label.circa,
	label.verifica {
		flex-direction: row;
		align-items: center;
		gap: 0.3rem;
	}
	label.verifica {
		color: #7a4a06;
	}
	input:not([type='checkbox']),
	textarea {
		font: inherit;
		font-size: 0.9rem;
		padding: 0.3rem 0.4rem;
		border: 1px solid #ccc;
		border-radius: 5px;
	}
	button {
		font: inherit;
		padding: 0.5rem;
		background: #2a5db0;
		color: #fff;
		border: 0;
		border-radius: 6px;
		cursor: pointer;
	}
	button:disabled {
		opacity: 0.6;
	}
	.nota {
		margin: 0;
		font-size: 0.78rem;
		color: #777;
	}
	.nota a {
		color: #2a5db0;
	}
	.errore {
		color: #b3261e;
		margin: 0;
		font-size: 0.85rem;
	}
</style>
