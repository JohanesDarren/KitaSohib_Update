
import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ChartData
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { MoodLog } from '../../../types';

// Registrasi komponen Chart.js secara global
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface MonthlyInsightChartProps {
  moodHistory: MoodLog[];
}

export const MonthlyInsightChart: React.FC<MonthlyInsightChartProps> = ({ moodHistory = [] }) => {
  
  // 1. Memoize Data Processing to prevent calc on every render
  const chartData = useMemo<ChartData<'line'>>(() => {
    if (!moodHistory || moodHistory.length === 0) {
        return { labels: [], datasets: [] };
    }

    // Sort data: Oldest to Newest
    const sortedMoods = [...moodHistory].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Take last 15 entries
    const displayedData = sortedMoods.slice(-15);

    const labels = displayedData.map(mood => {
      const d = new Date(mood.timestamp);
      return `${d.getDate()}/${d.getMonth() + 1}`;
    });

    const dataPoints = displayedData.map(mood => mood.mood_score);

    return {
      labels,
      datasets: [
        {
          label: 'Skor Perasaan',
          data: dataPoints,
          borderColor: '#3B82F6', // Pastel Blue
          backgroundColor: (context: any) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return null;
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, 'rgba(59, 130, 246, 0.2)');
            gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
            return gradient;
          },
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#FFFFFF',
          pointBorderColor: '#3B82F6',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
          borderWidth: 3,
        }
      ]
    };
  }, [moodHistory]);

  // 2. Memoize Options to prevent chart re-instance
  const options = useMemo<ChartOptions<'line'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false 
      },
      tooltip: {
        backgroundColor: '#1F2937',
        padding: 12,
        titleFont: { size: 10, weight: 'bold' },
        bodyFont: { size: 13, weight: 'bold' }, 
        displayColors: false,
        callbacks: {
          label: (context) => {
            const score = Number(context.parsed.y);
            const labels = ["", "😫 Lelah", "😟 Kurang Baik", "😐 Biasa", "🙂 Baik", "🤩 Luar Biasa"];
            return ` Mood: ${labels[score] || score}`;
          }
        }
      }
    },
    scales: {
      y: {
        min: 1,
        max: 5,
        ticks: {
          stepSize: 1,
          callback: (value) => {
            const icons = ["", "😫", "😟", "😐", "🙂", "🤩"];
            return icons[Number(value)] || value;
          },
          font: { size: 14 }
        },
        grid: { display: false },
        border: { display: false }
      },
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 10, weight: 'bold' },
          color: '#94A3B8'
        },
        border: { display: false }
      }
    }
  }), []);

  // 3. Fallback for empty data to prevent chart errors or ugly rendering
  if (!moodHistory || moodHistory.length === 0) {
    return (
      <div className="h-64 w-full mt-4 flex items-center justify-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Belum ada data mood</p>
      </div>
    );
  }

  return (
    <div className="h-64 w-full mt-4">
      <Line data={chartData} options={options} />
    </div>
  );
};
