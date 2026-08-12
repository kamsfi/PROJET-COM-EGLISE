import { useEffect, useRef, useState } from 'react'
import { Bot, X, Send, Sparkles } from 'lucide-react'
import { events, groups, financeCopyByType, answerCommunityQuestion } from '../data'
import { useWorkspace } from '../context/WorkspaceContext'

const SUGGESTIONS = [
  'Quel est le prochain événement ?',
  'Comment faire un don ?',
  'Quels groupes puis-je rejoindre ?',
]

export default function AdminAssistant() {
  const { activeWorkspace } = useWorkspace()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const scrollRef = useRef(null)

  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        sender: 'bot',
        text: `Bonjour ! Je suis l'assistant administratif de ${activeWorkspace.name}. Posez-moi une question sur la vie communautaire (événements, dons, groupes, contacts...).`,
      },
    ])
  }, [activeWorkspace.id])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages.length, open])

  const ask = (question) => {
    if (!question.trim()) return

    const upcomingEvents = events
      .filter(e => e.workspaceId === activeWorkspace.id)
      .sort((a, b) => a.date.localeCompare(b.date))
    const workspaceGroups = groups.filter(g => g.workspaceId === activeWorkspace.id)
    const financeCopy = financeCopyByType[activeWorkspace.type]

    const userMsg = { id: `u-${Date.now()}`, sender: 'user', text: question.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')

    setTimeout(() => {
      const answer = answerCommunityQuestion(question, {
        workspace: activeWorkspace,
        upcomingEvents,
        groups: workspaceGroups,
        financeCopy,
      })
      setMessages(prev => [...prev, { id: `b-${Date.now()}`, sender: 'bot', text: answer }])
    }, 500)
  }

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        title="Assistant administratif"
        className="fixed z-40 bottom-20 right-4 lg:bottom-6 lg:right-6 w-14 h-14 rounded-full bg-gradient-to-br from-gold to-gold-dark text-white shadow-2xl flex items-center justify-center transition-all active:scale-95 hover:shadow-gold/30"
      >
        {open ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] sm:inset-auto sm:bottom-24 sm:right-6 sm:w-96 sm:max-h-[32rem] sm:rounded-3xl bg-night-800 border border-slate-800 shadow-2xl flex flex-col animate-fade-in">
          <div className="flex items-center gap-2.5 px-4 py-3.5 bg-night-800 border-b border-slate-800 shrink-0 sm:rounded-t-3xl">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shrink-0">
              <Bot className="w-[18px] h-[18px] text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-slate-100 text-sm">Assistant administratif</h2>
              <p className="text-[11px] text-slate-500 truncate">{activeWorkspace.name}</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-full hover:bg-slate-700 text-slate-400 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-night-900">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                <div
                  className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-gold text-white rounded-br-sm'
                      : 'bg-night-700 text-slate-100 rounded-bl-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {messages.length <= 1 && (
              <div className="flex flex-col gap-1.5 pt-2">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => ask(s)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-night-800 border border-slate-800 hover:border-gold/40 text-xs text-slate-300 text-left transition-colors"
                  >
                    <Sparkles className="w-3 h-3 text-gold shrink-0" />
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="px-4 py-3 bg-night-800 border-t border-slate-800 pb-safe shrink-0 sm:rounded-b-3xl">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && ask(input)}
                placeholder="Posez votre question..."
                className="flex-1 bg-night-700 text-slate-100 placeholder-slate-500 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold/50 transition-all"
              />
              <button
                onClick={() => ask(input)}
                disabled={!input.trim()}
                className="w-10 h-10 rounded-full bg-gold hover:bg-gold-light disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all active:scale-95 shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
