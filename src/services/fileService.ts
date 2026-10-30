import { supabase, isClerkAuthMode } from '../lib/supabase';
import type { FileCategory, FileType, ProjectFile } from '../types';

export const MAX_FILE_SIZE_BYTES = 52428800; // 50 MB
export const STORAGE_BUCKET = 'project-files';

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const sanitizeFileName = (fileName: string): string => {
  // Strip dangerous path traversal characters and replace non-standard characters
  const baseName = fileName.replace(/^.*[\\/]/, '');
  const sanitized = baseName.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_{2,}/g, '_');
  return sanitized || `file_${Date.now()}`;
};

export const detectFileTypeAndCategory = (
  fileName: string
): { type: FileType; category: FileCategory } => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  switch (ext) {
    case 'ppt':
    case 'pptx':
    case 'key':
      return { type: 'PPTX', category: 'presentations' };
    case 'pdf':
      return { type: 'PDF', category: 'documents' };
    case 'doc':
    case 'docx':
    case 'txt':
    case 'rtf':
    case 'md':
      return { type: 'DOCX', category: 'documents' };
    case 'xls':
    case 'xlsx':
    case 'csv':
      return { type: 'XLSX', category: 'documents' };
    case 'png':
      return { type: 'PNG', category: 'images' };
    case 'jpg':
    case 'jpeg':
      return { type: 'JPG', category: 'images' };
    case 'gif':
      return { type: 'GIF', category: 'images' };
    case 'webp':
      return { type: 'WEBP', category: 'images' };
    case 'svg':
      return { type: 'SVG', category: 'images' };
    case 'zip':
    case 'rar':
    case 'tar':
    case 'gz':
    case '7z':
      return { type: 'ZIP', category: 'other' };
    default:
      return { type: (ext.toUpperCase() || 'OTHER') as FileType, category: 'other' };
  }
};

