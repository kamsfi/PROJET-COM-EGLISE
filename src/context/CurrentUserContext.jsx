import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { demoUsers as seedUsers, getInitials } from '../data'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { useOrganizations } from './OrganizationsContext'

const CurrentUserContext = createContext(null)

// Charge le profil applicatif (`public.profiles`) et les adhésions réelles
// (`public.memberships` -> `public.organizations`) d'une session Supabase
// authentifiée. Le trigger `on_auth_user_created` garantit qu'une ligne
// `profiles` existe déjà dès qu'une session existe.
async function loadRemoteProfile(session) {
  const userId = session.user.id
  const [{ data: profileRow, error: profileErr }, { data: membershipRows, error: membershipErr }] =
    await Promise.all([
      supabase.from('profiles')
        .select('id, full_name, avatar_url, gender, date_of_birth, profession, skills')
        .eq('id', userId).single(),
      supabase.from('memberships')
        .select('role, organization_id, organizations(id, name, type, code_invitation, parent_id)')
        .eq('user_id', userId),
    ])
  if (profileErr || membershipErr) {
    console.warn('[ComHub] Échec du chargement du profil Supabase', profileErr || membershipErr)
    return null
  }
  return { profileRow, membershipRows }
}

// Reconstruit un objet `currentUser` compatible avec le format des
// utilisateurs mock (`data.js`) à partir d'une session + profil réels.
function mapProfileToUser(session, profileRow, membershipRows) {
  return {
    id: session.user.id,
    full_name: profileRow.full_name,
    email: session.user.email,
    phone: session.user.phone || '',
    gender: profileRow.gender === 'homme' ? 'M' : profileRow.gender === 'femme' ? 'F' : null,
    birth_date: profileRow.date_of_birth,
    marital_status: null,
    profession: profileRow.profession || '',
    skills: profileRow.skills || [],
    avatar: getInitials(profileRow.full_name),
    avatarUrl: profileRow.avatar_url || null,
    memberSince: `Membre depuis ${new Date(session.user.created_at ?? Date.now()).getFullYear()}`,
    stats: { events: 0, prayers: 0, donations: 0 },
    memberships: (membershipRows || []).map(m => ({ workspaceId: m.organization_id, role: m.role })),
  }
}

export function CurrentUserProvider({ children }) {
  const { mergeRemoteOrganizations } = useOrganizations()

  // `users` inclut les profils de démo de départ + tout compte créé via
  // le formulaire d'inscription pendant la session (state local mock).
  const [users, setUsers] = useState(seedUsers)
  const [currentUserId, setCurrentUserId] = useState(seedUsers[0].id)
  // Authentification "démo" (Accès Démo Rapide / mode Supabase non configuré).
  const [mockAuthenticated, setMockAuthenticated] = useState(false)

  // Session Supabase réelle : profil chargé depuis `public.profiles` +
  // `public.memberships`, tenu à jour via `onAuthStateChange`.
  const [sessionProfile, setSessionProfile] = useState(null)
  const [sessionLoading, setSessionLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let cancelled = false

    async function applySession(session) {
      if (!session) {
        if (!cancelled) { setSessionProfile(null); setSessionLoading(false) }
        return
      }
      const loaded = await loadRemoteProfile(session)
      if (cancelled) return
      if (!loaded) { setSessionLoading(false); return }
      mergeRemoteOrganizations(loaded.membershipRows.map(m => m.organizations).filter(Boolean))
      setSessionProfile(mapProfileToUser(session, loaded.profileRow, loaded.membershipRows))
      setSessionLoading(false)
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session)
    })

    return () => { cancelled = true; subscription.unsubscribe() }
  }, [mergeRemoteOrganizations])

  const currentUser = useMemo(() => {
    const base = sessionProfile ?? users.find(u => u.id === currentUserId) ?? users[0]
    return { ...base, memberships: base.memberships ?? [] }
  }, [sessionProfile, users, currentUserId])

  const isAuthenticated = Boolean(sessionProfile) || mockAuthenticated

  const login = useCallback((userId) => {
    setCurrentUserId(userId)
    setMockAuthenticated(true)
  }, [])

  const logout = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) await supabase.auth.signOut()
    }
    setMockAuthenticated(false)
  }, [])

  // Connexion démo par e-mail (identifiant principal).
  const findUserByIdentifier = useCallback((identifier) => {
    const value = identifier.trim().toLowerCase()
    if (!value) return null
    return users.find(u => u.email && u.email.toLowerCase() === value)
  }, [users])

  // Enregistre un nouveau compte (issu du formulaire d'inscription) sans
  // le connecter automatiquement — l'appelant décide quand basculer dessus.
  const registerUser = useCallback((userData) => {
    setUsers(prev => [...prev, userData])
    return userData
  }, [])

  // Met à jour l'utilisateur courant (photo, devise, etc.). Pour une
  // session réelle, la mise à jour reste locale (non persistée en base
  // pour l'instant — Storage/Phase suivante).
  const updateCurrentUser = useCallback((patch) => {
    if (sessionProfile) {
      setSessionProfile(prev => ({ ...prev, ...patch }))
      return
    }
    setUsers(prev => prev.map(u => u.id === currentUserId ? { ...u, ...patch } : u))
  }, [sessionProfile, currentUserId])

  // Reflète localement une nouvelle adhésion réelle (ex: après la création
  // d'une annexe) sans attendre un rechargement complet de session.
  const addMembership = useCallback((workspaceId, role) => {
    setSessionProfile(prev => (prev ? { ...prev, memberships: [...prev.memberships, { workspaceId, role }] } : prev))
  }, [])

  const value = {
    demoUsers: users,
    currentUserId,
    setCurrentUserId,
    currentUser,
    isAuthenticated,
    sessionLoading,
    login,
    logout,
    findUserByIdentifier,
    registerUser,
    updateCurrentUser,
    addMembership,
  }

  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  )
}

export function useCurrentUser() {
  const ctx = useContext(CurrentUserContext)
  if (!ctx) throw new Error('useCurrentUser must be used within a CurrentUserProvider')
  return ctx
}
