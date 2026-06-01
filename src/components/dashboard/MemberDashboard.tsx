import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/shared/Navigation';
import { 
  Users, Wallet, Calendar, Clock, ArrowRight, CheckCircle, 
  AlertTriangle, TrendingUp, History, Info, Sparkles,
  ShieldCheck, Loader2, ArrowUpRight, Trophy, RefreshCw,
  ChevronRight, Gem, Zap, BarChart3, DollarSign, Bell,
  CircleDollarSign, LayoutDashboard, Plus, Headphones,
  Search, Filter, Download, CreditCard as CardIcon, Building
} from 'lucide-react';
import { tontineService, transactionService } from '@/services/api';
import { toast } from 'react-toastify';

// Standalone Helper: Determine if a transaction is late (> 48 hours or type is penalty)
const isTxLate = (tx: any) => {
  if (tx.status !== 'pending') return false;
  const txDate = new Date(tx.transaction_date || tx.created_at);
  const now = new Date();
  const diffHours = Math.abs(now.getTime() - txDate.getTime()) / (1000 * 60 * 60);
  return diffHours > 48 || tx.type === 'penalty';
};

// Helper: Status Label
const getTxStatusLabel = (tx: any) => {
  if (tx.status === 'completed' || tx.status === 'verified') return 'Validé';
  if (tx.status === 'failed') return 'Échoué';
  return isTxLate(tx) ? 'En retard' : 'En attente';
};

// SKELETON LOADERS
const StatsSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 animate-pulse">
        <div className="flex justify-between items-center mb-4">
          <div className="w-10 h-10 bg-slate-100 rounded-lg"></div>
          <div className="w-16 h-5 bg-slate-100 rounded-full"></div>
        </div>
        <div className="w-20 h-4 bg-slate-100 rounded mb-2"></div>
        <div className="w-32 h-8 bg-slate-100 rounded"></div>
        <div className="mt-4 w-28 h-3 bg-slate-100 rounded"></div>
      </div>
    ))}
  </div>
);

const TontineListSkeleton = () => (
  <div className="divide-y divide-slate-100 animate-pulse">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-100 rounded-xl"></div>
            <div className="space-y-2">
              <div className="w-32 h-5 bg-slate-100 rounded"></div>
              <div className="flex gap-2">
                <div className="w-16 h-4 bg-slate-100 rounded"></div>
                <div className="w-20 h-4 bg-slate-100 rounded"></div>
              </div>
            </div>
          </div>
          <div className="w-16 h-8 bg-slate-100 rounded-lg"></div>
        </div>
      </div>
    ))}
  </div>
);

