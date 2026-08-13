import { useState, useMemo, useEffect } from 'react'
import { Search, Play, Pause, Video, Mic2, X, TrendingUp } from 'lucide-react'
import { mediaItems, mediaCategories, mediaSubtitleByType, isUuid, pickColor } from '../data'
import { useWorkspace } from '../context/WorkspaceContext'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

function formatMediaDate(isoString) {
  return new Date(isoString).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function MediaCard({ item, onPlay, isPlaying }) {
  const TypeIcon = item.type === 'video' ? Video : Mic2

  return (
    <button
      onClick={() => onPlay(item)}
      className="group relative bg-night-800 rounded-2xl border border-slate-800 hover:border-gold/40 overflow-hidden text-left transition-all animate-slide-up"
    >
      <div className={`relative h-32 bg-gradient-to-br ${item.color} flex items-center justify-center`}>
        <div className={`w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center transition-transform group-hover:scale-110 ${isPlaying ? 'ring-2 ring-white' : ''}`}>
          {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
        </div>
        <span className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm text-white text-[10px] font-medium">
          <TypeIcon className="w-2.5 h-2.5" />
          {item.type === 'video' ? 'Vidéo' : 'Audio'}
        </span>
        <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium">
          {item.duration}
        </span>
      </div>
      <div className="p-3">
        <p className="text-[11px] text-gold-light font-medium mb-0.5">{item.series}</p>
        <h3 className="font-semibold text-slate-100 text-sm leading-snug line-clamp-2 mb-1">{item.title}</h3>
        <p className="text-xs text-slate-500">{item.speaker} · {item.date}</p>
      </div>
    </button>
  )
}

function NowPlayingBar({ item, playing, onTogglePlay, onClose }) {
  if (!item) return null
  const TypeIcon = item.type === 'video' ? Video : Mic2

  return (
    <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 animate-slide-up z-10">
      <div className="bg-night-700/95 backdrop-blur-md rounded-2xl border border-slate-700 shadow-2xl p-3 flex items-center gap-3">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shrink-0`}>
          <TypeIcon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-100 truncate">{item.title}</p>
          <p className="text-xs text-slate-400 truncate">{item.speaker}</p>
          <div className="h-1 bg-night-800 rounded-full overflow-hidden mt-1.5">
            <div className={`h-full bg-gold rounded-full ${playing ? 'animate-live-pulse' : ''}`} style={{ width: '38%' }} />
          </div>
        </div>
        <button
          onClick={onTogglePlay}
          className="w-9 h-9 rounded-full bg-gold hover:bg-gold-light flex items-center justify-center text-white transition-all active:scale-95 shrink-0"
        >
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full hover:bg-slate-600 flex items-center justify-center text-slate-400 transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default function Mediatheque() {
  const { activeWorkspace } = useWorkspace()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [nowPlaying, setNowPlaying] = useState(null)
  const [playing, setPlaying] = useState(false)
  // Jamais réinitialisé au changement d'espace, upsert par id.
  const [realMediaItems, setRealMediaItems] = useState([])
  const isRealWorkspace = isUuid(activeWorkspace.id)

  useEffect(() => {
    setNowPlaying(null)
    setPlaying(false)
  }, [activeWorkspace.id])

  // Charge le vrai catalogue Supabase de l'espace actif.
  useEffect(() => {
    if (!isSupabaseConfigured || !isUuid(activeWorkspace.id)) return
    let cancelled = false

    async function loadMedia() {
      const { data: rows, error } = await supabase
        .from('media_items')
        .select('id, title, speaker, type, series, duration, plays, created_at')
        .eq('organization_id', activeWorkspace.id)
        .order('created_at', { ascending: false })
      if (cancelled) return
      if (error) { console.warn('[ComHub] Échec du chargement de la médiathèque Supabase', error); return }

      const mapped = (rows || []).map(row => ({
        id: row.id,
        workspaceId: activeWorkspace.id,
        title: row.title,
        speaker: row.speaker || '',
        type: row.type,
        series: row.series || '',
        duration: row.duration || '',
        date: formatMediaDate(row.created_at),
        plays: row.plays ?? 0,
        color: pickColor(row.id),
      }))

      setRealMediaItems(prev => {
        const byId = new Map(prev.map(m => [m.id, m]))
        for (const m of mapped) byId.set(m.id, m)
        return Array.from(byId.values())
      })
    }

    loadMedia()
    return () => { cancelled = true }
  }, [activeWorkspace.id])

  const filtered = useMemo(() => {
    const source = isRealWorkspace
      ? realMediaItems.filter(m => m.workspaceId === activeWorkspace.id)
      : mediaItems.filter(m => m.workspaceId === activeWorkspace.id)
    return source
      .filter(m => (activeCategory === 'all' ? true : m.type === activeCategory))
      .filter(m =>
        m.title.toLowerCase().includes(search.toLowerCase()) ||
        m.speaker.toLowerCase().includes(search.toLowerCase())
      )
  }, [isRealWorkspace, realMediaItems, activeWorkspace.id, search, activeCategory])

  const handlePlay = (item) => {
    if (nowPlaying?.id === item.id) {
      setPlaying(p => !p)
    } else {
      setNowPlaying(item)
      setPlaying(true)
    }
  }

  return (
    <div className="relative flex flex-col h-full animate-fade-in">
      <div className="px-4 pt-4 pb-3 bg-night-800/50 backdrop-blur-sm sticky top-0 z-10 space-y-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Médiathèque</h1>
          <p className="text-sm text-slate-400 mt-0.5">{mediaSubtitleByType[activeWorkspace.type]}</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher une prédication, un orateur..."
            className="w-full bg-night-700 text-slate-100 placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold/50 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          {mediaCategories.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeCategory === c.id ? 'bg-gold text-white' : 'bg-night-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto px-4 py-3 ${nowPlaying ? 'pb-24' : ''}`}>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(item => (
            <MediaCard
              key={item.id}
              item={item}
              onPlay={handlePlay}
              isPlaying={nowPlaying?.id === item.id && playing}
            />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center text-slate-500 py-12 text-sm">Aucun contenu trouvé</div>
        )}
      </div>

      <NowPlayingBar
        item={nowPlaying}
        playing={playing}
        onTogglePlay={() => setPlaying(p => !p)}
        onClose={() => { setNowPlaying(null); setPlaying(false) }}
      />
    </div>
  )
}
