import { useState, useMemo, useEffect } from 'react'
import { Search, Phone, Briefcase, X } from 'lucide-react'
import { useWorkspace } from '../context/WorkspaceContext'
import { useOrganizations } from '../context/OrganizationsContext'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { getInitials, pickColor } from '../data'
import RoleBadge from './RoleBadge'
import Avatar from './Avatar'
import MemberProfileModal from './MemberProfileModal'
import CallScreen from './CallScreen'

function MemberCard({ member, orgLabel, onOpen }) {
  return (
    <button
      onClick={onOpen}
      className="bg-night-800 rounded-2xl border border-slate-800 hover:border-gold/40 p-4 text-left transition-colors animate-slide-up"
    >
      <div className="flex items-center gap-3 mb-3">
        <Avatar photoUrl={member.photoUrl} initials={member.avatar} color={member.color} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-slate-100 text-sm truncate">{member.full_name}</h3>
            <RoleBadge role={member.role} size="xs" />
          </div>
          <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
            <Briefcase className="w-3 h-3 shrink-0" />
            {member.profession}
            {orgLabel && <span className="text-slate-600"> · {orgLabel}</span>}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {member.skills.map(skill => (
          <span key={skill} className="px-2 py-0.5 rounded-full bg-night-700 text-slate-300 text-[10px] font-medium">
            {skill}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-1.5 text-xs text-gold-light pt-2 border-t border-slate-800/50">
        <Phone className="w-3.5 h-3.5 shrink-0" />
        Appeler depuis ComHub
      </div>
    </button>
  )
}

export default function Annuaire() {
  const { activeWorkspace } = useWorkspace()
  const { members, getOrgFamilyIds, getOrgById, mergeRemoteMembers } = useOrganizations()
  const [search, setSearch] = useState('')
  const [selectedSkills, setSelectedSkills] = useState([])
  const [scope, setScope] = useState('local')
  const [selectedMember, setSelectedMember] = useState(null)
  const [callTarget, setCallTarget] = useState(null)
  const [callType, setCallType] = useState(null)

  useEffect(() => {
    setSearch('')
    setSelectedSkills([])
    setScope('local')
    setSelectedMember(null)
  }, [activeWorkspace.id])

  const familyIds = getOrgFamilyIds(activeWorkspace.id)
  const hasFamily = familyIds.length > 1

  // Charge les vrais membres Supabase de l'espace (ou de la dénomination
  // entière) et les fusionne dans le même catalogue que les membres mock.
  // No-op silencieux si Supabase n'est pas configuré.
  useEffect(() => {
    if (!isSupabaseConfigured) return
    let cancelled = false

    async function loadMembers() {
      const { data: rows, error } = await supabase
        .from('memberships')
        .select('role, organization_id, profiles(id, full_name, avatar_url, profession, skills)')
        .in('organization_id', familyIds)
      if (cancelled) return
      if (error) { console.warn('[ComHub] Échec du chargement des membres Supabase', error); return }
      const mapped = (rows || [])
        .filter(r => r.profiles)
        .map(r => ({
          id: r.profiles.id,
          workspaceId: r.organization_id,
          full_name: r.profiles.full_name,
          avatar: getInitials(r.profiles.full_name),
          color: pickColor(r.profiles.id),
          role: r.role,
          profession: r.profiles.profession || '',
          skills: r.profiles.skills || [],
          photoUrl: r.profiles.avatar_url || undefined,
        }))
      mergeRemoteMembers(mapped)
    }

    loadMembers()
    return () => { cancelled = true }
  }, [familyIds.join(','), mergeRemoteMembers])

  const workspaceMembers = useMemo(() => {
    const ids = scope === 'denomination' ? familyIds : [activeWorkspace.id]
    return members.filter(m => ids.includes(m.workspaceId))
  }, [members, activeWorkspace.id, scope, familyIds])

  const allSkills = useMemo(() => {
    const set = new Set()
    workspaceMembers.forEach(m => m.skills.forEach(s => set.add(s)))
    return Array.from(set).sort()
  }, [workspaceMembers])

  const toggleSkill = (skill) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    )
  }

  const filtered = useMemo(() => {
    return workspaceMembers
      .filter(m =>
        m.full_name.toLowerCase().includes(search.toLowerCase()) ||
        m.profession.toLowerCase().includes(search.toLowerCase())
      )
      .filter(m =>
        selectedSkills.length === 0 || selectedSkills.some(skill => m.skills.includes(skill))
      )
  }, [workspaceMembers, search, selectedSkills])

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="px-4 pt-4 pb-3 bg-night-800/50 backdrop-blur-sm sticky top-0 z-10 space-y-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Annuaire</h1>
          <p className="text-sm text-slate-400 mt-0.5">Membres de {activeWorkspace.name} · compétences & professions</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un membre, une profession..."
            className="w-full bg-night-700 text-slate-100 placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold/50 transition-all"
          />
        </div>

        {hasFamily && (
          <div className="flex bg-night-700 rounded-xl p-1 w-fit">
            <button
              onClick={() => setScope('local')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                scope === 'local' ? 'bg-night-800 text-slate-100 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cet espace
            </button>
            <button
              onClick={() => setScope('denomination')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                scope === 'denomination' ? 'bg-night-800 text-slate-100 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Toute la dénomination
            </button>
          </div>
        )}

        {allSkills.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {allSkills.map(skill => {
              const active = selectedSkills.includes(skill)
              return (
                <button
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                    active ? 'bg-gold text-white' : 'bg-night-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {skill}
                  {active && <X className="w-3 h-3" />}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(member => (
            <MemberCard
              key={member.id}
              member={member}
              orgLabel={scope === 'denomination' && member.workspaceId !== activeWorkspace.id ? getOrgById(member.workspaceId)?.name : null}
              onOpen={() => setSelectedMember(member)}
            />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center text-slate-500 py-12 text-sm">Aucun membre trouvé</div>
        )}
        {filtered.length > 0 && (
          <div className="text-center text-xs text-slate-600 py-4">
            {filtered.length} membre{filtered.length > 1 ? 's' : ''} · {activeWorkspace.name}
          </div>
        )}
      </div>

      {selectedMember && (
        <MemberProfileModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
          onCall={(type) => {
            setCallTarget(selectedMember)
            setCallType(type)
            setSelectedMember(null)
          }}
        />
      )}

      {callTarget && callType && (
        <CallScreen
          contact={{ name: callTarget.full_name, avatar: callTarget.avatar, color: callTarget.color }}
          type={callType}
          onEnd={() => { setCallType(null); setCallTarget(null) }}
        />
      )}
    </div>
  )
}
