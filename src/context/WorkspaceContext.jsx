import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useCurrentUser } from './CurrentUserContext'
import { useOrganizations } from './OrganizationsContext'

const WorkspaceContext = createContext(null)

export function WorkspaceProvider({ children }) {
  const { currentUser } = useCurrentUser()
  const { organizations } = useOrganizations()

  // Un utilisateur ne voit que les organisations auxquelles il appartient
  // réellement (currentUser.memberships), avec son rôle propre à chacune.
  const memberWorkspaces = useMemo(() => {
    return currentUser.memberships
      .map(m => {
        const org = organizations.find(o => o.id === m.workspaceId)
        return org ? { ...org, role: m.role } : null
      })
      .filter(Boolean)
  }, [currentUser, organizations])

  const [activeWorkspaceId, setActiveWorkspaceId] = useState(memberWorkspaces[0]?.id)

  // Si l'utilisateur démo change (ou perd l'accès à l'espace actif), on
  // retombe sur son premier espace disponible.
  useEffect(() => {
    if (!memberWorkspaces.some(w => w.id === activeWorkspaceId)) {
      setActiveWorkspaceId(memberWorkspaces[0]?.id)
    }
  }, [memberWorkspaces, activeWorkspaceId])

  const activeWorkspace = useMemo(
    () => memberWorkspaces.find(w => w.id === activeWorkspaceId) || memberWorkspaces[0],
    [memberWorkspaces, activeWorkspaceId]
  )

  const value = {
    workspaces: memberWorkspaces,
    activeWorkspace,
    activeWorkspaceId,
    setActiveWorkspaceId,
  }

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used within a WorkspaceProvider')
  return ctx
}
