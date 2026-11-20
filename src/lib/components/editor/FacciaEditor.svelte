<script lang="ts">
	import FantasiaEditor from './FantasiaEditor.svelte';
	import ColoreInput from './ColoreInput.svelte';
	import ElementoEditor from './ElementoEditor.svelte';
	import LivelliFettucce from './LivelliFettucce.svelte';
	import { nuovoColore, nuovoElemento } from '#lib/design/nuovo.ts';
	import type { Faccia, Fondo, Forma } from '#lib/design/schema.ts';

	let {
		faccia = $bindable(),
		forma,
		chiave
	}: {
		faccia: Faccia;
		forma: Forma;
		/** unico nella pagina (fronte/retro) */ chiave: string;
	} = $props();

	function cambiaTipoFondo(tipo: Fondo['tipo']) {
		const f = faccia.fondo;
		f.tipo = tipo;
		const quanti = tipo === 'tinta_unita' ? 1 : 2;
		while (f.colori.length < quanti) f.colori.push(nuovoColore());
		if (tipo !== 'fantasia') f.colori.splice(quanti);
		f.fantasia = tipo === 'fantasia' ? (f.fantasia ?? {}) : null;
	}
</script>

<section>
	<h3>Fondo</h3>
	<div class="tipi" role="radiogroup">
		{#each [['tinta_unita', 'tinta unita'], ['diviso', 'diviso a metà'], ['fantasia', 'fantasia']] as [v, etichetta]}
			<label class:attivo={faccia.fondo.tipo === v}>
				<input
					type="radio"
					name="fondo-{chiave}"
					checked={faccia.fondo.tipo === v}
					onchange={() => cambiaTipoFondo(v as Fondo['tipo'])}
				/>
				{etichetta}
			</label>
		{/each}
	</div>

	{#if faccia.fondo.tipo === 'tinta_unita'}
		<ColoreInput bind:colore={faccia.fondo.colori[0]} />
	{:else if faccia.fondo.tipo === 'diviso'}
		<div class="etichettato">
			<span>sinistra</span><ColoreInput bind:colore={faccia.fondo.colori[0]} />
		</div>
		<div class="etichettato">
			<span>destra</span><ColoreInput bind:colore={faccia.fondo.colori[1]} />
		</div>
	{:else}
		{#if faccia.fondo.fantasia}<FantasiaEditor bind:fantasia={faccia.fondo.fantasia} />{/if}
		<p class="nota">
			{faccia.fondo.fantasia?.asset
				? 'Il primo colore sta sotto l’immagine (si vede se ha parti trasparenti).'
				: 'Senza immagine la fantasia è resa in modo indicativo. Il primo colore è lo sfondo.'}
		</p>
		{#each faccia.fondo.colori as _, k (k)}
			<ColoreInput
				bind:colore={faccia.fondo.colori[k]}
				onrimuovi={faccia.fondo.colori.length > 1
					? () => faccia.fondo.colori.splice(k, 1)
					: undefined}
			/>
		{/each}
		<button type="button" class="link" onclick={() => faccia.fondo.colori.push(nuovoColore())}
			>+ colore</button
		>
	{/if}
</section>

<section>
	<h3>Fettucce</h3>
	<LivelliFettucce bind:fettucce={faccia.fettucce} {forma} />
</section>

<section>
	<h3>Toppe, loghi e scritte</h3>
	<div class="aggiungi">
		<button type="button" onclick={() => faccia.elementi.push(nuovoElemento('toppa'))}
			>+ toppa</button
		>
		<button type="button" onclick={() => faccia.elementi.push(nuovoElemento('logo'))}>+ logo</button
		>
		<button type="button" onclick={() => faccia.elementi.push(nuovoElemento('scritta'))}
			>+ scritta</button
		>
	</div>
	{#each faccia.elementi as _, k (k)}
		<ElementoEditor
			bind:elemento={faccia.elementi[k]}
			onelimina={() => faccia.elementi.splice(k, 1)}
		/>
	{/each}
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	h3 {
		margin: 0.4rem 0 0;
		font-size: 0.95rem;
	}
	.tipi {
		display: flex;
		gap: 0.3rem;
		flex-wrap: wrap;
	}
	.tipi label {
		font-size: 0.85rem;
		padding: 0.25rem 0.6rem;
		border: 1px solid #ccc;
		border-radius: 999px;
		cursor: pointer;
		background: #fff;
	}
	.tipi label.attivo {
		border-color: #2a5db0;
		background: #eaf1fc;
		color: #1d4688;
	}
	.tipi input {
		display: none;
	}
	.etichettato {
		display: grid;
		grid-template-columns: 4.5rem 1fr;
		align-items: center;
		font-size: 0.8rem;
		color: #666;
	}
	.nota {
		margin: 0;
		font-size: 0.75rem;
		color: #888;
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
	.aggiungi {
		display: flex;
		gap: 0.4rem;
	}
	.aggiungi button {
		font: inherit;
		font-size: 0.85rem;
		padding: 0.3rem 0.7rem;
		border: 1px solid #2a5db0;
		color: #2a5db0;
		background: #fff;
		border-radius: 6px;
		cursor: pointer;
	}
</style>
