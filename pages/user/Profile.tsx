
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api, AnalyticsService } from '../../services/mockSupabase';
import { MoodLog, MoodInsight, Article, ForumPost, Agenda } from '../../types';
import { MonthlyInsightChart } from './components/MonthlyInsightChart';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { useNavigate } from 'react-router-dom';
import { 
  UserCog, LogOut, TrendingUp, Heart, MessageSquare, 
  ChevronRight, Calendar, AlertTriangle, CheckCircle2, Clock
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [moodHistory, setMoodHistory] = useState<MoodLog[]>([]);
  const [insight, setInsight] = useState<MoodInsight | null>(null);
  const [likedArticles, setLikedArticles] = useState<Article[]>([]);
  const [myPosts, setMyPosts] = useState<ForumPost[]>([]);
  const [myAgendas, setMyAgendas] = useState<Agenda[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState<'insight' | 'likes' | 'posts'>('insight');

  useEffect(() => {
    if (user) loadUserData();
  }, [user]);

  const loadUserData = async () => {
    setIsLoadingData(true);
    try {
      const [moods, articles, posts, agendas] = await Promise.all([
        api.getMoodHistory(user!.id),
        api.getArticles(),
        api.getForumPosts(),
        api.getAgendas()
      ]);

      setMoodHistory(moods);
      const computedInsight = AnalyticsService.calculateInsight(moods);
      setInsight(computedInsight);
      
      // Safely check for likes_list existence
      const liked = articles.filter(a => Array.isArray(a.likes_list) && a.likes_list.includes(user!.id));
      setLikedArticles(liked);
      
      const mine = posts.filter(p => p.user_id === user!.id);
      setMyPosts(mine);

      // Filter agendas where user is participant
      const joinedAgendas = agendas.filter(a => Array.isArray(a.participants) && a.participants.includes(user!.id));
      setMyAgendas(joinedAgendas);

    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingData(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 pb-32 font-sans">
      {/* Header Profile */}
      <div className="bg-white px-6 pt-12 pb-8 border-b border-slate-100 rounded-b-[2.5rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] relative z-10">
         <div className="flex justify-between items-start mb-6">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Profil Saya</h1>
            <button onClick={logout} className="p-2.5 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-colors">
               <LogOut size={20} />
            </button>
         </div>

         <div className="flex items-center gap-5">
            <div className="relative">
               <img src={user.avatar_url} className="w-20 h-20 rounded-[2rem] object-cover bg-slate-100 ring-4 ring-white shadow-lg" alt="Profile" />
               <button 
                 onClick={() => navigate('/profile/edit')}
                 className="absolute -bottom-2 -right-2 p-2 bg-blue-600 text-white rounded-xl shadow-lg border-2 border-white hover:bg-blue-700 transition-all"
               >
                  <UserCog size={14} />
               </button>
            </div>
            <div>
               <h2 className="text-xl font-black text-slate-900 leading-tight">{user.full_name}</h2>
               <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1 mb-2">{user.school_name || 'Pelajar'}</p>
               <Badge variant="neutral" className="!text-[9px] !px-3">
                  {user.role === 'user' ? 'Siswa Aktif' : 'Pengguna'}
               </Badge>
            </div>
         </div>
      </div>

      <div className="p-6">
         {/* Stats Row */}
         <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm text-center">
               <div className="text-2xl font-black text-blue-600 mb-1">{moodHistory.length}</div>
               <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Check-in</div>
            </div>
            <div className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm text-center">
               <div className="text-2xl font-black text-pink-500 mb-1">{likedArticles.length}</div>
               <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Disukai</div>
            </div>
            <div className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm text-center">
               <div className="text-2xl font-black text-indigo-600 mb-1">{myAgendas.length}</div>
               <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Agenda</div>
            </div>
         </div>

         {/* Navigation Tabs */}
         <div className="flex bg-white p-1.5 rounded-[1.5rem] shadow-sm border border-slate-100 mb-6">
            <button 
               onClick={() => setActiveTab('insight')} 
               className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'insight' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
               Statistik
            </button>
            <button 
               onClick={() => setActiveTab('likes')} 
               className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'likes' ? 'bg-pink-50 text-pink-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
               Wawasan
            </button>
            <button 
               onClick={() => setActiveTab('posts')} 
               className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'posts' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
               Aktivitas
            </button>
         </div>

         {/* Content Area */}
         {isLoadingData ? (
            <LoadingSpinner label="Memuat data profil..." />
         ) : (
            <>
               {activeTab === 'insight' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                     <Card className="p-6">
                        <div className="flex items-center justify-between mb-6">
                           <div>
                              <h3 className="font-black text-slate-800 text-sm">Grafik Perasaan</h3>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">15 Hari Terakhir</p>
                           </div>
                           <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                              <TrendingUp size={18} />
                           </div>
                        </div>
                        <MonthlyInsightChart moodHistory={moodHistory} />
                     </Card>

                     {insight && (
                        <div className="grid grid-cols-1 gap-4">
                           <div className={`p-6 rounded-[2rem] border flex items-start gap-4 ${insight.riskFlag ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                              {insight.riskFlag ? <AlertTriangle className="text-red-500 shrink-0" size={24} /> : <CheckCircle2 className="text-emerald-500 shrink-0" size={24} />}
                              <div>
                                 <h4 className={`font-black text-sm mb-1 ${insight.riskFlag ? 'text-red-800' : 'text-emerald-800'}`}>
                                    {insight.riskFlag ? 'Perlu Perhatian' : 'Kondisi Stabil'}
                                 </h4>
                                 <p className={`text-xs font-medium leading-relaxed ${insight.riskFlag ? 'text-red-600' : 'text-emerald-600'}`}>
                                    {insight.riskFlag 
                                       ? 'Tren mood kamu terlihat menurun akhir-akhir ini. Jangan ragu cerita ke Kader ya.' 
                                       : 'Keren! Kamu berhasil menjaga keseimbangan emosi dengan baik.'}
                                 </p>
                              </div>
                           </div>
                        </div>
                     )}
                  </div>
               )}

               {activeTab === 'likes' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                     {likedArticles.length > 0 ? likedArticles.map(article => (
                        <div key={article.id} className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex gap-4 items-center" onClick={() => navigate('/mobile/articles')}>
                           <img src={article.image_url} className="w-16 h-16 rounded-2xl object-cover bg-slate-200" alt="Thumb" />
                           <div className="flex-1 min-w-0">
                              <span className="text-[9px] font-black text-pink-500 bg-pink-50 px-2 py-0.5 rounded-lg uppercase tracking-wider mb-1 inline-block">{article.category}</span>
                              <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{article.title}</h4>
                           </div>
                           <ChevronRight size={18} className="text-slate-300" />
                        </div>
                     )) : (
                        <div className="text-center py-12">
                           <Heart size={40} className="mx-auto text-slate-200 mb-4" />
                           <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Belum ada artikel disukai</p>
                        </div>
                     )}
                  </div>
               )}

               {activeTab === 'posts' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                     
                     {/* AGENDA SECTION */}
                     <div className="space-y-4">
                        <h3 className="font-black text-slate-800 text-sm px-2">Agenda Mendatang</h3>
                        {myAgendas.length > 0 ? (
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {myAgendas.map(agenda => (
                                 <div key={agenda.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${agenda.type === 'Online' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                                       <Calendar size={20} />
                                    </div>
                                    <div>
                                       <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{agenda.title}</h4>
                                       <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase mt-1">
                                          <Clock size={10} /> {agenda.date} • {agenda.time}
                                       </div>
                                       <span className="inline-block mt-2 text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md uppercase tracking-wider">{agenda.type}</span>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        ) : (
                           <div className="text-center py-8 bg-slate-100/50 rounded-[2rem] border border-dashed border-slate-200">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Belum ada agenda diikuti</p>
                           </div>
                        )}
                     </div>

                     {/* POSTS SECTION */}
                     <div className="space-y-4">
                        <h3 className="font-black text-slate-800 text-sm px-2">Cerita Saya</h3>
                        {myPosts.length > 0 ? myPosts.map(post => (
                           <div key={post.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm" onClick={() => navigate('/mobile/forum')}>
                              <div className="flex justify-between items-start mb-2">
                                 <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${post.is_anonymous ? 'bg-slate-100 text-slate-500' : 'bg-blue-50 text-blue-600'}`}>
                                    {post.is_anonymous ? 'Anonim' : 'Publik'}
                                 </span>
                                 <span className="text-[10px] font-bold text-slate-400">{new Date(post.created_at).toLocaleDateString()}</span>
                              </div>
                              <p className="text-slate-700 text-sm font-medium line-clamp-2 italic">"{post.content}"</p>
                              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-50">
                                 <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                                    <Heart size={14} /> {post.likes?.length || 0}
                                 </div>
                                 <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                                    <MessageSquare size={14} /> {post.comments?.length || 0}
                                 </div>
                              </div>
                           </div>
                        )) : (
                           <div className="text-center py-12">
                              <MessageSquare size={40} className="mx-auto text-slate-200 mb-4" />
                              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Belum ada postingan</p>
                           </div>
                        )}
                     </div>
                  </div>
               )}
            </>
         )}
      </div>
    </div>
  );
};
