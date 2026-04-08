
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/mockSupabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, Calendar, Globe, MapPin, 
  HeartPulse, MessageCircle, PenTool, CheckCircle2, CloudSun, ArrowRight,
  Circle, Users, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Agenda } from '../../types';
import { SohibCharacter } from '../../components/SohibCharacter';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { KaderHorizontalList } from './components/KaderHorizontalList';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { DailyJournalModal } from '../../components/DailyJournalModal';

// Interface Notifikasi Fungsional
interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  type: string;
  link?: string;
  created_at: string;
}

export const Home: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [moodLevel, setMoodLevel] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasLogged, setHasLogged] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [showJournal, setShowJournal] = useState(false); 
  const [joiningId, setJoiningId] = useState<string | null>(null);

  // --- NOTIFICATION SYSTEM ---
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  useEffect(() => {
    if (user?.id) {
       fetchNotifications();
       const notifInterval = setInterval(fetchNotifications, 30000);
       return () => clearInterval(notifInterval);
    }
  }, [user?.id]);

  const fetchNotifications = async () => {
    if (!user?.id) return;
    try {
      const data = await api.getNotifications(user.id);
      setNotifications(data);
    } catch (e) {}
  };

  const hasUnread = useMemo(() => notifications.some(n => !n.is_read), [notifications]);

  const markAllAsRead = async () => {
    if (!user?.id) return;
    const unread = notifications.filter(n => !n.is_read);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    try {
       unread.forEach(n => api.markNotifRead(n.id));
    } catch (e) {}
    toast.success("Notifikasi dibaca");
  };

  const handleNotifClick = (n: Notification) => {
    if (!n.is_read) api.markNotifRead(n.id);
    if (n.link) navigate(n.link);
    setShowNotifPanel(false);
  };

  // --- CORE DATA ---
  useEffect(() => {
    loadAgendas();
  }, []);

  const loadAgendas = async () => {
    setIsLoadingData(true);
    try {
      const agendasRes = await api.getAgendas();
      setAgendas(Array.isArray(agendasRes) ? agendasRes : []);
    } catch (e) {
      console.error("Failed to load home data", e);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleMoodSubmit = async () => {
    if (!user?.id) return;
    setIsSubmitting(true);
    try {
      await api.logMood(user.id, moodLevel, `Mood level ${moodLevel} recorded via Home slider.`);
      toast.success("Perasaanmu tersimpan aman! ✨");
      setHasLogged(true);
    } catch (e) {
      toast.error("Gagal mencatat mood.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinAgenda = async (agenda: Agenda) => {
    if (!user) return;
    setJoiningId(agenda.id);
    try {
      const success = await api.joinAgenda(agenda.id, user.id);
      if (success) {
        toast.success("Berhasil bergabung! Notifikasi pengingat telah dikirim.");
        // Refresh agendas locally to update UI
        setAgendas(prev => prev.map(a => 
          a.id === agenda.id 
            ? { ...a, participants: [...(a.participants || []), user.id] } 
            : a
        ));
      } else {
        toast("Kamu sudah terdaftar di acara ini.", { icon: 'ℹ️' });
      }
    } catch (e) {
      toast.error("Gagal bergabung.");
    } finally {
      setJoiningId(null);
    }
  };

  // Helper to format date safely without timezone shifting
  // Input: "2023-10-25" (YYYY-MM-DD)
  // Output: "Sabtu, 25 Oktober 2023"
  const formatAgendaDate = (dateString: string) => {
    if (!dateString) return '-';
    const [year, month, day] = dateString.split('-').map(Number);
    // Create date object using local constructor arguments to avoid UTC shift
    const date = new Date(year, month - 1, day); 
    return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (isLoadingData) return <div className="min-h-screen pt-20 flex items-center justify-center bg-white"><LoadingSpinner label="Menyiapkan ruang amanmu..." /></div>;

  return (
    <div className="min-h-screen">
      {/* Header - Glass Effect */}
      <div className="px-6 pt-10 pb-6 flex justify-between items-center sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100/50">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Halo, {user?.full_name?.split(' ')[0]}! 👋</h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Langkah kecil hari ini 🌿</p>
        </div>
        
        {/* Notification Bell */}
        <div className="relative">
          <div 
            onClick={() => setShowNotifPanel(!showNotifPanel)}
            className="p-3 bg-white border border-slate-200 rounded-2xl cursor-pointer relative hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Bell size={22} className={hasUnread ? "text-primary-500" : "text-slate-400"} />
            {hasUnread && (
              <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-accent-500 border-2 border-white rounded-full animate-pulse shadow-sm"></span>
            )}
          </div>

          {/* Notification Dropdown Panel */}
          <AnimatePresence>
            {showNotifPanel && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowNotifPanel(false)} />
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 shadow-2xl rounded-[2rem] z-50 overflow-hidden"
                >
                  <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <span className="font-black text-[10px] uppercase tracking-widest text-slate-400">Pemberitahuan</span>
                    {hasUnread && <button onClick={markAllAsRead} className="text-[10px] font-black text-primary-600 uppercase hover:text-primary-700">Baca Semua</button>}
                  </div>
                  <div className="max-h-80 overflow-y-auto no-scrollbar">
                    {notifications.length > 0 ? (
                      notifications.map(n => (
                        <div 
                           key={n.id} 
                           onClick={() => handleNotifClick(n)}
                           className={`p-5 border-b border-slate-50 flex gap-3 cursor-pointer transition-colors active:bg-slate-50 ${!n.is_read ? 'bg-primary-50/40' : 'bg-transparent'}`}
                        >
                          <div className="mt-1">
                            {!n.is_read ? <Circle size={8} fill="currentColor" className="text-primary-500" /> : <Circle size={8} className="text-slate-200" />}
                          </div>
                          <div>
                            <p className={`text-xs font-black leading-tight ${!n.is_read ? 'text-slate-900' : 'text-slate-500'}`}>{n.title}</p>
                            <p className="text-[11px] text-slate-600 leading-relaxed mt-1">{n.message}</p>
                            <span className="text-[8px] font-black text-slate-300 mt-2 block uppercase tracking-widest">
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-12 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest leading-loose">
                         <Bell className="mx-auto mb-3 opacity-20" size={32} />
                         Belum ada kabar baru<br/>untukmu saat ini.
                      </div>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="px-6 pt-6 space-y-8 max-w-lg mx-auto">
        {/* Mood Hero Card - Enhanced Gradient */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-indigo-700 rounded-[3rem] p-8 shadow-xl shadow-primary-500/20 text-center text-white ring-1 ring-white/20">
           {/* Decorative BG pattern */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
           
           <div className="relative z-10">
             <div className="flex justify-between items-start mb-6">
                <div className="text-left">
                   <h2 className="text-lg font-black text-white mb-1">Apa kabar hatimu?</h2>
                   <p className="text-[10px] text-primary-100 uppercase tracking-[0.25em] font-bold">Check-in Harian</p>
                </div>
                <div className="p-2 bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner"><CloudSun size={20} /></div>
             </div>

             <motion.div key={moodLevel} animate={{ scale: hasLogged ? 1 : [1, 1.05, 1] }} className="mb-8 relative">
                <div className="absolute inset-0 bg-white/30 blur-2xl rounded-full scale-75"></div>
                <SohibCharacter mood={moodLevel} className="w-40 h-40 mx-auto drop-shadow-2xl relative z-10" />
             </motion.div>

             {!hasLogged ? (
               <div className="max-w-xs mx-auto space-y-6">
                 <input type="range" min="1" max="5" value={moodLevel} onChange={(e) => setMoodLevel(Number(e.target.value))} className="w-full h-3 bg-white/30 rounded-full appearance-none cursor-pointer accent-white hover:bg-white/40 transition-colors" />
                 <div className="grid grid-cols-2 gap-3 pt-2">
                    <button onClick={handleMoodSubmit} disabled={isSubmitting} className="w-full py-4 font-bold rounded-2xl text-xs uppercase bg-white/20 text-white hover:bg-white/30 backdrop-blur-md border border-white/20 transition-all active:scale-95">Cek Saja</button>
                    <button onClick={() => setShowJournal(true)} className="w-full py-4 font-bold rounded-2xl text-xs uppercase bg-white text-primary-600 shadow-lg flex items-center justify-center gap-2 hover:bg-primary-50 transition-all active:scale-95"><PenTool size={14} /> Isi Jurnal</button>
                 </div>
               </div>
             ) : (
                <div className="flex flex-col items-center gap-6">
                   <div className="bg-white/20 backdrop-blur-md text-white px-6 py-4 rounded-2xl text-xs font-bold flex items-center gap-3 border border-white/20"><CheckCircle2 size={18} /> Tersimpan</div>
                   <button onClick={() => setHasLogged(false)} className="text-[10px] text-white/70 font-black uppercase tracking-widest hover:text-white underline">Ubah Data</button>
                </div>
             )}
           </div>
        </div>

        {/* Action Grid - High Contrast */}
        <div className="grid grid-cols-2 gap-5">
           <Card variant="white" interactive onClick={() => navigate('/mobile/emotion-test')} className="relative group hover:border-accent-200">
              <div className="w-14 h-14 bg-accent-50 text-accent-500 rounded-[1.2rem] flex items-center justify-center mb-4 border border-accent-100 shadow-sm group-hover:bg-accent-500 group-hover:text-white transition-colors"><HeartPulse size={28}/></div>
              <h3 className="font-black text-slate-900 text-lg leading-none mb-2">Cek<br/>Emosi</h3>
              <p className="text-[9px] text-accent-600 font-black uppercase tracking-widest">Tes Kesehatan</p>
           </Card>
           
           <Card variant="white" interactive onClick={() => navigate('/mobile/chat')} className="relative group hover:border-secondary-200">
              <div className="w-14 h-14 bg-secondary-50 text-secondary-600 rounded-[1.2rem] flex items-center justify-center mb-4 border border-secondary-100 shadow-sm group-hover:bg-secondary-600 group-hover:text-white transition-colors"><MessageCircle size={28}/></div>
              <h3 className="font-black text-slate-900 text-lg leading-none mb-2">Sohib<br/>Chat</h3>
              <p className="text-[9px] text-secondary-700 font-black uppercase tracking-widest">AI & Teman</p>
           </Card>
        </div>

        <KaderHorizontalList />

        {/* Agendas */}
        <div>
           <div className="flex justify-between items-end mb-6 px-2">
              <div>
                <h2 className="font-black text-slate-900 text-lg tracking-tight">Agenda Komunitas</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Kegiatan Positif</p>
              </div>
           </div>
           
           <div className="flex gap-5 overflow-x-auto pb-10 no-scrollbar -mx-6 px-6 snap-x">
              {agendas.map((event) => {
                  const isJoined = user && event.participants?.includes(user.id);
                  const participantCount = event.participants?.length || 0;

                  return (
                    <Card key={event.id} variant="white" className="min-w-[280px] snap-center hover:border-primary-100 flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-5">
                                <div className={`w-14 h-14 rounded-[1.2rem] flex items-center justify-center shadow-sm ${event.type === 'Online' ? 'bg-primary-50 text-primary-600' : 'bg-amber-50 text-amber-600'}`}>
                                    {event.type === 'Online' ? <Globe size={24} /> : <MapPin size={24} />}
                                </div>
                                <Badge variant={event.type === 'Online' ? 'primary' : 'warning'}>{event.type}</Badge>
                            </div>
                            <h4 className="font-extrabold text-slate-900 text-lg mb-2 leading-tight line-clamp-2 min-h-[56px]">{event.title}</h4>
                            <div className="space-y-2 mb-6">
                                <div className="flex items-center gap-2 text-[11px] text-slate-500 font-bold uppercase">
                                    <Calendar size={14} className="text-slate-300" /> 
                                    {formatAgendaDate(event.date)}
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-slate-500 font-bold uppercase">
                                    <CloudSun size={14} className="text-slate-300" /> 
                                    {event.time} WIB
                                </div>
                                {participantCount > 0 && (
                                    <div className="flex items-center gap-2 text-[10px] text-primary-500 font-bold uppercase mt-2">
                                        <Users size={12} /> {participantCount} Teman Bergabung
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="pt-5 border-t border-slate-100">
                            {isJoined ? (
                                <div className="w-full py-3 rounded-2xl bg-emerald-50 text-emerald-600 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 border border-emerald-100">
                                    <Check size={16} /> Terdaftar
                                </div>
                            ) : (
                                <button 
                                    onClick={() => handleJoinAgenda(event)}
                                    disabled={joiningId === event.id}
                                    className="w-full py-3 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 active:scale-95 transition-all shadow-lg shadow-slate-200"
                                >
                                    {joiningId === event.id ? 'Memproses...' : 'Gabung Acara'} <ArrowRight size={14} />
                                </button>
                            )}
                        </div>
                    </Card>
                  );
              })}
              {agendas.length === 0 && (
                  <div className="min-w-[280px] p-8 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-100 rounded-[2rem] opacity-50">
                      <Calendar size={32} className="mb-2" />
                      <p className="text-xs font-bold uppercase">Belum ada agenda</p>
                  </div>
              )}
           </div>
        </div>
      </div>

      <AnimatePresence>
        {showJournal && (
          <DailyJournalModal 
            onClose={() => setShowJournal(false)}
            onSubmit={(data) => {
                const journalEntry = JSON.stringify(data);
                api.logMood(user!.id, moodLevel, `JOURNAL_ENTRY:${journalEntry}`);
                toast.success("Jurnal tersimpan!");
                setShowJournal(false);
                setHasLogged(true);
            }}
            isLoading={isSubmitting}
          />
        )}
      </AnimatePresence>
    </div>
  );
};