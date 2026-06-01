import { tontineService, transactionService, notificationService } from "@/services/api";
import { 
  Plus, Loader2, CheckCircle, Trash2, AlertTriangle, UserPlus, Search, 
  Edit3, Shield, Package, Menu, CheckSquare, 
  Download, ArrowUpDown, RefreshCw, X, Key, Info
} from "lucide-react";
import React, { useEffect, useState, useCallback } from "react";

import { toast } from "react-toastify";
import { useNavigate } from 'react-router-dom';
import Modal from "../shared/Modal";

// Sub-components for different dashboard sections
import AdminSidebar from "./admin/AdminSidebar";
import DashboardOverview from "./admin/Overview";
import CotisationsManagement from "./admin/ContributionList";
import CycleManagement from "./admin/CycleManager";
import FinanceManager from "./admin/FinanceManager";

// ChevronDown icon component
const ChevronDown = ({ size, className }: { size: number, className: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6 9 6 6 6-6"/></svg>
);

// Global Error Logging Service
const errorLoggingService = {
  logError: (err: any, context?: string) => {
    console.error(`[Error Logging] Context: ${context}`, err);
  }
};

// --- MembersManagement Component ---
const MembersManagement = ({ tontine }: { tontine: any }) => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounced search terms
  const [searchVal, setSearchVal] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sorting criteria
  const [sortField, setSortField] = useState<'name' | 'status' | 'penalties' | 'contribution' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Filter chips
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'absent' | 'suspended'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'member'>('all');

  // Selected row checkboxes for bulk actions
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showBulkPenaltyModal, setShowBulkPenaltyModal] = useState(false);
  const [bulkPenaltyAmount, setBulkPenaltyAmount] = useState('1000');
  const [bulkPenaltyReason, setBulkPenaltyReason] = useState('');
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  // Clickable expanded row detail
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

  // Real-time counter
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [prevCount, setPrevCount] = useState(0);

  // Modals visibility
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStatusConfirmModal, setShowStatusConfirmModal] = useState(false);

  // Mutation selected states
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states with validations
  const [addForm, setAddForm] = useState({ name: '', phone: '' });
  const [editForm, setEditForm] = useState({ name: '', phone: '', role: 'member' });
  const [penaltyAmount, setPenaltyAmount] = useState('1000');
  const [penaltyReason, setPenaltyReason] = useState('');
  const [statusToChange, setStatusToChange] = useState<'active' | 'absent' | 'suspended' | null>(null);

  // Validation feedback inline messages
  const [addNameError, setAddNameError] = useState('');
  const [addPhoneError, setAddPhoneError] = useState('');
  const [editNameError, setEditNameError] = useState('');
  const [editPhoneError, setEditPhoneError] = useState('');

  // debouncing search query input (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(searchVal);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchVal]);

  const loadMembers = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await tontineService.getTontineMembers(tontine.id);
      const resList = Array.isArray(res) ? res : (res.data || []);
      
      // Toast notification on dynamic update detection
      if (prevCount > 0 && resList.length > prevCount) {
        toast.info(`Nouveau membre détecté ! (${resList.length - prevCount} nouveau(x))`);
      }
      
      setMembers(resList);
      setPrevCount(resList.length);
      setLastRefreshed(new Date());
    } catch (err: any) {
      errorLoggingService.logError(err, 'MembersManagement.loadMembers');
      if (err.response?.status === 403) {
        setError("Accès interdit (403) : Droits administrateurs requis.");
      } else if (err.response?.status === 404) {
        setError("Cercle introuvable (404) : Cette tontine n'existe plus.");
      } else {
        setError("Impossible de charger la liste des membres. Réessayez plus tard.");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [tontine.id, prevCount]);

  useEffect(() => { 
    loadMembers(); 
  }, [loadMembers]);

  // Real-time auto sync interval (60 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      loadMembers(true);
    }, 60000);
    return () => clearInterval(interval);
  }, [loadMembers]);

  // Validate phone matches Cameroon (+237) or Senegal (+221) style structure
  const validatePhoneStr = (phone: string) => {
    const cleaned = phone.replace(/\s+/g, '');
    return /^(\+237|\+221)\d{9}$/.test(cleaned);
  };

  const handleAddSubmit = async () => {
    let hasErr = false;
    if (addForm.name.trim().length < 3) {
      setAddNameError("Le nom complet doit avoir au moins 3 lettres.");
      hasErr = true;
    } else {
      setAddNameError("");
    }
    if (!validatePhoneStr(addForm.phone)) {
      setAddPhoneError("Format requis: +237XXXXXXXXX ou +221XXXXXXXXX");
      hasErr = true;
    } else {
      setAddPhoneError("");
    }
    if (hasErr) return;

    try {
      setSubmitting(true);
      await tontineService.addMember(tontine.id, { name: addForm.name, phone: addForm.phone, role: 'member' });
      toast.success('Membre ajouté avec succès !');
      setShowAddModal(false);
      setAddForm({ name: '', phone: '' });
      loadMembers();
    } catch (err: any) {
      errorLoggingService.logError(err, 'MembersManagement.handleAddSubmit');
      toast.error(err.response?.data?.message || "Erreur de création.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedMember) return;
    let hasErr = false;
    if (editForm.name.trim().length < 3) {
      setEditNameError("Le nom complet doit avoir au moins 3 lettres.");
      hasErr = true;
    } else {
      setEditNameError("");
    }
    if (!validatePhoneStr(editForm.phone)) {
      setEditPhoneError("Format requis: +237XXXXXXXXX ou +221XXXXXXXXX");
      hasErr = true;
    } else {
      setEditPhoneError("");
    }
    if (hasErr) return;

    // Check Role Validation rules: Prevent demoting the last admin
    const admins = members.filter(m => m.role === 'admin');
    if (selectedMember.role === 'admin' && editForm.role === 'member' && admins.length <= 1) {
      toast.error("Action impossible : Vous ne pouvez pas rétrograder le dernier administrateur.");
      return;
    }

    try {
      setSubmitting(true);
      await tontineService.updateMemberProfile(tontine.id, selectedMember.id, editForm);
      toast.success('Profil mis à jour avec succès !');
      setShowEditModal(false);
      loadMembers();
    } catch (err) {
      errorLoggingService.logError(err, 'MembersManagement.handleEditSubmit');
      toast.error("Erreur lors de la mise à jour.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePenalty = async () => {
    if (!selectedMember) return;
    try {
      setSubmitting(true);
      await tontineService.applyPenalty(tontine.id, selectedMember.id, Number(penaltyAmount));
      toast.warning(`Pénalité de ${Number(penaltyAmount).toLocaleString()} FCFA appliquée pour : ${penaltyReason || 'Non spécifié'}`);
      setShowPenaltyModal(false);
      setPenaltyReason('');
      loadMembers();
    } catch (err) {
      errorLoggingService.logError(err, 'MembersManagement.handlePenalty');
      toast.error("Erreur d'application de la pénalité.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleWaivePenalty = async (m: any, amount: number) => {
    try {
      setSubmitting(true);
      await tontineService.applyPenalty(tontine.id, m.id, -amount);
      toast.success("Toutes les pénalités ont été annulées !");
      loadMembers();
    } catch (err) {
      errorLoggingService.logError(err, 'MembersManagement.handleWaivePenalty');
      toast.error("Erreur d'annulation.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMember) return;
    
    // Check Role Validation rules: Prevent removing the last admin
    const admins = members.filter(m => m.role === 'admin');
    if (selectedMember.role === 'admin' && admins.length <= 1) {
      toast.error("Action impossible : Vous ne pouvez pas retirer le dernier administrateur.");
      return;
    }

    try {
      setSubmitting(true);
      await tontineService.removeMember(tontine.id, selectedMember.id);
      toast.success('Membre retiré du cercle.');
      setShowDeleteConfirm(false);
      loadMembers();
    } catch (err) {
      errorLoggingService.logError(err, 'MembersManagement.handleDelete');
      toast.error("Erreur de suppression.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChangeClick = (m: any, status: 'active' | 'absent' | 'suspended') => {
    setSelectedMember(m);
    setStatusToChange(status);
    setShowStatusConfirmModal(true);
  };

  const confirmStatusChange = async () => {
    if (!selectedMember || !statusToChange) return;
    try {
      setSubmitting(true);
      // Wait: call status updates profile directly
      await tontineService.updateMemberProfile(tontine.id, selectedMember.id, {
        name: selectedMember.name,
        phone: selectedMember.phone,
        role: selectedMember.role,
        status: statusToChange
      } as any);
      
      toast.success(`Statut mis à jour : ${statusToChange.toUpperCase()}`);
      setShowStatusConfirmModal(false);
      loadMembers();
    } catch (err) {
      errorLoggingService.logError(err, 'MembersManagement.confirmStatusChange');
      toast.error("Erreur lors du changement de statut.");
    } finally {
      setSubmitting(false);
    }
  };

  // Text highlight helper
  const highlightText = (text: string, search: string) => {
    if (!search.trim()) return <span>{text}</span>;
    const regex = new RegExp(`(${search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) => 
          regex.test(part) 
            ? <mark key={i} className="bg-yellow-200 text-slate-900 rounded-[2px] px-0.5 font-bold">{part}</mark>
            : part
        )}
      </span>
    );
  };

  // Apply search query and chip filters
  const filtered = members.filter(m => {
    const nameMatch = m.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const phoneMatch = (m.phone || '').includes(searchQuery);
    const codeMatch = (m.tontine_invite_code || '').toLowerCase().includes(searchQuery.toLowerCase());
    const queryPassed = nameMatch || phoneMatch || codeMatch;

    const statusPassed = statusFilter === 'all' || m.status === statusFilter;
    const rolePassed = roleFilter === 'all' || m.role === roleFilter;

    return queryPassed && statusPassed && rolePassed;
  });

  // Apply sorting field configurations
  const sorted = [...filtered].sort((a, b) => {
    if (!sortField) return 0;
    let valA: any = '';
    let valB: any = '';

    if (sortField === 'name') {
      valA = (a.name || '').toLowerCase();
      valB = (b.name || '').toLowerCase();
    } else if (sortField === 'status') {
      valA = (a.status || '').toLowerCase();
      valB = (b.status || '').toLowerCase();
    } else if (sortField === 'penalties') {
      valA = Number(a.total_penalties || 0);
      valB = Number(b.total_penalties || 0);
    } else if (sortField === 'contribution') {
      valA = Number(a.total_contribution || 0);
      valB = Number(b.total_contribution || 0);
    }

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: 'name' | 'status' | 'penalties' | 'contribution') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Pagination bounds
  const totalItems = sorted.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastRow = currentPage * itemsPerPage;
  const indexOfFirstRow = indexOfLastRow - itemsPerPage;
  const currentMembers = sorted.slice(indexOfFirstRow, indexOfLastRow);

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(currentMembers.map(m => m.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  // Bulk Actions
  const handleBulkPenalty = async () => {
    try {
      setSubmitting(true);
      for (const id of selectedIds) {
        await tontineService.applyPenalty(tontine.id, id, Number(bulkPenaltyAmount));
      }
      toast.warning(`Pénalités appliquées en masse pour : ${bulkPenaltyReason || 'Frais de retard'}`);
      setShowBulkPenaltyModal(false);
      setSelectedIds([]);
      loadMembers();
    } catch {
      toast.error("Erreur lors de l'application en masse.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkDelete = async () => {
    try {
      setSubmitting(true);
      for (const id of selectedIds) {
        await tontineService.removeMember(tontine.id, id);
      }
      toast.success("Membres retirés du cercle.");
      setShowBulkDeleteConfirm(false);
      setSelectedIds([]);
      loadMembers();
    } catch {
      toast.error("Erreur lors de la suppression en masse.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCSV = async (selectedOnly = false) => {
    setExporting(true);
    try {
      const dataToExport = selectedOnly 
        ? members.filter(m => selectedIds.includes(m.id)) 
        : sorted;

      if (dataToExport.length === 0) {
        toast.warning("Aucune donnée à exporter.");
        return;
      }

      const headers = ['Nom', 'Téléphone', 'Rôle', 'Statut', 'Pénalités (FCFA)', 'Contributions (FCFA)', 'Date d\'adhésion'];
      const rows = dataToExport.map(m => [
        m.name,
        m.phone || 'N/A',
        m.role || 'member',
        m.status || 'active',
        m.total_penalties || 0,
        m.total_contribution || 0,
        m.created_at ? new Date(m.created_at).toLocaleDateString() : 'N/A'
      ]);

      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `membres_${tontine.name}_export.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Export CSV complété !");
    } catch (err) {
      toast.error("Échec de l'export.");
    } finally {
      setExporting(false);
    }
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(tontine.join_code || '');
    toast.info('Code d\'invitation copié ! Partagez-le au nouveau membre.');
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Screen Reader polite announcer */}
      <div className="sr-only" aria-live="polite">
        {totalItems} membres affichés sur un total de {members.length}.
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-3">
             <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight italic">Membres & Habilitations</h2>
             <button 
               onClick={() => loadMembers(false)}
               aria-label="Recharger les membres"
               className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg hover:scale-105 active:scale-95 transition-all mt-1"
             >
               <RefreshCw size={14} />
             </button>
           </div>
           <p className="text-slate-500 font-medium text-lg mt-1 italic">
             Dernière mise à jour à : {lastRefreshed.toLocaleTimeString('fr-FR')}
           </p>
        </div>
        <div className="flex gap-4">
           <button onClick={() => setShowAddModal(true)} className="px-8 py-4 bg-white border border-slate-200 text-slate-900 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-sm flex items-center gap-3 hover:scale-105 active:scale-95 transition-all">
              <Plus size={20} className="text-blue-600" /> Ajouter
           </button>
           <button onClick={handleCopyInvite} className="px-8 py-4 bg-blue-600 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/30 flex items-center gap-3 hover:scale-105 active:scale-95 transition-all">
              <UserPlus size={20} /> Partager Code
           </button>
        </div>
      </div>

      {/* Filter chips & Search Row */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
        <div className="flex flex-col xl:flex-row justify-between items-center gap-6">
           <div className="relative w-full xl:w-96">
              <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
              <input 
                type="text" 
                value={searchVal} 
                onChange={e => setSearchVal(e.target.value)} 
                placeholder="Rechercher par nom, téléphone..." 
                className="w-full h-14 pl-14 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all" 
              />
              {searchVal && (
                <button onClick={() => setSearchVal('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900">
                  <X size={14} />
                </button>
              )}
           </div>
           
           <div className="flex flex-wrap gap-3 items-center w-full xl:w-auto">
             <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border">
               <span className="text-[9px] font-bold text-slate-400 uppercase px-2">Statut</span>
               {['all', 'active', 'absent', 'suspended'].map(st => (
                 <button
                   key={st}
                   onClick={() => { setStatusFilter(st as any); setCurrentPage(1); }}
                   className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${
                     statusFilter === st 
                       ? 'bg-slate-900 text-white' 
                       : 'text-slate-500 hover:bg-white'
                   }`}
                 >
                   {st === 'all' ? 'Tous' : st}
                 </button>
               ))}
             </div>

             <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border">
               <span className="text-[9px] font-bold text-slate-400 uppercase px-2">Rôle</span>
               {['all', 'admin', 'member'].map(ro => (
                 <button
                   key={ro}
                   onClick={() => { setRoleFilter(ro as any); setCurrentPage(1); }}
                   className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${
                     roleFilter === ro 
                       ? 'bg-slate-900 text-white' 
                       : 'text-slate-500 hover:bg-white'
                   }`}
                 >
                   {ro === 'all' ? 'Tous' : ro}
                 </button>
               ))}
             </div>
           </div>
        </div>

        {/* Export and items per page selector */}
        <div className="flex items-center justify-between border-t pt-4 text-xs font-bold text-slate-500">
          <div className="flex items-center gap-3">
            <span>Affichage de {indexOfFirstRow + 1} à {Math.min(indexOfLastRow, totalItems)} sur {totalItems} membres</span>
            <select 
              value={itemsPerPage} 
              onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} 
              className="bg-slate-100 border border-slate-200 rounded-lg p-1 text-xs text-slate-800"
            >
              <option value={15}>15 par page</option>
              <option value={30}>30 par page</option>
              <option value={50}>50 par page</option>
            </select>
          </div>
          <button 
            onClick={() => handleExportCSV(false)}
            disabled={exporting}
            className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2"
          >
            {exporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
            Exporter CSV
          </button>
        </div>
      </div>

      {/* Bulk action floating panel */}
      {selectedIds.length > 0 && (
        <div className="bg-slate-900 text-white px-8 py-5 rounded-[24px] flex flex-col sm:flex-row items-center justify-between shadow-xl shadow-slate-900/10 animate-in slide-in-from-top-4 duration-300 gap-4">
          <div className="flex items-center gap-2">
            <CheckSquare size={18} className="text-blue-400" />
            <span className="text-xs font-black uppercase tracking-widest">{selectedIds.length} membres sélectionnés</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowBulkPenaltyModal(true)} className="px-4 py-2 bg-amber-500 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-wider">Appliquer Pénalité</button>
            <button onClick={() => setShowBulkDeleteConfirm(true)} className="px-4 py-2 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider">Retirer</button>
            <button onClick={() => handleExportCSV(true)} className="px-4 py-2 bg-white/10 text-white hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-wider">Exporter sélection</button>
            <button onClick={() => setSelectedIds([])} className="px-4 py-2 bg-slate-800 text-slate-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider">Annuler</button>
          </div>
        </div>
      )}

      {/* Main Table layout */}
      <div className="bg-white rounded-[32px] md:rounded-[56px] border border-slate-100 shadow-sm overflow-hidden">
        {error ? (
          <div className="p-16 text-center space-y-4">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle size={28} />
            </div>
            <p className="font-bold text-slate-800">{error}</p>
            <button onClick={() => loadMembers()} className="px-6 py-2.5 bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-blue-600 transition-all">Réessayer</button>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left min-w-[900px]">
               <caption className="sr-only">Liste des membres et informations de cotisations</caption>
               <thead className="bg-[#F8FAFC] text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                  <tr>
                     <th scope="col" className="px-6 py-6 w-12 text-center">
                       <input 
                         type="checkbox" 
                         aria-label="Sélectionner tous les membres"
                         checked={currentMembers.length > 0 && selectedIds.length === currentMembers.length}
                         onChange={(e) => handleSelectAll(e.target.checked)}
                         className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                       />
                     </th>
                     <th scope="col" className="px-6 py-6 cursor-pointer hover:text-slate-900 transition-colors" onClick={() => handleSort('name')}>
                       <div className="flex items-center gap-1">
                         <span>Membre</span>
                         <ArrowUpDown size={10} />
                       </div>
                     </th>
                     <th scope="col" className="px-8 py-6 cursor-pointer hover:text-slate-900 transition-colors" onClick={() => handleSort('status')}>
                       <div className="flex items-center gap-1">
                         <span>Statut</span>
                         <ArrowUpDown size={10} />
                       </div>
                     </th>
                     <th scope="col" className="px-8 py-6 text-right cursor-pointer hover:text-slate-900 transition-colors" onClick={() => handleSort('penalties')}>
                       <div className="flex items-center gap-1 justify-end">
                         <span>Pénalités</span>
                         <ArrowUpDown size={10} />
                       </div>
                     </th>
                     <th scope="col" className="px-8 py-6 text-right cursor-pointer hover:text-slate-900 transition-colors" onClick={() => handleSort('contribution')}>
                       <div className="flex items-center gap-1 justify-end">
                         <span>Contribution</span>
                         <ArrowUpDown size={10} />
                       </div>
                     </th>
                     <th scope="col" className="px-12 py-6 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    [...Array(6)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-6 text-center"><div className="w-4 h-4 bg-slate-100 rounded mx-auto" /></td>
                        <td className="px-6 py-6">
                          <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-[18px] bg-slate-100 flex-shrink-0" />
                            <div className="space-y-2 flex-1">
                              <div className="h-4 bg-slate-100 rounded w-28" />
                              <div className="h-3 bg-slate-100 rounded w-40" />
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6"><div className="w-20 h-6 bg-slate-100 rounded-full" /></td>
                        <td className="px-8 py-6 text-right"><div className="w-16 h-4 bg-slate-100 rounded ml-auto" /></td>
                        <td className="px-8 py-6 text-right"><div className="w-20 h-4 bg-slate-100 rounded ml-auto" /></td>
                        <td className="px-12 py-6 text-right">
                          <div className="flex gap-2 justify-end">
                            <div className="w-9 h-9 bg-slate-100 rounded-xl" />
                            <div className="w-9 h-9 bg-slate-100 rounded-xl" />
                            <div className="w-9 h-9 bg-slate-100 rounded-xl" />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : currentMembers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center italic text-slate-400">
                        Aucun membre trouvé pour "{searchQuery}".
                      </td>
                    </tr>
                  ) : currentMembers.map((m) => {
                    const isExpanded = expandedRowId === m.id;
                    const isSelected = selectedIds.includes(m.id);
                    return (
                      <React.Fragment key={m.id}>
                        <tr className={`hover:bg-slate-50/50 transition-all group ${isExpanded ? 'bg-slate-50/20' : ''} ${isSelected ? 'bg-blue-50/10' : ''}`}>
                           <td className="px-6 py-6 text-center">
                             <input 
                               type="checkbox" 
                               aria-label={`Sélectionner ${m.name}`}
                               checked={isSelected}
                               onChange={(e) => handleSelectRow(m.id, e.target.checked)}
                               className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                             />
                           </td>
                           <td className="px-6 py-6 cursor-pointer" onClick={() => setExpandedRowId(isExpanded ? null : m.id)}>
                              <div className="flex items-center gap-5">
                                 <div className="w-12 h-12 rounded-[18px] bg-white border border-slate-100 shadow-sm flex items-center justify-center font-black text-base transition-all group-hover:bg-slate-900 group-hover:text-white group-hover:scale-110 flex-shrink-0">
                                    {m.name?.charAt(0)}
                                 </div>
                                 <div>
                                    <p className="font-black text-slate-900 text-base leading-none mb-1 tracking-tight">
                                      {highlightText(m.name, searchQuery)}
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-400 italic">
                                      {highlightText(m.phone || 'Pas de tél.', searchQuery)} • Rôle : {m.role === 'admin' ? '👑 Admin' : 'Membre'}
                                    </p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <span className={`flex items-center gap-1.5 text-[9px] font-black px-3 py-1 rounded-full w-fit uppercase tracking-tighter border ${
                                m.status === 'absent' 
                                  ? 'text-rose-600 bg-rose-50 border-rose-100' 
                                  : m.status === 'suspended'
                                  ? 'text-red-800 bg-red-100 border-red-200 font-extrabold'
                                  : 'text-emerald-600 bg-emerald-50 border-emerald-100'
                              }`}>
                                 <CheckCircle size={10} /> {m.status || 'actif'}
                              </span>
                           </td>
                           <td className="px-8 py-6 text-right font-black text-rose-500 text-sm">
                              {Number(m.total_penalties || 0).toLocaleString()} <small className="text-[8px] opacity-40">FCFA</small>
                           </td>
                           <td className="px-8 py-6 text-right font-black text-slate-900 text-base italic">{Number(m.total_contribution || 0).toLocaleString()} <small className="text-[10px] text-slate-300 font-normal opacity-50">FCFA</small></td>
                           <td className="px-12 py-6 text-right">
                              <div className="flex items-center justify-end gap-2 opacity-30 group-hover:opacity-100 transition-opacity">
                                 <button onClick={() => { setSelectedMember(m); setPenaltyAmount('1000'); setPenaltyReason(''); setShowPenaltyModal(true); }} title="Pénalité" aria-label="Pénalité" className="p-2.5 bg-white text-slate-400 hover:text-amber-600 border border-slate-100 rounded-xl shadow-sm hover:scale-110 transition-all focus-visible:ring-2"><AlertTriangle size={16} /></button>
                                 <button onClick={() => { setSelectedMember(m); setEditForm({ name: m.name || '', phone: m.phone || '', role: m.role || 'member' }); setShowEditModal(true); }} title="Modifier" aria-label="Modifier" className="p-2.5 bg-white text-slate-400 hover:text-blue-600 border border-slate-100 rounded-xl shadow-sm hover:scale-110 transition-all focus-visible:ring-2"><Edit3 size={16} /></button>
                                 
                                 {/* Status quick switcher dropdown */}
                                 <select 
                                   value={m.status || 'active'} 
                                   aria-label="Changer le statut"
                                   onChange={(e) => handleStatusChangeClick(m, e.target.value as any)}
                                   className="p-1.5 bg-white border border-slate-100 rounded-lg text-[9px] font-black text-slate-500 focus:outline-none"
                                 >
                                   <option value="active">Actif</option>
                                   <option value="absent">Absent</option>
                                   <option value="suspended">Suspendu</option>
                                 </select>

                                 <button onClick={() => { setSelectedMember(m); setShowDeleteConfirm(true); }} title="Retirer" aria-label="Retirer" className="p-2.5 bg-white text-slate-400 hover:text-rose-600 border border-slate-100 rounded-xl shadow-sm hover:scale-110 transition-all focus-visible:ring-2"><Trash2 size={16} /></button>
                              </div>
                           </td>
                        </tr>

                        {/* Collapsed detailed row display */}
                        {isExpanded && (
                          <tr className="bg-slate-50/50">
                            <td colSpan={6} className="px-12 py-6 border-b">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs text-slate-600 animate-in slide-in-from-top-2 duration-300">
                                <div>
                                  <p className="font-black uppercase text-[10px] text-slate-400 tracking-wider">Date d'adhésion</p>
                                  <p className="font-bold text-slate-900 mt-1">{new Date(m.created_at || tontine.created_at).toLocaleDateString('fr-FR')}</p>
                                </div>
                                <div>
                                  <p className="font-black uppercase text-[10px] text-slate-400 tracking-wider">Dernier paiement</p>
                                  <p className="font-bold text-slate-900 mt-1">{m.last_payment_date ? new Date(m.last_payment_date).toLocaleDateString('fr-FR') : 'Aucun paiement enregistré'}</p>
                                </div>
                                <div>
                                  <p className="font-black uppercase text-[10px] text-slate-400 tracking-wider">Code utilisé</p>
                                  <p className="font-bold text-slate-900 mt-1">{m.tontine_invite_code || tontine.join_code || 'Direct'}</p>
                                </div>
                                <div>
                                  <p className="font-black uppercase text-[10px] text-slate-400 tracking-wider">Cycles complets</p>
                                  <p className="font-bold text-slate-900 mt-1">{m.cycles_participated || 1} cycle(s)</p>
                                </div>
                              </div>
                              
                              <div className="mt-4 flex items-center justify-between border-t pt-4">
                                <a 
                                  href="/history" 
                                  onClick={(e) => { e.preventDefault(); navigate('/admin/dashboard#history'); }} 
                                  className="text-blue-600 hover:underline font-black uppercase text-[10px] tracking-wider"
                                >
                                  Voir l'historique complet
                                </a>
                                
                                {m.total_penalties > 0 && (
                                  <button 
                                    onClick={() => handleWaivePenalty(m, m.total_penalties)}
                                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-lg text-[9px] font-black uppercase transition-all"
                                  >
                                    Waive/Annuler Pénalités ({Number(m.total_penalties).toLocaleString()} FCFA)
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
               </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="px-12 py-6 border-t bg-slate-50/20 flex items-center justify-between">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white border rounded-xl text-xs font-black uppercase disabled:opacity-50"
            >
              Précédent
            </button>
            <div className="flex gap-2">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${
                    currentPage === i + 1 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white border text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-white border rounded-xl text-xs font-black uppercase disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        )}
      </div>

      {/* Invitations and pending tracking */}
      <div className="mt-8 p-6 bg-slate-50 rounded-3xl border border-slate-100">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-4 flex items-center gap-2">
          <Key size={14} className="text-blue-500" /> Invitations & Accès indirects
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-white p-4 rounded-xl border border-slate-100">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Code de liaison actif</p>
            <p className="text-sm font-black text-slate-900 mt-1">{tontine.join_code || 'Aucun code'}</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Utilisé par {members.filter(m => m.tontine_invite_code).length} membres</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Membres invités en attente</p>
            <p className="text-slate-900 mt-1 font-bold">Aucune inscription indirecte en attente d'activation</p>
          </div>
        </div>
      </div>

      {/* Modals definition */}
      {/* Add Member Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Nouvel Ajout Membre">
        <div className="space-y-4">
          <p className="text-xs text-slate-500 italic">Ajouter un membre avec son nom et son numéro de téléphone. Il pourra ensuite activer son compte.</p>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Nom Complet</label>
            <input 
              type="text" 
              value={addForm.name} 
              onChange={e => { setAddForm(f => ({ ...f, name: e.target.value })); validateAddName(e.target.value); }} 
              placeholder="Ex: Jean Dupont" 
              className={`w-full h-14 px-5 bg-slate-50 border rounded-2xl text-sm font-bold outline-none focus:ring-2 transition-all ${
                addNameError ? 'border-rose-500 focus:ring-rose-200' : addForm.name ? 'border-emerald-500 focus:ring-emerald-200' : 'border-slate-200 focus:ring-blue-200'
              }`} 
            />
            {addNameError && <p className="text-[10px] text-rose-500 mt-1 font-bold">{addNameError}</p>}
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Numéro de Téléphone</label>
            <input 
              type="text" 
              value={addForm.phone} 
              onChange={e => { setAddForm(f => ({ ...f, phone: e.target.value })); validateAddPhone(e.target.value); }} 
              placeholder="Ex: +221770000000 ou +237..." 
              className={`w-full h-14 px-5 bg-slate-50 border rounded-2xl text-sm font-bold outline-none focus:ring-2 transition-all ${
                addPhoneError ? 'border-rose-500 focus:ring-rose-200' : addForm.phone ? 'border-emerald-500 focus:ring-emerald-200' : 'border-slate-200 focus:ring-blue-200'
              }`} 
            />
            {addPhoneError && <p className="text-[10px] text-rose-500 mt-1 font-bold">{addPhoneError}</p>}
          </div>
          <button 
            onClick={handleAddSubmit} 
            disabled={submitting || !addForm.name || !addForm.phone || !!addNameError || !!addPhoneError} 
            className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} Confirmer l'Ajout
          </button>
        </div>
      </Modal>

      {/* Edit Member Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={`Modifier : ${selectedMember?.name}`}>
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Nom complet</label>
            <input 
              type="text" 
              value={editForm.name} 
              onChange={e => { setEditForm(f => ({ ...f, name: e.target.value })); validateEditName(e.target.value); }} 
              className={`w-full h-14 px-5 bg-slate-50 border rounded-2xl text-sm font-bold outline-none focus:ring-2 transition-all ${
                editNameError ? 'border-rose-500 focus:ring-rose-200' : editForm.name ? 'border-emerald-500 focus:ring-emerald-200' : 'border-slate-200 focus:ring-blue-200'
              }`} 
            />
            {editNameError && <p className="text-[10px] text-rose-500 mt-1 font-bold">{editNameError}</p>}
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Téléphone</label>
            <input 
              type="text" 
              value={editForm.phone} 
              onChange={e => { setEditForm(f => ({ ...f, phone: e.target.value })); validateEditPhone(e.target.value); }} 
              className={`w-full h-14 px-5 bg-slate-50 border rounded-2xl text-sm font-bold outline-none focus:ring-2 transition-all ${
                editPhoneError ? 'border-rose-500 focus:ring-rose-200' : editForm.phone ? 'border-emerald-500 focus:ring-emerald-200' : 'border-slate-200 focus:ring-blue-200'
              }`} 
            />
            {editPhoneError && <p className="text-[10px] text-rose-500 mt-1 font-bold">{editPhoneError}</p>}
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Rôle</label>
            <select value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))} className="w-full h-14 px-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-200">
              <option value="member">Membre</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>
          <button 
            onClick={handleEditSubmit} 
            disabled={submitting || !!editNameError || !!editPhoneError} 
            className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />} Sauvegarder
          </button>
        </div>
      </Modal>

      {/* Penalty Modal */}
      <Modal isOpen={showPenaltyModal} onClose={() => setShowPenaltyModal(false)} title={`Pénalité : ${selectedMember?.name}`}>
        <div className="space-y-4 text-left">
          <p className="text-sm text-slate-500">Appliquer une pénalité financière à <strong>{selectedMember?.name}</strong>.</p>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Montant (FCFA)</label>
            <input type="number" value={penaltyAmount} onChange={e => setPenaltyAmount(e.target.value)} className="w-full h-14 px-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-amber-200" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Raison de la pénalité</label>
            <input type="text" placeholder="Ex: Retard de cotisation" value={penaltyReason} onChange={e => setPenaltyReason(e.target.value)} className="w-full h-14 px-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-amber-200" />
          </div>
          <button onClick={handlePenalty} disabled={submitting || !penaltyReason} className="w-full py-5 bg-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-amber-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <AlertTriangle size={18} />} Appliquer la Pénalité
          </button>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Confirmer la Suppression">
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto"><Trash2 size={28} className="text-rose-500" /></div>
          <p className="text-sm text-slate-600">Êtes-vous sûr de vouloir retirer <strong className="text-slate-900">{selectedMember?.name}</strong> du cercle ? Cette action est irréversible.</p>
          <div className="flex gap-4">
            <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Annuler</button>
            <button onClick={handleDelete} disabled={submitting} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-rose-700 transition-all disabled:opacity-50">
              {submitting ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Confirmer'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Status Confirm Modal */}
      <Modal isOpen={showStatusConfirmModal} onClose={() => setShowStatusConfirmModal(false)} title="Confirmer changement de statut">
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto">
            <Info size={28} />
          </div>
          <p className="text-sm text-slate-600">Modifier le statut de <strong className="text-slate-900">{selectedMember?.name}</strong> pour : <strong className="text-blue-600">{statusToChange?.toUpperCase()}</strong> ?</p>
          <div className="flex gap-4">
            <button onClick={() => setShowStatusConfirmModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Annuler</button>
            <button onClick={confirmStatusChange} disabled={submitting} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all disabled:opacity-50">
              {submitting ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Sauvegarder'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Bulk Penalty Modal */}
      <Modal isOpen={showBulkPenaltyModal} onClose={() => setShowBulkPenaltyModal(false)} title="Appliquer pénalités en masse">
        <div className="space-y-4 text-left">
          <p className="text-sm text-slate-500">Une pénalité sera appliquée individuellement à chacun des <strong>{selectedIds.length}</strong> membres sélectionnés.</p>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Montant (FCFA)</label>
            <input type="number" value={bulkPenaltyAmount} onChange={e => setBulkPenaltyAmount(e.target.value)} className="w-full h-14 px-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Raison</label>
            <input type="text" placeholder="Ex: Non-respect des règles" value={bulkPenaltyReason} onChange={e => setBulkPenaltyReason(e.target.value)} className="w-full h-14 px-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2" />
          </div>
          <button onClick={handleBulkPenalty} disabled={submitting || !bulkPenaltyReason} className="w-full py-5 bg-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 disabled:opacity-50">
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <AlertTriangle size={18} />} Confirmer l'application en masse
          </button>
        </div>
      </Modal>

      {/* Bulk Delete Confirm Modal */}
      <Modal isOpen={showBulkDeleteConfirm} onClose={() => setShowBulkDeleteConfirm(false)} title="Retrait en masse">
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
            <Trash2 size={28} />
          </div>
          <p className="text-sm text-slate-600">Voulez-vous retirer les <strong>{selectedIds.length}</strong> membres sélectionnés de ce cercle ?</p>
          <div className="flex gap-4">
            <button onClick={() => setShowBulkDeleteConfirm(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Annuler</button>
            <button onClick={handleBulkDelete} disabled={submitting} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 disabled:opacity-50">
              {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Retirer'}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );

  function validateAddName(val: string) {
    if (val.trim().length < 3) setAddNameError("Au moins 3 lettres.");
    else setAddNameError("");
  }
  function validateAddPhone(val: string) {
    if (!validatePhoneStr(val)) setAddPhoneError("Numéro invalide (+237 ou +221)");
    else setAddPhoneError("");
  }
  function validateEditName(val: string) {
    if (val.trim().length < 3) setEditNameError("Au moins 3 lettres.");
    else setEditNameError("");
  }
  function validateEditPhone(val: string) {
    if (!validatePhoneStr(val)) setEditPhoneError("Numéro invalide (+237 ou +221)");
    else setEditPhoneError("");
  }
};

// --- Custom View Components for missing sections ---

// History Section View
const AdminHistoryView = ({ tontine }: { tontine: any }) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!tontine) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await transactionService.getByTontine(tontine.id);
        setTransactions(Array.isArray(res) ? res : (res.data || []));
      } catch (err) {
        errorLoggingService.logError(err, 'AdminHistoryView.load');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tontine]);

  const filtered = transactions.filter(t => 
    t.description?.toLowerCase().includes(search.toLowerCase()) ||
    t.user_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight italic">Journal Audit Historique</h2>
        <p className="text-sm text-slate-500">Toutes les opérations comptables enregistrées pour le groupe {tontine?.name}</p>
      </div>
      <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
        <input 
          type="text" 
          placeholder="Rechercher une transaction..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          className="w-full max-w-md h-12 px-4 border border-slate-200 rounded-xl text-xs mb-6 font-bold"
        />
        {loading ? (
          <div className="py-10 text-center animate-pulse text-slate-400">Chargement des transactions...</div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-slate-400 font-bold">Aucune transaction trouvée.</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map(t => (
              <div key={t.id} className="py-4 flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-slate-900">{t.description || (t.type === 'contribution' ? 'Cotisation' : 'Versement')}</p>
                  <p className="text-slate-400 font-bold uppercase text-[9px] mt-0.5">{new Date(t.transaction_date).toLocaleDateString()} • Par {t.user_name}</p>
                </div>
                <div className="text-right">
                  <p className={`font-black ${t.type === 'payout' ? 'text-emerald-600' : 'text-slate-900'}`}>{t.type === 'payout' ? '+' : '-'}{Number(t.amount).toLocaleString()} FCFA</p>
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${t.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{t.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Alerts Section View
const AdminAlertsView = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await notificationService.getNotifications();
      setAlerts(Array.isArray(res) ? res : (res.data || []));
    } catch (err) {
      errorLoggingService.logError(err, 'AdminAlertsView.load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      toast.success("Alerte marquée comme lue.");
      load();
    } catch {
      toast.error("Erreur de mise à jour.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationService.deleteNotification(id);
      toast.success("Alerte supprimée.");
      load();
    } catch {
      toast.error("Erreur de suppression.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight italic">Journal des alertes</h2>
        <p className="text-sm text-slate-500">Prenez note et gérez les anomalies importantes signalées par le système.</p>
      </div>
      <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
        {loading ? (
          <div className="py-10 text-center animate-pulse text-slate-400">Chargement...</div>
        ) : alerts.length === 0 ? (
          <div className="py-10 text-center text-slate-400 font-bold">Aucune alerte en attente.</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {alerts.map(a => (
              <div key={a.id} className={`py-5 flex justify-between items-center gap-4 ${!a.is_read ? 'bg-blue-50/20 px-2 rounded-xl' : ''}`}>
                <div>
                  <p className={`text-xs ${!a.is_read ? 'font-black text-slate-950' : 'font-medium text-slate-600'}`}>{a.message || a.content}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{new Date(a.created_at).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  {!a.is_read && (
                    <button onClick={() => handleMarkRead(a.id)} className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg hover:bg-blue-100">Marquer lu</button>
                  )}
                  <button onClick={() => handleDelete(a.id)} className="px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-black rounded-lg hover:bg-rose-100">Supprimer</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Settings Section View
const AdminSettingsView = () => {
  const [autoCycles, setAutoCycles] = useState(true);
  const [currency, setCurrency] = useState('FCFA');
  const [emailAlerts, setEmailAlerts] = useState(true);

  const handleSave = () => {
    toast.success("Configurations générales enregistrées !");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight italic">Paramètres de la Console</h2>
        <p className="text-sm text-slate-500">Configurez les constantes administratives globales de vos tontines.</p>
      </div>
      <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-slate-900">Cycles Automatiques</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Autoriser le système à boucler les cycles</p>
          </div>
          <input type="checkbox" checked={autoCycles} onChange={e => setAutoCycles(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-blue-600 cursor-pointer" />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-slate-900">Devise de la Tontine</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Devise comptable par défaut</p>
          </div>
          <select value={currency} onChange={e => setCurrency(e.target.value)} className="h-10 px-4 border border-slate-200 rounded-lg text-xs font-bold bg-white">
            <option value="FCFA">FCFA (XOF)</option>
            <option value="EUR">Euro (€)</option>
            <option value="USD">Dollar ($)</option>
          </select>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-slate-900">Notifications Transactionnelles</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Diffuser les courriels après vérifications</p>
          </div>
          <input type="checkbox" checked={emailAlerts} onChange={e => setEmailAlerts(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-blue-600 cursor-pointer" />
        </div>
        <button onClick={handleSave} className="px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all">Enregistrer</button>
      </div>
    </div>
  );
};

// Section transition wrapper
const SectionTransition = ({ children }: { children: React.ReactNode }) => (
  <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out fill-mode-both min-h-[500px]">
    {children}
  </div>
);

// Content area skeleton during initial data loading
const DashboardSkeleton = () => (
  <div className="space-y-10 animate-pulse">
    <div className="h-28 bg-white/50 rounded-[32px] border border-white" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm h-36 flex flex-col justify-between">
          <div className="w-10 h-10 bg-slate-100 rounded-xl" />
          <div className="h-6 bg-slate-100 rounded w-24" />
          <div className="h-3 bg-slate-100 rounded w-16" />
        </div>
      ))}
    </div>
    <div className="bg-white rounded-[56px] border border-slate-100 p-8 space-y-4">
      <div className="h-8 bg-slate-100 rounded w-48" />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-16 bg-slate-50 rounded-2xl" />
      ))}
    </div>
  </div>
);

// --- Main Admin Dashboard Wrapper Component ---
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const [tontines, setTontines] = useState<any[]>([]);
  const [selectedTontineId, setSelectedTontineId] = useState<string>('');
  
  const [loading, setLoading] = useState(true);
  const [switchingTontine, setSwitchingTontine] = useState(false);

  // Advanced Error boundaries
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'network' | 'server' | 'empty' | null>(null);
  const [errorDetails, setErrorDetails] = useState<string>('');
  
  const [stats, setStats] = useState<any>({ totalTontines: 0, totalMembers: 0, totalCapital: 0 });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setErrorType(null);
      setErrorDetails('');
      
      const res = await tontineService.getUserTontines();
      const allTontines = Array.isArray(res) ? res : (res.data || []);
      
      if (allTontines.length === 0) {
        setErrorType('empty');
        setError("Aucune tontine trouvée. Veuillez d'abord créer ou rejoindre un groupe.");
        setTontines([]);
        return;
      }
      
      setTontines(allTontines);

      // Restore active tontine selection from query params
      const params = new URLSearchParams(window.location.search);
      const urlTontineId = params.get('tontine');
      
      if (urlTontineId && allTontines.some(t => t.id.toString() === urlTontineId)) {
        setSelectedTontineId(urlTontineId);
      } else {
        setSelectedTontineId(allTontines[0].id.toString());
      }

      // Calculate global dashboard statistics
      const totalBalance = allTontines.reduce((acc, t) => acc + (Number(t.balance || t.total_balance || 0)), 0);
      const totalMembers = allTontines.reduce((acc, t) => acc + (Number(t.members_count || t.current_members || 0)), 0);
      
      setStats({
        totalTontines: allTontines.length,
        totalMembers: totalMembers,
        totalCapital: totalBalance 
      });
    } catch (err: any) {
      errorLoggingService.logError(err, 'AdminDashboard.loadData');
      setErrorDetails(err.stack || err.message || JSON.stringify(err));
      
      if (!window.navigator.onLine) {
        setErrorType('network');
        setError("Erreur Réseau : Vérifiez votre connexion internet.");
      } else if (err.response && err.response.status >= 500) {
        setErrorType('server');
        setError("Erreur Serveur (500) : Problème interne rencontré par le serveur.");
      } else {
        setErrorType('server');
        setError("Erreur de communication avec l'API centrale.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    loadData(); 
  }, [loadData]);

  // Sync selected section with URL hash parameter
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && ['overview', 'members', 'contributions', 'history', 'alerts', 'settings', 'cycle', 'draw'].some(s => hash.startsWith(s))) {
      setActiveSection(hash);
    }
  }, []);

  const handleTontineChange = (id: string) => {
    if (!id || !tontines.some(t => t.id.toString() === id)) {
      toast.error("Cercle de tontine invalide.");
      return;
    }
    
    setSwitchingTontine(true);
    setSelectedTontineId(id);
    
    // Persist active tontine selector in the URL parameters
    const params = new URLSearchParams(window.location.search);
    params.set('tontine', id);
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}${window.location.hash}`);
    
    setTimeout(() => {
      setSwitchingTontine(false);
    }, 400);
  };

  const selectedTontine = tontines.find(t => t.id.toString() === selectedTontineId);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row">
      {/* Sidebar - Always visible during layout loaders */}
      <AdminSidebar 
        activeSection={activeSection} 
        setActiveSection={(sec) => {
          setActiveSection(sec);
          window.location.hash = sec;
        }} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onCollapseChange={setIsSidebarCollapsed}
      />
      
      {/* Mobile Top Navigation Header */}
      <div className="lg:hidden h-20 bg-white border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Shield className="text-blue-600" size={24} />
          <h1 className="font-black text-slate-900 tracking-tight">Console Admin</h1>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-3 bg-blue-50 text-blue-600 rounded-xl active:scale-90 transition-all"
        >
          <Menu size={20} />
        </button>
      </div>
      
      {/* Main Content Pane */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-24' : 'lg:ml-72'} p-6 md:p-12 min-h-screen relative`}>
        {loading && activeSection !== 'overview' ? (
          <DashboardSkeleton />
        ) : error && activeSection !== 'overview' ? (
          <div className="h-full flex flex-col justify-center items-center text-center space-y-6 max-w-xl mx-auto py-20 animate-in fade-in duration-500">
             <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center">
                <AlertTriangle size={48} />
             </div>
             <h2 className="text-2xl font-black text-slate-900">{error}</h2>
             <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
               {errorType === 'network' ? 'Connexion réseau perdue' : errorType === 'empty' ? 'Aucune tontine active' : 'Erreur fatale du serveur'}
             </p>
             
             {errorDetails && (
               <div className="w-full border border-slate-100 rounded-2xl overflow-hidden bg-white text-left text-xs font-mono p-4">
                 <details className="group cursor-pointer">
                   <summary className="font-bold text-slate-600 select-none flex justify-between items-center">
                     <span>Détails techniques (Débogage)</span>
                     <ChevronDown size={14} className="group-open:rotate-180 transition-all text-slate-400" />
                   </summary>
                   <pre className="mt-4 p-3 bg-slate-50 rounded-lg text-[10px] text-rose-600 overflow-x-auto whitespace-pre-wrap">
                     {errorDetails}
                   </pre>
                 </details>
               </div>
             )}

             <div className="flex gap-4 w-full">
               <button onClick={loadData} className="flex-1 py-4 bg-slate-900 hover:bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all">Réessayer</button>
               <a href="mailto:support@tontinepro.com?subject=Anomalie Console Admin" className="flex-1 py-4 bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 rounded-2xl font-black text-xs uppercase tracking-widest transition-all text-center flex items-center justify-center">Contacter le support</a>
             </div>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Global Context Selector Header with z-index control & fallbacks */}
            <div className="flex flex-col md:flex-row md:items-center justify-between bg-white bg-opacity-80 backdrop-filter backdrop-blur-md p-6 rounded-[32px] border border-white shadow-xl shadow-slate-200/50 sticky top-4 lg:top-10 z-20 gap-6 transition-all">
              <div>
                 <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600 mb-1 italic">Tontinepro Admin Console</h3>
                 <p className="text-slate-400 text-xs font-bold uppercase tracking-widest px-1">Navigation / <span className="text-slate-900">{activeSection}</span></p>
              </div>
              <div className="flex items-center gap-3 bg-slate-50 p-2.5 px-6 rounded-full border border-slate-100 group hover:border-blue-200 transition-all self-start md:self-auto relative">
                {switchingTontine && (
                  <Loader2 size={12} className="animate-spin text-blue-600 absolute left-2" />
                )}
                <span className="hidden sm:inline text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Cercle Actif :</span>
                {loading ? (
                  <div className="w-24 h-4 bg-slate-200 rounded animate-pulse" />
                ) : (
                  <select 
                    value={selectedTontineId}
                    onChange={(e) => handleTontineChange(e.target.value)}
                    className="bg-transparent font-black text-xs text-blue-700 outline-none cursor-pointer focus:ring-0 appearance-none min-w-[150px]"
                  >
                    {tontines.map(t => (
                      <option key={t.id} value={t.id.toString()}>{t.name}</option>
                    ))}
                  </select>
                )}
                <ChevronDown size={14} className="text-slate-300 group-hover:text-blue-500 transition-all" />
              </div>
            </div>

            {/* Content Area wrapped inside SectionTransition */}
            <SectionTransition>
              {activeSection === 'overview' && (
                <DashboardOverview 
                  stats={stats} 
                  tontines={tontines} 
                  loading={loading}
                  error={error}
                  onRetry={loadData}
                  onNavigateToSection={(section, tontineId) => {
                    if (tontineId) {
                      handleTontineChange(tontineId);
                    }
                    setActiveSection(section);
                    window.location.hash = section;
                  }}
                />
              )}
              {activeSection === 'members' && selectedTontine && <MembersManagement tontine={selectedTontine} />}
              {activeSection === 'contributions' && <CotisationsManagement tontines={tontines} />}
              {activeSection === 'history' && selectedTontine && <AdminHistoryView tontine={selectedTontine} />}
              {activeSection === 'alerts' && <AdminAlertsView />}
              {activeSection === 'settings' && <AdminSettingsView />}
              {activeSection === 'cycle' && <CycleManagement tontines={tontines} />}
              {activeSection.startsWith('finance') && <FinanceManager tontines={tontines} />}
              
              {activeSection === 'draw' && (
                 <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
                        <Package size={24} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-slate-900 italic">Espace Tirage</h2>
                        <p className="text-sm text-slate-500">Lancez et gérez les ordres de passage des membres.</p>
                      </div>
                    </div>

                    {tontines.length === 0 ? (
                      <div className="bg-white rounded-[40px] p-12 text-center border border-slate-100">
                        <Package size={40} className="text-slate-300 mx-auto mb-4" />
                        <p className="text-sm font-bold text-slate-500">Aucune tontine disponible pour le tirage au sort.</p>
                      </div>
                    ) : (
                      <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm">
                        <table className="w-full">
                          <caption className="sr-only">Tontines éligibles pour tirages</caption>
                          <thead className="bg-slate-50/50">
                            <tr>
                              <th scope="col" className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Tontine</th>
                              <th scope="col" className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Mode</th>
                              <th scope="col" className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Participation</th>
                              <th scope="col" className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Statut</th>
                              <th scope="col" className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {tontines.map(t => (
                              <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-8 py-6">
                                  <div className="flex items-center gap-4">
                                    <span className="text-2xl">{t.emoji || '🎲'}</span>
                                    <span className="font-bold text-slate-900">{t.name}</span>
                                  </div>
                                </td>
                                <td className="px-8 py-6">
                                  <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black uppercase text-slate-500">{t.draw_mode || 'Auto'}</span>
                                </td>
                                <td className="px-8 py-6">
                                  <p className="text-sm font-bold text-slate-700">{t.current_members || t.members_count || 0} membres</p>
                                </td>
                                <td className="px-8 py-6">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${t.draw_status === 'completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                    {t.draw_status === 'completed' ? 'complété' : 'en attente'}
                                  </span>
                                </td>
                                <td className="px-8 py-6 text-right">
                                  <button 
                                    onClick={() => navigate(`/tontine/${t.id}/draw`)}
                                    className="px-6 py-2 bg-[#C9A84C] text-[#1B4332] rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all"
                                  >
                                    Gérer le Tirage
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                 </div>
               )}
              
              {!['overview', 'members', 'contributions', 'history', 'alerts', 'settings', 'cycle', 'draw', 'finance'].includes(activeSection) && !activeSection.startsWith('finance-') && (
                <div className="flex flex-col items-center justify-center h-full text-slate-200 py-20 grayscale opacity-20">
                   <Shield size={120} strokeWidth={0.5} />
                   <h2 className="text-6xl font-black uppercase italic tracking-tighter mt-10">Restricted</h2>
                   <p className="font-bold text-slate-400 mt-4 uppercase tracking-[0.5em] text-[8px]">Ce module sera disponible dans une prochaine mise à jour.</p>
                </div>
              )}
            </SectionTransition>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
