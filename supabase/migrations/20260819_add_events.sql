-- ============================================================
-- ComHub — Migration Supabase (PostgreSQL)
-- 20260819_add_events
--
-- Additive uniquement : nouvelles tables `events`, `event_registrations`
-- — calendrier d'événements (Evenements.jsx). Réutilise
-- is_member_of()/is_admin_or_leader_of()/is_admin_of() définis dans
-- 20260812_init_schema.sql.
-- ============================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'event_category') then
    -- Union des ids des 3 jeux de catégories par type d'organisation
    -- (church/business/ngo) — 'formation' est partagé entre les trois.
    create type event_category as enum (
      'culte', 'priere', 'jeunesse', 'formation',
      'reunion', 'teambuilding', 'conference',
      'mission', 'collecte', 'benevolat'
    );
  end if;
end $$;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  title text not null,
  category event_category not null,
  event_date date not null,
  -- Format d'affichage déjà produit côté client ('14h00', cohérent avec
  -- le mock) — stocké tel quel, comme `duration text` sur media_items.
  event_time text,
  location text,
  capacity integer not null default 50,
  description text,
  created_at timestamptz not null default now()
);

comment on table public.events is 'Événement du calendrier d''une organisation.';

create table if not exists public.event_registrations (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

comment on table public.event_registrations is 'Inscription d''un utilisateur à un événement — le nombre de participants est toujours recalculé à partir de cette table, jamais stocké.';

create index if not exists idx_events_org on public.events(organization_id);
create index if not exists idx_event_registrations_user on public.event_registrations(user_id);

alter table public.events enable row level security;
alter table public.event_registrations enable row level security;

drop policy if exists "events_select" on public.events;
create policy "events_select" on public.events
  for select using (public.is_member_of(organization_id));

drop policy if exists "events_insert_admin_or_leader" on public.events;
create policy "events_insert_admin_or_leader" on public.events
  for insert with check (public.is_admin_or_leader_of(organization_id) and created_by = auth.uid());

drop policy if exists "events_update_admin_or_leader" on public.events;
create policy "events_update_admin_or_leader" on public.events
  for update using (public.is_admin_or_leader_of(organization_id));

drop policy if exists "events_delete_admin" on public.events;
create policy "events_delete_admin" on public.events
  for delete using (public.is_admin_of(organization_id));

-- Même schéma à deux niveaux déjà utilisé par group_members_select /
-- prayer_reactions_select.
drop policy if exists "event_registrations_select" on public.event_registrations;
create policy "event_registrations_select" on public.event_registrations
  for select using (
    exists (select 1 from public.events e where e.id = event_registrations.event_id and public.is_member_of(e.organization_id))
  );

drop policy if exists "event_registrations_insert_self" on public.event_registrations;
create policy "event_registrations_insert_self" on public.event_registrations
  for insert with check (
    user_id = auth.uid()
    and exists (select 1 from public.events e where e.id = event_registrations.event_id and public.is_member_of(e.organization_id))
  );

drop policy if exists "event_registrations_delete_self" on public.event_registrations;
create policy "event_registrations_delete_self" on public.event_registrations
  for delete using (user_id = auth.uid());
