import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  CreditCard, Search, PlusCircle, ArrowUpRight, 
  ArrowDownRight, Filter, Calendar, DollarSign,
  User, CheckCircle2, Clock, Trash2, Edit2, Loader2,
  AlertTriangle, Copy, ChevronDown, Info, Download, RefreshCw, X
} from 'lucide-react';
import { transactionService, tontineService } from '@/services/api';
import { toast } from 'react-toastify';

interface ContributionListProps {
  tontines: any[];
}

const TableRowsSkeleton = () => (
  <>
    {[...Array(6)].map((_, i) => (
      <tr key={i} className="animate-pulse">
        <td className="px-6 md:px-8 py-4 md:py-6">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-slate-100 rounded"></div>
            <div className="w-20 h-4 bg-slate-100 rounded"></div>
          </div>
        </td>
        <td className="px-6 md:px-8 py-4 md:py-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100"></div>
            <div className="space-y-1">
              <div className="w-24 h-3.5 bg-slate-100 rounded"></div>
              <div className="w-16 h-2.5 bg-slate-100 rounded"></div>
            </div>
          </div>
        </td>
        <td className="px-6 md:px-8 py-4 md:py-6 text-center">
          <div className="w-16 h-5 bg-slate-100 rounded-full mx-auto"></div>
        </td>
        <td className="px-6 md:px-8 py-4 md:py-6 text-right">
          <div className="w-20 h-4 bg-slate-100 rounded ml-auto"></div>
        </td>
        <td className="px-6 md:px-8 py-4 md:py-6 text-right">
          <div className="w-14 h-8 bg-slate-100 rounded-lg ml-auto"></div>
        </td>
      </tr>
    ))}
  </>
);

