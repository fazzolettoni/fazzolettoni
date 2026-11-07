<script lang="ts">
	import Fazzolettone3D from '#lib/components/Fazzolettone3D.svelte';
	import Disegno from '#lib/components/Disegno.svelte';
	import { ESEMPI } from '#lib/design/esempi.ts';
	import { SCHEDE_SICILIA } from '#lib/import/locale.ts';
	import type { Design } from '#lib/design/schema.ts';

	const voci: { id: string; nome: string; design: Design }[] = [
		...ESEMPI.map((e) => ({ id: `es-${e.id}`, nome: `Esempio · ${e.gruppo}`, design: e.design })),
		...SCHEDE_SICILIA.map((s) => ({
			id: `si-${s.gruppo.id}`,
			nome: `Sicilia · ${s.gruppo.nome}${s.gruppo.variante ? ` (${s.gruppo.variante})` : ''}`,
			design: s.conversione.design
		}))
	];

	let scelto = $state(voci[0].id);
	const voce = $derived(voci.find((v) => v.id === scelto) ?? voci[0]);
</script>

<svelte:head><title>Prova 3D · Fazzolettoni</title></svelte:head>

<main>
	<header>
		<h1>Prova 3D</h1>
		<select bind:value={scelto}>
			{#each voci as v (v.id)}<option value={v.id}>{v.nome}</option>{/each}
		</select>
		<span class="nota">Trascina per ruotare, rotella per lo zoom.</span>
	</header>
	<div class="area">
		<div class="tre"><Fazzolettone3D design={voce.design} /></div>
		<div class="piano"><Disegno design={voce.design} id="piano" /></div>
	</div>
</main>

<style>
	main {
		max-width: 1400px;
		margin: 0 auto;
		padding: 1rem;
		font-family: system-ui, sans-serif;
	}
	header {
		display: flex;
		gap: 1rem;
		align-items: center;
		flex-wrap: wrap;
	}
	h1 {
		margin: 0;
		font-size: 1.3rem;
	}
	select {
		font: inherit;
		max-width: 22rem;
	}
	.nota {
		color: #777;
		font-size: 0.85rem;
	}
	.area {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 1rem;
		margin-top: 1rem;
		align-items: start;
	}
	.tre {
		height: 70vh;
		background: #ece9e3;
		border-radius: 10px;
		overflow: hidden;
	}
</style>
