import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { workspaces as baseWorkspaces, members as baseMembers, typeDefaultColor } from '../data'

const OrganizationsContext = createContext(null)

function generateJoinCode(type) {
  const prefix = { church: 'EGL', business: 'ENT', ngo: 'ONG' }[type] || 'ORG'
  const num = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}-${num}`
}

export function OrganizationsProvider({ children }) {
  const [dynamicOrgs, setDynamicOrgs] = useState([])
  const [dynamicMembers, setDynamicMembers] = useState([])

  const organizations = useMemo(() => [...baseWorkspaces, ...dynamicOrgs], [dynamicOrgs])
  const members = useMemo(() => [...baseMembers, ...dynamicMembers], [dynamicMembers])

  const getOrgById = useCallback(
    (id) => organizations.find(o => o.id === id),
    [organizations]
  )

  const findOrgByJoinCode = useCallback((code) => {
    if (!code) return null
    const normalized = code.trim().toUpperCase()
    return organizations.find(o => o.joinCode?.toUpperCase() === normalized) || null
  }, [organizations])

  // Le siège/dénomination et ses annexes se voient dans l'annuaire global
  // et partagent des canaux transversaux, même sans appartenance directe.
  const getOrgFamilyIds = useCallback((workspaceId) => {
    const org = organizations.find(o => o.id === workspaceId)
    if (!org) return [workspaceId]
    const rootId = org.parentId || org.id
    return organizations.filter(o => o.id === rootId || o.parentId === rootId).map(o => o.id)
  }, [organizations])

  const addOrganization = useCallback(({ name, type, parentId = null }) => {
    const parent = parentId ? organizations.find(o => o.id === parentId) : null
    const resolvedType = type || parent?.type || 'church'
    const org = {
      id: `org-${Date.now()}`,
      name,
      type: resolvedType,
      color: parent?.color || typeDefaultColor[resolvedType] || typeDefaultColor.church,
      membersCount: 1,
      parentId,
      joinCode: generateJoinCode(resolvedType),
    }
    setDynamicOrgs(prev => [...prev, org])
    return org
  }, [organizations])

  // Créer une organisation racine (siège) — utilisé par l'inscription
  // "Créer une nouvelle organisation".
  const createOrganization = useCallback(
    ({ name, type }) => addOrganization({ name, type, parentId: null }),
    [addOrganization]
  )

  // Créer une annexe/sous-compte rattaché à une organisation existante
  // (réservé aux admins du siège — vérifié côté UI appelante).
  const createAnnexe = useCallback(({ parentId, name, leaderName }) => {
    const annexe = addOrganization({ parentId, name })
    return { ...annexe, leaderName }
  }, [addOrganization])

  const addMember = useCallback((member) => {
    setDynamicMembers(prev => [...prev, member])
  }, [])

  const value = {
    organizations,
    members,
    getOrgById,
    getOrgFamilyIds,
    findOrgByJoinCode,
    createOrganization,
    createAnnexe,
    addMember,
  }

  return (
    <OrganizationsContext.Provider value={value}>
      {children}
    </OrganizationsContext.Provider>
  )
}

export function useOrganizations() {
  const ctx = useContext(OrganizationsContext)
  if (!ctx) throw new Error('useOrganizations must be used within an OrganizationsProvider')
  return ctx
}
