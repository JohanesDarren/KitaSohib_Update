
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, ChatMessage } from '../../../types';
import { api } from '../../../services/mockSupabase';
import { Send, ArrowLeft, ShieldAlert, UserCheck, MessageCircle, Stethoscope, Users } from 'lucide-react';
import toast from 'react-hot-toast';

interface KaderChatProps {
  kaderId: string;
}

export const KaderChat: React.FC<KaderChatProps> = ({ kaderId }) => {
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [chatUsers, setChatUsers] = useState<UserProfile[]>([]);
  const [psychologists, setPsychologists] = useState<UserProfile[]>([]);
  const [activeTab, setActiveTab] = useState<'students' | 'colleagues'>('students');
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChats();
  }, [kaderId, activeTab]);

  const loadChats = async () => {
    if (activeTab === 'students') {
      // Memuat siswa binaan
      const users = await api.getRecentChats(kaderId);
      setChatUsers(users.filter(u => u.role === 'user'));
    } else {
      // Memuat daftar psikolog
      const psys = await api.getPsychologists();
      setPsychologists(psys);
    }
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      if (selectedUser) {
        // VALIDASI KEAMANAN HANYA UNTUK USER BIASA (REMAJA)
        if (selectedUser.role === 'user') {
           const latestUser = (await api.getUsers()).find(u => u.id === selectedUser.id);
           if (latestUser?.assigned_kader_id !== kaderId) {
             setIsAuthorized(false);
             setSelectedUser(null);
             toast.error("Otoritas akses dicabut. Remaja telah memilih kader lain.");
             return;
           }
        }

        const msgs = await api.getMessages(kaderId, selectedUser.id);
        setMessages(msgs);
      }
    }, 10000); // 10s interval
    return () => clearInterval(interval);
  }, [kaderId, selectedUser]);

  useEffect(() => {
    if (selectedUser) {
      api.getMessages(kaderId, selectedUser.id).then(setMessages);
      setIsAuthorized(true);
    }
  }, [selectedUser, kaderId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!selectedUser || !input.trim()) return;
    
    // Validasi ulang untuk siswa
    if (selectedUser.role === 'user') {
       const latestUser = (await api.getUsers()).find(u => u.id === selectedUser.id);
       if (latestUser?.assigned_kader_id !== kaderId) {
          toast.error("Gagal mengirim: Anda tidak memiliki otoritas untuk percakapan ini.");
          return;
       }
    }

    const msg = await api.sendMessage(kaderId, selectedUser.id, input, false);
    setMessages([...messages, msg]);
    setInput('');
  };

  return (
    <div className="flex flex-1 h-full overflow-hidden bg-white md:bg-gray-50 pb-20 md:pb-0 font-sans">
      {/* Sidebar List */}
      <div className={`${selectedUser ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-r border-gray-200 bg-white flex-col h-full`}>
        <div className="p-6 border-b border-gray-100">
           <h2 className="font-black text-gray-800 text-lg uppercase tracking-tight mb-4">Chat Room</h2>
           
           {/* Tab Switcher */}
           <div className="flex p-1 bg-gray-100 rounded-xl">
              <button 
                onClick={() => { setActiveTab('students'); setSelectedUser(null); }}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'students' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'}`}
              >
                 <Users size={12} /> Remaja
              </button>
              <button 
                onClick={() => { setActiveTab('colleagues'); setSelectedUser(null); }}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'colleagues' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-400'}`}
              >
                 <Stethoscope size={12} /> Rekan Klinis
              </button>
           </div>
        </div>
        
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {activeTab === 'students' ? (
            <>
                <div className="p-4 bg-indigo-50/50 border-b border-indigo-100 flex items-center gap-2 mb-2">
                   <UserCheck size={14} className="text-indigo-600" />
                   <p className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em]">Tanggung Jawab Anda</p>
                </div>
                {chatUsers.map(u => (
                  <div
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    className={`p-5 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-all border-b border-gray-50 ${selectedUser?.id === u.id ? 'bg-indigo-50/50 border-indigo-200' : ''}`}
                  >
                    <div className="relative">
                      <img src={u.avatar_url} className="w-12 h-12 rounded-2xl bg-gray-100 object-cover border border-gray-100" />
                      <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                         <p className="font-black text-sm text-gray-900 truncate">{u.full_name}</p>
                         {u.latest_mood && u.latest_mood < 3 && <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />}
                      </div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Chat Aktif</p>
                    </div>
                  </div>
                ))}
                {chatUsers.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-64 text-center p-8">
                        <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center mb-4 border border-slate-100">
                            <MessageCircle className="text-slate-300" size={32}/>
                        </div>
                        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] leading-loose">
                           Belum ada remaja yang <br/> memilih Anda sebagai mentor.
                        </p>
                    </div>
                )}
            </>
          ) : (
            <>
                <div className="p-4 bg-emerald-50/50 border-b border-emerald-100 flex items-center gap-2 mb-2">
                   <Stethoscope size={14} className="text-emerald-600" />
                   <p className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em]">Daftar Psikolog</p>
                </div>
                {psychologists.map(psy => (
                  <div
                    key={psy.id}
                    onClick={() => setSelectedUser(psy)}
                    className={`p-5 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-all border-b border-gray-50 ${selectedUser?.id === psy.id ? 'bg-emerald-50/50 border-emerald-200' : ''}`}
                  >
                    <div className="relative">
                      <img src={psy.avatar_url} className="w-12 h-12 rounded-2xl bg-gray-100 object-cover border border-gray-100" />
                      <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-blue-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm text-gray-900 truncate">{psy.full_name}</p>
                      <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-1">Psikolog Klinis</p>
                    </div>
                  </div>
                ))}
            </>
          )}
        </div>
      </div>

      {/* Chat Pane */}
      <div className={`${!selectedUser ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-gray-50 h-full relative`}>
        {selectedUser ? (
          <>
            <div className="p-5 bg-white border-b border-gray-100 flex items-center gap-4 shadow-sm z-10">
              <button onClick={() => setSelectedUser(null)} className="md:hidden p-2 -ml-2 hover:bg-slate-100 rounded-xl transition-all">
                <ArrowLeft size={20} className="text-gray-700"/>
              </button>
              <img src={selectedUser.avatar_url} className="w-11 h-11 rounded-2xl object-cover border border-slate-100 shadow-sm" />
              <div>
                  <h3 className="font-black text-gray-900 text-[15px]">{selectedUser.full_name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                     <div className={`w-2 h-2 rounded-full ${selectedUser.role === 'psychologist' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
                     <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                        {selectedUser.role === 'psychologist' ? 'Rekan Profesional' : 'Remaja Binaan'}
                     </p>
                  </div>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F8FAFC] no-scrollbar">
              {messages.map(msg => {
                const isMe = msg.sender_id === kaderId;
                const isAutoReport = msg.message.includes('skor') && msg.message.includes('Kategori Berat');
                const bubbleColor = selectedUser.role === 'psychologist' ? (isMe ? 'bg-emerald-600 text-white' : 'bg-white text-gray-900') : (isMe ? 'bg-indigo-600 text-white' : 'bg-white text-gray-900');
                const shadowColor = selectedUser.role === 'psychologist' ? 'shadow-emerald-500/10' : 'shadow-indigo-500/10';

                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-5 py-3.5 rounded-[2rem] text-[15px] leading-relaxed shadow-sm font-medium ${bubbleColor} ${isMe ? 'rounded-tr-none' : 'rounded-tl-none border border-gray-100'} ${shadowColor}`}>
                      {isAutoReport && (
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-red-200">
                           <ShieldAlert size={14} className="text-red-600" />
                           <span className="text-[10px] font-black uppercase tracking-widest text-red-600">Laporan Rujukan Otomatis</span>
                        </div>
                      )}
                      {msg.message}
                      <p className={`text-[9px] mt-2 font-black uppercase tracking-widest opacity-60`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="p-6 bg-white border-t border-gray-100">
              <div className={`flex gap-3 items-center bg-slate-50 p-2 rounded-[2rem] border border-slate-200 transition-all shadow-inner ${selectedUser.role === 'psychologist' ? 'focus-within:border-emerald-500' : 'focus-within:border-indigo-500'}`}>
                <input
                  className="flex-1 bg-transparent px-5 py-3 text-[15px] outline-none text-gray-900 font-bold"
                  placeholder="Tulis pesan..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                />
                <button 
                    onClick={handleSend} 
                    disabled={!input.trim()}
                    className={`p-4 text-white rounded-full disabled:opacity-50 transition-all shadow-xl active:scale-90 ${selectedUser.role === 'psychologist' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'}`}
                >
                    <Send size={18} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-12 text-center bg-white">
            <div className="w-24 h-24 bg-indigo-50 text-indigo-500 rounded-[3rem] flex items-center justify-center mb-8 border border-indigo-100 shadow-sm">
                <MessageCircle size={48} />
            </div>
            <h3 className="text-slate-900 font-black text-2xl mb-3 tracking-tight">Pilih Teman Chat</h3>
            <p className="max-w-xs text-slate-500 font-medium text-sm leading-relaxed">
               Silakan pilih Remaja untuk bimbingan atau Rekan Klinis untuk diskusi profesional.
            </p>
          </div>
        )}

        {/* ACCESS DENIED OVERLAY */}
        {!isAuthorized && (
           <div className="absolute inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center p-12 text-center">
              <div className="w-20 h-20 bg-red-500 text-white rounded-full flex items-center justify-center mb-6 shadow-2xl animate-bounce">
                 <ShieldAlert size={40} />
              </div>
              <h2 className="text-white font-black text-2xl mb-4">Akses Ditolak!</h2>
              <p className="text-slate-300 text-sm max-w-sm mb-8 font-medium">
                 Anda tidak memiliki otoritas untuk mengakses percakapan ini. Remaja berhak memilih pembimbing mereka sendiri.
              </p>
              <button 
                onClick={() => { setIsAuthorized(true); setActiveTab('students'); loadChats(); setSelectedUser(null); }}
                className="px-8 py-3 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all"
              >
                 Kembali ke Daftar
              </button>
           </div>
        )}
      </div>
    </div>
  );
};
