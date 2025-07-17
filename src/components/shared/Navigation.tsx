import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Bell, 
  User, 
  Home, 
  Plus, 
  Wallet,
  Settings,
  LogOut,
  Menu,
  X,
  HelpCircle,
  History,
  UserPlus,
  CheckCircle,
  Coins
} from 'lucide-react';

const Navigation = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [adminNotifCount, setAdminNotifCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    fetch(`http://localhost:3000/api/tontines?userId=${user.id}`)
      .then(res => res.json())
      .then(tontines => {
        const adminInOne = tontines.some(t => t.role === 'admin');
        setIsAdmin(adminInOne);
      });
  }, [user]);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const fetchNotif = () => {
      fetch(`http://localhost:3000/api/notifications?userId=${userId}`)
        .then(res => res.json())
        .then(data => {
          const unread = data.filter(n => n.read === 0).length;
          setNotifCount(unread);
        });
    };
    fetchNotif();
    const interval = setInterval(fetchNotif, 5000); // toutes les 5 secondes
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user || !isAdmin) return;
    const fetchAdminNotif = () => {
      fetch(`http://localhost:3000/api/payments/admin?adminId=${user.id}`)
        .then(res => res.json())
        .then(data => setAdminNotifCount(data.length));
    };
    fetchAdminNotif();
    const interval = setInterval(fetchAdminNotif, 5000);
    return () => clearInterval(interval);
  }, [user, isAdmin]);

  // On insère le lien admin juste avant "Paramètres"
  const menuItems = [
    { icon: Home, label: 'Tableau de bord', path: '/dashboard' },
    { icon: Plus, label: 'Créer tontine', path: '/create-tontine' },
    { icon: Wallet, label: 'Paiements', path: '/payment' },
    { icon: History, label: 'Historique', path: '/history' },
    { icon: UserPlus, label: 'Invitations', path: '/invitations' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
    // Lien admin inséré ici si besoin
    ...(isAdmin ? [{ icon: Coins, label: 'Payement à valider', path: '/admin/payments' }] : []),
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div 
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => navigate('/dashboard')}
          >
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 hidden sm:block">Tontine Connect</h1>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors relative"
              >
                <item.icon className="h-4 w-4" />
                <span className="text-sm">{item.label}</span>
                {/* Badge pour Notifications */}
                {item.label === 'Notifications' && notifCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full px-1.5">
                    {notifCount}
                  </span>
                )}
                {/* Badge pour Paiement à valider */}
                {item.label === 'Payement à valider' && adminNotifCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full px-1.5">
                    {adminNotifCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* User Avatar */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center"onClick={() => navigate('/profile')}>
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white text-sm font-medium">
                    {user?.name?.charAt(0)}
                  </span>
                )}
              </div>
              <span className="text-sm text-gray-700 hidden sm:block">
                {user?.name?.split(' ')[0]}
              </span>
            </div>

            {/* Logout Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="hidden sm:flex"
            >
              <LogOut className="h-4 w-4" />
            </Button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="space-y-3">
              {menuItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-3 w-full text-left px-2 py-2 text-gray-600 hover:text-gray-900 transition-colors relative"
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                  {/* Badge pour Notifications */}
                  {item.label === 'Notifications' && notifCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full px-1.5">
                      {notifCount}
                    </span>
                  )}
                  {/* Badge pour Paiement à valider */}
                  {item.label === 'Payement à valider' && adminNotifCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full px-1.5">
                      {adminNotifCount}
                    </span>
                  )}
                </button>
              ))}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 w-full text-left px-2 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
