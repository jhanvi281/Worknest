-- ====================================================================
-- MIGRATION: 20261029000006_fix_meetings_rls_recursion.sql
-- ====================================================================
-- Description:
--   Resolves PostgreSQL 42P17 infinite recursion between public.meetings
--   and public.meeting_participants RLS policies.
--
-- Root Cause:
--   The SELECT policy on public.meetings checked public.meeting_participants,
--   while the SELECT policy on public.meeting_participants checked public.meetings.
--   When PostgREST executes INSERT ... RETURNING id or SELECT on either table,
--   PostgreSQL detected mutual recursion between the security barrier views and
--   aborted the transaction with error code 42P17.
--
-- Solution:
--   Introduce SECURITY DEFINER helper functions (with fixed search_path = public)
--   to inspect membership without triggering recursive RLS evaluation.
-- ====================================================================

-- 1. Helper to verify participant status without triggering meeting_participants RLS
CREATE OR REPLACE FUNCTION public.is_meeting_participant(check_meeting_id UUID, check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.meeting_participants
    WHERE meeting_id = check_meeting_id AND user_id = check_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Helper to verify meeting access without triggering meetings RLS
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

-- 3. Helper to verify meeting management permission without triggering meetings RLS
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

-- 4. Update meetings SELECT policy
DROP POLICY IF EXISTS "Team members or participants view meetings" ON public.meetings;
CREATE POLICY "Team members or participants view meetings"
  ON public.meetings FOR SELECT TO authenticated
  USING (
    organizer_id = auth.uid() OR
    (team_id IS NOT NULL AND public.is_team_member(team_id)) OR
    public.is_meeting_participant(id, auth.uid())
  );

-- 5. Update meeting_participants SELECT policy
DROP POLICY IF EXISTS "View meeting participants" ON public.meeting_participants;
CREATE POLICY "View meeting participants"
  ON public.meeting_participants FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    public.can_view_meeting(meeting_id, auth.uid())
  );

-- 6. Update meeting_participants INSERT policy
DROP POLICY IF EXISTS "Organizer or Group Leader insert participants" ON public.meeting_participants;
CREATE POLICY "Organizer or Group Leader insert participants"
  ON public.meeting_participants FOR INSERT TO authenticated
  WITH CHECK (
    public.can_manage_meeting_participants(meeting_id, auth.uid())
  );

-- 7. Update meeting_participants DELETE policy
DROP POLICY IF EXISTS "Organizer or Group Leader remove participants" ON public.meeting_participants;
CREATE POLICY "Organizer or Group Leader remove participants"
  ON public.meeting_participants FOR DELETE TO authenticated
  USING (
    public.can_manage_meeting_participants(meeting_id, auth.uid())
  );

