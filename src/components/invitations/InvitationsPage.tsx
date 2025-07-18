import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Navigation from '@/components/shared/Navigation';
import { UserPlus, Send, Copy, Share2, Check, Clock, X, Mail, MessageSquare } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const InvitationsPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const tontineIdFromUrl = params.get('tontineId');

  const [tontines, setTontines] = useState([]);
  const [selectedTontine, setSelectedTontine] = useState(tontineIdFromUrl || '');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [sentInvitations, setSentInvitations] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userSuggestions, setUserSuggestions] = useState<{id:number, name:string}[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<{id:number, name:string}[]>([]);
  // Pour afficher le pseudo si user_id existe, il faut faire un mapping userId -> pseudo
  // Ajoute un effet pour charger les users si des invitations ont un user_id
  const [userIdToName, setUserIdToName] = useState<{[key:number]: string}>({});

  useEffect(() => {
    fetch(`http://localhost:3000/api/tontines?adminId=${user.id}`)
      .then(res => res.json())
      .then(setTontines);
  }, [user.id]);

  useEffect(() => {
    fetch(`http://localhost:3000/api/invitations?senderId=${user.id}`)
      .then(res => res.json())
      .then(setSentInvitations);
  }, [user.id]);

  useEffect(() => {
    if (userSearch.length > 1) {
      fetch(`http://localhost:3000/api/users?search=${userSearch}`)
        .then(res => res.json())
        .then(setUserSuggestions);
    } else {
      setUserSuggestions([]);
    }
  }, [userSearch]);

  useEffect(() => {
    const userIds = sentInvitations.filter(i => i.user_id).map(i => i.user_id);
    if (userIds.length > 0) {
      Promise.all(userIds.map(id =>
        fetch(`http://localhost:3000/api/users?search=${id}`)
          .then(res => res.json())
          .then(users => users[0]?.name ? { id, name: users[0].name } : null)
      )).then(results => {
        const mapping = {};
        results.forEach(r => { if (r) mapping[r.id] = r.name; });
        setUserIdToName(mapping);
      });
    }
  }, [sentInvitations]);

  // Déclare ces variables UNE SEULE FOIS
  const invitationTontineId = selectedTontine || tontineIdFromUrl || (tontines[0]?.id ?? '');
  const invitationLink = `${window.location.origin}/register?invite=${invitationTontineId}`;

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const member of selectedUsers) {
      // Crée une invitation dans la table invitations
      await fetch('http://localhost:3000/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tontineId: invitationTontineId,
          userId: member.id,
          message: inviteMessage || `Vous avez été invité à rejoindre la tontine "${tontines.find(t => t.id == invitationTontineId)?.name}"`,
          senderId: user.id,
        }),
      });
      // Envoie aussi la notification (comme avant)
      await fetch('http://localhost:3000/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: member.id,
          type: 'invitation',
          title: 'Invitation à une tontine',
          message: inviteMessage || `Vous avez été invité à rejoindre la tontine "${tontines.find(t => t.id == invitationTontineId)?.name}"`,
          date: new Date().toISOString().slice(0, 19).replace('T', ' '),
          read: 0,
          tontine_id: invitationTontineId
        }),
      });
    }
    setSelectedUsers([]);
    setInviteMessage('');
    // Rafraîchir la liste après envoi
    fetch(`http://localhost:3000/api/invitations?senderId=${user.id}`)
      .then(res => res.json())
      .then(setSentInvitations);
  };

  // Suppression d'une invitation
  const handleDeleteInvitation = async (id) => {
    await fetch(`http://localhost:3000/api/invitations/${id}`, { method: 'DELETE' });
    fetch(`http://localhost:3000/api/invitations?senderId=${user.id}`)
      .then(res => res.json())
      .then(setSentInvitations);
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(invitationLink);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Check className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'declined':
        return <X className="h-5 w-5 text-red-600" />;
      case 'expired':
        return <Clock className="h-5 w-5 text-gray-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Acceptée';
      case 'pending':
        return 'En attente';
      case 'declined':
        return 'Refusée';
      case 'expired':
        return 'Expirée';
      default:
        return 'Inconnu';
    }
  };

  const addUser = (u) => {
    if (!selectedUsers.find(su => su.id === u.id)) {
      setSelectedUsers([...selectedUsers, u]);
    }
    setUserSearch('');
    setUserSuggestions([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center mr-4">
              <UserPlus className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Invitations</h1>
              <p className="text-gray-600">Invitez vos proches à rejoindre vos tontines</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Send Invitation */}
            <div className="space-y-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6">Envoyer une invitation</h2>
                <form onSubmit={handleSendInvitation} className="space-y-4">
                  <div>
                    <Label htmlFor="tontine">Tontine</Label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={selectedTontine}
                      onChange={(e) => setSelectedTontine(e.target.value)}
                    >
                      {tontines.map((tontine) => (
                        <option key={tontine.id} value={tontine.id}>
                          {tontine.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="userSearch">Pseudo du destinataire</label>
                    <Input
                      id="userSearch"
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      placeholder="Tapez un pseudo"
                      autoComplete="off"
                    />
                    {userSuggestions.length > 0 && (
                      <div className="border rounded bg-white shadow mt-1">
                        {userSuggestions.map(u => (
                          <div
                            key={u.id}
                            className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
                            onClick={() => addUser(u)}
                          >
                            {u.name}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedUsers.map(u => (
                        <span key={u.id} className="bg-blue-100 px-2 py-1 rounded">{u.name}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="message">Message personnalisé (optionnel)</Label>
                    <Textarea
                      id="message"
                      value={inviteMessage}
                      onChange={(e) => setInviteMessage(e.target.value)}
                      placeholder="Salut ! Je t'invite à rejoindre ma tontine..."
                      rows={3}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-green-600"
                    disabled={!invitationTontineId || tontines.length === 0}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Envoyer l'invitation
                  </Button>
                </form>
              </Card>
              {/* Quick Share */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Partage rapide</h3>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" onClick={copyInviteLink}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copier le lien d'invitation
                  </Button>
                  <div className="text-xs text-gray-500 break-all">{invitationLink}</div>
                  <Button variant="outline" className="w-full justify-start">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Partager par SMS
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Share2 className="h-4 w-4 mr-2" />
                    Partager sur les réseaux sociaux
                  </Button>
                </div>
              </Card>
            </div>
            {/* Invitation History */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Invitations envoyées</h2>
              <div className="space-y-4">
                {sentInvitations.map((invitation) => (
                  <div key={invitation.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">
                        {invitation.email
                          ? invitation.email
                          : invitation.user_id && userIdToName[invitation.user_id]
                            ? userIdToName[invitation.user_id]
                            : <span className="italic text-gray-400">Par pseudo</span>}
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(invitation.status)}
                        <span className="text-sm">{getStatusText(invitation.status)}</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div>{invitation.tontine}</div>
                      <div>Envoyée le {invitation.sentDate}</div>
                      {invitation.status === 'pending' && (
                        <div>Expire le {invitation.expiryDate}</div>
                      )}
                      {invitation.status === 'accepted' && invitation.acceptedDate && (
                        <div className="text-green-600">Acceptée le {invitation.acceptedDate}</div>
                      )}
                      {invitation.status === 'declined' && invitation.declinedDate && (
                        <div className="text-red-600">Refusée le {invitation.declinedDate}</div>
                      )}
                    </div>
                    {/* Boutons d'action */}
                    <div className="flex space-x-2 mt-3">
                      <Button size="sm" variant="outline">
                        <Mail className="h-3 w-3 mr-1" />
                        Relancer
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDeleteInvitation(invitation.id)}>
                        <X className="h-3 w-3 mr-1" />
                        Annuler
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
          {/* Tips */}
          <Card className="p-6 mt-8 bg-blue-50 border-blue-200">
            <h3 className="text-lg font-semibold mb-4 text-blue-900">Conseils pour de meilleures invitations</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <h4 className="font-medium mb-2">Personnalisez votre message</h4>
                <p>Expliquez pourquoi vous invitez cette personne et les avantages de la tontine.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Choisissez le bon moment</h4>
                <p>Envoyez vos invitations au début du cycle pour donner plus de temps.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Suivez vos invitations</h4>
                <p>N'hésitez pas à relancer poliment après quelques jours.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Expliquez les règles</h4>
                <p>Assurez-vous que vos invités comprennent le fonctionnement de la tontine.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InvitationsPage;
