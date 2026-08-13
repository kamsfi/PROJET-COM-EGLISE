import { useEffect, useState } from 'react'
import { Wallet, HandCoins, Smartphone, Landmark, Copy, Check, Calendar, CheckCircle2, Sparkles } from 'lucide-react'
import { financeCopyByType, pledgeFrequencies, paymentInfo, contributionHistory, currencies, formatAmount, isUuid } from '../data'
import { useWorkspace } from '../context/WorkspaceContext'
import { useCurrentUser } from '../context/CurrentUserContext'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import AIAssistantModal from './AIAssistantModal'

const PLEDGE_AMOUNTS = [10, 25, 50, 100, 250]

const STATUS_LABELS = { promesse: 'Promesse', confirme: 'Confirmé', annule: 'Annulé' }

function categoryLabel(id, copy) {
  return copy.pledgeCategories.find(c => c.id === id)?.label || id
}

function CurrencySelect({ currency, onChange }) {
  return (
    <select
      value={currency}
      onChange={e => onChange(e.target.value)}
      title="Votre devise"
      className="bg-night-700 text-slate-200 text-xs font-medium rounded-lg px-2.5 py-2 outline-none focus:ring-2 focus:ring-gold/50 transition-all shrink-0"
    >
      {currencies.map(c => (
        <option key={c.code} value={c.code}>{c.code} · {c.symbol}</option>
      ))}
    </select>
  )
}

