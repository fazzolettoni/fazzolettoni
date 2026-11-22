<script lang="ts">
	import ColoreInput from './ColoreInput.svelte';
	import MisuraCm from './MisuraCm.svelte';
	import FantasiaEditor from './FantasiaEditor.svelte';
	import MaterialeSelect from './MaterialeSelect.svelte';
	import { ETICHETTE_LATI, LATI_PER_FORMA, nuovoColore } from '#lib/design/nuovo.ts';
	import { DEFAULT, type Fettuccia, type Forma, type Lato } from '#lib/design/schema.ts';

	let {
		fettuccia = $bindable(),
		forma,
		numero,
		aperta = $bindable(true)
	}: { fettuccia: Fettuccia; forma: Forma; numero: number; aperta?: boolean } = $props();

	type Pos = 'bordo' | 'distanza' | 'adiacente' | 'nonso';
	const posizione = $derived<Pos>(
		fettuccia.distanza_bordo_mm === 'adiacente'
			? 'adiacente'
			: fettuccia.distanza_bordo_mm == null
				? 'nonso'
				: fettuccia.distanza_bordo_mm === 0
					? 'bordo'
					: 'distanza'
	);

	function cambiaPosizione(p: Pos) {
		fettuccia.distanza_bordo_mm =
			p === 'bordo' ? 0 : p === 'distanza' ? 10 : p === 'adiacente' ? 'adiacente' : null;
	}

	function cambiaLato(l: Lato, attivo: boolean) {
		const lati = new Set(fettuccia.lati ?? DEFAULT.lati[forma]);
		if (attivo) lati.add(l);
		else lati.delete(l);
		fettuccia.lati = LATI_PER_FORMA[forma].filter((x) => lati.has(x));
	}

	const riassunto = $derived(
		[
			fettuccia.colori.map((c) => c.nome ?? '?').join('-'),
			fettuccia.larghezza_mm != null
				? `${String(fettuccia.larghezza_mm / 10).replace('.', ',')} cm`
				: null,
			{ bordo: 'sul bordo', distanza: 'sarchiata', adiacente: 'adiacente', nonso: null }[posizione]
		]
			.filter(Boolean)
			.join(' · ')
	);
</script>

