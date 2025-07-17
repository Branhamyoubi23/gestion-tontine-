import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Coins } from 'lucide-react'; // ou ton icône

const Navigation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminNotifCount, setAdminNotifCount] = useState(0);
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    // On récupère les tontines où l'utilisateur est membre
    fetch(`http://localhost:3000/api/tontines?userId=${user.id}`)
      .then(res => res.json())
      .then(tontines => {
        // Vérifie si l'utilisateur est admin dans au moins une tontine
        const adminInOne = tontines.some(t =>
          t.members?.some(m => m.user_id === user.id && m.role === 'admin')
        );
        setIsAdmin(adminInOne);
      });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    // On ne fetch que si l'utilisateur est admin
    fetch(`http://localhost:3000/api/payments/admin?adminId=${user.id}`)
      .then(res => res.json())
      .then(data => {
        setAdminNotifCount(data.length);
      });
    // Optionnel : rafraîchir toutes les 10 secondes
    const interval = setInterval(() => {
      fetch(`http://localhost:3000/api/payments/admin?adminId=${user.id}`)
        .then(res => res.json())
        .then(data => setAdminNotifCount(data.length));
    }, 10000);
    return () => clearInterval(interval);
  }, [user, isAdmin]);

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Coins },
    { path: '/notifications', label: 'Notifications', icon: Coins },
    { path: '/admin/payments', label: 'Paiement à valider', icon: Coins },
    // ...autres items de menu
  ];

  return (
    <nav>
      {menuItems.map(item => (
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
          {item.label === 'Paiement à valider' && adminNotifCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full px-1.5">
              {adminNotifCount}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
};

export default Navigation;