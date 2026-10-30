-- ====================================================================
-- WorkNest Database Schema & Security Definition for Supabase (Final)
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. CUSTOM ENUM TYPES
-- --------------------------------------------------------------------
CREATE TYPE user_team_role AS ENUM ('group_leader', 'subgroup_leader', 'member');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'review', 'completed');
CREATE TYPE log_status AS ENUM ('submitted', 'pending');
CREATE TYPE meeting_type AS ENUM ('Video Conference', 'Subgroup Sync', 'Project Standup', 'Review');
CREATE TYPE participant_status AS ENUM ('invited', 'accepted', 'declined', 'tentative');
CREATE TYPE ai_sender AS ENUM ('user', 'ai');

-- --------------------------------------------------------------------
-- 2. TABLES DEFINITIONS
-- --------------------------------------------------------------------

-- Profiles Table (Synced with auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  avatar_url TEXT DEFAULT '',
  department TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Teams Table
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  project_progress INTEGER NOT NULL DEFAULT 0 CHECK (project_progress >= 0 AND project_progress <= 100),
  deadline DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subgroups Table
CREATE TABLE public.subgroups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  leader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unq_subgroups_id_team_id UNIQUE (id, team_id)
);

-- Team Members Table (Per-team membership and roles)
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role user_team_role NOT NULL DEFAULT 'member',
  subgroup_id UUID REFERENCES public.subgroups(id) ON DELETE SET NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, user_id),
  CONSTRAINT fk_team_members_subgroup FOREIGN KEY (subgroup_id, team_id) REFERENCES public.subgroups(id, team_id) ON DELETE SET NULL
);

-- Unique Partial Index: Only 1 subgroup leader per subgroup
CREATE UNIQUE INDEX unq_one_subgroup_leader_per_subgroup 
  ON public.team_members (subgroup_id) 
  WHERE role = 'subgroup_leader' AND subgroup_id IS NOT NULL;

-- Tasks Table (Supports Personal & Team Tasks with Subgroup Consistency)
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  subgroup_id UUID REFERENCES public.subgroups(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  priority task_priority NOT NULL DEFAULT 'medium',
  status task_status NOT NULL DEFAULT 'todo',
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  due_date DATE,
  category TEXT DEFAULT 'General',
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_personal BOOLEAN GENERATED ALWAYS AS (team_id IS NULL) STORED,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_task_subgroup_requires_team CHECK (subgroup_id IS NULL OR team_id IS NOT NULL),
  CONSTRAINT fk_tasks_subgroup FOREIGN KEY (subgroup_id, team_id) REFERENCES public.subgroups(id, team_id) ON DELETE SET NULL
);

-- Daily Logs Table
CREATE TABLE public.daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  subgroup_id UUID REFERENCES public.subgroups(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  hours_worked NUMERIC(4,2) NOT NULL DEFAULT 0 CHECK (hours_worked >= 0 AND hours_worked <= 24),
  work_completed TEXT DEFAULT '',
  challenges_faced TEXT DEFAULT '',
  plan_for_tomorrow TEXT DEFAULT '',
  status log_status NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_daily_logs_subgroup FOREIGN KEY (subgroup_id, team_id) REFERENCES public.subgroups(id, team_id) ON DELETE SET NULL
);

-- Chat Channels Table
CREATE TABLE public.chat_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  subgroup_id UUID REFERENCES public.subgroups(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  is_subgroup BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_chat_channels_subgroup FOREIGN KEY (subgroup_id, team_id) REFERENCES public.subgroups(id, team_id) ON DELETE SET NULL
);

-- Messages Table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  text TEXT NOT NULL DEFAULT '',
  attachments JSONB DEFAULT '[]'::jsonb,
  reactions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Meetings Table
CREATE TABLE public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  organizer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  meeting_date DATE NOT NULL,
  meeting_time TIME NOT NULL,
  duration INTEGER NOT NULL DEFAULT 30 CHECK (duration > 0), -- duration in minutes
  type meeting_type NOT NULL DEFAULT 'Project Standup',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Meeting Participants Relational Table
