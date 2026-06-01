import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Landmark, TrendingUp, HandCoins, Gavel, Plus, 
  History, Wallet, Users, ArrowUpRight, ArrowDownRight,
  Info, CheckCircle2, Clock, Calculator, Loader2,
  AlertTriangle, Search, X, RefreshCw
} from 'lucide-react';
import { bankService, tontineService } from '@/services/api';
import { toast } from 'react-toastify';
import Modal from '../../shared/Modal';

// TypeScript Interfaces
interface BankStats {
  totalInterest: number;
  totalAuctionProfit: number;
  totalProfit: number;
  activeMembers: number;
  sharePerMember: number;
}

interface Loan {
  id: number | string;
  tontine_id: number;
  user_id: number;
  user_name?: string;
  amount: number;
  interest_rate: number;
  interest_amount: number;
  total_to_repay: number;
  status: 'en cours' | 'remboursé' | 'en retard';
  is_repaid: boolean | number;
  loan_date: string;
  due_date: string;
  repayment_date: string | null;
}

interface Auction {
  id: number | string;
  tontine_id: number;
  user_id: number;
  user_name?: string;
  pot_amount: number;
  bid_amount: number;
  profit_amount: number;
  auction_date: string;
}

interface Member {
  id: number;
  name: string;
  phone: string;
  role: 'admin' | 'member';
  status: 'active' | 'absent' | 'inactive';
}

interface ProfitHistoryItem {
  id: number | string;
  user_id: number;
  user_name: string;
  tontine_id: number;
  type: string;
  amount: number;
  description: string;
  transaction_date: string;
  created_at: string;
}

interface FinanceManagerProps {
  tontines: any[];
}

// Skeleton Components
const StatsSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="bg-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-slate-100 shadow-sm animate-pulse space-y-4">
        <div className="w-10 h-10 bg-slate-100 rounded-xl"></div>
        <div className="w-24 h-4 bg-slate-100 rounded"></div>
        <div className="w-36 h-8 bg-slate-100 rounded"></div>
        <div className="w-28 h-3 bg-slate-100 rounded"></div>
      </div>
    ))}
  </div>
);

const ListSkeleton = () => (
  <div className="p-4 space-y-4">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="p-4 md:p-6 bg-white border border-slate-50 rounded-2xl md:rounded-3xl animate-pulse flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-xl"></div>
          <div className="space-y-2">
            <div className="w-24 h-4 bg-slate-100 rounded"></div>
            <div className="w-16 h-3 bg-slate-100 rounded"></div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="w-20 h-4 bg-slate-100 rounded ml-auto"></div>
          <div className="w-14 h-3 bg-slate-100 rounded ml-auto"></div>
        </div>
      </div>
    ))}
  </div>
);

const TableRowsSkeleton = () => (
  <>
    {[...Array(3)].map((_, i) => (
      <tr key={i} className="animate-pulse">
        <td className="px-10 py-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-100 rounded-xl"></div>
            <div className="space-y-2">
              <div className="w-24 h-4 bg-slate-100 rounded"></div>
              <div className="w-32 h-3 bg-slate-100 rounded"></div>
            </div>
          </div>
        </td>
        <td className="px-10 py-6">
          <div className="w-20 h-4 bg-slate-100 rounded"></div>
        </td>
        <td className="px-10 py-6 text-right">
          <div className="w-24 h-5 bg-slate-100 rounded ml-auto"></div>
        </td>
        <td className="px-10 py-6 text-right">
          <div className="w-28 h-8 bg-slate-100 rounded ml-auto"></div>
        </td>
      </tr>
    ))}
  </>
);

