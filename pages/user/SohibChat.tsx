

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/mockSupabase';
import { ChatMessage, InboxItem, UserProfile } from '../../types';
import { GoogleGenAI } from "@google/genai";
import { 
  Send, Bot, User, Users, ArrowLeft, MoreVertical, 
  Sparkles, Smile, MessageCircle, Search, Check, CheckCheck, Globe,
  Stethoscope
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

// Updated Tab Type: 'kader' changed to 'konselor' to encompass both
type ChatTab = 'ai' | 'konselor' | 'teman';
type Language = 'id' | 'su' | 'en';

export const SohibChat: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- STATE ---
  const [activeTab, setActiveTab] = useState<ChatTab>('ai');
  const [selectedContact, setSelectedContact] = useState<InboxItem | null>(null);
  const [language, setLanguage] = useState<Language>('id');
  
  // Data Lists
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [directory, setDirectory] = useState<UserProfile[]>([]); 
  const [loadingList, setLoadingList] = useState(false);
  
  // Chat Room State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // --- INITIALIZATION ---
  useEffect(() => {
    if (!user) return;
    
    // Initial Load
    loadInbox();
    loadDirectory();

    // Handle Deep Links
    if (location.state?.targetUserId) {
      handleDeepLink(location.state.targetUserId);
    } else if (location.state?.filter === 'kader') {
      setActiveTab('konselor');
    } else if (location.state?.reset) {
      // Force reset to default view if navigation requested it
      setSelectedContact(null);
      setActiveTab('ai');
    }

    // Refresh Inbox Periodically (AppScript is slower, so 10s interval)
    const inboxInterval = setInterval(loadInbox, 10000);
    return () => clearInterval(inboxInterval);
  }, [user, location.state]);

  const loadInbox = async () => {
    if (!user) return;
    try {
      // Don't set global loading spinner for background refresh
      const data = await api.getInboxSummary(user.id);
      setInbox(data);
    } catch (e) {
      console.error("Inbox load error", e);
    }
  };

  const loadDirectory = async () => {
    try {
      const all = await api.getUsers();
      setDirectory(all.filter(u => u.id !== user?.id));
    } catch (e) {}
  };

  const handleDeepLink = async (targetId: string) => {
    if (targetId === 's_ai') {
      setActiveTab('ai');
    } else {
      const targetUser = (await api.getUsers()).find(u => u.id === targetId);
      if (targetUser) {
        const item: InboxItem = {
           ...targetUser,
           lastMessage: '',
           lastTime: new Date().toISOString(),
           unreadCount: 0
        };
        // Auto switch tab based on role
        if (targetUser.role === 'kader' || targetUser.role === 'psychologist') {
            setActiveTab('konselor');
        } else {
            setActiveTab('teman');
        }
        setSelectedContact(item);
      }
    }
  };

  // --- CHAT ROOM LOGIC ---
  useEffect(() => {
    if (selectedContact && user && activeTab !== 'ai') {
      api.markMessagesAsRead(user.id, selectedContact.id).then(loadInbox);
    }
  }, [selectedContact, user]);

  useEffect(() => {
    if (!user) return;

    if (activeTab === 'ai') {
      if (!selectedContact) {
         // Default welcome message depends on language roughly, but kept generic here or based on initial state
         const welcomeMsg = language === 'en' 
            ? `Hi ${user.full_name.split(' ')[0]}! 👋 I'm SohibAI. Anything on your mind?`
            : language === 'su'
            ? `Sampurasun ${user.full_name.split(' ')[0]}! 👋 Abdi SohibAI. Aya nu bade dicarioskeun?`
            : `Halo ${user.full_name.split(' ')[0]}! 👋 Aku SohibAI. Ada yang mau diceritain hari ini?`;

         if (messages.length === 0) {
             setMessages([{
                id: 'ai-welcome', sender_id: 's_ai', receiver_id: user.id,
                message: location.state?.initialMessage || welcomeMsg,
                is_ai: true, timestamp: new Date().toISOString()
             }]);
         }
      }
      return;
    }

    if (selectedContact) {
      const fetchMsgs = async () => {
        const msgs = await api.getMessages(user.id, selectedContact.id);
        setMessages(msgs);
      };
      fetchMsgs();
      const interval = setInterval(fetchMsgs, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab, selectedContact, user, language]); // Re-trigger slightly if language changes for welcome msg context if empty

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping, activeTab, selectedContact]);

  const handleSend = async () => {
    if (!inputText.trim() || !user) return;
    const text = inputText;
    setInputText('');

    if (activeTab !== 'ai' && selectedContact) {
      const tempMsg: ChatMessage = {
        id: 'temp-' + Date.now(), sender_id: user.id, receiver_id: selectedContact.id,
        message: text, is_ai: false, timestamp: new Date().toISOString(), is_read: false
      };
      setMessages(prev => [...prev, tempMsg]);
      
      try {
        await api.sendMessage(user.id, selectedContact.id, text, false);
        loadInbox(); 
      } catch (e) {
        toast.error("Gagal mengirim");
      }
      return;
    }

    if (activeTab === 'ai') {
      const userMsg: ChatMessage = {
        id: 'u-' + Date.now(), sender_id: user.id, receiver_id: 's_ai',
        message: text, is_ai: false, timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMsg]);
      setIsTyping(true);

      try {
        // Construct language-specific instruction
        let langInstruction = "";
        if (language === 'su') {
            langInstruction = "Bahasa Sunda anu akrab/loma (seperti ke teman dekat). Jangan terlalu formal/kasar.";
        } else if (language === 'en') {
            langInstruction = "Casual, friendly English.";
        } else {
            langInstruction = "Bahasa Indonesia gaul, santai, hangat, dan suportif.";
        }

        const historyContext = messages.slice(-5).map(m => `${m.is_ai ? 'SohibAI' : 'User'}: ${m.message}`).join('\n');
        
        const prompt = `
          Role: Kamu adalah SohibAI, teman curhat remaja yang asik.
          Bahasa: Gunakan ${langInstruction}.
          
          Aturan Format (PENTING):
          1. JANGAN gunakan Bold (**teks**) atau Italic (*teks*). Gunakan teks biasa agar bersih.
          2. Hindari paragraf panjang (wall of text).
          3. Gunakan poin-poin (bullet points - ) jika memberikan saran atau langkah-langkah agar mudah dibaca.
          4. Jawab dengan ringkas tapi padat makna (to the point).
          
          Context Percakapan:
          ${historyContext}
          
          User: "${text}"
        `;
        
        // Always initialize GoogleGenAI instance right before the API call as per guidelines
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
        const responseText = response.text || "...";
        
        // Cleanup markdown if AI slips up (optional safety)
        const cleanText = responseText.replace(/\*\*/g, '').replace(/\*/g, '');

        const aiMsg: ChatMessage = {
          id: 'ai-' + Date.now(), sender_id: 's_ai', receiver_id: user.id,
          message: cleanText, is_ai: true, timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiMsg]);
      } catch (e) {
        toast.error("SohibAI sibuk.");
      } finally {
        setIsTyping(false);
      }
    }
  };

  const getDisplayList = () => {
    if (activeTab === 'ai') return [];

    let roleFilter: string[] = [];
    if (activeTab === 'konselor') roleFilter = ['kader', 'psychologist'];
    else roleFilter = ['user']; // 'teman'

    const inboxItems = inbox.filter(i => roleFilter.includes(i.role));
    
    // Directory filtering: Users matching role AND not already in inbox
    const directoryItems = directory
        .filter(u => roleFilter.includes(u.role) && !inbox.some(i => i.id === u.id))
        .map(u => ({ ...u, lastMessage: '', lastTime: '', unreadCount: 0 }));

    return [...inboxItems, ...directoryItems];
  };

  const displayList = getDisplayList();

  const formatTime = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    return isToday 
      ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      : date.toLocaleDateString([], { day: 'numeric', month: 'short' });
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      
      {/* 1. STICKY HEADER (Navigation) */}
      <div className="bg-white/95 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-30 pt-6 pb-2">
        <div className="flex items-center justify-between px-4 mb-4">
           {selectedContact ? (
             <div className="flex items-center gap-3">
               <button 
                 onClick={() => { setSelectedContact(null); if(activeTab === 'ai') setMessages([]); }} 
                 className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-all text-slate-600"
               >
                 <ArrowLeft size={22} />
               </button>
               <div className="flex items-center gap-3">
                  <img src={selectedContact.avatar_url} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                  <div>
                     <h3 className="font-black text-slate-800 text-base">{selectedContact.full_name}</h3>
                     <div className="flex items-center gap-1">
                        {selectedContact.role === 'psychologist' && <Stethoscope size={10} className="text-emerald-500" />}
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            {selectedContact.role === 'kader' ? 'Mentor' : selectedContact.role === 'psychologist' ? 'Psikolog' : 'Teman'}
                        </p>
                     </div>
                  </div>
               </div>
             </div>
           ) : (
             <div className="flex items-center justify-between w-full">
               <h1 className="text-2xl font-black text-slate-800 tracking-tight">Pesan</h1>
               
               {/* Language Selector Only for AI Tab */}
               {activeTab === 'ai' && (
                 <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-xl">
                    <Globe size={12} className="text-slate-400" />
                    <select 
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as Language)}
                      className="bg-transparent text-[10px] font-black uppercase text-slate-500 outline-none cursor-pointer border-none p-0 focus:ring-0"
                    >
                      <option value="id">Indonesia</option>
                      <option value="su">Sunda</option>
                      <option value="en">English</option>
                    </select>
                 </div>
               )}
             </div>
           )}
           
           {/* Tab Switcher */}
           {!selectedContact && (
              <div className="flex bg-slate-100 p-1 rounded-xl ml-4">
                 {(['ai', 'konselor', 'teman'] as ChatTab[]).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                        activeTab === tab 
                          ? tab === 'ai' ? 'bg-purple-600 text-white shadow-md' : 'bg-white text-slate-900 shadow-sm' 
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                       {tab === 'ai' ? 'AI' : tab === 'konselor' ? 'Ahli' : 'Teman'}
                    </button>
                 ))}
              </div>
           )}
        </div>
      </div>

      {/* 2. MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto no-scrollbar relative bg-slate-50">
        {(selectedContact || activeTab === 'ai') ? (
           <div className="min-h-full pb-24">
              <div className="p-4 space-y-3" ref={scrollRef}>
                 {activeTab === 'ai' && (
                    <div className="text-center py-6 mb-4">
                       <div className="w-16 h-16 bg-purple-50 text-purple-500 rounded-[2rem] flex items-center justify-center mx-auto mb-3 border border-purple-100 shadow-sm">
                          <Bot size={32} />
                       </div>
                       <h3 className="font-black text-slate-800 text-sm">SohibAI</h3>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {language === 'su' ? 'Rencang Curhat 24/7' : language === 'en' ? 'Your 24/7 Buddy' : 'Teman Cerita 24/7'}
                       </p>
                    </div>
                 )}

                 {messages.map((msg, idx) => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                       <motion.div 
                         key={msg.id || idx}
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                       >
                          <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-[14px] leading-relaxed shadow-sm font-medium ${
                             isMe 
                               ? 'bg-blue-600 text-white rounded-tr-none' 
                               : activeTab === 'ai' 
                                  ? 'bg-white text-slate-800 border border-purple-100 rounded-tl-none shadow-purple-500/5'
                                  : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                          }`}>
                             {/* Render message with line breaks support */}
                             <div className="whitespace-pre-wrap">{msg.message}</div>
                             
                             <div className={`flex justify-end items-center gap-1 mt-1 ${isMe ? 'text-blue-200' : 'text-slate-300'}`}>
                                <span className="text-[9px] font-bold">
                                   {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''}
                                </span>
                                {isMe && activeTab !== 'ai' && (
                                   (msg.is_read || String(msg.is_read) === 'true') ? <CheckCheck size={12} /> : <Check size={12} />
                                )}
                             </div>
                          </div>
                       </motion.div>
                    )
                 })}
                 {isTyping && (
                    <div className="flex justify-start">
                       <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-purple-100 shadow-sm flex gap-1">
                          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"></span>
                          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce delay-75"></span>
                          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce delay-150"></span>
                       </div>
                    </div>
                 )}
              </div>
           </div>
        ) : (
           <div className="p-2 space-y-1">
              {displayList.length > 0 ? (
                 displayList.map(item => (
                    <motion.div
                       key={item.id}
                       initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                       onClick={() => setSelectedContact(item)}
                       className="bg-white p-4 flex gap-4 cursor-pointer hover:bg-slate-50 active:bg-slate-100 transition-colors border-b border-slate-50 last:border-0"
                    >
                       <div className="relative">
                          <img src={item.avatar_url} className="w-14 h-14 rounded-full object-cover bg-slate-100" />
                          {item.role === 'psychologist' && (
                             <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 border border-slate-100">
                                <div className="bg-emerald-500 w-3 h-3 rounded-full"></div>
                             </div>
                          )}
                       </div>
                       <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <div className="flex justify-between items-baseline mb-1">
                             <h3 className="font-black text-slate-800 text-[15px] truncate flex items-center gap-1">
                                {item.full_name}
                                {item.role === 'psychologist' && <Stethoscope size={12} className="text-emerald-500" />}
                             </h3>
                             <span className={`text-[10px] font-bold ${item.unreadCount > 0 ? 'text-green-600' : 'text-slate-400'}`}>
                                {formatTime(item.lastTime)}
                             </span>
                          </div>
                          <div className="flex justify-between items-center">
                             <p className={`text-sm truncate pr-4 ${item.unreadCount > 0 ? 'font-black text-slate-900' : 'font-medium text-slate-500'}`}>
                                {item.lastMessage || <span className="italic text-slate-400">Ketuk untuk mulai chat...</span>}
                             </p>
                             {item.unreadCount > 0 && (
                                <div className="min-w-[20px] h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-lg shadow-green-500/30">
                                   {item.unreadCount}
                                </div>
                             )}
                          </div>
                       </div>
                    </motion.div>
                 ))
              ) : (
                 <div className="py-20 text-center opacity-40">
                    <Users size={40} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Belum ada kontak</p>
                 </div>
              )}
           </div>
        )}
      </div>

      {(selectedContact || activeTab === 'ai') && (
         <div className="p-4 bg-white border-t border-slate-100 sticky bottom-0 z-40 pb-8 sm:pb-4">
            <div className={`flex items-center gap-2 p-2 rounded-[2rem] border transition-all ${
               activeTab === 'ai' 
                  ? 'bg-purple-50 border-purple-100 focus-within:border-purple-300' 
                  : 'bg-slate-100 border-slate-200 focus-within:border-blue-300 focus-within:bg-white'
            }`}>
               <div className={`p-2.5 rounded-full ${activeTab === 'ai' ? 'bg-white text-purple-500' : 'bg-white text-slate-400'}`}>
                  {activeTab === 'ai' ? <Sparkles size={20} /> : <Smile size={20} />}
               </div>
               <input 
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-slate-800 placeholder:text-slate-400"
                  placeholder={
                     activeTab === 'ai' 
                     ? (language === 'en' ? "Ask SohibAI..." : language === 'su' ? "Taros SohibAI..." : "Tanya SohibAI...") 
                     : "Ketik pesan..."
                  }
                  autoFocus
               />
               <button 
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  className={`p-3 rounded-full text-white shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none ${
                     activeTab === 'ai' 
                        ? 'bg-purple-600 shadow-purple-500/30' 
                        : 'bg-blue-600 shadow-blue-500/30'
                  }`}
               >
                  <Send size={18} />
               </button>
            </div>
         </div>
      )}
    </div>
  );
};