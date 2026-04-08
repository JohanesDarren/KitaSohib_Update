import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  FileText, 
  Download, 
  Activity, 
  Brain,
  ShieldAlert,
  Info
} from 'lucide-react';
import { EmotionTestResult, UserProfile } from '../../../types';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { Button } from '../../../components/ui/Button';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface StudentDetailViewProps {
  student: UserProfile;
  result: EmotionTestResult | null;
  onClose: () => void;
  onDownload: () => void;
}

export const StudentDetailView: React.FC<StudentDetailViewProps> = ({ student, result, onClose, onDownload }) => {
  const getRiskColor = (score: number) => {
    if (score >= 71) return { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', label: 'Mendesak' };
    if (score >= 41) return { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', label: 'Perlu Pantauan' };
    return { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', label: 'Stabil' };
  };

  const status = getRiskColor(result?.score || 0);

  // Memoize Radar Data Calculation
  const radarData = useMemo(() => {
    const radarLabels = ['Kontrol Emosi', 'Kualitas Koping', 'Dukungan Sosial', 'Resiliensi'];
    
    const radarDataValues = radarLabels.map(label => {
        if (!result?.dimension_scores) return 0;
        const match = result.dimension_scores.find(d => 
          d.subject === label || 
          (label === 'Kontrol Emosi' && d.subject === 'Tekanan') ||
          (label === 'Dukungan Sosial' && d.subject === 'Pemicu') ||
          (label === 'Resiliensi' && d.subject === 'Hobi') ||
          (label === 'Kualitas Koping' && d.subject === 'Koping')
        );
        // Normalize 0-100 to 0-10 if needed
        return match ? (match.full === 100 ? match.value / 10 : match.value) : 0;
    });

    return {
      labels: radarLabels,
      datasets: [
        {
          label: 'Profil Psikologis',
          data: radarDataValues,
          backgroundColor: 'rgba(37, 99, 235, 0.15)',
          borderColor: '#2563eb',
          borderWidth: 2,
          pointBackgroundColor: '#2563eb',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#2563eb'
        },
      ],
    };
  }, [result]);

  // Memoize Chart Options
  const radarOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: { display: true, color: 'rgba(0,0,0,0.05)' },
        grid: { color: 'rgba(0,0,0,0.05)' },
        suggestedMin: 0,
        suggestedMax: 10,
        ticks: { display: false },
        pointLabels: {
          font: {
            size: 11,
            weight: 'bold' as const,
            family: "'Plus Jakarta Sans', sans-serif"
          },
          color: '#64748b'
        }
      }
    },
    plugins: { 
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        padding: 12,
        bodyFont: { size: 12, weight: 'bold' as const },
        displayColors: false
      }
    }
  }), []);

  const getRadarExplanation = () => {
    if (!result) return "Belum ada data tes terbaru untuk dianalisis.";
    // Simple logic for explanation based on score availability
    return `Analisis radar menunjukkan keseimbangan profil psikologis siswa pada 4 dimensi utama. Skor rata-rata: ${result.score}/100.`;
  };

  const getActions = () => {
    if (!result) return ["Mendorong siswa untuk melakukan tes kesehatan mental pertama."];
    const score = result.score;
    const actions = [];
    if (score >= 71) {
      actions.push("Lakukan konseling intensif secara personal segera.");
      actions.push("Koordinasi dengan orang tua siswa terkait kondisi emosi berat.");
    } else if (score >= 41) {
      actions.push("Ajak diskusi santai untuk identifikasi pemicu stres.");
      actions.push("Pantau aktivitas siswa di sekolah secara berkala.");
    } else {
      actions.push("Berikan apresiasi atas kestabilan emosi siswa.");
      actions.push("Dorong siswa untuk berbagi pengalaman positifnya kepada teman.");
    }
    return actions;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-center gap-5">
            <img src={student.avatar_url} className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100" />
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">{student.full_name}</h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{student.username}</span>
                <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${status.bg} ${status.text} border ${status.border}`}>
                  {status.label}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:bg-slate-100 transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 lg:p-12 no-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Left Col: Analysis */}
            <div className="space-y-10">
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Activity size={18} /></div>
                  <h4 className="font-black text-slate-800 uppercase tracking-wider text-xs">Visualisasi Dimensi Psikologis</h4>
                </div>
                <div className="bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100 flex items-center justify-center relative overflow-hidden h-[350px]">
                   <div className="absolute top-4 right-4 text-slate-300">
                      <Info size={20} />
                   </div>
                  <div className="w-full h-full">
                    <Radar data={radarData} options={radarOptions} />
                  </div>
                </div>
              </section>

              <section>
                 <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><Brain size={18} /></div>
                  <h4 className="font-black text-slate-800 uppercase tracking-wider text-xs">Penjelasan Radar Psikologis Siswa</h4>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 text-slate-600 text-sm leading-relaxed font-bold">
                   <p className="text-slate-800 italic">
                    "{getRadarExplanation()}"
                   </p>
                </div>
              </section>
            </div>

            {/* Right Col: Actions */}
            <div className="space-y-10">
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><ShieldAlert size={18} /></div>
                  <h4 className="font-black text-slate-800 uppercase tracking-wider text-xs">Rencana Intervensi BK</h4>
                </div>
                <div className="space-y-4">
                  {getActions().map((action, i) => (
                    <div key={i} className="flex gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 hover:bg-white transition-all">
                       <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                       </div>
                       <p className="text-sm text-slate-700 font-bold leading-relaxed">{action}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-slate-900 rounded-[2rem] p-8 text-white">
                 <div className="flex items-center gap-3 mb-6">
                    <FileText className="text-blue-400" size={20} />
                    <h4 className="font-black uppercase tracking-widest text-[11px]">Catatan Akhir</h4>
                 </div>
                 <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                   Pastikan setiap langkah intervensi dicatat dalam buku pemantauan BK sekolah untuk keperluan dokumentasi kurikulum.
                 </p>
                 <Button onClick={onDownload} className="w-full !rounded-xl !py-3.5 bg-blue-600 hover:bg-blue-700 font-black text-xs uppercase tracking-widest">
                    <Download size={16} className="mr-2" /> Unduh Laporan PDF
                 </Button>
              </section>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};