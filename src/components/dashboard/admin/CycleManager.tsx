import React, { useState, useEffect } from 'react';
import { 
  RotateCw, UserCheck, Calendar, ArrowRightCircle, 
  CheckCircle2, Clock, PlayCircle, Lock, Trophy, 
  Loader2, Settings2, PlusCircle, Dice5
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { tontineService, drawService, transactionService } from '@/services/api';
import { toast } from 'react-toastify';

interface CycleManagerProps {
  tontines: any[];
}

const CycleManager = ({ tontines }: CycleManagerProps) => {
  const navigate = useNavigate();
  const [selectedTontineId, setSelectedTontineId] = useState<string>(tontines[0]?.id || '');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentTurn, setCurrentTurn] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedResults, setEditedResults] = useState<any[]>([]);

  const fetchCycleData = async () => {
    if (!selectedTontineId) return;
    setLoading(true);
    try {
      const res = await drawService.getResults(selectedTontineId);
      const data = Array.isArray(res) ? res : (res.data || []);
      
      // Sort by position
      const sorted = [...data].sort((a, b) => a.position - b.position);
      setResults(sorted);

      // Find first unpaid position
      const next = sorted.find(r => !r.is_paid);
      setCurrentTurn(next);
    } catch (err) {
      toast.error('Erreur de chargement du cycle');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCycleData();
  }, [selectedTontineId]);

  const handleMarkAsPaid = async (memberId: number, position: number) => {
    if (!window.confirm(`Confirmer le paiement de la cagnotte au bénéficiaire de la position ${position} ?`)) return;
    try {
      const selectedTontine = tontines.find(t => t.id.toString() === selectedTontineId.toString());
      const potAmount = Number(selectedTontine?.amount || 0) * results.length;

      await transactionService.adminRecord({
        tontineId: selectedTontineId,
        userId: memberId,
        amount: potAmount,
        type: 'payout',
        description: `Paiement du tour #${position}`
      });
      toast.success('Paiement validé avec succès !');
      fetchCycleData();
    } catch (err) {
      toast.error('Échec de la validation du paiement');
    }
  };

  const toggleEditing = () => {
    if (isEditing) {
      // Save changes
      saveNewOrder();
    } else {
      setEditedResults([...results]);
      setIsEditing(true);
    }
  };

  const saveNewOrder = async () => {
    setLoading(true);
    try {
      const rotation = editedResults.map(r => ({
        userId: r.user_id,
        position: parseInt(r.position)
      }));
      await tontineService.updateRotationOrder(selectedTontineId, rotation);
      toast.success('Ordre de rotation mis à jour !');
      setIsEditing(false);
      fetchCycleData();
    } catch (err) {
      toast.error('Erreur lors de la mise à jour de l\'ordre');
    } finally {
      setLoading(false);
    }
  };

  const handlePositionChange = (index: number, newPos: string) => {
    const updated = [...editedResults];
    updated[index].position = newPos;
    setEditedResults(updated);
  };

  return (
    <div className="space-y-10 animate-in fade-in zoom-in duration-500">
      {/* Module Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-100 rounded-[24px] flex items-center justify-center text-indigo-600">
            <RotateCw size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Gestion du Cycle</h2>
            <p className="text-slate-500 font-medium">Ordonnez les tours et pilotez les distributions</p>
          </div>
        </div>

        <select 
          value={selectedTontineId}
          onChange={(e) => setSelectedTontineId(e.target.value)}
          className="h-14 px-8 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm"
        >
          {tontines.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
        {/* Left: Active Turn Dashboard */}
        <div className="lg:col-span-1 space-y-6">
            <div className={`bg-slate-900 rounded-[32px] md:rounded-[48px] p-6 md:p-10 text-white shadow-2xl relative overflow-hidden group ${!currentTurn && results.length > 0 ? 'border-4 border-emerald-500/50' : ''}`}>
               <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-6">Période Actuelle</p>
                  {currentTurn ? (
                    <>
                      <div className="flex items-center gap-4 mb-10">
                         <div className="w-16 h-16 rounded-3xl bg-indigo-600 flex items-center justify-center text-3xl font-black shadow-lg">
                            {currentTurn.position}
                         </div>
                         <div>
                            <h4 className="text-2xl font-black">{currentTurn.user_name}</h4>
                            <p className="text-xs font-bold text-indigo-400">Bénéficiaire en attente</p>
                         </div>
                      </div>
                      <button 
                        onClick={() => handleMarkAsPaid(currentTurn.user_id, currentTurn.position)}
                        className="w-full py-5 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-400 hover:text-white transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
                      >
                        Distribuer la Cagnotte ➔
                      </button>
                    </>
                  ) : results.length > 0 ? (
                    <div className="space-y-6">
                       <div className="py-8 text-center border-2 border-dashed border-emerald-500/30 rounded-3xl bg-emerald-500/5">
                          <Trophy className="w-12 h-12 mx-auto mb-4 text-emerald-400 animate-bounce" />
                          <p className="font-black text-lg">Cycle Terminé !</p>
                          <p className="text-[10px] font-medium text-emerald-200 uppercase tracking-widest mt-1">Tous les membres ont été payés</p>
                       </div>
                       <button 
                         onClick={() => navigate(`/tontine/${selectedTontineId}/draw`)}
                         className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-900/40"
                       >
                         Nouveau Cycle (Tirage)
                       </button>
                    </div>
                  ) : (
                    <div className="py-8 text-center border-2 border-dashed border-white/10 rounded-3xl">
                       <Dice5 className="w-10 h-10 mx-auto mb-4 text-indigo-400" />
                       <p className="font-bold text-sm">Prêt pour le tirage</p>
                    </div>
                  )}
               </div>
               <div className="absolute -bottom-10 -right-10 opacity-10 rotate-12 transition-transform group-hover:scale-110 pointer-events-none">
                  <PlayCircle size={200} />
               </div>
            </div>

           <div className="bg-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-slate-100 shadow-sm relative group overflow-hidden">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-6 leading-tight">Prochaine Échéance</h4>
              <div className="flex items-center gap-4 mb-2">
                 <Calendar className="text-indigo-600 w-5 h-5" />
                 <span className="text-xl font-black text-slate-900">Dimanche, 05 Avril</span>
              </div>
              <p className="text-xs font-medium text-slate-400">Fin du cycle mensuel actuel</p>
              <Settings2 className="absolute top-6 right-6 text-slate-100 group-hover:rotate-90 transition-transform duration-500 w-6 h-6" />
           </div>
        </div>

        {/* Right: Full Cycle Roadmap */}
        <div className="lg:col-span-2 bg-white rounded-[32px] md:rounded-[56px] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[400px] md:min-h-[600px]">
           <div className="px-6 md:px-12 py-6 md:py-10 border-b flex flex-col sm:flex-row justify-between items-center bg-slate-50/30 gap-4">
              <h3 className="text-2xl font-black text-slate-900">Plan de Redistribution</h3>
              <button 
                onClick={toggleEditing}
                className={`flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                  isEditing ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white border border-slate-100 text-slate-500 hover:text-indigo-600'
                }`}
              >
                 {isEditing ? <CheckCircle2 size={14} /> : <PlusCircle size={14} />}
                 {isEditing ? 'Enregistrer l\'ordre' : 'Réorganiser'}
              </button>
           </div>
           
           <div className="flex-1 px-4 md:px-10 py-6 md:py-10 space-y-4 overflow-y-auto max-h-[700px] custom-scrollbar">
              {loading ? (
                <div className="h-full flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-600" /></div>
              ) : results.length > 0 ? (
                (isEditing ? editedResults : results).map((r, i) => (
                  <div 
                    key={i} 
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-6 md:p-8 rounded-[24px] md:rounded-[36px] transition-all border gap-6 ${
                      r.is_paid 
                        ? 'bg-emerald-50/40 border-emerald-50' 
                        : r.position == currentTurn?.position 
                        ? 'bg-white border-indigo-200 shadow-xl shadow-indigo-100/50 sm:scale-[1.02]' 
                        : 'bg-white border-slate-50'
                    }`}
                  >
                     <div className="flex items-center gap-4 md:gap-8">
                        {isEditing ? (
                          <input 
                            type="number"
                            value={r.position}
                            onChange={(e) => handlePositionChange(i, e.target.value)}
                            className="w-14 h-14 bg-indigo-50 border-2 border-indigo-200 rounded-2xl flex items-center justify-center text-center text-xl font-black text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-100"
                          />
                        ) : (
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black transition-colors ${
                            r.is_paid ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                          }`}>
                             {r.position}
                          </div>
                        )}
                        <div>
                           <h4 className={`text-xl font-black transition-colors ${r.is_paid ? 'text-slate-400' : 'text-slate-900'}`}>
                             {r.user_name}
                           </h4>
                           <div className="flex items-center gap-2 mt-1">
                              {r.is_paid ? (
                                <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase tracking-tighter">
                                   <CheckCircle2 className="w-3 h-3" /> Somme encaissée
                                </span>
                              ) : (
                                <span className="flex items-center gap-1.5 text-[10px] font-black text-amber-500 uppercase tracking-tighter">
                                   <Clock className="w-3 h-3" /> Passage prévu
                                </span>
                              )}
                           </div>
                        </div>
                     </div>
                     
                     <div className="flex items-center gap-4">
                        {!r.is_paid && !isEditing && (
                          <button 
                            onClick={() => handleMarkAsPaid(r.user_id, r.position)}
                            className="bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                          >
                            Valider
                          </button>
                        )}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${r.is_paid ? 'text-emerald-500 bg-emerald-100' : 'text-slate-200'}`}>
                           <CheckCircle2 size={24} strokeWidth={3} />
                        </div>
                     </div>
                  </div>
                ))
              ) : (
                <div className="py-32 text-center">
                   <Dice5 className="w-16 h-16 mx-auto mb-6 text-indigo-200 animate-pulse" />
                   <h4 className="font-black text-slate-300 uppercase tracking-[0.2em] text-xs">Aucun tirage au sort effectué</h4>
                   <p className="text-slate-400 text-sm mt-2 max-w-xs mx-auto mb-8">Veuillez lancer le tirage au sort pour définir l'ordre des bénéficiaires.</p>
                   <button 
                    onClick={() => navigate(`/tontine/${selectedTontineId}/draw`)}
                    className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20"
                   >
                     Accéder à l'Espace Tirage
                   </button>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default CycleManager;
