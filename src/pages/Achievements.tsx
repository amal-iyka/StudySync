import { Trophy, Star, Flame, BookOpen, Users, Target, Calendar, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useStudyData } from '@/hooks/useStudyData';
import { useGroups } from '@/hooks/useGroups';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

const BADGES = [
  {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Complete your first study session',
    icon: Star,
    requirement: '1 session',
    category: 'learning',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10'
  },
  {
    id: 'week-warrior',
    name: 'Week Warrior',
    description: 'Maintain a 7-day study streak',
    icon: Flame,
    requirement: '7-day streak',
    category: 'streak',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10'
  },
  {
    id: 'subject-master',
    name: 'Subject Master',
    description: 'Complete all topics in a subject',
    icon: BookOpen,
    requirement: '100% in any subject',
    category: 'learning',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10'
  },
  {
    id: 'team-player',
    name: 'Team Player',
    description: 'Join your first study group',
    icon: Users,
    requirement: 'Join 1 group',
    category: 'social',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10'
  },
  {
    id: 'consistency-king',
    name: 'Consistency King',
    description: 'Achieve 80%+ consistency for a month',
    icon: Target,
    requirement: '80% monthly',
    category: 'consistency',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10'
  },
  {
    id: 'reflective-learner',
    name: 'Reflective Learner',
    description: 'Add 10 reflection notes',
    icon: Calendar,
    requirement: '10 notes',
    category: 'learning',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10'
  },
  {
    id: 'marathon-runner',
    name: 'Marathon Runner',
    description: 'Study for 30 days in a row',
    icon: Flame,
    requirement: '30-day streak',
    category: 'streak',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10'
  },
  {
    id: 'knowledge-seeker',
    name: 'Knowledge Seeker',
    description: 'Complete 50 study sessions',
    icon: Award,
    requirement: '50 sessions',
    category: 'learning',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10'
  }
];

export default function Achievements() {
  const { user } = useAuth();
  const { userBadges, streak, sessions, subjects, topics, getTopicsForSubject } = useStudyData(user?.id);
  const { groups } = useGroups(user?.id);

  // Calculate progress for each badge
  const getBadgeProgress = (badgeId: string): number => {
    switch (badgeId) {
      case 'first-steps':
        return sessions.length > 0 ? 100 : 0;
      case 'week-warrior':
        return Math.min(((streak?.current_streak || 0) / 7) * 100, 100);
      case 'subject-master': {
        let maxProgress = 0;
        subjects.forEach(s => {
          const subjectTopics = getTopicsForSubject(s.id);
          if (subjectTopics.length > 0) {
            const progress = (subjectTopics.filter(t => t.status === 'learned').length / subjectTopics.length) * 100;
            maxProgress = Math.max(maxProgress, progress);
          }
        });
        return maxProgress;
      }
      case 'team-player':
        return groups.length > 0 ? 100 : 0;
      case 'consistency-king':
        return 0;
      case 'reflective-learner': {
        const notesCount = sessions.filter(s => s.notes && s.notes.trim()).length;
        return Math.min((notesCount / 10) * 100, 100);
      }
      case 'marathon-runner':
        return Math.min(((streak?.current_streak || 0) / 30) * 100, 100);
      case 'knowledge-seeker':
        return Math.min((sessions.length / 50) * 100, 100);
      default:
        return 0;
    }
  };

  const earnedBadges = userBadges.map(ub => ub.badge_id);
  const totalEarned = earnedBadges.length;
  const totalBadges = BADGES.length;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Achievements</h1>
          <p className="text-muted-foreground mt-1">
            Track your progress and unlock badges
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4 lg:p-6 text-center">
              <Trophy className="w-8 h-8 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold">{totalEarned}/{totalBadges}</p>
              <p className="text-sm text-muted-foreground">Badges Earned</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 lg:p-6 text-center">
              <Flame className="w-8 h-8 mx-auto text-orange-500 mb-2" />
              <p className="text-2xl font-bold">{streak?.current_streak || 0}</p>
              <p className="text-sm text-muted-foreground">Current Streak</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 lg:p-6 text-center">
              <Flame className="w-8 h-8 mx-auto text-red-500 mb-2" />
              <p className="text-2xl font-bold">{streak?.longest_streak || 0}</p>
              <p className="text-sm text-muted-foreground">Longest Streak</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 lg:p-6 text-center">
              <BookOpen className="w-8 h-8 mx-auto text-blue-500 mb-2" />
              <p className="text-2xl font-bold">{sessions.length}</p>
              <p className="text-sm text-muted-foreground">Total Sessions</p>
            </CardContent>
          </Card>
        </div>

        {/* Badge Categories */}
        <div className="space-y-6">
          {/* Earned Badges */}
          {totalEarned > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Earned Badges
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {BADGES.filter(b => earnedBadges.includes(b.id)).map(badge => {
                  const userBadge = userBadges.find(ub => ub.badge_id === badge.id);
                  const Icon = badge.icon;
                  
                  return (
                    <Card key={badge.id} className="border-primary/30 bg-primary/5">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", badge.bgColor)}>
                            <Icon className={cn("w-6 h-6", badge.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground">{badge.name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">{badge.description}</p>
                            {userBadge?.earned_at && (
                              <p className="text-xs text-primary mt-1">
                                Earned {format(parseISO(userBadge.earned_at), 'MMM d, yyyy')}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* In Progress */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              In Progress
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {BADGES.filter(b => !earnedBadges.includes(b.id)).map(badge => {
                const progress = getBadgeProgress(badge.id);
                const Icon = badge.icon;
                
                return (
                  <Card key={badge.id} className="opacity-75 hover:opacity-100 transition-opacity">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center",
                          "bg-muted"
                        )}>
                          <Icon className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground">{badge.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">{badge.description}</p>
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">{badge.requirement}</span>
                              <span className="font-medium">{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-1.5" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
