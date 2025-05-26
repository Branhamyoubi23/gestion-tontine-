
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Navigation from '@/components/shared/Navigation';
import { UserPlus, Send, Copy, Share2, Check, Clock, X, Mail, MessageSquare } from 'lucide-react';

const InvitationsPage = () => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [selectedTontine, setSelectedTontine] = useState('1');

  const sentInvitations = [
    {
      id: '1',
      email: 'marie.dubois@email.com',
      tontine: 'Tontine des amis',
      status: 'pending',
      sentDate: '2024-01-25',
      expiryDate: '2024-02-05'
    },
    {
      id: '2',
      email: 'pierre.martin@email.com',
      tontine: 'Épargne famille',
      status: 'accepted',
      sentDate: '2024-01-20',
      acceptedDate: '2024-01-22'
    },
    {
      id: '3',
      email: 'sophie.laurent@email.com',
      tontine: 'Projet Vacances',
      status: 'declined',
      sentDate: '2024-01-18',
      declinedDate: '2024-01-20'
    },
    {
      id: '4',
      email: 'luc.bernard@email.com',
      tontine: 'Tontine des amis',
      status: 'expired',
      sentDate: '2024-01-10',
      expiryDate: '2024-01-20'
    }
  ];

  const tontines = [
    { id: '1', name: 'Tontine des amis', spots: 2 },
    { id: '2', name: 'Épargne famille', spots: 1 },
    { id: '3', name: 'Projet Vacances', spots: 3 }
  ];

  const handleSendInvitation = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Sending invitation:', { inviteEmail, inviteMessage, selectedTontine });
    setInviteEmail('');
    setInviteMessage('');
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

  const copyInviteLink = () => {
    const link = `https://tontinehub.com/invite/${selectedTontine}`;
    navigator.clipboard.writeText(link);
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
                          {tontine.name} ({tontine.spots} place{tontine.spots > 1 ? 's' : ''} disponible{tontine.spots > 1 ? 's' : ''})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="email">Email du destinataire</Label>
                    <Input
                      id="email"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="exemple@email.com"
                      required
                    />
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

                  <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-green-600">
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
                      <div className="font-medium">{invitation.email}</div>
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
                    {invitation.status === 'pending' && (
                      <div className="flex space-x-2 mt-3">
                        <Button size="sm" variant="outline">
                          <Mail className="h-3 w-3 mr-1" />
                          Relancer
                        </Button>
                        <Button size="sm" variant="outline">
                          <X className="h-3 w-3 mr-1" />
                          Annuler
                        </Button>
                      </div>
                    )}
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
