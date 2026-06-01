import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navigation from '@/components/shared/Navigation';
import {
  Bell, Check, Trash2, DollarSign, Users, Calendar,
  ArrowLeft, Sparkles, AlertCircle, RefreshCw,
  ChevronDown, ChevronUp, Filter, Info, CheckCheck,
  Clock, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';

// ─── Types ───────────────────────────────────────────────────────────────────

type NotifType = 'payment' | 'member' | 'payout' | 'system';

interface AppNotification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  created_at: string;       // ISO date string from backend
  is_read: boolean;
  tontine_name?: string;
}

interface PrefState {
  cotisation: boolean;
  partenaires: boolean;
  distributions: boolean;
  courriel: boolean;
}

// ─── Mock / fallback data (used when API unavailable) ────────────────────────

const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'mock-1',
    type: 'payment',
    title: 'Héritage dû',
    message: 'Votre contribution pour "Cercle Prestige 2024" est attendue pour demain.',
    created_at: new Date().toISOString(),
    is_read: false,
    tontine_name: 'Cercle Prestige 2024',
  },
  {
    id: 'mock-2',
    type: 'member',
    title: 'Nouveau Partenaire',
    message: 'Amadou Diallo a rejoint votre tontine "Épargne Business".',
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    is_read: false,
    tontine_name: 'Épargne Business',
  },
  {
    id: 'mock-3',
    type: 'payout',
    title: 'Distribution de Cycle',
    message: 'Félicitations ! Vous recevrez votre bénéfice le 15 courant.',
    created_at: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
    is_read: true,
    tontine_name: 'Épargne Business',
  },
  {
    id: 'mock-4',
    type: 'payment',
    title: 'Transfert Validé',
    message: 'Votre versement de 50 000 XOF a été certifié avec succès.',
    created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    is_read: true,
  },
  {
    id: 'mock-5',
    type: 'system',
    title: 'Mise à jour du système',
    message: 'TontinePro a été mis à jour vers la version 2.4.1.',
    created_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    is_read: true,
  },
];

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;
const REFRESH_INTERVAL = 30_000; // 30 s

const FILTER_LABELS: Record<string, string> = {
  all: 'Tous',
  unread: 'Non lus',
  payment: 'Paiements',
  member: 'Membres',
  payout: 'Distribution',
};

const PREF_DEFAULTS: PrefState = {
  cotisation: true,
  partenaires: true,
  distributions: true,
  courriel: false,
};

const PREF_STORAGE_KEY = 'tontine_notif_prefs';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getIcon(type: NotifType) {
  switch (type) {
    case 'payment': return DollarSign;
    case 'member':  return Users;
    case 'payout':  return Calendar;
    default:        return Bell;
  }
}

function getIconColor(type: NotifType): string {
  switch (type) {
    case 'payment': return 'text-[#C8862A] bg-[#F5E6C8]';
    case 'member':  return 'text-[#1A1208] bg-[#EDE8DE]';
    case 'payout':  return 'text-emerald-700 bg-emerald-50';
    default:        return 'text-slate-500 bg-slate-100';
  }
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins < 1)    return "À l'instant";
  if (mins < 60)   return `Il y a ${mins} min`;
  if (hours < 24)  return `Il y a ${hours}h`;
  if (days === 1)  return 'Hier';
  if (days < 7)    return `Il y a ${days} j`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function getDateGroup(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days  = Math.floor(diff / 86_400_000);
  if (days === 0)  return "Aujourd'hui";
  if (days === 1)  return 'Hier';
  if (days < 7)   return 'Cette semaine';
  return 'Plus ancien';
}

function groupByDate(list: AppNotification[]): Record<string, AppNotification[]> {
  const groups: Record<string, AppNotification[]> = {};
  const order = ["Aujourd'hui", 'Hier', 'Cette semaine', 'Plus ancien'];
  order.forEach(k => { groups[k] = []; });
  list.forEach(n => {
    const g = getDateGroup(n.created_at);
    if (!groups[g]) groups[g] = [];
    groups[g].push(n);
  });
  return groups;
}

