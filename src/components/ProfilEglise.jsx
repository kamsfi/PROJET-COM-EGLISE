import { useState } from 'react'
import { Heart, Calendar, Hand, Coins, Check, Church, ChevronRight } from 'lucide-react'
import { userProfile } from '../data'

const DONATION_AMOUNTS = [10, 25, 50, 100, 250]

function DonationsModule() {
  const [selected, setSelected] = useState(50)
  const [custom, setCustom] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  const amount = custom ? parseInt(custom) || 0 : selected

  const handleDonate = () => {
    if (amount <= 0) return
    setConfirmed(true)
    setTimeout(() => setConfirmed(false), 4000)
  }

  return (
    <div className="bg-night-800 rounded-2xl border border-slate-800 overflow-hidden animate-slide-up">
      <div className="p-5 bg-gradient-to-br from-gold/10 to-transparent border-b border-slate-800">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-9 h-9 rounded-xl bg-gold/10 flex items-center justify-center">
            <Coins className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100">Contributions & Dons</h3>
            <p className="text-xs text-slate-400">Soutenez votre église</p>
          </div>
        </div>
      </div>

      <div className="p-5">
        {confirmed ? (
          <div className="text-center py-6 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
              <Check className="w-7 h-7 text-emerald-400" />
            </div>
            <p className="text-slate-100 font-semibold mb-1">Merci pour votre don !</p>
            <p className="text-sm text-slate-400">Votre contribution de {amount}€ a été enregistrée.</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-400 mb-3">Choisissez un montant</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {DONATION_AMOUNTS.map(amt => (
                <button
                  key={amt}
                  onClick={() => { setSelected(amt); setCustom('') }}
                  className={`py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95 ${
                    !custom && selected === amt
                      ? 'bg-gold text-white'
                      : 'bg-night-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {amt}€
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
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">€</span>
            </div>

            <button
              onClick={handleDonate}
              disabled={amount <= 0}
              className="w-full bg-gold hover:bg-gold-light disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Heart className="w-4 h-4" />
              Faire un don de {amount}€
            </button>
            <p className="text-[11px] text-slate-500 text-center mt-2">Paiement sécurisé · Reçu fiscal disponible</p>
          </>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-night-800 rounded-2xl border border-slate-800 p-4 flex flex-col items-center text-center">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-2`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-2xl font-bold text-slate-100">{value}</span>
      <span className="text-xs text-slate-400">{label}</span>
    </div>
  )
}

export default function ProfilEglise() {
  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="px-4 pt-4 pb-3 bg-night-800/50 backdrop-blur-sm sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-slate-100">Profil & Église</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Profile card */}
        <div className="bg-night-800 rounded-2xl border border-slate-800 p-5 animate-slide-up">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold to-orange-600 flex items-center justify-center text-white font-bold text-2xl shrink-0">
              {userProfile.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-slate-100 truncate">{userProfile.name}</h2>
              <p className="text-sm text-slate-400 truncate">{userProfile.email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-gold/10 text-gold text-xs font-medium">
                {userProfile.role}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2 text-sm text-slate-300 mb-1">
              <Church className="w-4 h-4 text-gold shrink-0" />
              <span className="truncate">{userProfile.church}</span>
            </div>
            <p className="text-xs text-slate-500">{userProfile.memberSince}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={Calendar} label="Événements" value={userProfile.stats.events} color="bg-sky-500/15 text-sky-400" />
          <StatCard icon={Hand} label="Prières" value={userProfile.stats.prayers} color="bg-emerald-500/15 text-emerald-400" />
          <StatCard icon={Coins} label="Dons" value={userProfile.stats.donations} color="bg-gold/15 text-gold" />
        </div>

        {/* Donations */}
        <DonationsModule />

        {/* Menu items */}
        <div className="bg-night-800 rounded-2xl border border-slate-800 overflow-hidden">
          {[
            { icon: Church, label: 'Mon Église locale', value: 'Église Évangélique de la Grâce' },
            { icon: Calendar, label: 'Mes inscriptions', value: '3 à venir' },
            { icon: Heart, label: 'Mes intentions de prière', value: '5 partagées' },
          ].map((item, i) => (
            <button
              key={i}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-night-700/50 transition-colors text-left border-b border-slate-800 last:border-0"
            >
              <div className="w-9 h-9 rounded-xl bg-night-700 flex items-center justify-center">
                <item.icon className="w-4 h-4 text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200">{item.label}</p>
                <p className="text-xs text-slate-500 truncate">{item.value}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          ))}
        </div>

        <div className="text-center text-xs text-slate-600 py-2">
          Église Connect · v0.1 · Prototype
        </div>
      </div>
    </div>
  )
}
