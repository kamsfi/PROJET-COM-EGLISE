import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useCurrentUser } from './CurrentUserContext'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

const NotificationsContext = createContext(null)

// Alertes "dans l'app" (pas de vraie notification système) : un badge
// s'allume sur l'onglet/la conversation/le groupe concerné dès qu'un
// message arrive ailleurs que là où l'utilisateur regarde en ce moment.
// Portée à la session — rien n'est persisté, tout redevient lu à la
// reconnexion (choix assumé, cf. discussion avec l'utilisateur).
export function NotificationsProvider({ children }) {
  const { currentUser, isAuthenticated } = useCurrentUser()
  const [unreadConversations, setUnreadConversations] = useState(new Set())
  const [unreadGroups, setUnreadGroups] = useState(new Set())
  const openConversationIdRef = useRef(null)
  const openGroupIdRef = useRef(null)

  const markConversationRead = useCallback((id) => {
    setUnreadConversations(prev => {
      if (!id || !prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

  const markGroupRead = useCallback((id) => {
    setUnreadGroups(prev => {
      if (!id || !prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

  // Déclaré "actuellement consulté" par Discussions.jsx / GroupDetailModal —
  // empêche de marquer non-lu ce que l'utilisateur regarde déjà, et marque
  // lu au moment où il ouvre le fil.
  const setOpenConversationId = useCallback((id) => {
    openConversationIdRef.current = id
    if (id) markConversationRead(id)
  }, [markConversationRead])

  const setOpenGroupId = useCallback((id) => {
    openGroupIdRef.current = id
    if (id) markGroupRead(id)
  }, [markGroupRead])

  useEffect(() => {
    if (!isSupabaseConfigured || !isAuthenticated || !currentUser?.id) return

    // Sans filtre : Realtime applique déjà les policies RLS de l'utilisateur
    // connecté, donc seuls les messages de ses propres conversations/groupes
    // sont reçus ici — pas besoin de connaître à l'avance leurs ids.
    const channel = supabase
      .channel('notifications-global')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        payload => {
          if (payload.new.sender_id === currentUser.id) return
          const id = payload.new.conversation_id
          if (id === openConversationIdRef.current) return
          setUnreadConversations(prev => (prev.has(id) ? prev : new Set(prev).add(id)))
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'group_messages' },
        payload => {
          if (payload.new.sender_id === currentUser.id) return
          const id = payload.new.group_id
          if (id === openGroupIdRef.current) return
          setUnreadGroups(prev => (prev.has(id) ? prev : new Set(prev).add(id)))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [isAuthenticated, currentUser?.id])

  const value = {
    unreadConversations,
    unreadGroups,
    hasUnreadDiscussions: unreadConversations.size > 0,
    hasUnreadGroups: unreadGroups.size > 0,
    markConversationRead,
    markGroupRead,
    setOpenConversationId,
    setOpenGroupId,
  }

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error('useNotifications must be used within a NotificationsProvider')
  return ctx
}
