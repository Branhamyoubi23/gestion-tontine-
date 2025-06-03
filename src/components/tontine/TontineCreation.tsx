import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Navigation from '@/components/shared/Navigation';
import { Users, Calendar, Coins } from 'lucide-react'; // Replace DollarSign with Coins

const TontineCreation = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    frequency: 'monthly',
    duration: '',
    penalty: '',
    maxMembers: '', // Added maxMembers field
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Get existing tontines or empty array
    const tontines = JSON.parse(localStorage.getItem('tontines') || '[]');
    // Create new tontine object with unique id
    const newTontine = { ...formData, id: Date.now().toString() };
    tontines.push(newTontine);
    localStorage.setItem('tontines', JSON.stringify(tontines));
    navigate('/dashboard');
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Helper to get multiplier based on frequency
  const getFrequencyMultiplier = (frequency: string) => {
    if (frequency === 'weekly') return 1;
    if (frequency === 'monthly') return 1;
    if (frequency === 'quarterly') return 3;
    return 1;
  };

  // Automatically update duration when frequency or maxMembers changes
  React.useEffect(() => {
    const max = parseInt(formData.maxMembers, 10);
    let duration = '';
    if (!isNaN(max) && max > 0) {
      if (formData.frequency === 'weekly') duration = String(max);
      else if (formData.frequency === 'monthly') duration = String(max);
      else if (formData.frequency === 'quarterly') duration = String(Math.ceil(max / 3));
    }
    setFormData(prev => ({ ...prev, duration }));
    // eslint-disable-next-line
  }, [formData.frequency, formData.maxMembers]);

  return (
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
                <Label htmlFor="amount">Montant par contribution (FCFA)</Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    min="0" // Prevent negative numbers
                    value={formData.amount}
                    onChange={(e) => updateFormData('amount', e.target.value)}
                    placeholder="Ex: 1000 FCFA"
                    className="pl-10"
                    required
                  />
                  <Coins className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <Label htmlFor="frequency">Fréquence</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value) => {
                    let duration = '';
                    if (value === 'weekly') duration = '12'; // 12 weeks
                    else if (value === 'monthly') duration = '12'; // 12 months
                    else if (value === 'quarterly') duration = '4'; // 4 quarters
                    setFormData(prev => ({
                      ...prev,
                      frequency: value,
                      duration,
                    }));
                  }}
                >
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
                    min="0"
                    value={formData.duration}
                    disabled // Make duration read-only
                    placeholder="Calculé automatiquement"
                    className="pl-10 bg-gray-100 cursor-not-allowed"
                  />
                  <Calendar className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                </div>
                <p className="text-xs text-gray-500 mt-1">La durée est calculée automatiquement : fréquence × nombre de membres.</p>
              </div>
              <div>
                <Label htmlFor="penalty">Pénalité de retard (FCFA)</Label>
                <div className="relative">
                  <Input
                    id="penalty"
                    type="number"
                    min="0"
                    value={formData.penalty || ''}
                    onChange={(e) => updateFormData('penalty', e.target.value)}
                    placeholder="Ex: 500 FCFA"
                    className="pl-10"
                  />
                  <Coins className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                </div>
                <p className="text-xs text-gray-500 mt-1">Montant à payer en cas de retard de paiement.</p>
              </div>
            </div>

            {/* Max Members Field */}
            <div>
              <Label htmlFor="maxMembers">Nombre max de membres</Label>
              <Input
                id="maxMembers"
                type="number"
                min="1"
                value={formData.maxMembers}
                onChange={(e) => updateFormData('maxMembers', e.target.value)}
                placeholder="Ex: 10"
                required
              />
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
  );
};

export default TontineCreation;
