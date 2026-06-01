import React, { useState } from 'react';
import { Check, Star, Zap, Shield, Rocket, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/shared/Navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const PricingPage = () => {
    const navigate = useNavigate();
    const [isAnnual, setIsAnnual] = useState(true);

    const plans = [
        {
            name: "Gratuit",
            tagline: "Parfait pour démarrer entre amis",
            price: "0",
            currency: "CFA",
            period: "/mois",
            buttonText: "Commencer gratuitement",
            icon: <Rocket className="text-[#C8862A]" size={24} />,
            features: [
                "3 groupes maximum",
                "10 membres par groupe",
                "Fonctions essentielles",
                "Notifications par email",
                "Historique de 6 mois"
            ],
            isPopular: false,
            color: "bg-[#F7F4EF]"
        },
        {
            name: "Pro",
            tagline: "Pour les groupes qui grandissent",
            price: isAnnual ? "3 920" : "4 900",
            currency: "XOF",
            period: "/mois",
            buttonText: "Passer au plan Pro",
            icon: <Star className="text-white" size={24} />,
            features: [
                "Groupes illimités",
                "Membres illimités",
                "Export PDF & Excel",
                "Tableau de bord détaillé",
                "Historique illimité",
                "Assistance prioritaire 24h"
            ],
            isPopular: true,
            color: "bg-[#1A1208]"
        }
    ];

    return (
        <div className="min-h-screen bg-[#F7F4EF] selection:bg-[#F5E6C8]">
            <Navigation />

            <div className="max-w-7xl mx-auto px-[5%] py-20 relative overflow-hidden">
                {/* Background Decorations */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(200,134,42,0.05)_0%,transparent_70%)] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(200,134,42,0.03)_0%,transparent_70%)] pointer-events-none" />

                <div className="text-center mb-16 animate-fade-up">
                    <div className="inline-block px-4 py-1.5 bg-[#F5E6C8] text-[#8B5A10] text-[10px] font-bold uppercase tracking-widest rounded-full mb-6 shadow-sm border border-[#C8862A]/20">
                        Nos offres
                    </div>
                    <h1 className="text-5xl md:text-7xl font-serif font-black text-[#1A1208] mb-6 tracking-tight">
                        Le bon plan pour <em className="italic text-[#C8862A]">votre groupe</em>
                    </h1>
                    <p className="text-xl text-[#7A6E5F] max-w-2xl mx-auto leading-relaxed">
                        Commencez gratuitement, évoluez quand votre groupe est prêt. Pas de piège, pas de surprise. 😊
                    </p>
                </div>

                {/* Billing Toggle */}
                <div className="flex items-center justify-center gap-6 mb-20 animate-fade-up [animation-delay:0.1s]">
                    <span className={`text-sm font-bold ${!isAnnual ? 'text-[#1A1208]' : 'text-[#7A6E5F]'}`}>Mensuel</span>
                    <button
                        onClick={() => setIsAnnual(!isAnnual)}
                        className="w-16 h-8 bg-[#DDD5C4] rounded-full relative transition-colors p-1"
                    >
                        <div className={`w-6 h-6 bg-[#C8862A] rounded-full transition-transform duration-300 shadow-md ${isAnnual ? 'translate-x-8' : 'translate-x-0'}`} />
                    </button>
                    <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${isAnnual ? 'text-[#1A1208]' : 'text-[#7A6E5F]'}`}>Annuel</span>
                        <span className="px-2 py-0.5 bg-[#C8862A] text-[#F7F4EF] text-[10px] font-black rounded-md rotate-3 shadow-sm animation-pulse">
                            -20%
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto px-4">
                    {plans.map((plan, idx) => (
                        <div
                            key={idx}
                            className={`relative p-1 rounded-[40px] transition-all duration-500 hover:-translate-y-2 ${plan.isPopular ? 'bg-gradient-to-br from-[#C8862A] to-[#8B5A10] shadow-2xl' : 'bg-[#DDD5C4]'}`}
                        >
                            <Card className={`h-full p-10 md:p-12 rounded-[38px] border-none flex flex-col ${plan.color}`}>
                                {plan.isPopular && (
                                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-6 py-2 bg-[#C8862A] text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg flex items-center gap-2">
                                        <Zap size={14} fill="currentColor" /> Recommandé
                                    </div>
                                )}

                                <div className="flex items-center gap-4 mb-8">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${plan.isPopular ? 'bg-[#C8862A]' : 'bg-[#F5E6C8]'}`}>
                                        {plan.icon}
                                    </div>
                                    <div>
                                        <h3 className={`text-2xl font-serif font-black ${plan.isPopular ? 'text-white' : 'text-[#1A1208]'}`}>
                                            {plan.name}
                                        </h3>
                                        <p className={`text-xs ${plan.isPopular ? 'text-[#F5E6C8]' : 'text-[#7A6E5F]'}`}>
                                            {plan.tagline}
                                        </p>
                                    </div>
                                </div>

                                <div className="mb-10">
                                    <div className="flex items-baseline gap-2">
                                        <span className={`text-5xl font-serif font-black ${plan.isPopular ? 'text-white' : 'text-[#1A1208]'}`}>
                                            {plan.price}
                                        </span>
                                        <span className={`text-xl font-bold ${plan.isPopular ? 'text-[#C8862A]' : 'text-[#8B5A10]'}`}>
                                            {plan.currency}
                                        </span>
                                        <span className={`text-sm ${plan.isPopular ? 'text-[#7A6E5F]' : 'text-[#7A6E5F]'}`}>
                                            {plan.period}
                                        </span>
                                    </div>
                                    {plan.isPopular && isAnnual && (
                                        <p className="text-[10px] font-bold text-[#C8862A] mt-2 uppercase tracking-tighter">Facturé annuellement (Save XOF 11,760)</p>
                                    )}
                                </div>

                                <div className="space-y-6 mb-12 flex-grow">
                                    {plan.features.map((feature, fIdx) => (
                                        <div key={fIdx} className="flex items-start gap-4 group">
                                            <div className={`mt-1 p-0.5 rounded-full ${plan.isPopular ? 'bg-[#C8862A]/20 text-[#C8862A]' : 'bg-[#C8862A]/10 text-[#C8862A]'}`}>
                                                <Check size={14} strokeWidth={4} />
                                            </div>
                                            <span className={`text-sm font-medium transition-colors ${plan.isPopular ? 'text-[#DDD5C4] group-hover:text-white' : 'text-[#7A6E5F] group-hover:text-[#1A1208]'}`}>
                                                {feature}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    onClick={() => navigate(plan.name === 'Pro' ? '/payment?plan=pro' : '/dashboard')}
                                    className={`w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 ${plan.isPopular
                                        ? 'bg-[#C8862A] text-white hover:bg-[#A66E22] hover:scale-[1.02] shadow-xl'
                                        : 'bg-transparent border-2 border-[#C8862A] text-[#C8862A] hover:bg-[#C8862A] hover:text-white'
                                        }`}
                                >
                                    {plan.buttonText}
                                </Button>
                            </Card>
                        </div>
                    ))}
                </div>

                {/* Trusted By / Security Note */}
                <div className="mt-24 text-center animate-fade-up [animation-delay:0.3s]">
                    <div className="flex items-center justify-center gap-12 opacity-40 grayscale hover:grayscale-0 transition-all duration-500 mb-8">
                        <Rocket size={32} />
                        <Shield size={32} />
                        <Rocket size={32} />
                    </div>
                    <p className="text-[11px] text-[#7A6E5F] font-medium flex items-center justify-center gap-4">
                        <span className="w-12 h-px bg-[#DDD5C4]" />
                        Paiements sécurisés — vos données restent confidentielles
                        <span className="w-12 h-px bg-[#DDD5C4]" />
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PricingPage;
