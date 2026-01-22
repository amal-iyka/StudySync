-- Create message reactions table
CREATE TABLE public.message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.group_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Enable RLS
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- Members can view reactions on messages they can see
CREATE POLICY "Members can view reactions"
ON public.message_reactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_messages gm
    WHERE gm.id = message_id
    AND is_group_member(gm.group_id)
  )
);

-- Members can add reactions to messages in their groups
CREATE POLICY "Members can add reactions"
ON public.message_reactions
FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.group_messages gm
    WHERE gm.id = message_id
    AND is_group_member(gm.group_id)
  )
);

-- Users can remove their own reactions
CREATE POLICY "Users can remove own reactions"
ON public.message_reactions
FOR DELETE
USING (user_id = auth.uid());

-- Enable realtime for reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;