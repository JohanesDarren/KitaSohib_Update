
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Mail, 
  Lock, 
  User, 
  School as SchoolIcon, 
  Eye, 
  EyeOff, 
  Globe, 
  Facebook, 
  Twitter, 
  Sparkles 
} from 'lucide-react';
import { api } from '../../services/mockSupabase';
import { School as SchoolType } from '../../types';
import toast from 'react-hot-toast';

// --- FIXED COMPONENT: Moved OUTSIDE Login to prevent re-render focus loss ---
const FormInput = ({ 
  icon: Icon, 
  type = "text", 
  placeholder, 
  value, 
  onChange, 
  isPasswordToggle = false,
  list
}: any) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative group mb-5">
      <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mb-2 ml-1">
        {placeholder}
      </label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none">
          <Icon size={20} />
        </div>
        <input
          type={isPasswordToggle ? (showPassword ? "text" : "password") : type}
          value={value}
          onChange={onChange}
          // Placeholder hidden visually but kept for accessibility/browser hints
          placeholder="" 
          required
          list={list}
          className="w-full bg-white text-slate-800 font-bold text-sm rounded-2xl py-4 pl-12 pr-12 border border-slate-300 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm placeholder:text-slate-300"
        />
        {isPasswordToggle && (
          <button 
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors p-1"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
    </div>
  );
};

