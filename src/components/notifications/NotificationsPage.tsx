import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Navigation from '@/components/shared/Navigation';
import { Users, Check, X } from 'lucide-react';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    fetch(`http://localhost:3000/api/notifications?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        console.log('Notifications reçues:', data); // Pour debug
        setNotifications(data);
      });
  }, []);

  const handleAccept = async (notif) => {
    // Accepter l'invitation (à adapter selon ton backend)
    await fetch(`http://localhost:3000/api/tontine-members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tontineId: notif.tontine_id,
        userId: notif.user_id,
        role: 'member'
      }),
    });
    await fetch(`http://localhost:3000/api/notifications/${notif.id}`, {
      method: 'DELETE',
    });
    setNotifications(notifications.filter(n => n.id !== notif.id));
  };

  const handleDecline = async (notif) => {
    await fetch(`http://localhost:3000/api/notifications/${notif.id}`, {
      method: 'DELETE',
    });
    setNotifications(notifications.filter(n => n.id !== notif.id));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Invitations à rejoindre une tontine</h1>
          {notifications.length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune invitation</h3>
              <p className="text-gray-600">Vous n'avez aucune invitation en attente.</p>
            </Card>
          ) : (
            notifications.map((notif) => (
              <Card key={notif.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">
                    Invitation à rejoindre la tontine <span className="text-blue-600">"{notif.tontine_name}"</span>
                  </div>
                  <div className="text-gray-600 text-sm mt-1">
                    {notif.message}
                  </div>
                  <div className="text-gray-500 text-xs mt-1">
                    Tontine : {notif.tontine_name || 'Non renseigné'}
                  </div>
                </div>
                <div className="flex space-x-2 mt-4 sm:mt-0">
                  <Button variant="default" onClick={() => handleAccept(notif)}>
                    <Check className="h-5 w-5" /> Accepter
                  </Button>
                  <Button variant="destructive" onClick={() => handleDecline(notif)}>
                    <X className="h-5 w-5" /> Refuser
                  </Button>
                </div>
              </Card>
            )))
          }
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
