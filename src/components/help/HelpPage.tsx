
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Navigation from '@/components/shared/Navigation';
import { HelpCircle, ChevronDown, ChevronUp, Search, MessageCircle, Phone, Mail } from 'lucide-react';

const HelpPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const faqs = [
    {
      id: '1',
      question: 'Qu\'est-ce qu\'une tontine ?',
      answer: 'Une tontine est un système d\'épargne collective où plusieurs personnes contribuent régulièrement à un pot commun. À tour de rôle, chaque membre reçoit la totalité des contributions.'
    },
    {
      id: '2',
      question: 'Comment créer une tontine ?',
      answer: 'Cliquez sur "Créer une tontine" depuis votre tableau de bord, définissez le montant, la fréquence, le nombre de participants et invitez vos proches.'
    },
    {
      id: '3',
      question: 'Quels sont les modes de paiement acceptés ?',
      answer: 'Nous acceptons les cartes bancaires, Mobile Money (Orange Money, MTN Money) et les virements bancaires.'
    },
    {
      id: '4',
      question: 'Comment inviter des membres ?',
      answer: 'Depuis la page de votre tontine, cliquez sur "Inviter des membres" et envoyez le lien d\'invitation par email, SMS ou réseaux sociaux.'
    },
    {
      id: '5',
      question: 'Mes fonds sont-ils sécurisés ?',
      answer: 'Oui, nous utilisons un cryptage de niveau bancaire et tous les fonds sont protégés. De plus, nous sommes régulés par les autorités financières.'
    },
    {
      id: '6',
      question: 'Que se passe-t-il si un membre ne paie pas ?',
      answer: 'Les membres sont notifiés automatiquement. En cas de retard persistant, l\'administrateur peut prendre des mesures selon les règles définies.'
    }
  ];

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleFaq = (id: string) => {
    setOpenFaq(openFaq === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Centre d'aide</h1>
            <p className="text-gray-600 mt-2">Trouvez rapidement les réponses à vos questions</p>
          </div>

          {/* Search */}
          <Card className="p-6 mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Rechercher dans l'aide..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </Card>

          {/* FAQ Section */}
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-semibold mb-6">Questions fréquentes</h2>
            <div className="space-y-4">
              {filteredFaqs.map((faq) => (
                <div key={faq.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full flex items-center justify-between text-left hover:text-blue-600 transition-colors"
                  >
                    <span className="font-medium">{faq.question}</span>
                    {openFaq === faq.id ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </button>
                  {openFaq === faq.id && (
                    <div className="mt-3 text-gray-600 text-sm leading-relaxed">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Contact Support */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 text-center">
              <MessageCircle className="h-8 w-8 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Chat en direct</h3>
              <p className="text-sm text-gray-600 mb-4">Discutez avec notre équipe support</p>
              <Button variant="outline" className="w-full">
                Démarrer le chat
              </Button>
            </Card>

            <Card className="p-6 text-center">
              <Mail className="h-8 w-8 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Email</h3>
              <p className="text-sm text-gray-600 mb-4">support@tontinehub.com</p>
              <Button variant="outline" className="w-full">
                Envoyer un email
              </Button>
            </Card>

            <Card className="p-6 text-center">
              <Phone className="h-8 w-8 text-purple-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Téléphone</h3>
              <p className="text-sm text-gray-600 mb-4">+33 1 23 45 67 89</p>
              <Button variant="outline" className="w-full">
                Appeler
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
