-- ============================================================
-- ComHub — Migration Supabase (PostgreSQL)
-- 20260822_storage_and_group_chat
--
-- 1. Stockage de fichiers réel (Supabase Storage) : photos de profil,
--    logo d'organisation, photo de groupe, pièces jointes de message.
-- 2. Chat de groupe réel (jusqu'ici sur données de démonstration
--    uniquement) : table `group_messages`, réutilise is_group_member()
--    de 20260821_group_privacy — un nouveau membre voit tout
--    l'historique depuis la création du groupe (même logique que
--    `messages`/Discussions).
-- 3. Pièces jointes ajoutées à `messages` (Discussions) pour la même
--    cohérence entre les deux surfaces de messagerie.
-- ============================================================

-- ============================================================
-- 1. COLONNES logo/photo (organizations, groups)
-- ============================================================
alter table public.organizations add column if not exists logo_url text;
alter table public.groups add column if not exists photo_url text;

-- ============================================================
-- 2. STORAGE BUCKETS
-- ============================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

-- ---------- avatars (public) ----------
-- Convention de chemin : profiles/{user_id}/..., organizations/{org_id}/...,
-- groups/{group_id}/... — le préfixe détermine qui a le droit d'écrire.
create or replace function public.can_write_avatar_path(p_name text)
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  parts text[];
begin
  parts := storage.foldername(p_name);
  if parts[1] = 'profiles' then
    return parts[2] = auth.uid()::text;
  elsif parts[1] = 'organizations' then
    return public.is_admin_of(parts[2]::uuid);
  elsif parts[1] = 'groups' then
    return public.is_admin_or_leader_of(public.group_org_id(parts[2]::uuid));
  end if;
  return false;
exception when others then
  return false; -- chemin malformé (uuid invalide, etc.) : refus par défaut
end;
$$;

drop policy if exists "avatars_select" on storage.objects;
create policy "avatars_select" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars_insert" on storage.objects;
create policy "avatars_insert" on storage.objects
  for insert with check (bucket_id = 'avatars' and public.can_write_avatar_path(name));

drop policy if exists "avatars_update" on storage.objects;
create policy "avatars_update" on storage.objects
  for update using (bucket_id = 'avatars' and public.can_write_avatar_path(name));

drop policy if exists "avatars_delete" on storage.objects;
create policy "avatars_delete" on storage.objects
  for delete using (bucket_id = 'avatars' and public.can_write_avatar_path(name));

-- ---------- attachments (privé) ----------
-- Convention de chemin : conversations/{conversation_id}/..., groups/{group_id}/...
create or replace function public.can_access_attachment_path(p_name text)
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  parts text[];
begin
  parts := storage.foldername(p_name);
  if parts[1] = 'conversations' then
    return public.is_participant_of(parts[2]::uuid);
  elsif parts[1] = 'groups' then
    return public.is_group_member(parts[2]::uuid);
  end if;
  return false;
exception when others then
  return false;
end;
$$;

drop policy if exists "attachments_select" on storage.objects;
create policy "attachments_select" on storage.objects
  for select using (bucket_id = 'attachments' and public.can_access_attachment_path(name));

drop policy if exists "attachments_insert" on storage.objects;
create policy "attachments_insert" on storage.objects
  for insert with check (bucket_id = 'attachments' and public.can_access_attachment_path(name));

drop policy if exists "attachments_delete" on storage.objects;
create policy "attachments_delete" on storage.objects
  for delete using (bucket_id = 'attachments' and public.can_access_attachment_path(name));

-- ============================================================
-- 3. PIÈCES JOINTES sur `messages` (Discussions, déjà réel)
-- ============================================================
alter table public.messages add column if not exists attachment_path text;
alter table public.messages add column if not exists attachment_name text;
alter table public.messages add column if not exists attachment_type text;
alter table public.messages alter column content drop not null;

do $$
begin
  alter table public.messages
    add constraint messages_content_or_attachment check (content is not null or attachment_path is not null);
exception when duplicate_object then null;
end $$;

-- ============================================================
-- 4. TABLE `group_messages` (chat de groupe réel)
-- ============================================================
create table if not exists public.group_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  content text,
  attachment_path text,
  attachment_name text,
  attachment_type text,
  created_at timestamptz not null default now(),
  constraint group_messages_content_or_attachment check (content is not null or attachment_path is not null)
);

comment on table public.group_messages is 'Message du chat interne d''un groupe. Historique complet visible par tout membre actuel (pas de coupure à la date d''adhésion).';

create index if not exists idx_group_messages_group_created on public.group_messages(group_id, created_at);

alter table public.group_messages enable row level security;

drop policy if exists "group_messages_select" on public.group_messages;
create policy "group_messages_select" on public.group_messages
  for select using (public.is_group_member(group_id));

drop policy if exists "group_messages_insert" on public.group_messages;
create policy "group_messages_insert" on public.group_messages
  for insert with check (public.is_group_member(group_id) and sender_id = auth.uid());

-- ============================================================
-- 5. REALTIME
-- ============================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'group_messages'
  ) then
    alter publication supabase_realtime add table public.group_messages;
  end if;
end $$;
