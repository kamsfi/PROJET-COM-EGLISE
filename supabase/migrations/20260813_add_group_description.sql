-- ============================================================
-- ComHub — Migration Supabase (PostgreSQL)
-- 20260813_add_group_description
--
-- Additive uniquement : la table `public.groups` de production est vide
-- à ce jour, mais cette migration reste sûre même si des lignes
-- existaient déjà — colonne nullable, sans valeur par défaut.
-- ============================================================
alter table public.groups add column if not exists description text;

comment on column public.groups.description is 'Description libre du groupe, affichée dans Groupes.jsx (GroupCard / GroupDetailModal).';
