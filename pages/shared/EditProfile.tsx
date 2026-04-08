
import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { User, Mail, Lock, Camera, ArrowLeft, ShieldCheck, UserCheck, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/mockSupabase';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export const EditProfile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inisialisasi form dengan data user saat ini
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    full_name: user?.full_name || '',
    password: '', // Kosong secara default untuk keamanan
  });

  // --- LOGIC UPLOAD & KOMPRESI GAMBAR ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi Ukuran Awal (Maks 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file terlalu besar (Maks 5MB)");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Buat Canvas untuk Kompresi
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const maxSize = 300; // Resize ke 300px agar ringan
        let width = img.width;
        let height = img.height;

        // Hitung rasio aspek
        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        
        // Gambar ulang di canvas
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert ke Base64 (JPEG quality 0.8)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);

        // Simpan ke API & Local State
        api.updateProfile(user!.id, { avatar_url: compressedBase64 })
          .then(() => {
            updateUser({ avatar_url: compressedBase64 });
            toast.success("Foto profil diperbarui!");
          })
          .catch((err) => {
            console.error(err);
            toast.error("Gagal mengunggah foto.");
          })
          .finally(() => {
            setIsUploading(false);
          });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setIsSubmitting(true);
    try {
      // Siapkan payload data yang akan diupdate
      const updatePayload: any = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        full_name: formData.full_name.trim(),
      };

      // Hanya kirim password jika diisi
      if (formData.password.trim().length > 0) {
        if (formData.password.length < 4) {
          toast.error("Password baru minimal 4 karakter");
          setIsSubmitting(false);
          return;
        }
        updatePayload.password = formData.password.trim(); // Trim password here
      }

      // Panggil API Update (update_row di backend)
      await api.updateProfile(user.id, updatePayload);
      
      // Update Context agar UI sinkron secara real-time
      updateUser(updatePayload); 
      
      toast.success("Profil Anda berhasil diperbarui! ✨");
      navigate(-1); 
    } catch (error: any) {
      toast.error(error.message || "Gagal memperbarui profil");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      {/* Hidden File Input untuk Galeri/Kamera */}
      <input 
        type="file" 
        ref={fileInputRef} 
        accept="image/*" 
        className="hidden" 
        onChange={handleImageUpload}
      />

      <div className="max-w-2xl mx-auto">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-8 hover:text-indigo-600 transition-all group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Kembali
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden relative"
        >
          {/* Decorative Header */}
          <div className="h-32 bg-gradient-to-r from-primary-500 to-indigo-600 w-full opacity-10 absolute top-0 left-0" />

          <div className="p-8 md:p-12 relative z-10">
            <div className="flex items-center gap-4 mb-10">
               <div className="p-3 bg-primary-500 text-white rounded-2xl shadow-lg shadow-primary-500/20">
                  <UserCheck size={24} />
               </div>
               <div>
                  <h2 className="text-2xl font-black text-slate-800 leading-tight">Pengaturan Akun</h2>
                  <p className="text-slate-400 text-xs font-medium">Kelola kredensial dan identitas publik Anda.</p>
               </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              {/* Avatar Uploader Section */}
              <div className="flex flex-col items-center mb-10">
                <div 
                  className="relative group cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isUploading ? (
                    <div className="w-32 h-32 rounded-[2.5rem] bg-slate-100 flex items-center justify-center border-4 border-slate-50 animate-pulse">
                       <Loader2 className="animate-spin text-primary-500" size={32} />
                    </div>
                  ) : (
                    <>
                      <img 
                        src={user?.avatar_url} 
                        className="w-32 h-32 rounded-[2.5rem] object-cover ring-8 ring-slate-50 shadow-xl transition-transform group-hover:scale-105" 
                        alt="Avatar" 
                      />
                      <div className="absolute inset-0 bg-black/40 rounded-[2.5rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                        <Camera className="text-white drop-shadow-md" size={32} />
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-primary-500 text-white p-2 rounded-xl shadow-lg border-4 border-white">
                         <Camera size={16} />
                      </div>
                    </>
                  )}
                </div>
                <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest mt-4 cursor-pointer hover:underline" onClick={() => fileInputRef.current?.click()}>
                   {isUploading ? 'Mengunggah...' : 'Ganti Foto'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="text" required
                      className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] outline-none font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-primary-50 transition-all"
                      value={formData.username}
                      onChange={e => setFormData({...formData, username: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alamat Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="email" required
                      className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] outline-none font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-primary-50 transition-all"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                <input 
                  type="text" required
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] outline-none font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-primary-50 transition-all"
                  value={formData.full_name}
                  onChange={e => setFormData({...formData, full_name: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password Baru (Biarkan kosong jika tidak diubah)</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] outline-none font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-primary-50 transition-all"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>

              <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 flex gap-4 items-start">
                 <ShieldCheck size={20} className="text-amber-600 shrink-0" />
                 <p className="text-[11px] text-amber-800 font-bold leading-relaxed">
                   Perubahan pada email atau password akan langsung berpengaruh pada login berikutnya. Pastikan data yang Anda masukkan sudah benar.
                 </p>
              </div>

              <div className="pt-6">
                <Button type="submit" className="w-full !rounded-[1.5rem] !py-5 text-sm font-black shadow-xl shadow-primary-500/20 uppercase tracking-widest" isLoading={isSubmitting}>
                  Simpan Perubahan
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
