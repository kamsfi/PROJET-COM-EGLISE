import {
  Layers, MessageSquare, Radio, Users, UsersRound, Calendar, Library, Wallet, Heart,
  ShieldCheck, Zap, BrainCircuit, ArrowRight,
} from 'lucide-react'

const FEATURES = [
  { icon: MessageSquare, label: 'Discussions', text: 'Des conversations fluides et privées pour chaque équipe, département ou projet.', tint: 'bg-orange-100 text-orange-600' },
  { icon: Radio, label: 'Canaux', text: 'Diffusez des annonces importantes et gardez toute votre communauté informée en temps réel.', tint: 'bg-amber-100 text-amber-600' },
  { icon: UsersRound, label: 'Groupes', text: 'Communautés à critères réellement confidentielles — âge, sexe, statut.', tint: 'bg-orange-100 text-orange-600' },
  { icon: Calendar, label: 'Événements', text: 'Planifiez, coordonnez et publiez vos réunions et rassemblements avec facilité.', tint: 'bg-amber-100 text-amber-600' },
  { icon: Library, label: 'Médiathèque', text: 'Prédications, photos et vidéos centralisées pour toute l\'organisation.', tint: 'bg-orange-100 text-orange-600' },
  { icon: Users, label: 'Annuaire', text: 'Retrouvez et contactez chaque membre de votre organisation.', tint: 'bg-amber-100 text-amber-600' },
  { icon: Wallet, label: 'Finances', text: 'Dons et cotisations, par Mobile Money ou virement bancaire.', tint: 'bg-orange-100 text-orange-600' },
  { icon: Heart, label: 'Direct & Prières', text: 'Mur de prière et demandes d\'accompagnement de la communauté.', tint: 'bg-amber-100 text-amber-600' },
]

export default function LandingPage({ onLogin, onSignup }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased selection:bg-orange-500 selection:text-white">

      {/* ================= HEADER / NAVBAR ================= */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center text-white shadow-md shadow-slate-900/10">
              <Layers className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight text-slate-900">ComHub</span>
              <span className="block text-[10px] text-slate-500 font-medium tracking-wide uppercase">Plateforme Multi-Organisations</span>
            </div>
          </div>

          {/* Navigation & CTA */}
          <div className="flex items-center gap-4">
            <button onClick={onLogin} className="text-sm font-semibold text-slate-600 hover:text-slate-900 px-4 py-2 transition-colors">
              Connexion
            </button>
            <button onClick={onSignup} className="text-sm font-semibold bg-[#0F172A] hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl shadow-sm transition-all duration-200">
              Créer un espace
            </button>
          </div>

        </div>
      </header>

      {/* ================= HERO SECTION ================= */}
      <section className="relative pt-16 pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-12 items-center">

            {/* Left Content */}
            <div className="lg:col-span-6 space-y-8 text-center lg:text-left">

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-orange-700 text-xs font-semibold">
                <Zap className="w-3.5 h-3.5" />
                <span>Plateforme de collaboration tout-en-un</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
                Unifiez vos équipes et vos communautés, <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">sans effort.</span>
              </h1>

              <p className="text-lg text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
                ComHub centralise messagerie, groupes, événements, médiathèque et finances pour les églises, entreprises et ONG. Chaque organisation dans son propre espace, entièrement cloisonné.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button onClick={onSignup} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-semibold px-8 py-4 rounded-xl shadow-lg shadow-orange-600/20 transition-all duration-200">
                  Créer mon espace — C'est gratuit
                  <ArrowRight className="w-4 h-4" />
                </button>
                <a href="#modules" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold px-6 py-4 rounded-xl transition-all duration-200">
                  Voir les modules
                </a>
              </div>

              {/* Feature Badges */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0">
                <div className="flex flex-col items-center lg:items-start">
                  <div className="flex items-center gap-1.5 text-slate-900 font-semibold text-sm">
                    <ShieldCheck className="w-4 h-4 text-orange-600" />
                    Cloisonné
                  </div>
                  <span className="text-xs text-slate-500 mt-0.5">Espaces privés</span>
                </div>
                <div className="flex flex-col items-center lg:items-start">
                  <div className="flex items-center gap-1.5 text-slate-900 font-semibold text-sm">
                    <Zap className="w-4 h-4 text-orange-600" />
                    Temps réel
                  </div>
                  <span className="text-xs text-slate-500 mt-0.5">Messagerie instantanée</span>
                </div>
                <div className="flex flex-col items-center lg:items-start">
                  <div className="flex items-center gap-1.5 text-slate-900 font-semibold text-sm">
                    <BrainCircuit className="w-4 h-4 text-orange-600" />
                    IA intégrée
                  </div>
                  <span className="text-xs text-slate-500 mt-0.5">Résumés intelligents</span>
                </div>
              </div>

            </div>

            {/* Right Illustration / App Mockup Preview */}
            <div className="lg:col-span-6 relative">
              <div className="relative mx-auto max-w-lg lg:max-w-none">
                {/* Decorative background blur */}
                <div className="absolute -inset-1.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl blur-xl opacity-20 animate-pulse" />

                {/* Mockup Card Container */}
                <div className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden p-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-rose-400" />
                      <div className="w-3 h-3 rounded-full bg-amber-400" />
                      <div className="w-3 h-3 rounded-full bg-emerald-400" />
                    </div>
                    <span className="text-xs font-medium text-slate-400">ComHub Workspace</span>
                  </div>

                  {/* Mockup Inner UI Preview */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                    <div className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">CAP</div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">Discussions Générales</p>
                          <p className="text-[10px] text-slate-500">3 nouveaux messages</p>
                        </div>
                      </div>
                      <span className="text-xs text-orange-600 font-semibold bg-orange-50 px-2 py-1 rounded">Actif</span>
                    </div>

                    <div className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-orange-500">
                      <p className="text-xs text-slate-700 font-medium">"Les inscriptions pour le séminaire de leadership sont ouvertes !"</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">Il y a 5 minutes • Par Secrétariat</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ================= FEATURES SECTION ================= */}
      <section id="modules" className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">

          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Tout ce qu'il faut pour votre succès
            </h2>
            <p className="text-slate-600">
              Huit modules puissants, une seule plateforme unifiée pour piloter votre organisation.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(f => (
              <div key={f.label} className="group bg-slate-50 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 p-8 rounded-2xl border border-slate-100">
                <div className={`w-12 h-12 rounded-xl ${f.tint} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{f.label}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-white border-t border-slate-100 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
              <Layers className="w-4 h-4 text-orange-500" />
            </div>
            <span className="font-bold text-slate-900">ComHub</span>
          </div>

          <div className="flex flex-wrap items-center gap-8 text-sm text-slate-500 font-medium">
            <a href="#" className="hover:text-slate-900 transition-colors">Contact</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Aide</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Conditions</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Mentions Légales</a>
          </div>

          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} ComHub. Tous droits réservés.
          </p>
        </div>
      </footer>

    </div>
  )
}
