
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  Bot, 
  ShieldAlert, 
  Heart,
  Activity,
  Sparkles,
  BrainCircuit,
  Compass,
  Briefcase,
  ChevronRight
} from 'lucide-react';
import { EmotionTestResult, DetailedAnalysis } from '../../types';
import { InteractiveEmotionChart } from './InteractiveEmotionChart';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';

interface EmotionResultDashboardProps {
  result: EmotionTestResult;
  onClose: () => void;
}

export const EmotionResultDashboard: React.FC<EmotionResultDashboardProps> = ({ result, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'career' | 'personality'>('overview');
  const [analysisData, setAnalysisData] = useState<DetailedAnalysis | null>(null);

  // Safe defaults
  const score = result?.score || 0;

  useEffect(() => {
    if (result?.ai_analysis) {
      try {
        // Try to parse the AI analysis string into structured JSON
        const parsed = JSON.parse(result.ai_analysis);
        setAnalysisData(parsed);
      } catch (e) {
        // If parsing fails (old data or simple text), fallback gracefully
        console.warn("Analysis is not JSON", e);
      }
    }
  }, [result]);

  const getLevelStyles = () => {
    if (score <= 40) return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', icon: ShieldAlert, shadow: 'shadow-red-500/10', label: 'Perlu Perhatian' };
    if (score <= 70) return { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', icon: Activity, shadow: 'shadow-amber-500/10', label: 'Cukup Stabil' };
    return { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: Heart, shadow: 'shadow-emerald-500/10', label: 'Prima' };
  };

  const styles = getLevelStyles();

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 overflow-y-auto pb-32 max-w-lg mx-auto no-scrollbar font-sans">
       {/* HEADER: STATUS UTAMA */}
       <motion.div 
         initial={{ y: 20, opacity: 0 }} 
         animate={{ y: 0, opacity: 1 }} 
         className="bg-white rounded-[3rem] p-8 shadow-[0_15px_50px_rgba(0,0,0,0.04)] border border-gray-100 text-center mb-6 mt-4 relative overflow-hidden"
       >
          <div className={`absolute top-0 left-0 w-full h-1.5 ${score <= 40 ? 'bg-red-500' : score <= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
          
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4 mt-2">Kondisi Batin</h2>
          <div className="text-7xl font-black text-gray-900 mb-6 flex justify-center items-end tracking-tighter">
             {score}
             <span className="text-xl text-gray-300 mb-2 font-black ml-1">/100</span>
          </div>
          
          <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${styles.bg} ${styles.color} ${styles.border} ${styles.shadow}`}>
             <styles.icon size={14} />
             {styles.label}
          </div>
       </motion.div>

       {/* AI HOLISTIC INSIGHT (SUMMARY) */}
       <motion.div 
         initial={{ y: 20, opacity: 0 }} 
         animate={{ y: 0, opacity: 1 }} 
         transition={{ delay: 0.2 }}
         className="bg-slate-900 rounded-[2.5rem] p-8 shadow-xl shadow-slate-900/10 mb-8 relative overflow-hidden"
       >
          <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl -mr-10 -mt-10" />
          
          <div className="flex items-center gap-3 mb-4 relative z-10">
             <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10">
                <Sparkles size={20} className="text-amber-300" />
             </div>
             <div>
                <h3 className="font-black text-white text-sm">Analisis SohibAI</h3>
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                   {analysisData ? `${analysisData.mbti.type} • ${analysisData.riasec.code}` : "Memuat Analisis..."}
                </p>
             </div>
          </div>
          
          <div className="relative z-10">
             <p className="text-slate-200 text-[14px] leading-relaxed font-medium italic">
                "{analysisData?.summary || (result.ai_analysis.startsWith('{') ? "Sedang memproses data..." : result.ai_analysis)}"
             </p>
          </div>
       </motion.div>

       {/* TABS NAVIGATION */}
       <div className="flex bg-white p-1.5 rounded-[1.5rem] mb-6 shadow-sm border border-slate-100">
          <button onClick={() => setActiveTab('overview')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'overview' ? 'bg-primary-50 text-primary-600' : 'text-slate-400'}`}>Emosi</button>
          <button onClick={() => setActiveTab('personality')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'personality' ? 'bg-purple-50 text-purple-600' : 'text-slate-400'}`}>Pribadi</button>
          <button onClick={() => setActiveTab('career')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'career' ? 'bg-amber-50 text-amber-600' : 'text-slate-400'}`}>Minat</button>
       </div>

       {/* TAB CONTENT */}
       <div className="min-h-[300px]">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
               <motion.div key="overview" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                  <InteractiveEmotionChart result={result} />
                  
                  {/* Action Button Based on EQ */}
                  <div className="mt-8 pt-6 border-t border-slate-200 border-dashed">
                     {score <= 40 ? (
                        <Button onClick={() => navigate('/mobile/chat', { state: { requestReferral: true } })} className="w-full !rounded-[2rem] bg-red-600 hover:bg-red-700 shadow-red-500/30">
                           Konsultasi Darurat
                        </Button>
                     ) : (
                        <Button onClick={() => setActiveTab('career')} variant="outline" className="w-full !rounded-[2rem]">
                           Lihat Potensi Karir <ChevronRight size={16} className="ml-2"/>
                        </Button>
                     )}
                  </div>
               </motion.div>
            )}

            {activeTab === 'personality' && analysisData && (
               <motion.div key="personality" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-center mb-6">
                     <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-black">
                        {analysisData.mbti.type[0]}
                     </div>
                     <h3 className="text-3xl font-black text-slate-900 mb-1">{analysisData.mbti.type}</h3>
                     <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-6">{analysisData.mbti.title}</p>
                     
                     <div className="bg-slate-50 p-6 rounded-2xl text-left mb-6">
                        <p className="text-sm font-medium text-slate-700 italic">"{analysisData.mbti.description}"</p>
                     </div>

                     <div className="grid grid-cols-1 gap-3 text-left">
                        {analysisData.strengths.slice(0, 3).map((strength, idx) => (
                           <div key={idx} className="bg-emerald-50 px-4 py-3 rounded-xl flex items-center gap-2">
                              <CheckCircle size={14} className="text-emerald-500" />
                              <span className="text-xs font-bold text-emerald-800">{strength}</span>
                           </div>
                        ))}
                     </div>
                  </div>
                  <div className="bg-purple-50 p-6 rounded-[2rem] border border-purple-100 flex gap-4 items-start">
                     <BrainCircuit size={20} className="text-purple-600 shrink-0 mt-1" />
                     <div>
                        <h4 className="font-black text-purple-800 text-sm">Pengembangan Diri</h4>
                        <p className="text-xs text-purple-700 mt-1 leading-relaxed">
                           Saran untuk tipe {analysisData.mbti.type}: Manfaatkan kekuatan alamimu dalam memahami orang lain, tapi jangan lupa tetapkan batasan sehat (Regulasi Diri).
                        </p>
                     </div>
                  </div>
               </motion.div>
            )}

            {activeTab === 'career' && analysisData && (
               <motion.div key="career" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm mb-6">
                     <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><Compass size={20}/></div>
                        <div>
                           <h3 className="font-black text-slate-900 text-lg">Minat (RIASEC)</h3>
                           <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{analysisData.riasec.code} Code</p>
                        </div>
                     </div>
                     
                     <div className="space-y-4">
                        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                           <div>
                              <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Dominan</span>
                              <span className="font-black text-slate-800 text-lg">{analysisData.riasec.primary}</span>
                           </div>
                           <div className="h-10 w-1 bg-amber-500 rounded-full"></div>
                        </div>
                        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                           <div>
                              <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Sekunder</span>
                              <span className="font-black text-slate-800 text-lg">{analysisData.riasec.secondary}</span>
                           </div>
                           <div className="h-10 w-1 bg-blue-500 rounded-full"></div>
                        </div>
                        <p className="text-xs text-slate-500 italic mt-2 leading-relaxed">
                           "{analysisData.riasec.description}"
                        </p>
                     </div>
                  </div>

                  <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 flex gap-4 items-start">
                     <Briefcase size={20} className="text-amber-600 shrink-0 mt-1" />
                     <div>
                        <h4 className="font-black text-amber-800 text-sm">Rekomendasi Karir</h4>
                        <ul className="text-xs text-amber-700 mt-2 list-disc list-inside leading-relaxed font-bold space-y-1">
                           {analysisData.careers.map((career, idx) => (
                              <li key={idx}>{career}</li>
                           ))}
                        </ul>
                     </div>
                  </div>
               </motion.div>
            )}
            
            {/* Fallback for Loading or Error state if AnalysisData is missing but component mounted */}
            {activeTab !== 'overview' && !analysisData && (
                <div className="py-20 text-center">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Data analisis detail tidak tersedia.</p>
                </div>
            )}
          </AnimatePresence>
       </div>

       <button 
         onClick={onClose} 
         className="w-full py-4 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] hover:text-gray-900 transition-colors mt-8"
       >
         Tutup Laporan
       </button>
    </div>
  );
};
