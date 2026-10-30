-- ====================================================================
-- WorkNest Database Migration Rollback: Clerk Native Authentication
-- Version: 20261030000000_rollback
-- ====================================================================

BEGIN;

-- 1. Restore team & subgroup helper functions with auth.uid()
CREATE OR REPLACE FUNCTION public.is_team_member(check_team_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = check_team_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_group_leader(check_team_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = check_team_id AND user_id = auth.uid() AND role = 'group_leader'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_subgroup_member(check_subgroup_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members
    WHERE subgroup_id = check_subgroup_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_meeting_participant(check_meeting_id UUID, check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.meeting_participants
    WHERE meeting_id = check_meeting_id AND user_id = check_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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

-- 2. Restore RLS policies across all tables with auth.uid()
DROP POLICY IF EXISTS "Profiles viewable by team members or self" ON public.profiles;
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

DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE TO authenticated 
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Team members or creators can view teams" ON public.teams;
CREATE POLICY "Team members or creators can view teams"
  ON public.teams FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR public.is_team_member(id));

DROP POLICY IF EXISTS "Authenticated users can create teams" ON public.teams;
CREATE POLICY "Authenticated users can create teams"
  ON public.teams FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Group leaders can update team details" ON public.teams;
CREATE POLICY "Group leaders can update team details"
  ON public.teams FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.is_group_leader(id));

DROP POLICY IF EXISTS "Group leaders can delete team" ON public.teams;
CREATE POLICY "Group leaders can delete team"
  ON public.teams FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.is_group_leader(id));

DROP POLICY IF EXISTS "Team members can view member lists" ON public.team_members;
CREATE POLICY "Team members can view member lists"
  ON public.team_members FOR SELECT TO authenticated
  USING (public.is_team_member(team_id) OR user_id = auth.uid());

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
  USING (public.is_group_leader(team_id) OR user_id = auth.uid());

DROP POLICY IF EXISTS "Task assignees or creators can view tasks" ON public.tasks;
CREATE POLICY "Task assignees or creators can view tasks"
  ON public.tasks FOR SELECT TO authenticated
  USING (
    created_by = auth.uid() OR
    assigned_to = auth.uid() OR
    (team_id IS NOT NULL AND public.is_team_member(team_id))
  );

DROP POLICY IF EXISTS "Users can insert tasks for themselves or teams they lead" ON public.tasks;
CREATE POLICY "Users can insert tasks for themselves or teams they lead"
  ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND (
      is_personal = TRUE OR
      (team_id IS NOT NULL AND (public.is_group_leader(team_id) OR public.is_team_member(team_id)))
    )
  );

DROP POLICY IF EXISTS "Users can update tasks" ON public.tasks;
CREATE POLICY "Users can update tasks"
  ON public.tasks FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid() OR
    assigned_to = auth.uid() OR
    (team_id IS NOT NULL AND public.is_group_leader(team_id))
  );

DROP POLICY IF EXISTS "Users can delete own tasks or group leader can delete team tasks" ON public.tasks;
CREATE POLICY "Users can delete own tasks or group leader can delete team tasks"
  ON public.tasks FOR DELETE TO authenticated
  USING (
    created_by = auth.uid() OR
    (team_id IS NOT NULL AND public.is_group_leader(team_id))
  );

DROP POLICY IF EXISTS "Users can view own logs or team members logs" ON public.daily_logs;
CREATE POLICY "Users can view own logs or team members logs"
  ON public.daily_logs FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    (team_id IS NOT NULL AND public.is_team_member(team_id))
  );

DROP POLICY IF EXISTS "Users can insert own daily logs" ON public.daily_logs;
CREATE POLICY "Users can insert own daily logs"
  ON public.daily_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own daily logs" ON public.daily_logs;
CREATE POLICY "Users update own daily logs"
  ON public.daily_logs FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own daily logs" ON public.daily_logs;
CREATE POLICY "Users can delete own daily logs"
  ON public.daily_logs FOR DELETE TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Channel members can insert messages" ON public.messages;
CREATE POLICY "Channel members can insert messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.chat_channels c
      WHERE c.id = messages.channel_id AND (
        c.team_id IS NULL OR public.is_team_member(c.team_id)
      )
    )
  );

DROP POLICY IF EXISTS "Message senders can update own messages" ON public.messages;
CREATE POLICY "Message senders can update own messages"
  ON public.messages FOR UPDATE TO authenticated
  USING (sender_id = auth.uid());

