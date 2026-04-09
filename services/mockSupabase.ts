
import { 
  UserProfile, Article, ForumPost, Agenda, 
  EmotionTestResult, Referral, ChatMessage, MoodLog,
  MoodInsight, School, Notification, InboxItem, GASResponse,
  ArticleComment
} from '../types';

// GUNAKAN URL WEB APP DEPLOYMENT ANDA DI SINI
const API_URL = "https://script.google.com/macros/s/AKfycbyGpHpNlJBjpeYNWoizRkRpUfT7-qH3DYkCpAFCoP_X5NXBQDMpaqKqGbgdiISB9k-H/exec";

async function fetchGAS<T>(action: string, payload: any = {}): Promise<T> {
  const isReadOperation = action.startsWith('get_') || action.startsWith('fetch');
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ action, payload })
    });
    
    if (!response.ok) {
      if (isReadOperation) return [] as unknown as T;
      throw new Error(`Network error: ${response.status}`);
    }

    const text = await response.text();
    let json: GASResponse<T>;
    
    try { 
      json = JSON.parse(text); 
    } catch (e) { 
      if (isReadOperation) return [] as unknown as T;
      throw new Error("Server returned invalid data format.");
    }
    
    if (json.status === 'error') {
      if (isReadOperation) return [] as unknown as T;
      throw new Error(json.message || "Unknown server error");
    }
    
    return json.data as T;

  } catch (error: any) {
    console.error(`GAS Fetch Error (${action}):`, error);
    if (!isReadOperation) throw error;
    return [] as unknown as T;
  }
}

