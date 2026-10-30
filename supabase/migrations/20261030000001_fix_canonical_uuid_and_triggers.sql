-- ====================================================================
-- WorkNest Database Migration: Fix Canonical UUID Resolution in Triggers & Functions
-- Version: 20261030000001
--
-- Description:
-- Replaces all legacy auth.uid() references across public functions,
-- triggers, and RLS policies with public.current_user_id().
-- When Clerk Third-Party Auth is active, auth.jwt()->>'sub' contains
-- a Clerk ID (e.g. "user_3LO..."), causing auth.uid() (which casts sub to ::uuid)
-- to throw "invalid input syntax for type uuid".
-- public.current_user_id() safely resolves the canonical profile UUID
-- from public.profiles.clerk_user_id without casting errors.
-- ====================================================================

BEGIN;

-- --------------------------------------------------------------------
-- 1. HARDEN public.current_user_id() (NO DIRECT auth.uid() CAST)
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

    RETURN v_user_id;
  END IF;

  -- 2. Fallback for standard Supabase UUIDs (safe regex check, no casting error!)
  IF v_clerk_id IS NOT NULL AND v_clerk_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN v_clerk_id::UUID;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.current_user_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_id() TO authenticated, anon, service_role;

-- --------------------------------------------------------------------
-- 2. UPDATE NOTIFICATION TRIGGERS (ELIMINATES TEAM & TASK CREATION CRASHES)
-- --------------------------------------------------------------------

-- Team member notification trigger function
CREATE OR REPLACE FUNCTION public.handle_team_member_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_team_name TEXT;
  v_inviter_name TEXT;
  v_actor_id UUID;
  v_formatted_role TEXT;
