import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';
import { subjectSchema, topicSchema } from '@/lib/validations';

type Subject = Database['public']['Tables']['subjects']['Row'];
type Topic = Database['public']['Tables']['topics']['Row'];
type StudySession = Database['public']['Tables']['study_sessions']['Row'];
type Streak = Database['public']['Tables']['streaks']['Row'];
type Badge = Database['public']['Tables']['badges']['Row'];
type UserBadge = Database['public']['Tables']['user_badges']['Row'];

export function useStudyData(userId: string | undefined) {
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!userId) return;
    
    setIsLoading(true);
    
    const [
      { data: subjectsData },
      { data: topicsData },
      { data: sessionsData },
      { data: streakData },
      { data: badgesData },
      { data: userBadgesData }
    ] = await Promise.all([
      supabase.from('subjects').select('*').order('created_at', { ascending: false }),
      supabase.from('topics').select('*').order('order_index'),
      supabase.from('study_sessions').select('*').order('created_at', { ascending: false }),
      supabase.from('streaks').select('*').eq('user_id', userId).single(),
      supabase.from('badges').select('*'),
      supabase.from('user_badges').select('*').eq('user_id', userId)
    ]);

    setSubjects(subjectsData || []);
    setTopics(topicsData || []);
    setSessions(sessionsData || []);
    setStreak(streakData);
    setBadges(badgesData || []);
    setUserBadges(userBadgesData || []);
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Subject CRUD
  const addSubject = async (name: string, description: string, color: string) => {
    if (!userId) return null;
    
    // Validate input
    const validation = subjectSchema.safeParse({ name, description, color });
    if (!validation.success) {
      toast({ variant: 'destructive', title: 'Validation Error', description: validation.error.errors[0]?.message || 'Invalid input' });
      return null;
    }
    
    const { data, error } = await supabase
      .from('subjects')
      .insert({ user_id: userId, name: validation.data.name, description: validation.data.description, color: validation.data.color })
      .select()
      .single();

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      return null;
    }

    setSubjects(prev => [data, ...prev]);
    toast({ title: 'Subject added', description: `${validation.data.name} has been created.` });
    return data;
  };

  const updateSubject = async (id: string, updates: Partial<Subject>) => {
    const { error } = await supabase
      .from('subjects')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      return false;
    }

    setSubjects(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    return true;
  };

  const deleteSubject = async (id: string) => {
    const { error } = await supabase.from('subjects').delete().eq('id', id);
    
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      return false;
    }

    setSubjects(prev => prev.filter(s => s.id !== id));
    setTopics(prev => prev.filter(t => t.subject_id !== id));
    toast({ title: 'Subject deleted' });
    return true;
  };

  // Topic CRUD
  const addTopic = async (subjectId: string, name: string) => {
    if (!userId) return null;
    
    // Validate input
    const validation = topicSchema.safeParse({ name });
    if (!validation.success) {
      toast({ variant: 'destructive', title: 'Validation Error', description: validation.error.errors[0]?.message || 'Invalid input' });
      return null;
    }
    
    const orderIndex = topics.filter(t => t.subject_id === subjectId).length;
    
    const { data, error } = await supabase
      .from('topics')
      .insert({ user_id: userId, subject_id: subjectId, name: validation.data.name, order_index: orderIndex })
      .select()
      .single();

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      return null;
    }

    setTopics(prev => [...prev, data]);
    return data;
  };

  const updateTopic = async (id: string, updates: Partial<Topic>) => {
    const { error } = await supabase
      .from('topics')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      return false;
    }

    setTopics(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    
    // Check for badge progress when topic is marked as learned
    if (updates.status === 'learned') {
      checkBadgeProgress();
    }
    
    return true;
  };

  const deleteTopic = async (id: string) => {
    const { error } = await supabase.from('topics').delete().eq('id', id);
    
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      return false;
    }

    setTopics(prev => prev.filter(t => t.id !== id));
    return true;
  };

  // Study Session
  const addSession = async (
    subjectId: string, 
    topicIds: string[], 
    notes: string, 
    sessionDate: Date
  ) => {
    if (!userId) return null;
    
    const { data, error } = await supabase
      .from('study_sessions')
      .insert({ 
        user_id: userId, 
        subject_id: subjectId, 
        topic_ids: topicIds, 
        notes,
        session_date: sessionDate.toISOString().split('T')[0]
      })
      .select()
      .single();

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      return null;
    }

    setSessions(prev => [data, ...prev]);
    
    // Update streak
    await updateStreak(sessionDate);
    
    // Check badge progress
    checkBadgeProgress();

    toast({ title: 'Session logged!', description: 'Keep up the great work!' });
    return data;
  };

  // Streak management
  const updateStreak = async (sessionDate: Date) => {
    if (!userId || !streak) return;

    const today = new Date().toISOString().split('T')[0];
    const sessionDateStr = sessionDate.toISOString().split('T')[0];
    const lastStudyDate = streak.last_study_date;

    let newCurrentStreak = streak.current_streak;
    
    if (!lastStudyDate) {
      newCurrentStreak = 1;
    } else {
      const lastDate = new Date(lastStudyDate);
      const daysDiff = Math.floor(
        (new Date(sessionDateStr).getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff === 0) {
        // Same day, no change
      } else if (daysDiff === 1) {
        newCurrentStreak += 1;
      } else {
        newCurrentStreak = 1;
      }
    }

    const newLongestStreak = Math.max(streak.longest_streak, newCurrentStreak);

    const { error } = await supabase
      .from('streaks')
      .update({ 
        current_streak: newCurrentStreak, 
        longest_streak: newLongestStreak,
        last_study_date: sessionDateStr
      })
      .eq('user_id', userId);

    if (!error) {
      setStreak(prev => prev ? {
        ...prev,
        current_streak: newCurrentStreak,
        longest_streak: newLongestStreak,
        last_study_date: sessionDateStr
      } : prev);
    }
  };

  // Badge progress checking
  const checkBadgeProgress = async () => {
    if (!userId) return;

    const completedTopics = topics.filter(t => t.status === 'learned').length;
    const sessionCount = sessions.length + 1; // +1 for the session just added
    const subjectCount = subjects.length;

    const badgeUpdates: { badgeId: string; progress: number; earned: boolean }[] = [
      { badgeId: 'first-session', progress: Math.min(sessionCount, 1) * 100, earned: sessionCount >= 1 },
      { badgeId: 'topics-10', progress: Math.min(completedTopics / 10, 1) * 100, earned: completedTopics >= 10 },
      { badgeId: 'topics-50', progress: Math.min(completedTopics / 50, 1) * 100, earned: completedTopics >= 50 },
      { badgeId: 'subjects-5', progress: Math.min(subjectCount / 5, 1) * 100, earned: subjectCount >= 5 },
      { badgeId: 'streak-3', progress: Math.min((streak?.current_streak || 0) / 3, 1) * 100, earned: (streak?.current_streak || 0) >= 3 },
      { badgeId: 'streak-7', progress: Math.min((streak?.current_streak || 0) / 7, 1) * 100, earned: (streak?.current_streak || 0) >= 7 },
      { badgeId: 'streak-30', progress: Math.min((streak?.current_streak || 0) / 30, 1) * 100, earned: (streak?.current_streak || 0) >= 30 },
    ];

    for (const update of badgeUpdates) {
      const existing = userBadges.find(ub => ub.badge_id === update.badgeId);
      
      if (!existing) {
        await supabase.from('user_badges').insert({
          user_id: userId,
          badge_id: update.badgeId,
          progress: Math.round(update.progress),
          earned_at: update.earned ? new Date().toISOString() : null
        });
      } else if (!existing.earned_at && update.earned) {
        await supabase.from('user_badges')
          .update({ 
            progress: 100, 
            earned_at: new Date().toISOString() 
          })
          .eq('id', existing.id);
          
        toast({
          title: '🎉 Badge Unlocked!',
          description: `You earned the "${badges.find(b => b.id === update.badgeId)?.name}" badge!`
        });
      } else {
        await supabase.from('user_badges')
          .update({ progress: Math.round(update.progress) })
          .eq('id', existing.id);
      }
    }

    // Refresh user badges
    const { data } = await supabase.from('user_badges').select('*').eq('user_id', userId);
    if (data) setUserBadges(data);
  };

  // Analytics
  const getWeeklyStats = () => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const thisWeekSessions = sessions.filter(s => new Date(s.created_at) >= weekAgo);
    const lastWeekSessions = sessions.filter(s => {
      const date = new Date(s.created_at);
      return date >= twoWeeksAgo && date < weekAgo;
    });

    const subjectsStudied = [...new Set(thisWeekSessions.map(s => s.subject_id))];
    const mostStudiedSubject = subjectsStudied.length > 0
      ? subjects.find(s => s.id === subjectsStudied[0])?.name || null
      : null;

    return {
      totalSessions: thisWeekSessions.length,
      totalDuration: thisWeekSessions.reduce((sum, s) => sum + (s.duration || 0), 0),
      topicsCompleted: topics.filter(t => t.status === 'learned').length,
      mostStudiedSubject,
      consistencyScore: Math.min(100, (thisWeekSessions.length / 7) * 100),
      previousWeekSessions: lastWeekSessions.length
    };
  };

  const getDailyActivity = (days: number = 30) => {
    const activity: { date: string; sessions: number; subjects: string[] }[] = [];
    const now = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      const daySessions = sessions.filter(s => s.session_date === dateStr);
      
      activity.push({
        date: dateStr,
        sessions: daySessions.length,
        subjects: [...new Set(daySessions.map(s => s.subject_id))]
      });
    }

    return activity.reverse();
  };

  return {
    subjects,
    topics,
    sessions,
    streak,
    badges,
    userBadges,
    isLoading,
    refetch: fetchData,
    // Subject operations
    addSubject,
    updateSubject,
    deleteSubject,
    // Topic operations
    addTopic,
    updateTopic,
    deleteTopic,
    // Session operations
    addSession,
    // Analytics
    getWeeklyStats,
    getDailyActivity,
    // Get topics for a subject
    getTopicsForSubject: (subjectId: string) => topics.filter(t => t.subject_id === subjectId)
  };
}
