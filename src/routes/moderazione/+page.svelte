<script lang="ts">
	import { enhance } from '$app/forms';
	import ElencoModifiche from '#lib/components/ElencoModifiche.svelte';
	import type { PageProps } from './$types';
	let { data, form }: PageProps = $props();
	const admin = $derived(data.profilo?.ruolo === 'amministratore');
</script>

<svelte:head><title>Moderazione · Fazzolettoni</title></svelte:head>

<main>
	<h1>Moderazione</h1>
	{#if form?.errore}<p class="errore">{form.errore}</p>{/if}
	{#if form?.messaggio}<p class="ok">{form.messaggio}</p>{/if}

	<h2>Utenti</h2>
	<table>
		<tbody>
			{#each data.utenti as u (u.id)}
				<tr class:sospeso={u.bannato}>
					<td><a href="/modifiche?utente={u.id}">{u.nome}</a></td>
					<td>
						{#if admin && u.id !== data.profilo?.id}
							<form method="POST" action="?/ruolo" use:enhance class="inline">
								<input type="hidden" name="utente" value={u.id} />
								<select
									name="ruolo"
									value={u.ruolo}
									onchange={(e) => e.currentTarget.form?.requestSubmit()}
								>
									<option value="utente">utente</option>
									<option value="moderatore">moderatore</option>
									<option value="amministratore">amministratore</option>
								</select>
							</form>
						{:else}{u.ruolo}{/if}
					</td>
					<td>{u.bannato ? 'sospeso' : ''}</td>
					<td class="azioni">
						{#if u.id !== data.profilo?.id && u.ruolo !== 'amministratore'}
							<form
								method="POST"
								action={u.bannato ? '?/riattiva' : '?/sospendi'}
								use:enhance
								class="inline"
							>
								<input type="hidden" name="utente" value={u.id} />
								<button>{u.bannato ? 'riattiva' : 'sospendi'}</button>
							</form>
							<form
								method="POST"
								action="?/annulla"
								use:enhance
								class="inline"
								onsubmit={(e) => {
									if (!confirm(`Annullare tutte le modifiche di ${u.nome} ancora in vigore?`))
										e.preventDefault();
								}}
							>
								<input type="hidden" name="utente" value={u.id} />
								<button>annulla le sue modifiche</button>
							</form>
						{/if}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>

	<h2>Ultime modifiche</h2>
	<ElencoModifiche modifiche={data.modifiche} />
</main>

<style>
	main {
		max-width: 1000px;
		margin: 0 auto;
		padding: 1.2rem 1.5rem 3rem;
	}
	h2 {
		font-size: 1.05rem;
		margin-top: 1.5rem;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		background: #fff;
		font-size: 0.88rem;
	}
	td {
		padding: 0.4rem 0.6rem;
		border-bottom: 1px solid #eee;
	}
	tr.sospeso td {
		color: #9b2a20;
	}
	a {
		color: #2a5db0;
		text-decoration: none;
	}
	.inline {
		display: inline;
		margin: 0;
	}
	.azioni {
		display: flex;
		gap: 0.4rem;
		justify-content: flex-end;
	}
	button,
	select {
		font: inherit;
		font-size: 0.8rem;
		padding: 0.15rem 0.5rem;
		border: 1px solid #ccc;
		border-radius: 5px;
		background: #f7f6f3;
		cursor: pointer;
	}
	.errore {
		color: #b3261e;
	}
	.ok {
		color: #2c7a3f;
	}
</style>
