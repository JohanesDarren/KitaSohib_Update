
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Moon, Droplets, Sparkles, Send, HeartHandshake } from 'lucide-react';
import { Button } from './ui/Button';
import toast from 'react-hot-toast';

interface DailyJournalModalProps {
  onClose: () => void;
  onSubmit: (data: { sleep: number; water: number; affirmation: string }) => void;
  isLoading: boolean;
}

export const DailyJournalModal: React.FC<DailyJournalModalProps> = ({ onClose, onSubmit, isLoading }) => {
  const [sleep, setSleep] = useState<number>(6);
  const [water, setWater] = useState<number>(4);
  const [affirmation, setAffirmation] = useState('');

  const getSleepLabel = (hours: number) => {
    if (hours < 5) return "🐼 Badan Masih Pegal (Kurang)";
    if (hours < 7) return "😐 Lumayan Cukup";
    if (hours < 9) return "🦁 Seger Bugar (Pas)";
    return "🐨 Kebanyakan Tidur";
  };

  const handleSubmit = () => {
    if (!affirmation.trim()) {
      toast.error("Isi satu niat baik dulu ya! ✨");
      return;
    }
    onSubmit({ sleep, water, affirmation });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        className="bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto no-scrollbar"
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-2xl font-black text-slate-800">Catatan Harian 📝</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Rawat raga, jaga jiwa.</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition-all text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-8">
          {/* 1. Durasi Tidur */}
          <div className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20">
                <Moon size={20} />
              </div>
              <label className="font-black text-slate-800 text-sm">Istirahatmu semalam cukup?</label>
            </div>
            
            <div className="mb-4 text-center">
               <span className="text-4xl font-black text-indigo-600">{sleep}</span>
               <span className="text-sm font-bold text-indigo-400 ml-1">Jam</span>
            </div>
            <input 
              type="range" min="1" max="12" step="0.5"
              value={sleep} 
              onChange={(e) => setSleep(Number(e.target.value))}
              className="w-full h-3 bg-indigo-200 rounded-full appearance-none cursor-pointer accent-indigo-600"
            />
            <p className="text-center text-xs font-bold text-indigo-400 uppercase tracking-widest mt-3">{getSleepLabel(sleep)}</p>
          </div>

          {/* 2. Asupan Air */}
          <div className="bg-cyan-50/50 p-6 rounded-[2rem] border border-cyan-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-cyan-500 text-white rounded-xl shadow-lg shadow-cyan-500/20">
                <Droplets size={20} />
              </div>
              <label className="font-black text-slate-800 text-sm">Sudah minum air putih?</label>
            </div>
            
            <div className="flex items-center justify-center gap-6">
               <button onClick={() => setWater(Math.max(0, water - 1))} className="w-10 h-10 rounded-xl bg-white border border-cyan-200 text-cyan-600 font-black flex items-center justify-center hover:bg-cyan-50 transition-all">-</button>
               <div className="text-center w-24">
                  <span className="text-4xl font-black text-cyan-600">{water}</span>
                  <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mt-1">Gelas</p>
               </div>
               <button onClick={() => setWater(water + 1)} className="w-10 h-10 rounded-xl bg-cyan-500 text-white font-black flex items-center justify-center shadow-lg shadow-cyan-500/20 hover:bg-cyan-600 transition-all">+</button>
            </div>
          </div>

          {/* 3. Niat Baik / Syukur (Ganti istilah Afirmasi) */}
          <div className="bg-amber-50/50 p-6 rounded-[2rem] border border-amber-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-500/20">
                <HeartHandshake size={20} />
              </div>
              <label className="font-black text-slate-800 text-sm">Satu hal yang kamu syukuri hari ini:</label>
            </div>
            <textarea 
              value={affirmation}
              onChange={(e) => setAffirmation(e.target.value)}
              placeholder="Contoh: Alhamdulillah masih bisa makan enak hari ini..."
              className="w-full h-24 bg-white border border-amber-200 rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-400/50 resize-none placeholder:text-slate-300 placeholder:font-normal"
            />
          </div>

          <Button onClick={handleSubmit} isLoading={isLoading} className="w-full !py-5 !rounded-[1.5rem] shadow-xl font-black text-sm uppercase tracking-widest">
             <Send size={18} className="mr-2" /> Simpan Catatan
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
