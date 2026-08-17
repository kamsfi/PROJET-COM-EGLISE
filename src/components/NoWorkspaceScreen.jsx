import { useState } from 'react'
import { Layers, Hash, LogOut } from 'lucide-react'
import { useCurrentUser } from '../context/CurrentUserContext'
import { supabase } from '../lib/supabaseClient'

export default function NoWorkspaceScreen() {
  const { currentUser, logout } = useCurrentUser()
  const [joinCode, setJoinCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!joinCode.trim() || submitting) return
    setError('')
    setSubmitting(true)
    const { error: joinError } = await supabase.rpc('join_organization_by_code', { p_code: joinCode.trim() })
    if (joinError) {
      setSubmitting(false)
      console.warn('[ComHub] Échec de la jointure par code', joinError)
      setError('Code introuvable. Vérifiez le code auprès de votre organisation.')
      return
    }
    // Déclenche un événement TOKEN_REFRESHED capté par l'abonnement
    // onAuthStateChange existant de CurrentUserContext, qui recharge
    // profiles/memberships et fait ressortir la nouvelle adhésion.
    await supabase.auth.refreshSession()
    setSubmitting(false)
  }

  return (
    <div className="h-screen w-screen bg-night-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-night-800 border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center mb-3">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">Bienvenue, {currentUser.full_name.split(' ')[0]}</h2>
          <p className="text-sm text-slate-400 mt-1">
            Votre compte est confirmé, mais vous ne faites encore partie d'aucune organisation.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              required
              value={joinCode}
              onChange={e => setJoinCode(e.target.value)}
              placeholder="Code d'organisation (ex: EGL-4F82)"
              className="w-full bg-night-700 text-slate-100 placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold/50 transition-all uppercase placeholder:normal-case"
            />
          </div>
          {error && <p className="text-xs text-red-400 px-1">{error}</p>}
          <button
            type="submit"
            disabled={!joinCode.trim() || submitting}
            className="w-full bg-gold hover:bg-gold-light disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all active:scale-[0.98]"
          >
            {submitting ? 'Vérification…' : 'Rejoindre cette organisation'}
          </button>
        </form>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-1.5 mt-4 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Se déconnecter
        </button>
      </div>
    </div>
  )
}
