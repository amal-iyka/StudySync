import { useCallback, useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';
import { RealtimeChannel } from '@supabase/supabase-js';
import { createGroupSchema, joinGroupSchema, messageSchema } from '@/lib/validations';

type Group = Database['public']['Tables']['groups']['Row'];
type GroupMembership = Database['public']['Tables']['group_memberships']['Row'];
type GroupMessage = Database['public']['Tables']['group_messages']['Row'];

interface GroupWithMembers extends Group {
  members: (GroupMembership & { profile?: { full_name: string; avatar_url: string | null; avatar_config: unknown } })[];
  memberCount: number;
  myRole: 'admin' | 'member' | null;
}

interface MessageWithProfile extends GroupMessage {
  profile?: { full_name: string; avatar_url: string | null; avatar_config: unknown };
}

export function useGroups(userId: string | undefined) {
  const { toast } = useToast();
  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [messages, setMessages] = useState<Record<string, MessageWithProfile[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const activeChannelRef = useRef<RealtimeChannel | null>(null);
  const currentGroupIdRef = useRef<string | null>(null);

  const fetchGroups = useCallback(async () => {
    if (!userId) return;
    
    setIsLoading(true);
    
    // Get all memberships for this user
    const { data: memberships } = await supabase
      .from('group_memberships')
      .select('group_id, role')
      .eq('user_id', userId);

    if (!memberships || memberships.length === 0) {
      setGroups([]);
      setIsLoading(false);
      return;
    }

    const groupIds = memberships.map(m => m.group_id);
    
    // Fetch groups
    const { data: groupsData } = await supabase
      .from('groups')
      .select('*')
      .in('id', groupIds);

    if (!groupsData) {
      setGroups([]);
      setIsLoading(false);
      return;
    }

    // Fetch all memberships for these groups
    const { data: allMemberships } = await supabase
      .from('group_memberships')
      .select('*')
      .in('group_id', groupIds);

    // Fetch profiles for all members
    const memberUserIds = [...new Set(allMemberships?.map(m => m.user_id) || [])];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, avatar_config')
      .in('id', memberUserIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Build groups with members
    const groupsWithMembers: GroupWithMembers[] = groupsData.map(group => {
      const groupMemberships = allMemberships?.filter(m => m.group_id === group.id) || [];
      const myMembership = memberships.find(m => m.group_id === group.id);
      
      return {
        ...group,
        members: groupMemberships.map(m => ({
          ...m,
          profile: profileMap.get(m.user_id)
        })),
        memberCount: groupMemberships.length,
        myRole: myMembership?.role as 'admin' | 'member' || null
      };
    });

    setGroups(groupsWithMembers);
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (activeChannelRef.current) {
        console.log('[useGroups] Cleaning up channel on unmount');
        supabase.removeChannel(activeChannelRef.current);
      }
    };
  }, []);

  // Create group
  const createGroup = async (name: string, description: string) => {
    if (!userId) return null;

    // Validate input
    const validation = createGroupSchema.safeParse({ name, description });
    if (!validation.success) {
      toast({ variant: 'destructive', title: 'Validation Error', description: validation.error.errors[0]?.message || 'Invalid input' });
      return null;
    }

    // Insert the group without .select() to avoid RLS timing issues
    // The trigger will create the admin membership
    const { error: insertError } = await supabase
      .from('groups')
      .insert({ 
        name: validation.data.name, 
        description: validation.data.description, 
        created_by: userId 
      });

    if (insertError) {
      console.error('Group creation error:', insertError);
      toast({ variant: 'destructive', title: 'Error', description: insertError.message });
      return null;
    }

    // Small delay to ensure trigger has run
    await new Promise(resolve => setTimeout(resolve, 100));

    // Now fetch the newly created group (we should have access via is_group_member or created_by)
    const { data: groups, error: fetchError } = await supabase
      .from('groups')
      .select('id, name, invite_code')
      .eq('created_by', userId)
      .eq('name', validation.data.name)
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchError || !groups || groups.length === 0) {
      console.error('Group fetch error:', fetchError);
      toast({ variant: 'destructive', title: 'Error', description: 'Group created but could not retrieve details' });
      await fetchGroups();
      return null;
    }

    const newGroup = groups[0];
    toast({ title: 'Group created!', description: `${validation.data.name} is ready for members. Invite code: ${newGroup.invite_code}` });
    await fetchGroups();
    return newGroup;
  };

  // Join group via invite code
  const joinGroup = async (inviteCode: string) => {
    if (!userId) return { success: false, error: 'Not logged in' };

    // Validate input
    const validation = joinGroupSchema.safeParse({ invite_code: inviteCode });
    if (!validation.success) {
      toast({ variant: 'destructive', title: 'Validation Error', description: validation.error.errors[0]?.message || 'Invalid invite code' });
      return { success: false, error: validation.error.errors[0]?.message || 'Invalid invite code' };
    }

    const { data: session } = await supabase.auth.getSession();
    
    const response = await supabase.functions.invoke('join-group', {
      body: { invite_code: validation.data.invite_code },
      headers: {
        Authorization: `Bearer ${session.session?.access_token}`
      }
    });

    if (response.error) {
      toast({ variant: 'destructive', title: 'Error', description: response.error.message });
      return { success: false, error: response.error.message };
    }

    if (response.data.error) {
      toast({ variant: 'destructive', title: 'Error', description: response.data.error });
      return { success: false, error: response.data.error };
    }

    toast({ title: 'Joined group!', description: response.data.message });
    await fetchGroups();
    return { success: true, groupId: response.data.group_id };
  };

  // Leave group
  const leaveGroup = async (groupId: string) => {
    if (!userId) return false;

    const { error } = await supabase
      .from('group_memberships')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      return false;
    }

    toast({ title: 'Left group' });
    await fetchGroups();
    return true;
  };

  // Delete group (admin only)
  const deleteGroup = async (groupId: string) => {
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', groupId);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      return false;
    }

    toast({ title: 'Group deleted' });
    await fetchGroups();
    return true;
  };

  // Fetch messages for a group
  const fetchMessages = useCallback(async (groupId: string) => {
    console.log('[useGroups] Fetching messages for group:', groupId);
    
    const { data: messagesData, error } = await supabase
      .from('group_messages')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      console.error('[useGroups] Error fetching messages:', error);
      return;
    }

    if (!messagesData) {
      console.log('[useGroups] No messages found');
      setMessages(prev => ({ ...prev, [groupId]: [] }));
      return;
    }

    console.log('[useGroups] Fetched messages count:', messagesData.length);

    // Fetch profiles for message authors
    const authorIds = [...new Set(messagesData.map(m => m.user_id))];
    
    let profileMap = new Map<string, { id: string; full_name: string; avatar_url: string | null; avatar_config: unknown }>();
    
    if (authorIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, avatar_config')
        .in('id', authorIds);
      
      profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    }

    const messagesWithProfiles: MessageWithProfile[] = messagesData.map(m => ({
      ...m,
      profile: profileMap.get(m.user_id)
    }));

    setMessages(prev => ({ ...prev, [groupId]: messagesWithProfiles }));
  }, []);

  // Subscribe to realtime messages
  const subscribeToMessages = useCallback((groupId: string) => {
    console.log('[useGroups] Subscribing to messages for group:', groupId);
    
    // Unsubscribe from previous channel if exists
    if (activeChannelRef.current) {
      console.log('[useGroups] Removing previous channel');
      supabase.removeChannel(activeChannelRef.current);
      activeChannelRef.current = null;
    }

    currentGroupIdRef.current = groupId;

    // Fetch initial messages
    fetchMessages(groupId);

    // Create new channel with unique name
    const channelName = `group-messages-${groupId}-${Date.now()}`;
    console.log('[useGroups] Creating channel:', channelName);
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${groupId}`
        },
        async (payload) => {
          console.log('[useGroups] Realtime INSERT received:', payload);
          
          const newMessage = payload.new as GroupMessage;
          
          // Check if message already exists to prevent duplicates
          setMessages(prev => {
            const existingMessages = prev[groupId] || [];
            const exists = existingMessages.some(m => m.id === newMessage.id);
            
            if (exists) {
              console.log('[useGroups] Message already exists, skipping duplicate');
              return prev;
            }

            // Fetch profile for new message asynchronously
            supabase
              .from('profiles')
              .select('id, full_name, avatar_url, avatar_config')
              .eq('id', newMessage.user_id)
              .single()
              .then(({ data: profile }) => {
                setMessages(prevInner => {
                  const currentMessages = prevInner[groupId] || [];
                  // Update the message with profile info
                  return {
                    ...prevInner,
                    [groupId]: currentMessages.map(m => 
                      m.id === newMessage.id 
                        ? { ...m, profile: profile || undefined }
                        : m
                    )
                  };
                });
              });

            // Add message immediately without profile (will be updated)
            const messageWithProfile: MessageWithProfile = {
              ...newMessage,
              profile: undefined
            };

            return {
              ...prev,
              [groupId]: [...existingMessages, messageWithProfile]
            };
          });
        }
      )
      .subscribe((status) => {
        console.log('[useGroups] Channel subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('[useGroups] Successfully subscribed to realtime messages');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[useGroups] Channel subscription error');
          toast({ 
            variant: 'destructive', 
            title: 'Connection Error', 
            description: 'Failed to connect to real-time updates. Please refresh the page.' 
          });
        }
      });

    activeChannelRef.current = channel;

    return () => {
      console.log('[useGroups] Cleanup: removing channel');
      if (activeChannelRef.current) {
        supabase.removeChannel(activeChannelRef.current);
        activeChannelRef.current = null;
      }
    };
  }, [fetchMessages, toast]);

  // Send message with optional attachment
  const sendMessage = async (
    groupId: string, 
    content: string,
    attachment?: { url: string; name: string; type: string }
  ) => {
    if (!userId) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to send messages' });
      return false;
    }

    // Allow empty content if there's an attachment
    if (!content.trim() && !attachment?.url) {
      return false;
    }

    // Validate content if present
    if (content.trim()) {
      const validation = messageSchema.safeParse({ content });
      if (!validation.success) {
        toast({ variant: 'destructive', title: 'Validation Error', description: validation.error.errors[0]?.message || 'Invalid message' });
        return false;
      }
    }

    setIsSendingMessage(true);
    console.log('[useGroups] Sending message to group:', groupId, 'with attachment:', !!attachment);

    const { data, error } = await supabase
      .from('group_messages')
      .insert({ 
        group_id: groupId, 
        user_id: userId, 
        content: content.trim() || (attachment ? `Shared: ${attachment.name}` : ''),
        attachment_url: attachment?.url || null,
        attachment_name: attachment?.name || null,
        attachment_type: attachment?.type || null
      })
      .select()
      .single();

    setIsSendingMessage(false);

    if (error) {
      console.error('[useGroups] Error sending message:', error);
      toast({ variant: 'destructive', title: 'Failed to send message', description: error.message });
      return false;
    }

    console.log('[useGroups] Message sent successfully:', data?.id);
    return true;
  };

  // Get leaderboard for a group
  const getLeaderboard = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return [];

    return group.members
      .map(m => ({
        userId: m.user_id,
        name: m.profile?.full_name || 'Unknown',
        avatar: m.profile?.avatar_url,
        avatarConfig: m.profile?.avatar_config,
        role: m.role,
        joinedAt: m.joined_at
      }))
      .sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime());
  };

  return {
    groups,
    messages,
    isLoading,
    isSendingMessage,
    refetch: fetchGroups,
    createGroup,
    joinGroup,
    leaveGroup,
    deleteGroup,
    fetchMessages,
    subscribeToMessages,
    sendMessage,
    getLeaderboard
  };
}
