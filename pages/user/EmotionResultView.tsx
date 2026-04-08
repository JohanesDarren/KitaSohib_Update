
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  Bot, 
  ShieldAlert, 
  ArrowRight, 
  Users, 
  Stethoscope, 
  AlertCircle,
  MessageCircle,
  Sparkles,
  Activity,
  Rocket
} from 'lucide-react';
import { EmotionTestResult } from '../../types';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/mockSupabase';
import toast from 'react-hot-toast';

interface EmotionResultViewProps {
  result: EmotionTestResult;
  onClose: () => void;
}

export const EmotionResultView: React.FC<EmotionResultViewProps> = ({ result, onClose }) => {
  const navigate = useNavigate();
  const [isRequesting, setIsRequesting] = useState(false);
  const [isRequested, setIsRequested] = useState(false);

  // LOGIC 1: SKOR RENDAH (KONDISI BERAT/BAHAYA) -> REFERAL PSIKOLOG
  const handleRequestPsychologist = async () => {
    setIsRequesting(true);
    try {
      // Prioritas tinggi, langsung ke dashboard psikolog
      await api.createReferralRequest(result.user_id, result.score, "ALERT: Skor Emosi Tinggi (>70). Membutuhkan intervensi profesional segera.");
      setIsRequested(true);
      toast.success("Permintaan terkirim ke Psikolog. Mohon tunggu, bantuan akan datang.", { duration: 5000 });
    } catch (e) {
      toast.error("Gagal mengirim permintaan.");
    } finally {
      setIsRequesting(false);
    }
  };

  // LOGIC 2: SKOR SEDANG -> ARAHKAN KE KADER
  const handleContactKader = () => {
    // Arahkan ke chat list dengan filter Kader
    navigate('/mobile/chat', { state: { filter: 'kader' } });
    toast("Pilih salah satu Kakak Kader untuk curhat ya!", { icon: '👋' });
  };

  // LOGIC 3: SKOR TINGGI (STABIL) -> AI SELF DEVELOPMENT
  const handleSelfDevelopment = () => {
    navigate('/mobile/chat', { 
      state: { 
        targetUserId: 's_ai', 
        context: 'self_development',
        initialMessage: "Halo SohibAI! Kondisi emosiku stabil nih. Bantu aku gali potensi diri dong!" 
      } 
    });
  };

  const getLevelColor = () => {
    if (result.level === 'Berat') return 'text-red-600 bg-red-50 border-red-100';
    if (result.level === 'Sedang') return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-emerald-600 bg-emerald-50 border-emerald-100';
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 overflow-y-auto pb-32 max-w-lg mx-auto no-scrollbar">
       
       {/* HASIL UTAMA */}
       <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100 text-center mb-8 mt-4 relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-full h-2 ${result.level === 'Berat' ? 'bg-red-500' : result.level === 'Sedang' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
          
          <div className={`w-20 h-20 mx-auto rounded-[2rem] flex items-center justify-center mb-6 ${result.level === 'Berat' ? 'bg-red-50 text-red-500' : result.level === 'Sedang' ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'}`}>
             {result.level === 'Berat' ? <ShieldAlert size={40} /> : result.level === 'Sedang' ? <Activity size={40} /> : <CheckCircle size={40} />}
          </div>
          
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Skor Batin Kamu</h2>
          <div className="text-7xl font-black text-slate-900 mb-6 flex justify-center items-end">
             {result.score}
             <span className="text-xl text-slate-300 mb-2 font-black">/100</span>
          </div>
          
          <div className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${getLevelColor()}`}>
             Status: {result.level}
          </div>
       </motion.div>

       {/* ANALISIS AI */}
       <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 mb-8 relative">
          <div className="flex items-center gap-4 mb-6">
             <div className="p-3 bg-primary-500 text-white rounded-2xl shadow-lg shadow-primary-500/20"><Bot size={24}/></div>
             <h3 className="font-black text-slate-900 text-lg">Kata SohibAI</h3>
          </div>
          <div className="prose prose-sm text-slate-600 leading-relaxed font-medium">
             <div dangerouslySetInnerHTML={{ __html: result.ai_analysis.replace(/\n/g, '<br/>') }} />
          </div>
       </motion.div>

       {/* ACTION ZONES (IF-THIS-THEN-THAT LOGIC) */}
       <div className="space-y-4">
          
          {/* SKENARIO 1: STABIL (Score 0-40) */}
          {result.level === 'Ringan' && (
             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 mb-4">
                   <h4 className="font-black text-emerald-800 text-sm mb-1 flex items-center gap-2"><Sparkles size={16}/> Kondisi Prima!</h4>
                   <p className="text-xs text-emerald-700 font-medium">Pikiranmu lagi jernih banget. Ini saat terbaik buat merancang masa depan.</p>
                </div>
                <Button onClick={handleSelfDevelopment} className="w-full !rounded-[2rem] !py-5 shadow-xl shadow-emerald-500/20 font-black bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-3">
                   <Rocket size={18} /> Mulai Pengembangan Diri
                </Button>
                <p className="text-[9px] text-center text-slate-400 mt-4 font-bold uppercase tracking-widest">Ngobrol bareng SohibAI Coach</p>
             </motion.div>
          )}

          {/* SKENARIO 2: SEDANG (Score 41-70) */}
          {result.level === 'Sedang' && (
             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="space-y-4">
                <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 mb-2">
                   <h4 className="font-black text-amber-800 text-sm mb-1 flex items-center gap-2"><Users size={16}/> Butuh Teman Cerita</h4>
                   <p className="text-xs text-amber-700 font-medium">Ada hal yang mengganjal. Jangan dipendam sendiri, Kader kami siap mendengarkan tanpa menghakimi.</p>
                </div>
                <Button onClick={handleContactKader} className="w-full !rounded-[2rem] !py-5 shadow-xl shadow-amber-500/20 font-black bg-amber-500 hover:bg-amber-600 flex items-center justify-center gap-3">
                   <MessageCircle size={18} /> Curhat ke Kakak Kader
                </Button>
                <button onClick={() => navigate('/mobile/home')} className="w-full py-4 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Istirahat Dulu</button>
             </motion.div>
          )}

          {/* SKENARIO 3: BERAT (Score 71-100) */}
          {result.level === 'Berat' && (
             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="space-y-4">
                <div className="p-6 bg-red-50 border border-red-100 rounded-[2rem] mb-2 flex items-start gap-4">
                   <AlertCircle className="text-red-600 shrink-0 mt-1" size={24} />
                   <div>
                      <h4 className="font-black text-red-800 text-sm uppercase tracking-tight">Perlu Bantuan Ahli</h4>
                      <p className="text-xs text-red-700 mt-1 leading-relaxed font-medium">
                        Beban ini terlalu berat untuk dipikul sendiri. Kami sangat menyarankan bantuan profesional. Ini aman dan rahasia.
                      </p>
                   </div>
                </div>
                
                {isRequested ? (
                  <div className="w-full bg-slate-100 text-slate-500 py-5 rounded-[2rem] text-center font-black text-xs uppercase tracking-widest border border-slate-200 flex items-center justify-center gap-3">
                     <CheckCircle size={20} /> Bantuan Sedang Diproses
                  </div>
                ) : (
                  <Button 
                    onClick={handleRequestPsychologist} 
                    isLoading={isRequesting}
                    className="w-full !rounded-[2rem] !py-5 shadow-2xl shadow-red-500/20 font-black bg-red-600 hover:bg-red-700 flex items-center justify-center gap-3 text-white"
                  >
                    <Stethoscope size={18} /> Hubungkan ke Psikolog
                  </Button>
                )}
                
                <p className="text-[9px] text-center text-red-400 font-bold uppercase tracking-widest px-4">
                   Jangan ragu. Kesehatan mentalmu adalah prioritas utama kami.
                </p>
             </motion.div>
          )}

          <button onClick={onClose} className="w-full py-4 text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] hover:text-slate-500 transition-colors mt-4">Tutup Halaman Ini</button>
       </div>
    </div>
  );
};
