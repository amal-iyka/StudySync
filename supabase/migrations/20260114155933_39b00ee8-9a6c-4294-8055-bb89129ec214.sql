-- =============================================
-- STUDYSYNC DATABASE SCHEMA - PART 1: BASE TABLES
-- =============================================

-- Create role enum for group memberships
CREATE TYPE public.group_role AS ENUM ('admin', 'member');

-- Create topic status enum
CREATE TYPE public.topic_status AS ENUM ('not-started', 'in-progress', 'learned');

-- =============================================
-- 1. PROFILES TABLE
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  avatar_config JSONB DEFAULT '{}',
  theme_preference JSONB DEFAULT '{"mode": "light", "accent": "blue"}',
  branch TEXT,
  year TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 2. SUBJECTS TABLE
-- =============================================
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 3. TOPICS TABLE
-- =============================================
CREATE TABLE public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status public.topic_status NOT NULL DEFAULT 'not-started',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 4. STUDY SESSIONS TABLE
-- =============================================
CREATE TABLE public.study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  topic_ids UUID[] DEFAULT '{}',
  notes TEXT DEFAULT '',
  duration INTEGER DEFAULT 0,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 5. STREAKS TABLE
-- =============================================
CREATE TABLE public.streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_study_date DATE,
  subject_streaks JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 6. GROUPS TABLE
-- =============================================
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  invite_code TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 7. GROUP MEMBERSHIPS TABLE
-- =============================================
CREATE TABLE public.group_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.group_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE public.group_memberships ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 8. GROUP MESSAGES TABLE (with realtime)
-- =============================================
CREATE TABLE public.group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;

-- =============================================
-- 9. STUDY MATERIALS TABLE
-- =============================================
CREATE TABLE public.study_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('pdf', 'link')),
  url TEXT NOT NULL,
  useful_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 10. BADGES TABLE (system-defined)
-- =============================================
CREATE TABLE public.badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  requirement TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('streak', 'learning', 'social', 'consistency'))
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 11. USER BADGES TABLE
-- =============================================
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0,
  earned_at TIMESTAMPTZ,
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- =============================================
-- HELPER FUNCTIONS (SECURITY DEFINER)
-- =============================================

-- Check if user is a member of a group
CREATE OR REPLACE FUNCTION public.is_group_member(gid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_memberships
    WHERE group_id = gid AND user_id = auth.uid()
  )
$$;

-- Check if user is an admin of a group
CREATE OR REPLACE FUNCTION public.is_group_admin(gid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_memberships
    WHERE group_id = gid AND user_id = auth.uid() AND role = 'admin'
  )
$$;

-- =============================================
-- VIEWS
-- =============================================

-- Safe profile view for group members
CREATE VIEW public.member_profiles
WITH (security_invoker = on)
AS
SELECT 
  id,
  username,
  full_name,
  avatar_url,
  avatar_config
FROM public.profiles;

-- =============================================
-- RLS POLICIES
-- =============================================

-- PROFILES
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can view fellow group members profiles" ON public.profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.group_memberships m1
    JOIN public.group_memberships m2 ON m1.group_id = m2.group_id
    WHERE m1.user_id = auth.uid() AND m2.user_id = profiles.id
  )
);

CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (id = auth.uid());

-- SUBJECTS
CREATE POLICY "Users can view own subjects" ON public.subjects
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own subjects" ON public.subjects
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own subjects" ON public.subjects
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own subjects" ON public.subjects
FOR DELETE USING (user_id = auth.uid());

-- TOPICS
CREATE POLICY "Users can view own topics" ON public.topics
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own topics" ON public.topics
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own topics" ON public.topics
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own topics" ON public.topics
FOR DELETE USING (user_id = auth.uid());

-- STUDY SESSIONS
CREATE POLICY "Users can view own sessions" ON public.study_sessions
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own sessions" ON public.study_sessions
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own sessions" ON public.study_sessions
FOR DELETE USING (user_id = auth.uid());

-- STREAKS
CREATE POLICY "Users can view own streak" ON public.streaks
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own streak" ON public.streaks
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own streak" ON public.streaks
FOR UPDATE USING (user_id = auth.uid());

-- GROUPS
CREATE POLICY "Members can view their groups" ON public.groups
FOR SELECT USING (public.is_group_member(id));

