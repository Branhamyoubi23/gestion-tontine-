
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Navigation from '@/components/shared/Navigation';
import { Users, Calendar, DollarSign, Clock, ArrowLeft } from 'lucide-react';

const TontineDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock data - in a real app, this would come from an API
  const tontine = {
    id: id,
    name: 'Tontine des amis',
    description: 'Épargne collective pour nos projets',
    amount: 100,
    frequency: 'monthly',
    duration: 12,
    members: 8,
    maxMembers: 10,
    currentRound: 3,
    status: 'active'
  };

  const members = [
    { id: '1', name: 'Marie Dubois', status: 'paid', position: 1 },
    { id: '2', name: 'Jean Martin', status: 'paid', position: 2 },
    { id: '3', name: 'Sophie Laurent', status: 'pending', position: 3 },
    { id: '4', name: 'Pierre Durand', status: 'paid', position: 4 },
    { id: '5', name: 'Claire Moreau', status: 'paid', position: 5 },
    { id: '6', name: 'Luc Bertrand', status: 'pending', position: 6 },
    { id: '7', name: 'Anna Leroy', status: 'paid', position: 7 },
    { id: '8', name: 'Tom Rousseau', status: 'paid', position: 8 }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{tontine.name}</h1>
              <p className="text-gray-600">{tontine.description}</p>
            </div>
          </div>

          {/* Tontine Info */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="p-6 text-center">
              <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{tontine.amount}€</div>
              <div className="text-sm text-gray-600">Par contribution</div>
            </Card>
            
            <Card className="p-6 text-center">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{tontine.members}/{tontine.maxMembers}</div>
              <div className="text-sm text-gray-600">Membres</div>
            </Card>
            
            <Card className="p-6 text-center">
              <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{tontine.duration}</div>
              <div className="text-sm text-gray-600">Mois</div>
            </Card>
            
            <Card className="p-6 text-center">
              <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{tontine.currentRound}/{tontine.duration}</div>
              <div className="text-sm text-gray-600">Tour actuel</div>
            </Card>
          </div>

          {/* Members List */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Membres de la tontine</h2>
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">{member.name.charAt(0)}</span>
                    </div>
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-gray-600">Position {member.position}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      member.status === 'paid' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {member.status === 'paid' ? 'Payé' : 'En attente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Actions */}
          <div className="mt-8 flex space-x-4">
            <Button className="bg-gradient-to-r from-blue-600 to-green-600">
              Effectuer un paiement
            </Button>
            <Button variant="outline">
              Inviter des membres
            </Button>
            <Button variant="outline">
              Historique des paiements
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TontineDetails;
