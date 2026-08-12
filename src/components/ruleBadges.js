import { Cake, VenetianMask, Users2 } from 'lucide-react'
import { genderLabels, maritalStatusLabels } from '../data'

export function ruleBadges(rules) {
  if (!rules) return []
  const badges = []
  if (rules.gender) badges.push({ icon: VenetianMask, label: genderLabels[rules.gender] })
  if (rules.min_age || rules.max_age) {
    const label = rules.min_age && rules.max_age
      ? `${rules.min_age}-${rules.max_age} ans`
      : rules.min_age
      ? `${rules.min_age} ans et +`
      : `Jusqu'à ${rules.max_age} ans`
    badges.push({ icon: Cake, label })
  }
  if (rules.marital_status) badges.push({ icon: Users2, label: maritalStatusLabels[rules.marital_status] })
  return badges
}