<details class="fettuccia" bind:open={aperta}>
	<summary>
		<span class="strisce">
			{#each fettuccia.colori as c}
				<span class="striscia" class:ignoto={!c.hex} style:background={c.hex ?? undefined}></span>
			{/each}
		</span>
		<span class="titolo">Fettuccia {numero}</span>
		<span class="riassunto">{riassunto}</span>
	</summary>

	<div class="corpo">
		<fieldset>
			<legend>Colori <small>(più colori = strisce affiancate, dall'esterno)</small></legend>
			{#each fettuccia.colori as _, k (k)}
				<ColoreInput
					bind:colore={fettuccia.colori[k]}
					onrimuovi={fettuccia.colori.length > 1 ? () => fettuccia.colori.splice(k, 1) : undefined}
				/>
			{/each}
			<button type="button" class="link" onclick={() => fettuccia.colori.push(nuovoColore())}
				>+ colore</button
			>
		</fieldset>

		<div class="riga">
			<MisuraCm etichetta="Larghezza" bind:mm={fettuccia.larghezza_mm} />
			<label class="scelta">
				<span>Posizione</span>
				<select value={posizione} onchange={(e) => cambiaPosizione(e.currentTarget.value as Pos)}>
					<option value="bordo">sul bordo (bordata)</option>
					<option value="distanza">a distanza (sarchiata)</option>
					<option value="adiacente">adiacente alla precedente</option>
					<option value="nonso">non so</option>
				</select>
			</label>
			{#if posizione === 'distanza'}
				<MisuraCm
					etichetta="Dal bordo"
					bind:mm={
						() => fettuccia.distanza_bordo_mm as number,
						(v) => (fettuccia.distanza_bordo_mm = v ?? 0)
					}
					segnaposto="0"
				/>
			{/if}
			<MaterialeSelect bind:materiale={fettuccia.materiale} />
		</div>

		<fieldset>
			<legend>Lati</legend>
			<div class="lati">
				{#each LATI_PER_FORMA[forma] as l}
					<label>
						<input
							type="checkbox"
							disabled={!fettuccia.lati}
							checked={(fettuccia.lati ?? DEFAULT.lati[forma]).includes(l)}
							onchange={(e) => cambiaLato(l, e.currentTarget.checked)}
						/>
						{ETICHETTE_LATI[l]}
					</label>
				{/each}
				<label class="nonso">
					<input
						type="checkbox"
						checked={!fettuccia.lati}
						onchange={(e) =>
							(fettuccia.lati = e.currentTarget.checked ? null : [...DEFAULT.lati[forma]])}
					/>
					non so
				</label>
			</div>
		</fieldset>

		<div class="riga">
			<label class="scelta">
				<span>Agli angoli</span>
				<select
					value={fettuccia.incrocio ?? 'nonso'}
					onchange={(e) => {
						const v = e.currentTarget.value;
						fettuccia.incrocio = v === 'nonso' ? null : (v as 'angolo' | 'incrociato');
					}}
				>
					<option value="angolo">unite ad angolo</option>
					<option value="incrociato">incrociate</option>
					<option value="nonso">non so</option>
				</select>
			</label>
			<label class="check">
				<input
					type="checkbox"
					checked={!!fettuccia.tratto}
					onchange={(e) =>
						(fettuccia.tratto = e.currentTarget.checked ? { da_mm: 0, a_mm: 150 } : null)}
				/>
				solo un tratto
			</label>
		</div>
		{#if fettuccia.tratto}
			<div class="riga">
				<MisuraCm etichetta="Da (dal vertice)" bind:mm={fettuccia.tratto.da_mm} segnaposto="0" />
				<MisuraCm etichetta="A" bind:mm={fettuccia.tratto.a_mm} segnaposto="0" />
			</div>
		{/if}
		<fieldset>
			<legend>
				<label class="check">
					<input
						type="checkbox"
						checked={!!fettuccia.fantasia}
						onchange={(e) => (fettuccia.fantasia = e.currentTarget.checked ? {} : null)}
					/>
					con una fantasia <small>(il motivo segue ogni lato; i colori fanno da riserva)</small>
				</label>
			</legend>
			{#if fettuccia.fantasia}<FantasiaEditor bind:fantasia={fettuccia.fantasia} />{/if}
		</fieldset>
	</div>
</details>

<style>
	.fettuccia {
		background: #fff;
		border: 1px solid #e3e1dc;
		border-radius: 8px;
	}
	summary {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.6rem;
		cursor: pointer;
		list-style: none;
	}
	summary::-webkit-details-marker {
		display: none;
	}
	.strisce {
		display: flex;
		flex-direction: column;
		width: 1.6rem;
		height: 1.1rem;
		border: 1px solid #bbb;
		border-radius: 3px;
		overflow: hidden;
		flex: none;
	}
	.striscia {
		flex: 1;
	}
	.striscia.ignoto {
		background: repeating-linear-gradient(45deg, #c8c8c8 0 4px, #a9a9a9 4px 6px);
	}
	.titolo {
		font-weight: 600;
		font-size: 0.9rem;
	}
	.riassunto {
		color: #777;
		font-size: 0.8rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.corpo {
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
		padding: 0.2rem 0.7rem 0.8rem;
	}
	fieldset {
		border: 0;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	legend {
		font-size: 0.8rem;
		color: #555;
		margin-bottom: 0.3rem;
	}
	legend small {
		color: #999;
	}
	.riga {
		display: flex;
		flex-wrap: wrap;
		gap: 0.8rem;
		align-items: flex-end;
	}
	.scelta {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		font-size: 0.8rem;
		color: #555;
	}
	select {
		font: inherit;
		font-size: 0.9rem;
		padding: 0.25rem;
		border: 1px solid #ccc;
		border-radius: 5px;
		background: #fff;
	}
	.lati {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem 0.9rem;
		font-size: 0.9rem;
	}
	.lati .nonso {
		color: #a6650a;
	}
	.check {
		font-size: 0.9rem;
		padding-bottom: 0.3rem;
	}
	.link {
		align-self: flex-start;
		font: inherit;
		font-size: 0.85rem;
		background: none;
		border: 0;
		color: #2a5db0;
		cursor: pointer;
		padding: 0;
	}
</style>
