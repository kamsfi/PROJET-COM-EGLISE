import { useState } from 'react'
import { X, UsersRound, Sparkles } from 'lucide-react'

const GENDER_OPTIONS = [
  { id: 'all', label: 'Tous' },
  { id: 'M', label: 'Homme' },
  { id: 'F', label: 'Femme' },
]

const MARITAL_OPTIONS = [
  { id: 'all', label: 'Tous' },
  { id: 'single', label: 'Célibataire' },
  { id: 'married', label: 'Marié(e)' },
]

export default function GroupRulesModal({ onClose, onCreate, submitting = false, error = '', initialValues = null }) {
  const isEdit = !!initialValues
  const [name, setName] = useState(initialValues?.name || '')
  const [description, setDescription] = useState(initialValues?.description || '')
  const [gender, setGender] = useState(initialValues?.rules?.gender || 'all')
  const [minAge, setMinAge] = useState(initialValues?.rules?.min_age ?? '')
  const [maxAge, setMaxAge] = useState(initialValues?.rules?.max_age ?? '')
  const [maritalStatus, setMaritalStatus] = useState(initialValues?.rules?.marital_status || 'all')

  const hasRules = gender !== 'all' || minAge || maxAge || maritalStatus !== 'all'

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim() || submitting) return

    onCreate({
      name: name.trim(),
      description: description.trim(),
      rules: hasRules
        ? {
            gender: gender === 'all' ? null : gender,
            min_age: minAge ? Number(minAge) : null,
            max_age: maxAge ? Number(maxAge) : null,
            marital_status: maritalStatus === 'all' ? null : maritalStatus,
          }
        : null,
    })
  }

  return (
    <div className="fixed inset-0 z-[65] flex items-end sm:items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-sm bg-night-800 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 pb-safe animate-slide-up shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-700 text-slate-400 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shrink-0">
            <UsersRound className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">{isEdit ? 'Modifier le groupe' : 'Créer un groupe'}</h2>
            <p className="text-xs text-slate-400">Avec règles d'auto-assignation</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nom du groupe"
              className="w-full bg-night-700 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold/50 transition-all"
            />
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Description (optionnel)"
              rows={2}
              className="w-full bg-night-700 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold/50 transition-all resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-800">
            <p className="text-xs font-medium text-slate-400 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              Règles d'auto-assignation (optionnel)
            </p>

            <div className="space-y-3">
              <div>
                <p className="text-[11px] text-slate-500 mb-1.5">Genre cible</p>
                <div className="flex bg-night-700 rounded-xl p-1">
                  {GENDER_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setGender(opt.id)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        gender === opt.id ? 'bg-gold text-white shadow' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] text-slate-500 mb-1.5">Tranche d'âge</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={minAge}
                    onChange={e => setMinAge(e.target.value)}
                    placeholder="Min"
                    className="w-full bg-night-700 text-slate-100 placeholder-slate-500 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold/50 transition-all"
                  />
                  <span className="text-slate-600 text-sm">—</span>
                  <input
                    type="number"
                    min="0"
                    value={maxAge}
                    onChange={e => setMaxAge(e.target.value)}
                    placeholder="Max"
                    className="w-full bg-night-700 text-slate-100 placeholder-slate-500 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold/50 transition-all"
                  />
                  <span className="text-xs text-slate-500 shrink-0">ans</span>
                </div>
              </div>

              <div>
                <p className="text-[11px] text-slate-500 mb-1.5">Statut matrimonial</p>
                <div className="flex bg-night-700 rounded-xl p-1">
                  {MARITAL_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setMaritalStatus(opt.id)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        maritalStatus === opt.id ? 'bg-gold text-white shadow' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {error && <p className="text-xs text-red-400 px-1">{error}</p>}

          <button
            type="submit"
            disabled={!name.trim() || submitting}
            className="w-full bg-gold hover:bg-gold-light disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all active:scale-[0.98]"
          >
            {isEdit
              ? (submitting ? 'Enregistrement…' : 'Enregistrer les modifications')
              : (submitting ? 'Création…' : 'Créer le groupe')}
          </button>
        </form>
      </div>
    </div>
  )
}
