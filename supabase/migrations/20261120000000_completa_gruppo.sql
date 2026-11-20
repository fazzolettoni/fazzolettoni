-- Completa i dati di un gruppo esistente da una fonte esterna (es. elenco indirizzi AGESCI
-- Sicilia) senza toccare quello che c'è già: si aggiungono solo i campi assenti o vuoti.
-- Crea una nuova revisione di tipo "import" sopra quella corrente, quindi lo storico e le
-- modifiche fatte dagli utenti restano. Restituisce i campi aggiunti (vuoto = niente da fare).
create function completa_gruppo(p_id uuid, p_aggiunte jsonb, p_fonte text, p_commento text)
returns text[] language plpgsql security definer set search_path = public as $$
declare
	g gruppi;
	attuali jsonb;
	nuovi jsonb;
	aggiunti text[] := '{}';
	k text;
	v jsonb;
begin
	if coalesce(auth.role(), '') <> 'service_role' then
		raise exception 'Solo per gli script di import' using errcode = '42501';
	end if;
	select * into g from gruppi where id = p_id for update;
	if not found then raise exception 'Gruppo inesistente'; end if;
	select dati into attuali from revisioni where id = g.revisione_corrente;
	nuovi := coalesce(attuali, '{}'::jsonb);
	for k, v in select * from jsonb_each(p_aggiunte) loop
		if v is not null and v <> 'null'::jsonb
			and (not nuovi ? k or nuovi -> k = 'null'::jsonb or nuovi ->> k = '') then
			nuovi := jsonb_set(nuovi, array[k], v);
			aggiunti := aggiunti || k;
		end if;
	end loop;
	if cardinality(aggiunti) > 0 then
		perform _applica_gruppo(p_id, g.associazione, nuovi, 'import', null, p_fonte, p_commento, null);
	end if;
	return aggiunti;
end $$;

revoke execute on function completa_gruppo from public, anon, authenticated;
grant execute on function completa_gruppo to service_role;