CREATE TABLE public.meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status participant_status NOT NULL DEFAULT 'accepted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(meeting_id, user_id)
);

-- Files Table
CREATE TABLE public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  size TEXT NOT NULL,
  url TEXT DEFAULT '',
  storage_path TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications Table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  category TEXT DEFAULT 'system',
  link_view TEXT DEFAULT 'notifications',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI History Table
CREATE TABLE public.ai_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender ai_sender NOT NULL,
  text TEXT NOT NULL,
  insights JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 3. INDEXES FOR HIGH-PERFORMANCE QUERIES
-- --------------------------------------------------------------------
CREATE INDEX idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX idx_team_members_subgroup_id ON public.team_members(subgroup_id);
CREATE INDEX idx_tasks_team_id ON public.tasks(team_id);
CREATE INDEX idx_tasks_subgroup_id ON public.tasks(subgroup_id);
CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX idx_daily_logs_user_id ON public.daily_logs(user_id);
CREATE INDEX idx_daily_logs_team_id ON public.daily_logs(team_id);
CREATE INDEX idx_messages_channel_id ON public.messages(channel_id);
CREATE INDEX idx_chat_channels_team_id ON public.chat_channels(team_id);
CREATE INDEX idx_chat_channels_subgroup_id ON public.chat_channels(subgroup_id);
CREATE UNIQUE INDEX IF NOT EXISTS unq_chat_channels_team_main_name ON public.chat_channels (team_id, lower(name)) WHERE subgroup_id IS NULL;
CREATE INDEX idx_meeting_participants_meeting_id ON public.meeting_participants(meeting_id);
CREATE INDEX idx_files_team_id ON public.files(team_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);

-- --------------------------------------------------------------------
-- 4. RLS HELPER FUNCTIONS
-- --------------------------------------------------------------------

