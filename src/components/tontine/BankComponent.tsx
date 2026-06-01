import React, { useState, useEffect, useCallback, useRef } from 'react';
import { bankService } from '@/services/apiExt';
import { tontineService } from '@/services/api';
import {
  Wallet, TrendingUp, ArrowUpRight, ArrowDownLeft, Plus,
  Calendar, DollarSign, History, PiggyBank, Percent, Clock,
  Shield, AlertCircle, CheckCircle, Users, RefreshCw,
  X, AlertTriangle, Info, Search, ChevronRight,
  BarChart3, ArrowDown, Loader2
} from 'lucide-react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

interface BankComponentProps {
  tontineId: string | number;
}

/* ─── Validation helpers ─── */
const isPositiveNumber = (v: string) => !isNaN(Number(v)) && Number(v) > 0;
const isValidRate = (v: string) => isPositiveNumber(v) && Number(v) <= 100;
const isValidFutureDate = (v: string) => {
  if (!v) return false;
  return new Date(v) > new Date();
};

/* ─── Skeleton primitives ─── */
const Sk = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-slate-100 rounded-2xl ${className}`} />
);

function AdminStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-3">
          <Sk className="h-3 w-24" />
          <Sk className="h-7 w-32" />
        </div>
      ))}
    </div>
  );
}

function MemberCardSkeleton() {
  return (
    <div className="bg-gradient-to-br from-slate-200 to-slate-100 p-8 rounded-[40px] animate-pulse">
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div className="space-y-3">
          <Sk className="h-4 w-36" />
          <Sk className="h-10 w-48" />
          <Sk className="h-3 w-56" />
        </div>
        <div className="flex justify-end">
          <Sk className="h-12 w-32 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

function LoansSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="p-6 border border-slate-100 rounded-3xl space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <Sk className="w-12 h-12 rounded-2xl" />
              <div className="space-y-2">
                <Sk className="h-4 w-40" />
                <Sk className="h-3 w-28" />
              </div>
            </div>
            <Sk className="h-6 w-20 rounded-full" />
          </div>
          <Sk className="h-px w-full rounded-none" />
          <div className="flex justify-between">
            <Sk className="h-3 w-48" />
            <Sk className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Status badge color ─── */
const loanStatusClass = (s: string) => {
  if (s === 'remboursé') return 'bg-emerald-100 text-emerald-700';
  if (s === 'en retard') return 'bg-red-100 text-red-700';
  return 'bg-blue-100 text-blue-700';
};
const loanIconClass = (s: string) => {
  if (s === 'remboursé') return 'bg-emerald-100 text-emerald-600';
  if (s === 'en retard') return 'bg-red-100 text-red-600';
  return 'bg-blue-100 text-blue-600';
};
const dueDateColor = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return 'text-red-600 font-black';
  if (diff <= 7) return 'text-amber-600 font-black';
  return 'text-slate-600';
};

/* ─── Main Component ─── */
const BankComponent: React.FC<BankComponentProps> = ({ tontineId }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [status, setStatus] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'loans' | 'history'>('loans');
  const [memberSearch, setMemberSearch] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const HISTORY_PER_PAGE = 5;

  // Modal visibility
  const [showContribute, setShowContribute] = useState(false);
  const [showAdminLoan, setShowAdminLoan] = useState(false);

  // Form fields
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState('10');
  const [targetUserId, setTargetUserId] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Validation errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Button submitting states
  const [submittingContribute, setSubmittingContribute] = useState(false);
  const [submittingLoan, setSubmittingLoan] = useState(false);
  const [reimbursingId, setReimbursingId] = useState<number | null>(null);

  // Auto-refresh
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Data fetching ── */
  const fetchStatus = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setIsRefreshing(true);
      setError(null);
      const res = await bankService.getBankStatus(tontineId);
      if (res.success) setStatus(res.data);
      else setError('Les données de la banque sont indisponibles.');
    } catch (err: any) {
      const msg = err?.response?.status === 403
        ? "Vous n'avez pas accès aux données de cette banque."
        : err?.response?.status === 404
        ? "Cette banque n'existe pas encore pour cette tontine."
        : "Erreur de connexion au serveur. Vérifiez votre réseau.";
      setError(msg);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [tontineId]);

  const fetchMembers = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await tontineService.getMembers(tontineId);
      setMembers(res.data || []);
    } catch {
      toast.error("Impossible de charger la liste des membres.");
    }
  }, [tontineId, isAdmin]);

  useEffect(() => {
    fetchStatus();
    fetchMembers();
    // Auto-refresh every 60s
    refreshTimer.current = setInterval(() => fetchStatus(true), 60_000);
    return () => { if (refreshTimer.current) clearInterval(refreshTimer.current); };
  }, [fetchStatus, fetchMembers]);

  /* ── Handlers ── */
  const handleContribute = async () => {
    const errs: Record<string, string> = {};
    if (!isPositiveNumber(amount)) errs.amount = 'Veuillez entrer un montant valide et positif.';
    if (Number(amount) > 10_000_000) errs.amount = 'Montant trop élevé (max 10 000 000 FCFA).';
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    try {
      setSubmittingContribute(true);
      await bankService.contribute(tontineId, Number(amount));
      toast.success('Épargne enregistrée avec succès !');
      setShowContribute(false);
      setAmount('');
      setFormErrors({});
      fetchStatus(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Échec de l'opération d'épargne. Réessayez.";
      toast.error(msg);
    } finally {
      setSubmittingContribute(false);
    }
  };

  const handleRecordLoan = async () => {
    const errs: Record<string, string> = {};
    if (!targetUserId) errs.targetUserId = 'Veuillez sélectionner un membre.';
    if (!isPositiveNumber(amount)) errs.amount = 'Montant invalide ou manquant.';
    if (!isValidRate(rate)) errs.rate = 'Le taux doit être entre 0 et 100%.';
    if (!isValidFutureDate(dueDate)) errs.dueDate = 'La date doit être dans le futur.';
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    try {
      setSubmittingLoan(true);
      await bankService.loan({
        tontineId,
        userId: targetUserId,
        amount: Number(amount),
        interest_rate: Number(rate),
        due_date: dueDate,
      });
      toast.success('Emprunt enregistré avec succès !');
      setShowAdminLoan(false);
      setAmount('');
      setTargetUserId('');
      setDueDate('');
      setRate('10');
      setFormErrors({});
      fetchStatus(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Erreur lors de l'enregistrement de l'emprunt.";
      toast.error(msg);
    } finally {
      setSubmittingLoan(false);
    }
  };

  const handleReimburse = async (loanId: number) => {
    try {
      setReimbursingId(loanId);
      await bankService.reimburse(loanId);
      toast.success('Prêt marqué comme remboursé !');
      fetchStatus(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erreur lors du marquage du remboursement.");
    } finally {
      setReimbursingId(null);
    }
  };

  const openContribute = () => { setAmount(''); setFormErrors({}); setShowContribute(true); };
  const openAdminLoan = () => { setAmount(''); setRate('10'); setTargetUserId(''); setDueDate(''); setFormErrors({}); setShowAdminLoan(true); };
  const closeContribute = () => { setShowContribute(false); setFormErrors({}); };
  const closeAdminLoan = () => { setShowAdminLoan(false); setFormErrors({}); };

  const filteredMembers = members.filter(m =>
    m.official_name?.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const allLoans: any[] = status?.user_loans || status?.all_loans || [];
  const history: any[] = status?.history || [];
  const paginatedHistory = history.slice((historyPage - 1) * HISTORY_PER_PAGE, historyPage * HISTORY_PER_PAGE);
  const totalHistPages = Math.ceil(history.length / HISTORY_PER_PAGE);

  /* ── Loan interest preview ── */
  const previewInterest = Number(amount) * (Number(rate) / 100);
  const previewTotal = Number(amount) + previewInterest;

  /* ── States: Loading / Error / No data ── */
  if (loading) {
    return (
      <div className="space-y-6">
        {isAdmin ? <AdminStatsSkeleton /> : <MemberCardSkeleton />}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-[40px] shadow-sm border border-slate-50 overflow-hidden">
            <div className="px-8 py-6 border-b bg-slate-50/50 flex items-center gap-3">
              <Sk className="h-5 w-5 rounded-lg" />
              <Sk className="h-5 w-44" />
            </div>
            <LoansSkeleton />
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-[40px] p-8 border border-slate-100">
              <Sk className="h-4 w-32 mb-6" />
              <div className="space-y-4">
                <Sk className="h-16 w-full rounded-2xl" />
                <Sk className="h-16 w-full rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-[40px] p-12 flex flex-col items-center gap-6 border border-red-100 shadow-sm text-center">
        <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center">
          <AlertTriangle size={32} className="text-red-400" />
        </div>
        <div>
          <p className="font-black text-slate-800 text-lg mb-2">Données indisponibles</p>
          <p className="text-sm text-slate-500 max-w-sm">{error}</p>
        </div>
        <button
          onClick={() => fetchStatus()}
          className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-700 transition-all flex items-center gap-2"
        >
          <RefreshCw size={14} /> Réessayer
        </button>
      </div>
    );
  }

  if (!status) return null;

  return (
    <div className="space-y-6">
      {/* ── Refresh indicator ── */}
      <div className="flex justify-end">
        <button
          onClick={() => fetchStatus(true)}
          disabled={isRefreshing}
          aria-label="Actualiser les données bancaires"
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
          {isRefreshing ? 'Actualisation…' : 'Actualiser'}
        </button>
      </div>

      {/* ── Admin stats ── */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4" role="region" aria-label="Statistiques banque">
          <div className="bg-slate-900 p-6 rounded-[32px] text-white shadow-xl">
            <p className="text-[9px] font-black uppercase text-white/40 tracking-widest mb-1">Volume Banque</p>
            <p className="text-xl font-black">
              {status.total_bank_volume?.toLocaleString()} <span className="text-[10px] font-normal opacity-50">FCFA</span>
            </p>
          </div>
          <div className="bg-white p-6 rounded-[32px] border border-emerald-100">
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Total Emprunté</p>
            <p className="text-xl font-black text-emerald-800">
              {status.total_borrowed?.toLocaleString()} <span className="text-[10px] font-normal">FCFA</span>
            </p>
          </div>
          <div className="bg-white p-6 rounded-[32px] border border-amber-100">
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Intérêts Générés</p>
            <p className="text-xl font-black text-amber-600">
              {status.total_interest_generated?.toLocaleString()} <span className="text-[10px] font-normal">FCFA</span>
            </p>
          </div>
          <div className={`p-6 rounded-[32px] border ${status.late_members_count > 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
            <p className="text-[9px] font-black uppercase tracking-widest mb-1 text-slate-400">En Retard</p>
            <p className={`text-xl font-black ${status.late_members_count > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {status.late_members_count} <span className="text-[10px] font-normal">Membres</span>
            </p>
          </div>
        </div>
      )}

      {/* ── Member personal hero card ── */}
      {!isAdmin && (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <PiggyBank className="text-emerald-400" />
                </div>
                <h3 className="font-serif font-black text-xl">Mon Épargne &amp; Gains</h3>
              </div>
              <p className="text-4xl font-black mb-2">
                {status.user_total_savings?.toLocaleString()} <span className="text-sm font-normal opacity-50">FCFA</span>
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-emerald-500" />
                  {status.user_savings?.toLocaleString()} épargné
                </span>
                <span className="flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-amber-400" />
                  +{status.user_gain_est?.toLocaleString()} ({status.user_gain_rate}%)
                </span>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={openContribute}
                aria-label="Épargner de l'argent"
                className="px-8 py-3 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all"
              >
                Épargner
              </button>
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
            <TrendingUp size={240} />
          </div>
        </div>
      )}

      {/* ── Layout grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Loans list + history tabs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-50 overflow-hidden">
            {/* Tab bar */}
            <div className="px-8 py-5 border-b flex justify-between items-center bg-slate-50/50 gap-4 flex-wrap">
              <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl">
                <button
                  onClick={() => setActiveTab('loans')}
                  aria-selected={activeTab === 'loans'}
                  role="tab"
                  className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'loans' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <span className="flex items-center gap-2"><Shield size={13} /> Emprunts</span>
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  aria-selected={activeTab === 'history'}
                  role="tab"
                  className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <span className="flex items-center gap-2"><History size={13} /> Historique</span>
                </button>
              </div>
              {isAdmin && activeTab === 'loans' && (
                <button
                  onClick={openAdminLoan}
                  aria-label="Enregistrer un nouvel emprunt"
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-2xl hover:bg-emerald-200 transition-all font-black text-[11px] uppercase tracking-widest"
                >
                  <Plus size={14} /> Emprunt
                </button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {/* ── Loans Tab ── */}
              {activeTab === 'loans' && (
                <motion.div
                  key="loans"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="p-4 space-y-3"
                >
                  {allLoans.length > 0 ? (
                    allLoans.map((loan: any) => (
                      <div key={loan.id} className="p-6 bg-white border border-slate-100 rounded-3xl hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-4 flex-wrap gap-3">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${loanIconClass(loan.status)}`}>
                              <ArrowUpRight size={22} />
                            </div>
                            <div>
                              {isAdmin && loan.member_name && (
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{loan.member_name}</p>
                              )}
                              <p className="font-black text-slate-800">Emprunt de {loan.amount?.toLocaleString()} FCFA</p>
                              <p className="text-[10px] font-bold text-slate-400">
                                Taux : {loan.interest_rate}% · Intérêt : {loan.interest?.toLocaleString()} FCFA
                              </p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${loanStatusClass(loan.status)} ${loan.status === 'en retard' ? 'font-blink' : ''}`}>
                            {loan.status}
                          </span>
                        </div>

                        {/* Interest breakdown */}
                        <div className="bg-slate-50 rounded-2xl p-3 mb-4 grid grid-cols-3 gap-2 text-center">
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Principal</p>
                            <p className="text-xs font-black text-slate-700">{loan.amount?.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Intérêt</p>
                            <p className="text-xs font-black text-amber-600">+{loan.interest?.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total</p>
                            <p className="text-xs font-black text-emerald-700">{loan.total_to_repay?.toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-slate-50 flex-wrap gap-2">
                          <div className="text-[10px] font-bold text-slate-500">
                            Échéance :{' '}
                            <span className={dueDateColor(loan.due_date)}>
                              {new Date(loan.due_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          {isAdmin && loan.status !== 'remboursé' && (
                            <button
                              onClick={() => handleReimburse(loan.id)}
                              disabled={reimbursingId === loan.id}
                              className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 hover:text-emerald-500 disabled:opacity-60 transition-colors"
                            >
                              {reimbursingId === loan.id ? (
                                <><Loader2 size={12} className="animate-spin" /> Traitement…</>
                              ) : (
                                <><CheckCircle size={12} /> Marquer réglé</>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-16 text-center space-y-3">
                      <div className="w-14 h-14 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto">
                        <Wallet size={24} className="text-slate-300" />
                      </div>
                      <p className="text-sm font-bold text-slate-400">Aucun emprunt en cours.</p>
                      {isAdmin && (
                        <button onClick={openAdminLoan} className="text-xs font-black text-emerald-600 hover:underline flex items-center gap-1 mx-auto">
                          <Plus size={12} /> Enregistrer un premier emprunt
                        </button>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── History Tab ── */}
              {activeTab === 'history' && (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="p-4"
                >
                  {history.length > 0 ? (
                    <>
                      <div className="space-y-2 mb-4">
                        {paginatedHistory.map((tx: any, i: number) => (
                          <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tx.type === 'épargne' ? 'bg-emerald-100' : 'bg-blue-100'}`}>
                                {tx.type === 'épargne'
                                  ? <ArrowDown size={16} className="text-emerald-600" />
                                  : <ArrowUpRight size={16} className="text-blue-600" />}
                              </div>
                              <div>
                                <p className="text-xs font-black text-slate-700 capitalize">{tx.type}</p>
                                <p className="text-[10px] text-slate-400 font-medium">
                                  {tx.date ? new Date(tx.date).toLocaleDateString('fr-FR') : '—'}
                                </p>
                              </div>
                            </div>
                            <p className={`font-black text-sm ${tx.type === 'épargne' ? 'text-emerald-600' : 'text-blue-600'}`}>
                              {tx.amount?.toLocaleString()} FCFA
                            </p>
                          </div>
                        ))}
                      </div>
                      {/* Pagination */}
                      {totalHistPages > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-2">
                          {[...Array(totalHistPages)].map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setHistoryPage(i + 1)}
                              className={`w-7 h-7 rounded-lg text-xs font-black transition-all ${historyPage === i + 1 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                            >
                              {i + 1}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="py-16 text-center">
                      <BarChart3 size={32} className="text-slate-200 mx-auto mb-3" />
                      <p className="text-sm font-bold text-slate-400">Aucun historique disponible.</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Sidebar */}
        <div className="space-y-6">
          {/* Health / Vigilance card */}
          {isAdmin ? (
            <div className="bg-white rounded-[40px] p-8 border border-red-50 shadow-sm overflow-hidden relative">
              <h4 className="font-black text-sm text-red-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                <AlertCircle size={16} /> Vigilance Retards
              </h4>
              <p className="text-xs text-slate-500 mb-6 font-medium leading-relaxed">
                Certains membres ont dépassé leur date limite de remboursement.
              </p>
              {status.late_members_count > 0 ? (
                <div className="p-4 bg-red-50 rounded-2xl flex items-center gap-3">
                  <Users size={20} className="text-red-400 shrink-0" />
                  <span className="text-xs font-black text-red-700">{status.late_members_count} membres en alerte</span>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 rounded-2xl flex items-center gap-3">
                  <CheckCircle size={20} className="text-emerald-400 shrink-0" />
                  <span className="text-xs font-black text-emerald-700">Tout est en ordre 🎉</span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-indigo-600 p-8 rounded-[40px] text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <h4 className="font-black text-xs uppercase tracking-widest text-indigo-300 mb-4">Statut de santé</h4>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                    {status.is_up_to_date
                      ? <CheckCircle size={24} className="text-emerald-400" />
                      : <AlertCircle size={24} className="text-amber-400" />}
                  </div>
                  <div>
                    <p className="font-black text-lg">{status.is_up_to_date ? 'Situation Saine' : 'Attention'}</p>
                    <p className="text-[10px] text-white/50">
                      {status.is_up_to_date
                        ? 'Vous êtes à jour de vos crédits.'
                        : 'Un remboursement est attendu.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('history')}
                  className="w-full py-3 bg-white/10 rounded-2xl text-xs font-black uppercase hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                >
                  <History size={13} /> Voir l'historique
                </button>
              </div>
              <div className="absolute -right-8 -bottom-8 opacity-5 pointer-events-none">
                <Shield size={160} />
              </div>
            </div>
          )}

          {/* Info card */}
          <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm">
            <h4 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-6">Informations Banque</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-7 h-7 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                  <Percent size={12} className="text-emerald-600" />
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Taux de gain actuel :{' '}
                  <span className="font-black text-emerald-700">{status.user_gain_rate}%</span> par cycle.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-7 h-7 bg-blue-50 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                  <Clock size={12} className="text-blue-600" />
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Les intérêts perçus sur les prêts sont redistribués en fin de cycle à tous les membres épargnants.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-7 h-7 bg-amber-50 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                  <Info size={12} className="text-amber-600" />
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Les remboursements en retard génèrent des pénalités cumulatives.
                </p>
              </li>
            </ul>
          </div>

          {/* Savings goal progress (member only) */}
          {!isAdmin && status.savings_goal != null && (
            <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm">
              <h4 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-4">Objectif d'Épargne</h4>
              <div className="flex justify-between text-xs font-black text-slate-600 mb-2">
                <span>{status.user_savings?.toLocaleString()} FCFA</span>
                <span className="text-slate-400">{status.savings_goal?.toLocaleString()} FCFA</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (status.user_savings / status.savings_goal) * 100)}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
              <p className="text-[10px] text-slate-400 font-bold mt-2 text-right">
                {Math.min(100, Math.round((status.user_savings / status.savings_goal) * 100))}% atteint
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {/* Contribute modal */}
        {showContribute && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Épargner">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={closeContribute}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-[40px] shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="font-serif font-black text-xl">Fonder mon Épargne</h4>
                  <button onClick={closeContribute} aria-label="Fermer" className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-all">
                    <X size={16} />
                  </button>
                </div>
                <div className="space-y-4 mb-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest" htmlFor="contribute-amount">
                      Montant à verser (FCFA)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input
                        id="contribute-amount"
                        type="number"
                        min="1"
                        value={amount}
                        onChange={e => { setAmount(e.target.value); setFormErrors(p => ({ ...p, amount: '' })); }}
                        className={`w-full h-14 pl-12 pr-6 bg-slate-50 rounded-2xl border-2 outline-none font-black text-lg transition-colors ${formErrors.amount ? 'border-red-400 bg-red-50' : 'border-transparent focus:border-emerald-400'}`}
                        placeholder="10 000"
                      />
                    </div>
                    {formErrors.amount && (
                      <p className="text-[11px] text-red-500 font-bold ml-1 flex items-center gap-1">
                        <AlertTriangle size={11} /> {formErrors.amount}
                      </p>
                    )}
                  </div>
                  {isPositiveNumber(amount) && (
                    <div className="p-4 bg-emerald-50 rounded-2xl flex items-center justify-between">
                      <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Gain estimé :</span>
                      <span className="font-black text-emerald-700">
                        +{(Number(amount) * (status.user_gain_rate / 100)).toLocaleString()} FCFA
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleContribute}
                  disabled={submittingContribute}
                  className="w-full h-14 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-500 shadow-xl shadow-emerald-600/20 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {submittingContribute ? <><Loader2 size={16} className="animate-spin" /> Traitement…</> : 'Confirmer le Versement'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Admin loan modal */}
        {showAdminLoan && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Enregistrer un emprunt">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={closeAdminLoan}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl relative z-10 overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="font-serif font-black text-xl">Enregistrer un Emprunt</h4>
                  <button onClick={closeAdminLoan} aria-label="Fermer" className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-all">
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-5 mb-8">
                  {/* Member selector with search */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest" htmlFor="loan-member">Membre</label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={15} />
                      <input
                        type="text"
                        value={memberSearch}
                        onChange={e => setMemberSearch(e.target.value)}
                        className="w-full h-10 pl-10 pr-4 bg-slate-50 rounded-xl border-2 border-transparent focus:border-emerald-400 outline-none text-xs font-bold mb-2"
                        placeholder="Rechercher un membre…"
                      />
                    </div>
                    <select
                      id="loan-member"
                      value={targetUserId}
                      onChange={e => { setTargetUserId(e.target.value); setFormErrors(p => ({ ...p, targetUserId: '' })); }}
                      className={`w-full h-12 px-4 bg-slate-50 rounded-xl outline-none border-2 transition-colors font-bold text-xs ${formErrors.targetUserId ? 'border-red-400 bg-red-50' : 'border-transparent focus:border-emerald-400'}`}
                    >
                      <option value="">Sélectionner un membre…</option>
                      {filteredMembers.map(m => (
                        <option key={m.id} value={m.id}>{m.official_name}</option>
                      ))}
                    </select>
                    {formErrors.targetUserId && (
                      <p className="text-[11px] text-red-500 font-bold ml-1 flex items-center gap-1">
                        <AlertTriangle size={11} /> {formErrors.targetUserId}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Amount */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest" htmlFor="loan-amount">Montant (FCFA)</label>
                      <input
                        id="loan-amount"
                        type="number"
                        min="1"
                        value={amount}
                        onChange={e => { setAmount(e.target.value); setFormErrors(p => ({ ...p, amount: '' })); }}
                        className={`w-full h-12 px-4 bg-slate-50 rounded-xl outline-none border-2 transition-colors font-black ${formErrors.amount ? 'border-red-400 bg-red-50' : 'border-transparent focus:border-emerald-400'}`}
                        placeholder="50 000"
                      />
                      {formErrors.amount && (
                        <p className="text-[11px] text-red-500 font-bold ml-1 flex items-center gap-1"><AlertTriangle size={11} /> {formErrors.amount}</p>
                      )}
                    </div>
                    {/* Rate */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest" htmlFor="loan-rate">Taux (%)</label>
                      <input
                        id="loan-rate"
                        type="number"
                        min="0"
                        max="100"
                        value={rate}
                        onChange={e => { setRate(e.target.value); setFormErrors(p => ({ ...p, rate: '' })); }}
                        className={`w-full h-12 px-4 bg-slate-50 rounded-xl outline-none border-2 transition-colors font-black ${formErrors.rate ? 'border-red-400 bg-red-50' : 'border-transparent focus:border-emerald-400'}`}
                      />
                      {formErrors.rate && (
                        <p className="text-[11px] text-red-500 font-bold ml-1 flex items-center gap-1"><AlertTriangle size={11} /> {formErrors.rate}</p>
                      )}
                    </div>
                  </div>

                  {/* Due date */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest" htmlFor="loan-due">Date Limite de Remboursement</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={15} />
                      <input
                        id="loan-due"
                        type="date"
                        value={dueDate}
                        min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)}
                        onChange={e => { setDueDate(e.target.value); setFormErrors(p => ({ ...p, dueDate: '' })); }}
                        className={`w-full h-12 pl-12 pr-4 bg-slate-50 rounded-xl outline-none border-2 transition-colors font-bold text-xs ${formErrors.dueDate ? 'border-red-400 bg-red-50' : 'border-transparent focus:border-emerald-400'}`}
                      />
                    </div>
                    {formErrors.dueDate && (
                      <p className="text-[11px] text-red-500 font-bold ml-1 flex items-center gap-1"><AlertTriangle size={11} /> {formErrors.dueDate}</p>
                    )}
                  </div>

                  {/* Live interest breakdown preview */}
                  {isPositiveNumber(amount) && isValidRate(rate) && (
                    <div className="bg-slate-50 rounded-2xl p-4 grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Principal</p>
                        <p className="text-sm font-black text-slate-700">{Number(amount).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Intérêt</p>
                        <p className="text-sm font-black text-amber-600">+{previewInterest.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total dû</p>
                        <p className="text-sm font-black text-emerald-700">{previewTotal.toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleRecordLoan}
                  disabled={submittingLoan}
                  className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {submittingLoan ? <><Loader2 size={16} className="animate-spin" /> Enregistrement…</> : "Enregistrer l'emprunt"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.5} }
        .font-blink { animation: blink 1.5s infinite; }
      `}</style>
    </div>
  );
};

export default BankComponent;