const ContributionList = ({ tontines }: ContributionListProps) => {
  const [selectedTontineId, setSelectedTontineId] = useState<string>(tontines[0]?.id || '');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modals & Action indicators
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTxId, setEditingTxId] = useState<string | number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | number | null>(null);
  const [deletingTxId, setDeletingTxId] = useState<string | number | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  // Form Inputs
  const [memberId, setMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [txType, setTxType] = useState<'contribution' | 'bank' | 'payout'>('contribution');
  const [members, setMembers] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Pagination & Filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Auto-refresh states
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [manualRefreshing, setManualRefreshing] = useState(false);
  const [showNewTxIndicator, setShowNewTxIndicator] = useState(false);
  const prevTxCountRef = useRef<number | null>(null);

  // Expanded Row IDs
  const [expandedTxIds, setExpandedTxIds] = useState<Set<string | number>>(new Set());

  // Mobile gesture
  const [pullStartY, setPullStartY] = useState(0);
  const [pulling, setPulling] = useState(false);

  const modalFormRef = useRef<HTMLFormElement>(null);

  const fetchData = useCallback(async (isManual = false) => {
    if (!selectedTontineId) return;
    if (isManual) setManualRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [txRes, memRes] = await Promise.all([
        transactionService.getByTontine(selectedTontineId),
        tontineService.getTontineMembers(selectedTontineId)
      ]);

      const txList = Array.isArray(txRes) ? txRes : (txRes.data || []);
      
      // Determine if there are new transactions loaded compared to previous cache
      if (prevTxCountRef.current !== null && txList.length > prevTxCountRef.current) {
        setShowNewTxIndicator(true);
      }
      prevTxCountRef.current = txList.length;

      setTransactions(txList);
      setMembers(Array.isArray(memRes) ? memRes : (memRes.data || []));
      setLastUpdated(new Date());
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Erreur de chargement';
      setError(errMsg);
      toast.error('Erreur lors de la récupération des transactions');
    } finally {
      setLoading(false);
      setManualRefreshing(false);
    }
  }, [selectedTontineId]);

  useEffect(() => {
    fetchData();
  }, [selectedTontineId, fetchData]);

  // Escape key & auto-refresh interval
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAddModal(false);
        setEditingTxId(null);
        setDeleteConfirmId(null);
        setShowExportModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    const polling = setInterval(() => {
      fetchData();
    }, 45000);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearInterval(polling);
    };
  }, [fetchData]);

  // Prevent scroll when modal is active
  useEffect(() => {
    if (showAddModal || deleteConfirmId || showExportModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showAddModal, deleteConfirmId, showExportModal]);

  // Touch handlers for mobile pull-to-refresh
  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setPullStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (pullStartY === 0) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - pullStartY;
    if (diff > 80 && window.scrollY === 0) {
      setPulling(true);
    }
  };

  const handleTouchEnd = () => {
    if (pulling) {
      fetchData().then(() => {
        setPulling(false);
        setPullStartY(0);
      });
    } else {
      setPullStartY(0);
    }
  };

  // Keyboard trap inside the manual record modal
  const handleModalTab = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    if (!modalFormRef.current) return;

    const focusable = modalFormRef.current.querySelectorAll(
      'input:not([disabled]), select:not([disabled]), button:not([disabled])'
    );
    if (focusable.length === 0) return;

    const first = focusable[0] as HTMLElement;
    const last = focusable[focusable.length - 1] as HTMLElement;

    if (e.shiftKey) {
      if (document.activeElement === first) {
        last.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    }
  };

  // Form Validations
  const selectedTontine = tontines.find(t => String(t.id) === String(selectedTontineId));
  const maxAllowed = selectedTontine ? Number(selectedTontine.amount) : Infinity;
  const numAmount = Number(amount);
  const isAmountValid = amount !== '' && numAmount > 0 && numAmount <= maxAllowed;
  const isMemberValid = memberId !== '';
  const isFormValid = isAmountValid && isMemberValid;

  const amountError = amount !== '' && numAmount <= 0 
    ? "Le montant doit être supérieur à 0." 
    : amount !== '' && numAmount > maxAllowed 
    ? `Le montant ne peut pas dépasser le plafond du cercle (${maxAllowed.toLocaleString()} FCFA).` 
    : null;

  const memberWarning = members.length === 0 ? "Attention : Aucun membre n'est configuré dans ce cercle." : null;

  // Submit payment / Edit payment handler
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    setSubmitting(true);
    
    try {
      if (editingTxId) {
        // Edit flow
        await transactionService.update(editingTxId, {
          userId: parseInt(memberId),
          amount: parseFloat(amount),
          type: txType,
          description: `Paiement manuel (${txType === 'bank' ? 'Banque' : txType === 'payout' ? 'Gain' : 'Tontine'}) mis à jour par Admin`
        });
        toast.success('Paiement mis à jour avec succès !');
      } else {
        // Create flow
        await transactionService.adminRecord({
          tontineId: selectedTontineId,
          userId: parseInt(memberId),
          amount: parseFloat(amount),
          type: txType,
          description: `Paiement manuel (${txType === 'bank' ? 'Banque' : txType === 'payout' ? 'Gain' : 'Tontine'}) enregistré par Admin`
        });
        toast.success('Paiement enregistré !');
      }
      
      setShowAddModal(false);
      setEditingTxId(null);
      setMemberId('');
      setAmount('');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erreur lors de l'opération.");
    } finally {
      setSubmitting(false);
    }
  };

  // Pre-fill fields for editing
  const handleEditClick = (e: React.MouseEvent, tx: any) => {
    e.stopPropagation();
    setEditingTxId(tx.id);
    setMemberId(String(tx.user_id));
    setAmount(String(tx.amount));
    setTxType(tx.type);
    setShowAddModal(true);
  };

  // Triggers deletion
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    const targetId = deleteConfirmId;
    setDeletingTxId(targetId);
    setDeleteConfirmId(null);

    // Optimistic UI updates
    const backupList = [...transactions];
    setTransactions(prev => prev.filter(t => t.id !== targetId));

    try {
      await transactionService.delete(targetId);
      toast.success("Transaction supprimée avec succès !");
      fetchData();
    } catch (err: any) {
      setTransactions(backupList); // revert cache
      toast.error(err.response?.data?.message || "Erreur lors de la suppression.");
    } finally {
      setDeletingTxId(null);
    }
  };

  // Expanding rows toggle
  const toggleRowExpanded = (txId: string | number) => {
    const next = new Set(expandedTxIds);
    if (next.has(txId)) next.delete(txId);
    else next.add(txId);
    setExpandedTxIds(next);
  };

  // Copy transaction ID to clipboard
  const handleCopyId = (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation();
    navigator.clipboard.writeText(String(id));
    toast.info("ID de transaction copié dans le presse-papiers !");
  };

  // Grouped filters
  const getFilteredTransactions = () => {
    return transactions.filter(tx => {
      // Search
      const matchesSearch = !searchQuery || 
        (tx.user_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.description || '').toLowerCase().includes(searchQuery.toLowerCase());

      // Type
      const matchesType = typeFilter === 'all' || tx.type === typeFilter;

      // Date Range
      const txDate = new Date(tx.created_at || tx.transaction_date);
      let matchesStartDate = true;
      let matchesEndDate = true;
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0,0,0,0);
        if (txDate < start) matchesStartDate = false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23,59,59,999);
        if (txDate > end) matchesEndDate = false;
      }

      // Min/Max Amounts
      const amtVal = Number(tx.amount || 0);
      const matchesMin = !minAmount || amtVal >= Number(minAmount);
      const matchesMax = !maxAmount || amtVal <= Number(maxAmount);

      return matchesSearch && matchesType && matchesStartDate && matchesEndDate && matchesMin && matchesMax;
    });
  };

  const filtered = getFilteredTransactions();
  const totalFiltered = filtered.length;
  const totalPages = Math.ceil(totalFiltered / itemsPerPage) || 1;
  const currentTransactions = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const showingFrom = totalFiltered > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const showingTo = Math.min(currentPage * itemsPerPage, totalFiltered);

  // Summary Metrics calculations
  const totalCotise = transactions.reduce((acc, tx) => acc + (tx.type === 'contribution' ? (Number(tx.amount) || 0) : 0), 0);
  const totalPayout = transactions.reduce((acc, tx) => acc + (tx.type === 'payout' ? (Number(tx.amount) || 0) : 0), 0);
  const totalBank = transactions.reduce((acc, tx) => acc + (tx.type === 'bank' ? (Number(tx.amount) || 0) : 0), 0);
  const soldeNet = totalCotise - totalPayout;

  // Percentage Trend calculations
  const getContributionTrend = () => {
    const now = new Date().getTime();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;

    const currentPeriod = transactions.filter(t => t.type === 'contribution' && new Date(t.created_at).getTime() >= thirtyDaysAgo);
    const previousPeriod = transactions.filter(t => t.type === 'contribution' && new Date(t.created_at).getTime() >= sixtyDaysAgo && new Date(t.created_at).getTime() < thirtyDaysAgo);

    const currentSum = currentPeriod.reduce((acc, t) => acc + Number(t.amount || 0), 0);
    const previousSum = previousPeriod.reduce((acc, t) => acc + Number(t.amount || 0), 0);

    if (previousSum === 0) return currentSum > 0 ? 100 : 0;
    return Math.round(((currentSum - previousSum) / previousSum) * 100);
  };

  const trendPercentage = getContributionTrend();

  // Exporters
  const handleExportCSV = () => {
    if (filtered.length === 0) {
      toast.info("Aucune donnée à exporter.");
      return;
    }
    const headers = ["ID", "Date", "Membre", "Type", "Montant (FCFA)", "Description"];
    const rows = filtered.map(tx => [
      tx.id,
      new Date(tx.created_at).toLocaleDateString('fr-FR'),
      tx.user_name || 'N/A',
      tx.type,
      tx.amount,
      tx.description || ''
    ]);
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Export_Transactions_${selectedTontine?.name || 'Tontine'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportModal(false);
    toast.success("Transactions exportées en CSV !");
  };

  const handleExportPDF = () => {
    if (filtered.length === 0) {
      toast.info("Aucune donnée à exporter.");
      return;
    }
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const rowsHTML = filtered.map(tx => `
      <tr>
        <td>${new Date(tx.created_at).toLocaleDateString('fr-FR')}</td>
        <td>${tx.user_name || 'N/A'}</td>
        <td>${tx.type === 'contribution' ? 'Cotisation' : tx.type === 'bank' ? 'Banque' : 'Gain'}</td>
        <td>${Number(tx.amount).toLocaleString()} FCFA</td>
        <td>${tx.description || ''}</td>
      </tr>
    `).join('');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Rapport de Transactions - ${selectedTontine?.name || 'Tontine'}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 30px; color: #1e293b; }
            table { width: 100%; border-collapse: collapse; margin-top: 25px; }
            th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; font-size: 13px; }
            th { background-color: #f8fafc; font-weight: bold; }
            h1 { text-align: center; font-size: 20px; font-weight: 800; margin-bottom: 5px; }
            .meta { text-align: center; font-size: 12px; color: #64748b; margin-bottom: 25px; }
          </style>
        </head>
        <body>
          <h1>Rapport de Transactions</h1>
          <div class="meta">Cercle : ${selectedTontine?.name || 'N/A'} | Généré le ${new Date().toLocaleString('fr-FR')}</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Membre</th>
                <th>Type</th>
                <th>Montant</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHTML}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    setShowExportModal(false);
    toast.success("PDF de transactions généré !");
  };

  // Global Empty State: No tontines configured
  if (tontines.length === 0) {
    return (
      <div className="bg-white rounded-[32px] md:rounded-[48px] border border-slate-100 p-16 text-center max-w-xl mx-auto shadow-sm">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
          <CreditCard size={32} />
        </div>
        <h3 className="text-xl font-black text-slate-900 mb-2">Aucun cercle de tontine</h3>
        <p className="text-sm text-slate-500">
          Vous devez créer un cercle de tontine pour pouvoir afficher et gérer le journal des paiements.
        </p>
      </div>
    );
  }

  return (
    <div 
      className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      
      {/* Mobile pull-to-refresh spinner */}
      {pulling && (
        <div className="flex items-center justify-center gap-2 py-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs font-semibold mb-6 animate-pulse w-fit mx-auto px-6">
          <RefreshCw size={14} className="animate-spin" />
          <span>Relâchez pour actualiser...</span>
        </div>
      )}

      {/* Floating indicator for new transactions */}
      {showNewTxIndicator && (
        <div className="bg-blue-600 text-white rounded-xl py-2.5 px-5 shadow-lg w-fit mx-auto flex items-center gap-3 cursor-pointer hover:bg-blue-700 transition-colors z-20 animate-bounce" onClick={() => { setShowNewTxIndicator(false); fetchData(); }}>
          <Clock size={16} />
          <span className="text-xs font-black uppercase tracking-wider">Nouvelles transactions disponibles ! Actualiser</span>
        </div>
      )}

      {/* Inline Fetching Error banner */}
      {error && (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-rose-600 flex-shrink-0" size={24} />
            <div>
              <h4 className="font-bold text-rose-900 text-sm">Erreur de chargement</h4>
              <p className="text-xs text-rose-600 font-medium">{error}</p>
            </div>
          </div>
          <button 
            onClick={() => fetchData()}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all self-start sm:self-center"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Header & Main Actions */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-emerald-100 rounded-[20px] md:rounded-[24px] flex items-center justify-center text-emerald-600">
            <CreditCard className="w-6 h-6 md:w-7 md:h-7" />
          </div>
          <div>
            <h2 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight italic leading-tight">Journal des Paiements</h2>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-slate-500 font-medium text-[10px] md:text-sm">Tracez chaque franc collecté avec précision</p>
              <span className="text-[9px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-medium hidden sm:inline">
                Mise à jour: {lastUpdated.toLocaleTimeString('fr-FR')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button 
            onClick={() => fetchData(true)}
            aria-label="Actualiser les paiements"
            className="p-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center shadow-sm"
          >
            <RefreshCw size={18} className={manualRefreshing ? "animate-spin text-emerald-600" : ""} />
          </button>

          <select 
            value={selectedTontineId}
            aria-label="Cercle de tontine"
            onChange={(e) => { setSelectedTontineId(e.target.value); setCurrentPage(1); }}
            className="h-12 md:h-14 px-4 md:px-6 bg-white border border-slate-200 rounded-xl md:rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all text-xs md:text-sm shadow-sm"
          >
            <option value="">Sélectionner un cercle...</option>
            {tontines.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          
          <button 
            onClick={() => { setEditingTxId(null); setMemberId(''); setAmount(''); setShowAddModal(true); }}
            className="flex items-center justify-center gap-3 h-12 md:h-14 px-6 md:px-8 bg-blue-600 text-white rounded-xl md:rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
          >
            <PlusCircle className="w-4 h-4 md:w-5 md:h-5" /> Versement manuel
          </button>
        </div>
      </div>

      {/* Selected Tontine prompt */}
      {!selectedTontineId ? (
        <div className="bg-white rounded-[32px] border border-slate-100 p-16 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
            <Info size={32} />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">Aucun cercle sélectionné</h3>
          <p className="text-sm text-slate-500">
            Veuillez sélectionner un cercle de tontine dans la liste ci-dessus pour afficher l'historique des flux financiers.
          </p>
        </div>
      ) : (
        <>
          {/* Quick Summary Cards - Stacked on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            
            {/* Card 1: Total cotisé */}
            <div className="bg-white p-6 rounded-[24px] md:rounded-[32px] border border-slate-100 flex items-center justify-between shadow-sm">
               <div className="flex items-center gap-4">
                 <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-50 text-emerald-600 rounded-xl md:rounded-2xl flex items-center justify-center">
                    <ArrowUpRight className="w-4.5 h-4.5 md:w-5 md:h-5" />
                 </div>
                 <div>
                    <p className="text-[9px] md:text-[10px] font-black uppercase text-slate-400">Total Cotisé</p>
                    <p className="text-lg md:text-xl font-black text-slate-900">{totalCotise.toLocaleString()} <small className="text-[8px] opacity-40">FCFA</small></p>
                 </div>
               </div>
               {trendPercentage !== 0 && (
                 <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${trendPercentage > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                   {trendPercentage > 0 ? '+' : ''}{trendPercentage}%
                 </span>
               )}
            </div>

            {/* Card 2: Sorties (Gains) */}
            <div className="bg-white p-6 rounded-[24px] md:rounded-[32px] border border-slate-100 flex items-center gap-4 shadow-sm">
               <div className="w-10 h-10 md:w-12 md:h-12 bg-rose-50 text-rose-600 rounded-xl md:rounded-2xl flex items-center justify-center">
                  <ArrowDownRight className="w-4.5 h-4.5 md:w-5 md:h-5" />
               </div>
               <div>
                  <p className="text-[9px] md:text-[10px] font-black uppercase text-slate-400">Sorties (Gains)</p>
                  <p className="text-lg md:text-xl font-black text-slate-900">{totalPayout.toLocaleString()} <small className="text-[8px] opacity-40">FCFA</small></p>
               </div>
            </div>

            {/* Card 3: Dépôts Banque */}
            <div className="bg-white p-6 rounded-[24px] md:rounded-[32px] border border-slate-100 flex items-center gap-4 shadow-sm">
               <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 text-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center">
                  <ArrowUpRight className="w-4.5 h-4.5 md:w-5 md:h-5 text-blue-500" />
               </div>
               <div>
                  <p className="text-[9px] md:text-[10px] font-black uppercase text-slate-400">Dépôts Banque</p>
                  <p className="text-lg md:text-xl font-black text-slate-900">{totalBank.toLocaleString()} <small className="text-[8px] opacity-40">FCFA</small></p>
               </div>
            </div>

            {/* Card 4: Solde Net */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-[24px] md:rounded-[32px] text-white flex items-center gap-4 shadow-lg shadow-emerald-500/10">
               <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 text-white rounded-xl md:rounded-2xl flex items-center justify-center">
                  <DollarSign className="w-4.5 h-4.5 md:w-5 md:h-5" />
               </div>
               <div>
                  <p className="text-[9px] md:text-[10px] font-black uppercase text-white/70">Solde Net</p>
                  <p className="text-lg md:text-xl font-black">{soldeNet.toLocaleString()} <small className="text-[8px] text-white/50">FCFA</small></p>
               </div>
            </div>

          </div>

          {/* Transaction Card Panel */}
          <div className="bg-white rounded-[32px] md:rounded-[48px] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
            {/* Toolbar Header */}
            <div className="p-6 md:p-8 border-b border-slate-50 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                   <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">Historique des Flux</h3>
                   <span className="bg-slate-100 text-slate-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{filtered.length} Lignes</span>
                </div>
                <div className="flex items-center gap-2">
                   <button 
                     onClick={() => setShowExportModal(true)}
                     aria-label="Exporter les transactions"
                     className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2 shadow-sm"
                   >
                     <Download size={14} /> Exporter
                   </button>
                   
                   <button 
                     onClick={() => setShowFilterPanel(!showFilterPanel)}
                     aria-label="Basculer le panneau de filtre"
                     className={`p-2 rounded-lg border transition-colors ${showFilterPanel ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-slate-900'}`}
                   >
                      <Filter className="w-4.5 h-4.5 md:w-5 md:h-5" />
                   </button>
                </div>
            </div>

            {/* Filter panel (Full screen modal layout on mobile screens) */}
            {showFilterPanel && (
              <div className={`p-6 border-b border-slate-50 bg-slate-50/50 space-y-4 animate-in slide-in-from-top duration-200 ${
                showFilterPanel ? 'fixed inset-0 z-50 bg-white p-6 overflow-y-auto sm:relative sm:inset-auto sm:z-0 sm:bg-slate-50/50 sm:p-6' : 'hidden'
              }`}>
                {/* Mobile Filter Header */}
                <div className="flex sm:hidden items-center justify-between mb-6 pb-4 border-b">
                  <h4 className="font-black text-slate-900 text-lg uppercase tracking-wider">Filtres de recherche</h4>
                  <button 
                    onClick={() => setShowFilterPanel(false)}
                    className="p-2 text-slate-400 hover:text-slate-900"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Search query input */}
                  <div>
                    <label id="filter-search-label" className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Recherche</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input 
                        type="text"
                        aria-labelledby="filter-search-label"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        placeholder="Membre ou description..."
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-emerald-500 font-bold"
                      />
                    </div>
                  </div>

                  {/* Type Filter */}
                  <div>
                    <label id="filter-type-label" className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Type de Flux</label>
                    <select 
                      value={typeFilter}
                      aria-labelledby="filter-type-label"
                      onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-emerald-500 font-bold"
                    >
                      <option value="all">Tous les types</option>
                      <option value="contribution">Cotisation</option>
                      <option value="payout">Gains (Sorties)</option>
                      <option value="bank">Dépôts Banque</option>
                    </select>
                  </div>

                  {/* Amount filters */}
                  <div>
                    <label id="filter-min-label" className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Montant Min</label>
                    <input 
                      type="number"
                      aria-labelledby="filter-min-label"
                      value={minAmount}
                      onChange={(e) => { setMinAmount(e.target.value); setCurrentPage(1); }}
                      placeholder="Min FCFA"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-emerald-500 font-bold"
                    />
                  </div>

                  <div>
                    <label id="filter-max-label" className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Montant Max</label>
                    <input 
                      type="number"
                      aria-labelledby="filter-max-label"
                      value={maxAmount}
                      onChange={(e) => { setMaxAmount(e.target.value); setCurrentPage(1); }}
                      placeholder="Max FCFA"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-emerald-500 font-bold"
                    />
                  </div>
                </div>

                {/* Date Ranges */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Période du :</span>
                    <input 
                      type="date"
                      aria-label="Période début"
                      value={startDate}
                      onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                      className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-emerald-500 font-bold"
                    />
                    <span className="text-xs text-slate-400 font-medium">au</span>
                    <input 
                      type="date"
                      aria-label="Période fin"
                      value={endDate}
                      onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                      className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-emerald-500 font-bold"
                    />
                  </div>

                  <div className="flex gap-4 items-center">
                    {(searchQuery || typeFilter !== 'all' || minAmount || maxAmount || startDate || endDate) && (
                      <button 
                        onClick={() => {
                          setSearchQuery('');
                          setTypeFilter('all');
                          setMinAmount('');
                          setMaxAmount('');
                          setStartDate('');
                          setEndDate('');
                          setCurrentPage(1);
                        }}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 underline"
                      >
                        Réinitialiser les filtres
                      </button>
                    )}
                    
                    <button 
                      onClick={() => setShowFilterPanel(false)}
                      className="sm:hidden px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider"
                    >
                      Appliquer
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto scrollbar-hide">
              <table className="w-full text-left min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 md:px-8 py-4 md:py-5 text-[10px] font-black uppercase text-slate-400">Date</th>
                    <th className="px-6 md:px-8 py-4 md:py-5 text-[10px] font-black uppercase text-slate-400">Membre / Destination</th>
                    <th className="px-6 md:px-8 py-4 md:py-5 text-[10px] font-black uppercase text-slate-400 text-center">Type</th>
                    <th className="px-6 md:px-8 py-4 md:py-5 text-[10px] font-black uppercase text-slate-400 text-right">Montant</th>
                    <th className="px-6 md:px-8 py-4 md:py-5 text-[10px] font-black uppercase text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <TableRowsSkeleton />
                  ) : currentTransactions.length > 0 ? (
                    currentTransactions.map((tx) => {
                      const isExpanded = expandedTxIds.has(tx.id);
                      const isDeleting = deletingTxId === tx.id;
                      return (
                        <React.Fragment key={tx.id}>
                          <tr 
                            onClick={() => toggleRowExpanded(tx.id)}
                            className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                          >
                            <td className="px-6 md:px-8 py-4 md:py-6">
                              <div className="flex items-center gap-3 text-slate-500 font-bold text-xs">
                                 <Calendar className="w-3 h-3 md:w-3.5 md:h-3.5 text-slate-300" /> 
                                 {new Date(tx.created_at || tx.transaction_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </div>
                            </td>
                            <td className="px-6 md:px-8 py-4 md:py-6">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0">
                                    <User className="w-4 h-4 md:w-4.5 md:h-4.5" />
                                 </div>
                                 <div className="min-w-0">
                                    <p className="font-black text-slate-900 text-sm md:text-base truncate max-w-[120px] md:max-w-[200px]" title={tx.user_name}>
                                      {tx.user_name || 'Membre Tontine'}
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-400 truncate w-24 md:w-40">{tx.description || 'Paiement standard'}</p>
                                 </div>
                              </div>
                            </td>
                            <td className="px-6 md:px-8 py-4 md:py-6">
                              <div className="flex justify-center">
                                 <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest px-2 md:px-3 py-1 rounded-full ${
                                   tx.type === 'contribution' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                                   tx.type === 'bank' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 
                                   'bg-rose-50 text-rose-600 border border-rose-100'
                                 }`}>
                                    {tx.type}
                                 </span>
                              </div>
                            </td>
                            <td className={`px-6 md:px-8 py-4 md:py-6 text-right font-black text-base md:text-lg ${
                              tx.type === 'contribution' ? 'text-emerald-700' : 
                              tx.type === 'bank' ? 'text-blue-700' : 'text-rose-700'
                            }`}>
                              {tx.type === 'contribution' || tx.type === 'bank' ? '+' : '-'} {Number(tx.amount).toLocaleString()} <small className="text-[8px] md:text-[10px] font-normal opacity-50">FCFA</small>
                            </td>
                            <td className="px-6 md:px-8 py-4 md:py-6 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex gap-2 justify-end opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={(e) => handleEditClick(e, tx)}
                                  aria-label="Modifier la transaction"
                                  className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center"
                                >
                                   <Edit2 className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                </button>
                                <button 
                                  onClick={() => setDeleteConfirmId(tx.id)}
                                  disabled={isDeleting}
                                  aria-label="Supprimer la transaction"
                                  className="w-8 h-8 rounded-lg bg-slate-50 text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center"
                                >
                                   {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 className="w-3 h-3 md:w-3.5 md:h-3.5" />}
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Details Row */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={5} className="px-8 py-4 bg-slate-50/70 border-b border-slate-100">
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                  <div>
                                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">ID Transaction</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <code className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[10px] text-slate-600 font-mono select-all">{tx.id}</code>
                                      <button 
                                        onClick={(e) => handleCopyId(e, tx.id)}
                                        className="text-slate-400 hover:text-slate-600"
                                        title="Copier l'ID"
                                      >
                                        <Copy size={12} />
                                      </button>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Date & Heure exacte</p>
                                    <p className="font-bold text-slate-700 mt-1">
                                      {new Date(tx.created_at || tx.transaction_date).toLocaleString('fr-FR')}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Description complète</p>
                                    <p className="font-bold text-slate-700 mt-1">
                                      {tx.description || '—'}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Statut</p>
                                    <div className="flex items-center gap-1.5 mt-1 text-emerald-600 font-bold">
                                      <CheckCircle2 size={12} />
                                      <span>Validé</span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-24 text-center">
                        <Info className="mx-auto text-slate-300 mb-2" size={32} />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Aucun résultat pour ces filtres</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout (Visible only on mobile screen) */}
            <div className="block md:hidden divide-y divide-slate-100">
              {loading ? (
                <div className="p-6 space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-slate-50 p-4 rounded-xl space-y-3">
                      <div className="h-4 bg-slate-200 rounded w-20"></div>
                      <div className="h-4 bg-slate-200 rounded w-40"></div>
                      <div className="h-4 bg-slate-200 rounded w-16"></div>
                    </div>
                  ))}
                </div>
              ) : currentTransactions.length > 0 ? (
                currentTransactions.map((tx) => {
                  const isExpanded = expandedTxIds.has(tx.id);
                  const isDeleting = deletingTxId === tx.id;
                  return (
                    <div 
                      key={tx.id} 
                      onClick={() => toggleRowExpanded(tx.id)}
                      className="p-5 hover:bg-slate-50/50 cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-xs text-slate-400 font-semibold">
                            {new Date(tx.created_at || tx.transaction_date).toLocaleDateString('fr-FR')}
                          </p>
                          <h4 className="font-black text-slate-900 text-sm truncate max-w-[150px]">
                            {tx.user_name || 'Membre Tontine'}
                          </h4>
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          tx.type === 'contribution' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                          tx.type === 'bank' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 
                          'bg-rose-50 text-rose-600 border border-rose-100'
                        }`}>
                          {tx.type}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-3">
                        <p className={`font-black text-sm ${
                          tx.type === 'contribution' || tx.type === 'bank' ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {tx.type === 'contribution' || tx.type === 'bank' ? '+' : '-'} {Number(tx.amount).toLocaleString()} FCFA
                        </p>
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={(e) => handleEditClick(e, tx)}
                            className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 flex items-center justify-center"
                          >
                             <Edit2 size={12} />
                          </button>
                          <button 
                            onClick={() => setDeleteConfirmId(tx.id)}
                            disabled={isDeleting}
                            className="w-8 h-8 rounded-lg bg-slate-50 text-slate-300 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center"
                          >
                             {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                          </button>
                        </div>
                      </div>

                      {/* Card Details Expansion */}
                      {isExpanded && (
                        <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600 bg-slate-50/50 p-3 rounded-lg">
                          <p><strong>Description:</strong> {tx.description || '—'}</p>
                          <p className="flex items-center gap-1.5">
                            <strong>ID:</strong> <code className="bg-white border px-1.5 py-0.25 rounded font-mono text-[10px]">{tx.id}</code>
                            <button onClick={(e) => handleCopyId(e, tx.id)} className="text-slate-400 hover:text-slate-600"><Copy size={10} /></button>
                          </p>
                          <p><strong>Heure exacte:</strong> {new Date(tx.created_at || tx.transaction_date).toLocaleTimeString('fr-FR')}</p>
                          <p className="flex items-center gap-1 text-emerald-600 font-bold">
                            <CheckCircle2 size={10} /> Validé
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-16 text-center">
                  <Info className="mx-auto text-slate-300 mb-2" size={32} />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Aucun résultat pour ces filtres</p>
                </div>
              )}
            </div>

            {/* Pagination controls footer */}
            <div className="p-6 bg-slate-50/30 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase text-slate-500">
                  Affichage de {showingFrom} à {showingTo} sur {totalFiltered} transactions
                </span>
                
                {/* Items per page selector */}
                <select 
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  aria-label="Lignes par page"
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 outline-none"
                >
                  <option value={15}>15 lignes</option>
                  <option value={30}>30 lignes</option>
                  <option value={50}>50 lignes</option>
                </select>
              </div>

              {totalPages > 1 && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                  >
                    Précédent
                  </button>
                  <span className="text-xs font-semibold self-center px-1 text-slate-600">
                    {currentPage} / {totalPages}
                  </span>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                  >
                    Suivant
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Manual Payment Modal */}
      {showAddModal && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => { setShowAddModal(false); setEditingTxId(null); }}
        >
           <div 
             className="bg-white w-full max-w-md rounded-[52px] shadow-2xl p-12 border border-blue-100 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto"
             onClick={(e) => e.stopPropagation()}
           >
              <div className="w-20 h-20 bg-blue-50 rounded-[32px] flex items-center justify-center text-blue-600 mx-auto mb-8">
                 <DollarSign size={40} />
              </div>
              <h3 className="text-3xl font-black text-center text-slate-900 mb-2">
                {editingTxId ? 'Modifier paiement' : 'Encaisser & Valider'}
              </h3>
              <p className="text-center text-slate-500 font-medium mb-10">Enregistrez ou modifiez un versement financier.</p>
              
              <form 
                ref={modalFormRef}
                onKeyDown={handleModalTab}
                onSubmit={handleRecordPayment} 
                className="space-y-6"
              >
                 <div className="flex gap-4 p-1 bg-slate-50 rounded-2xl mb-8">
                     <button 
                       type="button"
                       onClick={() => setTxType('contribution')}
                       className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${txType === 'contribution' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
                     >
                        Cotisation Tontine
                     </button>
                     <button 
                       type="button"
                       onClick={() => setTxType('bank')}
                       className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${txType === 'bank' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400'}`}
                     >
                        Épargne Banque
                     </button>
                  </div>

                 {/* Member select dropdown warning */}
                 {memberWarning && (
                   <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-[10px] text-amber-700 italic">
                     {memberWarning}
                   </div>
                 )}

                 <div className="space-y-2">
                    <label id="member-select-label" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Sélectionner le Membre</label>
                    <select 
                      value={memberId}
                      aria-labelledby="member-select-label"
                      onChange={e => setMemberId(e.target.value)}
                      required
                      className={`w-full h-16 bg-slate-50 border-2 outline-none rounded-2xl px-6 font-bold text-slate-800 transition-all ${
                        memberId ? 'border-emerald-500 bg-white' : 'border-transparent focus:border-blue-500'
                      }`}
                    >
                       <option value="">-- Choisir un membre --</option>
                       {members.map(m => (
                         <option key={m.id} value={m.id}>
                           {m.name && m.name.length > 25 ? `${m.name.slice(0, 22)}...` : m.name} ({m.phone})
                         </option>
                       ))}
                    </select>
                 </div>
                 
                 <div className="space-y-2">
                    <label id="amount-input-label" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Montant perçu (FCFA)</label>
                    <input 
                      type="number" 
                      aria-labelledby="amount-input-label"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      required
                      placeholder="Ex: 5000"
                      className={`w-full h-16 bg-slate-50 border-2 outline-none rounded-2xl px-6 font-black text-xl transition-all ${
                        isAmountValid ? 'border-emerald-500 bg-white' : amount ? 'border-rose-500 bg-white' : 'border-transparent focus:border-blue-500'
                      } ${txType === 'bank' ? 'text-emerald-600' : 'text-blue-600'}`}
                    />
                    {amountError && (
                      <p className="text-rose-500 text-[10px] font-bold ml-2 mt-1">{amountError}</p>
                    )}
                 </div>

                 <div className="flex gap-4 pt-6">
                    <button 
                      type="button" 
                      onClick={() => { setShowAddModal(false); setEditingTxId(null); }} 
                      className="flex-1 h-14 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                      Annuler
                    </button>
                    <button 
                      type="submit" 
                      disabled={submitting || !isFormValid} 
                      className="flex-[2] h-14 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-all disabled:opacity-50"
                    >
                       {submitting ? 'Validation...' : editingTxId ? 'Mettre à jour' : 'Confirmer'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId !== null && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setDeleteConfirmId(null)}
        >
          <div 
            className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl p-8 border border-rose-100 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mx-auto mb-5">
              <AlertTriangle size={28} />
            </div>
            <h3 className="text-xl font-black text-center text-slate-900 mb-2">Confirmer la suppression</h3>
            <p className="text-center text-slate-500 text-xs font-medium mb-6">
              Êtes-vous sûr de vouloir supprimer cette transaction ? Cette action annulera le versement et impactera le solde.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={handleDeleteConfirm}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
              >
                Supprimer
              </button>
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXPORT OPTIONS MODAL */}
      {showExportModal && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setShowExportModal(false)}
        >
          <div 
            className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl p-8 border border-slate-100 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-black text-slate-900 mb-4 uppercase tracking-wider text-center">Format d'exportation</h3>
            <p className="text-xs text-slate-500 text-center mb-6">Sélectionnez le format dans lequel vous souhaitez exporter les transactions filtrées.</p>
            <div className="space-y-3">
              <button 
                onClick={handleExportCSV}
                className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
              >
                Exporter au format CSV (.csv)
              </button>
              <button 
                onClick={handleExportPDF}
                className="w-full py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
              >
                Générer un Rapport PDF (.pdf)
              </button>
              <button 
                onClick={() => setShowExportModal(false)}
                className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-200 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ContributionList;