export const AnalyticsService = {
  calculateInsight: (logs: MoodLog[]): MoodInsight => {
    if (!logs || logs.length === 0) {
      return { averageScore: 0, dominantMood: 3, trend: 'Stabil', keywords: [], lastLogDate: null, riskFlag: false };
    }
    const sorted = [...logs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const validLogs = sorted.slice(-7);
    const total = validLogs.reduce((acc, curr) => acc + curr.mood_score, 0);
    const averageScore = Number((total / validLogs.length).toFixed(1));
    
    let trend: 'Meningkat' | 'Menurun' | 'Stabil' = 'Stabil';
    if (validLogs.length >= 4) {
      const last3 = validLogs.slice(-3);
      const prev3 = validLogs.slice(-6, -3);
      const avgLast = last3.reduce((a, b) => a + b.mood_score, 0) / last3.length;
      const avgPrev = prev3.reduce((a, b) => a + b.mood_score, 0) / prev3.length;
      if (avgLast > avgPrev + 0.5) trend = 'Meningkat';
      else if (avgLast < avgPrev - 0.5) trend = 'Menurun';
    }
    
    return {
      averageScore,
      dominantMood: Math.round(averageScore),
      trend,
      keywords: [],
      lastLogDate: sorted[sorted.length - 1].timestamp,
      riskFlag: averageScore < 2.5 || trend === 'Menurun'
    };
  }
};

function getCurrentUser(): UserProfile | null {
  try {
    const data = window.localStorage.getItem('ks_session');
    return data ? JSON.parse(data) : null;
  } catch(e) { return null; }
}

/**
 * Resolve school_id dari user session.
 * Jika school_id tidak ada (sesi lama), fallback ke pencarian by school_name.
 * Menyimpan hasilnya kembali ke sesi agar tidak perlu re-lookup setiap saat.
 */
async function resolveSchoolId(schools: School[]): Promise<string | null> {
  const u = getCurrentUser();
  if (!u) return null;

  // Kasus normal: school_id sudah ada di sesi
  if (u.school_id && String(u.school_id).trim() !== '') {
    return String(u.school_id);
  }

  // Fallback: cari by school_name (sesi lama tidak punya school_id)
  if (u.school_name) {
    const matched = schools.find(s =>
      String(s.school_name).toLowerCase().trim() === String(u.school_name).toLowerCase().trim()
    );
    if (matched) {
      // Simpan kembali ke sesi agar tidak perlu lookup lagi
      try {
        const raw = localStorage.getItem('ks_session');
        if (raw) {
          const session = JSON.parse(raw);
          session.school_id = matched.id;
          localStorage.setItem('ks_session', JSON.stringify(session));
        }
      } catch(_) {}
      return String(matched.id);
    }
  }

  return null;
}

function filterBySchool<T extends { school_id?: string }>(items: T[]): T[] {
  const user = getCurrentUser();
  if (user?.role === 'admin') return items;
  if (!user || !user.school_id) return items;
  return items.filter(item => String(item.school_id) === String(user.school_id));
}

function filterUsersBySchool(items: UserProfile[]): UserProfile[] {
  const user = getCurrentUser();
  if (user?.role === 'admin') return items;
  if (!user || !user.school_id) return items;
  return items.filter(item => String(item.school_id) === String(user.school_id));
}

export const api = {
  // --- AUTH ---
  login: async (email: string, password: string): Promise<UserProfile> => {
    return await fetchGAS<UserProfile>('login', { email, password });
  },
  register: async (data: any) => {
    return await fetchGAS('create_row', { sheet: 'users', data: { ...data, role: 'user', status: 'active', avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.username}`, created_at: new Date().toISOString() } });
  },
  registerBK: async (data: any) => {
    return await fetchGAS('create_row', { sheet: 'users', data: { ...data, role: 'bk', status: 'pending_approval', avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.username}`, created_at: new Date().toISOString() } });
  },
  createProfessionalUser: async (data: any) => {
    return await fetchGAS('create_row', { 
        sheet: 'users', 
        data: { 
            ...data, 
            status: 'active', 
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.username}`, 
            created_at: new Date().toISOString() 
        } 
    });
  },
  updateProfile: async (id: string, data: any) => {
    return await fetchGAS('update_row', { sheet: 'users', id, data });
  },
  getUsers: async (): Promise<UserProfile[]> => {
    const res = await fetchGAS<UserProfile[]>('get_table', { sheet: 'users' });
    return Array.isArray(res) ? filterUsersBySchool(res) : [];
  },
  deleteUser: async (id: string) => await fetchGAS('delete_row', { sheet: 'users', id }),

  // --- DATA LISTS ---
  getCounselors: async (): Promise<UserProfile[]> => {
    const users = await api.getUsers();
    return users.filter(u => u.role === 'kader');
  },
  getPsychologists: async (): Promise<UserProfile[]> => {
    const users = await api.getUsers();
    return users.filter(u => u.role === 'psychologist');
  },
  getSchools: async (): Promise<School[]> => {
    const res = await fetchGAS<School[]>('get_table', { sheet: 'schools' });
    return Array.isArray(res) ? res : [];
  },
  addSchool: async (schoolData: Partial<School>) => {
      return await fetchGAS('create_row', { 
          sheet: 'schools', 
          data: { 
              ...schoolData, 
              subscription_plan: 'free',
              subscription_end_date: null,
              created_at: new Date().toISOString() 
          } 
      });
  },
  updateSchoolSubscription: async (id: string, plan: 'free' | 'pro' | 'premium', endDate: string | null) => {
      return await fetchGAS('update_row', { sheet: 'schools', id, data: { subscription_plan: plan, subscription_end_date: endDate } });
  },
  // Dedicated endpoint untuk upgrade plan - dengan fallback resolver school_id
  upgradeSchoolPlan: async (school_id: string, plan: 'pro' | 'premium'): Promise<{ success: boolean, plan: string, subscription_end_date: string }> => {
      // Jika school_id tidak tersedia, coba resolve via school_name
      let resolvedId = school_id && school_id !== 'undefined' && school_id !== '' ? school_id : null;
      if (!resolvedId) {
          const schools = await api.getSchools();
          resolvedId = await resolveSchoolId(schools);
      }
      if (!resolvedId) throw new Error('Sekolah tidak ditemukan. Pastikan akun Guru BK sudah terdaftar di sekolah.');

      try {
          // Coba pakai dedicated endpoint baru
          const result = await fetchGAS<any>('upgrade_plan', { school_id: String(resolvedId), plan });
          return result;
      } catch(primaryErr) {
          // Fallback: pakai update_row generik jika endpoint baru belum di-deploy
          console.warn('upgrade_plan endpoint belum tersedia, fallback ke update_row:', primaryErr);
          const expires = new Date();
          expires.setDate(expires.getDate() + 30);
          const endDateISO = expires.toISOString();
          await fetchGAS('update_row', { sheet: 'schools', id: String(resolvedId), data: { subscription_plan: plan, subscription_end_date: endDateISO } });
          return { success: true, plan, subscription_end_date: endDateISO };
      }
  },
  updateSchoolTheme: async (id: string, school_logo: string, school_color_hex: string) => {
      return await fetchGAS('update_row', { sheet: 'schools', id, data: { school_logo, school_color_hex } });
  },
  getCurrentSchool: async (): Promise<School | undefined> => {
      const schools = await api.getSchools();
      const id = await resolveSchoolId(schools);
      if (!id) return undefined;
      return schools.find(s => String(s.id) === id);
  },
  checkPremiumAccess: async (schoolId?: string): Promise<boolean> => {
      const user = getCurrentUser();
      if (user?.role === 'admin') return true;
      const schools = await api.getSchools();
      const id = schoolId ? String(schoolId) : await resolveSchoolId(schools);
      if (!id) return false;
      const mySchool = schools.find(s => String(s.id) === id);
      if (!mySchool) return false;
      const isSubscribed = mySchool.subscription_plan === 'pro' || mySchool.subscription_plan === 'premium';
      if (!isSubscribed) return false;
      const endDateStr = mySchool.subscription_end_date || mySchool.subscription_expires_at;
      if (endDateStr && new Date(endDateStr).getTime() < new Date().getTime()) return false;
      return true;
  },
  getSchoolSubscriptionInfo: async (schoolId?: string) => {
      const user = getCurrentUser();
      if (user?.role === 'admin') return { plan: 'premium', isActive: true, endDate: null };
      const schools = await api.getSchools();
      const id = schoolId ? String(schoolId) : await resolveSchoolId(schools);
      if (!id) return { plan: 'free', isActive: false, endDate: null };
      const mySchool = schools.find(s => String(s.id) === id);
      if (!mySchool) return { plan: 'free', isActive: false, endDate: null };
      let isActive = mySchool.subscription_plan === 'pro' || mySchool.subscription_plan === 'premium';
      const endDateStr = mySchool.subscription_end_date || mySchool.subscription_expires_at;
      if (isActive && endDateStr && new Date(endDateStr).getTime() < new Date().getTime()) {
          isActive = false;
      }
      return {
          plan: mySchool.subscription_plan || 'free',
          isActive,
          endDate: endDateStr || null
      };
  },
  deleteSchool: async (id: string) => await fetchGAS('delete_row', { sheet: 'schools', id }),

  // --- ADMIN STATS ---
  getAdminStats: async () => {
      const [users, moodLogs, referrals, posts] = await Promise.all([
          api.getUsers(),
          api.getAllMoodLogs(),
          api.fetchPsychologistReferrals(''), 
          api.getForumPosts()
      ]);
      
      return {
          totalUsers: users.length,
          totalStudents: users.filter(u => u.role === 'user').length,
          totalProfessional: users.filter(u => ['kader', 'bk', 'psychologist'].includes(u.role)).length,
          moodLogsCount: moodLogs.length,
          activeReferrals: referrals.filter(r => r.status === 'active').length,
          totalPosts: posts.length
      };
  },

  // --- CHAT SYSTEM ---
  getMessages: async (user1: string, user2: string, referralId?: string): Promise<ChatMessage[]> => {
    const res = await fetchGAS<ChatMessage[]>('get_messages', { user1, user2, referral_id: referralId });
    return Array.isArray(res) ? res.sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) : [];
  },
  sendMessage: async (sender_id: string, receiver_id: string, message: string, is_ai: boolean, referral_id?: string, sender_name?: string, sender_role?: string) => {
    return await fetchGAS<ChatMessage>('create_row', {
      sheet: 'chats',
      data: { sender_id, receiver_id, message, is_ai, referral_id, sender_name, sender_role, is_read: false, timestamp: new Date().toISOString() }
    });
  },
  getRecentChats: async (user_id: string): Promise<UserProfile[]> => {
    const res = await fetchGAS<UserProfile[]>('get_recent_chats', { user_id });
    return Array.isArray(res) ? res : [];
  },
  
  getInboxSummary: async (userId: string): Promise<InboxItem[]> => {
    try {
        const [allChats, allUsers] = await Promise.all([
            fetchGAS<ChatMessage[]>('get_table', { sheet: 'chats' }),
            fetchGAS<UserProfile[]>('get_table', { sheet: 'users' })
        ]);

        if (!Array.isArray(allChats)) return [];

        const inboxMap = new Map<string, { lastMsg: ChatMessage, unread: number }>();

        allChats.forEach(c => {
            if (c.referral_id) return;
            const isMeSender = c.sender_id === userId;
            const isMeReceiver = c.receiver_id === userId;

            if (isMeSender || isMeReceiver) {
                const partnerId = isMeSender ? c.receiver_id : c.sender_id;
                if (!inboxMap.has(partnerId)) {
                    inboxMap.set(partnerId, { lastMsg: c, unread: 0 });
                }
                const entry = inboxMap.get(partnerId)!;
                if (new Date(c.timestamp).getTime() > new Date(entry.lastMsg.timestamp).getTime()) {
                    entry.lastMsg = c;
                }
                const isRead = c.is_read === true || String(c.is_read).toLowerCase() === 'true';
                if (isMeReceiver && !isRead) {
                    entry.unread++;
                }
            }
        });

        const inboxItems: InboxItem[] = [];
        inboxMap.forEach((data, partnerId) => {
            if (partnerId === 's_ai') {
                inboxItems.push({
                    id: 's_ai', full_name: 'SohibAI', avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=sohibai',
                    role: 'ai', username: 'sohibai', email: 'ai@kitasohib.com', created_at: '', school_id: '',
                    lastMessage: data.lastMsg.message,
                    lastTime: data.lastMsg.timestamp,
                    unreadCount: data.unread
                });
            } else {
                const u = allUsers.find(user => user.id === partnerId);
                if (u) {
                    inboxItems.push({
                        ...u,
                        lastMessage: data.lastMsg.message,
                        lastTime: data.lastMsg.timestamp,
                        unreadCount: data.unread
                    });
                }
            }
        });

        return inboxItems.sort((a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime());
    } catch (e) {
        console.error("Inbox summary failed", e);
        return [];
    }
  },

  markMessagesAsRead: async (myId: string, senderId: string) => {
      try {
          const allChats = await api.getMessages(myId, senderId);
          const unread = allChats.filter(c => c.receiver_id === myId && (c.is_read === false || String(c.is_read).toUpperCase() === 'FALSE'));
          for (const msg of unread.slice(0, 10)) {
              await fetchGAS('update_row', { sheet: 'chats', id: msg.id, data: { is_read: true } });
          }
      } catch(e) {}
  },

  // --- FEATURES ---
  getNotifications: async (userId: string): Promise<Notification[]> => {
    const res = await fetchGAS<Notification[]>('get_table', { sheet: 'notifications' });
    return Array.isArray(res) ? res.filter(n => n.user_id === userId).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) : [];
  },
  markNotifRead: async (id: string) => await fetchGAS('update_row', { sheet: 'notifications', id, data: { is_read: true } }),
  addNotification: async (user_id: string, title: string, message: string, type: string, link: string = '') => {
    await fetchGAS('create_row', { sheet: 'notifications', data: { user_id, title, message, type, link, is_read: false, created_at: new Date().toISOString() } });
  },

  logMood: async (user_id: string, mood_score: number, notes: string) => {
    await fetchGAS('create_row', { sheet: 'mood_logs', data: { user_id, mood_score, notes, timestamp: new Date().toISOString() } });
    await fetchGAS('update_row', { sheet: 'users', id: user_id, data: { latest_mood: mood_score } });
  },
  getMoodHistory: async (user_id: string): Promise<MoodLog[]> => {
    const res = await fetchGAS<MoodLog[]>('get_table', { sheet: 'mood_logs' });
    return Array.isArray(res) ? res.filter(l => l.user_id === user_id) : [];
  },
  getAllMoodLogs: async (): Promise<MoodLog[]> => {
    const res = await fetchGAS<MoodLog[]>('get_table', { sheet: 'mood_logs' });
    return Array.isArray(res) ? res : [];
  },

  submitEmotionTest: async (user_id: string, score: number, ai_analysis: string, dimension_scores: any) => {
    await fetchGAS('update_row', { sheet: 'users', id: user_id, data: { latest_mood: Math.ceil(score / 20) } });
    return await fetchGAS('create_row', { sheet: 'emotion_tests', data: { user_id, score, level: score > 70 ? 'Berat' : score > 40 ? 'Sedang' : 'Ringan', ai_analysis, dimension_scores, timestamp: new Date().toISOString() } });
  },
  getEmotionResults: async (): Promise<EmotionTestResult[]> => {
    const res = await fetchGAS<any[]>('get_table', { sheet: 'emotion_tests' });
    return Array.isArray(res) ? res.map(r => ({ ...r, dimension_scores: typeof r.dimension_scores === 'string' ? JSON.parse(r.dimension_scores) : r.dimension_scores })) : [];
  },

  getAgendas: async (): Promise<Agenda[]> => {
    const res = await fetchGAS<Agenda[]>('get_table', { sheet: 'agendas' });
    return Array.isArray(res) ? filterBySchool(res) : [];
  },
  createAgenda: async (data: any) => await fetchGAS('create_row', { sheet: 'agendas', data: { ...data, school_id: getCurrentUser()?.school_id || '' } }),
  deleteAgenda: async (id: string) => await fetchGAS('delete_row', { sheet: 'agendas', id }),
  joinAgenda: async (agendaId: string, userId: string) => {
    const agendas = await api.getAgendas();
    const agenda = agendas.find(a => a.id === agendaId);
    if (!agenda) return false;
    const current = Array.isArray(agenda.participants) ? agenda.participants : [];
    if (current.includes(userId)) return false;
    await fetchGAS('update_row', { sheet: 'agendas', id: agendaId, data: { participants: JSON.stringify([...current, userId]) } });
    return true;
  },

  getArticles: async (): Promise<Article[]> => {
    const res = await fetchGAS<Article[]>('get_table', { sheet: 'articles' });
    return Array.isArray(res) ? filterBySchool(res) : [];
  },
  createArticle: async (data: any) => await fetchGAS<Article>('create_row', { sheet: 'articles', data: { ...data, school_id: getCurrentUser()?.school_id || '', likes_list: [], comments_count: 0, created_at: new Date().toISOString() } }),
  addArticleComment: async (articleId: string, userId: string, userName: string, text: string) => {
    return await fetchGAS('add_article_comment', {
      article_id: articleId,
      user_id: userId,
      user_name: userName,
      text,
      created_at: new Date().toISOString()
    });
  },
  getArticleComments: async (articleId: string): Promise<ArticleComment[]> => {
    const res = await fetchGAS<ArticleComment[]>('get_table', { sheet: 'article_comments' });
    return Array.isArray(res) ? res.filter(c => String(c.article_id) === String(articleId)).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) : [];
  },
  deleteArticle: async (id: string) => await fetchGAS('delete_row', { sheet: 'articles', id }),
  toggleLikeArticle: async (id: string, userId: string) => {
    const articles = await api.getArticles();
    const article = articles.find(a => a.id === id);
    if(article) {
        let likes = Array.isArray(article.likes_list) ? article.likes_list : [];
        if(likes.includes(userId)) likes = likes.filter(x => x !== userId);
        else likes.push(userId);
        await fetchGAS('update_row', { sheet: 'articles', id, data: { likes_list: JSON.stringify(likes), likes_count: likes.length } });
    }
  },

  getForumPosts: async (): Promise<ForumPost[]> => {
    const res = await fetchGAS<any[]>('get_table', { sheet: 'forum_posts' });
    const posts = Array.isArray(res) ? res.map(p => ({
        ...p,
        likes: typeof p.likes_list === 'string' ? JSON.parse(p.likes_list) : p.likes_list || [],
        comments: typeof p.comments_json === 'string' ? JSON.parse(p.comments_json) : p.comments_json || []
    })).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) : [];
    return filterBySchool(posts);
  },
  createForumPost: async (user_id: string, content: string, is_anonymous: boolean, image_url: string = "") => {
    const users = await api.getUsers();
    const u = users.find(x => x.id === user_id);
    return await fetchGAS('create_row', { sheet: 'forum_posts', data: { 
        user_id, content, is_anonymous, image_url, school_id: u?.school_id || getCurrentUser()?.school_id || '',
        user_name: u?.full_name, user_avatar: u?.avatar_url, user_role: u?.role, 
        likes_list: [], comments_json: [], created_at: new Date().toISOString() 
    }});
  },
  toggleLikeForumPost: async (id: string, userId: string) => {
      return await fetchGAS('forum_like', { postId: id, userId });
  },
  replyForumPost: async (postId: string, user: UserProfile, content: string) => {
      const reply = { 
        id: `c_${Date.now()}`, 
        user_id: user.id, 
        user_name: user.full_name, 
        user_avatar: user.avatar_url, 
        content, 
        created_at: new Date().toISOString() 
      };
      return await fetchGAS('forum_reply', { postId, reply });
  },
  deleteForumComment: async (postId: string, commentId: string) => {
      const posts = await api.getForumPosts();
      const p = posts.find(x => x.id === postId);
      if(p) {
          const comments = p.comments.filter(c => c.id !== commentId);
          await fetchGAS('update_row', { sheet: 'forum_posts', id: postId, data: { comments_json: JSON.stringify(comments) } });
      }
  },
  deleteForumPost: async (id: string) => await fetchGAS('delete_row', { sheet: 'forum_posts', id }),

  deleteRow: async (sheet: string, id: string) => await fetchGAS('delete_row', { sheet, id }),

  // --- REFERRALS ---
  fetchPsychologistReferrals: async (pid: string) => {
      const res = await fetchGAS<Referral[]>('get_table', { sheet: 'referrals' });
      return Array.isArray(res) ? filterBySchool(res) : [];
  },
  getKaderActiveReferrals: async (kid: string) => {
      const res = await fetchGAS<Referral[]>('get_table', { sheet: 'referrals' });
      return Array.isArray(res) ? filterBySchool(res).filter(r => r.kader_id === kid && r.status === 'active') : [];
  },
  getReferralById: async (id: string) => {
      const res = await fetchGAS<Referral[]>('get_table', { sheet: 'referrals' });
      return Array.isArray(res) ? filterBySchool(res).find(r => r.id === id) : undefined;
  },
  createReferralRequest: async (uid: string, mood: number, note: string) => {
      const users = await api.getUsers();
      const u = users.find(x => x.id === uid);
      await fetchGAS('create_row', { sheet: 'referrals', data: {
          user_id: uid, user_name: u?.full_name, user_avatar: u?.avatar_url, school_id: u?.school_id || getCurrentUser()?.school_id || '',
          mood_score: mood, notes: note, status: 'pending',
          kader_id: 'system', kader_name: 'System', psychologist_id: 'psy_1',
          created_at: new Date().toISOString()
      }});
  },
  submitReferralToPsychologist: async (uid: string, mood: number, note: string, kid: string) => {
      const users = await api.getUsers();
      const u = users.find(x => x.id === uid);
      const k = users.find(x => x.id === kid);
      await fetchGAS('create_row', { sheet: 'referrals', data: {
          user_id: uid, user_name: u?.full_name, user_avatar: u?.avatar_url, school_id: u?.school_id || getCurrentUser()?.school_id || '',
          mood_score: mood, notes: note, status: 'pending',
          kader_id: kid, kader_name: k?.full_name, psychologist_id: 'psy_1',
          created_at: new Date().toISOString()
      }});
  },
  updateReferralStatus: async (id: string, status: string) => {
      const data: any = { status, updated_at: new Date().toISOString() };
      if(status === 'completed') data.completed_at = new Date().toISOString();
      return await fetchGAS<any>('update_row', { sheet: 'referrals', id, data });
  }
};
