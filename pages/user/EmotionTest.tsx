
import React, { useState, startTransition } from 'react';
import { Button } from '../../components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, HeartPulse, Sparkles, BrainCircuit, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI } from '@google/genai';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/mockSupabase';
import { EmotionResultDashboard } from './EmotionResultDashboard';
import { DimensionScore } from '../../types';

// Opsi Standar Likert 1-5
const LIKERT_OPTIONS = [
  { label: "Sangat Tidak Sesuai", value: 1 },
  { label: "Tidak Sesuai", value: 2 },
  { label: "Netral / Kadang-kadang", value: 3 },
  { label: "Sesuai", value: 4 },
  { label: "Sangat Sesuai", value: 5 }
];

/* ================= 25 ITEMS EQ-GROWTH ASSESSMENT ================= */
const EMOTION_ASSESSMENT = [
  // --- DIMENSI 1: KESADARAN DIRI (Self-Awareness) [Indeks 0-5] ---
  { id: 1, dimension: "Kesadaran Diri", question: "Saya bisa membedakan dengan jelas antara perasaan sedih, kecewa, atau marah saat masalah datang." },
  { id: 2, dimension: "Kesadaran Diri", question: "Saya menyadari perubahan fisik tubuh saya (seperti jantung berdebar) saat mulai merasa stres." },
  { id: 3, dimension: "Kesadaran Diri", question: "Saya paham apa saja hal-hal spesifik yang biasanya memicu perubahan suasana hati saya." },
  { id: 4, dimension: "Kesadaran Diri", question: "Saya bisa menjelaskan dengan kata-kata yang tepat apa yang sedang saya rasakan kepada orang lain." },
  { id: 5, dimension: "Kesadaran Diri", question: "Saya menyadari bagaimana perasaan saya saat ini mempengaruhi konsentrasi belajar atau bekerja saya." },
  { id: 6, dimension: "Kesadaran Diri", question: "Saya mampu mengakui kelebihan dan kekurangan diri saya secara jujur tanpa merasa rendah diri." },

  // --- DIMENSI 2: REGULASI DIRI (Self-Regulation) [Indeks 6-12] ---
  { id: 7, dimension: "Regulasi Diri", question: "Saya mampu menenangkan diri kembali dalam waktu singkat setelah mengalami kejadian yang mengejutkan." },
  { id: 8, dimension: "Regulasi Diri", question: "Saya berpikir terlebih dahulu tentang dampaknya sebelum bertindak saat sedang marah." },
  { id: 9, dimension: "Regulasi Diri", question: "Saya tetap bisa berpikir jernih untuk mencari solusi meskipun berada di bawah tekanan tugas." },
  { id: 10, dimension: "Regulasi Diri", question: "Saya bisa menyesuaikan diri dengan perubahan rencana yang mendadak tanpa merasa frustrasi berlebihan." },
  { id: 11, dimension: "Regulasi Diri", question: "Saya berusaha melihat sisi positif atau pelajaran berharga dari sebuah kegagalan." },
  { id: 12, dimension: "Regulasi Diri", question: "Saya mampu menunda kesenangan sesaat (seperti main game) demi menyelesaikan kewajiban penting." },
  { id: 13, dimension: "Regulasi Diri", question: "Saya bisa mengelola rasa kecewa tanpa menyalahkan diri sendiri atau orang lain berlarut-larut." },

  // --- DIMENSI 3: KESADARAN SOSIAL (Empathy) [Indeks 13-18] ---
  { id: 14, dimension: "Kesadaran Sosial", question: "Saya peka terhadap perubahan ekspresi wajah atau nada bicara teman saat mereka sedang ada masalah." },
  { id: 15, dimension: "Kesadaran Sosial", question: "Saya berusaha memahami sudut pandang orang lain meskipun pendapat mereka berbeda dengan saya." },
  { id: 16, dimension: "Kesadaran Sosial", question: "Saya bisa merasakan atmosfer emosional (seperti tegang atau kaku) saat memasuki sebuah ruangan." },
  { id: 17, dimension: "Kesadaran Sosial", question: "Saya mendengarkan cerita teman dengan penuh perhatian tanpa sibuk memikirkan jawaban sendiri." },
  { id: 18, dimension: "Kesadaran Sosial", question: "Saya turut merasakan keprihatinan ketika melihat orang lain sedang mengalami kesulitan." },
  { id: 19, dimension: "Kesadaran Sosial", question: "Saya memahami batasan sopan santun yang berlaku saat berinteraksi dengan kelompok baru." },

  // --- DIMENSI 4: KETERAMPILAN RELASI (Social Skill) [Indeks 19-24] ---
  { id: 20, dimension: "Keterampilan Relasi", question: "Saya dapat menyampaikan ketidaksetujuan atau kritik dengan cara yang sopan tanpa menyakiti hati." },
  { id: 21, dimension: "Keterampilan Relasi", question: "Saya merasa nyaman mencari jalan tengah (win-win solution) saat terjadi perbedaan pendapat." },
  { id: 22, dimension: "Keterampilan Relasi", question: "Saya berani berkata 'tidak' pada ajakan teman yang negatif dengan tetap menjaga hubungan baik." },
  { id: 23, dimension: "Keterampilan Relasi", question: "Saya mampu bekerja sama dalam tim dan membantu membangun semangat teman-teman." },
  { id: 24, dimension: "Keterampilan Relasi", question: "Saya bisa mencairkan suasana yang kaku atau canggung dalam pergaulan." },
  { id: 25, dimension: "Keterampilan Relasi", question: "Saya aktif menjaga komunikasi dan hubungan baik dengan teman-teman lama maupun baru." }
];

