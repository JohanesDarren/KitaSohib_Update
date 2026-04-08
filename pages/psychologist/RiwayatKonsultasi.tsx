import React, { useEffect, useState, useMemo } from 'react';
import { Clock, ClipboardList, Search, FileText } from 'lucide-react';
import { api } from '../../services/mockSupabase';
import { Referral } from '../../types';
import { useAuth } from '../../context/AuthContext';

const RiwayatKonsultasi: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<Referral[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  useEffect(() => {
    const loadHistory = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const result = await api.fetchPsychologistReferrals(user.id);
        const completedOnly = (result || []).filter((item: Referral) => item.status === 'completed');
        setData(completedOnly);
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, [user]);

  const processedData = useMemo(() => {
    const filtered = data.filter((item) =>
      (item.user_name || '').toLowerCase().includes(search.toLowerCase())
    );

    return filtered.sort((a, b) => {
      const timeA = a.completed_at ? new Date(a.completed_at as any).getTime() : 0;
      const timeB = b.completed_at ? new Date(b.completed_at as any).getTime() : 0;
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });
  }, [data, search, sortOrder]);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <Clock className="animate-spin mx-auto text-indigo-200 mb-4" size={40} />
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Memuat Riwayat...</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      {/* Search & Sort Inside Tab Content */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Cari nama pasien dalam riwayat..."
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white transition-all shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-6 py-3.5 rounded-2xl border border-slate-200 bg-white font-bold text-slate-600 outline-none shadow-sm cursor-pointer"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
        >
          <option value="newest">Terbaru</option>
          <option value="oldest">Terlama</option>
        </select>
      </div>

      {processedData.length === 0 ? (
        <div className="py-24 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200 shadow-inner">
          <ClipboardList className="mx-auto text-slate-200 mb-4" size={56} />
          <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-sm">Riwayat Kosong</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {processedData.map((item) => (
            <div key={item.id} className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-black text-slate-800">{item.user_name || 'Pasien'}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                    Kader: {item.kader_name || '-'}
                  </p>
                </div>
                <span className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                  Selesai
                </span>
              </div>

              {item.notes && (
                <div className="bg-slate-50 p-5 rounded-2xl mb-6 border-l-4 border-slate-200 text-sm italic text-slate-600">
                  "{item.notes}"
                </div>
              )}

              <div className="flex justify-between items-center pt-5 border-t border-slate-50">
                <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-tight">
                  <Clock size={16} className="text-indigo-400" />
                  {item.completed_at 
                    ? new Date(item.completed_at as any).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      }) 
                    : 'Selesai'}
                </div>
                <button className="flex items-center gap-2 text-indigo-600 font-black text-xs hover:gap-3 transition-all">
                  <FileText size={16} /> DETAIL SESI
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RiwayatKonsultasi;