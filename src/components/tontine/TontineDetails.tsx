import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Navigation from '@/components/shared/Navigation';
import { Users, Calendar, Coins, Clock, ArrowLeft, Wallet, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';

const TontineDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tontine, setTontine] = useState(null);
  const [newCaisse, setNewCaisse] = useState('');
  const [caisses, setCaisses] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const membersPerPage = 5;
  // Séparer les membres acceptés des invitations en attente
  const acceptedMembers = tontine?.members || [];
  const pendingInvites = tontine?.pendingInvites || [];
  const allMembers = [...acceptedMembers, ...pendingInvites];
  
  const totalPages = Math.ceil(allMembers.length / membersPerPage);
  const paginatedMembers = allMembers.slice((currentPage - 1) * membersPerPage, currentPage * membersPerPage);

  const montantParReceveur = tontine
    ? (parseFloat(tontine.amount) * acceptedMembers.length * parseInt(tontine.duration)) / parseInt(tontine.receivers)
    : 0;

  useEffect(() => {
    fetch(`http://localhost:3000/api/tontines/${id}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => setTontine(data));

    fetch(`http://localhost:3000/api/caisses?tontineId=${id}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setCaisses(Array.isArray(data) ? data : []));
  }, [id]);

  const handleAddCaisse = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost:3000/api/caisses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tontineId: tontine.id, name: newCaisse }),
    });
    const data = await res.json();
    setCaisses([...caisses, data]);
    setNewCaisse('');
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

  const myRole = tontine.members.find(m => m.user_id === user.id)?.role;

  const handlePayment = async () => {
    const amount = tontine.amount; // ou récupère le montant d'une autre manière si nécessaire
    const destination = 'tontine'; // ou l'ID de la caisse si c'est un paiement vers une caisse

    await fetch('http://localhost:3000/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        tontineId: tontine.id,
        caisseId: destination === 'tontine' ? null : destination,
        amount,
      }),
    });

    alert('Paiement effectué !');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto p-8">
          <div className="flex items-center mb-6">
            <ArrowLeft
              className="h-6 w-6 text-gray-500 cursor-pointer mr-4"
              onClick={() => navigate(-1)}
            />
            <h1 className="text-3xl font-bold text-gray-900">{tontine.name}</h1>
          </div>
          <p className="text-gray-600 mb-6">{tontine.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <Card className="flex flex-col items-center p-4 shadow-none border border-blue-100">
              <Wallet className="h-8 w-8 text-blue-600 mb-2" />
              <div className="text-gray-500">Montant</div>
              <div className="text-xl font-bold text-gray-900">{tontine.amount} FCFA</div>
            </Card>
            <Card className="flex flex-col items-center p-4 shadow-none border border-yellow-100">
              <Clock className="h-8 w-8 text-yellow-600 mb-2" />
              <div className="text-gray-500">Durée</div>
              <div className="text-xl font-bold text-gray-900">
                {tontine.duration} {tontine.frequency === 'weekly' ? 'semaines' : tontine.frequency === 'daily' ? 'jours' : 'mois'}
              </div>
            </Card>
            <Card className="flex flex-col items-center p-4 shadow-none border border-purple-100">
              <Coins className="h-8 w-8 text-purple-600 mb-2" />
              <div className="text-gray-500">Receveurs</div>
              <div className="text-xl font-bold text-gray-900">{tontine.receivers}</div>
            </Card>
            <Card className="flex flex-col items-center p-4 shadow-none border border-pink-100">
              <Users className="h-8 w-8 text-pink-600 mb-2" />
              <div className="text-gray-500">Membres</div>
              <div className="text-xl font-bold text-gray-900">
                {acceptedMembers.length}/{tontine.max_members}
              </div>
              {pendingInvites.length > 0 && (
                <div className="text-xs text-yellow-600 mt-1">
                  +{pendingInvites.length} en attente
                </div>
              )}
            </Card>
            <Card className="flex flex-col items-center p-4 shadow-none border border-green-100">
              <Calendar className="h-8 w-8 text-green-600 mb-2" />
              <div className="text-gray-500">Tours en cours</div>
              <div className="text-xl font-bold text-gray-900">
                {tontine.current_tour || 1}/{tontine.total_tours || tontine.duration}
              </div>
            </Card>
          </div>

          <h2 className="text-xl font-semibold mb-4">Membres ({acceptedMembers.length} acceptés{pendingInvites.length > 0 ? `, ${pendingInvites.length} en attente` : ''})</h2>
          <Card className="mb-6 p-4">
            <ul className="divide-y divide-gray-200">
              {paginatedMembers.map((member) => (
                <li key={member.user_id || member.id} className="py-2 flex items-center">
                  <Users className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="flex-1">{member.name}</span>
                  {member.role === 'admin' && (
                    <span className="text-xs text-green-600 ml-2">(Admin)</span>
                  )}
                  {member.role === 'member' && (
                    <span className="text-xs text-gray-600 ml-2">(Membre)</span>
                  )}
                  {member.role === 'pending' && (
                    <span className="text-xs text-yellow-600 ml-2">(En attente)</span>
                  )}
                </li>
              ))}
            </ul>
            <div className="flex justify-between mt-4">
              <Button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Précédent</Button>
              <span>Page {currentPage} / {totalPages}</span>
              <Button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Suivant</Button>
            </div>
          </Card>

          <Card className="mb-6 p-4">
            <div className="text-gray-700">
              <b>Montant reçu par chaque receveur à chaque tour :</b> {montantParReceveur.toLocaleString()} CFA
            </div>
          </Card>

          <div className="flex justify-end gap-2">
            {myRole === 'admin' && (
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => navigate(`/invitations?tontineId=${tontine.id}`)}
              >
                Inviter un membre
              </Button>
            )}
            <Button
              onClick={() => navigate(`/paiement?tontineId=${tontine.id}`)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Effectuer un paiement
            </Button>
          </div>

          <h2 className="text-xl font-semibold mt-8 mb-4">Caisses de la tontine</h2>
          <form onSubmit={handleAddCaisse} className="flex space-x-2 mb-4">
            <Input
              value={newCaisse}
              onChange={e => setNewCaisse(e.target.value)}
              placeholder="Nom de la caisse"
              required
            />
            <Button type="submit">Ajouter une caisse</Button>
          </form>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {Array.isArray(caisses) && caisses.length > 0 ? (
              caisses.map((caisse, idx) => (
                <Card
                  key={caisse.id}
                  className={`flex flex-col items-center p-6 shadow-lg border-0 bg-gradient-to-br ${
                    idx % 3 === 0
                      ? 'from-purple-100 to-purple-300'
                      : idx % 3 === 1
                      ? 'from-pink-100 to-pink-300'
                      : 'from-blue-100 to-blue-300'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-3 shadow">
                    <Coins className="h-7 w-7 text-purple-600" />
                  </div>
                  <span className="text-lg font-bold text-gray-800 mb-1">{caisse.name}</span>
                  {/* Ajoute d'autres infos si besoin */}
                </Card>
              ))
            ) : (
              <div className="text-gray-400 col-span-3">Aucune caisse pour cette tontine.</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TontineDetails;