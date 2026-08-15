-- ============================================================
-- ComHub — Migration Supabase (PostgreSQL)
-- 20260821_group_privacy
--
-- Rend les groupes réellement confidentiels : un membre ne voit et ne
-- peut rejoindre que les groupes dont il est déjà membre, qu'il a créés,
-- ou dont il correspond aux critères (âge/sexe). Avant ce correctif, les
-- critères ne servaient qu'à l'auto-affectation, jamais à restreindre
-- l'accès — n'importe qui pouvait rejoindre n'importe quel groupe.
-- ============================================================

-- ---------- 1. Traçabilité du créateur ----------
alter table public.groups add column if not exists created_by uuid references public.profiles(id) on delete set null;

-- Rattache les groupes déjà créés manuellement à l'admin de leur
-- organisation, pour qu'ils ne perdent pas leur accès avec la nouvelle
-- règle. Pas de filtre sur une organisation précise : générique pour
-- toute ligne historique sans créateur, pas seulement les 6 groupes
-- actuels (aucun risque aujourd'hui, une seule organisation existe).
update public.groups
set created_by = (select user_id from public.memberships where organization_id = groups.organization_id and role = 'admin' limit 1)
where created_by is null;

-- ---------- 2. Fonctions utilitaires (security definer, anti-récursion RLS) ----------

-- Lecture de l'organization_id d'un groupe sans passer par la policy
-- SELECT de `groups` elle-même (nécessaire : les policies de
-- group_members ci-dessous doivent fonctionner même pour un admin qui,
-- avec la nouvelle règle, ne "voit" plus forcément le groupe).
create or replace function public.group_org_id(p_group_id uuid)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select organization_id from public.groups where id = p_group_id;
$$;

-- Suis-je déjà membre de ce groupe ? Enveloppée en security definer pour
-- la même raison que group_org_id : utilisée à la fois dans la policy de
-- `groups` et dans celle de `group_members`, elle ne doit jamais
-- déclencher une réévaluation récursive de la policy qu'elle sert à
-- construire (un EXISTS brut sur group_members à l'intérieur même de la
-- policy de group_members provoquerait "infinite recursion detected in
-- policy for relation group_members").
create or replace function public.is_group_member(p_group_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = auth.uid()
  );
$$;

-- Est-ce que le profil de p_user_id correspond aux critères de p_group_id ?
-- Miroir de la logique du trigger assign_profile_to_org_groups, étendu
-- pour couvrir aussi les critères combinés (targeting_type = 'custom',
-- format frontend gender M/F — même convention que deriveTargeting()
-- côté client) que le trigger d'auto-affectation ignore volontairement.
create or replace function public.profile_matches_group_criteria(p_user_id uuid, p_group_id uuid)
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_group public.groups;
  v_profile public.profiles;
  v_age int;
  v_gender_db text;
  v_gender_fe text;
begin
  select * into v_group from public.groups where id = p_group_id;
  if not found then return false; end if;

  select * into v_profile from public.profiles where id = p_user_id;
  if not found then return false; end if;

  v_age := case when v_profile.date_of_birth is null then null
                else extract(year from age(v_profile.date_of_birth))::int end;
  v_gender_db := v_profile.gender::text;
  v_gender_fe := case v_gender_db when 'homme' then 'M' when 'femme' then 'F' else null end;

  if v_group.targeting_type = 'gender' then
    return v_gender_db is not null and v_group.targeting_criteria->>'gender' = v_gender_db;

  elsif v_group.targeting_type = 'age' then
    return (not (v_group.targeting_criteria ? 'min_age') or (v_age is not null and v_age >= (v_group.targeting_criteria->>'min_age')::int))
       and (not (v_group.targeting_criteria ? 'max_age') or (v_age is not null and v_age <= (v_group.targeting_criteria->>'max_age')::int));

  elsif v_group.targeting_type = 'custom' then
    if v_group.targeting_criteria is null or v_group.targeting_criteria = '{}'::jsonb then
      return true; -- groupe ouvert, aucun critère
    end if;
    -- ATTENTION : teste `->>'clé' is null`, pas `? 'clé'` — les critères
    -- 'custom' construits par GroupRulesModal/deriveTargeting incluent
    -- TOUJOURS les 4 clés, avec `null` explicite pour celles non
    -- renseignées (ex. Compagnie Hébron réel : {"gender":"M","min_age":21,
    -- "max_age":null,...}). `? 'clé'` vaut true même quand la valeur est
    -- json null, ce qui ferait remonter une comparaison contre NULL SQL
    -- (donc un résultat NULL, traité comme "refusé" par RLS) au lieu de
    -- "borne non renseignée, donc pas de restriction" — testé en direct :
    -- ça aurait cassé l'accès de tout le monde à Compagnie Hébron/Abi-Ruth.
    return (
      v_group.targeting_criteria->>'gender' is null
      or (v_gender_fe is not null and v_group.targeting_criteria->>'gender' = v_gender_fe)
    )
    and (
      v_group.targeting_criteria->>'min_age' is null
      or (v_age is not null and v_age >= (v_group.targeting_criteria->>'min_age')::int)
    )
    and (
      v_group.targeting_criteria->>'max_age' is null
      or (v_age is not null and v_age <= (v_group.targeting_criteria->>'max_age')::int)
    );

  else
    return true; -- 'skills' ou autre : pas de restriction gérée ici
  end if;
end;
$$;

-- ---------- 3. RLS : groups ----------
drop policy if exists "groups_select" on public.groups;
create policy "groups_select" on public.groups
  for select using (
    public.is_member_of(organization_id)
    and (
      created_by = auth.uid()
      or public.is_group_member(id)
      or public.profile_matches_group_criteria(auth.uid(), id)
    )
  );

-- ---------- 4. RLS : group_members (réécrites via group_org_id/
-- is_group_member pour ne plus jamais faire de sous-requête brute sur
-- `groups` ou sur `group_members` elle-même) ----------
drop policy if exists "group_members_select" on public.group_members;
create policy "group_members_select" on public.group_members
  for select using (
    user_id = auth.uid()
    or public.is_group_member(group_members.group_id)
    or public.is_admin_or_leader_of(public.group_org_id(group_members.group_id))
  );

drop policy if exists "group_members_insert" on public.group_members;
create policy "group_members_insert" on public.group_members
  for insert with check (
    (
      user_id = auth.uid()
      and public.is_member_of(public.group_org_id(group_members.group_id))
      and public.profile_matches_group_criteria(auth.uid(), group_members.group_id)
    )
    or public.is_admin_or_leader_of(public.group_org_id(group_members.group_id))
  );

drop policy if exists "group_members_delete" on public.group_members;
create policy "group_members_delete" on public.group_members
  for delete using (
    user_id = auth.uid()
    or public.is_admin_or_leader_of(public.group_org_id(group_members.group_id))
  );
