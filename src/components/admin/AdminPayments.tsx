import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import pour la navigation
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

const AdminPayments = () => {
  const { user } = useAuth();
  const navigate = useNavigate(); // Hook pour naviguer
  const [payments, setPayments] = useState([]);

  const fetchPayments = () => {
    fetch(`http://localhost:3000/api/payments/admin?adminId=${user.id}`)
      .then(res => res.json())
      .then(setPayments);
  };

  useEffect(() => {
    fetchPayments();
    const interval = setInterval(fetchPayments, 10000); // Rafraîchissement automatique toutes les 10 secondes
    return () => clearInterval(interval); // Nettoyage de l'intervalle
  }, [user.id]);

  const handleValidate = async (id: number) => {
    await fetch(`http://localhost:3000/api/payments/${id}/validate`, {
      method: 'PATCH',
    });
    setPayments(payments.filter(p => p.id !== id));
  };

  const handleDecline = async (id: number) => {
    await fetch(`http://localhost:3000/api/payments/${id}/decline`, {
      method: 'PATCH',
    });
    fetchPayments(); // Recharge la liste des paiements après avoir refusé
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Paiements à valider</h1>
            <Button variant="outline" onClick={() => navigate('/payment')}>Retour aux paiements</Button>
          </div>
          {payments.length === 0 && (
            <div className="text-gray-400">Aucun paiement en attente.</div>
          )}
          <ul>
            {payments.map(payment => (
              <li key={payment.id} className="flex flex-col md:flex-row md:items-center justify-between border-b py-3 gap-2">
                <div>
                  <div className="font-bold">{payment.user_name} <span className="text-xs text-gray-500">({payment.user_email})</span></div>
                  <div className="text-sm text-gray-700">
                    Tontine : <span className="font-semibold">{payment.tontine_name}</span>
                  </div>
                  <div className="text-sm text-gray-700">
                    Caisse : <span className="font-semibold">{payment.caisse_name || 'None'}</span>
                  </div>
                  <div className="text-xs text-gray-500">{payment.created_at?.substring(0,10)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-green-700">{payment.amount} FCFA</span>
                  <Button onClick={() => handleValidate(payment.id)} className="bg-green-600 text-white">
                    Valider
                  </Button>
                  <Button onClick={() => handleDecline(payment.id)} className="bg-red-600 text-white">
                    Refuser
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default AdminPayments;