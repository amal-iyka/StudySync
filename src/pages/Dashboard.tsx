import { Link, useNavigate } from 'react-router-dom';
import { 
  Flame, 
  BookOpen, 
  Target, 
  TrendingUp, 
  Plus,
  ChevronRight,
  Trophy
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/layout/AppLayout';
import StreakBadge from '@/components/StreakBadge';
import useStreak from '@/hooks/useStreak';
import { useAuth } from '@/contexts/AuthContext';
import { useStudyData } from '@/hooks/useStudyData';
import { MotivationalCharacter } from '@/components/characters/AnimatedCharacters';
import { format, differenceInDays, parseISO } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { recordActivity } = useStreak();
  const { 
    subjects, 
    topics,
    streak, 
    sessions, 
    getWeeklyStats, 
    getDailyActivity, 
    userBadges,
    badges,
    isLoading 
  } = useStudyData(user?.id);

  const weeklyStats = getWeeklyStats();
  const dailyActivity = getDailyActivity(7);

  const totalTopics = topics.length;
  const completedTopics = topics.filter(t => t.status === 'learned').length;
  const overallProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  const chartData = dailyActivity.map(d => ({
    day: format(new Date(d.date), 'EEE'),
    sessions: d.sessions
  }));

  // Determine which character to show based on user state
  const getCharacterType = () => {
    if (!streak) return 'welcome';
    
    const daysSinceStudy = streak.last_study_date 
      ? differenceInDays(new Date(), parseISO(streak.last_study_date))
      : null;

    if (streak.current_streak >= 3) return 'streak';
    if (daysSinceStudy !== null && daysSinceStudy >= 2) return 'inactive';
    if (sessions.length === 0) return 'encourage';
    return 'welcome';
  };

  const getCharacterMessage = () => {
    const type = getCharacterType();
    switch (type) {
      case 'streak':
        return `🔥 ${streak?.current_streak} day streak! You're on fire!`;
      case 'inactive':
        return "Hey there! Ready to get back to learning? 📚";
      case 'encourage':
        return "Start your first study session today! You've got this! 💪";
      default:
        return `Welcome back, ${profile?.full_name?.split(' ')[0] || 'learner'}! ✨`;
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header with Character */}
        <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                Welcome back, {profile?.full_name?.split(' ')[0] || 'Learner'}! 👋
              </h1>
              <p className="text-muted-foreground mt-1">
                {format(new Date(), 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <StreakBadge />
              <button
                onClick={() => {
                  // record a meaningful activity before navigating to logging
                  try {
                    recordActivity();
                  } catch {
                    /* ignore */
                  }
                  navigate('/daily-log');
                }}
                className="inline-flex items-center gap-2 rounded-md px-3 py-2 bg-primary text-white"
              >
                <Plus className="w-4 h-4" />
                Log Study Session
              </button>
            </div>
          </div>

          {/* Motivational Character */}
          <MotivationalCharacter 
            type={getCharacterType()} 
            message={getCharacterMessage()}
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Flame className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs lg:text-sm text-muted-foreground">Current Streak</p>
                  <p className="text-xl lg:text-2xl font-bold text-foreground">{streak?.current_streak || 0} days</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-secondary flex items-center justify-center">
                  <BookOpen className="w-5 h-5 lg:w-6 lg:h-6 text-foreground" />
                </div>
                <div>
                  <p className="text-xs lg:text-sm text-muted-foreground">Subjects</p>
                  <p className="text-xl lg:text-2xl font-bold text-foreground">{subjects.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-secondary flex items-center justify-center">
                  <Target className="w-5 h-5 lg:w-6 lg:h-6 text-foreground" />
                </div>
                <div>
                  <p className="text-xs lg:text-sm text-muted-foreground">Topics Done</p>
                  <p className="text-xl lg:text-2xl font-bold text-foreground">{completedTopics}/{totalTopics}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-secondary flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-foreground" />
                </div>
                <div>
                  <p className="text-xs lg:text-sm text-muted-foreground">Consistency</p>
                  <p className="text-xl lg:text-2xl font-bold text-foreground">{Math.round(weeklyStats.consistencyScore)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Weekly Activity Chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Weekly Activity</CardTitle>
              <Badge variant="secondary" className="font-normal">
                {weeklyStats.totalSessions} sessions
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      cursor={{ fill: 'hsl(var(--primary) / 0.1)' }}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar 
                      dataKey="sessions" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                      name="Sessions"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">This Week</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <span className="text-sm text-muted-foreground">Sessions</span>
                <span className="font-semibold">{weeklyStats.totalSessions}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <span className="text-sm text-muted-foreground">Topics Completed</span>
                <span className="font-semibold">{weeklyStats.topicsCompleted}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <span className="text-sm text-muted-foreground">Top Subject</span>
                <span className="font-semibold truncate max-w-[120px]">
                  {weeklyStats.mostStudiedSubject || 'N/A'}
                </span>
              </div>
              {weeklyStats.previousWeekSessions > 0 && (
                <div className="pt-2 border-t border-border">
                  <div className="flex items-center gap-2 text-sm">
                    {weeklyStats.totalSessions >= weeklyStats.previousWeekSessions ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />
                    )}
                    <span className="text-muted-foreground">
                      {weeklyStats.totalSessions >= weeklyStats.previousWeekSessions ? 'Up' : 'Down'} from last week
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Subject Progress */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Subject Progress</CardTitle>
              <Link to="/subjects">
                <Button variant="ghost" size="sm" className="gap-1">
                  View all <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {subjects.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No subjects yet</p>
                  <Link to="/subjects">
                    <Button variant="outline" size="sm" className="mt-3 gap-2">
                      <Plus className="w-4 h-4" />
                      Add Subject
                    </Button>
                  </Link>
                </div>
              ) : (
                subjects.slice(0, 4).map((subject) => {
                  const subjectTopics = topics.filter(t => t.subject_id === subject.id);
                  const topicsDone = subjectTopics.filter(t => t.status === 'learned').length;
                  const progress = subjectTopics.length > 0 
                    ? Math.round((topicsDone / subjectTopics.length) * 100) 
                    : 0;
                  
                  return (
                    <div key={subject.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: subject.color }}
                          />
                          <span className="font-medium text-foreground">{subject.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {topicsDone}/{subjectTopics.length}
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Recent Achievements */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Achievements</CardTitle>
              <Link to="/achievements">
                <Button variant="ghost" size="sm" className="gap-1">
                  View all <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {userBadges.filter(ub => ub.earned_at).length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No badges earned yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Start studying to earn your first badge!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {userBadges.filter(ub => ub.earned_at).slice(0, 6).map((userBadge) => {
                    const badge = badges.find(b => b.id === userBadge.badge_id);
                    return (
                      <div 
                        key={userBadge.badge_id}
                        className="flex flex-col items-center p-3 rounded-xl bg-accent/50 text-center"
                      >
                        <div className="text-2xl mb-1">{badge?.icon || '🏆'}</div>
                        <span className="text-xs font-medium text-foreground">
                          {badge?.name || 'Badge'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
