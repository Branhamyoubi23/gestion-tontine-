import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, Users, CreditCard, 
  RotateCw, History, Bell, LogOut, 
  ChevronRight, ChevronLeft, Settings, ShieldCheck, Landmark, X, Shuffle,
  ChevronDown, ChevronUp, Loader2, HandCoins, Gavel, Calculator, HelpCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '@/services/api';
import { toast } from 'react-toastify';
import Modal from '../../shared/Modal';

interface AdminSidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
  brandName?: string;
  onCollapseChange?: (collapsed: boolean) => void;
}

const AdminSidebar = ({ 
  activeSection, 
  setActiveSection, 
  isOpen, 
  onClose,
  brandName = 'Tontine',
  onCollapseChange
}: AdminSidebarProps) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  // Collapsible state (stored in localStorage)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('admin_sidebar_collapsed') === 'true';
  });

  // Alerts counter state
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);

  // Submenu expansion states
  const [expandedSubmenuId, setExpandedSubmenuId] = useState<string | null>(() => {
    // If active section is part of a submenu, keep that submenu expanded initially
    if (activeSection.startsWith('finance-')) return 'finance';
    return null;
  });

  // Logout confirmation states
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Mobile media query check hook
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Swipe gesture refs
  const [touchStartX, setTouchStartX] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync collapsed state with parent
  useEffect(() => {
    onCollapseChange?.(isCollapsed);
  }, [isCollapsed, onCollapseChange]);

  // Alert polling poller
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await notificationService.getNotifications();
        const list = Array.isArray(res) ? res : (res.data || []);
        const unread = list.filter((n: any) => !n.is_read).length;
        setUnreadAlertsCount(unread);
      } catch (err) {
        console.error("Failed to load notifications count", err);
      }
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  // Active section URL Hash persistence
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      const allItems = menuItems.flatMap(item => [item, ...(item.children || [])]);
      if (allItems.some(item => item.id === hash)) {
        setActiveSection(hash);
        if (hash.startsWith('finance-')) {
          setExpandedSubmenuId('finance');
        }
      }
    }
  }, []);

  useEffect(() => {
    if (activeSection) {
      window.location.hash = activeSection;
    }
  }, [activeSection]);

  // Back button close on mobile
  useEffect(() => {
    const handlePopState = () => {
      if (isOpen) {
        onClose?.();
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isOpen, onClose]);

  // Swipe gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === 0) return;
    const currentX = e.touches[0].clientX;
    const diff = touchStartX - currentX;
    // Swipe left (at least 50px) to close sidebar
    if (diff > 50) {
      onClose?.();
      setTouchStartX(0);
    }
  };

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('admin_sidebar_collapsed', String(next));
      return next;
    });
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    setShowLogoutConfirm(false);
    try {
      await logout();
      localStorage.clear();
      toast.success("Déconnexion réussie !");
      navigate('/');
    } catch (err) {
      toast.error("Erreur lors de la déconnexion.");
    } finally {
      setLoggingOut(false);
    }
  };

  const menuItems = [
    { id: 'overview',      label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'members',       label: 'Membres',         icon: Users },
    { id: 'contributions', label: 'Cotisations',     icon: CreditCard },
    { id: 'cycle',         label: 'Gestion Cycle',   icon: RotateCw },
    { id: 'draw',          label: 'Tirage & Ordre',  icon: Shuffle }, 
    { 
      id: 'finance',       
      label: 'Finance & Banque', 
      icon: Landmark,
      roles: ['admin', 'super-admin'],
      children: [
        { id: 'finance-loans', label: 'Prêts', icon: HandCoins },
        { id: 'finance-auctions', label: 'Enchères', icon: Gavel },
        { id: 'finance-dist', label: 'Distribution', icon: Calculator }
      ]
    },
    { id: 'history',       label: 'Historique',      icon: History },
    { id: 'alerts',        label: 'Alertes',         icon: Bell },
    { id: 'settings',      label: 'Configuration',   icon: Settings }
  ];

  const handleItemClick = (item: any) => {
    // Check permission role restriction
    if (item.roles && user?.role && !item.roles.includes(user.role)) {
      toast.error("Accès refusé : Droits insuffisants.");
      return;
    }

    if (item.children) {
      setExpandedSubmenuId(prev => prev === item.id ? null : item.id);
    } else {
      setActiveSection(item.id);
      if (item.id === 'settings') {
        navigate('/admin/settings');
      }
      if (isMobile) onClose?.();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden animate-in fade-in duration-300"
          onClick={onClose}
        />
      )}

      <aside 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}
        className={`fixed scroll:hidden left-0 top-0 h-screen bg-[#0F172A] text-white flex flex-col z-[70] border-r border-white/5 transition-all duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed && !isMobile ? 'w-24' : 'w-72'}`}
      >
        {/* Brand Logo Header */}
        <div className={`p-8 flex items-center justify-between mb-6 ${isCollapsed && !isMobile ? 'flex-col gap-4 px-2' : ''}`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 flex-shrink-0">
              <ShieldCheck size={28} className="text-white" />
            </div>
            {(!isCollapsed || isMobile) && (
              <div>
                <h1 className="text-xl font-black tracking-tight" style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}>
                  {brandName}
                </h1>
                <p className="text-[10px] uppercase font-black tracking-[0.2em] text-blue-400 opacity-80">Admin Console</p>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1.5">
            {/* Collapse toggle desktop button */}
            <button 
              onClick={toggleCollapse}
              aria-label={isCollapsed ? "Agrandir le menu" : "Réduire le menu"}
              className="hidden lg:flex w-8 h-8 rounded-lg bg-white/5 border border-white/10 items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>

            {/* Mobile Close Button */}
            {isOpen && (
              <button 
                onClick={onClose} 
                aria-label="Fermer le menu"
                className="lg:hidden p-2 text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Area */}
        <nav 
          role="navigation" 
          className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar"
        >
          {menuItems.map((item) => {
            const hasChildren = !!item.children;
            const isSubExpanded = expandedSubmenuId === item.id;
            const active = activeSection === item.id || (hasChildren && activeSection.startsWith(item.id + '-'));
            
            // Check permission restricted role
            const hasAccess = !item.roles || !user?.role || item.roles.includes(user.role);

            return (
              <div key={item.id} className="space-y-1 relative group">
                <button
                  onClick={() => handleItemClick(item)}
                  disabled={!hasAccess}
                  aria-current={active ? "page" : undefined}
                  aria-label={item.label}
                  className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all relative ${
                    active 
                      ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' 
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  } ${!hasAccess ? 'opacity-40 cursor-not-allowed' : ''} ${isCollapsed && !isMobile ? 'justify-center px-4' : ''} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
                >
                  {/* Sliding active left bar indicator */}
                  {active && (
                    <div className="absolute left-0 top-3 bottom-3 w-1 bg-blue-400 rounded-r-full" />
                  )}

                  <div className="flex items-center gap-4">
                    <item.icon size={20} className={active ? 'text-white' : 'group-hover:text-blue-400'} />
                    {(!isCollapsed || isMobile) && (
                      <span className="text-sm font-bold tracking-wide">{item.label}</span>
                    )}
                  </div>

                  {/* Right side decorators */}
                  {(!isCollapsed || isMobile) && (
                    <div className="flex items-center gap-2">
                      {item.id === 'alerts' && unreadAlertsCount > 0 && (
                        <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-black rounded-full animate-pulse">
                          {unreadAlertsCount}
                        </span>
                      )}
                      {hasChildren && (
                        isSubExpanded ? <ChevronUp size={14} className="opacity-50" /> : <ChevronDown size={14} className="opacity-50" />
                      )}
                    </div>
                  )}

                  {/* Collapsed view absolute hover tooltip */}
                  {isCollapsed && !isMobile && (
                    <div className="group-hover:block hidden absolute left-full ml-4 px-3 py-2 bg-slate-800 text-white text-xs font-black rounded-lg shadow-lg whitespace-nowrap z-[9999] pointer-events-none animate-in fade-in slide-in-from-left-2 duration-200">
                      {item.label}
                      {item.id === 'alerts' && unreadAlertsCount > 0 && ` (${unreadAlertsCount})`}
                    </div>
                  )}
                </button>

                {/* Submenu Children container */}
                {hasChildren && isSubExpanded && (!isCollapsed || isMobile) && (
                  <div className="pl-6 space-y-1 mt-1 transition-all duration-300 animate-in slide-in-from-top-2">
                    {item.children?.map(sub => {
                      const subActive = activeSection === sub.id;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => {
                            setActiveSection(sub.id);
                            if (isMobile) onClose?.();
                          }}
                          aria-current={subActive ? "page" : undefined}
                          aria-label={sub.label}
                          className={`w-full flex items-center gap-3 px-6 py-3 rounded-xl transition-all text-xs font-bold ${
                            subActive 
                              ? 'bg-blue-600/30 text-blue-400' 
                              : 'text-slate-500 hover:text-white hover:bg-white/5'
                          } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
                        >
                          <sub.icon size={14} />
                          <span>{sub.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Profile & Footer Info */}
        <div className="mt-auto border-t border-white/5 bg-slate-900/50">
          <div className={`p-6 flex flex-col gap-4`}>
            
            {/* User Profile display */}
            <div className={`flex items-center gap-4 px-2 ${isCollapsed && !isMobile ? 'flex-col text-center px-0' : ''}`}>
              {!user ? (
                // Skeletons while auth loads
                <div className="flex items-center gap-4 animate-pulse w-full">
                  <div className="w-10 h-10 rounded-full bg-slate-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-slate-800 rounded w-20" />
                    <div className="h-2.5 bg-slate-800 rounded w-16" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30 font-black text-blue-400 flex-shrink-0">
                    {user.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
                  </div>
                  {(!isCollapsed || isMobile) && (
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-black text-white truncate w-32">
                        {user.name || 'Administrateur'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate">
                        {user.role || 'Master Admin'}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Logout button */}
            <button 
              onClick={() => setShowLogoutConfirm(true)}
              disabled={loggingOut}
              aria-label="Se déconnecter de la session"
              className={`w-full flex items-center gap-3 px-6 py-3 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-400/5 transition-all text-xs font-black uppercase tracking-widest ${
                isCollapsed && !isMobile ? 'justify-center px-0' : ''
              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500`}
            >
              {loggingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
              {(!isCollapsed || isMobile) && <span>Déconnexion</span>}
            </button>

            {/* Sidebar bottom footer information */}
            {(!isCollapsed || isMobile) && (
              <div className="px-2 pt-2 border-t border-white/5 flex flex-col gap-1 text-[10px] text-slate-600 font-medium">
                <div className="flex items-center justify-between">
                  <span>© {new Date().getFullYear()} Tontinepro</span>
                  <span>v1.2.0</span>
                </div>
                <a 
                  href="/help"
                  className="hover:underline flex items-center gap-1 mt-1 text-blue-500/80 w-fit"
                  onClick={(e) => { e.preventDefault(); navigate('/help'); }}
                >
                  <HelpCircle size={10} /> Centre d'aide & Docs
                </a>
              </div>
            )}

          </div>
        </div>
      </aside>

      {/* LOGOUT CONFIRMATION DIALOG MODAL */}
      {showLogoutConfirm && (
        <Modal 
          isOpen={showLogoutConfirm} 
          onClose={() => setShowLogoutConfirm(false)} 
          title="Confirmer la déconnexion"
        >
          <div className="space-y-6 p-2">
            <p className="text-slate-600 text-sm">
              Êtes-vous sûr de vouloir vous déconnecter de votre session administrative ?
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleLogout}
                aria-label="Confirmer la déconnexion de l'application"
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
              >
                Déconnexion
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                aria-label="Annuler la déconnexion"
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
              >
                Annuler
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default AdminSidebar;
