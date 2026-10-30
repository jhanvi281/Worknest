-- ====================================================================
-- [SUPERSEDED - DO NOT APPLY TO LIVE DATABASE]
-- This migration has been superseded by 20261029000001_atomic_team_invitations.sql.
-- It is retained locally for audit and review history only.
-- ====================================================================
-- WorkNest Migration: Secure Team Member Invitation Profile Lookup (DEPRECATED)
-- ====================================================================
-- Description:
--   Enables Group Leaders to look up registered users by exact email address
--   to invite them to a team, resolving the RLS catch-22 on public.profiles
--   without widening table-level SELECT access or enabling profile enumeration.
-- ====================================================================

CREATE OR REPLACE FUNCTION public.find_profile_by_email(
  lookup_email TEXT,
  for_team_id UUID
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- 1. Authentication check: caller must be a logged-in user
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Input validation: reject NULL team IDs and empty/whitespace emails
  IF for_team_id IS NULL THEN
    RAISE EXCEPTION 'for_team_id is mandatory and cannot be null';
  END IF;

  IF lookup_email IS NULL OR trim(lookup_email) = '' THEN
    RAISE EXCEPTION 'lookup_email cannot be empty';
  END IF;

  -- 3. Authorization check: caller MUST be an active Group Leader of the target team
  -- Enforces parity with team_members INSERT policy: WITH CHECK (public.is_group_leader(team_id))
  IF NOT public.is_group_leader(for_team_id) THEN
    RAISE EXCEPTION 'Access denied: caller must be a group leader of this team';
  END IF;

  -- 4. Exact email match (case-insensitive & trimmed) with LIMIT 1
  -- Avoids wildcard matching, pagination, or mass enumeration.
  RETURN QUERY
  SELECT 
    p.id, 
    p.full_name, 
    p.email, 
    p.avatar_url
  FROM public.profiles p
  WHERE lower(trim(p.email)) = lower(trim(lookup_email))
  LIMIT 1;
END;
$$;

-- 5. Execution grants: Revoke from public/anon, grant strictly to authenticated
REVOKE ALL ON FUNCTION public.find_profile_by_email(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_profile_by_email(TEXT, UUID) TO authenticated;

COMMENT ON FUNCTION public.find_profile_by_email(TEXT, UUID) IS 
  'Securely looks up a user profile by exact email for group leaders inviting members to their team.';
