
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Navigation from '@/components/shared/Navigation';
import { CreditCard, Smartphone, Building, DollarSign, CheckCircle } from 'lucide-react';

const PaymentPage = () => {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [amount, setAmount] = useState('100');
  const [selectedTontine, setSelectedTontine] = useState('1');

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Processing payment:', { paymentMethod, amount, selectedTontine });
    // Simulate payment processing
  };

  const paymentMethods = [
    { id: 'card', name: 'Carte bancaire', icon: CreditCard },
    { id: 'mobile', name: 'Mobile Money', icon: Smartphone },
    { id: 'bank', name: 'Virement bancaire', icon: Building }
  ];

  const tontines = [
    { id: '1', name: 'Tontine des amis', amount: 100, nextPayment: '2024-02-01' },
    { id: '2', name: 'Épargne famille', amount: 200, nextPayment: '2024-02-15' },
  ];

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
            <p className="text-gray-600 mt-2">Effectuez vos contributions aux tontines</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Payment Form */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Effectuer un paiement</h2>
              
              <form onSubmit={handlePayment} className="space-y-6">
                <div>
                  <Label htmlFor="tontine">Sélectionner une tontine</Label>
                  <Select value={selectedTontine} onValueChange={setSelectedTontine}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tontines.map((tontine) => (
                        <SelectItem key={tontine.id} value={tontine.id}>
                          {tontine.name} - {tontine.amount}€
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="amount">Montant (€)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="100"
                  />
                </div>

                <div>
                  <Label>Méthode de paiement</Label>
                  <div className="grid grid-cols-1 gap-3 mt-2">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id)}
                        className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors ${
                          paymentMethod === method.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <method.icon className="h-5 w-5" />
                        <span className="font-medium">{method.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {paymentMethod === 'card' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="cardNumber">Numéro de carte</Label>
                      <Input
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expiry">Date d'expiration</Label>
                        <Input
                          id="expiry"
                          placeholder="MM/AA"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cvv">CVV</Label>
                        <Input
                          id="cvv"
                          placeholder="123"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'mobile' && (
                  <div>
                    <Label htmlFor="phoneNumber">Numéro de téléphone</Label>
                    <Input
                      id="phoneNumber"
                      placeholder="+33 6 12 34 56 78"
                    />
                  </div>
                )}

                {paymentMethod === 'bank' && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Informations de virement</h4>
                    <div className="text-sm space-y-1">
                      <p><strong>IBAN:</strong> FR76 1234 5678 9012 3456 7890 123</p>
                      <p><strong>BIC:</strong> ABCDFRPP</p>
                      <p><strong>Référence:</strong> TONTINE-{selectedTontine}</p>
                    </div>
                  </div>
                )}

                <Button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-green-600"
                >
                  Effectuer le paiement
                </Button>
              </form>
            </Card>

            {/* Payment History */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Historique des paiements</h2>
              
              <div className="space-y-4">
                {[
                  { id: '1', tontine: 'Tontine des amis', amount: 100, date: '2024-01-15', status: 'completed' },
                  { id: '2', tontine: 'Épargne famille', amount: 200, date: '2024-01-10', status: 'completed' },
                  { id: '3', tontine: 'Tontine des amis', amount: 100, date: '2023-12-15', status: 'completed' },
                ].map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{payment.tontine}</div>
                      <div className="text-sm text-gray-600">{payment.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{payment.amount}€</div>
                      <div className="flex items-center text-sm text-green-600">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Confirmé
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Upcoming Payments */}
          <Card className="p-6 mt-8">
            <h2 className="text-xl font-semibold mb-6">Prochains paiements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tontines.map((tontine) => (
                <div key={tontine.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                  <div>
                    <div className="font-medium">{tontine.name}</div>
                    <div className="text-sm text-gray-600">Échéance: {tontine.nextPayment}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{tontine.amount}€</div>
                    <Button size="sm" variant="outline">
                      Payer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
