
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, ChatMessage } from '../../types';
import { api } from '../../services/mockSupabase';
import { useAuth } from '../../context/AuthContext';
import { Send, ArrowLeft, Users, Stethoscope, MessageCircle, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const PsychologistChat: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [patients, setPatients] = useState<UserProfile[]>([]);
  const [colleagues, setColleagues] = useState<UserProfile[]>([]);
  const [activeTab, setActiveTab] = useState<'patients' | 'colleagues'>('patients');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);

  useEffect(() => {
    if (user) loadData();
  }, [user, activeTab]);

  const loadData = async () => {
    setIsLoadingList(true);
    try {
      const myReferrals = await api.fetchPsychologistReferrals(user!.id);
      setReferrals(myReferrals);

      if (activeTab === 'patients') {
        const patientIds = myReferrals.map(r => r.user_id);
        const allUsers = await api.getUsers();
        setPatients(allUsers.filter(u => patientIds.includes(u.id)));
      } else {
        const kaders = await api.getCounselors();
        setColleagues(kaders);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    if (selectedUser && user) {
      const interval = setInterval(async () => {
        let refId = undefined;
        if (activeTab === 'patients') {
             const activeRef = referrals.find(r => r.user_id === selectedUser.id && r.status === 'active');
             refId = activeRef?.id;
        }
        const msgs = await api.getMessages(user.id, selectedUser.id, refId);
        setMessages(msgs);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedUser, user, activeTab, referrals]);

  useEffect(() => {
     if(selectedUser && user) {
        let refId = undefined;
        if (activeTab === 'patients') {
             const activeRef = referrals.find(r => r.user_id === selectedUser.id && r.status === 'active');
             refId = activeRef?.id;
        }
        api.getMessages(user.id, selectedUser.id, refId).then(setMessages);
     }
  }, [selectedUser]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!selectedUser || !input.trim() || !user) return;
    
    let refId = undefined;
    if (activeTab === 'patients') {
        const activeRef = referrals.find(r => r.user_id === selectedUser.id && r.status === 'active');
        refId = activeRef?.id;
    }

    const msg = await api.sendMessage(user.id, selectedUser.id, input, false, refId);
    setMessages(prev => [...prev, msg]);
    setInput('');
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
       {/* Sidebar */}
       <div className={`${selectedUser ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col bg-white border-r border-gray-200 h-full`}>
          <div className="p-6 border-b border-gray-100">
             <div className="flex items-center gap-3 mb-6">
                <button 
                  onClick={() => navigate('/dashboard/psychologist')} 
                  className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
                  title="Kembali ke Dashboard"
                >
                   <ArrowLeft size={20} />
                </button>
                <h2 className="font-black text-gray-800 uppercase tracking-tight text-lg">Chat Klinis</h2>
             </div>
             
             <div className="flex bg-gray-100 p-1 rounded-xl">
                <button 
                  onClick={() => { setActiveTab('patients'); setSelectedUser(null); }}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'patients' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-400'}`}
                >
                   Pasien
                </button>
                <button 
                  onClick={() => { setActiveTab('colleagues'); setSelectedUser(null); }}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'colleagues' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'}`}
                >
                   Kader
                </button>
             </div>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar">
             {(activeTab === 'patients' ? patients : colleagues).map(u => (
                <div 
                   key={u.id}
                   onClick={() => setSelectedUser(u)}
                   className={`p-5 border-b border-gray-50 cursor-pointer hover:bg-slate-50 flex items-center gap-4 ${selectedUser?.id === u.id ? 'bg-emerald-50/50' : ''}`}
                >
                   <img src={u.avatar_url} className="w-12 h-12 rounded-2xl bg-gray-100 object-cover" />
                   <div className="flex-1 min-w-0">
                      <p className="font-black text-sm text-gray-900 truncate">{u.full_name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                         {activeTab === 'patients' ? 'Dalam Perawatan' : 'Mitra Lapangan'}
                      </p>
                   </div>
                </div>
             ))}
          </div>
       </div>

       {/* Chat Area */}
       <div className={`${!selectedUser ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-slate-50 h-full relative`}>
          {selectedUser ? (
             <>
               <div className="p-5 bg-white border-b border-gray-100 flex items-center gap-4 shadow-sm z-10">
                  <button onClick={() => setSelectedUser(null)} className="md:hidden p-2 -ml-2 text-gray-500"><ArrowLeft size={20}/></button>
                  <img src={selectedUser.avatar_url} className="w-10 h-10 rounded-xl object-cover" />
                  <div>
                      <h3 className="font-black text-slate-900 text-sm">{selectedUser.full_name}</h3>
                      <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Sesi Aktif</p>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={scrollRef}>
                  {messages.map(msg => {
                      const isMe = msg.sender_id === user?.id;
                      return (
                          <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[75%] px-5 py-3 rounded-[2rem] text-sm font-medium shadow-sm ${isMe ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'}`}>
                                  {msg.message}
                              </div>
                          </div>
                      );
                  })}
               </div>

               <div className="p-5 bg-white border-t border-gray-100">
                  <div className="flex gap-3 bg-slate-50 p-2 rounded-[2rem] border border-slate-200">
                      <input 
                         className="flex-1 bg-transparent px-4 py-2 outline-none text-sm font-bold text-slate-800"
                         placeholder="Tulis pesan..."
                         value={input}
                         onChange={e => setInput(e.target.value)}
                         onKeyDown={e => e.key === 'Enter' && handleSend()}
                      />
                      <button onClick={handleSend} className="p-3 bg-emerald-600 text-white rounded-full shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                          <Send size={18} />
                      </button>
                  </div>
               </div>
             </>
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                <MessageCircle size={64} className="mb-4 opacity-20" />
                <p className="font-black uppercase tracking-widest text-xs">Pilih percakapan untuk memulai</p>
             </div>
          )}
       </div>
    </div>
  );
};
