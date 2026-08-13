-- ============================================================
-- ComHub — Migration Supabase (PostgreSQL)
-- 20260812_init_schema
-- Plateforme multi-tenant : Églises, Entreprises, ONG
--
-- Migration gérée par la Supabase CLI (`supabase db push` /
-- `supabase migration up`). Idempotente : ré-exécutable sans erreur.
--
-- Sommaire :
--   0. Reset (idempotence totale)
--   1. Extensions
--   2. Enums
--   3. Tables (organizations, profiles, memberships, groups, group_members)
--   4. Index
--   5. Trigger `on_auth_user_created` (auth.users -> profiles, avec metadata)
--   5bis. Trigger d'auto-affectation aux groupes
--   6. Row Level Security (RLS) + policies
--   7. Données de test (seed) — "Église Centrale"
-- ============================================================

-- ============================================================
-- 0. RESET
--
-- Ce script est le tout premier "init" du schéma, prévu pour tourner
-- sur une base vierge OU dans un état incohérent (ex: une table
-- partiellement créée par un essai précédent, avec des colonnes
-- différentes). `create table if not exists` ignorerait silencieusement
-- une telle table obsolète au lieu de la corriger — on repart donc
-- toujours d'une table strictement vide pour ces 5 tables avant de les
-- recréer proprement.
--
-- ⚠️ Ne PAS reproduire cette section dans une future migration une fois
-- l'application en production avec de vraies données : les migrations
-- suivantes doivent être additives (ALTER TABLE), jamais destructives.
-- ============================================================
drop table if exists public.group_members cascade;
drop table if exists public.groups cascade;
drop table if exists public.memberships cascade;
drop table if exists public.profiles cascade;
drop table if exists public.organizations cascade;

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================
create extension if not exists "pgcrypto"; -- fournit gen_random_uuid()

-- ============================================================
-- 2. ENUMS
-- ============================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'organization_type') then
    create type organization_type as enum ('eglise', 'entreprise', 'ong');
  end if;

  if not exists (select 1 from pg_type where typname = 'user_gender') then
    create type user_gender as enum ('homme', 'femme');
  end if;

  if not exists (select 1 from pg_type where typname = 'member_role') then
    create type member_role as enum ('admin', 'leader', 'member');
  end if;

  if not exists (select 1 from pg_type where typname = 'group_targeting_type') then
    create type group_targeting_type as enum ('gender', 'age', 'skills', 'custom');
  end if;
end $$;

-- ============================================================
-- 3. TABLES
-- ============================================================

-- organizations : tenants (Église, Entreprise, ONG...)
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type organization_type not null,
  code_invitation text not null unique,
  -- Dénomination/siège auquel cette organisation est rattachée en tant
  -- qu'annexe/sous-compte. NULL pour un siège / une organisation autonome.
  parent_id uuid references public.organizations(id) on delete set null,
  -- Nécessaire pour amorcer les policies RLS de `memberships` (savoir qui
  -- a créé l'organisation avant qu'aucun admin n'existe encore — §6).
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.organizations is 'Organisation (workspace) multi-tenant : église, entreprise ou ONG.';
comment on column public.organizations.code_invitation is 'Code d''invitation unique utilisé pour rejoindre l''organisation.';
comment on column public.organizations.parent_id is 'Dénomination/siège parent (hiérarchie annexes). NULL = organisation racine.';

-- profiles : 1-1 avec auth.users (le téléphone/e-mail restent sur auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  avatar_url text,
  gender user_gender,
  date_of_birth date,
  profession text,
  skills text[] not null default '{}',
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'Profil applicatif de l''utilisateur, en miroir 1-1 de auth.users.';
comment on column public.profiles.date_of_birth is 'Utilisée pour l''auto-affectation par tranche d''âge et les rappels d''anniversaire par l''IA.';

-- memberships : appartenance + rôle d'un utilisateur dans une organisation
create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  role member_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (user_id, organization_id)
);

comment on table public.memberships is 'Table de jonction utilisateur <-> organisation, portant le rôle (admin/leader/member).';

-- groups : sous-communautés au sein d'une organisation
-- (ex: "Groupe Hommes", "Groupe Femmes", "Groupe Jeunesse")
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  targeting_type group_targeting_type not null default 'custom',
  -- Critères concrets exploités par le trigger d'auto-affectation, en
  -- fonction de `targeting_type`. Exemples :
  --   gender  -> {"gender": "femme"}
  --   age     -> {"min_age": 15, "max_age": 30}
  --   skills  -> {"skills": ["Musique", "Accueil"]}
  --   custom  -> {} (affectation manuelle uniquement)
  targeting_criteria jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

comment on column public.groups.targeting_type is 'Nature du ciblage utilisé pour l''auto-affectation des membres.';
comment on column public.groups.targeting_criteria is 'Critères concrets du ciblage, interprétés selon targeting_type.';

-- group_members
create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (group_id, user_id)
);

