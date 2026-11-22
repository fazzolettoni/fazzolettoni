-- Cambia il testo di una fonte (es. la citazione richiesta da AGESCI Sicilia) in tutti i
-- fazzolettoni che la usano. Per ognuno crea una nuova revisione "import" sopra quella
-- corrente in cui cambia solo la nota di quella fonte: il resto, comprese le modifiche degli
-- utenti, resta com'è. Dove il testo è già quello giusto non fa niente. Restituisce quanti
-- fazzolettoni ha aggiornato. Solo per gli script.
create function aggiorna_fonte(p_tipo text, p_nota text, p_fonte text, p_commento text)
returns int language plpgsql security definer set search_path = public as $$
declare
	f record;
	nuove jsonb;
	n int := 0;
begin
	if coalesce(auth.role(), '') <> 'service_role' then
		raise exception 'Solo per gli script di import' using errcode = '42501';
	end if;
	for f in
		select z.id, z.gruppo_id, r.dati
		from fazzolettoni z join revisioni r on r.id = z.revisione_corrente
		where exists (
			select 1 from jsonb_array_elements(coalesce(r.dati -> 'fonti', '[]')) x
			where x ->> 'tipo' = p_tipo and x ->> 'nota' is distinct from p_nota
		)
		for update of z
	loop
		select jsonb_agg(
			case when x ->> 'tipo' = p_tipo then jsonb_set(x, '{nota}', to_jsonb(p_nota)) else x end
			order by i)
		into nuove
		from jsonb_array_elements(f.dati -> 'fonti') with ordinality as t(x, i);
		perform _applica_fazzolettone(f.id, f.gruppo_id, jsonb_set(f.dati, '{fonti}', nuove),
			'import', null, p_fonte, p_commento, null);
		n := n + 1;
	end loop;
	return n;
end $$;

revoke execute on function aggiorna_fonte from public, anon, authenticated;
grant execute on function aggiorna_fonte to service_role;
