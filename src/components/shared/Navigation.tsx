import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService } from '@/services/api';
import { useSocket } from '@/hooks/useSocket';
import {
  Home, Plus, Wallet, LogOut, Menu, History,
  Star, UserPlus, Handshake, Bell, X, Clock,
  CheckCircle2, Trash2, ShieldCheck, Settings, Users
} from 'lucide-react';
import { toast } from 'react-toastify';

/* ─── Design tokens ─── */
const GREEN  = '#1B4332';
const GREEN2 = '#2D6A4F';
const GOLD   = '#C9A84C';
const GOLD2  = '#F0D078';

const Navigation = () => {
  const { user, logout } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const isAdmin    = user?.role === 'admin';

  const [isMobileOpen,       setIsMobileOpen]       = useState(false);
  const [notifications,       setNotifications]       = useState<any[]>([]);
  const [showNotifications,   setShowNotifications]   = useState(false);

  useSocket();

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res  = await notificationService.getNotifications();
      const list = Array.isArray(res) ? res : (res.data || []);
      setNotifications(list);
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetchNotifications();
    const handleRefresh = () => fetchNotifications();
    window.addEventListener('refresh_notifications', handleRefresh);
    const interval = setInterval(fetchNotifications, 60000);
    return () => {
      window.removeEventListener('refresh_notifications', handleRefresh);
      clearInterval(interval);
    };
  }, [user]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch { toast.error('Erreur lors du marquage'); }
  };

  const handleDeleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch { toast.error('Erreur lors de la suppression'); }
  };

  /* ─── Nav links per role ─── */
  const memberLinks = [
    { icon: Home,    label: 'Accueil',   path: '/dashboard' },
    { icon: History, label: 'Historique', path: '/history' },
    { icon: UserPlus,label: 'Rejoindre', path: '/dashboard' },
  ];

  const adminLinks = [
    { icon: Home,     label: 'Dashboard', path: '/dashboard' },
    { icon: Plus,     label: 'Créer',     path: '/create-tontine' },
    { icon: Settings, label: 'Config',    path: '/settings' },
    { icon: Users,    label: 'Membres',   path: '/profile' },
  ];

  const links = isAdmin ? adminLinks : memberLinks;

  /* ─── Initials ─── */
  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <nav
      className="sticky top-0 z-[100] w-full"
      style={{ background: GREEN, boxShadow: '0 2px 20px rgba(0,0,0,0.25)' }}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* ── Logo ── */}
        <button
          onClick={() => navigate(isAdmin ? '/admin/dashboard' : '/member/dashboard')}
          className="flex items-center gap-2.5 group flex-shrink-0"
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105"
            style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD2})` }}
          >
            {isAdmin
              ? <ShieldCheck size={18} className="text-white" />
              : <Handshake   size={18} className="text-white" />
            }
          </div>
          <span style={{ color: GOLD, fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700 }}>
            T
          </span>
          <span className="text-white font-bold text-lg" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            ontine
          </span>
          {isAdmin && (
            <span
              className="ml-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full hidden sm:inline"
              style={{ background: GOLD, color: GREEN }}
            >
              Admin
            </span>
          )}
        </button>

        {/* ── Desktop Links ── */}
        <div className="hidden lg:flex items-center gap-1">
          {links.map((link) => {
            const active = location.pathname === link.path;
            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  active
                    ? 'text-white'
                    : 'text-white/65 hover:text-white hover:bg-white/10'
                }`}
                style={active ? { background: 'rgba(255,255,255,0.15)' } : {}}
              >
                <link.icon size={15} />
                {link.label}
              </button>
            );
          })}
        </div>

        {/* ── Right section ── */}
        <div className="flex items-center gap-2 relative">

          {/* Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-10 h-10 rounded-full flex items-center justify-center text-white/65 hover:text-white hover:bg-white/10 transition-all"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2"
                  style={{ borderColor: GREEN }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown */}
            {showNotifications && (
              <div
                className="absolute top-14 right-0 w-[340px] rounded-2xl shadow-2xl overflow-hidden"
                style={{ background: '#fff', border: '1px solid #E5E7EB' }}
              >
                <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: '#F3F4F6' }}>
                  <h3 className="font-bold text-slate-800">Notifications</h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {notifications.length} au total
                  </span>
                </div>
                <div className="max-h-[380px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-12 text-center text-slate-400">
                      <Bell size={32} className="mx-auto opacity-20 mb-3" />
                      <p className="text-sm">Aucune notification</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-4 border-b hover:bg-slate-50 transition-colors relative group ${!n.is_read ? 'bg-amber-50/40' : ''}`}
                        style={{ borderColor: '#F9FAFB' }}
                      >
                        <div className="flex gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            n.type?.includes('payment') ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            <Clock size={15} />
                          </div>
                          <div className="flex-1">
                            <p className={`text-xs leading-relaxed ${!n.is_read ? 'text-slate-800 font-semibold' : 'text-slate-500'}`}>
                              {n.message}
                            </p>
                            <p className="text-[9px] text-slate-400 mt-1 font-medium">
                              {new Date(n.created_at).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!n.is_read && (
                            <button
                              onClick={(e) => handleMarkAsRead(n.id, e)}
                              className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-sm border hover:bg-emerald-50"
                            >
                              <CheckCircle2 size={13} />
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDeleteNotification(n.id, e)}
                            className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-red-500 shadow-sm border hover:bg-red-50"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="p-3 text-center border-t" style={{ borderColor: '#F3F4F6' }}>
                    <button
                      onClick={() => navigate('/notifications')}
                      className="text-[11px] font-bold uppercase tracking-widest transition-colors"
                      style={{ color: GOLD }}
                    >
                      Voir toutes les alertes
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Avatar */}
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2.5 group pl-2 border-l border-white/20 ml-1"
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all group-hover:scale-105 overflow-hidden"
              style={
                isAdmin
                  ? { background: GOLD, borderColor: GOLD2, color: GREEN }
                  : { background: GREEN2, borderColor: '#52B788', color: GOLD2 }
              }
            >
              {user?.profile_picture
                ? <img src={user.profile_picture} className="w-full h-full object-cover" />
                : initials
              }
            </div>
            <div className="hidden md:flex flex-col items-start">
              <span className="text-xs font-semibold text-white leading-tight">
                {user?.name?.split(' ')[0]}
              </span>
              <span className="text-[10px]" style={{ color: GOLD }}>
                {isAdmin ? 'Fondateur' : 'Membre'}
              </span>
            </div>
          </button>

          {/* Logout */}
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="hidden lg:flex w-9 h-9 rounded-full items-center justify-center text-white/50 hover:text-red-400 hover:bg-white/10 transition-all ml-1"
            title="Se déconnecter"
          >
            <LogOut size={16} />
          </button>

          {/* Mobile toggle */}
          <button
            className="lg:hidden w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all ml-1"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
          >
            {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* ── Mobile Drawer ── */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[110] flex flex-col"
          style={{ background: GREEN }}
        >
          <div className="flex justify-between items-center p-5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: GOLD }}>
                {isAdmin ? <ShieldCheck size={16} className="text-white" /> : <Handshake size={16} className="text-white" />}
              </div>
              <span className="font-bold text-white text-base">
                T<span style={{ color: GOLD }}>ontine</span>
              </span>
            </div>
            <button onClick={() => setIsMobileOpen(false)} className="text-white">
              <X size={22} />
            </button>
          </div>

          <div className="flex flex-col gap-1 p-5">
            {links.map((link) => {
              const active = location.pathname === link.path;
              return (
                <button
                  key={link.path}
                  onClick={() => { navigate(link.path); setIsMobileOpen(false); }}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all ${
                    active ? 'text-white' : 'text-white/65 hover:text-white hover:bg-white/10'
                  }`}
                  style={active ? { background: 'rgba(255,255,255,0.15)' } : {}}
                >
                  <link.icon size={20} style={{ color: GOLD }} />
                  <span className="font-semibold">{link.label}</span>
                </button>
              );
            })}
            <button
              onClick={() => { logout(); navigate('/'); setIsMobileOpen(false); }}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-red-400 hover:bg-white/10 transition-all mt-4"
            >
              <LogOut size={20} />
              <span className="font-semibold">Se déconnecter</span>
            </button>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700;900&display=swap');
      `}</style>
    </nav>
  );
};

export default Navigation;
