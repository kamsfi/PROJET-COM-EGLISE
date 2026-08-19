import { useState } from 'react'
import {
  MessageCircle, Radio, Calendar, Library, Users, UsersRound, Wallet, Heart,
  ArrowRight, Sparkles, ShieldCheck, Zap, Church, Building2, HeartHandshake,
  ChevronRight, Plus, Search,
} from 'lucide-react'
import CordeeMark from './CordeeMark'

const FEATURES = [
  { icon: MessageCircle, label: 'Discussions', text: 'Messagerie privée en temps réel, pièces jointes incluses.' },
  { icon: Radio, label: 'Canaux', text: 'Annonces officielles diffusées à toute l\'organisation.' },
  { icon: UsersRound, label: 'Groupes', text: 'Communautés à critères — âge, sexe — réellement confidentielles.' },
  { icon: Calendar, label: 'Événements', text: 'Planification et inscriptions pour vos rencontres.' },
  { icon: Library, label: 'Médiathèque', text: 'Prédications, photos et vidéos centralisées.' },
  { icon: Users, label: 'Annuaire', text: 'Retrouvez chaque membre de votre organisation.' },
  { icon: Wallet, label: 'Finances', text: 'Dons et cotisations, Mobile Money ou virement.' },
  { icon: Heart, label: 'Direct & Prières', text: 'Mur de prière et demandes d\'accompagnement.' },
]

const TYPE_ICON = { church: Church, business: Building2, ngo: HeartHandshake }

const MOCK_ORGS = [
  { id: 'church', label: 'Mon Église', icon: 'church' },
  { id: 'business', label: 'Entreprise', icon: 'business' },
]

const MOCK_NAV = ['Discussions', 'Groupes', 'Événements', 'Finances']