const TransactionListSkeleton = () => (
  <div className="divide-y divide-slate-100 animate-pulse">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-lg"></div>
            <div className="space-y-1.5">
              <div className="w-24 h-4 bg-slate-100 rounded"></div>
              <div className="w-16 h-3 bg-slate-100 rounded"></div>
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-4">
            <div className="w-20 h-5 bg-slate-100 rounded"></div>
            <div className="w-14 h-5 bg-slate-100 rounded-full"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const StatsWidgetSkeleton = () => (
  <div className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse space-y-4">
    <div className="w-28 h-5 bg-slate-100 rounded mb-2"></div>
    {[...Array(2)].map((_, i) => (
      <div key={i} className="space-y-2">
        <div className="flex justify-between">
          <div className="w-24 h-4 bg-slate-100 rounded"></div>
          <div className="w-8 h-4 bg-slate-100 rounded"></div>
        </div>
        <div className="h-2 bg-slate-100 rounded-full"></div>
      </div>
    ))}
    <div className="pt-3 border-t border-slate-100 flex justify-between">
      <div className="w-24 h-4 bg-slate-100 rounded"></div>
      <div className="w-16 h-4 bg-slate-100 rounded"></div>
    </div>
  </div>
);

const MemberDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tontines, setTontines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'cercles' | 'historique'>('cercles');
  
  // Real-time Refresh States
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState<number>(0);
  
  // Pagination & Filtering
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'late'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Mobile Pull-to-refresh States
  const [pullStartY, setPullStartY] = useState(0);
  const [pulling, setPulling] = useState(false);

  const scrollYRef = useRef(0);
  const blobUrlsRef = useRef<string[]>([]);

  // Statistics
  const [stats, setStats] = useState<any>({ 
    totalCotise: 0, 
    totalBank: 0, 
    totalInterests: 0, 
    totalPending: 0, 
    joinedCount: 0,
    participationRate: 0,
    completedCycles: 0,
    totalCycles: 0,
    monthlyAverage: 0
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const tRes = await tontineService.getUserTontines();
      const allTontines = Array.isArray(tRes?.data) ? tRes.data : (tRes || []);
      setTontines(allTontines);

      const txRes = await transactionService.getAll();
      const allTx = txRes.success ? (txRes.data?.transactions || []) : [];
      setTransactions(allTx);

      // 1. Core financial stats with precise type checks
      const totalCotise = allTx
        .filter((tx: any) => tx.type === 'contribution' && (tx.status === 'completed' || tx.status === 'verified'))
        .reduce((acc: number, tx: any) => acc + Number(tx.amount || 0), 0);
      
      const totalBank = allTx
        .filter((tx: any) => tx.type === 'bank' && (tx.status === 'completed' || tx.status === 'verified'))
        .reduce((acc: number, tx: any) => acc + Number(tx.amount || 0), 0);

      // Separate tracking of interest/dividend payouts
      const totalInterests = allTx
        .filter((tx: any) => tx.type === 'payout' && tx.description && tx.description.includes('Distribution') && (tx.status === 'completed' || tx.status === 'verified'))
        .reduce((acc: number, tx: any) => acc + Number(tx.amount || 0), 0);
      
      // Differentiate pending vs late in statistics
      const totalPending = allTx
        .filter((tx: any) => tx.status === 'pending' && !isTxLate(tx))
        .reduce((acc: number, tx: any) => acc + Number(tx.amount || 0), 0);

      // 2. Taux de participation & Cycles complétés from actual data
      const totalCycles = allTontines.reduce((acc: number, t: any) => acc + Number(t.duration || 0), 0);
      let completedCycles = 0;
      allTontines.forEach((t: any) => {
        if (t.status === 'completed') {
          completedCycles += Number(t.duration || 0);
        } else {
          // Count payout transactions which represent completed cycles in this tontine
          const payoutsCount = allTx.filter((tx: any) => 
            String(tx.tontine_id) === String(t.id) && 
            tx.type === 'payout' && 
            (!tx.description || !tx.description.includes('Distribution')) && 
            tx.status === 'completed'
          ).length;
          completedCycles += Math.min(payoutsCount, Number(t.duration || 0));
        }
      });
      const participationRate = totalCycles > 0 ? Math.round((completedCycles / totalCycles) * 100) : 0;

      // 3. Monthly Average calculated from transactions over time
      const userSavingsTxs = allTx.filter((tx: any) => 
        (tx.type === 'contribution' || tx.type === 'bank') && 
        (tx.status === 'completed' || tx.status === 'verified')
      );
      const totalSavings = userSavingsTxs.reduce((acc: number, tx: any) => acc + Number(tx.amount || 0), 0);
      let numMonths = 1;
      if (userSavingsTxs.length > 0) {
        const dates = userSavingsTxs.map((tx: any) => new Date(tx.transaction_date || tx.created_at).getTime());
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date();
        const diffTime = Math.abs(maxDate.getTime() - minDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        numMonths = Math.max(1, Math.ceil(diffDays / 30));
      }
      const monthlyAverage = Math.round(totalSavings / numMonths);

      setStats({
        totalCotise,
        totalBank,
        totalInterests,
        totalPending,
        joinedCount: allTontines.length,
        participationRate,
        completedCycles,
        totalCycles,
        monthlyAverage
      });

      setSecondsSinceUpdate(0);
    } catch (err: any) {
      console.error("Dashboard Fetch Error:", err);
      const errMsg = err.response?.data?.message || err.message || "Une erreur est survenue lors du chargement de l'espace.";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Combined Initial Load + Polling Auto-Refresh
  useEffect(() => {
    loadData();

    const dataInterval = setInterval(() => {
      loadData();
    }, 30000);

    const secInterval = setInterval(() => {
      setSecondsSinceUpdate(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(dataInterval);
      clearInterval(secInterval);
    };
  }, [loadData]);

  // Scroll position tracking & cleanup
  useEffect(() => {
    const handleScroll = () => {
      scrollYRef.current = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      blobUrlsRef.current.forEach(url => {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {
          console.error("Revoke error:", e);
        }
      });
    };
  }, []);

  // Pull-to-refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (scrollYRef.current === 0) {
      setPullStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (pullStartY === 0) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - pullStartY;
    if (diff > 80 && scrollYRef.current === 0) {
      setPulling(true);
    }
  };

  const handleTouchEnd = () => {
    if (pulling) {
      loadData().then(() => {
        setPulling(false);
        setPullStartY(0);
      });
    } else {
      setPullStartY(0);
    }
  };

  const getNextSunday = () => {
    const now = new Date();
    const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
    const next = new Date(now);
    next.setDate(now.getDate() + daysUntilSunday);
    return next.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'short' });
  };

  // Check for actual late transactions
  const hasLatePayments = transactions.some(tx => isTxLate(tx));
  const memberStatus = hasLatePayments ? 'retard' : 'a_jour';

  // Notification badge count (all pending and late payments)
  const pendingOrLateCount = transactions.filter(tx => tx.status === 'pending').length;

  // Export User transactions to CSV
  const handleExportCSV = () => {
    if (transactions.length === 0) {
      toast.info("Aucune transaction à exporter.");
      return;
    }

    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = ['ID', 'Tontine', 'Type', 'Montant (FCFA)', 'Statut', 'Date', 'Description', 'Methode'];
    const rows = transactions.map(tx => [
      tx.id || '',
      tx.tontine_name || 'N/A',
      tx.type === 'contribution' ? 'Cotisation' : tx.type === 'bank' ? 'Épargne' : tx.type === 'payout' ? 'Gain reçu' : tx.type,
      tx.amount || 0,
      getTxStatusLabel(tx),
      new Date(tx.transaction_date || tx.created_at).toLocaleDateString('fr-FR'),
      tx.description || '',
      tx.method || ''
    ]);

    const csvContent = "\uFEFF" // UTF-8 BOM
      + [headers.join(','), ...rows.map(e => e.map(escapeCSV).join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    blobUrlsRef.current.push(url);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Releve_Transactions_${user?.name?.replace(/\s+/g, '_') || 'Membre'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Relevé de transactions exporté en CSV !");
  };

  // Filter transactions
  const getFilteredTransactions = () => {
    return transactions.filter(tx => {
      // 1. Search Query
      const tontineName = (tx.tontine_name || '').toLowerCase();
      const txTypeStr = (tx.type === 'contribution' ? 'cotisation' : tx.type === 'bank' ? 'depot banque epargne' : tx.type === 'payout' ? 'gain' : tx.type).toLowerCase();
      const matchesSearch = tontineName.includes(searchQuery.toLowerCase()) || txTypeStr.includes(searchQuery.toLowerCase());

      // 2. Type Filter
      const matchesType = typeFilter === 'all' || tx.type === typeFilter;

      // 3. Status Filter
      let matchesStatus = true;
      if (statusFilter === 'pending') {
        matchesStatus = tx.status === 'pending';
      } else if (statusFilter === 'late') {
        matchesStatus = isTxLate(tx);
      } else if (statusFilter === 'completed') {
        matchesStatus = tx.status === 'completed' || tx.status === 'verified';
      }

      // 4. Date Range
      let matchesDate = true;
      const txDate = new Date(tx.transaction_date || tx.created_at);
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0,0,0,0);
        if (txDate < start) matchesDate = false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23,59,59,999);
        if (txDate > end) matchesDate = false;
      }

      return matchesSearch && matchesType && matchesStatus && matchesDate;
    });
  };

  // Pagination calculations
  const filteredTxs = getFilteredTransactions();
  const totalFiltered = filteredTxs.length;
  const totalPages = Math.ceil(totalFiltered / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = filteredTxs.slice(indexOfFirstItem, indexOfLastItem);
  const showingFrom = totalFiltered > 0 ? indexOfFirstItem + 1 : 0;
  const showingTo = Math.min(indexOfLastItem, totalFiltered);

  // Error UI State
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-2xl border border-rose-100 p-8 shadow-sm max-w-md mx-auto">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="text-rose-600" size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Erreur de chargement</h2>
            <p className="text-sm text-slate-500 mb-6">{error}</p>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => { setError(null); loadData(); }}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center gap-2"
              >
                <RefreshCw size={16} /> Réessayer
              </button>
              <button 
                onClick={() => navigate('/')}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-all"
              >
                Retour
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <Navigation />

      {/* Header with Notification Badge & Actions */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                <LayoutDashboard size={24} className="text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-slate-500">Bienvenue, {user?.name?.split(' ')[0] || 'Membre'}</p>
                  <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    Mis à jour il y a {secondsSinceUpdate}s
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Notification Badge Bell */}
              <div 
                role="button"
                tabIndex={0}
                onClick={() => {
                  setActiveTab('historique');
                  setStatusFilter('pending');
                  window.scrollTo({ top: 300, behavior: 'smooth' });
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveTab('historique');
                    setStatusFilter('pending');
                    window.scrollTo({ top: 300, behavior: 'smooth' });
                  }
                }}
                className="relative p-2 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer mr-1 bg-slate-50 rounded-lg border border-slate-100 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 outline-none"
                title="Déclarations de versement en attente"
              >
                <Bell size={20} />
                {pendingOrLateCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
                    {pendingOrLateCount}
                  </span>
                )}
              </div>

              <button 
                onClick={() => navigate('/help')}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Aide
              </button>
              
              <button 
                onClick={() => navigate('/join-tontine')}
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
              >
                <Plus size={18} /> Nouveau cercle
              </button>
            </div>
          </div>
        </div>
      </div>

      <main 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-8 relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Pull to refresh visual overlay */}
        {pulling && (
          <div className="flex items-center justify-center gap-2 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-700 text-xs font-semibold mb-6 animate-pulse w-fit mx-auto px-6">
            <RefreshCw size={14} className="animate-spin" />
            <span>Relâchez pour actualiser...</span>
          </div>
        )}

        {/* Stats Grid */}
        {loading && tontines.length === 0 ? (
          <StatsSkeleton />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <CheckCircle size={20} className="text-emerald-600" />
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  memberStatus === 'a_jour' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {memberStatus === 'a_jour' ? 'À jour' : 'En retard'}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1">Statut du compte</p>
              <p className="text-2xl font-bold text-slate-900">
                {memberStatus === 'a_jour' ? 'Actif' : 'Action requise'}
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                <ShieldCheck size={12} />
                <span>Vérifié</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <CircleDollarSign size={20} className="text-indigo-600" />
                </div>
                <TrendingUp size={16} className="text-emerald-500" />
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1">Cotisations Tontine</p>
              <p className="text-2xl font-bold text-slate-900">
                {stats.totalCotise.toLocaleString()} <span className="text-sm font-normal text-slate-400">FCFA</span>
              </p>
              <p className="text-xs text-slate-400 mt-2">Capital versé dans les cercles</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <Building size={20} className="text-emerald-600" />
                </div>
                <Sparkles size={16} className="text-amber-500" />
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1">Épargne Banque</p>
              <p className="text-2xl font-bold text-slate-900">
                {(stats.totalBank || 0).toLocaleString()} <span className="text-sm font-normal text-slate-400">FCFA</span>
              </p>
              <p className="text-xs text-slate-400 mt-2">Fonds disponibles en banque</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 hover:shadow-md transition-shadow border-b-4 border-b-amber-500">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                  <Gem size={20} className="text-amber-600" />
                </div>
                <ArrowUpRight size={16} className="text-emerald-500" />
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1">Intérêts & Gains</p>
              <p className="text-2xl font-bold text-emerald-600">
                +{(stats.totalInterests || 0).toLocaleString()} <span className="text-sm font-normal text-slate-400">FCFA</span>
              </p>
              <p className="text-xs text-slate-400 mt-2">Dividendes et parts de profits</p>
            </div>
          </div>
        )}

        {/* Main Content Area with Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2">
            {/* Scrollable Tab Navigation on mobile */}
            <div className="bg-white rounded-xl border border-slate-200 p-1 mb-6 overflow-x-auto no-scrollbar">
              <div className="flex gap-1 min-w-[280px]">
                <button 
                  onClick={() => setActiveTab('cercles')} 
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'cercles' 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Users size={16} /> Mes cercles ({tontines.length})
                </button>
                <button 
                  onClick={() => setActiveTab('historique')} 
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'historique' 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <History size={16} /> Historique ({transactions.length})
                </button>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'cercles' ? (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Cercles actifs</h2>
                    <p className="text-sm text-slate-500 mt-1">Gérez et suivez vos tontines en cours</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">Mis à jour il y a {secondsSinceUpdate}s</span>
                    <button 
                      onClick={loadData}
                      className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                      title="Actualiser"
                    >
                      <RefreshCw size={18} />
                    </button>
                  </div>
                </div>
                
                {loading && tontines.length === 0 ? (
                  <TontineListSkeleton />
                ) : (
                  <div className="divide-y divide-slate-100">
                    {tontines.length > 0 ? (
                      tontines.map((t) => (
                        <div 
                          key={t.id} 
                          onClick={() => navigate(`/tontine/${t.id}`)}
                          className="p-6 hover:bg-slate-50 transition-colors cursor-pointer group"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                {t.emoji || '💰'}
                              </div>
                              <div>
                                <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                  {t.name}
                                </h3>
                                <div className="flex flex-wrap items-center gap-3 mt-1.5">
                                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                                    <Users size={12} /> {t.current_members}/{t.max_members}
                                  </span>
                                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                                    <Wallet size={12} /> {Number(t.amount).toLocaleString()} FCFA
                                  </span>
                                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full">
                                    {t.frequency}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                {t.rotation_position ? (
                                  <>
                                    <p className="text-sm font-medium text-slate-900">Position #{t.rotation_position}</p>
                                    <p className="text-xs text-emerald-600">Actif</p>
                                  </>
                                ) : (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); navigate(`/tontine/${t.id}/draw`); }}
                                    className="px-3 py-1.5 bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-amber-200 transition-all border border-amber-200"
                                  >
                                    Tirage
                                  </button>
                                )}
                              </div>
                              <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-16 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Users size={28} className="text-slate-300" />
                        </div>
                        <h3 className="text-base font-medium text-slate-700 mb-2">Aucun cercle actif</h3>
                        <p className="text-sm text-slate-400 mb-6">Rejoignez un cercle pour commencer à épargner</p>
                        <button 
                          onClick={() => navigate('/join-tontine')}
                          className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                        >
                          Rejoindre un cercle
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Historique des transactions</h2>
                    <p className="text-sm text-slate-500 mt-1">Suivez tous vos versements et gains</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">Mis à jour il y a {secondsSinceUpdate}s</span>
                    <button 
                      onClick={loadData}
                      className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                      title="Actualiser"
                    >
                      <RefreshCw size={18} />
                    </button>
                  </div>
                </div>

                {/* Search and Filters */}
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        placeholder="Rechercher par tontine ou type..." 
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    {/* Type Filter */}
                    <div>
                      <select 
                        value={typeFilter}
                        onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="all">Tous les types</option>
                        <option value="contribution">Cotisation tontine</option>
                        <option value="payout">Gain reçu</option>
                        <option value="bank">Épargne banque</option>
                        <option value="penalty">Pénalité</option>
                        <option value="loan">Emprunt</option>
                        <option value="repayment">Remboursement</option>
                      </select>
                    </div>

                    {/* Status Filter */}
                    <div>
                      <select 
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value as any); setCurrentPage(1); }}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="all">Tous les statuts</option>
                        <option value="pending">En attente (récent)</option>
                        <option value="late">En retard</option>
                        <option value="completed">Validé</option>
                      </select>
                    </div>
                  </div>

                  {/* Date Range filters */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Période du :</span>
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500"
                    />
                    <span className="text-xs text-slate-400">au</span>
                    <input 
                      type="date" 
                      value={endDate}
                      onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500"
                    />
                    {(startDate || endDate || searchQuery || typeFilter !== 'all' || statusFilter !== 'all') && (
                      <button 
                        onClick={() => {
                          setStartDate('');
                          setEndDate('');
                          setSearchQuery('');
                          setTypeFilter('all');
                          setStatusFilter('all');
                          setCurrentPage(1);
                        }}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700 underline"
                      >
                        Réinitialiser les filtres
                      </button>
                    )}
                  </div>
                </div>

                {loading && transactions.length === 0 ? (
                  <TransactionListSkeleton />
                ) : (
                  <div className="divide-y divide-slate-100">
                    {currentTransactions.length > 0 ? (
                      currentTransactions.map((tx, idx) => (
                        <div key={tx.id || idx} className="p-5 hover:bg-slate-50 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                tx.type === 'payout' ? 'bg-amber-100' : 
                                tx.type === 'bank' ? 'bg-blue-100' : 'bg-emerald-100'
                              }`}>
                                {tx.type === 'payout' ? <Trophy size={18} className="text-amber-600"/> : 
                                 tx.type === 'bank' ? <CardIcon size={18} className="text-blue-600"/> : 
                                 <CheckCircle size={18} className="text-emerald-600"/>}
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">
                                  {tx.type === 'contribution' ? 'Cotisation' : 
                                   tx.type === 'bank' ? 'Dépôt bancaire' : 
                                   tx.type === 'payout' ? 'Gain reçu' : tx.type}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <p className="text-xs text-slate-400">
                                    {new Date(tx.transaction_date || tx.created_at).toLocaleDateString('fr-FR', { 
                                      day: '2-digit', month: 'short', year: 'numeric' 
                                    })}
                                  </p>
                                  {tx.tontine_name && (
                                    <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.25 rounded font-medium">
                                      {tx.tontine_name}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-4">
                              <p className={`font-semibold ${
                                tx.type === 'payout' ? 'text-amber-600' : 'text-slate-900'
                              }`}>
                                {tx.type === 'payout' ? '+' : ''}{Number(tx.amount).toLocaleString()} FCFA
                              </p>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                tx.status === 'completed' || tx.status === 'verified' 
                                  ? 'bg-emerald-100 text-emerald-700' 
                                  : isTxLate(tx)
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}>
                                {getTxStatusLabel(tx)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-16 text-center">
                        <History size={40} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-base font-medium text-slate-700 mb-2">Aucune transaction</h3>
                        <p className="text-sm text-slate-400">Les versements apparaîtront ici après validation</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Pagination Controls */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
                  <span className="text-xs text-slate-500 font-medium">
                    Affichage de {showingFrom} à {showingTo} sur {totalFiltered} transactions
                  </span>
                  {totalPages > 1 && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { setCurrentPage(prev => Math.max(prev - 1, 1)); }}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                      >
                        Précédent
                      </button>
                      <span className="text-xs font-semibold self-center px-2 text-slate-600">
                        {currentPage} / {totalPages}
                      </span>
                      <button 
                        onClick={() => { setCurrentPage(prev => Math.min(prev + 1, totalPages)); }}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                      >
                        Suivant
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar Widgets */}
          <div className="space-y-6">
            {/* Quick Actions Widget */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Zap size={18} className="text-indigo-600" />
                Actions rapides
              </h3>
              <div className="space-y-3">
                <button 
                  onClick={() => navigate('/join-tontine')}
                  className="w-full px-4 py-2.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
                >
                  
                </button>
               
                <button 
                  onClick={handleExportCSV}
                  className="w-full px-4 py-2.5 bg-slate-50 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                >
                  <Download size={16} /> Exporter mon relevé
                </button>
              </div>
            </div>

            {/* Notification Widget */}
            <div className={`rounded-xl border p-5 ${
              memberStatus === 'a_jour' 
                ? 'bg-emerald-50 border-emerald-200' 
                : 'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  memberStatus === 'a_jour' ? 'bg-emerald-100' : 'bg-amber-100'
                }`}>
                  {memberStatus === 'a_jour' ? (
                    <Bell size={16} className="text-emerald-600" />
                  ) : (
                    <AlertTriangle size={16} className="text-amber-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`font-medium text-sm ${
                    memberStatus === 'a_jour' ? 'text-emerald-800' : 'text-amber-800'
                  }`}>
                    {memberStatus === 'a_jour' ? 'Prochaine échéance' : 'Attention'}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    {memberStatus === 'a_jour' 
                      ? `Votre prochaine cotisation est prévue le ${getNextSunday()}.`
                      : 'Vous avez des cotisations en retard ou en attente. Veuillez contacter votre administrateur.'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Support Widget */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl p-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <Headphones size={24} />
                <h3 className="font-semibold">Besoin d'aide ?</h3>
              </div>
              <p className="text-sm text-indigo-100 mb-4">
                Notre équipe est disponible pour vous accompagner
              </p>
              <button 
                onClick={() => window.open('mailto:support@tontinetogether.com?subject=Support%20TontineTogether', '_blank')}
                className="w-full px-4 py-2.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors backdrop-blur-sm"
              >
                Contacter le support
              </button>
            </div>

            {/* Stats Widget */}
            {loading && tontines.length === 0 ? (
              <StatsWidgetSkeleton />
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <BarChart3 size={18} className="text-indigo-600" />
                  Statistiques
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-500">Taux de participation</span>
                      <span className="font-medium text-slate-900">{stats.participationRate}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600 rounded-full transition-all duration-500" 
                        style={{ width: `${stats.participationRate}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-500">Cycles complétés</span>
                      <span className="font-medium text-slate-900">{stats.completedCycles}/{stats.totalCycles}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600 rounded-full transition-all duration-500" 
                        style={{ width: `${stats.totalCycles > 0 ? (stats.completedCycles / stats.totalCycles) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-slate-100">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Moyenne mensuelle</span>
                      <span className="font-medium text-slate-900">
                        {stats.monthlyAverage.toLocaleString()} FCFA
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Bottom Navigation Bar / FAB */}
        <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-50 flex justify-around py-3 lg:hidden shadow-lg pb-safe">
          <button 
            onClick={() => { setActiveTab('cercles'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className={`flex flex-col items-center gap-1 text-[10px] ${activeTab === 'cercles' ? 'text-indigo-600 font-semibold' : 'text-slate-500'}`}
          >
            <Users size={18} />
            <span>Mes cercles</span>
          </button>
          <button 
            onClick={() => navigate('/join-tontine')}
            className="flex flex-col items-center gap-1 text-[10px] text-slate-500"
          >
            <div className="-mt-7 w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all">
              <Plus size={20} />
            </div>
            <span className="text-[9px] mt-0.5 font-medium">Nouveau</span>
          </button>
          <button 
            onClick={() => { setActiveTab('historique'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className={`flex flex-col items-center gap-1 text-[10px] ${activeTab === 'historique' ? 'text-indigo-600 font-semibold' : 'text-slate-500'}`}
          >
            <History size={18} />
            <span>Historique</span>
          </button>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-slate-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} TontiPay. Tous droits réservés.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                Conditions d'utilisation
              </a>
              <a href="#" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                Politique de confidentialité
              </a>
              <a href="#" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                Mentions légales
              </a>
            </div>
          </div>
        </footer>

      </main>

      <style>{`
        @keyframes blink {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        .font-blink { animation: blink 1.5s infinite; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default MemberDashboard;