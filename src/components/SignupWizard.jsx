import { useState } from 'react'
import {
  ChevronLeft, User, Mail, Phone, Lock, Cake, VenetianMask, Briefcase, X as XIcon,
  Hash, Building2, Check, PartyPopper, UsersRound, BookUser, CakeSlice,
} from 'lucide-react'
import { groups, genderLabels, workspaceTypeLabels, typeDefaultColor, computeAge, matchGroupRules, getInitials, ORG_TYPE_FROM_DB, ORG_TYPE_TO_DB, generateJoinCode, pickColor } from '../data'
import { useCurrentUser } from '../context/CurrentUserContext'
import { useOrganizations } from '../context/OrganizationsContext'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import RoleBadge from './RoleBadge'

const SUGGESTED_SKILLS = [
  'Musique', 'Média', 'Accueil', 'Enseignement', 'Informatique',
  'Santé', 'Finance', 'Logistique', 'Communication', 'Cuisine',
]

// Clé localStorage utilisée quand la confirmation e-mail est activée côté
// Supabase : la session n'existe pas encore juste après signUp(), donc la
// RLS empêche d'écrire dans `memberships`. On rejoue cette adhésion en
// attente dès la première connexion réussie (voir AuthModal.jsx).
export const PENDING_JOIN_STORAGE_KEY = 'comhub_pending_join'

// Clé localStorage utilisée quand la confirmation e-mail est activée côté
// Supabase et que l'utilisateur crée une NOUVELLE organisation (au lieu d'en
// rejoindre une) : la session n'existe pas encore juste après signUp(), donc
// la RLS empêche d'écrire dans `organizations`/`memberships`. On rejoue cette
// création dès la première connexion réussie (voir AuthModal.jsx).
export const PENDING_CREATE_ORG_STORAGE_KEY = 'comhub_pending_create_org'

// Crée une organisation réelle + rattache son fondateur comme admin. Utilisé
// à la fois juste après signUp() (session immédiate) et lors de la reprise
// différée au premier login (voir completePendingOrgCreation dans AuthModal).
// Le fondateur devient TOUJOURS admin : la policy RLS d'amorçage de
// `memberships` (aucun membre existant) n'autorise que role = 'admin' pour
// l'auto-insertion, jamais 'leader'.
export async function createRealOrganization({ name, type, userId }) {
  const { data: orgRow, error: orgError } = await supabase.from('organizations')
    .insert({
      name,
      type: ORG_TYPE_TO_DB[type] || 'eglise',
      code_invitation: generateJoinCode(type),
      created_by: userId,
    })
    .select('id, name, type, code_invitation, parent_id')
    .single()
  if (orgError) throw orgError

  const { error: membershipError } = await supabase.from('memberships')
    .insert({ user_id: userId, organization_id: orgRow.id, role: 'admin' })
  if (membershipError) throw membershipError

  return orgRow
}

