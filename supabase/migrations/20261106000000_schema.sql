-- Fazzolettoni: schema iniziale (SPEC §3, §5, §6)
--
-- Principio: lo storico è append-only. Gruppi e fazzolettoni puntano alla loro revisione
-- corrente; ogni modifica (anche un ripristino) aggiunge una riga a `revisioni`.
-- Le scritture passano solo da funzioni (security definer): niente insert/update diretti.

-- ------------------------------------------------------------------ profili e ruoli

create type ruolo as enum ('utente', 'moderatore', 'amministratore');

create table profili (
	id uuid primary key references auth.users (id) on delete cascade,
	nome text not null,
	ruolo ruolo not null default 'utente',
	bannato boolean not null default false,
	creato_il timestamptz not null default now()
);

comment on table profili is 'Dati pubblici degli utenti. L''email resta in auth.users e non è mai esposta.';

-- Alla registrazione: profilo con un nome neutro (niente email in pubblico)
create function crea_profilo() returns trigger
language plpgsql security definer set search_path = public as $$
begin
	insert into profili (id, nome) values (new.id, 'utente-' || substr(new.id::text, 1, 6));
	return new;
end $$;

create trigger crea_profilo after insert on auth.users
for each row execute function crea_profilo();

-- ------------------------------------------------------------------ entità

create table associazioni (
	sigla text primary key check (sigla ~ '^[a-z]+$'),
	nome text not null
);

insert into associazioni (sigla, nome) values
	('agesci', 'Associazione Guide e Scouts Cattolici Italiani'),
	('cngei', 'Corpo Nazionale Giovani Esploratori ed Esploratrici Italiani'),
	('fse', 'Associazione Italiana Guide e Scouts d''Europa Cattolici'),
	('asci', 'Associazione Scouts Cattolici Italiani'),
	('agi', 'Associazione Guide Italiane'),
	('masci', 'Movimento Adulti Scout Cattolici Italiani');

create table gruppi (
	id uuid primary key default gen_random_uuid(),
	associazione text not null references associazioni (sigla),
	-- campi derivati dalla revisione corrente, per URL e ricerca
	nome text not null,
	slug text not null,
	regione text not null,
	regione_slug text not null,
	zona text,
	attivo boolean not null default true,
	revisione_corrente bigint,
	creato_il timestamptz not null default now(),
	unique (associazione, regione_slug, slug)
);

create table fazzolettoni (
	id uuid primary key default gen_random_uuid(),
	gruppo_id uuid not null references gruppi (id) on delete cascade,
	-- derivati dalla revisione corrente
	slug text not null,
	data_inizio jsonb,
	data_fine jsonb,
	revisione_corrente bigint,
	creato_il timestamptz not null default now(),
	unique (gruppo_id, slug)
);

create type tipo_revisione as enum ('creazione', 'modifica', 'ripristino', 'import');

create table revisioni (
	id bigint generated always as identity primary key,
	entita text not null check (entita in ('gruppo', 'fazzolettone')),
	entita_id uuid not null,
	dati jsonb not null,
	tipo tipo_revisione not null,
	autore uuid references profili (id),
	-- per gli import senza utente (es. "Import AGESCI Sicilia")
	autore_nome text,
	commento text,
	precedente bigint references revisioni (id),
	ripristina bigint references revisioni (id),
	creata_il timestamptz not null default now()
);

create index on revisioni (entita, entita_id, id desc);
create index on revisioni (autore, id desc);
create index on fazzolettoni (gruppo_id);

alter table gruppi add foreign key (revisione_corrente) references revisioni (id);
alter table fazzolettoni add foreign key (revisione_corrente) references revisioni (id);

-- Le revisioni non si modificano né si cancellano, nemmeno per errore
create function revisioni_immutabili() returns trigger language plpgsql as $$
begin
	raise exception 'Le revisioni sono immutabili';
end $$;

create trigger revisioni_immutabili before update or delete on revisioni
for each row execute function revisioni_immutabili();

-- URL usati in passato: restano validi come redirect (SPEC §5)
create table slug_storici (
	percorso text primary key,
	entita text not null check (entita in ('gruppo', 'fazzolettone')),
	entita_id uuid not null,
	creato_il timestamptz not null default now()
);

-- ------------------------------------------------------------------ lettura pubblica

alter table profili enable row level security;
alter table associazioni enable row level security;
alter table gruppi enable row level security;
alter table fazzolettoni enable row level security;
alter table revisioni enable row level security;
alter table slug_storici enable row level security;

