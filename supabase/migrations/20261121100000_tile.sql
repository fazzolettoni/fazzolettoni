-- Tile delle fantasie (fondo e fettucce): immagini che si ripetono su una griglia rettangolare.
-- Il nome del file è l'impronta SHA-256 del contenuto più l'estensione: un file non si
-- sovrascrive mai, quindi le revisioni vecchie mostrano sempre la tile che avevano.
-- Per ora caricano solo gli amministratori (gli SVG non vengono ancora ripuliti: SPEC §11).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('tile', 'tile', true, 1048576,
	array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])
on conflict (id) do nothing;

create function e_amministratore() returns boolean
language sql security definer set search_path = public stable as $$
	select exists (
		select 1 from profili where id = auth.uid() and ruolo = 'amministratore' and not bannato
	)
$$;

create policy "tile: caricano gli amministratori" on storage.objects
for insert to authenticated
with check (
	bucket_id = 'tile'
	and public.e_amministratore()
	and name ~ '^[0-9a-f]{64}\.(png|jpg|webp|svg)$'
);
