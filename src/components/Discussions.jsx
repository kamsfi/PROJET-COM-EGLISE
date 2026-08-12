import { useState, useRef, useEffect } from 'react'
import { Search, Send, ArrowLeft, Circle, CheckCheck, Phone, Video } from 'lucide-react'
import { conversations, messagesByConversation } from '../data'
import { useWorkspace } from '../context/WorkspaceContext'
import CallScreen from './CallScreen'

export default function Discussions() {
  const { activeWorkspace } = useWorkspace()
  const [activeId, setActiveId] = useState(null)
  const [messages, setMessages] = useState(messagesByConversation)
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const [callType, setCallType] = useState(null)
  const scrollRef = useRef(null)

  const workspaceConversations = conversations.filter(c => c.workspaceId === activeWorkspace.id)
  const activeConv = workspaceConversations.find(c => c.id === activeId)
  const activeMessages = activeId ? (messages[activeId] || []) : []

  useEffect(() => {
    setActiveId(null)
  }, [activeWorkspace.id])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [activeMessages.length, activeId])

  const handleSend = () => {
    if (!input.trim() || !activeId) return
    const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    const newMsg = { id: `m${Date.now()}`, sender: 'me', text: input.trim(), time: now }
    setMessages(prev => ({
      ...prev,
      [activeId]: [...(prev[activeId] || []), newMsg],
    }))
    setInput('')
  }

  const filtered = workspaceConversations.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

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
              disabled={!input.trim()}
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
        <h1 className="text-2xl font-bold text-slate-100 mb-3">Discussions</h1>
        <p className="text-xs text-slate-500 -mt-2 mb-3">Messagerie privée · pour les échanges collectifs, direction l'onglet Groupes</p>
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
        {filtered.map(conv => (
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
        {filtered.length === 0 && (
          <div className="text-center text-slate-500 py-12 text-sm">Aucune discussion trouvée</div>
        )}
      </div>
    </div>
  )
}
