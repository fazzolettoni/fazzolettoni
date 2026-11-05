<script lang="ts">
	import { renderDesign, type QualeFaccia } from '#lib/design/render.ts';
	import type { Design } from '#lib/design/schema.ts';

	/** Il disegno di una faccia; `id` deve essere unico nella pagina. */
	let {
		design,
		faccia = 'fronte',
		id
	}: { design: Design; faccia?: QualeFaccia; id: string } = $props();
	const r = $derived(renderDesign(design, { faccia, id }));
</script>

<div class="disegno">{@html r.svg}</div>

<style>
	.disegno :global(svg) {
		width: 100%;
		height: auto;
		display: block;
	}
</style>
