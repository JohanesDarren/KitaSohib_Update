
import React, { useState, useEffect } from 'react';
import { UserProfile, Referral, EmotionTestResult, MoodInsight } from '../../../types';
import { api, AnalyticsService } from '../../../services/mockSupabase';
import { Button } from '../../../components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { MessageCircle, HeartPulse, ChevronRight, Stethoscope, Search, ShieldCheck, Clock, AlertTriangle, X, ShieldQuestion, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface UserManagementProps {
  users: UserProfile[];
  onChat: (userId: string) => void;
}

interface UserWithAnalytics extends UserProfile {
  insight: MoodInsight;
  latestTestScore: number;
}

export const UserManagement: React.FC<UserManagementProps> = ({ users, onChat }) => {
  const { user: currentKader } = useAuth();
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [search, setSearch] = useState('');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [usersWithData, setUsersWithData] = useState<UserWithAnalytics[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userToRefer, setUserToRefer] = useState<UserProfile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, [users]);

  const loadData = async () => {
    // 1. Fetch Referrals & Tests
    const [refs, tests, allLogs] = await Promise.all([
      api.fetchPsychologistReferrals('p_sri'),
      api.getEmotionResults(),
      api.getAllMoodLogs()
    ]);
    setReferrals(refs);

    // 2. Process Analytics for Each User
    const processedUsers = users.map(u => {
      const userLogs = allLogs.filter(l => l.user_id === u.id);
      const insight = AnalyticsService.calculateInsight(userLogs);
      
      const userTests = tests
        .filter(t => t.user_id === u.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      return {
        ...u,
        insight,
        latestTestScore: userTests.length > 0 ? userTests[0].score : 0
      };
    });

    setUsersWithData(processedUsers);
  };

  const getReferralData = (userId: string) => {
    return referrals.find(r => r.user_id === userId);
  };

  const handleOpenReferralModal = (u: UserProfile) => {
    setUserToRefer(u);
    setShowConfirmModal(true);
  };

  const processReferral = async () => {
    if (!userToRefer || !currentKader) return;
    
    setIsProcessing(true);
    // Find cached analytics
    const userData = usersWithData.find(u => u.id === userToRefer.id);
    const score = userData?.latestTestScore || 0;
    
    try {
      await api.submitReferralToPsychologist(
        userToRefer.id, 
        score, 
        `Siswa terdeteksi risiko tinggi. Skor Batin: ${score}/100. Trend Mood: ${userData?.insight.trend}.`,
        currentKader.id
      );
      
      toast.success(`Rujukan untuk ${userToRefer.full_name} berhasil dikirim secara otomatis ke Psikolog.`, {
        icon: '🚀',
        duration: 5000
      });
      
      setShowConfirmModal(false);
      setUserToRefer(null);
      loadData(); 
    } catch (e) {
      toast.error("Gagal mengirim rujukan otomatis.");
    } finally {
      setIsProcessing(false);
    }
  };

  const filtered = usersWithData.filter(u => u.full_name.toLowerCase().includes(search.toLowerCase()));

  const getTrendIcon = (trend: string) => {
    if (trend === 'Meningkat') return <TrendingUp size={14} className="text-emerald-500" />;
    if (trend === 'Menurun') return <TrendingDown size={14} className="text-red-500" />;
    return <Minus size={14} className="text-blue-500" />;
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-10 pb-24 md:pb-10 relative bg-gray-50 no-scrollbar">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
           <h2 className="text-3xl font-black text-gray-900 tracking-tight">Manajemen Krisis</h2>
           <p className="text-gray-500 font-medium mt-1">Pantau remaja dan lakukan eskalasi rujukan klinis jika diperlukan.</p>
        </div>
        <div className="relative group flex-1 max-w-md">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={18} />
           <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama remaja..." 
              className="w-full bg-white border border-gray-100 pl-12 pr-6 py-4 rounded-2xl text-sm font-bold shadow-sm focus:ring-4 focus:ring-primary-50 outline-none transition-all"
           />
        </div>
      </div>
      
      <div className="hidden md:block bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-gray-400 uppercase tracking-widest text-[10px] border-b border-gray-100 font-black">
              <tr>
                <th className="px-8 py-5">Nama Lengkap</th>
                <th className="px-8 py-5">Tren Mood (7 Hari)</th>
                <th className="px-8 py-5">Skor Batin</th>
                <th className="px-8 py-5">Status Rujukan</th>
                <th className="px-8 py-5 text-center">Tindakan Eskalasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((u) => {
                const refData = getReferralData(u.id);
                const isHighRisk = u.latestTestScore >= 71 || u.insight.riskFlag;

                return (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5 font-black text-gray-900 flex items-center gap-4">
                      <img src={u.avatar_url} className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200" />
                      {u.full_name}
                    </td>
                    <td className="px-8 py-5">
                       <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-slate-50 rounded-lg">{getTrendIcon(u.insight.trend)}</div>
                          <div>
                             <p className="font-bold text-xs text-slate-700">{u.insight.trend}</p>
                             <p className="text-[9px] text-slate-400 font-medium">Avg: {u.insight.averageScore}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-wider ${
                        isHighRisk ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      }`}>
                        {u.latestTestScore ? `Skor: ${u.latestTestScore}/100` : 'Belum Tes'}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                       {refData?.status === 'pending' && (
                         <span className="flex items-center gap-1.5 text-blue-600 font-black text-[10px] uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
                           <Clock size={12}/> Antrean Verifikasi
                         </span>
                       )}
                       {refData?.status === 'active' && (
                         <span className="flex items-center gap-1.5 text-indigo-600 font-black text-[10px] uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
                           <ShieldCheck size={12}/> Sedang Ditangani
                         </span>
                       )}
                       {!refData && (
                         <span className="text-slate-300 font-black text-[10px] uppercase tracking-widest">Siap untuk Rujukan</span>
                       )}
                    </td>
                    <td className="px-8 py-5">
                       <div className="flex gap-2 justify-center">
                          <button onClick={() => onChat(u.id)} className="p-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm" title="Chat Remaja"><MessageCircle size={18}/></button>
                          
                          {refData?.status === 'active' && (
                            <button 
                              onClick={() => navigate(`/dashboard/coordination-chat/${refData.id}`)}
                              className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                              title="Chat Koordinasi Psikolog"
                            >
                               <ShieldQuestion size={18}/>
                            </button>
                          )}

                          {isHighRisk && !refData && (
                            <button 
                              onClick={() => handleOpenReferralModal(u)}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-red-600 text-white hover:bg-red-700 transition-all shadow-lg shadow-red-500/20"
                            >
                               <Stethoscope size={14}/> Ajukan Rujukan
                            </button>
                          )}

                          {refData && refData.status !== 'active' && (
                             <div className="px-4 py-2 bg-gray-100 text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-default">
                                Terdaftar
                             </div>
                          )}
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {filtered.map((u) => {
           const refData = getReferralData(u.id);
           const isHighRisk = u.latestTestScore >= 71 || u.insight.riskFlag;

           return (
            <div key={u.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 mb-4">
                    <img src={u.avatar_url} className="w-14 h-14 rounded-2xl bg-gray-100 object-cover" />
                    <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                           <h4 className="font-black text-gray-900">{u.full_name}</h4>
                           {getTrendIcon(u.insight.trend)}
                        </div>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${isHighRisk ? 'text-red-500' : 'text-emerald-500'}`}>
                           {u.latestTestScore ? `Skor: ${u.latestTestScore}/100` : 'Belum Tes'}
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => onChat(u.id)} className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest">Remaja</button>
                    {refData?.status === 'active' ? (
                       <button 
                         onClick={() => navigate(`/dashboard/coordination-chat/${refData.id}`)}
                         className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest"
                       >
                         Psikolog
                       </button>
                    ) : (
                      isHighRisk && !refData && (
                        <button 
                          onClick={() => handleOpenReferralModal(u)}
                          className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-red-600 text-white text-[10px] font-black uppercase tracking-widest"
                        >
                          Rujuk
                        </button>
                      )
                    )}
                </div>
            </div>
           );
        })}
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }} 
               animate={{ opacity: 1, scale: 1 }} 
               exit={{ opacity: 0, scale: 0.95 }}
               className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl relative"
            >
               <button onClick={() => setShowConfirmModal(false)} className="absolute top-6 right-6 p-3 bg-slate-50 rounded-2xl text-slate-400 hover:bg-slate-100 transition-all">
                  <X size={20} />
               </button>

               <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mb-6 shadow-sm border border-red-100">
                     <AlertTriangle size={32} />
                  </div>
                  
                  <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Konfirmasi Rujukan Otomatis</h3>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">
                     Anda akan merujuk <span className="text-slate-900 font-black">{userToRefer?.full_name}</span> secara instan ke tim Psikolog. Data yang dikirim berupa <span className="text-blue-600 font-bold">Skor Batin & Analisis Tren Mood</span>.
                  </p>

                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 mb-8 w-full text-left">
                     <div className="flex items-center gap-2 mb-2">
                        <HeartPulse size={16} className="text-red-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paket Data Medis</span>
                     </div>
                     <p className="text-sm font-bold text-slate-800">Indikator: Kasus Risiko Tinggi</p>
                     <p className="text-[10px] text-slate-400 mt-1">Status: Antrean Prioritas Psikolog</p>
                  </div>

                  <div className="flex gap-4 w-full">
                     <button 
                        onClick={() => setShowConfirmModal(false)}
                        className="flex-1 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-all"
                     >
                        Batal
                     </button>
                     <button 
                        onClick={processReferral}
                        disabled={isProcessing}
                        className="flex-1 py-4 bg-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-red-500/20 active:scale-95 transition-all disabled:opacity-50"
                     >
                        {isProcessing ? 'Mengirim...' : 'Kirim Rujukan'}
                     </button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
