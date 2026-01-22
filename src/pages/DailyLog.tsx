import { useState } from 'react';
import { format, isToday, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, subDays } from 'date-fns';
import { Calendar as CalendarIcon, Plus, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useStudyData } from '@/hooks/useStudyData';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function DailyLog() {
  const { user } = useAuth();
  const { subjects, sessions, topics, addSession, getTopicsForSubject } = useStudyData(user?.id);
  const { toast } = useToast();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    subjectId: '',
    topicIds: [] as string[],
    notes: '',
    duration: ''
  });

  const handleAddSession = async () => {
    if (!formData.subjectId) {
      toast({
        title: "Subject required",
        description: "Please select a subject for your study session.",
        variant: "destructive"
      });
      return;
    }

    const sessionDate = selectedDate ? new Date(selectedDate) : new Date();
    await addSession(
      formData.subjectId,
      formData.topicIds,
      formData.notes,
      sessionDate
    );

    toast({
      title: "Session logged! 🎉",
      description: "Keep up the great work!"
    });

    setFormData({ subjectId: '', topicIds: [], notes: '', duration: '' });
    setIsAddOpen(false);
    setSelectedDate(null);
  };

  const selectedSubject = subjects.find(s => s.id === formData.subjectId);
  const selectedSubjectTopics = selectedSubject ? getTopicsForSubject(selectedSubject.id) : [];

  // Calendar logic
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get sessions by date
  const sessionsByDate = sessions.reduce((acc, session) => {
    const dateKey = session.session_date;
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(session);
    return acc;
  }, {} as Record<string, typeof sessions>);

  const previousMonth = () => {
    setCurrentMonth(prev => subDays(startOfMonth(prev), 1));
  };

  const nextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 2, 0));
  };

  const handleDayClick = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    setSelectedDate(dateStr);
    setIsAddOpen(true);
  };

  // Recent sessions for display
  const recentSessions = [...sessions]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Daily Log</h1>
            <p className="text-muted-foreground mt-1">
              Track your daily study sessions and reflections
            </p>
          </div>
          <Button className="gap-2" onClick={() => { setSelectedDate(null); setIsAddOpen(true); }}>
            <Plus className="w-4 h-4" />
            Log Today's Session
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Study Calendar</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={previousMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="font-medium min-w-[140px] text-center">
                  {format(currentMonth, 'MMMM yyyy')}
                </span>
                <Button variant="ghost" size="icon" onClick={nextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for days before month starts */}
                {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}

                {calendarDays.map(day => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const daySessions = sessionsByDate[dateStr] || [];
                  const hasSession = daySessions.length > 0;
                  const isCurrentDay = isToday(day);
                  const isFuture = day > new Date();

                  return (
                    <button
                      key={dateStr}
                      onClick={() => !isFuture && handleDayClick(day)}
                      disabled={isFuture}
                      className={cn(
                        "aspect-square rounded-lg flex flex-col items-center justify-center relative transition-all",
                        hasSession && "bg-primary/20",
                        isCurrentDay && "ring-2 ring-primary",
                        isFuture ? "opacity-50 cursor-not-allowed" : "hover:bg-secondary",
                      )}
                    >
                      <span className={cn(
                        "text-sm font-medium",
                        isCurrentDay && "text-primary"
                      )}>
                        {format(day, 'd')}
                      </span>
                      {hasSession && (
                        <div className="flex gap-0.5 mt-1">
                          {daySessions.slice(0, 3).map((_, i) => (
                            <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary" />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-primary/20" />
                  <span className="text-sm text-muted-foreground">Studied</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded ring-2 ring-primary" />
                  <span className="text-sm text-muted-foreground">Today</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Sessions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentSessions.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No sessions yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Log your first study session!
                  </p>
                </div>
              ) : (
                recentSessions.map(session => {
                  const subject = subjects.find(s => s.id === session.subject_id);
                  const sessionTopics = (session.topic_ids || []).map(id => 
                    topics.find(t => t.id === id)
                  ).filter(Boolean);
                  
                  return (
                    <div 
                      key={session.id}
                      className="p-3 rounded-lg bg-secondary/30 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: subject?.color || 'hsl(var(--primary))' }}
                          />
                          <span className="font-medium text-sm">{subject?.name || 'Unknown'}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(parseISO(session.session_date), 'MMM d')}
                        </span>
                      </div>
                      {sessionTopics.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {sessionTopics.slice(0, 2).map(topic => (
                            <Badge key={topic!.id} variant="outline" className="text-xs">
                              {topic!.name}
                            </Badge>
                          ))}
                          {sessionTopics.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{sessionTopics.length - 2} more
                            </Badge>
                          )}
                        </div>
                      )}
                      {session.notes && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {session.notes}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Session Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Study Session</DialogTitle>
            <DialogDescription>
              {selectedDate 
                ? `Recording session for ${format(parseISO(selectedDate), 'MMMM d, yyyy')}`
                : "What did you study today?"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select 
                value={formData.subjectId} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, subjectId: v, topicIds: [] }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: subject.color }}
                        />
                        {subject.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedSubjectTopics.length > 0 && (
              <div className="space-y-2">
                <Label>Topics Covered</Label>
                <div className="max-h-[150px] overflow-y-auto space-y-2 p-3 rounded-lg bg-secondary/30">
                  {selectedSubjectTopics.map(topic => (
                    <div key={topic.id} className="flex items-center gap-2">
                      <Checkbox
                        id={topic.id}
                        checked={formData.topicIds.includes(topic.id)}
                        onCheckedChange={(checked) => {
                          setFormData(prev => ({
                            ...prev,
                            topicIds: checked 
                              ? [...prev.topicIds, topic.id]
                              : prev.topicIds.filter(id => id !== topic.id)
                          }));
                        }}
                      />
                      <label htmlFor={topic.id} className="text-sm cursor-pointer flex-1">
                        {topic.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes, optional)</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="duration"
                  type="number"
                  placeholder="60"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Reflection Notes</Label>
              <Textarea
                id="notes"
                placeholder="What did you learn? Any challenges? What went well?"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAddSession} disabled={!formData.subjectId}>
              Log Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
