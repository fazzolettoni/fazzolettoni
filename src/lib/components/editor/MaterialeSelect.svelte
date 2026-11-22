<script lang="ts">
	import { MATERIALI, type Materiale } from '#lib/design/schema.ts';

	let {
		materiale = $bindable(),
		etichetta = 'Tessuto'
	}: { materiale: Materiale | null | undefined; etichetta?: string } = $props();
</script>

<label class="scelta">
	<span>{etichetta}</span>
	<select
		value={materiale ?? ''}
		onchange={(e) => (materiale = (e.currentTarget.value || null) as Materiale | null)}
	>
		<option value="">non so</option>
		{#each Object.entries(MATERIALI) as [v, nome]}<option value={v}>{nome}</option>{/each}
	</select>
</label>

<style>
	.scelta {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		font-size: 0.8rem;
		color: #555;
		align-self: flex-start;
	}
	select {
		font: inherit;
		font-size: 0.9rem;
		padding: 0.25rem;
		border: 1px solid #ccc;
		border-radius: 5px;
		background: #fff;
	}
</style>
