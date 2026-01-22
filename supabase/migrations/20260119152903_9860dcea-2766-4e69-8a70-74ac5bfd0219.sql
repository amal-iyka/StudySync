-- Remove the duplicate policy we added that may conflict
DROP POLICY IF EXISTS "Users can insert own admin membership for new groups" ON public.group_memberships;