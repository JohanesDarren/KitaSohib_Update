import React, { useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  FileText,
  Download,
  Activity,
  Brain,
  ShieldAlert,
  Info,
  User,
  Calendar,
  Briefcase,
  Target,
  TrendingUp,
  Heart,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { EmotionTestResult, UserProfile, DimensionScore, DetailedAnalysis } from '../../../types';
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
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface StudentDetailViewProps {
  student: UserProfile;
  result: EmotionTestResult | null;
  risk: 'Rendah' | 'Sedang' | 'Tinggi';
  onClose: () => void;
}

function parseAnalysis(aiAnalysis: string | undefined): DetailedAnalysis | null {
  if (!aiAnalysis) return null;
  try {
    return JSON.parse(aiAnalysis) as DetailedAnalysis;
  } catch {
    return null;
  }
}

export const StudentDetailView: React.FC<StudentDetailViewProps> = ({
  student,
  result,
  risk,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const analysis = useMemo(() => parseAnalysis(result?.ai_analysis), [result]);

  const getRiskStyle = (r: 'Rendah' | 'Sedang' | 'Tinggi') => {
    switch (r) {
      case 'Tinggi':
        return {
          text: 'text-red-600',
          bg: 'bg-red-50',
          border: 'border-red-200',
          badgeBg: 'bg-red-500',
          label: 'Mendesak',
          icon: <AlertTriangle size={14} className="text-red-500" />,
        };
      case 'Sedang':
        return {
          text: 'text-amber-600',
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          badgeBg: 'bg-amber-500',
          label: 'Perlu Pantauan',
          icon: <Clock size={14} className="text-amber-500" />,
        };
      default:
        return {
          text: 'text-emerald-600',
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          badgeBg: 'bg-emerald-500',
          label: 'Stabil',
          icon: <CheckCircle size={14} className="text-emerald-500" />,
        };
    }
  };

  const status = getRiskStyle(risk);

  const radarData = useMemo(() => {
    const radarLabels = ['Kontrol Emosi', 'Kualitas Koping', 'Dukungan Sosial', 'Resiliensi'];
    const radarDataValues = radarLabels.map(label => {
      if (!result?.dimension_scores) return 0;
      const match = result.dimension_scores.find(
        (d: DimensionScore) =>
          d.subject === label ||
          (label === 'Kontrol Emosi' && d.subject === 'Tekanan') ||
          (label === 'Dukungan Sosial' && d.subject === 'Pemicu') ||
          (label === 'Resiliensi' && d.subject === 'Hobi') ||
          (label === 'Kualitas Koping' && d.subject === 'Koping')
      );
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
          pointHoverBorderColor: '#2563eb',
        },
      ],
    };
  }, [result]);

  const radarOptions = useMemo(
    () => ({
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
              family: "'Plus Jakarta Sans', sans-serif",
            },
            color: '#64748b',
          },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1e293b',
          padding: 12,
          bodyFont: { size: 12, weight: 'bold' as const },
          displayColors: false,
        },
      },
    }),
    []
  );

  const getActions = () => {
    if (!result) return ['Mendorong siswa untuk melakukan tes kesehatan mental pertama.'];
    const score = result.score;
    if (score >= 71)
      return [
        'Lakukan konseling intensif secara personal segera.',
        'Koordinasi dengan orang tua siswa terkait kondisi emosi berat.',
        'Pertimbangkan rujukan ke psikolog profesional.',
      ];
    if (score >= 41)
      return [
        'Ajak diskusi santai untuk identifikasi pemicu stres.',
        'Pantau aktivitas siswa di sekolah secara berkala.',
        'Berikan dukungan emosional dan bimbingan kelompok.',
      ];
    return [
      'Berikan apresiasi atas kestabilan emosi siswa.',
      'Dorong siswa untuk berbagi pengalaman positifnya.',
      'Jadwalkan check-in rutin tiap bulan.',
    ];
  };

  // ── PDF Export ────────────────────────────────────────────────────────────
  const handleDownloadPDF = async () => {
    const toastId = toast.loading('Menyiapkan laporan PDF…');
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      let y = 0;

      // --- HEADER BAR ---
      pdf.setFillColor(37, 99, 235);
      pdf.rect(0, 0, pageW, 32, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Laporan Psikologis Siswa', 14, 13);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text('KitaSohib – Sistem Pemantauan Kesehatan Mental Sekolah', 14, 21);
      const printDate = new Date().toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric',
      });
      pdf.text(`Dicetak: ${printDate}`, pageW - 14, 21, { align: 'right' });

      y = 42;

      // --- IDENTITAS SISWA ---
      pdf.setFillColor(241, 245, 249);
      pdf.roundedRect(10, y, pageW - 20, 38, 4, 4, 'F');
      pdf.setTextColor(30, 41, 59);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(student.full_name, 16, y + 9);

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(71, 85, 105);
      pdf.text(`NIS / Username : ${student.username}`, 16, y + 17);
      pdf.text(`Email          : ${student.email || '-'}`, 16, y + 24);
      pdf.text(`Bergabung      : ${student.created_at ? new Date(student.created_at).toLocaleDateString('id-ID') : '-'}`, 16, y + 31);

      // Risk badge on the right
      const badgeColor = risk === 'Tinggi' ? [239, 68, 68] : risk === 'Sedang' ? [245, 158, 11] : [16, 185, 129];
      pdf.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
      pdf.roundedRect(pageW - 48, y + 6, 36, 10, 3, 3, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`RISIKO ${risk.toUpperCase()}`, pageW - 30, y + 13, { align: 'center' });
      y += 48;

      // --- SKOR UTAMA ---
      pdf.setTextColor(30, 41, 59);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Hasil Tes Emosi', 14, y);
      y += 6;

      if (result) {
        const score = result.score;
        const scoreBoxes = [
          { label: 'Skor Total', value: `${score}/100` },
          { label: 'Level', value: result.level },
          { label: 'Tanggal Tes', value: new Date(result.timestamp).toLocaleDateString('id-ID') },
        ];
        const bw = (pageW - 20 - 8) / 3;
        scoreBoxes.forEach((box, i) => {
          const bx = 10 + i * (bw + 4);
          pdf.setFillColor(248, 250, 252);
          pdf.roundedRect(bx, y, bw, 18, 3, 3, 'F');
          pdf.setFontSize(7);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(100, 116, 139);
          pdf.text(box.label.toUpperCase(), bx + bw / 2, y + 5, { align: 'center' });
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(30, 41, 59);
          pdf.text(box.value, bx + bw / 2, y + 13, { align: 'center' });
        });
        y += 26;

        // --- DIMENSI SKOR ---
        if (result.dimension_scores && result.dimension_scores.length > 0) {
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(30, 41, 59);
          pdf.text('Dimensi Psikologis', 14, y);
          y += 6;

          result.dimension_scores.forEach((dim: DimensionScore) => {
            const val = dim.full === 100 ? dim.value : dim.value * 10;
            const pct = Math.min(100, Math.max(0, val));
            const barW = pageW - 20 - 50;
            pdf.setFillColor(241, 245, 249);
            pdf.roundedRect(10, y, pageW - 20, 9, 2, 2, 'F');
            // bar fill
            const fillColor = pct >= 70 ? [239, 68, 68] : pct >= 40 ? [245, 158, 11] : [16, 185, 129];
            pdf.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
            pdf.roundedRect(10, y, (pct / 100) * (pageW - 20), 9, 2, 2, 'F');
            pdf.setFontSize(7);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(255, 255, 255);
            pdf.text(dim.subject, 14, y + 6);
            pdf.setTextColor(30, 41, 59);
            pdf.text(`${Math.round(pct)}/100`, pageW - 12, y + 6, { align: 'right' });
            y += 12;
          });
          y += 4;
        }

        // --- AI ANALYSIS ---
        if (analysis) {
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(30, 41, 59);
          pdf.text('Analisis AI', 14, y);
          y += 6;

          pdf.setFillColor(248, 250, 252);
          pdf.roundedRect(10, y, pageW - 20, 22, 3, 3, 'F');
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(71, 85, 105);
          const summaryLines = pdf.splitTextToSize(
            analysis.summary || 'Tidak ada ringkasan.',
            pageW - 28
          );
          pdf.text(summaryLines.slice(0, 3), 14, y + 7);
          y += 28;

          if (analysis.mbti?.type) {
            const mbtiW = (pageW - 20 - 6) / 2;
            // MBTI box
            pdf.setFillColor(238, 242, 255);
            pdf.roundedRect(10, y, mbtiW, 20, 3, 3, 'F');
            pdf.setFontSize(7);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(67, 56, 202);
            pdf.text('TIPE MBTI', 10 + mbtiW / 2, y + 5, { align: 'center' });
            pdf.setFontSize(13);
            pdf.text(analysis.mbti.type, 10 + mbtiW / 2, y + 13, { align: 'center' });
            pdf.setFontSize(7);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(67, 56, 202);
            pdf.text(analysis.mbti.title || '', 10 + mbtiW / 2, y + 18, { align: 'center' });

            // RIASEC box
            if (analysis.riasec?.code) {
              pdf.setFillColor(236, 253, 245);
              pdf.roundedRect(10 + mbtiW + 6, y, mbtiW, 20, 3, 3, 'F');
              pdf.setFont('helvetica', 'bold');
              pdf.setFontSize(7);
              pdf.setTextColor(4, 120, 87);
              pdf.text('KODE RIASEC', 10 + mbtiW + 6 + mbtiW / 2, y + 5, { align: 'center' });
              pdf.setFontSize(13);
              pdf.text(analysis.riasec.code, 10 + mbtiW + 6 + mbtiW / 2, y + 13, { align: 'center' });
              pdf.setFontSize(7);
              pdf.setFont('helvetica', 'normal');
              pdf.text(analysis.riasec.primary || '', 10 + mbtiW + 6 + mbtiW / 2, y + 18, { align: 'center' });
            }
            y += 26;
          }

          // Careers
          if (analysis.careers?.length) {
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(30, 41, 59);
            pdf.text('Rekomendasi Karir:', 14, y);
            y += 5;
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(71, 85, 105);
            const careerText = analysis.careers.slice(0, 4).join('  •  ');
            pdf.text(careerText, 14, y);
            y += 8;
          }
        }

        // --- RENCANA INTERVENSI ---
        if (y > pageH - 60) { pdf.addPage(); y = 20; }
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(30, 41, 59);
        pdf.text('Rencana Intervensi BK', 14, y);
        y += 6;
        getActions().forEach((action, i) => {
          pdf.setFillColor(241, 245, 249);
          pdf.roundedRect(10, y, pageW - 20, 12, 2, 2, 'F');
          pdf.setFillColor(37, 99, 235);
          pdf.circle(16, y + 6, 3, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(7);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${i + 1}`, 16, y + 7.5, { align: 'center' });
          pdf.setTextColor(30, 41, 59);
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          const lines = pdf.splitTextToSize(action, pageW - 38);
          pdf.text(lines[0], 22, y + 7.5);
          y += 15;
        });
      } else {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 116, 139);
        pdf.text('Belum ada hasil tes emosi untuk siswa ini.', 14, y);
        y += 10;
      }

      // --- FOOTER ---
      const footerY = pageH - 12;
      pdf.setDrawColor(226, 232, 240);
      pdf.line(10, footerY - 4, pageW - 10, footerY - 4);
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(148, 163, 184);
      pdf.text('KitaSohib – Sistem Kesehatan Mental Sekolah', 14, footerY);
      pdf.text(`Laporan bersifat rahasia – ${printDate}`, pageW - 14, footerY, { align: 'right' });

      pdf.save(`Laporan_${student.full_name.replace(/\s+/g, '_')}.pdf`);
      toast.success('Laporan PDF berhasil diunduh!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Gagal membuat PDF. Coba lagi.', { id: toastId });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* ── HEADER ── */}
        <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <img
              src={student.avatar_url}
              className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 object-cover"
              alt={student.full_name}
            />
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight leading-tight">
                {student.full_name}
              </h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  NIS: {student.username}
                </span>
                <span
                  className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${status.bg} ${status.text} border ${status.border}`}
                >
                  {status.icon} {status.label}
                </span>
                {result && (
                  <span className="text-[10px] font-bold text-slate-400">
                    Skor: <span className="text-slate-700 font-black">{result.score}/100</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-2xl transition-all active:scale-95 shadow-md shadow-indigo-200"
            >
              <Download size={14} /> PDF
            </button>
            <button
              onClick={onClose}
              className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:bg-slate-100 transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ── SCROLLABLE BODY ── */}
        <div ref={printRef} className="flex-1 overflow-y-auto p-6 md:p-10 no-scrollbar">

          {/* Profil Info Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[
              { icon: <User size={15} />, label: 'NIS', value: student.username },
              { icon: <Calendar size={15} />, label: 'Bergabung', value: student.created_at ? new Date(student.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-' },
              { icon: <Briefcase size={15} />, label: 'Email', value: student.email || '-' },
              { icon: <Activity size={15} />, label: 'Tes Terakhir', value: result ? new Date(result.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Belum ada' },
            ].map((item, i) => (
              <div key={i} className={`p-4 rounded-2xl border ${status.bg} ${status.border} flex gap-3 items-start`}>
                <div className={`${status.text} mt-0.5`}>{item.icon}</div>
                <div className="min-w-0">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{item.label}</p>
                  <p className="text-sm font-black text-slate-800 truncate">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* ── LEFT: Radar + Dimensi ── */}
            <div className="space-y-8">
              {/* Radar Chart */}
              <section>
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Activity size={18} /></div>
                  <h4 className="font-black text-slate-800 uppercase tracking-wider text-xs">Dimensi Psikologis</h4>
                </div>
                <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 flex items-center justify-center relative overflow-hidden h-[300px]">
                  <div className="absolute top-4 right-4 text-slate-300"><Info size={18} /></div>
                  {result ? (
                    <div className="w-full h-full"><Radar data={radarData} options={radarOptions} /></div>
                  ) : (
                    <div className="text-center py-8">
                      <Activity size={36} className="text-slate-200 mx-auto mb-3" />
                      <p className="text-slate-400 font-bold text-sm">Belum ada data tes</p>
                      <p className="text-slate-300 text-xs mt-1">Siswa belum mengisi tes emosi</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Dimensi Score Bars */}
              {result?.dimension_scores && result.dimension_scores.length > 0 && (
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl"><TrendingUp size={18} /></div>
                    <h4 className="font-black text-slate-800 uppercase tracking-wider text-xs">Skor Per Dimensi</h4>
                  </div>
                  <div className="space-y-3">
                    {result.dimension_scores.map((dim: DimensionScore, i: number) => {
                      const rawVal = dim.full === 100 ? dim.value : dim.value * 10;
                      const pct = Math.min(100, Math.max(0, rawVal));
                      const barColor = pct >= 70 ? 'bg-red-400' : pct >= 40 ? 'bg-amber-400' : 'bg-emerald-400';
                      return (
                        <div key={i} className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider">{dim.subject}</span>
                            <span className="text-[11px] font-black text-slate-800">{Math.round(pct)}<span className="text-slate-300 font-bold">/100</span></span>
                          </div>
                          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${barColor} rounded-full transition-all duration-700`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* AI Summary */}
              {analysis?.summary && (
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><Brain size={18} /></div>
                    <h4 className="font-black text-slate-800 uppercase tracking-wider text-xs">Ringkasan AI</h4>
                  </div>
                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-3xl border border-indigo-100">
                    <p className="text-sm text-slate-700 font-medium leading-relaxed italic">
                      "{analysis.summary}"
                    </p>
                  </div>
                </section>
              )}
            </div>

            {/* ── RIGHT: MBTI / RIASEC / Actions ── */}
            <div className="space-y-8">

              {/* MBTI & RIASEC */}
              {analysis && (
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><Target size={18} /></div>
                    <h4 className="font-black text-slate-800 uppercase tracking-wider text-xs">Profil Kepribadian</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {analysis.mbti?.type && (
                      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 text-center">
                        <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-1">Tipe MBTI</p>
                        <p className="text-3xl font-black text-indigo-700 mb-1">{analysis.mbti.type}</p>
                        <p className="text-[10px] font-bold text-indigo-500">{analysis.mbti.title}</p>
                      </div>
                    )}
                    {analysis.riasec?.code && (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 text-center">
                        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mb-1">Kode RIASEC</p>
                        <p className="text-3xl font-black text-emerald-700 mb-1">{analysis.riasec.code}</p>
                        <p className="text-[10px] font-bold text-emerald-500">{analysis.riasec.primary}</p>
                      </div>
                    )}
                  </div>

                  {/* Kekuatan & Kelemahan */}
                  {(analysis.strengths?.length || analysis.weaknesses?.length) && (
                    <div className="grid grid-cols-2 gap-3">
                      {analysis.strengths?.length > 0 && (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                          <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500 mb-3 flex items-center gap-1"><Heart size={10} /> Kekuatan</p>
                          <ul className="space-y-1.5">
                            {analysis.strengths.slice(0, 3).map((s: string, i: number) => (
                              <li key={i} className="text-[11px] font-bold text-emerald-800 flex gap-2 items-start">
                                <span className="text-emerald-400 mt-0.5">•</span>{s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {analysis.weaknesses?.length > 0 && (
                        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4">
                          <p className="text-[9px] font-black uppercase tracking-widest text-rose-500 mb-3 flex items-center gap-1"><AlertTriangle size={10} /> Tantangan</p>
                          <ul className="space-y-1.5">
                            {analysis.weaknesses.slice(0, 3).map((w: string, i: number) => (
                              <li key={i} className="text-[11px] font-bold text-rose-800 flex gap-2 items-start">
                                <span className="text-rose-400 mt-0.5">•</span>{w}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Rekomendasi Karir */}
                  {analysis.careers?.length > 0 && (
                    <div className="mt-3 bg-slate-50 border border-slate-100 rounded-2xl p-4">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1"><Briefcase size={10} /> Rekomendasi Karir</p>
                      <div className="flex flex-wrap gap-2">
                        {analysis.careers.slice(0, 5).map((c: string, i: number) => (
                          <span key={i} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-black text-slate-700">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* Rencana Intervensi */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><ShieldAlert size={18} /></div>
                  <h4 className="font-black text-slate-800 uppercase tracking-wider text-xs">Rencana Intervensi BK</h4>
                </div>
                <div className="space-y-3">
                  {getActions().map((action, i) => (
                    <div
                      key={i}
                      className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-white transition-all"
                    >
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <p className="text-sm text-slate-700 font-bold leading-relaxed">{action}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Download Card */}
              <section className="bg-slate-900 rounded-[2rem] p-7 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="text-blue-400" size={20} />
                  <h4 className="font-black uppercase tracking-widest text-[11px]">Ekspor Laporan</h4>
                </div>
                <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                  Unduh laporan psikologis lengkap siswa ini dalam format PDF untuk keperluan dokumentasi dan bimbingan konseling.
                </p>
                <button
                  onClick={handleDownloadPDF}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Download size={16} /> Unduh Laporan PDF
                </button>
              </section>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};