

// Tambahkan 'admin' ke dalam daftar role yang diizinkan
export type UserRole = 'user' | 'kader' | 'counselor' | 'bk' | 'psychologist' | 'admin' | 'ai';

export interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  role: UserRole;
  school_id: string;
  is_lead?: boolean; 
  password?: string; 
  avatar_url?: string;
  bio?: string;
  created_at: string;
  email: string;
  latest_mood?: number;
  school_name?: string | null; 
  status?: 'active' | 'pending_approval'; 
  assigned_kader_id?: string | null;
  // New Holistic Fields (Optional, can be updated from Test Result)
  mbti_type?: string; 
  riasec_code?: string; 
}

export interface School {
  id: string;
  school_name: string;
  address?: string; 
  contact_email?: string;
  phone?: string;
  created_at: string;
}

export interface DimensionScore {
  subject: string;
  full: number;
  value: number;
  name?: string; // Optional alias
  score?: number; // Optional alias for value
}

// Struktur Data Analisis Real dari AI
export interface DetailedAnalysis {
  summary: string;
  mbti: {
    type: string;
    title: string;
    description: string;
  };
  riasec: {
    code: string;
    primary: string;
    secondary: string;
    description: string;
  };
  careers: string[];
  strengths: string[];
  weaknesses: string[];
}

export interface EmotionTestResult {
  id: string;
  user_id: string;
  score: number; 
  level: 'Normal' | 'Ringan' | 'Sedang' | 'Berat';
  ai_analysis: string; // Akan berisi JSON String dari DetailedAnalysis
  timestamp: string;
  dimension_scores?: DimensionScore[]; 
}

export interface StudentReport {
  student: UserProfile;
  latestResult: EmotionTestResult | null;
  riskLevel: 'Rendah' | 'Sedang' | 'Tinggi';
}

export interface Referral {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  kader_id: string;
  kader_name: string;
  psychologist_id: string;
  school_id: string;
  status: 'pending' | 'active' | 'completed' | 'rejected';
  notes: string;
  mood_score: number;
  created_at: string;
  updated_at: string;
  completed_at?: string | null; 
}

export interface Agenda {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  type: 'Online' | 'Offline';
  author_kader_id: string;
  school_id: string;
  participants?: string[]; // List of User IDs who joined
}

export interface MoodLog {
  id: string;
  user_id: string;
  mood_score: number; 
  notes?: string; // Bisa string biasa atau JSON string dari Jurnal
  timestamp: string;
}

// --- NEW ANALYTICS TYPES ---
export interface MoodInsight {
  averageScore: number;
  dominantMood: number;
  trend: 'Meningkat' | 'Menurun' | 'Stabil';
  keywords: string[];
  lastLogDate: string | null;
  riskFlag: boolean;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  image_url: string;
  category: string;
  author_id: string;
  author_name: string;
  likes_count: number;
  comments_count: number;
  school_id: string;
  // likes_list is used for tracking user IDs who liked the article
  likes_list?: string[];
  created_at: string;
  is_liked?: boolean; 
}

export interface ArticleComment {
  id: string;
  article_id: string;
  user_id: string;
  user_name: string;
  text: string;
  created_at: string;
}

export interface ForumComment {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  created_at: string;
}

export interface ForumPost {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  user_role: UserRole;
  content: string;
  is_anonymous: boolean;
  school_id: string;
  // Added image_url to support images in forum posts
  image_url?: string;
  likes: string[]; 
  comments: ForumComment[]; 
  created_at: string;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string; 
  message: string;
  timestamp: string;
  is_ai: boolean;
  sender_name?: string; 
  sender_role?: UserRole; // Tambahan Peran
  assigned_kader_id?: string | null; 
  referral_id?: string; 
  is_read?: boolean; // New field for unread badges
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  type: string;
  link?: string;
  created_at: string;
}

export interface InboxItem extends UserProfile {
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
}

// --- API TYPES ---
export interface GASResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}