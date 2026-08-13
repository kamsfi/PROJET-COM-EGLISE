-- ============================================================
-- ComHub — Migration Supabase (PostgreSQL)
-- 20260814_add_announcements
--
-- Additive uniquement : nouvelle table `public.announcements`, alimentant
-- le fil d'annonces officielles de l'onglet Canaux (Canaux.jsx). Aucune
-- table existante n'est modifiée. Réutilise les fonctions RLS
-- (is_member_of / is_admin_or_leader_of / is_admin_of) définies dans
-- 20260812_init_schema.sql.
-- ============================================================

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  -- Nullable + `on delete set null` : la suppression d'un compte utilisateur
  -- ne doit pas effacer l'historique des annonces qu'il a publiées.
  author_id uuid references public.profiles(id) on delete set null,
  content text not null,
  created_at timestamptz not null default now()
);

comment on table public.announcements is 'Annonce officielle publiée dans le fil "Canaux" d''une organisation.';
comment on column public.announcements.author_id is 'Auteur de l''annonce. NULL si le compte a été supprimé depuis.';

create index if not exists idx_announcements_org on public.announcements(organization_id);

alter table public.announcements enable row level security;

drop policy if exists "announcements_select" on public.announcements;
create policy "announcements_select" on public.announcements
  for select using (public.is_member_of(organization_id));

-- author_id = auth.uid() empêche un admin/leader de publier une annonce
-- au nom d'un autre membre (le simple mirroring de groups_insert_admin_or_leader
-- ne le vérifierait pas, faute de colonne auteur sur `groups`).
drop policy if exists "announcements_insert_admin_or_leader" on public.announcements;
create policy "announcements_insert_admin_or_leader" on public.announcements
  for insert with check (
    public.is_admin_or_leader_of(organization_id)
    and author_id = auth.uid()
  );

drop policy if exists "announcements_update_admin_or_leader" on public.announcements;
create policy "announcements_update_admin_or_leader" on public.announcements
  for update using (public.is_admin_or_leader_of(organization_id));

drop policy if exists "announcements_delete_admin" on public.announcements;
create policy "announcements_delete_admin" on public.announcements
  for delete using (public.is_admin_of(organization_id));
