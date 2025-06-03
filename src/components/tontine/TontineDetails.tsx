import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Navigation from '@/components/shared/Navigation';
import { Users, Calendar, Coins, Clock, ArrowLeft } from 'lucide-react';

const TontineDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tontine, setTontine] = useState(null);

  useEffect(() => {
    const tontines = JSON.parse(localStorage.getItem('tontines') || '[]');
    const found = tontines.find((t) => t.id === id);
    setTontine(found);
  }, [id]);

  // Dummy members for demonstration (replace with real data if available)
  const [members, setMembers] = useState([
    { id: 1, name: "Vous (Admin)", isAdmin: true },
    // Add more members as needed
  ]);

  // Handler for inviting a member (replace with real logic)
  const handleInvite = () => {
    const name = prompt("Entrez le nom du membre à inviter :");
    if (name) {
      setMembers(prev => [...prev, { id: Date.now(), name, isAdmin: false }]);
    }
  };

  // Handler for payment (replace with real logic)
  const handlePayment = () => {
    alert("Paiement effectué !");
  };

  if (!tontine) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center text-gray-500">
            Tontine introuvable.
          </div>
        </div>
      </div>
    );
  }

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
              <Coins className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{tontine.amount}  FCFA</div>
              <div className="text-sm text-gray-600">Par contribution</div>
            </Card>
            <Card className="p-6 text-center">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{tontine.maxMembers}</div>
              <div className="text-sm text-gray-600">Membres max</div>
            </Card>
            <Card className="p-6 text-center">
              <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{tontine.duration}</div>
              <div className="text-sm text-gray-600">Mois</div>
            </Card>
            <Card className="p-6 text-center">
              <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{tontine.frequency}</div>
              <div className="text-sm text-gray-600">Fréquence</div>
            </Card>
          </div>

          {/* Fonds spéciaux */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6 text-center">
              <Coins className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-xl font-bold text-gray-900">Fonds de banque</div>
              <div className="text-sm text-gray-600">Gestion des économies principales de la tontine.</div>
            </Card>
            <Card className="p-6 text-center">
              <Coins className="h-8 w-8 text-pink-600 mx-auto mb-2" />
              <div className="text-xl font-bold text-gray-900">Fonds d’aide</div>
              <div className="text-sm text-gray-600">Aide financière pour les membres en difficulté.</div>
            </Card>
            <Card className="p-6 text-center">
              <Coins className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
              <div className="text-xl font-bold text-gray-900">Fonds scolaire</div>
              <div className="text-sm text-gray-600">Soutien pour les frais de scolarité des membres.</div>
            </Card>
          </div>

          {/* Liste des membres */}
          <Card className="p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Membres</h2>
              <div className="flex gap-2">
               
                <Button
                  variant="default"
                  onClick={() => navigate(`/invitations?tontineId=${tontine.id}`)}
                >
                  Invitation
                </Button>
              </div>
            </div>
            <ul className="divide-y divide-gray-200">
              {members.map((member) => (
                <li key={member.id} className="py-2 flex items-center">
                  <Users className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="flex-1">{member.name}</span>
                  {member.isAdmin && (
                    <span className="text-xs text-green-600 ml-2">(Admin)</span>
                  )}
                </li>
              ))}
            </ul>
          </Card>

          {/* Bouton de paiement */}
          <div className="flex justify-end">
            <Button onClick={handlePayment} className="bg-green-600 hover:bg-green-700 text-white">
              Effectuer un paiement
            </Button>
          </div>

          {/* You can add more details or members here */}
        </div>
      </div>
    </div>
  );
};

export default TontineDetails;
