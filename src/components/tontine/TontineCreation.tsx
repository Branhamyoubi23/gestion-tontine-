import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Calendar, Coins } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const TontineCreation = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    frequency: 'monthly',
    duration: '12',
    durationUnit: 'months', // <-- Ajouté
    penalty: '',
    maxMembers: '',
    receivers: '',
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [userSuggestions, setUserSuggestions] = useState<{id:number, name:string}[]>([]);
  const [invitedMembers, setInvitedMembers] = useState<{id:number, name:string}[]>([]);
  const [inviting, setInviting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      // Création de la tontine
      const res = await fetch('http://localhost:3000/api/tontines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          penalty: formData.penalty === '' ? 0 : formData.penalty,
          creatorId: user.id
        }),
      });
      if (!res.ok) throw new Error('Erreur lors de la création');
      const { id: tontineId } = await res.json();

      // Invitations automatiques
      for (const member of invitedMembers) {
        const dateMysql = new Date().toISOString().slice(0, 19).replace('T', ' ');
        await fetch('http://localhost:3000/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: member.id, // member.id doit être l'id de la table users
            type: 'invitation',
            title: 'Invitation à une tontine',
            message: `Vous avez été invité à rejoindre la tontine "${formData.name}"`,
            date: dateMysql,
            read: 0,
            tontine_id: tontineId
          }),
        });
        console.log('Envoi notification à', member.id, member.name);
      }

      setMessage('Tontine créée avec succès !');
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err) {
      setError('Erreur lors de la création de la tontine');
    }
  };

  const updateFormData = (field: string, value: string) => {
    // Si on modifie receivers, vérifier la contrainte
    if (field === 'receivers') {
      const receivers = parseInt(value) || 0;
      const maxMembers = parseInt(formData.maxMembers) || 0;
      if (maxMembers > 0 && receivers > maxMembers) {
        setError("Le nombre de receveurs ne peut pas dépasser le nombre max de membres.");
        return;
      } else {
        setError(null);
      }
    }
    // Si on modifie maxMembers, vérifier la contrainte
    if (field === 'maxMembers') {
      const maxMembers = parseInt(value) || 0;
      const receivers = parseInt(formData.receivers) || 0;
      if (receivers > maxMembers) {
        setError("Le nombre de receveurs ne peut pas dépasser le nombre max de membres.");
        return;
      } else {
        setError(null);
      }
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Calculs automatiques
  const nbMembres = parseInt(formData.maxMembers) || 0;
  const nbReceveurs = parseInt(formData.receivers) || 0; // <-- Utilise UNIQUEMENT nbReceveurs partout
  const dureeTotale = parseInt(formData.duration) || 0;
  const montantCotisation = parseFloat(formData.amount) || 0;

  // Durée d’un tour (cycle complet)
  const dureeUnTour = (nbReceveurs > 0) ? Math.ceil(nbMembres / nbReceveurs) : 0;
  // Nombre de cycles complets dans la durée totale
  const totalTours = (dureeUnTour > 0) ? Math.floor(dureeTotale / dureeUnTour) : 0;
  // Montant reçu par chaque receveur à chaque période
  const montantParReceveur = (nbReceveurs > 0)
    ? Math.floor((montantCotisation * nbMembres) / nbReceveurs)
    : 0;

  // Texte de l’unité pour affichage
  const unite = formData.durationUnit === 'days'
    ? 'jours'
    : formData.durationUnit === 'weeks'
    ? 'semaines'
    : 'mois';

  // Autocomplete utilisateur
  useEffect(() => {
    if (userSearch.length > 1) {
      fetch(`http://localhost:3000/api/users?search=${userSearch}`)
        .then(res => res.json())
        .then(setUserSuggestions);
    } else {
      setUserSuggestions([]);
    }
  }, [userSearch]);

  const addMember = (userToAdd: {id:number, name:string}) => {
    if (userToAdd.id === user.id) return; // Empêche d'ajouter soi-même
    if (!invitedMembers.find(m => m.id === userToAdd.id)) {
      setInvitedMembers([...invitedMembers, userToAdd]);
    }
    setUserSearch('');
    setUserSuggestions([]);
  };

  const removeMember = (id: number) => {
    setInvitedMembers(invitedMembers.filter(m => m.id !== id));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Créer une nouvelle tontine</h1>
          <p className="text-gray-600 mt-2">Définissez les paramètres de votre groupe d'épargne</p>
        </div>

        <Card className="p-8">
          {message && <div className="text-green-600 mb-4">{message}</div>}
          {error && <div className="text-red-600 mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">Nom de la tontine</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                placeholder="Ex: Tontine des amis"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                placeholder="Décrivez l'objectif de votre tontine"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Montant par contribution (FCFA)</Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => updateFormData('amount', e.target.value)}
                    placeholder="Ex: 1000 FCFA"
                    className="pl-10"
                    required
                  />
                  <Coins className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>
              <div>
                <Label htmlFor="frequency">Fréquence de cotisation</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value) => {
                    setFormData(prev => ({
                      ...prev,
                      frequency: value,
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Journalière</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    <SelectItem value="monthly">Mensuelle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Durée</Label>
                <div className="flex gap-2">
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={formData.duration}
                    onChange={(e) => updateFormData('duration', e.target.value)}
                    placeholder="Ex: 12"
                    required
                  />
                  <Select
                    value={formData.durationUnit}
                    onValueChange={(value) => {
                      setFormData(prev => ({
                        ...prev,
                        durationUnit: value,
                      }));
                    }}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="days">Jours</SelectItem>
                      <SelectItem value="weeks">Semaines</SelectItem>
                      <SelectItem value="months">Mois</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Saisissez la durée et choisissez l'unité.
                </p>
              </div>
              <div>
                <Label htmlFor="penalty">Pénalité de retard (FCFA)</Label>
                <div className="relative">
                  <Input
                    id="penalty"
                    type="number"
                    min="0"
                    value={formData.penalty || ''}
                    onChange={(e) => updateFormData('penalty', e.target.value)}
                    placeholder="Ex: 500 FCFA"
                    className="pl-10"
                  />
                  <Coins className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                </div>
                <p className="text-xs text-gray-500 mt-1">Montant à payer en cas de retard de paiement.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxMembers">Nombre max de membres</Label>
                <Input
                  id="maxMembers"
                  type="number"
                  min="1"
                  value={formData.maxMembers}
                  onChange={(e) => updateFormData('maxMembers', e.target.value)}
                  placeholder="Ex: 10"
                  required
                />
              </div>
              <div>
                <Label htmlFor="receivers">
                  Nombre de personnes qui recevront l'argent à chaque période
                </Label>
                <Input
                  id="receivers"
                  type="number"
                  min="1"
                  value={formData.receivers}
                  onChange={(e) => updateFormData('receivers', e.target.value)}
                  placeholder="Ex: 5"
                  required
                />
              </div>
            </div>

            <div className="bg-gray-100 border rounded p-4 mt-4 text-base space-y-2">
              <div>
                <span className="font-semibold text-gray-700">Durée d’un tour (pour que chaque membre reçoive une fois) :</span>
                <span className="ml-2">{dureeUnTour} {unite}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Nombre de cycles complets dans la durée :</span>
                <span className="ml-2">{totalTours}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Montant reçu par <b>chaque receveur</b> à chaque période :</span>
                <span className="ml-2">{montantParReceveur.toLocaleString()} FCFA</span>
              </div>
            </div>

            {/* Section d'invitation des membres */}
            <div className="mt-8">
              <Label>Ajouter un membre (nom d'utilisateur)</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  placeholder="Tapez un nom d'utilisateur"
                  autoComplete="off"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={() => {
                    if (userSuggestions.length > 0) addMember(userSuggestions[0]);
                  }}
                  disabled={!userSearch || userSuggestions.length === 0}
                >
                  Ajouter
                </Button>
              </div>
              {userSuggestions.length > 0 && (
                <div className="border rounded bg-white shadow mt-1 max-h-32 overflow-y-auto z-10">
                  {userSuggestions
                    .filter(u => u.id !== user.id)
                    .map(u => (
                      <div
                        key={u.id}
                        className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
                        onClick={() => addMember(u)}
                      >
                        {u.name}
                      </div>
                    ))}
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {invitedMembers.map(member => (
                  <span key={member.id} className="bg-blue-100 text-blue-700 px-2 py-1 rounded flex items-center">
                    {member.name}
                    <button
                      type="button"
                      className="ml-1 text-red-500"
                      onClick={() => removeMember(member.id)}
                    >×</button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex space-x-4 pt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/dashboard')}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button 
                type="submit"
                className="flex-1 bg-gradient-to-r from-blue-600 to-green-600"
              >
                Créer la tontine
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default TontineCreation;
