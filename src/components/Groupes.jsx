import { useEffect, useState } from 'react'
import { UsersRound, Sparkles, Plus } from 'lucide-react'
import { groups as groupsData } from '../data'
import { useWorkspace } from '../context/WorkspaceContext'
import { useOrganizations } from '../context/OrganizationsContext'
import { ruleBadges } from './ruleBadges'
import GroupRulesModal from './GroupRulesModal'
import GroupDetailModal from './GroupDetailModal'

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
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0`}>
          <UsersRound className="w-5 h-5 text-white" />
        </div>
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
  const { members } = useOrganizations()
  const [localGroups, setLocalGroups] = useState(() => groupsData.filter(g => g.workspaceId === activeWorkspace.id))
  const [showModal, setShowModal] = useState(false)
  const [selectedGroupId, setSelectedGroupId] = useState(null)
  const [joinedGroupIds, setJoinedGroupIds] = useState(new Set())

  useEffect(() => {
    setLocalGroups(groupsData.filter(g => g.workspaceId === activeWorkspace.id))
    setSelectedGroupId(null)
  }, [activeWorkspace.id])

  const canManage = activeWorkspace.role === 'admin' || activeWorkspace.role === 'leader'

  const handleCreate = ({ name, description, rules }) => {
    setLocalGroups(prev => [
      { id: `g-${Date.now()}`, workspaceId: activeWorkspace.id, name, description, memberCount: 1, memberIds: [], rules },
      ...prev,
    ])
    setShowModal(false)
  }

  const selectedGroup = localGroups.find(g => g.id === selectedGroupId)
  const selectedIndex = localGroups.findIndex(g => g.id === selectedGroupId)
  const selectedMembers = selectedGroup
    ? (selectedGroup.memberIds || []).map(id => members.find(m => m.id === id)).filter(Boolean)
    : []

  const toggleJoin = (groupId) => {
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
        <GroupRulesModal onClose={() => setShowModal(false)} onCreate={handleCreate} />
      )}

      {selectedGroup && (
        <GroupDetailModal
          group={selectedGroup}
          color={CARD_COLORS[selectedIndex % CARD_COLORS.length]}
          members={selectedMembers}
          joined={joinedGroupIds.has(selectedGroup.id)}
          onToggleJoin={() => toggleJoin(selectedGroup.id)}
          onClose={() => setSelectedGroupId(null)}
        />
      )}
    </div>
  )
}
