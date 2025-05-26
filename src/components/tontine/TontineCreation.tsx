
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Navigation from '@/components/shared/Navigation';
import { Users, Calendar, DollarSign } from 'lucide-react';

const TontineCreation = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    frequency: 'monthly',
    duration: '',
    maxMembers: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating tontine:', formData);
    // Simulate tontine creation
    navigate('/dashboard');
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
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Créer une nouvelle tontine</h1>
            <p className="text-gray-600 mt-2">Définissez les paramètres de votre groupe d'épargne</p>
          </div>

          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name">Nom de la tontine</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  placeholder="Ex: Tontine des amis"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  placeholder="Décrivez l'objectif de votre tontine"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Montant par contribution (€)</Label>
                  <div className="relative">
                    <Input
                      id="amount"
                      type="number"
                      value={formData.amount}
                      onChange={(e) => updateFormData('amount', e.target.value)}
                      placeholder="100"
                      className="pl-10"
                      required
                    />
                    <DollarSign className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="frequency">Fréquence</Label>
                  <Select value={formData.frequency} onValueChange={(value) => updateFormData('frequency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      <SelectItem value="monthly">Mensuelle</SelectItem>
                      <SelectItem value="quarterly">Trimestrielle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Durée (mois)</Label>
                  <div className="relative">
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration}
                      onChange={(e) => updateFormData('duration', e.target.value)}
                      placeholder="12"
                      className="pl-10"
                      required
                    />
                    <Calendar className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="maxMembers">Nombre max de membres</Label>
                  <div className="relative">
                    <Input
                      id="maxMembers"
                      type="number"
                      value={formData.maxMembers}
                      onChange={(e) => updateFormData('maxMembers', e.target.value)}
                      placeholder="10"
                      className="pl-10"
                      required
                    />
                    <Users className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 pt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/dashboard')}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button 
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-green-600"
                >
                  Créer la tontine
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TontineCreation;
