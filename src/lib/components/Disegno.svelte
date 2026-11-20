<script lang="ts">
	import { renderDesign, type QualeFaccia } from '#lib/design/render.ts';
	import { TILE, richiediTile } from '#lib/design/tile.svelte.ts';
	import type { Design } from '#lib/design/schema.ts';

	/** Il disegno di una faccia; `id` deve essere unico nella pagina. */
	let {
		design,
		faccia = 'fronte',
		id
	}: { design: Design; faccia?: QualeFaccia; id: string } = $props();
	const r = $derived(renderDesign(design, { faccia, id, tile: TILE }));
	// le fantasie arrivano dopo: il disegno si aggiorna quando le tile sono pronte
	$effect(() => richiediTile(design));
</script>

<div class="disegno">{@html r.svg}</div>

<style>
	.disegno :global(svg) {
		width: 100%;
		height: auto;
		display: block;
	}
</style>
