import { useState, useMemo, useEffect } from 'react'
import { ChevronLeft, ChevronRight, MapPin, Clock, Users, Check, Plus } from 'lucide-react'
import { events as eventsData, eventCategoriesByType } from '../data'
import { useWorkspace } from '../context/WorkspaceContext'
import CreateEventModal from './CreateEventModal'

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

function toDateStr(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function MiniCalendar({ current, setCurrent, selected, setSelected, eventDates }) {
  const year = current.getFullYear()
  const month = current.getMonth()
  const firstDay = new Date(year, month, 1)
  const startOffset = (firstDay.getDay() + 6) % 7 // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayStr = toDateStr(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())

  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="bg-night-800 rounded-2xl border border-slate-800 p-4 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-100">{MONTHS[month]} {year}</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrent(new Date(year, month - 1, 1))}
            className="w-7 h-7 rounded-lg hover:bg-night-700 flex items-center justify-center text-slate-400 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrent(new Date(year, month + 1, 1))}
            className="w-7 h-7 rounded-lg hover:bg-night-700 flex items-center justify-center text-slate-400 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((w, i) => (
          <div key={i} className="text-center text-[10px] font-medium text-slate-500 py-1">{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />
          const dateStr = toDateStr(year, month, d)
          const hasEvent = eventDates.has(dateStr)
          const isToday = dateStr === todayStr
          const isSelected = dateStr === selected
          return (
            <button
              key={i}
              onClick={() => setSelected(isSelected ? null : dateStr)}
              className={`relative aspect-square rounded-lg text-xs font-medium flex items-center justify-center transition-all ${
                isSelected
                  ? 'bg-gold text-white'
                  : isToday
                  ? 'bg-night-700 text-gold ring-1 ring-gold/40'
                  : 'text-slate-300 hover:bg-night-700'
              }`}
            >
              {d}
              {hasEvent && !isSelected && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-gold" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function EventCard({ event, categories, onToggleRegister, registered }) {
  const category = categories.find(c => c.id === event.category)
  const dateObj = new Date(event.date + 'T00:00:00')
  const dayLabel = dateObj.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
  const fillPct = Math.min(100, Math.round((event.attendees / event.capacity) * 100))

  return (
    <div className="bg-night-800 rounded-2xl border border-slate-800 p-4 animate-slide-up">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold mb-1.5 ${category?.color}`}>
            {category?.label}
          </span>
          <h3 className="font-semibold text-slate-100 leading-snug">{event.title}</h3>
        </div>
      </div>

      <p className="text-sm text-slate-400 mb-3 leading-relaxed">{event.description}</p>

      <div className="flex flex-col gap-1.5 text-sm text-slate-300 mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gold shrink-0" />
          <span className="capitalize">{dayLabel} · {event.time}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gold shrink-0" />
          <span>{event.location}</span>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {event.attendees} inscrits</span>
          <span>{event.capacity} places</span>
        </div>
        <div className="h-1.5 bg-night-700 rounded-full overflow-hidden">
          <div className="h-full bg-gold rounded-full transition-all" style={{ width: `${fillPct}%` }} />
        </div>
      </div>

      <button
        onClick={() => onToggleRegister(event.id)}
        className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
          registered
            ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30'
            : 'bg-gold hover:bg-gold-light text-white'
        }`}
      >
        {registered ? <><Check className="w-4 h-4" /> Inscrit</> : "S'inscrire"}
      </button>
    </div>
  )
}

export default function Evenements() {
  const { activeWorkspace } = useWorkspace()
  const categories = eventCategoriesByType[activeWorkspace.type] || []

  const [current, setCurrent] = useState(new Date())
  const [selected, setSelected] = useState(null)
  const [activeCategory, setActiveCategory] = useState('all')
  const [registrations, setRegistrations] = useState({})
  const [showCreate, setShowCreate] = useState(false)
  const [localEvents, setLocalEvents] = useState(() => eventsData.filter(e => e.workspaceId === activeWorkspace.id))

  useEffect(() => {
    setSelected(null)
    setActiveCategory('all')
    setLocalEvents(eventsData.filter(e => e.workspaceId === activeWorkspace.id))
  }, [activeWorkspace.id])

  const canManage = activeWorkspace.role === 'admin' || activeWorkspace.role === 'leader'

  const eventDates = useMemo(() => new Set(localEvents.map(e => e.date)), [localEvents])

  const toggleRegister = (id) => {
    setRegistrations(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleCreate = (data) => {
    setLocalEvents(prev => [
      { id: `e-${Date.now()}`, workspaceId: activeWorkspace.id, attendees: 0, ...data },
      ...prev,
    ])
    setShowCreate(false)
  }

  const filtered = useMemo(() => {
    return localEvents
      .filter(e => (selected ? e.date === selected : true))
      .filter(e => (activeCategory === 'all' ? true : e.category === activeCategory))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [localEvents, selected, activeCategory])

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="px-4 pt-4 pb-3 bg-night-800/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Événements</h1>
            <p className="text-sm text-slate-400 mt-0.5">Calendrier de {activeWorkspace.name}</p>
          </div>
          {canManage && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gold hover:bg-gold-light text-white text-xs font-semibold transition-all active:scale-95 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Créer un événement</span>
              <span className="sm:hidden">Créer</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        <MiniCalendar
          current={current}
          setCurrent={setCurrent}
          selected={selected}
          setSelected={setSelected}
          eventDates={eventDates}
        />

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeCategory === 'all' ? 'bg-gold text-white' : 'bg-night-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            Tout
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeCategory === c.id ? c.color : 'bg-night-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map(event => (
            <EventCard
              key={event.id}
              event={event}
              categories={categories}
              registered={!!registrations[event.id]}
              onToggleRegister={toggleRegister}
            />
          ))}
          {filtered.length === 0 && (
            <div className="text-center text-slate-500 py-12 text-sm">Aucun événement pour cette sélection</div>
          )}
        </div>
      </div>

      {showCreate && (
        <CreateEventModal
          categories={categories}
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  )
}
