import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Mail, Lock, User, Phone } from 'lucide-react';

function validatePassword(password: string) {
  // Au moins 8 caractères, une majuscule, une minuscule, un chiffre, un caractère spécial
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(password);
}

function validateCameroonPhone(phone: string) {
  // Format accepté : +2376XXXXXXXX ou 6XXXXXXXX
  // Préfixes MTN/Orange courants : 65, 67, 68, 69, 655-659, 650-654, 690-699
  const cleaned = phone.replace(/\s+/g, '').replace(/^(\+237)/, '');
  return /^6(5[0-9]|7[0-9]|8[0-9]|9[0-9])[0-9]{6}$/.test(cleaned);
}

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    language: 'fr' as 'fr' | 'en'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const invite = params.get('invite');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateCameroonPhone(formData.phone)) {
      setError("Numéro de téléphone invalide. Utilisez un numéro MTN ou Orange Cameroun.");
      return;
    }

    if (!validatePassword(formData.password)) {
      setError('Le mot de passe doit contenir au moins 8 caractères, une minuscule, une majuscule, un chiffre et un caractère spécial.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await register({
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone,
        language: formData.language,
        password: formData.password,
        invite
      });
      navigate('/onboarding');
    } catch (error: any) {
      // Si l'API retourne une réponse JSON avec un message d'erreur
      if (error.response && error.response.data && error.response.data.error) {
        setError(error.response.data.error);
      } else if (error.message && error.message.includes('email')) {
        setError("Cet email est déjà utilisé.");
      } else {
        setError("Erreur lors de l'inscription");
      }
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg">
        {/* Logo */}
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Inscription</h2>
          <p className="text-gray-600 mt-2">Créez votre compte TontineHub</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="text-red-600 mb-4">{error}</div>}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nom complet</Label>
              <div className="relative mt-1">
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  placeholder="Votre nom complet"
                  className="pl-10"
                  required
                />
                <User className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Adresse e-mail  (Optionnel) </Label>
              <div className="relative mt-1">
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  placeholder="exemple@gmail.com"
                  className="pl-10"
                  
                />
                <Mail className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <div className="relative mt-1">
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateFormData('phone', e.target.value)}
                  placeholder="+237 6********"
                  className="pl-10"
                  required
                />
                <Phone className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <Label htmlFor="language">Langue préférée</Label>
              <Select value={formData.language} onValueChange={(value) => updateFormData('language', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => updateFormData('password', e.target.value)}
                  placeholder="Mot de passe"
                  className="pl-10"
                  required
                />
                <Lock className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                <small className="text-gray-500">Au moins 8 caractères, une majuscule, une minuscule, un chiffre, un caractère spécial.</small>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <div className="relative mt-1">
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                  required
                />
                <Lock className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-green-600"
            disabled={loading}
          >
            {loading ? 'Création du compte...' : 'Créer mon compte'}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-gray-600">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-500 font-medium">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
