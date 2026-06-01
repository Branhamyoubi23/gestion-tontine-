import React, { useState, useEffect, useRef } from 'react';
import Navigation from '@/components/shared/Navigation';
import {
  History, Download, Filter, Search, ArrowUpRight, ArrowDownLeft,
  CheckCircle, Clock, XCircle, FileText, Users, ShieldCheck, Eye,
  ChevronDown, ChevronUp, RefreshCw, X, Copy, Check, FileSpreadsheet, Plus, HelpCircle,
  AlertTriangle
} from 'lucide-react';
import { transactionService, tontineService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';

interface Transaction {
  id: string;
  type: 'contribution' | 'payout';
  description: string;
  amount: number;
  transaction_date: string;
  status: 'completed' | 'pending' | 'failed';
  tontine_name: string;
  user_name: string;
  method: string;
  user_id: string;
  created_at?: string;
}

interface Tontine {
  id: string;
  name: string;
  current_members?: number;
  max_members?: number;
  emoji?: string;
}

const TransactionHistory = () => {
  const { user } = useAuth();
  
  // Tontines & selected tontine states
  const [tontines, setTontines] = useState<Tontine[]>([]);
  const [selectedTontineId, setSelectedTontineId] = useState<string>('');
  const [loadingTontines, setLoadingTontines] = useState(true);
  const [tontinesError, setTontinesError] = useState(false);

  // Transactions list states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

  // Filters & Search
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [memberFilter, setMemberFilter] = useState('all');

  // Sorting
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  // Auto-refresh states
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Detail Modal & Receipt modal
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Load tontines
  const fetchTontines = async () => {
    setLoadingTontines(true);
    setTontinesError(false);
    try {
      const res = await tontineService.getUserTontines();
      const list: Tontine[] = res.data || [];
      setTontines(list);
      if (list.length > 0) {
        setSelectedTontineId(String(list[0].id));
      }
    } catch (err) {
      setTontinesError(true);
      toast.error('Impossible de charger vos groupes');
    } finally {
      setLoadingTontines(false);
    }
  };

  useEffect(() => {
    fetchTontines();
  }, []);

  // Fetch transactions list
  const fetchTransactions = async (isSilent = false) => {
    if (!selectedTontineId) return;
    if (!isSilent) {
      setLoading(true);
      setTransactions([]);
    }
    setTxError(null);
    try {
      const res = await transactionService.getByTontineScoped(selectedTontineId);
      // Handle the case where the API returns res.isAdmin incorrectly
      const isUserAdmin = res && typeof res.isAdmin === 'boolean' ? res.isAdmin : false;
      setIsAdmin(isUserAdmin);
      // Handle the case where res.data might not be an array
      const data = res && Array.isArray(res.data) ? res.data : [];
      setTransactions(data);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 404) {
        setTxError("Le groupe sélectionné n'existe plus ou a été supprimé.");
      } else {
        setTxError("Erreur lors du chargement des transactions. Veuillez réessayer.");
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    // Reset filters
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setMemberFilter('all');
    setCurrentPage(1);
  }, [selectedTontineId]);

  // Auto-refresh interval
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTransactions(true);
    }, 45000);
    return () => clearInterval(interval);
  }, [selectedTontineId]);

  const selectedTontine = tontines.find(t => String(t.id) === String(selectedTontineId)) || tontines[0] || null;

  // Filter members list for admin filter dropdown
  const getUniqueMembers = () => {
    const names = new Set<string>();
    transactions.forEach(t => {
      if (t.user_name) names.add(t.user_name);
    });
    return Array.from(names);
  };
  const membersList = getUniqueMembers();

  // Filters logic
  const filteredTransactions = transactions.filter(t => {
    // Type filter
    const matchesType = filter === 'all' || t.type === filter;
    
    // Search Term
    const text = `${t.description || ''} ${t.user_name || ''} ${t.tontine_name || ''}`.toLowerCase();
    const matchesSearch = !searchTerm || text.includes(searchTerm.toLowerCase());

    // Date range filter
    let matchesDate = true;
    const txDate = new Date(t.transaction_date);
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (txDate < start) matchesDate = false;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (txDate > end) matchesDate = false;
    }

    // Member filter (admin specific)
    const matchesMember = memberFilter === 'all' || t.user_name === memberFilter;

    return matchesType && matchesSearch && matchesDate && matchesMember;
  });

  // Sorting
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (sortField === 'date') {
      const timeA = new Date(a.transaction_date).getTime();
      const timeB = new Date(b.transaction_date).getTime();
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    } else {
      const amtA = Number(a.amount) || 0;
      const amtB = Number(b.amount) || 0;
      return sortOrder === 'asc' ? amtA - amtB : amtB - amtA;
    }
  });

  // Pagination calculations
  const totalItems = sortedTransactions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedTransactions = sortedTransactions.slice(startIndex, endIndex);

  // KPI calculations with date ranges and null checks
  const totalIn = filteredTransactions
    .filter(t => t.type === 'payout' && t.status === 'completed')
    .reduce((s, t) => s + (Number(t.amount) || 0), 0);

  const totalOut = filteredTransactions
    .filter(t => t.type === 'contribution' && t.status === 'completed')
    .reduce((s, t) => s + (Number(t.amount) || 0), 0);

  // Pending count & total amount pending
  const pendingTxs = filteredTransactions.filter(t => t.status === 'pending');
  const pendingCount = pendingTxs.length;
  const pendingAmount = pendingTxs.reduce((s, t) => s + (Number(t.amount) || 0), 0);

  const getStatusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle className="h-4 w-4 text-emerald-600" />;
    if (status === 'pending') return <Clock className="h-4 w-4 text-amber-500" />;
    return <XCircle className="h-4 w-4 text-rose-500" />;
  };

  const getStatusText = (status: string) => {
    if (status === 'completed') return 'Validé';
    if (status === 'pending') return 'En attente';
    return 'Rejeté';
  };

  const getStatusBg = (status: string) => {
    if (status === 'completed') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (status === 'pending') return 'bg-amber-50 text-amber-700 border-amber-100';
    return 'bg-rose-50 text-rose-700 border-rose-100';
  };

  const getMethodLabel = (method: string) => {
    const map: Record<string, string> = {
      mobile_money: '📱 Mobile Money',
      bank_transfer: '🏦 Virement',
      stripe: '💳 Carte bancaire',
      cash: '💵 Espèces',
    };
    return map[method] || method || 'Transfert';
  };

  const toggleSort = (field: 'date' | 'amount') => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    try {
      const tName = selectedTontine?.name || 'Tontine';
      const dateStr = new Date().toISOString().slice(0, 10);
      const fileName = `Transactions_${tName.replace(/\s+/g, '_')}_${dateStr}.csv`;
      
      const headers = ['ID', 'Membre', 'Description', 'Type', 'Montant (XOF)', 'Date', 'Statut', 'Méthode'];
      const rows = filteredTransactions.map(tx => [
        `"${tx.id}"`,
        `"${(tx.user_name || '').replace(/"/g, '""')}"`,
        `"${(tx.description || '').replace(/"/g, '""')}"`,
        `"${tx.type === 'contribution' ? 'Cotisation' : 'Réception Cagnotte'}"`,
        `"${tx.amount}"`,
        `"${new Date(tx.transaction_date).toLocaleDateString('fr-FR')}"`,
        `"${getStatusText(tx.status)}"`,
        `"${tx.method || ''}"`
      ]);

      const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Transactions exportées avec succès en CSV');
    } catch {
      toast.error('Erreur lors de l\'exportation');
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setFilter('all');
    setStartDate('');
    setEndDate('');
    setMemberFilter('all');
    setCurrentPage(1);
  };

  const isFilterActive = searchTerm !== '' || filter !== 'all' || startDate !== '' || endDate !== '' || memberFilter !== 'all';

  // Copy transaction ID
  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.info('ID de transaction copié !');
  };

  // Verify/Approve Transaction (Admin only)
  const handleVerifyTransaction = async (txId: string, status: 'completed' | 'failed') => {
    if (!window.confirm(`Êtes-vous sûr de vouloir ${status === 'completed' ? 'valider' : 'rejeter'} cette transaction ?`)) return;
    setActionLoading(true);
    try {
      await transactionService.verify(txId, status);
      toast.success(`Transaction ${status === 'completed' ? 'validée' : 'rejetée'} avec succès`);
      // Update local state
      setTransactions(prev => prev.map(t => t.id === txId ? { ...t, status } : t));
      if (selectedTx && selectedTx.id === txId) {
        setSelectedTx(prev => prev ? { ...prev, status } : null);
      }
    } catch {
      toast.error('Erreur lors de la validation de la transaction');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      <Navigation />

      <div className="max-w-[1400px] mx-auto px-[5%] py-12">
        <div className="max-w-6xl mx-auto">

          {/* ── Header ── */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10 animate-fade-up">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-[#1A1208] rounded-2xl flex items-center justify-center shadow-xl shadow-[#1a120822]">
                <History className="h-7 w-7 text-[#C8862A]" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-serif font-black text-[#1A1208]">
                  Historique des <em className="italic text-[#C8862A]">transactions</em>
                </h1>
                <div className="flex items-center gap-2 flex-wrap mt-1">
                  <p className="text-[#7A6E5F] text-sm font-medium">
                    {isAdmin
                      ? '👑 Vue administrateur — tous les membres de ce groupe'
                      : '👤 Vos transactions personnelles pour ce groupe'}
                  </p>
                  <span className="text-[10px] text-slate-400 bg-white/60 border border-slate-200 px-2 py-0.5 rounded-full font-bold">
                    Mis à jour à {lastUpdated.toLocaleTimeString('fr-FR')}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <button 
                onClick={() => fetchTransactions()}
                className={`w-11 h-11 bg-white border border-[#DDD5C4] hover:bg-[#EDE8DE] rounded-full flex items-center justify-center transition-colors text-[#1A1208] ${loading ? 'animate-spin' : ''}`}
                title="Actualiser les transactions"
              >
                <RefreshCw size={16} />
              </button>
              
              <button
                className="px-6 h-11 bg-[#1A1208] text-[#C8862A] font-bold rounded-full hover:bg-slate-800 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                onClick={handleExportCSV}
                disabled={filteredTransactions.length === 0}
                aria-label="Exporter les transactions en CSV"
              >
                <FileSpreadsheet className="h-4 w-4" /> Exporter CSV
              </button>
            </div>
          </div>

          {/* ── Role Badge ── */}
          {!loadingTontines && selectedTontineId && (
            <div className="max-w-full overflow-hidden mb-8">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold truncate max-w-full ${
                isAdmin
                  ? 'bg-[#1A1208] text-[#C8862A]'
                  : 'bg-[#F5E6C8] text-[#8B5A10]'
              }`}>
                {isAdmin ? <ShieldCheck size={16} className="flex-shrink-0" /> : <Eye size={16} className="flex-shrink-0" />}
                <span className="truncate">
                  {isAdmin
                    ? `Administrateur de « ${selectedTontine?.name || ''} »`
                    : `Membre de « ${selectedTontine?.name || ''} »`}
                </span>
              </div>
            </div>
          )}

          {/* ── Tontine Selector ── */}
          {loadingTontines ? (
            <div className="h-24 bg-white rounded-[20px] border border-[#DDD5C4] animate-pulse mb-8" />
          ) : tontines.length === 0 ? (
            <div className="bg-white border-[1.5px] border-dashed border-[#DDD5C4] rounded-2xl p-12 text-center mb-8">
              <Users size={40} className="text-[#DDD5C4] mx-auto mb-4" />
              <p className="font-serif font-black text-[#1A1208] text-xl mb-2">Aucun groupe trouvé</p>
              <p className="text-[#7A6E5F] text-sm">Rejoignez ou créez un groupe pour voir les transactions.</p>
            </div>
          ) : (
            <div className="bg-white border-[1.5px] border-[#DDD5C4] rounded-2xl p-4 mb-8 shadow-sm animate-fade-up">
              <label className="text-[11px] font-bold uppercase tracking-widest text-[#7A6E5F] mb-2 block px-1">
                Sélectionner un groupe
              </label>
              <div className="relative">
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7A6E5F] pointer-events-none" />
                <select
                  value={selectedTontineId}
                  onChange={e => setSelectedTontineId(e.target.value)}
                  className="w-full h-12 px-4 pr-10 rounded-xl border-[1.5px] border-[#DDD5C4] bg-[#F7F4EF] text-[#1A1208] font-bold outline-none focus:border-[#C8862A] focus:bg-white transition-all appearance-none cursor-pointer"
                >
                  {tontines.map(t => (
                    <option key={t.id} value={t.id}>
                      💰 {t.name} {t.max_members ? `(${t.current_members || 1}/${t.max_members} membres)` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8 animate-fade-up [animation-delay:0.1s]">
            <div className="bg-white border-[1.5px] border-[#DDD5C4] p-6 rounded-[20px] shadow-sm flex items-center justify-between group hover:border-[#C8862A] transition-all">
              <div>
                <p className="text-[10px] font-bold text-[#7A6E5F] uppercase tracking-widest mb-1">Total cotisé</p>
                <p className="text-2xl font-black text-[#1A1208]">
                  {totalOut.toLocaleString()} <small className="text-xs opacity-40">XOF</small>
                </p>
              </div>
              <div className="w-11 h-11 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-all">
                <ArrowUpRight size={22} />
              </div>
            </div>

            <div className="bg-white border-[1.5px] border-[#DDD5C4] p-6 rounded-[20px] shadow-sm flex items-center justify-between group hover:border-[#C8862A] transition-all">
              <div>
                <p className="text-[10px] font-bold text-[#7A6E5F] uppercase tracking-widest mb-1">Total reçu</p>
                <p className="text-2xl font-black text-[#1A1208]">
                  {totalIn.toLocaleString()} <small className="text-xs opacity-40">XOF</small>
                </p>
              </div>
              <div className="w-11 h-11 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
                <ArrowDownLeft size={22} />
              </div>
            </div>

            <div className="bg-white border-[2px] border-[#C8862A] p-6 rounded-[20px] shadow-lg shadow-[#c8862a12] flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-[#8B5A10] uppercase tracking-widest mb-1">En attente</p>
                <p className="text-2xl font-black text-[#1A1208]">
                  {pendingAmount.toLocaleString()} <small className="text-xs opacity-60">XOF</small>
                </p>
                <p className="text-[10px] text-slate-400 font-bold mt-1">
                  {pendingCount} paiement{pendingCount !== 1 ? 's' : ''} en attente
                </p>
              </div>
              <div className="w-11 h-11 bg-[#F5E6C8] text-[#8B5A10] rounded-xl flex items-center justify-center">
                <Clock size={22} />
              </div>
            </div>
          </div>

          {/* ── Filters & Sorting Panel ── */}
          <div className="bg-white border-[1.5px] border-[#DDD5C4] p-6 rounded-2xl mb-6 shadow-sm space-y-4 animate-fade-up [animation-delay:0.15s]">
            <div className="flex flex-col lg:flex-row gap-4">
              
              {/* Search input */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A6E5F]" size={18} />
                <input
                  placeholder={isAdmin ? 'Rechercher par membre, description…' : 'Rechercher par description…'}
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="w-full h-11 pl-11 pr-4 bg-[#F7F4EF] rounded-xl outline-none border-[1.5px] border-transparent focus:border-[#C8862A] focus:bg-white transition-all text-sm font-medium"
                />
              </div>

              {/* Status categories tab */}
              <div className="flex gap-1 overflow-x-auto no-scrollbar scrollbar-thin">
                {['all', 'contribution', 'payout'].map(f => (
                  <button
                    key={f}
                    onClick={() => { setFilter(f); setCurrentPage(1); }}
                    className={`px-4 h-11 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                      filter === f
                        ? 'bg-[#1A1208] text-white shadow-inner'
                        : 'bg-[#F7F4EF] text-[#7A6E5F] hover:bg-[#EDE8DE]'
                    }`}
                  >
                    {f === 'all' ? 'Tous' : f === 'contribution' ? 'Cotisations' : 'Reçus'}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Inputs & Admin member filter */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#F7F4EF]">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs text-[#7A6E5F] font-bold uppercase tracking-wider">Date du :</span>
                <input 
                  type="date"
                  value={startDate}
                  onChange={e => { setStartDate(e.target.value); setCurrentPage(1); }}
                  className="h-9 px-3 border border-[#DDD5C4] rounded-lg bg-[#F7F4EF] font-bold text-xs outline-none focus:border-[#C8862A] focus:bg-white transition-all"
                />
                <span className="text-xs text-[#7A6E5F] font-bold uppercase">au :</span>
                <input 
                  type="date"
                  value={endDate}
                  onChange={e => { setEndDate(e.target.value); setCurrentPage(1); }}
                  className="h-9 px-3 border border-[#DDD5C4] rounded-lg bg-[#F7F4EF] font-bold text-xs outline-none focus:border-[#C8862A] focus:bg-white transition-all"
                />

                {/* Admin specific member dropdown */}
                {isAdmin && membersList.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#7A6E5F] font-bold uppercase tracking-wider ml-2">Membre :</span>
                    <select
                      value={memberFilter}
                      onChange={e => { setMemberFilter(e.target.value); setCurrentPage(1); }}
                      className="h-9 px-3 border border-[#DDD5C4] rounded-lg bg-[#F7F4EF] font-bold text-xs outline-none focus:border-[#C8862A] focus:bg-white transition-all"
                    >
                      <option value="all">Tous les membres</option>
                      {membersList.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Sorting selectors */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#7A6E5F] font-bold uppercase tracking-wider">Trier par :</span>
                
                <button 
                  onClick={() => toggleSort('date')}
                  className={`h-9 px-3 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                    sortField === 'date' ? 'bg-[#1A1208] text-white border-transparent' : 'bg-[#F7F4EF] text-[#7A6E5F] border-[#DDD5C4]'
                  }`}
                >
                  Date {sortField === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
                <button 
                  onClick={() => toggleSort('amount')}
                  className={`h-9 px-3 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                    sortField === 'amount' ? 'bg-[#1A1208] text-white border-transparent' : 'bg-[#F7F4EF] text-[#7A6E5F] border-[#DDD5C4]'
                  }`}
                >
                  Montant {sortField === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>

                {isFilterActive && (
                  <button
                    onClick={handleResetFilters}
                    className="h-9 px-4 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                  >
                    <X size={14} /> Réinitialiser
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Transactions List Card ── */}
          <div className="bg-white border-[1.5px] border-[#DDD5C4] rounded-[28px] overflow-hidden shadow-sm animate-fade-up [animation-delay:0.2s]">
            
            <div className="p-6 border-b border-[#F7F4EF] flex items-center justify-between">
              <h2 className="text-xl font-serif font-black text-[#1A1208]">
                {isAdmin ? 'Transactions du groupe' : 'Mes transactions'}
              </h2>
              <span className="text-[10px] font-bold text-[#7A6E5F] uppercase tracking-widest bg-[#F7F4EF] px-3 py-1 rounded-full">
                {totalItems} entrée{totalItems !== 1 ? 's' : ''}
              </span>
            </div>

            {/* TABLE HEADER (Unified desktop layout using grid) */}
            {totalItems > 0 && !loading && (
              <div 
                className={`hidden md:grid px-6 py-3 bg-[#F7F4EF] border-b border-[#EDE8DE] text-[10px] font-bold uppercase tracking-widest text-[#7A6E5F] ${
                  isAdmin 
                    ? 'grid-cols-[2fr_1.2fr_1fr_1fr_1fr_0.8fr]' 
                    : 'grid-cols-[2fr_1fr_1fr_1fr_0.8fr]'
                }`}
              >
                <span>Description</span>
                {isAdmin && <span>Membre</span>}
                <span>Date</span>
                <span>Statut</span>
                <span className="text-right">Montant</span>
                <span className="text-right">Actions</span>
              </div>
            )}

            <div className="divide-y divide-[#F7F4EF]" role="table">
              {loading ? (
                // SKELETON LOADER
                [...Array(6)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`flex flex-col md:grid md:items-center p-5 gap-4 animate-pulse ${
                      isAdmin 
                        ? 'md:grid-cols-[2fr_1.2fr_1fr_1fr_1fr_0.8fr]' 
                        : 'md:grid-cols-[2fr_1fr_1fr_1fr_0.8fr]'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-200 flex-shrink-0" />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-slate-200 rounded w-4/5" />
                        <div className="h-3 bg-slate-200 rounded w-2/5" />
                      </div>
                    </div>
                    {isAdmin && <div className="h-4 bg-slate-200 rounded w-2/3" />}
                    <div className="h-3.5 bg-slate-200 rounded w-2/3 md:w-3/4" />
                    <div className="h-6 bg-slate-200 rounded-full w-20" />
                    <div className="h-5 bg-slate-200 rounded w-16 md:ml-auto" />
                    <div className="h-9 bg-slate-200 rounded-xl w-16 md:ml-auto" />
                  </div>
                ))
              ) : txError ? (
                // INLINE ERROR
                <div className="p-16 text-center">
                  <AlertTriangle className="h-12 w-12 text-[#C8862A] mx-auto mb-4" />
                  <p className="text-[#1A1208] font-bold mb-4">{txError}</p>
                  <button 
                    onClick={() => fetchTransactions()}
                    className="px-6 py-2.5 bg-[#1A1208] text-white rounded-full font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all border border-transparent"
                  >
                    Réessayer
                  </button>
                </div>
              ) : paginatedTransactions.length === 0 ? (
                // EMPTY STATE
                <div className="py-20 text-center">
                  <div className="w-16 h-16 bg-[#EDE8DE] rounded-full flex items-center justify-center mx-auto mb-4 text-[#C1B7A6]">
                    <FileText size={28} />
                  </div>
                  <p className="font-serif font-black text-[#1A1208] text-lg mb-1">Aucune transaction</p>
                  <p className="text-[#7A6E5F] text-sm mb-6 max-w-sm mx-auto leading-relaxed">
                    {isAdmin
                      ? 'Ce groupe n\'a encore aucune transaction enregistrée.'
                      : 'Vous n\'avez encore effectué aucune transaction dans ce groupe.'}
                  </p>
                  <div className="flex gap-3 justify-center">
                    <a 
                      href="/help"
                      className="px-5 py-2.5 border border-[#DDD5C4] hover:bg-[#F7F4EF] text-[#1A1208] text-xs font-bold rounded-full transition-all"
                    >
                      Consulter l'aide
                    </a>
                    {!isAdmin && (
                      <a 
                        href="/member/dashboard"
                        className="px-5 py-2.5 bg-[#1A1208] hover:bg-slate-800 text-[#C8862A] text-xs font-bold rounded-full transition-all"
                      >
                        Effectuer un versement
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                // DESKTOP & MOBILE COMPACT ROWS
                paginatedTransactions.map(tx => {
                  const isCurrentUser = String(tx.user_id) === String(user?.id);
                  const isCompleted = tx.status === 'completed';
                  
                  return (
                    <div key={tx.id}>
                      {/* DESKTOP ROW */}
                      <div
                        tabIndex={0}
                        onClick={() => setSelectedTx(tx)}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedTx(tx); } }}
                        className={`hidden md:grid items-center px-6 py-5 hover:bg-[#FAFAF8] transition-colors gap-4 cursor-pointer focus-visible:bg-[#FAFAF8] focus-visible:outline-none border-l-4 ${
                          isCurrentUser && isAdmin ? 'border-l-[#C8862A]' : 'border-l-transparent'
                        } ${
                          isAdmin 
                            ? 'grid-cols-[2fr_1.2fr_1fr_1fr_1fr_0.8fr]' 
                            : 'grid-cols-[2fr_1fr_1fr_1fr_0.8fr]'
                        }`}
                        role="row"
                      >
                        {/* Description / Icon */}
                        <div className="flex items-center gap-4 min-w-0" role="cell">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            tx.type === 'contribution' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'
                          }`}>
                            {tx.type === 'contribution' ? <ArrowUpRight size={22} /> : <ArrowDownLeft size={22} />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-[#1A1208] truncate">
                              {tx.description || (tx.type === 'contribution' ? 'Cotisation' : 'Réception de cagnotte')}
                            </p>
                            <span className="text-[11px] text-[#7A6E5F]">
                              {getMethodLabel(tx.method)}
                            </span>
                          </div>
                        </div>

                        {/* Admin Member Column */}
                        {isAdmin && (
                          <div className="min-w-0 flex items-center gap-2" role="cell">
                            <div className="w-8 h-8 rounded-full bg-[#F5E6C8] text-[#8B5A10] flex items-center justify-center text-[10px] font-black flex-shrink-0">
                              {tx.user_name?.slice(0, 2).toUpperCase() || 'M'}
                            </div>
                            <span className="font-bold text-[#1A1208] text-xs truncate">
                              {tx.user_name || 'Inconnu'}
                              {isCurrentUser && <span className="text-[#C8862A] text-[10px] ml-1">(vous)</span>}
                            </span>
                          </div>
                        )}

                        {/* Date */}
                        <div className="text-[11px] text-[#7A6E5F] font-bold" role="cell">
                          {new Date(tx.transaction_date).toLocaleDateString('fr-FR', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </div>

                        {/* Status badge */}
                        <div role="cell">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold ${getStatusBg(tx.status)}`}>
                            {getStatusIcon(tx.status)}
                            {getStatusText(tx.status)}
                          </span>
                        </div>

                        {/* Amount */}
                        <div className="text-right" role="cell">
                          <span className={`text-base font-black ${tx.type === 'payout' ? 'text-emerald-600' : 'text-[#1A1208]'}`}>
                            {tx.type === 'payout' ? '+' : '-'}{(Number(tx.amount) || 0).toLocaleString()}
                          </span>
                          <small className="text-[10px] text-[#7A6E5F] ml-1">XOF</small>
                        </div>

                        {/* Actions: Details & Print Receipt */}
                        <div className="flex justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                          <button 
                            onClick={() => setSelectedTx(tx)}
                            aria-label="Voir les détails de la transaction"
                            className="w-9 h-9 bg-slate-50 border border-slate-200 rounded-xl hover:bg-[#F7F4EF] text-[#7A6E5F] flex items-center justify-center transition-colors"
                          >
                            <Eye size={16} />
                          </button>

                          {isCompleted && (
                            <button 
                              onClick={() => { setSelectedTx(tx); setShowReceipt(true); }}
                              aria-label="Télécharger le reçu"
                              className="w-9 h-9 bg-slate-50 border border-slate-200 rounded-xl hover:bg-[#F7F4EF] text-[#C8862A] flex items-center justify-center transition-colors"
                            >
                              <Download size={16} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* MOBILE CARD VIEW */}
                      <div 
                        onClick={() => setSelectedTx(tx)}
                        className={`block md:hidden p-5 space-y-4 hover:bg-[#FAFAF8] border-l-4 cursor-pointer ${
                          isCurrentUser && isAdmin ? 'border-l-[#C8862A]' : 'border-l-transparent'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              tx.type === 'contribution' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'
                            }`}>
                              {tx.type === 'contribution' ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                            </div>
                            <div>
                              <p className="font-bold text-[#1A1208] text-sm">
                                {tx.description || (tx.type === 'contribution' ? 'Cotisation' : 'Réception Cagnotte')}
                              </p>
                              <p className="text-[10px] text-[#7A6E5F] font-bold">
                                {new Date(tx.transaction_date).toLocaleDateString('fr-FR', {
                                  day: 'numeric', month: 'short', year: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className={`text-base font-black ${tx.type === 'payout' ? 'text-emerald-600' : 'text-[#1A1208]'}`}>
                              {tx.type === 'payout' ? '+' : '-'}{(Number(tx.amount) || 0).toLocaleString()}
                            </span>
                            <small className="text-[9px] text-[#7A6E5F] ml-0.5">XOF</small>
                          </div>
                        </div>

                        {isAdmin && tx.user_name && (
                          <div className="flex items-center gap-2 bg-[#F7F4EF] p-2.5 rounded-xl">
                            <div className="w-6 h-6 rounded-full bg-[#F5E6C8] text-[#8B5A10] flex items-center justify-center text-[9px] font-black flex-shrink-0">
                              {tx.user_name.slice(0,2).toUpperCase()}
                            </div>
                            <span className="font-bold text-[#1A1208] text-[11px] truncate">
                              {tx.user_name}
                              {isCurrentUser && <span className="text-[#C8862A] ml-1">(vous)</span>}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-3 pt-2">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold ${getStatusBg(tx.status)}`}>
                            {getStatusIcon(tx.status)}
                            {getStatusText(tx.status)}
                          </span>

                          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                            <button 
                              onClick={() => setSelectedTx(tx)}
                              className="h-8 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-[#7A6E5F] flex items-center gap-1"
                            >
                              <Eye size={14} /> Détails
                            </button>
                            {isCompleted && (
                              <button 
                                onClick={() => { setSelectedTx(tx); setShowReceipt(true); }}
                                className="h-8 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-[#C8862A] flex items-center gap-1"
                              >
                                <Download size={14} /> Reçu
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination controls in footer */}
            {!txError && totalItems > 0 && (
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs text-[#7A6E5F] font-bold uppercase tracking-wider">
                  Affichage de {startIndex + 1} à {endIndex} sur {totalItems} transactions
                </span>
                
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Items per page selector */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#7A6E5F]">Par page</span>
                    <select
                      value={itemsPerPage}
                      onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                      className="h-9 px-2 bg-white border border-[#DDD5C4] rounded-lg text-xs font-bold outline-none cursor-pointer focus:border-[#C8862A]"
                    >
                      <option value={15}>15</option>
                      <option value={30}>30</option>
                      <option value={50}>50</option>
                    </select>
                  </div>

                  {/* Previous / Next buttons */}
                  {totalPages > 1 && (
                    <div className="flex gap-1.5 items-center">
                      <button 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 h-9 bg-white border border-[#DDD5C4] rounded-lg text-xs font-bold text-[#7A6E5F] hover:bg-slate-50 disabled:opacity-50 transition-colors"
                      >
                        Précédent
                      </button>
                      <div className="flex gap-1">
                        {[...Array(totalPages)].map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentPage(idx + 1)}
                            className={`w-9 h-9 rounded-lg text-xs font-black transition-all ${
                              currentPage === idx + 1 
                                ? 'bg-[#1A1208] text-[#C8862A] shadow-md shadow-[#1a120825] border border-transparent' 
                                : 'bg-white border border-[#DDD5C4] text-[#7A6E5F] hover:bg-slate-50'
                            }`}
                          >
                            {idx + 1}
                          </button>
                        ))}
                      </div>
                      <button 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 h-9 bg-white border border-[#DDD5C4] rounded-lg text-xs font-bold text-[#7A6E5F] hover:bg-slate-50 disabled:opacity-50 transition-colors"
                      >
                        Suivant
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── TRANSACTION DETAIL MODAL ── */}
      {selectedTx && !showReceipt && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] border-[1.5px] border-[#DDD5C4] p-8 max-w-lg w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setSelectedTx(null)}
              className="absolute right-6 top-6 text-[#7A6E5F] hover:text-[#1A1208] p-1 transition-colors"
              aria-label="Fermer la modal"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                selectedTx.type === 'contribution' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'
              }`}>
                {selectedTx.type === 'contribution' ? <ArrowUpRight size={22} /> : <ArrowDownLeft size={22} />}
              </div>
              <div>
                <h3 className="text-xl font-serif font-black text-[#1A1208]">Détails du versement</h3>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                  selectedTx.type === 'contribution' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  {selectedTx.type === 'contribution' ? 'Cotisation' : 'Bénéficiaire'}
                </span>
              </div>
            </div>

            <div className="space-y-4 text-sm border-t border-b border-[#F7F4EF] py-5 mb-6">
              <div className="flex justify-between items-start gap-4">
                <span className="text-xs text-[#7A6E5F] font-bold uppercase tracking-wider">ID Transaction</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs text-[#1A1208] font-bold bg-[#F7F4EF] px-2 py-0.5 rounded">{selectedTx.id}</span>
                  <button 
                    onClick={() => handleCopyId(selectedTx.id)}
                    className="p-1 hover:bg-[#F7F4EF] rounded text-[#C8862A] transition-colors"
                    title="Copier l'ID"
                  >
                    <Copy size={12} />
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-[#7A6E5F] font-bold uppercase tracking-wider">Membre</span>
                <span className="font-bold text-[#1A1208]">{selectedTx.user_name || 'N/A'}</span>
              </div>

              <div className="flex justify-between items-start gap-4">
                <span className="text-xs text-[#7A6E5F] font-bold uppercase tracking-wider">Description</span>
                <span className="font-bold text-[#1A1208] text-right">{selectedTx.description || 'Versement de tontine'}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-[#7A6E5F] font-bold uppercase tracking-wider">Montant</span>
                <span className="text-lg font-black text-[#1A1208]">{(Number(selectedTx.amount) || 0).toLocaleString()} XOF</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-[#7A6E5F] font-bold uppercase tracking-wider">Date & Heure</span>
                <span className="font-bold text-[#1A1208]">
                  {new Date(selectedTx.transaction_date).toLocaleString('fr-FR')}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-[#7A6E5F] font-bold uppercase tracking-wider">Méthode</span>
                <span className="font-bold text-[#1A1208]">{getMethodLabel(selectedTx.method)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-[#7A6E5F] font-bold uppercase tracking-wider">Statut</span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-bold ${getStatusBg(selectedTx.status)}`}>
                  {getStatusIcon(selectedTx.status)}
                  {getStatusText(selectedTx.status)}
                </span>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              {/* Verification actions for admin only on pending transactions */}
              {isAdmin && selectedTx.status === 'pending' && (
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleVerifyTransaction(selectedTx.id, 'failed')}
                    disabled={actionLoading}
                    className="flex-1 sm:flex-none h-11 px-5 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-700 rounded-full font-bold text-xs uppercase tracking-widest transition-colors"
                  >
                    Rejeter
                  </button>
                  <button
                    onClick={() => handleVerifyTransaction(selectedTx.id, 'completed')}
                    disabled={actionLoading}
                    className="flex-1 sm:flex-none h-11 px-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                  >
                    {actionLoading ? <Loader2 size={14} className="animate-spin" /> : 'Valider'}
                  </button>
                </div>
              )}
              
              {selectedTx.status === 'completed' && (
                <button
                  onClick={() => setShowReceipt(true)}
                  className="px-5 h-11 bg-[#F5E6C8] hover:bg-[#EDE8DE] text-[#8B5A10] font-bold rounded-full text-xs uppercase tracking-widest transition-all flex items-center gap-1.5"
                >
                  <Download size={14} /> Voir le reçu
                </button>
              )}
              
              <button 
                onClick={() => setSelectedTx(null)}
                className="px-5 h-11 bg-[#F7F4EF] hover:bg-[#EDE8DE] text-[#1A1208] border border-[#DDD5C4] font-bold rounded-full text-xs uppercase tracking-widest transition-all"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TRANSACTION RECEIPT VIEW MODAL ── */}
      {selectedTx && showReceipt && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] border-[1.5px] border-[#DDD5C4] p-8 max-w-md w-full shadow-2xl relative print:p-0 print:border-none animate-in fade-in zoom-in-95 duration-200">
            
            {/* Close button - hidden in print */}
            <button 
              onClick={() => setShowReceipt(false)}
              className="absolute right-6 top-6 text-[#7A6E5F] hover:text-[#1A1208] p-1 transition-colors print:hidden"
            >
              <X size={20} />
            </button>

            {/* Receipt Content */}
            <div id="receipt-print-area" className="space-y-6 pt-4 text-center">
              <div className="border-b-2 border-dashed border-[#DDD5C4] pb-4">
                <h3 className="font-serif font-black text-2xl text-[#1A1208] tracking-tight">TontinePro</h3>
                <p className="text-[10px] text-[#7A6E5F] font-bold uppercase tracking-widest mt-1">Reçu de transaction officiel</p>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs text-[#7A6E5F] font-bold uppercase tracking-wider">Montant réglé</p>
                <h4 className="text-3xl font-black text-[#1A1208]">{(Number(selectedTx.amount) || 0).toLocaleString()} XOF</h4>
                <span className="inline-block px-3 py-0.5 text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full">
                  Paiement Réussi
                </span>
              </div>

              <div className="space-y-3.5 text-xs text-left bg-[#F7F4EF] p-5 rounded-2xl border border-[#DDD5C4]">
                <div className="flex justify-between">
                  <span className="text-[#7A6E5F] font-bold uppercase text-[9px]">ID Transaction</span>
                  <span className="font-mono font-bold text-[#1A1208]">{selectedTx.id.slice(0, 18)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7A6E5F] font-bold uppercase text-[9px]">Cercle</span>
                  <span className="font-bold text-[#1A1208]">{selectedTx.tontine_name || selectedTontine?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7A6E5F] font-bold uppercase text-[9px]">Membre</span>
                  <span className="font-bold text-[#1A1208]">{selectedTx.user_name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7A6E5F] font-bold uppercase text-[9px]">Date & Heure</span>
                  <span className="font-bold text-[#1A1208]">{new Date(selectedTx.transaction_date).toLocaleString('fr-FR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7A6E5F] font-bold uppercase text-[9px]">Type</span>
                  <span className="font-bold text-[#1A1208]">
                    {selectedTx.type === 'contribution' ? 'Cotisation' : 'Réception Cagnotte'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7A6E5F] font-bold uppercase text-[9px]">Méthode</span>
                  <span className="font-bold text-[#1A1208]">{getMethodLabel(selectedTx.method)}</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 font-bold leading-relaxed pt-2">
                Merci de faire confiance à TontinePro.<br />
                Ce reçu fait office de preuve de versement électronique.
              </div>
            </div>

            {/* Footer buttons - hidden in print */}
            <div className="flex gap-3 justify-end mt-8 border-t border-[#F7F4EF] pt-5 print:hidden">
              <button 
                onClick={handlePrintReceipt}
                className="px-5 h-11 bg-[#1A1208] text-[#C8862A] font-bold rounded-full text-xs uppercase tracking-widest hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              >
                Imprimer le reçu
              </button>
              <button 
                onClick={() => setShowReceipt(false)}
                className="px-5 h-11 bg-[#F7F4EF] hover:bg-[#EDE8DE] text-[#1A1208] border border-[#DDD5C4] font-bold rounded-full text-xs uppercase tracking-widest transition-all"
              >
                Retour
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// ERROR BOUNDARY WRAPPER
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-12 bg-white border border-[#DDD5C4] rounded-[28px] text-center my-6 max-w-xl mx-auto">
          <AlertTriangle className="w-12 h-12 text-[#C8862A] mx-auto mb-4 animate-bounce" />
          <h2 className="text-xl font-black font-serif text-[#1A1208] mb-2">Une erreur inattendue est survenue</h2>
          <p className="text-[#7A6E5F] text-xs font-medium mb-6 leading-relaxed">
            L'historique des transactions n'a pas pu s'afficher correctement.
          </p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="px-6 h-11 bg-[#1A1208] text-[#C8862A] rounded-full font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md"
          >
            Recharger le composant
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function TransactionHistoryWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <TransactionHistory />
    </ErrorBoundary>
  );
}
