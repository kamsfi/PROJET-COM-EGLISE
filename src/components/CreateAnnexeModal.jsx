import { useState } from 'react'
import { X, Building2, UserCog } from 'lucide-react'
import { useOrganizations } from '../context/OrganizationsContext'

export default function CreateAnnexeModal({ parentOrg, onClose, onCreated }) {
  const { createAnnexe } = useOrganizations()
  const [name, setName] = useState('')
  const [leaderName, setLeaderName] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim() || !leaderName.trim()) return
    const annexe = createAnnexe({ parentId: parentOrg.id, name: name.trim(), leaderName: leaderName.trim() })
    onCreated?.(annexe)
  }

  return (
    <div className="fixed inset-0 z-[65] flex items-end sm:items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-sm bg-night-800 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 pb-safe animate-slide-up shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-700 text-slate-400 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Créer une annexe</h2>
            <p className="text-xs text-slate-400">Sous-compte rattaché à {parentOrg.name}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nom de l'annexe (ex: Annexe Sud)"
              className="w-full bg-night-700 text-slate-100 placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold/50 transition-all"
            />
          </div>

          <div className="relative">
            <UserCog className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              required
              value={leaderName}
              onChange={e => setLeaderName(e.target.value)}
              placeholder="Pasteur local / Leader désigné"
              className="w-full bg-night-700 text-slate-100 placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold/50 transition-all"
            />
          </div>

          <p className="text-[11px] text-slate-500 px-1">
            Cette personne sera désignée administratrice de la nouvelle annexe. Les membres des deux organisations pourront se voir dans l'annuaire global et échanger via les canaux transversaux de la dénomination.
          </p>

          <button
            type="submit"
            disabled={!name.trim() || !leaderName.trim()}
            className="w-full bg-gold hover:bg-gold-light disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all active:scale-[0.98] mt-2"
          >
            Créer l'annexe
          </button>
        </form>
      </div>
    </div>
  )
}
