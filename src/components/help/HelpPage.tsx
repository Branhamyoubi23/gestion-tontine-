import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Navigation from '@/components/shared/Navigation';
import { HelpCircle, ChevronDown, ChevronUp, Search, MessageCircle, Phone, Mail, Sparkles, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HelpPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const faqs = [
    {
      id: '1',
      question: 'Qu\'est-ce qu\'une tontine ?',
      answer: 'Une tontine est un système d\'épargne collective où plusieurs personnes contribuent régulièrement à un pot commun. À tour de rôle, chaque membre reçoit la totalité des contributions, permettant de réaliser des projets importants sans crédit bancaire.'
    },
    {
      id: '2',
      question: 'Comment créer une tontine ?',
      answer: 'Cliquez sur "Créer" depuis votre tableau de bord, définissez le montant de la cotisation, la fréquence (hebdomadaire ou mensuelle), le nombre maximal de participants et invitez vos membres de confiance via un lien exclusif.'
    },
    {
      id: '3',
      question: 'Quels sont les modes de paiement acceptés ?',
      answer: 'Nous intégrons les solutions Mobile Money locales (Orange Money, MTN Money), ainsi que les virements bancaires et Stripe pour les cartes internationales.'
    },
    {
      id: '4',
      question: 'Comment inviter des membres ?',
      answer: 'Une fois votre tontine créée, un lien unique "Prestige" est généré. Vous pouvez le partager via WhatsApp, SMS ou courriel. Seuls les détenteurs du lien peuvent postuler pour rejoindre votre cercle.'
    },
    {
      id: '5',
      question: 'Mes fonds sont-ils sécurisés ?',
      answer: 'TontiPay utilise un protocole de sécurité bancaire AES-256. Vos fonds sont séquestrés sur des comptes de cantonnement sécurisés et chaque transaction est validée par double authentification.'
    },
    {
      id: '6',
      question: 'Que se passe-t-il si un membre ne paie pas ?',
      answer: 'Le système envoie des rappels automatiques. En cas d\'échec, le "Fonds de Garantie Hub" peut intervenir selon votre niveau d\'abonnement, et des malus sont appliqués au profil du membre défaillant.'
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
    <div className="min-h-screen bg-[#F7F4EF]">
      <Navigation />

      <div className="max-w-5xl mx-auto px-[5%] py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-up">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-[#7A6E5F] font-bold hover:text-[#1A1208] transition-colors mb-8 mx-auto"
            >
              <ArrowLeft size={18} /> Retour au Dashboard
            </button>
            <div className="w-20 h-20 bg-[#1A1208] rounded-[24px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[#1a120833]">
              <HelpCircle size={40} className="text-[#C8862A]" />
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-black text-[#1A1208] leading-tight">Centre de <em className="italic text-[#C8862A]">Savoir</em></h1>
            <p className="text-[#7A6E5F] font-medium mt-3">Tout ce qu'il faut savoir sur l'excellence de l'épargne collective</p>
          </div>

          {/* Search */}
          <div className="bg-white p-4 rounded-[32px] border-[1.5px] border-[#DDD5C4] mb-12 shadow-sm animate-fade-up [animation-delay:0.1s] relative group focus-within:border-[#C8862A] transition-all">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#7A6E5F] group-focus-within:text-[#C8862A] transition-colors" size={24} />
            <input
              placeholder="Rechercher une réponse (ex: sécurité, retrait, membres)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-14 pl-14 pr-6 bg-[#F7F4EF]/50 rounded-2xl outline-none text-[#1A1208] font-medium placeholder:text-[#C1B7A6] text-lg"
            />
          </div>

          {/* FAQ Section */}
          <div className="bg-white border-[1.5px] border-[#DDD5C4] rounded-[40px] p-8 md:p-12 shadow-sm mb-12 animate-fade-up [animation-delay:0.2s]">
            <h2 className="text-2xl font-serif font-black text-[#1A1208] mb-10 flex items-center gap-3">
              <Sparkles size={24} className="text-[#C8862A]" /> Foire aux Questions
            </h2>
            <div className="space-y-6">
              {filteredFaqs.length === 0 ? (
                <div className="text-center py-12 bg-[#F7F4EF] rounded-3xl border border-dashed border-[#DDD5C4]">
                  <p className="text-[#C1B7A6] font-bold">Aucun résultat trouvé pour votre recherche.</p>
                </div>
              ) : (
                filteredFaqs.map((faq) => (
                  <div key={faq.id} className={`border-b border-[#F7F4EF] pb-6 last:border-b-0 transition-all ${openFaq === faq.id ? 'mb-4' : ''}`}>
                    <button
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full flex items-center justify-between text-left group"
                    >
                      <span className={`text-lg font-bold transition-colors ${openFaq === faq.id ? 'text-[#C8862A]' : 'text-[#1A1208] group-hover:text-[#C8862A]'}`}>
                        {faq.question}
                      </span>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${openFaq === faq.id ? 'bg-[#C8862A] text-white rotate-180' : 'bg-[#F7F4EF] text-[#7A6E5F] group-hover:bg-[#C8862A] group-hover:text-white'}`}>
                        <ChevronDown size={20} />
                      </div>
                    </button>
                    {openFaq === faq.id && (
                      <div className="mt-4 text-[#7A6E5F] text-base leading-relaxed animate-fade-down italic pl-4 border-l-2 border-[#C8862A]/20">
                        "{faq.answer}"
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Contact Support */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-up [animation-delay:0.3s]">
            {[
              { icon: MessageCircle, title: 'Chat VIP', sub: 'Assistance en direct', action: 'Démarrer le chat', link: '#', color: 'text-amber-700 bg-amber-50' },
              { icon: Mail, title: 'Correspondance', sub: 'support@tontinehub.com', action: 'Envoyer un pli', link: '#', color: 'text-emerald-700 bg-emerald-50' },
              { icon: Phone, title: 'Ligne Directe', sub: '+237 6XX XX XX XX', action: 'Appeler un conseiller', link: '#', color: 'text-rose-700 bg-rose-50' }
            ].map((item, i) => (
              <div key={i} className="bg-white border-[1.5px] border-[#DDD5C4] rounded-[32px] p-8 text-center hover:border-[#C8862A] transition-all group">
                <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform`}>
                  <item.icon size={28} />
                </div>
                <h3 className="font-serif font-black text-xl text-[#1A1208] mb-1">{item.title}</h3>
                <p className="text-sm text-[#7A6E5F] mb-6">{item.sub}</p>
                <button className="w-full py-3 border-[1.5px] border-[#DDD5C4] text-[10px] font-bold uppercase tracking-widest text-[#1A1208] rounded-full hover:bg-[#1A1208] hover:text-white transition-all">
                  {item.action}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
