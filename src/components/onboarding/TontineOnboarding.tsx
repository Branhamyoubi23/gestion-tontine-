import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Plus, 
  Users, 
  Settings, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  Trophy,
  Rocket
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TontineOnboarding = () => {
  const { user, updateOnboardingStep } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);

  // Show only if user is at step 2 (just created first tontine)
  if (!user || user.onboarding_step !== 2) {
    return null;
  }

  const steps = [
    {
      title: "Félicitations ! 🎉",
      description: "Vous venez de créer votre toute première tontine. C'est un moment historique !",
      icon: Rocket,
      color: "from-blue-500 to-cyan-600",
      tips: [
        "Invitez vos membres dès maintenant",
        "Définissez les règles du jeu",
        "Préparez le premier tirage"
      ]
    },
    {
      title: "Invitations & Rôles",
      description: "En tant qu'organisateur, vous pouvez inviter des membres par leur numéro de téléphone ou email.",
      icon: Users,
      color: "from-amber-500 to-orange-600",
      tips: [
        "Utilisez le bouton 'Inviter'",
        "Gérez les statuts des membres",
        "Désignez des co-admins si besoin"
      ]
    },
    {
      title: "Sécurité & Transparence",
      description: "TontineTogether garde une trace de chaque mouvement. Vos membres pourront voir l'historique en temps réel.",
      icon: ShieldCheck,
      color: "from-emerald-500 to-teal-600",
      tips: [
        "Notifications automatiques",
        "Preuves de paiement numériques",
        "Zéro litige, un max de confiance"
      ]
    }
  ];

  const handleFinish = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await updateOnboardingStep(3);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[#1A1208]/85 backdrop-blur-md" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-lg rounded-[40px] overflow-hidden shadow-2xl relative z-10 border-4 border-[#F5E6C8]"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="p-10 text-center"
          >
            {/* Sparkles Decoration */}
            <div className="absolute top-8 left-8 text-amber-400 opacity-30 animate-pulse">
                <Sparkles size={24} />
            </div>
            <div className="absolute bottom-8 right-8 text-amber-400 opacity-30 animate-pulse">
                <Sparkles size={24} />
            </div>

            {/* Icon Header */}
            <div className={`w-28 h-28 bg-gradient-to-tr ${steps[currentStep].color} rounded-full mx-auto flex items-center justify-center text-white mb-8 shadow-2xl ring-8 ring-[#F7F4EF]`}>
              {React.createElement(steps[currentStep].icon, { size: 54 })}
            </div>

            <h2 className="text-3xl font-serif font-black text-[#1A1208] mb-4">
              {steps[currentStep].title}
            </h2>
            <p className="text-[#7A6E5F] text-lg mb-8 leading-relaxed font-medium">
              {steps[currentStep].description}
            </p>

            {/* Tip Cards */}
            <div className="space-y-3 mb-10">
              {steps[currentStep].tips.map((tip, i) => (
                <div key={i} className="flex items-center gap-4 bg-[#F7F4EF] p-4 rounded-3xl border border-[#DDD5C4]/40 hover:scale-[1.02] transition-transform">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center border border-[#DDD5C4] font-black text-[10px] text-[#C8862A]">
                    {i + 1}
                  </div>
                  <span className="text-sm font-bold text-[#1A1208]">{tip}</span>
                </div>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex flex-col gap-4">
              <button
                onClick={handleFinish}
                className="w-full h-16 bg-[#C8862A] hover:bg-[#8B5A10] text-white rounded-[24px] flex items-center justify-center gap-4 font-black text-xl shadow-xl shadow-[#c8862a33] transition-all group active:scale-95"
              >
                {currentStep === steps.length - 1 ? "Compris, c'est génial !" : "Continuer"}
                <ArrowRight size={22} className="group-hover:translate-x-1.5 transition-transform" />
              </button>
            </div>

            {/* Pagination dots */}
            <div className="flex justify-center gap-3 mt-8">
              {steps.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    i === currentStep ? "w-10 bg-[#C8862A]" : "w-2 bg-[#DDD5C4]"
                  }`} 
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default TontineOnboarding;
