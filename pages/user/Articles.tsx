
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/mockSupabase';
import { Article, ArticleComment } from '../../types';
import { Heart, MessageSquare, BookOpen, Share2, X, Send, UserCircle2, Clock } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export const Articles: React.FC = () => {
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Detail Modal State
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<ArticleComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    setIsLoading(true);
    try {
      const data = await api.getArticles();
      setArticles(data);
    } catch (e) {
      console.error("Gagal memuat artikel", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch comments when article is selected
  useEffect(() => {
    if (selectedArticle) {
      loadComments(selectedArticle.id);
    }
  }, [selectedArticle]);

  const loadComments = async (articleId: string) => {
    setIsLoadingComments(true);
    try {
      const data = await api.getArticleComments(articleId);
      setComments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handlePostComment = async () => {
    if (!user || !selectedArticle || !newComment.trim()) return;
    setIsSubmittingComment(true);
    try {
      await api.addArticleComment(selectedArticle.id, user.id, user.full_name, newComment);
      setNewComment('');
      toast.success("Komentar terkirim!");
      // Refresh comments and article count
      loadComments(selectedArticle.id);
      
      // Update local article state
      setArticles(prev => prev.map(a => a.id === selectedArticle.id ? {...a, comments_count: (a.comments_count || 0) + 1} : a));
      setSelectedArticle(prev => prev ? {...prev, comments_count: (prev.comments_count || 0) + 1} : null);
    } catch (e) {
      toast.error("Gagal mengirim komentar");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleToggleLike = async (e: React.MouseEvent, article: Article) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Silakan login untuk menyukai artikel");
      return;
    }

    try {
      // Check for array existence to prevent crash
      const currentLikes = Array.isArray(article?.likes_list) ? [...article.likes_list] : [];
      const isLiked = currentLikes.includes(user.id);
      
      const updatedLikes = isLiked 
        ? currentLikes.filter(id => id !== user.id) 
        : [...currentLikes, user.id];
      
      const updatedArticle = { ...article, likes_list: updatedLikes, likes_count: updatedLikes.length };

      // Optimistic Update List
      setArticles(prev => (prev || []).map(a => 
        a.id === article.id ? updatedArticle : a
      ));

      // Optimistic Update Modal
      if (selectedArticle?.id === article.id) {
        setSelectedArticle(updatedArticle);
      }

      await api.toggleLikeArticle(article.id, user.id);
    } catch (err) {
      // Revert if fail
      loadArticles();
    }
  };

  if (isLoading) return <div className="min-h-screen pt-20 flex justify-center"><LoadingSpinner label="Memuat wawasan..." /></div>;

  return (
    <div className="min-h-screen bg-white pb-32">
      <div className="bg-white/90 backdrop-blur-md sticky top-0 z-30 px-6 py-4 border-b border-slate-50 pt-12">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Pojok Wawasan</h1>
        <p className="text-slate-400 text-xs font-medium mt-1 uppercase tracking-widest">Edukasi & Inspirasi Harian</p>
      </div>

      <div className="p-6 space-y-6">
        {articles.length > 0 ? articles.map(article => {
          const isLiked = user && article.likes_list?.includes(user.id);

          return (
            <Card 
              key={article.id} 
              className="group cursor-pointer"
              onClick={() => setSelectedArticle(article)}
            >
               <div className="relative h-48 rounded-t-[2.5rem] overflow-hidden -mx-6 -mt-6 mb-6">
                 <img src={article.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={article.title} />
                 <div className="absolute top-4 left-4">
                   <Badge variant="neutral" className="bg-white/80 backdrop-blur-md shadow-sm border-0 !text-slate-800">
                     {article.category}
                   </Badge>
                 </div>
               </div>

               <h3 className="font-black text-xl text-slate-900 mb-2 leading-tight">{article.title}</h3>
               <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 mb-6 font-medium">{article.content}</p>

               <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={(e) => handleToggleLike(e, article)}
                      className={`flex items-center gap-1.5 transition-colors ${isLiked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'}`}
                    >
                      <Heart size={18} fill={isLiked ? "currentColor" : "none"} className={isLiked ? "animate-pulse" : ""} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{article.likes_count}</span>
                    </button>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <MessageSquare size={18} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{article.comments_count}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                     <span>{new Date(article.created_at).toLocaleDateString()}</span>
                  </div>
               </div>
            </Card>
          );
        }) : (
           <div className="py-24 text-center">
              <BookOpen size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Belum ada artikel</p>
           </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedArticle && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-50 bg-white sticky top-0 z-20">
               <button onClick={() => setSelectedArticle(null)} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors">
                  <X size={20} className="text-slate-600" />
               </button>
               <div className="flex gap-2">
                  <button className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-blue-500 transition-colors"><Share2 size={18} /></button>
               </div>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
               {/* Hero Image */}
               <div className="h-64 w-full relative">
                  <img src={selectedArticle.image_url} className="w-full h-full object-cover" alt="Hero" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-6 left-6 text-white">
                     <Badge variant="primary" className="mb-2 bg-blue-500/20 text-blue-100 border-blue-400/30 backdrop-blur-md">{selectedArticle.category}</Badge>
                     <h2 className="text-2xl font-black leading-tight drop-shadow-md">{selectedArticle.title}</h2>
                  </div>
               </div>

               <div className="p-6">
                  {/* Meta Info */}
                  <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-50">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                           <UserCircle2 size={24} />
                        </div>
                        <div>
                           <p className="text-xs font-black text-slate-800 uppercase tracking-wide">{selectedArticle.author_name || 'Admin'}</p>
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                              <Clock size={10} /> {new Date(selectedArticle.created_at).toLocaleDateString()}
                           </p>
                        </div>
                     </div>
                     <button 
                        onClick={(e) => handleToggleLike(e, selectedArticle)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition-all ${user && selectedArticle.likes_list?.includes(user.id) ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-400'}`}
                     >
                        <Heart size={18} fill={user && selectedArticle.likes_list?.includes(user.id) ? "currentColor" : "none"} />
                        <span className="text-xs font-black">{selectedArticle.likes_count}</span>
                     </button>
                  </div>

                  {/* Article Body */}
                  <div className="prose prose-slate max-w-none mb-10">
                     <p className="text-slate-700 leading-loose text-[15px] font-medium whitespace-pre-wrap">
                        {selectedArticle.content}
                     </p>
                  </div>

                  {/* Comments Section */}
                  <div className="bg-slate-50 rounded-[2.5rem] p-6 border border-slate-100">
                     <h3 className="font-black text-slate-800 text-sm mb-6 flex items-center gap-2">
                        <MessageSquare size={16} /> Komentar ({comments.length})
                     </h3>
                     
                     {isLoadingComments ? (
                        <div className="py-8 text-center"><LoadingSpinner label="Memuat..." /></div>
                     ) : comments.length > 0 ? (
                        <div className="space-y-6">
                           {comments.map(c => (
                              <div key={c.id} className="flex gap-3">
                                 <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-300 shadow-sm border border-slate-100 shrink-0">
                                    <span className="font-black text-[10px]">{c.user_name[0]}</span>
                                 </div>
                                 <div className="flex-1">
                                    <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm">
                                       <div className="flex justify-between items-center mb-1">
                                          <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">{c.user_name}</span>
                                          <span className="text-[8px] text-slate-300 font-bold">{new Date(c.created_at).toLocaleDateString()}</span>
                                       </div>
                                       <p className="text-xs text-slate-600 font-medium">{c.text}</p>
                                    </div>
                                 </div>
                              </div>
                           ))}
                        </div>
                     ) : (
                        <div className="text-center py-8 text-slate-400">
                           <p className="text-xs font-bold uppercase tracking-widest">Jadilah yang pertama berkomentar!</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>

            {/* Comment Input Fixed */}
            <div className="p-4 bg-white border-t border-slate-100 shadow-lg z-20">
               <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-[2rem] border border-slate-200 focus-within:border-blue-300 focus-within:bg-white transition-all">
                  <input 
                     value={newComment}
                     onChange={(e) => setNewComment(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                     placeholder="Tulis komentar..."
                     className="flex-1 bg-transparent border-none outline-none px-4 text-sm font-bold text-slate-800 placeholder:text-slate-400"
                     disabled={isSubmittingComment}
                  />
                  <button 
                     onClick={handlePostComment}
                     disabled={!newComment.trim() || isSubmittingComment}
                     className="p-3 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 transition-all"
                  >
                     {isSubmittingComment ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Send size={16} />}
                  </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
