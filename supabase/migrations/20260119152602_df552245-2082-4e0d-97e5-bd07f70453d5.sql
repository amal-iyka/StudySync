-- Drop the existing trigger that auto-adds admin membership (we'll handle this in code)
DROP TRIGGER IF EXISTS on_group_created ON public.groups;

-- Update the groups INSERT policy to use the new approach
-- The creator can insert a group if they set created_by to their own user id
-- We'll create the membership in code first, then the group

-- Add a policy to allow authenticated users to insert their own admin membership
-- when the group_id doesn't exist yet (for creation flow)
CREATE POLICY "Users can insert own admin membership for new groups"
ON public.group_memberships
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() 
  AND role = 'admin'
  AND NOT EXISTS (SELECT 1 FROM public.group_memberships WHERE group_id = group_memberships.group_id)
);

-- Update SELECT policy on groups to also allow creator to see their new group
DROP POLICY IF EXISTS "Members can view their groups" ON public.groups;
CREATE POLICY "Members can view their groups"
ON public.groups
FOR SELECT
USING (
  is_group_member(id) OR created_by = auth.uid()
);