comment on table public.group_members is 'Appartenance d''un utilisateur à un groupe.';

-- ============================================================
-- 4. INDEX
-- ============================================================
create index if not exists idx_organizations_parent on public.organizations(parent_id);
create index if not exists idx_memberships_user on public.memberships(user_id);
create index if not exists idx_memberships_org on public.memberships(organization_id);
create index if not exists idx_groups_org on public.groups(organization_id);
create index if not exists idx_group_members_group on public.group_members(group_id);
create index if not exists idx_group_members_user on public.group_members(user_id);
create index if not exists idx_profiles_skills on public.profiles using gin (skills);
create index if not exists idx_groups_targeting_criteria on public.groups using gin (targeting_criteria);

-- ============================================================
-- 5. TRIGGER : on_auth_user_created
--
-- Crée automatiquement la ligne `profiles` correspondante dès qu'un
-- utilisateur s'inscrit via Supabase Auth (email, téléphone ou OAuth),
-- en reprenant TOUTES les metadata transmises au signUp() côté client
-- (`options.data`) : full_name, gender, date_of_birth, profession, skills.
--
-- Robustesse : aucune valeur invalide/manquante ne doit jamais faire
-- échouer l'inscription — chaque champ est validé/casté défensivement.
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gender_raw text;
  v_gender user_gender;
  v_dob_raw text;
  v_dob date;
  v_skills text[];
