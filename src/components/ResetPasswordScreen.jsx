import { useState } from 'react'
import { Lock, Eye, EyeOff, Check } from 'lucide-react'
import { useCurrentUser } from '../context/CurrentUserContext'

export default function ResetPasswordScreen() {
  const { updatePassword } = useCurrentUser()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }
    if (password !== confirm) {
      setError('Les deux mots de passe ne correspondent pas.')
      return
    }
    setSubmitting(true)
    const { error: updateError } = await updatePassword(password)
    setSubmitting(false)
    if (updateError) {
      setError(`Supabase : ${updateError.message}`)
      return
    }
    setDone(true)
  }

  return (
    <div className="fixed inset-0 z-[60] bg-night-900 flex items-center justify-center px-6 animate-fade-in">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center mb-3">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">Nouveau mot de passe</h2>
          <p className="text-sm text-slate-400 mt-1">Choisissez un nouveau mot de passe pour votre compte</p>
        </div>

        {done ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center animate-fade-in">
            <Check className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <p className="text-emerald-400 text-sm font-medium">Mot de passe mis à jour. Vous pouvez continuer.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Nouveau mot de passe"
                className="w-full bg-night-700 text-slate-100 placeholder-slate-500 rounded-xl pl-10 pr-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold/50 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Confirmez le mot de passe"
                className="w-full bg-night-700 text-slate-100 placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold/50 transition-all"
              />
            </div>

            {error && <p className="text-xs text-red-400 px-1">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gold hover:bg-gold-light disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all active:scale-[0.98] mt-2"
            >
              {submitting ? 'Enregistrement…' : 'Enregistrer le mot de passe'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
