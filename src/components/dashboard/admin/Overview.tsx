import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, Users, TrendingUp, Wallet, CheckCircle, Plus, ArrowRight, Sparkles, Home,
  Eye, AlertTriangle, Info, Search, ChevronDown, RefreshCw, Clock, PlayCircle, Edit3
} from 'lucide-react';

interface OverviewProps {
  stats: any;
  tontines: any[];
  loading?: boolean;
  error?: any;
  onRetry?: () => void;
  onNavigateToSection?: (section: string, tontineId?: string) => void;
}

// Custom Counter component to animate counting up when stats load
const CountUp = ({ 
  value, 
  duration = 1000, 
  formatter = (val: number) => String(val) 
}: { 
  value: number; 
  duration?: number; 
  formatter?: (val: number) => string 
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = Number(value || 0);
    if (start === end) {
      setCount(end);
      return;
    }

    const incrementTime = 16; // ~60fps
    const totalSteps = Math.ceil(duration / incrementTime);
    const stepValue = (end - start) / totalSteps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= totalSteps) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(Math.floor(start + stepValue * currentStep));
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <>{formatter(count)}</>;
};

// Premium Tooltip triggers
const InfoTooltip = ({ text }: { text: string }) => (
  <div className="group/tooltip relative inline-block ml-1.5 align-middle select-none">
    <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-help" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-900 text-white text-[10px] p-2.5 rounded-xl shadow-xl opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity duration-200 z-50 font-medium normal-case tracking-normal leading-normal text-center">
      {text}
    </div>
  </div>
);

const InfoTooltipDark = ({ text }: { text: string }) => (
  <div className="group/tooltip relative inline-block ml-1.5 align-middle select-none">
    <Info className="w-3.5 h-3.5 text-white/40 hover:text-white/80 cursor-help" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-white text-slate-900 text-[10px] p-2.5 rounded-xl shadow-xl opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity duration-200 z-50 font-medium normal-case tracking-normal leading-normal text-center border border-slate-100">
      {text}
    </div>
  </div>
);

