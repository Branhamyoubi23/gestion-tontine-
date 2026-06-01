import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/shared/Navigation';
import { 
  Users, Calendar, Coins, Info, MonitorSmartphone,
  Sparkles, Shield, TrendingUp, Clock, Gift, CheckCircle, ChevronRight,
  CircleDollarSign, Zap, Loader2, Crown, Star, FileText, Settings,
  Landmark, Award, ThumbsUp, AlertTriangle, ArrowLeft, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { tontineService } from '../../services/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';

// Suggestion templates
const TEMPLATES = [
  {
    id: 'small_group',
    title: 'Petit groupe',
    description: '5 personnes, Épargne conviviale',
    amount: '10000',
    duration: '5',
    maxMembers: '5',
    frequency: 'monthly',
    has_bank: false,
    draw_mode: 'hybrid'
  },
  {
    id: 'large_pot',
    title: 'Grande cagnotte',
    description: '20 personnes, Projet important',
    amount: '50000',
    duration: '20',
    maxMembers: '20',
    frequency: 'monthly',
    has_bank: true,
    draw_mode: 'hybrid'
  },
  {
    id: 'fast_save',
    title: 'Épargne rapide',
    description: '3 mois, Hebdomadaire',
    amount: '25000',
    duration: '12',
    maxMembers: '12',
    frequency: 'weekly',
    has_bank: false,
    draw_mode: 'online'
  }
];

const TontineCreation = () => {
  const navigate = useNavigate();
  const { user, updateOnboardingStep, refreshUser } = useAuth();
  
  // Loading & Error States
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  
  // Form States
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(0); // For step transition direction
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    frequency: 'monthly',
    duration: '10',
    maxMembers: '10',
    rotation_order: 'random',
    draw_mode: 'hybrid',
    has_bank: false
  });

  // Validation States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmCommitment, setConfirmCommitment] = useState(false);
  const [draftExists, setDraftExists] = useState(false);

  // Focus Management Ref
  const firstInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>(null);

  // Analytics timing ref
  const stepStartTime = useRef<number>(Date.now());

  // Check if draft exists on mount & simulate initial loading for user preferences
  useEffect(() => {
    const savedDraft = localStorage.getItem('tontine_creation_draft');
    if (savedDraft) {
      setDraftExists(true);
    }
    
    // Simulate fetching configuration/preferences
    const timer = setTimeout(() => {
      setInitialLoading(false);
      stepStartTime.current = Date.now();
    }, 900);

    return () => clearTimeout(timer);
  }, []);

  // Save draft on form update or step change
  useEffect(() => {
    if (!initialLoading) {
      localStorage.setItem('tontine_creation_draft', JSON.stringify(formData));
    }
  }, [formData, initialLoading]);

  // Track step times
  useEffect(() => {
    const trackTime = () => {
      const elapsed = Math.round((Date.now() - stepStartTime.current) / 1000);
      // Analytics hook placeholder: console.log(`Spent ${elapsed}s on step ${currentStep}`);
      stepStartTime.current = Date.now();
    };
    trackTime();
  }, [currentStep]);

  // Focus management when switching steps
  useEffect(() => {
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [currentStep, initialLoading]);

  const loadDraft = () => {
    const savedDraft = localStorage.getItem('tontine_creation_draft');
    if (savedDraft) {
      try {
        setFormData(JSON.parse(savedDraft));
        setDraftExists(false);
        toast.info("Brouillon récupéré avec succès !");
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSaveAndExit = () => {
    localStorage.setItem('tontine_creation_draft', JSON.stringify(formData));
    toast.success("Progression sauvegardée ! Vous pouvez reprendre plus tard.");
    navigate('/dashboard');
  };

  const handleTemplateSelect = (template: typeof TEMPLATES[0]) => {
    setFormData(prev => ({
      ...prev,
      amount: template.amount,
      duration: template.duration,
      maxMembers: template.maxMembers,
      frequency: template.frequency,
      has_bank: template.has_bank,
      draw_mode: template.draw_mode
    }));
    toast.success(`Modèle "${template.title}" appliqué !`);
  };

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};
    if (step === 1) {
      if (!formData.name.trim()) {
        newErrors.name = "Le nom de la tontine est obligatoire";
      } else if (formData.name.length < 3) {
        newErrors.name = "Le nom doit comporter au moins 3 caractères";
      }
    }
    if (step === 2) {
      const amt = Number(formData.amount);
      if (!formData.amount) {
        newErrors.amount = "Le montant est obligatoire";
      } else if (isNaN(amt) || amt < 1000 || amt > 1000000) {
        newErrors.amount = "Le montant doit être compris entre 1 000 et 1 000 000 FCFA";
      }

      const dur = Number(formData.duration);
      if (!formData.duration) {
        newErrors.duration = "La durée est obligatoire";
      } else if (isNaN(dur) || dur < 2 || dur > 36) {
        newErrors.duration = "La durée doit être comprise entre 2 et 36 cycles";
      }

      const members = Number(formData.maxMembers);
      if (!formData.maxMembers) {
        newErrors.maxMembers = "Le nombre de membres maximum est obligatoire";
      } else if (isNaN(members) || members < 2 || members > 50) {
        newErrors.maxMembers = "Le nombre de membres doit être compris entre 2 et 50";
      }
    }
    if (step === 3) {
      if (!formData.draw_mode) {
        newErrors.draw_mode = "Veuillez sélectionner un mode de tirage";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      toast.error("Veuillez corriger les erreurs de validation.");
      return;
    }
    if (!confirmCommitment) {
      toast.warn("Veuillez confirmer les règles avant de soumettre.");
      return;
    }

    setLoading(true);
    setServerError(null);

    try {
      const payload = {
        ...formData,
        amount: Number(formData.amount),
        duration: Number(formData.duration),
        maxMembers: Number(formData.maxMembers),
        has_bank: formData.has_bank,
        draw_mode: formData.draw_mode
      };

      const res = await tontineService.createTontine(payload);
      
      if (user?.onboarding_step === 1) {
        await updateOnboardingStep(2);
      }

      await refreshUser();
      localStorage.removeItem('tontine_creation_draft');
      toast.success('Votre tontine a été créée avec succès !');

      // Navigate to detail page if ID exists, else dashboard
      const newTontineId = res?.data?.id || res?.id;
      if (newTontineId) {
        navigate(`/tontine/${newTontineId}`);
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error(error);
      setServerError(error.response?.data?.message || "Erreur de connexion avec le serveur. Veuillez réessayer.");
      toast.error("Échec de la création de la tontine");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: value 
    }));
    // Clear validation error on change
    if (errors[name]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  // Separate toggle switch handler for checkbox/boolean inputs
  const handleToggleChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setDirection(1);
      setCurrentStep(prev => Math.min(prev + 1, 4));
    } else {
      toast.error('Veuillez remplir les informations requises correctement.');
    }
  };

  const prevStep = () => {
    setDirection(-1);
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Dynamically calculate completion percentage
  const calculateCompletionPercentage = () => {
    let fieldsFilled = 0;
    const totalFields = 6; // name, amount, duration, maxMembers, draw_mode, confirm
    if (formData.name.trim()) fieldsFilled++;
    if (formData.amount && !errors.amount) fieldsFilled++;
    if (formData.duration && !errors.duration) fieldsFilled++;
    if (formData.maxMembers && !errors.maxMembers) fieldsFilled++;
    if (formData.draw_mode) fieldsFilled++;
    if (confirmCommitment) fieldsFilled++;

    return Math.round((fieldsFilled / totalFields) * 100);
  };

  const totalPot = Number(formData.amount || 0) * Number(formData.maxMembers || 0);

  // Steps structure
  const steps = [
    { number: 1, title: 'Identité', icon: Users, description: 'Nommez votre cercle' },
    { number: 2, title: 'Finances', icon: Coins, description: 'Définissez les montants' },
    { number: 3, title: 'Règles', icon: Settings, description: 'Personnalisez' },
    { number: 4, title: 'Validation', icon: CheckCircle, description: 'Confirmez' }
  ];

  // Motion variants for slide/fade step transition
  const stepVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -100 : 100,
      opacity: 0
    })
  };

  // Renders Loading Skeleton Match step layouts
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <Navigation />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse space-y-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-2xl mx-auto"></div>
            <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 mx-auto rounded"></div>
            <div className="h-3 w-64 bg-slate-100 dark:bg-slate-800 mx-auto rounded"></div>
          </div>

          {/* Skeletons for steps indicators */}
          <div className="flex justify-between gap-4 max-w-lg mx-auto py-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex flex-col items-center flex-1 space-y-2">
                <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                <div className="h-3 w-12 bg-slate-100 dark:bg-slate-800 rounded"></div>
              </div>
            ))}
          </div>

          {/* Form container skeleton */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 md:p-8 space-y-6">
            <div className="h-10 bg-slate-100 dark:bg-slate-700 rounded-lg w-1/3"></div>
            <div className="h-12 bg-slate-50 dark:bg-slate-900 rounded-xl w-full"></div>
            <div className="h-32 bg-slate-50 dark:bg-slate-900 rounded-xl w-full"></div>
            <div className="flex gap-4 pt-4">
              <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg w-24"></div>
              <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg flex-1"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100 transition-colors duration-300">
      <Navigation />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        
        {/* Save Draft Notification Bar */}
        {draftExists && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl flex items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <Info className="text-amber-600 dark:text-amber-500" size={18} />
              <span className="text-xs text-amber-800 dark:text-amber-200 font-medium">Vous avez un brouillon non finalisé de création de tontine.</span>
            </div>
            <button 
              onClick={loadDraft}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              Reprendre le brouillon
            </button>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-lg mb-4">
            <Sparkles size={32} className="text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent mb-2">
            Créer une tontine
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Définissez les règles de votre cercle d'épargne en quelques étapes</p>
        </div>

        {/* Dynamic completion progress indicator */}
        <div className="max-w-xl mx-auto mb-6 px-4">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
            <span>Étape {currentStep} sur 4</span>
            <span>{calculateCompletionPercentage()}% complété</span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300 rounded-full"
              style={{ width: `${calculateCompletionPercentage()}%` }}
            ></div>
          </div>
        </div>

        {/* Progress Steps Indicators */}
        <div className="mb-8 max-w-xl mx-auto">
          <div className="flex justify-between relative px-2">
            {steps.map((step, index) => {
              const isCurrent = currentStep === step.number;
              const isCompleted = currentStep > step.number;

              return (
                <div key={step.number} className="flex-1 relative z-10">
                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => {
                        if (step.number < currentStep || validateStep(currentStep)) {
                          setDirection(step.number > currentStep ? 1 : -1);
                          setCurrentStep(step.number);
                        }
                      }}
                      aria-current={isCurrent ? 'step' : undefined}
                      aria-label={`Aller à l'étape ${step.number}`}
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all focus-visible:ring-2 focus-visible:ring-amber-500 outline-none ${
                        isCurrent 
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                          : isCompleted
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                      }`}
                    >
                      {isCompleted ? <CheckCircle size={16} /> : step.number}
                    </button>
                    <span className="text-[10px] font-semibold mt-1 text-slate-500 dark:text-slate-400 text-center">
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`absolute top-4.5 left-1/2 w-full h-0.5 -z-10 transition-all ${
                      currentStep > step.number ? 'bg-amber-400 dark:bg-amber-500' : 'bg-slate-200 dark:bg-slate-800'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Inline Server Error display */}
        {serverError && (
          <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-start gap-3 max-w-3xl mx-auto">
            <AlertTriangle className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" size={18} />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-rose-800 dark:text-rose-200">Erreur de création</h4>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">{serverError}</p>
              <button 
                type="button" 
                onClick={handleSubmit} 
                className="mt-3 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
              >
                <RefreshCw size={12} /> Réessayer la soumission
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Form container */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/60 dark:border-slate-850 p-6 md:p-8 flex flex-col justify-between">
            <form onSubmit={handleSubmit} noValidate>
              
              <div className="overflow-hidden min-h-[320px] relative">
                <AnimatePresence initial={false} custom={direction} mode="wait">
                  <motion.div
                    key={currentStep}
                    custom={direction}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                  >
                    {currentStep === 1 && (
                      <div className="space-y-6">
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-5 rounded-xl border border-amber-100 dark:border-amber-900/40">
                          <div className="flex gap-3">
                            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-xl flex items-center justify-center shrink-0">
                              <Star size={18} className="text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Créez votre identité</p>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Choisissez un nom qui reflète l'esprit de votre groupe d'épargne. Exemples : <em>Solidarité Famille, Épargne Express, Caisse Entrepreneur.</em></p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <label htmlFor="tontine-name" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            Nom de la tontine <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="tontine-name"
                            ref={firstInputRef as any}
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Ex: Solidarité Pro 2026"
                            aria-invalid={!!errors.name}
                            aria-describedby={errors.name ? "name-error" : undefined}
                            className={`w-full h-12 px-4 rounded-xl border bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-amber-100 transition-all placeholder:text-slate-400 ${
                              errors.name ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-200 dark:border-slate-800 focus:border-amber-400'
                            }`}
                          />
                          {errors.name ? (
                            <p id="name-error" className="text-xs text-red-500 font-semibold">{errors.name}</p>
                          ) : (
                            <p className="text-xs text-slate-400">Un nom unique, clair et mémorable.</p>
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          <label htmlFor="tontine-description" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            Description
                          </label>
                          <textarea
                            id="tontine-description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Décrivez l'objectif de ce cercle d'épargne (facultatif)..."
                            rows={4}
                            className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 outline-none focus:border-amber-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-amber-100 transition-all resize-none"
                          />
                        </div>
                      </div>
                    )}

                    {currentStep === 2 && (
                      <div className="space-y-6">
                        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 p-5 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                          <div className="flex gap-3">
                            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl flex items-center justify-center shrink-0">
                              <TrendingUp size={18} className="text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Aperçu financier</p>
                              <div className="mt-2 flex justify-between items-center bg-white/60 dark:bg-slate-950/60 p-2.5 rounded-lg border border-emerald-100/50">
                                <span className="text-xs text-slate-600 dark:text-slate-400">Cagnotte totale estimée</span>
                                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">{totalPot.toLocaleString()} FCFA</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="flex flex-col gap-2">
                            <label htmlFor="tontine-amount" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Montant par cycle (FCFA) <span className="text-red-500">*</span>
                            </label>
                            <input
                              id="tontine-amount"
                              ref={firstInputRef as any}
                              name="amount"
                              type="number"
                              value={formData.amount}
                              onChange={handleChange}
                              placeholder="Min: 1 000, Max: 1 000 000"
                              aria-invalid={!!errors.amount}
                              className={`w-full h-12 px-4 rounded-xl border bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-amber-100 transition-all ${
                                errors.amount ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-200 dark:border-slate-800 focus:border-amber-400'
                              }`}
                            />
                            {errors.amount ? <p className="text-xs text-red-500 font-semibold">{errors.amount}</p> : <p className="text-xs text-slate-400">Suggéré : 5 000 - 500 000 FCFA</p>}
                          </div>
                          <div className="flex flex-col gap-2">
                            <label htmlFor="tontine-frequency" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Fréquence
                            </label>
                            <select 
                              id="tontine-frequency"
                              name="frequency" 
                              value={formData.frequency} 
                              onChange={handleChange} 
                              className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 outline-none focus:border-amber-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-amber-100 transition-all font-medium"
                            >
                              <option value="weekly">Hebdomadaire</option>
                              <option value="monthly">Mensuelle</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="flex flex-col gap-2">
                            <label htmlFor="tontine-duration" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Durée totale (cycles) <span className="text-red-500">*</span>
                            </label>
                            <input
                              id="tontine-duration"
                              name="duration"
                              type="number"
                              value={formData.duration}
                              onChange={handleChange}
                              min="2"
                              max="36"
                              aria-invalid={!!errors.duration}
                              className={`w-full h-12 px-4 rounded-xl border bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-amber-100 transition-all ${
                                errors.duration ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-200 dark:border-slate-800 focus:border-amber-400'
                              }`}
                            />
                            {errors.duration ? <p className="text-xs text-red-500 font-semibold">{errors.duration}</p> : <p className="text-xs text-slate-400">Suggéré : 3 - 24 cycles</p>}
                          </div>
                          <div className="flex flex-col gap-2">
                            <label htmlFor="tontine-maxMembers" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Membres maximum <span className="text-red-500">*</span>
                            </label>
                            <input
                              id="tontine-maxMembers"
                              name="maxMembers"
                              type="number"
                              value={formData.maxMembers}
                              onChange={handleChange}
                              min="2"
                              max="50"
                              aria-invalid={!!errors.maxMembers}
                              className={`w-full h-12 px-4 rounded-xl border bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-amber-100 transition-all ${
                                errors.maxMembers ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-200 dark:border-slate-800 focus:border-amber-400'
                              }`}
                            />
                            {errors.maxMembers ? <p className="text-xs text-red-500 font-semibold">{errors.maxMembers}</p> : <p className="text-xs text-slate-400">Suggéré : 5 - 30 membres</p>}
                          </div>
                        </div>

                        {/* Templates Selection */}
                        <div className="pt-2">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Modèles recommandés</p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {TEMPLATES.map(t => (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => handleTemplateSelect(t)}
                                className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl text-left bg-slate-50/20 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors flex flex-col justify-between gap-1"
                              >
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{t.title}</span>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400">{t.description}</span>
                                <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-500 mt-1">{Number(t.amount).toLocaleString()} FCFA</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {currentStep === 3 && (
                      <div className="space-y-6">
                        {/* Draw Mode */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <MonitorSmartphone size={18} className="text-amber-500" />
                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Mode de tirage</h3>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[
                              { value: 'hybrid', label: 'Hybride', icon: Zap, desc: 'En ligne + physique' },
                              { value: 'online', label: 'En ligne', icon: MonitorSmartphone, desc: 'Tirage par application' },
                              { value: 'physical', label: 'Physique', icon: Users, desc: 'Saisie manuelle admin' },
                            ].map(opt => (
                              <label
                                key={opt.value}
                                className={`cursor-pointer rounded-xl p-4 border-2 transition-all flex flex-col justify-between ${
                                  formData.draw_mode === opt.value
                                    ? 'border-amber-400 bg-amber-50/30 dark:bg-amber-950/20 shadow-sm'
                                    : 'border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-300'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="draw_mode"
                                  value={opt.value}
                                  checked={formData.draw_mode === opt.value}
                                  onChange={handleChange}
                                  className="sr-only"
                                />
                                <div className="flex items-center gap-2 mb-2">
                                  <opt.icon size={18} className={formData.draw_mode === opt.value ? 'text-amber-500' : 'text-slate-400'} />
                                  <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{opt.label}</p>
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">{opt.desc}</p>
                              </label>
                            ))}
                          </div>
                          <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl text-xs text-slate-500 dark:text-slate-400">
                            {formData.draw_mode === 'hybrid' ? (
                              <strong>Hybride: </strong>
                            ) : formData.draw_mode === 'online' ? (
                              <strong>En ligne: </strong>
                            ) : (
                              <strong>Physique: </strong>
                            )}
                            {formData.draw_mode === 'hybrid' 
                              ? "Les membres présents tirent physiquement et l'admin enregistre, pendant que les membres à distance tirent sur mobile."
                              : formData.draw_mode === 'online'
                                ? "Tous les membres tirent leur position via leur propre écran de manière équitable."
                                : "L'administrateur réalise le tirage de manière externe et saisit les résultats de passage à la main."
                            }
                          </div>
                        </div>

                        {/* Rotation Order */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Calendar size={18} className="text-amber-500" />
                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Ordre de rotation</h3>
                          </div>
                          <select 
                            id="tontine-rotation-order"
                            name="rotation_order" 
                            value={formData.rotation_order} 
                            onChange={handleChange} 
                            className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 outline-none focus:border-amber-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-amber-100 transition-all font-medium"
                          >
                            <option value="random">🎲 Tirage au sort aléatoire (Recommandé)</option>
                            <option value="manual">✍️ Ordre manuel (L'admin décide)</option>
                          </select>
                        </div>

                        {/* Bank Option */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Landmark size={18} className="text-amber-500" />
                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Banque communautaire</h3>
                          </div>
                          <div className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Activer l'épargne collective</span>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Permet aux membres d'épargner et d'emprunter avec intérêts</p>
                              </div>
                              <button
                                type="button"
                                role="switch"
                                aria-checked={formData.has_bank}
                                aria-label="Activer l'épargne collective"
                                onClick={() => handleToggleChange('has_bank', !formData.has_bank)}
                                onKeyDown={(e) => {
                                  if (e.key === ' ' || e.key === 'Enter') {
                                    e.preventDefault();
                                    handleToggleChange('has_bank', !formData.has_bank);
                                  }
                                }}
                                className={`w-12 h-6 rounded-full relative transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 outline-none focus-visible:ring-offset-2 ${
                                  formData.has_bank ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-800'
                                }`}
                              >
                                <span className={`w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm transition-transform ${
                                  formData.has_bank ? 'translate-x-6' : ''
                                }`} />
                              </button>
                            </div>
                            
                            {formData.has_bank && (
                              <div className="mt-4 p-4 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200/50 animate-fade-in flex gap-3">
                                <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                  Les membres pourront épargner au-delà de leur cotisation. Ces fonds seront mis à disposition sous forme de prêts générant des intérêts, redistribués équitablement.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {currentStep === 4 && (
                      <div className="space-y-6">
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-6 rounded-xl border border-amber-200/50">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-amber-200 dark:bg-amber-900/50 rounded-xl flex items-center justify-center">
                              <Crown size={22} className="text-amber-700 dark:text-amber-400" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 dark:text-slate-200 text-lg">{formData.name || 'Nouvelle tontine'}</p>
                              <p className="text-xs text-slate-500">Récapitulatif complet</p>
                            </div>
                          </div>

                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between py-2 border-b border-amber-200/40">
                              <span className="text-slate-600 dark:text-slate-400">Nom du cercle</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{formData.name}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-amber-200/40">
                              <span className="text-slate-600 dark:text-slate-400">Cotisation par cycle</span>
                              <span className="font-semibold text-amber-600 dark:text-amber-500">{Number(formData.amount).toLocaleString()} FCFA</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-amber-200/40">
                              <span className="text-slate-600 dark:text-slate-400">Fréquence</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">{formData.frequency === 'monthly' ? 'Mensuelle' : 'Hebdomadaire'}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-amber-200/40">
                              <span className="text-slate-600 dark:text-slate-400">Durée</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{formData.duration} cycles</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-amber-200/40">
                              <span className="text-slate-600 dark:text-slate-400">Membres max</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{formData.maxMembers} participants</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-amber-200/40">
                              <span className="text-slate-600 dark:text-slate-400">Cagnotte totale</span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">{totalPot.toLocaleString()} FCFA</span>
                            </div>
                            <div className="flex justify-between py-2">
                              <span className="text-slate-600 dark:text-slate-400">Banque communautaire</span>
                              <span className={`font-semibold ${formData.has_bank ? 'text-emerald-600' : 'text-slate-400'}`}>
                                {formData.has_bank ? 'Activée ✅' : 'Désactivée'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Confirmation Checkbox */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                          <label className="flex items-start gap-3 cursor-pointer">
                            <input 
                              type="checkbox"
                              checked={confirmCommitment}
                              onChange={(e) => setConfirmCommitment(e.target.checked)}
                              className="mt-1 h-4 w-4 text-amber-500 border-slate-300 rounded focus:ring-amber-500"
                            />
                            <div className="text-xs text-slate-600 dark:text-slate-400">
                              <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">Engagement administrateur</span>
                              Je confirme les règles définies ci-dessus et m'engage à gérer le cercle de tontine de manière responsable.
                            </div>
                          </label>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation Action Buttons */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-6 mt-6 flex flex-col sm:flex-row gap-3">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 outline-none"
                  >
                    Précédent
                  </button>
                )}
                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-md hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-amber-500 outline-none"
                  >
                    Continuer
                    <ChevronRight size={18} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading || !confirmCommitment}
                    className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-md hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-amber-500 outline-none"
                  >
                    {loading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        Créer la tontine
                        <Gift size={18} />
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>

            {/* Save & Exit Option */}
            <div className="text-center mt-4">
              <button 
                type="button"
                onClick={handleSaveAndExit}
                className="text-xs text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 font-medium underline transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 outline-none rounded p-0.5"
              >
                Sauvegarder la progression et quitter
              </button>
            </div>
          </div>

          {/* Real-time preview sidebar */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/60 dark:border-slate-850 p-6 sticky top-28">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-amber-500" />
                Aperçu en temps réel
              </h3>
              
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Cagnotte par cycle</span>
                  <p className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
                    {totalPot.toLocaleString()} <span className="text-xs font-normal text-slate-500">FCFA</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Cotisation</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{Number(formData.amount || 0).toLocaleString()} FCFA</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Membres</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{formData.maxMembers || 0}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>Durée</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{formData.duration || 0} cycles</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fréquence</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">{formData.frequency === 'weekly' ? 'Hebdomadaire' : 'Mensuelle'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mode de tirage</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">{formData.draw_mode}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Badges Section with correct spelling */}
        <div className="mt-12 flex flex-wrap justify-center gap-6 text-center">
          {[
            { icon: Shield, text: '100% Sécurisé', link: '/security' },
            { icon: Award, text: 'Sans engagement', link: '/terms' },
            { icon: ThumbsUp, text: 'Support 24/7', link: '/support' }
          ].map((badge, idx) => (
            <a 
              key={idx} 
              href={badge.link}
              onClick={(e) => { e.preventDefault(); toast.info("Lien d'information simulé."); }}
              className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 outline-none rounded px-1"
            >
              <badge.icon size={14} />
              <span>{badge.text}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TontineCreation;