-- Check team membership
CREATE OR REPLACE FUNCTION public.is_team_member(check_team_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = check_team_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Check Group Leader role across entire team
CREATE OR REPLACE FUNCTION public.is_group_leader(check_team_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = check_team_id AND user_id = auth.uid() AND role = 'group_leader'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Check Sub-Group Leader role restricted to assigned subgroup
CREATE OR REPLACE FUNCTION public.is_subgroup_leader(check_subgroup_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members
    WHERE subgroup_id = check_subgroup_id AND user_id = auth.uid() AND role = 'subgroup_leader'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Check Subgroup membership
CREATE OR REPLACE FUNCTION public.is_subgroup_member(check_subgroup_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members
    WHERE subgroup_id = check_subgroup_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Check Meeting Participant membership (breaks RLS circular recursion)
CREATE OR REPLACE FUNCTION public.is_meeting_participant(check_meeting_id UUID, check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.meeting_participants
    WHERE meeting_id = check_meeting_id AND user_id = check_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Check Meeting View permission (breaks RLS circular recursion)
CREATE OR REPLACE FUNCTION public.can_view_meeting(check_meeting_id UUID, check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.meetings
    WHERE id = check_meeting_id AND (
      organizer_id = check_user_id OR
      (team_id IS NOT NULL AND public.is_team_member(team_id))
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Check Meeting Management permission (breaks RLS circular recursion)
CREATE OR REPLACE FUNCTION public.can_manage_meeting_participants(check_meeting_id UUID, check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.meetings
    WHERE id = check_meeting_id AND (
      organizer_id = check_user_id OR
      (team_id IS NOT NULL AND public.is_group_leader(team_id))
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- --------------------------------------------------------------------
-- 5. ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- --------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subgroups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_history ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY POLICIES
-- --------------------------------------------------------------------

-- === PROFILES POLICIES (Privacy Restricted to Self or Teammates) ===
CREATE POLICY "Profiles viewable by team members or self"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.team_members tm1
      JOIN public.team_members tm2 ON tm1.team_id = tm2.team_id
      WHERE tm1.user_id = auth.uid() AND tm2.user_id = profiles.id
    )
  );

CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE TO authenticated 
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- === TEAMS POLICIES ===
CREATE POLICY "Team members or creators can view teams"
  ON public.teams FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR public.is_team_member(id));

CREATE POLICY "Authenticated users can create teams"
  ON public.teams FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Only Group Leaders can update teams"
  ON public.teams FOR UPDATE TO authenticated
  USING (public.is_group_leader(id));

CREATE POLICY "Only Group Leaders can delete teams"
  ON public.teams FOR DELETE TO authenticated
  USING (public.is_group_leader(id));

-- === SUBGROUPS POLICIES ===
CREATE POLICY "Team members can view subgroups"
  ON public.subgroups FOR SELECT TO authenticated
  USING (public.is_team_member(team_id));

CREATE POLICY "Group Leaders can create subgroups"
  ON public.subgroups FOR INSERT TO authenticated
  WITH CHECK (public.is_group_leader(team_id));

CREATE POLICY "Group Leaders or Subgroup Leaders can update subgroup"
  ON public.subgroups FOR UPDATE TO authenticated
  USING (public.is_group_leader(team_id) OR public.is_subgroup_leader(id));

CREATE POLICY "Only Group Leaders can delete subgroups"
  ON public.subgroups FOR DELETE TO authenticated
  USING (public.is_group_leader(team_id));

-- === TEAM MEMBERS POLICIES ===
CREATE POLICY "Team members can view member lists"
  ON public.team_members FOR SELECT TO authenticated
  USING (public.is_team_member(team_id) OR user_id = auth.uid());

CREATE POLICY "Only Group Leaders can insert team members"
  ON public.team_members FOR INSERT TO authenticated
  WITH CHECK (public.is_group_leader(team_id));

CREATE POLICY "Group Leaders can update member roles"
  ON public.team_members FOR UPDATE TO authenticated
  USING (public.is_group_leader(team_id));

CREATE POLICY "Group Leaders or member self can delete membership"
  ON public.team_members FOR DELETE TO authenticated
  USING (public.is_group_leader(team_id) OR user_id = auth.uid());

-- === TASKS POLICIES (Personal & Team Tasks) ===
CREATE POLICY "View personal tasks or team/subgroup tasks"
  ON public.tasks FOR SELECT TO authenticated
  USING (
    (team_id IS NULL AND created_by = auth.uid()) OR
    (team_id IS NOT NULL AND public.is_team_member(team_id) AND (
      subgroup_id IS NULL OR
      public.is_group_leader(team_id) OR
      public.is_subgroup_member(subgroup_id) OR
      assigned_to = auth.uid() OR
      created_by = auth.uid()
    ))
  );

CREATE POLICY "Insert personal tasks or team tasks"
  ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (
    (team_id IS NULL AND created_by = auth.uid()) OR
    (team_id IS NOT NULL AND public.is_team_member(team_id))
  );

CREATE POLICY "Update personal tasks or team tasks with permissions"
  ON public.tasks FOR UPDATE TO authenticated
  USING (
    (team_id IS NULL AND created_by = auth.uid()) OR
    (team_id IS NOT NULL AND public.is_team_member(team_id) AND (
      public.is_group_leader(team_id) OR
      (subgroup_id IS NOT NULL AND public.is_subgroup_leader(subgroup_id)) OR
      created_by = auth.uid() OR
      assigned_to = auth.uid()
    ))
  );

CREATE POLICY "Delete personal tasks or team tasks with permissions"
  ON public.tasks FOR DELETE TO authenticated
  USING (
    (team_id IS NULL AND created_by = auth.uid()) OR
    (team_id IS NOT NULL AND (
      public.is_group_leader(team_id) OR
      (subgroup_id IS NOT NULL AND public.is_subgroup_leader(subgroup_id)) OR
      created_by = auth.uid()
    ))
  );

-- === DAILY LOGS POLICIES ===
CREATE POLICY "View own logs or leaders view team/subgroup logs"
  ON public.daily_logs FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    (team_id IS NOT NULL AND public.is_group_leader(team_id)) OR
    (subgroup_id IS NOT NULL AND public.is_subgroup_leader(subgroup_id))
  );

CREATE POLICY "Users insert daily log for assigned team/subgroup"
  ON public.daily_logs FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    (team_id IS NULL OR public.is_team_member(team_id)) AND
    (subgroup_id IS NULL OR public.is_subgroup_member(subgroup_id))
  );

CREATE POLICY "Users update own daily logs"
  ON public.daily_logs FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid() AND
    (team_id IS NULL OR public.is_team_member(team_id)) AND
    (subgroup_id IS NULL OR public.is_subgroup_member(subgroup_id))
  );

CREATE POLICY "Users delete own daily logs"
  ON public.daily_logs FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- === CHAT CHANNELS POLICIES ===
CREATE POLICY "Team members view channels based on scope"
  ON public.chat_channels FOR SELECT TO authenticated
  USING (
    public.is_team_member(team_id) AND
    (subgroup_id IS NULL OR public.is_group_leader(team_id) OR public.is_subgroup_member(subgroup_id))
  );

CREATE POLICY "Group Leaders or Subgroup Leaders create channels"
  ON public.chat_channels FOR INSERT TO authenticated
  WITH CHECK (
    public.is_group_leader(team_id) OR
    (subgroup_id IS NOT NULL AND public.is_subgroup_leader(subgroup_id))
  );

CREATE POLICY "Group Leaders or Subgroup Leaders update/delete channels"
  ON public.chat_channels FOR ALL TO authenticated
  USING (
    public.is_group_leader(team_id) OR
    (subgroup_id IS NOT NULL AND public.is_subgroup_leader(subgroup_id))
  );

-- === MESSAGES POLICIES ===
CREATE POLICY "Channel members view messages"
  ON public.messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_channels c
      WHERE c.id = messages.channel_id
      AND public.is_team_member(c.team_id)
      AND (c.subgroup_id IS NULL OR public.is_group_leader(c.team_id) OR public.is_subgroup_member(c.subgroup_id))
    )
  );

CREATE POLICY "Channel members insert messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.chat_channels c
      WHERE c.id = messages.channel_id
      AND public.is_team_member(c.team_id)
      AND (c.subgroup_id IS NULL OR public.is_group_leader(c.team_id) OR public.is_subgroup_member(c.subgroup_id))
    )
  );

