
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/mockSupabase';
import { Referral, ChatMessage, UserProfile } from '../../types';
import { 
  Send, 
  ArrowLeft, 
  ShieldCheck, 
  Lock, 
  MessageSquare,
  Users,
  Trash2,
  AlertCircle,
  Stethoscope
} from 'lucide-react';
import toast from 'react-hot-toast';

export const CoordinationChat: React.FC = () => {
  const { referralId } = useParams<{ referralId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [referral, setReferral] = useState<Referral | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [partner, setPartner] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Daftar peran yang diizinkan untuk mengirim pesan koordinasi
  const allowedChatRoles = ['psychologist', 'kader', 'counselor', 'bk', 'admin'];
  const canChat = user && allowedChatRoles.includes(user.role);

  useEffect(() => {
    if (referralId) loadInitialData();
  }, [referralId]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const ref = await api.getReferralById(referralId!);
      if (!ref) {
        toast.error("Rujukan tidak ditemukan");
        navigate(-1);
        return;
      }
      setReferral(ref);

      const partnerId = user?.role === 'psychologist' ? ref.kader_id : ref.psychologist_id;
      const allUsers = await api.getUsers();
      
      // Attempt to find partner in registered users
      let foundPartner = (allUsers || []).find(u => u.id === partnerId);
      
      // FALLBACK: If partner not found (e.g. dummy 'psy_1'), create synthetic profile to allow chatting
      if (!foundPartner && partnerId) {
          foundPartner = {
              id: partnerId,
              full_name: user?.role === 'psychologist' ? (ref.kader_name || 'Kader Pendamping') : 'Tim Psikolog',
              role: user?.role === 'psychologist' ? 'kader' : 'psychologist',
              username: 'professional',
              email: 'system@kitasohib.com',
              created_at: new Date().toISOString(),
              avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${partnerId}`
          };
      }
      
      setPartner(foundPartner || null);

      const msgs = await api.getMessages(user!.id, partnerId, referralId);
      setMessages(Array.isArray(msgs) ? msgs : []);
    } catch (e) {
      console.error("Chat Error", e);
      toast.error("Gagal memuat data koordinasi");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (referral && partner && user) {
      const interval = setInterval(async () => {
        const msgs = await api.getMessages(user.id, partner.id, referralId);
        setMessages(Array.isArray(msgs) ? msgs : []);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [referral, partner, user, referralId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || !user || !partner || !referralId) {
        if (!partner) toast.error("Koneksi partner belum siap. Mohon refresh.");
        return;
    }
    
    const text = inputText;
    setInputText('');
    setIsSending(true);
    
    try {
        // Kirim pesan dengan menyertakan nama dan role pengirim
        const userMsg = await api.sendMessage(
          user.id, 
          partner.id, 
          text, 
          false, 
          referralId, 
          user.full_name, 
          user.role
        );
        if (userMsg) {
            setMessages(prev => [...(prev || []), userMsg]);
        }
    } catch (e) {
        toast.error("Gagal mengirim pesan");
        setInputText(text); // Restore text on fail
    } finally {
        setIsSending(false);
    }
  };

  const handleDeleteChat = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Hapus pesan koordinasi ini?")) return;

    try {
      // Optimistic Delete
      setMessages(prev => (prev || []).filter(m => m.id !== id));
      
      // API call
      await api.deleteRow('chats', id);
      toast.success("Pesan dihapus");
    } catch (e) {
      toast.error("Gagal menghapus pesan");
      if (user && partner) {
        const msgs = await api.getMessages(user.id, partner.id, referralId);
        setMessages(Array.isArray(msgs) ? msgs : []);
      }
    }
  };

  const handleBack = () => {
      // Intelligent back navigation
      if (window.history.state && window.history.state.idx > 0) {
          navigate(-1);
      } else {
          const dashboardPath = user?.role === 'psychologist' ? '/dashboard/psychologist' : '/dashboard';
          navigate(dashboardPath);
      }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-600" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <aside className="hidden lg:flex flex-col w-80 bg-white border-r border-slate-200">
        <div className="p-8 border-b border-slate-100 bg-emerald-50/30">
           <button onClick={handleBack} className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-600 transition-all mb-6">
              <ArrowLeft size={14} /> Kembali
           </button>
           <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-600 rounded-xl shadow-lg shadow-emerald-500/10">
                 <ShieldCheck className="text-white" size={20} />
              </div>
              <h2 className="font-black text-emerald-800 text-sm uppercase tracking-tight">Info Koordinasi</h2>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
           <section>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Identitas Pasien</p>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                 <div className="flex items-center gap-3 mb-2">
                    <img src={referral?.user_avatar} className="w-10 h-10 rounded-xl object-cover" />
                    <div className="min-w-0">
                       <p className="font-black text-slate-800 text-xs truncate">{referral?.user_name}</p>
                       <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Skor Batin: {referral?.mood_score}/100</p>
                    </div>
                 </div>
              </div>
           </section>

           <section>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Catatan Awal</p>
              <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                 <p className="text-[11px] text-emerald-800 font-bold leading-relaxed italic">
                    "{referral?.notes}"
                 </p>
              </div>
           </section>

           <div className="bg-slate-900 rounded-[2rem] p-6 text-white relative overflow-hidden">
              <div className="relative z-10">
                 <div className="flex items-center gap-2 mb-3 text-emerald-400">
                    <Lock size={14} />
                    <p className="text-[9px] font-black uppercase tracking-widest">Jalur Aman (Privat)</p>
                 </div>
                 <p className="text-[10px] text-slate-300 font-medium leading-relaxed">
                    Percakapan ini hanya dapat diakses oleh Psikolog & Kader yang berwenang. Tersembunyi sepenuhnya dari remaja.
                 </p>
              </div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full -mr-12 -mt-12 blur-2xl" />
           </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full bg-white relative">
        <header className="bg-white/80 backdrop-blur-md border-b border-emerald-100 px-6 py-4 flex items-center justify-between z-10 shadow-sm">
           <div className="flex items-center gap-4">
              <button onClick={handleBack} className="lg:hidden p-2 bg-slate-50 rounded-xl text-slate-500 hover:bg-slate-100 transition-all">
                 <ArrowLeft size={18} />
              </button>
              <div className="relative">
                 <img src={partner?.avatar_url} className="w-11 h-11 rounded-xl object-cover bg-slate-50" />
                 <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
              </div>
              <div>
                 <h3 className="font-black text-slate-800 text-[15px] leading-tight">{partner?.full_name}</h3>
                 <div className="flex items-center gap-2 mt-0.5">
                    <Users size={12} className="text-emerald-600" />
                    <p className="text-[9px] text-emerald-600 font-black uppercase tracking-widest">
                       {partner?.role === 'psychologist' ? 'Psikolog Klinis' : 'Kader Pendamping'}
                    </p>
                 </div>
              </div>
           </div>
           
           <div className="hidden sm:flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 shadow-sm shadow-emerald-500/5">
              <ShieldCheck size={14} className="text-emerald-600" />
              <p className="text-[9px] text-emerald-600 font-black uppercase tracking-widest">Kasus #{referralId?.slice(-4)}</p>
           </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 pb-24 no-scrollbar bg-[#F8FFFA]">
           {(messages || []).length === 0 && (
             <div className="h-full flex flex-col items-center justify-center text-center p-10">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center mb-6 shadow-sm border border-emerald-100">
                   <MessageSquare size={32} />
                </div>
                <h4 className="text-slate-800 font-black text-lg mb-2 tracking-tight">Sinkronisasi Dimulai</h4>
                <p className="text-slate-400 text-xs font-medium max-w-xs leading-relaxed">
                   Selamat datang di ruang koordinasi profesional. Gunakan jalur ini untuk membahas penanganan medis dan dukungan psikososial pasien.
                </p>
             </div>
           )}

           {(messages || []).map(msg => {
             const isMe = msg.sender_id === user?.id;
             const isSystem = msg.sender_id === 'system';
             
             if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center my-6">
                    <div className="bg-emerald-50 px-6 py-2.5 rounded-full border border-emerald-100 flex items-center gap-2 shadow-sm shadow-emerald-500/5">
                       <ShieldCheck size={12} className="text-emerald-600" />
                       <span className="text-[10px] text-emerald-700 font-black uppercase tracking-widest">{msg.message}</span>
                    </div>
                  </div>
                )
             }

             const roleLabel = msg.sender_role === 'psychologist' ? 'PSIKOLOG' : 'KADER';

             return (
               <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group/msg mb-2`}>
                  {!isMe && (
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-4">
                      {msg.sender_name} • {roleLabel}
                    </span>
                  )}
                  <div className={`relative max-w-[75%] px-5 py-4 rounded-[2rem] text-[14px] leading-relaxed shadow-sm font-medium ${
                     isMe ? 'bg-emerald-600 text-white rounded-tr-none shadow-emerald-500/10' : 'bg-white text-slate-700 border border-emerald-50 rounded-tl-none'
                  }`}>
                     {isMe && (
                        <button 
                          onClick={(e) => handleDeleteChat(e, msg.id)}
                          className="absolute -left-10 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-red-500 transition-all opacity-0 group-hover/msg:opacity-100"
                          title="Hapus pesan"
                        >
                           <Trash2 size={14} />
                        </button>
                     )}
                     
                     {msg.message}
                     <div className="flex items-center justify-between mt-2 gap-4">
                        <p className={`text-[8px] font-black uppercase tracking-widest opacity-60 ${isMe ? 'text-emerald-100' : 'text-slate-400'}`}>
                           {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : '-'}
                        </p>
                     </div>
                  </div>
               </div>
             )
           })}
        </div>

        {canChat ? (
          <div className="p-6 bg-white border-t border-emerald-50 sticky bottom-0">
             <div className="flex gap-3 items-center bg-slate-50 p-2 rounded-[2rem] border border-slate-200 focus-within:border-emerald-500 focus-within:bg-white transition-all shadow-inner">
                <input
                   value={inputText}
                   onChange={e => setInputText(e.target.value)}
                   onKeyDown={e => e.key === 'Enter' && handleSend()}
                   placeholder={isSending ? "Mengirim..." : "Tulis catatan koordinasi klinis..."}
                   disabled={isSending}
                   className="flex-1 bg-transparent border-none outline-none px-4 text-sm font-bold text-slate-800 disabled:opacity-50"
                />
                <button
                   onClick={handleSend}
                   disabled={!inputText.trim() || isSending}
                   className="p-4 bg-emerald-600 text-white rounded-full shadow-lg shadow-emerald-500/20 disabled:opacity-50 active:scale-95 transition-all hover:bg-emerald-700"
                >
                   <Send size={18} />
                </button>
             </div>
          </div>
        ) : (
          <div className="p-6 bg-slate-50 border-t border-gray-100 text-center">
             <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <AlertCircle size={14} /> Mode Baca Saja
             </div>
          </div>
        )}
      </main>
    </div>
  );
};
