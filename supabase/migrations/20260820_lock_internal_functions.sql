-- ============================================================
-- ComHub — Migration Supabase (PostgreSQL)
-- 20260820_lock_internal_functions
--
-- Correctif de sécurité : PostgreSQL rend une fonction exécutable par
-- PUBLIC (donc par les rôles anon/authenticated via PostgREST) dès sa
-- création, sauf révocation explicite. Aucune migration précédente ne
-- l'avait fait pour les fonctions strictement internes, ce qui rendait
-- `assign_profile_to_org_groups` appelable directement en RPC, y
-- compris sans authentification (vérifié en direct : un appel anonyme
-- avec des identifiants arbitraires retournait 204 succès). Sans
-- vérification interne de auth.uid(), n'importe qui pouvait forcer
-- l'ajout de n'importe quel utilisateur dans n'importe quel groupe de
-- n'importe quelle organisation.
--
-- Ne touche PAS is_member_of / is_admin_of / is_admin_or_leader_of /
-- is_participant_of : ces fonctions sont invoquées à l'intérieur même
-- des clauses USING des policies RLS, dans le contexte du rôle
-- appelant (anon/authenticated) — leur retirer l'exécution publique
-- casserait l'évaluation de toutes les policies RLS de l'application.
-- Elles ne présentent de toute façon aucun risque : elles ne renvoient
-- qu'un booléen sur la relation de l'appelant à lui-même.
--
-- Les 3 fonctions verrouillées ici ne sont jamais appelées par le
-- client : handle_new_user et trg_auto_assign_groups ne se déclenchent
-- que via de vrais triggers Postgres (auth.users / memberships /
-- profiles), et assign_profile_to_org_groups n'est appelée que depuis
-- l'intérieur de trg_auto_assign_groups. Les trois sont `security
-- definer`, donc leur exécution interne tourne avec les privilèges de
-- leur propriétaire, indépendamment des droits du rôle qui a déclenché
-- l'opération d'origine — leur retirer l'accès public n'affecte donc
-- pas ce fonctionnement interne.
-- ============================================================

revoke execute on function public.assign_profile_to_org_groups(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.trg_auto_assign_groups() from public, anon, authenticated;
