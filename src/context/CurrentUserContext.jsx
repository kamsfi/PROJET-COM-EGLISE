import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { demoUsers as seedUsers } from '../data'

const CurrentUserContext = createContext(null)

export function CurrentUserProvider({ children }) {
  // `users` inclut les profils de démo de départ + tout compte créé via
  // le formulaire d'inscription pendant la session (state local, prêt à
  // être remplacé par de vrais appels Supabase Auth).
  const [users, setUsers] = useState(seedUsers)
  const [currentUserId, setCurrentUserId] = useState(seedUsers[0].id)
  // L'app démarre non connectée : l'écran d'authentification est le point
  // d'entrée (connexion, accès démo rapide, ou inscription).
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const currentUser = useMemo(
    () => users.find(u => u.id === currentUserId) || users[0],
    [users, currentUserId]
  )

  const login = useCallback((userId) => {
    setCurrentUserId(userId)
    setIsAuthenticated(true)
  }, [])

  const logout = useCallback(() => {
    setIsAuthenticated(false)
  }, [])

  // Connexion par numéro de téléphone (identifiant principal) ou par
  // e-mail (réservé en pratique aux comptes administrateurs).
  const findUserByIdentifier = useCallback((identifier) => {
    const value = identifier.trim().toLowerCase()
    if (!value) return null
    return users.find(u =>
      (u.phone && u.phone.replace(/\s+/g, '') === value.replace(/\s+/g, '')) ||
      (u.email && u.email.toLowerCase() === value)
    )
  }, [users])

  // Enregistre un nouveau compte (issu du formulaire d'inscription) sans
  // le connecter automatiquement — l'appelant décide quand basculer dessus.
  const registerUser = useCallback((userData) => {
    setUsers(prev => [...prev, userData])
    return userData
  }, [])

  // Met à jour le profil de l'utilisateur courant (photo, devise, etc.) —
  // state local, prêt à être relié à une mutation Supabase `profiles`.
  const updateCurrentUser = useCallback((patch) => {
    setUsers(prev => prev.map(u => u.id === currentUserId ? { ...u, ...patch } : u))
  }, [currentUserId])

  const value = {
    demoUsers: users,
    currentUserId,
    setCurrentUserId,
    currentUser,
    isAuthenticated,
    login,
    logout,
    findUserByIdentifier,
    registerUser,
    updateCurrentUser,
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
