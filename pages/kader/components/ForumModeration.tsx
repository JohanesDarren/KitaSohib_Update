
import React, { useState, useEffect } from 'react';
import { ForumPost, ForumComment } from '../../../types';
import { api } from '../../../services/mockSupabase'; 
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertCircle, 
  Search, 
  UserCircle2, 
  Clock, 
  MessageSquare, 
  Send, 
  X, 
  Heart, 
  Trash2,
  ChevronRight,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';

export const ForumModeration: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // State for interaction
  const [activePost, setActivePost] = useState<ForumPost | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setIsLoading(true);
    try {
      const data = await api.getForumPosts();
      setPosts(data);
      // Update active post if modal is open to show new comments
      if (activePost) {
        const current = data.find(p => p.id === activePost.id);
        if (current) setActivePost(current);
      }
    } catch (e) {
      console.error("Gagal memuat forum");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReply = async () => {
    if (!user || !activePost || !replyContent.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await api.replyForumPost(activePost.id, user.id, replyContent);
      setReplyContent('');
      toast.success("Balasan terkirim! 🕊️");
      await loadPosts(); // Refresh list and active post
    } catch (e) {
      toast.error("Gagal membalas diskusi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (e: React.MouseEvent, postId: string, commentId: string) => {
    e.stopPropagation();
    if (!window.confirm("Hapus balasan Anda?")) return;

    try {
      await api.deleteForumComment(postId, commentId);
      toast.success("Balasan dihapus");
      await loadPosts();
    } catch (e) {
      toast.error("Gagal menghapus balasan.");
    }
  };

  const filtered = posts.filter(p => 
    (p.content || '').toLowerCase().includes(search.toLowerCase()) || 
    (p.user_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-10 pb-24 md:pb-10 bg-gray-50 no-scrollbar relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
           <h2 className="text-3xl font-black text-gray-900 tracking-tight">Diskusi Sambung Rasa</h2>
           <p className="text-gray-500 font-medium mt-1">Berikan bimbingan atau dukungan positif pada cerita para remaja.</p>
        </div>
        <div className="relative group flex-1 max-w-md">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
           <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari konten atau nama..." 
              className="w-full bg-white border border-gray-100 pl-12 pr-6 py-4 rounded-2xl text-sm font-bold shadow-sm focus:ring-4 focus:ring-primary-50 outline-none"
           />
        </div>
      </div>

      {isLoading && posts.length === 0 ? (
        <div className="py-20 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500 mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
            {filtered.map((post) => (
            <motion.div 
                key={post.id}
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setActivePost(post)}
                className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center justify-between cursor-pointer group hover:border-primary-200 transition-all"
            >
                <div className="flex items-center gap-5 flex-1 min-w-0">
                {post.is_anonymous ? (
                    <div className="w-14 h-14 bg-gray-50 text-gray-300 rounded-2xl flex items-center justify-center border border-gray-100 shrink-0"><UserCircle2 size={32}/></div>
                ) : (
                    <img src={post.user_avatar} alt={post.user_name} className="w-14 h-14 rounded-2xl object-cover border border-gray-100 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-black text-gray-900">{post.is_anonymous ? 'Remaja Anonim' : post.user_name}</h4>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg ${post.is_anonymous ? 'bg-slate-100 text-slate-500' : 'bg-primary-50 text-primary-600'}`}>
                            {post.is_anonymous ? 'Anonim' : 'Publik'}
                        </span>
                    </div>
                    <p className="text-gray-600 text-sm font-medium line-clamp-2 italic">"{post.content}"</p>
                    <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold">
                            <Clock size={12}/> {new Date(post.created_at).toLocaleString('id-ID')}
                        </div>
                        <div className="text-[10px] text-gray-400 font-bold flex items-center gap-3">
                            <span>• {post.likes?.length || 0} Suka</span>
                            <span className="flex items-center gap-1"><MessageSquare size={12}/> {post.comments?.length || 0} Komentar</span>
                        </div>
                    </div>
                </div>
                </div>
                
                <div className="px-6 py-3 bg-slate-50 group-hover:bg-primary-500 group-hover:text-white rounded-2xl flex items-center gap-2 text-slate-400 shrink-0 transition-all font-black text-[10px] uppercase tracking-widest">
                <MessageCircle size={16} />
                Lihat & Diskusi
                </div>
            </motion.div>
            ))}

            {filtered.length === 0 && (
            <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-gray-200">
                <AlertCircle size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Tidak ada postingan ditemukan</p>
            </div>
            )}
        </div>
      )}

      {/* DETAIL POST MODAL FOR KADER */}
      <AnimatePresence>
        {activePost && (
            <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6">
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                 className="bg-white w-full max-w-2xl h-[85vh] flex flex-col shadow-2xl rounded-[3rem] overflow-hidden relative"
                 onClick={(e) => e.stopPropagation()}
               >
                   <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                       <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary-50 text-primary-600 rounded-xl"><MessageSquare size={20}/></div>
                          <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Detail Diskusi</h3>
                       </div>
                       <button onClick={() => setActivePost(null)} className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:bg-gray-100 active:scale-90 transition-all"><X size={24}/></button>
                   </div>

                   <div className="flex-1 overflow-y-auto p-10 no-scrollbar bg-white">
                       <div className="mb-10 pb-10 border-b border-gray-100">
                            <div className="flex items-center gap-4 mb-6">
                               {activePost?.is_anonymous ? (
                                   <div className="w-12 h-12 bg-gray-50 text-gray-300 rounded-2xl flex items-center justify-center border border-gray-100"><UserCircle2 size={28}/></div>
                               ) : (
                                   <img src={activePost?.user_avatar} className="w-12 h-12 rounded-2xl object-cover border border-gray-100" alt="Avatar" />
                               )}
                               <div>
                                  <span className="font-black text-slate-900 text-sm block">{activePost?.is_anonymous ? 'Remaja Anonim' : activePost?.user_name}</span>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(activePost.created_at).toLocaleDateString()}</span>
                               </div>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                               <p className="text-slate-700 text-base leading-relaxed font-medium italic">"{activePost?.content}"</p>
                            </div>
                       </div>

                       <div className="space-y-8 mb-10">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Diskusi & Balasan ({activePost?.comments?.length || 0})</p>
                           {activePost?.comments?.length > 0 ? (
                               activePost.comments.map((rep: ForumComment) => (
                                   <div key={rep.id} className="flex gap-4 items-start group/comment">
                                       <img src={rep.user_avatar || `https://ui-avatars.com/api/?name=${rep.user_name}`} className="w-10 h-10 rounded-xl bg-gray-100 flex-shrink-0 object-cover" alt="Avatar" />
                                       <div className="flex-1 min-w-0">
                                           <div className="bg-white p-5 rounded-[2rem] rounded-tl-none border border-slate-100 shadow-sm relative group">
                                               <div className="flex justify-between items-center mb-2">
                                                  <p className="font-black text-primary-600 text-[11px] uppercase tracking-widest">{rep.user_name}</p>
                                                  {user?.id === rep.user_id && (
                                                     <button 
                                                       onClick={(e) => handleDeleteComment(e, activePost.id, rep.id)}
                                                       className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                                       title="Hapus balasan saya"
                                                     >
                                                       <Trash2 size={14} />
                                                     </button>
                                                  )}
                                               </div>
                                               <p className="text-slate-700 text-sm leading-relaxed font-bold">{rep.content}</p>
                                           </div>
                                           <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest ml-4 mt-2 block">
                                              {new Date(rep.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                           </span>
                                       </div>
                                   </div>
                               ))
                           ) : (
                               <div className="text-center py-10 opacity-30 text-slate-400">
                                   <p className="text-xs font-bold uppercase tracking-widest">Belum ada diskusi di postingan ini</p>
                               </div>
                           )}
                       </div>
                   </div>

                   {/* REPLY BOX FOR KADER */}
                   <div className="p-8 bg-white border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
                       <div className="flex gap-3 items-center bg-slate-50 p-2 rounded-[2rem] border border-slate-200 focus-within:border-primary-400 focus-within:bg-white transition-all shadow-inner">
                           <input 
                               value={replyContent}
                               onChange={(e) => setReplyContent(e.target.value)}
                               onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                               placeholder="Tulis bimbingan atau dukungan positif..." 
                               className="flex-1 bg-transparent border-0 px-6 py-3 text-sm focus:ring-0 outline-none text-slate-800 font-bold"
                           />
                           <button 
                               onClick={handleReply}
                               disabled={!replyContent.trim() || isSubmitting}
                               className="bg-primary-600 text-white p-4 rounded-full shadow-lg shadow-primary-500/20 active:scale-90 disabled:opacity-50 transition-all"
                           >
                               <Send size={20} />
                           </button>
                       </div>
                       <p className="text-[9px] text-center text-slate-400 mt-4 font-black uppercase tracking-widest">
                          Komentar Anda akan tampil sebagai identitas Kader Jiwa
                       </p>
                   </div>
               </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
};