function normalizeNotification(raw: any): AppNotification {
  return {
    id:           String(raw.id ?? raw._id ?? Math.random()),
    type:         raw.type ?? 'system',
    title:        raw.title ?? raw.message?.slice(0, 30) ?? 'Notification',
    message:      raw.message ?? '',
    created_at:   raw.created_at ?? raw.createdAt ?? new Date().toISOString(),
    is_read:      raw.is_read ?? raw.read ?? false,
    tontine_name: raw.tontine_name ?? raw.tontineName ?? undefined,
  };
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function NotificationSkeleton() {
  return (
    <div className="p-6 rounded-[24px] border-[1.5px] border-[#DDD5C4] bg-white/50 animate-pulse">
      <div className="flex items-start gap-5">
        <div className="shrink-0 w-12 h-12 rounded-xl bg-[#EDE8DE]" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#DDD5C4]" />
            <div className="h-4 bg-[#DDD5C4] rounded w-40" />
          </div>
          <div className="h-3 bg-[#EDE8DE] rounded w-full" />
          <div className="h-3 bg-[#EDE8DE] rounded w-3/4" />
          <div className="h-2 bg-[#DDD5C4] rounded w-16 mt-2" />
        </div>
      </div>
    </div>
  );
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function ToggleSwitch({
  checked,
  onChange,
  id,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
  label: string;
}) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
        transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#C8862A] focus:ring-offset-2
        focus:ring-offset-[#1A1208] ${checked ? 'bg-[#C8862A]' : 'bg-[#C1B7A6]'}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow
          ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1208]/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl border border-[#DDD5C4]"
      >
        <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Trash2 className="text-rose-500" size={26} />
        </div>
        <h3 className="text-lg font-serif font-black text-[#1A1208] text-center mb-2">
          Confirmer la suppression
        </h3>
        <p className="text-[#7A6E5F] text-sm text-center leading-relaxed mb-7">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 border-[1.5px] border-[#DDD5C4] text-[#7A6E5F] font-bold rounded-2xl text-sm hover:border-[#C8862A] hover:text-[#C8862A] transition-all"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-rose-500 text-white font-bold rounded-2xl text-sm hover:bg-rose-600 transition-all"
          >
            Supprimer
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  // ── Data state ──────────────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isMockData, setIsMockData]   = useState(false);

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [filter, setFilter]           = useState<string>('all');
  const [page, setPage]               = useState(1);
  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [confirmMsg, setConfirmMsg]   = useState('');
  const [confirmCb, setConfirmCb]     = useState<(() => void) | null>(null);

  // ── Preference toggles ───────────────────────────────────────────────────────
  const savedPrefs = (() => {
    try {
      const raw = localStorage.getItem(PREF_STORAGE_KEY);
      return raw ? { ...PREF_DEFAULTS, ...JSON.parse(raw) } : PREF_DEFAULTS;
    } catch { return PREF_DEFAULTS; }
  })();
  const [prefs, setPrefs] = useState<PrefState>(savedPrefs);

  // ── Swipe state ──────────────────────────────────────────────────────────────
  const swipeStart  = useRef<number | null>(null);
  const swipingId   = useRef<string | null>(null);
  const [swipeOffsets, setSwipeOffsets] = useState<Record<string, number>>({});

  // ── Fetch ─────────────────────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    setError(null);
    try {
      const res  = await notificationService.getNotifications();
      const raw  = Array.isArray(res) ? res : (res?.data ?? res?.notifications ?? []);
      const list: AppNotification[] = raw.map(normalizeNotification);
      setNotifications(list);
      setIsMockData(false);
    } catch (err: any) {
      // Use mock data as fallback
      console.warn('Using mock notification data:', err?.message);
      setNotifications(MOCK_NOTIFICATIONS);
      setIsMockData(true);
      setError('Données de démonstration affichées. Impossible de contacter le serveur.');
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  }, []);

  useEffect(() => {
    fetchNotifications(true);
    const interval = setInterval(() => fetchNotifications(false), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // ── Filter logic ──────────────────────────────────────────────────────────────
  const filtered = notifications.filter(n => {
    if (filter === 'all')    return true;
    if (filter === 'unread') return !n.is_read;
    return n.type === filter;
  });

  const filterCounts: Record<string, number> = {
    all:     notifications.length,
    unread:  notifications.filter(n => !n.is_read).length,
    payment: notifications.filter(n => n.type === 'payment').length,
    member:  notifications.filter(n => n.type === 'member').length,
    payout:  notifications.filter(n => n.type === 'payout').length,
  };

  const paginated = filtered.slice(0, page * PAGE_SIZE);
  const hasMore   = filtered.length > paginated.length;
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // ── Navigation ────────────────────────────────────────────────────────────────
  const handleBack = () => {
    try {
      navigate(-1);
    } catch {
      navigate(isAdmin ? '/admin/dashboard' : '/member/dashboard');
    }
  };

  const handleNotifClick = (notif: AppNotification) => {
    // Mark as read locally + on server
    if (!notif.is_read) {
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
      notificationService.markAsRead(notif.id).catch(() => {});
      window.dispatchEvent(new Event('refresh_notifications'));
    }
    // Toggle expansion
    setExpandedId(prev => prev === notif.id ? null : notif.id);
    // Navigate based on type
    setTimeout(() => {
      if (notif.type === 'payment')  navigate('/history');
      else if (notif.type === 'member')  navigate(isAdmin ? '/admin/members' : '/member/dashboard');
      else if (notif.type === 'payout') navigate(isAdmin ? '/admin/dashboard' : '/member/dashboard');
    }, 400);
  };

  // ── Mark as read ──────────────────────────────────────────────────────────────
  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    try {
      await notificationService.markAsRead(id);
      window.dispatchEvent(new Event('refresh_notifications'));
    } catch { toast.error('Erreur lors du marquage.'); }
  };

  const handleMarkAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    try {
      await notificationService.markAllAsRead();
      toast.success('Toutes les alertes marquées comme lues.');
      window.dispatchEvent(new Event('refresh_notifications'));
    } catch {
      // optimistic update already applied; silent
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────────
  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
    notificationService.deleteNotification(id).catch(() => {});
    window.dispatchEvent(new Event('refresh_notifications'));
  };

  const confirmDeleteAllRead = () => {
    setConfirmMsg('Toutes les notifications lues seront définitivement supprimées.');
    setConfirmCb(() => async () => {
      setNotifications(prev => prev.filter(n => !n.is_read));
      setShowConfirmDelete(false);
      try {
        await notificationService.deleteAllRead();
        toast.success('Notifications lues supprimées.');
        window.dispatchEvent(new Event('refresh_notifications'));
      } catch { toast.error('Erreur lors de la suppression.'); }
    });
    setShowConfirmDelete(true);
  };

  // ── Preferences ───────────────────────────────────────────────────────────────
  const handlePrefChange = async (key: keyof PrefState, val: boolean) => {
    const next = { ...prefs, [key]: val };
    setPrefs(next);
    localStorage.setItem(PREF_STORAGE_KEY, JSON.stringify(next));
    try {
      await notificationService.savePreferences(next);
    } catch { /* silent – localStorage already saved */ }
    toast.success('Préférences mises à jour.');
  };

  // ── Swipe handlers ────────────────────────────────────────────────────────────
  const onTouchStart = (id: string, e: React.TouchEvent) => {
    swipeStart.current = e.touches[0].clientX;
    swipingId.current  = id;
  };
  const onTouchMove = (id: string, e: React.TouchEvent) => {
    if (swipeStart.current === null || swipingId.current !== id) return;
    const dx = swipeStart.current - e.touches[0].clientX;
    if (dx > 0) setSwipeOffsets(prev => ({ ...prev, [id]: Math.min(dx, 100) }));
  };
  const onTouchEnd = (id: string) => {
    const offset = swipeOffsets[id] ?? 0;
    if (offset > 60) {
      setNotifications(prev => prev.filter(n => n.id !== id));
      notificationService.deleteNotification(id).catch(() => {});
      window.dispatchEvent(new Event('refresh_notifications'));
    }
    setSwipeOffsets(prev => ({ ...prev, [id]: 0 }));
    swipeStart.current = null;
    swipingId.current  = null;
  };

  // ── Group toggle ──────────────────────────────────────────────────────────────
  const toggleGroup = (group: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      next.has(group) ? next.delete(group) : next.add(group);
      return next;
    });
  };

  // ── Grouped paginated ─────────────────────────────────────────────────────────
  const grouped = groupByDate(paginated);
  const groupOrder = ["Aujourd'hui", 'Hier', 'Cette semaine', 'Plus ancien'];

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      <Navigation />

      <div className="max-w-4xl mx-auto px-[5%] py-12">
        <div className="max-w-3xl mx-auto">

          {/* ── Header ── */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 animate-fade-up">
            <div>
              <button
                onClick={handleBack}
                aria-label="Retour à la page précédente"
                className="flex items-center gap-2 text-[#7A6E5F] font-bold hover:text-[#1A1208] transition-colors mb-4"
              >
                <ArrowLeft size={18} /> Retour
              </button>
              <h1 className="text-4xl font-serif font-black text-[#1A1208]">
                Flux de <em className="italic text-[#C8862A]">Alertes</em>
              </h1>
              <p className="text-[#7A6E5F] font-medium mt-1">
                {loading ? '...' : unreadCount > 0
                  ? `${unreadCount} nouveau${unreadCount > 1 ? 'x' : ''} message${unreadCount > 1 ? 's' : ''} en attente`
                  : 'Votre messagerie est à jour'}
              </p>
              {lastUpdated && !loading && (
                <p className="text-[10px] text-[#C1B7A6] font-bold uppercase tracking-widest mt-1 flex items-center gap-1">
                  <Clock size={10} />
                  Mis à jour {formatRelative(lastUpdated.toISOString())}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  aria-label="Marquer toutes les notifications comme lues"
                  className="px-5 py-2 border-[1.5px] border-[#DDD5C4] text-[#7A6E5F] font-bold rounded-full text-xs uppercase tracking-widest hover:border-[#C8862A] hover:text-[#C8862A] transition-all flex items-center gap-2"
                >
                  <CheckCheck size={14} /> Tout lire
                </button>
              )}
              {notifications.some(n => n.is_read) && (
                <button
                  onClick={confirmDeleteAllRead}
                  aria-label="Supprimer toutes les notifications lues"
                  className="px-5 py-2 border-[1.5px] border-rose-200 text-rose-400 font-bold rounded-full text-xs uppercase tracking-widest hover:border-rose-400 hover:text-rose-600 transition-all flex items-center gap-2"
                >
                  <Trash2 size={14} /> Supprimer lues
                </button>
              )}
              <button
                onClick={() => fetchNotifications(false)}
                aria-label="Actualiser les notifications"
                className="px-5 py-2 border-[1.5px] border-[#DDD5C4] text-[#7A6E5F] font-bold rounded-full text-xs uppercase tracking-widest hover:border-[#C8862A] hover:text-[#C8862A] transition-all flex items-center gap-2"
              >
                <RefreshCw size={13} /> Actualiser
              </button>
            </div>
          </div>

          {/* ── Mock data banner ── */}
          {isMockData && (
            <div className="mb-4 flex items-start gap-3 px-5 py-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-700 font-medium">
              <Info size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ── Filter Tabs ── */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 animate-fade-up [animation-delay:0.05s]">
            <Filter size={14} className="text-[#C1B7A6] shrink-0" />
            {Object.entries(FILTER_LABELS).map(([key, label]) => {
              const count = filterCounts[key] ?? 0;
              const active = filter === key;
              return (
                <button
                  key={key}
                  onClick={() => { setFilter(key); setPage(1); }}
                  aria-pressed={active}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border-[1.5px] transition-all whitespace-nowrap
                    ${active
                      ? 'bg-[#1A1208] border-[#1A1208] text-white'
                      : 'border-[#DDD5C4] text-[#7A6E5F] hover:border-[#C8862A] hover:text-[#C8862A]'
                    }`}
                >
                  {label}
                  {count > 0 && (
                    <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-black
                      ${active ? 'bg-white text-[#1A1208]' : 'bg-[#DDD5C4] text-[#7A6E5F]'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── Count label ── */}
          {!loading && filtered.length > 0 && (
            <p className="text-[10px] font-bold text-[#C1B7A6] uppercase tracking-widest mb-4">
              Affichage de {paginated.length} sur {filtered.length} notification{filtered.length > 1 ? 's' : ''}
            </p>
          )}

          {/* ── Notification list ── */}
          <div className="space-y-4 mb-10 animate-fade-up [animation-delay:0.1s]" role="list">
            {loading ? (
              // Skeletons
              Array.from({ length: 4 }).map((_, i) => (
                <NotificationSkeleton key={i} />
              ))
            ) : error && !isMockData ? (
              // Hard error (not mock)
              <div className="bg-white border-[1.5px] border-rose-200 rounded-[32px] p-10 text-center shadow-sm">
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="text-rose-400" size={32} />
                </div>
                <h3 className="text-lg font-serif font-black text-[#1A1208] mb-2">Erreur de chargement</h3>
                <p className="text-[#7A6E5F] text-sm mb-6">{error}</p>
                <button
                  onClick={() => fetchNotifications(true)}
                  className="px-6 py-2 bg-[#1A1208] text-white font-bold rounded-full text-xs uppercase tracking-widest hover:bg-[#2d1f0d] transition-all"
                >
                  Réessayer
                </button>
              </div>
            ) : filtered.length === 0 ? (
              // Empty states
              <div className="bg-white border-[1.5px] border-[#DDD5C4] rounded-[32px] p-16 text-center shadow-sm">
                <div className="w-20 h-20 bg-[#F7F4EF] rounded-full flex items-center justify-center mx-auto mb-6 text-[#DDD5C4]">
                  <Bell size={40} />
                </div>
                {filter === 'unread' ? (
                  <>
                    <h3 className="text-xl font-serif font-black text-[#1A1208] mb-2">Tout est lu !</h3>
                    <p className="text-[#7A6E5F] mb-6">Vous avez lu toutes vos notifications.</p>
                    <button
                      onClick={() => setFilter('all')}
                      className="px-6 py-2 border-[1.5px] border-[#DDD5C4] text-[#7A6E5F] font-bold rounded-full text-xs uppercase tracking-widest hover:border-[#C8862A] hover:text-[#C8862A] transition-all"
                    >
                      Voir toutes
                    </button>
                  </>
                ) : filter !== 'all' ? (
                  <>
                    <h3 className="text-xl font-serif font-black text-[#1A1208] mb-2">Aucun résultat</h3>
                    <p className="text-[#7A6E5F] mb-6">Aucune notification pour ce filtre.</p>
                    <button
                      onClick={() => setFilter('all')}
                      className="px-6 py-2 border-[1.5px] border-[#DDD5C4] text-[#7A6E5F] font-bold rounded-full text-xs uppercase tracking-widest hover:border-[#C8862A] hover:text-[#C8862A] transition-all"
                    >
                      Voir toutes
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-serif font-black text-[#1A1208] mb-2">Silence Absolu</h3>
                    <p className="text-[#7A6E5F] mb-6">Aucune alerte pour l'instant dans votre cercle.</p>
                    <button
                      onClick={() => navigate(isAdmin ? '/create-tontine' : '/member/dashboard')}
                      className="px-6 py-2 bg-[#1A1208] text-white font-bold rounded-full text-xs uppercase tracking-widest hover:bg-[#2d1f0d] transition-all"
                    >
                      {isAdmin ? 'Créer une tontine' : 'Voir mon tableau de bord'}
                    </button>
                  </>
                )}
              </div>
            ) : (
              // Grouped notifications
              groupOrder.map(group => {
                const items = grouped[group] ?? [];
                if (items.length === 0) return null;
                const collapsed = collapsedGroups.has(group);
                return (
                  <div key={group} role="listitem">
                    {/* Group header */}
                    <button
                      onClick={() => toggleGroup(group)}
                      aria-expanded={!collapsed}
                      className="flex items-center gap-2 w-full mb-3 text-left"
                    >
                      <span className="text-[10px] font-black text-[#C1B7A6] uppercase tracking-[0.2em]">
                        {group}
                      </span>
                      <div className="flex-1 h-px bg-[#DDD5C4]" />
                      {collapsed
                        ? <ChevronDown size={14} className="text-[#C1B7A6]" />
                        : <ChevronUp size={14} className="text-[#C1B7A6]" />
                      }
                    </button>

                    <AnimatePresence initial={false}>
                      {!collapsed && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                          className="space-y-3 overflow-hidden"
                        >
                          {items.map(notif => {
                            const Icon    = getIcon(notif.type);
                            const color   = getIconColor(notif.type);
                            const offset  = swipeOffsets[notif.id] ?? 0;
                            const isExpanded = expandedId === notif.id;

                            return (
                              <motion.div
                                key={notif.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -80 }}
                                transition={{ duration: 0.2 }}
                                role="listitem"
                                className="relative overflow-hidden rounded-[24px]"
                              >
                                {/* Swipe delete background */}
                                {offset > 20 && (
                                  <div className="absolute inset-0 flex items-center justify-end pr-5 bg-rose-500 rounded-[24px] z-0">
                                    <Trash2 size={22} className="text-white" />
                                  </div>
                                )}

                                {/* Card */}
                                <div
                                  className={`group relative p-6 rounded-[24px] border-[1.5px] transition-all cursor-pointer z-10
                                    ${!notif.is_read
                                      ? 'bg-white border-[#C8862A] shadow-md shadow-[#c8862a0a]'
                                      : 'bg-white/50 border-[#DDD5C4] opacity-80 hover:opacity-100'
                                    }`}
                                  style={{ transform: `translateX(-${offset}px)` }}
                                  onClick={() => handleNotifClick(notif)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleNotifClick(notif); }
                                    if (e.key === 'Delete') {
                                      e.preventDefault();
                                      setNotifications(prev => prev.filter(n => n.id !== notif.id));
                                      notificationService.deleteNotification(notif.id).catch(() => {});
                                    }
                                  }}
                                  tabIndex={0}
                                  aria-label={`${notif.title}: ${notif.message}`}
                                  onTouchStart={e => onTouchStart(notif.id, e)}
                                  onTouchMove={e => onTouchMove(notif.id, e)}
                                  onTouchEnd={() => onTouchEnd(notif.id)}
                                >
                                  <div className="flex items-start gap-5">
                                    <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${color} transition-transform group-hover:scale-110`}>
                                      <Icon size={22} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            {!notif.is_read && (
                                              <div className="w-2 h-2 bg-[#C8862A] rounded-full animate-pulse shrink-0" />
                                            )}
                                            <h3 className="font-serif font-black text-[#1A1208] md:text-lg leading-tight">
                                              {notif.title}
                                            </h3>
                                          </div>
                                          <p className="text-[#7A6E5F] text-sm md:text-base leading-relaxed">
                                            {notif.message}
                                          </p>
                                          <div className="flex flex-wrap items-center gap-4 mt-3">
                                            <span className="text-[10px] font-bold text-[#C1B7A6] uppercase tracking-[0.2em]">
                                              {formatRelative(notif.created_at)}
                                            </span>
                                            {notif.tontine_name && (
                                              <span className="text-[10px] font-bold text-[#C8862A] bg-[#F5E6C8] px-2 py-0.5 rounded-full uppercase tracking-widest">
                                                {notif.tontine_name}
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity ml-3 shrink-0">
                                          {!notif.is_read && (
                                            <button
                                              onClick={e => handleMarkAsRead(notif.id, e)}
                                              aria-label="Marquer comme lu"
                                              className="p-2 hover:bg-[#F5E6C8] text-[#C8862A] rounded-full transition-colors"
                                            >
                                              <Check size={16} />
                                            </button>
                                          )}
                                          <button
                                            onClick={e => handleDelete(notif.id, e)}
                                            aria-label="Supprimer la notification"
                                            className="p-2 hover:bg-rose-50 text-rose-400 rounded-full transition-colors"
                                          >
                                            <Trash2 size={16} />
                                          </button>
                                          <button
                                            onClick={e => { e.stopPropagation(); setExpandedId(prev => prev === notif.id ? null : notif.id); }}
                                            aria-label={isExpanded ? "Réduire les détails" : "Voir les détails"}
                                            className="p-2 hover:bg-[#EDE8DE] text-[#7A6E5F] rounded-full transition-colors"
                                          >
                                            <Info size={16} />
                                          </button>
                                        </div>
                                      </div>

                                      {/* Expanded detail panel */}
                                      <AnimatePresence>
                                        {isExpanded && (
                                          <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.22 }}
                                            className="overflow-hidden"
                                          >
                                            <div className="mt-4 pt-4 border-t border-[#EDE8DE] space-y-2 text-xs text-[#7A6E5F]">
                                              <div className="flex items-center justify-between">
                                                <span className="font-bold uppercase tracking-widest text-[#C1B7A6]">Date exacte</span>
                                                <span className="font-bold">
                                                  {new Date(notif.created_at).toLocaleString('fr-FR')}
                                                </span>
                                              </div>
                                              <div className="flex items-center justify-between">
                                                <span className="font-bold uppercase tracking-widest text-[#C1B7A6]">Type</span>
                                                <span className="font-bold capitalize">{notif.type}</span>
                                              </div>
                                              {notif.tontine_name && (
                                                <div className="flex items-center justify-between">
                                                  <span className="font-bold uppercase tracking-widest text-[#C1B7A6]">Tontine</span>
                                                  <span className="font-bold">{notif.tontine_name}</span>
                                                </div>
                                              )}
                                              <div className="flex items-center justify-between">
                                                <span className="font-bold uppercase tracking-widest text-[#C1B7A6]">Statut</span>
                                                <span className={`font-bold ${notif.is_read ? 'text-emerald-600' : 'text-[#C8862A]'}`}>
                                                  {notif.is_read ? 'Lu' : 'Non lu'}
                                                </span>
                                              </div>
                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>

          {/* ── Load more ── */}
          {!loading && hasMore && (
            <div className="text-center mb-10">
              <button
                onClick={() => setPage(p => p + 1)}
                className="px-8 py-3 border-[1.5px] border-[#DDD5C4] text-[#7A6E5F] font-bold rounded-full text-xs uppercase tracking-widest hover:border-[#C8862A] hover:text-[#C8862A] transition-all flex items-center gap-2 mx-auto"
              >
                <ChevronDown size={14} /> Voir plus ({filtered.length - paginated.length} restantes)
              </button>
            </div>
          )}

          {/* ── Preferences Section ── */}
          <div className="bg-[#1A1208] rounded-[40px] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl animate-fade-up [animation-delay:0.2s]">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[radial-gradient(circle_at_center,rgba(200,134,42,0.1)_0%,transparent_70%)] pointer-events-none" />

            <div className="flex items-center gap-4 mb-10 border-b border-white/10 pb-6">
              <Sparkles className="text-[#C8862A]" size={28} />
              <h2 className="text-2xl font-serif font-black">
                Configuration des <em className="italic text-[#C8862A]">Signaux</em>
              </h2>
            </div>

            <div className="space-y-6">
              {([
                {
                  key: 'cotisation' as keyof PrefState,
                  title: 'Échéances de Cotisation',
                  desc: 'Recevoir des alertes 48h avant chaque tour.',
                },
                {
                  key: 'partenaires' as keyof PrefState,
                  title: 'Intégration de Partenaires',
                  desc: "Savoir quand un nouveau membre rejoint votre groupe.",
                },
                {
                  key: 'distributions' as keyof PrefState,
                  title: 'Tirages & Distributions',
                  desc: "Rapports immédiats sur l'ordre de passage et gains.",
                },
                {
                  key: 'courriel' as keyof PrefState,
                  title: 'Canal de Courriel',
                  desc: 'Recevoir une archive hebdomadaire par e-mail.',
                },
              ] as { key: keyof PrefState; title: string; desc: string }[]).map((pref) => (
                <div key={pref.key} className="flex items-center justify-between gap-4 group">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="font-bold text-base sm:text-lg mb-0.5 group-hover:text-[#C8862A] transition-colors truncate">
                      {pref.title}
                    </div>
                    <div className="text-sm text-white/50 leading-relaxed">{pref.desc}</div>
                  </div>
                  <div className="shrink-0">
                    <ToggleSwitch
                      id={`pref-${pref.key}`}
                      checked={prefs[pref.key]}
                      onChange={val => handlePrefChange(pref.key, val)}
                      label={pref.title}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <footer className="mt-12 text-center text-[#C1B7A6] text-xs font-bold uppercase tracking-widest italic">
            Toutes vos alertes sont stockées de manière sécurisée
          </footer>

        </div>
      </div>

      {/* ── Confirm dialog ── */}
      <AnimatePresence>
        {showConfirmDelete && confirmCb && (
          <ConfirmDialog
            message={confirmMsg}
            onConfirm={confirmCb}
            onCancel={() => setShowConfirmDelete(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationsPage;
