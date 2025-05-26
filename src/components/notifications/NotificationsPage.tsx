
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Navigation from '@/components/shared/Navigation';
import { Bell, Check, Trash2, DollarSign, Users, Calendar, Settings } from 'lucide-react';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      type: 'payment',
      title: 'Paiement dû',
      message: 'Votre contribution pour "Tontine des amis" est due demain.',
      date: '2024-01-31',
      read: false,
      icon: DollarSign,
      color: 'text-red-600 bg-red-100'
    },
    {
      id: '2',
      type: 'member',
      title: 'Nouveau membre',
      message: 'Sophie Laurent a rejoint votre tontine "Épargne famille".',
      date: '2024-01-30',
      read: false,
      icon: Users,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      id: '3',
      type: 'payout',
      title: 'Distribution',
      message: 'Vous recevrez 800€ de "Tontine des amis" le 15 février.',
      date: '2024-01-29',
      read: true,
      icon: Calendar,
      color: 'text-green-600 bg-green-100'
    },
    {
      id: '4',
      type: 'payment',
      title: 'Paiement confirmé',
      message: 'Votre paiement de 100€ a été confirmé.',
      date: '2024-01-28',
      read: true,
      icon: Check,
      color: 'text-green-600 bg-green-100'
    }
  ]);

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-600 mt-2">
                {unreadCount > 0 ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}` : 'Toutes les notifications sont lues'}
              </p>
            </div>
            <div className="flex space-x-2">
              {unreadCount > 0 && (
                <Button variant="outline" onClick={markAllAsRead}>
                  Tout marquer comme lu
                </Button>
              )}
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Paramètres
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {notifications.length === 0 ? (
              <Card className="p-8 text-center">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune notification</h3>
                <p className="text-gray-600">Vous n'avez aucune notification pour le moment.</p>
              </Card>
            ) : (
              notifications.map((notification) => (
                <Card key={notification.id} className={`p-4 transition-colors ${
                  !notification.read ? 'bg-blue-50 border-blue-200' : 'bg-white'
                }`}>
                  <div className="flex items-start space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${notification.color}`}>
                      <notification.icon className="h-5 w-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className={`text-sm font-medium ${
                            !notification.read ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {notification.date}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          {!notification.read && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Notification Settings */}
          <Card className="p-6 mt-8">
            <h2 className="text-lg font-semibold mb-4">Préférences de notification</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Paiements dus</div>
                  <div className="text-sm text-gray-600">Recevoir des rappels avant les échéances</div>
                </div>
                <Button variant="outline" size="sm">
                  Activé
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Nouveaux membres</div>
                  <div className="text-sm text-gray-600">Être notifié quand quelqu'un rejoint une tontine</div>
                </div>
                <Button variant="outline" size="sm">
                  Activé
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Distributions</div>
                  <div className="text-sm text-gray-600">Recevoir des notifications sur les tours de distribution</div>
                </div>
                <Button variant="outline" size="sm">
                  Activé
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">E-mail</div>
                  <div className="text-sm text-gray-600">Recevoir les notifications par e-mail</div>
                </div>
                <Button variant="outline" size="sm">
                  Désactivé
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