create policy "lettura pubblica" on profili for select using (true);
create policy "lettura pubblica" on associazioni for select using (true);
create policy "lettura pubblica" on gruppi for select using (true);
create policy "lettura pubblica" on fazzolettoni for select using (true);
create policy "lettura pubblica" on revisioni for select using (true);
create policy "lettura pubblica" on slug_storici for select using (true);
-- Nessuna policy di scrittura: si scrive solo tramite le funzioni qui sotto.

-- ------------------------------------------------------------------ utilità

create function slugify(t text) returns text language sql immutable as $$
	select trim(both '-' from regexp_replace(
		lower(translate(coalesce(t, ''),
			'àáâäèéêëìíîïòóôöùúûüçñ''’', 'aaaaeeeeiiiioooouuuucn  ')),
		'[^a-z0-9]+', '-', 'g'))
$$;

-- "1974-1996", "circa-1980-1996", "dal-1996", "fino-al-1996"; null se le date sono ignote
create function slug_periodo(inizio jsonb, fine jsonb) returns text language sql immutable as $$
	select case
		when inizio ? 'anno' and fine ? 'anno' then
			case when (inizio ->> 'circa')::boolean then 'circa-' else '' end || (inizio ->> 'anno') || '-' ||
			case when (fine ->> 'circa')::boolean then 'circa-' else '' end || (fine ->> 'anno')
		when inizio ? 'anno' then
			'dal-' || case when (inizio ->> 'circa')::boolean then 'circa-' else '' end || (inizio ->> 'anno')
		when fine ? 'anno' then 'fino-al-' || (fine ->> 'anno')
		else null
	end
$$;

-- Utente corrente, che deve esistere e non essere bannato
create function utente_attivo() returns uuid
language plpgsql security definer set search_path = public as $$
declare
	u uuid := auth.uid();
	p profili;
begin
	if u is null then
		raise exception 'Serve l''accesso per modificare' using errcode = '42501';
	end if;
	select * into p from profili where id = u;
	if p.bannato then
		raise exception 'Utente sospeso' using errcode = '42501';
	end if;
	return u;
end $$;

create function e_moderatore() returns boolean
language sql security definer set search_path = public stable as $$
	select exists (
		select 1 from profili
		where id = auth.uid() and ruolo in ('moderatore', 'amministratore') and not bannato
	)
$$;

-- ------------------------------------------------------------------ scrittura: gruppi

