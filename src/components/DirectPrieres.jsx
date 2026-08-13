import { useEffect, useState } from 'react'
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users, Radio, Hand, Share2, Send, Heart, Sparkles, HandHeart } from 'lucide-react'
import { prayerRequests, prayerCategories, buildPrayerEntry, isUuid, getInitials, pickColor } from '../data'
import { useWorkspace } from '../context/WorkspaceContext'
import { useCurrentUser } from '../context/CurrentUserContext'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import AIAssistantModal from './AIAssistantModal'

const LIVE_SUBJECT_BY_TYPE = {
  church: 'Culte du Dimanche',
  business: 'Réunion Générale',
  ngo: 'Point de Coordination Terrain',
}

// Heure pour une intention du jour, date courte sinon.
function formatPrayerTime(isoString) {
  const date = new Date(isoString)
  const now = new Date()
  const sameDay = date.toDateString() === now.toDateString()
  return sameDay
    ? date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function LiveCard({ onJoin, onGenerateReport, subject }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-night-800 to-night-700 border border-gold/30 p-5 animate-slide-up">
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-gold/10 rounded-full blur-3xl" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-semibold">
            <Radio className="w-3 h-3 animate-live-pulse" />
            EN DIRECT BIENTÔT
          </span>
        </div>
        <h2 className="text-xl font-bold text-slate-100 mb-1">{subject}</h2>
        <p className="text-sm text-slate-400 mb-4">Commence dans 1h 12min · Pasteur Jean-Marc</p>

        <div className="flex items-center gap-4 text-sm text-slate-300 mb-5">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-gold" />
            <span>128 inscrits</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-gold" />
            <span>Temple Central</span>
          </div>
        </div>

        <button
          onClick={onJoin}
          className="w-full bg-gold hover:bg-gold-light text-white font-semibold py-3 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Radio className="w-5 h-5" />
          Rejoindre le Live
        </button>

        <button
          onClick={onGenerateReport}
          className="w-full mt-2 bg-night-700/80 hover:bg-slate-700 text-gold-light font-medium py-2.5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
        >
          <Sparkles className="w-4 h-4" />
          Compte-rendu IA du dernier direct
        </button>
      </div>
    </div>
  )
}

