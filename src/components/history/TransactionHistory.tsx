
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Navigation from '@/components/shared/Navigation';
import { History, Download, Filter, Search, ArrowUpRight, ArrowDownLeft, CheckCircle, Clock, XCircle } from 'lucide-react';

const TransactionHistory = () => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const transactions = [
    {
      id: '1',
      type: 'payment',
      description: 'Contribution Tontine des amis',
      amount: -100,
      date: '2024-01-25',
      status: 'completed',
      tontine: 'Tontine des amis',
      method: 'Carte bancaire'
    },
    {
      id: '2',
      type: 'payout',
      description: 'Réception Épargne famille',
      amount: 1600,
      date: '2024-01-20',
      status: 'completed',
      tontine: 'Épargne famille',
      method: 'Virement bancaire'
    },
    {
      id: '3',
      type: 'payment',
      description: 'Contribution Épargne famille',
      amount: -200,
      date: '2024-01-15',
      status: 'completed',
      tontine: 'Épargne famille',
      method: 'Mobile Money'
    },
    {
      id: '4',
      type: 'payment',
      description: 'Contribution Projet Vacances',
      amount: -150,
      date: '2024-01-10',
      status: 'pending',
      tontine: 'Projet Vacances',
      method: 'Carte bancaire'
    },
    {
      id: '5',
      type: 'payment',
      description: 'Contribution Tontine des amis',
      amount: -100,
      date: '2024-01-05',
      status: 'failed',
      tontine: 'Tontine des amis',
      method: 'Carte bancaire'
    }
  ];

  const filteredTransactions = transactions.filter(transaction => {
    const matchesFilter = filter === 'all' || transaction.type === filter;
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.tontine.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Terminé';
      case 'pending':
        return 'En attente';
      case 'failed':
        return 'Échoué';
      default:
        return 'Inconnu';
    }
  };

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
                <h1 className="text-3xl font-bold text-gray-900">Historique des transactions</h1>
                <p className="text-gray-600">Consultez l'historique de toutes vos transactions</p>
              </div>
            </div>
            <Button className="bg-gradient-to-r from-blue-600 to-green-600">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>

          {/* Filters */}
          <Card className="p-6 mb-8">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Rechercher une transaction..."
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
                  <SelectItem value="all">Toutes les transactions</SelectItem>
                  <SelectItem value="payment">Contributions</SelectItem>
                  <SelectItem value="payout">Réceptions</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Plus de filtres
              </Button>
            </div>
          </Card>

          {/* Summary Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total contributions</p>
                  <p className="text-2xl font-bold text-red-600">-550 CFA</p>
                </div>
                <ArrowUpRight className="h-8 w-8 text-red-600" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total reçu</p>
                  <p className="text-2xl font-bold text-green-600">+1,600 CFA</p>
                </div>
                <ArrowDownLeft className="h-8 w-8 text-green-600" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Solde net</p>
                  <p className="text-2xl font-bold text-green-600">+1,050 CFA</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </Card>
          </div>

          {/* Transactions List */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Transactions récentes</h2>
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      transaction.type === 'payment' ? 'bg-red-100' : 'bg-green-100'
                    }`}>
                      {transaction.type === 'payment' ? (
                        <ArrowUpRight className="h-6 w-6 text-red-600" />
                      ) : (
                        <ArrowDownLeft className="h-6 w-6 text-green-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{transaction.description}</div>
                      <div className="text-sm text-gray-600">{transaction.tontine} • {transaction.method}</div>
                      <div className="text-xs text-gray-500">{transaction.date}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-semibold ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}{transaction.amount} CFA
                    </div>
                    <div className="flex items-center justify-end space-x-2 mt-1">
                      {getStatusIcon(transaction.status)}
                      <span className="text-sm text-gray-600">{getStatusText(transaction.status)}</span>
                    </div>
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

export default TransactionHistory;
