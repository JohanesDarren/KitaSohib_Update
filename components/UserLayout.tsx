
import React from 'react';
import { Home, MessageCircle, BookOpen, Users, User, Bot } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const BottomNav = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { icon: Home, label: 'Home', path: '/mobile/home' },
    { icon: Bot, label: 'SohibChat', path: '/mobile/chat', state: { reset: true } },
    { icon: BookOpen, label: 'Pojok Wawasan', path: '/mobile/articles' },
    { icon: Users, label: 'Sambung Rasa', path: '/mobile/forum' },
    { icon: User, label: 'Sohib', path: '/mobile/profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none px-0">
      {/* Bar Navigasi - Menempel ke bawah untuk menghilangkan space kosong */}
      <div className="w-full max-w-lg bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-[0_-8px_30px_rgba(0,0,0,0.05)] rounded-t-[2.5rem] pointer-events-auto">
        <div className="flex justify-around items-center h-22 pt-3 pb-6 px-2">
          {navItems.map((item) => (
            <Link 
              to={item.path} 
              state={item.state}
              key={item.label} 
              className="relative w-full flex flex-col items-center justify-center group"
            >
              {isActive(item.path) && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary-50/50 rounded-2xl -z-10 mx-2"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <div className="flex flex-col items-center justify-center py-2 px-1">
                <item.icon 
                  size={20} 
                  className={`transition-colors duration-300 ${isActive(item.path) ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'}`} 
                />
                <span className={`text-[9px] font-bold mt-1 transition-colors ${isActive(item.path) ? 'text-primary-600' : 'text-gray-400'}`}>
                  {item.label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export const UserLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-lg mx-auto min-h-screen relative bg-white pb-24">
         {children}
      </div>
      <BottomNav />
    </div>
  );
};
