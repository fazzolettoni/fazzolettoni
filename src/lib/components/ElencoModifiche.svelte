<script lang="ts">
	import type { Modifica } from '#lib/server/modifiche.ts';
	let { modifiche }: { modifiche: Modifica[] } = $props();
	const data = (s: string) =>
		new Date(s).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' });
</script>

<table>
	<tbody>
		{#each modifiche as m (m.id)}
			<tr>
				<td class="quando">{data(m.creata_il)}</td>
				<td>
					{#if m.percorso}<a href={m.percorso}>{m.titolo}</a>{:else}{m.titolo}{/if}
					<span class="tipo {m.tipo}">{m.tipo}</span>
					{#if m.commento}<span class="commento">— {m.commento}</span>{/if}
				</td>
				<td class="chi">
					{#if m.autore}
						<a href="/modifiche?utente={m.autore.id}">{m.autore.nome}</a>
						{#if m.autore.bannato}<span class="tipo sospeso">sospeso</span>{/if}
					{:else}{m.autore_nome ?? '—'}{/if}
				</td>
				<td>
					{#if m.percorso}<a href="{m.percorso}/storia">storia</a>{/if}
				</td>
			</tr>
		{:else}
			<tr><td>Nessuna modifica.</td></tr>
		{/each}
	</tbody>
</table>

<style>
	table {
		width: 100%;
		border-collapse: collapse;
		background: #fff;
		border-radius: 8px;
		font-size: 0.88rem;
	}
	td {
		padding: 0.45rem 0.6rem;
		border-bottom: 1px solid #eee;
		vertical-align: top;
	}
	.quando {
		color: #777;
		white-space: nowrap;
	}
	.chi {
		white-space: nowrap;
	}
	a {
		color: #2a5db0;
		text-decoration: none;
	}
	.tipo {
		font-size: 0.7rem;
		padding: 0.05rem 0.45rem;
		border-radius: 999px;
		background: #eee;
		color: #555;
		margin-left: 0.3rem;
	}
	.tipo.ripristino,
	.tipo.sospeso {
		background: #fbe4e2;
		color: #9b2a20;
	}
	.tipo.creazione {
		background: #e6f4ea;
		color: #2c7a3f;
	}
	.commento {
		color: #666;
	}
</style>
