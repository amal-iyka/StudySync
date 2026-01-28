import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Users, Plus, Copy, LogOut, Send, Crown, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useGroups } from '@/hooks/useGroups';
import { useToast } from '@/hooks/use-toast';
import { ProceduralAvatar, AvatarConfig } from '@/components/avatar/ProceduralAvatar';
import { ChatFileUpload } from '@/components/chat/ChatFileUpload';
import { ChatAttachmentPreview } from '@/components/chat/ChatAttachmentPreview';
import { ChatMaterialPicker } from '@/components/chat/ChatMaterialPicker';
import { ChatDropZone } from '@/components/chat/ChatDropZone';
import { MessageReactions } from '@/components/chat/MessageReactions';
import { useMaterials } from '@/hooks/useMaterials';
import { useMessageReactions } from '@/hooks/useMessageReactions';
import { supabase } from '@/integrations/supabase/client';

export default function Groups() {
  const { user } = useAuth();
  const { 
    groups, 
    messages, 
    isLoading,
    isSendingMessage,
    createGroup, 
    joinGroup, 
    leaveGroup,
    deleteGroup,
    subscribeToMessages,
    sendMessage,
    getLeaderboard
  } = useGroups(user?.id);
  const { materials } = useMaterials(user?.id);
  const { toast } = useToast();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });
  const [joinCode, setJoinCode] = useState('');
  const [messageText, setMessageText] = useState('');
  const [pendingAttachment, setPendingAttachment] = useState<{ url: string; name: string; type: string } | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isUploadingDrop, setIsUploadingDrop] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { 
    fetchReactions, 
    addReaction, 
    removeReaction, 
    getReactionsForMessage 
  } = useMessageReactions(selectedGroupId, user?.id);

  const selectedGroup = groups.find(g => g.id === selectedGroupId);
  const groupMessages = useMemo(() => (selectedGroupId ? messages[selectedGroupId] || [] : []), [selectedGroupId, messages]);
  const leaderboard = useMemo(() => (selectedGroupId ? getLeaderboard(selectedGroupId) : []), [selectedGroupId, getLeaderboard]);

  // Fetch reactions when messages change
  useEffect(() => {
    if (groupMessages.length > 0) {
      const messageIds = groupMessages.map(m => m.id);
      fetchReactions(messageIds);
    }
  }, [groupMessages, fetchReactions]);

  // Subscribe to messages when a group is selected
  useEffect(() => {
    if (selectedGroupId) {
      const unsubscribe = subscribeToMessages(selectedGroupId);
      return unsubscribe;
    }
  }, [selectedGroupId, subscribeToMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [groupMessages]);

  const handleCreateGroup = async () => {
    if (!newGroup.name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    const result = await createGroup(newGroup.name.trim(), newGroup.description.trim());
    if (result) {
      setNewGroup({ name: '', description: '' });
      setIsCreateOpen(false);
      setSelectedGroupId(result.id);
    }
  };

  const handleJoinGroup = async () => {
    if (!joinCode.trim()) return;
    setIsJoining(true);
    const result = await joinGroup(joinCode.trim());
    setIsJoining(false);
    if (result.success) {
      setJoinCode('');
      setIsJoinOpen(false);
      if (result.groupId) {
        setSelectedGroupId(result.groupId);
      }
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    await leaveGroup(groupId);
    if (selectedGroupId === groupId) {
      setSelectedGroupId(null);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (confirm('Are you sure you want to delete this group?')) {
      await deleteGroup(groupId);
      if (selectedGroupId === groupId) {
        setSelectedGroupId(null);
      }
    }
  };

  const handleSendMessage = async () => {
    if ((!messageText.trim() && !pendingAttachment?.url) || !selectedGroupId || isSendingMessage) return;
    const content = messageText.trim();
    const attachment = pendingAttachment;
    setMessageText(''); // Clear immediately for better UX
    setPendingAttachment(null);
    const success = await sendMessage(selectedGroupId, content, attachment || undefined);
    if (!success) {
      // Restore message if send failed
      setMessageText(content);
      setPendingAttachment(attachment);
    }
  };

  const handleFileUploaded = (url: string, name: string, type: string) => {
    if (url) {
      setPendingAttachment({ url, name, type });
    } else {
      setPendingAttachment(null);
    }
  };

  const handleMaterialSelect = (material: { id: string; title: string; type: string; url: string }) => {
    setPendingAttachment({
      url: material.url,
      name: material.title,
      type: material.type === 'pdf' ? 'pdf' : 'link'
    });
  };

  const handleFileDrop = useCallback(async (file: File) => {
    if (!user?.id || !selectedGroupId) return;

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'File too large', description: 'Maximum file size is 10MB' });
      return;
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({ variant: 'destructive', title: 'Invalid file type', description: 'Allowed: Images, PDFs, Word docs, Text files' });
      return;
    }

    setIsUploadingDrop(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${selectedGroupId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(fileName);

      const fileType = file.type.startsWith('image/') ? 'image' : 
                       file.type === 'application/pdf' ? 'pdf' : 'document';

      setPendingAttachment({ url: urlData.publicUrl, name: file.name, type: fileType });
      toast({ title: 'File ready to send', description: file.name });

    } catch (error: unknown) {
      console.error('Drop upload error:', error);
      toast({ variant: 'destructive', title: 'Upload failed', description: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsUploadingDrop(false);
    }
  }, [user?.id, selectedGroupId, toast]);

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Invite code copied!" });
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Study Groups</h1>
            <p className="text-muted-foreground mt-1">
              Collaborate and learn together with friends
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsJoinOpen(true)} className="gap-2">
              <Users className="w-4 h-4" />
              Join Group
            </Button>
            <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Group
            </Button>
          </div>
        </div>

        {groups.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No groups yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create a study group or join one with an invite code
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsJoinOpen(true)}>Join Group</Button>
                <Button onClick={() => setIsCreateOpen(true)}>Create Group</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Groups List */}
            <div className="space-y-3">
              <h2 className="font-semibold text-foreground">Your Groups</h2>
              {groups.map(group => (
                <Card 
                  key={group.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedGroupId === group.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedGroupId(group.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{group.name}</CardTitle>
                        {group.description && (
                          <CardDescription className="line-clamp-1 mt-1">
                            {group.description}
                          </CardDescription>
                        )}
                      </div>
                      {group.myRole === 'admin' && (
                        <Crown className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {group.members.slice(0, 4).map(member => {
                          const config = member.profile?.avatar_config as AvatarConfig | null;
                          return config && config.faceShape ? (
                            <div key={member.id} className="border-2 border-card rounded-full">
                              <ProceduralAvatar config={config} size={28} />
                            </div>
                          ) : (
                            <Avatar key={member.id} className="w-7 h-7 border-2 border-card">
                              <AvatarImage src={member.profile?.avatar_url || undefined} />
                              <AvatarFallback className="text-xs bg-primary/20">
                                {member.profile?.full_name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                          );
                        })}
                        {group.memberCount > 4 && (
                          <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs border-2 border-card">
                            +{group.memberCount - 4}
                          </div>
                        )}
                      </div>
                      <Badge variant="secondary">{group.memberCount} members</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Group Details */}
            <div className="lg:col-span-2">
              {selectedGroup ? (
                <Card className="h-full">
                  <CardHeader className="border-b border-border">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{selectedGroup.name}</CardTitle>
                        {selectedGroup.description && (
                          <CardDescription className="mt-1">{selectedGroup.description}</CardDescription>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => copyInviteCode(selectedGroup.invite_code)}
                          className="gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          {selectedGroup.invite_code}
                        </Button>
                        {selectedGroup.myRole === 'admin' ? (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteGroup(selectedGroup.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleLeaveGroup(selectedGroup.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <LogOut className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Tabs defaultValue="discussion" className="h-full">
                      <TabsList className="w-full rounded-none border-b bg-transparent h-auto p-0">
                        <TabsTrigger 
                          value="discussion" 
                          className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                        >
                          Discussion
                        </TabsTrigger>
                        <TabsTrigger 
                          value="members"
                          className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                        >
                          Members
                        </TabsTrigger>
                        <TabsTrigger 
                          value="leaderboard"
                          className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                        >
                          Leaderboard
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="discussion" className="m-0 p-4">
                        <ChatDropZone 
                          onFileDrop={handleFileDrop} 
                          disabled={isSendingMessage || isUploadingDrop}
                        >
                          <div className="flex flex-col h-[400px]">
                            <ScrollArea className="flex-1 pr-4">
                              {groupMessages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                  <Send className="w-12 h-12 text-muted-foreground/50 mb-3" />
                                  <p className="text-muted-foreground">No messages yet</p>
                                  <p className="text-sm text-muted-foreground">Start the conversation or drop a file!</p>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  {groupMessages.map(msg => {
                                    const config = msg.profile?.avatar_config as AvatarConfig | null;
                                    const msgReactions = getReactionsForMessage(msg.id);
                                    return (
                                      <div 
                                        key={msg.id}
                                        className={`group flex gap-3 ${msg.user_id === user?.id ? 'flex-row-reverse' : ''}`}
                                      >
                                        {config && config.faceShape ? (
                                          <ProceduralAvatar config={config} size={32} />
                                        ) : (
                                          <Avatar className="w-8 h-8">
                                            <AvatarImage src={msg.profile?.avatar_url || undefined} />
                                            <AvatarFallback className="text-xs">
                                              {msg.profile?.full_name?.charAt(0) || 'U'}
                                            </AvatarFallback>
                                          </Avatar>
                                        )}
                                        <div className={`max-w-[70%] ${msg.user_id === user?.id ? 'text-right' : ''}`}>
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-medium">{msg.profile?.full_name || 'User'}</span>
                                            <span className="text-xs text-muted-foreground">
                                              {format(parseISO(msg.created_at), 'h:mm a')}
                                            </span>
                                          </div>
                                          <div className={`p-3 rounded-lg ${
                                            msg.user_id === user?.id 
                                              ? 'bg-primary text-primary-foreground' 
                                              : 'bg-secondary'
                                          }`}>
                                            {!msg.content?.startsWith('Shared:') && msg.content && (
                                              <p className="text-sm">{msg.content}</p>
                                            )}
                                            {msg.attachment_url && (
                                              <ChatAttachmentPreview
                                                url={msg.attachment_url}
                                                name={msg.attachment_name || 'Attachment'}
                                                type={msg.attachment_type || 'document'}
                                                isOwnMessage={msg.user_id === user?.id}
                                              />
                                            )}
                                          </div>
                                          <MessageReactions
                                            reactions={msgReactions}
                                            onAddReaction={(emoji) => addReaction(msg.id, emoji)}
                                            onRemoveReaction={(emoji) => removeReaction(msg.id, emoji)}
                                            isOwnMessage={msg.user_id === user?.id}
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                  <div ref={messagesEndRef} />
                                </div>
                              )}
                            </ScrollArea>
                            
                            {/* File upload preview */}
                            {pendingAttachment && (
                              <div className="px-2 pt-2">
                                <ChatAttachmentPreview
                                  url={pendingAttachment.url}
                                  name={pendingAttachment.name}
                                  type={pendingAttachment.type}
                                />
                              </div>
                            )}
                            
                            <div className="flex items-center gap-2 pt-4 border-t border-border mt-4">
                              {user?.id && selectedGroupId && (
                                <ChatFileUpload
                                  userId={user.id}
                                  groupId={selectedGroupId}
                                  onFileUploaded={handleFileUploaded}
                                  disabled={isSendingMessage || isUploadingDrop}
                                />
                              )}
                              <ChatMaterialPicker
                                materials={materials}
                                onSelect={handleMaterialSelect}
                                disabled={isSendingMessage || isUploadingDrop}
                              />
                              <Input
                                placeholder={isUploadingDrop ? "Uploading..." : "Type a message..."}
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                                disabled={isSendingMessage || isUploadingDrop}
                                className="flex-1"
                              />
                              <Button 
                                onClick={handleSendMessage} 
                                disabled={(!messageText.trim() && !pendingAttachment) || isSendingMessage || isUploadingDrop}
                              >
                                {isSendingMessage || isUploadingDrop ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Send className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </ChatDropZone>
                      </TabsContent>

                      <TabsContent value="members" className="m-0 p-4">
                        <div className="space-y-3">
                          {selectedGroup.members.map(member => {
                            const config = member.profile?.avatar_config as AvatarConfig | null;
                            return (
                              <div 
                                key={member.id}
                                className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30"
                              >
                                {config && config.faceShape ? (
                                  <ProceduralAvatar config={config} size={40} />
                                ) : (
                                  <Avatar className="w-10 h-10">
                                    <AvatarImage src={member.profile?.avatar_url || undefined} />
                                    <AvatarFallback>{member.profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                                  </Avatar>
                                )}
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{member.profile?.full_name || 'User'}</span>
                                    {member.role === 'admin' && (
                                      <Crown className="w-4 h-4 text-yellow-500" />
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    Joined {format(parseISO(member.joined_at), 'MMM d, yyyy')}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </TabsContent>

                      <TabsContent value="leaderboard" className="m-0 p-4">
                        <div className="space-y-3">
                          {leaderboard.map((member, index) => {
                            const config = member.avatarConfig as AvatarConfig | null;
                            return (
                              <div 
                                key={member.userId}
                                className={`flex items-center gap-3 p-3 rounded-lg ${
                                  index === 0 ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-secondary/30'
                                }`}
                              >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                  index === 0 ? 'bg-yellow-500 text-yellow-950' :
                                  index === 1 ? 'bg-gray-300 text-gray-700' :
                                  index === 2 ? 'bg-orange-400 text-orange-950' :
                                  'bg-secondary text-foreground'
                                }`}>
                                  {index + 1}
                                </div>
                                {config && config.faceShape ? (
                                  <ProceduralAvatar config={config} size={40} />
                                ) : (
                                  <Avatar className="w-10 h-10">
                                    <AvatarImage src={member.avatar || undefined} />
                                    <AvatarFallback>{member.name?.charAt(0) || 'U'}</AvatarFallback>
                                  </Avatar>
                                )}
                                <div className="flex-1">
                                  <span className="font-medium">{member.name}</span>
                                </div>
                                {member.role === 'admin' && (
                                  <Crown className="w-4 h-4 text-yellow-500" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              ) : (
                <Card className="h-full border-dashed">
                  <CardContent className="flex flex-col items-center justify-center h-full py-12">
                    <Users className="w-12 h-12 text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">Select a group to view details</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Group Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Study Group</DialogTitle>
            <DialogDescription>
              Create a new group and invite friends to join
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="groupName">Group Name</Label>
              <Input
                id="groupName"
                placeholder="e.g., DSA Study Buddies"
                value={newGroup.name}
                onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="groupDescription">Description (optional)</Label>
              <Textarea
                id="groupDescription"
                placeholder="What's this group about?"
                value={newGroup.description}
                onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateGroup}>Create Group</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Join Group Dialog */}
      <Dialog open={isJoinOpen} onOpenChange={setIsJoinOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join Study Group</DialogTitle>
            <DialogDescription>
              Enter the invite code shared by a group admin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="inviteCode">Invite Code</Label>
              <Input
                id="inviteCode"
                placeholder="e.g., abc123"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsJoinOpen(false)}>Cancel</Button>
            <Button onClick={handleJoinGroup} disabled={isJoining}>
              {isJoining ? 'Joining...' : 'Join Group'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
