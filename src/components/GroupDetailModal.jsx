import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, UsersRound, Sparkles, Phone, Video, Send, MessageCircle, Info, CheckCheck, Camera } from 'lucide-react'
import { ruleBadges } from './ruleBadges'
import { messagesByGroup } from '../data'
import { useCurrentUser } from '../context/CurrentUserContext'
import AIAssistantModal from './AIAssistantModal'
import CallScreen from './CallScreen'
import Avatar from './Avatar'
import MemberProfileModal from './MemberProfileModal'

export default function GroupDetailModal({ group, color, members, joined, onToggleJoin, joinError = '', onClose }) {
  const { currentUser, updateCurrentUser } = useCurrentUser()
  const [tab, setTab] = useState('chat')
  const [messages, setMessages] = useState(() => messagesByGroup[group.id] || [])
  const [input, setInput] = useState('')
  const [callType, setCallType] = useState(null)
  const [showAISummary, setShowAISummary] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const [soloCall, setSoloCall] = useState(null)
  const scrollRef = useRef(null)
  const fileInputRef = useRef(null)
  const badges = ruleBadges(group.rules)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages.length, tab])

  const handleSend = () => {
    if (!input.trim() || !joined) return
    const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    setMessages(prev => [...prev, { id: `gm-${Date.now()}`, sender: 'me', text: input.trim(), time: now }])
    setInput('')
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => updateCurrentUser({ avatarUrl: reader.result })
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const callParticipants = [
    { id: 'me', name: 'Vous', avatar: currentUser.avatar, color: 'from-gold to-orange-600', isMe: true },
    ...members.map(m => ({ id: m.id, name: m.full_name, avatar: m.avatar, color: m.color })),
  ]

  return (
    <div className="fixed inset-0 z-[65] bg-night-900 flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-night-800 border-b border-slate-800 shrink-0">
        <button
          onClick={onClose}
          className="p-2 -ml-2 rounded-full hover:bg-slate-800 text-slate-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0`}>
          <UsersRound className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-slate-100 truncate">{group.name}</h2>
          <p className="text-xs text-slate-500">{group.memberCount} membre{group.memberCount > 1 ? 's' : ''}</p>
        </div>
        {joined && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setShowAISummary(true)}
              title="Résumer les messages manqués"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-gold/10 hover:bg-gold/20 text-gold text-xs font-medium transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Résumer</span>
            </button>
            <button
              onClick={() => setCallType('audio')}
              title="Appel audio de groupe"
              className="p-2 rounded-full hover:bg-night-700 text-slate-300 transition-colors"
            >
              <Phone className="w-[18px] h-[18px]" />
            </button>
            <button
              onClick={() => setCallType('video')}
              title="Appel vidéo de groupe"
              className="p-2 rounded-full hover:bg-night-700 text-slate-300 transition-colors"
            >
              <Video className="w-[18px] h-[18px]" />
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-night-800 border-b border-slate-800 px-2 shrink-0">
        <button
          onClick={() => setTab('chat')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'chat' ? 'text-gold border-gold' : 'text-slate-500 border-transparent hover:text-slate-300'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          Discussion
        </button>
        <button
          onClick={() => setTab('info')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'info' ? 'text-gold border-gold' : 'text-slate-500 border-transparent hover:text-slate-300'
          }`}
        >
          <Info className="w-4 h-4" />
          Infos
        </button>
      </div>

      {tab === 'chat' ? (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-night-900">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div className={`max-w-[75%] ${msg.sender === 'me' ? 'items-end' : 'items-start'} flex flex-col`}>
                  {msg.name && (
                    <span className="text-xs text-gold-light mb-1 px-1">{msg.name}</span>
                  )}
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.sender === 'me'
                        ? 'bg-gold text-white rounded-br-sm'
                        : 'bg-night-700 text-slate-100 rounded-bl-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 px-1 flex items-center gap-1">
                    {msg.time}
                    {msg.sender === 'me' && <CheckCheck className="w-3 h-3 text-sky-400" />}
                  </span>
                </div>
              </div>
            ))}
            {messages.length === 0 && (
              <div className="text-center text-slate-500 py-12 text-sm">Aucun message pour le moment</div>
            )}
          </div>

          <div className="px-4 py-3 bg-night-800 border-t border-slate-800 pb-safe shrink-0">
            {joined ? (
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
            ) : (
              <>
                {joinError && <p className="text-xs text-red-400 text-center mb-2">{joinError}</p>}
                <button
                  onClick={onToggleJoin}
                  className="w-full bg-gold hover:bg-gold-light text-white font-semibold py-3 rounded-xl transition-all active:scale-[0.98]"
                >
                  Rejoindre le groupe pour participer à la discussion
                </button>
              </>
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {group.description && (
            <p className="text-sm text-slate-400 leading-relaxed">{group.description}</p>
          )}

          {badges.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold/10 text-gold text-[10px] font-medium">
                <Sparkles className="w-2.5 h-2.5" />
                Auto-assignation
              </span>
              {badges.map((b, i) => (
                <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-night-700 text-slate-300 text-[10px] font-medium">
                  <b.icon className="w-2.5 h-2.5" />
                  {b.label}
                </span>
              ))}
            </div>
          )}

          {joined && (
            <div>
              <p className="text-xs font-medium text-slate-400 mb-2">Votre photo dans ce groupe</p>
              <div className="flex items-center gap-3 bg-night-800 rounded-xl px-3 py-2.5 border border-slate-800">
                <div className="relative shrink-0">
                  <Avatar photoUrl={currentUser.avatarUrl} initials={currentUser.avatar} size="sm" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    title="Changer la photo de profil"
                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gold hover:bg-gold-light text-white flex items-center justify-center ring-2 ring-night-800 transition-colors"
                  >
                    <Camera className="w-2.5 h-2.5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate">{currentUser.full_name} (Vous)</p>
                  <p className="text-xs text-slate-500">Visible par les membres du groupe</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-slate-400 mb-2">
              Membres{members.length > 0 ? ` (${members.length}${members.length < group.memberCount ? ' aperçu' : ''})` : ''}
            </p>

            {members.length > 0 ? (
              <div className="space-y-2">
                {members.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMember(m)}
                    className="w-full flex items-center gap-3 bg-night-800 hover:border-gold/40 rounded-xl px-3 py-2 border border-slate-800 transition-colors text-left"
                  >
                    <Avatar photoUrl={m.photoUrl} initials={m.avatar} color={m.color} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200 truncate">{m.full_name}</p>
                      <p className="text-xs text-slate-500 truncate">{m.profession}</p>
                    </div>
                    <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  </button>
                ))}
                {members.length < group.memberCount && (
                  <p className="text-[11px] text-slate-600 text-center pt-1">
                    Aperçu · liste complète non disponible en mode démo
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Aucun membre à afficher pour ce groupe pour le moment.</p>
            )}
          </div>

          {joinError && <p className="text-xs text-red-400 text-center">{joinError}</p>}
          <button
            onClick={onToggleJoin}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] ${
              joined
                ? 'bg-night-700 text-slate-300 hover:bg-slate-700'
                : 'bg-gold hover:bg-gold-light text-white'
            }`}
          >
            {joined ? 'Quitter ce groupe' : 'Rejoindre ce groupe'}
          </button>
        </div>
      )}

      {showAISummary && (
        <AIAssistantModal
          subject={group.name}
          kind="discussion"
          onClose={() => setShowAISummary(false)}
        />
      )}

      {callType && (
        <CallScreen
          participants={callParticipants}
          type={callType}
          onEnd={() => setCallType(null)}
        />
      )}

      {selectedMember && (
        <MemberProfileModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
          onCall={(type) => {
            setSoloCall({ member: selectedMember, type })
            setSelectedMember(null)
          }}
        />
      )}

      {soloCall && (
        <CallScreen
          contact={{ name: soloCall.member.full_name, avatar: soloCall.member.avatar, color: soloCall.member.color }}
          type={soloCall.type}
          onEnd={() => setSoloCall(null)}
        />
      )}
    </div>
  )
}
