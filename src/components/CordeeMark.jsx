// Symbole de marque Cordée : trois points reliés par une corde qui
// s'affaisse légèrement entre chacun (comme une vraie corde tendue entre
// des grimpeurs), en ascension de gauche à droite — l'idée d'avancer
// ensemble, encordés, jamais seul. Dessiné en `currentColor` comme les
// icônes Lucide qu'il remplace : `<CordeeMark className="text-white" />`.
export default function CordeeMark({ className = 'w-5 h-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4.5 19.5 Q9.5 16.5 12 12 Q16.5 7.5 19.5 4.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="4.5" cy="19.5" r="2.6" fill="currentColor" />
      <circle cx="12" cy="12" r="2.6" fill="currentColor" />
      <circle cx="19.5" cy="4.5" r="2.6" fill="currentColor" />
    </svg>
  )
}