BEGIN
  v_actor_id := public.current_user_id();

  -- Only notify if the added member is not the actor who added them
  IF v_actor_id IS NULL OR NEW.user_id != v_actor_id THEN
    SELECT name INTO v_team_name FROM public.teams WHERE id = NEW.team_id;
    
    IF v_actor_id IS NOT NULL THEN
      SELECT COALESCE(
        NULLIF(trim(full_name), ''),
        NULLIF(split_part(email, '@', 1), ''),
        'A team leader'
      )
      INTO v_inviter_name
      FROM public.profiles
      WHERE id = v_actor_id;
    END IF;
    v_inviter_name := COALESCE(v_inviter_name, 'A team leader');

    v_formatted_role := replace(COALESCE(NEW.role::text, 'member'), '_', ' ');

    INSERT INTO public.notifications (user_id, title, message, category, link_view)
    VALUES (
      NEW.user_id,
      'Added to Team',
      v_inviter_name || ' added you to "' || COALESCE(v_team_name, 'Team') || '" as ' || v_formatted_role || '.',
      'system',
      'teams'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Task notification trigger function
CREATE OR REPLACE FUNCTION public.handle_task_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_actor_name TEXT;
  v_actor_id UUID;
BEGIN
  v_actor_id := public.current_user_id();

  -- Get actor display name if authenticated
  IF v_actor_id IS NOT NULL THEN
    SELECT COALESCE(
      NULLIF(trim(full_name), ''),
      NULLIF(split_part(email, '@', 1), ''),
      'A team member'
    )
    INTO v_actor_name
    FROM public.profiles
    WHERE id = v_actor_id;
  END IF;
  v_actor_name := COALESCE(v_actor_name, 'A team member');

  -- Case A: Team Task Assigned OR Reassigned to a different user
  IF NEW.assigned_to IS NOT NULL AND NEW.team_id IS NOT NULL AND (
    TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (OLD.assigned_to IS DISTINCT FROM NEW.assigned_to))
  ) THEN
    IF v_actor_id IS NULL OR NEW.assigned_to != v_actor_id THEN
      INSERT INTO public.notifications (user_id, title, message, category, link_view)
      VALUES (
        NEW.assigned_to,
        'New Task Assigned',
        v_actor_name || ' assigned you to "' || COALESCE(NEW.title, 'a task') || '".',
        'task',
        'my_tasks'
      );
    END IF;
  END IF;

  -- Case B: Task Status Updated to Completed (Notify Creator)
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status::text = 'completed' THEN
    IF NEW.created_by IS NOT NULL AND (v_actor_id IS NULL OR NEW.created_by != v_actor_id) THEN
      INSERT INTO public.notifications (user_id, title, message, category, link_view)
      VALUES (
        NEW.created_by,
        'Task Completed',
        'Task "' || COALESCE(NEW.title, 'a task') || '" has been completed.',
        'task',
        'my_tasks'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- --------------------------------------------------------------------
-- 3. UPDATE HELPER FUNCTIONS TO USE CANONICAL IDENTITY
-- --------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_subgroup_leader(check_subgroup_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members
    WHERE subgroup_id = check_subgroup_id
      AND user_id = public.current_user_id()
      AND role = 'subgroup_leader'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_meeting_participant(check_meeting_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.meeting_participants
    WHERE meeting_id = check_meeting_id
      AND user_id = public.current_user_id()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.can_view_meeting_participants(check_meeting_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.meetings
    WHERE id = check_meeting_id AND (
      organizer_id = public.current_user_id() OR
      (team_id IS NOT NULL AND public.is_team_member(team_id))
    )
  ) OR EXISTS (
    SELECT 1 FROM public.meeting_participants
    WHERE meeting_id = check_meeting_id AND user_id = public.current_user_id()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.can_manage_meeting_participants(check_meeting_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.meetings
    WHERE id = check_meeting_id AND (
      organizer_id = public.current_user_id() OR
      (team_id IS NOT NULL AND public.is_group_leader(team_id))
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- --------------------------------------------------------------------
-- 4. UPDATE RPC FUNCTIONS TO USE CANONICAL IDENTITY
-- --------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.invite_team_member(
  p_team_id UUID,
  p_email TEXT,
  p_role user_team_role DEFAULT 'member'::user_team_role,
  p_subgroup_id UUID DEFAULT NULL::UUID
)
RETURNS JSONB AS $$
DECLARE
  v_caller_id UUID;
  v_target_user_id UUID;
  v_target_full_name TEXT;
  v_new_member_id UUID;
  v_cleaned_email TEXT;
BEGIN
  -- 1. Authentication Check
  v_caller_id := public.current_user_id();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Input Validation
  IF p_team_id IS NULL THEN
    RAISE EXCEPTION 'p_team_id is mandatory and cannot be null';
  END IF;

  v_cleaned_email := lower(trim(p_email));
  IF v_cleaned_email IS NULL OR v_cleaned_email = '' THEN
    RAISE EXCEPTION 'p_email cannot be empty';
  END IF;

  -- 3. Authorization Check
  IF NOT public.is_group_leader(p_team_id) THEN
    RAISE EXCEPTION 'Access denied: only Group Leaders can add members to this team';
  END IF;

  -- 4. Subgroup Ownership Validation
  IF p_subgroup_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.subgroups
      WHERE id = p_subgroup_id AND team_id = p_team_id
    ) THEN
      RAISE EXCEPTION 'The selected subgroup does not belong to this team';
    END IF;
  END IF;

  -- 5. Role & Subgroup Consistency Validation
  IF p_role = 'subgroup_leader' THEN
    IF p_subgroup_id IS NULL THEN
      RAISE EXCEPTION 'Sub-Group Leaders must be assigned to a specific subgroup';
    END IF;

    IF EXISTS (
      SELECT 1 FROM public.team_members
      WHERE subgroup_id = p_subgroup_id AND role = 'subgroup_leader'
    ) THEN
      RAISE EXCEPTION 'This subgroup already has a Sub-Group Leader. Subgroups can only have 1 leader.';
    END IF;
  END IF;

  -- 6. Profile Resolution
  SELECT p.id, p.full_name
  INTO v_target_user_id, v_target_full_name
  FROM public.profiles p
  WHERE lower(trim(p.email)) = v_cleaned_email
  LIMIT 1;

  IF v_target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email "%" is not registered on WorkNest. They must sign up first.', v_cleaned_email;
  END IF;

  -- 7. Pre-check Existing Membership
  IF EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = p_team_id AND user_id = v_target_user_id
  ) THEN
    RAISE EXCEPTION 'User is already a member of this team.';
  END IF;

  -- 8. Atomic Insertion
  BEGIN
    INSERT INTO public.team_members (
      team_id,
      user_id,
      role,
      subgroup_id,
      joined_at
    )
    VALUES (
      p_team_id,
      v_target_user_id,
      p_role,
      p_subgroup_id,
      NOW()
    )
    RETURNING id INTO v_new_member_id;
  EXCEPTION
    WHEN unique_violation THEN
      IF EXISTS (
        SELECT 1 FROM public.team_members
        WHERE team_id = p_team_id AND user_id = v_target_user_id
      ) THEN
        RAISE EXCEPTION 'User is already a member of this team.';
      ELSIF p_role = 'subgroup_leader' AND p_subgroup_id IS NOT NULL THEN
        RAISE EXCEPTION 'This subgroup already has a Sub-Group Leader. Subgroups can only have 1 leader.';
      ELSE
        RAISE EXCEPTION 'Membership conflict occurred during insertion.';
      END IF;
  END;

  RETURN jsonb_build_object(
    'success', TRUE,
    'member_id', v_new_member_id,
    'user_id', v_target_user_id,
    'full_name', v_target_full_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.toggle_message_reaction(
  p_message_id UUID,
  p_emoji TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_channel_id UUID;
  v_team_id UUID;
  v_subgroup_id UUID;
  v_current_reactions JSONB;
  v_updated_reactions JSONB := '[]'::jsonb;
  v_item JSONB;
  v_found BOOLEAN := FALSE;
  v_users JSONB;
  v_count INT;
  v_cleaned_emoji TEXT;
BEGIN
  -- 1. Authentication Check
  v_user_id := public.current_user_id();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Input Validation
  IF p_message_id IS NULL THEN
    RAISE EXCEPTION 'p_message_id is mandatory and cannot be null';
  END IF;

  v_cleaned_emoji := trim(p_emoji);
  IF v_cleaned_emoji IS NULL OR v_cleaned_emoji = '' THEN
    RAISE EXCEPTION 'p_emoji cannot be empty';
  END IF;

  IF length(v_cleaned_emoji) > 32 THEN
    RAISE EXCEPTION 'p_emoji exceeds maximum length of 32 characters';
  END IF;

  -- 3. Lock Message Row & Resolve Channel Scope
  SELECT m.channel_id, m.reactions, c.team_id, c.subgroup_id
  INTO v_channel_id, v_current_reactions, v_team_id, v_subgroup_id
  FROM public.messages m
  JOIN public.chat_channels c ON c.id = m.channel_id
  WHERE m.id = p_message_id
  FOR UPDATE OF m;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Message not found';
  END IF;

  -- 4. Authorization: Caller MUST belong to the channel's team
  IF NOT public.is_team_member(v_team_id) THEN
    RAISE EXCEPTION 'Access denied: caller is not a member of this team';
  END IF;

  -- 5. Authorization: For subgroup channels, caller MUST be Group Leader or Subgroup Member
  IF v_subgroup_id IS NOT NULL AND NOT (
    public.is_group_leader(v_team_id) OR public.is_subgroup_member(v_subgroup_id)
  ) THEN
    RAISE EXCEPTION 'Access denied: caller is not a member of this subgroup';
  END IF;

  -- 6. Sanitize existing reactions payload
  IF v_current_reactions IS NULL OR jsonb_typeof(v_current_reactions) != 'array' THEN
    v_current_reactions := '[]'::jsonb;
  END IF;

  -- 7. Process reactions array with deduplication
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_current_reactions)
  LOOP
    IF jsonb_typeof(v_item) = 'object' AND v_item ? 'emoji' THEN
      IF (v_item->>'emoji') = v_cleaned_emoji THEN
        v_found := TRUE;
        v_users := v_item->'users';

        IF v_users IS NULL OR jsonb_typeof(v_users) != 'array' THEN
          v_users := '[]'::jsonb;
        END IF;

        IF v_users ? (v_user_id::text) THEN
          SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
          INTO v_users
          FROM jsonb_array_elements_text(v_users) elem
          WHERE elem != (v_user_id::text);
        ELSE
          v_users := v_users || to_jsonb(v_user_id::text);
        END IF;

        v_count := jsonb_array_length(v_users);
        IF v_count > 0 THEN
          v_updated_reactions := v_updated_reactions || jsonb_build_object(
            'emoji', v_cleaned_emoji,
            'count', v_count,
            'users', v_users
          );
        END IF;
      ELSE
        v_updated_reactions := v_updated_reactions || v_item;
      END IF;
    END IF;
  END LOOP;

  -- 8. If emoji was not previously present, add it
  IF NOT v_found THEN
    v_updated_reactions := v_updated_reactions || jsonb_build_object(
      'emoji', v_cleaned_emoji,
      'count', 1,
      'users', jsonb_build_array(v_user_id::text)
    );
  END IF;

  -- 9. Atomic Update
  UPDATE public.messages
  SET reactions = v_updated_reactions
  WHERE id = p_message_id;

  RETURN v_updated_reactions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- --------------------------------------------------------------------
-- 5. UPDATE RLS POLICIES WITH CANONICAL IDENTITY
-- --------------------------------------------------------------------

-- Files policy
DROP POLICY IF EXISTS "Uploader or Group Leader update files" ON public.files;
CREATE POLICY "Uploader or Group Leader update files"
  ON public.files FOR UPDATE TO authenticated
  USING (uploaded_by = public.current_user_id() OR (team_id IS NOT NULL AND public.is_group_leader(team_id)))
  WITH CHECK (uploaded_by = public.current_user_id() AND (team_id IS NULL OR public.is_team_member(team_id)));

-- Messages policy
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
CREATE POLICY "Users can update own messages"
  ON public.messages FOR UPDATE TO authenticated
  USING (sender_id = public.current_user_id())
  WITH CHECK (sender_id = public.current_user_id() AND EXISTS (
    SELECT 1 FROM public.chat_channels c
    WHERE c.id = messages.channel_id
      AND public.is_team_member(c.team_id)
      AND (c.subgroup_id IS NULL OR public.is_group_leader(c.team_id) OR public.is_subgroup_member(c.subgroup_id))
  ));

-- Meetings policy
DROP POLICY IF EXISTS "Organizer or Group Leader update meetings" ON public.meetings;
CREATE POLICY "Organizer or Group Leader update meetings"
  ON public.meetings FOR UPDATE TO authenticated
  USING (organizer_id = public.current_user_id() OR (team_id IS NOT NULL AND public.is_group_leader(team_id)))
  WITH CHECK (organizer_id = public.current_user_id() AND (team_id IS NULL OR public.is_team_member(team_id)));

-- Storage Policies on storage.objects
DROP POLICY IF EXISTS "Team members and uploaders view project files" ON storage.objects;
CREATE POLICY "Team members and uploaders view project files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'project-files' AND (
      ((storage.foldername(name))[1] = 'personal' AND (storage.foldername(name))[2] = (public.current_user_id())::text)
      OR ((storage.foldername(name))[1] = (public.current_user_id())::text)
      OR (((storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'::text) AND public.is_team_member(((storage.foldername(name))[1])::uuid))
      OR (((storage.foldername(name))[1] = 'team') AND ((storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'::text) AND public.is_team_member(((storage.foldername(name))[2])::uuid))
    )
  );

DROP POLICY IF EXISTS "Team members and uploaders insert project files" ON storage.objects;
CREATE POLICY "Team members and uploaders insert project files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'project-files' AND (
      ((storage.foldername(name))[1] = 'personal' AND (storage.foldername(name))[2] = (public.current_user_id())::text)
      OR ((storage.foldername(name))[1] = (public.current_user_id())::text)
      OR (((storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'::text) AND public.is_team_member(((storage.foldername(name))[1])::uuid))
      OR (((storage.foldername(name))[1] = 'team') AND ((storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'::text) AND public.is_team_member(((storage.foldername(name))[2])::uuid))
    )
  );

DROP POLICY IF EXISTS "Uploaders and leaders update project files" ON storage.objects;
CREATE POLICY "Uploaders and leaders update project files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'project-files' AND (
      ((storage.foldername(name))[1] = 'personal' AND (storage.foldername(name))[2] = (public.current_user_id())::text)
      OR ((storage.foldername(name))[1] = (public.current_user_id())::text)
      OR (((storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'::text) AND (public.is_group_leader(((storage.foldername(name))[1])::uuid) OR public.is_team_member(((storage.foldername(name))[1])::uuid)))
      OR (((storage.foldername(name))[1] = 'team') AND ((storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'::text) AND (public.is_group_leader(((storage.foldername(name))[2])::uuid) OR public.is_team_member(((storage.foldername(name))[2])::uuid)))
    )
  )
  WITH CHECK (
    bucket_id = 'project-files' AND (
      ((storage.foldername(name))[1] = 'personal' AND (storage.foldername(name))[2] = (public.current_user_id())::text)
      OR ((storage.foldername(name))[1] = (public.current_user_id())::text)
      OR (((storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'::text) AND (public.is_group_leader(((storage.foldername(name))[1])::uuid) OR public.is_team_member(((storage.foldername(name))[1])::uuid)))
      OR (((storage.foldername(name))[1] = 'team') AND ((storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'::text) AND (public.is_group_leader(((storage.foldername(name))[2])::uuid) OR public.is_team_member(((storage.foldername(name))[2])::uuid)))
    )
  );

DROP POLICY IF EXISTS "Uploaders and leaders delete project files" ON storage.objects;
CREATE POLICY "Uploaders and leaders delete project files"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'project-files' AND (
      ((storage.foldername(name))[1] = 'personal' AND (storage.foldername(name))[2] = (public.current_user_id())::text)
      OR ((storage.foldername(name))[1] = (public.current_user_id())::text)
      OR (((storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'::text) AND (public.is_group_leader(((storage.foldername(name))[1])::uuid) OR public.is_team_member(((storage.foldername(name))[1])::uuid)))
      OR (((storage.foldername(name))[1] = 'team') AND ((storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'::text) AND (public.is_group_leader(((storage.foldername(name))[2])::uuid) OR public.is_team_member(((storage.foldername(name))[2])::uuid)))
    )
  );

DROP POLICY IF EXISTS "Uploaders and leaders can update chat attachments" ON storage.objects;
CREATE POLICY "Uploaders and leaders can update chat attachments"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'chat-attachments' AND array_length(storage.foldername(name), 1) = 1 AND
    (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'::text AND
    EXISTS (
      SELECT 1 FROM public.chat_channels c
      WHERE c.id = ((storage.foldername(objects.name))[1])::uuid
        AND public.is_team_member(c.team_id)
        AND (c.subgroup_id IS NULL OR public.is_group_leader(c.team_id) OR public.is_subgroup_member(c.subgroup_id))
    )
  )
  WITH CHECK (
    bucket_id = 'chat-attachments' AND array_length(storage.foldername(name), 1) = 1 AND
    (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'::text AND
    EXISTS (
      SELECT 1 FROM public.chat_channels c
      WHERE c.id = ((storage.foldername(objects.name))[1])::uuid
        AND public.is_team_member(c.team_id)
        AND (c.subgroup_id IS NULL OR public.is_group_leader(c.team_id) OR public.is_subgroup_member(c.subgroup_id))
    )
  );

DROP POLICY IF EXISTS "Uploaders and leaders can delete chat attachments" ON storage.objects;
CREATE POLICY "Uploaders and leaders can delete chat attachments"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'chat-attachments' AND array_length(storage.foldername(name), 1) = 1 AND
    (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'::text AND
    EXISTS (
      SELECT 1 FROM public.chat_channels c
      WHERE c.id = ((storage.foldername(objects.name))[1])::uuid
        AND public.is_team_member(c.team_id)
        AND (c.subgroup_id IS NULL OR public.is_group_leader(c.team_id) OR public.is_subgroup_member(c.subgroup_id))
    )
  );

COMMIT;

