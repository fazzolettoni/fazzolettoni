-- Permessi espliciti per l'API, senza contare sull'esposizione automatica delle tabelle
-- (che sui progetti online si può disattivare). Le righe restano filtrate dalle regole RLS:
-- tutti leggono, nessuno scrive direttamente (le scritture passano dalle funzioni).
grant usage on schema public to anon, authenticated, service_role;

grant select on profili, associazioni, gruppi, fazzolettoni, revisioni, slug_storici
	to anon, authenticated;
grant all on profili, associazioni, gruppi, fazzolettoni, revisioni, slug_storici
	to service_role;
