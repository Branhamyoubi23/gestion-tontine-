import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Navigation from '@/components/shared/Navigation';
import { Plus, Users, Wallet, Clock, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Load tontines from localStorage
  const [tontines, setTontines] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('tontines') || '[]');
    setTontines(stored);
  }, []);
  
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

        {/* Custom Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Nombre total de tontines</p>
                <p className="text-2xl font-bold text-gray-900">{tontines.length}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Solde total dans les tontines</p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    tontines.reduce(
                      (sum, t) => sum + (parseFloat(t.amount || 0) * (parseInt(t.maxMembers || 0) || 0)),
                      0
                    ).toLocaleString()
                  } FCFA
                </p>
              </div>
              <Wallet className="h-8 w-8 text-blue-600" />
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
              {tontines.length === 0 && (
                <div className="text-gray-500">Aucune tontine pour le moment.</div>
              )}
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
                      </h3>
                      <p className="text-sm text-gray-600 capitalize">
                        {tontine.description}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Montant</p>
                      <p className="font-semibold">{tontine.amount} CFA</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Membres max</p>
                      <p className="font-semibold">{tontine.maxMembers}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Durée</p>
                      <p className="font-semibold">{tontine.duration} mois</p>
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
