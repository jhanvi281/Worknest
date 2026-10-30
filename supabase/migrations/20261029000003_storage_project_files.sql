-- ====================================================================
-- PROPOSED MIGRATION (NOT YET APPLIED TO REMOTE DATABASE)
-- File: supabase/migrations/20261029000003_storage_project_files.sql
-- ====================================================================
-- Description:
--   Creates the private Supabase Storage bucket 'project-files' with a
--   50MB size limit and configures hardened Row-Level Security (RLS)
--   policies on storage.objects.
--
-- Security Guarantees & Access Matrix:
--   1. Bucket Privacy:
--      'project-files' is strictly marked public = false. Anonymous and
--      unauthenticated access is completely blocked. Valid authenticated
--      requests and short-lived signed URLs are required for all access.
--
--   2. Personal Files:
--      - Stored under: personal/<user_id>/<filename>
--      - Upload: Only the authenticated user whose UID matches <user_id>.
--      - Read / Download: Exclusively accessible to that user.
--      - Update / Delete: Exclusively restricted to that user.
--
--   3. Team Files:
--      - Stored under: <team_id>/<filename> (or team/<team_id>/<filename>)
--      - Read / Download: Requires ACTIVE team membership via public.is_team_member.
--        Former team members CANNOT access team files, even if they were the uploader.
--      - Upload: Requires ACTIVE team membership via public.is_team_member.
--      - Update / Delete: Allowed to the designated Group Leader (public.is_group_leader)
--        OR the original uploader (owner / owner_id) WHILE THEY REMAIN AN ACTIVE TEAM MEMBER.
--        Former members have NO delete or update permissions on team files.
--
--   4. Robust Path & UUID Handling:
--      - Regex guards ensure that path token extraction does not attempt invalid UUID
--        casts, preventing runtime PostgreSQL errors.
--      - Storage folder tokens are parsed via storage.foldername(name).
--      - Storage ownership columns (both UUID owner and TEXT owner_id) are supported.
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. Create Private Storage Bucket 'project-files'
-- --------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-files',
  'project-files',
  false,
  52428800, -- 50 MB in bytes
  NULL      -- Permits standard documents, presentations, sheets, images, and archives
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit;

-- --------------------------------------------------------------------
-- 2. Drop Any Pre-Existing Storage Policies on project-files
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "Team members and uploaders view project files" ON storage.objects;
DROP POLICY IF EXISTS "Team members and uploaders insert project files" ON storage.objects;
DROP POLICY IF EXISTS "Uploaders and leaders update project files" ON storage.objects;
DROP POLICY IF EXISTS "Uploaders and leaders delete project files" ON storage.objects;

-- --------------------------------------------------------------------
-- 3. SELECT Policy: Authorizes downloads and signed URL generation
-- --------------------------------------------------------------------
CREATE POLICY "Team members and uploaders view project files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'project-files' AND (
    -- Personal file scope: personal/<user_id>/...
    (
      (storage.foldername(name))[1] = 'personal' AND
      (storage.foldername(name))[2] = (auth.uid())::text
    )
    OR
    -- Personal file direct: <user_id>/...
    (
      (storage.foldername(name))[1] = (auth.uid())::text
    )
    -- Team file direct: <team_id>/... (requires CURRENT active team membership)
    OR
    (
      (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND
      public.is_team_member(((storage.foldername(name))[1])::uuid)
    )
    -- Team file scope: team/<team_id>/... (requires CURRENT active team membership)
    OR
    (
      (storage.foldername(name))[1] = 'team' AND
      (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND
      public.is_team_member(((storage.foldername(name))[2])::uuid)
    )
  )
);

