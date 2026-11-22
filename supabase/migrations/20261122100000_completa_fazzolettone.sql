-- Aggiunge dati a un fazzolettone da uno script (es. i materiali della raccolta siciliana).
-- Lo script prepara i dati completi partendo dalla revisione corrente e li passa insieme al
-- numero di quella revisione: se nel frattempo qualcuno ha modificato il fazzolettone non si
-- scrive niente (restituisce false), così nessuna modifica degli utenti va persa.
-- Crea una nuova revisione "import" sopra la corrente. Solo per gli script.
create function completa_fazzolettone(p_id uuid, p_dati jsonb, p_revisione bigint, p_fonte text, p_commento text)
returns boolean language plpgsql security definer set search_path = public as $$
declare
	f fazzolettoni;
begin
	if coalesce(auth.role(), '') <> 'service_role' then
		raise exception 'Solo per gli script di import' using errcode = '42501';
	end if;
	select * into f from fazzolettoni where id = p_id for update;
	if not found then raise exception 'Fazzolettone inesistente'; end if;
	if f.revisione_corrente is distinct from p_revisione then return false; end if;
	perform _applica_fazzolettone(f.id, f.gruppo_id, p_dati, 'import', null, p_fonte, p_commento, null);
	return true;
end $$;

revoke execute on function completa_fazzolettone from public, anon, authenticated;
grant execute on function completa_fazzolettone to service_role;