CREATE POLICY "Authenticated users can create groups" ON public.groups
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "Admins can update groups" ON public.groups
FOR UPDATE USING (public.is_group_admin(id));

CREATE POLICY "Admins can delete groups" ON public.groups
FOR DELETE USING (public.is_group_admin(id));

-- GROUP MEMBERSHIPS
CREATE POLICY "Members can view memberships" ON public.group_memberships
FOR SELECT USING (public.is_group_member(group_id));

CREATE POLICY "Admins can manage memberships" ON public.group_memberships
FOR INSERT WITH CHECK (public.is_group_admin(group_id) OR user_id = auth.uid());

CREATE POLICY "Admins can update memberships" ON public.group_memberships
FOR UPDATE USING (public.is_group_admin(group_id));

CREATE POLICY "Admins or self can delete memberships" ON public.group_memberships
FOR DELETE USING (public.is_group_admin(group_id) OR user_id = auth.uid());

-- GROUP MESSAGES
CREATE POLICY "Members can view messages" ON public.group_messages
FOR SELECT USING (public.is_group_member(group_id));

CREATE POLICY "Members can insert messages" ON public.group_messages
FOR INSERT WITH CHECK (public.is_group_member(group_id) AND user_id = auth.uid());

CREATE POLICY "Owners can delete messages" ON public.group_messages
FOR DELETE USING (user_id = auth.uid() OR public.is_group_admin(group_id));

-- STUDY MATERIALS
CREATE POLICY "Users can view own materials" ON public.study_materials
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view group materials" ON public.study_materials
FOR SELECT USING (group_id IS NOT NULL AND public.is_group_member(group_id));

CREATE POLICY "Users can insert materials" ON public.study_materials
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own materials" ON public.study_materials
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own materials" ON public.study_materials
FOR DELETE USING (user_id = auth.uid());

-- BADGES (public read)
CREATE POLICY "Anyone can view badges" ON public.badges
FOR SELECT USING (true);

-- USER BADGES
CREATE POLICY "Users can view own badges" ON public.user_badges
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view others badges" ON public.user_badges
FOR SELECT USING (true);

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subjects_updated_at
BEFORE UPDATE ON public.subjects
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_topics_updated_at
BEFORE UPDATE ON public.topics
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_groups_updated_at
BEFORE UPDATE ON public.groups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_streaks_updated_at
BEFORE UPDATE ON public.streaks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create admin membership when group is created
CREATE OR REPLACE FUNCTION public.handle_new_group()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.group_memberships (group_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_group_created
AFTER INSERT ON public.groups
FOR EACH ROW EXECUTE FUNCTION public.handle_new_group();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  
  -- Initialize streak for new user
  INSERT INTO public.streaks (user_id, current_streak, longest_streak)
  VALUES (NEW.id, 0, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- SEED DEFAULT BADGES
-- =============================================
INSERT INTO public.badges (id, name, description, icon, requirement, category) VALUES
('first-session', 'First Steps', 'Complete your first study session', '📚', '1 session', 'learning'),
('streak-3', 'Getting Started', 'Maintain a 3-day streak', '🔥', '3 days', 'streak'),
('streak-7', 'Week Warrior', 'Maintain a 7-day streak', '🏆', '7 days', 'streak'),
('streak-30', 'Monthly Master', 'Maintain a 30-day streak', '👑', '30 days', 'streak'),
('topics-10', 'Knowledge Seeker', 'Complete 10 topics', '🎯', '10 topics', 'learning'),
('topics-50', 'Topic Titan', 'Complete 50 topics', '💪', '50 topics', 'learning'),
('subjects-5', 'Multi-Disciplined', 'Create 5 different subjects', '📖', '5 subjects', 'learning'),
('group-creator', 'Community Builder', 'Create your first study group', '👥', '1 group', 'social'),
('group-joiner', 'Team Player', 'Join a study group', '🤝', '1 join', 'social'),
('material-sharer', 'Resource Hero', 'Share 5 study materials', '📤', '5 materials', 'social'),
('consistency-7', 'Consistent Learner', 'Study at least once every day for a week', '⭐', '7 days consistent', 'consistency'),
('early-bird', 'Early Bird', 'Log a study session before 8 AM', '🌅', 'Before 8 AM', 'consistency');