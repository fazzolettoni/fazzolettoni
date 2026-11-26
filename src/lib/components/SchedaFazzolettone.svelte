<script lang="ts">
	import Disegno from './Disegno.svelte';
	import { avvisiDesign } from '#lib/design/render.ts';
	import { MATERIALI, type Colore } from '#lib/design/schema.ts';
	import { TILE } from '#lib/design/tile.svelte.ts';
	import { testoPeriodo } from '#lib/supabase/dati.ts';
	import type { DatiFazzolettone } from '#lib/supabase/tipi.ts';
	import { linkSicuro, testoFonte } from '#lib/fonti.ts';

	let {
		dati,
		id,
		associazione = null
	}: {
		dati: DatiFazzolettone;
		id: string;
		/** Sigla dell'associazione, per il portafazzolettone del 3D. */
		associazione?: string | null;
	} = $props();

	const d = $derived(dati.design);
	const avvisi = $derived([...(dati.da_rivedere ?? []), ...avvisiDesign(d, TILE)]);
	const quadrato = $derived(d.forma === 'quadrato');
	const misura = $derived(quadrato ? d.dimensioni_mm?.lato : d.dimensioni_mm?.cateto);
	const fondo = $derived(d.fronte.fondo);
	const incerto = $derived(
		!dati.data_inizio || !!dati.data_inizio.circa || !!dati.data_fine?.circa
	);
	const periodo = $derived(
		testoPeriodo({ data_inizio: dati.data_inizio ?? null, data_fine: dati.data_fine ?? null })
	);
	const nomeColore = (c: Colore) => c.nome ?? (c.hex ? c.hex : 'sconosciuto');
	const FORME: Record<string, string> = { triangolo: 'Triangolo', quadrato: 'Quadrato' };
	/** Unisce le parti presenti con « · »; una stringa vuota in testa fa iniziare con il separatore. */
	const unisci = (parti: (string | number | null | undefined | false)[]) => {
		const [primo, ...resto] = parti;
		const t = resto.filter(Boolean).join(' · ');
		if (primo === '') return t ? ` · ${t}` : '';
		return [primo, ...resto].filter(Boolean).join(' · ');
	};
	const materiale = (m: string | null | undefined) =>
		m ? MATERIALI[m as keyof typeof MATERIALI]?.toLowerCase() : null;
</script>

