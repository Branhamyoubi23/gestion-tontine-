import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Hash, Phone, User, LogIn, AlertCircle, Sparkles, Shield, 
  Crown, ArrowRight, Fingerprint, Lock, Eye, EyeOff, Loader2, ChevronRight
} from 'lucide-react';
import api, { authService } from '@/services/api';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

const MemberSignup = () => {
  const navigate = useNavigate();
  const { setAuthData } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [showSetupForm, setShowSetupForm] = useState(false);
  const [setupUserId, setSetupUserId] = useState<number | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [formData, setFormData] = useState({
    phone: '',
    join_code: '',
  });

  const handleActivationRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.phone.length !== 9) return toast.error("Téléphone à 9 chiffres requis");
    if (!formData.join_code.includes('TONT-')) return toast.error("Code Tontine invalide (ex: TONT-XXXX)");

    setLoading(true);
    try {
      const res = await api.post('/auth/member-login', { ...formData, password: '' });
      if (res.data.success && res.data.require_password_setup) {
        setSetupUserId(res.data.user_id);
        setShowSetupForm(true);
        toast.info("Code validé ! Veuillez maintenant créer votre mot de passe.");
      } else {
        toast.error("Code ou numéro incorrect, ou compte déjà activé.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Échec de l'activation");
    } finally {
      setLoading(false);
    }
  };

  const handleSetupPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) return toast.error("Les mots de passe ne correspondent pas");
    if (password.length < 4) return toast.error("Mini 4 caractères");

    setLoading(true);
    try {
      const res = await authService.setupPassword(setupUserId!, password);
      if (res.token && res.user) {
        setAuthData(res.token, res.user);
        toast.success("Compte Activé ! Bienvenue sur votre espace.");
        navigate('/member/dashboard');
      } else {
        toast.success("Compte Activé ! Vous pouvez maintenant vous connecter.");
        navigate('/member/login');
      }
    } catch (err: any) {
      toast.error("Échec de l'activation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-emerald-50/50 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl opacity-50" />
      
      <div className="w-full max-w-md relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <button onClick={() => navigate('/')} className="text-slate-400 hover:text-slate-900 transition-colors text-xs font-black uppercase tracking-widest mb-8 flex items-center gap-2 mx-auto">
             <ChevronRight className="rotate-180" size={14} /> Retour au Portail
          </button>
          <div className="w-20 h-20 bg-white border-2 border-emerald-100 rounded-3xl mx-auto flex items-center justify-center text-emerald-600 mb-6 shadow-xl">
            <Sparkles size={36} />
          </div>
          <h1 className="text-4xl font-serif font-black text-slate-900 mb-2">Activation Membre</h1>
          <p className="text-slate-500 font-mediumitalic">Utilisez votre code d'invitation personnel</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-emerald-100 p-10 rounded-[48px] shadow-xl shadow-emerald-200/40">
           {!showSetupForm ? (
             <form onSubmit={handleActivationRequest} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Code Tontine</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" size={18} />
                    <input 
                      type="text" 
                      value={formData.join_code} 
                      onChange={e => setFormData({ ...formData, join_code: e.target.value.toUpperCase() })} 
                      className="w-full h-14 pl-12 bg-slate-50 border border-transparent rounded-2xl text-slate-900 outline-none focus:border-emerald-400 focus:bg-white transition-all font-black text-lg placeholder:text-slate-300" 
                      placeholder="TONT-XXXX"
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Mon Téléphone</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" size={18} />
                    <input 
                      type="text" 
                      value={formData.phone} 
                      onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 9) })} 
                      className="w-full h-14 pl-12 bg-slate-50 border border-transparent rounded-2xl text-slate-900 outline-none focus:border-emerald-400 focus:bg-white transition-all font-black text-lg" 
                      placeholder="600000000"
                      required 
                    />
                  </div>
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-3"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <>Vérifier mon code <ArrowRight size={18} /></>}
                </button>
             </form>
           ) : (
             <form onSubmit={handleSetupPassword} className="space-y-6">
                <div className="text-center mb-8">
                   <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                     <Shield size={32} className="text-emerald-600" />
                   </div>
                   <p className="text-sm text-slate-500 font-medium">Choisissez un mot de passe pour vos prochaines connexions.</p>
                </div>
                <div className="space-y-4">
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" size={18} />
                    <input 
                      type="password" 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      className="w-full h-14 pl-12 bg-slate-50 border border-transparent rounded-2xl text-slate-900 outline-none focus:border-emerald-400 focus:bg-white transition-all" 
                      placeholder="Mot de passe"
                      required 
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" size={18} />
                    <input 
                      type="password" 
                      value={confirmPassword} 
                      onChange={e => setConfirmPassword(e.target.value)} 
                      className="w-full h-14 pl-12 bg-slate-50 border border-transparent rounded-2xl text-slate-900 outline-none focus:border-emerald-400 focus:bg-white transition-all" 
                      placeholder="Confirmation"
                      required 
                    />
                  </div>
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-14 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-xl"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <>Activer mon compte définitivement</>}
                </button>
             </form>
           )}
           
           <div className="mt-8 pt-8 border-t border-slate-50 text-center">
             <p className="text-slate-400 text-sm font-medium">
               Déjà activé ? <button onClick={() => navigate('/member/login')} className="text-emerald-600 font-bold hover:underline">Se connecter</button>
             </p>
           </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MemberSignup;
