import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// `isSupabaseConfigured` vaut false tant que `.env.local` n'a pas été
// rempli (voir README / message d'onboarding). Le reste de l'app doit
// toujours vérifier ce flag avant d'appeler `supabase.auth.*` — tant
// qu'il est false, les formulaires d'authentification réels affichent un
// message explicite au lieu d'échouer silencieusement, et le mode Accès
// Démo Rapide (mock, local) reste pleinement fonctionnel.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  console.warn(
    '[ComHub] Supabase non configuré : renseignez VITE_SUPABASE_URL et ' +
    'VITE_SUPABASE_ANON_KEY dans .env.local puis redémarrez `npm run dev`. ' +
    "L'authentification réelle est désactivée ; l'Accès Démo Rapide reste disponible."
  )
}

// `supabase` est `null` si les variables d'environnement sont absentes,
// pour ne jamais faire planter l'app au chargement (createClient('', '')
// lève une exception immédiate sinon).
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
