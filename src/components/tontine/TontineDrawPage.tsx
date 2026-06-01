import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navigation from '@/components/shared/Navigation';
import {
  Sparkles, ArrowLeft, Lock, Trophy, Users, CheckCircle,
  Clock, Shield, Zap, Hash, UserCheck, UserX, RefreshCw, AlertTriangle
} from 'lucide-react';
import { tontineService } from '../../services/api';
import { drawService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';

type Member = {
  id: number;
  name: string;
  phone: string;
  role: string;
  has_drawn: boolean;
  member_status: string;
  draw_info: { position: number; method: string } | null;
};

const METHOD_LABELS: Record<string, { label: string; color: string }> = {
  online: { label: 'En ligne', color: 'text-emerald-600 bg-emerald-50' },
  physical_admin: { label: 'Physique', color: 'text-blue-600 bg-blue-50' },
  auto: { label: 'Automatique', color: 'text-purple-600 bg-purple-50' },
};

const TontineDrawPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tontine, setTontine] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [revealedPosition, setRevealedPosition] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Admin physical draw state
  const [selectedMember, setSelectedMember] = useState<number | null>(null);
  const [physicalPosition, setPhysicalPosition] = useState('');
  const [physicalLoading, setPhysicalLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [tRes, sRes, mRes, rRes] = await Promise.all([
        tontineService.getTontineDetails(id!),
        drawService.getSession(id!),
        drawService.getMembersStatus(id!),
        drawService.getResults(id!)
      ]);
      const t = tRes.data;
      setTontine(t);
      setSession(sRes.data);
      setMembers(mRes.data || []);
      setResults(rRes.data || []);

      // Check if current user is admin
      const allMembers = mRes.data || [];
      const me = allMembers.find((m: Member) => m.id === user?.id);
      setIsAdmin(me?.role === 'admin');

      // Check if user already drew
      const myDraw = allMembers.find((m: Member) => m.id === user?.id);
      if (myDraw?.draw_info?.position) {
        setRevealedPosition(myDraw.draw_info.position);
      }
    } catch (err) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [id, user?.id]);

  useEffect(() => {
    fetchAll();

    // Real-time updates
    const socket = io('http://localhost:5000');
    socket.on('position_taken', () => fetchAll());
    socket.on('draw_opened', () => fetchAll());
    socket.on('draw_completed', (data: any) => {
      setResults(data.results || []);
      fetchAll();
    });
    return () => { socket.disconnect(); };
  }, [fetchAll]);

  // ─── MEMBER ONLINE DRAW ──────────────────────────────────────────────────────
  const handleOnlineDraw = async () => {
    if (drawing || revealedPosition || !session) return;
    setDrawing(true);
    try {
      const res = await drawService.drawOnline(id!);
      setRevealedPosition(res.position);
      toast.success(`Position #${res.position} obtenue !`);
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors du tirage');
    } finally {
      setDrawing(false);
    }
  };

  // ─── ADMIN ACTIONS ───────────────────────────────────────────────────────────
  const handleOpenSession = async () => {
    try {
      await drawService.openSession(id!, tontine?.draw_mode || 'hybrid');
      toast.success('Session de tirage ouverte !');
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  const handlePhysicalDraw = async () => {
    if (!selectedMember || !physicalPosition) return toast.error('Sélectionnez un membre et une position.');
    setPhysicalLoading(true);
    try {
      await drawService.drawPhysical(id!, selectedMember, parseInt(physicalPosition));
      toast.success(`Position #${physicalPosition} enregistrée !`);
      setSelectedMember(null);
      setPhysicalPosition('');
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setPhysicalLoading(false);
    }
  };

  const handleLockSession = async () => {
    if (!window.confirm('Cela va automatiquement attribuer les positions restantes. Continuer ?')) return;
    try {
      const res = await drawService.lockSession(id!);
      toast.success(`Session verrouillée ! ${res.autoCount} tirage(s) automatique(s) effectué(s).`);
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F7F4EF] flex items-center justify-center">
      <div className="w-12 h-12 border-[3px] border-[#DDD5C4] border-t-[#C8862A] rounded-full animate-spin" />
    </div>
  );

  const pendingMembers = members.filter(m => !m.has_drawn);
  const drawnMembers = members.filter(m => m.has_drawn);
  const myDraw = members.find(m => m.id === user?.id);
  const hasDrawn = !!myDraw?.has_drawn;
  const sessionOpen = session?.status === 'open';
  const sessionDone = !session || session?.status === 'completed';

  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      <Navigation />

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <button onClick={() => navigate(`/tontine/${id}`)}
            className="flex items-center gap-2 text-[#7A6E5F] font-bold hover:text-[#1A1208] transition-colors">
            <ArrowLeft size={18} /> Retour
          </button>

          <div className="flex items-center gap-3">
            {session ? (
              <span className={`px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest flex items-center gap-2 ${
                session.status === 'open' ? 'bg-emerald-100 text-emerald-700' :
                session.status === 'completed' ? 'bg-[#1A1208] text-[#C8862A]' :
                'bg-amber-100 text-amber-700'
              }`}>
                {session.status === 'open' && <><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> En cours</>}
                {session.status === 'completed' && <><CheckCircle size={14} /> Terminé</>}
              </span>
            ) : (
              <span className="px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest bg-gray-100 text-gray-500 flex items-center gap-2">
                <Clock size={14} /> En attente
              </span>
            )}

            <button onClick={fetchAll}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-[#DDD5C4] hover:border-[#C8862A] transition-colors">
              <RefreshCw size={16} className="text-[#7A6E5F]" />
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-1.5 bg-[#F5E6C8] text-[#8B5A10] text-[10px] font-black uppercase tracking-[0.2em] rounded-full mb-4 border border-[#C8862A]/20">
            {tontine?.draw_mode === 'hybrid' ? '⚡ Mode Hybride' : tontine?.draw_mode === 'physical' ? '🤝 Mode Physique' : '💻 Mode En Ligne'}
          </div>
          <h1 className="text-5xl font-serif font-black text-[#1A1208] mb-3">
            Tirage de <em className="italic text-[#C8862A]">{tontine?.name}</em>
          </h1>
          <p className="text-[#7A6E5F] max-w-xl mx-auto">
            {drawnMembers.length} / {members.length} membres ont tiré leur position
          </p>
          {/* Progress */}
          <div className="w-full max-w-sm mx-auto mt-4 h-2 bg-[#DDD5C4] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#C8862A] rounded-full transition-all duration-700"
              style={{ width: `${members.length > 0 ? (drawnMembers.length / members.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ─── LEFT: Member Draw Zone ─────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* If session is done → show results table */}
            {sessionDone && results.length > 0 && (
              <div className="bg-white rounded-[32px] border border-[#DDD5C4] overflow-hidden shadow-sm">
                <div className="p-6 border-b border-[#F7F4EF] flex items-center gap-3">
                  <Trophy size={20} className="text-[#C8862A]" />
                  <h2 className="font-serif font-black text-[#1A1208] text-xl">Résultats Finaux</h2>
                </div>
                <div className="divide-y divide-[#F7F4EF]">
                  {results.map((r: any) => (
                    <div key={r.position} className="flex items-center gap-4 px-6 py-4">
                      <div className="w-10 h-10 bg-[#1A1208] text-[#C8862A] rounded-xl flex items-center justify-center font-black">
                        #{r.position}
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-[#1A1208]">{r.member_name}</p>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${METHOD_LABELS[r.method]?.color}`}>
                          {METHOD_LABELS[r.method]?.label}
                        </span>
                      </div>
                      <CheckCircle size={18} className="text-emerald-500" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Member online draw card */}
            {sessionOpen && !isAdmin && (
              <AnimatePresence>
                {!hasDrawn ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[40px] border-2 border-[#DDD5C4] p-12 text-center shadow-xl"
                  >
                    <div className="w-24 h-24 bg-[#F5E6C8] rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                      <Sparkles size={48} className="text-[#C8862A] animate-pulse" />
                    </div>
                    <h2 className="text-2xl font-serif font-black text-[#1A1208] mb-3">C'est votre tour !</h2>
                    <p className="text-[#7A6E5F] mb-8 leading-relaxed">
                      Cliquez sur le bouton ci-dessous. Une position vous sera attribuée aléatoirement de manière sécurisée.
                    </p>
                    <button
                      onClick={handleOnlineDraw}
                      disabled={drawing}
                      className="h-16 px-12 bg-gradient-to-br from-[#C8862A] to-[#E8A040] text-white font-black rounded-full shadow-lg shadow-[#c8862a30] hover:scale-[1.03] active:scale-95 transition-all flex items-center gap-3 mx-auto text-lg"
                    >
                      {drawing ? (
                        <><div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Tirage en cours...</>
                      ) : (
                        <><Zap size={20} /> Tirer ma position</>
                      )}
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-[#1A1208] rounded-[40px] p-12 text-center text-white border-4 border-[#C8862A] shadow-2xl shadow-amber-900/30"
                  >
                    <Trophy size={56} className="text-[#C8862A] mx-auto mb-6 drop-shadow-[0_0_20px_rgba(200,134,42,0.5)]" />
                    <p className="text-[11px] uppercase font-black tracking-[0.3em] text-[#C8862A] mb-3">Votre Position</p>
                    <div className="text-8xl font-serif font-black text-white mb-4">
                      #{myDraw?.draw_info?.position}
                    </div>
                    <div className={`inline-block px-4 py-1.5 rounded-full text-xs font-black ${METHOD_LABELS[myDraw?.draw_info?.method || 'online']?.color}`}>
                      {METHOD_LABELS[myDraw?.draw_info?.method || 'online']?.label}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {/* Waiting for session to open */}
            {!sessionOpen && !sessionDone && (
              <div className="bg-white rounded-[40px] border border-[#DDD5C4] p-12 text-center">
                <Clock size={48} className="text-[#DDD5C4] mx-auto mb-4" />
                <h2 className="text-xl font-serif font-black text-[#1A1208] mb-2">En attente du tirage</h2>
                <p className="text-[#7A6E5F]">L'administrateur ouvrira la session de tirage bientôt.</p>
              </div>
            )}
          </div>

          {/* ─── RIGHT: Admin Panel ──────────────────────────────────────────────── */}
          <div className="space-y-5">

            {/* Admin Controls */}
            {isAdmin && (
              <div className="bg-[#1A1208] rounded-[32px] p-6 text-white">
                <div className="flex items-center gap-2 mb-5">
                  <Shield size={18} className="text-[#C8862A]" />
                  <h3 className="font-black text-sm uppercase tracking-wider">Panneau Admin</h3>
                </div>

                {!session && (
                  <button onClick={handleOpenSession}
                    className="w-full h-12 bg-[#C8862A] text-white font-black rounded-full hover:bg-[#E8A040] transition-colors flex items-center justify-center gap-2">
                    <Zap size={16} /> Ouvrir le Tirage
                  </button>
                )}
                {sessionOpen && (
                  <button onClick={handleLockSession}
                    className="w-full h-12 bg-rose-500 text-white font-black rounded-full hover:bg-rose-600 transition-colors flex items-center justify-center gap-2">
                    <Lock size={16} /> Verrouiller & Auto-tirer
                  </button>
                )}
                {session?.status === 'completed' && (
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <CheckCircle size={16} /> Tirage terminé
                  </div>
                )}
              </div>
            )}

            {/* Physical Draw (Admin only, session open) */}
            {isAdmin && sessionOpen && (
              <div className="bg-white rounded-[32px] border border-[#DDD5C4] p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <UserCheck size={18} className="text-blue-500" />
                  <h3 className="font-black text-sm text-[#1A1208]">Saisie Physique</h3>
                </div>
                <p className="text-[11px] text-[#7A6E5F] mb-4">Pour les membres présents sans téléphone.</p>

                <div className="space-y-3">
                  <select
                    value={selectedMember || ''}
                    onChange={e => setSelectedMember(parseInt(e.target.value))}
                    className="w-full h-11 px-4 bg-[#F7F4EF] rounded-xl border-none font-bold text-sm outline-none"
                  >
                    <option value="">Sélectionner un membre</option>
                    {pendingMembers.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    max={session?.total_positions}
                    value={physicalPosition}
                    onChange={e => setPhysicalPosition(e.target.value)}
                    placeholder={`Position (1–${session?.total_positions})`}
                    className="w-full h-11 px-4 bg-[#F7F4EF] rounded-xl border-none font-bold text-sm outline-none"
                  />

                  <button
                    onClick={handlePhysicalDraw}
                    disabled={physicalLoading || !selectedMember || !physicalPosition}
                    className="w-full h-11 bg-blue-600 text-white font-black rounded-full hover:bg-blue-700 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                  >
                    {physicalLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Hash size={16} />}
                    Enregistrer
                  </button>
                </div>
              </div>
            )}

            {/* Members List */}
            <div className="bg-white rounded-[32px] border border-[#DDD5C4] overflow-hidden shadow-sm">
              <div className="p-5 border-b border-[#F7F4EF] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-[#C8862A]" />
                  <h3 className="font-black text-sm text-[#1A1208]">Membres</h3>
                </div>
                <span className="text-[10px] font-black text-[#7A6E5F]">
                  {drawnMembers.length}/{members.length}
                </span>
              </div>
              <div className="divide-y divide-[#F7F4EF] max-h-80 overflow-y-auto">
                {members.map(m => (
                  <div key={m.id} className="flex items-center gap-3 px-5 py-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                      m.has_drawn ? 'bg-emerald-100 text-emerald-600' : 'bg-[#F7F4EF] text-[#A19584]'
                    }`}>
                      {m.has_drawn ? <CheckCircle size={14} /> : <Clock size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-[#1A1208] text-sm truncate">{m.name}</p>
                      {m.has_drawn && m.draw_info && (
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${METHOD_LABELS[m.draw_info.method]?.color}`}>
                          #{m.draw_info.position} · {METHOD_LABELS[m.draw_info.method]?.label}
                        </span>
                      )}
                    </div>
                    {m.member_status === 'absent' && (
                      <span className="text-[9px] bg-amber-100 text-amber-700 font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                        <UserX size={10} /> absent
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Pending warning */}
            {sessionOpen && pendingMembers.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-[24px] p-4 flex gap-3">
                <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-black text-amber-800 mb-1">{pendingMembers.length} membre(s) en attente</p>
                  <p className="text-[11px] text-amber-600">
                    {isAdmin
                      ? "Verrouillez pour lancer le tirage automatique."
                      : "En attente de vos collègues absents."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TontineDrawPage;