function VideoCall({ onLeave, onGenerateReport, subject }) {
  const [muted, setMuted] = useState(false)
  const [cameraOn, setCameraOn] = useState(true)

  const participants = [
    { id: 1, name: 'Vous', color: 'from-gold to-orange-600', speaking: true, isMe: true },
    { id: 2, name: 'Pasteur Jean-Marc', color: 'from-blue-500 to-indigo-600', speaking: false },
    { id: 3, name: 'Sophie Martin', color: 'from-rose-500 to-pink-600', speaking: false },
    { id: 4, name: 'Thomas D.', color: 'from-cyan-500 to-blue-600', speaking: false },
    { id: 5, name: 'Marie L.', color: 'from-emerald-500 to-teal-600', speaking: false },
    { id: 6, name: 'Lucas P.', color: 'from-violet-500 to-purple-600', speaking: false },
  ]

  return (
    <div className="fixed inset-0 z-50 bg-night-900 flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-night-800/80 backdrop-blur-sm border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-semibold">
            <Radio className="w-3 h-3 animate-live-pulse" />
            EN DIRECT
          </span>
          <span className="text-sm text-slate-400 hidden sm:inline">{subject} · 6 participants</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onGenerateReport}
            title="Générer le compte-rendu"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-gold/10 hover:bg-gold/20 text-gold text-xs font-medium transition-all active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Compte-rendu</span>
          </button>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">06</span>
          </div>
        </div>
      </div>

      {/* Video grid */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 h-full">
          {participants.map(p => (
            <div
              key={p.id}
              className={`relative rounded-2xl bg-gradient-to-br ${p.color} flex items-center justify-center overflow-hidden min-h-[140px] ${
                p.speaking ? 'ring-2 ring-gold' : 'ring-1 ring-slate-800'
              }`}
            >
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-xl">
                {p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                <span className="text-white text-xs font-medium bg-black/40 backdrop-blur-sm px-2 py-1 rounded-md truncate">
                  {p.name}
                </span>
                {p.speaking && (
                  <span className="w-2 h-2 rounded-full bg-gold animate-live-pulse" />
                )}
              </div>
              {!cameraOn && p.isMe && (
                <div className="absolute inset-0 bg-night-900 flex items-center justify-center">
                  <VideoOff className="w-8 h-8 text-slate-500" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 py-4 bg-night-800/80 backdrop-blur-sm border-t border-slate-800 pb-safe">
        <div className="flex items-center justify-center gap-3 sm:gap-4">
          <button
            onClick={() => setMuted(m => !m)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 ${
              muted ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-200'
            }`}
          >
            {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setCameraOn(c => !c)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 ${
              cameraOn ? 'bg-slate-700 text-slate-200' : 'bg-red-500/20 text-red-400'
            }`}
          >
            {cameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>
          <button className="w-12 h-12 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center transition-all active:scale-95">
            <Hand className="w-5 h-5" />
          </button>
          <button className="w-12 h-12 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center transition-all active:scale-95 hidden sm:flex">
            <Share2 className="w-5 h-5" />
          </button>
          <button
            onClick={onLeave}
            className="w-14 h-12 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all active:scale-95"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

function PrayerForm({ onSubmitPrayer, submitting = false, error = '' }) {
  const [submitted, setSubmitted] = useState(false)
  const [prayer, setPrayer] = useState('')
  const [category, setCategory] = useState(prayerCategories[0].id)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!prayer.trim() || submitting) return
    const ok = await onSubmitPrayer(category, prayer.trim())
    if (ok) {
      setPrayer('')
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 2500)
    }
  }

  return (
    <div className="bg-night-800 rounded-2xl border border-slate-800 p-5 animate-slide-up">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-xl bg-gold/10 flex items-center justify-center">
          <Heart className="w-5 h-5 text-gold" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-100">Intention de Prière</h3>
          <p className="text-xs text-slate-400">Partagez votre demande avec la communauté</p>
        </div>
      </div>

      {submitted && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-center mb-3 animate-fade-in">
          <p className="text-emerald-400 font-medium text-xs">Merci. Votre intention a été ajoutée ci-dessous. 🙏</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          {prayerCategories.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                category === c.id
                  ? 'bg-gold text-white'
                  : 'bg-night-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <textarea
          value={prayer}
          onChange={e => setPrayer(e.target.value)}
          placeholder="Décrivez votre intention de prière..."
          rows={3}
          className="w-full bg-night-700 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-gold/50 transition-all resize-none"
        />
        {error && <p className="text-xs text-red-400 px-1">{error}</p>}
        <button
          type="submit"
          disabled={!prayer.trim() || submitting}
          className="w-full bg-gold hover:bg-gold-light disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
        >
          <Send className="w-4 h-4" />
          {submitting ? 'Envoi…' : 'Soumettre mon intention'}
        </button>
      </form>
    </div>
  )
}

function PrayerCard({ prayer, prayed, onPray }) {
  const categoryLabel = prayerCategories.find(c => c.id === prayer.category)?.label || prayer.category

  return (
    <div className="bg-night-800 rounded-2xl border border-slate-800 p-4 animate-slide-up">
      <div className="flex items-center gap-3 mb-2.5">
        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${prayer.color} flex items-center justify-center text-white font-semibold text-xs shrink-0`}>
          {prayer.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-slate-100 truncate">{prayer.author}</h4>
            <span className="px-2 py-0.5 rounded-full bg-night-700 text-slate-400 text-[10px] font-medium shrink-0">
              {categoryLabel}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">{prayer.time}</p>
        </div>
      </div>

      <p className="text-sm text-slate-300 leading-relaxed mb-3">{prayer.content}</p>

      <button
        onClick={() => onPray(prayer.id)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 ${
          prayed ? 'bg-gold/20 text-gold ring-1 ring-gold/40' : 'bg-night-700 text-slate-400 hover:text-slate-200'
        }`}
      >
        <HandHeart className="w-3.5 h-3.5" />
        {prayed ? 'Vous priez pour cela' : 'Je prie pour cela'}
        <span className="text-slate-500">· {prayer.prayCount}</span>
      </button>
    </div>
  )
}

export default function DirectPrieres() {
  const { activeWorkspace } = useWorkspace()
  const { currentUser } = useCurrentUser()
  const [inCall, setInCall] = useState(false)
  const [showAISummary, setShowAISummary] = useState(false)
  const [prayers, setPrayers] = useState(() => prayerRequests.filter(p => p.workspaceId === activeWorkspace.id))
  const [prayedIds, setPrayedIds] = useState(new Set())
  // Jamais réinitialisé au changement d'espace — même cycle de vie que
  // dynamicAnnouncements dans Canaux.jsx.
  const [realPrayers, setRealPrayers] = useState([])
  const [realPrayedIds, setRealPrayedIds] = useState(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const isRealWorkspace = isUuid(activeWorkspace.id)

  useEffect(() => {
    setPrayers(prayerRequests.filter(p => p.workspaceId === activeWorkspace.id))
    setPrayedIds(new Set())
  }, [activeWorkspace.id])

  // Charge les vraies intentions de prière Supabase de l'espace actif.
  useEffect(() => {
    if (!isSupabaseConfigured || !isUuid(activeWorkspace.id)) return
    let cancelled = false

    async function loadPrayers() {
      const { data: rows, error } = await supabase
        .from('prayer_requests')
        .select('id, category, content, created_at, profiles!prayer_requests_author_id_fkey(id, full_name), prayer_reactions(user_id)')
        .eq('organization_id', activeWorkspace.id)
        .order('created_at', { ascending: false })
      if (cancelled) return
      if (error) { console.warn('[ComHub] Échec du chargement des intentions de prière Supabase', error); return }

      const mapped = (rows || []).map(row => ({
        id: row.id,
        workspaceId: activeWorkspace.id,
        author: row.profiles?.full_name || 'Utilisateur supprimé',
        avatar: row.profiles?.full_name ? getInitials(row.profiles.full_name) : '??',
        color: pickColor(row.profiles?.id || row.id),
        category: row.category,
        content: row.content,
        time: formatPrayerTime(row.created_at),
        prayCount: (row.prayer_reactions || []).length,
      }))

      const myPrayedIds = (rows || [])
        .filter(row => (row.prayer_reactions || []).some(r => r.user_id === currentUser.id))
        .map(row => row.id)

      setRealPrayers(prev => {
        const byId = new Map(prev.map(p => [p.id, p]))
        for (const p of mapped) byId.set(p.id, p)
        return Array.from(byId.values())
      })
      setRealPrayedIds(prev => new Set([...prev, ...myPrayedIds]))
    }

    loadPrayers()
    return () => { cancelled = true }
  }, [activeWorkspace.id, currentUser.id])

  const subject = LIVE_SUBJECT_BY_TYPE[activeWorkspace.type] || LIVE_SUBJECT_BY_TYPE.church

  const handleSubmitPrayer = async (category, content) => {
    if (isSupabaseConfigured && isUuid(activeWorkspace.id)) {
      setSubmitError('')
      setSubmitting(true)
      const { data, error } = await supabase.from('prayer_requests')
        .insert({ organization_id: activeWorkspace.id, author_id: currentUser.id, category, content })
        .select('id, created_at')
        .single()
      setSubmitting(false)
      if (error) {
        console.warn('[ComHub] Échec de la soumission de l\'intention de prière Supabase', error)
        setSubmitError('Impossible de soumettre votre intention. Réessayez.')
        return false
      }
      setRealPrayers(prev => [
        {
          id: data.id,
          workspaceId: activeWorkspace.id,
          author: currentUser.full_name,
          avatar: currentUser.avatar,
          color: 'from-gold to-orange-600',
          category,
          content,
          time: 'À l\'instant',
          prayCount: 0,
        },
        ...prev,
      ])
      return true
    }
    // Branche mock (inchangée dans son résultat)
    const entry = buildPrayerEntry({
      author: currentUser.full_name,
      avatar: currentUser.avatar,
      color: 'from-gold to-orange-600',
      category,
      content,
      workspaceId: activeWorkspace.id,
    })
    setPrayers(prev => [entry, ...prev])
    return true
  }

  const togglePray = async (prayerId) => {
    if (isRealWorkspace) {
      const alreadyPrayed = realPrayedIds.has(prayerId)
      setRealPrayedIds(prev => {
        const next = new Set(prev)
        alreadyPrayed ? next.delete(prayerId) : next.add(prayerId)
        return next
      })
      setRealPrayers(prev => prev.map(p => p.id === prayerId ? { ...p, prayCount: p.prayCount + (alreadyPrayed ? -1 : 1) } : p))

      const { error } = alreadyPrayed
        ? await supabase.from('prayer_reactions').delete().match({ prayer_request_id: prayerId, user_id: currentUser.id })
        : await supabase.from('prayer_reactions').insert({ prayer_request_id: prayerId, user_id: currentUser.id })

      if (error && error.code !== '23505') {
        console.warn('[ComHub] Échec de la mise à jour de la prière Supabase', error)
        setRealPrayedIds(prev => {
          const next = new Set(prev)
          alreadyPrayed ? next.add(prayerId) : next.delete(prayerId)
          return next
        })
        setRealPrayers(prev => prev.map(p => p.id === prayerId ? { ...p, prayCount: p.prayCount + (alreadyPrayed ? 1 : -1) } : p))
      }
      return
    }

    // Branche mock (inchangée)
    setPrayedIds(prev => {
      const next = new Set(prev)
      if (next.has(prayerId)) {
        next.delete(prayerId)
        setPrayers(list => list.map(p => p.id === prayerId ? { ...p, prayCount: p.prayCount - 1 } : p))
      } else {
        next.add(prayerId)
        setPrayers(list => list.map(p => p.id === prayerId ? { ...p, prayCount: p.prayCount + 1 } : p))
      }
      return next
    })
  }

  const visiblePrayers = isRealWorkspace
    ? realPrayers.filter(p => p.workspaceId === activeWorkspace.id)
    : prayers

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="px-4 pt-4 pb-3 bg-night-800/50 backdrop-blur-sm sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-slate-100">Direct & Prières</h1>
        <p className="text-sm text-slate-400 mt-0.5">Cultes en direct et intentions de prière</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        <LiveCard
          subject={subject}
          onJoin={() => setInCall(true)}
          onGenerateReport={() => setShowAISummary(true)}
        />
        <PrayerForm onSubmitPrayer={handleSubmitPrayer} submitting={submitting} error={submitError} />

        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-2 px-1">
            Intentions de la communauté {visiblePrayers.length > 0 && `(${visiblePrayers.length})`}
          </h3>
          <div className="space-y-3">
            {visiblePrayers.map(p => (
              <PrayerCard
                key={p.id}
                prayer={p}
                prayed={isRealWorkspace ? realPrayedIds.has(p.id) : prayedIds.has(p.id)}
                onPray={togglePray}
              />
            ))}
            {visiblePrayers.length === 0 && (
              <div className="text-center text-slate-500 py-8 text-sm bg-night-800/50 rounded-2xl border border-slate-800">
                Aucune intention pour le moment · soyez le premier à partager
              </div>
            )}
          </div>
        </div>

        <div className="text-center text-xs text-slate-600 py-2">
          Les prières sont partagées avec la communauté · Priez les uns pour les autres
        </div>
      </div>

      {inCall && (
        <VideoCall
          subject={subject}
          onLeave={() => setInCall(false)}
          onGenerateReport={() => setShowAISummary(true)}
        />
      )}

      {showAISummary && (
        <AIAssistantModal
          subject={subject}
          kind="live"
          onClose={() => setShowAISummary(false)}
        />
      )}
    </div>
  )
}
