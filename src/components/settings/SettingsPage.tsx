
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Navigation from '@/components/shared/Navigation';
import { Settings, User, Bell, Shield, Globe, CreditCard } from 'lucide-react';

const SettingsPage = () => {
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    payments: true,
    newMembers: true
  });

  const [language, setLanguage] = useState('fr');
  const [currency, setCurrency] = useState('EUR');

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center mr-4">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
              <p className="text-gray-600">Gérez vos préférences et paramètres de compte</p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Profile Settings */}
            <Card className="p-6">
              <div className="flex items-center mb-6">
                <User className="h-5 w-5 text-blue-600 mr-2" />
                <h2 className="text-xl font-semibold">Informations personnelles</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input id="firstName" defaultValue="Jean" />
                </div>
                <div>
                  <Label htmlFor="lastName">Nom</Label>
                  <Input id="lastName" defaultValue="Dupont" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="jean.dupont@email.com" />
                </div>
                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input id="phone" defaultValue="+33 6 12 34 56 78" />
                </div>
              </div>
              <Button className="mt-6">Sauvegarder les modifications</Button>
            </Card>

            {/* Notification Settings */}
            <Card className="p-6">
              <div className="flex items-center mb-6">
                <Bell className="h-5 w-5 text-green-600 mr-2" />
                <h2 className="text-xl font-semibold">Notifications</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notifications par email</Label>
                    <p className="text-sm text-gray-600">Recevoir les notifications importantes par email</p>
                  </div>
                  <Switch
                    checked={notifications.email}
                    onCheckedChange={(value) => handleNotificationChange('email', value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notifications push</Label>
                    <p className="text-sm text-gray-600">Notifications en temps réel sur l'application</p>
                  </div>
                  <Switch
                    checked={notifications.push}
                    onCheckedChange={(value) => handleNotificationChange('push', value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notifications SMS</Label>
                    <p className="text-sm text-gray-600">Recevoir des SMS pour les événements importants</p>
                  </div>
                  <Switch
                    checked={notifications.sms}
                    onCheckedChange={(value) => handleNotificationChange('sms', value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Rappels de paiement</Label>
                    <p className="text-sm text-gray-600">Être notifié avant les échéances de paiement</p>
                  </div>
                  <Switch
                    checked={notifications.payments}
                    onCheckedChange={(value) => handleNotificationChange('payments', value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Nouveaux membres</Label>
                    <p className="text-sm text-gray-600">Être notifié quand de nouveaux membres rejoignent vos tontines</p>
                  </div>
                  <Switch
                    checked={notifications.newMembers}
                    onCheckedChange={(value) => handleNotificationChange('newMembers', value)}
                  />
                </div>
              </div>
            </Card>

            {/* Language & Region */}
            <Card className="p-6">
              <div className="flex items-center mb-6">
                <Globe className="h-5 w-5 text-purple-600 mr-2" />
                <h2 className="text-xl font-semibold">Langue et région</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label>Langue</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Devise</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                      <SelectItem value="USD">US Dollar ($)</SelectItem>
                      <SelectItem value="XOF">Franc CFA (CFA)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            {/* Security Settings */}
            <Card className="p-6">
              <div className="flex items-center mb-6">
                <Shield className="h-5 w-5 text-red-600 mr-2" />
                <h2 className="text-xl font-semibold">Sécurité</h2>
              </div>
              <div className="space-y-4">
                <Button variant="outline" className="w-full md:w-auto">
                  Changer le mot de passe
                </Button>
                <Button variant="outline" className="w-full md:w-auto">
                  Activer l'authentification à deux facteurs
                </Button>
                <Button variant="outline" className="w-full md:w-auto">
                  Télécharger mes données
                </Button>
              </div>
            </Card>

            {/* Payment Methods */}
            <Card className="p-6">
              <div className="flex items-center mb-6">
                <CreditCard className="h-5 w-5 text-orange-600 mr-2" />
                <h2 className="text-xl font-semibold">Méthodes de paiement</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="h-6 w-6 text-gray-400" />
                    <div>
                      <div className="font-medium">**** **** **** 1234</div>
                      <div className="text-sm text-gray-600">Expire 12/26</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Modifier
                  </Button>
                </div>
                <Button variant="outline">
                  Ajouter une méthode de paiement
                </Button>
              </div>
            </Card>

            {/* Danger Zone */}
            <Card className="p-6 border-red-200">
              <h2 className="text-xl font-semibold text-red-600 mb-4">Zone de danger</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Supprimer mon compte</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Cette action est irréversible. Toutes vos données seront définitivement supprimées.
                  </p>
                  <Button variant="destructive">
                    Supprimer mon compte
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
