
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, LogOut, UserCog, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path?: string;
  onClick?: () => void;
  badge?: number;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  roleLabel: string;
  sidebarItems: SidebarItem[];
  activeItem?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  subtitle,
  roleLabel,
  sidebarItems,
  activeItem
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* SIDEBAR - Tinted Glass */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-white/70 backdrop-blur-xl border-r border-primary-100/50 shadow-2xl md:shadow-none
          transform transition-transform duration-300 ease-in-out flex flex-col h-full
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:relative md:translate-x-0
        `}
      >
        <div className="p-8 border-b border-primary-100/50 flex justify-between items-center bg-white/30">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30 text-white font-black text-sm">
                KS
             </div>
             <div>
                <h1 className="text-lg font-black text-slate-900 tracking-tight">KitaSohib<span className="text-primary-500">.</span></h1>
                <p className="text-[10px] font-bold text-primary-400 uppercase tracking-widest">{roleLabel}</p>
             </div>
          </div>
          {/* Close button for mobile */}
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-primary-500">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto no-scrollbar">
          {sidebarItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                if (item.path) navigate(item.path);
                else if (item.onClick) item.onClick();
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-[13px] font-bold tracking-wide transition-all duration-200
              ${activeItem === item.id 
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30 ring-1 ring-primary-400' 
                : 'text-slate-500 hover:bg-primary-50/50 hover:text-primary-700'}`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} className={activeItem === item.id ? 'text-white' : 'text-primary-300'} />
                {item.label}
              </div>
              {item.badge ? (
                <span className="bg-accent-500 text-white text-[10px] min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center shadow-md font-bold">
                  {item.badge}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-primary-100/50 space-y-2 bg-white/20">
          <button onClick={() => navigate('/profile/edit')} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold text-slate-500 hover:bg-white hover:text-primary-600 transition-all shadow-sm border border-transparent hover:border-primary-100 hover:shadow-md">
            <UserCog size={18} /> Edit Profil
          </button>
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold text-slate-500 hover:bg-accent-50 hover:text-accent-600 transition-all shadow-sm border border-transparent hover:border-accent-100 hover:shadow-md">
            <LogOut size={18} /> Keluar
          </button>
        </div>
      </aside>

      {/* MOBILE OVERLAY BACKDROP */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <header className="h-20 bg-white/60 backdrop-blur-md border-b border-primary-100/50 flex items-center justify-between px-4 sm:px-8 shrink-0 z-30 sticky top-0">
          <div className="flex items-center gap-4">
            <button onClick={toggleSidebar} className="md:hidden p-2 text-slate-500 hover:bg-white hover:text-primary-500 rounded-xl transition-colors">
              <Menu size={24} />
            </button>
            <div>
               <h2 className="text-sm sm:text-base font-black text-slate-800 uppercase tracking-widest">{title}</h2>
               {subtitle && <p className="text-[10px] sm:text-xs font-bold text-slate-400 hidden sm:block">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-slate-800">{user?.full_name}</p>
                <p className="text-[9px] font-bold text-primary-600 uppercase tracking-widest">{user?.school_name || 'KitaSohib'}</p>
             </div>
             <div className="w-10 h-10 rounded-2xl bg-white border border-primary-100 flex items-center justify-center overflow-hidden shadow-sm ring-2 ring-primary-50">
                {user?.avatar_url ? (
                   <img src={user.avatar_url} className="w-full h-full object-cover" />
                ) : (
                   <span className="font-black text-primary-300">{user?.full_name?.charAt(0)}</span>
                )}
             </div>
          </div>
        </header>

        {/* Content Container - Transparent background to let body gradient show */}
        <main className="flex-1 overflow-y-auto no-scrollbar p-0">
           {children}
        </main>
      </div>
    </div>
  );
};
