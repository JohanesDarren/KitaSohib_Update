
import React, { useEffect, useState } from 'react';
import { UserProfile } from '../../../types';
import { api } from '../../../services/mockSupabase';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Sparkles } from 'lucide-react';

export const KaderHorizontalList: React.FC = () => {
  const [kaders, setKaders] = useState<UserProfile[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.getCounselors().then(setKaders);
  }, []);

  const handleKaderClick = (kader: UserProfile) => {
    navigate('/mobile/chat', { state: { targetUserId: kader.id } });
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-2">
           <h2 className="font-black text-[#1F2937] text-lg tracking-tight">Kenali Kadermu</h2>
           <Sparkles size={14} className="text-[#4F8EF7]" />
        </div>
        <span className="text-[10px] font-black text-[#4F8EF7] uppercase tracking-widest bg-[#EFF6FF] px-2 py-1 rounded-lg">
           Mentor Jiwa
        </span>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2 snap-x">
        {kaders.map((kader) => (
          <motion.div
            key={kader.id}
            whileTap={{ scale: 0.94 }}
            onClick={() => handleKaderClick(kader)}
            className="min-w-[130px] bg-[#F4F7FF] p-5 rounded-[2.5rem] shadow-sm border border-[#E0E7FF] flex flex-col items-center snap-center cursor-pointer hover:border-blue-200 transition-all group"
          >
            <div className="relative mb-4">
              <img
                src={kader.avatar_url}
                className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-md group-hover:border-blue-100 transition-colors"
                alt={kader.full_name}
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full shadow-sm animate-pulse"></div>
            </div>
            
            <p className="font-black text-[12px] text-[#1F2937] text-center leading-tight truncate w-full mb-1">
              {kader.full_name.split(' ')[0]}
            </p>
            
            <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-full border border-gray-100 shadow-sm">
               <span className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter">
                  Siap Membantu
               </span>
            </div>
          </motion.div>
        ))}
        
        {kaders.length === 0 && [1, 2, 3].map((i) => (
            <div key={i} className="min-w-[130px] h-[160px] bg-[#F3F4F6] animate-pulse rounded-[2.5rem]"></div>
        ))}
      </div>
    </div>
  );
};
