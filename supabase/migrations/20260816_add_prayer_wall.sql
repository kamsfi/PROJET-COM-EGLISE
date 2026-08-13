-- ============================================================
-- ComHub — Migration Supabase (PostgreSQL)
-- 20260816_add_prayer_wall
--
-- Additive uniquement : nouvelles tables `prayer_requests`,
-- `prayer_reactions` — mur de prières (Direct & Prières). Réutilise
-- is_member_of()/is_admin_of() définis dans 20260812_init_schema.sql.
-- ============================================================

-- ============================================================
-- 1. ENUM
-- ============================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'prayer_category') then
    create type prayer_category as enum ('guérison', 'famille', 'travail', 'remerciement', 'autre');
  end if;
end $$;

-- ============================================================
-- 2. TABLES
-- ============================================================
create table if not exists public.prayer_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  -- Nullable + on delete set null : même raisonnement que announcements.author_id.
  author_id uuid references public.profiles(id) on delete set null,
  category prayer_category not null default 'autre',
  content text not null,
  created_at timestamptz not null default now()
);

comment on table public.prayer_requests is 'Intention de prière partagée avec la communauté d''une organisation.';

create table if not exists public.prayer_reactions (
  prayer_request_id uuid not null references public.prayer_requests(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (prayer_request_id, user_id)
);

comment on table public.prayer_reactions is '"Je prie pour cela" — un utilisateur ne peut réagir qu''une fois par intention (clé primaire composite).';

-- ============================================================
-- 3. INDEX
-- ============================================================
create index if not exists idx_prayer_requests_org on public.prayer_requests(organization_id);

-- ============================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================
alter table public.prayer_requests enable row level security;
alter table public.prayer_reactions enable row level security;

drop policy if exists "prayer_requests_select" on public.prayer_requests;
create policy "prayer_requests_select" on public.prayer_requests
  for select using (public.is_member_of(organization_id));

drop policy if exists "prayer_requests_insert_member" on public.prayer_requests;
create policy "prayer_requests_insert_member" on public.prayer_requests
  for insert with check (public.is_member_of(organization_id) and author_id = auth.uid());

drop policy if exists "prayer_requests_delete_admin" on public.prayer_requests;
create policy "prayer_requests_delete_admin" on public.prayer_requests
  for delete using (public.is_admin_of(organization_id));

-- Même schéma à deux niveaux (table enfant -> table parente -> vérification
-- d'organisation) déjà utilisé par group_members_select.
drop policy if exists "prayer_reactions_select" on public.prayer_reactions;
create policy "prayer_reactions_select" on public.prayer_reactions
  for select using (
    exists (select 1 from public.prayer_requests pr where pr.id = prayer_reactions.prayer_request_id and public.is_member_of(pr.organization_id))
  );

drop policy if exists "prayer_reactions_insert_self" on public.prayer_reactions;
create policy "prayer_reactions_insert_self" on public.prayer_reactions
  for insert with check (
    user_id = auth.uid()
    and exists (select 1 from public.prayer_requests pr where pr.id = prayer_reactions.prayer_request_id and public.is_member_of(pr.organization_id))
  );

drop policy if exists "prayer_reactions_delete_self" on public.prayer_reactions;
create policy "prayer_reactions_delete_self" on public.prayer_reactions
  for delete using (user_id = auth.uid());
