
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Navigation from '@/components/shared/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Phone, Globe, Camera } from 'lucide-react';

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    language: user?.language || 'fr'
  });
  const [isEditing, setIsEditing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(formData);
    setIsEditing(false);
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Mon profil</h1>
            <p className="text-gray-600 mt-2">Gérez vos informations personnelles</p>
          </div>

          <Card className="p-8">
            {/* Profile Picture */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center">
                  {user?.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name} 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-2xl font-medium">
                      {user?.name?.charAt(0)}
                    </span>
                  )}
                </div>
                <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center border">
                  <Camera className="h-4 w-4 text-gray-600" />
                </button>
              </div>
              <h2 className="text-xl font-semibold mt-4">{user?.name}</h2>
              <p className="text-gray-600">{user?.email}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name">Nom complet</Label>
                <div className="relative mt-1">
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateFormData('name', e.target.value)}
                    className="pl-10"
                    disabled={!isEditing}
                  />
                  <User className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Adresse e-mail</Label>
                <div className="relative mt-1">
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    className="pl-10"
                    disabled={!isEditing}
                  />
                  <Mail className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <div className="relative mt-1">
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => updateFormData('phone', e.target.value)}
                    className="pl-10"
                    disabled={!isEditing}
                  />
                  <Phone className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <Label htmlFor="language">Langue préférée</Label>
                <div className="relative mt-1">
                  <Select 
                    value={formData.language} 
                    onValueChange={(value) => updateFormData('language', value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger className="pl-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                  <Globe className="h-5 w-5 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div className="flex space-x-4 pt-6">
                {isEditing ? (
                  <>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsEditing(false)}
                      className="flex-1"
                    >
                      Annuler
                    </Button>
                    <Button 
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-blue-600 to-green-600"
                    >
                      Sauvegarder
                    </Button>
                  </>
                ) : (
                  <Button 
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="w-full bg-gradient-to-r from-blue-600 to-green-600"
                  >
                    Modifier le profil
                  </Button>
                )}
              </div>
            </form>
          </Card>

          {/* Account Settings */}
          <Card className="p-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">Paramètres du compte</h3>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                Changer le mot de passe
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Notifications
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Confidentialité
              </Button>
              <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
                Supprimer le compte
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
