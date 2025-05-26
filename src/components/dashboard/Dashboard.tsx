
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Navigation from '@/components/shared/Navigation';
import { Plus, Users, Wallet, Clock, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Mock data
  const [tontines] = useState([
    {
      id: '1',
      name: 'Épargne Famille',
      type: 'sequential',
      members: 8,
      totalAmount: 4000,
      myContribution: 500,
      nextPayment: '2024-01-15',
      status: 'active',
      isAdmin: true
    },
    {
      id: '2',
      name: 'Projet Vacances',
      type: 'random',
      members: 12,
      totalAmount: 6000,
      myContribution: 500,
      nextPayment: '2024-01-20',
      status: 'active',
      isAdmin: false
    },
    {
      id: '3',
      name: 'Investissement Pro',
      type: 'sequential',
      members: 6,
      totalAmount: 12000,
      myContribution: 2000,
      nextPayment: '2024-01-25',
      status: 'pending',
      isAdmin: false
    }
  ]);

  const stats = {
    totalContributions: 3000,
    activeTontines: tontines.filter(t => t.status === 'active').length,
    nextReceiving: 4000,
    completedRounds: 2
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bonjour {user?.name?.split(' ')[0]} ! 👋
          </h1>
          <p className="text-gray-600">
            Voici un aperçu de vos tontines et activités récentes
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total épargné</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalContributions.toLocaleString()} €
                </p>
              </div>
              <Wallet className="h-8 w-8 text-blue-600" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tontines actives</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeTontines}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Prochaine réception</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.nextReceiving.toLocaleString()} €
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tours complétés</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedRounds}</p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
          </Card>
        </div>

        {/* Tontines Section */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* My Tontines */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Mes Tontines</h2>
              <Button 
                onClick={() => navigate('/create-tontine')}
                className="bg-gradient-to-r from-blue-600 to-green-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer une tontine
              </Button>
            </div>
            
            <div className="space-y-4">
              {tontines.map((tontine) => (
                <Card 
                  key={tontine.id} 
                  className="p-6 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/tontine/${tontine.id}`)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        {tontine.name}
                        {tontine.isAdmin && (
                          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            Admin
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600 capitalize">
                        {tontine.type === 'sequential' ? 'Séquentielle' : 'Aléatoire'} • {tontine.members} membres
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      tontine.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {tontine.status === 'active' ? 'Active' : 'En attente'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Pot total</p>
                      <p className="font-semibold">{tontine.totalAmount.toLocaleString()} €</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Ma contribution</p>
                      <p className="font-semibold">{tontine.myContribution.toLocaleString()} €</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Prochain paiement</p>
                      <p className="font-semibold">{new Date(tontine.nextPayment).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Quick Actions & Recent Activity */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/create-tontine')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une nouvelle tontine
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/payment')}
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Effectuer un paiement
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/profile')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Inviter des amis
                </Button>
              </div>
            </Card>

            {/* Recent Activity */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Activité récente</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">Paiement reçu de Marie</p>
                    <p className="text-xs text-gray-500">Il y a 2 heures</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">Nouveau membre ajouté</p>
                    <p className="text-xs text-gray-500">Hier</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">Rappel de paiement</p>
                    <p className="text-xs text-gray-500">Il y a 2 jours</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
