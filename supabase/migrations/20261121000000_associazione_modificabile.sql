-- L'associazione di un gruppo si può cambiare dalla modifica del gruppo.
-- È scritta anche nei dati della revisione: si vede nello storico e un ripristino la riporta.
-- Il vecchio URL (che contiene l'associazione) resta come redirect.

-- dati: { nome, regione, associazione?, zona?, attivo?, indirizzo?, anno_fondazione?, ... }
create or replace function _applica_gruppo(
	p_id uuid, p_associazione text, p_dati jsonb, p_tipo tipo_revisione,
	p_autore uuid, p_autore_nome text, p_commento text, p_ripristina bigint
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
	g gruppi;
	rev bigint;
	nuovo_slug text;
	nuova_regione text;
	associazione_nuova text;
	vecchio_percorso text;
	dati jsonb;
	n int := 1;
begin
	if coalesce(trim(p_dati ->> 'nome'), '') = '' or coalesce(trim(p_dati ->> 'regione'), '') = '' then
		raise exception 'Nome e regione sono obbligatori';
	end if;

	if p_id is null then
		if not exists (select 1 from associazioni where sigla = p_associazione) then
			raise exception 'Associazione sconosciuta';
		end if;
		insert into gruppi (associazione, nome, slug, regione, regione_slug)
		values (p_associazione, '', gen_random_uuid()::text, '', '')
		returning * into g;
	else
		select * into g from gruppi where id = p_id for update;
		if not found then raise exception 'Gruppo inesistente'; end if;
		vecchio_percorso := g.associazione || '/' || g.regione_slug || '/' || g.slug;
	end if;

	-- associazione: quella chiesta, altrimenti quella scritta nei dati, altrimenti l'attuale
	associazione_nuova := coalesce(nullif(p_associazione, ''), nullif(p_dati ->> 'associazione', ''), g.associazione);
	if not exists (select 1 from associazioni where sigla = associazione_nuova) then
		raise exception 'Associazione sconosciuta';
	end if;
	dati := jsonb_set(p_dati, '{associazione}', to_jsonb(associazione_nuova));

	insert into revisioni (entita, entita_id, dati, tipo, autore, autore_nome, commento, precedente, ripristina)
	values ('gruppo', g.id, dati, p_tipo, p_autore, p_autore_nome, nullif(trim(p_commento), ''),
		g.revisione_corrente, p_ripristina)
	returning id into rev;

	nuova_regione := slugify(dati ->> 'regione');
	nuovo_slug := slugify(dati ->> 'nome');
	-- slug unico dentro associazione + regione
	while exists (
		select 1 from gruppi
		where associazione = associazione_nuova and regione_slug = nuova_regione
			and slug = nuovo_slug || case when n > 1 then '-' || n else '' end and id <> g.id
	) loop
		n := n + 1;
	end loop;
	if n > 1 then nuovo_slug := nuovo_slug || '-' || n; end if;

	update gruppi set
		associazione = associazione_nuova,
		nome = trim(dati ->> 'nome'),
		regione = trim(dati ->> 'regione'),
		regione_slug = nuova_regione,
		slug = nuovo_slug,
		zona = nullif(trim(dati ->> 'zona'), ''),
		attivo = coalesce((dati ->> 'attivo')::boolean, true),
		revisione_corrente = rev
	where id = g.id;

	-- il vecchio URL resta come redirect
	if vecchio_percorso is not null
		and vecchio_percorso <> associazione_nuova || '/' || nuova_regione || '/' || nuovo_slug then
		insert into slug_storici (percorso, entita, entita_id) values (vecchio_percorso, 'gruppo', g.id)
		on conflict (percorso) do update set entita_id = excluded.entita_id, entita = excluded.entita;
	end if;
	return g.id;
end $$;

-- Il ripristino riporta anche l'associazione, se la revisione la contiene (quelle vecchie no:
-- in quel caso resta l'attuale).
create or replace function ripristina(p_revisione bigint, p_commento text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
	r revisioni;
	u uuid := utente_attivo();
	f fazzolettoni;
	g gruppi;
begin
	select * into r from revisioni where id = p_revisione;
	if not found then raise exception 'Revisione inesistente'; end if;
	if r.entita = 'gruppo' then
		select * into g from gruppi where id = r.entita_id;
		return _applica_gruppo(g.id, coalesce(r.dati ->> 'associazione', g.associazione), r.dati,
			'ripristino', u, null,
			coalesce(nullif(trim(p_commento), ''), 'Ripristinata la revisione ' || r.id), r.id);
	else
		select * into f from fazzolettoni where id = r.entita_id;
		return _applica_fazzolettone(f.id, f.gruppo_id, r.dati, 'ripristino', u, null,
			coalesce(nullif(trim(p_commento), ''), 'Ripristinata la revisione ' || r.id), r.id);
	end if;
end $$;