const Overview = ({ 
  stats, 
  tontines = [], 
  loading = false, 
  error = null, 
  onRetry,
  onNavigateToSection
}: OverviewProps) => {
  const navigate = useNavigate();

  // Search/Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'members' | 'amount'>('name');

  // Time & Auto-refresh tracking
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [historicalStats, setHistoricalStats] = useState<any>(null);

  // Sync timestamp when data updates
  useEffect(() => {
    if (stats || tontines?.length > 0) {
      setLastUpdated(new Date());
    }
  }, [stats, tontines]);

  // Handle caching stats for dynamic trend calculation
  useEffect(() => {
    if (stats && !loading && !error) {
      const cached = localStorage.getItem('tontine_dashboard_prev_stats');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (
            parsed.totalCapital !== stats.totalCapital ||
            parsed.totalMembers !== stats.totalMembers ||
            parsed.totalTontines !== stats.totalTontines
          ) {
            setHistoricalStats(parsed);
          }
        } catch (e) {
          console.error(e);
        }
      }
      localStorage.setItem('tontine_dashboard_prev_stats', JSON.stringify({
        totalTontines: stats.totalTontines ?? 0,
        totalMembers: stats.totalMembers ?? 0,
        totalCapital: stats.totalCapital ?? 0,
        timestamp: new Date().getTime()
      }));
    }
  }, [stats, loading, error]);

  // Set up 60s auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      if (onRetry) {
        onRetry();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [onRetry]);

  // Trend helper logic
  const getTrendValue = (current: number, previous: number | undefined) => {
    if (previous === undefined || previous === 0) return 0;
    const diff = current - previous;
    return Math.round((diff / previous) * 100);
  };

  const tontinesTrend = getTrendValue(stats?.totalTontines ?? 0, historicalStats?.totalTontines);
  const membersTrend = getTrendValue(stats?.totalMembers ?? 0, historicalStats?.totalMembers);
  const capitalTrend = getTrendValue(stats?.totalCapital ?? 0, historicalStats?.totalCapital);

  // Trend indicator renders
  const renderTrend = (val: number, label: string = "vs session précédente") => {
    const isPositive = val >= 0;
    return (
      <div className={`mt-2 flex items-center gap-1 text-[10px] md:text-xs font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
        <span>{isPositive ? '▲' : '▼'}</span>
        <span>{isPositive ? '+' : ''}{val}%</span>
        <span className="text-slate-400 font-normal ml-1">{label}</span>
      </div>
    );
  };

  const renderTrendDark = (val: number, label: string = "vs session précédente") => {
    const isPositive = val >= 0;
    return (
      <div className={`mt-2 flex items-center gap-1 text-[10px] md:text-xs font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
        <span>{isPositive ? '▲' : '▼'}</span>
        <span>{isPositive ? '+' : ''}{val}%</span>
        <span className="text-white/50 font-normal ml-1">{label}</span>
      </div>
    );
  };

  // Status mapping
  const getStatusDetails = (status: string) => {
    const s = String(status || 'active').toLowerCase();
    switch (s) {
      case 'completed':
      case 'termine':
      case 'terminée':
        return {
          label: 'Terminé',
          colorClass: 'text-blue-600 bg-blue-50 border-blue-100',
          icon: CheckCircle
        };
      case 'pending':
      case 'attente':
      case 'en attente':
        return {
          label: 'En attente',
          colorClass: 'text-amber-600 bg-amber-50 border-amber-100',
          icon: Clock
        };
      case 'draft':
      case 'brouillon':
        return {
          label: 'Brouillon',
          colorClass: 'text-slate-500 bg-slate-50 border-slate-100',
          icon: Edit3
        };
      case 'active':
      default:
        return {
          label: 'En activité',
          colorClass: 'text-emerald-600 bg-emerald-50 border-emerald-100',
          icon: PlayCircle
        };
    }
  };

  // Filtering tontines list
  const filteredTontines = tontines.filter(t => {
    const nameMatch = (t?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const tStatus = String(t?.status || 'active').toLowerCase();
    let statusMatch = true;
    if (statusFilter === 'active') {
      statusMatch = tStatus === 'active';
    } else if (statusFilter === 'completed') {
      statusMatch = tStatus === 'completed' || tStatus === 'termine' || tStatus === 'terminée';
    }
    return nameMatch && statusMatch;
  });

  // Sorting tontines list
  const sortedTontines = [...filteredTontines].sort((a, b) => {
    if (sortBy === 'name') {
      return (a?.name || '').localeCompare(b?.name || '');
    } else if (sortBy === 'date') {
      return new Date(b?.created_at || 0).getTime() - new Date(a?.created_at || 0).getTime();
    } else if (sortBy === 'members') {
      const aMembers = Number(a?.current_members || a?.members_count || 0);
      const bMembers = Number(b?.current_members || b?.members_count || 0);
      return bMembers - aMembers;
    } else if (sortBy === 'amount') {
      const aAmt = Number(a?.amount || 0);
      const bAmt = Number(b?.amount || 0);
      return bAmt - aAmt;
    }
    return 0;
  });

  // Dynamic Activity indicator state
  const hasActiveTontines = (stats?.totalTontines ?? 0) > 0;

  // Fallback for missing emoji
  const renderEmojiOrIcon = (emoji: string | undefined) => {
    if (emoji && emoji.trim()) {
      return (
        <span className="select-none leading-none flex items-center justify-center w-full h-full text-2xl md:text-4xl" role="img" aria-label="Tontine emoji">
          {emoji}
        </span>
      );
    }
    return (
      <span className="select-none leading-none flex items-center justify-center w-full h-full text-2xl md:text-4xl" role="img" aria-label="Default money emoji">
        💰
      </span>
    );
  };

  return (
    <div className="space-y-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl flex items-center gap-3 md:text-5xl font-black text-slate-900 mb-2 tracking-tight italic font-outfit">
             Console de Pilotage <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-blue-500 select-none pointer-events-none"/>
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500 font-medium text-sm md:text-lg">
            <span>Suivez vos indicateurs de tontine en temps réel</span>
            <span className="text-[10px] md:text-xs text-slate-400 font-normal flex items-center gap-1.5 bg-slate-100/80 px-2.5 py-1 rounded-full border border-slate-200 select-none">
              <Clock className="w-3.5 h-3.5" />
              Mise à jour : {lastUpdated.toLocaleTimeString('fr-FR')}
              {loading && <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />}
              {!loading && onRetry && (
                <button 
                  onClick={onRetry} 
                  className="hover:text-blue-600 transition-colors p-0.5 rounded-full hover:bg-slate-200"
                  aria-label="Recharger les données"
                  title="Rafraîchir"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              )}
            </span>
          </div>
        </div>
        <button
          onClick={() => navigate('/create-tontine')}
          aria-label="Créer un nouveau cercle de tontine"
          className="flex items-center justify-center gap-3 px-6 md:px-10 py-4 md:py-5 bg-blue-600 text-white rounded-[20px] md:rounded-[24px] font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-blue-600/30 w-full md:w-fit"
        >
          <Plus className="w-4 h-4 md:w-5 md:h-5" strokeWidth={3} /> Créer une tontine
        </button>
      </div>

      {/* Statistics Section */}
      {error ? (
        <div className="bg-rose-50 border border-rose-100 rounded-[32px] md:rounded-[48px] p-8 text-center space-y-4">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle size={24} />
          </div>
          <p className="font-bold text-slate-800 text-sm md:text-base">Impossible de charger les statistiques globales</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">{error.message || String(error) || "Une erreur s'est produite lors de la récupération des indicateurs."}</p>
          <button 
            onClick={onRetry} 
            className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all"
            aria-label="Réessayer le chargement"
          >
            Réessayer
          </button>
        </div>
      ) : loading || !stats ? (
        /* Statistics Loading Skeleton Grid */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {[...Array(3)].map((_, i) => {
            const isDark = i === 2;
            return (
              <div 
                key={i} 
                className={`${
                  isDark ? 'bg-slate-900 border-transparent shadow-2xl' : 'bg-white border border-slate-100 shadow-sm'
                } p-6 md:p-10 rounded-[32px] md:rounded-[48px] relative overflow-hidden animate-pulse min-h-[178px] md:min-h-[222px] flex flex-col justify-between`}
              >
                <div>
                  <div className={`h-3 rounded w-28 mb-4 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
                  <div className={`h-8 md:h-12 rounded w-16 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                </div>
                <div className={`h-6 rounded-full w-36 mt-6 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
              </div>
            );
          })}
        </div>
      ) : (
        /* Real Statistics Grid */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Total Tontines */}
          <div className="bg-white p-6 md:p-10 rounded-[32px] md:rounded-[48px] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none select-none overflow-hidden max-w-full">
               <Package className="w-24 h-24 md:w-28 md:h-28" />
            </div>
            <div className="flex items-center">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5">Tontines Gérées</p>
              <InfoTooltip text="Nombre total de cercles de tontine créés et gérés par les administrateurs du groupe." />
            </div>
            <p className="text-3xl md:text-5xl font-black text-slate-900 leading-tight">
              <CountUp value={stats?.totalTontines ?? 0} />
            </p>
            {renderTrend(tontinesTrend)}
            
            {hasActiveTontines ? (
              <div className="mt-6 flex items-center gap-2 text-[10px] md:text-xs font-bold text-blue-600 bg-blue-50 w-fit px-3 py-1.5 rounded-full select-none">
                 <div className="w-1.5 md:w-2 h-1.5 md:h-2 rounded-full bg-blue-500 animate-pulse" /> Activité positive
              </div>
            ) : (
              <div className="mt-6 flex items-center gap-2 text-[10px] md:text-xs font-bold text-slate-500 bg-slate-50 w-fit px-3 py-1.5 rounded-full select-none">
                 <div className="w-1.5 md:w-2 h-1.5 md:h-2 rounded-full bg-slate-400" /> Aucune activité
              </div>
            )}
          </div>

          {/* Active Members */}
          <div className="bg-white p-6 md:p-10 rounded-[32px] md:rounded-[48px] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none select-none overflow-hidden max-w-full">
               <Users className="w-24 h-24 md:w-28 md:h-28" />
            </div>
            <div className="flex items-center">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5">Membres Actifs</p>
              <InfoTooltip text="Nombre total de participants uniques engagés dans vos différents cercles de tontine." />
            </div>
            <p className="text-3xl md:text-5xl font-black text-slate-900 leading-tight">
              <CountUp value={stats?.totalMembers ?? 0} />
            </p>
            {renderTrend(membersTrend)}
            <div className="mt-6 flex items-center gap-2 text-[10px] md:text-xs font-bold text-emerald-600 bg-emerald-50 w-fit px-3 py-1.5 rounded-full select-none">
               <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500" /> Membres engagés
            </div>
          </div>

          {/* Capital Under Management */}
          <div className="bg-slate-900 p-6 md:p-10 rounded-[32px] md:rounded-[48px] shadow-2xl relative overflow-hidden group text-white">
            <div className="absolute -top-4 -right-4 p-8 opacity-10 pointer-events-none select-none overflow-hidden max-w-full">
               <Wallet className="w-24 h-24 md:w-28 md:h-28 text-white" />
            </div>
            <div className="flex items-center">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5">Capital Sous Gestion</p>
              <InfoTooltipDark text="Somme totale des cotisations collectées et des encours bancaires gérés au sein du groupe (Cotisations + Épargne)." />
            </div>
            <p className="text-3xl md:text-5xl font-black text-white leading-tight">
              <CountUp 
                value={stats?.totalCapital ?? 0} 
                formatter={(val) => val.toLocaleString()}
              /> 
              <span className="text-xs md:text-sm font-normal opacity-60 ml-1.5">FCFA</span>
            </p>
            {renderTrendDark(capitalTrend)}
            <div className="mt-6 flex items-center gap-2 text-[10px] md:text-xs font-bold text-amber-300 select-none">
               <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4" /> Flux monétaire actif
            </div>
          </div>
        </div>
      )}

      {/* Tontine List Section */}
      <div className="bg-white rounded-[56px] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
        {/* Section Header */}
        <div className="px-6 md:px-12 py-10 border-b bg-slate-50/40 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-2xl font-black text-slate-900 italic">Mes Cercles en cours</h2>
          <span className="bg-white px-5 py-2 rounded-full text-[10px] font-black text-slate-500 border border-slate-100 uppercase tracking-widest select-none">
            {filteredTontines.length} / {tontines.length} Cercles
          </span>
        </div>

        {/* Filter and Search Bar */}
        <div className="px-6 md:px-12 py-6 border-b bg-white flex flex-col xl:flex-row justify-between items-center gap-6">
          {/* Search Input */}
          <div className="relative w-full xl:w-96">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input 
              type="text" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              placeholder="Rechercher un cercle par nom..." 
              className="w-full h-11 pl-11 pr-4 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all" 
              aria-label="Rechercher une tontine par son nom"
            />
          </div>

          {/* Filter Chips & Sorting Dropdown */}
          <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto justify-end">
            <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
              <span className="text-[9px] font-black text-slate-400 uppercase px-2 select-none">Statut</span>
              {(['all', 'active', 'completed'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                    statusFilter === st 
                      ? 'bg-slate-900 text-white' 
                      : 'text-slate-500 hover:bg-white'
                  }`}
                  aria-label={`Filtrer par statut: ${st === 'all' ? 'tous' : st === 'active' ? 'actifs' : 'terminés'}`}
                >
                  {st === 'all' ? 'Tous' : st === 'active' ? 'Actifs' : 'Terminés'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest select-none">Trier par</span>
              <div className="relative">
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value as any)} 
                  className="h-10 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer appearance-none pr-8 select-none"
                  aria-label="Critère de tri des tontines"
                >
                  <option value="name">Nom</option>
                  <option value="date">Date de création</option>
                  <option value="members">Membres</option>
                  <option value="amount">Montant</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Content list or skeletons/errors */}
        <div className="divide-y divide-slate-50 overflow-x-auto scrollbar-hide">
          {error ? (
            <div className="py-24 text-center space-y-4 px-6 max-w-xl mx-auto flex flex-col items-center">
              <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center">
                <AlertTriangle size={24} />
              </div>
              <p className="font-bold text-slate-800">Impossible de charger la liste des cercles</p>
              <p className="text-xs text-slate-500">Veuillez vérifier votre connexion internet ou réessayer ultérieurement.</p>
              <button 
                onClick={onRetry} 
                className="px-6 py-2.5 bg-slate-900 hover:bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all"
                aria-label="Réessayer de charger les cercles"
              >
                Réessayer
              </button>
            </div>
          ) : loading || (tontines.length === 0 && loading) ? (
            /* Tontines Loading Skeleton Rows */
            [...Array(4)].map((_, i) => (
              <div 
                key={i} 
                className="px-6 md:px-12 py-6 md:py-10 flex flex-col sm:flex-row items-center justify-between gap-6 animate-pulse"
              >
                <div className="flex items-center gap-4 md:gap-8 self-start sm:self-auto w-full sm:w-auto">
                  <div className="w-14 h-14 md:w-20 md:h-20 bg-slate-100 rounded-[20px] md:rounded-[32px] flex-shrink-0" />
                  <div className="space-y-3 flex-1">
                    <div className="h-6 bg-slate-200 rounded w-44" />
                    <div className="flex gap-3">
                      <div className="h-5 bg-slate-100 rounded-full w-24" />
                      <div className="h-5 bg-slate-100 rounded-full w-28" />
                    </div>
                    <div className="space-y-1.5 w-48 mt-2">
                      <div className="h-2.5 bg-slate-100 rounded w-36" />
                      <div className="h-1.5 bg-slate-100 rounded w-full" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="space-y-1.5">
                    <div className="h-3 bg-slate-100 rounded w-12 ml-auto" />
                    <div className="h-4 bg-slate-100 rounded w-20 ml-auto" />
                  </div>
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-[18px] md:rounded-[28px] bg-slate-100" />
                </div>
              </div>
            ))
          ) : sortedTontines.length > 0 ? (
            /* Tontines Rows */
            sortedTontines.map((t) => {
              const statusDetails = getStatusDetails(t.status);
              const StatusIcon = statusDetails.icon;

              const totalC = t.total_cycles || t.current_members || t.members_count || 12;
              const currentC = t.current_cycle || 1;
              const progressPercentage = Math.min(100, Math.max(0, Math.round((currentC / totalC) * 100)));

              return (
                <div 
                  key={t.id} 
                  tabIndex={0}
                  role="button"
                  aria-label={`Visualiser le cercle de tontine ${t.name}, statut ${statusDetails.label}`}
                  onClick={() => navigate(`/tontine/${t.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/tontine/${t.id}`);
                    }
                  }}
                  className="px-6 md:px-12 py-6 md:py-10 flex flex-col sm:flex-row items-center justify-between hover:bg-slate-50/80 hover:-translate-y-0.5 hover:shadow-md focus-visible:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 transition-all cursor-pointer group gap-6 select-none animate-in fade-in duration-300"
                >
                  <div className="flex items-center gap-4 md:gap-8 self-start sm:self-auto w-full sm:w-auto">
                    <div className="w-14 h-14 md:w-20 md:h-20 bg-slate-100 rounded-[20px] md:rounded-[32px] flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 flex-shrink-0">
                      {renderEmojiOrIcon(t.emoji)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg md:text-2xl font-black text-slate-900 mb-1.5 md:mb-2 truncate tracking-tight">{t.name}</h3>
                      <div className="flex flex-wrap items-center gap-3 md:gap-4 text-[10px] md:text-xs font-bold text-slate-400 mb-4">
                         <span className="flex items-center gap-1.5 md:gap-2 bg-slate-50 px-2.5 md:px-3.5 py-1.5 rounded-full border border-slate-100">
                           <Users className="w-3.5 h-3.5 text-slate-500" /> {t.current_members || t.members_count || 0} membres
                         </span>
                         <span className="flex items-center gap-1.5 md:gap-2 bg-slate-50 px-2.5 md:px-3.5 py-1.5 rounded-full border border-slate-100">
                           <Wallet className="w-3.5 h-3.5 text-slate-500" /> {Number(t.amount || 0).toLocaleString()} FCFA
                         </span>
                         <span className="flex items-center gap-1.5 md:gap-2 bg-slate-50 px-2.5 md:px-3.5 py-1.5 rounded-full border border-slate-100">
                           <Clock className="w-3.5 h-3.5 text-slate-500" /> Échéance : {t.next_payout_date ? new Date(t.next_payout_date).toLocaleDateString('fr-FR') : 'Non planifiée'}
                         </span>
                      </div>

                      {/* Progress indicators bar & text */}
                      <div className="w-full max-w-sm flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400 tracking-wider">
                          <span>Cycle {currentC}/{totalC}</span>
                          <span>Cotisations : {t.paid_members_count || 0}/{t.current_members || t.members_count || 0} payées ({Math.round(((t.paid_members_count || 0) / (t.current_members || 1)) * 100)}%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-600 rounded-full transition-all duration-500"
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    {/* Hover Quick Actions */}
                    <div 
                      className="hidden group-hover:flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button 
                        onClick={(e) => { e.stopPropagation(); navigate(`/tontine/${t.id}`); }}
                        title="Voir détails"
                        aria-label={`Voir détails de la tontine ${t.name}`}
                        className="p-2.5 bg-slate-100 hover:bg-slate-200 hover:scale-105 text-slate-700 rounded-xl transition-all"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          if (onNavigateToSection) {
                            onNavigateToSection('members', String(t.id));
                          }
                        }}
                        title="Gérer membres"
                        aria-label={`Gérer les membres de la tontine ${t.name}`}
                        className="p-2.5 bg-blue-50 hover:bg-blue-100 hover:scale-105 text-blue-600 rounded-xl transition-all"
                      >
                        <Users className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          if (onNavigateToSection) {
                            onNavigateToSection('contributions', String(t.id));
                          }
                        }}
                        title="Voir cotisations"
                        aria-label={`Voir les cotisations de la tontine ${t.name}`}
                        className="p-2.5 bg-emerald-50 hover:bg-emerald-100 hover:scale-105 text-emerald-600 rounded-xl transition-all"
                      >
                        <Wallet className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Status display - Hidden on hover */}
                    <div className="text-right mr-2 md:mr-6 group-hover:hidden transition-all duration-200">
                       <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 md:mb-1">Status</p>
                       <div className={`flex items-center gap-1.5 text-[10px] md:text-xs font-black uppercase tracking-tighter px-3 py-1 rounded-full border ${statusDetails.colorClass}`}>
                         <StatusIcon className="w-3.5 h-3.5" />
                         <span>{statusDetails.label}</span>
                       </div>
                    </div>

                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-[18px] md:rounded-[28px] flex items-center justify-center bg-slate-50 group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:translate-x-1 duration-200 flex-shrink-0">
                       <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            /* Empty State Container */
            <div className="py-24 px-6 text-center max-w-xl mx-auto flex flex-col items-center">
              <div className="w-28 h-28 bg-blue-50 text-blue-600 rounded-[32px] flex items-center justify-center mb-8 animate-bounce shadow-lg shadow-blue-100/50">
                 <TrendingUp size={48} strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3 italic">Aucun cercle de tontine trouvé</h3>
              <p className="text-sm text-slate-500 font-medium mb-6 leading-relaxed">
                L'épargne collective avec TontineTogether vous permet de financer vos projets sans intérêt bancaire, de renforcer la solidarité avec vos proches et de bénéficier d'un fonds de roulement flexible.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mb-6">
                <button 
                  onClick={() => navigate('/create-tontine')} 
                  className="px-6 py-3.5 bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-600/20 w-full sm:w-auto"
                  aria-label="Créer une tontine"
                >
                  Créer une tontine
                </button>
                <button 
                  onClick={() => navigate('/join-tontine')} 
                  className="px-6 py-3.5 bg-white border border-slate-200 text-slate-700 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all w-full sm:w-auto"
                  aria-label="Rejoindre un cercle existant"
                >
                  Rejoindre une tontine
                </button>
              </div>
              <a 
                href="/help"
                onClick={(e) => { e.preventDefault(); navigate('/help'); }}
                className="text-xs text-blue-600 hover:underline font-bold flex items-center gap-1.5"
                aria-label="Consulter la documentation"
              >
                <Info size={14} /> Comment fonctionne une tontine ? Consulter le guide d'utilisation
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Overview;
