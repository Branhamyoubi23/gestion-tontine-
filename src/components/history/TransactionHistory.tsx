
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Navigation from '@/components/shared/Navigation';
import {
  History,
  Download,
  Filter,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle,
  Clock,
  XCircle,
  UserPlus,
  Bell,
  User,
  Edit,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { saveAs } from 'file-saver';

// Types d'événements
const EVENT_TYPES = [
  { value: 'all', label: 'Tous' },
  { value: 'transaction', label: 'Transactions' },
  { value: 'invitation', label: 'Invitations' },
  { value: 'notification', label: 'Notifications' },
  { value: 'profile', label: 'Profil' },
];

const TransactionHistory = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // Pagination
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const [hasMore, setHasMore] = useState(true);
  // Résumé dynamique
  const [summary, setSummary] = useState({
    totalContributions: 0,
    totalReceived: 0,
    invitationsSent: 0,
    notificationsUnread: 0,
  });
  // Filtres avancés
  const [tontines, setTontines] = useState<any[]>([]);
  const [selectedTontine, setSelectedTontine] = useState('all');
  const [dateStart, setDateStart] = useState<string | null>(null);
  const [dateEnd, setDateEnd] = useState<string | null>(null);
  const [status, setStatus] = useState('all');

  // Récupère la liste des tontines pour le filtre
  useEffect(() => {
    if (!user?.id) return;
    fetch(`http://localhost:3000/api/tontines?userId=${user.id}`)
      .then(res => res.json())
      .then(setTontines);
  }, [user?.id]);

  // Fetch tous les événements pertinents
  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    Promise.all([
      // Transactions (paiements)
      fetch(`http://localhost:3000/api/tontines?userId=${user.id}`)
        .then(res => res.json())
        .then(tontines => Promise.all(
          tontines.map((t: any) =>
            fetch(`http://localhost:3000/api/payments?tontineId=${t.id}`)
              .then(res => res.json())
              .then(payments => payments.map((p: any) => ({
                id: `payment-${p.id}`,
                type: 'transaction',
                subtype: p.amount > 0 ? 'payout' : 'payment',
                description: p.amount > 0 ? `Réception ${t.name}` : `Contribution ${t.name}`,
                amount: p.amount,
                date: p.created_at || p.date,
                status: p.status,
                tontine: t.name,
                method: p.method || '-',
              })))
          )
        )),
      // Invitations envoyées
      fetch(`http://localhost:3000/api/invitations?senderId=${user.id}`)
        .then(res => res.json())
        .then(invitations =>
          invitations.map((inv: any) => ({
            id: `invitation-${inv.id}`,
            type: 'invitation',
            description: `Invitation envoyée à ${inv.email || 'par lien'}`,
            status: inv.status,
            date: inv.sentDate || inv.date,
            tontine: inv.tontine || '-',
            details: inv.message,
          }))
        ),
      // Notifications reçues
      fetch(`http://localhost:3000/api/notifications?userId=${user.id}`)
        .then(res => res.json())
        .then(notifs =>
          notifs.map((n: any) => ({
            id: `notif-${n.id}`,
            type: 'notification',
            description: n.title || 'Notification',
            status: n.read === 0 ? 'unread' : 'read',
            date: n.date,
            tontine: n.tontine_name || '-',
            details: n.message,
          }))
        ),
      // Historique de profil (exemple, à adapter si tu as une vraie table d'audit)
      Promise.resolve([]),
    ])
      .then(([paymentsArr, invitations, notifications, profileEvents]) => {
        // Fusionne tout dans un seul tableau
        const payments = paymentsArr.flat();
        const allEvents = [
          ...payments,
          ...invitations,
          ...notifications,
          ...profileEvents,
        ];
        // Trie par date décroissante
        allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setEvents(allEvents);
        // Calcul du résumé (correction : additionner en tant que nombres)
        setSummary({
          totalContributions: payments.filter((e: any) => e.amount < 0).reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0),
          totalReceived: payments.filter((e: any) => e.amount > 0).reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0),
          invitationsSent: invitations.length,
          notificationsUnread: notifications.filter((n: any) => n.status === 'unread').length,
        });
        setPage(1);
        setHasMore(allEvents.length > PAGE_SIZE);
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  // Filtrage et recherche
  const filteredEvents = events.filter(event => {
    const matchesType = filter === 'all' || event.type === filter;
    const matchesSearch =
      event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.tontine?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.details?.toLowerCase().includes(searchTerm.toLowerCase());
    // Filtre par tontine
    const matchesTontine = selectedTontine === 'all' || event.tontine === tontines.find(t => t.id === selectedTontine)?.name;
    // Filtre par période
    const eventDate = event.date ? new Date(event.date) : null;
    const matchesDateStart = !dateStart || (eventDate && eventDate >= new Date(dateStart));
    const matchesDateEnd = !dateEnd || (eventDate && eventDate <= new Date(dateEnd));
    // Filtre par statut (pour les transactions)
    const matchesStatus = status === 'all' || (event.type === 'transaction' && event.status === status);
    return matchesType && matchesSearch && matchesTontine && matchesDateStart && matchesDateEnd && matchesStatus;
  });

  // Pagination sur les événements filtrés
  const paginatedEvents = filteredEvents.slice(0, page * PAGE_SIZE);

  useEffect(() => {
    setHasMore(filteredEvents.length > paginatedEvents.length);
  }, [filteredEvents, paginatedEvents.length]);

  // Icônes selon le type d'événement
  const getEventIcon = (event: any) => {
    switch (event.type) {
      case 'transaction':
        return event.amount > 0 ? <ArrowDownLeft className="h-6 w-6 text-green-600" /> : <ArrowUpRight className="h-6 w-6 text-red-600" />;
      case 'invitation':
        return <UserPlus className="h-6 w-6 text-blue-600" />;
      case 'notification':
        return <Bell className="h-6 w-6 text-yellow-600" />;
      case 'profile':
        return <Edit className="h-6 w-6 text-gray-600" />;
      default:
        return <History className="h-6 w-6 text-gray-400" />;
    }
  };

  // Texte de statut
  const getStatusText = (event: any) => {
    if (event.type === 'transaction') {
      switch (event.status) {
        case 'completed': return 'Terminé';
        case 'pending': return 'En attente';
        case 'failed': return 'Échoué';
        default: return event.status;
      }
    }
    if (event.type === 'invitation') {
      switch (event.status) {
        case 'accepted': return 'Acceptée';
        case 'pending': return 'En attente';
        case 'declined': return 'Refusée';
        case 'expired': return 'Expirée';
        default: return event.status;
      }
    }
    if (event.type === 'notification') {
      return event.status === 'unread' ? 'Non lu' : 'Lu';
    }
    return '';
  };

  // Fonction utilitaire pour exporter en CSV
  function exportToCSV(events: any[]) {
    const headers = ['Date', 'Type', 'Description', 'Montant', 'Statut', 'Tontine'];
    const rows = events.map(e => [
      e.date ? new Date(e.date).toLocaleString() : '',
      e.type,
      e.description,
      e.amount !== undefined ? e.amount : '',
      e.status,
      e.tontine || ''
    ]);
    const csvContent = [headers, ...rows].map(r => r.map(x => '"' + String(x).replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'historique.csv');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center mr-4">
                <History className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Historique</h1>
                <p className="text-gray-600">Toutes vos activités importantes au même endroit</p>
              </div>
            </div>
            <Button className="bg-gradient-to-r from-blue-600 to-green-600" onClick={() => exportToCSV(filteredEvents)}>
              <Download className="h-4 w-4 mr-2" />
              Exporter CSV
            </Button>
          </div>

          {/* Résumé dynamique */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="p-6 flex flex-col items-center justify-center">
              <p className="text-sm text-gray-600">Total contributions</p>
              <p className="text-base sm:text-2xl font-bold text-red-600">{summary.totalContributions.toLocaleString()} CFA</p>
            </Card>
            <Card className="p-6 flex flex-col items-center justify-center">
              <p className="text-sm text-gray-600">Invitations envoyées</p>
              <p className="text-base sm:text-2xl font-bold text-blue-600">{summary.invitationsSent}</p>
            </Card>
            <Card className="p-6 flex flex-col items-center justify-center">
              <p className="text-sm text-gray-600">Notifications non lues</p>
              <p className="text-base sm:text-2xl font-bold text-yellow-600">{summary.notificationsUnread}</p>
            </Card>
          </div>

          {/* Filtres */}
          <Card className="p-6 mb-8">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrer par type" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Plus de filtres
              </Button>
            </div>
            {/* Filtres avancés */}
            <div className="grid md:grid-cols-4 gap-4 mt-4">
              {/* Filtre par tontine */}
              <Select value={selectedTontine} onValueChange={setSelectedTontine}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrer par tontine" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les tontines</SelectItem>
                  {tontines.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Filtre date début */}
              <Input
                type="date"
                value={dateStart || ''}
                onChange={e => setDateStart(e.target.value || null)}
                placeholder="Date de début"
              />
              {/* Filtre date fin */}
              <Input
                type="date"
                value={dateEnd || ''}
                onChange={e => setDateEnd(e.target.value || null)}
                placeholder="Date de fin"
              />
              {/* Filtre statut (transactions) */}
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut (transactions)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="failed">Échoué</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Liste des événements paginée */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Activité récente</h2>
            {loading ? (
              <div className="text-center text-gray-500">Chargement...</div>
            ) : paginatedEvents.length === 0 ? (
              <div className="text-center text-gray-500">Aucune activité trouvée.</div>
            ) : (
              <div className="space-y-4">
                {paginatedEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white border">
                        {getEventIcon(event)}
                      </div>
                      <div>
                        <div className="font-medium">{event.description}</div>
                        <div className="text-sm text-gray-600">{event.tontine}</div>
                        <div className="text-xs text-gray-500">{event.date ? new Date(event.date).toLocaleString() : ''}</div>
                        {event.details && <div className="text-xs text-gray-400 mt-1">{event.details}</div>}
                      </div>
                    </div>
                    <div className="text-right">
                      {event.amount !== undefined && (
                        <div className={`text-lg font-semibold ${event.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {event.amount > 0 ? '+' : ''}{event.amount} CFA
                        </div>
                      )}
                      <div className="flex items-center justify-end space-x-2 mt-1">
                        <span className="text-sm text-gray-600">{getStatusText(event)}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {hasMore && (
                  <div className="flex justify-center mt-6">
                    <Button onClick={() => setPage(page + 1)} variant="outline">Charger plus</Button>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory;
