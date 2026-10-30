-- ====================================================================
-- PROPOSED MIGRATION (NOT YET APPROVED FOR DEPLOYMENT)
-- File: supabase/migrations/20261029000002_chat_message_reactions.sql
-- ====================================================================
-- Description:
--   Implements comprehensive authorization for chat message interactions:
--   Part 1: Hardened, concurrency-safe toggle_message_reaction RPC.
--           - Authorizes caller against team and subgroup channel scope.
--           - Prevents lost updates using row-level locking (FOR UPDATE OF m).
--           - Validates and sanitizes reaction JSONB structure.
--           - Fully compatible with live schema (does not require updated_at on messages).
--           - Strictly revokes execution from PUBLIC and anon.
--   Part 2: Row-Level Security (RLS) policy for message editing.
--           - Allows authors to update their own message text.
--           - Strictly restricts UPDATE to sender_id = auth.uid().
--           - Prevents sender spoofing and channel manipulation via WITH CHECK.
--           - Prevents group leaders from impersonating or modifying other users' messages.
-- ====================================================================

-- --------------------------------------------------------------------
-- Part 1: RPC toggle_message_reaction
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.toggle_message_reaction(
  p_message_id UUID,
  p_emoji TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
  v_user_id := auth.uid();
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

  -- 3. Lock Message Row & Resolve Channel Scope (Prevents Concurrent Lost Updates)
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
    -- Only process well-formed reaction objects
    IF jsonb_typeof(v_item) = 'object' AND v_item ? 'emoji' THEN
      IF (v_item->>'emoji') = v_cleaned_emoji THEN
        v_found := TRUE;
        v_users := v_item->'users';

        IF v_users IS NULL OR jsonb_typeof(v_users) != 'array' THEN
          v_users := '[]'::jsonb;
        END IF;

        -- Toggle user presence
        IF v_users ? (v_user_id::text) THEN
          -- User already reacted: remove user
          SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
          INTO v_users
          FROM jsonb_array_elements_text(v_users) elem
          WHERE elem != (v_user_id::text);
        ELSE
          -- User has not reacted: append user
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
        -- Retain existing other emojis
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

  -- 9. Atomic Update of Message Reactions (Live schema compatible: no updated_at column dependency)
  UPDATE public.messages
  SET reactions = v_updated_reactions
  WHERE id = p_message_id;

  RETURN v_updated_reactions;
END;
$$;

-- Strict Execution Grants
REVOKE ALL ON FUNCTION public.toggle_message_reaction(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.toggle_message_reaction(UUID, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.toggle_message_reaction(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION public.toggle_message_reaction(UUID, TEXT) IS
  'Securely toggles message reaction with row-level locking for authorized team members.';

-- --------------------------------------------------------------------
-- Part 2: RLS Policy for Message Editing
-- --------------------------------------------------------------------
-- Allow authors to update their own message content while strictly
-- preventing unauthorized channel changes, sender spoofing, or impersonation.

DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
DROP POLICY IF EXISTS "Sender can update own messages" ON public.messages;

CREATE POLICY "Users can update own messages"
  ON public.messages
  FOR UPDATE
  TO authenticated
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

COMMENT ON POLICY "Users can update own messages" ON public.messages IS
  'Permits original message authors to edit their own message text in authorized channels.';
