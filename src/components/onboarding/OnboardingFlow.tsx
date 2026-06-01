import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Wallet, Shield, ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const OnboardingFlow = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const steps = [
    {
      icon: Users,
      title: 'Bienvenue dans TontiPro',
      description: 'Votre espace d\'épargne entre amis et famille.',
      content: 'Une tontine, c\'est simple : chacun met de côté un peu chaque mois, et à tour de rôle, tout le monde reçoit la cagnotte. On s\'entraide, sans banque !'
    },
    {
      icon: Wallet,
      title: 'Des paiements faciles & sécurisés',
      description: 'Mobile Money et plus encore — tout est simple.',
      content: 'Payez avec votre opérateur préféré. Chaque cotisation est enregistrée automatiquement et visible par tous les membres du groupe. Zéro malentendu !'
    },
    {
      icon: Shield,
      title: 'La confiance au cœur du groupe',
      description: 'Tout le monde voit tout, en temps réel.',
      content: 'Historique des paiements, ordre de passage, preuves de cotisation — tout est clair et accessible. Parce que la transparence, c\'est la base d\'un groupe qui fonctionne bien.'
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate('/dashboard');
    }
  };

  const skipOnboarding = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F4EF] p-4 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(200,134,42,0.05)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-xl w-full relative z-10 animate-fade-up">
        {/* Progress Dots */}
        <div className="flex justify-center mb-12">
          <div className="flex space-x-3">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 transition-all duration-500 rounded-full ${index === currentStep ? 'w-12 bg-[#1A1208]' : index < currentStep ? 'w-4 bg-[#C8862A]' : 'w-4 bg-[#DDD5C4]'
                  }`}
              />
            ))}
          </div>
        </div>

        <div className="bg-white border-[1.5px] border-[#DDD5C4] rounded-[48px] p-10 md:p-14 text-center shadow-2xl shadow-[#1a12080a] relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="w-24 h-24 bg-[#1A1208] rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-[#1a120833]">
                {React.createElement(steps[currentStep].icon, {
                  size: 40,
                  className: "text-[#C8862A]"
                })}
              </div>

              <h2 className="text-3xl font-serif font-black text-[#1A1208] mb-6 leading-tight">
                {steps[currentStep].title}
              </h2>

              <p className="text-[#C8862A] font-bold text-sm uppercase tracking-[0.2em] mb-4">
                {steps[currentStep].description}
              </p>

              <p className="text-[#7A6E5F] text-lg leading-relaxed mb-12 italic">
                "{steps[currentStep].content}"
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center gap-4">
            <button
              onClick={skipOnboarding}
              className="flex-1 h-14 rounded-full border-[1.5px] border-[#DDD5C4] text-[#7A6E5F] font-bold hover:bg-[#F7F4EF] transition-all text-sm"
            >
              Passer
            </button>
            <button
              onClick={nextStep}
              className="flex-[2] h-14 bg-gradient-to-br from-[#C8862A] to-[#E8A040] text-white font-bold rounded-full shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3 group"
            >
              {currentStep === steps.length - 1 ? 'Allons-y 🚀' : 'Suivant'}
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-10 flex items-center justify-center gap-2 text-[#C1B7A6]">
          <Sparkles size={16} />
          <span className="text-[11px] font-medium text-[#7A6E5F]">TontiPay — épargner ensemble, c'est beau 💛</span>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
