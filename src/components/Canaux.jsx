import { useEffect, useState } from 'react'
import { Bookmark, Calendar, MapPin, Smile, BookOpen, Megaphone, Sparkles, Plus, X, Send } from 'lucide-react'
import { announcements } from '../data'
import { useWorkspace } from '../context/WorkspaceContext'
import { useCurrentUser } from '../context/CurrentUserContext'
import { useOrganizations } from '../context/OrganizationsContext'
import AIAssistantModal from './AIAssistantModal'

const REACTION_LIST = ['🙏', '❤️', '🙌', '🔥', '✨']

function ReactionBar({ announcement }) {
  const [reactions, setReactions] = useState(announcement.reactions)
  const [showPicker, setShowPicker] = useState(false)
  const [userReacted, setUserReacted] = useState(null)

  const toggleReaction = (emoji) => {
    setReactions(prev => {
      const next = { ...prev }
      if (userReacted === emoji) {
        next[emoji] = (next[emoji] || 1) - 1
        if (next[emoji] <= 0) delete next[emoji]
        setUserReacted(null)
      } else {
        if (userReacted && next[userReacted] !== undefined) {
          next[userReacted] = next[userReacted] - 1
          if (next[userReacted] <= 0) delete next[userReacted]
        }
        next[emoji] = (next[emoji] || 0) + 1
        setUserReacted(emoji)
      }
      return next
    })
  }

  const sortedReactions = Object.entries(reactions).sort((a, b) => b[1] - a[1])

  return (
    <div className="relative">
      <div className="flex items-center gap-1.5 flex-wrap">
        {sortedReactions.map(([emoji, count]) => (
          <button
            key={emoji}
            onClick={() => toggleReaction(emoji)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all active:scale-95 ${
              userReacted === emoji
                ? 'bg-gold/20 ring-1 ring-gold/50'
                : 'bg-night-700 hover:bg-slate-700'
            }`}
          >
            <span className="text-sm">{emoji}</span>
            <span className="text-slate-300 font-medium">{count}</span>
          </button>
        ))}
        <button
          onClick={() => setShowPicker(s => !s)}
          className="flex items-center justify-center w-7 h-7 rounded-full bg-night-700 hover:bg-slate-700 text-slate-400 transition-colors"
        >
          <Smile className="w-4 h-4" />
        </button>
      </div>

      {showPicker && (
        <div className="absolute top-9 left-0 z-20 bg-night-700 rounded-2xl p-2 shadow-xl border border-slate-700 flex gap-1 animate-fade-in">
          {REACTION_LIST.map(emoji => (
            <button
              key={emoji}
              onClick={() => { toggleReaction(emoji); setShowPicker(false) }}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-600 text-lg transition-colors active:scale-90"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function AnnouncementCard({ a, orgLabel }) {
  const typeStyles = {
    announcement: { icon: Megaphone, color: 'text-gold', bg: 'bg-gold/10', label: 'Annonce' },
    verse: { icon: BookOpen, color: 'text-sky-400', bg: 'bg-sky-500/10', label: 'Verset' },
    event: { icon: Calendar, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Événement' },
  }
  const style = typeStyles[a.type]
  const Icon = style.icon

  return (
    <article className="bg-night-800 rounded-2xl overflow-hidden border border-slate-800 hover:border-slate-700 transition-colors animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white font-semibold text-sm shrink-0">
          {a.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-100 text-sm truncate">{a.author}</h3>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${style.bg} ${style.color}`}>
              <Icon className="w-2.5 h-2.5" />
              {style.label}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {a.role} · {a.time}
            {orgLabel && <span className="text-slate-600"> · {orgLabel}</span>}
          </p>
        </div>
        <button className="p-1.5 rounded-full hover:bg-slate-800 text-slate-500 transition-colors">
          <Bookmark className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        {a.type === 'verse' && (
          <div className="mb-2 text-xs font-semibold text-sky-400">{a.reference}</div>
        )}
        {a.type === 'event' && (
          <div className="mb-3">
            <h4 className="text-lg font-bold text-slate-100 mb-2">{a.title}</h4>
            <div className="flex flex-col gap-1.5 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gold" />
                <span>{a.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gold" />
                <span>{a.location}</span>
              </div>
            </div>
          </div>
        )}
        <p className={`text-sm leading-relaxed text-slate-300 ${a.type === 'verse' ? 'italic text-base text-slate-200' : ''}`}>
          {a.content}
        </p>
      </div>

      {/* Footer / Reactions */}
      <div className="px-4 pb-4 pt-2 border-t border-slate-800/50">
        <ReactionBar announcement={a} />
      </div>
    </article>
  )
}

function PublishModal({ onClose, onPublish }) {
  const [content, setContent] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!content.trim()) return
    onPublish(content.trim())
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
            <Megaphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Publier une annonce</h2>
            <p className="text-xs text-slate-400">Visible par tous les membres de l'espace</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Rédigez votre annonce officielle..."
            rows={4}
            autoFocus
            className="w-full bg-night-700 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-gold/50 transition-all resize-none"
          />
          <button
            type="submit"
            disabled={!content.trim()}
            className="w-full bg-gold hover:bg-gold-light disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Publier
          </button>
        </form>
      </div>
    </div>
  )
}

export default function Canaux() {
  const { activeWorkspace } = useWorkspace()
  const { currentUser } = useCurrentUser()
  const { getOrgFamilyIds, getOrgById } = useOrganizations()
  const [scope, setScope] = useState('local')
  const [localAnnouncements, setLocalAnnouncements] = useState(() =>
    announcements.filter(a => a.workspaceId === activeWorkspace.id)
  )
  const [showAISummary, setShowAISummary] = useState(false)
  const [showPublish, setShowPublish] = useState(false)

  useEffect(() => {
    setLocalAnnouncements(announcements.filter(a => a.workspaceId === activeWorkspace.id))
    setScope('local')
  }, [activeWorkspace.id])

  const canPublish = activeWorkspace.role === 'admin' || activeWorkspace.role === 'leader'
  const familyIds = getOrgFamilyIds(activeWorkspace.id)
  const hasFamily = familyIds.length > 1

  const familyAnnouncements = hasFamily
    ? [...localAnnouncements, ...announcements.filter(a => familyIds.includes(a.workspaceId) && a.workspaceId !== activeWorkspace.id)]
    : localAnnouncements

  const visibleAnnouncements = scope === 'denomination' ? familyAnnouncements : localAnnouncements

  const handlePublish = (content) => {
    setLocalAnnouncements(prev => [
      {
        id: `a-${Date.now()}`,
        workspaceId: activeWorkspace.id,
        author: currentUser.full_name,
        role: currentUser.profession,
        avatar: currentUser.avatar,
        time: 'À l\'instant',
        type: 'announcement',
        content,
        reactions: {},
      },
      ...prev,
    ])
    setShowPublish(false)
  }

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="px-4 pt-4 pb-3 bg-night-800/50 backdrop-blur-sm sticky top-0 z-10 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Canaux</h1>
            <p className="text-sm text-slate-400 mt-0.5">Annonces officielles de {activeWorkspace.name}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {canPublish && (
              <button
                onClick={() => setShowPublish(true)}
                title="Publier une annonce"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gold hover:bg-gold-light text-white text-xs font-semibold transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Publier</span>
              </button>
            )}
            {visibleAnnouncements.length > 0 && (
              <button
                onClick={() => setShowAISummary(true)}
                title="Générer une synthèse du canal"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gold/10 hover:bg-gold/20 text-gold text-xs font-medium transition-all active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Synthèse IA</span>
              </button>
            )}
          </div>
        </div>

        {hasFamily && (
          <div className="flex bg-night-700 rounded-xl p-1 w-fit">
            <button
              onClick={() => setScope('local')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                scope === 'local' ? 'bg-night-800 text-slate-100 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cet espace
            </button>
            <button
              onClick={() => setScope('denomination')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                scope === 'denomination' ? 'bg-night-800 text-slate-100 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Toute la dénomination
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {visibleAnnouncements.map(a => (
          <AnnouncementCard
            key={a.id}
            a={a}
            orgLabel={scope === 'denomination' && a.workspaceId !== activeWorkspace.id ? getOrgById(a.workspaceId)?.name : null}
          />
        ))}
        {visibleAnnouncements.length === 0 && (
          <div className="text-center text-slate-500 py-12 text-sm">Aucune annonce pour cet espace</div>
        )}
        {visibleAnnouncements.length > 0 && (
          <div className="text-center text-xs text-slate-600 py-4">
            Vous êtes à jour · {visibleAnnouncements.length} annonce{visibleAnnouncements.length > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {showAISummary && (
        <AIAssistantModal
          subject={`Canaux — ${activeWorkspace.name}`}
          kind="discussion"
          onClose={() => setShowAISummary(false)}
        />
      )}

      {showPublish && (
        <PublishModal onClose={() => setShowPublish(false)} onPublish={handlePublish} />
      )}
    </div>
  )
}