CREATE POLICY "Sender or Group Leader can delete messages"
  ON public.messages FOR DELETE TO authenticated
  USING (
    sender_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.chat_channels c
      WHERE c.id = messages.channel_id AND public.is_group_leader(c.team_id)
    )
  );

CREATE POLICY "Users can update own messages"
  ON public.messages FOR UPDATE TO authenticated
  USING (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.chat_channels c
      WHERE c.id = messages.channel_id
      AND public.is_team_member(c.team_id)
      AND (c.subgroup_id IS NULL OR public.is_group_leader(c.team_id) OR public.is_subgroup_member(c.subgroup_id))
    )
  )
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.chat_channels c
      WHERE c.id = messages.channel_id
      AND public.is_team_member(c.team_id)
      AND (c.subgroup_id IS NULL OR public.is_group_leader(c.team_id) OR public.is_subgroup_member(c.subgroup_id))
    )
  );

-- === MEETINGS POLICIES ===
CREATE POLICY "Team members or participants view meetings"
  ON public.meetings FOR SELECT TO authenticated
  USING (
    organizer_id = auth.uid() OR
    (team_id IS NOT NULL AND public.is_team_member(team_id)) OR
    public.is_meeting_participant(id, auth.uid())
  );

CREATE POLICY "Authenticated users can create meetings"
  ON public.meetings FOR INSERT TO authenticated
  WITH CHECK (organizer_id = auth.uid());

CREATE POLICY "Organizer or Group Leader update meetings"
  ON public.meetings FOR UPDATE TO authenticated
  USING (
    organizer_id = auth.uid() OR
    (team_id IS NOT NULL AND public.is_group_leader(team_id))
  )
  WITH CHECK (
    organizer_id = auth.uid() AND
    (team_id IS NULL OR public.is_team_member(team_id))
  );