begin
  -- Genre : uniquement casté si la valeur correspond à l'enum, sinon NULL.
  v_gender_raw := new.raw_user_meta_data->>'gender';
  if v_gender_raw in ('homme', 'femme') then
    v_gender := v_gender_raw::user_gender;
  else
    v_gender := null;
  end if;

  -- Date de naissance : NULL si absente ou invalide plutôt que d'échouer.
  v_dob_raw := new.raw_user_meta_data->>'date_of_birth';
  begin
    v_dob := nullif(v_dob_raw, '')::date;
  exception when others then
    v_dob := null;
  end;

  -- Compétences : tableau JSON -> text[], vide par défaut.
  begin
    select coalesce(array_agg(value::text), '{}')
    into v_skills
    from jsonb_array_elements_text(coalesce(new.raw_user_meta_data->'skills', '[]'::jsonb)) as value;
  exception when others then
    v_skills := '{}';
  end;

  insert into public.profiles (id, full_name, gender, date_of_birth, profession, skills)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email, new.phone, 'Nouvel utilisateur'),
    v_gender,
    v_dob,
    new.raw_user_meta_data->>'profession',
    v_skills
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 5bis. TRIGGER : auto-affectation aux groupes
--
-- Miroir SQL de la logique frontend `matchGroupRules` : à l'ajout d'un
-- membre dans une organisation (ou à la mise à jour de son genre/date de
-- naissance/compétences), réévalue son appartenance aux groupes de cette
-- organisation dont les `targeting_criteria` correspondent à son profil.
-- ============================================================
create or replace function public.assign_profile_to_org_groups(p_user_id uuid, p_org_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
  v_age int;
  g record;
  matches boolean;
begin
  select * into v_profile from public.profiles where id = p_user_id;
  if not found then
    return;
  end if;

  v_age := case
    when v_profile.date_of_birth is null then null
    else extract(year from age(v_profile.date_of_birth))::int
  end;

  for g in
    select * from public.groups
    where organization_id = p_org_id
      and targeting_type <> 'custom'
  loop
    matches := true;

    if g.targeting_type = 'gender' and g.targeting_criteria ? 'gender' then
      matches := v_profile.gender is not null
        and (g.targeting_criteria->>'gender') = v_profile.gender::text;
    end if;

    if g.targeting_type = 'age' then
      if g.targeting_criteria ? 'min_age' then
        matches := matches and v_age is not null
          and v_age >= (g.targeting_criteria->>'min_age')::int;
      end if;
      if g.targeting_criteria ? 'max_age' then
        matches := matches and v_age is not null
          and v_age <= (g.targeting_criteria->>'max_age')::int;
      end if;
    end if;

    if g.targeting_type = 'skills' and g.targeting_criteria ? 'skills' then
      matches := v_profile.skills is not null
        and v_profile.skills && (
          select array_agg(value::text)
          from jsonb_array_elements_text(g.targeting_criteria->'skills')
        );
    end if;

    if matches then
      insert into public.group_members (group_id, user_id)
      values (g.id, p_user_id)
      on conflict (group_id, user_id) do nothing;
    end if;
  end loop;
end;
$$;

create or replace function public.trg_auto_assign_groups()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  if tg_table_name = 'memberships' then
    perform public.assign_profile_to_org_groups(new.user_id, new.organization_id);
    return new;
  end if;

  -- tg_table_name = 'profiles' : réévaluer pour chaque organisation du membre
  for v_org_id in
    select organization_id from public.memberships where user_id = new.id
  loop
    perform public.assign_profile_to_org_groups(new.id, v_org_id);
  end loop;

  return new;
end;
$$;

drop trigger if exists trg_auto_assign_on_membership on public.memberships;
create trigger trg_auto_assign_on_membership
  after insert on public.memberships
  for each row execute function public.trg_auto_assign_groups();

drop trigger if exists trg_auto_assign_on_profile_update on public.profiles;
create trigger trg_auto_assign_on_profile_update
  after update of gender, date_of_birth, skills on public.profiles
  for each row execute function public.trg_auto_assign_groups();

-- ============================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================================
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;

-- ---------- Fonctions utilitaires (security definer, anti-récursion RLS) ----------
create or replace function public.is_member_of(p_org_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.memberships
    where organization_id = p_org_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_admin_of(p_org_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.memberships
    where organization_id = p_org_id and user_id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_admin_or_leader_of(p_org_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.memberships
    where organization_id = p_org_id and user_id = auth.uid() and role in ('admin', 'leader')
  );
$$;

-- ---------- organizations ----------
drop policy if exists "organizations_select_member" on public.organizations;
create policy "organizations_select_member" on public.organizations
  for select using (public.is_member_of(id));

drop policy if exists "organizations_insert_authenticated" on public.organizations;
create policy "organizations_insert_authenticated" on public.organizations
  for insert with check (
    auth.uid() is not null
    and created_by = auth.uid()
    and (parent_id is null or public.is_admin_of(parent_id))
  );

drop policy if exists "organizations_update_admin" on public.organizations;
create policy "organizations_update_admin" on public.organizations
  for update using (public.is_admin_of(id));

-- Résolution d'un code d'invitation en organisation, utilisée par l'écran
-- d'inscription "Rejoindre une organisation" AVANT que l'utilisateur ne soit
-- membre (donc avant que la policy organizations_select_member ne s'applique).
-- security definer + retour limité aux champs non sensibles : ne permet pas
-- de lister/parcourir les organisations, seulement de résoudre un code connu.
create or replace function public.find_organization_by_code(p_code text)
returns table (id uuid, name text, type organization_type, code_invitation text)
language sql
security definer
stable
set search_path = public
as $$
  select o.id, o.name, o.type, o.code_invitation
  from public.organizations o
  where upper(o.code_invitation) = upper(p_code)
  limit 1;
$$;

grant execute on function public.find_organization_by_code(text) to anon, authenticated;

-- ---------- profiles ----------
drop policy if exists "profiles_select_self" on public.profiles;
create policy "profiles_select_self" on public.profiles
  for select using (id = auth.uid());

drop policy if exists "profiles_select_org_peers" on public.profiles;
create policy "profiles_select_org_peers" on public.profiles
  for select using (
    exists (
      select 1
      from public.memberships m1
      join public.memberships m2 on m1.organization_id = m2.organization_id
      where m1.user_id = auth.uid()
        and m2.user_id = public.profiles.id
    )
  );

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self" on public.profiles
  for insert with check (id = auth.uid());

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
  for update using (id = auth.uid());

-- ---------- memberships ----------
drop policy if exists "memberships_select_same_org" on public.memberships;
create policy "memberships_select_same_org" on public.memberships
  for select using (public.is_member_of(organization_id));

-- Insertion autorisée dans 2 cas :
--   1) un admin de l'organisation ajoute qui il veut, avec le rôle voulu ;
--   2) amorçage : le tout premier membre d'une organisation sans encore
--      aucun membre s'auto-désigne admin (fondateur).
-- L'auto-inscription en tant que "member" ne passe volontairement PAS par
-- cette policy : elle exigerait sinon uniquement de connaître l'UUID de
-- l'organisation (pas son code d'invitation) pour la rejoindre. Elle passe
-- exclusivement par la fonction `join_organization_by_code` ci-dessous, qui
-- vérifie le code côté serveur avant d'écrire (security definer, contourne
-- volontairement cette RLS le temps de l'insertion qu'elle contrôle elle-même).
drop policy if exists "memberships_insert" on public.memberships;
create policy "memberships_insert" on public.memberships
  for insert with check (
    public.is_admin_of(organization_id)
    or (
      user_id = auth.uid()
      and role = 'admin'
      and not exists (
        select 1 from public.memberships m
        where m.organization_id = memberships.organization_id
      )
    )
  );

