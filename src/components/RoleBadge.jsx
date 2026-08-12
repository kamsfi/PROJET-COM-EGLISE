import { Shield, Church, Star } from 'lucide-react'

// Aligné sur l'enum Postgres `member_role` ('admin' | 'leader' | 'member'),
// avec quelques alias hérités (pasteur/moderateur/membre) pour compatibilité.
const ROLE_STYLES = {
  admin: { label: 'Admin', icon: Shield, className: 'bg-gold/15 text-gold ring-1 ring-gold/30' },
  leader: { label: 'Leader', icon: Star, className: 'bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30' },
  member: { label: 'Membre', icon: null, className: 'bg-slate-700/60 text-slate-300 ring-1 ring-slate-600/50' },
  pasteur: { label: 'Pasteur', icon: Church, className: 'bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30' },
  moderateur: { label: 'Modérateur', icon: Star, className: 'bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30' },
  membre: { label: 'Membre', icon: null, className: 'bg-slate-700/60 text-slate-300 ring-1 ring-slate-600/50' },
}

export default function RoleBadge({ role, size = 'sm' }) {
  const style = ROLE_STYLES[role] || ROLE_STYLES.member
  const Icon = style.icon
  const sizeClasses = size === 'xs'
    ? 'text-[10px] px-1.5 py-0.5 gap-0.5'
    : 'text-xs px-2 py-0.5 gap-1'

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClasses} ${style.className}`}>
      {Icon && <Icon className={size === 'xs' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />}
      {style.label}
    </span>
  )
}