-- dati: { nome, regione, zona?, attivo?, link?: [{tipo, url}] }
create function _applica_gruppo(
	p_id uuid, p_associazione text, p_dati jsonb, p_tipo tipo_revisione,
	p_autore uuid, p_autore_nome text, p_commento text, p_ripristina bigint
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
	g gruppi;
	rev bigint;
	nuovo_slug text;
	nuova_regione text;
	vecchio_percorso text;
	n int := 1;
begin
	if coalesce(trim(p_dati ->> 'nome'), '') = '' or coalesce(trim(p_dati ->> 'regione'), '') = '' then
		raise exception 'Nome e regione sono obbligatori';
	end if;

	if p_id is null then
		insert into gruppi (associazione, nome, slug, regione, regione_slug)
		values (p_associazione, '', gen_random_uuid()::text, '', '')
		returning * into g;
	else
		select * into g from gruppi where id = p_id for update;
		if not found then raise exception 'Gruppo inesistente'; end if;
		vecchio_percorso := g.associazione || '/' || g.regione_slug || '/' || g.slug;
	end if;

	insert into revisioni (entita, entita_id, dati, tipo, autore, autore_nome, commento, precedente, ripristina)
	values ('gruppo', g.id, p_dati, p_tipo, p_autore, p_autore_nome, nullif(trim(p_commento), ''),
		g.revisione_corrente, p_ripristina)
	returning id into rev;

	nuova_regione := slugify(p_dati ->> 'regione');
	nuovo_slug := slugify(p_dati ->> 'nome');
	-- slug unico dentro associazione + regione
	while exists (
		select 1 from gruppi
		where associazione = g.associazione and regione_slug = nuova_regione
			and slug = nuovo_slug || case when n > 1 then '-' || n else '' end and id <> g.id
	) loop
		n := n + 1;
	end loop;
	if n > 1 then nuovo_slug := nuovo_slug || '-' || n; end if;

	update gruppi set
		nome = trim(p_dati ->> 'nome'),
		regione = trim(p_dati ->> 'regione'),
		regione_slug = nuova_regione,
		slug = nuovo_slug,
		zona = nullif(trim(p_dati ->> 'zona'), ''),
		attivo = coalesce((p_dati ->> 'attivo')::boolean, true),
		revisione_corrente = rev
	where id = g.id;

	-- il vecchio URL resta come redirect
	if vecchio_percorso is not null
		and vecchio_percorso <> g.associazione || '/' || nuova_regione || '/' || nuovo_slug then
		insert into slug_storici (percorso, entita, entita_id) values (vecchio_percorso, 'gruppo', g.id)
		on conflict (percorso) do update set entita_id = excluded.entita_id, entita = excluded.entita;
	end if;
	return g.id;
end $$;

create function salva_gruppo(p_id uuid, p_associazione text, p_dati jsonb, p_commento text)
returns uuid language plpgsql security definer set search_path = public as $$
begin
	return _applica_gruppo(p_id, p_associazione, p_dati,
		case when p_id is null then 'creazione' else 'modifica' end::tipo_revisione,
		utente_attivo(), null, p_commento, null);
end $$;

-- ------------------------------------------------------------------ scrittura: fazzolettoni

-- dati: { design, data_inizio?, data_fine?, significato?, fonti?: [...], affidabilita?, note? }
create function _applica_fazzolettone(
	p_id uuid, p_gruppo uuid, p_dati jsonb, p_tipo tipo_revisione,
	p_autore uuid, p_autore_nome text, p_commento text, p_ripristina bigint
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
	f fazzolettoni;
	g gruppi;
	rev bigint;
	base text;
	nuovo_slug text;
	n int := 1;
begin
	if jsonb_typeof(p_dati -> 'design') <> 'object' then
		raise exception 'Manca la descrizione del fazzolettone';
	end if;

	if p_id is null then
		select * into g from gruppi where id = p_gruppo;
		if not found then raise exception 'Gruppo inesistente'; end if;
		insert into fazzolettoni (gruppo_id, slug) values (g.id, gen_random_uuid()::text)
		returning * into f;
	else
		select * into f from fazzolettoni where id = p_id for update;
		if not found then raise exception 'Fazzolettone inesistente'; end if;
		select * into g from gruppi where id = f.gruppo_id;
	end if;

	insert into revisioni (entita, entita_id, dati, tipo, autore, autore_nome, commento, precedente, ripristina)
	values ('fazzolettone', f.id, p_dati, p_tipo, p_autore, p_autore_nome, nullif(trim(p_commento), ''),
		f.revisione_corrente, p_ripristina)
	returning id into rev;

	-- slug dal periodo; se le date sono ignote, un progressivo stabile
	base := slug_periodo(p_dati -> 'data_inizio', p_dati -> 'data_fine');
	if base is null then
		if f.slug ~ '^[0-9]+$' then
			base := f.slug;
		else
			select coalesce(max(slug::int), 0) + 1 into n from fazzolettoni
			where gruppo_id = f.gruppo_id and slug ~ '^[0-9]+$' and id <> f.id;
			base := n::text;
		end if;
	end if;
	nuovo_slug := base;
	n := 1;
	while exists (select 1 from fazzolettoni where gruppo_id = f.gruppo_id and slug = nuovo_slug and id <> f.id) loop
		n := n + 1;
		nuovo_slug := base || '-' || n;
	end loop;

	if p_id is not null and f.slug <> nuovo_slug then
		insert into slug_storici (percorso, entita, entita_id)
		values (g.associazione || '/' || g.regione_slug || '/' || g.slug || '/' || f.slug, 'fazzolettone', f.id)
		on conflict (percorso) do update set entita_id = excluded.entita_id, entita = excluded.entita;
	end if;

	update fazzolettoni set
		slug = nuovo_slug,
		data_inizio = case when jsonb_typeof(p_dati -> 'data_inizio') = 'object' then p_dati -> 'data_inizio' end,
		data_fine = case when jsonb_typeof(p_dati -> 'data_fine') = 'object' then p_dati -> 'data_fine' end,
		revisione_corrente = rev
	where id = f.id;
	return f.id;
end $$;

create function salva_fazzolettone(p_id uuid, p_gruppo uuid, p_dati jsonb, p_commento text)
returns uuid language plpgsql security definer set search_path = public as $$
begin
	return _applica_fazzolettone(p_id, p_gruppo, p_dati,
		case when p_id is null then 'creazione' else 'modifica' end::tipo_revisione,
		utente_attivo(), null, p_commento, null);
end $$;

-- ------------------------------------------------------------------ ripristino

-- Qualunque utente registrato può ripristinare una versione precedente (come in una wiki):
-- è una nuova revisione con i dati di quella vecchia.
create function ripristina(p_revisione bigint, p_commento text)
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
		return _applica_gruppo(g.id, g.associazione, r.dati, 'ripristino', u, null,
			coalesce(nullif(trim(p_commento), ''), 'Ripristinata la revisione ' || r.id), r.id);
	else
		select * into f from fazzolettoni where id = r.entita_id;
		return _applica_fazzolettone(f.id, f.gruppo_id, r.dati, 'ripristino', u, null,
			coalesce(nullif(trim(p_commento), ''), 'Ripristinata la revisione ' || r.id), r.id);
	end if;
end $$;

-- ------------------------------------------------------------------ moderazione

create function imposta_ban(p_utente uuid, p_bannato boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
	if not e_moderatore() then raise exception 'Solo i moderatori' using errcode = '42501'; end if;
	if p_utente = auth.uid() then raise exception 'Non puoi sospendere te stesso'; end if;
	if exists (select 1 from profili where id = p_utente and ruolo = 'amministratore') then
		raise exception 'Non si può sospendere un amministratore';
	end if;
	update profili set bannato = p_bannato where id = p_utente;
end $$;

-- Annulla tutte le modifiche di un utente: per ogni scheda in cui l'ultima revisione è sua,
-- ripristina l'ultima revisione di qualcun altro. Restituisce il numero di schede ripristinate.
create function annulla_utente(p_utente uuid)
returns int language plpgsql security definer set search_path = public as $$
declare
	moderatore uuid := utente_attivo();
	x record;
	buona revisioni;
	n int := 0;
begin
	if not e_moderatore() then raise exception 'Solo i moderatori' using errcode = '42501'; end if;
	for x in
		select r.entita, r.entita_id, r.id as corrente from revisioni r
		left join gruppi g on r.entita = 'gruppo' and g.revisione_corrente = r.id
		left join fazzolettoni f on r.entita = 'fazzolettone' and f.revisione_corrente = r.id
		where r.autore = p_utente and (g.id is not null or f.id is not null)
	loop
		select * into buona from revisioni
		where entita = x.entita and entita_id = x.entita_id and id < x.corrente
			and (autore is distinct from p_utente)
		order by id desc limit 1;
		if found then
			perform ripristina(buona.id, 'Annullate le modifiche di un utente sospeso');
			n := n + 1;
		end if;
	end loop;
	return n;
end $$;

create function imposta_ruolo(p_utente uuid, p_ruolo ruolo)
returns void language plpgsql security definer set search_path = public as $$
begin
	if not exists (select 1 from profili where id = auth.uid() and ruolo = 'amministratore') then
		raise exception 'Solo gli amministratori' using errcode = '42501';
	end if;
	update profili set ruolo = p_ruolo where id = p_utente;
end $$;

create function cambia_nome(p_nome text)
returns void language plpgsql security definer set search_path = public as $$
begin
	if length(trim(p_nome)) not between 2 and 40 then raise exception 'Nome tra 2 e 40 caratteri'; end if;
	update profili set nome = trim(p_nome) where id = utente_attivo();
end $$;

-- ------------------------------------------------------------------ import (solo service_role)

create function importa(p_associazione text, p_gruppo jsonb, p_fazzolettone jsonb, p_fonte text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
	gid uuid;
begin
	if coalesce(auth.role(), '') <> 'service_role' then
		raise exception 'Solo per gli script di import' using errcode = '42501';
	end if;
	gid := _applica_gruppo(null, p_associazione, p_gruppo, 'import', null, p_fonte, null, null);
	if p_fazzolettone is not null then
		perform _applica_fazzolettone(null, gid, p_fazzolettone, 'import', null, p_fonte, null, null);
	end if;
	return gid;
end $$;

-- Le funzioni interne non sono chiamabili dall'esterno
revoke execute on function _applica_gruppo, _applica_fazzolettone from public, anon, authenticated;
revoke execute on function importa from public, anon, authenticated;
grant execute on function importa to service_role;
revoke execute on function salva_gruppo, salva_fazzolettone, ripristina, imposta_ban, annulla_utente,
	imposta_ruolo, cambia_nome from public, anon;
grant execute on function salva_gruppo, salva_fazzolettone, ripristina, imposta_ban, annulla_utente,
	imposta_ruolo, cambia_nome to authenticated;