export const mapSupabaseFile = (f: any): ProjectFile => {
  const uploader = f.uploader;
  const uploaderName =
    uploader?.full_name || (uploader?.email ? uploader.email.split('@')[0] : 'Team Member');
  const uploaderAvatar =
    uploader?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(uploaderName)}&background=0284c7&color=fff`;

  const dateStr = f.created_at ? f.created_at.split('T')[0] : new Date().toISOString().split('T')[0];

  return {
    id: f.id,
    name: f.name || 'Untitled File',
    type: (f.file_type || 'OTHER').toUpperCase() as FileType,
    category: (f.category || 'other') as FileCategory,
    uploadedBy: uploaderName,
    uploaderAvatar,
    date: dateStr,
    size: f.size || '0 B',
    url: f.url || '',
    previewUrl: f.url || '',
    storagePath: f.storage_path || '',
    teamId: f.team_id || undefined,
    teamName: f.team?.name || undefined,
    uploadedById: f.uploaded_by,
    createdAt: f.created_at,
  };
};

export const fileService = {
  /**
   * Fetch files accessible by the user (personal files + files of teams they belong to)
   */
  async fetchFiles(options?: { teamId?: string }): Promise<ProjectFile[]> {
    let query = supabase
      .from('files')
      .select(`
        id,
        team_id,
        uploaded_by,
        name,
        file_type,
        category,
        size,
        url,
        storage_path,
        created_at,
        uploader:uploaded_by(id, full_name, email, avatar_url),
        team:team_id(id, name)
      `)
      .order('created_at', { ascending: false });

    if (options?.teamId) {
      query = query.eq('team_id', options.teamId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching files from Supabase:', error);
      throw error;
    }

    return (data || []).map(mapSupabaseFile);
  },

  /**
   * Generates a short-lived signed URL for secure download or preview from private storage.
   */
  async getSignedUrl(storagePath: string, expiresInSeconds = 3600): Promise<string | null> {
    if (!storagePath) return null;

    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(storagePath, expiresInSeconds);

      if (error) {
        console.warn('Error creating signed URL from Supabase Storage:', error.message);
        return null;
      }

      return data?.signedUrl || null;
    } catch (err) {
      console.warn('Unexpected error creating signed URL:', err);
      return null;
    }
  },

  /**
   * Uploads a file to Supabase Storage and records metadata in public.files.
   * Performs compensating cleanup if the database insert fails.
   */
  async uploadFile(params: {
    file: File;
    customName?: string;
    teamId?: string;
    category?: FileCategory;
    userId: string;
  }): Promise<ProjectFile> {
    const { file, customName, teamId, category: explicitCategory, userId } = params;

    let effectiveUserId: string | undefined = userId;
    if (!effectiveUserId && !isClerkAuthMode) {
      const { data: authData } = await supabase.auth.getUser();
      effectiveUserId = authData?.user?.id;
    }
    if (!effectiveUserId) {
      throw new Error('You must be logged in to upload files.');
    }

    if (!file) {
      throw new Error('No file selected for upload.');
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error(
        `File size exceeds the 50MB limit (${formatFileSize(file.size)}). Please choose a smaller file.`
      );
    }

    const rawName = customName?.trim() || file.name;
    const sanitizedName = sanitizeFileName(rawName);
    const { type: detectedType, category: detectedCategory } = detectFileTypeAndCategory(sanitizedName);
    const finalCategory = explicitCategory || detectedCategory;
    const formattedSize = formatFileSize(file.size);

    // Organized storage layout:
    // Team files:   {teamId}/{timestamp}-{sanitizedName}
    // Personal:     personal/{userId}/{timestamp}-{sanitizedName}
    const timestamp = Date.now();
    const storagePath = teamId
      ? `${teamId}/${timestamp}-${sanitizedName}`
      : `personal/${effectiveUserId}/${timestamp}-${sanitizedName}`;

    // 1. Upload binary asset to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase Storage upload error:', uploadError);
      if (
        uploadError.message?.toLowerCase().includes('bucket not found') ||
        (uploadError as any).statusCode === '404'
      ) {
        throw new Error(
          `Storage bucket '${STORAGE_BUCKET}' is not yet created. Please run the provided SQL migration in the Supabase Dashboard.`
        );
      }
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // 2. Insert metadata into public.files
    const insertPayload = {
      team_id: teamId || null,
      uploaded_by: effectiveUserId,
      name: sanitizedName,
      file_type: detectedType,
      category: finalCategory,
      size: formattedSize,
      storage_path: storagePath,
      url: '',
    };

    const { data: insertedData, error: dbError } = await supabase
      .from('files')
      .insert(insertPayload)
      .select(`
        id,
        team_id,
        uploaded_by,
        name,
        file_type,
        category,
        size,
        url,
        storage_path,
        created_at,
        uploader:uploaded_by(id, full_name, email, avatar_url),
        team:team_id(id, name)
      `)
      .single();

    // 3. Compensating transaction: If DB insert fails, remove the uploaded storage asset
    if (dbError) {
      console.error('Failed to insert file metadata, rolling back storage upload:', dbError);
      let rollbackDetail = '';
      try {
        const { error: removeErr } = await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
        if (removeErr) {
          rollbackDetail = ` (Compensating storage cleanup also failed: ${removeErr.message})`;
        }
      } catch (cleanupEx) {
        rollbackDetail = ` (Compensating storage cleanup error: ${cleanupEx instanceof Error ? cleanupEx.message : String(cleanupEx)})`;
      }
      throw new Error(`Database error saving file details: ${dbError.message}${rollbackDetail}`);
    }

    const mapped = mapSupabaseFile(insertedData);

    // Pre-resolve signed URL for immediate preview
    try {
      const signedUrl = await fileService.getSignedUrl(storagePath);
      if (signedUrl) {
        mapped.previewUrl = signedUrl;
        mapped.url = signedUrl;
      }
    } catch {
      // Non-critical if signed URL fetch fails immediately after upload
    }

    return mapped;
  },

  /**
   * Safely downloads a file by generating a short-lived signed URL and triggering a client download.
   */
  async downloadFile(file: ProjectFile): Promise<void> {
    let downloadUrl = file.url;

    if (file.storagePath) {
      const signedUrl = await fileService.getSignedUrl(file.storagePath, 600); // 10 minutes
      if (signedUrl) {
        downloadUrl = signedUrl;
      }
    }

    if (!downloadUrl) {
      throw new Error('Download URL could not be generated. The file might have been removed or storage is unavailable.');
    }

    try {
      // Fetch as blob to ensure browser download attribute works consistently across origins
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`Download request failed with status: ${response.statusText}`);
      }
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = file.name;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(objectUrl);
    } catch (err: unknown) {
      // Fallback: direct window.open if CORS restricts blob fetching
      console.warn('Direct blob fetch failed, falling back to window navigation:', err);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  },

  /**
   * Deletes the file metadata from public.files and deletes the binary object from storage.
   */
  async deleteFile(fileId: string, storagePath?: string): Promise<boolean> {
    // 1. Delete from PostgreSQL database and verify affected row
    const { data, error: dbError } = await supabase
      .from('files')
      .delete()
      .eq('id', fileId)
      .select('id');

    if (dbError) {
      console.error('Error deleting file record from database:', dbError);
      throw new Error(`Failed to delete file record: ${dbError.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('File could not be deleted. It may not exist or you do not have permission to delete it.');
    }

    // 2. Delete from Supabase Storage if storagePath exists
    if (storagePath) {
      try {
        const { error: storageError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .remove([storagePath]);

        if (storageError) {
          console.warn('Storage object removal warning:', storageError.message);
        }
      } catch (err) {
        console.warn('Storage removal exception:', err);
      }
    }

    return true;
  },
};

