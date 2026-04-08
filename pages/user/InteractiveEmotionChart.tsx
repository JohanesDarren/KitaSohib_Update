
import React, { useState, startTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Info, 
  Sparkles, 
  Brain, 
  Target, 
  Heart, 
  ArrowRight, 
  MessageCircle, 
  Users, 
  AlertCircle,
  ChevronDown,
  Smile
} from 'lucide-react';
import { EmotionTestResult } from '../../types';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

interface InteractiveEmotionChartProps {
  result: EmotionTestResult;
}

const CATEGORY_DETAILS: Record<string, { label: string; desc: string; icon: any; color: string; tint: string; bar: string }> = {
  'Kesadaran': {
    label: 'Kesadaran Diri',
    desc: 'Kemampuanmu mengenali emosi sendiri. Makin tinggi skornya, makin jago kamu namain perasaanmu (bukan cuma "bad mood" doang!).',
    icon: Brain,
    color: 'text-blue-600',
    tint: 'bg-blue-50',
    bar: 'bg-blue-500'
  },
  'Regulasi': {
    label: 'Regulasi Diri',
    desc: 'Skill kamu buat "ngerem" saat marah dan bangkit saat sedih. Ini kunci biar nggak gampang meledak.',
    icon: Target,
    color: 'text-purple-600',
    tint: 'bg-purple-50',
    bar: 'bg-purple-500'
  },
  'Empati': {
    label: 'Kesadaran Sosial',
    desc: 'Radar kamu buat baca perasaan orang lain. Kalau skor ini tinggi, kamu pasti pendengar curhat yang baik.',
    icon: Heart,
    color: 'text-pink-600',
    tint: 'bg-pink-50',
    bar: 'bg-pink-500'
  },
  'Sosial': {
    label: 'Skill Relasi',
    desc: 'Cara kamu gaul, kerjasama, dan selesaikan konflik. Modal penting buat jadi leader atau teman asik!',
    icon: Users,
    color: 'text-emerald-600',
    tint: 'bg-emerald-50',
    bar: 'bg-emerald-500'
  }
};

export const InteractiveEmotionChart: React.FC<InteractiveEmotionChartProps> = ({ result }) => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  if (!result || !Array.isArray(result.dimension_scores)) return null;

  return (
    <div className="space-y-8">
      {/* DIMENSION BARS */}
      <div className="grid grid-cols-1 gap-4">
        {result.dimension_scores.map((dim) => {
          const detail = CATEGORY_DETAILS[dim.subject] || { 
             label: dim.subject, 
             desc: 'Aspek penting dari kecerdasan emosimu.', 
             icon: Sparkles, 
             color: 'text-gray-600', 
             tint: 'bg-gray-50', 
             bar: 'bg-gray-500' 
          };
          const isSelected = selectedCategory === dim.subject;
          
          return (
            <motion.div 
              key={dim.subject}
              onClick={() => startTransition(() => setSelectedCategory(isSelected ? null : dim.subject))}
              className={`p-5 rounded-[2rem] border transition-all cursor-pointer relative overflow-hidden group ${
                isSelected ? 'bg-white border-primary-200 shadow-xl shadow-primary-500/5 ring-4 ring-primary-50' : 'bg-gray-50 border-gray-100 hover:bg-white hover:border-gray-200'
              }`}
              layout
            >
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl transition-colors ${isSelected ? detail.tint : 'bg-white'} ${detail.color} shadow-sm`}>
                    <detail.icon size={18} />
                  </div>
                  <span className={`font-black text-xs uppercase tracking-wider transition-colors ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}>{detail.label}</span>
                </div>
                <div className="flex items-center gap-2">
                   <span className={`text-sm font-black ${detail.color}`}>{dim.value.toFixed(1)}</span>
                   <span className="text-[10px] text-gray-300 font-bold">/10</span>
                   <ChevronDown size={14} className={`text-gray-300 transition-transform duration-300 ${isSelected ? 'rotate-180' : ''}`} />
                </div>
              </div>
              
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden relative z-10 border border-gray-200/50">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(dim.value / 10) * 100}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full ${detail.bar} rounded-full`}
                />
              </div>

              <AnimatePresence>
                {isSelected && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 mt-4 border-t border-dashed border-gray-200">
                        <p className="text-xs text-gray-600 leading-relaxed font-medium">
                        {detail.desc}
                        </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      <div className="flex justify-center">
        <div className="px-4 py-2 bg-gray-50 text-gray-400 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
          <Info size={12} /> Ketuk kartu untuk penjelasan
        </div>
      </div>

      {/* TRIAGE SYSTEM (Updated Logic for EQ Growth) */}
      <div className="pt-6 border-t border-gray-100">
        {result.score >= 80 ? (
          <div className="space-y-4">
            <Button 
              onClick={() => navigate('/mobile/forum')} 
              className="w-full !rounded-[2.2rem] !py-5 bg-emerald-500 shadow-2xl shadow-emerald-500/20 font-black flex items-center justify-center gap-3 transition-transform active:scale-95 text-white"
            >
              <Users size={22} /> Bagikan Tips di Forum
            </Button>
            <p className="text-[10px] text-center text-emerald-600 font-black uppercase tracking-[0.2em]">EQ Kamu Matang! Jadilah inspirasi.</p>
          </div>
        ) : result.score >= 50 ? (
          <div className="space-y-4">
            <Button 
              onClick={() => navigate('/mobile/chat', { state: { targetUserId: 's_ai', initialMessage: 'Hai SohibAI, bantu aku latih regulasi emosi dong!' } })} 
              className="w-full !rounded-[2.2rem] !py-5 bg-primary-500 shadow-2xl shadow-primary-500/20 font-black flex items-center justify-center gap-3 transition-transform active:scale-95 text-white"
            >
              <Smile size={22} /> Latihan bareng SohibAI
            </Button>
            <p className="text-[10px] text-center text-primary-500 font-black uppercase tracking-[0.2em]">Potensimu besar, yuk diasah lagi!</p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="bg-amber-50 p-6 rounded-[2.5rem] border border-amber-100 flex items-start gap-4 text-left shadow-sm">
               <AlertCircle className="text-amber-600 shrink-0 mt-1" size={26} />
               <div>
                  <h4 className="font-black text-amber-800 text-sm uppercase tracking-tight">Perlu Penguatan</h4>
                  <p className="text-xs text-amber-700 leading-relaxed font-medium mt-1">Skor ini bukan akhir, tapi awal untuk belajar. Jangan ragu minta dukungan teman atau Kader.</p>
               </div>
            </div>
            
            <Button 
              onClick={() => navigate('/mobile/chat', { state: { requestReferral: false, filter: 'kader' } })}
              className="w-full !rounded-[2.2rem] !py-6 bg-amber-500 shadow-2xl shadow-amber-500/20 font-black flex items-center justify-center gap-3 transition-transform active:scale-95 text-white"
            >
              <Users size={22} /> Ngobrol sama Mentor
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
