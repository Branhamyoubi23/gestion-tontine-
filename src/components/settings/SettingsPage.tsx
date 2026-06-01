import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Navigation from '@/components/shared/Navigation';
import { Settings, User, Bell, Shield, Globe, CreditCard, ArrowLeft, Sparkles, Key, Download, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SettingsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    payments: true,
    newMembers: true
  });

  const [language, setLanguage] = useState('fr');
  const [currency, setCurrency] = useState('XOF');

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      <Navigation />

      <div className="max-w-5xl mx-auto px-[5%] py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12 animate-fade-up">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-[#1A1208] rounded-2xl flex items-center justify-center shadow-xl shadow-[#1a120833]">
                <Settings className="h-8 w-8 text-[#C8862A]" />
              </div>
              <div>
                <h1 className="text-4xl font-serif font-black text-[#1A1208]">Salle des <em className="italic text-[#C8862A]">Régglages</em></h1>
                <p className="text-[#7A6E5F] font-medium mt-1">Configurez votre expérience Prestige</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 border-[1.5px] border-[#DDD5C4] text-[#7A6E5F] font-bold rounded-full text-xs uppercase tracking-widest hover:border-[#C8862A] hover:text-[#C8862A] transition-all"
            >
              <ArrowLeft size={16} className="inline mr-2" /> Retour
            </button>
          </div>

          <div className="space-y-8 animate-fade-up [animation-delay:0.1s]">
            {/* Profile Settings */}
            <Card className="p-8 md:p-10 border-[#DDD5C4] rounded-[40px] bg-white shadow-sm overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(circle_at_center,rgba(200,134,42,0.03)_0%,transparent_70%)] pointer-events-none" />

              <div className="flex items-center gap-4 mb-10 border-b border-[#F7F4EF] pb-4 relative z-10">
                <User className="h-6 w-6 text-[#C8862A]" />
                <h2 className="text-2xl font-serif font-black text-[#1A1208]">Coordoneés de l'Investisseur</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-8 relative z-10">
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-widest text-[#7A6E5F]">Prénom</Label>
                  <Input defaultValue="Jean-Claude" className="h-12 bg-[#F7F4EF] border-[#DDD5C4] rounded-xl focus:border-[#C8862A] transition-all" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-widest text-[#7A6E5F]">Nom de Famille</Label>
                  <Input defaultValue="Kouam" className="h-12 bg-[#F7F4EF] border-[#DDD5C4] rounded-xl focus:border-[#C8862A] transition-all" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-widest text-[#7A6E5F]">Adresse Électronique</Label>
                  <Input type="email" defaultValue="jc.kouam@invest.cm" className="h-12 bg-[#F7F4EF] border-[#DDD5C4] rounded-xl focus:border-[#C8862A] transition-all" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-widest text-[#7A6E5F]">Numéro Certifié</Label>
                  <Input defaultValue="+237 6XX XX XX XX" className="h-12 bg-[#F7F4EF] border-[#DDD5C4] rounded-xl opacity-60 cursor-not-allowed" disabled />
                </div>
              </div>
              <button className="mt-10 px-10 h-14 bg-[#1A1208] text-white font-bold rounded-full hover:bg-[#2A1F10] transition-all shadow-lg relative z-10">
                Mettre à jour mon identité
              </button>
            </Card>

            {/* Notification Settings */}
            <Card className="p-8 md:p-10 border-[#DDD5C4] rounded-[40px] bg-white shadow-sm overflow-hidden relative">
              <div className="flex items-center gap-4 mb-10 border-b border-[#F7F4EF] pb-4">
                <Bell className="h-6 w-6 text-[#C8862A]" />
                <h2 className="text-2xl font-serif font-black text-[#1A1208]">Système de Signaux</h2>
              </div>
              <div className="space-y-8">
                {[
                  { key: 'email', label: 'Rapports par Courriel', desc: 'Recevoir les bilans de fin de cycle.' },
                  { key: 'push', label: 'Alertes Instantanées', desc: 'Savoir en temps réel quand l\'argent circule.' },
                  { key: 'sms', label: 'Service SMS VIP', desc: 'Alertes d\'urgence même sans connexion internet.' },
                  { key: 'payments', label: 'Rappels de Cotisation', desc: 'Ne manquez jamais un tour de table.' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between group">
                    <div className="flex-1 pr-6">
                      <Label className="text-lg font-bold text-[#1A1208] block mb-1 font-serif">{item.label}</Label>
                      <p className="text-sm text-[#7A6E5F]">{item.desc}</p>
                    </div>
                    <Switch
                      checked={(notifications as any)[item.key]}
                      onCheckedChange={(value) => handleNotificationChange(item.key, value)}
                      className="data-[state=checked]:bg-[#C8862A]"
                    />
                  </div>
                ))}
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Language & Region */}
              <Card className="p-8 border-[#DDD5C4] rounded-[40px] bg-white shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                  <Globe className="h-6 w-6 text-[#C8862A]" />
                  <h2 className="text-xl font-serif font-black text-[#1A1208]">Localisation</h2>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-widest text-[#7A6E5F]">Langue d'Interface</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger className="h-12 bg-[#F7F4EF] border-transparent rounded-xl font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-[#DDD5C4]">
                        <SelectItem value="fr">Français (Cameroun)</SelectItem>
                        <SelectItem value="en">English (Cameroon)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-widest text-[#7A6E5F]">Devise des Tontines</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger className="h-12 bg-[#F7F4EF] border-transparent rounded-xl font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-[#DDD5C4]">
                        <SelectItem value="XOF">Franc CFA BEAC (XAF/XOF)</SelectItem>
                        <SelectItem value="EUR">Euro (€)</SelectItem>
                        <SelectItem value="USD">US Dollar ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>

              {/* Security Settings */}
              <Card className="p-8 border-[#DDD5C4] rounded-[40px] bg-white shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                  <Shield className="h-6 w-6 text-[#C8862A]" />
                  <h2 className="text-xl font-serif font-black text-[#1A1208]">Protection</h2>
                </div>
                <div className="space-y-4">
                  <button className="w-full h-12 flex items-center justify-between px-6 rounded-xl border-[1.5px] border-[#F7F4EF] hover:border-[#C8862A] transition-all font-bold text-sm group">
                    <span className="flex items-center gap-3"><Key size={18} /> Changer le code</span>
                    <ArrowLeft size={16} className="rotate-180 text-[#C1B7A6] group-hover:text-[#C8862A] transition-colors" />
                  </button>
                  <button className="w-full h-12 flex items-center justify-between px-6 rounded-xl border-[1.5px] border-[#F7F4EF] hover:border-[#C8862A] transition-all font-bold text-sm group">
                    <span className="flex items-center gap-3"><Sparkles size={18} /> Authentification 2FA</span>
                    <span className="text-[10px] bg-rose-50 text-rose-500 px-2 py-0.5 rounded font-black">OFF</span>
                  </button>
                  <button className="w-full h-12 flex items-center justify-between px-6 rounded-xl border-[1.5px] border-[#F7F4EF] hover:border-[#C8862A] transition-all font-bold text-sm group">
                    <span className="flex items-center gap-3"><Download size={18} /> Télécharger mes données</span>
                    <ArrowLeft size={16} className="rotate-180 text-[#C1B7A6] group-hover:text-[#C8862A] transition-colors" />
                  </button>
                </div>
              </Card>
            </div>

            {/* Danger Zone */}
            <Card className="p-10 border-[1.5px] border-[#FCE8E6] rounded-[40px] bg-white shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-2 h-full bg-rose-500 opacity-20" />
              <h2 className="text-2xl font-serif font-black text-rose-600 mb-4 flex items-center gap-3">
                <Trash2 size={24} /> Cellule Irréversible
              </h2>
              <div className="max-w-2xl">
                <p className="text-[#8B5A10] font-medium mb-1">Suppression Définitive de l'Héritage</p>
                <p className="text-sm text-[#7A6E5F] mb-8 leading-relaxed">
                  En retirant votre profil, toutes vos archives de tontines, transactions et cercles seront supprimées selon le RGPD. Cette action est fatale et sans recours possible.
                </p>
                <button className="px-10 h-14 bg-rose-600 text-white font-bold rounded-full hover:bg-rose-700 transition-all shadow-lg shadow-rose-200">
                  Détruire mon profil Hub
                </button>
              </div>
            </Card>
          </div>

          <footer className="mt-16 text-center text-[#7A6E5F] text-xs font-bold uppercase tracking-widest pb-12">
            Configuration matérielle par TontineHub Security Division
          </footer>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
