<script lang="ts">
	import { enhance } from '$app/forms';
	import { differenze } from '#lib/design/diff.ts';
	import type { RevisioneConAutore } from '#lib/supabase/dati.ts';

	let {
		revisioni,
		puoRipristinare,
		percorso
	}: { revisioni: RevisioneConAutore[]; puoRipristinare: boolean; percorso: string } = $props();

	const TIPI = {
		creazione: 'creazione',
		modifica: 'modifica',
		ripristino: 'ripristino',
		import: 'import'
	};
	const data = (s: string) =>
		new Date(s).toLocaleString('it-IT', { dateStyle: 'medium', timeStyle: 'short' });
	// la revisione precedente nella lista (che è in ordine decrescente)
	const prima = (i: number) => revisioni[i + 1]?.dati ?? null;
</script>

<ol class="storia">
	{#each revisioni as r, i (r.id)}
		{@const diff = differenze(prima(i), r.dati)}
		<li class:corrente={i === 0}>
			<div class="testa">
				<span class="quando">{data(r.creata_il)}</span>
				<span class="chi">{r.profilo?.nome ?? r.autore_nome ?? 'sconosciuto'}</span>
				<span class="tipo {r.tipo}">{TIPI[r.tipo]}</span>
				{#if i === 0}<span class="tipo corrente">versione attuale</span>{/if}
				<span class="spazio"></span>
				<a href="{percorso}?rev={r.id}">vedi</a>
				{#if puoRipristinare && i > 0}
					<form method="POST" action="?/ripristina" use:enhance>
						<input type="hidden" name="revisione" value={r.id} />
						<button>ripristina questa versione</button>
					</form>
				{/if}
			</div>
			{#if r.commento}<p class="commento">{r.commento}</p>{/if}
			{#if i < revisioni.length - 1}
				{#if diff.length}
					<details>
						<summary>{diff.length} {diff.length === 1 ? 'cambiamento' : 'cambiamenti'}</summary>
						<ul class="diff">
							{#each diff.slice(0, 60) as d}
								<li>
									<span class="campo">{d.campo}</span>
									{#if d.prima != null}<del>{d.prima}</del>{/if}
									{#if d.dopo != null}<ins>{d.dopo}</ins>{/if}
								</li>
							{/each}
						</ul>
					</details>
				{:else}
					<p class="commento">nessun cambiamento nei dati</p>
				{/if}
			{/if}
		</li>
	{/each}
</ol>

<style>
	.storia {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	li {
		background: #fff;
		border: 1px solid #e3e1dc;
		border-radius: 8px;
		padding: 0.6rem 0.8rem;
	}
	li.corrente {
		border-color: #2a5db0;
	}
	.testa {
		display: flex;
		gap: 0.6rem;
		align-items: center;
		flex-wrap: wrap;
		font-size: 0.88rem;
	}
	.quando {
		color: #555;
	}
	.chi {
		font-weight: 600;
	}
	.tipo {
		font-size: 0.72rem;
		padding: 0.05rem 0.5rem;
		border-radius: 999px;
		background: #eee;
		color: #555;
	}
	.tipo.ripristino {
		background: #fbe4e2;
		color: #9b2a20;
	}
	.tipo.corrente {
		background: #e3ecfb;
		color: #1d4688;
	}
	.spazio {
		flex: 1;
	}
	a {
		color: #2a5db0;
		text-decoration: none;
	}
	form {
		margin: 0;
	}
	button {
		font: inherit;
		font-size: 0.8rem;
		padding: 0.15rem 0.6rem;
		border: 1px solid #ccc;
		border-radius: 5px;
		background: #f7f6f3;
		cursor: pointer;
	}
	.commento {
		margin: 0.3rem 0 0;
		font-size: 0.85rem;
		color: #555;
	}
	details summary {
		font-size: 0.82rem;
		color: #666;
		cursor: pointer;
		margin-top: 0.3rem;
	}
	.diff {
		margin: 0.3rem 0 0;
		padding-left: 1rem;
		font-size: 0.8rem;
	}
	.campo {
		color: #777;
		margin-right: 0.3rem;
	}
	del {
		color: #9b2a20;
		margin-right: 0.3rem;
	}
	ins {
		color: #2c7a3f;
		text-decoration: none;
	}
</style>
