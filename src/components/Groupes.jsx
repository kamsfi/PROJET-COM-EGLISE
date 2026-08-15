import { useEffect, useState } from 'react'
import { UsersRound, Sparkles, Plus } from 'lucide-react'
import { groups as groupsData, getInitials, pickColor, isRealWorkspaceId } from '../data'
import { useWorkspace } from '../context/WorkspaceContext'
import { useOrganizations } from '../context/OrganizationsContext'
import { useCurrentUser } from '../context/CurrentUserContext'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { ruleBadges } from './ruleBadges'
import GroupRulesModal from './GroupRulesModal'
import GroupDetailModal from './GroupDetailModal'

// Traduit `targeting_type`/`targeting_criteria` (SQL) vers la forme `rules`
// attendue par `ruleBadges`/`GroupRulesModal` (gender 'M'/'F', etc.).
function mapCriteriaToRules(targetingType, criteria) {
  const c = criteria || {}
  if (targetingType === 'gender' && c.gender) {
    return { gender: c.gender === 'homme' ? 'M' : c.gender === 'femme' ? 'F' : null, min_age: null, max_age: null, marital_status: null }
  }
  if (targetingType === 'age') {
    return { gender: null, min_age: c.min_age ?? null, max_age: c.max_age ?? null, marital_status: null }
  }
  if (targetingType === 'custom') {
    const hasKnownField = c.gender != null || c.min_age != null || c.max_age != null || c.marital_status != null
    return hasKnownField ? { gender: c.gender ?? null, min_age: c.min_age ?? null, max_age: c.max_age ?? null, marital_status: c.marital_status ?? null } : null
  }
  return null // 'skills' — pas de représentation UI aujourd'hui, dégrade en "groupe ouvert"
}

// Traduit `rules` (frontend) vers `targeting_type`/`targeting_criteria` (SQL).
// Le trigger d'auto-affectation ne sait gérer qu'un seul critère à la fois
// (genre OU âge) et ignore le statut marital — un seul critère renseigné
// bascule au format natif (auto-affectation serveur réelle), sinon
// `targeting_type: 'custom'` (jamais interprété côté serveur, affichage
// uniquement, adhésion manuelle).
function deriveTargeting(rules) {
  if (!rules) return { targeting_type: 'custom', targeting_criteria: {} }
  const hasGender = rules.gender != null
  const hasAge = rules.min_age != null || rules.max_age != null
  const hasMarital = rules.marital_status != null
  const activeCount = [hasGender, hasAge, hasMarital].filter(Boolean).length

  if (activeCount === 1 && hasGender) {
    return { targeting_type: 'gender', targeting_criteria: { gender: rules.gender === 'M' ? 'homme' : 'femme' } }
  }
  if (activeCount === 1 && hasAge) {
    const criteria = {}
    if (rules.min_age != null) criteria.min_age = rules.min_age
    if (rules.max_age != null) criteria.max_age = rules.max_age
    return { targeting_type: 'age', targeting_criteria: criteria }
  }
  return { targeting_type: 'custom', targeting_criteria: rules }
}

const CARD_COLORS = [
  'from-gold to-gold-dark',
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-violet-500 to-purple-600',
  'from-cyan-500 to-blue-600',
]

