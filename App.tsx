
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/auth/Login';
import { RegisterBK } from './pages/auth/RegisterBK'; 
import { Home } from './pages/user/Home';
import { Articles } from './pages/user/Articles';
import { Forum } from './pages/user/Forum';
import { Profile } from './pages/user/Profile';
import { SohibChat } from './pages/user/SohibChat';
import { EmotionTest } from './pages/user/EmotionTest';
import { Dashboard } from './pages/kader/Dashboard';
import { DashboardAdmin } from './pages/admin/DashboardAdmin';
import { DashboardBK } from './pages/bk/DashboardBK';
import { DashboardPsychologist } from './pages/psychologist/DashboardPsychologist';
import { PsychologistChat } from './pages/psychologist/PsychologistChat';
import { CoordinationChat } from './pages/shared/CoordinationChat';
import { EditProfile } from './pages/shared/EditProfile'; 
import { UserLayout } from './components/UserLayout';
import { Toaster } from 'react-hot-toast';
import { SplashScreen } from './components/SplashScreen';
import { AnimatePresence } from 'framer-motion';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { UserRole } from './types';

// --- ROUTING UTILITIES ---

/**
 * Menentukan path dashboard utama berdasarkan role user.
 * Digunakan untuk fallback redirect jika user salah masuk kamar.
 */
const getDashboardByRole = (role: UserRole): string => {
  switch (role) {
    case 'admin': return '/dashboard-admin';
    case 'user': return '/mobile/home';
    case 'bk': return '/dashboard/manajemen-bk';
    case 'psychologist': return '/dashboard/psychologist';
    case 'kader':
    case 'counselor': return '/dashboard';
    default: return '/login';
  }
};

/**
 * Komponen Guard untuk memproteksi rute.
 * 1. Cek Loading -> Tampilkan Spinner
 * 2. Cek Login -> Jika belum, lempar ke /login
 * 3. Cek Role -> Jika tidak sesuai izin, lempar ke dashboard masing-masing.
 */
const ProtectedRoute = ({ allowedRoles }: { allowedRoles: UserRole[] }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <LoadingSpinner label="Memverifikasi akses..." />
      </div>
    );
  }

  // 1. Belum Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // 2. Role tidak sesuai dengan rute yang dituju
  if (!allowedRoles.includes(user.role)) {
    const correctPath = getDashboardByRole(user.role);
    return <Navigate to={correctPath} replace />;
  }

  // 3. Akses Diterima
  return <Outlet />;
};

// User Layout Wrapper for routes that need the bottom bar
const MobileLayoutWrapper = () => (
  <UserLayout>
    <Outlet />
  </UserLayout>
);

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register-bk" element={<RegisterBK />} /> 
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* --- PROTECTED ROUTES --- */}

      {/* 1. Shared Route (Semua user yang login bisa akses) */}
      <Route element={<ProtectedRoute allowedRoles={['admin', 'user', 'kader', 'counselor', 'psychologist', 'bk']} />}>
        <Route path="/profile/edit" element={<EditProfile />} />
      </Route>

      {/* 2. Admin Route */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/dashboard-admin" element={<DashboardAdmin />} />
      </Route>

      {/* 3. User Routes (Mobile Layout) */}
      <Route element={<ProtectedRoute allowedRoles={['user']} />}>
        <Route path="/mobile" element={<MobileLayoutWrapper />}>
           <Route path="home" element={<Home />} />
           <Route path="articles" element={<Articles />} />
           <Route path="forum" element={<Forum />} />
           <Route path="profile" element={<Profile />} />
           <Route path="chat" element={<SohibChat />} />
        </Route>
        <Route path="/mobile/emotion-test" element={<EmotionTest />} />
      </Route>

      {/* 4. Kader/Counselor Routes */}
      <Route element={<ProtectedRoute allowedRoles={['kader', 'counselor']} />}>
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>

      {/* 5. Shared Professional Routes (Kader & Psychologist - Koordinasi) */}
      <Route element={<ProtectedRoute allowedRoles={['kader', 'counselor', 'psychologist']} />}>
        <Route path="/dashboard/coordination-chat/:referralId" element={<CoordinationChat />} />
      </Route>

      {/* 6. Guru BK Routes */}
      <Route element={<ProtectedRoute allowedRoles={['bk']} />}>
        <Route path="/dashboard/manajemen-bk" element={<DashboardBK />} />
      </Route>

      {/* 7. Psikolog Routes */}
      <Route element={<ProtectedRoute allowedRoles={['psychologist']} />}>
        <Route path="/dashboard/psychologist" element={<DashboardPsychologist />} />
        <Route path="/dashboard/psychologist/chat" element={<PsychologistChat />} />
      </Route>

      {/* Fallback for 404 - Redirect to Login (AuthContext will redirect to dashboard if logged in) */}
      <Route path="*" element={<Navigate to="/login" replace />} />

    </Routes>
  );
};

export const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <HashRouter>
      <AuthProvider>
        <AnimatePresence mode="wait">
          {showSplash && <SplashScreen key="splash" />}
        </AnimatePresence>
        
        {!showSplash && (
            <div className="animate-fade-in">
               <AppRoutes />
            </div>
        )}

        <Toaster position="top-center" toastOptions={{
           duration: 4000,
           style: { borderRadius: '20px', background: '#1F2937', color: '#fff', padding: '12px 24px', fontSize: '14px', fontWeight: '500' }
        }}/>
      </AuthProvider>
    </HashRouter>
  );
};

export default App;
