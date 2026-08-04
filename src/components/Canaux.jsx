import { useState } from 'react'
import { Bookmark, Calendar, MapPin, Smile, BookOpen, Megaphone } from 'lucide-react'
import { announcements } from '../data'

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

function AnnouncementCard({ a }) {
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
          <p className="text-xs text-slate-500">{a.role} · {a.time}</p>
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

export default function Canaux() {
  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="px-4 pt-4 pb-3 bg-night-800/50 backdrop-blur-sm sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-slate-100">Canaux</h1>
        <p className="text-sm text-slate-400 mt-0.5">Annonces officielles & versets du jour</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {announcements.map(a => (
          <AnnouncementCard key={a.id} a={a} />
        ))}
        <div className="text-center text-xs text-slate-600 py-4">
          Vous êtes à jour · 5 annonces
        </div>
      </div>
    </div>
  )
}
