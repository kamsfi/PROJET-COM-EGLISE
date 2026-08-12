import { useEffect, useState } from 'react'
import { Mic, MicOff, Video, VideoOff, PhoneOff, Volume2, VolumeX, Users } from 'lucide-react'

export default function CallScreen({ contact, participants, type, onEnd }) {
  const [muted, setMuted] = useState(false)
  const [cameraOn, setCameraOn] = useState(true)
  const [speakerOn, setSpeakerOn] = useState(false)
  const [duration, setDuration] = useState(0)

  const isGroup = Array.isArray(participants) && participants.length > 0

  useEffect(() => {
    const interval = setInterval(() => setDuration(d => d + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  const minutes = String(Math.floor(duration / 60)).padStart(2, '0')
  const seconds = String(duration % 60).padStart(2, '0')

  return (
    <div className="fixed inset-0 z-50 bg-night-900 flex flex-col animate-fade-in">
      {isGroup ? (
        <>
          {/* Group call header */}
          <div className="flex items-center justify-between px-4 py-3 bg-night-800/80 backdrop-blur-sm border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-200">{type === 'video' ? 'Appel vidéo' : 'Appel audio'} de groupe</span>
              <span className="text-sm text-gold-light tabular-nums">{minutes}:{seconds}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-slate-400">
              <Users className="w-4 h-4" />
              {participants.length}
            </div>
          </div>

          {/* Participants grid */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {participants.map(p => (
                <div
                  key={p.id}
                  className={`relative rounded-2xl bg-gradient-to-br ${p.color} flex items-center justify-center overflow-hidden min-h-[130px] ${
                    p.isMe ? 'ring-2 ring-gold' : 'ring-1 ring-slate-800'
                  }`}
                >
                  <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-lg">
                    {p.avatar}
                  </div>
                  <span className="absolute bottom-2 left-2 right-2 text-white text-xs font-medium bg-black/40 backdrop-blur-sm px-2 py-1 rounded-md truncate">
                    {p.isMe ? 'Vous' : p.name}
                  </span>
                  {p.isMe && type === 'video' && !cameraOn && (
                    <div className="absolute inset-0 bg-night-900 flex items-center justify-center">
                      <VideoOff className="w-7 h-7 text-slate-500" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          {type === 'video' && cameraOn && (
            <div className={`absolute inset-0 bg-gradient-to-br ${contact.color} opacity-20`} />
          )}

          <div className="relative flex-1 flex flex-col items-center justify-center gap-3 px-6">
            <span className="text-sm text-slate-400">{type === 'video' ? 'Appel vidéo' : 'Appel audio'} en cours</span>
            <div className={`w-28 h-28 rounded-full bg-gradient-to-br ${contact.color} flex items-center justify-center text-white font-bold text-3xl shadow-2xl ${type === 'audio' ? 'animate-pulse-ring' : ''}`}>
              {contact.avatar}
            </div>
            <h2 className="text-xl font-bold text-slate-100 mt-1">{contact.name}</h2>
            <p className="text-sm text-gold-light font-medium tabular-nums">{minutes}:{seconds}</p>
          </div>

          {type === 'video' && (
            <div className="absolute top-6 right-6 w-20 h-28 rounded-2xl bg-night-800 ring-1 ring-slate-700 flex items-center justify-center overflow-hidden shadow-xl">
              {cameraOn ? (
                <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-gold text-xs font-semibold">Vous</div>
              ) : (
                <VideoOff className="w-5 h-5 text-slate-600" />
              )}
            </div>
          )}
        </>
      )}

      <div className="relative px-4 py-8 pb-safe shrink-0">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setMuted(m => !m)}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 ${
              muted ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-200'
            }`}
          >
            {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {type === 'video' ? (
            <button
              onClick={() => setCameraOn(c => !c)}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                cameraOn ? 'bg-slate-700 text-slate-200' : 'bg-red-500/20 text-red-400'
              }`}
            >
              {cameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
          ) : (
            <button
              onClick={() => setSpeakerOn(s => !s)}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                speakerOn ? 'bg-gold/20 text-gold' : 'bg-slate-700 text-slate-200'
              }`}
            >
              {speakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          )}

          <button
            onClick={onEnd}
            className="w-16 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all active:scale-95"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
