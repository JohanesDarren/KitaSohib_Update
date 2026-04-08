
import React, { useState, useEffect } from 'react';
import { Referral, ChatMessage } from '../../../types';
import { api } from '../../../services/mockSupabase';
import { motion } from 'framer-motion';
import { ShieldCheck, MessageCircle, ChevronRight, Stethoscope, Clock, Users, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const KaderCoordinationList: React.FC<{ kaderId: string }> = ({ kaderId }) => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastMessages, setLastMessages] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [kaderId]);

  const loadData = async () => {
    try {
      const data = await api.getKaderActiveReferrals(kaderId);
      setReferrals(data);
      
      // Load last coordination message for each referral
      const lastMsgs: Record<string, string> = {};
      for (const ref of data) {
        const msgs = await api.getMessages(kaderId, ref.psychologist_id, ref.id);
        if (msgs.length > 0) {
          lastMsgs[ref.id] = msgs[msgs.length - 1].message;
        }
      }
      setLastMessages(lastMsgs);
    } catch (e) {
      console.error("Gagal memuat rujukan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-10 pb-24 md:pb-10 bg-gray-50 no-scrollbar">
      <div className="mb-10">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          Koordinasi Psikolog
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
        </h2>
        <p className="text-gray-500 mt-1 font-medium text-lg italic">Sinkronisasi instruksi klinis profesional untuk rujukan aktif.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {referrals.length > 0 ? referrals.map(ref => (
          <motion.div 
            key={ref.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between group hover:shadow-xl transition-all relative overflow-hidden"
          >
            {/* Indikator Pesan Baru (Simulasi) */}
            <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500" />

            <div className="flex items-center gap-6 flex-1 min-w-0 relative z-10">
               <div className="relative">
                  <img src={ref.user_avatar} className="w-16 h-16 rounded-2xl object-cover border border-gray-50 shadow-sm" />
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-white shadow-lg animate-bounce">
                     !
                  </div>
               </div>
               
               <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                     <h4 className="font-black text-gray-900 text-lg">{ref.user_name}</h4>
                     <span className="bg-red-50 text-red-600 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border border-red-100">
                        Skor: {ref.mood_score}/100
                     </span>
                  </div>
                  
                  <p className="text-gray-400 text-xs font-bold flex items-center gap-2 mb-3">
                     <Stethoscope size={14} className="text-primary-500" /> dr. Sri, M.Psi (Tenaga Klinis Penanggung Jawab)
                  </p>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 group-hover:bg-emerald-50/50 transition-colors">
                     <div className="flex items-center gap-2 mb-1">
                        <MessageCircle size={12} className="text-emerald-600" />
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Pesan Terakhir Psikolog:</p>
                     </div>
                     <p className="text-xs text-slate-600 font-medium truncate italic">
                        {lastMessages[ref.id] || "Menunggu koordinasi awal dari Psikolog..."}
                     </p>
                  </div>
               </div>
            </div>

            <div className="mt-6 md:mt-0 flex gap-3 w-full md:w-auto relative z-10">
               <button 
                  onClick={() => navigate(`/dashboard/coordination-chat/${ref.id}`)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all active:scale-95"
               >
                  <ShieldCheck size={18} /> Balas Koordinasi
               </button>
               <button className="p-4 bg-gray-50 text-gray-300 rounded-2xl group-hover:text-emerald-500 group-hover:bg-white transition-all shadow-sm border border-transparent group-hover:border-emerald-100">
                  <ChevronRight size={20} />
               </button>
            </div>
          </motion.div>
        )) : (
          <div className="py-24 text-center bg-white rounded-[3rem] border border-dashed border-gray-200">
             <div className="w-20 h-20 bg-gray-50 text-gray-200 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={40} />
             </div>
             <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-xs">Belum ada rujukan aktif untuk koordinasi profesional</p>
             <p className="text-gray-300 text-[10px] mt-2 font-bold max-w-xs mx-auto uppercase">Halaman ini hanya akan terisi jika ada remaja yang telah disetujui rujukannya oleh Psikolog.</p>
          </div>
        )}
      </div>
    </div>
  );
};
