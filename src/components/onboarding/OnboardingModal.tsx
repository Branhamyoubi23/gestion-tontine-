import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Handshake, 
  Target, 
  Users, 
  Wallet, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const OnboardingModal = () => {
  const { user, updateOnboardingStep } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);

  // If user has already completed onboarding, don't show it
  if (!user || user.onboarding_step === undefined || user.onboarding_step >= 1) {
    return null;
  }

  const steps = [
    {
      title: "Bienvenue sur TontiPro",
      description: "La plateforme moderne pour gérer vos tontines en toute sécurité et transparence.",
      icon: Handshake,
      color: "from-[#C8862A] to-[#E8A040]",
      features: [
        "Gestion simplifiée",
        "Paiements suivis",
        "Transparence totale"
      ]
    },
    {
      title: "Épargnez Ensemble",
      description: "Rejoignez ou créez des groupes de confiance pour réaliser vos projets plus rapidement.",
      icon: Users,
      color: "from-emerald-500 to-teal-600",
      features: [
        "Groupes privés",
        "Invitations sécurisées",
        "Chat communautaire"
      ]
    },
    {
      title: "C'est parti !",
      description: "Vous êtes prêt à commencer votre aventure financière collective.",
      icon: Zap,
      color: "from-indigo-500 to-purple-600",
      features: [
        "Créez votre 1ère tontine",
        "Invitez vos proches",
        "Gagnez ensemble"
      ]
    }
  ];

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await updateOnboardingStep(1);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[#1A1208]/80 backdrop-blur-sm" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl relative z-10 border border-[#DDD5C4]"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-8 md:p-12 text-center"
          >
            {/* Icon Header */}
            <div className={`w-24 h-24 bg-gradient-to-br ${steps[currentStep].color} rounded-[32px] mx-auto flex items-center justify-center text-white mb-8 shadow-xl group hover:rotate-6 transition-transform`}>
              {React.createElement(steps[currentStep].icon, { size: 48 })}
            </div>

            <h2 className="text-3xl font-serif font-black text-[#1A1208] mb-4">
              {steps[currentStep].title}
            </h2>
            <p className="text-[#7A6E5F] text-lg mb-8 leading-relaxed">
              {steps[currentStep].description}
            </p>

            {/* Features List */}
            <div className="grid grid-cols-1 gap-3 mb-10">
              {steps[currentStep].features.map((feature, i) => (
                <div key={i} className="flex items-center gap-3 bg-[#F7F4EF] p-3 rounded-xl border border-[#DDD5C4]/50">
                  <CheckCircle2 size={18} className="text-emerald-500" />
                  <span className="text-sm font-bold text-[#1A1208]">{feature}</span>
                </div>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex flex-col gap-4">
              <button
                onClick={handleNext}
                className="w-full h-14 bg-[#1A1208] hover:bg-[#2A1D0D] text-white rounded-2xl flex items-center justify-center gap-3 font-bold text-lg shadow-lg shadow-[#1a120833] transition-all group"
              >
                {currentStep === steps.length - 1 ? "Découvrir mon tableau de bord" : "Suivant"}
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              
              {/* Progress Dots */}
              <div className="flex justify-center gap-2">
                {steps.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1.5 rounded-full transition-all ${
                      i === currentStep ? "w-8 bg-[#C8862A]" : "w-1.5 bg-[#DDD5C4]"
                    }`} 
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default OnboardingModal;
