import { useState } from 'react'
import { Phone, Lock, Layers, Eye, EyeOff, Sparkles, ChevronLeft, Check } from 'lucide-react'
import { useCurrentUser } from '../context/CurrentUserContext'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import SignupWizard from './SignupWizard'

function ResetPasswordPanel({ onBack }) {
  const [identifier, setIdentifier] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!identifier.trim()) return
    setSent(true)
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-4"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        Retour à la connexion
      </button>

      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center mb-3">
          <Lock className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-xl font-bold text-slate-100">Mot de passe oublié</h2>
        <p className="text-sm text-slate-400 mt-1">Nous vous enverrons un lien de réinitialisation</p>
      </div>

      {sent ? (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center animate-fade-in">
          <Check className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
          <p className="text-emerald-400 text-sm font-medium">
            Un lien de réinitialisation a été envoyé à « {identifier} ».
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              required
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder="Téléphone ou e-mail"
              className="w-full bg-night-700 text-slate-100 placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold/50 transition-all"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gold hover:bg-gold-light text-white font-semibold py-3 rounded-xl transition-all active:scale-[0.98]"
          >
            Envoyer le lien
          </button>
        </form>
      )}
    </div>
  )
}

function LoginPanel({ onSwitchToSignup }) {
  const { demoUsers, findUserByIdentifier, login } = useCurrentUser()
  const [view, setView] = useState('login')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (view === 'reset') {
    return <ResetPasswordPanel onBack={() => setView('login')} />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    if (isSupabaseConfigured) {
      const credentials = identifier.includes('@')
        ? { email: identifier.trim(), password }
        : { phone: identifier.trim(), password }
      const { error: authError } = await supabase.auth.signInWithPassword(credentials)
      setSubmitting(false)

      if (authError) {
        setError(`Supabase : ${authError.message}`)
        return
      }

      // Le compte Supabase est authentifié ; l'espace de travail (organisations,
      // groupes...) reste piloté par les données de démonstration locales tant
      // que cette partie n'est pas branchée. On raccorde ici la session réelle
      // à un profil local du même téléphone/e-mail si un correspond.
      const localMatch = findUserByIdentifier(identifier)
      if (localMatch) {
        login(localMatch.id)
      } else {
        setError(
          'Connexion Supabase réussie, mais aucun espace de travail local ne correspond encore à ce compte. ' +
          'Utilisez l\'Accès Démo Rapide ci-dessous ou inscrivez-vous pour explorer ComHub.'
        )
      }
      return
    }

    // Mode démo (Supabase non configuré) — comportement inchangé.
    setTimeout(() => {
      const user = findUserByIdentifier(identifier)
      setSubmitting(false)
      if (!user) {
        setError('Aucun compte trouvé avec ce numéro ou cet e-mail. Essayez l\'accès démo rapide ou inscrivez-vous.')
        return
      }
      login(user.id)
    }, 500)
  }

  return (
    <div>
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center mb-3">
          <Layers className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-xl font-bold text-slate-100">Bon retour parmi vous</h2>
        <p className="text-sm text-slate-400 mt-1">Connectez-vous à ComHub</p>
        <p className="text-[10px] text-slate-600 mt-1">
          {isSupabaseConfigured ? 'Connecté à Supabase' : 'Mode démo local · Supabase non configuré'}
        </p>
      </div>

      <div className="flex bg-night-700 rounded-xl p-1 mb-5">
        <button className="flex-1 py-2 rounded-lg text-sm font-medium bg-gold text-white shadow">
          Connexion
        </button>
        <button
          onClick={onSwitchToSignup}
          className="flex-1 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 transition-all"
        >
          Inscription
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            required
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            placeholder="Téléphone ou e-mail"
            className="w-full bg-night-700 text-slate-100 placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold/50 transition-all"
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type={showPassword ? 'text' : 'password'}
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Mot de passe"
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

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setView('reset')}
            className="text-xs text-gold-light hover:text-gold transition-colors"
          >
            Mot de passe oublié ?
          </button>
        </div>

        {error && <p className="text-xs text-red-400 px-1">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-gold hover:bg-gold-light disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all active:scale-[0.98] mt-2"
        >
          {submitting ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>

      <div className="flex items-center gap-2 my-5">
        <div className="flex-1 h-px bg-slate-800" />
        <span className="text-[11px] text-slate-500">Accès Démo Rapide</span>
        <div className="flex-1 h-px bg-slate-800" />
      </div>

      <div className="space-y-2">
        {demoUsers.filter(u => ['daniel', 'jean'].includes(u.id)).map(u => (
          <button
            key={u.id}
            onClick={() => login(u.id)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-night-700 hover:bg-slate-700 transition-all active:scale-[0.98] text-left"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold to-orange-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
              {u.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{u.full_name}</p>
              <p className="text-[11px] text-slate-500">
                {u.memberships.length > 1 ? `Multi-espaces · ${u.memberships.length} organisations` : 'Église uniquement'}
              </p>
            </div>
            <Sparkles className="w-3.5 h-3.5 text-gold shrink-0" />
          </button>
        ))}
      </div>

      <p className="text-center text-xs text-slate-500 mt-5">
        Pas encore de compte ? <button onClick={onSwitchToSignup} className="text-gold-light hover:text-gold font-medium">S'inscrire</button>
      </p>
    </div>
  )
}

export default function AuthModal() {
  const [mode, setMode] = useState('login')

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative w-full sm:max-w-sm bg-night-800 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 pb-safe animate-slide-up shadow-2xl max-h-[92vh] overflow-y-auto">
        {mode === 'login' ? (
          <LoginPanel onSwitchToSignup={() => setMode('signup')} />
        ) : (
          <SignupWizard onBackToLogin={() => setMode('login')} />
        )}
      </div>
    </div>
  )
}
