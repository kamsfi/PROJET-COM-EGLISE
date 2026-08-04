import { useState } from 'react'
import { MessageCircle, Radio, Heart, User, Church } from 'lucide-react'
import Discussions from './components/Discussions'
import Canaux from './components/Canaux'
import DirectPrieres from './components/DirectPrieres'
import ProfilEglise from './components/ProfilEglise'

const TABS = [
  { id: 'discussions', label: 'Discussions', icon: MessageCircle, component: Discussions },
  { id: 'canaux', label: 'Canaux', icon: Radio, component: Canaux },
  { id: 'direct', label: 'Direct & Prières', icon: Heart, component: DirectPrieres },
  { id: 'profil', label: 'Profil & Église', icon: User, component: ProfilEglise },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('discussions')
  const ActiveComponent = TABS.find(t => t.id === activeTab).component

  return (
    <div className="h-screen w-screen overflow-hidden bg-night-900 flex" style={{ backgroundColor: '#020617' }}>
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-night-800 border-r border-slate-800 shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center">
              <Church className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-100 leading-tight">Église Connect</h1>
              <p className="text-xs text-slate-500">Communauté de Foi</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {TABS.map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-gold text-white shadow-lg shadow-gold/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-night-700'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {tab.label}
              </button>
            )
          })}
        </nav>

        {/* User mini-card */}
        <div className="p-3 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-night-700 transition-colors cursor-pointer">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold to-orange-600 flex items-center justify-center text-white font-semibold text-sm">
              DL
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">Daniel Lefèvre</p>
              <p className="text-xs text-slate-500 truncate">Membre actif</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-night-800 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center">
              <Church className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-bold text-slate-100">Église Connect</h1>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-orange-600 flex items-center justify-center text-white font-semibold text-xs">
            DL
          </div>
        </header>

        {/* Active tab content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <ActiveComponent />
        </div>

        {/* Bottom nav - Mobile */}
        <nav className="lg:hidden flex items-center justify-around bg-night-800 border-t border-slate-800 px-2 py-1.5 pb-safe shrink-0">
          {TABS.map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                  active ? 'text-gold' : 'text-slate-500'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'scale-110' : ''} transition-transform`} />
                <span className="text-[10px] font-medium leading-tight">{tab.label.split(' ')[0]}</span>
                {active && <span className="w-1 h-1 rounded-full bg-gold mt-0.5" />}
              </button>
            )
          })}
        </nav>
      </main>
    </div>
  )
}