function StepHeader({ step, totalSteps, title, subtitle, onBack }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <button
          type="button"
          onClick={onBack}
          className="p-1.5 -ml-1.5 rounded-full hover:bg-slate-700 text-slate-400 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 flex items-center gap-1">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${i < step ? 'bg-gold' : 'bg-night-700'}`}
            />
          ))}
        </div>
        <span className="text-[11px] text-slate-500 shrink-0">{Math.min(step, totalSteps)}/{totalSteps}</span>
      </div>
      <h2 className="text-lg font-bold text-slate-100">{title}</h2>
      {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
    </div>
  )
}

export default function SignupWizard({ onBackToLogin }) {
  const { registerUser, login } = useCurrentUser()
  const { findOrgByJoinCode, createOrganization, addMember } = useOrganizations()

  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [supabaseNotice, setSupabaseNotice] = useState('')

  // Step 1 — informations personnelles
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [gender, setGender] = useState('')
  const [birthDate, setBirthDate] = useState('')

  // Step 2 — compétences & profiling
  const [profession, setProfession] = useState('')
  const [skills, setSkills] = useState([])
  const [skillInput, setSkillInput] = useState('')

  // Step 3 — rejoignement
  const [joinMode, setJoinMode] = useState('join')
  const [joinCode, setJoinCode] = useState('')
  const [orgName, setOrgName] = useState('')
  const [orgType, setOrgType] = useState('')
  const [orgRole, setOrgRole] = useState('leader')

  // Step 4 — résultat de l'auto-affectation
  const [result, setResult] = useState(null)

  const toggleSkill = (skill) => {
    setSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill])
  }

  const addCustomSkill = (e) => {
    e.preventDefault()
    const value = skillInput.trim()
    if (!value) return
    setSkills(prev => prev.includes(value) ? prev : [...prev, value])
    setSkillInput('')
  }

  const goToStep2 = (e) => {
    e.preventDefault()
    setError('')
    if (!fullName.trim() || !email.trim() || password.length < 6 || !gender || !birthDate) {
      setError('Merci de compléter tous les champs obligatoires (mot de passe : 6 caractères min.).')
      return
    }
    setStep(2)
  }

  const goToStep3 = (e) => {
    e.preventDefault()
    setError('')
    if (!profession.trim()) {
      setError('Merci de renseigner votre métier ou domaine d\'expertise.')
      return
    }
    setStep(3)
  }

  const handleFinalSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSupabaseNotice('')

    let org
    let role
    let supabaseOrgId = null // renseigné uniquement si l'organisation rejointe existe réellement dans Supabase

    if (joinMode === 'join') {
      org = findOrgByJoinCode(joinCode)
      if (org) {
        role = 'member'
      } else if (isSupabaseConfigured) {
        // Le code ne correspond à aucune organisation de démonstration locale :
        // on tente une résolution côté Supabase via la RPC dédiée (contourne
        // la RLS "membres uniquement" le temps de vérifier le code).
        const { data: matches, error: lookupError } = await supabase
          .rpc('find_organization_by_code', { p_code: joinCode.trim() })
        const dbOrg = matches?.[0]
        if (lookupError || !dbOrg) {
          setError('Code d\'organisation introuvable. Vérifiez le code auprès de votre organisation.')
          return
        }
        supabaseOrgId = dbOrg.id
        const frontendType = ORG_TYPE_FROM_DB[dbOrg.type] || 'church'
        org = {
          id: dbOrg.id,
          name: dbOrg.name,
          type: frontendType,
          color: typeDefaultColor[frontendType] || typeDefaultColor.church,
          joinCode: dbOrg.code_invitation,
        }
        role = 'member'
      } else {
        setError('Code d\'organisation introuvable. Vérifiez le code auprès de votre organisation.')
        return
      }
    } else {
      if (!orgName.trim() || !orgType) {
        setError('Merci de renseigner le nom et le type de la nouvelle organisation.')
        return
      }
      // Le fondateur d'une organisation en devient toujours administrateur
      // (voir createRealOrganization) — en mode démo uniquement, le sélecteur
      // "Responsable" reste disponible.
      role = isSupabaseConfigured ? 'admin' : orgRole
      if (!isSupabaseConfigured) {
        org = createOrganization({ name: orgName.trim(), type: orgType })
      }
      // Branche réelle : org est créée plus bas, une fois l'utilisateur
      // authentifié (created_by/admin exigent un auth.uid()).
    }

    // Inscription réelle Supabase Auth (si .env.local est configuré) : crée
    // la ligne auth.users, ce qui déclenche le trigger `on_auth_user_created`
    // et alimente `profiles` avec les metadata transmises ci-dessous.
    // Tant que l'app n'est pas connectée, ce bloc est simplement ignoré et
    // tout continue de fonctionner en données de démonstration locales.
    let supabaseUserId = null
    if (isSupabaseConfigured) {
      setSubmitting(true)
      const genderForDb = gender === 'M' ? 'homme' : gender === 'F' ? 'femme' : null
      const metadata = {
        full_name: fullName.trim(),
        gender: genderForDb,
        date_of_birth: birthDate,
        profession: profession.trim(),
        skills,
      }
      const { data, error: authError } = await supabase.auth.signUp(
        { email: email.trim(), password, options: { data: metadata } }
      )
      setSubmitting(false)

      if (authError) {
        setError(`Supabase : ${authError.message}`)
        return
      }

      supabaseUserId = data.user?.id ?? null

      // Rattachement réel à l'organisation Supabase rejointe. Passe par la RPC
      // `join_organization_by_code`, qui revérifie le code côté serveur avant
      // d'écrire dans `memberships` (la RLS n'autorise plus l'auto-inscription
      // directe depuis le client) — déclenche aussi l'auto-affectation aux
      // groupes côté base de données.
      if (supabaseOrgId && supabaseUserId) {
        if (data.session) {
          // Session active tout de suite (confirmation e-mail désactivée).
          const { error: joinError } = await supabase
            .rpc('join_organization_by_code', { p_code: joinCode.trim() })
          if (joinError) {
            setError(`Compte créé, mais l'adhésion à l'organisation a échoué : ${joinError.message}`)
            return
          }
        } else {
          // Confirmation e-mail/SMS requise : pas de session, donc la RPC
          // (qui exige auth.uid()) échouerait. On mémorise le code pour
          // finaliser l'adhésion à la première connexion réussie (voir AuthModal.jsx).
          localStorage.setItem(
            PENDING_JOIN_STORAGE_KEY,
            JSON.stringify({ userId: supabaseUserId, joinCode: joinCode.trim() })
          )
        }
      }

      // Création réelle de la nouvelle organisation (branche "create"),
      // symétrique au rattachement ci-dessus pour la branche "join".
      let pendingOrgCreation = false
      if (joinMode !== 'join' && supabaseUserId) {
        if (data.session) {
          try {
            const orgRow = await createRealOrganization({ name: orgName.trim(), type: orgType, userId: supabaseUserId })
            supabaseOrgId = orgRow.id
            org = { id: orgRow.id, name: orgRow.name, type: ORG_TYPE_FROM_DB[orgRow.type] || 'church', color: typeDefaultColor[orgType] || typeDefaultColor.church, joinCode: orgRow.code_invitation }
          } catch (createErr) {
            setError(`Compte créé, mais la création de l'organisation a échoué : ${createErr.message}`)
            return
          }
        } else {
          // Confirmation e-mail/SMS requise : pas de session, donc l'insertion
          // (qui exige auth.uid()) échouerait. On mémorise la demande pour la
          // rejouer à la première connexion réussie (voir AuthModal.jsx).
          localStorage.setItem(
            PENDING_CREATE_ORG_STORAGE_KEY,
            JSON.stringify({ userId: supabaseUserId, orgName: orgName.trim(), orgType })
          )
          pendingOrgCreation = true
          org = { id: null, name: orgName.trim(), type: orgType, color: typeDefaultColor[orgType] || typeDefaultColor.church }
        }
      }

      if (data.user && !data.session) {
        setSupabaseNotice(
          'Compte Supabase créé : vérifiez votre boîte mail pour confirmer votre adresse avant de pouvoir vous connecter.'
          + (supabaseOrgId ? ' Votre adhésion à ' + org.name + ' sera finalisée automatiquement dès votre première connexion.' : '')
          + (pendingOrgCreation ? ' « ' + org.name + ' » sera créée automatiquement dès votre première connexion.' : '')
        )
      }
    }

    const age = computeAge(birthDate)
    const assignedGroups = joinMode === 'join'
      ? groups.filter(g => g.workspaceId === org.id && matchGroupRules(g.rules, { gender, age, maritalStatus: null }))
      : []

    const avatar = getInitials(fullName)
    const color = pickColor(fullName + phone)
    const newUser = {
      id: supabaseUserId || `user-${Date.now()}`,
      full_name: fullName.trim(),
      email: email.trim() || null,
      phone: phone.trim(),
      gender,
      birth_date: birthDate,
      marital_status: null,
      profession: profession.trim(),
      skills,
      avatar,
      memberSince: `Membre depuis ${new Date().getFullYear()}`,
      stats: { events: 0, prayers: 0, donations: 0 },
      memberships: [{ workspaceId: org.id, role }],
    }

    registerUser(newUser)
    addMember({
      id: `m-${Date.now()}`,
      workspaceId: org.id,
      full_name: newUser.full_name,
      avatar,
      color,
      role,
      profession: newUser.profession,
      skills: newUser.skills,
      phone: newUser.phone,
      email: newUser.email || '—',
    })

    setResult({ org, role, assignedGroups, newUser })
    setStep(4)
  }

  const handleEnterApp = () => {
    if (result) login(result.newUser.id)
  }

  return (
    <div>
      {step === 1 && (
        <form onSubmit={goToStep2}>
          <StepHeader
            step={1} totalSteps={3}
            title="Créer votre compte" subtitle="Informations personnelles"
            onBack={onBackToLogin}
          />
          <div className="space-y-3">
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="Nom complet"
                className="w-full bg-night-700 text-slate-100 placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold/50 transition-all"
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="E-mail"
                className="w-full bg-night-700 text-slate-100 placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold/50 transition-all"
              />
            </div>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="Numéro de téléphone (optionnel)"
                className="w-full bg-night-700 text-slate-100 placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold/50 transition-all"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Mot de passe"
                className="w-full bg-night-700 text-slate-100 placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold/50 transition-all"
              />
            </div>

            <div>
              <p className="text-[11px] text-slate-500 mb-1.5 px-1">Sexe</p>
              <div className="flex bg-night-700 rounded-xl p-1">
                {['M', 'F'].map(g => (
                  <button
                    key={g} type="button" onClick={() => setGender(g)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                      gender === g ? 'bg-gold text-white shadow' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {genderLabels[g]}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <Cake className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                type="date" required value={birthDate} onChange={e => setBirthDate(e.target.value)}
                style={{ colorScheme: 'dark' }}
                className="w-full bg-night-700 text-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold/50 transition-all"
              />
            </div>
            <p className="text-[11px] text-slate-500 px-1 flex items-start gap-1.5">
              <VenetianMask className="w-3 h-3 mt-0.5 shrink-0" />
              Le sexe et l'âge permettent l'affectation automatique aux groupes (ex: Ministère des Hommes, Groupe Jeunesse) et les rappels d'anniversaire par Cordée AI.
            </p>
          </div>

          {error && <p className="text-xs text-red-400 mt-3 px-1">{error}</p>}

          <button
            type="submit"
            className="w-full bg-gold hover:bg-gold-light text-white font-semibold py-3 rounded-xl transition-all active:scale-[0.98] mt-4"
          >
            Continuer
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={goToStep3}>
          <StepHeader
            step={2} totalSteps={3}
            title="Annuaire & compétences" subtitle="Complétez votre fiche communautaire"
            onBack={() => setStep(1)}
          />
          <div className="space-y-3">
            <div className="relative">
              <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text" required value={profession} onChange={e => setProfession(e.target.value)}
                placeholder="Métier / domaine d'expertise (ex: Développeur)"
                className="w-full bg-night-700 text-slate-100 placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold/50 transition-all"
              />
            </div>

            <div>
              <p className="text-[11px] text-slate-500 mb-1.5 px-1">Centres d'intérêt / talents</p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {SUGGESTED_SKILLS.map(skill => {
                  const active = skills.includes(skill)
                  return (
                    <button
                      key={skill} type="button" onClick={() => toggleSkill(skill)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        active ? 'bg-gold text-white' : 'bg-night-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {skill}
                    </button>
                  )
                })}
              </div>
              <div className="relative">
                <input
                  type="text" value={skillInput} onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addCustomSkill(e) }}
                  placeholder="Ajouter une autre compétence..."
                  className="w-full bg-night-700 text-slate-100 placeholder-slate-500 rounded-xl pl-4 pr-16 py-2 text-sm outline-none focus:ring-2 focus:ring-gold/50 transition-all"
                />
                <button
                  type="button" onClick={addCustomSkill}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-night-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
                >
                  Ajouter
                </button>
              </div>
              {skills.filter(s => !SUGGESTED_SKILLS.includes(s)).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {skills.filter(s => !SUGGESTED_SKILLS.includes(s)).map(skill => (
                    <span key={skill} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gold/15 text-gold text-xs font-medium">
                      {skill}
                      <button type="button" onClick={() => toggleSkill(skill)}>
                        <XIcon className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-500 px-1 flex items-start gap-1.5">
              <BookUser className="w-3 h-3 mt-0.5 shrink-0" />
              Ces informations permettent de remplir automatiquement votre fiche dans l'Annuaire de la communauté.
            </p>
          </div>

          {error && <p className="text-xs text-red-400 mt-3 px-1">{error}</p>}

          <button
            type="submit"
            className="w-full bg-gold hover:bg-gold-light text-white font-semibold py-3 rounded-xl transition-all active:scale-[0.98] mt-4"
          >
            Continuer
          </button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleFinalSubmit}>
          <StepHeader
            step={3} totalSteps={3}
            title="Rejoindre une organisation" subtitle="Dernière étape avant votre arrivée sur Cordée"
            onBack={() => setStep(2)}
          />

          <div className="flex bg-night-700 rounded-xl p-1 mb-4">
            <button
              type="button" onClick={() => setJoinMode('join')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                joinMode === 'join' ? 'bg-night-800 text-slate-100 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Rejoindre une organisation
            </button>
            <button
              type="button" onClick={() => setJoinMode('create')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                joinMode === 'create' ? 'bg-night-800 text-slate-100 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Créer une organisation
            </button>
          </div>

          {joinMode === 'join' ? (
            <div className="space-y-2">
              <div className="relative">
                <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text" value={joinCode} onChange={e => setJoinCode(e.target.value)}
                  placeholder="Code d'organisation / d'invitation (ex: EGL-4F82)"
                  className="w-full bg-night-700 text-slate-100 placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold/50 transition-all uppercase placeholder:normal-case"
                />
              </div>
              <p className="text-[11px] text-slate-500 px-1">Codes de démonstration : EGL-4F82 (Église), ENT-7731 (Entreprise), ONG-5290 (ONG).</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text" value={orgName} onChange={e => setOrgName(e.target.value)}
                  placeholder="Nom de la structure"
                  className="w-full bg-night-700 text-slate-100 placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold/50 transition-all"
                />
              </div>
              <select
                value={orgType} onChange={e => setOrgType(e.target.value)}
                className="w-full bg-night-700 text-slate-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold/50 transition-all"
              >
                <option value="" disabled>Type d'organisation</option>
                {Object.entries(workspaceTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              {isSupabaseConfigured ? (
                <p className="text-[11px] text-slate-500 px-1">Vous serez administrateur de cette nouvelle organisation.</p>
              ) : (
                <div>
                  <p className="text-[11px] text-slate-500 mb-1.5 px-1">Votre rôle</p>
                  <div className="flex bg-night-700 rounded-xl p-1">
                    {[{ id: 'leader', label: 'Responsable' }, { id: 'admin', label: 'Admin' }].map(r => (
                      <button
                        key={r.id} type="button" onClick={() => setOrgRole(r.id)}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                          orgRole === r.id ? 'bg-gold text-white shadow' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {error && <p className="text-xs text-red-400 mt-3 px-1">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gold hover:bg-gold-light disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all active:scale-[0.98] mt-4"
          >
            {submitting ? 'Création du compte…' : 'Créer mon compte'}
          </button>
        </form>
      )}

      {step === 4 && result && (
        <div className="animate-fade-in">
          <div className="flex flex-col items-center text-center mb-5">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3">
              <PartyPopper className="w-7 h-7 text-emerald-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-100">Bienvenue, {result.newUser.full_name.split(' ')[0]} !</h2>
            <p className="text-xs text-slate-400 mt-1">Votre compte Cordée a été créé et affecté automatiquement.</p>
          </div>

          {supabaseNotice && (
            <div className="bg-sky-500/10 border border-sky-500/30 rounded-xl p-3 mb-4 animate-fade-in">
              <p className="text-xs text-sky-400">{supabaseNotice}</p>
            </div>
          )}

          <div className="space-y-2.5">
            <div className="flex items-center gap-3 bg-night-700/60 rounded-xl px-3 py-2.5">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${result.org.color} flex items-center justify-center shrink-0`}>
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 truncate">{result.org.name}</p>
                <p className="text-[11px] text-slate-500">{workspaceTypeLabels[result.org.type]} · code {result.org.joinCode}</p>
              </div>
              <RoleBadge role={result.role} size="xs" />
            </div>

            <div className="flex items-center gap-3 bg-night-700/60 rounded-xl px-3 py-2.5">
              <div className="w-8 h-8 rounded-lg bg-night-800 flex items-center justify-center shrink-0">
                <UsersRound className="w-4 h-4 text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200">Groupes auto-affectés</p>
                <p className="text-[11px] text-slate-500">
                  {result.assignedGroups.length > 0
                    ? result.assignedGroups.map(g => g.name).join(', ')
                    : 'Aucun groupe correspondant pour le moment'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-night-700/60 rounded-xl px-3 py-2.5">
              <div className="w-8 h-8 rounded-lg bg-night-800 flex items-center justify-center shrink-0">
                <BookUser className="w-4 h-4 text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200">Fiche Annuaire créée</p>
                <p className="text-[11px] text-slate-500 truncate">{result.newUser.profession}{result.newUser.skills.length > 0 ? ` · ${result.newUser.skills.join(', ')}` : ''}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-night-700/60 rounded-xl px-3 py-2.5">
              <div className="w-8 h-8 rounded-lg bg-night-800 flex items-center justify-center shrink-0">
                <CakeSlice className="w-4 h-4 text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200">Rappels Cordée AI activés</p>
                <p className="text-[11px] text-slate-500">Date de naissance enregistrée pour le rappel d'anniversaire</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleEnterApp}
            className="w-full bg-gold hover:bg-gold-light text-white font-semibold py-3 rounded-xl transition-all active:scale-[0.98] mt-5 flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Accéder à Cordée
          </button>
        </div>
      )}
    </div>
  )
}