{#snippet colore(c: Colore)}<span
		class="quadratino"
		class:stimato={!c.hex || c.approssimato}
		style:--c={c.hex ?? 'var(--inchiostro-2)'}
	></span>{nomeColore(c)}{/snippet}

<div class="corpo">
	<div class="immagini">
		<figure class="tre">
			<figcaption class="etichetta">Modello 3D · indossato</figcaption>
			<!-- three.js si scarica a parte, solo nelle pagine che lo mostrano -->
			<div class="riquadro">
				{#await import('./Fazzolettone3D.svelte') then m}
					<m.default design={d} {associazione} />
				{/await}
			</div>
			<span class="aiuto">trascina per ruotare · rotella per lo zoom</span>
		</figure>
		<figure class="fronte" class:quadrato>
			<figcaption class="etichetta">Fronte, steso</figcaption>
			<div class="riquadro"><Disegno design={d} id="{id}-f" /></div>
			<p class="nota-disegno">
				Disegno generato dai parametri della scheda, scaricabile in SVG e PNG.
			</p>
		</figure>
	</div>

	<div class="dati">
		{#if dati.significato}<blockquote>«{dati.significato}»</blockquote>{/if}
		<dl>
			<dt class="etichetta">Forma</dt>
			<dd>{unisci([FORME[d.forma ?? ''] ?? 'Sconosciuta', misura && `${misura / 10} cm`])}</dd>
			<dt class="etichetta">Fondo</dt>
			<dd>
				{#each fondo.colori as c, i}{#if i}{' / '}{/if}{@render colore(c)}{/each}{unisci([
					'',
					fondo.tipo === 'fantasia' &&
						`fantasia${fondo.fantasia?.descrizione ? ` (${fondo.fantasia.descrizione})` : ''}`,
					materiale(fondo.materiale)
				])}
			</dd>
			<dt class="etichetta">Fettucce</dt>
			<dd>
				{#each d.fronte.fettucce as f, i}{#if i}<br
						/>{/if}{#each f.colori as c, j}{#if j}{' + '}{/if}{@render colore(c)}{/each}{unisci([
						'',
						f.larghezza_mm && `${f.larghezza_mm / 10} cm`,
						materiale(f.materiale)
					])}{:else}nessuna{/each}
			</dd>
			<dt class="etichetta">Periodo</dt>
			<dd class:incerto>
				{periodo}{#if incerto}<span class="nota">{' · date incerte'}</span>{/if}
			</dd>
			{#if dati.fonti?.length}
				<dt class="etichetta">{dati.fonti.length > 1 ? 'Fonti' : 'Fonte'}</dt>
				<dd>
					{#each dati.fonti as f, i}{#if i}<br />{/if}{@const link = linkSicuro(f.url)}{#if link}<a
								href={link}
								target="_blank"
								rel="noreferrer nofollow">{testoFonte(f)}</a
							>{:else}{testoFonte(f)}{/if}{/each}
				</dd>
			{/if}
			{#if dati.affidabilita === 'importato'}
				<dt class="etichetta">Dati</dt>
				<dd>importati da un archivio esistente</dd>
			{/if}
		</dl>

		{#each dati.note ?? [] as n}<p class="nota-testo">{n}</p>{/each}

		{#if avvisi.length}
			<div class="rivedere">
				<p class="etichetta">
					Da rivedere · {avvisi.length}
					{avvisi.length === 1 ? 'avviso' : 'avvisi'}
				</p>
				<ul>
					{#each avvisi as a}<li>{a}</li>{/each}
				</ul>
				<p class="invito">Se conosci questo fazzolettone puoi correggere la scheda.</p>
			</div>
		{/if}
		<!-- I campi originali dell'import (dati_originali) restano nei dati ma non si mostrano:
			non si possono modificare dall'interfaccia. -->
	</div>
</div>

<style>
	.corpo {
		display: grid;
		grid-template-columns: repeat(12, minmax(0, 1fr));
		gap: 24px;
	}
	.immagini {
		grid-column: 1 / 8;
		display: flex;
		flex-direction: column;
		gap: 32px;
	}
	.dati {
		grid-column: 8 / 13;
	}
	@media (max-width: 800px) {
		.immagini,
		.dati {
			grid-column: 1 / -1;
		}
	}
	figure {
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.riquadro {
		background: var(--carta);
		position: relative;
		overflow: hidden;
	}
	.tre .riquadro {
		aspect-ratio: 4 / 3;
	}
	.aiuto {
		font-size: 12px;
		color: var(--inchiostro-2);
	}
	.fronte {
		width: 50%;
	}
	.fronte .riquadro {
		aspect-ratio: 16 / 10;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 16px;
	}
	.fronte .riquadro :global(.disegno) {
		width: 100%;
	}
	.fronte.quadrato .riquadro {
		aspect-ratio: 1;
	}
	.nota-disegno {
		margin: 0;
		font-size: 12px;
		color: var(--inchiostro-2);
	}
	@media (max-width: 800px) {
		.fronte {
			width: 100%;
		}
	}

	blockquote {
		margin: 0 0 28px;
		font-size: 22px;
		line-height: 1.35;
		font-style: italic;
		color: var(--testo-2);
	}
	dl {
		display: grid;
		grid-template-columns: 110px 1fr;
		margin: 0;
		border-top: 1px solid var(--inchiostro);
	}
	dt,
	dd {
		margin: 0;
		padding: 10px 0;
		border-bottom: 1px solid var(--filo);
	}
	dt {
		padding-top: 13px;
	}
	dd {
		font-size: 15px;
	}
	.quadratino {
		display: inline-block;
		width: 11px;
		height: 11px;
		border: 1px solid var(--inchiostro);
		background: var(--c);
		vertical-align: -1px;
		margin-right: 5px;
		box-sizing: border-box;
	}
	.quadratino.stimato {
		background: repeating-linear-gradient(45deg, var(--c) 0 2px, transparent 2px 5px);
		border-style: dashed;
	}
	dd.incerto {
		color: var(--ocra);
		text-decoration: underline dashed;
		text-underline-offset: 4px;
	}
	.nota-testo {
		font-size: 14px;
		color: var(--testo-2);
		margin: 16px 0 0;
	}
	.rivedere {
		margin-top: 28px;
		border: 1px dashed var(--ocra);
		padding: 14px 16px;
		color: var(--ocra);
	}
	.rivedere .etichetta {
		color: var(--ocra);
		margin: 0;
	}
	.rivedere ul {
		margin: 8px 0;
		padding-left: 18px;
		font-size: 14px;
		color: var(--testo-2);
	}
	.invito {
		margin: 0;
		font-size: 13px;
	}
</style>
