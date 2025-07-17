
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, Users, Wallet, Clock } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
            <Users className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Tontine Connect</h1>
        </div>
        <div className="space-x-4">
          <Button variant="ghost" onClick={() => navigate('/login')}>
            Se connecter
          </Button>
          <Button onClick={() => navigate('/register')}>
            S'inscrire
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Gérez vos tontines en toute{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600">
            sécurité
          </span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Créez et participez à des groupes d'épargne digitaux avec vos proches. 
          Paiements sécurisés, gestion simplifiée, et transparence totale.
        </p>
        <div className="space-x-4">
          <Button size="lg" onClick={() => navigate('/register')}>
            essai gratuit
          </Button>
          <Button variant="outline" size="lg"onClick={() => navigate('/onboarding')}>
            Découvrir comment ça marche
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Pourquoi choisir Tontine Connect ?
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center p-6 bg-white rounded-xl shadow-sm">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">100% Sécurisé</h3>
            <p className="text-gray-600">
              Vos fonds sont protégés par un cryptage de niveau bancaire
            </p>
          </div>
          <div className="text-center p-6 bg-white rounded-xl shadow-sm">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Communauté</h3>
            <p className="text-gray-600">
              Épargnez ensemble avec vos amis, famille et collègues
            </p>
          </div>
          <div className="text-center p-6 bg-white rounded-xl shadow-sm">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Paiements flexibles</h3>
            <p className="text-gray-600">
              Mobile Money, cartes bancaires, virements
            </p>
          </div>
          <div className="text-center p-6 bg-white rounded-xl shadow-sm">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Temps réel</h3>
            <p className="text-gray-600">
              Suivez vos contributions et gains en direct
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">
            Prêt à commencer votre première tontine ?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Rejoignez des milliers d'utilisateurs qui font confiance à Tontine connect
          </p>
          <Button size="lg" variant="secondary" onClick={() => navigate('/register')}>
            Créer mon compte gratuit
          </Button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
