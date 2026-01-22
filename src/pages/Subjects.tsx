import { useState } from 'react';
import { Plus, MoreVertical, Trash2, Edit2, ChevronDown, ChevronRight, Check, Circle, Loader } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useStudyData } from '@/hooks/useStudyData';
import { cn } from '@/lib/utils';

const COLORS = [
  'hsl(217, 91%, 60%)',
  'hsl(262, 83%, 58%)',
  'hsl(142, 76%, 36%)',
  'hsl(25, 95%, 53%)',
  'hsl(199, 89%, 48%)',
  'hsl(346, 87%, 62%)',
  'hsl(45, 93%, 47%)',
  'hsl(173, 80%, 40%)',
];

type TopicStatus = 'not-started' | 'in-progress' | 'learned';

export default function Subjects() {
  const { user } = useAuth();
  const { 
    subjects, 
    topics,
    streak,
    addSubject, 
    updateSubject, 
    deleteSubject, 
    addTopic, 
    updateTopic, 
    deleteTopic,
    getTopicsForSubject 
  } = useStudyData(user?.id);
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<string | null>(null);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [newSubject, setNewSubject] = useState({ name: '', description: '', color: COLORS[0] });
  const [newTopicName, setNewTopicName] = useState<Record<string, string>>({});

  const handleAddSubject = async () => {
    if (newSubject.name.trim()) {
      await addSubject(newSubject.name.trim(), newSubject.description.trim(), newSubject.color);
      setNewSubject({ name: '', description: '', color: COLORS[subjects.length % COLORS.length] });
      setIsAddOpen(false);
    }
  };

  const handleAddTopic = async (subjectId: string) => {
    const name = newTopicName[subjectId]?.trim();
    if (name) {
      await addTopic(subjectId, name);
      setNewTopicName(prev => ({ ...prev, [subjectId]: '' }));
    }
  };

  const toggleExpanded = (subjectId: string) => {
    setExpandedSubjects(prev => {
      const next = new Set(prev);
      if (next.has(subjectId)) {
        next.delete(subjectId);
      } else {
        next.add(subjectId);
      }
      return next;
    });
  };

  const cycleTopicStatus = async (topicId: string, currentStatus: TopicStatus) => {
    const statusOrder: TopicStatus[] = ['not-started', 'in-progress', 'learned'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
    await updateTopic(topicId, { status: nextStatus });
  };

  const getStatusIcon = (status: TopicStatus) => {
    switch (status) {
      case 'learned':
        return <Check className="w-4 h-4" />;
      case 'in-progress':
        return <Loader className="w-4 h-4" />;
      default:
        return <Circle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: TopicStatus) => {
    switch (status) {
      case 'learned':
        return 'bg-green-500/20 text-green-600 border-green-500/30';
      case 'in-progress':
        return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const subjectStreaks = (streak?.subject_streaks || {}) as Record<string, { currentStreak?: number }>;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Subjects</h1>
            <p className="text-muted-foreground mt-1">
              Manage your subjects and track topic progress
            </p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Subject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Subject</DialogTitle>
                <DialogDescription>
                  Create a new subject to organize your learning
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Subject Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Data Structures"
                    value={newSubject.name}
                    onChange={(e) => setNewSubject(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the subject"
                    value={newSubject.description}
                    onChange={(e) => setNewSubject(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-2 flex-wrap">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewSubject(prev => ({ ...prev, color }))}
                        className={cn(
                          "w-8 h-8 rounded-full transition-all",
                          newSubject.color === color && "ring-2 ring-offset-2 ring-primary"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button onClick={handleAddSubject}>Add Subject</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Subjects Grid */}
        {subjects.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Plus className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No subjects yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first subject to start tracking your learning progress
              </p>
              <Button onClick={() => setIsAddOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Your First Subject
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {subjects.map((subject) => {
              const subjectTopics = getTopicsForSubject(subject.id);
              const topicsCompleted = subjectTopics.filter(t => t.status === 'learned').length;
              const progress = subjectTopics.length > 0 
                ? Math.round((topicsCompleted / subjectTopics.length) * 100) 
                : 0;
              const isExpanded = expandedSubjects.has(subject.id);
              const subjectStreak = subjectStreaks[subject.id];

              return (
                <Card key={subject.id} className="overflow-hidden">
                  <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(subject.id)}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <CollapsibleTrigger className="flex items-center gap-3 text-left flex-1">
                          <div 
                            className="w-4 h-4 rounded-full shrink-0" 
                            style={{ backgroundColor: subject.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg">{subject.name}</CardTitle>
                            {subject.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                {subject.description}
                              </p>
                            )}
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                          )}
                        </CollapsibleTrigger>

                        <div className="flex items-center gap-2">
                          {subjectStreak && subjectStreak.currentStreak && subjectStreak.currentStreak > 0 && (
                            <Badge variant="secondary" className="gap-1">
                              🔥 {subjectStreak.currentStreak}
                            </Badge>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditingSubject(subject.id)}>
                                <Edit2 className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => deleteSubject(subject.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-3">
                        <Progress value={progress} className="flex-1 h-2" />
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {topicsCompleted}/{subjectTopics.length} topics
                        </span>
                      </div>
                    </CardHeader>

                    <CollapsibleContent>
                      <CardContent className="pt-0 border-t border-border">
                        <div className="space-y-2 pt-4">
                          {subjectTopics.map((topic) => (
                            <div 
                              key={topic.id}
                              className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 group"
                            >
                              <button
                                onClick={() => cycleTopicStatus(topic.id, topic.status as TopicStatus)}
                                className={cn(
                                  "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all",
                                  getStatusColor(topic.status as TopicStatus)
                                )}
                              >
                                {getStatusIcon(topic.status as TopicStatus)}
                              </button>
                              <span className={cn(
                                "flex-1 font-medium",
                                topic.status === 'learned' && "line-through text-muted-foreground"
                              )}>
                                {topic.name}
                              </span>
                              <Badge variant="outline" className="capitalize text-xs">
                                {topic.status.replace('-', ' ')}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => deleteTopic(topic.id)}
                              >
                                <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                              </Button>
                            </div>
                          ))}

                          {/* Add Topic Input */}
                          <div className="flex gap-2 pt-2">
                            <Input
                              placeholder="Add a new topic..."
                              value={newTopicName[subject.id] || ''}
                              onChange={(e) => setNewTopicName(prev => ({ ...prev, [subject.id]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleAddTopic(subject.id);
                                }
                              }}
                            />
                            <Button 
                              size="icon"
                              onClick={() => handleAddTopic(subject.id)}
                              disabled={!newTopicName[subject.id]?.trim()}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
