<script lang="ts">
	import type { DatiGruppo } from '#lib/supabase/tipi.ts';

	let {
		dati,
		associazioni,
		errore,
		testoBottone
	}: {
		dati: Partial<DatiGruppo>;
		/** Se presente, mostra la scelta dell'associazione (solo per i gruppi nuovi). */
		associazioni?: { sigla: string; nome: string }[];
		errore?: string;
		testoBottone: string;
	} = $props();

	const righeLink = $derived([
		...(dati.link ?? []),
		...Array(Math.max(0, 3 - (dati.link?.length ?? 0))).fill({ tipo: 'sito', url: '' })
	]);
</script>

<form method="POST">
	{#if associazioni}
		<label>
			Associazione
			<select name="associazione" required>
				{#each associazioni as a}<option value={a.sigla}>{a.sigla.toUpperCase()} – {a.nome}</option
					>{/each}
			</select>
		</label>
	{/if}
	<label>
		Nome del gruppo
		<input name="nome" required value={dati.nome ?? ''} placeholder="es. Rosolini 1" />
	</label>
	<div class="riga">
		<label>
			Regione
			<input name="regione" required value={dati.regione ?? ''} placeholder="es. Sicilia" />
		</label>
		<label>
			Zona
			<input name="zona" value={dati.zona ?? ''} placeholder="facoltativa" />
		</label>
	</div>

	<fieldset>
		<legend>Sede</legend>
		<div class="indirizzo">
			<label class="via">
				Indirizzo
				<input name="via" value={dati.indirizzo?.via ?? ''} placeholder="es. Via Roma" />
			</label>
			<label>
				Civico
				<input name="civico" value={dati.indirizzo?.civico ?? ''} />
			</label>
			<label>
				Comune
				<input name="comune" value={dati.indirizzo?.comune ?? ''} />
			</label>
			<label>
				CAP
				<input name="cap" value={dati.indirizzo?.cap ?? ''} inputmode="numeric" maxlength="5" />
			</label>
			<label>
				Provincia
				<input
					name="provincia"
					value={dati.indirizzo?.provincia ?? ''}
					placeholder="es. CT"
					maxlength="2"
				/>
			</label>
		</div>
	</fieldset>

	<div class="riga">
		<label>
			Anno di fondazione
			<input
				name="anno_fondazione"
				value={dati.anno_fondazione ?? ''}
				inputmode="numeric"
				maxlength="4"
				placeholder="es. 1974"
			/>
		</label>
		<label>
			Anno di chiusura
			<input
				name="anno_chiusura"
				value={dati.anno_chiusura ?? ''}
				inputmode="numeric"
				maxlength="4"
				placeholder="vuoto se è in attività"
			/>
		</label>
	</div>
	<label class="check">
		<input
			type="checkbox"
			name="chiuso_senza_anno"
			checked={dati.attivo === false && !dati.anno_chiusura}
		/> il gruppo ha chiuso, ma non si sa in che anno
	</label>

	<fieldset>
		<legend>Link</legend>
		{#each righeLink as l}
			<div class="link">
				<select name="link_tipo" value={l.tipo}>
					<option value="sito">sito</option>
					<option value="scoutwiki">scoutwiki</option>
					<option value="facebook">facebook</option>
					<option value="instagram">instagram</option>
					<option value="altro">altro</option>
				</select>
				<input name="link_url" type="url" value={l.url} placeholder="https://…" />
			</div>
		{/each}
	</fieldset>

	<label>
		Commento alla modifica
		<input name="commento" placeholder="cosa hai cambiato e perché (facoltativo)" />
	</label>
	{#if errore}<p class="errore">{errore}</p>{/if}
	<p class="nota">Niente dati personali (nomi dei capi, telefoni, email private).</p>
	<button>{testoBottone}</button>
</form>

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		font-size: 0.9rem;
	}
	label.check {
		flex-direction: row;
		align-items: center;
		gap: 0.4rem;
	}
	.riga {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.8rem;
	}
	.indirizzo {
		display: grid;
		grid-template-columns: 3fr 1fr;
		gap: 0.6rem 0.8rem;
	}
	@media (min-width: 560px) {
		.indirizzo {
			grid-template-columns: 4fr 1fr 1.2fr;
		}
		.indirizzo .via {
			grid-column: span 2;
		}
	}
	input,
	select {
		font: inherit;
		padding: 0.45rem;
		border: 1px solid #ccc;
		border-radius: 6px;
		background: #fff;
	}
	fieldset {
		border: 0;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	legend {
		font-size: 0.9rem;
		margin-bottom: 0.3rem;
	}
	.link {
		display: grid;
		grid-template-columns: 8rem 1fr;
		gap: 0.4rem;
	}
	button {
		font: inherit;
		padding: 0.55rem;
		background: #2a5db0;
		color: #fff;
		border: 0;
		border-radius: 6px;
		cursor: pointer;
	}
	.errore {
		color: #b3261e;
		margin: 0;
	}
	.nota {
		color: #777;
		font-size: 0.82rem;
		margin: 0;
	}
</style>