export const EmotionTest: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [step, setStep] = useState(0); 
  const [answers, setAnswers] = useState<number[]>(Array(EMOTION_ASSESSMENT.length).fill(0));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleAnswer = (val: number) => {
    startTransition(() => {
      const numericVal = Number(val) || 0; 
      const newAnswers = [...answers];
      newAnswers[step - 1] = numericVal;
      setAnswers(newAnswers);
      if (step < EMOTION_ASSESSMENT.length) setStep(step + 1);
      else finishTest(newAnswers);
    });
  };

  const calculateDimensionScore = (answerArray: number[], startIdx: number, endIdx: number) => {
    const subset = answerArray.slice(startIdx, endIdx + 1).map(n => Number(n) || 0);
    const sum = subset.reduce((a, b) => a + b, 0);
    const maxScore = subset.length * 5; 
    if (maxScore === 0) return 0; 
    const finalScore = (sum / maxScore) * 10;
    return isNaN(finalScore) ? 0 : finalScore;
  };

  const finishTest = async (finalAnswers: number[]) => {
    setLoading(true);
    const scoreAwareness = calculateDimensionScore(finalAnswers, 0, 5);
    const scoreRegulation = calculateDimensionScore(finalAnswers, 6, 12);
    const scoreEmpathy = calculateDimensionScore(finalAnswers, 13, 18);
    const scoreSocial = calculateDimensionScore(finalAnswers, 19, 24);

    let finalScoreNormalized = Math.round(((scoreAwareness + scoreRegulation + scoreEmpathy + scoreSocial) / 4) * 10);
    if (isNaN(finalScoreNormalized)) finalScoreNormalized = 0;

    const dimScores: DimensionScore[] = [
      { subject: 'Kesadaran', full: 10, value: scoreAwareness },
      { subject: 'Regulasi', full: 10, value: scoreRegulation },
      { subject: 'Empati', full: 10, value: scoreEmpathy },
      { subject: 'Sosial', full: 10, value: scoreSocial },
    ];

    let analysisString = "";

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Bertindaklah sebagai Psikolog Ahli (SohibAI). 
        Analisis profil emosi remaja ini berdasarkan skor dimensi (Skala 0-10):
        - Kesadaran Diri: ${scoreAwareness.toFixed(1)}
        - Regulasi Diri: ${scoreRegulation.toFixed(1)}
        - Kesadaran Sosial (Empati): ${scoreEmpathy.toFixed(1)}
        - Keterampilan Relasi: ${scoreSocial.toFixed(1)}
        
        Total Skor Emosi: ${finalScoreNormalized}/100.

        TUGAS: Lakukan ekstrapolasi/prediksi logis untuk menentukan Tipe Kepribadian (MBTI-like), Minat Karir (RIASEC), dan Saran Karir yang paling cocok dengan profil kekuatan/kelemahan emosi ini.
        Contoh logika: Jika Empati & Sosial tinggi -> Cocok untuk karir Sosial/Kesehatan, Tipe 'Feeling' dominan. Jika Regulasi & Kesadaran Diri tinggi -> Cocok untuk Leadership/Bisnis.

        Output WAJIB berupa JSON murni tanpa markdown, dengan format:
        {
          "summary": "Satu kalimat apresiasi dan saran utama yang gaul dan hangat.",
          "mbti": {
             "type": "Kode 4 Huruf (misal ENFJ)",
             "title": "Julukan (misal The Protagonist)",
             "description": "Penjelasan singkat hubungan MBTI ini dengan skor emosinya."
          },
          "riasec": {
             "code": "Kode 3 Huruf (misal SAE)",
             "primary": "Tipe Utama (misal Social)",
             "secondary": "Tipe Kedua (misal Artistic)",
             "description": "Kenapa minat ini cocok berdasarkan profil emosinya."
          },
          "careers": ["Karir 1", "Karir 2", "Karir 3"],
          "strengths": ["Kekuatan 1", "Kekuatan 2"],
          "weaknesses": ["Area Kembang 1"]
        }
        Gunakan Bahasa Indonesia gaya remaja yang suportif.
      `;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      
      analysisString = response.text || "{}";
      
      // Try parsing to ensure validity, fallback to basic text if fails
      try {
         const parsed = JSON.parse(analysisString);
         // Update local user context with new holistic data
         if (user) {
            updateUser({ 
                mbti_type: parsed.mbti.type,
                riasec_code: parsed.riasec.code
            });
            // Note: backend update happens in submitEmotionTest via user update logic if implemented, 
            // otherwise strictly local for session.
         }
      } catch (e) {
         console.warn("AI JSON parse failed, utilizing raw text fallback");
      }

    } catch (e) {
      // Fallback manual JSON if AI fails
      analysisString = JSON.stringify({
        summary: "Koneksi AI terputus, tapi hasil tesmu aman! Kamu punya potensi besar, teruslah berlatih mengenali dirimu.",
        mbti: { type: "N/A", title: "Belum Terdeteksi", description: "Coba lagi nanti untuk analisis detail." },
        riasec: { code: "N/A", primary: "-", secondary: "-", description: "-" },
        careers: ["Cobalah eksplorasi mandiri"],
        strengths: ["Semangat belajar"],
        weaknesses: ["Perlu koneksi internet"]
      });
    }

    try {
      const userId = user?.id || 'guest';
      const savedResult = await api.submitEmotionTest(userId, finalScoreNormalized, analysisString, dimScores);
      
      startTransition(() => {
        setResult(savedResult);
        setStep(EMOTION_ASSESSMENT.length + 1);
      });
    } catch (e) {
      console.error(e);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  if (step === 0) return (
    <div className="min-h-screen bg-white p-8 flex flex-col justify-center max-w-lg mx-auto">
       <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center mb-10 text-center">
          <div className="p-6 bg-blue-50 text-blue-600 rounded-[2.5rem] mb-6 shadow-xl shadow-blue-500/5 ring-8 ring-white"><BrainCircuit size={40} /></div>
          <h1 className="text-3xl font-black text-[#1F2937] mb-3 leading-tight tracking-tight">Tes Potensi Emosi</h1>
          <p className="text-[11px] text-blue-600 font-extrabold tracking-[0.25em] uppercase mb-6">EQ-Growth Assessment</p>
          <div className="bg-[#F4F7FF] p-6 rounded-[2rem] border border-[#E0E7FF] shadow-sm leading-relaxed text-sm text-[#4B5563] font-medium">
             SohibAI akan menganalisis jawabanmu untuk menemukan <strong>Tipe Kepribadian, Minat Bakat, dan Potensi Karir</strong> yang paling cocok dengan kondisi emosionalmu saat ini. Jawab jujur ya!
          </div>
       </motion.div>
       
       <Button onClick={() => setStep(1)} size="lg" className="w-full !rounded-[2rem] !py-6 shadow-2xl shadow-blue-500/20 font-black text-lg group bg-[#4F8EF7] text-white">
         Mulai Analisis <Sparkles className="ml-2 group-hover:rotate-12 transition-transform" size={20} />
       </Button>
       <button onClick={() => navigate(-1)} className="mt-8 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] hover:text-blue-500 transition-colors">Kembali</button>
    </div>
  );

  if (step > EMOTION_ASSESSMENT.length && result) {
    return <EmotionResultDashboard result={result} onClose={() => navigate('/mobile/home')} />;
  }

  const currentQ = EMOTION_ASSESSMENT[step - 1];

  return (
    <div className="min-h-screen bg-white p-6 flex flex-col max-w-lg mx-auto">
       <div className="flex items-center mb-8 pt-4">
          <button onClick={() => startTransition(() => { step > 1 ? setStep(step-1) : setStep(0) })} className="p-3 bg-[#F4F7FF] rounded-2xl shadow-sm text-gray-400 hover:text-blue-500 transition-all active:scale-90"><ArrowLeft size={18}/></button>
          <div className="flex-1 mx-6 h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
             <motion.div className="h-full bg-blue-500" initial={{ width: 0 }} animate={{ width: `${(step / EMOTION_ASSESSMENT.length) * 100}%` }} transition={{ type: 'spring', damping: 20 }} />
          </div>
          <span className="text-[11px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl">{step}/{EMOTION_ASSESSMENT.length}</span>
       </div>

       <div className="flex-1 flex flex-col justify-center px-2 pb-10">
          <div className="mb-8">
             <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest">{currentQ.dimension}</span>
             </div>
             <AnimatePresence mode="wait">
                <motion.h2 
                  key={step} 
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: -20 }}
                  className="text-xl md:text-2xl font-black text-[#1F2937] leading-tight"
                >
                   {currentQ.question}
                </motion.h2>
             </AnimatePresence>
          </div>

          <div className="space-y-3">
             {LIKERT_OPTIONS.map((opt, idx) => (
                <motion.button 
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => handleAnswer(opt.value)} 
                  className="w-full p-5 bg-[#F4F7FF] rounded-[1.5rem] text-left font-bold text-sm text-[#4B5563] border border-[#E0E7FF] hover:border-blue-500 hover:text-blue-600 hover:bg-white hover:shadow-lg hover:shadow-blue-500/5 transition-all active:scale-[0.98] flex justify-between items-center group relative overflow-hidden"
                >
                   <div className="flex items-center gap-3 relative z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 ${idx === 0 || idx === 1 ? 'border-red-100 text-red-300 group-hover:border-red-500 group-hover:text-red-500' : idx === 2 ? 'border-gray-100 text-gray-300 group-hover:border-gray-400 group-hover:text-gray-500' : 'border-emerald-100 text-emerald-300 group-hover:border-emerald-500 group-hover:text-emerald-500'}`}>
                         {opt.value}
                      </div>
                      <span>{opt.label}</span>
                   </div>
                   {idx >= 3 && <CheckCircle2 size={18} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />}
                </motion.button>
             ))}
          </div>
       </div>

       {loading && (
          <div className="fixed inset-0 bg-white/90 backdrop-blur-xl z-[100] flex flex-col items-center justify-center p-8">
             <div className="relative mb-8">
                <div className="w-20 h-20 border-4 border-blue-50 border-t-blue-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <Sparkles className="text-blue-500 animate-pulse" size={24} />
                </div>
             </div>
             <p className="text-[#1F2937] font-black text-lg text-center mb-2">SohibAI Sedang Menganalisis...</p>
             <p className="text-gray-400 font-bold text-xs uppercase tracking-[0.2em] text-center max-w-xs leading-relaxed">
                Menghubungkan pola emosi dengan tipe kepribadian dan potensi karirmu.
             </p>
          </div>
       )}
    </div>
  );
};