DROP POLICY IF EXISTS "Message senders or group leaders can delete messages" ON public.messages;
CREATE POLICY "Message senders or group leaders can delete messages"
  ON public.messages FOR DELETE TO authenticated
  USING (
    sender_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.chat_channels c
      WHERE c.id = messages.channel_id AND c.team_id IS NOT NULL AND public.is_group_leader(c.team_id)
    )
  );

DROP POLICY IF EXISTS "Team members or participants view meetings" ON public.meetings;
CREATE POLICY "Team members or participants view meetings"
  ON public.meetings FOR SELECT TO authenticated
  USING (
    organizer_id = auth.uid() OR
    (team_id IS NOT NULL AND public.is_team_member(team_id)) OR
    public.is_meeting_participant(id, auth.uid())
  );

DROP POLICY IF EXISTS "Authenticated users can create meetings" ON public.meetings;
CREATE POLICY "Authenticated users can create meetings"
  ON public.meetings FOR INSERT TO authenticated
  WITH CHECK (organizer_id = auth.uid());

DROP POLICY IF EXISTS "Organizer or Group Leader update meetings" ON public.meetings;
CREATE POLICY "Organizer or Group Leader update meetings"
  ON public.meetings FOR UPDATE TO authenticated
  USING (organizer_id = auth.uid() OR (team_id IS NOT NULL AND public.is_group_leader(team_id)));

DROP POLICY IF EXISTS "Organizer or Group Leader delete meetings" ON public.meetings;
CREATE POLICY "Organizer or Group Leader delete meetings"
  ON public.meetings FOR DELETE TO authenticated
  USING (organizer_id = auth.uid() OR (team_id IS NOT NULL AND public.is_group_leader(team_id)));

DROP POLICY IF EXISTS "View meeting participants" ON public.meeting_participants;
CREATE POLICY "View meeting participants"
  ON public.meeting_participants FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    public.can_view_meeting(meeting_id, auth.uid())
  );

DROP POLICY IF EXISTS "Organizer or Group Leader insert participants" ON public.meeting_participants;
CREATE POLICY "Organizer or Group Leader insert participants"
  ON public.meeting_participants FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_meeting_participants(meeting_id, auth.uid()));

DROP POLICY IF EXISTS "Participant self or Organizer update status" ON public.meeting_participants;
CREATE POLICY "Participant self or Organizer update status"
  ON public.meeting_participants FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.meetings m
      WHERE m.id = meeting_participants.meeting_id AND m.organizer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Organizer or Group Leader remove participants" ON public.meeting_participants;
CREATE POLICY "Organizer or Group Leader remove participants"
  ON public.meeting_participants FOR DELETE TO authenticated
  USING (public.can_manage_meeting_participants(meeting_id, auth.uid()));

DROP POLICY IF EXISTS "Team members and uploaders view project files" ON public.files;
CREATE POLICY "Team members and uploaders view project files"
  ON public.files FOR SELECT TO authenticated
  USING (uploaded_by = auth.uid() OR (team_id IS NOT NULL AND public.is_team_member(team_id)));

DROP POLICY IF EXISTS "Team members and uploaders insert project files" ON public.files;
CREATE POLICY "Team members and uploaders insert project files"
  ON public.files FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid() AND (team_id IS NULL OR public.is_team_member(team_id)));

DROP POLICY IF EXISTS "Uploaders and leaders update project files" ON public.files;
CREATE POLICY "Uploaders and leaders update project files"
  ON public.files FOR UPDATE TO authenticated
  USING (uploaded_by = auth.uid() OR (team_id IS NOT NULL AND public.is_group_leader(team_id)));

DROP POLICY IF EXISTS "Uploaders and leaders delete project files" ON public.files;
CREATE POLICY "Uploaders and leaders delete project files"
  ON public.files FOR DELETE TO authenticated
  USING (uploaded_by = auth.uid() OR (team_id IS NOT NULL AND public.is_group_leader(team_id)));

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users access own AI history" ON public.ai_history;
CREATE POLICY "Users access own AI history"
  ON public.ai_history FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 3. Drop Helper Functions and Sync RPC
DROP FUNCTION IF EXISTS public.sync_clerk_profile(TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.current_user_id();

-- 4. Rollback Notice:
-- clerk_user_id column is retained as non-breaking metadata.
-- profiles_id_fkey foreign key to auth.users can only be restored if any Clerk-only profiles are migrated or removed.

COMMIT;
