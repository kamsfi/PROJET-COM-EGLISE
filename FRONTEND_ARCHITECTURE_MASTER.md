# ComHub — Frontend Architecture Master Document

**Version:** 2.1 · **Statut:** Frontend validé en mode Mock Data, prêt pour intégration backend
**Auteur:** Généré comme document de référence technique universel
**Objet:** Ce document décrit intégralement l'architecture frontend de ComHub, afin de servir de (1) documentation de passation, (2) cahier des charges technique pour le développement backend, et (3) modèle réutilisable ("blueprint") pour bootstrapper d'autres SaaS multi-tenants avec le même niveau de qualité UI/UX.

---

## 1. Vue d'Ensemble & Vision Produit

### 1.1 Objectif du produit

**ComHub** est une plateforme SaaS de communication **multi-organisations / multi-tenant**, conçue pour servir trois types de structures avec un seul et même socle applicatif :

| Type d'organisation | Vocabulaire adapté | Exemples de modules impactés |
|---|---|---|
| **Église** (`church`) | Cultes, Dîmes & Dons, Ministères | Direct & Prières, Finances ("Dons & Dîmes") |
| **Entreprise** (`business`) | Réunions, Cotisations, Équipes | Événements ("Réunion"), Finances ("Cotisations & Mécénat") |
| **ONG** (`ngo`) | Missions, Collectes, Bénévolat | Événements ("Mission"), Finances ("Projets & Financements") |

Le principe fondateur : **une seule base de code, un seul design system, un vocabulaire et des règles métier qui s'adaptent dynamiquement au type d'organisation active** (`activeWorkspace.type`), sans jamais dupliquer de composants.

Un même utilisateur peut appartenir à **plusieurs organisations simultanément** (ex : administrateur d'une église, simple membre d'une entreprise) et bascule de l'une à l'autre via un sélecteur d'espace, sans se reconnecter.

### 1.2 Stack technique exacte

| Couche | Technologie | Version | Rôle |
|---|---|---|---|
| Framework UI | **React** | 18.3.x | Composants fonctionnels + Hooks uniquement (aucun class component) |
| Bundler / Dev server | **Vite** | 5.3.x | Build, HMR, `vite build` pour la prod |
| Langage | **JavaScript (JSX)** | ES2020+ | Pas de TypeScript dans le code applicatif ; un fichier `.ts` de types de référence existe pour préparer le backend |
| Styling | **Tailwind CSS** | 3.4.x | Utility-first, aucun CSS custom hors `index.css` (keyframes, resets) |
| PostCSS | **PostCSS + Autoprefixer** | — | Pipeline de compilation Tailwind |
| Icônes | **lucide-react** | 0.408.x | Seule bibliothèque d'icônes utilisée dans tout le projet |
| State management | **React Context API** | natif | Aucune librairie tierce (pas de Redux/Zustand/Jotai) — 3 contextes dédiés (voir §2) |
| Routing | **Aucun** | — | Navigation par onglets internes (`activeTab` state), pas de react-router |
| Data layer (mock) | **`src/data.js`** | — | Source unique de données statiques + fonctions utilitaires métier, simulant les tables Postgres futures |
| Backend cible (préparé, non branché) | **Supabase (PostgreSQL + Auth)** | — | Schéma SQL complet fourni (`supabase/schema.sql`) + types (`src/types/database.types.ts`) |
| Gestion de paquets | **npm** | — | `package-lock.json` versionné |

### 1.3 Philosophie d'architecture

- **Mock-first, backend-ready** : toute la logique métier (RBAC, auto-affectation, multi-tenant) est implémentée côté frontend avec du state React local, mais **calquée fidèlement** sur un modèle relationnel PostgreSQL déjà écrit (triggers, RLS, enums). Migrer vers Supabase consiste à remplacer les fonctions `data.js` par des appels API, sans repenser l'UI.
- **Un contexte = une responsabilité** : séparation stricte entre "qui je suis" (CurrentUser), "quelles organisations existent" (Organizations) et "dans quel espace je travaille actuellement" (Workspace).
- **Composition over duplication** : les écrans qui semblent différents par organisation (Finances, Événements) sont en réalité **un seul composant** dont le contenu (libellés, catégories, icônes) est piloté par des tables de correspondance keyées par `type`.

---

## 2. Modèle de Données Frontend & Multi-Tenancy