export const Login: React.FC = () => {
  const { login, user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoginView, setIsLoginView] = useState(true);
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regSchool, setRegSchool] = useState('');
  const [regPassword, setRegPassword] = useState('');
  
  const [schools, setSchools] = useState<SchoolType[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    api.getSchools().then(setSchools).catch(() => {});
  }, []);

  const redirectByRole = useCallback((role?: string) => {
    if (!role) return;
    switch (role) {
      case 'admin': navigate('/dashboard-admin'); break;
      case 'kader': navigate('/dashboard'); break;
      case 'psychologist': navigate('/dashboard/psychologist'); break;
      case 'bk': navigate('/dashboard/manajemen-bk'); break;
      case 'user': navigate('/mobile/home'); break;
      default: navigate('/mobile/home');
    }
  }, [navigate]);

  useEffect(() => {
    if (user && user.role) {
      if (user.role === 'bk' && user.status === 'pending_approval') {
        toast.error("Akun Anda sedang menunggu persetujuan Admin/Kader.");
        logout();
        return;
      }
      redirectByRole(user.role);
    }
  }, [user, redirectByRole, logout]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(email.trim(), password.trim());
    } catch (err: any) {
      // Error handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.register({ 
        email: regEmail.trim(), 
        full_name: regName.trim(), 
        username: regUsername.trim(),
        school_name: regSchool || "Tidak memilih",
        password: regPassword.trim(),
        role: 'user'
      });
      toast.success("Registrasi berhasil! Silakan login.");
      setIsLoginView(true);
      setEmail(regEmail);
      setPassword(regPassword);
    } catch (err: any) {
      toast.error(err.message || "Gagal registrasi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-0 md:p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white w-full max-w-[1100px] h-screen md:h-auto md:min-h-[650px] md:rounded-[3rem] shadow-2xl shadow-blue-900/10 overflow-hidden flex flex-col md:flex-row relative border border-slate-100"
      >
        
        {/* LEFT PANEL (DESKTOP) / TOP HEADER (MOBILE) */}
        <div className="md:w-5/12 bg-blue-600 relative overflow-hidden flex flex-col justify-between shrink-0">
           {/* Background Image - Updated to reliable Thumbnail Link */}
           <div className="absolute inset-0">
              <img 
                src="https://drive.google.com/thumbnail?id=10DNjq_y4keQI1jPtkQuiZ2KGgsv686Ia&sz=w1000" 
                alt="Cover" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback if Drive link fails completely
                  e.currentTarget.src = "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1932&auto=format&fit=crop";
                }}
              />
              {/* Gradient Overlay for Text Readability - Adjusted opacity for branded image visibility */}
              <div className="absolute inset-0 bg-gradient-to-b from-blue-900/40 via-transparent to-blue-900/90 mix-blend-multiply"></div>
           </div>
           
           {/* Mobile Header Curve */}
           <div className="absolute bottom-0 left-0 right-0 h-16 bg-white rounded-t-[3rem] md:hidden z-10 translate-y-1"></div>

           {/* Content */}
           <div className="relative z-20 p-8 md:p-12 flex flex-col h-full md:justify-center">
              <div className="mb-6 md:mb-10">
                 <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4">
                    <Sparkles className="text-white" size={24} />
                 </div>
                 <h1 className="text-3xl md:text-4xl font-black text-white leading-tight mb-2 drop-shadow-md">
                    {isLoginView ? 'Welcome Sohib!' : 'Hai Sohib!'}
                 </h1>
                 <p className="text-blue-50 text-sm font-medium leading-relaxed max-w-xs drop-shadow-sm">
                    {isLoginView 
                      ? 'Partner kesehatan mental sekolah yang mengerti kamu.' 
                      : 'Mulai langkah kecil untuk perubahan besar bersama komunitas kami.'}
                 </p>
              </div>
           </div>
        </div>

        {/* RIGHT PANEL (DESKTOP) / BOTTOM CONTENT (MOBILE) */}
        <div className="flex-1 bg-white relative flex flex-col">
           <div className="flex-1 overflow-y-auto no-scrollbar px-8 py-4 md:p-12 flex flex-col justify-center">
              <div className="max-w-md mx-auto w-full">
                 <div className="text-center mb-8 md:hidden">
                    <h2 className="text-xl font-black text-slate-800">
                       {isLoginView ? 'Masuk Akun' : 'Daftar Baru'}
                    </h2>
                 </div>

                 <AnimatePresence mode="wait">
                    {isLoginView ? (
                       <motion.form
                          key="login"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          onSubmit={handleLogin}
                          className="space-y-1"
                       >
                          <FormInput 
                             icon={User} 
                             placeholder="Email atau Username" 
                             value={email} 
                             onChange={(e: any) => setEmail(e.target.value)} 
                          />
                          <FormInput 
                             icon={Lock} 
                             placeholder="Password" 
                             type="password"
                             isPasswordToggle
                             value={password} 
                             onChange={(e: any) => setPassword(e.target.value)} 
                          />
                          
                          <div className="flex items-center justify-between py-2">
                             <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setRememberMe(!rememberMe)}>
                                <div className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 ${rememberMe ? 'bg-blue-600' : 'bg-slate-200'}`}>
                                   <motion.div 
                                     className="w-4 h-4 bg-white rounded-full shadow-sm" 
                                     animate={{ x: rememberMe ? 16 : 0 }}
                                   />
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide group-hover:text-blue-600 transition-colors">Ingat Saya</span>
                             </div>
                             <button type="button" className="text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:underline uppercase tracking-wide">Lupa Password?</button>
                          </div>

                          <button 
                             type="submit" 
                             disabled={isSubmitting}
                             className="w-full py-4 mt-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
                          >
                             {isSubmitting ? 'Memproses...' : 'Masuk Sekarang'}
                          </button>
                       </motion.form>
                    ) : (
                       <motion.form
                          key="register"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          onSubmit={handleRegister}
                          className="space-y-1"
                       >
                          <FormInput icon={User} placeholder="Nama Lengkap" value={regName} onChange={(e: any) => setRegName(e.target.value)} />
                          <FormInput icon={Mail} placeholder="Email" type="email" value={regEmail} onChange={(e: any) => setRegEmail(e.target.value)} />
                          <FormInput icon={User} placeholder="Username" value={regUsername} onChange={(e: any) => setRegUsername(e.target.value)} />
                          <FormInput icon={SchoolIcon} placeholder="Nama Sekolah" value={regSchool} onChange={(e: any) => setRegSchool(e.target.value)} list="schools-list" />
                          <datalist id="schools-list">
                            <option value="Tidak Sekolah / Umum" />
                            {schools.map(s => <option key={s.id} value={s.school_name} />)}
                          </datalist>
                          <FormInput icon={Lock} placeholder="Password" type="password" isPasswordToggle value={regPassword} onChange={(e: any) => setRegPassword(e.target.value)} />
                          
                          <button 
                             type="submit" 
                             disabled={isSubmitting}
                             className="w-full py-4 mt-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/30 active:scale-95 transition-all"
                          >
                             {isSubmitting ? 'Mendaftar...' : 'Buat Akun'}
                          </button>
                       </motion.form>
                    )}
                 </AnimatePresence>

                 <div className="mt-8 text-center">
                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                        <div className="relative flex justify-center"><span className="bg-white px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Atau masuk dengan</span></div>
                    </div>

                    <div className="flex justify-center gap-4 mb-8">
                       <button className="p-3.5 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"><Globe size={20} /></button>
                       <button className="p-3.5 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 hover:bg-blue-100 hover:border-blue-200 transition-all shadow-sm"><Facebook size={20} /></button>
                       <button className="p-3.5 rounded-2xl bg-sky-50 border border-sky-100 text-sky-500 hover:bg-sky-100 hover:border-sky-200 transition-all shadow-sm"><Twitter size={20} /></button>
                    </div>
                    
                    <p className="text-xs font-bold text-slate-500">
                       {isLoginView ? "Belum punya akun?" : "Sudah punya akun?"}
                       <button 
                          onClick={() => { setIsLoginView(!isLoginView); }}
                          className="ml-2 text-blue-600 font-black hover:underline uppercase tracking-wide"
                       >
                          {isLoginView ? "Daftar" : "Masuk"}
                       </button>
                    </p>
                 </div>
              </div>
           </div>
        </div>

      </motion.div>
    </div>
  );
};
