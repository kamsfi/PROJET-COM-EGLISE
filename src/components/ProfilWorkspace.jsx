import { useRef, useState } from 'react'
import {
  Calendar, Hand, Coins, ChevronRight, Plus, Camera, Pencil,
  Phone, Cake, VenetianMask, Users2, Briefcase, Church, Building2, HeartHandshake,
} from 'lucide-react'
import { workspaceTypeLabels, maritalStatusLabels, genderLabels } from '../data'
import { useWorkspace } from '../context/WorkspaceContext'
import { useCurrentUser } from '../context/CurrentUserContext'
import RoleBadge from './RoleBadge'
import Avatar from './Avatar'
import CreateAnnexeModal from './CreateAnnexeModal'
import RenameOrgModal from './RenameOrgModal'

const TYPE_ICON = { church: Church, business: Building2, ngo: HeartHandshake }

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-night-800 rounded-2xl border border-slate-800 p-4 flex flex-col items-center text-center">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-2`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-2xl font-bold text-slate-100">{value}</span>
      <span className="text-xs text-slate-400">{label}</span>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-800/60 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-night-700 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-gold" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-slate-500">{label}</p>
        <p className="text-sm text-slate-200 truncate">{value}</p>
      </div>
    </div>
  )
}

export default function ProfilWorkspace() {
  const { workspaces, activeWorkspace, setActiveWorkspaceId } = useWorkspace()
  const { demoUsers, currentUserId, setCurrentUserId, currentUser, updateCurrentUser } = useCurrentUser()
  const [annexeParent, setAnnexeParent] = useState(null)
  const [annexeCreated, setAnnexeCreated] = useState(null)
  const [renamingOrg, setRenamingOrg] = useState(null)
  const fileInputRef = useRef(null)

  const birthDateLabel = currentUser.birth_date
    ? new Date(currentUser.birth_date + 'T00:00:00').toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : null

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => updateCurrentUser({ avatarUrl: reader.result })
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="px-4 pt-4 pb-3 bg-night-800/50 backdrop-blur-sm sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-slate-100">Profil & Espace</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Demo profile switcher */}
        <div className="bg-night-800/60 rounded-2xl border border-dashed border-slate-700 p-4 animate-slide-up">
          <p className="text-[11px] font-medium text-slate-400 mb-2">Profil de démonstration</p>
          <div className="flex flex-wrap gap-1 bg-night-700 rounded-xl p-1">
            {demoUsers.map(u => (
              <button
                key={u.id}
                onClick={() => setCurrentUserId(u.id)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  currentUserId === u.id ? 'bg-gold text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {u.full_name.split(' ')[0]} · {u.memberships.length > 1 ? 'Multi-espaces' : `${u.memberships.length} organisation`}
              </button>
            ))}
          </div>
        </div>

        {/* Profile card */}
        <div className="bg-night-800 rounded-2xl border border-slate-800 p-5 animate-slide-up">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <Avatar photoUrl={currentUser.avatarUrl} initials={currentUser.avatar} size="lg" />
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Changer la photo de profil"
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gold hover:bg-gold-light text-white flex items-center justify-center ring-2 ring-night-800 transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-slate-100 truncate">{currentUser.full_name}</h2>
                <RoleBadge role={activeWorkspace?.role} />
              </div>
              <p className="text-sm text-slate-400 truncate">{currentUser.email || currentUser.phone}</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-gold/10 text-gold text-xs font-medium">
                {currentUser.profession}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800">
            <p className="text-xs text-slate-500">{currentUser.memberSince}</p>
          </div>
        </div>

        {/* Informations personnelles */}
        <div className="bg-night-800 rounded-2xl border border-slate-800 p-5 animate-slide-up">
          <h3 className="font-semibold text-slate-100 mb-1">Informations personnelles</h3>
          <p className="text-xs text-slate-400 mb-2">Synchronisées avec votre profil ComHub</p>

          <InfoRow icon={Phone} label="Téléphone" value={currentUser.phone} />
          <InfoRow icon={VenetianMask} label="Genre" value={genderLabels[currentUser.gender]} />
          <InfoRow icon={Cake} label="Date de naissance" value={birthDateLabel} />
          <InfoRow icon={Users2} label="Statut marital" value={maritalStatusLabels[currentUser.marital_status]} />
          <InfoRow icon={Briefcase} label="Profession" value={currentUser.profession} />

          {currentUser.skills?.length > 0 && (
            <div className="pt-3 mt-1">
              <p className="text-[11px] text-slate-500 mb-2">Compétences</p>
              <div className="flex flex-wrap gap-1.5">
                {currentUser.skills.map(skill => (
                  <span key={skill} className="px-2.5 py-1 rounded-full bg-night-700 text-slate-300 text-xs font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={Calendar} label="Événements" value={currentUser.stats.events} color="bg-sky-500/15 text-sky-400" />
          <StatCard icon={Hand} label="Participations" value={currentUser.stats.prayers} color="bg-emerald-500/15 text-emerald-400" />
          <StatCard icon={Coins} label="Contributions" value={currentUser.stats.donations} color="bg-gold/15 text-gold" />
        </div>

        {/* Workspaces */}
        <div className="bg-night-800 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <h3 className="font-semibold text-slate-100">Mes espaces de travail</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {workspaces.length > 1 ? 'Basculez entre vos organisations' : 'Vous appartenez à un seul espace'}
            </p>
          </div>
          {workspaces.map(ws => {
            const Icon = TYPE_ICON[ws.type] || Church
            const active = ws.id === activeWorkspace.id
            const canCreateAnnexe = ws.role === 'admin' && !ws.parentId
            return (
              <div key={ws.id} className="border-t border-slate-800/60">
                <button
                  onClick={() => setActiveWorkspaceId(ws.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 transition-colors text-left ${
                    active ? 'bg-gold/5' : 'hover:bg-night-700/50'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${ws.color} flex items-center justify-center shrink-0`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{ws.name}</p>
                    <p className="text-xs text-slate-500 truncate">{workspaceTypeLabels[ws.type]} · {ws.membersCount} membres</p>
                  </div>
                  <RoleBadge role={ws.role} size="xs" />
                  {active && <ChevronRight className="w-4 h-4 text-gold shrink-0" />}
                </button>
                {ws.role === 'admin' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setRenamingOrg(ws) }}
                    className="w-full flex items-center gap-2 px-4 pb-3 text-xs text-slate-400 hover:text-gold-light transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Modifier le nom
                  </button>
                )}
                {canCreateAnnexe && (
                  <button
                    onClick={() => { setAnnexeParent(ws); setAnnexeCreated(null) }}
                    className="w-full flex items-center gap-2 px-4 pb-3 text-xs text-gold-light hover:text-gold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Créer une annexe / un sous-compte
                  </button>
                )}
              </div>
            )
          })}
          {annexeCreated && (
            <div className="px-4 py-3 border-t border-slate-800/60 bg-emerald-500/10">
              <p className="text-xs text-emerald-400">
                « {annexeCreated.name} » créée · vous en êtes administrateur. Pensez à y ajouter {annexeCreated.leaderName} une fois son compte créé.
              </p>
            </div>
          )}
        </div>

        <div className="text-center text-xs text-slate-600 py-2">
          Pour vos dons et cotisations, direction l'onglet Finances · ComHub 2.1
        </div>
      </div>

      {annexeParent && (
        <CreateAnnexeModal
          parentOrg={annexeParent}
          onClose={() => setAnnexeParent(null)}
          onCreated={(annexe) => { setAnnexeCreated(annexe); setAnnexeParent(null) }}
        />
      )}

      {renamingOrg && (
        <RenameOrgModal
          org={renamingOrg}
          onClose={() => setRenamingOrg(null)}
        />
      )}
    </div>
  )
}
