
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/mockSupabase';
import { UserProfile } from '../../types';
import {
  Activity, Users, MessageCircle, BookOpen,
  Calendar, Share2, Stethoscope
} from 'lucide-react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

// Views
import { Overview } from './components/Overview';
import { UserManagement } from './components/UserManagement';
import { KaderChat } from './components/KaderChat';
import { ContentManager } from './components/ContentManager';
import { AgendaManager } from './components/AgendaManager';
import { ForumModeration } from './components/ForumModeration';
import { KaderCoordinationList } from './components/KaderCoordinationList';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  
  // Navigation State
  const [activeView, setActiveView] = useState<string>('overview');

  // Data States
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, avgMood: 0, riskUsers: 0 });
  const [isLoading, setIsLoading] = useState(true);
  
  const isChief = user?.is_lead === true;

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [users, tests] = await Promise.all([
        api.getRecentChats(user.id),
        api.getEmotionResults()
      ]);

      setUsersList(users);

      // Stats Calculation
      let riskCount = 0;
      let totalMood = 0;
      let moodCount = 0;

      users.forEach(u => {
        const userTests = (tests || [])
          .filter(t => t.user_id === u.id)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        if (userTests[0]?.score >= 71 || (u.latest_mood && u.latest_mood < 3)) riskCount++;
        if (u.latest_mood) { totalMood += u.latest_mood; moodCount++; }
      });

      setStats({
        totalUsers: users.length,
        avgMood: moodCount > 0 ? parseFloat((totalMood / moodCount).toFixed(1)) : 0,
        riskUsers: riskCount
      });
      
    } catch (e) {
      console.error("Dashboard Load Error", e);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Define Sidebar Items - Fitur Verifikasi BK telah dihapus dari sini
  const sidebarItems = [
    { id: 'overview', icon: Activity, label: 'Home', onClick: () => setActiveView('overview') },
    { id: 'users', icon: Users, label: 'Data Remaja', onClick: () => setActiveView('users') },
    { id: 'chat', icon: MessageCircle, label: 'Pesan', onClick: () => setActiveView('chat') },
    { id: 'coordination', icon: Stethoscope, label: 'Monitoring', onClick: () => setActiveView('coordination') },
    { id: 'articles', icon: BookOpen, label: 'Wawasan', onClick: () => setActiveView('articles') },
    { id: 'agendas', icon: Calendar, label: 'Agenda', onClick: () => setActiveView('agendas') },
    { id: 'forum', icon: Share2, label: 'Forum Rasa', onClick: () => setActiveView('forum') }
  ];

  return (
    <DashboardLayout
      title="Kader Dashboard"
      subtitle="Pusat Pemantauan Remaja"
      roleLabel={isChief ? 'Ketua Kader' : 'Kader Jiwa'}
      sidebarItems={sidebarItems}
      activeItem={activeView}
    >
      <div className="h-full flex flex-col">
        {isLoading ? (
          <LoadingSpinner label="Menyiapkan Dashboard..." />
        ) : (
          <>
            {activeView === 'overview' && (
              <Overview
                stats={stats}
                users={usersList}
                onViewChat={() => setActiveView('chat')}
                onRiskClick={() => setActiveView('users')}
              />
            )}

            {activeView === 'users' && (
              <UserManagement
                users={usersList}
                onChat={() => setActiveView('chat')}
              />
            )}

            {activeView === 'chat' && <KaderChat kaderId={user?.id || ''} />}
            {activeView === 'coordination' && <KaderCoordinationList kaderId={user?.id || ''} />}
            {activeView === 'articles' && <ContentManager user={user} />}
            {activeView === 'agendas' && <AgendaManager user={user} />}
            {activeView === 'forum' && <ForumModeration />}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};
