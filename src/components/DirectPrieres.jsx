import { useState } from 'react'
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users, Radio, Hand, Share2, Send, Heart } from 'lucide-react'

function LiveCard({ onJoin }) {
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
        <h2 className="text-xl font-bold text-slate-100 mb-1">Culte du Dimanche</h2>
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
      </div>
    </div>
  )
}

function VideoCall({ onLeave }) {
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
          <span className="text-sm text-slate-400 hidden sm:inline">Culte du Dimanche · 6 participants</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Users className="w-4 h-4" />
          <span className="hidden sm:inline">06</span>
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

function PrayerForm() {
  const [submitted, setSubmitted] = useState(false)
  const [prayer, setPrayer] = useState('')
  const [category, setCategory] = useState('guérison')

  const categories = [
    { id: 'guérison', label: 'Guérison' },
    { id: 'famille', label: 'Famille' },
    { id: 'travail', label: 'Travail' },
    { id: 'remerciement', label: 'Remerciement' },
    { id: 'autre', label: 'Autre' },
  ]

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!prayer.trim()) return
    setSubmitted(true)
    setPrayer('')
    setTimeout(() => setSubmitted(false), 4000)
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

      {submitted ? (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center animate-fade-in">
          <p className="text-emerald-400 font-medium text-sm">Merci. Votre intention a été partagée avec les intercesseurs. 🙏</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            {categories.map(c => (
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
          <button
            type="submit"
            disabled={!prayer.trim()}
            className="w-full bg-gold hover:bg-gold-light disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
          >
            <Send className="w-4 h-4" />
            Soumettre mon intention
          </button>
        </form>
      )}
    </div>
  )
}

export default function DirectPrieres() {
  const [inCall, setInCall] = useState(false)

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="px-4 pt-4 pb-3 bg-night-800/50 backdrop-blur-sm sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-slate-100">Direct & Prières</h1>
        <p className="text-sm text-slate-400 mt-0.5">Cultes en direct et intentions de prière</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        <LiveCard onJoin={() => setInCall(true)} />
        <PrayerForm />

        <div className="text-center text-xs text-slate-600 py-2">
          Les prières sont confidentielles · Partagées avec les intercesseurs
        </div>
      </div>

      {inCall && <VideoCall onLeave={() => setInCall(false)} />}
    </div>
  )
}
