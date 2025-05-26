
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Users, Wallet, Shield, Check } from 'lucide-react';

const OnboardingFlow = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const steps = [
    {
      icon: Users,
      title: 'Bienvenue dans TontineHub !',
      description: 'Découvrez comment créer et gérer vos tontines en toute simplicité.',
      content: 'Une tontine est un groupe d\'épargne où chaque membre contribue régulièrement et reçoit à tour de rôle la somme totale collectée.'
    },
    {
      icon: Wallet,
      title: 'Paiements sécurisés',
      description: 'Utilisez Mobile Money, cartes bancaires ou virements pour vos contributions.',
      content: 'Tous vos paiements sont cryptés et sécurisés. Nous ne stockons jamais vos informations bancaires.'
    },
    {
      icon: Shield,
      title: 'Transparence totale',
      description: 'Suivez en temps réel les contributions et distributions de votre groupe.',
      content: 'Chaque transaction est visible par tous les membres pour une confiance mutuelle.'
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 px-4">
      <div className="max-w-lg w-full">
        {/* Progress */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full ${
                  index <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            {React.createElement(steps[currentStep].icon, {
              className: "h-10 w-10 text-white"
            })}
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {steps[currentStep].title}
          </h2>
          
          <p className="text-gray-600 mb-4">
            {steps[currentStep].description}
          </p>
          
          <p className="text-sm text-gray-500 mb-8">
            {steps[currentStep].content}
          </p>

          <div className="flex space-x-4">
            <Button 
              variant="outline" 
              onClick={skipOnboarding}
              className="flex-1"
            >
              Passer
            </Button>
            <Button 
              onClick={nextStep}
              className="flex-1 bg-gradient-to-r from-blue-600 to-green-600"
            >
              {currentStep === steps.length - 1 ? 'Commencer' : 'Suivant'}
            </Button>
          </div>
        </Card>

        {/* Step indicator */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Étape {currentStep + 1} sur {steps.length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
