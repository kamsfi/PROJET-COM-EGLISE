import { X, Briefcase, Phone, Video, Mail } from 'lucide-react'
import Avatar from './Avatar'
import RoleBadge from './RoleBadge'

export default function MemberProfileModal({ member, onCall, onClose }) {
  return (
    <div className="fixed inset-0 z-[68] flex items-end sm:items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-sm bg-night-800 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 pb-safe animate-slide-up shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-700 text-slate-400 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center mb-5">
          <Avatar photoUrl={member.photoUrl} initials={member.avatar} color={member.color} size="xl" />
          <h2 className="text-lg font-bold text-slate-100 mt-3">{member.full_name}</h2>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap justify-center">
            <RoleBadge role={member.role} size="xs" />
            {member.profession && (
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Briefcase className="w-3 h-3" />
                {member.profession}
              </span>
            )}
          </div>
        </div>

        {member.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-center mb-5">
            {member.skills.map(skill => (
              <span key={skill} className="px-2.5 py-1 rounded-full bg-night-700 text-slate-300 text-xs font-medium">
                {skill}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => onCall('audio')}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-night-700 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-all active:scale-[0.98]"
          >
            <Phone className="w-4 h-4" />
            Appeler
          </button>
          <button
            onClick={() => onCall('video')}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gold hover:bg-gold-light text-white text-sm font-semibold transition-all active:scale-[0.98]"
          >
            <Video className="w-4 h-4" />
            Vidéo
          </button>
        </div>

        {member.email && (
          <p className="text-center text-xs text-slate-500 mt-4 flex items-center justify-center gap-1.5">
            <Mail className="w-3.5 h-3.5" />
            {member.email}
          </p>
        )}
      </div>
    </div>
  )
}
