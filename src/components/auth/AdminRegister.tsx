import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, 
  Sparkles, Loader2, Globe, Building, CheckCircle, ChevronRight
} from 'lucide-react';
import { authService } from '@/services/api';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

const AdminRegister = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirm_password) return toast.error("Les mots de passe ne correspondent pas");
    if (formData.phone.length !== 9) return toast.error("Le téléphone doit contenir 9 chiffres");

    setLoading(true);
    try {
      await authService.register({ ...formData, role: 'admin' });
      toast.success("Espace Gestionnaire créé ! Connectez-vous.");
      navigate('/admin/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Échec de l'inscription Admin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl opacity-50" />
      
      <div className="w-full max-w-xl relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <button onClick={() => navigate('/')} className="text-white/40 hover:text-white transition-colors text-xs font-black uppercase tracking-widest mb-8 flex items-center gap-2 mx-auto">
             <ChevronRight className="rotate-180" size={14} /> Retour au Portail
          </button>
          <div className="w-20 h-20 bg-blue-600 rounded-3xl mx-auto flex items-center justify-center text-white mb-6 shadow-2xl shadow-blue-600/30">
            <Building size={36} />
          </div>
          <h1 className="text-4xl font-serif font-black text-white mb-2 tracking-tight line-clamp-1">Créer mon Espace Admin</h1>
          <p className="text-slate-400 font-medium italic">Commencez dès maintenant à digitaliser vos tontines</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="bg-slate-800 border border-slate-700/50 p-10 rounded-[48px] shadow-2xl relative overflow-hidden">
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">Nom Complet</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={e => setFormData({ ...formData, name: e.target.value })} 
                    className="w-full h-14 pl-12 bg-slate-900 border border-slate-700 rounded-2xl text-white outline-none focus:border-blue-500 transition-all font-black text-sm" 
                    placeholder="John Doe"
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="email" 
                    value={formData.email} 
                    onChange={e => setFormData({ ...formData, email: e.target.value })} 
                    className="w-full h-14 pl-12 bg-slate-900 border border-slate-700 rounded-2xl text-white outline-none focus:border-blue-500 transition-all font-black text-sm" 
                    placeholder="john@example.com"
                    required 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">Numéro de téléphone</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text" 
                  value={formData.phone} 
                  onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 9) })} 
                  className="w-full h-14 pl-12 bg-slate-900 border border-slate-700 rounded-2xl text-white outline-none focus:border-blue-500 transition-all font-black text-lg" 
                  placeholder="600000000"
                  required 
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">Mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={formData.password} 
                    onChange={e => setFormData({ ...formData, password: e.target.value })} 
                    className="w-full h-14 pl-12 bg-slate-900 border border-slate-700 rounded-2xl text-white outline-none focus:border-blue-500 transition-all" 
                    placeholder="••••••••"
                    required 
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">Confirmation</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={formData.confirm_password} 
                    onChange={e => setFormData({ ...formData, confirm_password: e.target.value })} 
                    className="w-full h-14 pl-12 bg-slate-900 border border-slate-700 rounded-2xl text-white outline-none focus:border-blue-500 transition-all" 
                    placeholder="••••••••"
                    required 
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-14 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="animate-spin" /> : <>Créer mon organisation <ArrowRight size={18} /></>}
            </button>
          </form>
          
          <div className="mt-8 pt-8 border-t border-slate-700/50 text-center">
            <p className="text-slate-500 text-sm font-medium italic">
              Vous avez déjà un espace ? <button onClick={() => navigate('/admin/login')} className="text-blue-400 font-bold hover:underline">Se connecter</button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminRegister;
