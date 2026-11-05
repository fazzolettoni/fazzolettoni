<script lang="ts">
	import FettucciaEditor from './FettucciaEditor.svelte';
	import { nuovaFettuccia } from '#lib/design/nuovo.ts';
	import type { Fettuccia, Forma } from '#lib/design/schema.ts';

	/**
	 * Le fettucce come livelli: nell'array l'ultima è disegnata sopra; qui, come nei programmi di
	 * grafica, la lista è mostrata al contrario (in alto il livello superiore).
	 */
	let { fettucce = $bindable(), forma }: { fettucce: Fettuccia[]; forma: Forma } = $props();

	// Chiavi stabili per oggetto, così il riordino non scambia lo stato dei pannelli
	const chiavi = new WeakMap<object, number>();
	let prossima = 0;
	const chiave = (f: Fettuccia) => {
		if (!chiavi.has(f)) chiavi.set(f, prossima++);
		return chiavi.get(f)!;
	};

	const righe = $derived(fettucce.map((f, i) => ({ f, i, chiave: chiave(f) })).reverse());

	function sposta(da: number, a: number) {
		if (a < 0 || a >= fettucce.length || da === a) return;
		const [f] = fettucce.splice(da, 1);
		fettucce.splice(a, 0, f);
	}

	function duplica(i: number) {
		fettucce.splice(i + 1, 0, $state.snapshot(fettucce[i]));
	}

	// Trascinamento: si attiva solo dalla maniglia, per non disturbare i campi
	let presa = $state<number | null>(null);
	let sopra = $state<number | null>(null);
</script>

<div class="livelli">
	<button type="button" class="aggiungi" onclick={() => fettucce.push(nuovaFettuccia(forma))}
		>+ fettuccia (in cima)</button
	>
	{#if fettucce.length === 0}
		<p class="vuoto">Nessuna fettuccia.</p>
	{:else}
		<p class="aiuto">In alto il livello che sta sopra: le fettucce possono coprirsi a vicenda.</p>
	{/if}
	<ol>
		{#each righe as r (r.chiave)}
			<li
				draggable={presa === r.i}
				class:sopra={sopra === r.i && presa !== r.i}
				ondragstart={(e) => e.dataTransfer?.setData('text/plain', String(r.i))}
				ondragover={(e) => {
					if (presa == null) return;
					e.preventDefault();
					sopra = r.i;
				}}
				ondrop={(e) => {
					e.preventDefault();
					if (presa != null) sposta(presa, r.i);
					presa = sopra = null;
				}}
				ondragend={() => (presa = sopra = null)}
			>
				<div class="strumenti">
					<span
						class="maniglia"
						title="Trascina per riordinare"
						role="button"
						tabindex="-1"
						onpointerdown={() => (presa = r.i)}
						onpointerup={() => (presa = null)}>⠿</span
					>
					<button
						type="button"
						title="Sposta sopra"
						disabled={r.i === fettucce.length - 1}
						onclick={() => sposta(r.i, r.i + 1)}>↑</button
					>
					<button
						type="button"
						title="Sposta sotto"
						disabled={r.i === 0}
						onclick={() => sposta(r.i, r.i - 1)}>↓</button
					>
					<button type="button" title="Duplica" onclick={() => duplica(r.i)}>⧉</button>
					<button type="button" title="Elimina" onclick={() => fettucce.splice(r.i, 1)}>×</button>
				</div>
				<FettucciaEditor bind:fettuccia={fettucce[r.i]} {forma} numero={r.i + 1} />
			</li>
		{/each}
	</ol>
</div>

<style>
	.livelli {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	ol {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	li {
		display: flex;
		gap: 0.3rem;
		align-items: flex-start;
		border-radius: 8px;
	}
	li.sopra {
		outline: 2px dashed #2a5db0;
		outline-offset: 2px;
	}
	li > :global(details) {
		flex: 1;
		min-width: 0;
	}
	.strumenti {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		padding-top: 0.25rem;
	}
	.maniglia {
		cursor: grab;
		text-align: center;
		color: #999;
		user-select: none;
		touch-action: none;
	}
	.strumenti button {
		width: 1.6rem;
		height: 1.6rem;
		padding: 0;
		font: inherit;
		font-size: 0.8rem;
		border: 1px solid #ddd;
		border-radius: 5px;
		background: #f7f6f3;
		cursor: pointer;
	}
	.strumenti button:disabled {
		opacity: 0.35;
		cursor: default;
	}
	.aggiungi {
		align-self: flex-start;
		font: inherit;
		font-size: 0.85rem;
		padding: 0.3rem 0.7rem;
		border: 1px solid #2a5db0;
		color: #2a5db0;
		background: #fff;
		border-radius: 6px;
		cursor: pointer;
	}
	.aiuto,
	.vuoto {
		margin: 0;
		font-size: 0.8rem;
		color: #888;
	}
</style>
