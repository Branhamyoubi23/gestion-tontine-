import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Navigation from '@/components/shared/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Phone, Globe, Camera, Shield, Bell, Settings, Trash2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
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
    <div className="min-h-screen bg-[#F7F4EF]">
      <Navigation />

      <div className="max-w-4xl mx-auto px-[5%] py-12">
        <div className="mb-10 flex items-center justify-between animate-fade-up">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-[#7A6E5F] font-bold hover:text-[#1A1208] transition-colors"
          >
            <ArrowLeft size={18} /> Retour
          </button>
          <h1 className="text-3xl font-serif font-black text-[#1A1208]">Mon Espace <em className="italic text-[#C8862A]">Personnel</em></h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 animate-fade-up [animation-delay:0.1s]">
          <div className="space-y-8">
            <Card className="p-8 md:p-12 border-[#DDD5C4] rounded-[32px] bg-white shadow-sm overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(circle_at_center,rgba(200,134,42,0.05)_0%,transparent_70%)] pointer-events-none" />

              <div className="flex flex-col md:flex-row items-center gap-10 mb-12 relative z-10 border-b border-[#F7F4EF] pb-10">
                <div className="relative group">
                  <div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-[#C8862A] to-[#E8A040] rounded-[48px] flex items-center justify-center shadow-2xl shadow-[#c8862a33] transform group-hover:scale-[1.02] transition-transform overflow-hidden">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-5xl font-serif font-black">
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <button className="absolute -bottom-2 -right-2 w-11 h-11 bg-white text-[#1A1208] rounded-full shadow-lg flex items-center justify-center border-4 border-[#F7F4EF] hover:bg-[#F5E6C8] transition-colors">
                    <Camera className="h-5 w-5" />
                  </button>
                </div>

                <div className="text-center md:text-left">
                  <span className="px-3 py-1 bg-[#F5E6C8] text-[#8B5A10] text-[10px] font-bold uppercase tracking-widest rounded-full border border-[#C8862A]/20 mb-3 inline-block">
                    {user?.language === 'fr' ? 'Compte Vérifié' : 'Verified Account'}
                  </span>
                  <h2 className="text-3xl font-serif font-black text-[#1A1208] mb-1">{user?.name}</h2>
                  <p className="text-[#7A6E5F] font-medium">{user?.phone}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-widest text-[#7A6E5F]">Identité Complète</Label>
                    <div className="relative group">
                      <User className="h-4 w-4 text-[#7A6E5F] absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-[#C8862A] transition-colors" />
                      <Input
                        value={formData.name}
                        onChange={(e) => updateFormData('name', e.target.value)}
                        className={`pl-11 h-12 bg-[#F7F4EF] border-[#DDD5C4] rounded-xl focus:border-[#C8862A] transition-all ${!isEditing && 'opacity-70 cursor-not-allowed'}`}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-widest text-[#7A6E5F]">Courriel</Label>
                    <div className="relative group">
                      <Mail className="h-4 w-4 text-[#7A6E5F] absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-[#C8862A] transition-colors" />
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateFormData('email', e.target.value)}
                        className={`pl-11 h-12 bg-[#F7F4EF] border-[#DDD5C4] rounded-xl focus:border-[#C8862A] transition-all ${!isEditing && 'opacity-70 cursor-not-allowed'}`}
                        disabled={!isEditing}
                        placeholder="Non renseigné"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-widest text-[#7A6E5F]">Téléphone</Label>
                    <div className="relative group">
                      <Phone className="h-4 w-4 text-[#7A6E5F] absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-[#C8862A] transition-colors" />
                      <Input
                        value={formData.phone}
                        onChange={(e) => updateFormData('phone', e.target.value)}
                        className="pl-11 h-12 bg-[#F7F4EF] border-[#DDD5C4] rounded-xl opacity-70 cursor-not-allowed"
                        disabled={true}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-widest text-[#7A6E5F]">Langue d'Usage</Label>
                    <div className="relative group">
                      <Globe className="h-4 w-4 text-[#7A6E5F] absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-[#C8862A] transition-colors z-10" />
                      <Select
                        value={formData.language}
                        onValueChange={(value) => updateFormData('language', value)}
                        disabled={!isEditing}
                      >
                        <SelectTrigger className={`pl-11 h-12 bg-[#F7F4EF] border-[#DDD5C4] rounded-xl focus:border-[#C8862A] transition-all ${!isEditing && 'opacity-70'}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-[#DDD5C4]">
                          <SelectItem value="fr">Français (FR)</SelectItem>
                          <SelectItem value="en">English (EN)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="flex-1 h-14 rounded-full border-[1.5px] border-[#DDD5C4] font-bold text-[#7A6E5F] hover:bg-[#F7F4EF] transition-colors"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="flex-[2] h-14 bg-gradient-to-br from-[#1A1208] to-[#2A1F10] text-white font-bold rounded-full shadow-xl hover:scale-[1.02] transition-all"
                      >
                        Enregistrer les modifications
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="w-full h-14 bg-gradient-to-br from-[#C8862A] to-[#E8A040] text-white font-bold rounded-full shadow-xl shadow-[#c8862a26] hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
                    >
                      Modifier mon profil <Settings size={18} />
                    </button>
                  )}
                </div>
              </form>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-8 border-[#DDD5C4] rounded-[32px] bg-white shadow-sm">
              <h3 className="text-xl font-serif font-black text-[#1A1208] mb-6 border-b border-[#F7F4EF] pb-4">Préférences</h3>
              <div className="space-y-4">
                {[
                  { icon: Shield, label: 'Sécurité', color: 'text-[#C8862A]' },
                  { icon: Bell, label: 'Notifications', color: 'text-[#C8862A]' },
                  { icon: Settings, label: 'Confidentialité', color: 'text-[#C8862A]' },
                ].map((item, idx) => (
                  <button key={idx} className="w-full flex items-center justify-between p-4 rounded-2xl border border-[#F7F4EF] hover:border-[#C8862A] hover:bg-[#F7F4EF] transition-all group">
                    <div className="flex items-center gap-4">
                      <item.icon size={20} className={item.color} />
                      <span className="font-bold text-[#1A1208] text-sm">{item.label}</span>
                    </div>
                    <ArrowLeft size={16} className="text-[#C1B7A6] rotate-180 group-hover:text-[#C8862A] transition-colors" />
                  </button>
                ))}

                <button className="w-full flex items-center justify-between p-4 rounded-2xl border border-[#FCE8E6] text-[#D93025] hover:bg-[#FCE8E6] transition-all mt-8 group">
                  <div className="flex items-center gap-4">
                    <Trash2 size={20} />
                    <span className="font-bold text-sm">Supprimer le compte</span>
                  </div>
                </button>
              </div>
            </Card>

            <div className="bg-[#1A1208] rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#C8862A] opacity-10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <h4 className="text-lg font-serif font-black mb-2 flex items-center gap-2">
                <Shield className="text-[#C8862A]" size={20} /> Statut Pro
              </h4>
              <p className="text-xs text-white/60 leading-relaxed mb-6">
                Profitez d'une assurance transactionnelle étendue et de plafonds de cotisation augmentés.
              </p>
              <button
                onClick={() => navigate('/pricing')}
                className="w-full py-3 bg-[#C8862A] text-[#1A1208] font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-white transition-colors"
              >
                Gérer mon abonnement
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
