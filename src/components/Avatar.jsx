const SIZE_CLASSES = {
  xs: 'w-7 h-7 text-[10px]',
  sm: 'w-9 h-9 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-24 h-24 text-2xl',
}

// Rendu cohérent d'un avatar dans toute l'app : photo si `photoUrl` est
// renseignée, sinon initiales sur un dégradé de couleur.
export default function Avatar({ photoUrl, initials, color = 'from-gold to-orange-600', size = 'sm', className = '' }) {
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.sm

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={initials || 'Photo de profil'}
        className={`${sizeClass} rounded-full object-cover shrink-0 ${className}`}
      />
    )
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-semibold shrink-0 ${className}`}
    >
      {initials}
    </div>
  )
}
