import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Phone, Lock, Eye, EyeOff, ArrowRight, Sparkles, 
  Users, Loader2, ShieldCheck, CheckCircle, ChevronRight
} from 'lucide-react';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

const MemberLogin = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 9) {
      toast.error('Téléphone invalide (9 chiffres)');
      return;
    }
    setLoading(true);
    try {
      const res = await login(phone, password);
      // Backend automatically checks if it's a first login if password field was empty in the controller, 
      // but here we just login normally. 
      // If the controller returns require_password_setup, handled in Index.tsx or within auth context.
      // But the user requested a SEPARATE page for first connection.
      
      toast.success('Ravi de vous revoir !');
      navigate('/member/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Identifiants Membre incorrects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-3xl" />
      
      <div className="w-full max-w-md relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <button onClick={() => navigate('/')} className="text-slate-400 hover:text-slate-900 transition-colors text-xs font-black uppercase tracking-widest mb-8 flex items-center gap-2 mx-auto">
             <ChevronRight className="rotate-180" size={14} /> Retour au Portail
          </button>
          <div className="w-20 h-20 bg-emerald-600 rounded-3xl mx-auto flex items-center justify-center text-white mb-6 shadow-2xl shadow-emerald-600/30">
            <Users size={36} />
          </div>
          <h1 className="text-4xl font-serif font-black text-slate-900 mb-2">Espace Membre</h1>
          <p className="text-slate-500 font-medium">Consultez votre épargne en toute sécurité</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="bg-white border border-emerald-100 p-10 rounded-[48px] shadow-xl shadow-emerald-200/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <CheckCircle size={80} className="text-emerald-500" />
          </div>
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Mon Numéro de téléphone</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400" size={18} />
                <input 
                  type="text" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))} 
                  className="w-full h-14 pl-12 bg-slate-50 border border-transparent rounded-2xl text-slate-900 outline-none focus:border-emerald-400 focus:bg-white transition-all font-black text-lg" 
                  placeholder="600000000"
                  required 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Mon Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="w-full h-14 pl-12 bg-slate-50 border border-transparent rounded-2xl text-slate-900 outline-none focus:border-emerald-400 focus:bg-white transition-all" 
                  placeholder="••••••••"
                  required 
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-14 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="animate-spin" /> : <>Se Connecter <ArrowRight size={18} /></>}
            </button>
          </form>
          
          <div className="mt-8 pt-8 border-t border-slate-50 text-center">
            <p className="text-slate-400 text-sm font-medium">
              Première fois ici ? <button onClick={() => navigate('/member/signup')} className="text-emerald-600 font-bold hover:underline">Activer mon compte</button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MemberLogin;