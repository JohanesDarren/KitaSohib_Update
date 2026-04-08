
import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { api } from '../services/mockSupabase';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  schoolTheme: { logo: string, color: string } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  // Default true agar App tidak merender rute sebelum cek localStorage selesai
  const [isLoading, setIsLoading] = useState(true);
  const [schoolTheme, setSchoolTheme] = useState<{ logo: string, color: string } | null>(null);

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = localStorage.getItem('ks_session');
        
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          
          // Validasi: Pastikan ID dan Role ada untuk mencegah bug 'undefined role'
          if (parsedUser && parsedUser.id && parsedUser.role) {
            setUser(parsedUser as UserProfile);
            
            // Terapkan Tema Kustom jika premium
            api.getCurrentSchool().then(s => {
                if (s && s.subscription_plan === 'premium' && (s.school_logo || s.school_color_hex)) {
                    setSchoolTheme({ logo: s.school_logo || '', color: s.school_color_hex || '' });
                    if (s.school_color_hex) applyCustomCSSColor(s.school_color_hex);
                } else {
                    const existingStyle = document.getElementById('whitelabel-theme');
                    if (existingStyle) existingStyle.remove();
                }
            });
            
          } else {
            // Data korup/tidak lengkap, bersihkan
            console.warn("Sesi lokal tidak valid, membersihkan...");
            localStorage.removeItem('ks_session');
            setUser(null);
          }
        }
      } catch (error) {
        console.error("Gagal memulihkan sesi:", error);
        localStorage.removeItem('ks_session');
        setUser(null);
      } finally {
        // Penting: Matikan loading state apapun hasilnya
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      if (!email || !password) throw new Error("Mohon isi email dan password");
      if (password.length < 4) throw new Error("Password minimal 4 karakter");
      
      const loggedUser = await api.login(email, password);
      
      if (loggedUser && loggedUser.id) {
        // 1. Set State
        setUser(loggedUser);
        // 2. Simpan ke LocalStorage segera
        localStorage.setItem('ks_session', JSON.stringify(loggedUser));
        
        const firstName = loggedUser.full_name ? loggedUser.full_name.split(' ')[0] : 'Sohib';
        toast.success(`Selamat datang kembali, ${firstName}!`);
      } else {
        throw new Error("Gagal memproses data user dari server");
      }
    } catch (error: any) {
      console.error("Auth login error:", error);
      const errorMsg = error.message || "Gagal masuk. Periksa kembali email/password Anda.";
      toast.error(errorMsg);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ks_session');
    toast.success("Berhasil keluar");
    // Gunakan window location hash untuk redirect paksa ke login jika router bermasalah
    window.location.hash = '/login';
  };

  const updateUser = (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    
    // Update State & Storage bersamaan
    setUser(updated);
    localStorage.setItem('ks_session', JSON.stringify(updated));
  };

  const applyCustomCSSColor = (colorHex: string) => {
      let existingStyle = document.getElementById('whitelabel-theme');
      if (!existingStyle) {
          existingStyle = document.createElement('style');
          existingStyle.id = 'whitelabel-theme';
          document.head.appendChild(existingStyle);
      }
      existingStyle.innerHTML = `
        .bg-primary-500, .bg-indigo-600, .bg-blue-600 { background-color: ${colorHex} !important; border-color: ${colorHex} !important; }
        .text-primary-500, .text-indigo-600, .text-primary-600 { color: ${colorHex} !important; }
        .border-primary-500, .border-primary-100 { border-color: ${colorHex} !important; }
        .ring-primary-500, .ring-primary-400 { --tw-ring-color: ${colorHex} !important; }
      `;
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser, schoolTheme }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
