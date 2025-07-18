import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Navigation from '@/components/shared/Navigation';
import { Plus, Users, Wallet, Trash2 } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tontines, setTontines] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:3000/api/tontines?userId=${user.id}`)
      .then(res => res.json())
      .then(setTontines);
  }, [user.id]);

  const isAdmin = (tontine) => tontine.role === 'admin';

  const handleDelete = async (id) => {
    const confirm = window.confirm("Êtes-vous sûr de vouloir supprimer cette tontine ? Cette action est irréversible.");
    if (!confirm) return;
    await fetch(`http://localhost:3000/api/tontines/${id}`, { method: 'DELETE' });
    setTontines(tontines.filter(t => t.id !== id));
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
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
                  {tontines.reduce(
                    (sum, t) =>
                      sum +
                      (parseFloat(t.amount || 0) *
                        (parseInt(t.max_members || 0) || 0)),
                    0
                  ).toLocaleString()}{' '}
                  CFA
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
                  className="p-6 cursor-pointer hover:shadow-md transition-shadow relative"
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
                    {isAdmin(tontine) && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-2 right-2"
                        onClick={e => {
                          e.stopPropagation();
                          handleDelete(tontine.id);
                        }}
                      >
                        <Trash2 className="h-5 w-5 text-red-600" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Montant a cotisse</p>
                      <p className="font-semibold">{tontine.amount} CFA</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Membres</p>
                      <p className="font-semibold">
                        {(tontine.memberCount || 0)}/{tontine.max_members}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Fréquence</p>
                      <p className="font-semibold">
                        {tontine.frequency === 'weekly'
                          ? 'Hebdomadaire'
                          : tontine.frequency === 'bimonthly'
                          ? 'Bimensuelle'
                          : 'Mensuelle'}
                      </p>
                    </div>
                    <div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/tontine/${tontine.id}`)}
                      >
                        Détails tontine
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Quick Actions & Recent Activity */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="p-3 sm:p-6">
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
                  onClick={() => navigate('/invitations')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Inviter des amis
                </Button>
              </div>
            </Card>

            {/* Recent Activity */}
            <Card className="p-3 sm:p-6">
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
