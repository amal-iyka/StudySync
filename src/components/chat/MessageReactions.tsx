import { useState } from 'react';
import { SmilePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '💯'];

interface Reaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

interface MessageReactionsProps {
  reactions: Reaction[];
  onAddReaction: (emoji: string) => void;
  onRemoveReaction: (emoji: string) => void;
  isOwnMessage?: boolean;
}

export function MessageReactions({ 
  reactions, 
  onAddReaction, 
  onRemoveReaction,
  isOwnMessage 
}: MessageReactionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleEmojiClick = (emoji: string) => {
    const existingReaction = reactions.find(r => r.emoji === emoji);
    if (existingReaction?.hasReacted) {
      onRemoveReaction(emoji);
    } else {
      onAddReaction(emoji);
    }
    setIsOpen(false);
  };

  const handleReactionBadgeClick = (reaction: Reaction) => {
    if (reaction.hasReacted) {
      onRemoveReaction(reaction.emoji);
    } else {
      onAddReaction(reaction.emoji);
    }
  };

  return (
    <div className={cn(
      "flex items-center gap-1 mt-1 flex-wrap",
      isOwnMessage ? "justify-end" : "justify-start"
    )}>
      {/* Existing reactions */}
      {reactions.map(reaction => (
        <button
          key={reaction.emoji}
          onClick={() => handleReactionBadgeClick(reaction)}
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors",
            reaction.hasReacted
              ? "bg-primary/20 text-primary border border-primary/30"
              : "bg-secondary hover:bg-secondary/80 text-foreground"
          )}
        >
          <span>{reaction.emoji}</span>
          <span>{reaction.count}</span>
        </button>
      ))}

      {/* Add reaction button */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <SmilePlus className="w-3.5 h-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" side="top" align={isOwnMessage ? "end" : "start"}>
          <div className="flex gap-1">
            {EMOJI_OPTIONS.map(emoji => (
              <button
                key={emoji}
                onClick={() => handleEmojiClick(emoji)}
                className="p-1.5 hover:bg-secondary rounded transition-colors text-lg"
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