function ProductPreview() {
  const [activeOrg, setActiveOrg] = useState('church')
  const [activeNav, setActiveNav] = useState('Discussions')

  return (
    <div className="relative rounded-2xl p-2 bg-gradient-to-b from-slate-700/30 via-slate-800/10 to-transparent border border-slate-700/50 shadow-2xl">
      <div className="w-full bg-night-900 rounded-xl border border-slate-800 overflow-hidden flex h-[440px] text-left">
        {/* Sidebar */}
        <div className="w-48 bg-night-800 border-r border-slate-800 flex flex-col p-3 shrink-0">
          <div className="bg-night-700 border border-slate-800 rounded-xl p-2 mb-3">
            <div className="flex gap-1.5">
              {MOCK_ORGS.map(o => {
                const Icon = TYPE_ICON[o.icon]
                return (
                  <button
                    key={o.id}
                    onClick={() => setActiveOrg(o.id)}
                    className={`flex-1 min-w-0 flex items-center gap-1 text-[11px] p-1.5 rounded-lg font-medium transition-all ${
                      activeOrg === o.id ? 'bg-night-800 text-slate-100 border border-slate-700' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <Icon className="w-3 h-3 shrink-0" />
                    <span className="truncate">{o.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
          <div className="space-y-1">
            {MOCK_NAV.map(label => {
              const Icon = FEATURES.find(f => f.label === label).icon
              const active = activeNav === label
              return (
                <button
                  key={label}
                  onClick={() => setActiveNav(label)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    active ? 'bg-gold text-white shadow' : 'text-slate-400 hover:bg-night-700 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col bg-night-900">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-sm font-bold text-slate-100">{activeNav}</h3>
              <p className="text-[11px] text-slate-500">{activeOrg === 'church' ? 'Exemple d\'espace église' : 'Exemple d\'espace entreprise'}</p>
            </div>
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-white px-2.5 py-1.5 rounded-lg bg-gold">
              <Plus className="w-3 h-3" />
              Nouveau
            </span>
          </div>
          <div className="p-3 border-b border-slate-800/60 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <div className="w-full bg-night-800 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-500">
                Rechercher…
              </div>
            </div>
          </div>
          <div className="flex-1 p-4 space-y-3 overflow-hidden">
            <div className="flex gap-2.5 items-start">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">JM</div>
              <div className="bg-night-800 border border-slate-800 px-3 py-2 rounded-xl rounded-tl-none text-xs text-slate-300 max-w-[75%]">
                Les inscriptions pour dimanche sont ouvertes 🙏
              </div>
            </div>
            <div className="flex gap-2.5 items-start justify-end">
              <div className="bg-gold px-3 py-2 rounded-xl rounded-tr-none text-xs text-white max-w-[75%]">
                Parfait, je relaie l'info au groupe.
              </div>
            </div>
            <div className="bg-night-800 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gold/10 text-gold flex items-center justify-center shrink-0">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-200">Culte de dimanche</p>
                  <p className="text-[10px] text-slate-500">10h00 · Salle principale</p>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LandingPage({ onLogin, onSignup }) {
  return (
    <div className="min-h-screen bg-night-900 text-slate-100 overflow-x-hidden overflow-y-auto">
      {/* Halo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[min(900px,100vw)] h-[500px] bg-gradient-to-b from-gold/10 to-transparent blur-[110px] pointer-events-none" />

      <nav className="relative max-w-6xl mx-auto px-6 py-5 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shrink-0">
            <CordeeMark className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <p className="font-bold text-slate-100 leading-tight">Cordée</p>
            <p className="text-[11px] text-slate-500 leading-tight">Plateforme Multi-Organisations</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onLogin}
            className="text-sm font-medium text-slate-300 hover:text-white px-3 sm:px-4 py-2 transition-colors"
          >
            Connexion
          </button>
          <button
            onClick={onSignup}
            className="text-sm font-semibold text-white px-3 sm:px-4 py-2 rounded-lg bg-gold hover:bg-gold-light shadow-md transition-all"
          >
            Créer un espace
          </button>
        </div>
      </nav>

      <main className="relative max-w-6xl mx-auto px-6 pt-14 pb-20">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-gold/10 text-gold border border-gold/20">
              <Sparkles className="w-3.5 h-3.5" />
              Une plateforme, toutes vos communautés
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-100 tracking-tight leading-[1.1]">
              Unifiez vos équipes et vos <span className="text-gold">communautés</span>.
            </h1>

            <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Cordée centralise messagerie, groupes, événements, médiathèque et finances pour les églises, entreprises et ONG — chaque organisation dans son propre espace, entièrement cloisonné.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-1 justify-center lg:justify-start">
              <button
                onClick={onSignup}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gold hover:bg-gold-light text-white font-semibold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
              >
                <span>Créer mon espace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onLogin}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-night-800 hover:bg-night-700 text-slate-300 font-semibold border border-slate-800 transition-all"
              >
                J'ai déjà un compte
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800 text-left">
              <div>
                <div className="flex items-center gap-1.5 text-slate-100 font-bold text-base">
                  <ShieldCheck className="w-4 h-4 text-slate-500" /> Cloisonné
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Groupes et espaces réellement privés</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-slate-100 font-bold text-base">
                  <Zap className="w-4 h-4 text-slate-500" /> Temps réel
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Messagerie instantanée</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-slate-100 font-bold text-base">
                  <Sparkles className="w-4 h-4 text-slate-500" /> IA intégrée
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Résumés de discussions manquées</p>
              </div>
            </div>
          </div>

          <div className="hidden lg:block lg:col-span-7">
            <ProductPreview />
          </div>
        </div>

        {/* Features */}
        <div className="mt-24">
          <h2 className="text-2xl font-bold text-slate-100 text-center mb-2">Tout ce qu'il faut à votre organisation</h2>
          <p className="text-slate-400 text-center mb-10">Huit modules, une seule plateforme.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map(f => (
              <div key={f.label} className="bg-night-800 border border-slate-800 rounded-2xl p-5">
                <div className="w-10 h-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center mb-3">
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-100 text-sm mb-1">{f.label}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Closing CTA */}
        <div className="mt-24 bg-gradient-to-br from-gold/10 to-transparent border border-gold/20 rounded-3xl p-10 text-center">
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Prêt à unifier votre communauté ?</h2>
          <p className="text-slate-400 mb-6 max-w-lg mx-auto">Église, entreprise ou ONG — créez votre espace en quelques minutes, gratuitement.</p>
          <button
            onClick={onSignup}
            className="px-6 py-3.5 rounded-xl bg-gold hover:bg-gold-light text-white font-semibold inline-flex items-center gap-2 shadow-lg transition-all active:scale-95"
          >
            <span>Créer mon espace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>

      <footer className="relative max-w-6xl mx-auto px-6 py-8 border-t border-slate-800 text-center text-xs text-slate-600">
        Cordée · Plateforme Multi-Organisations
      </footer>
    </div>
  )
}
