import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, UserPlus, Search, Phone, Mail, 
  Trash2, Edit3, CheckCircle, AlertTriangle, 
  XCircle, Hash, Copy, Shield, ChevronDown, 
  ChevronUp, RefreshCw, X, ArrowUp, ArrowDown, 
  ArrowUpDown, Check, FileSpreadsheet, Plus, HelpCircle,
  Loader2
} from 'lucide-react';
import { tontineService, invitationService } from '@/services/api';
import { toast } from 'react-toastify';

interface MemberListProps {
  tontines: any[];
}

const MemberList = ({ tontines }: MemberListProps) => {
  const [selectedTontineId, setSelectedTontineId] = useState<string>('');
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllTontines, setShowAllTontines] = useState(false);

  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [sortField, setSortField] = useState<'name' | 'role' | 'status' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Expansion & Bulk Selection
  const [expandedMemberIds, setExpandedMemberIds] = useState<number[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);

  // Time stamp & Auto-Refresh
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Modal States
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'member'>('member');

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<any>(null);

  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusMember, setStatusMember] = useState<any>(null);
  const [statusTarget, setStatusTarget] = useState<string>('active');

  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isBulkStatusOpen, setIsBulkStatusOpen] = useState(false);
  const [bulkStatusTarget, setBulkStatusTarget] = useState<string>('active');

  // Set default tontine ID
  useEffect(() => {
    if (tontines.length > 0 && !selectedTontineId) {
      setSelectedTontineId(String(tontines[0].id));
    }
  }, [tontines, selectedTontineId]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch function
  const fetchMembers = async (isAutoRefresh = false) => {
    if (tontines.length === 0) return;
    if (!isAutoRefresh) setLoading(true);
    setError(null);
    try {
      if (showAllTontines) {
        const results = await Promise.all(
          tontines.map(async (t) => {
            try {
              const res = await tontineService.getTontineMembers(t.id);
              const data = Array.isArray(res) ? res : (res.data || []);
              return data.map((m: any) => ({ ...m, tontineName: t.name, tontineId: t.id }));
            } catch {
              return [];
            }
          })
        );
        setMembers(results.flat());
      } else {
        if (!selectedTontineId) return;
        const res = await tontineService.getTontineMembers(selectedTontineId);
        const data = Array.isArray(res) ? res : (res.data || []);
        setMembers(data);
      }
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 404) {
        setError("La tontine sélectionnée n'existe plus ou a été supprimée.");
      } else {
        setError("Erreur de chargement des membres.");
      }
    } finally {
      if (!isAutoRefresh) setLoading(false);
    }
  };

  // Load data when tontine or switch changes
  useEffect(() => {
    fetchMembers();
  }, [selectedTontineId, showAllTontines]);

  // Auto refresh
  useEffect(() => {
    const timer = setInterval(() => {
      fetchMembers(true);
    }, 60000);
    return () => clearInterval(timer);
  }, [selectedTontineId, showAllTontines]);

  // selectedTontine with consistent type comparison
  const selectedTontine = selectedTontineId 
    ? tontines.find(t => String(t.id) === String(selectedTontineId)) 
    : (tontines[0] || null);

  const handleCopyCode = () => {
    if (selectedTontine?.join_code) {
      navigator.clipboard.writeText(selectedTontine.join_code);
      toast.info('Code copié !');
    }
  };

  const handleCopyLink = () => {
    if (selectedTontine?.join_code) {
      const link = `${window.location.origin}/join?code=${selectedTontine.join_code}`;
      navigator.clipboard.writeText(link);
      toast.info('Lien d\'invitation copié !');
    }
  };

  // Status mapping utility
  const statusMapping: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    active: { label: 'À jour', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', icon: CheckCircle },
    'à jour': { label: 'À jour', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', icon: CheckCircle },
    pending: { label: 'En retard', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100', icon: AlertTriangle },
    'en retard': { label: 'En retard', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100', icon: AlertTriangle },
    absent: { label: 'Absent', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100', icon: XCircle },
    inactive: { label: 'Non payé', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100', icon: AlertTriangle },
    'non payé': { label: 'Non payé', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100', icon: AlertTriangle }
  };

  const getStatusDetails = (statusVal: string) => {
    const normalized = (statusVal || 'active').toLowerCase();
    return statusMapping[normalized] || statusMapping['active'];
  };

  // Dynamic counts calculations
  const getStatusCounts = () => {
    if (loading) return { active: '-', pending: '-', unpaid: '-' };
    let active = 0;
    let pending = 0;
    let unpaid = 0;
    members.forEach(m => {
      const st = (m.status || '').toLowerCase();
      if (st === 'active' || st === 'à jour') {
        active++;
      } else if (st === 'pending' || st === 'en retard') {
        pending++;
      } else if (st === 'inactive' || st === 'non payé' || st === 'absent') {
        unpaid++;
      } else {
        unpaid++; // default fallback
      }
    });
    return { active, pending, unpaid };
  };
  const counts = getStatusCounts();

  // Format Join Date
  const formatJoinDate = (dateStr: string) => {
    if (!dateStr) return 'Membre depuis peu';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Membre depuis peu';
      const month = date.toLocaleDateString('fr-FR', { month: 'long' });
      const year = date.getFullYear();
      const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);
      return `Membre depuis ${capitalizedMonth} ${year}`;
    } catch {
      return 'Membre depuis peu';
    }
  };

  // Search logic
  const filteredMembers = members.filter(m => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      (m.name || '').toLowerCase().includes(term) ||
      (m.phone || '').includes(term) ||
      (m.email || '').toLowerCase().includes(term)
    );
  });

  // Sorting logic
  const handleSort = (field: 'name' | 'role' | 'status') => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedMembers = [...filteredMembers].sort((a, b) => {
    if (!sortField) return 0;
    let valA = a[sortField] || '';
    let valB = b[sortField] || '';
    if (sortField === 'status') {
      valA = getStatusDetails(valA).label;
      valB = getStatusDetails(valB).label;
    }
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination logic
  const totalItems = sortedMembers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedMembers = sortedMembers.slice(startIndex, endIndex);

  // Highlight matches helper
  const highlightText = (text: string, search: string) => {
    if (!search || !search.trim()) return <span>{text}</span>;
    const regex = new RegExp(`(${search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) => 
          regex.test(part) ? (
            <mark key={i} className="bg-yellow-100 text-slate-900 rounded-[2px] px-0.5 font-bold">{part}</mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  // Expand detail toggle
  const toggleExpand = (memberId: number) => {
    setExpandedMemberIds(prev => 
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    );
  };

  const handleKeyDownRow = (e: React.KeyboardEvent, memberId: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleExpand(memberId);
    }
  };

  // Checkbox selection
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const pageIds = paginatedMembers.map(m => m.id);
      setSelectedMemberIds(prev => {
        const union = new Set([...prev, ...pageIds]);
        return Array.from(union);
      });
    } else {
      const pageIds = paginatedMembers.map(m => m.id);
      setSelectedMemberIds(prev => prev.filter(id => !pageIds.includes(id)));
    }
  };

  const handleSelectOne = (memberId: number, checked: boolean) => {
    if (checked) {
      setSelectedMemberIds(prev => [...prev, memberId]);
    } else {
      setSelectedMemberIds(prev => prev.filter(id => id !== memberId));
    }
  };

  const isAllPageSelected = paginatedMembers.length > 0 && paginatedMembers.every(m => selectedMemberIds.includes(m.id));

  // Export CSV
  const handleExportCSV = () => {
    try {
      const tName = showAllTontines ? 'Tous_les_Cercles' : (selectedTontine?.name || 'Cercle');
      const dateStr = new Date().toISOString().slice(0, 10);
      const fileName = `Membres_${tName.replace(/\s+/g, '_')}_${dateStr}.csv`;
      
      const headers = ['Nom', 'Telephone', 'Email', 'Role', 'Statut', 'Date adhésion', 'Total contributions (FCFA)', 'Pénalités (FCFA)', 'Cercle'];
      const rows = filteredMembers.map(m => [
        `"${(m.name || '').replace(/"/g, '""')}"`,
        `"${m.phone || ''}"`,
        `"${m.email || ''}"`,
        `"${m.role || 'member'}"`,
        `"${getStatusDetails(m.status).label}"`,
        `"${m.joined_at ? new Date(m.joined_at).toLocaleDateString('fr-FR') : ''}"`,
        `"${m.total_contribution || 0}"`,
        `"${m.total_penalties || 0}"`,
        `"${(m.tontineName || selectedTontine?.name || '').replace(/"/g, '""')}"`
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
      toast.success('Historique exporté en CSV');
    } catch {
      toast.error('Erreur lors de l\'exportation');
    }
  };

  // Actions
  const openEditModal = (member: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setMemberToEdit(member);
    setEditName(member.name || '');
    setEditPhone(member.phone || '');
    setEditEmail(member.email || '');
    setEditRole(member.role === 'admin' ? 'admin' : 'member');
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberToEdit) return;
    setEditLoading(true);
    try {
      await tontineService.updateMemberProfile(
        memberToEdit.tontineId || selectedTontineId,
        memberToEdit.id,
        { name: editName, phone: editPhone, email: editEmail, role: editRole }
      );
      // update state
      setMembers(prev => prev.map(m => m.id === memberToEdit.id ? { 
        ...m, name: editName, phone: editPhone, email: editEmail, role: editRole 
      } : m));
      toast.success('Membre mis à jour avec succès');
      setIsEditOpen(false);
    } catch {
      toast.error('Erreur lors de la modification');
    } finally {
      setEditLoading(false);
    }
  };

  const openDeleteModal = (member: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setMemberToDelete(member);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!memberToDelete) return;
    setDeleteLoading(true);
    const tId = memberToDelete.tontineId || selectedTontineId;
    try {
      await tontineService.removeMember(tId, memberToDelete.id);
      // Optimistic update
      setMembers(prev => prev.filter(m => m.id !== memberToDelete.id));
      setSelectedMemberIds(prev => prev.filter(id => id !== memberToDelete.id));
      toast.success('Membre retiré du cercle avec succès');
      setIsDeleteOpen(false);
    } catch {
      toast.error('Erreur lors du retrait du membre');
    } finally {
      setDeleteLoading(false);
    }
  };

  const openStatusConfirm = (member: any, newStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStatusMember(member);
    setStatusTarget(newStatus);
    setIsStatusOpen(true);
  };

  const handleStatusConfirm = async () => {
    if (!statusMember) return;
    setStatusLoading(true);
    const tId = statusMember.tontineId || selectedTontineId;
    try {
      await tontineService.updateMemberProfile(tId, statusMember.id, {
        name: statusMember.name,
        phone: statusMember.phone,
        status: statusTarget
      });
      // update UI
      setMembers(prev => prev.map(m => m.id === statusMember.id ? { ...m, status: statusTarget } : m));
      toast.success('Statut mis à jour avec succès');
      setIsStatusOpen(false);
    } catch {
      toast.error('Erreur de changement de statut');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTontineId) return;
    setInviteLoading(true);
    try {
      await invitationService.sendInvitation(selectedTontineId, inviteEmail);
      toast.success('Invitation envoyée avec succès');
      setIsInviteOpen(false);
      setInviteEmail('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'envoi de l\'invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  // Bulk actions triggers
  const handleBulkDelete = async () => {
    setIsBulkDeleteOpen(true);
  };

  const handleBulkDeleteConfirm = async () => {
    setLoading(true);
    setIsBulkDeleteOpen(false);
    try {
      await Promise.all(selectedMemberIds.map(userId => {
        const m = members.find(x => x.id === userId);
        return tontineService.removeMember(m?.tontineId || selectedTontineId, userId);
      }));
      setMembers(prev => prev.filter(m => !selectedMemberIds.includes(m.id)));
      setSelectedMemberIds([]);
      toast.success('Membres sélectionnés retirés avec succès');
    } catch {
      toast.error('Erreur lors du retrait de certains membres');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkStatusChange = async (status: string) => {
    setBulkStatusTarget(status);
    setIsBulkStatusOpen(true);
  };

  const handleBulkStatusConfirm = async () => {
    setLoading(true);
    setIsBulkStatusOpen(false);
    try {
      await Promise.all(selectedMemberIds.map(userId => {
        const m = members.find(x => x.id === userId);
        return tontineService.updateMemberProfile(m?.tontineId || selectedTontineId, userId, {
          name: m?.name || '',
          phone: m?.phone || '',
          status: bulkStatusTarget
        });
      }));
      setMembers(prev => prev.map(m => selectedMemberIds.includes(m.id) ? { ...m, status: bulkStatusTarget } : m));
      setSelectedMemberIds([]);
      toast.success('Statuts mis à jour avec succès');
    } catch {
      toast.error('Erreur lors de la mise à jour des statuts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-100 rounded-[24px] flex items-center justify-center text-blue-600">
            <Users size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Répertoire des Membres</h2>
            <p className="text-slate-500 font-medium">Gérez les accès et suivez l'engagement de vos participants</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {tontines.length > 0 && (
            <select 
              value={selectedTontineId}
              onChange={(e) => setSelectedTontineId(e.target.value)}
              disabled={showAllTontines}
              className="h-14 px-6 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all disabled:opacity-50"
            >
              {tontines.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}
          <button 
            onClick={() => setIsInviteOpen(true)}
            disabled={tontines.length === 0}
            className="flex items-center gap-2 h-14 px-8 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            <UserPlus size={18} /> Inviter
          </button>
        </div>
      </div>

      {/* Main Grid content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar counts / details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-blue-600 p-8 rounded-[40px] text-white shadow-xl shadow-blue-600/20 relative overflow-hidden">
             <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Invitation Directe</p>
                <h4 className="text-xl font-black mb-6">Partagez ce code avec vos nouveaux membres</h4>
                
                <div 
                  role="button"
                  tabIndex={0}
                  className="bg-white/10 backdrop-blur-md rounded-2xl p-6 flex items-center justify-between border border-white/10 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-white mb-3" 
                  onClick={handleCopyCode}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCopyCode(); }}
                >
                   <span className="text-2xl font-mono font-black tracking-widest">{selectedTontine?.join_code || '---'}</span>
                   <Copy size={20} className="group-hover:scale-110 transition-transform" />
                </div>

                <button 
                  onClick={handleCopyLink}
                  className="w-full py-3 bg-white/15 hover:bg-white/20 active:scale-95 transition-all text-xs font-bold rounded-xl border border-white/10 flex items-center justify-center gap-2"
                >
                  <Copy size={14} /> Copier le lien
                </button>

                <p className="text-[10px] mt-6 font-bold opacity-50 italic">* Ce code est unique à ce cercle.</p>
             </div>
             <Hash className="absolute -bottom-6 -right-6 opacity-10 pointer-events-none" size={120} />
          </div>

          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
             <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-6">Récapitulatif Statuts</h4>
             <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                   <span className="font-bold text-slate-500">À jour</span>
                   <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full font-black text-[10px]">{counts.active}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                   <span className="font-bold text-slate-500">En retard</span>
                   <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full font-black text-[10px]">{counts.pending}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                   <span className="font-bold text-slate-500">Non payé</span>
                   <span className="bg-rose-50 text-rose-600 px-3 py-1 rounded-full font-black text-[10px]">{counts.unpaid}</span>
                </div>
             </div>
          </div>
        </div>

        {/* Table & main list area */}
        <div className="lg:col-span-3 bg-white rounded-[48px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          
          {/* Toolbar search / toggle */}
          <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
             <div className="relative w-full md:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="text" 
                  placeholder="Chercher un membre..." 
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full h-12 pl-12 pr-10 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                />
                {searchInput && (
                  <button 
                    onClick={() => setSearchInput('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  >
                    <X size={16} />
                  </button>
                )}
             </div>

             <div className="flex items-center gap-4 flex-wrap w-full md:w-auto justify-end">
                <button 
                  onClick={handleExportCSV}
                  disabled={filteredMembers.length === 0}
                  className="flex items-center gap-1.5 h-11 px-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  <FileSpreadsheet size={16} /> Exporter CSV
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest select-none">Voir tous les Cercles</span>
                  <div 
                    role="checkbox"
                    aria-checked={showAllTontines}
                    tabIndex={0}
                    onClick={() => setShowAllTontines(!showAllTontines)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowAllTontines(!showAllTontines); }}
                    className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                      showAllTontines ? 'bg-blue-600' : 'bg-slate-100'
                    }`}
                  >
                     <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${
                       showAllTontines ? 'left-5' : 'left-1'
                     }`} />
                  </div>
                </div>

                <button 
                  onClick={() => fetchMembers()}
                  className={`p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-800 transition-colors ${loading ? 'animate-spin' : ''}`}
                  title="Actualiser manuellement"
                >
                  <RefreshCw size={16} />
                </button>
             </div>
          </div>

          {/* Time stamp */}
          <div className="px-8 py-2 bg-slate-50/50 border-b border-slate-50 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <span>Dernière mise à jour: {lastUpdated.toLocaleTimeString('fr-FR')}</span>
            <span>{totalItems} membre(s) trouvé(s)</span>
          </div>

          {/* Main List */}
          {error ? (
             <div className="p-16 text-center">
                <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                <p className="text-slate-700 font-bold mb-4">{error}</p>
                <button 
                  onClick={() => fetchMembers()}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-all"
                >
                  Réessayer
                </button>
             </div>
          ) : (
            <div className="overflow-x-auto relative">
              
              {/* DESKTOP TABLE VIEW */}
              <table className="w-full text-left hidden md:table">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-50">
                    <th scope="col" className="px-8 py-5 w-12">
                      <input 
                        type="checkbox"
                        checked={isAllPageSelected}
                        onChange={handleSelectAll}
                        aria-label="Sélectionner tous les membres"
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                      />
                    </th>
                    <th 
                      scope="col" 
                      onClick={() => handleSort('name')}
                      className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest cursor-pointer select-none hover:text-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        Identité
                        {sortField === 'name' ? (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} />}
                      </div>
                    </th>
                    <th scope="col" className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Contact</th>
                    <th 
                      scope="col" 
                      onClick={() => handleSort('role')}
                      className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest cursor-pointer select-none hover:text-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        Rôle
                        {sortField === 'role' ? (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} />}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      onClick={() => handleSort('status')}
                      className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest cursor-pointer select-none hover:text-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        Statut
                        {sortField === 'status' ? (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} />}
                      </div>
                    </th>
                    <th scope="col" className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    // LOADING SKELETONS
                    [...Array(6)].map((_, i) => (
                      <tr key={i} className="animate-pulse border-b border-slate-50">
                        <td className="px-8 py-6 w-12"><div className="w-4 h-4 bg-slate-200 rounded" /></td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-[18px] bg-slate-200 flex-shrink-0" />
                            <div className="space-y-2">
                              <div className="h-4 w-28 bg-slate-200 rounded" />
                              <div className="h-3 w-20 bg-slate-200 rounded" />
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 space-y-2">
                          <div className="h-3.5 w-32 bg-slate-200 rounded" />
                          <div className="h-3 w-24 bg-slate-200 rounded" />
                        </td>
                        <td className="px-8 py-6">
                          <div className="h-6 w-16 bg-slate-200 rounded-full" />
                        </td>
                        <td className="px-8 py-6">
                          <div className="h-6 w-20 bg-slate-200 rounded-full" />
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end gap-2">
                            <div className="w-10 h-10 bg-slate-200 rounded-xl" />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : paginatedMembers.map((member) => {
                    const isExpanded = expandedMemberIds.includes(member.id);
                    const isSelected = selectedMemberIds.includes(member.id);
                    const statusInfo = getStatusDetails(member.status);
                    const StatusIcon = statusInfo.icon;

                    return (
                      <React.Fragment key={member.id}>
                        {/* Main row */}
                        <tr 
                          tabIndex={0}
                          onKeyDown={(e) => handleKeyDownRow(e, member.id)}
                          onClick={() => toggleExpand(member.id)}
                          className="hover:bg-slate-50/50 transition-colors group cursor-pointer focus-visible:bg-slate-50 focus-visible:outline-none"
                        >
                          <td className="px-8 py-6 w-12" onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => handleSelectOne(member.id, e.target.checked)}
                              aria-label={`Sélectionner ${member.name}`}
                              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                            />
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-[18px] bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm flex-shrink-0">
                                {member.name?.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-black text-slate-900 flex items-center gap-2">
                                  {highlightText(member.name || '', searchTerm)}
                                  {showAllTontines && member.tontineName && (
                                    <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-widest">{member.tontineName}</span>
                                  )}
                                </p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                  {formatJoinDate(member.joined_at)}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 space-y-1">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                              <Phone size={12} className="text-slate-300" /> 
                              {highlightText(member.phone || '', searchTerm)}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 italic">
                              <Mail size={12} /> 
                              {member.email ? highlightText(member.email, searchTerm) : 'Pas d\'email'}
                            </div>
                          </td>
                          <td className="px-8 py-6">
                             <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-blue-600 border border-blue-100 bg-blue-50/50 px-3 py-1 rounded-full w-fit">
                                <Shield size={10} /> {member.role || 'member'}
                             </span>
                          </td>
                          <td className="px-8 py-6" onClick={(e) => e.stopPropagation()}>
                             {/* INTERACTIVE BADGE */}
                             <div className="relative inline-block text-left group/status">
                               <button 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   // Cycle statuses
                                   const next = member.status === 'active' ? 'pending' : member.status === 'pending' ? 'absent' : member.status === 'absent' ? 'inactive' : 'active';
                                   openStatusConfirm(member, next, e);
                                 }}
                                 title="Cliquer pour changer de statut"
                                 className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-black uppercase transition-all hover:scale-105 active:scale-95 ${statusInfo.color} ${statusInfo.bg}`}
                               >
                                  <StatusIcon size={14} />
                                  <span>{statusInfo.label}</span>
                               </button>
                             </div>
                          </td>
                          <td className="px-8 py-6 text-right" onClick={(e) => e.stopPropagation()}>
                             <div className="flex items-center gap-2 justify-end">
                               <button 
                                 onClick={() => toggleExpand(member.id)}
                                 aria-label="Voir les détails"
                                 className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 transition-all flex items-center justify-center"
                               >
                                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                               </button>
                               <button 
                                 onClick={(e) => openEditModal(member, e)}
                                 aria-label="Modifier le membre"
                                 className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center focus-visible:ring-2 focus-visible:ring-blue-500 outline-none"
                               >
                                  <Edit3 size={18} />
                               </button>
                               <button 
                                 onClick={(e) => openDeleteModal(member, e)}
                                 aria-label="Retirer le membre"
                                 className="w-10 h-10 rounded-xl bg-slate-50 text-rose-400 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center focus-visible:ring-2 focus-visible:ring-rose-500 outline-none"
                               >
                                  <Trash2 size={18} />
                               </button>
                             </div>
                          </td>
                        </tr>

                        {/* Expanded details row */}
                        {isExpanded && (
                          <tr className="bg-slate-50/20">
                            <td colSpan={6} className="px-8 py-6 border-t border-b border-slate-50">
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in slide-in-from-top-3 duration-200">
                                <div>
                                  <span className="block text-slate-400 font-bold uppercase text-[9px] tracking-wider mb-1">Cercle associé</span>
                                  <span className="font-bold text-slate-700">{member.tontineName || selectedTontine?.name || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="block text-slate-400 font-bold uppercase text-[9px] tracking-wider mb-1">Date d'inscription</span>
                                  <span className="font-bold text-slate-700">
                                    {member.joined_at ? new Date(member.joined_at).toLocaleString('fr-FR', {
                                      day: 'numeric', month: 'long', year: 'numeric'
                                    }) : 'Non renseignée'}
                                  </span>
                                </div>
                                <div>
                                  <span className="block text-slate-400 font-bold uppercase text-[9px] tracking-wider mb-1">Total des cotisations</span>
                                  <span className="font-bold text-slate-700 text-emerald-600">
                                    {Number(member.total_contribution || 0).toLocaleString('fr-FR')} FCFA
                                  </span>
                                </div>
                                <div>
                                  <span className="block text-slate-400 font-bold uppercase text-[9px] tracking-wider mb-1">Pénalités cumulées</span>
                                  <span className="font-bold text-slate-700 text-rose-600">
                                    {Number(member.total_penalties || 0).toLocaleString('fr-FR')} FCFA
                                  </span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                  {!loading && paginatedMembers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-8 py-20 text-center text-slate-400 italic">
                        Aucun membre trouvé {searchTerm ? `pour « ${searchTerm} »` : ''} dans ce cercle.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* MOBILE CARD LAYOUT */}
              <div className="block md:hidden p-4 space-y-4">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-white border border-slate-100 rounded-[28px] p-6 space-y-4">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-slate-200 rounded-[18px]" />
                        <div className="space-y-2 flex-1">
                          <div className="h-4 bg-slate-200 rounded w-2/3" />
                          <div className="h-3 bg-slate-200 rounded w-1/2" />
                        </div>
                      </div>
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                      <div className="h-6 bg-slate-200 rounded-full w-24" />
                    </div>
                  ))
                ) : paginatedMembers.map((member) => {
                  const isExpanded = expandedMemberIds.includes(member.id);
                  const isSelected = selectedMemberIds.includes(member.id);
                  const statusInfo = getStatusDetails(member.status);
                  const StatusIcon = statusInfo.icon;

                  return (
                    <div 
                      key={member.id}
                      className={`bg-white border rounded-[28px] p-6 shadow-sm space-y-4 transition-all ${
                        isSelected ? 'border-blue-200 ring-2 ring-blue-50' : 'border-slate-100'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                          <div className="w-12 h-12 rounded-[18px] bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm">
                            {member.name?.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-black text-slate-900 text-base">
                              {highlightText(member.name || '', searchTerm)}
                            </h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                              {formatJoinDate(member.joined_at)}
                            </p>
                          </div>
                        </div>

                        <input 
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleSelectOne(member.id, e.target.checked)}
                          aria-label={`Sélectionner ${member.name}`}
                          className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 mt-1"
                        />
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-slate-50">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                          <Phone size={14} className="text-slate-300" />
                          {highlightText(member.phone || '', searchTerm)}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-400 italic">
                          <Mail size={14} className="text-slate-300" />
                          {member.email ? highlightText(member.email, searchTerm) : 'Pas d\'email'}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 pt-2">
                        <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-blue-600 border border-blue-100 bg-blue-50/50 px-2.5 py-1 rounded-full">
                          <Shield size={10} /> {member.role || 'member'}
                        </span>
                        
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            const next = member.status === 'active' ? 'pending' : member.status === 'pending' ? 'absent' : member.status === 'absent' ? 'inactive' : 'active';
                            openStatusConfirm(member, next, e);
                          }}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase ${statusInfo.color} ${statusInfo.bg}`}
                        >
                          <StatusIcon size={12} />
                          <span>{statusInfo.label}</span>
                        </button>
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                        <button 
                          onClick={() => toggleExpand(member.id)}
                          className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1"
                        >
                          {isExpanded ? 'Masquer détails' : 'Afficher détails'}
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>

                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => openEditModal(member, e)}
                            aria-label="Modifier"
                            className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button 
                            onClick={(e) => openDeleteModal(member, e)}
                            aria-label="Retirer"
                            className="w-10 h-10 rounded-xl bg-slate-50 text-rose-400 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="bg-slate-50/30 rounded-2xl p-4 space-y-3 mt-3 border border-slate-100 text-xs animate-in slide-in-from-top-3 duration-200">
                          <div>
                            <span className="block text-slate-400 font-bold uppercase text-[9px] tracking-wider mb-0.5">Cercle associé</span>
                            <span className="font-bold text-slate-700">{member.tontineName || selectedTontine?.name || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="block text-slate-400 font-bold uppercase text-[9px] tracking-wider mb-0.5">Date d'inscription</span>
                            <span className="font-bold text-slate-700">
                              {member.joined_at ? new Date(member.joined_at).toLocaleString('fr-FR', {
                                day: 'numeric', month: 'long', year: 'numeric'
                              }) : 'Non renseignée'}
                            </span>
                          </div>
                          <div>
                            <span className="block text-slate-400 font-bold uppercase text-[9px] tracking-wider mb-0.5">Total des cotisations</span>
                            <span className="font-bold text-slate-700 text-emerald-600">
                              {Number(member.total_contribution || 0).toLocaleString('fr-FR')} FCFA
                            </span>
                          </div>
                          <div>
                            <span className="block text-slate-400 font-bold uppercase text-[9px] tracking-wider mb-0.5">Pénalités cumulées</span>
                            <span className="font-bold text-slate-700 text-rose-600">
                              {Number(member.total_penalties || 0).toLocaleString('fr-FR')} FCFA
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {!loading && paginatedMembers.length === 0 && (
                  <div className="py-16 text-center text-slate-400 italic">
                    Aucun membre trouvé dans ce cercle.
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Footer controls: pagination */}
          {!error && (
            <div className="p-8 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Affichage de {startIndex + 1} à {endIndex} sur {totalItems} membres
              </span>
              
              <div className="flex items-center gap-4 flex-wrap">
                {/* Items per page */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Par page</span>
                  <select 
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="h-10 px-3 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                  >
                    <option value={15}>15</option>
                    <option value={30}>30</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                {/* Page switchers */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl disabled:opacity-50 transition-colors"
                    >
                      Précédent
                    </button>
                    <div className="flex gap-1">
                      {[...Array(totalPages)].map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentPage(idx + 1)}
                          className={`w-8 h-8 rounded-xl text-xs font-black transition-all ${
                            currentPage === idx + 1 
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25' 
                              : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      ))}
                    </div>
                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl disabled:opacity-50 transition-colors"
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

      {/* BULK ACTION BAR */}
      {selectedMemberIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-[24px] px-6 py-4 flex flex-col md:flex-row items-center gap-4 shadow-2xl z-40 animate-in fade-in slide-in-from-bottom-4 duration-300 w-[90%] max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
            <CheckCircle className="text-blue-500" size={16} />
            <span>{selectedMemberIds.length} membres sélectionnés</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto md:ml-auto justify-center">
            {/* Status change select */}
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkStatusChange(e.target.value);
                  e.target.value = '';
                }
              }}
              className="h-10 px-3 bg-slate-800 text-white border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer"
            >
              <option value="">Changer statut...</option>
              <option value="active">À jour (active)</option>
              <option value="pending">En retard (pending)</option>
              <option value="absent">Absent (absent)</option>
              <option value="inactive">Non payé (inactive)</option>
            </select>

            <button 
              onClick={handleBulkDelete}
              className="h-10 px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
            >
              Retirer membres
            </button>

            <button 
              onClick={() => setSelectedMemberIds([])}
              className="h-10 w-10 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl flex items-center justify-center transition-all"
              title="Annuler la sélection"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* INVITE MODAL */}
      {isInviteOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-8 max-w-md w-full shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsInviteOpen(false)}
              className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={20} />
            </button>
            <h3 className="text-2xl font-black font-serif italic text-slate-900 mb-2">Inviter un nouveau membre</h3>
            <p className="text-slate-500 text-xs mb-6 font-medium">Envoyez une invitation par e-mail ou username à un utilisateur enregistré.</p>

            <form onSubmit={handleSendInvite} className="space-y-4">
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Email ou Nom d'utilisateur</label>
                <input 
                  type="text"
                  required
                  placeholder="nom@exemple.com ou username"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full h-12 px-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                />
              </div>

              <button 
                type="submit"
                disabled={inviteLoading}
                className="w-full h-12 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                {inviteLoading ? <Loader2 size={16} className="animate-spin" /> : 'Envoyer l\'invitation'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MEMBER MODAL */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-8 max-w-md w-full shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsEditOpen(false)}
              className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={20} />
            </button>
            <h3 className="text-2xl font-black font-serif italic text-slate-900 mb-2">Modifier le membre</h3>
            <p className="text-slate-500 text-xs mb-6 font-medium">Modifiez les informations et le rôle du participant dans ce cercle.</p>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Nom complet</label>
                <input 
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full h-12 px-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                />
              </div>

              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Téléphone</label>
                <input 
                  type="text"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full h-12 px-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                />
              </div>

              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Adresse E-mail</label>
                <input 
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full h-12 px-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                />
              </div>

              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Rôle dans le cercle</label>
                <select
                  value={editRole}
                  onChange={(e: any) => setEditRole(e.target.value)}
                  className="w-full h-12 px-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                >
                  <option value="member">Membre standard</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>

              <button 
                type="submit"
                disabled={editLoading}
                className="w-full h-12 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                {editLoading ? <Loader2 size={16} className="animate-spin" /> : 'Enregistrer'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM SINGLE STATUS CHANGE */}
      {isStatusOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-8 max-w-sm w-full shadow-2xl border border-slate-100 relative text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={24} />
            </div>
            <h4 className="text-xl font-black font-serif text-slate-900 mb-2">Modifier le statut</h4>
            <p className="text-slate-500 text-xs mb-6 font-medium leading-relaxed">
              Voulez-vous modifier le statut de <strong>{statusMember?.name}</strong> en « <strong>{getStatusDetails(statusTarget).label}</strong> » ?
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsStatusOpen(false)}
                className="flex-1 h-12 bg-slate-100 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Annuler
              </button>
              <button 
                onClick={handleStatusConfirm}
                disabled={statusLoading}
                className="flex-1 h-12 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {statusLoading ? <Loader2 size={16} className="animate-spin" /> : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {isDeleteOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-8 max-w-sm w-full shadow-2xl border border-slate-100 relative text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} />
            </div>
            <h4 className="text-xl font-black font-serif text-slate-900 mb-2">Retirer le membre ?</h4>
            <p className="text-slate-500 text-xs mb-6 font-medium leading-relaxed">
              Êtes-vous sûr de vouloir retirer <strong>{memberToDelete?.name}</strong> de ce cercle ? Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsDeleteOpen(false)}
                className="flex-1 h-12 bg-slate-100 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Annuler
              </button>
              <button 
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="flex-1 h-12 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleteLoading ? <Loader2 size={16} className="animate-spin" /> : 'Retirer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM BULK DELETE */}
      {isBulkDeleteOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-8 max-w-sm w-full shadow-2xl border border-slate-100 relative text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} />
            </div>
            <h4 className="text-xl font-black font-serif text-slate-900 mb-2">Retirer les membres ?</h4>
            <p className="text-slate-500 text-xs mb-6 font-medium leading-relaxed">
              Êtes-vous sûr de vouloir retirer les <strong>{selectedMemberIds.length}</strong> membres sélectionnés ? Cette action est définitive.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsBulkDeleteOpen(false)}
                className="flex-1 h-12 bg-slate-100 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Annuler
              </button>
              <button 
                onClick={handleBulkDeleteConfirm}
                className="flex-1 h-12 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-500 transition-all"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM BULK STATUS */}
      {isBulkStatusOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-8 max-w-sm w-full shadow-2xl border border-slate-100 relative text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={24} />
            </div>
            <h4 className="text-xl font-black font-serif text-slate-900 mb-2">Changer les statuts ?</h4>
            <p className="text-slate-500 text-xs mb-6 font-medium leading-relaxed">
              Voulez-vous modifier le statut de ces <strong>{selectedMemberIds.length}</strong> membres en « <strong>{getStatusDetails(bulkStatusTarget).label}</strong> » ?
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsBulkStatusOpen(false)}
                className="flex-1 h-12 bg-slate-100 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Annuler
              </button>
              <button 
                onClick={handleBulkStatusConfirm}
                className="flex-1 h-12 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all"
              >
                Confirmer
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
        <div className="p-12 bg-red-50/50 border border-red-100 rounded-[32px] text-center my-6 max-w-xl mx-auto">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-black font-serif text-slate-900 mb-2">Une erreur inattendue est survenue</h2>
          <p className="text-slate-500 text-xs font-medium mb-6 leading-relaxed">
            Le répertoire des membres n'a pas pu s'afficher correctement.
          </p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="px-6 h-11 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md"
          >
            Recharger le composant
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function MemberListWithErrorBoundary(props: MemberListProps) {
  return (
    <ErrorBoundary>
      <MemberList {...props} />
    </ErrorBoundary>
  );
}
