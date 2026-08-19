import { useEffect, useState } from 'react'
import { Sparkles, Loader2, CheckCircle2, ListChecks, Heart, TrendingUp, X, Copy, Check } from 'lucide-react'
import { buildAISummary } from '../data'
import { useWorkspace } from '../context/WorkspaceContext'

const THIRD_ICONS = { heart: Heart, tasks: ListChecks, trend: TrendingUp }

const LOADING_STEPS = [
  'Lecture des échanges...',
  'Identification des points clés...',
  'Rédaction de la synthèse...',
]

function LoadingState({ subject }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(s => Math.min(s + 1, LOADING_STEPS.length - 1))
    }, 550)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center text-center py-10 px-6 animate-fade-in">
      <div className="relative w-16 h-16 mb-5">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gold to-gold-dark opacity-20 animate-pulse-ring" />
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center">
          <Loader2 className="w-7 h-7 text-white animate-spin" />
        </div>
      </div>
      <h3 className="font-semibold text-slate-100 mb-1">Cordée AI analyse « {subject} »</h3>
      <p className="text-sm text-gold-light transition-all">{LOADING_STEPS[step]}</p>
    </div>
  )
}

function SummarySection({ icon: Icon, iconClass, title, items }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 shrink-0 ${iconClass}`} />
        <h4 className="text-sm font-semibold text-slate-100">{title}</h4>
      </div>
      <ul className="space-y-1.5 pl-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-300 leading-relaxed">
            <span className="w-1 h-1 rounded-full bg-slate-600 shrink-0 mt-2" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function ReadyState({ summary, onClose }) {
  const [copied, setCopied] = useState(false)
  const ThirdIcon = THIRD_ICONS[summary.thirdIcon] || ListChecks

  const handleCopy = () => {
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="animate-fade-in">
      <div className="px-5 pt-1 pb-4">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
          <Sparkles className="w-3.5 h-3.5 text-gold" />
          <span>Généré par Cordée AI · {summary.generatedAt}</span>
        </div>
        <h3 className="text-lg font-bold text-slate-100 leading-snug">{summary.subject}</h3>
      </div>

      <div className="px-5 space-y-5 max-h-[50vh] overflow-y-auto pb-2">
        <SummarySection
          icon={Sparkles}
          iconClass="text-gold"
          title="Points clés"
          items={summary.keyPoints}
        />
        <SummarySection
          icon={CheckCircle2}
          iconClass="text-emerald-400"
          title="Décisions prises"
          items={summary.decisions}
        />
        <SummarySection
          icon={ThirdIcon}
          iconClass="text-sky-400"
          title={summary.thirdTitle}
          items={summary.thirdItems}
        />
      </div>

      <div className="flex items-center gap-2 px-5 pt-4 pb-1">
        <button
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-night-700 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-all active:scale-[0.98]"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copié' : 'Copier la synthèse'}
        </button>
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-white text-sm font-semibold transition-all active:scale-[0.98]"
        >
          Fermer
        </button>
      </div>
    </div>
  )
}

export default function AIAssistantModal({ subject, kind, onClose }) {
  const { activeWorkspace } = useWorkspace()
  const [phase, setPhase] = useState('loading')
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    setPhase('loading')
    const timeout = setTimeout(() => {
      setSummary(buildAISummary({ type: activeWorkspace.type, kind, subject }))
      setPhase('ready')
    }, 1800)
    return () => clearTimeout(timeout)
  }, [subject, kind, activeWorkspace.type])

  return (
    <div className="fixed inset-0 z-[65] flex items-end sm:items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-md bg-night-800 border border-slate-800 rounded-t-3xl sm:rounded-3xl pb-safe animate-slide-up shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-100">Cordée AI</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-700 text-slate-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {phase === 'loading' ? (
          <LoadingState subject={subject} />
        ) : (
          <ReadyState summary={summary} onClose={onClose} />
        )}
      </div>
    </div>
  )
}
