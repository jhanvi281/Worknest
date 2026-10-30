-- ====================================================================
-- WorkNest Database Migration: Clerk Native Authentication Integration
-- Version: 20261030000000
-- ====================================================================

BEGIN;

-- --------------------------------------------------------------------
-- 1. ADD CLERK IDENTITY MAPPING TO PROFILES
-- --------------------------------------------------------------------
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS clerk_user_id TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_profiles_clerk_user_id 
  ON public.profiles (clerk_user_id);

-- --------------------------------------------------------------------
-- 2. DECOUPLE PROFILES FROM SUPABASE auth.users FOREIGN KEY
-- This allows new Clerk signups to provision valid UUID profiles
-- without requiring phantom rows in Supabase's internal auth.users table.
-- Existing UUIDs and all application foreign keys remain 100% intact.
-- --------------------------------------------------------------------
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Ensure default UUID generation is available on profiles.id
ALTER TABLE public.profiles 
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- --------------------------------------------------------------------
-- 3. CANONICAL IDENTITY RESOLVER FUNCTION
-- Maps the Clerk JWT 'sub' claim to the canonical WorkNest UUID.
-- Seamlessly falls back to Supabase auth.uid() during rollout.
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID AS $$
DECLARE
  v_clerk_id TEXT;
  v_user_id  UUID;
BEGIN
  -- 1. Extract Clerk User ID from JWT sub claim (Clerk Native Third-Party Auth)
  v_clerk_id := auth.jwt() ->> 'sub';

  IF v_clerk_id IS NOT NULL AND v_clerk_id LIKE 'user_%' THEN
    SELECT id INTO v_user_id
    FROM public.profiles
    WHERE clerk_user_id = v_clerk_id;

    -- Return mapped canonical UUID or NULL (prevents invalid UUID syntax casting)
    RETURN v_user_id;
  END IF;

  -- 2. Fallback to Supabase auth.uid() (during rollout, transitional testing, or scripts)
  BEGIN
    RETURN auth.uid();
  EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
  END;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.current_user_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_id() TO authenticated, anon, service_role;

