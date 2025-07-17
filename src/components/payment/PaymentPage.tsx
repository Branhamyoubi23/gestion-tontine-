import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Navigation from '@/components/shared/Navigation';
import { DollarSign, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const PaymentPage = () => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [selectedTontine, setSelectedTontine] = useState('');
  const [caisses, setCaisses] = useState([]);
  const [destination, setDestination] = useState('tontine'); // 'tontine' ou caisse.id
  const [payments, setPayments] = useState([]);
  const [tontines, setTontines] = useState([]);
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const paymentsPerPage = 5;

  // Récupère les tontines de l'utilisateur (toutes, pas que admin)
  useEffect(() => {
    fetch(`http://localhost:3000/api/tontines?userId=${user.id}`)
      .then(res => res.json())
      .then(setTontines);
  }, [user.id]);

  // Récupère les caisses et paiements de la tontine sélectionnée
  useEffect(() => {
    if (selectedTontine) {
      fetch(`http://localhost:3000/api/caisses?tontineId=${selectedTontine}`)
        .then(res => res.json())
        .then(setCaisses);
      fetch(`http://localhost:3000/api/payments?tontineId=${selectedTontine}`)
        .then(res => res.json())
        .then(setPayments);
    } else {
      setCaisses([]);
      setPayments([]); // Réinitialise les paiements si aucune tontine n'est sélectionnée
    }
  }, [selectedTontine]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('http://localhost:3000/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        tontineId: selectedTontine,
        caisseId: destination === 'tontine' ? null : destination,
        amount,
      }),
    });
    setSuccess('Paiement signalé !');
    setAmount('');
    fetch(`http://localhost:3000/api/payments?tontineId=${selectedTontine}`)
      .then(res => res.json())
      .then(setPayments);
  };

  const totalPages = Math.ceil(payments.length / paymentsPerPage);
  const paginatedPayments = payments.slice((currentPage - 1) * paymentsPerPage, currentPage * paymentsPerPage);

  const params = new URLSearchParams(window.location.search);
  const tontineId = params.get('tontineId');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Paiements</h1>
            <p className="text-gray-600 mt-2">Signalez vos contributions aux tontines</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Payment Form */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Signaler un paiement</h2>
              <form onSubmit={handlePayment} className="space-y-6">
                <div>
                  <Label htmlFor="tontine">Sélectionner une tontine</Label>
                  <Select value={selectedTontine} onValueChange={setSelectedTontine}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir une tontine" />
                    </SelectTrigger>
                    <SelectContent>
                      {tontines.map((tontine) => (
                        <SelectItem key={tontine.id} value={String(tontine.id)}>
                          {tontine.name} - {tontine.amount}FCFA
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Destination du paiement</Label>
                  <Select value={destination} onValueChange={setDestination}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir la destination" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tontine">Tontine (générale)</SelectItem>
                      {caisses.map((caisse) => (
                        <SelectItem key={caisse.id} value={String(caisse.id)}>{caisse.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="amount">Montant (FCFA)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min={0}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="100"
                    required
                  />
                </div>

                <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-green-600">
                  J'ai payé
                </Button>
                {success && <div className="text-green-600 text-center mt-2">{success}</div>}
              </form>
            </Card>

            {/* Payment History */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Historique des paiements</h2>
              <div className="space-y-4">
                {paginatedPayments.length === 0 && (
                  <div className="text-gray-400 text-center">Aucun paiement pour l’instant.</div>
                )}
                {paginatedPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg shadow-sm">
                    <div>
                      <div className="font-medium">
                        {payment.caisse_name ? payment.caisse_name : 'Tontine générale'}
                      </div>
                      <div className="text-sm text-gray-600">{payment.created_at ? payment.created_at.substring(0,10) : payment.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{payment.amount} FCFA</div>
                      <div className={`flex items-center text-sm ${
                        payment.status === 'validated' ? 'text-green-600' :
                        payment.status === 'refused' ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {payment.status === 'validated' ? <CheckCircle className="h-4 w-4 mr-1" /> :
                        payment.status === 'refused' ? <Clock className="h-4 w-4 mr-1" /> : <Clock className="h-4 w-4 mr-1" />}
                        {payment.status === 'validated' ? 'Confirmé' :
                        payment.status === 'refused' ? 'Refusé' : 'En attente'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-4">
                <Button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Précédent</Button>
                <span>Page {currentPage} / {totalPages}</span>
                <Button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Suivant</Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
