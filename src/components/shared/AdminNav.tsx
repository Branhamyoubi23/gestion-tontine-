import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Handshake, LayoutDashboard, Plus, Settings, Users, Bell, LogOut, Menu, X, ShieldCheck } from 'lucide-react';

const AdminNav = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Plus, label: 'Créer', path: '/create-tontine' },
    { icon: Settings, label: 'Config', path: '/settings' },
    { icon: Users, label: 'Profil', path: '/profile' },
  ];

  return (
    <nav className="sticky top-0 z-[100] w-full border-b border-slate-800" style={{ background: '#0F172A' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo */}
        <button onClick={() => navigate('/admin/dashboard')} className="flex items-center gap-2.5 group">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #2563EB, #1E40AF)' }}
          >
            <ShieldCheck size={20} className="text-white" />
          </div>
          <span style={{ color: '#C9A84C', fontFamily: 'Playfair Display, serif' }} className="text-xl font-bold">
            T
          </span>
          <span className="text-white text-xl font-bold" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            ontine
          </span>
          <span
            className="ml-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{ background: '#C9A84C', color: '#1B4332' }}
          >
            Admin
          </span>
        </button>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-1">
          {links.map((link) => {
            const active = location.pathname === link.path;
            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  active ? 'bg-white/15 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                <link.icon size={15} />
                {link.label}
              </button>
            );
          })}
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/notifications')}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all"
          >
            <Bell size={18} />
          </button>

          {/* Admin Gold Avatar */}
          <button onClick={() => navigate('/profile')} className="flex items-center gap-2 group">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all group-hover:scale-105"
              style={{ background: '#C9A84C', borderColor: '#F0D078', color: '#1B4332', fontFamily: 'DM Sans, sans-serif' }}
            >
              {user?.name
                ? user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
                : 'AD'}
            </div>
            <div className="hidden md:flex flex-col items-start">
              <span className="text-xs font-semibold text-white leading-tight">
                {user?.name?.split(' ')[0] ?? 'Admin'}
              </span>
              <span className="text-[10px]" style={{ color: '#C9A84C' }}>Fondateur</span>
            </div>
          </button>

          <button
            onClick={() => { logout(); navigate('/'); }}
            className="hidden lg:flex items-center justify-center w-9 h-9 rounded-full text-white/50 hover:text-red-400 hover:bg-white/10 transition-all"
          >
            <LogOut size={16} />
          </button>

          <button className="lg:hidden text-white/80 hover:text-white" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[110] flex flex-col" style={{ background: '#1B4332' }}>
          <div className="flex justify-between items-center p-6 border-b border-white/10">
            <span className="text-white font-bold text-lg">Menu Admin</span>
            <button onClick={() => setMobileOpen(false)} className="text-white"><X size={24} /></button>
          </div>
          <div className="flex flex-col gap-2 p-6">
            {links.map((link) => (
              <button
                key={link.path}
                onClick={() => { navigate(link.path); setMobileOpen(false); }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all text-left"
              >
                <link.icon size={20} style={{ color: '#C9A84C' }} />
                <span className="font-medium">{link.label}</span>
              </button>
            ))}
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-white/10 transition-all mt-4"
            >
              <LogOut size={20} />
              <span className="font-medium">Se déconnecter</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default AdminNav;
