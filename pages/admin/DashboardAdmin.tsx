
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/mockSupabase';
import { UserProfile, School, Agenda, Article, ForumPost, MoodLog } from '../../types';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { 
  Users, School as SchoolIcon, FileText, Calendar, Trash2, 
  ShieldCheck, Search, Activity, BarChart3, MessageSquare, 
  Plus, Building, Mail, Phone, MapPin, PieChart, TrendingUp,
  X, AlertTriangle, Image as ImageIcon, Globe, Clock, AlignLeft,
  Settings
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Form';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register ChartJS Components
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, 
  ArcElement, Title, Tooltip, Legend, Filler
);

export const DashboardAdmin: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Data Lists
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [forums, setForums] = useState<ForumPost[]>([]);
  const [allMoodLogs, setAllMoodLogs] = useState<MoodLog[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  // --- DELETE STATE ---
  const [deleteTarget, setDeleteTarget] = useState<{ type: string, id: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- MODAL STATES ---
  const [showUserModal, setShowUserModal] = useState(false);
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [showAgendaModal, setShowAgendaModal] = useState(false);
  const [showArticleModal, setShowArticleModal] = useState(false);

  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionTarget, setSubscriptionTarget] = useState<School | null>(null);
  const [subForm, setSubForm] = useState({ plan: 'free', expiresAt: '' });

  // --- FORM STATES ---
  const [newUser, setNewUser] = useState({
    full_name: '', email: '', username: '', password: '', role: 'kader', school_name: ''
  });
  const [newSchool, setNewSchool] = useState({
    school_name: '', address: '', contact_email: '', phone: ''
  });
  const [newAgenda, setNewAgenda] = useState({
    title: '', date: '', time: '', type: 'Online', location: '', description: ''
  });
  const [newArticle, setNewArticle] = useState({
    title: '', category: 'Edukasi', content: '', image_url: ''
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'overview') {
         const [u, logs, s] = await Promise.all([
             api.getUsers(),
             api.getAllMoodLogs(),
             api.getAdminStats()
         ]);
         setUsers(u);
         setAllMoodLogs(logs);
         setStats(s);
      }
      if (activeTab === 'users') {
         const [u, s] = await Promise.all([api.getUsers(), api.getSchools()]);
         setUsers(u);
         setSchools(s);
      }
      if (activeTab === 'schools') setSchools(await api.getSchools());
      if (activeTab === 'articles') setArticles(await api.getArticles());
      if (activeTab === 'forum') setForums(await api.getForumPosts());
      if (activeTab === 'agendas') setAgendas(await api.getAgendas());
    } catch (e) {
      toast.error("Gagal memuat data");
    } finally {
      setIsLoading(false);
    }
  };

  // --- DELETE HANDLERS ---
  const requestDelete = (e: React.MouseEvent, type: string, id: string) => {
      e.stopPropagation();
      setDeleteTarget({ type, id });
  };

  const confirmDelete = async () => {
      if (!deleteTarget) return;
      setIsDeleting(true);
      const { type, id } = deleteTarget;

      // Validation: Prevent self-delete
      if (type === 'user' && user?.id === id) {
          toast.error("Anda tidak dapat menghapus akun sendiri!");
          setIsDeleting(false);
          setDeleteTarget(null);
          return;
      }
      
      try {
          if (type === 'user') {
              setUsers(prev => prev.filter(u => u.id !== id));
              await api.deleteUser(id);
          }
          if (type === 'school') {
              setSchools(prev => prev.filter(s => s.id !== id));
              await api.deleteSchool(id);
          }
          if (type === 'article') {
              setArticles(prev => prev.filter(a => a.id !== id));
              await api.deleteArticle(id);
          }
          if (type === 'agenda') {
              setAgendas(prev => prev.filter(a => a.id !== id));
              await api.deleteAgenda(id);
          } 
          if (type === 'forum') {
              setForums(prev => prev.filter(f => f.id !== id));
              await api.deleteForumPost(id);
          }
          
          toast.success("Data berhasil dihapus selamanya.");
          setDeleteTarget(null);
      } catch (e) {
          toast.error("Gagal menghapus data di server.");
          loadData(); // Reload to sync if failed
      } finally {
          setIsDeleting(false);
      }
  };

  // --- CREATE HANDLERS ---
  const handleCreateUser = async () => {
      if (!newUser.full_name || !newUser.username || !newUser.password || !newUser.role) {
          return toast.error("Mohon lengkapi data wajib.");
      }
      try {
          await api.createProfessionalUser(newUser);
          toast.success("Akun Staf Berhasil Dibuat!");
          setShowUserModal(false);
          setNewUser({ full_name: '', email: '', username: '', password: '', role: 'kader', school_name: '' });
          loadData();
      } catch (e) {
          toast.error("Gagal membuat user.");
      }
  };

  const handleCreateSchool = async () => {
      if (!newSchool.school_name) return toast.error("Nama sekolah wajib diisi");
      try {
          await api.addSchool(newSchool);
          toast.success("Sekolah Berhasil Ditambahkan!");
          setShowSchoolModal(false);
          setNewSchool({ school_name: '', address: '', contact_email: '', phone: '' });
          loadData();
      } catch (e) {
          toast.error("Gagal menambahkan sekolah.");
      }
  };

  const handleUpdateSubscription = async () => {
      if (!subscriptionTarget) return;
      try {
          await api.updateSchoolSubscription(subscriptionTarget.id, subForm.plan as any, subForm.expiresAt || null);
          toast.success("Paket Berlangganan Diperbarui!");
          setShowSubscriptionModal(false);
          loadData();
      } catch (e) {
          toast.error("Gagal memperbarui paket.");
      }
  };

  const handleCreateAgenda = async () => {
      if (!newAgenda.title || !newAgenda.date) return toast.error("Judul dan Tanggal wajib diisi");
      try {
          await api.createAgenda({ ...newAgenda, author_kader_id: user?.id || 'admin' });
          toast.success("Agenda Berhasil Dibuat!");
          setShowAgendaModal(false);
          setNewAgenda({ title: '', date: '', time: '', type: 'Online', location: '', description: '' });
          loadData();
      } catch (e) {
          toast.error("Gagal membuat agenda.");
      }
  };

  const handleCreateArticle = async () => {
      if (!newArticle.title || !newArticle.content) return toast.error("Judul dan Konten wajib diisi");
      try {
          await api.createArticle({ ...newArticle, author_id: user?.id || 'admin', author_name: user?.full_name || 'Admin' });
          toast.success("Artikel Berhasil Diterbitkan!");
          setShowArticleModal(false);
          setNewArticle({ title: '', category: 'Edukasi', content: '', image_url: '' });
          loadData();
      } catch (e) {
          toast.error("Gagal membuat artikel.");
      }
  };

  // --- CHART DATA ---
  const moodTrendData = useMemo(() => {
      const days = [...Array(7)].map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return d.toISOString().split('T')[0];
      });
      const counts = days.map(day => allMoodLogs.filter(log => log.timestamp.startsWith(day)).length);
      return {
          labels: days.map(d => new Date(d).toLocaleDateString('id-ID', { weekday: 'short' })),
          datasets: [{
              label: 'Jumlah Check-in',
              data: counts,
              borderColor: '#3B82F6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              fill: true,
              tension: 0.4
          }]
      };
  }, [allMoodLogs]);

  const schoolDistributionData = useMemo(() => {
      const schoolCounts: Record<string, number> = {};
      users.filter(u => u.role === 'user' && u.school_name).forEach(u => {
          const s = u.school_name || 'Lainnya';
          schoolCounts[s] = (schoolCounts[s] || 0) + 1;
      });
      const sorted = Object.entries(schoolCounts).sort((a,b) => b[1] - a[1]).slice(0, 5);
      return {
          labels: sorted.map(s => s[0]),
          datasets: [{
              label: 'Jumlah Siswa',
              data: sorted.map(s => s[1]),
              backgroundColor: '#818CF8',
              borderRadius: 8
          }]
      };
  }, [users]);

  const userDistributionData = useMemo(() => {
      const roles = {
          'Siswa': users.filter(u => u.role === 'user').length,
          'Kader': users.filter(u => u.role === 'kader').length,
          'Guru BK': users.filter(u => u.role === 'bk').length,
          'Psikolog': users.filter(u => u.role === 'psychologist').length
      };
      return {
          labels: Object.keys(roles),
          datasets: [{
              data: Object.values(roles),
              backgroundColor: ['#60A5FA', '#34D399', '#FBBF24', '#F472B6'],
              borderWidth: 0
          }]
      };
  }, [users]);

  const sidebarItems = [
    { id: 'overview', label: 'Statistik', icon: Activity, onClick: () => setActiveTab('overview') },
    { id: 'users', label: 'Pengguna', icon: Users, onClick: () => setActiveTab('users') },
    { id: 'schools', label: 'Sekolah', icon: SchoolIcon, onClick: () => setActiveTab('schools') },
    { id: 'agendas', label: 'Agenda', icon: Calendar, onClick: () => setActiveTab('agendas') },
    { id: 'articles', label: 'Artikel', icon: FileText, onClick: () => setActiveTab('articles') },
    { id: 'forum', label: 'Forum', icon: MessageSquare, onClick: () => setActiveTab('forum') },
  ];

  return (
    <DashboardLayout title="Admin Panel" roleLabel="Super Admin" sidebarItems={sidebarItems} activeItem={activeTab}>
        <div className="p-8 pb-32">
           <h2 className="text-3xl font-black text-slate-900 mb-8 capitalize tracking-tight flex items-center gap-3">
              {activeTab === 'overview' ? <BarChart3 size={32}/> : null}
              {activeTab} Management
           </h2>
           
           {isLoading ? (
               <LoadingSpinner />
           ) : (
               <>
                 {/* OVERVIEW */}
                 {activeTab === 'overview' && stats && (
                    <div className="space-y-8 animate-in fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatsCard title="Total Pengguna" value={stats.totalUsers} icon={Users} color="bg-blue-500" />
                            <StatsCard title="Siswa Aktif" value={stats.totalStudents} icon={SchoolIcon} color="bg-indigo-500" />
                            <StatsCard title="Mood Terpantau" value={stats.moodLogsCount} icon={Activity} color="bg-emerald-500" />
                            <StatsCard title="Diskusi Forum" value={stats.totalPosts} icon={MessageSquare} color="bg-amber-500" />
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card className="p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <TrendingUp size={20} className="text-blue-500"/>
                                    <h3 className="font-bold text-slate-700">Aktivitas Mood (7 Hari)</h3>
                                </div>
                                <div className="h-64"><Line data={moodTrendData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { display: false } }, x: { grid: { display: false } } } }} /></div>
                            </Card>
                            <Card className="p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <SchoolIcon size={20} className="text-indigo-500"/>
                                    <h3 className="font-bold text-slate-700">Top 5 Sekolah Partisipan</h3>
                                </div>
                                <div className="h-64"><Bar data={schoolDistributionData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} /></div>
                            </Card>
                            <Card className="p-6 lg:col-span-2 flex flex-col md:flex-row items-center gap-8">
                                <div className="w-full md:w-1/3 h-64 relative">
                                    <Doughnut data={userDistributionData} options={{ responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'bottom' } } }} />
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="text-center"><p className="text-3xl font-black text-slate-800">{users.length}</p><p className="text-xs font-bold text-slate-400 uppercase">Akun</p></div>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-black text-xl text-slate-800 mb-2">Komposisi Ekosistem</h3>
                                    <p className="text-slate-500 text-sm mb-4">Distribusi peran pengguna dalam aplikasi KitaSohib.</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        {Object.entries(userDistributionData.labels).map(([idx, label]) => (
                                            <div key={label} className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: userDistributionData.datasets[0].backgroundColor[Number(idx)] }}></div>
                                                <span className="text-xs font-bold text-slate-600">{label}: {userDistributionData.datasets[0].data[Number(idx)]}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                 )}

                 {/* USERS */}
                 {activeTab === 'users' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="flex justify-between items-center">
                           <div className="flex gap-2">
                              {['Semua', 'Kader', 'BK', 'Psikolog'].map(filter => (
                                  <Badge key={filter} variant="outline" className="cursor-pointer hover:bg-slate-100">{filter}</Badge>
                              ))}
                           </div>
                           <Button onClick={() => setShowUserModal(true)} size="sm">
                              <Plus size={16} className="mr-2"/> Tambah Staf
                           </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {users.map(u => (
                                <Card key={u.id} className="flex flex-col gap-4 group relative overflow-hidden p-5">
                                    <div className="flex items-center gap-4">
                                        <img src={u.avatar_url} className="w-12 h-12 rounded-xl bg-slate-100" />
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-slate-800 truncate">{u.full_name}</h4>
                                            <p className="text-[10px] text-slate-400 font-black uppercase">{u.username}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-auto">
                                       <Badge variant={u.role === 'user' ? 'neutral' : 'primary'}>{u.role}</Badge>
                                       {u.school_name && <Badge variant="outline">{u.school_name}</Badge>}
                                    </div>
                                    <button onClick={(e) => requestDelete(e, 'user', u.id)} className="absolute top-4 right-4 p-2 bg-white text-slate-300 hover:text-red-500 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-all border border-slate-100">
                                        <Trash2 size={16}/>
                                    </button>
                                </Card>
                            ))}
                        </div>
                    </div>
                 )}

                 {/* SCHOOLS */}
                 {activeTab === 'schools' && (
                    <div className="space-y-8 animate-in fade-in">
                        <div className="flex justify-end">
                            <Button onClick={() => setShowSchoolModal(true)} size="sm">
                                <Plus size={16} className="mr-2"/> Tambah Sekolah
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {schools.map(s => (
                                <Card key={s.id} className="group relative flex flex-col justify-between h-full">
                                    <div>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Building size={20} /></div>
                                            <span className="font-black text-slate-800 text-lg leading-tight">{s.school_name}</span>
                                        </div>
                                        <div className="space-y-2 mb-4">
                                            {s.address && <p className="text-xs text-slate-500 flex items-center gap-2"><MapPin size={12}/> {s.address}</p>}
                                            {s.phone && <p className="text-xs text-slate-500 flex items-center gap-2"><Phone size={12}/> {s.phone}</p>}
                                        </div>
                                        <div className="flex gap-2">
                                            <Badge variant={s.subscription_plan === 'premium' ? 'success' : (s.subscription_plan === 'pro' ? 'warning' : 'neutral')}>{s.subscription_plan === 'premium' ? 'Premium' : (s.subscription_plan === 'pro' ? 'Pro' : 'Free')}</Badge>
                                            {(s.subscription_end_date || s.subscription_expires_at) && s.subscription_plan !== 'free' && (
                                                <Badge variant="outline">{new Date((s.subscription_end_date || s.subscription_expires_at) as string).toLocaleDateString()}</Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-slate-50 flex justify-between items-center mt-4">
                                        <div className="flex gap-2">
                                            <button onClick={() => {
                                                setSubscriptionTarget(s);
                                                const endDate = s.subscription_end_date || s.subscription_expires_at;
                                                setSubForm({ plan: s.subscription_plan || 'free', expiresAt: endDate ? endDate.split('T')[0] : '' });
                                                setShowSubscriptionModal(true);
                                            }} className="text-slate-400 hover:text-indigo-600 p-2 border border-slate-100 rounded-lg hover:bg-slate-50 transition-all flex gap-2 items-center text-xs font-bold"><Settings size={14}/> Kelola Paket</button>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-300">ID: {s.id.substring(0,6)}</span>
                                        <button onClick={(e) => requestDelete(e, 'school', s.id)} className="text-slate-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all"><Trash2 size={18}/></button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                 )}

                 {/* AGENDAS */}
                 {activeTab === 'agendas' && (
                    <div className="space-y-8 animate-in fade-in">
                        <div className="flex justify-end">
                            <Button onClick={() => setShowAgendaModal(true)} size="sm">
                                <Plus size={16} className="mr-2"/> Tambah Agenda
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {agendas.map(a => (
                                <Card key={a.id} className="group relative">
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge variant={a.type === 'Online' ? 'primary' : 'warning'}>{a.type}</Badge>
                                        <button onClick={(e) => requestDelete(e, 'agenda', a.id)} className="text-slate-300 hover:text-red-500 p-1"><Trash2 size={16}/></button>
                                    </div>
                                    <h4 className="font-black text-slate-900 mb-1">{a.title}</h4>
                                    <p className="text-xs text-slate-500 font-bold flex items-center gap-1"><Calendar size={12}/> {a.date} • {a.time}</p>
                                </Card>
                            ))}
                            {agendas.length === 0 && <p className="text-slate-400">Belum ada agenda.</p>}
                        </div>
                    </div>
                 )}

                 {/* ARTICLES */}
                 {activeTab === 'articles' && (
                    <div className="space-y-8 animate-in fade-in">
                        <div className="flex justify-end">
                            <Button onClick={() => setShowArticleModal(true)} size="sm">
                                <Plus size={16} className="mr-2"/> Tulis Artikel
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {articles.map(a => (
                                <Card key={a.id} className="flex gap-4 group relative overflow-hidden">
                                    <img src={a.image_url} className="w-24 h-24 rounded-xl object-cover bg-slate-100 shrink-0" />
                                    <div className="flex-1 min-w-0 py-1">
                                        <Badge variant="neutral" className="mb-2">{a.category}</Badge>
                                        <h4 className="font-bold text-slate-900 line-clamp-2">{a.title}</h4>
                                        <p className="text-[10px] text-slate-400 mt-1">Oleh: {a.author_name}</p>
                                    </div>
                                    <button onClick={(e) => requestDelete(e, 'article', a.id)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500"><Trash2 size={18}/></button>
                                </Card>
                            ))}
                        </div>
                    </div>
                 )}

                 {/* FORUM */}
                 {activeTab === 'forum' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                        {forums.map(f => (
                            <Card key={f.id} className="group relative">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${f.is_anonymous ? 'bg-slate-200' : 'bg-primary-100 text-primary-600'}`}>
                                        {f.is_anonymous ? <ShieldCheck size={14}/> : <span className="font-black text-xs">{f.user_name?.[0]}</span>}
                                    </div>
                                    <div>
                                        <p className="font-bold text-xs text-slate-800">{f.is_anonymous ? 'Anonim' : f.user_name}</p>
                                        <p className="text-[9px] text-slate-400">{new Date(f.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600 italic line-clamp-2 mb-4">"{f.content}"</p>
                                <button onClick={(e) => requestDelete(e, 'forum', f.id)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                            </Card>
                        ))}
                    </div>
                 )}
               </>
           )}
        </div>

        {/* --- CONFIRM DELETE MODAL --- */}
        <AnimatePresence>
            {deleteTarget && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl text-center relative">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle size={32} /></div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">Hapus Permanen?</h3>
                        <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">Data yang dihapus tidak dapat dikembalikan lagi. Anda yakin?</p>
                        <div className="flex gap-4">
                            <button onClick={() => setDeleteTarget(null)} className="flex-1 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-all">Batal</button>
                            <button onClick={confirmDelete} disabled={isDeleting} className="flex-1 py-4 bg-red-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-red-500/30 active:scale-95 transition-all">{isDeleting ? 'Menghapus...' : 'Ya, Hapus'}</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

        {/* --- MODALS CREATE --- */}

        {/* User Modal */}
        <AnimatePresence>
            {showUserModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl">
                        <h3 className="font-black text-xl text-slate-800 mb-6">Tambah Akun Staf</h3>
                        <div className="space-y-4">
                            <Input label="Nama Lengkap" value={newUser.full_name} onChange={e => setNewUser({...newUser, full_name: e.target.value})} />
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Username" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
                                <Input label="Email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Password" type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                                <Select label="Role" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} options={[{ value: 'kader', label: 'Kader Jiwa' }, { value: 'bk', label: 'Guru BK' }, { value: 'psychologist', label: 'Psikolog' }, { value: 'admin', label: 'Admin Lain' }]} />
                            </div>
                            {newUser.role === 'bk' && (<div className="bg-amber-50 p-4 rounded-2xl border border-amber-100"><Select label="Penempatan Sekolah" value={newUser.school_name} onChange={e => setNewUser({...newUser, school_name: e.target.value})} options={[{ value: '', label: '-- Pilih Sekolah --' }, ...schools.map(s => ({ value: s.school_name, label: s.school_name }))] } /></div>)}
                            <div className="flex gap-3 pt-4"><Button variant="ghost" onClick={() => setShowUserModal(false)} className="flex-1">Batal</Button><Button onClick={handleCreateUser} className="flex-1">Buat Akun</Button></div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

        {/* School Modal */}
        <AnimatePresence>
            {showSchoolModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl">
                        <h3 className="font-black text-xl text-slate-800 mb-6">Tambah Data Sekolah</h3>
                        <div className="space-y-4">
                            <Input label="Nama Sekolah" value={newSchool.school_name} onChange={e => setNewSchool({...newSchool, school_name: e.target.value})} />
                            <Textarea label="Alamat Lengkap" value={newSchool.address} onChange={e => setNewSchool({...newSchool, address: e.target.value})} />
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Email Kontak" value={newSchool.contact_email} onChange={e => setNewSchool({...newSchool, contact_email: e.target.value})} />
                                <Input label="No. Telepon" value={newSchool.phone} onChange={e => setNewSchool({...newSchool, phone: e.target.value})} />
                            </div>
                            <div className="flex gap-3 pt-4"><Button variant="ghost" onClick={() => setShowSchoolModal(false)} className="flex-1">Batal</Button><Button onClick={handleCreateSchool} className="flex-1">Simpan Data</Button></div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

        {/* Agenda Modal */}
        <AnimatePresence>
            {showAgendaModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl">
                        <h3 className="font-black text-xl text-slate-800 mb-6">Buat Agenda Baru</h3>
                        <div className="space-y-4">
                            <Input label="Judul Agenda" value={newAgenda.title} onChange={e => setNewAgenda({...newAgenda, title: e.target.value})} />
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Tanggal" type="date" value={newAgenda.date} onChange={e => setNewAgenda({...newAgenda, date: e.target.value})} />
                                <Input label="Waktu" type="time" value={newAgenda.time} onChange={e => setNewAgenda({...newAgenda, time: e.target.value})} />
                            </div>
                            <Select label="Tipe" value={newAgenda.type} onChange={e => setNewAgenda({...newAgenda, type: e.target.value})} options={[{value:'Online', label:'Online (Zoom/Meet)'}, {value:'Offline', label:'Offline (Tatap Muka)'}]} />
                            <Input label="Lokasi / Link" value={newAgenda.location} onChange={e => setNewAgenda({...newAgenda, location: e.target.value})} />
                            <Textarea label="Deskripsi" value={newAgenda.description} onChange={e => setNewAgenda({...newAgenda, description: e.target.value})} />
                            <div className="flex gap-3 pt-4"><Button variant="ghost" onClick={() => setShowAgendaModal(false)} className="flex-1">Batal</Button><Button onClick={handleCreateAgenda} className="flex-1">Terbitkan</Button></div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

        {/* Article Modal */}
        <AnimatePresence>
            {showArticleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
                        <h3 className="font-black text-xl text-slate-800 mb-6">Tulis Artikel Baru</h3>
                        <div className="space-y-4">
                            <Input label="Judul Artikel" value={newArticle.title} onChange={e => setNewArticle({...newArticle, title: e.target.value})} />
                            <Select label="Kategori" value={newArticle.category} onChange={e => setNewArticle({...newArticle, category: e.target.value})} options={[{value:'Edukasi', label:'Edukasi'}, {value:'Kesehatan', label:'Kesehatan'}, {value:'Tips', label:'Tips & Trik'}]} />
                            <div className="flex gap-2 items-end">
                                <div className="flex-1"><Input label="URL Gambar" value={newArticle.image_url} onChange={e => setNewArticle({...newArticle, image_url: e.target.value})} /></div>
                                <div className="p-4 bg-slate-100 rounded-2xl mb-1"><ImageIcon size={20} className="text-slate-400"/></div>
                            </div>
                            <Textarea label="Konten Artikel" value={newArticle.content} onChange={e => setNewArticle({...newArticle, content: e.target.value})} className="h-40" />
                            <div className="flex gap-3 pt-4"><Button variant="ghost" onClick={() => setShowArticleModal(false)} className="flex-1">Batal</Button><Button onClick={handleCreateArticle} className="flex-1">Posting</Button></div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

        {/* Subscription Modal */}
        <AnimatePresence>
            {showSubscriptionModal && subscriptionTarget && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                            <Settings size={24}/>
                        </div>
                        <h3 className="font-black text-xl text-slate-800 mb-2">Paket & Tagihan</h3>
                        <p className="text-xs text-slate-500 mb-6 font-medium">Kelola akses fitur premium untuk <span className="font-bold text-slate-700">{subscriptionTarget.school_name}</span>.</p>
                        
                        <div className="space-y-5">
                            <Select 
                                label="Status Paket" 
                                value={subForm.plan} 
                                onChange={e => setSubForm({...subForm, plan: e.target.value})} 
                                options={[
                                    {value: 'free', label: 'Basic / Free'}, 
                                    {value: 'pro', label: 'PRO (Monitoring & Ekspor)'},
                                    {value: 'premium', label: 'Premium (White-label)'}
                                ]} 
                            />
                            
                            {(subForm.plan === 'pro' || subForm.plan === 'premium') && (
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <Input 
                                        label="Berlaku Sampai (Tgl Kedaluwarsa)" 
                                        type="date" 
                                        value={subForm.expiresAt} 
                                        onChange={e => setSubForm({...subForm, expiresAt: e.target.value})} 
                                    />
                                    <p className="text-[10px] text-slate-400 mt-2">Untuk menyetop langganan, cukup ubah status Paket ke "Basic / Free". Kosongkan tanggal ini jika paket berlaku selamanya.</p>
                                </div>
                            )}
                            
                            <div className="flex gap-3 pt-4">
                                <Button variant="ghost" onClick={() => setShowSubscriptionModal(false)} className="flex-1">Batal</Button>
                                <Button onClick={handleUpdateSubscription} className="flex-1">Simpan</Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

    </DashboardLayout>
  );
};

// Helper Component for Stats
const StatsCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-4">
        <div className={`p-4 rounded-2xl text-white ${color} shadow-lg shadow-gray-200`}>
            <Icon size={24} />
        </div>
        <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{title}</p>
            <h4 className="text-3xl font-black text-slate-900">{value}</h4>
        </div>
    </div>
);
