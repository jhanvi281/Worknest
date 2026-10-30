-- ====================================================================
-- WorkNest Migration: Atomic Team Member Invitation Architecture
-- File: supabase/migrations/20261029000001_atomic_team_invitations.sql
-- ====================================================================
-- Description:
--   Implements an atomic server-side team member invitation function that:
--   1. Enforces authenticated Group Leader authorization.
--   2. Validates role and subgroup assignment consistency.
--   3. Resolves profile internally without exposing a standalone lookup API.
--   4. Performs atomic insertion with concurrency-safe duplicate handling.
--   5. Restricts output to minimal success confirmation.
-- ====================================================================

CREATE OR REPLACE FUNCTION public.invite_team_member(
  p_team_id UUID,
  p_email TEXT,
  p_role public.user_team_role DEFAULT 'member',
  p_subgroup_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id UUID;
  v_target_user_id UUID;
  v_target_full_name TEXT;
  v_new_member_id UUID;
  v_cleaned_email TEXT;
BEGIN
  -- 1. Authentication Check: caller must be an active, logged-in user
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Input Validation: team ID and email cannot be null or empty
  IF p_team_id IS NULL THEN
    RAISE EXCEPTION 'p_team_id is mandatory and cannot be null';
  END IF;

  v_cleaned_email := lower(trim(p_email));
  IF v_cleaned_email IS NULL OR v_cleaned_email = '' THEN
    RAISE EXCEPTION 'p_email cannot be empty';
  END IF;

  -- 3. Authorization Check: Caller MUST be an active Group Leader of the target team
  -- Enforces strict parity with team_members INSERT RLS: WITH CHECK (public.is_group_leader(team_id))
  IF NOT public.is_group_leader(p_team_id) THEN
    RAISE EXCEPTION 'Access denied: only Group Leaders can add members to this team';
  END IF;

  -- 4. Subgroup Ownership Validation: ensure subgroup belongs to target team
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

    -- Pre-check single subgroup leader constraint
    IF EXISTS (
      SELECT 1 FROM public.team_members
      WHERE subgroup_id = p_subgroup_id AND role = 'subgroup_leader'
    ) THEN
      RAISE EXCEPTION 'This subgroup already has a Sub-Group Leader. Subgroups can only have 1 leader.';
    END IF;
  END IF;

  -- 6. Internal Profile Resolution (SECURITY DEFINER allows reading public.profiles safely)
  SELECT p.id, p.full_name
  INTO v_target_user_id, v_target_full_name
  FROM public.profiles p
  WHERE lower(trim(p.email)) = v_cleaned_email
  LIMIT 1;

  IF v_target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email "%" is not registered on WorkNest. They must sign up first.', v_cleaned_email;
  END IF;

  -- 7. Pre-check for Existing Membership
  IF EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = p_team_id AND user_id = v_target_user_id
  ) THEN
    RAISE EXCEPTION 'User is already a member of this team.';
  END IF;

  -- 8. Atomic Insertion with Concurrency Conflict Handling
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
      -- Catches concurrent race conditions on UNIQUE(team_id, user_id) or unq_one_subgroup_leader_per_subgroup
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

  -- 9. Return Minimal Confirmation Payload (No email or avatar leakage)
  RETURN jsonb_build_object(
    'success', TRUE,
    'member_id', v_new_member_id,
    'user_id', v_target_user_id,
    'full_name', v_target_full_name
  );
END;
$$;

-- 10. Strict Execution Grants
REVOKE ALL ON FUNCTION public.invite_team_member(UUID, TEXT, public.user_team_role, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.invite_team_member(UUID, TEXT, public.user_team_role, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.invite_team_member(UUID, TEXT, public.user_team_role, UUID) TO authenticated;

COMMENT ON FUNCTION public.invite_team_member(UUID, TEXT, public.user_team_role, UUID) IS
  'Atomically verifies group leader authorization, resolves profile internally, and inserts team membership in a single transaction.';