### 2.1 Le sélecteur d'espace (`WorkspaceSwitcher`) et l'isolation des données

**Principe central : un utilisateur ne voit et ne peut agir que sur les données de l'organisation "active".**

```
currentUser.memberships = [
  { workspaceId: 'w1', role: 'admin'  },
  { workspaceId: 'w2', role: 'member' },
  { workspaceId: 'w3', role: 'leader' },
]
```

- Le `WorkspaceContext` croise `currentUser.memberships` avec le catalogue d'organisations (`OrganizationsContext.organizations`) pour produire la liste **strictement filtrée** des espaces accessibles à l'utilisateur, chacun enrichi de son rôle propre (`{ ...org, role }`).
- **Règle UX stricte** : si l'utilisateur n'a qu'**une seule** organisation, le `WorkspaceSwitcher` s'affiche en **mode simplifié non cliquable** (pas de dropdown, pas de chevron) — on ne montre jamais un sélecteur inutile. Dès 2 organisations ou plus, le dropdown complet apparaît (sidebar desktop + feuille modale mobile).
- **Isolation des données** : chaque entité métier du mock (`conversations`, `announcements`, `events`, `mediaItems`, `groups`, `members`, `contributionHistory`, `prayerRequests`) porte un champ `workspaceId`. **Chaque composant écran filtre systématiquement** ses données par `activeWorkspace.id` avant affichage — c'est l'équivalent frontend d'une policy RLS Postgres `where organization_id = :active`.
- **Réinitialisation au changement d'espace** : tout state local dérivé de l'espace actif (sélections, formulaires, onglets internes) est reset via un `useEffect` déclenché sur `[activeWorkspace.id]`, pour éviter les fuites d'état entre organisations.

### 2.2 Hiérarchie des organisations (Sièges & Annexes)

Au-delà de l'isolation stricte, ComHub modélise une **hiérarchie à un niveau** : une organisation "siège" peut avoir des "annexes" (sous-comptes) via un champ `parentId`.

```js
{ id: 'w1',  name: 'Église Centrale',              parentId: null }
{ id: 'w1b', name: 'Église Centrale — Annexe Nord', parentId: 'w1' }
```

- `getOrgFamilyIds(workspaceId)` calcule l'ensemble { siège, toutes ses annexes } — utilisé pour deux fonctionnalités transversales :
  - **Annuaire global** : toggle "Cet espace / Toute la dénomination" pour voir les membres de toutes les annexes.
  - **Canaux transversaux** : même toggle pour voir/lire les annonces de toute la dénomination (la **publication** reste, elle, strictement scopée à l'espace actif — un membre ne peut pas poster dans une annexe dont il n'est pas membre).
- Un admin de siège (rôle `admin` **et** `parentId === null`) dispose d'une action **"Créer une annexe"** (`CreateAnnexeModal`) : nom de l'annexe + désignation d'un leader local, qui devient automatiquement admin du nouveau sous-compte.
- Chaque organisation (siège ou annexe) porte son propre `joinCode` unique, généré côté `OrganizationsContext` (préfixe par type : `EGL-`, `ENT-`, `ONG-`).

### 2.3 RBAC — Gestion des rôles

Trois rôles, alignés sur l'enum PostgreSQL `member_role` :

| Rôle | Portée | Droits UI activés |
|---|---|---|
| `admin` | Par organisation (pas global) | Publier une annonce, créer un événement, créer un groupe avec règles, créer une annexe |
| `leader` | Par organisation | Publier une annonce, créer un événement, créer un groupe avec règles |
| `member` | Par organisation | Lecture, participation (chat, appel, don, inscription événement) — aucune action de publication/gestion |

**Point d'architecture critique : le rôle n'est jamais stocké sur l'utilisateur ni sur l'organisation — il vit exclusivement dans la relation d'appartenance** (`membership.role`), reproduisant fidèlement une table de jonction `organization_members(organization_id, profile_id, role)`. Un même utilisateur est donc `admin` ici, `member` là, `leader` ailleurs.

Le composant partagé `RoleBadge.jsx` centralise le rendu visuel (icône + couleur + libellé) pour `admin` / `leader` / `member`, garantissant une cohérence visuelle absolue dans toute l'app (sidebar, Profil, Annuaire, fiches groupe).

Les gates RBAC dans le code suivent systématiquement ce pattern :
```js
const canManage = activeWorkspace.role === 'admin' || activeWorkspace.role === 'leader'
{canManage && <button>Publier / Créer / Gérer</button>}
```

