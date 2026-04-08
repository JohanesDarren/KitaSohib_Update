
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { motion } from 'framer-motion';
import { School, UserPlus, ArrowLeft, Mail, Lock, ShieldAlert, User, Building2 } from 'lucide-react';
import { api } from '../../services/mockSupabase';
import toast from 'react-hot-toast';

export const RegisterBK: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    username: '',
    school_name: '', // Field Nama Sekolah
    password: ''
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.school_name.trim()) {
      toast.error("Nama Sekolah wajib diisi untuk akun Guru BK");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.registerBK({
        ...formData,
        password: formData.password.trim()
      });
      toast.success("Registrasi Berhasil! Akun Anda sedang diverifikasi.", { duration: 6000 });
      navigate('/login');
    } catch (err: any) {
      toast.error(err.message || "Gagal registrasi BK");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center relative overflow-hidden font-sans">
      
      {/* Background Blobs */}
      <div className="absolute inset-0 z-0 overflow-hidden">
         <motion.div 
            animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-32 -left-32 w-96 h-96 bg-blue-200 rounded-full blur-[100px] opacity-40"
         />
         <motion.div 
            animate={{ scale: [1, 1.5, 1], x: [0, 100, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-100 rounded-full blur-[120px] opacity-40"
         />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-10 rounded-[3rem] w-full max-w-lg relative z-10 mx-4 border border-white/50"
      >
        <Link to="/login" className="inline-flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-8 hover:text-blue-600 transition-all group">
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Kembali ke Login
        </Link>

        <div className="flex flex-col items-center text-center mb-8 relative z-10">
          <div className="p-4 bg-blue-600 text-white rounded-[1.5rem] mb-4 shadow-xl shadow-blue-500/30">
            <School size={28} />
          </div>
          <h1 className="text-2xl font-black text-slate-800 leading-tight">Registrasi Guru BK</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.25em] mt-2">Portal Manajemen Sekolah</p>
        </div>

        <div className="bg-amber-50 border border-amber-100 p-5 rounded-[2rem] mb-8 flex gap-4 items-start relative z-10">
           <div className="p-2 bg-white rounded-xl shadow-sm">
              <ShieldAlert size={18} className="text-amber-600 shrink-0" />
           </div>
           <p className="text-[11px] text-amber-800 font-bold leading-relaxed">
             Data sekolah Anda diperlukan untuk memfilter akses hasil tes emosi murid secara eksklusif. Akun akan diverifikasi oleh Admin.
           </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4 relative z-10">
          <div className="relative group">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
              <User size={18} />
            </div>
            <input 
              type="text" required 
              className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-blue-100 focus:ring-4 focus:ring-blue-50 transition-all outline-none text-sm font-bold text-slate-800 placeholder:text-slate-400" 
              placeholder="Nama Lengkap & Gelar"
              value={formData.full_name}
              onChange={e => setFormData({...formData, full_name: e.target.value})}
            />
          </div>

          <div className="relative group">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
              <Building2 size={18} />
            </div>
            <input 
              type="text" required 
              className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-blue-100 focus:ring-4 focus:ring-blue-50 transition-all outline-none text-sm font-bold text-slate-800 placeholder:text-slate-400" 
              placeholder="Nama Sekolah (Contoh: SMK Negeri 1)"
              value={formData.school_name}
              onChange={e => setFormData({...formData, school_name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <input 
               type="text" required 
               className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-blue-100 outline-none transition-all text-sm font-bold text-slate-800 placeholder:text-slate-400" 
               placeholder="Username"
               value={formData.username}
               onChange={e => setFormData({...formData, username: e.target.value})}
             />
             <input 
               type="email" required 
               className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-blue-100 outline-none transition-all text-sm font-bold text-slate-800 placeholder:text-slate-400" 
               placeholder="Email"
               value={formData.email}
               onChange={e => setFormData({...formData, email: e.target.value})}
             />
          </div>

          <div className="relative group">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
              <Lock size={18} />
            </div>
            <input 
              type="password" required 
              className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-blue-100 outline-none transition-all text-sm font-bold text-slate-800 placeholder:text-slate-400" 
              placeholder="Kata Sandi"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <div className="pt-4">
            <Button type="submit" className="w-full !rounded-2xl !py-4.5 text-sm font-black shadow-xl shadow-blue-500/20 active:scale-[0.98]" isLoading={isSubmitting}>
              Ajukan Akses
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
