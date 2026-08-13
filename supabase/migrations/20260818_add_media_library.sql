-- ============================================================
-- ComHub — Migration Supabase (PostgreSQL)
-- 20260818_add_media_library
--
-- Additive uniquement : nouvelle table `media_items` — catalogue de
-- métadonnées pour la Médiathèque (Mediatheque.jsx). Aucun fichier réel
-- stocké ni lu (lecture simulée côté UI, comme partout ailleurs dans
-- l'app). Catalogue en LECTURE SEULE côté client pour l'instant :
-- aucune policy insert/update/delete — le contenu sera alimenté
-- directement en base jusqu'à une future phase de stockage de fichiers
-- qui ajoutera un vrai flux de création. Réutilise is_member_of()
-- défini dans 20260812_init_schema.sql.
-- ============================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'media_type') then
    create type media_type as enum ('video', 'audio');
  end if;
end $$;

create table if not exists public.media_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  speaker text,
  type media_type not null default 'audio',
  series text,
  duration text,
  plays integer not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.media_items is 'Fiche de médiathèque (métadonnées uniquement, aucun fichier réel). Lecture seule côté client pour l''instant.';

create index if not exists idx_media_items_org on public.media_items(organization_id);

alter table public.media_items enable row level security;

drop policy if exists "media_items_select" on public.media_items;
create policy "media_items_select" on public.media_items
  for select using (public.is_member_of(organization_id));

-- Volontairement aucune policy insert/update/delete : voir décision de
-- portée du module (lecture seule pour cette passe).
