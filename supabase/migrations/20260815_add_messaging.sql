-- ============================================================
-- ComHub — Migration Supabase (PostgreSQL)
-- 20260815_add_messaging
--
-- Additive uniquement : nouvelles tables `conversations`,
-- `conversation_participants`, `messages` — messagerie privée 1-à-1.
-- Première introduction de Supabase Realtime dans le projet (voir §5).
-- Réutilise is_member_of() défini dans 20260812_init_schema.sql.
-- ============================================================

-- ============================================================
-- 1. TABLES
-- ============================================================
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  -- Paire triée des deux participants (least/greatest) : garantit au plus
  -- une conversation par paire et par organisation, et rend le
  -- dédoublonnage de start_or_get_conversation atomique via INSERT ...
  -- ON CONFLICT DO NOTHING (voir §4), sans quoi deux appels concurrents
  -- pourraient créer deux conversations pour la même paire.
  participant_low uuid not null,
  participant_high uuid not null,
  created_at timestamptz not null default now(),
  unique (organization_id, participant_low, participant_high)
);

comment on table public.conversations is 'Conversation privée 1-à-1, scoped par organisation.';

create table if not exists public.conversation_participants (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

comment on table public.conversation_participants is 'Participants d''une conversation (toujours 2 aujourd''hui, 1-à-1 uniquement).';

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  -- Nullable + on delete set null : la suppression d'un compte ne doit
  -- pas effacer l'historique (même raisonnement que announcements.author_id).
  sender_id uuid references public.profiles(id) on delete set null,
  content text not null,
  created_at timestamptz not null default now()
);

comment on table public.messages is 'Message d''une conversation privée.';

-- ============================================================
-- 2. INDEX
-- ============================================================
create index if not exists idx_conversation_participants_user on public.conversation_participants(user_id);
create index if not exists idx_messages_conversation_created on public.messages(conversation_id, created_at);

-- ============================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;

-- security definer + interroge conversation_participants (la table même
-- qu'elle protège plus bas) sans récursion : même schéma que
-- is_member_of(), déjà utilisé à l'identique dans memberships_select_same_org.
create or replace function public.is_participant_of(p_conversation_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.conversation_participants
    where conversation_id = p_conversation_id and user_id = auth.uid()
  );
$$;

-- ---------- conversations ----------
-- AUCUNE policy insert/update/delete, volontairement : la création ne
-- passe QUE par start_or_get_conversation() (security definer, §4).
drop policy if exists "conversations_select_participant" on public.conversations;
create policy "conversations_select_participant" on public.conversations
  for select using (public.is_participant_of(id));

-- ---------- conversation_participants ----------
drop policy if exists "conversation_participants_select_participant" on public.conversation_participants;
create policy "conversation_participants_select_participant" on public.conversation_participants
  for select using (public.is_participant_of(conversation_id));

-- ---------- messages ----------
drop policy if exists "messages_select_participant" on public.messages;
create policy "messages_select_participant" on public.messages
  for select using (public.is_participant_of(conversation_id));

drop policy if exists "messages_insert_participant" on public.messages;
create policy "messages_insert_participant" on public.messages
  for insert with check (
    public.is_participant_of(conversation_id)
    and sender_id = auth.uid()
  );

-- ============================================================
-- 4. RPC : start_or_get_conversation
-- Seul point d'écriture pour `conversations`/`conversation_participants`.
-- ============================================================
create or replace function public.start_or_get_conversation(p_other_user_id uuid, p_organization_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conversation_id uuid;
  v_low uuid;
  v_high uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise.';
  end if;
  if p_other_user_id = auth.uid() then
    raise exception 'Impossible de démarrer une conversation avec soi-même.';
  end if;
  if not public.is_member_of(p_organization_id) then
    raise exception 'Vous n''êtes pas membre de cette organisation.';
  end if;
  if not exists (
    select 1 from public.memberships
    where organization_id = p_organization_id and user_id = p_other_user_id
  ) then
    raise exception 'Ce membre ne fait pas partie de cette organisation.';
  end if;

  v_low := least(auth.uid(), p_other_user_id);
  v_high := greatest(auth.uid(), p_other_user_id);

  insert into public.conversations (organization_id, participant_low, participant_high)
  values (p_organization_id, v_low, v_high)
  on conflict (organization_id, participant_low, participant_high) do nothing
  returning id into v_conversation_id;

  if v_conversation_id is not null then
    insert into public.conversation_participants (conversation_id, user_id)
    values (v_conversation_id, auth.uid()), (v_conversation_id, p_other_user_id);
    return v_conversation_id;
  end if;

  select id into v_conversation_id
  from public.conversations
  where organization_id = p_organization_id and participant_low = v_low and participant_high = v_high;

  return v_conversation_id;
end;
$$;

grant execute on function public.start_or_get_conversation(uuid, uuid) to authenticated;

-- ============================================================
-- 5. REALTIME — première table de l'app ajoutée à la publication
-- Sans cette étape, l'abonnement `postgres_changes` se connecte sans
-- erreur mais ne reçoit jamais rien.
-- ============================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
