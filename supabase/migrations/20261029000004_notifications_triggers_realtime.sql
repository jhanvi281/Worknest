-- ====================================================================
-- PROPOSED MIGRATION (NOT YET APPLIED TO REMOTE DATABASE)
-- File: supabase/migrations/20261029000004_notifications_triggers_realtime.sql
-- ====================================================================
-- Description:
--   Establishes a hardened, server-side notification architecture:
--   1. Enables Supabase Realtime publication on public.notifications with full
--      replica identity so client applications receive instantaneous live updates.
--   2. Installs server-side SECURITY DEFINER triggers for task assignments,
--      task completion, and team invitations/memberships.
--   3. Guarantees that clients cannot spoof notification senders or forge
--      unauthorized notifications for arbitrary recipients (enforced by RLS).
--
-- Security Guarantees:
--   - public.notifications continues to enforce:
--       USING (user_id = auth.uid())
--     ensuring users can ONLY read, update, or delete their own notifications.
--   - Event-driven notifications are created exclusively through server-side triggers
--     running with SECURITY DEFINER privileges and fixed search_path = public (omitting pg_temp).
--   - Personal tasks (team_id IS NULL) never dispatch assignment notifications to third parties.
--   - Self-actions (e.g. assigning a task to oneself, completing one's own task)
--     do not generate noisy notifications.
--   - Empty or whitespace actor names safely fall back to email username or generic role title.
--   - Functions return trigger and cannot be invoked as normal SQL functions or RPC endpoints.
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. Enable Supabase Realtime on public.notifications
-- --------------------------------------------------------------------
DO $$
BEGIN
  -- Add table to publication if not already added
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- Set replica identity to FULL so update and delete events have complete row data
-- This is necessary for client-side Realtime filters (e.g. user_id = eq.XYZ) on DELETE events.
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- --------------------------------------------------------------------
-- 2. Server-Side Trigger: Task Assignment & Completion Notifications
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_task_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_name TEXT;
  v_actor_id UUID;
BEGIN
  v_actor_id := auth.uid();

  -- Get actor display name if authenticated, handling empty string and whitespace defaults cleanly
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
  -- Strictly requires NEW.team_id IS NOT NULL so personal tasks cannot be used to spam third parties
  IF NEW.assigned_to IS NOT NULL AND NEW.team_id IS NOT NULL AND (
    TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (OLD.assigned_to IS DISTINCT FROM NEW.assigned_to))
  ) THEN
    -- Prevent notifying self if self-assigned
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

-- Restrict trigger function execution permissions
REVOKE ALL ON FUNCTION public.handle_task_notification() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_task_notification() FROM anon;
GRANT EXECUTE ON FUNCTION public.handle_task_notification() TO authenticated, service_role;

DROP TRIGGER IF EXISTS trg_task_notification ON public.tasks;
CREATE TRIGGER trg_task_notification
AFTER INSERT OR UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.handle_task_notification();

-- --------------------------------------------------------------------
-- 3. Server-Side Trigger: Team Membership Notifications
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_team_member_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_name TEXT;
  v_inviter_name TEXT;
  v_actor_id UUID;
  v_formatted_role TEXT;
BEGIN
  v_actor_id := auth.uid();

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

-- Restrict trigger function execution permissions
REVOKE ALL ON FUNCTION public.handle_team_member_notification() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_team_member_notification() FROM anon;
GRANT EXECUTE ON FUNCTION public.handle_team_member_notification() TO authenticated, service_role;

DROP TRIGGER IF EXISTS trg_team_member_notification ON public.team_members;
CREATE TRIGGER trg_team_member_notification
AFTER INSERT ON public.team_members
FOR EACH ROW EXECUTE FUNCTION public.handle_team_member_notification();
