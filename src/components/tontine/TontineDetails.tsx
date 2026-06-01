import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navigation from '@/components/shared/Navigation';
import { 
  Users, Calendar, ArrowLeft, CircleDollarSign, Download, Dice5, 
  Trophy, CheckCircle, TrendingUp, Target, Zap, Gift,
  History, Coins, Copy, Info, Bell, ArrowRight, BarChart3,
  DollarSign, ChevronDown, ChevronUp, RefreshCw, AlertTriangle, FileText
} from 'lucide-react';
import { tontineService, transactionService, drawService } from '../../services/api';
import { exportMembersToExcel, exportTransactionsToExcel } from '../../services/exportService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';

const TontineDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [tontine, setTontine] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [drawSession, setDrawSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'members' | 'cycle' | 'history'>('cycle');

  // Interactive States
  const [expandedMemberId, setExpandedMemberId] = useState<string | number | null>(null);
  const [expandedTransactionId, setExpandedTransactionId] = useState<string | number | null>(null);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTypeFilter, setHistoryTypeFilter] = useState<string>('all');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Modals / Dropdowns States
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentType, setPaymentType] = useState<string>('contribution');
  const [paymentMethod, setPaymentMethod] = useState<string>('mobile_money');
  const [paymentDescription, setPaymentDescription] = useState<string>('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  const exportDropdownRef = useRef<HTMLDivElement>(null);
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchDetails = async (isSilent = false) => {
    if (!id || !user) return;
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      // Fetch stats, transactions, members, details
      const [detailsRes, membersRes, transRes, statsRes] = await Promise.all([
        tontineService.getTontineDetails(id),
        tontineService.getTontineMembers(id).catch(err => {
          console.error("Failed to fetch tontine members", err);
          return [];
        }),
        transactionService.getByTontine(id).catch(err => {
          console.error("Failed to fetch transactions", err);
          return [];
        }),
        transactionService.getTontineStats(id).catch(err => {
          console.error("Failed to fetch stats", err);
          return null;
        })
      ]);

      const details = detailsRes?.data || detailsRes;
      if (!details) {
        throw new Error("Tontine introuvable");
      }

      const members = Array.isArray(membersRes) ? membersRes : (membersRes?.data || []);
      setTontine({ ...details, members });
      setStats(statsRes?.data || statsRes);
      setAllTransactions(Array.isArray(transRes) ? transRes : (transRes?.data || []));

      const currentMember = members.find((m: any) => String(m.id) === String(user?.id));
      setMemberInfo(currentMember || null);
      setIsAdmin(currentMember?.role === 'admin' || user?.role === 'admin');

      // Fetch draw session status
      try {
        const sessionRes = await drawService.getSession(id);
        setDrawSession(sessionRes?.data || sessionRes);
      } catch (sessionErr) {
        console.warn("Could not fetch draw session status:", sessionErr);
      }

      setLastUpdated(new Date());
    } catch (err: any) {
      console.error("Fetch Details Error:", err);
      const msg = err.response?.data?.message || err.message || 'Erreur lors du chargement des détails';
      setError(msg);
      if (!isSilent) toast.error(msg);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  // Auto-refresh mechanism (every 60s)
  useEffect(() => {
    fetchDetails();

    const isModalActive = showPaymentModal || showExportDropdown;
    if (!isModalActive) {
      autoRefreshInterval.current = setInterval(() => {
        fetchDetails(true);
      }, 60000);
    }

    return () => {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
      }
    };
  }, [id, user, showPaymentModal, showExportDropdown]);

  // Keyboard navigation for order of passage
  const handleBeneficiaryKeyDown = (e: React.KeyboardEvent, memberId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setExpandedMemberId(expandedMemberId === memberId ? null : memberId);
    }
  };

  // Calculations
  const getProgressPercentage = () => {
    if (!tontine?.members || tontine.members.length === 0) return 0;
    const currentPosition = memberInfo?.rotation_position || 0;
    const total = tontine.members.length;
    return total > 0 ? (currentPosition / total) * 100 : 0;
  };

  const getNextDrawDate = () => {
    const now = new Date();
    const nextDraw = new Date(now);
    if (tontine?.frequency === 'hebdomadaire') {
      nextDraw.setDate(now.getDate() + (7 - now.getDay()));
    } else if (tontine?.frequency === 'mensuel') {
      nextDraw.setMonth(now.getMonth() + 1);
      nextDraw.setDate(1);
    } else {
      nextDraw.setDate(now.getDate() + 3);
    }
    return nextDraw.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  };

  // Active contributors (members who have contributed at least once)
  const activeContributors = tontine?.members?.filter((m: any) => 
    allTransactions?.some((tx: any) => tx.user_id === m.id && tx.type === 'contribution' && tx.status === 'completed')
  ).length || 0;

  const totalMembersCount = tontine?.members?.length || 0;
  const participationRate = totalMembersCount > 0 
    ? Math.round((activeContributors / totalMembersCount) * 100) 
    : 0;

  // Cycles
  const completedCycles = allTransactions?.filter(tx => tx.type === 'payout' && tx.status === 'completed').length || 0;
  const totalCycles = tontine?.duration || totalMembersCount || 12;
  const currentCycle = Math.min(completedCycles + 1, totalCycles);

  // User Payment Status
  const personalCotised = Number(stats?.personal?.my_tontine || 0);
  const expectedPersonalCotisation = (tontine?.amount || 0) * currentCycle;
  const isUpToDate = personalCotised >= expectedPersonalCotisation;
  const userStatusLabel = isUpToDate ? 'À jour' : 'En retard';

  // Export handlers
  const handleExport = async (format: 'xlsx' | 'csv') => {
    if (!tontine) return;
    setExportLoading(true);
    setShowExportDropdown(false);
    try {
      if (activeTab === 'members') {
        const membersList = tontine.members || [];
        if (format === 'xlsx') {
          exportMembersToExcel(membersList, tontine.name);
        } else {
          // Export members as CSV
          const headers = ['Nom Complet', 'Telephone', 'Role', 'Date adhesion', 'Statut Cotisation'];
          const rows = membersList.map((m: any) => [
            m.name,
            m.phone || 'Non renseigne',
            m.role === 'admin' ? 'Fondateur' : 'Partenaire',
            new Date(m.joined_at).toLocaleDateString('fr-FR'),
            m.rotation_position ? 'Paye' : 'En attente'
          ]);
          downloadCSV(headers, rows, `Membres_${tontine.name.replace(/\s+/g, '_')}`);
        }
        toast.success("Membres exportés avec succès !");
      } else {
        const transList = allTransactions || [];
        if (format === 'xlsx') {
          exportTransactionsToExcel(transList, tontine.name);
        } else {
          // Export transactions as CSV
          const headers = ['Date', 'Membre', 'Montant (FCFA)', 'Type', 'Methode', 'Statut', 'Commentaire'];
          const rows = transList.map((t: any) => [
            new Date(t.transaction_date).toLocaleDateString('fr-FR'),
            t.user_name || 'Utilisateur inconnu',
            t.amount,
            t.type,
            t.method,
            t.status,
            t.description || ''
          ]);
          downloadCSV(headers, rows, `Transactions_${tontine.name.replace(/\s+/g, '_')}`);
        }
        toast.success("Transactions exportées avec succès !");
      }
    } catch (err) {
      console.error("Export Error:", err);
      toast.error("Erreur lors de l'exportation");
    } finally {
      setExportLoading(false);
    }
  };

  const downloadCSV = (headers: string[], rows: any[][], fileName: string) => {
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Payment Form Submit
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      toast.error("Veuillez saisir un montant valide");
      return;
    }
    setPaymentSubmitting(true);
    try {
      await transactionService.create({
        tontineId: id,
        amount: Number(paymentAmount),
        type: paymentType,
        method: paymentMethod,
        description: paymentDescription || `Versement de ${paymentAmount} FCFA par l'utilisateur`
      });
      toast.success("Déclaration de versement enregistrée ! En attente de validation admin.");
      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentDescription('');
      fetchDetails(true);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erreur lors de la déclaration du versement");
    } finally {
      setPaymentSubmitting(false);
    }
  };

  // Scroll to timeline
  const handleScrollToTimeline = () => {
    setActiveTab('cycle');
    setTimeout(() => {
      const timelineElement = document.getElementById('cycle-timeline');
      if (timelineElement) {
        timelineElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  };

  // Filters & Search
  const filteredMembers = (tontine?.members || []).filter((m: any) => 
    m.name.toLowerCase().includes(memberSearchQuery.toLowerCase())
  );

  const filteredTransactions = (allTransactions || []).filter((tx: any) => {
    const typeMatch = historyTypeFilter === 'all' || tx.type === historyTypeFilter;
    const userMatch = tx.user_id === user?.id; // keep history tab focused on current user
    return typeMatch && userMatch;
  });

  // History Pagination
  const ITEMS_PER_PAGE = 10;
  const totalHistoryPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE) || 1;
  const paginatedTransactions = filteredTransactions.slice(
    (historyPage - 1) * ITEMS_PER_PAGE,
    historyPage * ITEMS_PER_PAGE
  );

  // Draw conditions
  const isDrawSessionOpen = drawSession?.status === 'open';
  const hasDrawnPosition = !!memberInfo?.rotation_position;

  // Skeletons Loader Matching Layout
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
        <Navigation />
        <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm animate-pulse">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
              <div className="space-y-2">
                <div className="h-5 w-48 bg-slate-200 rounded"></div>
                <div className="h-3 w-32 bg-slate-200 rounded"></div>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-10 w-24 bg-slate-200 rounded-lg"></div>
              <div className="h-10 w-28 bg-slate-200 rounded-lg"></div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Skeletons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse space-y-4">
                <div className="flex justify-between items-center">
                  <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
                  <div className="w-12 h-4 bg-slate-200 rounded-full"></div>
                </div>
                <div className="h-3 w-16 bg-slate-200 rounded"></div>
                <div className="h-7 w-32 bg-slate-200 rounded"></div>
                <div className="h-3 w-24 bg-slate-200 rounded"></div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Beneficiary List Skeleton */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse space-y-4">
                <div className="flex justify-between items-center pb-4 border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-slate-200 rounded"></div>
                      <div className="h-3 w-48 bg-slate-200 rounded"></div>
                    </div>
                  </div>
                  <div className="h-6 w-24 bg-slate-200 rounded-full"></div>
                </div>
                <div className="space-y-3 pt-2">
                  {[...Array(3)].map((_, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
                        <div className="space-y-1">
                          <div className="h-4 w-28 bg-slate-200 rounded"></div>
                          <div className="h-3 w-16 bg-slate-200 rounded"></div>
                        </div>
                      </div>
                      <div className="h-4 w-12 bg-slate-200 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabs Section Skeleton */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse">
                <div className="border-b border-slate-100 p-1 flex gap-1">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex-1 h-10 bg-slate-100 rounded-lg"></div>
                  ))}
                </div>
                <div className="p-5 space-y-4">
                  <div className="h-32 bg-slate-50 rounded-lg"></div>
                </div>
              </div>
            </div>

            {/* Sidebar Skeletons */}
            <div className="space-y-6">
              {[...Array(4)].map((_, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse space-y-4">
                  <div className="h-4 w-24 bg-slate-200 rounded"></div>
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-slate-100 rounded"></div>
                    <div className="h-3 w-5/6 bg-slate-100 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error State with Retry
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full text-center shadow-lg">
          <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="text-rose-600" size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Une erreur est survenue</h2>
          <p className="text-slate-600 text-sm mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={() => navigate('/dashboard')}
              className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Retour au Dashboard
            </button>
            <button 
              onClick={() => fetchDetails()}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} /> Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle case where tontine is null
  if (!tontine) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full text-center shadow-lg">
          <p className="text-slate-600 font-semibold mb-4">Aucune tontine trouvée.</p>
          <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium">
            Retour
          </button>
        </div>
      </div>
    );
  }

  // Handle case where user is not a member
  if (!memberInfo && user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full text-center shadow-lg">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Info className="text-amber-600" size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Accès restreint</h2>
          <p className="text-slate-600 text-sm mb-6">Vous ne faites pas partie de ce cercle de tontine. Si vous possédez un code d'accès, vous pouvez rejoindre la tontine depuis votre tableau de bord.</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Rejoindre avec un code
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <Navigation />

      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/dashboard')} 
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
                aria-label="Retour au tableau de bord"
              >
                <ArrowLeft size={20} className="text-slate-600" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl" role="img" aria-label="emoji">{tontine.emoji || '💰'}</span>
                  <h1 className="text-xl font-bold text-slate-900">{tontine.name}</h1>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <Users size={12} /> {tontine.members?.length || 0} membres
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500 capitalize">
                    <Calendar size={12} /> {tontine.frequency}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                    Mise à jour: {lastUpdated.toLocaleTimeString('fr-FR')}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {isAdmin && (
                <button 
                  onClick={() => navigate(`/admin-tontine/${id}`)} 
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
                >
                  Administration
                </button>
              )}
              
              {/* Tirer ma position button */}
              <button 
                onClick={() => navigate(`/tontine/${id}/draw`)}
                disabled={!isDrawSessionOpen && !hasDrawnPosition}
                title={!isDrawSessionOpen && !hasDrawnPosition ? "Le tirage n'est pas encore ouvert par l'administrateur" : ""}
                className={`px-4 py-2 rounded-lg text-sm font-black transition-all shadow-md flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-[#C9A84C] outline-none ${
                  hasDrawnPosition 
                    ? "bg-[#C9A84C] text-[#1B4332] hover:scale-105" 
                    : !isDrawSessionOpen 
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none" 
                      : "bg-amber-500 text-white hover:scale-105 animate-pulse"
                }`}
              >
                <Dice5 size={16} /> 
                {hasDrawnPosition ? "Voir Tirage" : isDrawSessionOpen ? "Tirer ma position" : "Tirage non ouvert"}
              </button>

              {/* Export Dropdown */}
              <div className="relative" ref={exportDropdownRef}>
                <button 
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                  disabled={exportLoading}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
                >
                  <Download size={16} /> 
                  <span>{exportLoading ? 'Exportation...' : 'Exporter'}</span>
                </button>
                {showExportDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1">
                    <button 
                      onClick={() => handleExport('xlsx')}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <FileText size={16} className="text-emerald-600" /> Excel (.xlsx)
                    </button>
                    <button 
                      onClick={() => handleExport('csv')}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <FileText size={16} className="text-blue-600" /> CSV (.csv)
                    </button>
                  </div>
                )}
              </div>

              {/* Manual Refresh */}
              <button 
                onClick={() => fetchDetails()}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
                aria-label="Actualiser les données"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:lg:px-8 py-8">
        
        {/* Stats Grid - Professional KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {/* Statut Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <CheckCircle size={20} className="text-emerald-600" />
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                userStatusLabel === 'À jour' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              }`}>
                {userStatusLabel}
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Mon Statut</p>
            <p className="text-2xl font-bold text-slate-900">{userStatusLabel}</p>
            <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600">
              <CheckCircle size={12} /> Cycle {currentCycle}
            </div>
          </div>

          {/* Total Cotisé Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                <CircleDollarSign size={20} className="text-indigo-600" />
              </div>
              <TrendingUp size={16} className="text-emerald-500" />
            </div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Total Cotisé</p>
            <p className="text-2xl font-bold text-slate-900">
              {personalCotised.toLocaleString()} <span className="text-sm font-normal text-slate-400">FCFA</span>
            </p>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Progression</span>
                <span>{expectedPersonalCotisation > 0 ? Math.round((personalCotised / expectedPersonalCotisation) * 100) : 0}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 rounded-full" 
                  style={{ width: `${expectedPersonalCotisation > 0 ? Math.min((personalCotised / expectedPersonalCotisation) * 100, 100) : 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Ma Position Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <Target size={20} className="text-purple-600" />
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Ma Position</p>
            {hasDrawnPosition ? (
              <>
                <div className="flex items-baseline gap-1">
                  <p className="text-2xl font-bold text-slate-900">{memberInfo.rotation_position}</p>
                  <p className="text-sm text-slate-400">/{tontine.members?.length || 0}</p>
                </div>
                <p className="text-xs text-slate-500 mt-2">Position confirmée</p>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-2xl font-bold text-slate-300">?</p>
                <button 
                  onClick={() => navigate(`/tontine/${id}/draw`)}
                  disabled={!isDrawSessionOpen}
                  className={`w-full py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    isDrawSessionOpen 
                      ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' 
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isDrawSessionOpen ? "Participer au Tirage" : "Tirage en attente"}
                </button>
              </div>
            )}
          </div>

          {/* Mon Gain Card */}
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl p-5 text-white shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Gift size={20} className="text-white" />
              </div>
              <Zap size={16} className="text-white/60" />
            </div>
            <p className="text-xs font-medium text-white/80 uppercase tracking-wide mb-1">Mon Gain Prochain</p>
            <p className="text-2xl font-bold">
              {(tontine.amount * (tontine.members?.length || 0)).toLocaleString()} <span className="text-sm font-normal">FCFA</span>
            </p>
            <p className="text-xs text-white/80 mt-2 flex items-center gap-1">
              <Calendar size={12} /> Tirage le {getNextDrawDate()}
            </p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Beneficiaries Section */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                      <Dice5 size={20} className="text-amber-600" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-slate-900">Ordre de passage</h2>
                      <p className="text-xs text-slate-500">Séquence des bénéficiaires</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-amber-50 rounded-full">
                    <span className="text-xs font-medium text-amber-700">Tirage aléatoire</span>
                  </div>
                </div>
              </div>
              
              <div className="divide-y divide-slate-100">
                {tontine.members?.filter((m: any) => m.rotation_position).length === 0 ? (
                  <div className="p-8 text-center space-y-4">
                    <Dice5 size={40} className="mx-auto text-slate-300" />
                    <div>
                      <p className="text-slate-600 font-medium">Le tirage n'a pas encore eu lieu</p>
                      <p className="text-slate-400 text-xs mt-1">L'administrateur doit ouvrir la session de tirage pour définir l'ordre de passage.</p>
                    </div>
                    <button 
                      onClick={() => navigate(`/tontine/${id}/draw`)}
                      className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-amber-500 outline-none"
                    >
                      Aller à la page du tirage
                    </button>
                  </div>
                ) : (
                  tontine.members
                    ?.filter((m: any) => m.rotation_position)
                    .sort((a: any, b: any) => a.rotation_position - b.rotation_position)
                    .map((m: any) => {
                      const isCurrentBeneficiary = m.rotation_position === currentCycle;
                      return (
                        <div 
                          key={m.id} 
                          tabIndex={0}
                          onKeyDown={(e) => handleBeneficiaryKeyDown(e, m.id)}
                          onClick={() => setExpandedMemberId(expandedMemberId === m.id ? null : m.id)}
                          className={`p-4 transition-all cursor-pointer border-l-4 ${
                            isCurrentBeneficiary 
                              ? 'border-indigo-600 bg-indigo-50/50' 
                              : m.id === user?.id 
                                ? 'border-emerald-500 bg-emerald-50/30' 
                                : 'border-transparent hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${
                                isCurrentBeneficiary
                                  ? 'bg-indigo-600 text-white'
                                  : m.id === user?.id 
                                    ? 'bg-emerald-600 text-white' 
                                    : 'bg-slate-100 text-slate-700'
                              }`}>
                                {m.rotation_position}
                              </div>
                              <div>
                                <p className="font-medium text-slate-900 flex items-center gap-2">
                                  {m.name}
                                  {isCurrentBeneficiary && (
                                    <span className="text-[10px] bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">Bénéficiaire Actuel</span>
                                  )}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {m.rotation_position <= completedCycles ? 'Déjà bénéficié' : isCurrentBeneficiary ? 'Bénéficiaire en cours' : 'En attente de tour'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {m.id === user?.id && (
                                <span className="text-xs font-medium px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">Vous</span>
                              )}
                              {expandedMemberId === m.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                            </div>
                          </div>

                          {expandedMemberId === m.id && (
                            <div className="mt-4 pt-3 border-t border-slate-200/60 text-xs text-slate-600 grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-1">
                              <p><span className="font-medium text-slate-500">Téléphone:</span> {m.phone || 'Non renseigné'}</p>
                              <p><span className="font-medium text-slate-500">Adhésion:</span> {new Date(m.joined_at).toLocaleDateString('fr-FR')}</p>
                              <p><span className="font-medium text-slate-500">Rôle:</span> {m.role === 'admin' ? 'Administrateur' : 'Membre'}</p>
                              <p><span className="font-medium text-slate-500">Total Cotisé:</span> {Number(m.total_contribution || 0).toLocaleString()} FCFA</p>
                            </div>
                          )}
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            {/* Tabs Section */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="border-b border-slate-100">
                <div className="flex gap-1 p-1">
                  {[
                    { id: 'cycle', label: 'Cycle', icon: Dice5 },
                    { id: 'members', label: 'Membres', icon: Users },
                    { id: 'history', label: 'Historique', icon: History }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      aria-current={activeTab === tab.id ? 'page' : undefined}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none ${
                        activeTab === tab.id
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <tab.icon size={16} />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-5">
                {activeTab === 'history' ? (
                  <div className="space-y-4">
                    {/* Filters */}
                    <div className="flex flex-wrap gap-2 items-center justify-between pb-3 border-b border-slate-100">
                      <span className="text-xs font-semibold text-slate-500">Filtrer par type :</span>
                      <div className="flex gap-1">
                        {['all', 'contribution', 'payout', 'bank', 'penalty'].map(type => (
                          <button
                            key={type}
                            onClick={() => { setHistoryTypeFilter(type); setHistoryPage(1); }}
                            className={`px-2.5 py-1 text-xs rounded-full font-medium capitalize ${
                              historyTypeFilter === type 
                                ? 'bg-indigo-100 text-indigo-700' 
                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {type === 'all' ? 'Tous' : type === 'contribution' ? 'Cotisations' : type === 'payout' ? 'Gains' : type === 'bank' ? 'Banque' : 'Amendes'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {paginatedTransactions.map((tx: any) => (
                      <div 
                        key={tx.id} 
                        onClick={() => setExpandedTransactionId(expandedTransactionId === tx.id ? null : tx.id)}
                        className="p-3 bg-slate-50 hover:bg-slate-100/70 rounded-lg cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              tx.type === 'payout' ? 'bg-amber-100' : 'bg-emerald-100'
                            }`}>
                              {tx.type === 'payout' ? <Trophy size={16} className="text-amber-600"/> : <CheckCircle size={16} className="text-emerald-600"/>}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {tx.type === 'contribution' ? 'Cotisation' : tx.description || 'Paiement'}
                              </p>
                              <p className="text-xs text-slate-400">
                                {new Date(tx.transaction_date).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className={`font-semibold text-sm ${tx.type === 'payout' ? 'text-amber-600' : 'text-slate-900'}`}>
                              {Number(tx.amount).toLocaleString()} FCFA
                            </p>
                            {expandedTransactionId === tx.id ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                          </div>
                        </div>

                        {expandedTransactionId === tx.id && (
                          <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-600 space-y-1.5 animate-in fade-in slide-in-from-top-1">
                            <p><span className="font-semibold text-slate-500">ID Transaction:</span> {tx.id}</p>
                            <p><span className="font-semibold text-slate-500">Méthode:</span> {tx.method === 'manual' ? 'Manuel (Fondateur)' : 'Paiement Mobile'}</p>
                            <p>
                              <span className="font-semibold text-slate-500">Statut: </span> 
                              <span className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                                tx.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>{tx.status === 'completed' ? 'Validé' : 'En attente'}</span>
                            </p>
                            <p><span className="font-semibold text-slate-500">Description:</span> {tx.description || 'Aucune description fournie'}</p>
                            <div className="pt-2 flex gap-2">
                              <button 
                                onClick={(e) => { e.stopPropagation(); toast.info("Reçu non disponible pour les transactions manuelles."); }}
                                className="px-3 py-1 bg-white border border-slate-200 rounded text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                              >
                                Voir le reçu
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {filteredTransactions.length === 0 && (
                      <div className="py-12 text-center">
                        <Coins size={40} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-slate-400 text-sm">Aucun versement enregistré</p>
                      </div>
                    )}

                    {/* Pagination controls */}
                    {filteredTransactions.length > ITEMS_PER_PAGE && (
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
                        <span className="text-slate-500 font-medium">
                          Affichage de {Math.min(filteredTransactions.length, (historyPage - 1) * ITEMS_PER_PAGE + 1)} à {Math.min(filteredTransactions.length, historyPage * ITEMS_PER_PAGE)} sur {filteredTransactions.length} transactions
                        </span>
                        <div className="flex gap-2">
                          <button
                            disabled={historyPage === 1}
                            onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                            className="px-3 py-1.5 border border-slate-200 rounded-lg font-medium hover:bg-slate-50 disabled:opacity-40 transition-colors"
                          >
                            Précédent
                          </button>
                          <button
                            disabled={historyPage === totalHistoryPages}
                            onClick={() => setHistoryPage(p => Math.min(totalHistoryPages, p + 1))}
                            className="px-3 py-1.5 border border-slate-200 rounded-lg font-medium hover:bg-slate-50 disabled:opacity-40 transition-colors"
                          >
                            Suivant
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : activeTab === 'members' ? (
                  <div className="space-y-4">
                    {/* Search member */}
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <input 
                        type="text"
                        placeholder="Rechercher un membre par nom..."
                        value={memberSearchQuery}
                        onChange={(e) => setMemberSearchQuery(e.target.value)}
                        className="px-4 py-2 border border-slate-200 rounded-lg text-sm w-full sm:max-w-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      <span className="text-xs font-semibold text-slate-500">{filteredMembers.length} membre(s) trouvé(s)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {filteredMembers.map((m: any) => (
                        <div 
                          key={m.id} 
                          onClick={() => setExpandedMemberId(expandedMemberId === m.id ? null : m.id)}
                          className="p-3 bg-slate-50 hover:bg-slate-100/60 rounded-lg transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold">
                              {m.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-900 text-sm truncate">{m.name}</p>
                              <p className="text-xs text-slate-400 capitalize">{m.role === 'admin' ? 'Administrateur' : 'Membre'}</p>
                            </div>
                            {m.id === user?.id && (
                              <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">Vous</span>
                            )}
                            {expandedMemberId === m.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                          </div>

                          {expandedMemberId === m.id && (
                            <div className="mt-3 pt-3 border-t border-slate-200/60 text-xs text-slate-600 space-y-1 animate-in fade-in slide-in-from-top-1">
                              <p><span className="font-semibold text-slate-500">Date d'adhésion:</span> {new Date(m.joined_at).toLocaleDateString('fr-FR')}</p>
                              <p><span className="font-semibold text-slate-500">Téléphone:</span> {m.phone || 'Non renseigné'}</p>
                              <p><span className="font-semibold text-slate-500">Position tirée:</span> {m.rotation_position || 'Aucune position'}</p>
                              <p><span className="font-semibold text-slate-500">Total Cotisé:</span> {Number(m.total_contribution || 0).toLocaleString()} FCFA</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  // Cycle timelines & info
                  <div className="py-6 space-y-6" id="cycle-timeline">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700 mb-2">Suivi du cycle actuel</h3>
                      <p className="text-xs text-slate-500 mb-4">
                        Nous sommes au <strong>Cycle {currentCycle} sur {totalCycles}</strong>. Chaque cycle correspond à un tirage ou un tour de table complet.
                      </p>
                    </div>

                    {/* Timeline visualization */}
                    <div className="relative">
                      <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-200"></div>
                      <div className="space-y-6 relative">
                        {[...Array(totalCycles)].map((_, idx) => {
                          const cycleNum = idx + 1;
                          const isCompleted = cycleNum < currentCycle;
                          const isCurrent = cycleNum === currentCycle;

                          return (
                            <div key={cycleNum} className="flex gap-4 items-start pl-2">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 z-10 text-[9px] font-bold ${
                                isCompleted 
                                  ? 'bg-emerald-600 text-white' 
                                  : isCurrent 
                                    ? 'bg-indigo-600 text-white animate-pulse' 
                                    : 'bg-slate-200 text-slate-600'
                              }`}>
                                {isCompleted ? '✓' : cycleNum}
                              </div>
                              <div className="flex-1">
                                <h4 className={`text-xs font-bold ${isCurrent ? 'text-indigo-600' : 'text-slate-700'}`}>
                                  Cycle {cycleNum} {isCurrent && ' (En cours)'} {isCompleted && ' (Complété)'}
                                </h4>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  {isCompleted 
                                    ? 'Cotisations perçues par le bénéficiaire' 
                                    : isCurrent 
                                      ? 'Cotisations en cours de versement pour le bénéficiaire de ce cycle' 
                                      : 'Cycle à venir'}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar Widgets */}
          <div className="space-y-6">
            {/* Information Card */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Info size={18} className="text-indigo-600" />
                  Informations
                </h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Code d'accès</span>
                  <div className="flex items-center gap-2">
                    <code className="px-2 py-1 bg-slate-100 rounded text-sm font-mono">{tontine.join_code}</code>
                    <button 
                      onClick={()=> { navigator.clipboard.writeText(tontine.join_code); toast.info("Code copié !"); }} 
                      className="p-1 hover:bg-slate-100 rounded transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
                      aria-label="Copier le code d'accès"
                    >
                      <Copy size={14} className="text-slate-400" />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Montant par tour</span>
                  <span className="font-semibold text-slate-900">{Number(tontine.amount || 0).toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Fréquence</span>
                  <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-medium capitalize">{tontine.frequency}</span>
                </div>
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-500">Progression position</span>
                    <span className="font-medium text-slate-900">{Math.round(getProgressPercentage())}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${getProgressPercentage()}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Card */}
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bell size={16} className="text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-amber-800 text-sm">Notification</p>
                  <p className="text-xs text-amber-700 mt-1">
                    {!hasDrawnPosition 
                      ? "Vous n'avez pas encore tiré votre position. Veuillez vous rendre sur la page de tirage." 
                      : memberInfo.rotation_position === currentCycle 
                        ? "C'est votre tour ! Vous êtes le bénéficiaire du cycle actuel 🎉" 
                        : memberInfo.rotation_position === currentCycle + 1 
                          ? "Votre tour approche ! Vous êtes le bénéficiaire du prochain cycle. Assurez-vous d'être à jour." 
                          : `Votre ordre de passage est fixé à la position ${memberInfo.rotation_position}. Continuez vos versements.`
                    }
                  </p>
                  <button 
                    onClick={handleScrollToTimeline}
                    className="mt-3 text-xs font-medium text-amber-700 hover:text-amber-800 flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-amber-500 outline-none"
                  >
                    Suivre ma progression <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <BarChart3 size={18} className="text-indigo-600" />
                Statistiques
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-500">Participation</span>
                    <span className="font-medium text-slate-900">{participationRate}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${participationRate}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-500">Cycles complétés</span>
                    <span className="font-medium text-slate-900">{completedCycles}/{totalCycles}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${totalCycles > 0 ? (completedCycles / totalCycles) * 100 : 0}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Zap size={18} className="text-indigo-600" />
                Actions rapides
              </h3>
              <div className="space-y-2">
                <button 
                  onClick={() => setShowPaymentModal(true)}
                  className="w-full px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
                >
                  <DollarSign size={16} /> Effectuer un versement
                </button>
                <button 
                  onClick={() => setActiveTab('members')}
                  className="w-full px-3 py-2 bg-slate-50 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
                >
                  <Users size={16} /> Voir les membres
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Declaration Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-100 animate-in zoom-in duration-300">
            <div className="bg-indigo-700 px-6 py-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg">Déclarer un versement</h3>
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="text-white hover:text-indigo-200 transition-colors focus-visible:ring-2 focus-visible:ring-white rounded outline-none"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Type d'opération</label>
                <select 
                  value={paymentType}
                  onChange={e => setPaymentType(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg bg-slate-50 border border-slate-200 outline-none font-medium text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="contribution">🤝 Cotisation Tontine</option>
                  <option value="bank">🏦 Épargne Banque</option>
                  <option value="penalty">⚖️ Amende / Retard</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Méthode de paiement</label>
                <select 
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg bg-slate-50 border border-slate-200 outline-none font-medium text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="mobile_money">📱 Mobile Money (Wave, Orange, MTN)</option>
                  <option value="manual">💵 Espèces (Remise physique)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Montant (FCFA)</label>
                <input 
                  required 
                  type="number" 
                  value={paymentAmount} 
                  onChange={e=>setPaymentAmount(e.target.value)} 
                  className="w-full h-11 px-3 rounded-lg bg-slate-50 border border-slate-200 outline-none font-bold text-lg text-slate-900 focus:ring-2 focus:ring-indigo-500" 
                  placeholder={String(tontine.amount)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Description / Note</label>
                <input 
                  value={paymentDescription} 
                  onChange={e=>setPaymentDescription(e.target.value)} 
                  placeholder="Ex: Cotisation de la semaine..." 
                  className="w-full h-11 px-3 rounded-lg bg-slate-50 border border-slate-200 outline-none text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500" 
                />
              </div>
              <button 
                type="submit" 
                disabled={paymentSubmitting}
                className="w-full h-12 bg-indigo-700 text-white font-bold rounded-lg shadow hover:bg-indigo-800 disabled:opacity-50 transition-all text-sm uppercase tracking-wider mt-4 flex items-center justify-center gap-2"
              >
                {paymentSubmitting ? 'Envoi...' : 'Soumettre le versement'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TontineDetails;