### 2.4 Architecture des 3 contextes React

```
<OrganizationsProvider>       ← catalogue des organisations (indépendant de l'utilisateur)
  <CurrentUserProvider>       ← session utilisateur (dépend potentiellement du catalogue pour les memberships)
    <WorkspaceProvider>       ← croise les deux ci-dessus pour dériver "mes espaces + mon rôle dans chacun"
      <AppShell />
    </WorkspaceProvider>
  </CurrentUserProvider>
</OrganizationsProvider>
```

#### `OrganizationsContext`
- **État** : `organizations` (catalogue statique `data.js` + annexes/organisations créées dynamiquement en session), `members` (annuaire statique + membres ajoutés à l'inscription).
- **API exposée** : `getOrgById`, `getOrgFamilyIds`, `findOrgByJoinCode`, `createOrganization({name, type})`, `createAnnexe({parentId, name, leaderName})`, `addMember(memberObj)`.
- **Rôle** : source de vérité neutre, ne connaît pas "qui est connecté".

#### `CurrentUserContext`
- **État** : `users` (comptes de démo + comptes créés via inscription), `currentUserId`, `isAuthenticated`.
- **API exposée** : `login(userId)`, `logout()`, `registerUser(userData)`, `updateCurrentUser(patch)` (photo, devise…), `findUserByIdentifier(phoneOrEmail)`.
- **Rôle** : gère la session (équivalent mock de Supabase Auth). `isAuthenticated=false` par défaut → l'app entière est **gatée** par l'écran d'authentification tant qu'aucun login n'a eu lieu.

#### `WorkspaceContext`
- **État dérivé** (pas de source de vérité propre) : `workspaces` (= memberships de `currentUser` résolus contre le catalogue `organizations`, rôle inclus), `activeWorkspaceId`, `activeWorkspace`.
- **API exposée** : `setActiveWorkspaceId`.
- **Auto-réparation** : si l'espace actif disparaît (changement d'utilisateur démo, perte d'accès), un `useEffect` retombe automatiquement sur le premier espace disponible.

**Règle de dépendance** : `WorkspaceContext` consomme `useCurrentUser()` et `useOrganizations()` en interne — il ne peut donc être monté qu'à l'intérieur des deux autres providers, d'où l'ordre d'imbrication ci-dessus.

---

## 3. Cartographie des Composants UI & Écrans

### 3.1 Coquille applicative

| Composant | Rôle |
|---|---|
| `App.jsx` | Racine : montage des providers, porte d'authentification (`if (!isAuthenticated) return <AuthModal/>`), sidebar desktop, header + bottom-nav mobile, routeur d'onglets (`TABS` array → `activeTab` state) |
| `AuthModal.jsx` | Coquille d'authentification : bascule Connexion / Inscription, panneau de connexion (téléphone ou e-mail + mot de passe), "Accès Démo Rapide", flux "mot de passe oublié" |
| `SignupWizard.jsx` | Inscription en 4 étapes (infos perso → compétences → rejoindre/créer une organisation → écran de confirmation d'auto-affectation) |
| `WorkspaceSwitcher.jsx` | Sélecteur d'organisation (variantes `sidebar` / `mobile`), mode simplifié si un seul espace |
| `Avatar.jsx` | Rendu unifié avatar : photo (`photoUrl`/`avatarUrl`) si disponible, sinon initiales sur dégradé de couleur |
| `RoleBadge.jsx` | Badge de rôle réutilisable (admin/leader/member + alias legacy pasteur/modérateur) |

### 3.2 Modules métier (onglets principaux)

| Composant | Rôle fonctionnel |
|---|---|
| `Discussions.jsx` | Messagerie **privée (1-à-1) uniquement** — liste de conversations, fil de messages, appels audio/vidéo intégrés (`CallScreen`) |
| `Canaux.jsx` | Fil d'annonces officielles de l'organisation — publication RBAC-gated (admin/leader), réactions emoji, toggle "toute la dénomination", synthèse IA |
| `Evenements.jsx` | Calendrier d'événements — mini-calendrier mensuel, filtres par catégorie (adaptés au type d'org), inscription, création d'événement RBAC-gated |
| `Mediatheque.jsx` | Bibliothèque de contenus audio/vidéo — recherche, filtres, mini-lecteur persistant |
| `Annuaire.jsx` | Répertoire des membres — recherche, filtres par compétence, fiche profil cliquable avec appel intégré, toggle dénomination |
| `Groupes.jsx` + `GroupDetailModal.jsx` + `GroupRulesModal.jsx` | Communautés internes — carte de groupe cliquable → vue plein écran à onglets **Discussion** (chat de groupe + appels de groupe) / **Infos** (règles d'auto-affectation, membres, upload photo personnelle, rejoindre/quitter) ; création de groupe avec constructeur de règles (genre / âge / statut marital) |
| `DirectPrieres.jsx` | Direct/Live — carte d'événement en direct, salle d'appel vidéo simulée (grille de participants), mur d'intentions de prière visible par la communauté (soumission + compteur "je prie pour cela") |
| `Finances.jsx` | Contributions — vocabulaire adapté par type d'org, formulaire de promesse (montant/catégorie/fréquence), sélecteur de devise personnel, coordonnées de paiement (Mobile Money/virement) copiables, historique, rapport financier généré par IA |
| `ProfilWorkspace.jsx` | Profil utilisateur — upload photo, informations personnelles, compétences, statistiques, liste "mes espaces de travail" (bascule + création d'annexe), sélecteur de profil de démonstration |

### 3.3 Modales & composants transverses

| Composant | Rôle |
|---|---|
| `CreateEventModal.jsx` | Formulaire de création d'événement |
| `CreateAnnexeModal.jsx` | Formulaire de création d'annexe/sous-compte |
| `MemberProfileModal.jsx` | Fiche profil d'un membre tiers (photo, rôle, compétences) + actions Appeler/Vidéo |
| `AIAssistantModal.jsx` | Génère une synthèse IA contextuelle (`kind`: `discussion` / `live` / `finance`) — état de chargement animé puis fiche structurée (Points clés / Décisions / 3ᵉ section adaptative) |
| `AdminAssistant.jsx` | **Assistant communautaire global**, bouton flottant persistant (toutes pages authentifiées) — chat questions/réponses basé sur les données réelles de l'espace actif (prochains événements, groupes, dons…) |
| `CallScreen.jsx` | UI d'appel partagée — mode 1-à-1 (avatar centré) ou mode groupe (grille de participants), contrôles micro/caméra/haut-parleur/raccrocher |
| `ruleBadges.js` | Utilitaire pur (non-JSX) : transforme un objet `rules` de groupe en badges lisibles (icône + libellé) |

### 3.4 Système de navigation

- **Pas de routeur d'URL.** Une constante `TABS` dans `App.jsx` associe `{ id, label, icon, component }` pour chaque module ; un seul `useState('discussions')` (`activeTab`) pilote l'affichage.
- **Desktop (`lg:` et +)** : sidebar fixe à gauche (logo, `WorkspaceSwitcher`, liste de navigation verticale, mini-carte utilisateur avec déconnexion).
- **Mobile (`< lg`)** : header compact (logo + `WorkspaceSwitcher` variante mobile + avatar/déconnexion) + barre de navigation basse **scrollable horizontalement** (pour absorber un nombre variable d'onglets sans casser le layout).
- Les écrans "profonds" (chat privé, fiche groupe, appel) utilisent un pattern de **bascule plein écran** plutôt qu'un routeur : le composant retourne un layout `fixed inset-0` différent selon son state interne, avec un bouton retour explicite (`ArrowLeft`).

---

## 4. Logique Métier & Fonctionnalités Clés Implémentées

### 4.1 Collecte de profil enrichi à l'inscription

Le `SignupWizard` collecte, en 3 étapes actives + 1 écran de résultat :

1. **Informations obligatoires** : nom complet, **téléphone** (identifiant principal), mot de passe, **sexe** (`M`/`F`), **date de naissance**. L'e-mail est **optionnel**, sauf s'il choisit de créer une organisation en tant que rôle **Admin** (alors redevient requis, avec message explicite).
2. **Profiling annuaire** : métier/domaine d'expertise (texte libre), compétences/talents (chips suggérés + ajout libre) — note explicite affichée : *"Ces informations permettent de remplir automatiquement votre fiche dans l'Annuaire."*
3. **Rejoignement** : soit rejoindre via **code d'organisation** (`join_code`), soit **créer une nouvelle organisation** (nom, type, rôle fondateur Responsable/Admin).

**Justification métier des champs** : le genre et la date de naissance ne sont pas de simples champs de profil — ils **alimentent directement** la logique d'auto-affectation aux groupes et un futur module de rappel d'anniversaire par IA.

### 4.2 Règles d'auto-affectation aux groupes

Miroir JavaScript exact d'un trigger PL/pgSQL PostgreSQL (`auto_assign_user_to_groups`, voir `supabase/schema.sql`) :

```js
function matchGroupRules(rules, { gender, age, maritalStatus }) {
  if (!rules) return false
  if (rules.gender && rules.gender !== gender) return false
  if (rules.min_age != null && (age == null || age < rules.min_age)) return false
  if (rules.max_age != null && (age == null || age > rules.max_age)) return false
  if (rules.marital_status && rules.marital_status !== maritalStatus) return false
  return true
}
```

- Chaque groupe porte un objet `rules: { gender, min_age, max_age, marital_status }` (tous les champs sont optionnels — un groupe sans aucune règle est "ouvert").
- **Au moment de l'inscription** (rejoindre une organisation existante uniquement — une organisation neuve n'a pas encore de groupes), le wizard calcule les groupes correspondants et les affiche dans l'écran de confirmation ("Groupes auto-affectés").
- **Constructeur de règles pour les admins/leaders** : `GroupRulesModal.jsx` expose une UI dédiée (segmented control Genre, deux champs numériques Âge min/max, segmented control Statut marital) pour créer un nouveau groupe avec ses règles, sans toucher au code.
- Les badges de règles (`ruleBadges.js`) rendent ces critères lisibles sur chaque carte de groupe : icône + libellé (ex: "Femme", "15-30 ans", "Marié(e)").

### 4.3 Gestion des hiérarchies / annexes

Voir §2.2 pour le détail. Résumé fonctionnel :
- Un admin de siège peut créer une annexe et désigner son leader local (mock : le leader est simplement nommé, pas encore un vrai compte lié — à câbler côté backend via la policy `org_members_insert_creator_bootstrap`).
- Les annexes apparaissent automatiquement dans l'Annuaire et les Canaux du siège via le toggle "Toute la dénomination", **sans que l'utilisateur n'ait besoin d'être membre direct de chaque annexe**.

### 4.4 Fonctionnalités transverses notables

| Fonctionnalité | Détail d'implémentation |
|---|---|
| **Appels intégrés à l'app** | Aucun lien `tel:` nulle part — tout appel (Discussions, Annuaire, Groupes) ouvre `CallScreen` en overlay plein écran, avec grille multi-participants pour les appels de groupe |
| **Synthèse IA contextuelle** | `buildAISummary({type, kind, subject})` — génère une fiche (Points clés / Décisions / 3ᵉ section adaptative selon `kind`: sujets de prière / actions à mener / recommandations financières) à partir de templates par type d'organisation |
| **Assistant communautaire global** | `answerCommunityQuestion(question, context)` — routage par mots-clés (regex) vers des réponses qui interrogent les **données réelles** de l'espace actif (prochain événement, nombre de groupes, etc.) plutôt que des réponses génériques statiques |
| **Devise personnalisable** | Chaque utilisateur choisit sa devise d'affichage (`currentUser.currency`, persistée via `updateCurrentUser`) — `formatAmount(amount, currencyCode)` centralise le formatage, sans conversion de taux réelle (mock) |
| **Photo de profil** | Upload via `<input type="file">` + `FileReader` → data URL stockée dans `currentUser.avatarUrl`, consommée partout via `Avatar.jsx`. Accessible depuis Profil & Espace **et** depuis la fiche Infos de tout groupe rejoint |
| **Mur de prières communautaire** | Toute soumission via `PrayerForm` est immédiatement visible dans une liste partagée (pas de trou noir UX), avec réaction "Je prie pour cela" compteur |

---

## 5. Design System & UX Standards

### 5.1 Palette de couleurs (Tailwind, mode sombre exclusif)

Définie dans `tailwind.config.js` (`darkMode: 'class'`, appliqué globalement sur `<html class="dark">`) :

```js
colors: {
  night: {
    900: '#020617',  // fond global de l'app
    800: '#0F172A',  // fond des cartes, sidebar, headers
    700: '#1E293B',  // fond des inputs, éléments interactifs secondaires
    600: '#334155',  // bordures/scrollbar
  },
  gold: {
    DEFAULT: '#D97706', // accent primaire (CTA, actif, badges)
    light:   '#F59E0B', // hover states
    dark:    '#B45309', // gradients
  },
}
```

- **Neutre** : nuances `slate-*` de Tailwind pour le texte (`text-slate-100` titres, `text-slate-400` corps, `text-slate-500/600` méta).
- **Sémantique** : `emerald` (succès/confirmation), `red` (danger/déconnexion d'appel), `sky` (info), couleurs vives (`rose`, `violet`, `cyan`, `fuchsia`…) uniquement pour les dégradés d'avatars (variété visuelle des utilisateurs).
- **Aucune couleur en dur** hors palette Tailwind — tout passe par les tokens `night-*` / `gold*`.

### 5.2 Typographie

- Police unique : **Inter** (Google Fonts, chargée dans `index.html` via `<link>`), fallback `system-ui, sans-serif`.
- Hiérarchie : `text-2xl font-bold` (titres d'écran), `text-lg font-bold` (titres de carte), `text-sm font-medium/semibold` (corps interactif), `text-xs`/`text-[11px]`/`text-[10px]` (méta-informations, labels).

### 5.3 Composants visuels récurrents ("mini design system")

| Pattern | Classes types |
|---|---|
| Carte standard | `bg-night-800 rounded-2xl border border-slate-800 p-4/p-5` |
| Carte cliquable | idem + `hover:border-gold/40 transition-colors`, wrapper `<button>` plutôt que `<div>` |
| Bouton primaire | `bg-gold hover:bg-gold-light text-white font-semibold rounded-xl active:scale-[0.98] transition-all` |
| Bouton secondaire | `bg-night-700 hover:bg-slate-700 text-slate-200/300 rounded-xl` |
| Badge/pill | `px-2.5 py-1 rounded-full text-xs font-medium` + fond translucide (`bg-gold/10 text-gold`) |
| Toggle segmenté | `flex bg-night-700 rounded-xl p-1` avec bouton actif `bg-gold text-white shadow` ou `bg-night-800 text-slate-100 shadow` |
| Modale bottom-sheet / centrée | `fixed inset-0 z-[6x] flex items-end sm:items-center justify-center` + backdrop `bg-black/60 backdrop-blur-sm` + carte `rounded-t-3xl sm:rounded-3xl animate-slide-up` |
| Modale plein écran (chat/appel/détail) | `fixed inset-0 z-5x/6x bg-night-900 flex flex-col`, header + zone scrollable + pied fixe |

### 5.4 Animations (`index.css`, keyframes custom)

| Classe | Usage |
|---|---|
| `animate-fade-in` | Apparition douce (0.3s) — quasi tous les changements d'écran/état |
| `animate-slide-up` | Entrée de carte/modale (0.35s, easing `cubic-bezier(0.16,1,0.3,1)`) |
| `animate-pulse-ring` | Halo pulsant (icônes d'appel entrant, statut "en direct bientôt") |
| `animate-live-pulse` | Clignotement opacité (indicateurs "EN DIRECT") |

Scrollbars personnalisées (fines, discrètes, teintées `slate-600`).

### 5.5 Responsive : règles strictes Mobile vs Desktop

- **Un seul point de rupture pilote la structure** : `lg:` (1024px).
  - `< lg` : header + bottom-nav mobile, contenu plein écran, modales en bottom-sheet.
  - `≥ lg` : sidebar fixe, pas de bottom-nav, modales centrées.
- **Jamais de composant dupliqué** entre mobile et desktop : ce sont les mêmes composants, seules les classes `hidden lg:flex` / `lg:hidden` arbitrent l'affichage.
- **`pb-safe`** (classe custom, `env(safe-area-inset-bottom)`) systématiquement appliquée aux barres fixes basses (input de chat, bottom-nav) pour la compatibilité encoches/gestes iOS.
- **Débordement horizontal proscrit** : toute liste potentiellement large (bottom-nav à nombreux onglets, chips de filtres) utilise `overflow-x-auto` plutôt que de casser le layout.

### 5.6 Icônes — `lucide-react`

- **Bibliothèque unique**, aucune autre source d'icônes (pas de FontAwesome, pas de SVG custom sauf logo).
- Taille standard `w-4 h-4` / `w-5 h-5` ; tailles non standard via valeurs arbitraires Tailwind (`w-[18px]`) plutôt que des classes fractionnaires invalides (`w-4.5` n'existe pas nativement).
- Une icône = un sens constant dans toute l'app (ex : `Phone` = appel partout, `Sparkles` = action IA partout, `UsersRound` = groupe partout) — **jamais de réutilisation contradictoire** d'une même icône pour deux concepts différents.

---

## 6. Guide de Réutilisation (Prompting Blueprint)

Bloc prêt à injecter dans un nouveau projet (Claude Code ou autre agent) pour répliquer ce niveau de qualité UI/UX en quelques minutes :

```
Construis le frontend d'un SaaS multi-tenant avec cette stack et ces conventions exactes :

STACK
- React 18 (function components + hooks uniquement) + Vite 5 + Tailwind CSS 3 (darkMode: 'class', app en dark mode permanent)
- Icônes : lucide-react exclusivement
- State : React Context API pur, pas de librairie externe. Pas de routeur — navigation par onglets internes (state `activeTab`).
- Police : Inter (Google Fonts).

MULTI-TENANCY
- Chaque utilisateur a une liste `memberships: [{ workspaceId, role }]`.
- 3 contextes imbriqués : OrganizationsProvider (catalogue d'orgs) > CurrentUserProvider (session) > WorkspaceProvider (dérive "mes espaces + mon rôle" en croisant les deux précédents).
- Un WorkspaceSwitcher affiche un dropdown si l'utilisateur a 2+ organisations, sinon un badge simplifié non cliquable.
- Toute entité métier porte un `workspaceId` ; tout composant liste filtre systématiquement par `activeWorkspace.id`.
- RBAC à 3 rôles (admin/leader/member) stocké PAR MEMBERSHIP, jamais globalement. Pattern de gate : `const canManage = activeWorkspace.role === 'admin' || activeWorkspace.role === 'leader'`.

DESIGN SYSTEM
- Palette : fond quasi-noir (#020617 / #0F172A / #1E293B), un unique accent chaud (ambre/or #D97706) pour tous les CTA et états actifs.
- Cartes : `bg-night-800 rounded-2xl border border-slate-800 p-4/5`.
- Boutons primaires : `bg-gold hover:bg-gold-light text-white font-semibold rounded-xl active:scale-[0.98]`.
- Deux patterns de modale : bottom-sheet/centrée pour les formulaires courts, plein écran (`fixed inset-0 bg-night-900`) pour chat/appel/détail riche.
- Responsive au seul point de rupture `lg:` : sidebar desktop fixe vs header + bottom-nav mobile scrollable horizontalement, jamais de composants dupliqués.
- Animations douces uniquement (`fade-in` 0.3s, `slide-up` 0.35s), pas d'animation agressive.

MOCK DATA BACKEND-READY
- Toute donnée vit dans un ou plusieurs fichiers `data.js` avec des fonctions utilitaires pures (ex: `matchRules`, `computeAge`, `formatAmount`) qui répliquent EXACTEMENT la logique métier qu'un trigger/RLS Postgres exécuterait plus tard — objectif : migrer vers un vrai backend sans réécrire l'UI.
- Fournir en parallèle un schéma SQL de référence (enums, tables, policies RLS, triggers) et un fichier de types TypeScript miroir, même si l'app elle-même est en JS pur.

Développe module par module (auth, structure multi-tenant, puis écrans métier), en gardant CHAQUE nouvel écran cohérent à 100% avec les patterns ci-dessus avant d'en écrire un nouveau.
```

### 6.1 Checklist de conformité (à valider avant tout nouvel écran)

- [ ] Les données affichées sont filtrées par `activeWorkspace.id` ?
- [ ] Les actions de gestion sont gatées par `activeWorkspace.role` ?
- [ ] Le state local propre à l'espace se réinitialise sur changement de `activeWorkspace.id` ?
- [ ] Les couleurs utilisées appartiennent à la palette `night-*` / `gold*` / `slate-*` sémantique ?
- [ ] Le composant fonctionne identiquement en layout mobile (`< lg`) et desktop (`≥ lg`) sans duplication de code ?
- [ ] Les icônes utilisées ont un sens déjà établi ailleurs dans l'app (pas de nouvelle signification pour une icône existante) ?
- [ ] Toute logique métier "auto-magique" (règles, calculs) est écrite comme une fonction pure testable, prête à être remplacée par un appel API ?

---

*Fin du document — ComHub 2.1, Frontend Architecture Master Reference.*