function GroupCard({ group, color, onOpen }) {
  const badges = ruleBadges(group.rules)

  return (
    <button
      onClick={onOpen}
      className="bg-night-800 rounded-2xl border border-slate-800 hover:border-gold/40 p-4 text-left transition-colors animate-slide-up"
    >
      <div className="flex items-start gap-3 mb-3">
        {group.photoUrl ? (
          <img src={group.photoUrl} alt="" className="w-11 h-11 rounded-xl object-cover shrink-0" />
        ) : (
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0`}>
            <UsersRound className="w-5 h-5 text-white" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-100 text-sm truncate">{group.name}</h3>
          <p className="text-xs text-slate-500">{group.memberCount} membre{group.memberCount > 1 ? 's' : ''}</p>
        </div>
      </div>

      {group.description && (
        <p className="text-sm text-slate-400 leading-relaxed mb-3">{group.description}</p>
      )}

      {badges.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold/10 text-gold text-[10px] font-medium">
            <Sparkles className="w-2.5 h-2.5" />
            Auto-assignation
          </span>
          {badges.map((b, i) => (
            <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-night-700 text-slate-300 text-[10px] font-medium">
              <b.icon className="w-2.5 h-2.5" />
              {b.label}
            </span>
          ))}
        </div>
      ) : (
        <span className="inline-block px-2 py-0.5 rounded-full bg-night-700 text-slate-400 text-[10px] font-medium">
          Groupe ouvert
        </span>
      )}
    </button>
  )
}

export default function Groupes() {
  const { activeWorkspace } = useWorkspace()
  const { members, mergeRemoteMembers } = useOrganizations()
  const { currentUser } = useCurrentUser()
  const [localGroups, setLocalGroups] = useState(() => groupsData.filter(g => g.workspaceId === activeWorkspace.id))
  const [showModal, setShowModal] = useState(false)
  const [selectedGroupId, setSelectedGroupId] = useState(null)
  const [joinedGroupIds, setJoinedGroupIds] = useState(new Set())
  const [createError, setCreateError] = useState('')
  const [creating, setCreating] = useState(false)
  const [joinError, setJoinError] = useState('')
  const [editingGroupId, setEditingGroupId] = useState(null)
  const [editError, setEditError] = useState('')
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    setLocalGroups(groupsData.filter(g => g.workspaceId === activeWorkspace.id))
    setSelectedGroupId(null)
  }, [activeWorkspace.id])

  // Charge les vrais groupes Supabase (+ leurs membres réels) de l'espace
  // actif et les fusionne au catalogue local. No-op pour un espace mock ou
  // si Supabase n'est pas configuré (ex: Accès Démo Rapide en prod).
  useEffect(() => {
    if (!isSupabaseConfigured || !isRealWorkspaceId(activeWorkspace.id)) return
    let cancelled = false

    async function loadGroups() {
      const [{ data: groupRows, error: groupsErr }, { data: memberRows, error: membersErr }] = await Promise.all([
        supabase.from('groups')
          .select('id, name, description, photo_url, targeting_type, targeting_criteria, group_members(user_id, profiles(id, full_name, avatar_url, profession, skills))')
          .eq('organization_id', activeWorkspace.id),
        supabase.from('memberships')
          .select('user_id, role')
          .eq('organization_id', activeWorkspace.id),
      ])
      if (cancelled) return
      if (groupsErr || membersErr) { console.warn('[ComHub] Échec du chargement des groupes Supabase', groupsErr || membersErr); return }

      const roleByUserId = new Map((memberRows || []).map(m => [m.user_id, m.role]))

      const mappedGroups = (groupRows || []).map(row => {
        const gm = row.group_members || []
        return {
          id: row.id,
          workspaceId: activeWorkspace.id,
          name: row.name,
          description: row.description || '',
          photoUrl: row.photo_url || null,
          memberCount: gm.length,
          memberIds: gm.map(x => x.user_id),
          rules: mapCriteriaToRules(row.targeting_type, row.targeting_criteria),
        }
      })

      const profileById = new Map()
      for (const row of groupRows || []) {
        for (const gm of row.group_members || []) {
          if (gm.profiles) profileById.set(gm.profiles.id, gm.profiles)
        }
      }
      const mappedMembers = Array.from(profileById.values()).map(p => ({
        id: p.id,
        workspaceId: activeWorkspace.id,
        full_name: p.full_name,
        avatar: getInitials(p.full_name),
        color: pickColor(p.id),
        role: roleByUserId.get(p.id) || 'member',
        profession: p.profession || '',
        skills: p.skills || [],
        photoUrl: p.avatar_url || undefined,
      }))
      mergeRemoteMembers(mappedMembers)

      setLocalGroups(prev => {
        const byId = new Map(prev.map(g => [g.id, g]))
        for (const g of mappedGroups) byId.set(g.id, g)
        return Array.from(byId.values())
      })
    }

    loadGroups()
    return () => { cancelled = true }
  }, [activeWorkspace.id, mergeRemoteMembers])

  // Reflète les adhésions réelles déjà en base dans `joinedGroupIds` (jamais
  // peuplé au chargement sinon) — fusionne sans écraser les bascules faites
  // dans cette même session. Sans ça, un membre déjà réel d'un groupe se
  // reverrait proposer "Rejoindre" à chaque rechargement.
  useEffect(() => {
    if (!isSupabaseConfigured || !isRealWorkspaceId(activeWorkspace.id) || !currentUser?.id) return
    const realIds = localGroups.filter(g => g.memberIds?.includes(currentUser.id)).map(g => g.id)
    if (realIds.length === 0) return
    setJoinedGroupIds(prev => {
      const next = new Set(prev)
      let changed = false
      for (const id of realIds) { if (!next.has(id)) { next.add(id); changed = true } }
      return changed ? next : prev
    })
  }, [localGroups, currentUser?.id, activeWorkspace.id])

  const canManage = activeWorkspace.role === 'admin' || activeWorkspace.role === 'leader'

  const handleCreate = async ({ name, description, rules }) => {
    if (isSupabaseConfigured && isRealWorkspaceId(activeWorkspace.id)) {
      setCreateError('')
      setCreating(true)
      const { targeting_type, targeting_criteria } = deriveTargeting(rules)
      const { data, error } = await supabase.from('groups')
        .insert({ organization_id: activeWorkspace.id, created_by: currentUser.id, name, description: description || null, targeting_type, targeting_criteria })
        .select('id, name, description, targeting_type, targeting_criteria')
        .single()
      setCreating(false)
      if (error) {
        console.warn('[ComHub] Échec de la création du groupe Supabase', error)
        setCreateError('Impossible de créer le groupe. Réessayez.')
        return
      }
      setLocalGroups(prev => [
        { id: data.id, workspaceId: activeWorkspace.id, name: data.name, description: data.description || '', memberCount: 0, memberIds: [], rules: mapCriteriaToRules(data.targeting_type, data.targeting_criteria) },
        ...prev,
      ])
      setShowModal(false)
      return
    }
    // Branche mock (inchangée)
    setLocalGroups(prev => [
      { id: `g-${Date.now()}`, workspaceId: activeWorkspace.id, name, description, memberCount: 1, memberIds: [], rules },
      ...prev,
    ])
    setShowModal(false)
  }

  const handleUpdate = async ({ name, description, rules }) => {
    const groupId = editingGroupId
    if (isSupabaseConfigured && isRealWorkspaceId(activeWorkspace.id)) {
      setEditError('')
      setEditing(true)
      const { targeting_type, targeting_criteria } = deriveTargeting(rules)
      const { error } = await supabase.from('groups')
        .update({ name, description: description || null, targeting_type, targeting_criteria })
        .eq('id', groupId)
      setEditing(false)
      if (error) {
        console.warn('[ComHub] Échec de la modification du groupe Supabase', error)
        setEditError('Impossible d\'enregistrer les modifications. Réessayez.')
        return
      }
      setLocalGroups(prev => prev.map(g => (g.id === groupId ? { ...g, name, description: description || '', rules } : g)))
      setEditingGroupId(null)
      return
    }
    // Branche mock (inchangée)
    setLocalGroups(prev => prev.map(g => (g.id === groupId ? { ...g, name, description, rules } : g)))
    setEditingGroupId(null)
  }

  const handlePhotoUpdated = (groupId, photoUrl) => {
    setLocalGroups(prev => prev.map(g => (g.id === groupId ? { ...g, photoUrl } : g)))
  }

  const selectedGroup = localGroups.find(g => g.id === selectedGroupId)
  const editingGroup = localGroups.find(g => g.id === editingGroupId)
  const selectedIndex = localGroups.findIndex(g => g.id === selectedGroupId)
  const selectedMembers = selectedGroup
    ? (selectedGroup.memberIds || []).map(id => members.find(m => m.id === id)).filter(Boolean)
    : []

  const toggleJoin = async (groupId) => {
    if (isSupabaseConfigured && isRealWorkspaceId(activeWorkspace.id) && currentUser?.id) {
      const wasJoined = joinedGroupIds.has(groupId)
      setJoinError('')
      const { error } = wasJoined
        ? await supabase.from('group_members').delete().match({ group_id: groupId, user_id: currentUser.id })
        : await supabase.from('group_members').insert({ group_id: groupId, user_id: currentUser.id })
      if (error) {
        console.warn('[ComHub] Échec du (dés)abonnement au groupe', error)
        setJoinError(wasJoined ? 'Impossible de quitter ce groupe.' : 'Impossible de rejoindre ce groupe.')
        return
      }
      setJoinedGroupIds(prev => {
        const next = new Set(prev)
        wasJoined ? next.delete(groupId) : next.add(groupId)
        return next
      })
      setLocalGroups(prev => prev.map(g => {
        if (g.id !== groupId) return g
        const memberIds = wasJoined ? g.memberIds.filter(id => id !== currentUser.id) : Array.from(new Set([...g.memberIds, currentUser.id]))
        return { ...g, memberIds, memberCount: memberIds.length }
      }))
      if (!wasJoined) {
        mergeRemoteMembers([{
          id: currentUser.id, workspaceId: activeWorkspace.id, full_name: currentUser.full_name,
          avatar: currentUser.avatar, color: pickColor(currentUser.id), role: activeWorkspace.role,
          profession: currentUser.profession || '', skills: currentUser.skills || [], photoUrl: currentUser.avatarUrl || undefined,
        }])
      }
      return
    }
    // Branche mock (inchangée)
    setJoinedGroupIds(prev => {
      const next = new Set(prev)
      next.has(groupId) ? next.delete(groupId) : next.add(groupId)
      return next
    })
  }

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="px-4 pt-4 pb-3 bg-night-800/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Groupes</h1>
            <p className="text-sm text-slate-400 mt-0.5">Communautés de {activeWorkspace.name}</p>
          </div>
          {canManage && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gold hover:bg-gold-light text-white text-xs font-semibold transition-all active:scale-95 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Créer un groupe avec règles</span>
              <span className="sm:hidden">Créer</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {localGroups.map((group, i) => (
            <GroupCard
              key={group.id}
              group={group}
              color={CARD_COLORS[i % CARD_COLORS.length]}
              onOpen={() => setSelectedGroupId(group.id)}
            />
          ))}
        </div>
        {localGroups.length === 0 && (
          <div className="text-center text-slate-500 py-12 text-sm">Aucun groupe pour cet espace</div>
        )}
      </div>

      {showModal && (
        <GroupRulesModal
          onClose={() => { setShowModal(false); setCreateError('') }}
          onCreate={handleCreate}
          submitting={creating}
          error={createError}
        />
      )}

      {selectedGroup && (
        <GroupDetailModal
          group={selectedGroup}
          color={CARD_COLORS[selectedIndex % CARD_COLORS.length]}
          members={selectedMembers}
          joined={joinedGroupIds.has(selectedGroup.id)}
          onToggleJoin={() => toggleJoin(selectedGroup.id)}
          joinError={joinError}
          onClose={() => { setSelectedGroupId(null); setJoinError('') }}
          canManage={canManage}
          onEdit={() => setEditingGroupId(selectedGroup.id)}
          onPhotoUpdated={(url) => handlePhotoUpdated(selectedGroup.id, url)}
        />
      )}

      {editingGroup && (
        <GroupRulesModal
          initialValues={{ name: editingGroup.name, description: editingGroup.description, rules: editingGroup.rules }}
          onClose={() => { setEditingGroupId(null); setEditError('') }}
          onCreate={handleUpdate}
          submitting={editing}
          error={editError}
        />
      )}
    </div>
  )
}
