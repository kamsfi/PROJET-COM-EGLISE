import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { workspaces as baseWorkspaces, members as baseMembers, typeDefaultColor, ORG_TYPE_FROM_DB } from '../data'

const OrganizationsContext = createContext(null)

function generateJoinCode(type) {
  const prefix = { church: 'EGL', business: 'ENT', ngo: 'ONG' }[type] || 'ORG'
  const num = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}-${num}`
}

// Convertit une ligne `organizations` Supabase (réelle) au format frontend
// attendu partout ailleurs (WorkspaceSwitcher, WorkspaceContext, etc.).
function mapRemoteOrg(dbOrg) {
  const type = ORG_TYPE_FROM_DB[dbOrg.type] || 'church'
  return {
    id: dbOrg.id,
    name: dbOrg.name,
    type,
    color: typeDefaultColor[type] || typeDefaultColor.church,
    membersCount: 1,
    parentId: dbOrg.parent_id ?? null,
    joinCode: dbOrg.code_invitation,
  }
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

  // Fusionne des organisations réelles (Supabase) issues des memberships de
  // l'utilisateur connecté dans le même catalogue que le mock, par upsert
  // sur `id` — appelée à chaque changement de session (peut être invoquée
  // plusieurs fois), jamais un ajout brut.
  const mergeRemoteOrganizations = useCallback((orgRows) => {
    if (!orgRows?.length) return
    setDynamicOrgs(prev => {
      const byId = new Map(prev.map(o => [o.id, o]))
      for (const row of orgRows) byId.set(row.id, mapRemoteOrg(row))
      return Array.from(byId.values())
    })
  }, [])

  // Fusionne des membres réels (Supabase, déjà mappés au format frontend
  // par l'appelant) dans le même catalogue que les membres mock, par upsert
  // sur `id` — appelée à chaque rechargement de l'Annuaire, jamais un ajout brut.
  const mergeRemoteMembers = useCallback((memberRows) => {
    if (!memberRows?.length) return
    setDynamicMembers(prev => {
      const byId = new Map(prev.map(m => [m.id, m]))
      for (const row of memberRows) byId.set(row.id, row)
      return Array.from(byId.values())
    })
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
    mergeRemoteOrganizations,
    mergeRemoteMembers,
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