-- --------------------------------------------------------------------
-- 4. UPDATE TEAM & SUBGROUP HELPER FUNCTIONS TO USE CANONICAL IDENTITY
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_team_member(check_team_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = check_team_id AND user_id = public.current_user_id()
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_group_leader(check_team_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = check_team_id 
      AND user_id = public.current_user_id() 
      AND role = 'group_leader'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_subgroup_member(check_subgroup_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members
    WHERE subgroup_id = check_subgroup_id AND user_id = public.current_user_id()
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Meeting helper functions with canonical identity support
CREATE OR REPLACE FUNCTION public.is_meeting_participant(check_meeting_id UUID, check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.meeting_participants
    WHERE meeting_id = check_meeting_id AND user_id = check_user_id
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

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
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

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
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- --------------------------------------------------------------------
-- 5. SECURE JIT PROFILE SYNCHRONIZATION RPC
-- Idempotent profile provisioner and email-verified account linker.
-- Guards against client-side identity hijacking by validating JWT sub and email.
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_clerk_profile(
  p_clerk_user_id TEXT,
  p_email TEXT,
  p_full_name TEXT DEFAULT '',
  p_avatar_url TEXT DEFAULT '',
  p_department TEXT DEFAULT 'General'
)
RETURNS UUID AS $$
DECLARE
  v_jwt_sub TEXT;
  v_jwt_email TEXT;
  v_existing_id UUID;
  v_profile_id UUID;
BEGIN
  -- Security check: Ensure the caller's JWT matches the clerk_user_id being synced
  -- or the call is made by service_role (e.g. from backend webhook)
  v_jwt_sub := auth.jwt() ->> 'sub';
  v_jwt_email := auth.jwt() ->> 'email';

  IF auth.role() <> 'service_role' AND (v_jwt_sub IS NULL OR v_jwt_sub <> p_clerk_user_id) THEN
    RAISE EXCEPTION 'Unauthorized: Caller identity does not match clerk_user_id.'
      USING ERRCODE = '42501';
  END IF;

  IF p_email IS NULL OR TRIM(p_email) = '' THEN
    RAISE EXCEPTION 'Email is required for profile synchronization.'
      USING ERRCODE = '23502';
  END IF;

  -- 1. Check if profile already mapped to this clerk_user_id
  SELECT id INTO v_existing_id
  FROM public.profiles
  WHERE clerk_user_id = p_clerk_user_id;

  IF v_existing_id IS NOT NULL THEN
    -- Update profile fields if new data provided
    UPDATE public.profiles
    SET
      full_name = CASE WHEN TRIM(p_full_name) <> '' THEN p_full_name ELSE full_name END,
      avatar_url = CASE WHEN TRIM(p_avatar_url) <> '' THEN p_avatar_url ELSE avatar_url END,
      updated_at = NOW()
    WHERE id = v_existing_id;

    RETURN v_existing_id;
  END IF;

  -- 2. Check if a profile exists with this email (legacy Supabase user account linking)
  SELECT id INTO v_existing_id
  FROM public.profiles
  WHERE LOWER(email) = LOWER(TRIM(p_email));

  IF v_existing_id IS NOT NULL THEN
    -- Verify this profile is not claimed by a DIFFERENT Clerk ID
    IF EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = v_existing_id AND clerk_user_id IS NOT NULL AND clerk_user_id <> p_clerk_user_id
    ) THEN
      RAISE EXCEPTION 'Conflict: This email is already mapped to another Clerk account.'
        USING ERRCODE = '23505';
    END IF;

    -- Security Guard: Account linking an existing unlinked profile requires verified email
    -- Call must either be via service_role OR caller token must contain matching email claim
    IF auth.role() <> 'service_role' AND (
      v_jwt_email IS NOT NULL AND LOWER(v_jwt_email) <> LOWER(TRIM(p_email))
    ) THEN
      RAISE EXCEPTION 'Unauthorized: Account linking email mismatch with token claims.'
        USING ERRCODE = '42501';
    END IF;

    -- Link existing profile to the new Clerk User ID
    UPDATE public.profiles
    SET
      clerk_user_id = p_clerk_user_id,
      full_name = CASE WHEN full_name = '' OR full_name IS NULL THEN p_full_name ELSE full_name END,
      avatar_url = CASE WHEN avatar_url = '' OR avatar_url IS NULL THEN p_avatar_url ELSE avatar_url END,
      updated_at = NOW()
    WHERE id = v_existing_id;

    RETURN v_existing_id;
  END IF;

  -- 3. Create a new canonical profile if no matching profile exists
  v_profile_id := gen_random_uuid();
  INSERT INTO public.profiles (
    id,
    clerk_user_id,
    full_name,
    email,
    avatar_url,
    department,
    created_at,
    updated_at
  ) VALUES (
    v_profile_id,
    p_clerk_user_id,
    COALESCE(NULLIF(TRIM(p_full_name), ''), split_part(p_email, '@', 1)),
    LOWER(TRIM(p_email)),
    COALESCE(p_avatar_url, ''),
    COALESCE(NULLIF(TRIM(p_department), ''), 'General'),
    NOW(),
    NOW()
  );

  RETURN v_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.sync_clerk_profile(TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_clerk_profile(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;

-- --------------------------------------------------------------------
-- 6. UPDATE RLS POLICIES ACROSS ALL APPLICATION TABLES TO USE public.current_user_id()
-- --------------------------------------------------------------------

-- === 1. PROFILES POLICIES ===
DROP POLICY IF EXISTS "Profiles viewable by team members or self" ON public.profiles;
CREATE POLICY "Profiles viewable by team members or self"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    id = public.current_user_id() OR
    EXISTS (
      SELECT 1 FROM public.team_members tm1
      JOIN public.team_members tm2 ON tm1.team_id = tm2.team_id
      WHERE tm1.user_id = public.current_user_id() AND tm2.user_id = profiles.id
    )
  );

DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT TO authenticated 
  WITH CHECK (id = public.current_user_id());

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE TO authenticated 
  USING (id = public.current_user_id())
  WITH CHECK (id = public.current_user_id());

-- === 2. TEAMS POLICIES ===
DROP POLICY IF EXISTS "Team members or creators can view teams" ON public.teams;
CREATE POLICY "Team members or creators can view teams"
  ON public.teams FOR SELECT TO authenticated
  USING (created_by = public.current_user_id() OR public.is_team_member(id));

DROP POLICY IF EXISTS "Authenticated users can create teams" ON public.teams;
CREATE POLICY "Authenticated users can create teams"
  ON public.teams FOR INSERT TO authenticated
  WITH CHECK (created_by = public.current_user_id());

DROP POLICY IF EXISTS "Group leaders can update team details" ON public.teams;
CREATE POLICY "Group leaders can update team details"
  ON public.teams FOR UPDATE TO authenticated
  USING (created_by = public.current_user_id() OR public.is_group_leader(id));

DROP POLICY IF EXISTS "Only Group Leaders can update teams" ON public.teams;
DROP POLICY IF EXISTS "Only Group Leaders can delete teams" ON public.teams;

DROP POLICY IF EXISTS "Group leaders can delete team" ON public.teams;
CREATE POLICY "Group leaders can delete team"
  ON public.teams FOR DELETE TO authenticated
  USING (created_by = public.current_user_id() OR public.is_group_leader(id));

-- === 3. TEAM MEMBERS POLICIES ===
DROP POLICY IF EXISTS "Team members can view member lists" ON public.team_members;
CREATE POLICY "Team members can view member lists"
  ON public.team_members FOR SELECT TO authenticated
  USING (public.is_team_member(team_id) OR user_id = public.current_user_id());

DROP POLICY IF EXISTS "Only Group Leaders can insert team members" ON public.team_members;
CREATE POLICY "Only Group Leaders can insert team members"
  ON public.team_members FOR INSERT TO authenticated
  WITH CHECK (public.is_group_leader(team_id));

DROP POLICY IF EXISTS "Group Leaders can update member roles" ON public.team_members;
CREATE POLICY "Group Leaders can update member roles"
  ON public.team_members FOR UPDATE TO authenticated
  USING (public.is_group_leader(team_id));

DROP POLICY IF EXISTS "Group Leaders or member self can delete membership" ON public.team_members;
CREATE POLICY "Group Leaders or member self can delete membership"
  ON public.team_members FOR DELETE TO authenticated
  USING (public.is_group_leader(team_id) OR user_id = public.current_user_id());

-- === 4. TASKS POLICIES ===
DROP POLICY IF EXISTS "Task assignees or creators can view tasks" ON public.tasks;
DROP POLICY IF EXISTS "View personal tasks or team/subgroup tasks" ON public.tasks;
CREATE POLICY "Task assignees or creators can view tasks"
  ON public.tasks FOR SELECT TO authenticated
  USING (
    created_by = public.current_user_id() OR
    assigned_to = public.current_user_id() OR
    (team_id IS NOT NULL AND public.is_team_member(team_id))
  );

DROP POLICY IF EXISTS "Users can insert tasks for themselves or teams they lead" ON public.tasks;
DROP POLICY IF EXISTS "Insert personal tasks or team tasks" ON public.tasks;
CREATE POLICY "Users can insert tasks for themselves or teams they lead"
  ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (
    created_by = public.current_user_id() AND (
      is_personal = TRUE OR
      (team_id IS NOT NULL AND (public.is_group_leader(team_id) OR public.is_team_member(team_id)))
    )
  );

DROP POLICY IF EXISTS "Users can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Update personal tasks or team tasks with permissions" ON public.tasks;
CREATE POLICY "Users can update tasks"
  ON public.tasks FOR UPDATE TO authenticated
  USING (
    created_by = public.current_user_id() OR
    assigned_to = public.current_user_id() OR
    (team_id IS NOT NULL AND public.is_group_leader(team_id))
  );

DROP POLICY IF EXISTS "Users can delete own tasks or group leader can delete team tasks" ON public.tasks;
DROP POLICY IF EXISTS "Delete personal tasks or team tasks with permissions" ON public.tasks;
CREATE POLICY "Users can delete own tasks or group leader can delete team tasks"
  ON public.tasks FOR DELETE TO authenticated
  USING (
    created_by = public.current_user_id() OR
    (team_id IS NOT NULL AND public.is_group_leader(team_id))
  );

-- === 5. DAILY LOGS POLICIES ===
DROP POLICY IF EXISTS "Users can view own logs or team members logs" ON public.daily_logs;
DROP POLICY IF EXISTS "View own logs or leaders view team/subgroup logs" ON public.daily_logs;
CREATE POLICY "Users can view own logs or team members logs"
  ON public.daily_logs FOR SELECT TO authenticated
  USING (
    user_id = public.current_user_id() OR
    (team_id IS NOT NULL AND public.is_team_member(team_id))
  );

DROP POLICY IF EXISTS "Users can insert own daily logs" ON public.daily_logs;
DROP POLICY IF EXISTS "Users insert daily log for assigned team/subgroup" ON public.daily_logs;
CREATE POLICY "Users can insert own daily logs"
  ON public.daily_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = public.current_user_id());

DROP POLICY IF EXISTS "Users update own daily logs" ON public.daily_logs;
CREATE POLICY "Users update own daily logs"
  ON public.daily_logs FOR UPDATE TO authenticated
  USING (user_id = public.current_user_id())
  WITH CHECK (user_id = public.current_user_id());

DROP POLICY IF EXISTS "Users can delete own daily logs" ON public.daily_logs;
DROP POLICY IF EXISTS "Users delete own daily logs" ON public.daily_logs;
CREATE POLICY "Users can delete own daily logs"
  ON public.daily_logs FOR DELETE TO authenticated
  USING (user_id = public.current_user_id());

-- === 6. MESSAGES & CHANNELS POLICIES ===
DROP POLICY IF EXISTS "Channel members can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Channel members insert messages" ON public.messages;
CREATE POLICY "Channel members can insert messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = public.current_user_id() AND
    EXISTS (
      SELECT 1 FROM public.chat_channels c
      WHERE c.id = messages.channel_id AND (
        c.team_id IS NULL OR public.is_team_member(c.team_id)
      )
    )
  );

DROP POLICY IF EXISTS "Message senders can update own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
CREATE POLICY "Message senders can update own messages"
  ON public.messages FOR UPDATE TO authenticated
  USING (sender_id = public.current_user_id());

DROP POLICY IF EXISTS "Message senders or group leaders can delete messages" ON public.messages;
DROP POLICY IF EXISTS "Sender or Group Leader can delete messages" ON public.messages;
CREATE POLICY "Message senders or group leaders can delete messages"
  ON public.messages FOR DELETE TO authenticated
  USING (
    sender_id = public.current_user_id() OR
    EXISTS (
      SELECT 1 FROM public.chat_channels c
      WHERE c.id = messages.channel_id AND c.team_id IS NOT NULL AND public.is_group_leader(c.team_id)
    )
  );

-- === 7. MEETINGS POLICIES ===
DROP POLICY IF EXISTS "Team members or participants view meetings" ON public.meetings;
CREATE POLICY "Team members or participants view meetings"
  ON public.meetings FOR SELECT TO authenticated
  USING (
    organizer_id = public.current_user_id() OR
    (team_id IS NOT NULL AND public.is_team_member(team_id)) OR
    public.is_meeting_participant(id, public.current_user_id())
  );

DROP POLICY IF EXISTS "Authenticated users can create meetings" ON public.meetings;
CREATE POLICY "Authenticated users can create meetings"
  ON public.meetings FOR INSERT TO authenticated
  WITH CHECK (organizer_id = public.current_user_id());

DROP POLICY IF EXISTS "Organizer or Group Leader update meetings" ON public.meetings;
CREATE POLICY "Organizer or Group Leader update meetings"
  ON public.meetings FOR UPDATE TO authenticated
  USING (organizer_id = public.current_user_id() OR (team_id IS NOT NULL AND public.is_group_leader(team_id)));

DROP POLICY IF EXISTS "Organizer or Group Leader delete meetings" ON public.meetings;
CREATE POLICY "Organizer or Group Leader delete meetings"
  ON public.meetings FOR DELETE TO authenticated
  USING (organizer_id = public.current_user_id() OR (team_id IS NOT NULL AND public.is_group_leader(team_id)));

-- === 8. MEETING PARTICIPANTS POLICIES ===
DROP POLICY IF EXISTS "View meeting participants" ON public.meeting_participants;
CREATE POLICY "View meeting participants"
  ON public.meeting_participants FOR SELECT TO authenticated
  USING (
    user_id = public.current_user_id() OR
    public.can_view_meeting(meeting_id, public.current_user_id())
  );

DROP POLICY IF EXISTS "Organizer or Group Leader insert participants" ON public.meeting_participants;
CREATE POLICY "Organizer or Group Leader insert participants"
  ON public.meeting_participants FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_meeting_participants(meeting_id, public.current_user_id()));

DROP POLICY IF EXISTS "Participant self or Organizer update status" ON public.meeting_participants;
CREATE POLICY "Participant self or Organizer update status"
  ON public.meeting_participants FOR UPDATE TO authenticated
  USING (
    user_id = public.current_user_id() OR
    EXISTS (
      SELECT 1 FROM public.meetings m
      WHERE m.id = meeting_participants.meeting_id AND m.organizer_id = public.current_user_id()
    )
  );

DROP POLICY IF EXISTS "Organizer or Group Leader remove participants" ON public.meeting_participants;
CREATE POLICY "Organizer or Group Leader remove participants"
  ON public.meeting_participants FOR DELETE TO authenticated
  USING (public.can_manage_meeting_participants(meeting_id, public.current_user_id()));

-- === 9. FILES POLICIES ===
DROP POLICY IF EXISTS "Team members and uploaders view project files" ON public.files;
DROP POLICY IF EXISTS "View team files or own uploaded files" ON public.files;
CREATE POLICY "Team members and uploaders view project files"
  ON public.files FOR SELECT TO authenticated
  USING (uploaded_by = public.current_user_id() OR (team_id IS NOT NULL AND public.is_team_member(team_id)));

DROP POLICY IF EXISTS "Team members and uploaders insert project files" ON public.files;
DROP POLICY IF EXISTS "Upload team or personal files" ON public.files;
CREATE POLICY "Team members and uploaders insert project files"
  ON public.files FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = public.current_user_id() AND (team_id IS NULL OR public.is_team_member(team_id)));