CREATE POLICY "Organizer or Group Leader delete meetings"
  ON public.meetings FOR DELETE TO authenticated
  USING (organizer_id = auth.uid() OR (team_id IS NOT NULL AND public.is_group_leader(team_id)));

-- === MEETING PARTICIPANTS POLICIES ===
CREATE POLICY "View meeting participants"
  ON public.meeting_participants FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    public.can_view_meeting(meeting_id, auth.uid())
  );

CREATE POLICY "Organizer or Group Leader insert participants"
  ON public.meeting_participants FOR INSERT TO authenticated
  WITH CHECK (
    public.can_manage_meeting_participants(meeting_id, auth.uid())
  );

CREATE POLICY "Participant self or Organizer update status"
  ON public.meeting_participants FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.meetings m
      WHERE m.id = meeting_participants.meeting_id AND m.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Organizer or Group Leader remove participants"
  ON public.meeting_participants FOR DELETE TO authenticated
  USING (
    public.can_manage_meeting_participants(meeting_id, auth.uid())
  );

-- === FILES POLICIES ===
CREATE POLICY "View team files or own uploaded files"
  ON public.files FOR SELECT TO authenticated
  USING (
    uploaded_by = auth.uid() OR
    (team_id IS NOT NULL AND public.is_team_member(team_id))
  );

CREATE POLICY "Upload team or personal files"
  ON public.files FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid() AND
    (team_id IS NULL OR public.is_team_member(team_id))
  );

CREATE POLICY "Uploader or Group Leader update files"
  ON public.files FOR UPDATE TO authenticated
  USING (
    uploaded_by = auth.uid() OR
    (team_id IS NOT NULL AND public.is_group_leader(team_id))
  )
  WITH CHECK (
    uploaded_by = auth.uid() AND
    (team_id IS NULL OR public.is_team_member(team_id))
  );

CREATE POLICY "Uploader or Group Leader delete files"
  ON public.files FOR DELETE TO authenticated
  USING (
    uploaded_by = auth.uid() OR
    (team_id IS NOT NULL AND public.is_group_leader(team_id))
  );

-- === NOTIFICATIONS & AI HISTORY POLICIES ===
CREATE POLICY "Users access own notifications"
  ON public.notifications FOR ALL TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users access own AI history"
  ON public.ai_history FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- --------------------------------------------------------------------
-- 7. TRIGGERS AND AUTOMATION
-- --------------------------------------------------------------------

-- Auto-create profile entry upon Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, department)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(NEW.raw_user_meta_data->>'department', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-add team creator as Group Leader in team_members table and seed default #general channel
CREATE OR REPLACE FUNCTION public.handle_new_team()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO public.team_members (team_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'group_leader')
    ON CONFLICT (team_id, user_id) DO NOTHING;
  END IF;

  -- Auto-create default #general channel for the new team
  INSERT INTO public.chat_channels (team_id, name, description, is_subgroup)
  VALUES (NEW.id, 'general', 'General team discussion', FALSE)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER on_team_created
  AFTER INSERT ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_team();

-- Sync subgroup leader_id automatically across INSERT, UPDATE, and DELETE
CREATE OR REPLACE FUNCTION public.sync_subgroup_leader()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE' OR TG_OP = 'UPDATE') THEN
    IF OLD.role = 'subgroup_leader' AND OLD.subgroup_id IS NOT NULL THEN
      UPDATE public.subgroups
      SET leader_id = NULL
      WHERE id = OLD.subgroup_id AND leader_id = OLD.user_id;
    END IF;
  END IF;

  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    IF NEW.role = 'subgroup_leader' AND NEW.subgroup_id IS NOT NULL THEN
      UPDATE public.subgroups
      SET leader_id = NEW.user_id
      WHERE id = NEW.subgroup_id;
    END IF;
  END IF;

  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_sync_subgroup_leader
  AFTER INSERT OR UPDATE OR DELETE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.sync_subgroup_leader();

-- Validate task assignee belongs to team
CREATE OR REPLACE FUNCTION public.check_task_assignment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assigned_to IS NOT NULL AND NEW.team_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = NEW.team_id AND user_id = NEW.assigned_to
    ) THEN
      RAISE EXCEPTION 'Assigned user % is not a member of team %', NEW.assigned_to, NEW.team_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_check_task_assignment
  BEFORE INSERT OR UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.check_task_assignment();

