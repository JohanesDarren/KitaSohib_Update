
import React, { useEffect, useState } from 'react';
import { api } from '../../services/mockSupabase';
import { useAuth } from '../../context/AuthContext';
import { UserProfile, EmotionTestResult } from '../../types';
import {
  Users, Search, School, AlertTriangle, 
  BarChart3, ChevronRight, Activity, LayoutDashboard,
  Palette, Image as ImageIcon, Save, CreditCard, ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { StudentDetailView } from './components/StudentDetailView';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Form';
import { Button } from '../../components/ui/Button';

interface StudentData {
  profile: UserProfile;
  latestResult: EmotionTestResult | null;
  risk: 'Rendah' | 'Sedang' | 'Tinggi';
}

export const DashboardBK: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentData[]>([]);
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState<'Semua' | 'Tinggi' | 'Sedang' | 'Rendah'>('Semua');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  // Seed dari session cache agar render pertama langsung benar (tidak tunggu API)
  const [subscriptionInfo, setSubscriptionInfo] = useState<{ plan: string, isActive: boolean, endDate: string | null }>(() => {
    try {
      const stored = localStorage.getItem('ks_session');
      if (stored) {
        const u = JSON.parse(stored);
        const plan = u.school_subscription_plan || 'free';
        const endDateStr = u.school_subscription_end_date || null;
        const isActive = (plan === 'pro' || plan === 'premium') &&
          (!endDateStr || new Date(endDateStr).getTime() > Date.now());
        return { plan, isActive, endDate: endDateStr };
      }
    } catch(_) {}
    return { plan: 'free', isActive: false, endDate: null };
  });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'theme' | 'subscription'>('dashboard');
  const [themeForm, setThemeForm] = useState({ logo: '', color: '' });
  const [isSavingTheme, setIsSavingTheme] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<'pro' | 'premium' | null>(null);

  // --- QRIS State ---
  interface QrisData {
    order_id: string;
    transaction_id: string;
    qr_code_url: string | null;
    qr_string: string | null;
    gross_amount: number;
    expiry_time: string;
    plan: 'pro' | 'premium';
    school_id: string;
  }
  const [qrisData, setQrisData] = useState<QrisData | null>(null);
  const [isLoadingQris, setIsLoadingQris] = useState(false);
  const [qrisError, setQrisError] = useState<string | null>(null);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  // Derived: isPremium dihitung langsung dari subscriptionInfo (bukan state terpisah)
  const isPremium = (subscriptionInfo.plan === 'pro' || subscriptionInfo.plan === 'premium') &&
    (!subscriptionInfo.endDate || new Date(subscriptionInfo.endDate).getTime() > Date.now());

  useEffect(() => { 
    loadData();
    // Refresh live dari GAS untuk memastikan data terbaru (admin bisa update kapan saja)
    api.getSchoolSubscriptionInfo().then(info => {
        setSubscriptionInfo(info);
        // Update session cache dengan data subscription terbaru
        try {
          const stored = localStorage.getItem('ks_session');
          if (stored) {
            const u = JSON.parse(stored);
            u.school_subscription_plan = info.plan;
            u.school_subscription_end_date = info.endDate || null;
            localStorage.setItem('ks_session', JSON.stringify(u));
          }
        } catch(_) {}
        if (info.isActive) {
            api.getCurrentSchool().then(s => {
                if(s) setThemeForm({ logo: s.school_logo || '', color: s.school_color_hex || '' });
            });
        }
    });
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const allUsers = await api.getUsers();
      const allResults = await api.getEmotionResults();
      const filteredData = allUsers
        .filter(u => u.role === 'user' && u.school_id === user?.school_id)
        .map(u => {
          const userResults = allResults
            .filter((r: EmotionTestResult) => r.user_id === u.id)
            .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          const latest = userResults[0] || null;
          let risk: 'Rendah' | 'Sedang' | 'Tinggi' = 'Rendah';
          if (latest) {
            if (latest.score >= 71) risk = 'Tinggi';
            else if (latest.score >= 41) risk = 'Sedang';
          }
          return { profile: u, latestResult: latest, risk };
        });
      setStudents(filteredData);
    } catch (e) { 
      toast.error("Gagal memuat data"); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const total = students.length || 1;
  const counts = {
    Tinggi: students.filter(s => s.risk === 'Tinggi').length,
    Sedang: students.filter(s => s.risk === 'Sedang').length,
    Rendah: students.filter(s => s.risk === 'Rendah').length,
  };

  const filtered = students.filter(s => {
    const matchSearch = s.profile.full_name.toLowerCase().includes(search.toLowerCase());
    const matchRisk = filterRisk === 'Semua' || s.risk === filterRisk;
    return matchSearch && matchRisk;
  });

  const sidebarItems: any[] = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Overview', onClick: () => setActiveTab('dashboard') },
    // Tab Tema Kustom hanya muncul jika plan premium (bukan pro)
    ...(subscriptionInfo.plan === 'premium' && isPremium ? [{ id: 'theme', icon: Palette, label: 'Kustomisasi Tema', onClick: () => setActiveTab('theme') }] : []),
    { id: 'subscription', icon: CreditCard, label: 'Langganan', onClick: () => setActiveTab('subscription') }
  ];

  const handleSaveTheme = async () => {
     if (!user?.school_id) return;
     setIsSavingTheme(true);
     try {
         await api.updateSchoolTheme(user.school_id, themeForm.logo, themeForm.color);
         toast.success("Tema Kustom berhasil diperbarui! Muat ulang halaman untuk efek penuh.");
     } catch (e) {
         toast.error("Gagal memperbarui tema.");
     } finally {
         setIsSavingTheme(false);
     }
  };

  /**
   * Langkah 1: Buka modal & generate QRIS via backend
   */
  const handleInitiateQris = async () => {
    if (!checkoutPlan) return;
    setIsLoadingQris(true);
    setQrisError(null);
    setQrisData(null);
    try {
      const res = await fetch('/api/payments/qris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: checkoutPlan,
          school_id: user?.school_id || '',
          school_name: user?.school_name || 'Sekolah',
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.detail || json.error || 'Gagal membuat QRIS.');
      }
      setQrisData(json);
    } catch (e: any) {
      setQrisError(e.message || 'Terjadi kesalahan. Coba lagi.');
    } finally {
      setIsLoadingQris(false);
    }
  };

  /**
   * Langkah 2: User klik "Saya Sudah Bayar" → polling status ke backend
   * Jika sudah settlement, update subscription di GAS & refresh UI
   */
  const handleCheckPaymentStatus = async () => {
    if (!qrisData) return;
    setIsCheckingPayment(true);
    const toastId = toast.loading('Memverifikasi pembayaran...');
    try {
      const res = await fetch(`/api/payments/status/${qrisData.order_id}`);
      const status = await res.json();

      const isSuccess =
        status.transaction_status === 'settlement' ||
        (status.transaction_status === 'capture' && status.fraud_status === 'accept');

      if (isSuccess) {
        // Upgrade plan secara manual via GAS (backup untuk webhook)
        const result = await api.upgradeSchoolPlan(
          qrisData.school_id || String(user?.school_id || ''),
          qrisData.plan
        );
        const newEndDate = result.subscription_end_date || (() => {
          const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString();
        })();
        const newInfo = { plan: qrisData.plan, isActive: true, endDate: newEndDate };
        setSubscriptionInfo(newInfo);
        try {
          const stored = localStorage.getItem('ks_session');
          if (stored) {
            const u = JSON.parse(stored);
            u.school_subscription_plan = qrisData.plan;
            u.school_subscription_end_date = newEndDate;
            localStorage.setItem('ks_session', JSON.stringify(u));
          }
        } catch(_) {}
        setQrisData(null);
        setCheckoutPlan(null);
        setActiveTab('dashboard');
        toast.success(
          `🎉 Pembayaran Sukses! Paket ${qrisData.plan.toUpperCase()} aktif hingga ${new Date(newEndDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
          { id: toastId, duration: 6000 }
        );
      } else if (status.transaction_status === 'pending') {
        toast('⏳ Pembayaran belum diterima. Scan QRIS dan selesaikan pembayaran dulu.', { id: toastId, duration: 4000 });
      } else {
        toast.error(`Transaksi berstatus: ${status.transaction_status}. Coba buat QRIS baru.`, { id: toastId });
      }
    } catch (e: any) {
      toast.error(e.message || 'Gagal memeriksa status pembayaran.', { id: toastId });
    } finally {
      setIsCheckingPayment(false);
    }
  };

  /**
   * [SANDBOX ONLY] Simulasi pembayaran berhasil via backend endpoint
   * Backend akan langsung call updateSchoolSubscription via GAS
   * tanpa perlu Midtrans approve/webhook (karena QRIS tidak support approve API)
   */
  const handleSimulatePayment = async () => {
    if (!qrisData) return;
    setIsSimulating(true);
    const toastId = toast.loading('⚡ Mensimulasikan pembayaran...');
    try {
      const simRes = await fetch('/api/payments/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: qrisData.order_id,
          plan: qrisData.plan,
          school_id: qrisData.school_id || String(user?.school_id || ''),
        }),
      });
      const simJson = await simRes.json();
      if (!simRes.ok || !simJson.success) {
        throw new Error(simJson.detail || simJson.error || 'Simulasi gagal.');
      }

      // Backend sudah update GAS — update UI langsung tanpa perlu polling lagi
      const endDateISO = simJson.subscription_end_date || (() => {
        const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString();
      })();
      const newPlan = simJson.plan || qrisData.plan;
      const newInfo = { plan: newPlan, isActive: true, endDate: endDateISO };
      setSubscriptionInfo(newInfo);

      // Update localStorage session
      try {
        const stored = localStorage.getItem('ks_session');
        if (stored) {
          const u = JSON.parse(stored);
          u.school_subscription_plan = newPlan;
          u.school_subscription_end_date = endDateISO;
          localStorage.setItem('ks_session', JSON.stringify(u));
        }
      } catch(_) {}

      setQrisData(null);
      setCheckoutPlan(null);
      setActiveTab('dashboard');
      toast.success(
        `🎉 Simulasi Berhasil! Paket ${newPlan.toUpperCase()} aktif hingga ${new Date(endDateISO).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
        { id: toastId, duration: 6000 }
      );
    } catch (e: any) {
      toast.error(e.message || 'Simulasi gagal. Pastikan server berjalan dan QRIS sudah di-generate.', { id: toastId });
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <DashboardLayout
      title="BK Monitoring"
      subtitle={user?.school_name || "Sekolah"}
      roleLabel="Guru BK"
      sidebarItems={sidebarItems}
      activeItem={activeTab}
    >
      <div className="p-8 pb-32">
        {isLoading ? (
          <LoadingSpinner label="Menyinkronkan data murid..." />
        ) : (
          <div className="max-w-7xl mx-auto">
             {/* HEADER SECTION */}
            <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
               <div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                    {activeTab === 'theme' ? 'White-Label Branding' : activeTab === 'subscription' ? 'Kelola Langganan' : 'Kesehatan Mental Sekolah'}
                  </h1>
                  <p className="text-slate-500 font-medium mt-1 text-lg">
                    {activeTab === 'theme' ? 'Kustomisasi tampilan aplikasi khusus untuk sekolah Anda.' 
                    : activeTab === 'subscription' ? 'Pilih paket terbaik untuk sekolah Anda. Langganan berlaku untuk seluruh Guru BK.' 
                    : 'Visualisasi real-time radar psikologis seluruh murid.'}
                  </p>
               </div>
               <Badge variant="success" size="md">
                  Database Sinkron
               </Badge>
            </header>

            {activeTab === 'theme' ? (
                <div className="animate-in fade-in space-y-8 max-w-2xl">
                   <Card padding="lg">
                      <h3 className="font-black text-xl text-slate-800 mb-6 flex items-center gap-2"><Palette size={24} className="text-indigo-500"/> Identitas Sekolah</h3>
                      <div className="space-y-6">
                         <div>
                            <Input label="URL Logo Sekolah Baru" value={themeForm.logo} onChange={e => setThemeForm({...themeForm, logo: e.target.value})} placeholder="https://example.com/logo.png" />
                            {themeForm.logo && (
                                <div className="mt-4 p-4 border border-dashed rounded-xl bg-slate-50 flex justify-center">
                                    <img src={themeForm.logo} className="h-16 object-contain" onError={(e) => (e.currentTarget.src = '')} />
                                </div>
                            )}
                         </div>
                         <div>
                            <Input label="Warna Utama (HEX Code)" value={themeForm.color} onChange={e => setThemeForm({...themeForm, color: e.target.value})} placeholder="#2563EB" />
                            <div className="mt-2 flex gap-3 items-center">
                                <span className="text-xs text-slate-500 font-bold uppercase">Preview Warna:</span>
                                <div className="w-8 h-8 rounded-full shadow-sm border border-slate-200" style={{ backgroundColor: themeForm.color || '#3B82F6' }}></div>
                            </div>
                         </div>
                         <Button onClick={handleSaveTheme} className="w-full mt-4 py-4" disabled={isSavingTheme}>
                             {isSavingTheme ? 'Menyimpan...' : 'Simpan Tema'} <Save size={18} className="ml-2"/>
                         </Button>
                      </div>
                   </Card>
                 </div>
             ) : activeTab === 'subscription' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 animate-in fade-in">
                    {/* FREE PLAN */}
                    <Card padding="xl" className={`flex flex-col relative overflow-hidden ${!subscriptionInfo.isActive || subscriptionInfo.plan === 'free' ? 'ring-4 ring-slate-200' : ''}`}>
                        {(!subscriptionInfo.isActive || subscriptionInfo.plan === 'free') && (
                            <div className="absolute top-0 right-0 bg-slate-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-bl-xl">Paket Aktif</div>
                        )}
                        <div className="mb-6">
                            <h3 className="text-2xl font-black text-slate-900">FREE</h3>
                            <p className="text-slate-500 mt-2 text-sm">Fitur monitoring dasar</p>
                        </div>
                        <div className="mb-8">
                            <span className="text-4xl font-black text-slate-900">Rp 0</span>
                        </div>
                        <ul className="space-y-4 mb-10 flex-1">
                            {['Radar Psikologis Dasar', 'Tanpa Analitik Menyeluruh'].map((feat, i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                                    <ShieldCheck size={18} className="text-slate-400" /> {feat}
                                </li>
                            ))}
                        </ul>
                        <Button 
                            disabled={true}
                            className="w-full py-4 text-sm font-bold bg-slate-100 text-slate-500 hover:bg-slate-100 border-none"
                            variant="outline"
                        >
                            {(!subscriptionInfo.isActive || subscriptionInfo.plan === 'free') ? 'Paket Anda Saat Ini' : 'Paket Dasar'}
                        </Button>
                    </Card>

                    {/* PRO PLAN */}
                    <Card padding="xl" className={`flex flex-col relative overflow-hidden ${subscriptionInfo.isActive && subscriptionInfo.plan === 'pro' ? 'ring-4 ring-indigo-500' : ''}`}>
                        {subscriptionInfo.isActive && subscriptionInfo.plan === 'pro' && (
                            <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-bl-xl">Paket Aktif</div>
                        )}
                        <div className="mb-6">
                            <h3 className="text-2xl font-black text-slate-900">PRO</h3>
                            <p className="text-slate-500 mt-2 text-sm">Grafik mendalam & Ekspor Data</p>
                        </div>
                        <div className="mb-8">
                            <span className="text-4xl font-black text-slate-900">500rb</span>
                            <span className="text-slate-500 text-sm"> / bulan</span>
                        </div>
                        <ul className="space-y-4 mb-10 flex-1">
                            {['Semua Grafik Analitik', 'Export Laporan', 'Limit AI 50 pesan/hari'].map((feat, i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                                    <ShieldCheck size={18} className="text-emerald-500" /> {feat}
                                </li>
                            ))}
                        </ul>
                        <Button 
                            onClick={() => setCheckoutPlan('pro')} 
                            disabled={isPurchasing || (subscriptionInfo.isActive && subscriptionInfo.plan === 'pro') || (subscriptionInfo.isActive && subscriptionInfo.plan === 'premium')}
                            className="w-full py-4 text-sm font-bold"
                            variant={(subscriptionInfo.isActive && (subscriptionInfo.plan === 'pro' || subscriptionInfo.plan === 'premium')) ? 'outline' : 'primary'}
                        >
                            {subscriptionInfo.isActive && subscriptionInfo.plan === 'pro' ? 'Paket Anda Saat Ini' : (subscriptionInfo.isActive && subscriptionInfo.plan === 'premium' ? 'Sudah Premium' : 'Pilih Paket')}
                        </Button>
                    </Card>

                    {/* PREMIUM PLAN */}
                    <Card padding="xl" className={`flex flex-col relative overflow-hidden border-indigo-200 ${subscriptionInfo.isActive && subscriptionInfo.plan === 'premium' ? 'ring-4 ring-orange-500' : ''}`}>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50" />
                        {subscriptionInfo.isActive && subscriptionInfo.plan === 'premium' && (
                            <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-bl-xl z-10">Paket Aktif</div>
                        )}
                        <div className="mb-6 relative z-10">
                            <h3 className="text-2xl font-black text-indigo-600">PREMIUM</h3>
                            <p className="text-slate-500 mt-2 text-sm">White-label & Akses AI Penuh</p>
                        </div>
                        <div className="mb-8 relative z-10">
                            <span className="text-4xl font-black text-indigo-600">1 Juta</span>
                            <span className="text-slate-500 text-sm"> / bulan</span>
                        </div>
                        <ul className="space-y-4 mb-10 flex-1 relative z-10">
                            {['Fitur Paket Pro', 'White-labeling (Logo Sekolah)', 'AI Unlimited'].map((feat, i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                                    <ShieldCheck size={18} className="text-indigo-500" /> {feat}
                                </li>
                            ))}
                        </ul>
                        <Button 
                            onClick={() => setCheckoutPlan('premium')} 
                            disabled={isPurchasing || (subscriptionInfo.isActive && subscriptionInfo.plan === 'premium')}
                            className="w-full py-4 text-sm font-bold relative z-10 bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            {subscriptionInfo.isActive && subscriptionInfo.plan === 'premium' ? 'Paket Anda Saat Ini' : 'Pilih Paket'}
                        </Button>
                    </Card>
                </div>
            ) : (
                <>
                {/* STATISTICS DASHBOARD OR PAYWALL */}
                {/* Banner hanya tampil jika plan 'free' ATAU langganan sudah expired */}
            {isPremium ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12 animate-in fade-in">
                  {/* Main Visual Stats */}
                  <Card className="lg:col-span-2 group" padding="lg">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex items-center justify-between mb-10 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-slate-50 text-slate-800 rounded-2xl"><BarChart3 size={24}/></div>
                        <h3 className="font-black text-slate-900 uppercase text-xs tracking-[0.2em]">Analisis Distribusi Risiko</h3>
                      </div>
                      <Badge variant="primary" icon={Activity}>Real-time Data</Badge>
                    </div>
                    
                    <div className="space-y-8 relative z-10">
                      {/* Bars */}
                      {[
                        { label: 'Risiko Tinggi', count: counts.Tinggi, color: 'bg-red-500', text: 'text-red-600', grad: 'from-red-500 to-rose-400' },
                        { label: 'Risiko Sedang', count: counts.Sedang, color: 'bg-amber-500', text: 'text-amber-600', grad: 'from-amber-500 to-orange-400' },
                        { label: 'Stabil', count: counts.Rendah, color: 'bg-emerald-500', text: 'text-emerald-600', grad: 'from-emerald-500 to-teal-400' }
                      ].map(stat => (
                        <div className="space-y-3" key={stat.label}>
                          <div className="flex justify-between items-end">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 ${stat.color} rounded-full`} />
                              <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</span>
                            </div>
                            <span className={`text-sm font-black ${stat.text}`}>{Math.round((stat.count/total)*100)}%</span>
                          </div>
                          <div className="h-5 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-1">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(stat.count/total)*100}%` }}
                              className={`h-full bg-gradient-to-r ${stat.grad} rounded-full shadow-sm`} 
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Key Metrics Counter */}
                  <div className="bg-[#0F172A] rounded-[2.5rem] p-10 text-white flex flex-col justify-between shadow-2xl shadow-slate-900/20 relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                        <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                           <path d="M0 100 C 20 0 50 0 100 100" fill="none" stroke="white" strokeWidth="0.5" />
                        </svg>
                     </div>
                     
                     <div className="relative z-10">
                        <div className="w-14 h-14 bg-white/10 rounded-[1.5rem] flex items-center justify-center mb-6 border border-white/10">
                           <Users size={28} className="text-indigo-400" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Populasi Terdaftar</p>
                        <h4 className="text-6xl font-black tracking-tighter">{students.length}</h4>
                     </div>

                     <button 
                        onClick={() => loadData()}
                        className="w-full mt-10 py-4 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3"
                     >
                        <Activity size={16} /> Perbarui Data
                     </button>
                  </div>
                </div>
            ) : (
                 <div className="mb-12 bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center justify-between shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-3xl -mr-32 -mt-32 opacity-20" />
                   <div className="relative z-10 md:w-2/3">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-300 text-xs font-black uppercase tracking-widest mb-4">
                         <AlertTriangle size={14} /> Fitur Terkunci
                      </div>
                      <h2 className="text-3xl font-black text-white mb-2">Analitik Detail Institusi</h2>
                      <p className="text-indigo-200 text-sm leading-relaxed">Upgrade langganan sekolah Anda ke <b>PRO</b> atau <b>Premium</b> untuk membuka akses grafik statistik lanjutan (Tren Harian, Grafik Batang Risiko, dll) yang mempermudah pemantauan menyeluruh.</p>
                   </div>
                   <div className="mt-8 md:mt-0 relative z-10">
                      <button 
                        onClick={() => setActiveTab('subscription')}
                        className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 px-8 py-4 rounded-2xl text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-orange-500/20 active:scale-95 transition-all flex items-center gap-2">
                         Lihat Paket Langganan
                      </button>
                   </div>
                </div>
            )}

            {/* CONTROLS */}
            <Card padding="md" className="mb-10 flex flex-col lg:flex-row gap-5 items-center">
              <Input 
                icon={Search} 
                placeholder="Cari murid..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1"
              />
              <div className="flex bg-slate-50 p-1.5 rounded-[1.5rem] border border-slate-100">
                {['Semua', 'Tinggi', 'Sedang', 'Rendah'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setFilterRisk(r as any)}
                    className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                      filterRisk === r ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {r === 'Tinggi' && <AlertTriangle size={14} className={filterRisk === r ? 'text-red-500' : ''}/>}
                    {r}
                  </button>
                ))}
              </div>
            </Card>

            {/* DATA GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.length > 0 ? (
                filtered.map(s => (
                  <Card 
                    key={s.profile.id} 
                    interactive 
                    onClick={() => setSelectedStudent(s)}
                    padding="lg"
                    className="group"
                  >
                    {s.risk === 'Tinggi' && (
                      <div className="absolute top-6 right-6 text-red-500 animate-bounce">
                        <AlertTriangle size={24} fill="currentColor" className="opacity-10" />
                      </div>
                    )}

                    <div className="flex items-center gap-5 mb-8">
                      <div className="relative">
                        <img src={s.profile.avatar_url} className="w-16 h-16 rounded-[1.8rem] object-cover bg-slate-50 ring-4 ring-slate-50 shadow-sm" alt="Avatar" />
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-white ${s.risk === 'Tinggi' ? 'bg-red-500' : s.risk === 'Sedang' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-black text-slate-900 leading-tight truncate">{s.profile.full_name}</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">NIS: {s.profile.username}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-6 border-t border-slate-50">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Skor Radar</p>
                        <div className="flex items-baseline gap-1">
                           <span className={`text-3xl font-black tracking-tighter ${s.risk === 'Tinggi' ? 'text-red-600' : 'text-slate-900'}`}>{s.latestResult?.score || 0}</span>
                           <span className="text-[10px] font-bold text-slate-300">/100</span>
                        </div>
                      </div>
                      <Badge variant={s.risk === 'Tinggi' ? 'danger' : s.risk === 'Sedang' ? 'warning' : 'success'}>
                        {s.risk} Risk
                      </Badge>
                    </div>
                    
                    <div className="mt-6 flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                       Buka Detail Analisis <ChevronRight size={14} />
                    </div>
                  </Card>
                ))
              ) : (
                <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border border-dashed border-slate-300">
                   <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                      <Users size={32} className="text-slate-200" />
                   </div>
                   <h3 className="text-lg font-black text-slate-800">Tidak ada data ditemukan</h3>
                   <p className="text-slate-400 font-medium mt-1 uppercase text-[10px] tracking-[0.2em]">Coba ubah kriteria filter atau kata kunci pencarian</p>
                </div>
              )}
            </div>
            </>
            )}
          </div>
        )}

        {/* DETAIL MODAL */}
        <AnimatePresence>
          {selectedStudent && (
            <StudentDetailView 
              student={selectedStudent.profile} 
              result={selectedStudent.latestResult}
              onClose={() => setSelectedStudent(null)}
              onDownload={() => toast.success("Menyiapkan dokumen PDF...")}
            />
          )}

          {checkoutPlan && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.93, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.93, y: 20 }}
                className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xl font-black">Pembayaran QRIS</h3>
                    <button
                      onClick={() => { setCheckoutPlan(null); setQrisData(null); setQrisError(null); }}
                      className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors text-white font-bold text-sm"
                    >✕</button>
                  </div>
                  <p className="text-indigo-200 text-xs font-medium">
                    {user?.school_name} · Paket <span className="font-black text-white">{checkoutPlan?.toUpperCase()}</span>
                    {' · '}
                    <span className="font-black text-amber-300">{checkoutPlan === 'pro' ? 'Rp 500.000' : 'Rp 1.000.000'}</span>
                  </p>
                </div>

                <div className="p-8">
                  {/* STATE: Belum ada QR */}
                  {!qrisData && !isLoadingQris && !qrisError && (
                    <div className="text-center">
                      <div className="w-20 h-20 bg-indigo-50 rounded-[1.8rem] flex items-center justify-center mx-auto mb-5">
                        <CreditCard size={36} className="text-indigo-500" />
                      </div>
                      <h4 className="font-black text-slate-800 text-lg mb-2">Bayar dengan QRIS</h4>
                      <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                        Scan kode QR menggunakan aplikasi mobile banking atau e-wallet apapun (GoPay, OVO, DANA, dll).
                      </p>
                      <Button
                        variant="primary"
                        className="w-full py-4 text-base font-black"
                        onClick={handleInitiateQris}
                      >
                        Buat Kode QR
                      </Button>
                      <button
                        onClick={() => { setCheckoutPlan(null); }}
                        className="mt-3 w-full text-slate-400 text-sm font-medium hover:text-slate-600 transition-colors"
                      >Batal</button>
                    </div>
                  )}

                  {/* STATE: Loading generate QR */}
                  {isLoadingQris && (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-slate-600 font-bold">Membuat QRIS...</p>
                      <p className="text-slate-400 text-xs mt-1">Menghubungi Midtrans, harap tunggu</p>
                    </div>
                  )}

                  {/* STATE: Error */}
                  {qrisError && !isLoadingQris && (
                    <div className="text-center py-4">
                      <div className="w-16 h-16 bg-red-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">⚠️</span>
                      </div>
                      <h4 className="font-black text-slate-800 mb-2">Gagal Membuat QRIS</h4>
                      <p className="text-red-500 text-sm font-medium mb-6 bg-red-50 rounded-xl px-4 py-3">{qrisError}</p>
                      <Button variant="primary" className="w-full" onClick={handleInitiateQris}>Coba Lagi</Button>
                      <button onClick={() => { setCheckoutPlan(null); setQrisError(null); }} className="mt-3 w-full text-slate-400 text-sm font-medium hover:text-slate-600">Batal</button>
                    </div>
                  )}

                  {/* STATE: QR Code Tampil */}
                  {qrisData && !isLoadingQris && (
                    <div className="text-center">
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">Scan QR Code di Bawah</p>
                      
                      {/* QR Code Image */}
                      <div className="relative inline-block mb-4">
                        <div className="p-3 bg-white border-2 border-slate-100 rounded-2xl shadow-inner inline-block">
                          {qrisData.qr_code_url ? (
                            <img
                              src={qrisData.qr_code_url}
                              alt="QRIS Code"
                              className="w-52 h-52 object-contain"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                            />
                          ) : (
                            /* Fallback: tampilkan pesan jika tidak ada QR URL */
                            <div className="w-52 h-52 bg-slate-50 rounded-xl flex flex-col items-center justify-center p-4">
                              <span className="text-4xl mb-2">📱</span>
                              <p className="text-xs text-slate-500 font-medium text-center">QR Image tidak tersedia di Sandbox. Gunakan QR String di bawah.</p>
                            </div>
                          )}
                        </div>
                        {/* QRIS Logo Overlay */}
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white border border-slate-100 rounded-full px-3 py-1 text-[10px] font-black text-slate-700 shadow-sm">
                          QRIS
                        </div>
                      </div>

                      {/* Order Info */}
                      <div className="bg-slate-50 rounded-2xl p-4 mb-5 text-left space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400 font-bold uppercase">Order ID</span>
                          <span className="font-mono font-bold text-slate-700 text-[10px] truncate max-w-[180px]">{qrisData.order_id}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400 font-bold uppercase">Total</span>
                          <span className="font-black text-indigo-600">{qrisData.gross_amount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}</span>
                        </div>
                        {qrisData.expiry_time && (
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400 font-bold uppercase">Berlaku Hingga</span>
                            <span className="font-bold text-amber-600">{new Date(qrisData.expiry_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        )}
                      </div>

                      {/* CTA Buttons */}
                      <button
                        onClick={handleCheckPaymentStatus}
                        disabled={isCheckingPayment || isSimulating}
                        className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-black rounded-2xl transition-all active:scale-95 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 text-sm mb-3"
                      >
                        {isCheckingPayment ? (
                          <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Memeriksa...</>
                        ) : (
                          <>✅ Saya Sudah Bayar</>
                        )}
                      </button>

                      {/* Tombol Simulasi — Hanya untuk Development/Sandbox */}
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-3">
                        <p className="text-amber-700 text-[10px] font-black uppercase tracking-widest mb-2">⚠️ Mode Sandbox / Testing</p>
                        <button
                          onClick={handleSimulatePayment}
                          disabled={isSimulating || isCheckingPayment}
                          className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-black rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 text-sm"
                        >
                          {isSimulating ? (
                            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Mensimulasikan...</>
                          ) : (
                            <>⚡ Simulasi Bayar (Dev Only)</>
                          )}
                        </button>
                        <p className="text-amber-600 text-[10px] mt-2 leading-relaxed">
                          Tombol ini men-trigger Midtrans untuk approve transaksi secara otomatis. Hanya berfungsi di Sandbox.
                        </p>
                      </div>

                      <p className="text-slate-400 text-xs">
                        Klik tombol hijau setelah selesai melakukan pembayaran.
                        Sistem akan otomatis mengaktifkan langganan Anda.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};
