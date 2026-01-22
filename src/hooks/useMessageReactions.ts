import { useCallback, useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RealtimeChannel } from '@supabase/supabase-js';

interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

interface ReactionGroup {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

export function useMessageReactions(groupId: string | null, userId: string | undefined) {
  const { toast } = useToast();
  const [reactions, setReactions] = useState<Record<string, Reaction[]>>({});
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Fetch reactions for all messages in a group using REST API
  const fetchReactions = useCallback(async (messageIds: string[]) => {
    if (messageIds.length === 0) return;

    try {
      const session = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/message_reactions?message_id=in.(${messageIds.join(',')})`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${session.data.session?.access_token}`,
          }
        }
      );

      if (!response.ok) {
        console.error('[useMessageReactions] Error fetching reactions');
        return;
      }

      const data = await response.json() as Reaction[];

      // Group reactions by message_id
      const grouped: Record<string, Reaction[]> = {};
      data.forEach((reaction: Reaction) => {
        if (!grouped[reaction.message_id]) {
          grouped[reaction.message_id] = [];
        }
        grouped[reaction.message_id].push(reaction);
      });

      setReactions(prev => ({ ...prev, ...grouped }));
    } catch (error) {
      console.error('[useMessageReactions] Error:', error);
    }
  }, []);

  // Subscribe to realtime reaction changes
  useEffect(() => {
    if (!groupId) return;

    // Clean up previous subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channelName = `reactions-${groupId}-${Date.now()}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newReaction = payload.new as Reaction;
            setReactions(prev => {
              const messageReactions = prev[newReaction.message_id] || [];
              if (messageReactions.some(r => r.id === newReaction.id)) {
                return prev;
              }
              return {
                ...prev,
                [newReaction.message_id]: [...messageReactions, newReaction]
              };
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedReaction = payload.old as Reaction;
            setReactions(prev => {
              const messageReactions = prev[deletedReaction.message_id] || [];
              return {
                ...prev,
                [deletedReaction.message_id]: messageReactions.filter(r => r.id !== deletedReaction.id)
              };
            });
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [groupId]);

  // Add a reaction using REST API
  const addReaction = async (messageId: string, emoji: string) => {
    if (!userId) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in' });
      return false;
    }

    try {
      const session = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/message_reactions`,
        {
          method: 'POST',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${session.data.session?.access_token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ message_id: messageId, user_id: userId, emoji })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        // Ignore duplicate constraint errors
        if (!errorText.includes('duplicate')) {
          console.error('[useMessageReactions] Error adding reaction:', errorText);
          toast({ variant: 'destructive', title: 'Error', description: 'Failed to add reaction' });
        }
        return false;
      }

      return true;
    } catch (error) {
      console.error('[useMessageReactions] Error:', error);
      return false;
    }
  };

  // Remove a reaction using REST API
  const removeReaction = async (messageId: string, emoji: string) => {
    if (!userId) return false;

    try {
      const session = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/message_reactions?message_id=eq.${messageId}&user_id=eq.${userId}&emoji=eq.${encodeURIComponent(emoji)}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${session.data.session?.access_token}`,
          }
        }
      );

      if (!response.ok) {
        console.error('[useMessageReactions] Error removing reaction');
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to remove reaction' });
        return false;
      }

      return true;
    } catch (error) {
      console.error('[useMessageReactions] Error:', error);
      return false;
    }
  };

  // Get grouped reactions for a message
  const getReactionsForMessage = useCallback((messageId: string): ReactionGroup[] => {
    const messageReactions = reactions[messageId] || [];
    const emojiMap = new Map<string, { count: number; hasReacted: boolean }>();

    messageReactions.forEach(reaction => {
      const existing = emojiMap.get(reaction.emoji) || { count: 0, hasReacted: false };
      emojiMap.set(reaction.emoji, {
        count: existing.count + 1,
        hasReacted: existing.hasReacted || reaction.user_id === userId
      });
    });

    return Array.from(emojiMap.entries()).map(([emoji, data]) => ({
      emoji,
      count: data.count,
      hasReacted: data.hasReacted
    }));
  }, [reactions, userId]);

  return {
    reactions,
    fetchReactions,
    addReaction,
    removeReaction,
    getReactionsForMessage
  };
}