const FinanceManager = ({ tontines }: FinanceManagerProps) => {
  const [selectedTontineId, setSelectedTontineId] = useState<string>(tontines[0]?.id || '');
  const [stats, setStats] = useState<BankStats | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [profitHistory, setProfitHistory] = useState<ProfitHistoryItem[]>([]);
  
  // Loading & Error States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Modals Visibility
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showAuctionModal, setShowAuctionModal] = useState(false);

  // Form submitting indicators
  const [submittingLoan, setSubmittingLoan] = useState(false);
  const [submittingAuction, setSubmittingAuction] = useState(false);
  const [distributing, setDistributing] = useState(false);

  // Form states with correct date initializations
  const [loanForm, setLoanForm] = useState({
    userId: '',
    amount: '',
    interestRate: '10',
    loanDate: new Date().toISOString().split('T')[0],
    dueDate: ''
  });

  const [auctionForm, setAuctionForm] = useState({
    userId: '',
    potAmount: '',
    bidAmount: '',
    auctionDate: new Date().toISOString().split('T')[0]
  });

  // Paging & Search/Filter states
  const [loansPage, setLoansPage] = useState(1);
  const [auctionsPage, setAuctionsPage] = useState(1);
  const itemsPerPage = 10;

  const [loanSearchQuery, setLoanSearchQuery] = useState('');
  const [auctionSearchQuery, setAuctionSearchQuery] = useState('');

  const [profitStartDate, setProfitStartDate] = useState('');
  const [profitEndDate, setProfitEndDate] = useState('');
  const [profitLimit, setProfitLimit] = useState(10);

  // Modals confirmation and breakdown data
  const [repayConfirmLoanId, setRepayConfirmLoanId] = useState<string | number | null>(null);
  const [showDistributeConfirm, setShowDistributeConfirm] = useState(false);
  const [verificationModalData, setVerificationModalData] = useState<{
    date: string;
    total: number;
    items: ProfitHistoryItem[];
  } | null>(null);

  // Form refs for accessibility focus trapping
  const loanFormRef = useRef<HTMLFormElement>(null);
  const auctionFormRef = useRef<HTMLFormElement>(null);

  const fetchData = useCallback(async () => {
    if (!selectedTontineId) return;
    setLoading(true);
    setError(null);
    try {
      const statsRes = await bankService.getStats(selectedTontineId);
      const loansRes = await bankService.getLoans(selectedTontineId);
      const auctionsRes = await bankService.getAuctions(selectedTontineId);
      const historyRes = await bankService.getProfitHistory(selectedTontineId);
      const membersRes = await tontineService.getTontineMembers(selectedTontineId);
      
      setStats(statsRes.data || statsRes);
      setLoans(Array.isArray(loansRes) ? loansRes : (loansRes.data || []));
      setAuctions(Array.isArray(auctionsRes) ? auctionsRes : (auctionsRes.data || []));
      setProfitHistory(Array.isArray(historyRes) ? historyRes : (historyRes.data || []));
      setMembers(Array.isArray(membersRes) ? membersRes : (membersRes.data || []));
      
      setLastUpdated(new Date());
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Erreur lors du chargement des données financières';
      setError(errMsg);
      toast.error('Erreur lors du chargement des données financières');
    } finally {
      setLoading(false);
    }
  }, [selectedTontineId]);

  useEffect(() => {
    fetchData();
  }, [selectedTontineId, fetchData]);

  // Escape key global listener & auto-refresh polling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowLoanModal(false);
        setShowAuctionModal(false);
        setRepayConfirmLoanId(null);
        setVerificationModalData(null);
        setShowDistributeConfirm(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);

    const refreshInterval = setInterval(() => {
      if (selectedTontineId) {
        fetchData();
      }
    }, 60000);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearInterval(refreshInterval);
    };
  }, [selectedTontineId, fetchData]);

  // Focus trap for modals
  const handleModalTab = (e: React.KeyboardEvent, formRef: React.RefObject<HTMLFormElement>) => {
    if (e.key !== 'Tab') return;
    if (!formRef.current) return;
    
    const focusableElements = formRef.current.querySelectorAll(
      'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex="0"]'
    );
    
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  };

  const handleLoanSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedTontineId) {
      toast.error("Veuillez sélectionner un cercle de tontine.");
      return;
    }

    const amt = Number(loanForm.amount);
    const rate = Number(loanForm.interestRate);

    if (amt <= 0) {
      toast.error("Le montant du prêt doit être supérieur à 0.");
      return;
    }
    if (rate < 0 || rate > 100) {
      toast.error("Le taux d'intérêt doit être compris entre 0% et 100%.");
      return;
    }
    if (new Date(loanForm.loanDate) > new Date()) {
      toast.error("La date du prêt ne peut pas être dans le futur.");
      return;
    }
    if (loanForm.dueDate && new Date(loanForm.dueDate) <= new Date(loanForm.loanDate)) {
      toast.error("La date d'échéance doit être postérieure à la date du prêt.");
      return;
    }

    setSubmittingLoan(true);
    try {
      await bankService.recordLoan(selectedTontineId, {
        ...loanForm,
        amount: amt,
        interestRate: rate
      });
      toast.success('Prêt enregistré avec succès !');
      setShowLoanModal(false);
      // Reset Form
      setLoanForm({
        userId: '',
        amount: '',
        interestRate: '10',
        loanDate: new Date().toISOString().split('T')[0],
        dueDate: ''
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'enregistrement du prêt');
    } finally {
      setSubmittingLoan(false);
    }
  };

  const handleAuctionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedTontineId) {
      toast.error("Veuillez sélectionner un cercle de tontine.");
      return;
    }

    const pot = Number(auctionForm.potAmount);
    const bid = Number(auctionForm.bidAmount);

    if (pot <= 0) {
      toast.error("La valeur du pot doit être supérieure à 0.");
      return;
    }
    if (bid <= 0) {
      toast.error("Le montant de l'enchère doit être supérieur à 0.");
      return;
    }
    if (bid > pot) {
      toast.error("Le montant de l'enchère ne peut pas dépasser la valeur du pot.");
      return;
    }
    if (new Date(auctionForm.auctionDate) > new Date()) {
      toast.error("La date de l'enchère ne peut pas être dans le futur.");
      return;
    }

    setSubmittingAuction(true);
    try {
      await bankService.recordAuction(selectedTontineId, {
        ...auctionForm,
        potAmount: pot,
        bidAmount: bid
      });
      toast.success('Enchère enregistrée avec succès !');
      setShowAuctionModal(false);
      // Reset Form
      setAuctionForm({
        userId: '',
        potAmount: '',
        bidAmount: '',
        auctionDate: new Date().toISOString().split('T')[0]
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'enregistrement de l\'enchère');
    } finally {
      setSubmittingAuction(false);
    }
  };

  const handleDistribute = async () => {
    if (!selectedTontineId) return;
    setDistributing(true);
    setShowDistributeConfirm(false);
    try {
      await bankService.distributeProfits(selectedTontineId);
      toast.success('Profits distribués avec succès !');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur de distribution');
    } finally {
      setDistributing(false);
    }
  };

  const handleRepay = async (loanId: string | number) => {
    setRepayConfirmLoanId(null);
    try {
      await bankService.repayLoan(loanId);
      toast.success('Prêt remboursé !');
      fetchData();
    } catch (err: any) {
      toast.error('Erreur lors du remboursement');
    }
  };

  const extractPercentage = (desc: string) => {
    const match = desc.match(/(\d+(\.\d+)?)%/);
    return match ? parseFloat(match[1]) : 0;
  };

  const handleVerifyTotal = (dateStr: string) => {
    const group = profitHistory.filter(h => new Date(h.transaction_date || h.created_at).toISOString().split('T')[0] === dateStr);
    const total = group.reduce((acc, curr) => acc + extractPercentage(curr.description), 0);
    setVerificationModalData({ date: dateStr, total, items: group });
  };

  // Searching & Filtering Lists
  const filteredLoans = loans.filter(l => 
    (l.user_name || '').toLowerCase().includes(loanSearchQuery.toLowerCase())
  );

  const filteredAuctions = auctions.filter(a => 
    (a.user_name || '').toLowerCase().includes(auctionSearchQuery.toLowerCase())
  );

  const filteredProfitHistory = profitHistory.filter(h => {
    const txDate = new Date(h.transaction_date || h.created_at);
    if (profitStartDate) {
      const start = new Date(profitStartDate);
      start.setHours(0,0,0,0);
      if (txDate < start) return false;
    }
    if (profitEndDate) {
      const end = new Date(profitEndDate);
      end.setHours(23,59,59,999);
      if (txDate > end) return false;
    }
    return true;
  });

  // Paged collections
  const currentLoans = filteredLoans.slice((loansPage - 1) * itemsPerPage, loansPage * itemsPerPage);
  const totalLoansPages = Math.ceil(filteredLoans.length / itemsPerPage) || 1;
  const showingFromLoan = filteredLoans.length > 0 ? (loansPage - 1) * itemsPerPage + 1 : 0;
  const showingToLoan = Math.min(loansPage * itemsPerPage, filteredLoans.length);

  const currentAuctions = filteredAuctions.slice((auctionsPage - 1) * itemsPerPage, auctionsPage * itemsPerPage);
  const totalAuctionsPages = Math.ceil(filteredAuctions.length / itemsPerPage) || 1;
  const showingFromAuc = filteredAuctions.length > 0 ? (auctionsPage - 1) * itemsPerPage + 1 : 0;
  const showingToAuc = Math.min(auctionsPage * itemsPerPage, filteredAuctions.length);

  // Grouped profit history sliced by limit
  const groupedProfits = filteredProfitHistory.reduce((acc: any, curr: any) => {
    const dateKey = new Date(curr.transaction_date || curr.created_at).toISOString().split('T')[0];
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(curr);
    return acc;
  }, {});

  const profitEntries = Object.entries(groupedProfits);
  const displayedProfitEntries = profitEntries.slice(0, profitLimit);

  // Global Empty State: No tontines
  if (tontines.length === 0) {
    return (
      <div className="bg-white rounded-[32px] md:rounded-[56px] border border-slate-100 p-16 text-center max-w-xl mx-auto shadow-sm">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
          <Landmark size={32} />
        </div>
        <h3 className="text-xl font-black text-slate-900 mb-2">Aucun cercle de tontine</h3>
        <p className="text-sm text-slate-500">
          Vous devez d'abord créer ou rejoindre un cercle de tontine pour pouvoir accéder à la gestion financière de la micro-banque.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      
      {/* Inline Error alert banner if any */}
      {error && (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-rose-600 flex-shrink-0" size={24} />
            <div>
              <h4 className="font-bold text-rose-900 text-sm">Erreur de récupération</h4>
              <p className="text-xs text-rose-600 font-medium">{error}</p>
            </div>
          </div>
          <button 
            onClick={fetchData}
            aria-label="Réessayer le chargement"
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all self-start sm:self-center"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Header & Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-amber-100 rounded-[24px] flex items-center justify-center text-amber-600 shadow-sm border border-amber-200">
            <Landmark size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Gestion Financière</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <p className="text-slate-500 font-medium italic text-sm">Micro-banque & Profits du cercle</p>
              <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                Mise à jour: {lastUpdated.toLocaleTimeString('fr-FR')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={fetchData}
            aria-label="Actualiser les données"
            className="p-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-2xl shadow-sm transition-colors"
            title="Actualiser"
          >
            <RefreshCw size={18} />
          </button>
          
          <select 
            value={selectedTontineId}
            aria-label="Sélectionner un cercle de tontine"
            onChange={(e) => {
              setSelectedTontineId(e.target.value);
              setLoansPage(1);
              setAuctionsPage(1);
              setProfitLimit(10);
            }}
            className="h-14 px-8 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-100 transition-all shadow-sm"
          >
            <option value="">Sélectionner une tontine...</option>
            {tontines.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Dynamic Selector Empty State Prompt */}
      {!selectedTontineId ? (
        <div className="bg-white rounded-[32px] border border-slate-100 p-16 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
            <Info size={32} />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">Aucun cercle sélectionné</h3>
          <p className="text-sm text-slate-500">
            Veuillez sélectionner un cercle de tontine dans la liste ci-dessus pour afficher et gérer les finances de la banque.
          </p>
        </div>
      ) : (
        <>
          {/* Financial Overview Cards */}
          {loading && !stats ? (
            <StatsSkeleton />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {/* Card 1: Profit Pool */}
              <div className="bg-slate-900 p-6 md:p-8 rounded-[32px] md:rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
                <TrendingUp className="absolute -right-4 -top-4 opacity-10 rotate-12 group-hover:scale-110 transition-transform duration-500 w-24 h-24 md:w-32 md:h-32" />
                <p className="text-[10px] font-black uppercase text-amber-400 tracking-widest mb-4">Pool de Bénéfices</p>
                <p className="text-3xl md:text-4xl font-black">
                  {stats ? `${stats.totalProfit?.toLocaleString()} ` : '— '}
                  <span className="text-[10px] md:text-xs font-normal opacity-40">FCFA</span>
                </p>
                <div className="mt-6 flex items-center gap-2 text-[9px] md:text-[10px] font-bold text-amber-200">
                  <Calculator size={14} /> Total Intérêts + Enchères
                </div>
              </div>

              {/* Card 2: Distribution Parts & Button */}
              <div className="bg-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group flex flex-col justify-between min-h-[160px]">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Distribution Parts</p>
                  <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full w-fit mb-4">
                     <ArrowUpRight size={14} /> Prorata de l'investissement
                  </div>
                </div>
                {stats && stats.totalProfit > 0 && members.length > 0 && (
                  <button 
                    onClick={() => setShowDistributeConfirm(true)}
                    disabled={distributing}
                    aria-label="Distribuer les profits aux épargnants au prorata"
                    className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {distributing && <Loader2 size={12} className="animate-spin" />}
                    Distribuer aux épargnants
                  </button>
                )}
              </div>

              {/* Card 3: Loans & Auction breakdown */}
              <div className="bg-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group">
                <div className="flex gap-4">
                   <div className="flex-1">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Revenus Prêts</p>
                      <p className="text-xl md:text-2xl font-black text-slate-900">
                        {stats ? `+${stats.totalInterest?.toLocaleString()}` : '—'}
                      </p>
                   </div>
                   <div className="flex-1 border-l pl-4">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Revenus Enchères</p>
                      <p className="text-xl md:text-2xl font-black text-slate-900">
                        {stats ? `+${stats.totalAuctionProfit?.toLocaleString()}` : '—'}
                      </p>
                   </div>
                </div>
              </div>

              {/* Card 4: Action Buttons */}
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 md:p-8 rounded-[32px] md:rounded-[40px] text-white shadow-xl shadow-amber-500/20 relative overflow-hidden flex flex-col justify-center gap-3">
                <button 
                  onClick={() => setShowLoanModal(true)}
                  aria-label="Enregistrer un nouveau prêt"
                  className="w-full py-3 md:py-4 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl md:rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                >
                  <HandCoins size={16} /> Nouveau Prêt
                </button>
                <button 
                  onClick={() => setShowAuctionModal(true)}
                  aria-label="Enregistrer une nouvelle enchère de pot"
                  className="w-full py-3 md:py-4 bg-slate-900 rounded-xl md:rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-white/10"
                >
                  <Gavel size={16} /> Nouvelle Enchère
                </button>
              </div>
            </div>
          )}

          {/* Main Content Area: History & Operations */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-10">
            
            {/* Loans History Card */}
            <div className="bg-white rounded-[32px] md:rounded-[56px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              <div className="px-6 md:px-10 py-6 md:py-8 border-b flex justify-between items-center bg-slate-50/30">
                 <div className="flex items-center gap-3">
                    <History className="text-amber-500 w-4.5 h-4.5 md:w-5 md:h-5" />
                    <h3 className="text-lg md:text-xl font-black text-slate-900">Historique des Prêts</h3>
                 </div>
              </div>

              {/* Loans Search Input */}
              <div className="px-6 md:px-10 py-3 bg-slate-50/20 border-b border-slate-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    type="text" 
                    aria-label="Rechercher un prêt par nom de membre"
                    value={loanSearchQuery}
                    onChange={(e) => { setLoanSearchQuery(e.target.value); setLoansPage(1); }}
                    placeholder="Rechercher par nom de membre..."
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="p-4 space-y-4 max-h-[400px] md:max-h-[500px] overflow-y-auto custom-scrollbar flex-1">
                {loading && loans.length === 0 ? (
                  <ListSkeleton />
                ) : currentLoans.length > 0 ? (
                  currentLoans.map((loan) => (
                    <div key={loan.id} className="p-4 md:p-6 bg-white border border-slate-50 rounded-2xl md:rounded-3xl hover:border-amber-100 transition-all group">
                      <div className="flex justify-between items-center mb-2 md:mb-4">
                        <div className="flex items-center gap-3 md:gap-4">
                          <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 rounded-xl md:rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors">
                             <Users className="w-4.5 h-4.5 md:w-5 md:h-5" />
                          </div>
                          <div>
                            <h4 className="font-black text-slate-900 text-sm md:text-base">{loan.user_name}</h4>
                            <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase">{new Date(loan.loan_date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                          <div>
                            <p className="text-base md:text-lg font-black text-slate-900">{Number(loan.amount).toLocaleString()} <span className="text-[9px] md:text-[10px] font-normal opacity-40">FCFA</span></p>
                            <p className="text-[9px] md:text-[10px] font-bold text-amber-600">Intérêt: +{Number(loan.interest_amount).toLocaleString()}</p>
                          </div>
                          {loan.is_repaid ? (
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase rounded-full">Remboursé</span>
                          ) : (
                            <button 
                              onClick={() => setRepayConfirmLoanId(loan.id)}
                              aria-label={`Rembourser le prêt de ${loan.user_name}`}
                              className="px-3 py-1 bg-amber-500 text-white text-[8px] font-black uppercase rounded-full hover:bg-amber-600 transition-all"
                            >
                              Rembourser
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : loanSearchQuery ? (
                  <div className="py-16 text-center">
                    <Search className="mx-auto text-slate-300 mb-4" size={32} />
                    <p className="text-sm text-slate-400 italic mb-4">Aucun membre ne correspond à votre recherche</p>
                    <button 
                      onClick={() => { setLoanSearchQuery(''); setLoansPage(1); }}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all"
                    >
                      Réinitialiser la recherche
                    </button>
                  </div>
                ) : (
                  <div className="py-16 text-center">
                    <HandCoins className="mx-auto text-slate-300 mb-4" size={32} />
                    <p className="text-sm text-slate-400 italic mb-4">Aucun prêt enregistré</p>
                    <button 
                      onClick={() => setShowLoanModal(true)}
                      aria-label="Ajouter un premier prêt"
                      className="px-4 py-2 bg-amber-500 text-white rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-amber-600 transition-all"
                    >
                      Enregistrer un Prêt
                    </button>
                  </div>
                )}
              </div>

              {/* Loans Pagination Controls */}
              {totalLoansPages > 1 && (
                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-4 bg-slate-50/30">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">
                    Affichage de {showingFromLoan} à {showingToLoan} sur {filteredLoans.length} prêts
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setLoansPage(prev => Math.max(prev - 1, 1))}
                      disabled={loansPage === 1}
                      aria-label="Page précédente des prêts"
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"
                    >
                      Précédent
                    </button>
                    <button 
                      onClick={() => setLoansPage(prev => Math.min(prev + 1, totalLoansPages))}
                      disabled={loansPage === totalLoansPages}
                      aria-label="Page suivante des prêts"
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Auctions History Card */}
            <div className="bg-white rounded-[32px] md:rounded-[56px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              <div className="px-6 md:px-10 py-6 md:py-8 border-b flex justify-between items-center bg-slate-50/30">
                 <div className="flex items-center gap-3">
                    <Gavel className="text-blue-500 w-4.5 h-4.5 md:w-5 md:h-5" />
                    <h3 className="text-lg md:text-xl font-black text-slate-900">Historique des Enchères</h3>
                 </div>
              </div>

              {/* Auctions Search Input */}
              <div className="px-6 md:px-10 py-3 bg-slate-50/20 border-b border-slate-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    type="text" 
                    aria-label="Rechercher une enchère par nom de membre"
                    value={auctionSearchQuery}
                    onChange={(e) => { setAuctionSearchQuery(e.target.value); setAuctionsPage(1); }}
                    placeholder="Rechercher par nom de membre..."
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="p-4 space-y-4 max-h-[400px] md:max-h-[500px] overflow-y-auto custom-scrollbar flex-1">
                {loading && auctions.length === 0 ? (
                  <ListSkeleton />
                ) : currentAuctions.length > 0 ? (
                  currentAuctions.map((auc) => (
                    <div key={auc.id} className="p-4 md:p-6 bg-white border border-slate-50 rounded-2xl md:rounded-3xl hover:border-blue-100 transition-all group">
                      <div className="flex justify-between items-start mb-2 md:mb-4">
                        <div className="flex items-center gap-3 md:gap-4">
                          <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 rounded-xl md:rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                             <Users className="w-4.5 h-4.5 md:w-5 md:h-5" />
                          </div>
                          <div>
                            <h4 className="font-black text-slate-900 text-sm md:text-base">{auc.user_name}</h4>
                            <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase">{new Date(auc.auction_date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-base md:text-lg font-black text-slate-900">{Number(auc.bid_amount).toLocaleString()} <span className="text-[9px] md:text-[10px] font-normal opacity-40">FCFA</span></p>
                          <p className="text-[9px] md:text-[10px] font-bold text-emerald-600">Bénéfice: +{Number(auc.profit_amount).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : auctionSearchQuery ? (
                  <div className="py-16 text-center">
                    <Search className="mx-auto text-slate-300 mb-4" size={32} />
                    <p className="text-sm text-slate-400 italic mb-4">Aucun membre ne correspond à votre recherche</p>
                    <button 
                      onClick={() => { setAuctionSearchQuery(''); setAuctionsPage(1); }}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all"
                    >
                      Réinitialiser la recherche
                    </button>
                  </div>
                ) : (
                  <div className="py-16 text-center">
                    <Gavel className="mx-auto text-slate-300 mb-4" size={32} />
                    <p className="text-sm text-slate-400 italic mb-4">Aucune enchère enregistrée</p>
                    <button 
                      onClick={() => setShowAuctionModal(true)}
                      aria-label="Ajouter une première enchère"
                      className="px-4 py-2 bg-slate-900 text-white rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all"
                    >
                      Enregistrer une Enchère
                    </button>
                  </div>
                )}
              </div>

              {/* Auctions Pagination Controls */}
              {totalAuctionsPages > 1 && (
                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-4 bg-slate-50/30">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">
                    Affichage de {showingFromAuc} à {showingToAuc} sur {filteredAuctions.length} enchères
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setAuctionsPage(prev => Math.max(prev - 1, 1))}
                      disabled={auctionsPage === 1}
                      aria-label="Page précédente des enchères"
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"
                    >
                      Précédent
                    </button>
                    <button 
                      onClick={() => setAuctionsPage(prev => Math.min(prev + 1, totalAuctionsPages))}
                      disabled={auctionsPage === totalAuctionsPages}
                      aria-label="Page suivante des enchères"
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Profit Distribution History Card */}
          <div className="bg-white rounded-[32px] md:rounded-[56px] border border-slate-100 shadow-sm overflow-hidden flex flex-col mt-10">
              <div className="px-6 md:px-10 py-6 md:py-8 border-b flex flex-col sm:flex-row justify-between sm:items-center bg-emerald-50/30 gap-4">
                 <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-emerald-500 w-5 h-5" />
                    <h3 className="text-lg md:text-xl font-black text-slate-900">Journal de Répartition des Bénéfices</h3>
                 </div>
                 <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-white border border-emerald-100 px-4 py-2 rounded-full">
                    {filteredProfitHistory.length} Versements de Gains
                 </p>
              </div>

              {/* Date filters for Profit History */}
              <div className="flex flex-wrap items-center gap-3 px-6 md:px-10 py-4 bg-slate-50/50 border-b border-slate-100">
                <span className="text-xs text-slate-500 font-bold whitespace-nowrap">Filtrer par date de répartition :</span>
                <input 
                  type="date" 
                  aria-label="Date de début"
                  value={profitStartDate}
                  onChange={(e) => setProfitStartDate(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500"
                />
                <span className="text-xs text-slate-400">au</span>
                <input 
                  type="date" 
                  aria-label="Date de fin"
                  value={profitEndDate}
                  onChange={(e) => setProfitEndDate(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500"
                />
                {(profitStartDate || profitEndDate) && (
                  <button 
                    onClick={() => { setProfitStartDate(''); setProfitEndDate(''); }}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 underline"
                  >
                    Réinitialiser
                  </button>
                )}
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    <tr>
                      <th className="px-10 py-5">Membre & Parts</th>
                      <th className="px-10 py-5">Date de Répartition</th>
                      <th className="px-10 py-5 text-right">Montant Distribué</th>
                      <th className="px-10 py-5 text-right">Vérification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loading && profitHistory.length === 0 ? (
                      <TableRowsSkeleton />
                    ) : displayedProfitEntries.length > 0 ? (
                      displayedProfitEntries.map(([dateKey, items]: [string, any]) => (
                        <React.Fragment key={`profit-group-${dateKey}`}>
                          {items.map((item: any, idx: number) => (
                            <tr key={item.id} className="hover:bg-slate-50/50 transition-all border-l-4 border-l-transparent hover:border-l-emerald-500">
                              <td className="px-10 py-6">
                                 <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-black text-xs">
                                       {extractPercentage(item.description)}%
                                    </div>
                                    <div>
                                       <p className="font-black text-slate-900">{item.user_name}</p>
                                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Parts calculées au prorata</p>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-10 py-6 text-sm font-bold text-slate-500">
                                {new Date(dateKey).toLocaleDateString('fr-FR')}
                              </td>
                              <td className="px-10 py-6 text-right">
                                 <p className="text-lg font-black text-emerald-600">+{Number(item.amount).toLocaleString()} <small className="text-[10px] font-normal opacity-50 italic">FCFA</small></p>
                              </td>
                              <td className="px-10 py-6 text-right">
                                 {idx === 0 && (
                                   <button 
                                     onClick={() => handleVerifyTotal(dateKey)}
                                     type="button"
                                     aria-label={`Vérifier la somme des parts pour la répartition du ${dateKey}`}
                                     className="px-4 py-2 bg-white border border-emerald-200 text-emerald-600 rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                   >
                                      Sommer les parts
                                   </button>
                                 )}
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-20 text-center">
                          <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                            <History size={24} />
                          </div>
                          <p className="text-sm text-slate-400 italic">Aucune répartition correspondante.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Show More button for profit history */}
              {profitEntries.length > profitLimit && (
                <div className="px-10 py-5 bg-slate-50/50 border-t border-slate-100 text-center">
                  <button 
                    onClick={() => setProfitLimit(prev => prev + 10)}
                    aria-label="Charger plus de répartitions de gains"
                    className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm"
                  >
                    Voir plus
                  </button>
                </div>
              )}
          </div>
        </>
      )}

      {/* LOAN MODAL */}
      <Modal isOpen={showLoanModal} onClose={() => setShowLoanModal(false)} title="Enregistrer un nouveau Prêt">
        <form 
          ref={loanFormRef}
          onKeyDown={(e) => handleModalTab(e, loanFormRef)}
          onSubmit={handleLoanSubmit} 
          className="space-y-6 p-2"
        >
          <div className="space-y-2">
            <label id="loan-member-label" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Choisir le Membre</label>
            <select 
              required
              aria-labelledby="loan-member-label"
              value={loanForm.userId}
              onChange={(e) => setLoanForm({...loanForm, userId: e.target.value})}
              className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-amber-200"
            >
              <option value="">Sélectionner un membre...</option>
              {members?.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label id="loan-amount-label" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Montant (FCFA)</label>
              <input 
                type="number" required min="1"
                aria-labelledby="loan-amount-label"
                value={loanForm.amount}
                onChange={(e) => setLoanForm({...loanForm, amount: e.target.value})}
                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-amber-200"
              />
            </div>
            <div className="space-y-2">
              <label id="loan-interest-label" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Taux d'intérêt (%)</label>
              <input 
                type="number" required min="0" max="100"
                aria-labelledby="loan-interest-label"
                value={loanForm.interestRate}
                onChange={(e) => setLoanForm({...loanForm, interestRate: e.target.value})}
                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-amber-200"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label id="loan-date-label" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Date du prêt</label>
              <input 
                type="date" required max={new Date().toISOString().split('T')[0]}
                aria-labelledby="loan-date-label"
                value={loanForm.loanDate}
                onChange={(e) => setLoanForm({...loanForm, loanDate: e.target.value})}
                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-amber-200"
              />
            </div>
            <div className="space-y-2">
              <label id="loan-due-label" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Date d'échéance</label>
              <input 
                type="date" required min={loanForm.loanDate}
                aria-labelledby="loan-due-label"
                value={loanForm.dueDate}
                onChange={(e) => setLoanForm({...loanForm, dueDate: e.target.value})}
                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-amber-200"
              />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={submittingLoan}
            aria-label="Enregistrer le prêt"
            className="w-full py-4 bg-amber-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-amber-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {submittingLoan && <Loader2 size={14} className="animate-spin" />}
            Confirmer le prêt
          </button>
        </form>
      </Modal>

      {/* AUCTION MODAL */}
      <Modal isOpen={showAuctionModal} onClose={() => setShowAuctionModal(false)} title="Enregistrer une Enchère (Vente de Pot)">
        <form 
          ref={auctionFormRef}
          onKeyDown={(e) => handleModalTab(e, auctionFormRef)}
          onSubmit={handleAuctionSubmit} 
          className="space-y-6 p-2"
        >
          <div className="space-y-2">
            <label id="auc-winner-label" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Gagnant de l'Enchère</label>
            <select 
              required
              aria-labelledby="auc-winner-label"
              value={auctionForm.userId}
              onChange={(e) => setAuctionForm({...auctionForm, userId: e.target.value})}
              className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Sélectionner un membre...</option>
              {members?.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label id="auc-pot-label" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Valeur du Pot (FCFA)</label>
              <input 
                type="number" required min="1"
                aria-labelledby="auc-pot-label"
                value={auctionForm.potAmount}
                onChange={(e) => setAuctionForm({...auctionForm, potAmount: e.target.value})}
                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="space-y-2">
              <label id="auc-bid-label" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Montant Enchère payé</label>
              <input 
                type="number" required min="1" max={auctionForm.potAmount || undefined}
                aria-labelledby="auc-bid-label"
                value={auctionForm.bidAmount}
                onChange={(e) => setAuctionForm({...auctionForm, bidAmount: e.target.value})}
                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>
          <div className="space-y-2">
              <label id="auc-date-label" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Date</label>
              <input 
                type="date" required max={new Date().toISOString().split('T')[0]}
                aria-labelledby="auc-date-label"
                value={auctionForm.auctionDate}
                onChange={(e) => setAuctionForm({...auctionForm, auctionDate: e.target.value})}
                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-200"
              />
          </div>
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 italic text-[10px] text-emerald-800">
             Note: Le bénéfice enregistré est égal au montant de l'enchère (frais payés par le membre).
          </div>
          <button 
            type="submit" 
            disabled={submittingAuction}
            aria-label="Enregistrer l'enchère"
            className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {submittingAuction && <Loader2 size={14} className="animate-spin" />}
            Valider l'enchère
          </button>
        </form>
      </Modal>

      {/* LOAN REPAYMENT JSX STATE CONFIRMATION MODAL */}
      {repayConfirmLoanId !== null && (
        <Modal 
          isOpen={repayConfirmLoanId !== null} 
          onClose={() => setRepayConfirmLoanId(null)} 
          title="Confirmer le remboursement"
        >
          <div className="space-y-6 p-2">
            <p className="text-slate-600 text-sm">
              Êtes-vous sûr de vouloir marquer ce prêt comme remboursé ? Cette opération est irréversible et mettra à jour les calculs de bénéfice.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  if (repayConfirmLoanId !== null) handleRepay(repayConfirmLoanId);
                }}
                aria-label="Valider le remboursement"
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
              >
                Confirmer
              </button>
              <button
                onClick={() => setRepayConfirmLoanId(null)}
                aria-label="Annuler le remboursement"
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
              >
                Annuler
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* PROFIT DISTRIBUTION JSX STATE CONFIRMATION MODAL */}
      {showDistributeConfirm && (
        <Modal 
          isOpen={showDistributeConfirm} 
          onClose={() => setShowDistributeConfirm(false)} 
          title="Confirmer la distribution"
        >
          <div className="space-y-6 p-2">
            <p className="text-slate-600 text-sm">
              Confirmer la distribution des profits ({stats?.totalProfit.toLocaleString()} FCFA) au prorata de l'investissement total des épargnants ?
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleDistribute}
                aria-label="Valider la distribution des profits"
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
              >
                Confirmer la distribution
              </button>
              <button
                onClick={() => setShowDistributeConfirm(false)}
                aria-label="Annuler la distribution"
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
              >
                Annuler
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* PROFIT VERIFICATION DETAILED MODAL */}
      {verificationModalData && (
        <Modal 
          isOpen={!!verificationModalData} 
          onClose={() => setVerificationModalData(null)} 
          title={`Vérification Répartition - ${new Date(verificationModalData.date).toLocaleDateString('fr-FR')}`}
        >
          <div className="space-y-6 p-2">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Somme Totale des Parts Réparties</p>
              <p className="text-2xl font-black text-slate-900">{verificationModalData.total.toFixed(2)}%</p>
              <p className="text-[10px] text-slate-400 mt-1">La somme totale cumulée des pourcentages des bénéfices distribués sur cette date.</p>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest">Détail par Épargnant</h4>
              <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {verificationModalData.items.map((item) => (
                  <div key={item.id} className="py-2.5 flex justify-between items-center text-sm">
                    <div>
                      <p className="font-bold text-slate-900">{item.user_name}</p>
                      <p className="text-[10px] text-slate-400">{item.description}</p>
                    </div>
                    <p className="font-black text-emerald-600">+{Number(item.amount).toLocaleString()} FCFA</p>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setVerificationModalData(null)}
              aria-label="Fermer la modal de vérification"
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
            >
              Fermer
            </button>
          </div>
        </Modal>
      )}

    </div>
  );
};

export default FinanceManager;
