
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { api } from '../../services/mockSupabase';
import { ForumPost, ForumComment } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { 
  MessageSquare, Heart, Shield, Plus, X, 
  MoreHorizontal, Send, UserCircle2, MessageCircle, 
  Trash2, Search, Bell, Sparkles, Clock,
  UserCheck, SlidersHorizontal, ChevronRight,
  Quote, AlertTriangle, User
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

// Standardized Avatar Component for Forum
const ForumAvatar = ({ isAnonymous, avatarUrl, name, isMentor, size = "md" }: { 
  isAnonymous?: boolean, 
  avatarUrl?: string, 
  name?: string, 
  isMentor?: boolean,
  size?: "sm" | "md" | "lg"
}) => {
  const sizeClasses = {
    sm: "w-10 h-10 rounded-xl",
    md: "w-12 h-12 rounded-2xl",
    lg: "w-14 h-14 rounded-[1.5rem]"
  };

  const iconSizes = {
    sm: 18,
    md: 22,
    lg: 26
  };

  const frameClass = `${sizeClasses[size]} flex-shrink-0 relative flex items-center justify-center overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-100`;

  if (isAnonymous) {
    return (
      <div className={`${frameClass} bg-slate-100 text-slate-400`}>
        <Shield size={iconSizes[size]} />
      </div>
    );
  }

  return (
    <div className={`${frameClass} ${isMentor ? 'ring-primary-400 ring-2' : 'ring-slate-100'} bg-slate-50`}>
      {avatarUrl ? (
        <img src={avatarUrl} className="w-full h-full object-cover" alt={name} />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-primary-50 text-primary-500">
           <User size={iconSizes[size]} />
        </div>
      )}
    </div>
  );
};

export const Forum: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [isAnon, setIsAnon] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');
  
  const [activePost, setActivePost] = useState<ForumPost | null>(null);
  const [replyContent, setReplyContent] = useState('');
  
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const categories = ['Semua', 'Populer', 'Mentor', 'Cerita', 'Dukungan'];

  useEffect(() => {
    if (activePost || isCreating || deleteConfirmId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [activePost, isCreating, deleteConfirmId]);

  useEffect(() => {
    loadPosts(true); 
    const interval = setInterval(() => loadPosts(false), 30000); 
    return () => clearInterval(interval);
  }, []);

  const loadPosts = async (showSpinner = false) => {
    if (showSpinner) setIsLoading(true);
    try {
      const data = await api.getForumPosts();
      setPosts(Array.isArray(data) ? data : []);
      // If modal is open, find the updated post object
      if (activePost) {
        const current = data.find(p => p.id === activePost.id);
        if (current) setActivePost(current);
      }
    } catch (e) {
      console.error("Failed to load posts");
    } finally {
      if (showSpinner) setIsLoading(false);
    }
  };

  const filteredPosts = useMemo(() => {
    return (posts || []).filter(p => {
      const matchSearch = (p.content || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.user_name || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = activeCategory === 'Semua' ? true : 
                      activeCategory === 'Mentor' ? p.user_role === 'kader' : true;
      return matchSearch && matchCat;
    });
  }, [posts, searchQuery, activeCategory]);

  const handleCreatePost = async () => {
    if (!user || !newPostContent.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await api.createForumPost(user.id, newPostContent, isAnon, "");
      setNewPostContent('');
      setIsCreating(false);
      setIsAnon(false);
      toast.success("Cerita berhasil dibagikan! ✨");
      loadPosts();
    } catch (e) {
      toast.error("Gagal membagikan cerita.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (e: React.MouseEvent, postId: string) => {
      e.stopPropagation();
      if (!user) return;
      
      // Optimistic Update
      setPosts(prev => prev.map(p => {
          if (p.id === postId) {
              const likes = p.likes || [];
              const newLikes = likes.includes(user.id) 
                  ? likes.filter(id => id !== user.id) 
                  : [...likes, user.id];
              return { ...p, likes: newLikes };
          }
          return p;
      }));

      try {
        await api.toggleLikeForumPost(postId, user.id);
      } catch (e) {
        toast.error("Gagal menyukai postingan.");
        loadPosts(); // Revert on failure
      }
  };

  const handleReply = async () => {
      if(!user || !activePost || !replyContent.trim() || isSubmitting) return;
      
      const newComment: ForumComment = {
        id: `temp_${Date.now()}`,
        user_id: user.id,
        user_name: user.full_name,
        user_avatar: user.avatar_url,
        content: replyContent,
        created_at: new Date().toISOString()
      };

      // Optimistic Update locally
      const updatedActivePost = {
        ...activePost,
        comments: [...(activePost.comments || []), newComment]
      };
      setActivePost(updatedActivePost);
      setPosts(prev => prev.map(p => p.id === activePost.id ? updatedActivePost : p));
      
      const contentToSubmit = replyContent;
      setReplyContent('');
      setIsSubmitting(true);

      try {
          await api.replyForumPost(activePost.id, user, contentToSubmit);
          toast.success("Balasan terkirim! 🕊️");
          // Background reload to sync with server IDs
          loadPosts(); 
      } catch (e) {
          toast.error("Gagal membalas.");
          loadPosts(); // Revert local state if error
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleStartChat = (e: React.MouseEvent, post: ForumPost) => {
    e.stopPropagation();
    if (!user) return;
    if (post.user_id === user.id) {
      toast.error("Ini postingan kamu sendiri.");
      return;
    }
    navigate('/mobile/chat', { state: { targetUserId: post.user_id } });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    setIsDeleting(true);
    try {
      await api.deleteForumPost(deleteConfirmId);
      setPosts(prev => prev.filter(p => p.id !== deleteConfirmId));
      if (activePost?.id === deleteConfirmId) setActivePost(null);
      toast.success("Cerita telah dihapus");
    } catch (e) {
      toast.error("Gagal menghapus cerita");
    } finally {
      setIsDeleting(false);
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-40 px-6 pt-12 pb-4 border-b border-slate-50">
        <div className="flex justify-between items-center mb-8">
           <div className="p-2.5 bg-slate-50 rounded-2xl text-slate-400 hover:bg-slate-100 transition-colors">
              <Plus size={22} className="cursor-pointer" onClick={() => setIsCreating(true)} />
           </div>
           <div className="flex gap-3">
              <div className="p-2.5 bg-slate-50 rounded-2xl text-slate-400">
                <Search size={20} />
              </div>
              <div className="p-2.5 bg-slate-50 rounded-2xl text-slate-400 relative">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </div>
           </div>
        </div>

        <div className="mb-6">
           <h1 className="text-4xl font-black text-slate-900 tracking-tight">Forum Rasa</h1>
           <p className="text-slate-400 text-sm font-medium mt-1 uppercase tracking-widest text-[10px]">Temukan dukungan di sekitarmu</p>
        </div>

        <div className="relative mb-6 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari cerita..." 
              className="w-full bg-[#F3F4F6] border-none pl-12 pr-6 py-4 rounded-2xl text-sm font-bold shadow-none outline-none focus:bg-white focus:ring-2 focus:ring-primary-100 transition-all text-gray-800"
            />
          </div>
          <button className="p-4 bg-primary-500 text-white rounded-2xl shadow-lg shadow-primary-500/20 active:scale-95 transition-all shrink-0">
             <SlidersHorizontal size={20} />
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {categories.map(cat => (
                <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                        activeCategory === cat 
                        ? 'bg-primary-500 text-white border-primary-500 shadow-lg shadow-primary-500/20' 
                        : 'bg-white text-slate-400 border-slate-100'
                    }`}
                >
                    {cat}
                </button>
            ))}
        </div>
      </header>

      <div className="px-6 py-8 pb-32 max-w-lg mx-auto">
        {isLoading ? (
          <div className="py-20 flex justify-center"><LoadingSpinner label="Menyambungkan rasa..." /></div>
        ) : (
          <div className="space-y-8">
            <div 
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-4 p-3 bg-slate-50/50 rounded-[2rem] border border-slate-100 cursor-pointer mb-10 group hover:bg-white hover:border-primary-100 transition-all"
            >
               <ForumAvatar avatarUrl={user?.avatar_url} size="sm" />
               <p className="text-xs font-bold text-slate-400 group-hover:text-primary-500 transition-colors">Apa yang kamu rasakan hari ini?</p>
            </div>

            {filteredPosts.length > 0 ? filteredPosts.map((post) => {
              const isLiked = user ? post?.likes?.includes(user.id) : false;
              const isMentor = post.user_role === 'kader';
              const isMyPost = user?.id === post.user_id;
              
              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-[2.5rem] p-7 shadow-[0_15px_45px_rgba(0,0,0,0.03)] border border-slate-50 group hover:border-primary-100 transition-all cursor-pointer relative overflow-visible"
                  onClick={() => setActivePost(post)}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <ForumAvatar 
                        isAnonymous={post.is_anonymous} 
                        avatarUrl={post.user_avatar} 
                        name={post.user_name} 
                        isMentor={isMentor}
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                           <h4 className="font-black text-slate-900 text-[15px] leading-none">
                             {post.is_anonymous ? 'Remaja Anonim' : post.user_name}
                           </h4>
                           {!post.is_anonymous && isMentor && (
                             <div className="flex items-center gap-1 bg-primary-50 px-2 py-0.5 rounded-lg border border-primary-100">
                                <UserCheck size={10} className="text-primary-600" />
                                <span className="text-[8px] font-black text-primary-600 uppercase tracking-tighter">Mentor</span>
                             </div>
                           )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1">
                           <Clock size={10} />
                           {new Date(post.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                    
                    {isMyPost && (
                        <div className="relative">
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(openMenuId === post.id ? null : post.id);
                                }}
                                className="p-2 text-slate-200 hover:text-slate-900 transition-colors bg-white rounded-full hover:bg-slate-50 active:scale-95"
                            >
                                <MoreHorizontal size={20} />
                            </button>
                            {openMenuId === post.id && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                                    className="absolute right-0 top-12 bg-white border border-slate-100 shadow-xl rounded-2xl p-2 z-20 w-32 origin-top-right"
                                >
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenMenuId(null);
                                            setDeleteConfirmId(post.id);
                                        }}
                                        className="flex items-center gap-2 text-red-500 text-xs font-bold w-full p-3 hover:bg-red-50 rounded-xl transition-colors"
                                    >
                                        <Trash2 size={14} /> Hapus
                                    </button>
                                </motion.div>
                            )}
                        </div>
                    )}
                  </div>
                  
                  <div className="mb-6">
                    <p className="text-slate-700 text-[15px] leading-relaxed whitespace-pre-wrap font-semibold tracking-tight">
                        {post.content}
                    </p>
                    {post.image_url && (
                        <div className="mt-4 rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm">
                            <img src={post.image_url} className="w-full h-auto object-cover max-h-[400px]" alt="Forum post" />
                        </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-5 border-t border-slate-50">
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={(e) => handleLike(e, post.id)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition-all font-black text-[11px] uppercase tracking-widest ${isLiked ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                        >
                           <Heart size={16} fill={isLiked ? "currentColor" : "none"} className={isLiked ? 'animate-pulse' : ''} /> 
                           <span>{post.likes?.length || 0}</span>
                        </button>
                        
                        <button className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-50 text-slate-400 font-black text-[11px] uppercase tracking-widest hover:text-primary-500 transition-all">
                           <MessageSquare size={16} /> <span>{post.comments?.length || 0}</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                         {!post.is_anonymous && post.user_id !== user?.id && (
                           <button 
                             onClick={(e) => handleStartChat(e, post)}
                             className="p-3 bg-primary-600 text-white rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20 active:scale-95"
                           >
                              <MessageCircle size={18} />
                           </button>
                         )}
                      </div>
                  </div>
                </motion.div>
              );
            }) : (
              <div className="py-24 text-center opacity-30">
                <MessageSquare size={56} className="mx-auto text-slate-200 mb-4" />
                <p className="text-xs font-black uppercase tracking-[0.2em]">Belum ada obrolan</p>
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isCreating && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-white"
          >
             <div className="h-full flex flex-col">
                <div className="p-6 pt-12 flex justify-between items-center bg-white border-b border-slate-50">
                    <button onClick={() => setIsCreating(false)} className="text-sm font-black text-slate-400 uppercase tracking-widest">Batal</button>
                    <h2 className="font-black text-slate-900">Buat Cerita</h2>
                    <Button 
                      onClick={handleCreatePost} 
                      disabled={!newPostContent.trim() || isSubmitting} 
                      size="sm"
                      className="!rounded-xl"
                    >
                      Posting
                    </Button>
                </div>
                
                <div className="flex-1 p-8 overflow-y-auto no-scrollbar">
                   <div className="flex gap-4 mb-8">
                      <ForumAvatar avatarUrl={user?.avatar_url} />
                      <div>
                         <p className="font-black text-slate-900 text-sm">{user?.full_name}</p>
                         <button 
                            onClick={() => setIsAnon(!isAnon)}
                            className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border mt-1.5 flex items-center gap-1.5 transition-all ${isAnon ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-200'}`}
                         >
                            <Shield size={10} /> {isAnon ? 'Anonim Aktif' : 'Publik'}
                         </button>
                      </div>
                   </div>
                   
                   <textarea
                      className="w-full h-32 text-lg font-bold text-slate-800 placeholder:text-slate-200 outline-none border-none resize-none no-scrollbar mb-4"
                      placeholder="Apa yang sedang membebani pikiranmu?..."
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      autoFocus
                   />
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activePost && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xl flex items-end sm:items-center justify-center sm:p-4"
          >
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#F8FAFC] w-full max-w-lg h-[94vh] sm:h-[85vh] flex flex-col shadow-2xl rounded-t-[3.5rem] sm:rounded-[3.5rem] overflow-hidden"
            >
               <div className="p-6 bg-white border-b border-slate-100 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                        <MessageSquare size={18}/>
                     </div>
                     <div>
                        <h3 className="font-black text-slate-900 text-sm tracking-tight">Ruang Diskusi</h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{activePost.comments?.length || 0} Balasan Aktif</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {user?.id === activePost.user_id && (
                        <button 
                            onClick={() => setDeleteConfirmId(activePost.id)}
                            className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 active:scale-90 transition-all"
                        >
                            <Trash2 size={20} />
                        </button>
                    )}
                    <button 
                        onClick={() => setActivePost(null)} 
                        className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:bg-slate-100 active:scale-90 transition-all"
                    >
                        <X size={20} />
                    </button>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto px-6 pt-8 pb-32 no-scrollbar">
                  <div className="mb-10 relative">
                    <div className="absolute -top-4 -left-2 opacity-5 text-indigo-600">
                       <Quote size={60} fill="currentColor" />
                    </div>
                    
                    <div className="flex items-center gap-4 mb-5 relative z-10">
                      <ForumAvatar 
                        isAnonymous={activePost.is_anonymous} 
                        avatarUrl={activePost.user_avatar} 
                        name={activePost.user_name} 
                        isMentor={activePost.user_role === 'kader'}
                      />
                      <div>
                        <span className="font-black text-slate-900 text-[15px]">{activePost.is_anonymous ? 'Remaja Anonim' : activePost.user_name}</span>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Penulis Cerita</p>
                      </div>
                    </div>
                    
                    <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm relative z-10">
                       <p className="text-slate-700 text-[15.5px] leading-relaxed whitespace-pre-wrap font-bold italic mb-4">
                          "{activePost.content}"
                       </p>
                       {activePost.image_url && (
                            <div className="rounded-[1.5rem] overflow-hidden border border-slate-50">
                                <img src={activePost.image_url} className="w-full h-auto" />
                            </div>
                       )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-3 px-2 mb-2">
                       <div className="h-[1px] flex-1 bg-slate-100"></div>
                       <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Balasan Komunitas</p>
                       <div className="h-[1px] flex-1 bg-slate-100"></div>
                    </div>

                    {(activePost.comments || []).length > 0 ? activePost.comments.map((rep, idx) => {
                        const isAuthor = rep.user_id === activePost.user_id;
                        const isMe = user?.id === rep.user_id;
                        return (
                          <motion.div 
                            key={rep.id} 
                            initial={{ opacity: 0, x: isMe ? 10 : -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`flex gap-3 items-start group/comment ${isMe ? 'flex-row-reverse' : ''}`}
                          >
                            <ForumAvatar avatarUrl={rep.user_avatar} name={rep.user_name} size="sm" />
                            <div className={`flex-1 min-w-0 ${isMe ? 'text-right' : ''}`}>
                               <div className={`inline-block max-w-[90%] p-5 rounded-[2rem] border transition-all ${
                                  isMe 
                                    ? 'bg-indigo-50 border-indigo-100 rounded-tr-none shadow-sm' 
                                    : 'bg-white border-slate-100 rounded-tl-none group-hover/comment:border-primary-100'
                               }`}>
                                  <div className={`flex items-center gap-2 mb-1 ${isMe ? 'justify-end' : ''}`}>
                                     <p className="font-black text-slate-900 text-[10px] uppercase tracking-widest">
                                        {isMe ? 'Saya' : rep.user_name}
                                     </p>
                                     {isAuthor && <Badge variant="primary" size="sm">Penulis</Badge>}
                                  </div>
                                  <p className="text-slate-600 text-[14px] leading-relaxed font-bold whitespace-pre-wrap">{rep.content}</p>
                               </div>
                               <div className={`flex items-center gap-2 mt-2 px-3 ${isMe ? 'justify-end' : ''}`}>
                                  <span className="text-[8px] text-slate-300 font-black uppercase tracking-widest">
                                     {rep.created_at ? new Date(rep.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                  </span>
                               </div>
                            </div>
                          </motion.div>
                        );
                    }) : (
                        <div className="text-center py-16 bg-white/50 rounded-[3rem] border border-dashed border-slate-200">
                           <Sparkles size={32} className="mx-auto text-slate-200 mb-4" />
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Berikan dukungan pertamamu</p>
                        </div>
                    )}
                  </div>
               </div>

               <div className="p-6 bg-white/80 backdrop-blur-md border-t border-slate-100 shadow-[0_-15px_50px_rgba(0,0,0,0.04)] shrink-0">
                  <div className="flex gap-3 items-center bg-[#F3F4F6] p-2 rounded-full border border-slate-100 focus-within:bg-white focus-within:border-primary-300 transition-all shadow-inner">
                     <input 
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !isSubmitting && handleReply()}
                        placeholder="Tulis balasan..." 
                        className="flex-1 bg-transparent border-0 px-5 py-3 text-sm focus:ring-0 outline-none text-slate-800 font-bold"
                        disabled={isSubmitting}
                     />
                     <button 
                        onClick={handleReply}
                        disabled={!replyContent.trim() || isSubmitting}
                        className="bg-primary-600 text-white p-4 rounded-full disabled:opacity-50 shadow-xl shadow-primary-500/20 active:scale-90 transition-all hover:bg-primary-700 flex items-center justify-center min-w-[50px]"
                     >
                        {isSubmitting ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <Send size={18} />
                        )}
                     </button>
                  </div>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirmId && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl text-center relative"
                >
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle size={32} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">Hapus Cerita Ini?</h3>
                    <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
                        Tindakan ini tidak dapat dibatalkan. Cerita akan hilang dari forum selamanya.
                    </p>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => setDeleteConfirmId(null)}
                            className="flex-1 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-all"
                        >
                            Batal
                        </button>
                        <button 
                            onClick={confirmDelete}
                            disabled={isDeleting}
                            className="flex-1 py-4 bg-red-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-red-500/30 active:scale-95 transition-all"
                        >
                            {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
};
