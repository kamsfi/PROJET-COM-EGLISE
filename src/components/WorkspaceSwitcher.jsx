import { useState } from 'react'
import { Church, Building2, HeartHandshake, ChevronDown, Check, X } from 'lucide-react'
import { useWorkspace } from '../context/WorkspaceContext'
import { workspaceTypeLabels } from '../data'

const TYPE_ICON = { church: Church, business: Building2, ngo: HeartHandshake }

function WorkspaceBadge({ ws, size = 'w-9 h-9', rounded = 'rounded-xl', iconSize = 'w-4 h-4' }) {
  const Icon = TYPE_ICON[ws.type] || Church
  if (ws.logoUrl) {
    return <img src={ws.logoUrl} alt="" className={`${size} ${rounded} object-cover shrink-0`} />
  }
  return (
    <div className={`${size} ${rounded} bg-gradient-to-br ${ws.color} flex items-center justify-center shrink-0`}>
      <Icon className={`${iconSize} text-white`} />
    </div>
  )
}

function WorkspaceRow({ ws, active, onSelect }) {
  return (
    <button
      onClick={() => onSelect(ws.id)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
        active ? 'bg-gold/10 ring-1 ring-gold/30' : 'hover:bg-night-700'
      }`}
    >
      <WorkspaceBadge ws={ws} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-100 truncate">{ws.name}</p>
        <p className="text-xs text-slate-500">{workspaceTypeLabels[ws.type]} · {ws.membersCount} membres</p>
      </div>
      {active && <Check className="w-4 h-4 text-gold shrink-0" />}
    </button>
  )
}

export default function WorkspaceSwitcher({ variant = 'sidebar' }) {
  const { workspaces, activeWorkspace, setActiveWorkspaceId } = useWorkspace()
  const [open, setOpen] = useState(false)
  // Un seul espace : pas de sélecteur, juste un rappel simplifié et non cliquable.
  const isSingleWorkspace = workspaces.length <= 1

  const handleSelect = (id) => {
    setActiveWorkspaceId(id)
    setOpen(false)
  }

  if (variant === 'mobile') {
    if (isSingleWorkspace) {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-night-700/60 text-slate-300">
          <WorkspaceBadge ws={activeWorkspace} size="w-5 h-5" rounded="rounded-md" iconSize="w-3 h-3" />
          <span className="text-xs font-medium max-w-[90px] truncate">{activeWorkspace.name}</span>
        </div>
      )
    }

    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-night-700 text-slate-200 transition-all active:scale-95"
        >
          <WorkspaceBadge ws={activeWorkspace} size="w-5 h-5" rounded="rounded-md" iconSize="w-3 h-3" />
          <span className="text-xs font-medium max-w-[90px] truncate">{activeWorkspace.name}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </button>

        {open && (
          <div className="fixed inset-0 z-[70] flex items-start justify-center animate-fade-in">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <div className="relative w-full max-w-sm bg-night-800 border border-slate-800 rounded-b-3xl p-4 animate-slide-up shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-100">Mes espaces de travail</h3>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-700 text-slate-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-1">
                {workspaces.map(ws => (
                  <WorkspaceRow key={ws.id} ws={ws} active={ws.id === activeWorkspace.id} onSelect={handleSelect} />
                ))}
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  if (isSingleWorkspace) {
    return (
      <div className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-night-700/60">
        <WorkspaceBadge ws={activeWorkspace} size="w-8 h-8" rounded="rounded-lg" />
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-medium text-slate-100 truncate">{activeWorkspace.name}</p>
          <p className="text-[11px] text-slate-500">{workspaceTypeLabels[activeWorkspace.type]}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-night-700 hover:bg-slate-700 transition-colors"
      >
        <WorkspaceBadge ws={activeWorkspace} size="w-8 h-8" rounded="rounded-lg" />
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-medium text-slate-100 truncate">{activeWorkspace.name}</p>
          <p className="text-[11px] text-slate-500">{workspaceTypeLabels[activeWorkspace.type]}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full mt-2 bg-night-800 border border-slate-700 rounded-2xl p-2 shadow-2xl z-30 animate-fade-in space-y-1">
            {workspaces.map(ws => (
              <WorkspaceRow key={ws.id} ws={ws} active={ws.id === activeWorkspace.id} onSelect={handleSelect} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
