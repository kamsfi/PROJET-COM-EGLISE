// ============================================================
// UTILITAIRES PARTAGÉS (auth / profils — mock ET session Supabase réelle)
// ============================================================
export function getInitials(name) {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map(w => w[0]?.toUpperCase() || '').join('') || '??'
}

// Nommage anglais/camelCase côté front (church/business/ngo) vs français
// côté Supabase (organization_type: eglise/entreprise/ong).
export const ORG_TYPE_FROM_DB = { eglise: 'church', entreprise: 'business', ong: 'ngo' }
export const ORG_TYPE_TO_DB = { church: 'eglise', business: 'entreprise', ngo: 'ong' }

// Distingue un id d'organisation réel (uuid Supabase) d'un id mock
// ('w1', 'w1b'...) — utilisé par tout composant qui ne doit interroger
// Supabase que pour un espace réel (ex: "Accès Démo Rapide" peut coexister
// avec isSupabaseConfigured===true en prod).
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export function isUuid(id) {
  return UUID_RE.test(id)
}
export function isRealWorkspaceId(id) {
  return isUuid(id)
}

export function generateJoinCode(type) {
  const prefix = { church: 'EGL', business: 'ENT', ngo: 'ONG' }[type] || 'ORG'
  const num = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}-${num}`
}

const AVATAR_COLORS = [
  'from-amber-500 to-orange-600', 'from-blue-500 to-indigo-600', 'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600', 'from-violet-500 to-purple-600', 'from-cyan-500 to-blue-600',
]

export function pickColor(seed) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

// ============================================================
// WORKSPACES (multi-tenant / organizations)
// ============================================================
export const workspaceTypeLabels = {
  church: 'Église',
  business: 'Entreprise',
  ngo: 'ONG',
}

// Catalogue des organisations. Le rôle n'est PAS stocké ici : il dépend de
// l'utilisateur (voir `demoUsers[].memberships`), une même organisation
// pouvant avoir des admins, leaders et membres différents.
// `parentId` relie une annexe/sous-compte à sa dénomination/siège (table
// `organizations.parent_id` côté schéma SQL).
export const workspaces = [
  {
    id: 'w1',
    name: 'Église Centrale',
    type: 'church',
    color: 'from-gold to-gold-dark',
    membersCount: 234,
    parentId: null,
    joinCode: 'EGL-4F82',
  },
  {
    id: 'w2',
    name: 'Entreprise Tech',
    type: 'business',
    color: 'from-blue-500 to-indigo-600',
    membersCount: 58,
    parentId: null,
    joinCode: 'ENT-7731',
  },
  {
    id: 'w3',
    name: 'ONG Espoir',
    type: 'ngo',
    color: 'from-emerald-500 to-teal-600',
    membersCount: 112,
    parentId: null,
    joinCode: 'ONG-5290',
  },
  {
    id: 'w1b',
    name: 'Église Centrale — Annexe Nord',
    type: 'church',
    color: 'from-orange-500 to-red-600',
    membersCount: 41,
    parentId: 'w1',
    joinCode: 'EGL-N021',
  },
]

export const typeDefaultColor = {
  church: 'from-gold to-gold-dark',
  business: 'from-blue-500 to-indigo-600',
  ngo: 'from-emerald-500 to-teal-600',
}

// Renvoie les ids de toutes les organisations de la même « dénomination »
// (le siège et ses annexes), utilisé pour l'annuaire global et les canaux
// transversaux entre annexes.
export function getOrgFamilyIds(workspaceId, catalog = workspaces) {
  const org = catalog.find(o => o.id === workspaceId)
  if (!org) return [workspaceId]
  const rootId = org.parentId || org.id
  return catalog.filter(o => o.id === rootId || o.parentId === rootId).map(o => o.id)
}

// Âge à partir d'une date de naissance ISO (YYYY-MM-DD).
export function computeAge(birthDate) {
  if (!birthDate) return null
  const today = new Date()
  const birth = new Date(birthDate + 'T00:00:00')
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--
  return age
}

// Miroir JS du trigger PL/pgSQL `auto_assign_user_to_groups` : un profil
// correspond aux règles d'un groupe si chaque critère renseigné dans
// `rules` est satisfait (les critères absents de `rules` ne filtrent pas).
export function matchGroupRules(rules, { gender, age, maritalStatus }) {
  if (!rules) return false
  if (rules.gender && rules.gender !== gender) return false
  if (rules.min_age != null && (age == null || age < rules.min_age)) return false
  if (rules.max_age != null && (age == null || age > rules.max_age)) return false
  if (rules.marital_status && rules.marital_status !== maritalStatus) return false
  return true
}

// ============================================================
// DISCUSSIONS — messagerie privée (1-à-1) uniquement.
// La communication collective (canaux, appels de groupe) vit désormais
// exclusivement dans l'onglet Groupes, pour éviter le doublon entre les
// deux modules.
// ============================================================
export const conversations = [
  {
    id: 'c1',
    workspaceId: 'w1',
    name: 'Pasteur Jean-Marc',
    role: 'Pasteur Principal',
    avatar: 'JM',
    color: 'from-amber-500 to-orange-600',
    lastMessage: 'Que la paix du Seigneur soit avec vous ce matin.',
    time: '08:42',
    unread: 2,
    online: true,
    type: 'private',
  },
  {
    id: 'c4',
    workspaceId: 'w1',
    name: 'Sophie Martin',
    role: 'Membre',
    avatar: 'SM',
    color: 'from-rose-500 to-pink-600',
    lastMessage: "Merci pour le verset d'aujourd'hui, très touchant 🙏",
    time: 'Hier',
    unread: 0,
    online: true,
    type: 'private',
  },
  {
    id: 'c6',
    workspaceId: 'w1',
    name: 'Thomas Dubois',
    role: 'Diacre',
    avatar: 'TD',
    color: 'from-cyan-500 to-blue-600',
    lastMessage: 'J\'ai préparé le planning du service de dimanche.',
    time: 'Dim',
    unread: 0,
    online: false,
    type: 'private',
  },
  {
    id: 'c8',
    workspaceId: 'w2',
    name: 'Julie Chen',
    role: 'Lead Produit',
    avatar: 'JC',
    color: 'from-fuchsia-500 to-purple-600',
    lastMessage: 'Peux-tu relire la spec avant demain ?',
    time: '08:20',
    unread: 1,
    online: true,
    type: 'private',
  },
  {
    id: 'c9',
    workspaceId: 'w2',
    name: 'Nadia Petit',
    role: 'RH',
    avatar: 'NP',
    color: 'from-cyan-500 to-blue-600',
    lastMessage: 'Ton entretien annuel est prévu vendredi 14h.',
    time: 'Hier',
    unread: 0,
    online: false,
    type: 'private',
  },
  {
    id: 'c11',
    workspaceId: 'w3',
    name: 'Marc Andriamampianina',
    role: 'Coordinateur Terrain',
    avatar: 'MA',
    color: 'from-orange-500 to-red-600',
    lastMessage: 'On a besoin de 3 bénévoles de plus samedi.',
    time: 'Lun',
    unread: 0,
    online: true,
    type: 'private',
  },
]

export const messagesByConversation = {
  c1: [
    { id: 'm1', sender: 'them', text: 'Bonjour frère, comment allez-vous aujourd\'hui ?', time: '08:30' },
    { id: 'm2', sender: 'me', text: 'Très bien pasteur, grâce à Dieu. Et vous ?', time: '08:35' },
    { id: 'm3', sender: 'them', text: 'Je vais bien, merci. J\'ai pensé à vous pendant ma prière ce matin.', time: '08:40' },
    { id: 'm4', sender: 'them', text: 'Que la paix du Seigneur soit avec vous ce matin.', time: '08:42' },
  ],
  c4: [
    { id: 'm1', sender: 'them', text: 'Merci pour le verset d\'aujourd\'hui, très touchant 🙏', time: '20:15' },
    { id: 'm2', sender: 'me', text: 'C\'est un plaisir Sophie, il m\'a beaucoup parlé aussi.', time: '20:20' },
  ],
  c6: [
    { id: 'm1', sender: 'them', text: 'J\'ai préparé le planning du service de dimanche.', time: '14:00' },
    { id: 'm2', sender: 'me', text: 'Super, merci Thomas. Je regarde ça.', time: '14:10' },
  ],
  c8: [
    { id: 'm1', sender: 'them', text: 'Peux-tu relire la spec avant demain ?', time: '08:15' },
    { id: 'm2', sender: 'me', text: 'Oui, je te fais un retour ce soir.', time: '08:20' },
  ],
  c9: [
    { id: 'm1', sender: 'them', text: 'Ton entretien annuel est prévu vendredi 14h.', time: 'Hier' },
  ],
  c11: [
    { id: 'm1', sender: 'them', text: 'On a besoin de 3 bénévoles de plus samedi.', time: 'Lun' },
    { id: 'm2', sender: 'me', text: 'Je relaie l\'appel dans le groupe.', time: 'Lun' },
  ],
}

// ============================================================
// CANAUX / ANNONCES (scoped by workspaceId)
// ============================================================
export const announcements = [
  {
    id: 'a1',
    workspaceId: 'w1',
    author: 'Pasteur Jean-Marc',
    role: 'Pasteur Principal',
    avatar: 'JM',
    time: 'Il y a 30 min',
    type: 'announcement',
    content: 'Bien-aimés, ce dimanche nous aurons le privilège d\'accueillir la famille Dupont pour leur baptême. Réjouissons-nous ensemble pour cette nouvelle vie en Christ !',
    reactions: { '🙏': 24, '❤️': 18, '🙌': 12 },
  },
  {
    id: 'a2',
    workspaceId: 'w1',
    author: 'Verset du Jour',
    role: 'Écriture Sainte',
    avatar: 'VD',
    time: 'Il y a 2 h',
    type: 'verse',
    reference: 'Philippiens 4:13',
    content: 'Je puis tout par celui qui me fortifie.',
    reactions: { '🙏': 56, '❤️': 42, '🔥': 9 },
  },
  {
    id: 'a3',
    workspaceId: 'w1',
    author: 'Église Évangélique de la Grâce',
    role: 'Événement à venir',
    avatar: 'EV',
    time: 'Hier',
    type: 'event',
    title: 'Veillée de Prière & Adoration',
    date: 'Vendredi 8 Août · 20h00',
    location: 'Temple Central · 12 Rue de la Foi',
    content: 'Une soirée de louange, d\'adoration et de prière communautaire. Venez comme vous êtes, Dieu vous attend.',
    reactions: { '🙌': 31, '🙏': 22, '❤️': 15 },
  },
  {
    id: 'a4',
    workspaceId: 'w1',
    author: 'Pasteur Jean-Marc',
    role: 'Pasteur Principal',
    avatar: 'JM',
    time: 'Lun',
    type: 'announcement',
    content: 'Rappel : les inscriptions pour le camp des jeunes sont ouvertes jusqu\'au 15 août. Ne tardez pas, les places sont limitées à 40 participants.',
    reactions: { '🙏': 14, '❤️': 8 },
  },
  {
    id: 'a5',
    workspaceId: 'w1',
    author: 'Verset du Jour',
    role: 'Écriture Sainte',
    avatar: 'VD',
    time: 'Lun',
    type: 'verse',
    reference: 'Psaume 23:1',
    content: 'L\'Éternel est mon berger : je ne manquerai de rien.',
    reactions: { '🙏': 68, '❤️': 51, '🙌': 20 },
  },
  {
    id: 'a6',
    workspaceId: 'w2',
    author: 'Nadia Petit',
    role: 'Direction RH',
    avatar: 'NP',
    time: 'Il y a 1 h',
    type: 'announcement',
    content: 'Réunion générale (all-hands) vendredi 10h en salle Everest. Présence de toutes les équipes attendue, présentation des résultats du Q3.',
    reactions: { '👍': 19, '🎉': 6 },
  },
  {
    id: 'a7',
    workspaceId: 'w2',
    author: 'Entreprise Tech',
    role: 'Événement à venir',
    avatar: 'ET',
    time: 'Hier',
    type: 'event',
    title: 'Sprint Planning Q4',
    date: 'Lundi 17 Août · 09h00',
    location: 'Salle Everest · Étage 4',
    content: 'Planification du prochain sprint avec toutes les équipes produit. Merci de préparer vos backlogs en amont.',
    reactions: { '👍': 11, '🚀': 7 },
  },
  {
    id: 'a8',
    workspaceId: 'w3',
    author: 'Marc Andriamampianina',
    role: 'Coordinateur Terrain',
    avatar: 'MA',
    time: 'Il y a 3 h',
    type: 'announcement',
    content: 'Merci à tous les bénévoles pour la collecte de ce week-end : plus de 800 kg de denrées récoltées ! Une distribution est prévue vendredi.',
    reactions: { '🙌': 34, '❤️': 21 },
  },
  {
    id: 'a9',
    workspaceId: 'w3',
    author: 'ONG Espoir',
    role: 'Événement à venir',
    avatar: 'OE',
    time: 'Lun',
    type: 'event',
    title: 'Distribution Alimentaire',
    date: 'Vendredi 15 Août · 14h00',
    location: 'Centre Communautaire · Quartier Nord',
    content: 'Distribution mensuelle de denrées alimentaires aux familles bénéficiaires. Bénévoles bienvenus dès 13h pour la préparation.',
    reactions: { '🙌': 28, '❤️': 17 },
  },
  {
    id: 'a10',
    workspaceId: 'w1b',
    author: 'Pasteur Paul Nguyen',
    role: 'Pasteur Local · Annexe Nord',
    avatar: 'PN',
    time: 'Il y a 4 h',
    type: 'announcement',
    content: 'Bienvenue à tous les nouveaux venus de l\'Annexe Nord ! Un temps d\'accueil spécial est prévu après le culte de dimanche.',
    reactions: { '🙏': 9, '❤️': 6 },
  },
]

// ============================================================
// PROFIL UTILISATEUR (schéma aligné sur la table `profiles`)
// ============================================================
export const maritalStatusLabels = {
  single: 'Célibataire',
  married: 'Marié(e)',
  divorced: 'Divorcé(e)',
  widowed: 'Veuf(ve)',
}

export const genderLabels = {
  M: 'Homme',
  F: 'Femme',
}

// Profils de démonstration : chaque utilisateur ne voit, dans le
// WorkspaceSwitcher, que les organisations listées dans `memberships`.
// Le rôle (`admin`/`leader`/`member`) est propre à chaque organisation.
export const demoUsers = [
  {
    id: 'daniel',
    full_name: 'Daniel Lefèvre',
    email: 'daniel.lefevre@email.com',
    phone: '+33 6 45 12 78 93',
    gender: 'M',
    birth_date: '1988-04-12',
    marital_status: 'married',
    profession: 'Ingénieur Logiciel',
    skills: ['Développement Web', 'Gestion de projet', 'Accueil & Hospitalité'],
    avatar: 'DL',
    memberSince: 'Membre depuis 2019',
    stats: { events: 47, prayers: 128, donations: 15 },
    memberships: [
      { workspaceId: 'w1', role: 'admin' },
      { workspaceId: 'w2', role: 'member' },
      { workspaceId: 'w3', role: 'leader' },
    ],
  },
  {
    id: 'jean',
    full_name: 'Jean Kouassi',
    email: 'jean.kouassi@email.com',
    phone: '+33 6 78 90 12 34',
    gender: 'M',
    birth_date: '1995-11-03',
    marital_status: 'single',
    profession: 'Étudiant',
    skills: ['Accueil & Hospitalité', 'Musique'],
    avatar: 'JK',
    memberSince: 'Membre depuis 2023',
    stats: { events: 12, prayers: 34, donations: 3 },
    memberships: [
      { workspaceId: 'w1', role: 'member' },
    ],
  },
]

// ============================================================
// ÉVÉNEMENTS (catégories adaptées par type d'organisation)
// ============================================================
export const eventCategoriesByType = {
  church: [
    { id: 'culte', label: 'Culte', color: 'bg-gold text-white' },
    { id: 'priere', label: 'Prière', color: 'bg-sky-500 text-white' },
    { id: 'jeunesse', label: 'Jeunesse', color: 'bg-violet-500 text-white' },
    { id: 'formation', label: 'Formation', color: 'bg-emerald-500 text-white' },
  ],
  business: [
    { id: 'reunion', label: 'Réunion', color: 'bg-blue-500 text-white' },
    { id: 'formation', label: 'Formation', color: 'bg-emerald-500 text-white' },
    { id: 'teambuilding', label: 'Team Building', color: 'bg-fuchsia-500 text-white' },
    { id: 'conference', label: 'Conférence', color: 'bg-amber-500 text-white' },
  ],
  ngo: [
    { id: 'mission', label: 'Mission', color: 'bg-emerald-500 text-white' },
    { id: 'collecte', label: 'Collecte', color: 'bg-amber-500 text-white' },
    { id: 'benevolat', label: 'Bénévolat', color: 'bg-teal-500 text-white' },
    { id: 'formation', label: 'Formation', color: 'bg-sky-500 text-white' },
  ],
}

export const events = [
  {
    id: 'e1',
    workspaceId: 'w1',
    title: 'Culte du Dimanche',
    category: 'culte',
    date: '2026-08-16',
    time: '10h00',
    location: 'Temple Central',
    attendees: 128,
    capacity: 200,
    description: 'Culte dominical avec louange, prédication et sainte cène.',
  },
  {
    id: 'e2',
    workspaceId: 'w1',
    title: 'Veillée de Prière & Adoration',
    category: 'priere',
    date: '2026-08-14',
    time: '20h00',
    location: 'Temple Central · Salle B',
    attendees: 42,
    capacity: 80,
    description: 'Soirée de louange, d\'adoration et de prière communautaire.',
  },
  {
    id: 'e3',
    workspaceId: 'w1',
    title: 'Soirée Jeunesse',
    category: 'jeunesse',
    date: '2026-08-15',
    time: '19h00',
    location: 'Salle Jeunesse',
    attendees: 24,
    capacity: 40,
    description: 'Temps de louange, jeux et partage pour les 15-25 ans.',
  },
  {
    id: 'e4',
    workspaceId: 'w1',
    title: 'Formation Nouveaux Membres',
    category: 'formation',
    date: '2026-08-22',
    time: '14h00',
    location: 'Salle de Formation',
    attendees: 12,
    capacity: 20,
    description: 'Parcours de découverte pour les nouveaux membres de l\'église.',
  },
  {
    id: 'e5',
    workspaceId: 'w1',
    title: 'Culte du Dimanche',
    category: 'culte',
    date: '2026-08-23',
    time: '10h00',
    location: 'Temple Central',
    attendees: 15,
    capacity: 200,
    description: 'Culte dominical avec louange, prédication et sainte cène.',
  },
  {
    id: 'e6',
    workspaceId: 'w1',
    title: 'Groupe de Prière du Mercredi',
    category: 'priere',
    date: '2026-08-19',
    time: '18h30',
    location: 'Temple Central · Salle A',
    attendees: 12,
    capacity: 30,
    description: 'Temps de prière hebdomadaire en petit groupe.',
  },
  {
    id: 'e7',
    workspaceId: 'w2',
    title: 'Réunion Générale Q3',
    category: 'reunion',
    date: '2026-08-14',
    time: '10h00',
    location: 'Salle Everest',
    attendees: 52,
    capacity: 60,
    description: 'Présentation des résultats du trimestre et feuille de route Q4.',
  },
  {
    id: 'e8',
    workspaceId: 'w2',
    title: 'Sprint Planning Q4',
    category: 'reunion',
    date: '2026-08-17',
    time: '09h00',
    location: 'Salle Everest · Étage 4',
    attendees: 18,
    capacity: 25,
    description: 'Planification du prochain sprint avec toutes les équipes produit.',
  },
  {
    id: 'e9',
    workspaceId: 'w2',
    title: 'Séminaire Leadership',
    category: 'formation',
    date: '2026-08-20',
    time: '14h00',
    location: 'Salle de Formation B',
    attendees: 9,
    capacity: 15,
    description: 'Formation interne sur le management d\'équipe et la conduite du changement.',
  },
  {
    id: 'e10',
    workspaceId: 'w2',
    title: 'Soirée Team Building',
    category: 'teambuilding',
    date: '2026-08-28',
    time: '18h30',
    location: 'Escape Game Center',
    attendees: 27,
    capacity: 40,
    description: 'Activité de cohésion d\'équipe inter-services.',
  },
  {
    id: 'e11',
    workspaceId: 'w3',
    title: 'Distribution Alimentaire',
    category: 'collecte',
    date: '2026-08-15',
    time: '14h00',
    location: 'Centre Communautaire · Quartier Nord',
    attendees: 22,
    capacity: 30,
    description: 'Distribution mensuelle de denrées alimentaires aux familles bénéficiaires.',
  },
  {
    id: 'e12',
    workspaceId: 'w3',
    title: 'Mission Terrain - Zone Est',
    category: 'mission',
    date: '2026-08-18',
    time: '08h00',
    location: 'Zone Est · Point de rassemblement',
    attendees: 14,
    capacity: 20,
    description: 'Intervention terrain auprès des familles bénéficiaires de la zone Est.',
  },
  {
    id: 'e13',
    workspaceId: 'w3',
    title: 'Formation Nouveaux Bénévoles',
    category: 'formation',
    date: '2026-08-21',
    time: '10h00',
    location: 'Siège ONG Espoir',
    attendees: 8,
    capacity: 25,
    description: 'Session d\'accueil et de formation pour les nouveaux bénévoles.',
  },
  {
    id: 'e14',
    workspaceId: 'w3',
    title: 'Grande Collecte de Fonds',
    category: 'collecte',
    date: '2026-08-29',
    time: '18h00',
    location: 'Salle des Fêtes Municipale',
    attendees: 63,
    capacity: 150,
    description: 'Soirée de gala annuelle au profit des programmes d\'aide alimentaire.',
  },
]

// ============================================================
// MÉDIATHÈQUE (sous-titre adapté par type d'organisation)
// ============================================================
export const mediaSubtitleByType = {
  church: 'Prédications, enseignements & louanges',
  business: 'Formations internes & replays',
  ngo: 'Témoignages & rapports terrain',
}

export const contributionCopyByType = {
  church: { title: 'Contributions & Dons', subtitle: 'Soutenez votre église' },
  business: { title: 'Cotisations & Contributions', subtitle: 'Participez aux frais collectifs' },
  ngo: { title: 'Dons & Collectes', subtitle: 'Soutenez les missions de l\'ONG' },
}

export const mediaCategories = [
  { id: 'all', label: 'Tout' },
  { id: 'video', label: 'Vidéo' },
  { id: 'audio', label: 'Audio' },
]

export const mediaItems = [
  {
    id: 'md1',
    workspaceId: 'w1',
    title: 'Marcher par la foi, pas par la vue',
    speaker: 'Pasteur Jean-Marc',
    type: 'video',
    series: 'La Foi en Action',
    duration: '42:18',
    date: '9 Août 2026',
    plays: 312,
    color: 'from-amber-500 to-orange-600',
  },
  {
    id: 'md2',
    workspaceId: 'w1',
    title: 'La grâce qui transforme',
    speaker: 'Pasteur Jean-Marc',
    type: 'audio',
    series: 'La Foi en Action',
    duration: '38:05',
    date: '2 Août 2026',
    plays: 187,
    color: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'md3',
    workspaceId: 'w1',
    title: 'Prier avec persévérance',
    speaker: 'Diacre Thomas Dubois',
    type: 'audio',
    series: 'Vie de Prière',
    duration: '29:47',
    date: '26 Juillet 2026',
    plays: 98,
    color: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'md4',
    workspaceId: 'w1',
    title: 'Louange & Adoration - Soirée Spéciale',
    speaker: 'Ministère des Louanges',
    type: 'video',
    series: 'Moments de Louange',
    duration: '1:05:30',
    date: '20 Juillet 2026',
    plays: 421,
    color: 'from-rose-500 to-pink-600',
  },
  {
    id: 'md5',
    workspaceId: 'w1',
    title: 'L\'espérance au cœur de l\'épreuve',
    speaker: 'Pasteur Jean-Marc',
    type: 'video',
    series: 'La Foi en Action',
    duration: '45:52',
    date: '12 Juillet 2026',
    plays: 267,
    color: 'from-violet-500 to-purple-600',
  },
  {
    id: 'md6',
    workspaceId: 'w1',
    title: 'Le pardon comme mode de vie',
    speaker: 'Pasteur Jean-Marc',
    type: 'audio',
    series: 'La Foi en Action',
    duration: '35:12',
    date: '5 Juillet 2026',
    plays: 154,
    color: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'md7',
    workspaceId: 'w2',
    title: 'Onboarding Produit 2026',
    speaker: 'Julie Chen',
    type: 'video',
    series: 'Formations Internes',
    duration: '28:40',
    date: '8 Août 2026',
    plays: 143,
    color: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'md8',
    workspaceId: 'w2',
    title: 'Replay All-Hands Q3',
    speaker: 'Direction',
    type: 'video',
    series: 'Réunions Générales',
    duration: '54:12',
    date: '1 Août 2026',
    plays: 201,
    color: 'from-fuchsia-500 to-purple-600',
  },
  {
    id: 'md9',
    workspaceId: 'w2',
    title: 'Podcast RH : Bien-être au travail',
    speaker: 'Nadia Petit',
    type: 'audio',
    series: 'Formations Internes',
    duration: '22:05',
    date: '25 Juillet 2026',
    plays: 76,
    color: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'md10',
    workspaceId: 'w3',
    title: 'Témoignage : une famille aidée',
    speaker: 'Fatou Diallo',
    type: 'video',
    series: 'Témoignages Terrain',
    duration: '12:30',
    date: '6 Août 2026',
    plays: 289,
    color: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'md11',
    workspaceId: 'w3',
    title: 'Rapport d\'activité - 1er semestre',
    speaker: 'Marc Andriamampianina',
    type: 'audio',
    series: 'Rapports Terrain',
    duration: '18:45',
    date: '30 Juillet 2026',
    plays: 64,
    color: 'from-amber-500 to-orange-600',
  },
  {
    id: 'md12',
    workspaceId: 'w3',
    title: 'Former les bénévoles à la maraude',
    speaker: 'Paul Girard',
    type: 'video',
    series: 'Formations Terrain',
    duration: '33:20',
    date: '22 Juillet 2026',
    plays: 112,
    color: 'from-violet-500 to-purple-600',
  },
]

// ============================================================
// ANNUAIRE DES MEMBRES (compétences & profession, scoped par workspace)
// ============================================================
export const members = [
  {
    id: 'u1',
    workspaceId: 'w1',
    full_name: 'Pasteur Jean-Marc',
    avatar: 'JM',
    color: 'from-amber-500 to-orange-600',
    role: 'admin',
    profession: 'Pasteur',
    skills: ['Prédication', 'Théologie', 'Conseil pastoral'],
    phone: '+33 6 12 34 56 78',
    email: 'jean-marc@egliseconnect.fr',
  },
  {
    id: 'u2',
    workspaceId: 'w1',
    full_name: 'Sophie Martin',
    avatar: 'SM',
    color: 'from-rose-500 to-pink-600',
    role: 'member',
    profession: 'Comptable',
    skills: ['Comptabilité', 'Communication'],
    phone: '+33 6 22 33 44 55',
    email: 'sophie.martin@email.com',
  },
  {
    id: 'u3',
    workspaceId: 'w1',
    full_name: 'Thomas Dubois',
    avatar: 'TD',
    color: 'from-cyan-500 to-blue-600',
    role: 'leader',
    profession: 'Diacre',
    skills: ['Logistique', 'Gestion de planning'],
    phone: '+33 6 33 44 55 66',
    email: 'thomas.dubois@email.com',
  },
  {
    id: 'u4',
    workspaceId: 'w1',
    full_name: 'David Lemoine',
    avatar: 'DL',
    color: 'from-emerald-500 to-teal-600',
    role: 'member',
    profession: 'Musicien',
    skills: ['Musique', 'Direction chorale'],
    phone: '+33 6 44 55 66 77',
    email: 'david.lemoine@email.com',
  },
  {
    id: 'u5',
    workspaceId: 'w1',
    full_name: 'Marie Lefort',
    avatar: 'ML',
    color: 'from-violet-500 to-purple-600',
    role: 'member',
    profession: 'Infirmière',
    skills: ['Intercession', 'Accueil'],
    phone: '+33 6 55 66 77 88',
    email: 'marie.lefort@email.com',
  },
  {
    id: 'u6',
    workspaceId: 'w2',
    full_name: 'Julie Chen',
    avatar: 'JC',
    color: 'from-fuchsia-500 to-purple-600',
    role: 'leader',
    profession: 'Lead Produit',
    skills: ['Product Management', 'UX Design'],
    phone: '+33 6 66 77 88 99',
    email: 'julie.chen@entreprisetech.com',
  },
  {
    id: 'u7',
    workspaceId: 'w2',
    full_name: 'Karim Haddad',
    avatar: 'KH',
    color: 'from-blue-500 to-indigo-600',
    role: 'member',
    profession: 'Développeur Backend',
    skills: ['Développement Backend', 'DevOps'],
    phone: '+33 6 77 88 99 00',
    email: 'karim.haddad@entreprisetech.com',
  },
  {
    id: 'u8',
    workspaceId: 'w2',
    full_name: 'Emma Rousseau',
    avatar: 'ER',
    color: 'from-rose-500 to-pink-600',
    role: 'member',
    profession: 'Chargée Marketing',
    skills: ['Marketing Digital', 'SEO'],
    phone: '+33 6 88 99 00 11',
    email: 'emma.rousseau@entreprisetech.com',
  },
  {
    id: 'u9',
    workspaceId: 'w2',
    full_name: 'Lucas Bernard',
    avatar: 'LB',
    color: 'from-cyan-500 to-blue-600',
    role: 'member',
    profession: 'Développeur Frontend',
    skills: ['Développement Frontend', 'React'],
    phone: '+33 6 99 00 11 22',
    email: 'lucas.bernard@entreprisetech.com',
  },
  {
    id: 'u10',
    workspaceId: 'w2',
    full_name: 'Nadia Petit',
    avatar: 'NP',
    color: 'from-amber-500 to-orange-600',
    role: 'admin',
    profession: 'Responsable RH',
    skills: ['Ressources Humaines', 'Recrutement'],
    phone: '+33 6 00 11 22 33',
    email: 'nadia.petit@entreprisetech.com',
  },
  {
    id: 'u11',
    workspaceId: 'w3',
    full_name: 'Marc Andriamampianina',
    avatar: 'MA',
    color: 'from-orange-500 to-red-600',
    role: 'leader',
    profession: 'Coordinateur Terrain',
    skills: ['Coordination terrain', 'Logistique humanitaire'],
    phone: '+33 6 11 22 33 44',
    email: 'marc.a@ongespoir.org',
  },
  {
    id: 'u12',
    workspaceId: 'w3',
    full_name: 'Fatou Diallo',
    avatar: 'FD',
    color: 'from-emerald-500 to-teal-600',
    role: 'member',
    profession: 'Chargée de Communication',
    skills: ['Levée de fonds', 'Communication'],
    phone: '+33 6 22 33 44 66',
    email: 'fatou.diallo@ongespoir.org',
  },
  {
    id: 'u13',
    workspaceId: 'w3',
    full_name: 'Paul Girard',
    avatar: 'PG',
    color: 'from-sky-500 to-blue-600',
    role: 'admin',
    profession: 'Responsable Administratif',
    skills: ['Comptabilité', 'Gestion de projet'],
    phone: '+33 6 33 44 55 77',
    email: 'paul.girard@ongespoir.org',
  },
  {
    id: 'u14',
    workspaceId: 'w3',
    full_name: 'Aïcha Ben Salem',
    avatar: 'AB',
    color: 'from-violet-500 to-purple-600',
    role: 'member',
    profession: 'Interprète',
    skills: ['Traduction', 'Médiation'],
    phone: '+33 6 44 55 66 88',
    email: 'aicha.bensalem@ongespoir.org',
  },
  {
    id: 'u15',
    workspaceId: 'w3',
    full_name: 'Yann Kerguelen',
    avatar: 'YK',
    color: 'from-rose-500 to-pink-600',
    role: 'member',
    profession: 'Formateur Santé',
    skills: ['Formation', 'Santé publique'],
    phone: '+33 6 55 66 77 99',
    email: 'yann.kerguelen@ongespoir.org',
  },
  {
    id: 'u16',
    workspaceId: 'w1b',
    full_name: 'Pasteur Paul Nguyen',
    avatar: 'PN',
    color: 'from-orange-500 to-red-600',
    role: 'admin',
    profession: 'Pasteur Local',
    skills: ['Prédication', 'Conseil pastoral'],
    phone: '+33 6 66 11 22 33',
    email: 'paul.nguyen@egliseconnect.fr',
  },
  {
    id: 'u17',
    workspaceId: 'w1b',
    full_name: 'Grace Owusu',
    avatar: 'GO',
    color: 'from-emerald-500 to-teal-600',
    role: 'member',
    profession: 'Enseignante',
    skills: ['Accueil', 'Pédagogie'],
    phone: '+33 6 77 22 33 44',
    email: 'grace.owusu@email.com',
  },
]

// ============================================================
// ASSISTANT IA — ComHub AI (synthèses & comptes rendus, mock)
// ============================================================
const aiSummaryTemplates = {
  church: {
    discussion: {
      keyPoints: [
        'Échanges actifs et fraternels, avec une forte participation des membres.',
        'Plusieurs témoignages personnels partagés en lien avec le sujet du groupe.',
        'Le ton général reste encourageant, centré sur le soutien mutuel.',
      ],
      decisions: [
        'Poursuivre l\'accompagnement du groupe lors de la prochaine rencontre.',
        'Impliquer le pasteur si un suivi plus personnel est nécessaire.',
      ],
      thirdTitle: 'Sujets de Prière & Annonces',
      thirdIcon: 'heart',
      thirdItems: [
        'Prière pour les besoins de guérison évoqués dans les échanges.',
        'Prière pour l\'unité et la persévérance du groupe.',
        'Rappel : prochaine rencontre communautaire à venir.',
      ],
    },
    live: {
      keyPoints: [
        'Bonne assiduité des participants tout au long du direct.',
        'Message centré sur l\'espérance et la persévérance dans la foi.',
        'Moment de louange particulièrement suivi et apprécié.',
      ],
      decisions: [
        'Organiser un temps de prière supplémentaire la semaine prochaine.',
        'Relancer les inscriptions pour les événements à venir.',
      ],
      thirdTitle: 'Sujets de Prière & Annonces',
      thirdIcon: 'heart',
      thirdItems: [
        'Prière pour les familles mentionnées durant le culte.',
        'Annonce : baptême prévu dimanche prochain.',
        'Rappel des inscriptions au camp des jeunes.',
      ],
    },
    finance: {
      keyPoints: [
        'Les dons et dîmes du mois sont globalement stables par rapport au mois précédent.',
        'La majorité des contributions se font par Mobile Money.',
        'Une légère hausse des offrandes est observée les semaines de grand événement.',
      ],
      decisions: [
        'Continuer à communiquer les coordonnées de paiement lors des annonces.',
        'Prévoir un rappel de dîme en fin de mois.',
      ],
      thirdTitle: 'Recommandations',
      thirdIcon: 'trend',
      thirdItems: [
        'Encourager les dons récurrents (mensuels) pour stabiliser les recettes.',
        'Publier un récapitulatif trimestriel de transparence financière.',
        'Remercier publiquement les contributeurs réguliers.',
      ],
    },
  },
  business: {
    discussion: {
      keyPoints: [
        'Discussion active avec plusieurs points techniques abordés en détail.',
        'Bonne réactivité de l\'équipe sur les questions posées.',
        'Quelques blocages identifiés nécessitant un arbitrage rapide.',
      ],
      decisions: [
        'Valider l\'approche proposée par l\'équipe produit.',
        'Prioriser la résolution des blocages identifiés cette semaine.',
      ],
      thirdTitle: 'Ordre du Jour & Actions à Mener',
      thirdIcon: 'tasks',
      thirdItems: [
        'Finaliser la spécification technique avant vendredi.',
        'Lever le blocage remonté sur l\'intégration API.',
        'Planifier un point de suivi la semaine prochaine.',
      ],
    },
    live: {
      keyPoints: [
        'Bon niveau de participation de l\'ensemble des équipes.',
        'Présentation claire des résultats et de la feuille de route.',
        'Session de questions/réponses constructive en fin de réunion.',
      ],
      decisions: [
        'Valider la feuille de route du prochain trimestre.',
        'Confirmer les objectifs individuels par équipe.',
      ],
      thirdTitle: 'Ordre du Jour & Actions à Mener',
      thirdIcon: 'tasks',
      thirdItems: [
        'Diffuser le compte-rendu à l\'ensemble des équipes.',
        'Mettre à jour les feuilles de route par équipe.',
        'Planifier le prochain point d\'avancement.',
      ],
    },
    finance: {
      keyPoints: [
        'Les cotisations internes sont collectées régulièrement chaque mois.',
        'Le mécénat représente une part croissante des contributions.',
        'La majorité des paiements se font par virement bancaire.',
      ],
      decisions: [
        'Maintenir le rappel automatique de cotisation en début de mois.',
        'Solliciter deux nouveaux partenaires mécènes ce trimestre.',
      ],
      thirdTitle: 'Recommandations',
      thirdIcon: 'trend',
      thirdItems: [
        'Automatiser les reçus de cotisation pour gagner du temps administratif.',
        'Publier un bilan financier trimestriel aux équipes.',
        'Diversifier les canaux de paiement proposés.',
      ],
    },
  },
  ngo: {
    discussion: {
      keyPoints: [
        'Bonne coordination entre les bénévoles impliqués dans l\'échange.',
        'Plusieurs besoins logistiques remontés pour la prochaine action.',
        'Mobilisation solide de l\'équipe terrain.',
      ],
      decisions: [
        'Confirmer la répartition des bénévoles pour l\'intervention.',
        'Valider le budget nécessaire aux besoins identifiés.',
      ],
      thirdTitle: 'Résolutions & Actions Terrain',
      thirdIcon: 'tasks',
      thirdItems: [
        'Confirmer les bénévoles supplémentaires nécessaires.',
        'Relancer la communication autour de la collecte en cours.',
        'Préparer le matériel pour la prochaine distribution.',
      ],
    },
    live: {
      keyPoints: [
        'Mobilisation confirmée des équipes terrain pour l\'action à venir.',
        'Bilan positif partagé sur la dernière intervention.',
        'Besoins matériels et humains identifiés pour la suite.',
      ],
      decisions: [
        'Valider la logistique de la prochaine intervention.',
        'Confirmer le budget alloué à l\'action.',
      ],
      thirdTitle: 'Résolutions & Actions Terrain',
      thirdIcon: 'tasks',
      thirdItems: [
        'Finaliser le budget prévisionnel de l\'action.',
        'Coordonner la traduction et la médiation avec les familles.',
        'Publier le rapport d\'activité sous 48h.',
      ],
    },
    finance: {
      keyPoints: [
        'Les dons libres et parrainages progressent par rapport au trimestre précédent.',
        'Les contributions par Mobile Money restent majoritaires sur le terrain.',
        'Les grandes collectes de fonds génèrent l\'essentiel des recettes ponctuelles.',
      ],
      decisions: [
        'Planifier la prochaine grande collecte de fonds.',
        'Renforcer la communication autour de l\'impact des dons.',
      ],
      thirdTitle: 'Recommandations',
      thirdIcon: 'trend',
      thirdItems: [
        'Publier un rapport d\'impact chiffré pour rassurer les donateurs.',
        'Développer le parrainage récurrent auprès des donateurs fidèles.',
        'Diversifier les moyens de paiement pour les dons internationaux.',
      ],
    },
  },
}

export function buildAISummary({ type, kind, subject }) {
  const template = aiSummaryTemplates[type]?.[kind] || aiSummaryTemplates.business.discussion
  return {
    subject,
    generatedAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    ...template,
  }
}

// ============================================================
// GROUPES (avec règles d'auto-assignation — miroir de groups.rules_json)
// ============================================================
// `memberIds` référence des entrées de `members` : un aperçu réel des
// membres du groupe (pas nécessairement exhaustif — `memberCount` reste
// le total officiel affiché sur la carte).
export const groups = [
  {
    id: 'g1',
    workspaceId: 'w1',
    name: 'Femmes d\'Impact',
    description: 'Groupe de partage et de prière réservé aux femmes de l\'église.',
    memberCount: 34,
    memberIds: ['u2', 'u5'],
    rules: { gender: 'F', min_age: null, max_age: null, marital_status: null },
  },
  {
    id: 'g1h',
    workspaceId: 'w1',
    name: 'Ministère des Hommes',
    description: 'Groupe de partage et d\'affermissement réservé aux hommes de l\'église.',
    memberCount: 28,
    memberIds: ['u1', 'u3', 'u4'],
    rules: { gender: 'M', min_age: null, max_age: null, marital_status: null },
  },
  {
    id: 'g2',
    workspaceId: 'w1',
    name: 'Groupe Jeunesse',
    description: 'Rencontres hebdomadaires pour les moins de 30 ans.',
    memberCount: 24,
    memberIds: ['u2', 'u4'],
    rules: { gender: null, min_age: 15, max_age: 30, marital_status: null },
  },
  {
    id: 'g3',
    workspaceId: 'w1',
    name: 'Couples Unis',
    description: 'Accompagnement et enseignement pour les couples mariés.',
    memberCount: 18,
    memberIds: ['u3', 'u5'],
    rules: { gender: null, min_age: null, max_age: null, marital_status: 'married' },
  },
  {
    id: 'g4',
    workspaceId: 'w1',
    name: 'Ministère des Louanges',
    description: 'Équipe de louange et d\'adoration.',
    memberCount: 8,
    memberIds: ['u4'],
    rules: null,
  },
  {
    id: 'g5',
    workspaceId: 'w2',
    name: 'Nouveaux Talents',
    description: 'Programme d\'intégration pour les jeunes recrues.',
    memberCount: 12,
    memberIds: ['u9'],
    rules: { gender: null, min_age: null, max_age: 30, marital_status: null },
  },
  {
    id: 'g6',
    workspaceId: 'w2',
    name: 'Équipe Produit',
    description: 'Product managers et designers.',
    memberCount: 9,
    memberIds: ['u6'],
    rules: null,
  },
  {
    id: 'g7',
    workspaceId: 'w3',
    name: 'Bénévoles Terrain',
    description: 'Coordination des interventions et distributions.',
    memberCount: 42,
    memberIds: ['u11', 'u12'],
    rules: null,
  },
  {
    id: 'g8',
    workspaceId: 'w3',
    name: 'Jeunes Volontaires',
    description: 'Programme dédié aux bénévoles de moins de 30 ans.',
    memberCount: 15,
    memberIds: ['u14'],
    rules: { gender: null, min_age: null, max_age: 30, marital_status: null },
  },
]

// Fil de discussion propre à chaque groupe (clé = groups[].id).
export const messagesByGroup = {
  g1: [
    { id: 'gm1', sender: 'them', name: 'Sophie Martin', text: 'Bonjour les femmes ! Rappel de notre rencontre jeudi 19h.', time: '09:12' },
    { id: 'gm2', sender: 'them', name: 'Marie Lefort', text: 'Présente ! Je peux amener des gâteaux 😊', time: '09:20' },
  ],
  g1h: [
    { id: 'gm1', sender: 'them', name: 'Pasteur Jean-Marc', text: 'Frères, notre étude de ce soir portera sur la persévérance.', time: '08:00' },
    { id: 'gm2', sender: 'them', name: 'Thomas Dubois', text: 'Merci pasteur, j\'y serai.', time: '08:15' },
  ],
  g2: [
    { id: 'gm1', sender: 'them', name: 'David Lemoine', text: 'Qui vient à la soirée jeux vendredi ?', time: '17:00' },
  ],
  g3: [
    { id: 'gm1', sender: 'them', name: 'Thomas Dubois', text: 'La prochaine session couples est le 20.', time: '11:00' },
  ],
  g4: [
    { id: 'gm1', sender: 'them', name: 'David Lemoine', text: 'Répétition ce soir 18h30, merci d\'être à l\'heure.', time: '10:00' },
  ],
  g5: [
    { id: 'gm1', sender: 'them', name: 'Lucas Bernard', text: 'Bienvenue aux nouveaux arrivants du mois !', time: '09:00' },
  ],
  g6: [
    { id: 'gm1', sender: 'them', name: 'Julie Chen', text: 'Point produit demain 10h, merci de préparer vos retours.', time: '14:00' },
  ],
  g7: [
    { id: 'gm1', sender: 'them', name: 'Marc Andriamampianina', text: 'Merci à tous pour la distribution de samedi !', time: '12:00' },
  ],
  g8: [
    { id: 'gm1', sender: 'them', name: 'Aïcha Ben Salem', text: 'Formation des nouveaux bénévoles mardi prochain.', time: '15:00' },
  ],
}

// ============================================================
// ESPACE DONS & FINANCEMENT
// ============================================================
export const financeCopyByType = {
  church: {
    title: 'Dons & Dîmes',
    subtitle: 'Soutenez la mission de votre église',
    pledgeCategories: [
      { id: 'dime', label: 'Dîme' },
      { id: 'offrande', label: 'Offrande' },
      { id: 'projet', label: 'Projet spécial' },
    ],
  },
  business: {
    title: 'Cotisations & Mécénat',
    subtitle: 'Participez au financement collectif de l\'entreprise',
    pledgeCategories: [
      { id: 'cotisation', label: 'Cotisation' },
      { id: 'mecenat', label: 'Mécénat' },
      { id: 'projet', label: 'Projet interne' },
    ],
  },
  ngo: {
    title: 'Projets & Financements',
    subtitle: 'Financez les missions et projets de l\'ONG',
    pledgeCategories: [
      { id: 'don', label: 'Don libre' },
      { id: 'parrainage', label: 'Parrainage' },
      { id: 'projet', label: 'Projet terrain' },
    ],
  },
}

export const pledgeFrequencies = [
  { id: 'once', label: 'Ponctuel' },
  { id: 'monthly', label: 'Mensuel' },
  { id: 'yearly', label: 'Annuel' },
]

// Devise préférée, configurable par chaque utilisateur (affichage
// uniquement en mode démo — pas de conversion de taux réelle).
export const currencies = [
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'USD', symbol: '$', label: 'Dollar US' },
  { code: 'XOF', symbol: 'FCFA', label: 'Franc CFA (UEMOA)' },
  { code: 'XAF', symbol: 'FCFA', label: 'Franc CFA (CEMAC)' },
  { code: 'GBP', symbol: '£', label: 'Livre Sterling' },
  { code: 'CAD', symbol: '$CA', label: 'Dollar Canadien' },
]

export function formatAmount(amount, currencyCode = 'EUR') {
  const currency = currencies.find(c => c.code === currencyCode) || currencies[0]
  return `${amount} ${currency.symbol}`
}

export const paymentInfo = {
  mobileMoney: [
    { provider: 'Orange Money', number: '+225 07 07 12 34 56' },
    { provider: 'MTN MoMo', number: '+225 05 05 98 76 54' },
  ],
  bank: {
    label: 'Virement bancaire',
    iban: 'CI93 CI001 0100 1234 5678 9012 34',
    bic: 'SGCICIAB',
  },
}

export const contributionHistory = [
  { id: 'h1', workspaceId: 'w1', date: '2026-08-01', amount: 50, category: 'Dîme', method: 'Mobile Money', status: 'Confirmé' },
  { id: 'h2', workspaceId: 'w1', date: '2026-07-15', amount: 20, category: 'Offrande', method: 'Virement', status: 'Confirmé' },
  { id: 'h3', workspaceId: 'w1', date: '2026-07-01', amount: 50, category: 'Dîme', method: 'Mobile Money', status: 'Confirmé' },
  { id: 'h4', workspaceId: 'w2', date: '2026-08-05', amount: 25, category: 'Cotisation', method: 'Virement', status: 'Confirmé' },
  { id: 'h5', workspaceId: 'w2', date: '2026-07-05', amount: 25, category: 'Cotisation', method: 'Virement', status: 'Confirmé' },
  { id: 'h6', workspaceId: 'w3', date: '2026-08-10', amount: 40, category: 'Don libre', method: 'Mobile Money', status: 'Confirmé' },
  { id: 'h7', workspaceId: 'w3', date: '2026-07-20', amount: 100, category: 'Parrainage', method: 'Virement', status: 'Confirmé' },
]

// ============================================================
// INTENTIONS DE PRIÈRE (Direct & Prières)
// ============================================================
export const prayerCategories = [
  { id: 'guérison', label: 'Guérison' },
  { id: 'famille', label: 'Famille' },
  { id: 'travail', label: 'Travail' },
  { id: 'remerciement', label: 'Remerciement' },
  { id: 'autre', label: 'Autre' },
]

export const prayerRequests = [
  {
    id: 'pr1',
    workspaceId: 'w1',
    author: 'Sophie Martin',
    avatar: 'SM',
    color: 'from-rose-500 to-pink-600',
    category: 'guérison',
    content: 'Merci de prier pour la santé de ma mère qui est hospitalisée cette semaine.',
    time: 'Il y a 1 h',
    prayCount: 18,
  },
  {
    id: 'pr2',
    workspaceId: 'w1',
    author: 'Thomas Dubois',
    avatar: 'TD',
    color: 'from-cyan-500 to-blue-600',
    category: 'travail',
    content: 'Je passe un entretien décisif vendredi, merci de m\'accompagner en prière.',
    time: 'Il y a 3 h',
    prayCount: 11,
  },
  {
    id: 'pr3',
    workspaceId: 'w1',
    author: 'Marie Lefort',
    avatar: 'ML',
    color: 'from-violet-500 to-purple-600',
    category: 'remerciement',
    content: 'Merci Seigneur pour la guérison complète de mon fils, gloire à Dieu !',
    time: 'Hier',
    prayCount: 34,
  },
]

export function buildPrayerEntry({ author, avatar, color, category, content, workspaceId }) {
  return {
    id: `pr-${Date.now()}`,
    workspaceId,
    author,
    avatar,
    color,
    category,
    content,
    time: 'À l\'instant',
    prayCount: 0,
  }
}

// ============================================================
// ASSISTANT ADMINISTRATIF — réponses simulées (mock), fondées sur les
// données réelles du workspace actif (règles simples par mots-clés,
// prêt à être remplacé par un vrai appel LLM plus tard).
// ============================================================
export function answerCommunityQuestion(question, { workspace, upcomingEvents = [], groups = [], financeCopy }) {
  const q = question.toLowerCase()

  if (/don|d[iî]me|cotisation|paiement|financ|mont(a|e)nt|devise/.test(q)) {
    const label = financeCopy ? `« ${financeCopy.title} »` : 'Finances'
    return `Vous pouvez contribuer depuis l'onglet ${label} : promesse de don, coordonnées Mobile Money / virement, et historique de vos contributions y sont disponibles. Vous pouvez aussi y configurer votre devise préférée.`
  }

  if (/[ée]v[ée]nement|agenda|calendrier|prochain|planning/.test(q)) {
    if (upcomingEvents.length > 0) {
      const next = upcomingEvents[0]
      const dateLabel = new Date(next.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
      return `Le prochain événement est « ${next.title} » le ${dateLabel} à ${next.time}, ${next.location}. Le calendrier complet est dans l'onglet Événements.`
    }
    return 'Aucun événement programmé pour le moment. Un administrateur peut en créer un depuis l\'onglet Événements.'
  }

  if (/groupe|rejoindre|cellule|minist[eè]re|communaut[ée]/.test(q)) {
    if (groups.length > 0) {
      const names = groups.slice(0, 3).map(g => g.name).join(', ')
      return `${workspace.name} compte ${groups.length} groupe${groups.length > 1 ? 's' : ''} actif${groups.length > 1 ? 's' : ''}, dont ${names}. Rendez-vous dans l'onglet Groupes pour les rejoindre, échanger et passer des appels de groupe.`
    }
    return "Rendez-vous dans l'onglet Groupes pour découvrir les communautés actives de votre espace."
  }

  if (/contact|responsable|pasteur|admin|joindre|appeler|t[ée]l[ée]phone/.test(q)) {
    return "Vous pouvez contacter les responsables directement depuis l'Annuaire : chaque fiche membre permet d'appeler en un clic depuis l'application."
  }

  if (/mot de passe|connexion|compte|inscription|code/.test(q)) {
    return "Pour les questions de connexion, utilisez le lien « Mot de passe oublié » sur l'écran d'authentification. Pour rejoindre une organisation, demandez son code d'invitation à un administrateur."
  }

  if (/horaire|heure|culte|r[ée]union|quand/.test(q)) {
    return "Les horaires précis de chaque rencontre sont indiqués dans sa fiche, onglet Événements."
  }

  if (/annuaire|comp[ée]tence|m[ée]tier|profession/.test(q)) {
    return "L'Annuaire recense les membres de votre espace avec leur métier et leurs compétences — pratique pour trouver de l'aide ou proposer la vôtre."
  }

  return `Je note votre question : « ${question} ». Un responsable de ${workspace.name} pourra vous apporter une réponse précise. En attendant, les onglets Canaux, Événements, Groupes et Annuaire couvrent la plupart des informations de la vie communautaire.`
}
