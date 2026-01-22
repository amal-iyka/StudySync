import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { FileText, Link as LinkIcon, Plus, ExternalLink, ThumbsUp, Share2, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useStudyData } from '@/hooks/useStudyData';
import { useMaterials } from '@/hooks/useMaterials';
import { useGroups } from '@/hooks/useGroups';
import { useToast } from '@/hooks/use-toast';

export default function Materials() {
  const { user } = useAuth();
  const { subjects } = useStudyData(user?.id);
  const { materials, addMaterial, markUseful, shareMaterialToGroup } = useMaterials(user?.id);
  const { groups } = useGroups(user?.id);
  const { toast } = useToast();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [newMaterial, setNewMaterial] = useState({
    subjectId: '',
    title: '',
    description: '',
    type: 'link' as 'pdf' | 'link',
    url: ''
  });

  const handleAddMaterial = async () => {
    if (!newMaterial.title.trim() || !newMaterial.url.trim()) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    
    await addMaterial(
      newMaterial.title.trim(),
      newMaterial.description.trim(),
      newMaterial.type,
      newMaterial.url.trim(),
      newMaterial.subjectId || undefined
    );
    
    toast({ title: "Material added! 📚" });
    setNewMaterial({ subjectId: '', title: '', description: '', type: 'link', url: '' });
    setIsAddOpen(false);
  };

  const handleMarkUseful = async (materialId: string) => {
    await markUseful(materialId);
    toast({ title: "Marked as useful! 👍" });
  };

  // Filter materials
  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.description?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesSubject = filterSubject === 'all' || m.subject_id === filterSubject;
    return matchesSearch && matchesSubject;
  });

  const myMaterials = filteredMaterials.filter(m => m.user_id === user?.id);
  const sharedMaterials = filteredMaterials.filter(m => m.group_id !== null);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Study Materials</h1>
            <p className="text-muted-foreground mt-1">
              Upload and organize your learning resources
            </p>
          </div>
          <Button onClick={() => setIsAddOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Material
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search materials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map(subject => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Materials Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All ({filteredMaterials.length})</TabsTrigger>
            <TabsTrigger value="my">My Materials ({myMaterials.length})</TabsTrigger>
            <TabsTrigger value="shared">Shared ({sharedMaterials.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <MaterialsGrid 
              materials={filteredMaterials} 
              subjects={subjects}
              groups={groups}
              onMarkUseful={handleMarkUseful}
              onShareToGroup={shareMaterialToGroup}
              currentUserId={user?.id}
            />
          </TabsContent>

          <TabsContent value="my" className="space-y-4">
            <MaterialsGrid 
              materials={myMaterials} 
              subjects={subjects}
              groups={groups}
              onMarkUseful={handleMarkUseful}
              onShareToGroup={shareMaterialToGroup}
              currentUserId={user?.id}
            />
          </TabsContent>

          <TabsContent value="shared" className="space-y-4">
            <MaterialsGrid 
              materials={sharedMaterials} 
              subjects={subjects}
              groups={groups}
              onMarkUseful={handleMarkUseful}
              onShareToGroup={shareMaterialToGroup}
              currentUserId={user?.id}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Material Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Study Material</DialogTitle>
            <DialogDescription>
              Share a helpful resource with your study materials
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={newMaterial.type === 'link' ? 'default' : 'outline'}
                  className="flex-1 gap-2"
                  onClick={() => setNewMaterial(prev => ({ ...prev, type: 'link' }))}
                >
                  <LinkIcon className="w-4 h-4" />
                  Link
                </Button>
                <Button
                  type="button"
                  variant={newMaterial.type === 'pdf' ? 'default' : 'outline'}
                  className="flex-1 gap-2"
                  onClick={() => setNewMaterial(prev => ({ ...prev, type: 'pdf' }))}
                >
                  <FileText className="w-4 h-4" />
                  PDF
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Subject (optional)</Label>
              <Select 
                value={newMaterial.subjectId} 
                onValueChange={(v) => setNewMaterial(prev => ({ ...prev, subjectId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g., Introduction to Algorithms PDF"
                value={newMaterial.title}
                onChange={(e) => setNewMaterial(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">{newMaterial.type === 'pdf' ? 'PDF URL' : 'Link URL'}</Label>
              <Input
                id="url"
                placeholder={newMaterial.type === 'pdf' ? 'https://example.com/file.pdf' : 'https://youtube.com/...'}
                value={newMaterial.url}
                onChange={(e) => setNewMaterial(prev => ({ ...prev, url: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="What's this material about?"
                value={newMaterial.description}
                onChange={(e) => setNewMaterial(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAddMaterial}>Add Material</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

interface MaterialWithDetails {
  id: string;
  title: string;
  description: string | null;
  type: string;
  url: string;
  user_id: string;
  subject_id: string | null;
  group_id: string | null;
  useful_count: number;
  created_at: string;
  author?: { full_name: string | null };
  subject?: { name: string; color: string };
}

function MaterialsGrid({ 
  materials, 
  subjects, 
  groups,
  onMarkUseful,
  onShareToGroup,
  currentUserId 
}: { 
  materials: MaterialWithDetails[];
  subjects: Array<{ id: string; name: string; color: string }>;
  groups: Array<{ id: string; name: string }>;
  onMarkUseful: (id: string) => void;
  onShareToGroup: (materialId: string, groupId: string) => Promise<boolean>;
  currentUserId?: string;
}) {
  const [shareDialogOpen, setShareDialogOpen] = useState<string | null>(null);

  if (materials.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="w-12 h-12 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No materials found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {materials.map(material => {
          const subject = material.subject || subjects.find(s => s.id === material.subject_id);
          const isOwner = material.user_id === currentUserId;

          return (
            <Card key={material.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {material.type === 'pdf' ? (
                      <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-red-500" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <LinkIcon className="w-5 h-5 text-blue-500" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <CardTitle className="text-sm line-clamp-1">{material.title}</CardTitle>
                      {subject && (
                        <Badge 
                          variant="outline" 
                          className="text-xs mt-1"
                          style={{ borderColor: subject.color, color: subject.color }}
                        >
                          {subject.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {material.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {material.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>By {material.author?.full_name || 'Unknown'}</span>
                  <span>{format(parseISO(material.created_at), 'MMM d')}</span>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 flex-1"
                    onClick={() => onMarkUseful(material.id)}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    {material.useful_count}
                  </Button>
                  {isOwner && groups.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1"
                      onClick={() => setShareDialogOpen(material.id)}
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1"
                    onClick={() => window.open(material.url, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Share Dialog */}
      <Dialog open={!!shareDialogOpen} onOpenChange={() => setShareDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share to Group</DialogTitle>
            <DialogDescription>
              Choose a group to share this material with
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {groups.map(group => (
              <Button
                key={group.id}
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={async () => {
                  if (shareDialogOpen) {
                    const success = await onShareToGroup(shareDialogOpen, group.id);
                    if (success) {
                      setShareDialogOpen(null);
                    }
                  }
                }}
              >
                {group.name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
