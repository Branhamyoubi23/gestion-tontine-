import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navigation from '@/components/shared/Navigation';
import {
  ArrowLeft, Dice5, Wallet, TrendingUp, AlertTriangle, Crown, Shield,
  Plus, X, Check, Send, Users, Info, Clock, ChevronRight, Hash, Copy, Trash2, Edit2, Loader2, Eye, EyeOff, Calendar, Download
} from 'lucide-react';
import { tontineService, transactionService } from '@/services/api';
import { exportMembersToExcel, exportTransactionsToExcel } from '@/services/exportService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';

/* ─── Design tokens ─── */
const GREEN  = '#1B4332';
const GREEN2 = '#2D6A4F';
const GREEN3 = '#52B788';
const GOLD   = '#C9A84C';
const GOLD2  = '#F0D078';
const CREAM  = '#FDF6E3';
const CREAM2 = '#F4EAC8';
const TXT    = '#1A1A2E';
const MUTED  = '#6B7280';
const DANGER = '#D62828';

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    paid: { label: 'Payé', bg: '#D1FAE5', color: '#065F46' },
    pending: { label: 'En attente', bg: '#FEF3C7', color: '#92400E' },
    missing: { label: 'Retard', bg: '#FEE2E2', color: '#7F1D1D' },
  };
  const s = map[status] ?? map['pending'];
  return (
    <span className="px-3 py-1 text-[10px] font-black uppercase rounded-full" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
};

const AdminTontineDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [tontine, setTontine] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', phone: '' });
  const [adminStats, setAdminStats] = useState<any>(null);

  // Payment Recording States
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({ amount: 0, type: 'contribution', description: '' });

  // Member Edit States
  const [editingMember, setEditingMember] = useState<any>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [detailsRes, membersRes, statsRes] = await Promise.all([
        tontineService.getTontineDetails(id!),
        tontineService.getTontineMembers(id!),
        transactionService.getTontineStats(id!)
      ]);
      
      setTontine(detailsRes.data);
      setMembers(membersRes.data || []);
      setAdminStats(statsRes.data);
      
      const userMembership = membersRes.data.find((m: any) => m.id === user?.id);
      if (userMembership?.role !== 'admin') {
        navigate(`/tontine/${id}`);
      }
    } catch (err) {
      toast.error("Erreur de chargement");
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id && user) fetchData();
  }, [id, user]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await tontineService.addMember(id!, { ...newMember, role: 'member' });
      toast.success("Membre ajouté !");
      setNewMember({ name: '', phone: '' });
      setShowAddForm(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erreur lors de l'ajout");
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await transactionService.adminRecord({
        tontineId: id,
        userId: selectedMember.id,
        ...paymentForm
      });
      toast.success("Opération enregistrée !");
      setSelectedMember(null);
      setPaymentForm({ amount: tontine.amount, type: 'contribution', description: '' });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erreur");
    }
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await tontineService.updateMemberProfile(id!, editingMember.id, {
        name: editingMember.name,
        phone: editingMember.phone,
        role: editingMember.role
      });
      toast.success("Membre mis à jour");
      setEditingMember(null);
      fetchData();
    } catch (err) {
      toast.error("Erreur mise à jour");
    }
  };

  const handleRemoveMember = async (memberId: number, name: string) => {
    if (!window.confirm(`Voulez-vous vraiment retirer ${name} de cette tontine ?`)) return;
    try {
      await tontineService.removeMember(id!, memberId);
      toast.success("Membre retiré");
      fetchData();
    } catch (err) {
      toast.error("Erreur lors du retrait");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#FDF6E3] flex flex-col items-center justify-center">
       <Loader2 className="w-10 h-10 animate-spin text-[#1B4332] mb-4" />
       <p className="font-bold text-[#1B4332] uppercase tracking-[0.2em] text-[10px]">Chargement administration...</p>
    </div>
  );

  if (previewMode) {
    return (
      <div className="min-h-screen" style={{ background: CREAM }}>
        <div className="bg-amber-600 text-white px-4 py-2 flex justify-between items-center text-xs font-bold uppercase tracking-widest sticky top-16 z-max">
           <span>👁️ MODE APERÇU PARTENAIRE</span>
           <button onClick={() => setPreviewMode(false)} className="bg-white text-amber-600 px-3 py-1 rounded-full flex items-center gap-1"><EyeOff size={14}/> QUITTER</button>
        </div>
        <Navigation />
        <div className="max-w-4xl mx-auto py-12 px-4 text-center">
            <h1 className="text-4xl font-serif font-black mb-4">Vue Membre</h1>
            <p className="text-muted-foreground mb-8">Vous visualisez ce que vos partenaires voient.</p>
            <button onClick={() => navigate(`/tontine/${id}`)} className="px-6 py-3 bg-[#1B4332] text-white rounded-xl font-bold uppercase text-xs tracking-widest">Voir les détails réels</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: CREAM, fontFamily: 'DM Sans, sans-serif' }}>
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-2 opacity-60 hover:opacity-100 transition-opacity">
              <ArrowLeft size={14} /> Dashboard
            </button>
            <h1 className="text-3xl font-black flex items-center gap-2" style={{ color: TXT, fontFamily: 'Playfair Display, serif' }}>
              <Crown size={28} style={{ color: GOLD }} /> Gestion {tontine.name}
            </h1>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-xs italic" style={{ color: MUTED }}>Espace Fondateur · {tontine.join_code}</p>
              <button onClick={() => setPreviewMode(true)} className="flex items-center gap-1.5 text-[10px] font-black uppercase text-amber-600 hover:underline">
                <Eye size={12}/> Voir comme membre
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => navigate(`/tontine/${id}/draw`)} className="px-5 py-2.5 rounded-full text-xs font-black bg-[#C9A84C] text-[#1B4332] shadow-lg hover:scale-105 transition-all">
              🎲 TIRAGE & ROTATION
            </button>
            <button 
              onClick={async () => {
                const res = await transactionService.getByTontine(id!);
                exportTransactionsToExcel(res.data, tontine.name);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#1B4332] text-white rounded-full text-[10px] font-black uppercase hover:bg-black transition-all shadow-md"
            >
              <Download size={14} /> Journal Caisse
            </button>
          </div>
        </div>

        {/* ── Summary Stats Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"><Wallet size={16}/></div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#6B7280]">Caisse Banque</p>
            </div>
            <p className="text-2xl font-bold text-emerald-700">{Number(adminStats?.global?.global_bank || 0).toLocaleString()} <span className="text-xs font-normal">FCFA</span></p>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center"><TrendingUp size={16}/></div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#6B7280]">Total Tontine</p>
            </div>
            <p className="text-2xl font-bold text-indigo-700">{Number(adminStats?.global?.global_tontine || 0).toLocaleString()} <span className="text-xs font-normal">FCFA</span></p>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center"><AlertTriangle size={16}/></div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#6B7280]">Prêts en cours</p>
            </div>
            <p className="text-2xl font-bold text-amber-600">{Number(adminStats?.global?.global_loans || 0).toLocaleString()} <span className="text-xs font-normal">FCFA</span></p>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center"><Shield size={16}/></div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#6B7280]">Caisse Amendes</p>
            </div>
            <p className="text-2xl font-bold text-rose-600">{Number(adminStats?.global?.global_penalties || 0).toLocaleString()} <span className="text-xs font-normal">FCFA</span></p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-emerald-50">
               <div className="px-8 py-6 bg-slate-50 border-b flex justify-between items-center" style={{ borderColor: CREAM2 }}>
                  <h2 className="font-serif font-black text-xl flex items-center gap-3" style={{ color: TXT }}>
                    <Users size={24} style={{ color: GREEN }} /> 
                    Fiche des Partenaires
                  </h2>
                  <button 
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center gap-2 px-6 py-2 rounded-full text-[11px] font-black text-white transition-all bg-[#2D6A4F] hover:scale-105 shadow-md"
                  >
                    {showAddForm ? <X size={14} /> : <><Plus size={14} /> AJOUTER UN MEMBRE</>}
                  </button>
               </div>

               {showAddForm && (
                 <div className="p-8 bg-slate-50 border-b animate-in fade-in slide-in-from-top-1">
                    <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-4 items-end">
                       <div className="flex-1 space-y-2">
                          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Nom du partenaire</label>
                          <input required value={newMember.name} onChange={e=>setNewMember({...newMember, name: e.target.value})} className="w-full h-12 px-5 rounded-2xl border-2 border-white focus:border-[#C9A84C] outline-none shadow-sm font-bold" placeholder="Ex: Jean Paul" />
                       </div>
                       <div className="flex-1 space-y-2">
                          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Téléphone</label>
                          <input required value={newMember.phone} onChange={e=>setNewMember({...newMember, phone: e.target.value})} className="w-full h-12 px-5 rounded-2xl border-2 border-white focus:border-[#C9A84C] outline-none shadow-sm font-bold" placeholder="6XX XXX XXX" />
                       </div>
                       <button type="submit" className="h-12 px-8 bg-[#C9A84C] text-[#1B4332] font-black text-xs rounded-2xl hover:shadow-xl transition-all uppercase tracking-widest">Enregistrer</button>
                    </form>
                 </div>
               )}

               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                          <th className="px-8 py-5">Identité</th>
                          <th className="px-8 py-5">Poste</th>
                          <th className="px-8 py-5 text-right">Actions Fondateur</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-50">
                       {members.map((m, idx) => (
                         <tr key={m.id} className="hover:bg-emerald-50/30 transition-colors">
                            <td className="px-8 py-5">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-xs">
                                     {m.name.charAt(0)}
                                  </div>
                                  <div>
                                     <p className="font-black text-[#1A1A2E]">{m.name}</p>
                                     <p className="text-[10px] font-bold text-slate-400 italic">#{idx + 1} membres</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-8 py-5">
                               <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${m.role === 'admin' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-600'}`}>
                                 {m.role === 'admin' ? 'FONDATEUR' : 'PARTENAIRE'}
                               </span>
                            </td>
                            <td className="px-8 py-5 text-right">
                               <div className="flex justify-end gap-2">
                                  <button onClick={() => { setSelectedMember(m); setPaymentForm({...paymentForm, amount: tontine.amount}); }} className="px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 transition-all">
                                    ENCAISSER
                                  </button>
                                  <button onClick={() => setEditingMember(m)} className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-white border border-transparent hover:border-blue-100 transition-all"><Edit2 size={16}/></button>
                                  {m.id !== user?.id && (
                                    <button onClick={() => handleRemoveMember(m.id, m.name)} className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-white border border-transparent hover:border-rose-100 transition-all"><Trash2 size={16}/></button>
                                  )}
                               </div>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
               </div>
            </div>
          </div>

          <div className="space-y-6">
             <div className="bg-white p-8 rounded-[32px] shadow-sm border border-emerald-50">
                <h3 className="font-serif font-black text-lg mb-6 flex items-center gap-3">
                  <Info size={20} className="text-[#C9A84C]" /> 
                  Détails du Cercle
                </h3>
                <div className="space-y-4">
                   <div className="flex justify-between items-center py-3 border-b border-slate-50">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saisie par séance</span>
                      <span className="font-black text-indigo-900">{tontine.amount.toLocaleString()} FCFA</span>
                   </div>
                   <div className="flex justify-between items-center py-3 border-b border-slate-50">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Membres Actuels</span>
                      <span className="font-black">{members.length} / {tontine.max_members}</span>
                   </div>
                   <div className="flex justify-between items-center py-3 border-b border-slate-50">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fréquence</span>
                      <span className="font-black uppercase text-xs">{tontine.frequency}</span>
                   </div>
                   <div className="pt-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Code de Ralliement</p>
                      <div className="flex items-center gap-2 p-4 bg-emerald-50 rounded-2xl border-2 border-dashed border-emerald-200">
                        <code className="flex-1 font-mono font-black text-xl text-emerald-900 text-center">{tontine.join_code}</code>
                        <button onClick={() => { navigator.clipboard.writeText(tontine.join_code); toast.success("Code copié !"); }} className="p-2 bg-white rounded-xl shadow-sm text-emerald-600 hover:scale-110 transition-all"><Copy size={16}/></button>
                      </div>
                   </div>
                </div>
             </div>

             <div className="bg-indigo-900 p-8 rounded-[32px] text-white shadow-xl relative overflow-hidden group">
                <div className="relative z-10">
                   <h3 className="font-black text-lg mb-2">Rapport Financier</h3>
                   <p className="text-[10px] text-indigo-300 font-bold mb-6">Extraire la liste des membres pour pointage manuel.</p>
                   <button onClick={() => exportMembersToExcel(members, tontine.name)} className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-lg">
                      <Copy size={16} className="text-amber-400" /> Télécharger Excel
                   </button>
                </div>
                <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
                   <TrendingUp size={140} />
                </div>
             </div>
          </div>

        </div>
      </div>

      {/* ── MODAL: Encaissement / Coter ── */}
      {selectedMember && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#1A1A2E]/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden border border-emerald-50 scale-in-center">
              <div className="bg-[#1B4332] px-8 py-6 text-white flex justify-between items-center">
                 <div>
                   <h3 className="font-black text-xl">Saisie Manuelle</h3>
                   <p className="text-[10px] opacity-60 font-black uppercase tracking-widest">Pour : {selectedMember.name}</p>
                 </div>
                 <button onClick={() => setSelectedMember(null)} className="p-2 hover:bg-white/10 rounded-full transition-all"><X size={24}/></button>
              </div>
              <form onSubmit={handleRecordPayment} className="p-10 space-y-6">
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Nature de l'opération</label>
                    <div className="grid grid-cols-1 gap-3">
                       <select 
                         value={paymentForm.type}
                         onChange={e => setPaymentForm({...paymentForm, type: e.target.value})}
                         className="w-full h-14 px-5 rounded-2xl bg-slate-50 border-2 border-slate-50 focus:border-[#C9A84C] outline-none font-bold text-sm"
                       >
                         <option value="contribution">🤝 COTISATION TONTINE</option>
                         <option value="bank">🏦 ÉPARGNE BANQUE</option>
                         <option value="penalty">⚖️ AMENDE / SANCTION</option>
                         <option value="loan">💸 DÉCAISSER EMPRUNT</option>
                         <option value="repayment">🔄 RETOUR EMPRUNT</option>
                       </select>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Somme perçue (FCFA)</label>
                    <input required type="number" value={paymentForm.amount} onChange={e=>setPaymentForm({...paymentForm, amount: Number(e.target.value)})} className="w-full h-14 px-6 rounded-2xl bg-slate-50 border-2 border-emerald-50 outline-none font-black text-2xl text-[#1B4332]" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Note / Séance</label>
                    <input value={paymentForm.description} onChange={e=>setPaymentForm({...paymentForm, description: e.target.value})} placeholder="Ex: Séance du 15 Octobre..." className="w-full h-14 px-6 rounded-2xl bg-slate-50 border-2 border-slate-50 outline-none font-bold italic" />
                 </div>
                 <button type="submit" className="w-full h-16 bg-[#1B4332] text-white font-black rounded-3xl shadow-xl shadow-emerald-900/20 hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-[0.2em]">
                   Valider l'écriture
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* ── MODAL: Modifier Partenaire ── */}
      {editingMember && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#1A1A2E]/60 backdrop-blur-md">
           <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden border border-emerald-50 scale-in-center">
              <div className="bg-slate-800 px-8 py-6 text-white flex justify-between items-center">
                 <h3 className="font-black text-xl">Profil Partenaire</h3>
                 <button onClick={() => setEditingMember(null)}><X size={24}/></button>
              </div>
              <form onSubmit={handleUpdateMember} className="p-10 space-y-6">
                 <div className="space-y-5">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nom complet</label>
                       <input required value={editingMember.name} onChange={e=>setEditingMember({...editingMember, name: e.target.value})} className="w-full h-14 px-6 rounded-2xl bg-slate-50 border-2 border-slate-50 outline-none font-bold text-lg" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Téléphone</label>
                       <input required value={editingMember.phone} onChange={e=>setEditingMember({...editingMember, phone: e.target.value})} className="w-full h-14 px-6 rounded-2xl bg-slate-50 border-2 border-slate-50 outline-none font-bold text-lg" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rôle au sein du cercle</label>
                       <select value={editingMember.role} onChange={e=>setEditingMember({...editingMember, role: e.target.value})} className="w-full h-14 px-6 rounded-2xl bg-slate-50 border-2 border-slate-50 outline-none font-bold">
                          <option value="member">Partenaire (Standard)</option>
                          <option value="admin">Administrateur (Fondateur)</option>
                       </select>
                    </div>
                 </div>
                 <button type="submit" className="w-full h-16 bg-slate-800 text-white font-black rounded-3xl shadow-xl hover:scale-[1.02] transition-all text-xs uppercase tracking-[0.2em]">Enregistrer les modifications</button>
              </form>
           </div>
        </div>
      )}

    </div>
  );
};

export default AdminTontineDetail;
