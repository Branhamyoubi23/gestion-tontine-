import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Users, ArrowRight, Sparkles, 
  Wallet, TrendingUp, Handshake, Info, X, HelpCircle, XCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

// French Translation Strings Object (Foundation for i18n)
const TRANSLATIONS = {
  tagline: "Plateforme de Finance Solidaire",
  titlePart1: "Bienvenue sur ",
  titlePart2: "Tontine",
  titlePart3: "Pro",
  subtitle: "Choisissez votre espace pour commencer à construire votre avenir financier, que vous soyez gestionnaire de cercle ou membre participant.",
  adminCardTitle: "Espace Gestionnaire",
  adminCardDesc: "Créez et gérez vos propres cercles de tontine. Automatisez les cycles, suivez les paiements et gérez la banque communautaire.",
  adminLoginBtn: "Se Connecter",
  adminRegisterBtn: "Créer mon compte Admin",
  memberCardTitle: "Espace Membre",
  memberCardDesc: "Consultez vos tontines, votre épargne et vos gains. Effectuez vos versements en toute simplicité.",
  memberLoginBtn: "Me Connecter",
  memberSignupBtn: "J'ai un code d'invitation",
  memberSignupTooltip: "Rejoignez un cercle existant en saisissant le code unique généré par votre administrateur.",
  securityLabel: "Sécurité Bancaire",
  growthLabel: "Croissance Économique",
  trustLabel: "Confiance Mutuelle",
  loadingLabel: "Chargement en cours...",
  learnMoreLink: "Comment ça marche ?",
  statsTontinesCount: "1 200+",
  statsTontinesLabel: "Tontines créées",
  statsMembersCount: "15 000+",
  statsMembersLabel: "Membres actifs",
  statsSecureCount: "99.9%",
  statsSecureLabel: "Paiements sécurisés",
  howItWorksTitle: "Comment fonctionne TontinePro ?",
  howItWorksStep1Title: "1. Création de cercle",
  howItWorksStep1Desc: "Un administrateur configure la tontine en spécifiant la cagnotte, le rythme des versements et la banque communautaire.",
  howItWorksStep2Title: "2. Invitation des membres",
  howItWorksStep2Desc: "Les participants rejoignent le cercle de manière sécurisée en insérant un code d'accès unique ou un lien partagé.",
  howItWorksStep3Title: "3. Versements & Tour de rôle",
  howItWorksStep3Desc: "À chaque cycle, les membres effectuent leur cotisation. Le tirage au sort désigne le bénéficiaire de la cagnotte.",
  howItWorksStep4Title: "4. Micro-épargne & Banque",
  howItWorksStep4Desc: "Les participants accèdent à des outils bancaires de crédit mutuel, d'enchères de fonds et d'accumulation d'intérêts.",
  closeBtn: "Fermer"
};

// Centralized Route Resolution Function
const resolveUserDashboardRoute = (user: any): string => {
  if (!user || !user.role) return '/member/login';
  
  const role = String(user.role).toLowerCase();
  if (role === 'admin' || role === 'super_admin') {
    return '/admin/dashboard';
  } else if (role === 'member' || role === 'user') {
    return '/member/dashboard';
  }
  
  // Fallback
  return '/member/dashboard';
};