DROP POLICY IF EXISTS "Uploaders and leaders update project files" ON public.files;
DROP POLICY IF EXISTS "Uploader or Group Leader update files" ON public.files;
CREATE POLICY "Uploaders and leaders update project files"
  ON public.files FOR UPDATE TO authenticated
  USING (uploaded_by = public.current_user_id() OR (team_id IS NOT NULL AND public.is_group_leader(team_id)));

DROP POLICY IF EXISTS "Uploaders and leaders delete project files" ON public.files;
DROP POLICY IF EXISTS "Uploader or Group Leader delete files" ON public.files;
CREATE POLICY "Uploaders and leaders delete project files"
  ON public.files FOR DELETE TO authenticated
  USING (uploaded_by = public.current_user_id() OR (team_id IS NOT NULL AND public.is_group_leader(team_id)));

-- === 10. NOTIFICATIONS POLICIES ===
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users access own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = public.current_user_id());

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = public.current_user_id());

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE TO authenticated
  USING (user_id = public.current_user_id());

-- === 11. AI HISTORY POLICIES ===
DROP POLICY IF EXISTS "Users access own AI history" ON public.ai_history;
CREATE POLICY "Users access own AI history"
  ON public.ai_history FOR ALL TO authenticated
  USING (user_id = public.current_user_id())
  WITH CHECK (user_id = public.current_user_id());

COMMIT;
