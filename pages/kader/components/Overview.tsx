
import React from 'react';
import { Users, Activity, ChevronRight, AlertTriangle, TrendingUp } from 'lucide-react';
import { UserProfile } from '../../../types';
import { motion } from 'framer-motion';

interface OverviewProps {
  stats: { totalUsers: number; avgMood: number; riskUsers: number };
  users: UserProfile[];
  onViewChat: () => void;
  onRiskClick: () => void;
}

export const Overview: React.FC<OverviewProps> = ({ stats, users, onViewChat, onRiskClick }) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-10 pb-24 md:pb-10 no-scrollbar">
      <div className="mb-10">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Selamat Pagi, Kader! 👋</h2>
        <p className="text-gray-500 mt-1 font-medium text-lg">Pantau perkembangan batin remaja Sukasari hari ini.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatsCard icon={Users} label="Total Remaja" value={stats.totalUsers} color="bg-blue-600" bg="bg-blue-50" text="text-blue-600" />
        <StatsCard icon={Activity} label="Rata-rata Mood" value={stats.avgMood} sub="/ 5.0" color="bg-emerald-600" bg="bg-emerald-50" text="text-emerald-600" />
        <motion.div whileHover={{ y: -5 }} onClick={onRiskClick} className="cursor-pointer">
           <StatsCard 
              icon={AlertTriangle} 
              label="Risiko Tinggi" 
              value={stats.riskUsers} 
              sub="Remaja" 
              color="bg-red-600" 
              bg="bg-red-50" 
              text="text-red-600"
              interactive
           />
        </motion.div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><TrendingUp size={20}/></div>
             <h3 className="font-black text-gray-800 text-lg">Aktivitas Terkini</h3>
          </div>
          <button onClick={onViewChat} className="text-primary-600 text-xs font-black uppercase tracking-widest hover:underline">Semua Pesan</button>
        </div>
        <div className="divide-y divide-gray-50">
          {users.slice(0, 5).map((u: any) => (
            <div key={u.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="relative">
                   <img src={u.avatar_url} className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 object-cover" />
                   <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${u.latest_mood < 3 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'}`}></div>
                </div>
                <div>
                  <p className="font-black text-sm text-gray-900 group-hover:text-primary-600 transition-colors">{u.full_name}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Mood Terakhir: {u.latest_mood || 'Belum catat'}</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-300 group-hover:translate-x-1 transition-all" />
            </div>
          ))}
          {users.length === 0 && (
             <div className="p-20 text-center opacity-40">
                <Users size={40} className="mx-auto text-gray-200 mb-4" />
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Belum ada aktivitas remaja</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatsCard = ({ icon: Icon, label, value, sub, color, bg, text, interactive }: any) => (
  <div className={`bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center gap-5 relative overflow-hidden transition-all ${interactive ? 'hover:shadow-xl hover:shadow-red-500/5 hover:border-red-100' : ''}`}>
    <div className={`p-4 rounded-2xl text-white shadow-lg shadow-gray-200 ${color}`}>
      <Icon size={24} />
    </div>
    <div className="relative z-10">
      <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
         <p className={`text-3xl font-black ${text}`}>{value}</p>
         <span className="text-xs font-black text-gray-300 uppercase">{sub}</span>
      </div>
    </div>
    {interactive && (
       <div className="absolute top-4 right-4 animate-pulse">
          <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
       </div>
    )}
  </div>
);