const LandingPortal = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuth();
  
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  // SEO & Head Management
  useEffect(() => {
    document.title = "TontinePro - Plateforme de Finance Solidaire";

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', 'Automatisez vos cercles de tontine en toute sécurité avec TontinePro. Outils de suivi, banque communautaire et micro-finance.');

    const ogTags = [
      { property: 'og:title', content: 'TontinePro - Plateforme de Finance Solidaire' },
      { property: 'og:description', content: 'Créez et participez à vos cercles financiers avec nos outils de gestion moderne.' },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: `${window.location.origin}/icons.png` }
    ];

    ogTags.forEach(tag => {
      let el = document.querySelector(`meta[property="${tag.property}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', tag.property);
        document.head.appendChild(el);
      }
      el.setAttribute('content', tag.content);
    });
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      try {
        const targetRoute = resolveUserDashboardRoute(user);
        navigate(targetRoute);
      } catch (err) {
        console.error("Navigation redirect failed:", err);
      }
    }
  }, [isAuthenticated, user, loading, navigate]);

  // Loading Screen prevents flash of portal contents
  if (loading || isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden transition-opacity duration-300">
        <div className="w-14 h-14 border-[4px] border-slate-100 border-t-blue-600 rounded-full animate-spin" />
        <p className="mt-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">
          {TRANSLATIONS.loadingLabel}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden transition-all duration-300">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none select-none z-0">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <main role="main" className="max-w-5xl w-full relative z-10 flex flex-col items-center justify-center py-8">
        
        {/* Title Tagline */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-100 dark:border-slate-700/50 mb-8"
        >
          <Sparkles className="text-amber-500" size={16} />
          <span className="text-[10px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest leading-none">
            {TRANSLATIONS.tagline}
          </span>
        </motion.div>
        
        {/* Hero Title & Description */}
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="text-3xl sm:text-5xl md:text-7xl font-serif font-black text-slate-900 dark:text-white mb-6 tracking-tight"
          >
            {TRANSLATIONS.titlePart1}
            <span className="text-blue-600">{TRANSLATIONS.titlePart2}</span>
            <span className="text-emerald-600">{TRANSLATIONS.titlePart3}</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="text-slate-500 dark:text-slate-400 text-base md:text-lg max-w-2xl mx-auto font-medium leading-relaxed"
          >
            {TRANSLATIONS.subtitle}
          </motion.p>
        </div>

        {/* Portal Cards */}
        <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl px-2 md:px-0">
          
          {/* Admin Card */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ translateY: -8 }}
            className="bg-white dark:bg-slate-800 rounded-[48px] p-6 sm:p-10 border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/40 group relative overflow-hidden will-change-transform focus-within:ring-2 focus-within:ring-blue-600 outline-none"
            tabIndex={0}
            aria-describedby="admin-card-desc"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 dark:text-white transition-opacity select-none pointer-events-none">
              <ShieldCheck size={160} />
            </div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-slate-900 dark:bg-slate-700 rounded-3xl flex items-center justify-center text-white mb-8 shadow-lg shadow-slate-900/20">
                <ShieldCheck size={32} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-4 font-serif italic">
                {TRANSLATIONS.adminCardTitle}
              </h2>
              <p id="admin-card-desc" className="text-slate-500 dark:text-slate-300 text-sm mb-10 leading-relaxed font-medium">
                {TRANSLATIONS.adminCardDesc}
              </p>
              <div className="space-y-3">
                <button 
                  onClick={() => navigate('/admin/login')}
                  data-track-click="admin-login"
                  aria-label="Se connecter à l'espace gestionnaire"
                  className="w-full py-4 bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-lg active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-950 outline-none"
                >
                  {TRANSLATIONS.adminLoginBtn} <ArrowRight size={18} />
                </button>
                <button 
                  onClick={() => navigate('/admin/register')}
                  data-track-click="admin-register"
                  aria-label="Créer un compte administrateur de tontine"
                  className="w-full py-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-600 outline-none"
                >
                  {TRANSLATIONS.adminRegisterBtn}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Member Card */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ translateY: -8 }}
            className="bg-white dark:bg-slate-800 rounded-[48px] p-6 sm:p-10 border border-emerald-50 dark:border-slate-700 shadow-xl shadow-emerald-200/40 dark:shadow-slate-950/40 group relative overflow-hidden will-change-transform focus-within:ring-2 focus-within:ring-emerald-600 outline-none"
            tabIndex={0}
            aria-describedby="member-card-desc"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 dark:text-white transition-opacity select-none pointer-events-none">
              <Users size={160} />
            </div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-emerald-600 rounded-3xl flex items-center justify-center text-white mb-8 shadow-lg shadow-emerald-600/20">
                <Users size={32} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-4 font-serif italic">
                {TRANSLATIONS.memberCardTitle}
              </h2>
              <p id="member-card-desc" className="text-slate-500 dark:text-slate-300 text-sm mb-10 leading-relaxed font-medium">
                {TRANSLATIONS.memberCardDesc}
              </p>
              <div className="space-y-3">
                <button 
                  onClick={() => navigate('/member/login')}
                  data-track-click="member-login"
                  aria-label="Se connecter à l'espace membre"
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-emerald-500 transition-all shadow-lg active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-600 outline-none"
                >
                  {TRANSLATIONS.memberLoginBtn} <ArrowRight size={18} />
                </button>
                <div className="relative group/tooltip">
                  <button 
                    onClick={() => navigate('/member/signup')}
                    data-track-click="member-signup"
                    aria-label="Rejoindre avec un code d'invitation"
                    className="w-full py-4 bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border-2 border-emerald-50 dark:border-emerald-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-emerald-200 dark:hover:border-emerald-800 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all active:scale-[0.99] flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-600 outline-none"
                  >
                    {TRANSLATIONS.memberSignupBtn}
                    <HelpCircle size={14} className="opacity-60" />
                  </button>
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-900 text-white text-[10px] p-3 rounded-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none shadow-xl border border-slate-700/50 text-center font-semibold">
                    {TRANSLATIONS.memberSignupTooltip}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

        </div>

        {/* Feature Highlights/Stats Section */}
        <div className="mt-12 w-full max-w-4xl grid grid-cols-3 gap-2 sm:gap-4 border border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md py-6 rounded-[32px] shadow-sm text-center">
          <div>
            <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">{TRANSLATIONS.statsTontinesCount}</p>
            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest mt-0.5">{TRANSLATIONS.statsTontinesLabel}</p>
          </div>
          <div className="border-x border-slate-100 dark:border-slate-800">
            <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">{TRANSLATIONS.statsMembersCount}</p>
            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest mt-0.5">{TRANSLATIONS.statsMembersLabel}</p>
          </div>
          <div>
            <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">{TRANSLATIONS.statsSecureCount}</p>
            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest mt-0.5">{TRANSLATIONS.statsSecureLabel}</p>
          </div>
        </div>

        {/* Learn More link */}
        <div className="mt-8">
          <button 
            onClick={() => setShowHowItWorks(true)}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg p-1 outline-none"
            aria-label="Apprendre comment fonctionne la tontine"
          >
            <Info size={14} />
            {TRANSLATIONS.learnMoreLink}
          </button>
        </div>

        {/* Trust Badges Footer */}
        <footer role="complementary" className="mt-16 flex flex-wrap justify-center items-center gap-6 md:gap-12 text-slate-400 dark:text-slate-500 px-4">
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest">
            <Wallet size={16} className="text-slate-300 dark:text-slate-600" /> {TRANSLATIONS.securityLabel}
          </div>
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest">
            <TrendingUp size={16} className="text-slate-300 dark:text-slate-600" /> {TRANSLATIONS.growthLabel}
          </div>
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest">
            <Handshake size={16} className="text-slate-300 dark:text-slate-600" /> {TRANSLATIONS.trustLabel}
          </div>
        </footer>

      </main>

      {/* HOW IT WORKS MODAL */}
      <AnimatePresence>
        {showHowItWorks && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-[40px] p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 dark:border-slate-700 relative"
            >
              <button 
                onClick={() => setShowHowItWorks(false)}
                className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
                aria-label={TRANSLATIONS.closeBtn}
              >
                <X size={20} />
              </button>
              
              <h3 className="text-xl sm:text-2xl font-black font-serif italic text-slate-900 dark:text-white mb-6">
                {TRANSLATIONS.howItWorksTitle}
              </h3>

              <div className="space-y-5 text-sm mb-8 max-h-[60vh] overflow-y-auto pr-2">
                <div className="space-y-1">
                  <h4 className="font-black text-slate-800 dark:text-white">{TRANSLATIONS.howItWorksStep1Title}</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-medium">{TRANSLATIONS.howItWorksStep1Desc}</p>
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-slate-800 dark:text-white">{TRANSLATIONS.howItWorksStep2Title}</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-medium">{TRANSLATIONS.howItWorksStep2Desc}</p>
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-slate-800 dark:text-white">{TRANSLATIONS.howItWorksStep3Title}</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-medium">{TRANSLATIONS.howItWorksStep3Desc}</p>
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-slate-800 dark:text-white">{TRANSLATIONS.howItWorksStep4Title}</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-medium">{TRANSLATIONS.howItWorksStep4Desc}</p>
                </div>
              </div>

              <button 
                onClick={() => setShowHowItWorks(false)}
                className="w-full h-12 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-600 transition-all shadow-md"
              >
                {TRANSLATIONS.closeBtn}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap');
        .font-serif {
          font-family: 'Playfair Display', ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
        }
      `}</style>
    </div>
  );
};

// ERROR BOUNDARY WRAPPER
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[32px] p-10 shadow-xl max-w-md w-full">
            <XCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
            <h2 className="text-xl font-black font-serif text-slate-900 dark:text-white mb-2">Quelque chose s'est mal passé</h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-6 leading-relaxed">
              Une erreur est survenue lors du chargement du portail de connexion.
            </p>
            <button 
              onClick={() => this.setState({ hasError: false })}
              className="w-full h-12 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-600 transition-all"
            >
              Réessayer
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function LandingPortalWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <LandingPortal />
    </ErrorBoundary>
  );
}
