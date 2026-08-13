import { useState, useRef, useEffect } from 'react'
import { Search, Send, ArrowLeft, Circle, CheckCheck, Phone, Video, UserPlus, X } from 'lucide-react'
import { conversations, messagesByConversation, isUuid, getInitials, pickColor } from '../data'
import { useWorkspace } from '../context/WorkspaceContext'
import { useCurrentUser } from '../context/CurrentUserContext'
import { useOrganizations } from '../context/OrganizationsContext'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import Avatar from './Avatar'
import CallScreen from './CallScreen'

// Heure pour un message du jour, date courte sinon.
function formatChatTime(isoString) {
  const date = new Date(isoString)
  const now = new Date()
  const sameDay = date.toDateString() === now.toDateString()
  return sameDay
    ? date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function NewConversationModal({ members, onClose, onPick, starting, error }) {
  return (
    <div className="fixed inset-0 z-[65] flex items-end sm:items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-sm bg-night-800 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 pb-safe animate-slide-up shadow-2xl max-h-[80vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-700 text-slate-400 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shrink-0">
            <UserPlus className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Nouvelle conversation</h2>
            <p className="text-xs text-slate-400">Choisissez un membre de l'espace</p>
          </div>
        </div>

        {error && <p className="text-xs text-red-400 px-1 mb-3">{error}</p>}

        {members.length > 0 ? (
          <div className="space-y-1.5">
            {members.map(m => (
              <button
                key={m.id}
                onClick={() => onPick(m)}
                disabled={starting}
                className="w-full flex items-center gap-3 bg-night-700/60 hover:bg-night-700 disabled:opacity-50 rounded-xl px-3 py-2.5 transition-colors text-left"
              >
                <Avatar photoUrl={m.photoUrl} initials={m.avatar} color={m.color} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate">{m.full_name}</p>
                  <p className="text-xs text-slate-500 truncate">{m.profession}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 text-center py-6">Aucun autre membre dans cet espace pour l'instant.</p>
        )}
      </div>
    </div>
  )
}

export default function Discussions() {
  const { activeWorkspace } = useWorkspace()
  const { currentUser } = useCurrentUser()
  const { members, mergeRemoteMembers } = useOrganizations()

  const [activeId, setActiveId] = useState(null)
  const [mockMessages, setMockMessages] = useState(messagesByConversation)
  // Jamais réinitialisé au changement d'espace — même cycle de vie que
  // dynamicAnnouncements dans Canaux.jsx.
  const [realConversations, setRealConversations] = useState([])
  const [realMessagesByConversation, setRealMessagesByConversation] = useState({})
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const [callType, setCallType] = useState(null)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [showPicker, setShowPicker] = useState(false)
  const [starting, setStarting] = useState(false)
  const [startError, setStartError] = useState('')
  const scrollRef = useRef(null)

  useEffect(() => {
    setActiveId(null)
  }, [activeWorkspace.id])

  // Charge les vrais membres Supabase de l'espace (pour le sélecteur
  // "Nouvelle conversation") — indépendant, ne suppose pas qu'Annuaire ait
  // déjà tourné.
  useEffect(() => {
    if (!isSupabaseConfigured || !isUuid(activeWorkspace.id)) return
    let cancelled = false

    async function loadMembers() {
      const { data: rows, error } = await supabase
        .from('memberships')
        .select('role, organization_id, profiles(id, full_name, avatar_url, profession, skills)')
        .eq('organization_id', activeWorkspace.id)
      if (cancelled) return
      if (error) { console.warn('[ComHub] Échec du chargement des membres Supabase (Discussions)', error); return }
      const mapped = (rows || []).filter(r => r.profiles).map(r => ({
        id: r.profiles.id,
        workspaceId: activeWorkspace.id,
        full_name: r.profiles.full_name,
        avatar: getInitials(r.profiles.full_name),
        color: pickColor(r.profiles.id),
        role: r.role,
        profession: r.profiles.profession || '',
        skills: r.profiles.skills || [],
        photoUrl: r.profiles.avatar_url || undefined,
      }))
      mergeRemoteMembers(mapped)
    }

    loadMembers()
    return () => { cancelled = true }
  }, [activeWorkspace.id, mergeRemoteMembers])

  // Charge les vraies conversations Supabase de l'espace (participants +
  // aperçu du dernier message).
  useEffect(() => {
    if (!isSupabaseConfigured || !isUuid(activeWorkspace.id)) return
    let cancelled = false

    async function loadConversations() {
      const { data: convRows, error: convErr } = await supabase
        .from('conversations')
        .select('id, conversation_participants(user_id, profiles(id, full_name, avatar_url, profession))')
        .eq('organization_id', activeWorkspace.id)
      if (cancelled) return
      if (convErr) { console.warn('[ComHub] Échec du chargement des conversations Supabase', convErr); return }

      const conversationIds = (convRows || []).map(r => r.id)
      const lastMessageByConv = new Map()
      if (conversationIds.length > 0) {
        const { data: msgRows, error: msgErr } = await supabase
          .from('messages')
          .select('conversation_id, content, created_at')
          .in('conversation_id', conversationIds)
          .order('created_at', { ascending: true })
        if (cancelled) return
        if (msgErr) console.warn('[ComHub] Échec du chargement des derniers messages Supabase', msgErr)
        else for (const m of msgRows || []) lastMessageByConv.set(m.conversation_id, m)
      }

      const mapped = (convRows || []).map(row => {
        const other = (row.conversation_participants || []).find(p => p.user_id !== currentUser.id)?.profiles
        const last = lastMessageByConv.get(row.id)
        return {
          id: row.id,
          workspaceId: activeWorkspace.id,
          name: other?.full_name || 'Utilisateur',
          role: other?.profession || '',
          avatar: other ? getInitials(other.full_name) : '??',
          color: pickColor(other?.id || row.id),
          lastMessage: last?.content || 'Nouvelle conversation',
          time: last ? formatChatTime(last.created_at) : '',
          unread: 0,
          online: false,
          type: 'private',
        }
      })

      setRealConversations(prev => {
        const byId = new Map(prev.map(c => [c.id, c]))
        for (const c of mapped) byId.set(c.id, c)
        return Array.from(byId.values())
      })
    }

    loadConversations()
    return () => { cancelled = true }
  }, [activeWorkspace.id, currentUser.id])

  // Charge l'historique du fil ouvert et s'abonne au temps réel.
  useEffect(() => {
    if (!isSupabaseConfigured || !isUuid(activeId)) return
    let cancelled = false

    async function loadMessages() {
      const { data, error } = await supabase
        .from('messages')
        .select('id, sender_id, content, created_at')
        .eq('conversation_id', activeId)
        .order('created_at', { ascending: true })
      if (cancelled) return
      if (error) { console.warn('[ComHub] Échec du chargement des messages Supabase', error); return }
      const mapped = (data || []).map(row => ({
        id: row.id,
        sender: row.sender_id === currentUser.id ? 'me' : 'them',
        text: row.content,
        time: formatChatTime(row.created_at),
      }))
      setRealMessagesByConversation(prev => ({ ...prev, [activeId]: mapped }))
    }

    loadMessages()

    const channel = supabase
      .channel(`messages-${activeId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeId}` },
        payload => {
          if (payload.new.sender_id === currentUser.id) return
          setRealMessagesByConversation(prev => ({
            ...prev,
            [activeId]: [
              ...(prev[activeId] || []),
              { id: payload.new.id, sender: 'them', text: payload.new.content, time: formatChatTime(payload.new.created_at) },
            ],
          }))
        }
      )
      .subscribe()

    return () => { cancelled = true; supabase.removeChannel(channel) }
  }, [activeId, currentUser.id])

  const workspaceMockConversations = conversations.filter(c => c.workspaceId === activeWorkspace.id)
  const workspaceRealConversations = realConversations.filter(c => c.workspaceId === activeWorkspace.id)
  const allConversations = [...workspaceRealConversations, ...workspaceMockConversations]
  const visibleConversations = allConversations.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
  const activeConv = allConversations.find(c => c.id === activeId)
  const activeMessages = !activeId
    ? []
    : isUuid(activeId)
      ? (realMessagesByConversation[activeId] || [])
      : (mockMessages[activeId] || [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [activeMessages.length, activeId])

  const handleSend = async () => {
    if (!input.trim() || !activeId) return

    if (isSupabaseConfigured && isUuid(activeId)) {
      setSendError('')
      setSending(true)
      const text = input.trim()
      const { data, error } = await supabase
        .from('messages')
        .insert({ conversation_id: activeId, sender_id: currentUser.id, content: text })
        .select('id, created_at')
        .single()
      setSending(false)
      if (error) {
        console.warn('[ComHub] Échec de l\'envoi du message Supabase', error)
        setSendError('Message non envoyé. Réessayez.')
        return
      }
      setRealMessagesByConversation(prev => ({
        ...prev,
        [activeId]: [...(prev[activeId] || []), { id: data.id, sender: 'me', text, time: formatChatTime(data.created_at) }],
      }))
      setInput('')
      return
    }

    // Branche mock (inchangée)
    const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    const newMsg = { id: `m${Date.now()}`, sender: 'me', text: input.trim(), time: now }
    setMockMessages(prev => ({
      ...prev,
      [activeId]: [...(prev[activeId] || []), newMsg],
    }))
    setInput('')
  }

  const handleStartConversation = async (member) => {
    setStartError('')
    setStarting(true)
    const { data: conversationId, error } = await supabase.rpc('start_or_get_conversation', {
      p_other_user_id: member.id,
      p_organization_id: activeWorkspace.id,
    })
    setStarting(false)
    if (error) {
      console.warn('[ComHub] Échec de la création de la conversation', error)
      setStartError('Impossible de démarrer cette conversation. Réessayez.')
      return
    }
    setRealConversations(prev => {
      if (prev.some(c => c.id === conversationId)) return prev
      return [
        {
          id: conversationId,
          workspaceId: activeWorkspace.id,
          name: member.full_name,
          role: member.profession || '',
          avatar: member.avatar,
          color: member.color,
          lastMessage: 'Nouvelle conversation',
          time: '',
          unread: 0,
          online: false,
          type: 'private',
        },
        ...prev,
      ]
    })
    setShowPicker(false)
    setActiveId(conversationId)
  }

  // Mobile: show chat full screen when active
  if (activeId && activeConv) {
    return (
      <div className="flex flex-col h-full animate-fade-in">
        {/* Chat header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-night-800 border-b border-slate-800">
          <button
            onClick={() => setActiveId(null)}
            className="p-2 -ml-2 rounded-full hover:bg-slate-800 transition-colors lg:hidden"
          >
            <ArrowLeft className="w-5 h-5 text-slate-300" />
          </button>
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${activeConv.color} flex items-center justify-center text-white font-semibold text-sm shrink-0`}>
            {activeConv.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-100 truncate">{activeConv.name}</h3>
              {activeConv.online && (
                <span className="flex items-center gap-1 text-xs text-emerald-400">
                  <Circle className="w-2 h-2 fill-emerald-400 text-emerald-400" />
                  en ligne
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 truncate">{activeConv.role}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setCallType('audio')}
              title="Appel audio"
              className="p-2 rounded-full hover:bg-night-700 text-slate-300 transition-colors"
            >
              <Phone className="w-[18px] h-[18px]" />
            </button>
            <button
              onClick={() => setCallType('video')}
              title="Appel vidéo"
              className="p-2 rounded-full hover:bg-night-700 text-slate-300 transition-colors"
            >
              <Video className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-night-900">
          {activeMessages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div className={`max-w-[75%] ${msg.sender === 'me' ? 'items-end' : 'items-start'} flex flex-col`}>
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === 'me'
                      ? 'bg-gold text-white rounded-br-sm'
                      : 'bg-night-700 text-slate-100 rounded-bl-sm'
                  }`}
                >
                  {msg.text}
                </div>
                <span className={`text-[10px] text-slate-500 mt-1 px-1 flex items-center gap-1`}>
                  {msg.time}
                  {msg.sender === 'me' && <CheckCheck className="w-3 h-3 text-sky-400" />}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="px-4 py-3 bg-night-800 border-t border-slate-800 pb-safe">
          {sendError && <p className="text-xs text-red-400 px-1 mb-2">{sendError}</p>}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Écrivez votre message..."
              className="flex-1 bg-night-700 text-slate-100 placeholder-slate-500 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold/50 transition-all"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="w-10 h-10 rounded-full bg-gold hover:bg-gold-light disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {callType && (
          <CallScreen
            contact={activeConv}
            type={callType}
            onEnd={() => setCallType(null)}
          />
        )}
      </div>
    )
  }

  // Conversation list
  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="px-4 pt-4 pb-3 bg-night-800/50 backdrop-blur-sm">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Discussions</h1>
            <p className="text-xs text-slate-500 mt-0.5">Messagerie privée · pour les échanges collectifs, direction l'onglet Groupes</p>
          </div>
          {isSupabaseConfigured && isUuid(activeWorkspace.id) && (
            <button
              onClick={() => setShowPicker(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gold hover:bg-gold-light text-white text-xs font-semibold transition-all active:scale-95 shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nouvelle conversation</span>
              <span className="sm:hidden">Nouveau</span>
            </button>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher une discussion..."
            className="w-full bg-night-700 text-slate-100 placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold/50 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {visibleConversations.map(conv => (
          <button
            key={conv.id}
            onClick={() => setActiveId(conv.id)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-night-700/50 transition-colors text-left group"
          >
            <div className="relative shrink-0">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${conv.color} flex items-center justify-center text-white font-semibold text-sm`}>
                {conv.avatar}
              </div>
              {conv.online && (
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-night-900" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-slate-100 truncate text-sm">{conv.name}</h3>
                <span className="text-xs text-slate-500 shrink-0">{conv.time}</span>
              </div>
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <p className="text-sm text-slate-400 truncate">{conv.lastMessage}</p>
                {conv.unread > 0 && (
                  <span className="shrink-0 min-w-[20px] h-5 px-1.5 bg-gold rounded-full text-white text-xs font-semibold flex items-center justify-center">
                    {conv.unread}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
        {visibleConversations.length === 0 && (
          <div className="text-center text-slate-500 py-12 text-sm">Aucune discussion trouvée</div>
        )}
      </div>

      {showPicker && (
        <NewConversationModal
          members={members.filter(m => m.workspaceId === activeWorkspace.id && m.id !== currentUser.id)}
          onClose={() => { setShowPicker(false); setStartError('') }}
          onPick={handleStartConversation}
          starting={starting}
          error={startError}
        />
      )}
    </div>
  )
}