-- Auto-inscription sécurisée : vérifie le code d'invitation côté serveur
-- puis crée l'adhésion "member" pour l'appelant authentifié. security
-- definer -> contourne intentionnellement `memberships_insert` ci-dessus
-- (qui n'autorise plus l'auto-inscription directe depuis le client).
create or replace function public.join_organization_by_code(p_code text)
returns table (id uuid, name text, type organization_type, code_invitation text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org public.organizations;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise.';
  end if;

  select * into v_org from public.organizations o where upper(o.code_invitation) = upper(p_code) limit 1;
  if not found then
    raise exception 'Code d''organisation introuvable.';
  end if;

  insert into public.memberships (user_id, organization_id, role)
  values (auth.uid(), v_org.id, 'member')
  on conflict (user_id, organization_id) do nothing;

  return query select v_org.id, v_org.name, v_org.type, v_org.code_invitation;
end;
$$;

grant execute on function public.join_organization_by_code(text) to authenticated;

drop policy if exists "memberships_update_admin" on public.memberships;
create policy "memberships_update_admin" on public.memberships
  for update using (public.is_admin_of(organization_id));

drop policy if exists "memberships_delete" on public.memberships;
create policy "memberships_delete" on public.memberships
  for delete using (
    public.is_admin_of(organization_id) or user_id = auth.uid()
  );

-- ---------- groups ----------
drop policy if exists "groups_select" on public.groups;
create policy "groups_select" on public.groups
  for select using (public.is_member_of(organization_id));

drop policy if exists "groups_insert_admin_or_leader" on public.groups;
create policy "groups_insert_admin_or_leader" on public.groups
  for insert with check (public.is_admin_or_leader_of(organization_id));

drop policy if exists "groups_update_admin_or_leader" on public.groups;
create policy "groups_update_admin_or_leader" on public.groups
  for update using (public.is_admin_or_leader_of(organization_id));

drop policy if exists "groups_delete_admin" on public.groups;
create policy "groups_delete_admin" on public.groups
  for delete using (public.is_admin_of(organization_id));

-- ---------- group_members ----------
drop policy if exists "group_members_select" on public.group_members;
create policy "group_members_select" on public.group_members
  for select using (
    exists (
      select 1 from public.groups g
      where g.id = group_members.group_id and public.is_member_of(g.organization_id)
    )
  );

drop policy if exists "group_members_insert" on public.group_members;
create policy "group_members_insert" on public.group_members
  for insert with check (
    exists (
      select 1 from public.groups g
      where g.id = group_members.group_id
        and (
          (group_members.user_id = auth.uid() and public.is_member_of(g.organization_id))
          or public.is_admin_or_leader_of(g.organization_id)
        )
    )
  );

drop policy if exists "group_members_delete" on public.group_members;
create policy "group_members_delete" on public.group_members
  for delete using (
    user_id = auth.uid()
    or exists (
      select 1 from public.groups g
      where g.id = group_members.group_id and public.is_admin_or_leader_of(g.organization_id)
    )
  );

-- ============================================================
-- 7. DONNÉES DE TEST (SEED) — organisation modèle "Église Centrale"
-- ============================================================
insert into public.organizations (id, name, type, code_invitation)
values ('11111111-1111-1111-1111-111111111111', 'Église Centrale', 'eglise', 'EGL-0001')
on conflict (code_invitation) do nothing;

insert into public.groups (organization_id, name, targeting_type, targeting_criteria)
values
  ('11111111-1111-1111-1111-111111111111', 'Groupe Hommes',   'gender', '{"gender": "homme"}'::jsonb),
  ('11111111-1111-1111-1111-111111111111', 'Groupe Femmes',   'gender', '{"gender": "femme"}'::jsonb),
  ('11111111-1111-1111-1111-111111111111', 'Groupe Jeunesse', 'age',    '{"min_age": 15, "max_age": 30}'::jsonb)
on conflict (organization_id, name) do nothing;

-- Note : aucun profil/membership n'est seedé ici car `profiles` dépend de
-- auth.users (créé uniquement via l'inscription réelle). Une fois votre
-- premier compte créé via l'app, rejoignez "Église Centrale" avec le code
-- EGL-0001 pour déclencher l'auto-affectation aux groupes ci-dessus.
