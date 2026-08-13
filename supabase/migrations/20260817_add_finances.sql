-- ============================================================
-- ComHub — Migration Supabase (PostgreSQL)
-- 20260817_add_finances
--
-- Additive uniquement : nouvelle table `contributions` — promesses de
-- don/cotisation (Finances.jsx). Le règlement effectif (Mobile
-- Money/virement) reste manuel, hors app. Réutilise is_member_of()/
-- is_admin_of() définis dans 20260812_init_schema.sql.
-- ============================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'contribution_frequency') then
    create type contribution_frequency as enum ('once', 'monthly', 'yearly');
  end if;
  if not exists (select 1 from pg_type where typname = 'contribution_category') then
    create type contribution_category as enum ('dime', 'offrande', 'projet', 'cotisation', 'mecenat', 'don', 'parrainage');
  end if;
  if not exists (select 1 from pg_type where typname = 'contribution_status') then
    create type contribution_status as enum ('promesse', 'confirme', 'annule');
  end if;
end $$;

create table if not exists public.contributions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  -- Nullable + on delete set null : un admin garde la visibilité comptable
  -- même si le contributeur a supprimé son compte (is_admin_of ne dépend
  -- pas de user_id).
  user_id uuid references public.profiles(id) on delete set null,
  amount numeric(12,2) not null check (amount > 0),
  currency_code text not null default 'EUR',
  category contribution_category not null,
  frequency contribution_frequency not null default 'once',
  status contribution_status not null default 'promesse',
  created_at timestamptz not null default now()
);

comment on table public.contributions is 'Promesse/enregistrement de contribution financière — le règlement effectif reste manuel, hors app.';

create index if not exists idx_contributions_org on public.contributions(organization_id);
create index if not exists idx_contributions_user on public.contributions(user_id);

alter table public.contributions enable row level security;

-- Confidentialité : chaque membre voit ses propres contributions ; les
-- admins (pas les leaders) voient le registre complet de l'organisation.
drop policy if exists "contributions_select_own_or_admin" on public.contributions;
create policy "contributions_select_own_or_admin" on public.contributions
  for select using (user_id = auth.uid() or public.is_admin_of(organization_id));

drop policy if exists "contributions_insert_self" on public.contributions;
create policy "contributions_insert_self" on public.contributions
  for insert with check (public.is_member_of(organization_id) and user_id = auth.uid());

drop policy if exists "contributions_update_admin" on public.contributions;
create policy "contributions_update_admin" on public.contributions
  for update using (public.is_admin_of(organization_id));

-- Volontairement AUCUNE policy delete : mentalité de piste d'audit pour
-- des données financières — un admin fait évoluer le statut (update)
-- plutôt que de supprimer la ligne.
