import { useState } from 'react'
import { X, CalendarPlus, MapPin, Users } from 'lucide-react'

export default function CreateEventModal({ categories, onClose, onCreate, submitting = false, error = '' }) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(categories[0]?.id || '')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [location, setLocation] = useState('')
  const [capacity, setCapacity] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim() || !date || !time || !location.trim() || submitting) return
    onCreate({
      title: title.trim(),
      category,
      date,
      time: time.replace(':', 'h'),
      location: location.trim(),
      capacity: capacity ? Number(capacity) : 50,
      description: description.trim(),
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
            <CalendarPlus className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Créer un événement</h2>
            <p className="text-xs text-slate-400">Il apparaîtra dans le calendrier de l'espace</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Titre de l'événement"
            className="w-full bg-night-700 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold/50 transition-all"
          />

          {categories.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {categories.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    category === c.id ? c.color : 'bg-night-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{ colorScheme: 'dark' }}
              className="flex-1 bg-night-700 text-slate-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold/50 transition-all"
            />
            <input
              type="time"
              required
              value={time}
              onChange={e => setTime(e.target.value)}
              style={{ colorScheme: 'dark' }}
              className="w-28 bg-night-700 text-slate-100 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold/50 transition-all"
            />
          </div>

          <div className="relative">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              required
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Lieu"
              className="w-full bg-night-700 text-slate-100 placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold/50 transition-all"
            />
          </div>

          <div className="relative">
            <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="number"
              min="1"
              value={capacity}
              onChange={e => setCapacity(e.target.value)}
              placeholder="Capacité (ex: 50)"
              className="w-full bg-night-700 text-slate-100 placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold/50 transition-all"
            />
          </div>

          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Description (optionnel)"
            rows={3}
            className="w-full bg-night-700 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-gold/50 transition-all resize-none"
          />

          {error && <p className="text-xs text-red-400 px-1">{error}</p>}

          <button
            type="submit"
            disabled={!title.trim() || !date || !time || !location.trim() || submitting}
            className="w-full bg-gold hover:bg-gold-light disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all active:scale-[0.98]"
          >
            {submitting ? 'Création…' : "Créer l'événement"}
          </button>
        </form>
      </div>
    </div>
  )
}
