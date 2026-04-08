
import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/mockSupabase'; 
import { Referral, EmotionTestResult, Agenda } from '../../types';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardList, XCircle, MessageSquare, History, 
  Calendar, BarChart3, MessageCircle, Activity,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import RiwayatKonsultasi from './RiwayatKonsultasi';

// --- SUB COMPONENTS ---

const DetailTesEmosi: React.FC = () => {
  const [results, setResults] = useState<EmotionTestResult[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.getEmotionResults().then(data => { setResults(data); setLoading(false); }); }, []);
  if (loading) return <LoadingSpinner />;
  return (
    <div className="grid grid-cols-1 gap-4 animate-in fade-in">
      {results.map((res, i) => (
        <Card key={i} variant="white" padding="lg">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-black text-slate-800 text-xs">ID: {res.user_id.substring(0,8)}...</h4>
            <Badge variant={res.level === 'Berat' ? 'danger' : res.level === 'Sedang' ? 'warning' : 'success'}>Level: {res.level}</Badge>
          </div>
          <p className="text-sm text-slate-500 mb-4 bg-slate-50 p-4 rounded-xl italic font-medium border border-slate-100">"{res.ai_analysis}"</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {res.dimension_scores?.map((d: any, idx: number) => (
              <div key={idx} className="text-center p-2 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wide">{d.name || d.subject}</p>
                <p className="text-sm font-black text-slate-700">{d.score ?? d.value}</p>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
};

const KalenderAgenda: React.FC = () => {
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  useEffect(() => { api.getAgendas().then(setAgendas); }, []);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
      {agendas.map((item, i) => (
        <Card key={i} className="border-l-4 border-l-primary-500">
          <div className="flex items-center gap-3 mb-2">
            <Calendar size={16} className="text-primary-500" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{new Date(item.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
          <h4 className="font-black text-slate-800 text-lg">{item.title}</h4>
          <p className="text-sm text-slate-500 mt-1 line-clamp-2">{item.description}</p>
          <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
             <span className="text-[10px] font-bold px-2 py-1 bg-slate-50 rounded-md text-slate-500">{item.time}</span>
             <Badge variant={item.type==='Online' ? 'primary' : 'warning'}>{item.type}</Badge>
          </div>
        </Card>
      ))}
    </div>
  );
};

// --- MAIN DASHBOARD ---

export const DashboardPsychologist: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const pendingCount = useMemo(() => referrals.filter(r => r.status === 'pending').length, [referrals]);

  useEffect(() => {
    if (user) {
      loadData();
      const interval = setInterval(loadData, 30000); 
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadData = async () => {
    if (referrals.length === 0) setIsLoading(true);
    try {
      const data = await api.fetchPsychologistReferrals(user!.id);
      setReferrals(data);
    } catch (e) {
      console.error("Gagal sinkronisasi data rujukan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: Referral['status']) => {
    try {
      const updated = await api.updateReferralStatus(id, status);
      setReferrals(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r));
      
      // --- ISOLATED NOTIFICATION TRIGGER ---
      if (status === 'active' && selectedReferral) {
        try {
          api.addNotification(
            selectedReferral.user_id,
            'Konsultasi Diterima',
            'Rujukan Anda telah diterima oleh Psikolog. Mari kita mulai diskusi!',
            'referral',
            '/mobile/chat'
          );
        } catch (notifErr) {}
      }

      toast.success(`Status berhasil diubah ke ${status}`);
      setSelectedReferral(null);
    } catch (e) {
      toast.error("Gagal memproses rujukan");
    }
  };

  const filteredReferrals = referrals.filter(r => r.status === activeTab);

  const sidebarItems = [
    { id: 'pending', icon: ClipboardList, label: 'Antrean Rujukan', onClick: () => setActiveTab('pending'), badge: pendingCount || undefined },
    { id: 'active', icon: MessageSquare, label: 'Konsultasi Aktif', onClick: () => setActiveTab('active') },
    { id: 'completed', icon: History, label: 'Riwayat', onClick: () => setActiveTab('completed') },
    { id: 'emotion_detail', icon: BarChart3, label: 'Detail Tes Emosi', onClick: () => setActiveTab('emotion_detail') },
    { id: 'agenda', icon: Calendar, label: 'Kalender Agenda', onClick: () => setActiveTab('agenda') },
    { id: 'chat_kader', icon: MessageCircle, label: 'Diskusi Kader', onClick: () => navigate('/dashboard/psychologist/chat', { state: { initialTab: 'colleagues' } }) },
  ];

  return (
    <DashboardLayout title="Panel Klinis" subtitle="Manajemen Konseling" roleLabel="Psikolog" sidebarItems={sidebarItems} activeItem={activeTab}>
      <div className="p-6 md:p-10 pb-32">
        <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500"><h2 className="text-3xl font-black text-slate-900 tracking-tight capitalize">{activeTab.replace('_', ' ')}</h2><p className="text-slate-500 mt-2 font-medium">Kelola data dan intervensi klinis untuk kesejahteraan siswa.</p></div>
        {activeTab === 'completed' && <RiwayatKonsultasi />}
        {activeTab === 'emotion_detail' && <DetailTesEmosi />}
        {activeTab === 'agenda' && <KalenderAgenda />}
        {(activeTab === 'pending' || activeTab === 'active') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in">
              {isLoading ? (<LoadingSpinner />) : filteredReferrals.length > 0 ? (
                filteredReferrals.map(referral => (
                  <Card key={referral.id} interactive className="group">
                     <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                           <img src={referral.user_avatar} className="w-16 h-16 rounded-[1.5rem] object-cover border border-slate-100 shadow-sm" alt="avatar" />
                           <div><h4 className="font-black text-slate-900 text-lg">{referral.user_name}</h4><Badge variant="danger">Mood Score: {referral.mood_score}</Badge></div>
                        </div>
                     </div>
                     <div className="bg-slate-50 rounded-2xl p-5 mb-6 border border-slate-100"><p className="text-sm text-slate-500 italic font-medium leading-relaxed">"{referral.notes}"</p></div>
                     <div className="flex items-center justify-between pt-6 border-t border-slate-100"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kader: {referral.kader_name}</p>{activeTab === 'pending' ? (<Button size="sm" onClick={() => setSelectedReferral(referral)}>Tinjau Detail</Button>) : (<Button size="sm" variant="secondary" onClick={() => navigate('/dashboard/psychologist/chat', { state: { initialUserId: referral.user_id, initialTab: 'patients' } })}>Hubungi Pasien</Button>)}</div>
                  </Card>
                ))
              ) : (<div className="col-span-full py-24 text-center bg-white rounded-[3rem] border border-dashed border-slate-200"><ClipboardList size={48} className="mx-auto text-slate-200 mb-6" /><p className="text-slate-400 font-bold uppercase text-sm tracking-widest">Data {activeTab} Belum Tersedia</p></div>)}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedReferral && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-xl rounded-[3rem] p-10 overflow-hidden shadow-2xl relative">
                <div className="flex justify-between items-start mb-8"><h3 className="text-2xl font-black text-slate-900 tracking-tight">Evaluasi Klinis</h3><button onClick={() => setSelectedReferral(null)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:bg-slate-100 transition-colors"><XCircle size={20} /></button></div>
                <div className="space-y-6 mb-8">
                   <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100"><img src={selectedReferral.user_avatar} className="w-14 h-14 rounded-2xl object-cover shadow-sm" alt="avatar" /><div><p className="font-black text-slate-900 text-lg">{selectedReferral.user_name}</p><p className="text-xs font-bold text-primary-500 uppercase tracking-wider">Status: Pending Review</p></div></div>
                   <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block px-1">Observasi Kader</label><div className="text-sm font-medium text-slate-600 bg-amber-50/50 p-6 rounded-[2rem] border border-amber-100 leading-relaxed italic relative"><span className="absolute -top-3 left-6 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[9px] font-black uppercase">Notes</span>"{selectedReferral.notes}"</div></div>
                </div>
                <div className="flex gap-4"><Button variant="ghost" onClick={() => setSelectedReferral(null)} className="flex-1">Kembali</Button><Button onClick={() => handleUpdateStatus(selectedReferral.id, 'active')} className="flex-1">Mulai Konsultasi</Button></div>
              </motion.div>
            </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};
