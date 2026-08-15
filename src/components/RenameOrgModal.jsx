import { useState } from 'react'
import { X, Building2 } from 'lucide-react'
import { useOrganizations } from '../context/OrganizationsContext'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { isRealWorkspaceId } from '../data'

export default function RenameOrgModal({ org, onClose }) {
  const { patchOrganization } = useOrganizations()
  const [name, setName] = useState(org.name)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || submitting) return

    if (isSupabaseConfigured && isRealWorkspaceId(org.id)) {
      setSubmitting(true)
      setError('')
      const { error: updateError } = await supabase.from('organizations').update({ name: trimmed }).eq('id', org.id)
      setSubmitting(false)
      if (updateError) {
        console.warn('[ComHub] Échec du renommage de l\'organisation', updateError)
        setError('Impossible d\'enregistrer ce nom. Réessayez.')
        return
      }
    }

    patchOrganization(org.id, { name: trimmed })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[68] flex items-end sm:items-center justify-center animate-fade-in">
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
            <h2 className="text-lg font-bold text-slate-100">Renommer l'espace</h2>
            <p className="text-xs text-slate-400">Visible par tous les membres</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            required
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nom de l'organisation"
            className="w-full bg-night-700 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold/50 transition-all"
          />

          {error && <p className="text-xs text-red-400 px-1">{error}</p>}

          <button
            type="submit"
            disabled={!name.trim() || submitting}
            className="w-full bg-gold hover:bg-gold-light disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all active:scale-[0.98] mt-2"
          >
            {submitting ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </form>
      </div>
    </div>
  )
}