-- --------------------------------------------------------------------
-- 4. INSERT Policy: Authorizes uploads to personal or member team folders
-- --------------------------------------------------------------------
CREATE POLICY "Team members and uploaders insert project files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'project-files' AND (
    -- Personal upload: personal/<user_id>/...
    (
      (storage.foldername(name))[1] = 'personal' AND
      (storage.foldername(name))[2] = (auth.uid())::text
    )
    OR
    -- Personal upload direct: <user_id>/...
    (
      (storage.foldername(name))[1] = (auth.uid())::text
    )
    -- Team upload direct: <team_id>/... (requires active team membership)
    OR
    (
      (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND
      public.is_team_member(((storage.foldername(name))[1])::uuid)
    )
    -- Team upload scope: team/<team_id>/... (requires active team membership)
    OR
    (
      (storage.foldername(name))[1] = 'team' AND
      (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND
      public.is_team_member(((storage.foldername(name))[2])::uuid)
    )
  )
);

-- --------------------------------------------------------------------
-- 5. UPDATE Policy: Authorizes file replacement / upserts
-- --------------------------------------------------------------------
CREATE POLICY "Uploaders and leaders update project files"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'project-files' AND (
    -- Personal files: only the owner can update
    (
      (storage.foldername(name))[1] = 'personal' AND
      (storage.foldername(name))[2] = (auth.uid())::text
    )
    OR
    (
      (storage.foldername(name))[1] = (auth.uid())::text
    )
    -- Team files: Group Leader OR active team member who is the uploader
    OR
    (
      (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND (
        public.is_group_leader(((storage.foldername(name))[1])::uuid)
        OR
        (
          public.is_team_member(((storage.foldername(name))[1])::uuid) AND
          (owner = auth.uid() OR owner_id = (auth.uid())::text)
        )
      )
    )
    OR
    (
      (storage.foldername(name))[1] = 'team' AND
      (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND (
        public.is_group_leader(((storage.foldername(name))[2])::uuid)
        OR
        (
          public.is_team_member(((storage.foldername(name))[2])::uuid) AND
          (owner = auth.uid() OR owner_id = (auth.uid())::text)
        )
      )
    )
  )
)
WITH CHECK (
  bucket_id = 'project-files' AND (
    -- Personal files: must remain in owner's personal folder
    (
      (storage.foldername(name))[1] = 'personal' AND
      (storage.foldername(name))[2] = (auth.uid())::text
    )
    OR
    (
      (storage.foldername(name))[1] = (auth.uid())::text
    )
    -- Team files: must remain in authorized team folder
    OR
    (
      (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND (
        public.is_group_leader(((storage.foldername(name))[1])::uuid)
        OR
        (
          public.is_team_member(((storage.foldername(name))[1])::uuid) AND
          (owner = auth.uid() OR owner_id = (auth.uid())::text)
        )
      )
    )
    OR
    (
      (storage.foldername(name))[1] = 'team' AND
      (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND (
        public.is_group_leader(((storage.foldername(name))[2])::uuid)
        OR
        (
          public.is_team_member(((storage.foldername(name))[2])::uuid) AND
          (owner = auth.uid() OR owner_id = (auth.uid())::text)
        )
      )
    )
  )
);

-- --------------------------------------------------------------------
-- 6. DELETE Policy: Authorizes removal by active uploader or team group leader
-- --------------------------------------------------------------------
CREATE POLICY "Uploaders and leaders delete project files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'project-files' AND (
    -- Personal files: only the owner can delete
    (
      (storage.foldername(name))[1] = 'personal' AND
      (storage.foldername(name))[2] = (auth.uid())::text
    )
    OR
    (
      (storage.foldername(name))[1] = (auth.uid())::text
    )
    -- Team files: Group Leader OR active team member who is the uploader
    OR
    (
      (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND (
        public.is_group_leader(((storage.foldername(name))[1])::uuid)
        OR
        (
          public.is_team_member(((storage.foldername(name))[1])::uuid) AND
          (owner = auth.uid() OR owner_id = (auth.uid())::text)
        )
      )
    )
    OR
    (
      (storage.foldername(name))[1] = 'team' AND
      (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND (
        public.is_group_leader(((storage.foldername(name))[2])::uuid)
        OR
        (
          public.is_team_member(((storage.foldername(name))[2])::uuid) AND
          (owner = auth.uid() OR owner_id = (auth.uid())::text)
        )
      )
    )
  )
);