function PledgeForm({ copy, currency, onSubmit, submitting = false, error = '' }) {
  const [selected, setSelected] = useState(50)
  const [custom, setCustom] = useState('')
  const [frequency, setFrequency] = useState('monthly')
  const [category, setCategory] = useState(copy.pledgeCategories[0].id)
  const [confirmed, setConfirmed] = useState(false)

  const amount = custom ? parseInt(custom) || 0 : selected
  const currencySymbol = currencies.find(c => c.code === currency)?.symbol || '€'

  const handleSubmit = async () => {
    if (amount <= 0 || submitting) return
    const ok = await onSubmit({ amount, category, frequency })
    if (ok) {
      setConfirmed(true)
      setTimeout(() => setConfirmed(false), 4000)
    }
  }

  return (
    <div className="bg-night-800 rounded-2xl border border-slate-800 overflow-hidden animate-slide-up">
      <div className="p-5 bg-gradient-to-br from-gold/10 to-transparent border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gold/10 flex items-center justify-center">
            <HandCoins className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100">Faire une promesse</h3>
            <p className="text-xs text-slate-400">Engagez une contribution régulière ou ponctuelle</p>
          </div>
        </div>
      </div>

      <div className="p-5">
        {confirmed ? (
          <div className="text-center py-6 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
              <Check className="w-7 h-7 text-emerald-400" />
            </div>
            <p className="text-slate-100 font-semibold mb-1">Promesse enregistrée !</p>
            <p className="text-sm text-slate-400">
              {formatAmount(amount, currency)} · {pledgeFrequencies.find(f => f.id === frequency)?.label}
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-400 mb-2">Catégorie</p>
            <div className="flex gap-2 flex-wrap mb-4">
              {copy.pledgeCategories.map(c => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    category === c.id ? 'bg-gold text-white' : 'bg-night-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <p className="text-xs text-slate-400 mb-2">Montant</p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {PLEDGE_AMOUNTS.map(amt => (
                <button
                  key={amt}
                  onClick={() => { setSelected(amt); setCustom('') }}
                  className={`py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95 ${
                    !custom && selected === amt
                      ? 'bg-gold text-white'
                      : 'bg-night-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {amt} {currencySymbol}
                </button>
              ))}
            </div>
            <div className="relative mb-4">
              <input
                type="number"
                value={custom}
                onChange={e => setCustom(e.target.value)}
                placeholder="Montant personnalisé"
                className="w-full bg-night-700 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold/50 transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{currencySymbol}</span>
            </div>

            <p className="text-xs text-slate-400 mb-2">Fréquence</p>
            <div className="flex bg-night-700 rounded-xl p-1 mb-4">
              {pledgeFrequencies.map(f => (
                <button
                  key={f.id}
                  onClick={() => setFrequency(f.id)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    frequency === f.id ? 'bg-gold text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {error && <p className="text-xs text-red-400 px-1 mb-3">{error}</p>}
            <button
              onClick={handleSubmit}
              disabled={amount <= 0 || submitting}
              className="w-full bg-gold hover:bg-gold-light disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all active:scale-[0.98]"
            >
              {submitting ? 'Envoi…' : `Confirmer ${formatAmount(amount, currency)} · ${pledgeFrequencies.find(f => f.id === frequency)?.label}`}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function CopyRow({ label, value, sub }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard?.writeText(value).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-slate-800/60 last:border-0">
      <div className="min-w-0">
        <p className="text-sm text-slate-200 truncate">{label}</p>
        {sub && <p className="text-xs text-slate-500 truncate">{sub}</p>}
      </div>
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-night-700 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all active:scale-95 shrink-0"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? 'Copié' : 'Copier'}
      </button>
    </div>
  )
}

function PaymentInfoCard() {
  return (
    <div className="bg-night-800 rounded-2xl border border-slate-800 p-5 animate-slide-up">
      <h3 className="font-semibold text-slate-100 mb-3">Coordonnées de paiement</h3>

      <div className="flex items-center gap-2 mb-1.5 mt-2">
        <Smartphone className="w-4 h-4 text-gold" />
        <p className="text-xs font-medium text-slate-400">Mobile Money</p>
      </div>
      {paymentInfo.mobileMoney.map(m => (
        <CopyRow key={m.provider} label={m.provider} sub={m.number} value={m.number} />
      ))}

      <div className="flex items-center gap-2 mb-1.5 mt-4">
        <Landmark className="w-4 h-4 text-gold" />
        <p className="text-xs font-medium text-slate-400">{paymentInfo.bank.label}</p>
      </div>
      <CopyRow label="IBAN" sub={paymentInfo.bank.iban} value={paymentInfo.bank.iban} />
      <CopyRow label="BIC / SWIFT" sub={paymentInfo.bank.bic} value={paymentInfo.bank.bic} />
    </div>
  )
}

function HistoryCard({ history, currency }) {
  return (
    <div className="bg-night-800 rounded-2xl border border-slate-800 overflow-hidden animate-slide-up">
      <div className="px-5 pt-4 pb-2">
        <h3 className="font-semibold text-slate-100">Historique</h3>
      </div>
      {history.map(h => (
        <div key={h.id} className="flex items-center gap-3 px-5 py-3 border-t border-slate-800/60">
          <div className="w-9 h-9 rounded-xl bg-night-700 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4 text-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200">{h.category}</p>
            <p className="text-xs text-slate-500">
              {new Date(h.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}{h.method ? ` · ${h.method}` : ''}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-semibold text-slate-100">{formatAmount(h.amount, currency)}</p>
            <p className={`text-[10px] flex items-center gap-1 justify-end ${h.confirmed === false ? 'text-slate-500' : 'text-emerald-400'}`}>
              {h.confirmed === false ? <Calendar className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
              {h.status}
            </p>
          </div>
        </div>
      ))}
      {history.length === 0 && (
        <div className="text-center text-slate-500 py-8 text-sm">Aucune contribution enregistrée</div>
      )}
    </div>
  )
}

export default function Finances() {
  const { activeWorkspace } = useWorkspace()
  const { currentUser, updateCurrentUser } = useCurrentUser()
  const [showAIReport, setShowAIReport] = useState(false)
  // Jamais réinitialisé au changement d'espace — upsert par id (vrai
  // historique chargé + promesses soumises pendant la session).
  const [dynamicHistory, setDynamicHistory] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const copy = financeCopyByType[activeWorkspace.type]
  const currency = currentUser.currency || 'EUR'
  const isRealWorkspace = isUuid(activeWorkspace.id)

  // Charge le vrai historique Supabase de l'espace actif (RLS limite déjà
  // aux propres contributions, sauf pour un admin qui voit tout).
  useEffect(() => {
    if (!isSupabaseConfigured || !isUuid(activeWorkspace.id)) return
    let cancelled = false

    async function loadHistory() {
      const { data: rows, error } = await supabase
        .from('contributions')
        .select('id, amount, currency_code, category, frequency, status, created_at')
        .eq('organization_id', activeWorkspace.id)
        .order('created_at', { ascending: false })
      if (cancelled) return
      if (error) { console.warn('[ComHub] Échec du chargement des contributions Supabase', error); return }

      const mapped = (rows || []).map(row => ({
        id: row.id,
        workspaceId: activeWorkspace.id,
        date: row.created_at.slice(0, 10),
        amount: Number(row.amount),
        category: categoryLabel(row.category, copy),
        method: null,
        status: STATUS_LABELS[row.status] || row.status,
        confirmed: row.status === 'confirme',
      }))

      setDynamicHistory(prev => {
        const byId = new Map(prev.map(h => [h.id, h]))
        for (const h of mapped) byId.set(h.id, h)
        return Array.from(byId.values())
      })
    }

    loadHistory()
    return () => { cancelled = true }
  }, [activeWorkspace.id, copy])

  const handlePledgeSubmit = async ({ amount, category, frequency }) => {
    if (isSupabaseConfigured && isUuid(activeWorkspace.id)) {
      setSubmitError('')
      setSubmitting(true)
      const { data, error } = await supabase.from('contributions')
        .insert({ organization_id: activeWorkspace.id, user_id: currentUser.id, amount, currency_code: currency, category, frequency })
        .select('id, created_at')
        .single()
      setSubmitting(false)
      if (error) {
        console.warn('[ComHub] Échec de l\'enregistrement de la promesse Supabase', error)
        setSubmitError('Impossible d\'enregistrer votre promesse. Réessayez.')
        return false
      }
      setDynamicHistory(prev => [
        {
          id: data.id,
          workspaceId: activeWorkspace.id,
          date: data.created_at.slice(0, 10),
          amount,
          category: categoryLabel(category, copy),
          method: null,
          status: STATUS_LABELS.promesse,
          confirmed: false,
        },
        ...prev,
      ])
      return true
    }
    // Branche mock : pas de vraie persistance possible (pas de backend),
    // mais affichée dans l'historique de la session — corrige au passage
    // le comportement actuel où la promesse disparaissait sans laisser de
    // trace, incohérent avec tous les autres modules en mode démo.
    setDynamicHistory(prev => [
      {
        id: `pledge-${Date.now()}`,
        workspaceId: activeWorkspace.id,
        date: new Date().toISOString().slice(0, 10),
        amount,
        category: categoryLabel(category, copy),
        method: null,
        status: STATUS_LABELS.promesse,
        confirmed: false,
      },
      ...prev,
    ])
    return true
  }

  const dynamicWorkspaceHistory = dynamicHistory.filter(h => h.workspaceId === activeWorkspace.id)
  const history = isRealWorkspace
    ? dynamicWorkspaceHistory
    : [...dynamicWorkspaceHistory, ...contributionHistory.filter(h => h.workspaceId === activeWorkspace.id)]
  const total = history.reduce((sum, h) => sum + h.amount, 0)

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="px-4 pt-4 pb-3 bg-night-800/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-slate-100 truncate">{copy.title}</h1>
              <p className="text-sm text-slate-400 mt-0.5 truncate">{copy.subtitle}</p>
            </div>
          </div>
          <CurrencySelect currency={currency} onChange={c => updateCurrentUser({ currency: c })} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        <div className="bg-gradient-to-br from-gold/10 to-transparent rounded-2xl border border-gold/20 p-4 animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-slate-400">Total contribué (12 derniers mois)</p>
              <p className="text-2xl font-bold text-slate-100 mt-0.5">{formatAmount(total, currency)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Contributions</p>
              <p className="text-2xl font-bold text-gold mt-0.5">{history.length}</p>
            </div>
          </div>
          <button
            onClick={() => setShowAIReport(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gold/10 hover:bg-gold/20 text-gold text-sm font-medium transition-all active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4" />
            Générer le rapport financier IA
          </button>
        </div>

        <PledgeForm copy={copy} currency={currency} onSubmit={handlePledgeSubmit} submitting={submitting} error={submitError} />
        <PaymentInfoCard />
        <HistoryCard history={history} currency={currency} />

        <div className="text-center text-xs text-slate-600 py-2">
          Paiements sécurisés · Reçus disponibles sur demande
        </div>
      </div>

      {showAIReport && (
        <AIAssistantModal
          subject={`Rapport financier — ${activeWorkspace.name}`}
          kind="finance"
          onClose={() => setShowAIReport(false)}
        />
      )}
    </div>
  )
}