-- Automatic updated_at timestamps
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER update_teams_modtime BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER update_subgroups_modtime BEFORE UPDATE ON public.subgroups FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER update_tasks_modtime BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER update_daily_logs_modtime BEFORE UPDATE ON public.daily_logs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER update_meetings_modtime BEFORE UPDATE ON public.meetings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER update_messages_modtime BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- --------------------------------------------------------------------
-- 8. SECURE CHAT RPC FUNCTIONS
-- --------------------------------------------------------------------

-- Secure function to toggle a message reaction without allowing arbitrary message editing
CREATE OR REPLACE FUNCTION public.toggle_message_reaction(
  p_message_id UUID,
  p_emoji TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_channel_id UUID;
  v_team_id UUID;
  v_subgroup_id UUID;
  v_current_reactions JSONB;
  v_updated_reactions JSONB := '[]'::jsonb;
  v_item JSONB;
  v_found BOOLEAN := FALSE;
  v_users JSONB;
  v_count INT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get message and channel scope
  SELECT m.channel_id, m.reactions, c.team_id, c.subgroup_id
  INTO v_channel_id, v_current_reactions, v_team_id, v_subgroup_id
  FROM public.messages m
  JOIN public.chat_channels c ON c.id = m.channel_id
  WHERE m.id = p_message_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Message not found';
  END IF;

  -- Verify user is a member of the team and has access to channel
  IF NOT public.is_team_member(v_team_id) THEN
    RAISE EXCEPTION 'Access denied: not a team member';
  END IF;

  IF v_subgroup_id IS NOT NULL AND NOT (public.is_group_leader(v_team_id) OR public.is_subgroup_member(v_subgroup_id)) THEN
    RAISE EXCEPTION 'Access denied: not a member of this subgroup';
  END IF;

  IF v_current_reactions IS NULL THEN
    v_current_reactions := '[]'::jsonb;
  END IF;

  -- Process reactions array
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_current_reactions)
  LOOP
    IF (v_item->>'emoji') = p_emoji THEN
      v_found := TRUE;
      v_users := COALESCE(v_item->'users', '[]'::jsonb);

      -- Check if user already reacted
      IF v_users ? (v_user_id::text) THEN
        -- Remove user
        SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
        INTO v_users
        FROM jsonb_array_elements(v_users) elem
        WHERE elem #>> '{}' != (v_user_id::text);
      ELSE
        -- Add user
        v_users := v_users || to_jsonb(v_user_id::text);
      END IF;

      v_count := jsonb_array_length(v_users);
      IF v_count > 0 THEN
        v_updated_reactions := v_updated_reactions || jsonb_build_object(
          'emoji', p_emoji,
          'count', v_count,
          'users', v_users
        );
      END IF;
    ELSE
      v_updated_reactions := v_updated_reactions || v_item;
    END IF;
  END LOOP;

  -- If emoji was not found in existing reactions, add it
  IF NOT v_found THEN
    v_updated_reactions := v_updated_reactions || jsonb_build_object(
      'emoji', p_emoji,
      'count', 1,
      'users', jsonb_build_array(v_user_id::text)
    );
  END IF;

  -- Update message record with new reactions JSONB
  UPDATE public.messages
  SET reactions = v_updated_reactions,
      updated_at = NOW()
  WHERE id = p_message_id;

  RETURN v_updated_reactions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- --------------------------------------------------------------------
-- 9. REALTIME CONFIGURATION
-- --------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;

ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- --------------------------------------------------------------------
-- 10. CHAT ATTACHMENTS STORAGE BUCKET & POLICIES
-- --------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', false)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload chat attachments' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Authenticated users can upload chat attachments"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'chat-attachments');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can view chat attachments' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Authenticated users can view chat attachments"
      ON storage.objects FOR SELECT TO authenticated
      USING (bucket_id = 'chat-attachments');
  END IF;
END $$;

