import { useState } from 'react'
import { MessageCircle, Radio, Heart, User, Users, Layers, Calendar, Library, LogOut, UsersRound, Wallet } from 'lucide-react'
import Discussions from './components/Discussions'
import Canaux from './components/Canaux'
import Evenements from './components/Evenements'
import Mediatheque from './components/Mediatheque'
import DirectPrieres from './components/DirectPrieres'
import Annuaire from './components/Annuaire'
import Groupes from './components/Groupes'
import Finances from './components/Finances'
import ProfilWorkspace from './components/ProfilWorkspace'
import RoleBadge from './components/RoleBadge'
import AuthModal from './components/AuthModal'
import LandingPage from './components/LandingPage'
import NoWorkspaceScreen from './components/NoWorkspaceScreen'
import WorkspaceSwitcher from './components/WorkspaceSwitcher'
import Avatar from './components/Avatar'
import AdminAssistant from './components/AdminAssistant'
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext'
import { CurrentUserProvider, useCurrentUser } from './context/CurrentUserContext'
import { OrganizationsProvider } from './context/OrganizationsContext'
import { NotificationsProvider, useNotifications } from './context/NotificationsContext'
import { ThemeProvider } from './context/ThemeContext'

const TABS = [
  { id: 'discussions', label: 'Discussions', icon: MessageCircle, component: Discussions },
  { id: 'canaux', label: 'Canaux', icon: Radio, component: Canaux },
  { id: 'evenements', label: 'Événements', icon: Calendar, component: Evenements },
  { id: 'mediatheque', label: 'Médiathèque', icon: Library, component: Mediatheque },
  { id: 'annuaire', label: 'Annuaire', icon: Users, component: Annuaire },
  { id: 'groupes', label: 'Groupes', icon: UsersRound, component: Groupes },
  { id: 'finances', label: 'Finances', icon: Wallet, component: Finances },
  { id: 'direct', label: 'Direct & Prières', icon: Heart, component: DirectPrieres },
  { id: 'profil', label: 'Profil & Espace', icon: User, component: ProfilWorkspace },
]

const UNREAD_TAB_IDS = { discussions: 'hasUnreadDiscussions', groupes: 'hasUnreadGroups' }

function AppShell() {
  const { currentUser, isAuthenticated, sessionLoading, logout } = useCurrentUser()
  const { activeWorkspace } = useWorkspace()
  const notifications = useNotifications()
  const [activeTab, setActiveTab] = useState('discussions')
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const ActiveComponent = TABS.find(t => t.id === activeTab).component

  if (sessionLoading) {
    return (
      <div className="h-screen w-screen bg-night-900 flex items-center justify-center">
        <Layers className="w-8 h-8 text-gold animate-pulse" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <>
        <LandingPage
          onLogin={() => { setAuthMode('login'); setAuthOpen(true) }}
          onSignup={() => { setAuthMode('signup'); setAuthOpen(true) }}
        />
        {authOpen && (
          <AuthModal initialMode={authMode} onClose={() => setAuthOpen(false)} />
        )}
      </>
    )
  }

  if (!activeWorkspace) {
    return (
      <div className="h-screen w-screen bg-night-900">
        <NoWorkspaceScreen />
      </div>
    )
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-night-900 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-night-800 border-r border-slate-800 shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-100 leading-tight">ComHub</h1>
              <p className="text-xs text-slate-500">Plateforme Multi-Organisations</p>
            </div>
          </div>
        </div>

        {/* Workspace switcher */}
        <div className="px-3 py-3 border-b border-slate-800">
          <WorkspaceSwitcher />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {TABS.map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            const hasUnread = UNREAD_TAB_IDS[tab.id] && notifications[UNREAD_TAB_IDS[tab.id]]
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
                <span className="relative shrink-0">
                  <Icon className="w-5 h-5" />
                  {hasUnread && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-night-800" />}
                </span>
                {tab.label}
              </button>
            )
          })}
        </nav>

        {/* User mini-card */}
        <div className="p-3 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-night-700 transition-colors">
            <Avatar photoUrl={currentUser.avatarUrl} initials={currentUser.avatar} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{currentUser.full_name}</p>
              <RoleBadge role={activeWorkspace?.role} size="xs" />
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-night-800 transition-colors shrink-0"
              title="Se déconnecter"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between gap-2 px-4 py-3 bg-night-800 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-bold text-slate-100 shrink-0">ComHub</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <WorkspaceSwitcher variant="mobile" />
            <button onClick={logout} title="Se déconnecter" className="relative shrink-0">
              <Avatar photoUrl={currentUser.avatarUrl} initials={currentUser.avatar} size="xs" />
            </button>
          </div>
        </header>

        {/* Active tab content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <ActiveComponent />
        </div>

        {/* Bottom nav - Mobile */}
        <nav className="lg:hidden flex items-center justify-start sm:justify-around gap-0.5 bg-night-800 border-t border-slate-800 px-1.5 py-1.5 pb-safe shrink-0 overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            const hasUnread = UNREAD_TAB_IDS[tab.id] && notifications[UNREAD_TAB_IDS[tab.id]]
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl transition-all shrink-0 ${
                  active ? 'text-gold' : 'text-slate-500'
                }`}
              >
                <span className="relative">
                  <Icon className={`w-5 h-5 ${active ? 'scale-110' : ''} transition-transform`} />
                  {hasUnread && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-night-800" />}
                </span>
                <span className="text-[10px] font-medium leading-tight whitespace-nowrap">{tab.label.split(' ')[0]}</span>
                {active && <span className="w-1 h-1 rounded-full bg-gold mt-0.5" />}
              </button>
            )
          })}
        </nav>
      </main>

      <AdminAssistant />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <OrganizationsProvider>
        <CurrentUserProvider>
          <NotificationsProvider>
            <WorkspaceProvider>
              <AppShell />
            </WorkspaceProvider>
          </NotificationsProvider>
        </CurrentUserProvider>
      </OrganizationsProvider>
    </ThemeProvider>
  )
}
