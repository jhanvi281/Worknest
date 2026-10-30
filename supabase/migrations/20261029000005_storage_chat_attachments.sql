-- ====================================================================
-- PROPOSED MIGRATION (NOT YET APPLIED TO REMOTE DATABASE)
-- File: supabase/migrations/20261029000005_storage_chat_attachments.sql
-- ====================================================================
-- Description:
--   Creates the private Supabase Storage bucket 'chat-attachments' with a
--   25MB size limit and configures hardened Row-Level Security (RLS)
--   policies on storage.objects.
--
-- Security Guarantees & Access Matrix:
--   1. Bucket Privacy:
--      'chat-attachments' is strictly marked public = false. Anonymous and
--      unauthenticated access is completely blocked. Valid authenticated
--      sessions and short-lived signed URLs are required for all access.
--
--   2. Channel Scope Isolation:
--      - Storage paths are strictly formatted as: <channel_id>/<timestamp>-<sanitized_filename>
--      - Folder name MUST be a single-level UUID matching public.chat_channels.id.
--      - Path traversal patterns (.. , // , \\) and nested subdirectories are rejected.
--
--   3. Team & Subgroup Authorization:
--      - General / Team Channels (subgroup_id IS NULL):
--        Active team membership (public.is_team_member(c.team_id)) is required.
--      - Subgroup Channels (subgroup_id IS NOT NULL):
--        Requires active team membership AND (public.is_group_leader(c.team_id) OR public.is_subgroup_member(c.subgroup_id)).
--        Other team members outside the subgroup cannot view, upload, or download attachments.
--
--   4. Upload Defense-in-Depth:
--      - Executable binaries (.exe, .bat, .cmd, .sh, .bin, .dll, etc.) are rejected
--        at both the database RLS layer and client service layer.
--      - File size limit enforced at bucket level (25MB).
--
--   5. Deletion & Modification:
--      - Only the original uploader (owner / owner_id) or the team Group Leader
--        can delete or modify attachment objects in storage.
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. Create Private Storage Bucket 'chat-attachments'
-- --------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments',
  'chat-attachments',
  false,
  26214400, -- 25 MB in bytes
  NULL      -- File types validated via RLS regex and client whitelist
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit;

-- --------------------------------------------------------------------
-- 2. Drop Any Pre-Existing Storage Policies on chat-attachments
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "Authorized channel members can view chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authorized channel members can insert chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Uploaders and leaders can update chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Uploaders and leaders can delete chat attachments" ON storage.objects;

-- --------------------------------------------------------------------
-- 3. SELECT Policy: Authorizes downloads and signed URL generation
-- --------------------------------------------------------------------
CREATE POLICY "Authorized channel members can view chat attachments"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'chat-attachments' AND
  array_length(storage.foldername(name), 1) = 1 AND
  (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND
  EXISTS (
    SELECT 1 FROM public.chat_channels c
    WHERE c.id = ((storage.foldername(objects.name))[1])::uuid
      AND public.is_team_member(c.team_id)
      AND (
        c.subgroup_id IS NULL
        OR public.is_group_leader(c.team_id)
        OR public.is_subgroup_member(c.subgroup_id)
      )
  )
);

-- --------------------------------------------------------------------
-- 4. INSERT Policy: Authorizes uploads to channel folder
-- --------------------------------------------------------------------
CREATE POLICY "Authorized channel members can insert chat attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'chat-attachments' AND
  array_length(storage.foldername(name), 1) = 1 AND
  (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND
  name !~* '\.(exe|bat|cmd|sh|php|py|pl|cgi|vbs|msi|bin|dll|com|app|scr|iso|jar|apk)$' AND
  name !~* '(\.\.|//|\\\\)' AND
  EXISTS (
    SELECT 1 FROM public.chat_channels c
    WHERE c.id = ((storage.foldername(objects.name))[1])::uuid
      AND public.is_team_member(c.team_id)
      AND (
        c.subgroup_id IS NULL
        OR public.is_group_leader(c.team_id)
        OR public.is_subgroup_member(c.subgroup_id)
      )
  )
);

-- --------------------------------------------------------------------
-- 5. UPDATE Policy: Authorizes file replacement / upserts
-- --------------------------------------------------------------------
CREATE POLICY "Uploaders and leaders can update chat attachments"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'chat-attachments' AND
  array_length(storage.foldername(name), 1) = 1 AND
  (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND
  EXISTS (
    SELECT 1 FROM public.chat_channels c
    WHERE c.id = ((storage.foldername(objects.name))[1])::uuid
      AND public.is_team_member(c.team_id)
      AND (
        c.subgroup_id IS NULL
        OR public.is_group_leader(c.team_id)
        OR public.is_subgroup_member(c.subgroup_id)
      )
      AND (
        public.is_group_leader(c.team_id)
        OR (objects.owner = auth.uid() OR objects.owner_id = (auth.uid())::text)
      )
  )
)
WITH CHECK (
  bucket_id = 'chat-attachments' AND
  array_length(storage.foldername(name), 1) = 1 AND
  (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND
  name !~* '\.(exe|bat|cmd|sh|php|py|pl|cgi|vbs|msi|bin|dll|com|app|scr|iso|jar|apk)$' AND
  name !~* '(\.\.|//|\\\\)' AND
  EXISTS (
    SELECT 1 FROM public.chat_channels c
    WHERE c.id = ((storage.foldername(objects.name))[1])::uuid
      AND public.is_team_member(c.team_id)
      AND (
        c.subgroup_id IS NULL
        OR public.is_group_leader(c.team_id)
        OR public.is_subgroup_member(c.subgroup_id)
      )
  )
);

-- --------------------------------------------------------------------
-- 6. DELETE Policy: Authorizes removal by active uploader or team group leader
-- --------------------------------------------------------------------
CREATE POLICY "Uploaders and leaders can delete chat attachments"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'chat-attachments' AND
  array_length(storage.foldername(name), 1) = 1 AND
  (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND
  EXISTS (
    SELECT 1 FROM public.chat_channels c
    WHERE c.id = ((storage.foldername(objects.name))[1])::uuid
      AND public.is_team_member(c.team_id)
      AND (
        c.subgroup_id IS NULL
        OR public.is_group_leader(c.team_id)
        OR public.is_subgroup_member(c.subgroup_id)
      )
      AND (
        public.is_group_leader(c.team_id)
        OR (objects.owner = auth.uid() OR objects.owner_id = (auth.uid())::text)
      )
  )
);

