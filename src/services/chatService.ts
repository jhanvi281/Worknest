import { supabase, isClerkAuthMode } from '../lib/supabase';
import type { ChatChannel, ChatMessage } from '../types';

interface DbProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

interface DbChannel {
  id: string;
  team_id: string;
  subgroup_id: string | null;
  name: string;
  description: string | null;
  is_subgroup: boolean;
  created_at: string;
}

interface DbMessage {
  id: string;
  channel_id: string;
  sender_id: string | null;
  text: string;
  attachments: { name: string; size: string; type: string; url?: string; path?: string }[] | null;
  reactions: { emoji: string; count: number; users?: string[]; userReacted?: boolean }[] | null;
  created_at: string;
  updated_at?: string | null;
  sender_profile?: DbProfile | null;
}

export const CHAT_STORAGE_BUCKET = 'chat-attachments';
export const MAX_CHAT_ATTACHMENT_SIZE_BYTES = 26214400; // 25 MB
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const BLOCKED_CHAT_EXTENSIONS = new Set([
  'exe', 'bat', 'cmd', 'sh', 'php', 'py', 'pl', 'cgi', 'vbs', 'msi',
  'bin', 'dll', 'com', 'app', 'scr', 'iso', 'jar', 'apk', 'pif', 'gadget',
  'wsf', 'cpl', 'vbe', 'jse', 'hta'
]);

export const ALLOWED_CHAT_EXTENSIONS = new Set([
  // Images
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tif', 'tiff',
  // Documents
  'pdf', 'doc', 'docx', 'txt', 'rtf', 'md', 'csv', 'tsv', 'xls', 'xlsx',
  'ppt', 'pptx', 'pages', 'numbers', 'key', 'odt', 'ods', 'odp',
  // Archives
  'zip', 'tar', 'gz', '7z', 'rar', 'bz2', 'xz',
  // Audio & Video
  'mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'mp4', 'mov', 'webm', 'avi', 'mkv',
  // Code & Data
  'json', 'xml', 'yaml', 'yml', 'sql', 'log'
]);

export const sanitizeChatFileName = (fileName: string): string => {
  if (!fileName) return `attachment_${Date.now()}`;
  // Strip directory paths & path traversal
  const baseName = fileName.replace(/^.*[\\/]/, '');
  const noControlChars = Array.from(baseName)
    .filter((c) => {
      const code = c.charCodeAt(0);
      return code >= 32 && code !== 127;
    })
    .join('');
  const lastDot = noControlChars.lastIndexOf('.');
  let namePart = lastDot > 0 ? noControlChars.slice(0, lastDot) : noControlChars;
  const extPart = lastDot > 0 ? noControlChars.slice(lastDot + 1).toLowerCase() : '';

  // Prevent leading/trailing dots, consecutive dots, illegal characters, and orphan underscores
  namePart = namePart
    .replace(/^\.+/, '')
    .replace(/\.+$/, '')
    .replace(/\.{2,}/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+/, '')
    .replace(/_+$/, '');

  const cleanExt = extPart.replace(/[^a-zA-Z0-9]/g, '');

  if (!namePart || namePart === '_') {
    namePart = `attachment_${Date.now()}`;
  }

  return cleanExt ? `${namePart}.${cleanExt}` : namePart;
};

export const validateChatFile = (file: File): { valid: boolean; error?: string } => {
  if (!file) {
    return { valid: false, error: 'No file selected for attachment.' };
  }

  if (file.size <= 0) {
    return { valid: false, error: 'Cannot upload empty (0 byte) files.' };
  }

  if (file.size > MAX_CHAT_ATTACHMENT_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds the 25MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB). Please select a smaller file.`,
    };
  }

  const baseName = file.name.replace(/^.*[\\/]/, '');
  const ext = baseName.includes('.') ? baseName.split('.').pop()?.toLowerCase() || '' : '';

  if (ext && BLOCKED_CHAT_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      error: `Executable or script file type (.${ext}) is strictly prohibited for security reasons.`,
    };
  }

  if (ext && !ALLOWED_CHAT_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      error: `File type .${ext} is not supported. Supported formats include images, documents, presentations, spreadsheets, archives, and media.`,
    };
  }

  return { valid: true };
};

export const formatChatTimestamp = (isoString?: string): string => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isToday) return timeStr;
  if (isYesterday) return `Yesterday ${timeStr}`;
  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${timeStr}`;
};

export const mapSupabaseChannel = (
  c: DbChannel,
  latest?: { text?: string; created_at?: string }
): ChatChannel => {
  return {
    id: c.id,
    name: c.name,
    isSubgroup: Boolean(c.is_subgroup),
    description: c.description || '',
    unreadCount: 0,
    teamId: c.team_id,
    subgroupId: c.subgroup_id || undefined,
    lastMessage: latest?.text || undefined,
    lastTimestamp: latest?.created_at ? formatChatTimestamp(latest.created_at) : undefined,
    createdAt: c.created_at,
  };
};

export const mapSupabaseMessage = (m: DbMessage, currentUserId?: string): ChatMessage => {
  const profile = m.sender_profile;
  const senderName =
    profile?.full_name?.trim() ||
    (profile?.email ? profile.email.split('@')[0] : 'Member');
  const senderAvatar =
    profile?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName)}&background=f97316&color=fff`;

  const rawReactions = Array.isArray(m.reactions) ? m.reactions : [];
  const reactions = rawReactions.map((r) => {
    const users = Array.isArray(r.users) ? r.users : [];
    const count = typeof r.count === 'number' && r.count > 0 ? r.count : users.length;
    const userReacted = currentUserId ? users.includes(currentUserId) : Boolean(r.userReacted);
    return {
      emoji: r.emoji,
      count,
      userReacted,
      users,
    };
  });

  const isEdited = Boolean(
    m.updated_at &&
      m.created_at &&
      new Date(m.updated_at).getTime() - new Date(m.created_at).getTime() > 2000
  );

  return {
    id: m.id,
    channelId: m.channel_id,
    senderId: m.sender_id || '',
    senderName,
    senderAvatar,
    text: m.text || '',
    timestamp: formatChatTimestamp(m.created_at),
    attachments: Array.isArray(m.attachments) ? m.attachments : undefined,
    reactions: reactions.length > 0 ? reactions : undefined,
    createdAt: m.created_at,
    updatedAt: m.updated_at || undefined,
    isEdited,
  };
};

export const chatService = {
  async fetchChannels(teamId?: string): Promise<ChatChannel[]> {
    let query = supabase
      .from('chat_channels')
      .select(`
        id,
        team_id,
        subgroup_id,
        name,
        description,
        is_subgroup,
        created_at
      `)
      .order('is_subgroup', { ascending: true })
      .order('name', { ascending: true });

    if (teamId) {
      query = query.eq('team_id', teamId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching chat channels from Supabase:', error);
      throw error;
    }

    let channelRows = (data as unknown as DbChannel[]) || [];

    // If a team was requested and has zero channels, auto-seed default #general channel
    if (channelRows.length === 0 && teamId) {
      const defaultChan = await this.ensureDefaultChannel(teamId);
      if (defaultChan) {
        channelRows = [
          {
            id: defaultChan.id,
            team_id: defaultChan.teamId || teamId,
            subgroup_id: defaultChan.subgroupId || null,
            name: defaultChan.name,
            description: defaultChan.description || '',
            is_subgroup: defaultChan.isSubgroup,
            created_at: defaultChan.createdAt || new Date().toISOString(),
          },
        ];
      }
    }

    if (channelRows.length === 0) {
      return [];
    }

    // Retrieve the latest message per channel for real previews
    const channelIds = channelRows.map((c) => c.id);
    const { data: latestMsgs } = await supabase
      .from('messages')
      .select('id, channel_id, text, created_at')
      .in('channel_id', channelIds)
      .order('created_at', { ascending: false });

    const latestByChannel = new Map<string, { text?: string; created_at?: string }>();
    if (latestMsgs) {
      for (const msg of latestMsgs) {
        if (!latestByChannel.has(msg.channel_id)) {
          latestByChannel.set(msg.channel_id, {
            text: msg.text,
            created_at: msg.created_at,
          });
        }
      }
    }

    return channelRows.map((c) => mapSupabaseChannel(c, latestByChannel.get(c.id)));
  },

  async ensureDefaultChannel(teamId: string): Promise<ChatChannel | null> {
    if (!teamId) return null;
    try {
      const { data: existing } = await supabase
        .from('chat_channels')
        .select(`
          id,
          team_id,
          subgroup_id,
          name,
          description,
          is_subgroup,
          created_at
        `)
        .eq('team_id', teamId)
        .eq('name', 'general')
        .is('subgroup_id', null)
        .maybeSingle();

      if (existing) {
        return mapSupabaseChannel(existing as unknown as DbChannel);
      }

      const { data: created, error } = await supabase
        .from('chat_channels')
        .insert({
          team_id: teamId,
          name: 'general',
          description: 'General team discussion',
          is_subgroup: false,
          subgroup_id: null,
        })
        .select(`
          id,
          team_id,
          subgroup_id,
          name,
          description,
          is_subgroup,
          created_at
        `)
        .single();

      if (error) {
        if (error.code === '23505') {
          // Already created concurrently
          const { data: recheck } = await supabase
            .from('chat_channels')
            .select(`
              id,
              team_id,
              subgroup_id,
              name,
              description,
              is_subgroup,
              created_at
            `)
            .eq('team_id', teamId)
            .eq('name', 'general')
            .is('subgroup_id', null)
            .maybeSingle();
          if (recheck) return mapSupabaseChannel(recheck as unknown as DbChannel);
        }
        return null;
      }

      return mapSupabaseChannel(created as unknown as DbChannel);
    } catch (err) {
      console.warn('Could not ensure default general channel:', err);
      return null;
    }
  },

  async createChannel(params: {
    teamId: string;
    name: string;
    description?: string;
    isSubgroup?: boolean;
    subgroupId?: string;
  }): Promise<ChatChannel> {
    const payload = {
      team_id: params.teamId,
      name: params.name.trim().toLowerCase().replace(/\s+/g, '-'),
      description: params.description?.trim() || '',
      is_subgroup: Boolean(params.isSubgroup || params.subgroupId),
      subgroup_id: params.subgroupId || null,
    };

    const { data, error } = await supabase
      .from('chat_channels')
      .insert(payload)
      .select(`
        id,
        team_id,
        subgroup_id,
        name,
        description,
        is_subgroup,
        created_at
      `)
      .single();

    if (error) {
      console.error('Error creating chat channel in Supabase:', error);
      throw error;
    }

    return mapSupabaseChannel(data as unknown as DbChannel);
  },

  async fetchMessages(channelId: string, currentUserId?: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        channel_id,
        sender_id,
        text,
        attachments,
        reactions,
        created_at,
        sender_profile:sender_id(id, full_name, email, avatar_url)
      `)
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages from Supabase:', error);
      throw error;
    }

    const rows = (data as unknown as DbMessage[]) || [];
    return rows.map((r) => mapSupabaseMessage(r, currentUserId));
  },

  async sendMessage(
    params: {
      channelId: string;
      text: string;
      attachments?: ChatMessage['attachments'];
    },
    userId: string
  ): Promise<ChatMessage> {
    const trimmedText = params.text.trim();
    const hasAttachments = Array.isArray(params.attachments) && params.attachments.length > 0;
    if (!trimmedText && !hasAttachments) {
      throw new Error('Message cannot be empty. Please provide text or an attachment.');
    }

    let effectiveUserId: string | undefined = userId;
    if (!effectiveUserId && !isClerkAuthMode) {
      const { data: authData } = await supabase.auth.getUser();
      effectiveUserId = authData?.user?.id;
    }
    if (!effectiveUserId) {
      throw new Error('Authentication required to send a message.');
    }

    const payload = {
      channel_id: params.channelId,
      sender_id: effectiveUserId,
      text: trimmedText,
      attachments: params.attachments || [],
      reactions: [],
    };

    const { data, error } = await supabase
      .from('messages')
      .insert(payload)
      .select(`
        id,
        channel_id,
        sender_id,
        text,
        attachments,
        reactions,
        created_at,
        sender_profile:sender_id(id, full_name, email, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Error sending message in Supabase:', error);
      throw error;
    }

    return mapSupabaseMessage(data as unknown as DbMessage, effectiveUserId);
  },

  async editMessage(messageId: string, newText: string, userId: string): Promise<ChatMessage> {
    const trimmed = newText.trim();
    if (!trimmed) {
      throw new Error('Message content cannot be empty.');
    }

    let effectiveUserId: string | undefined = userId;
    if (!effectiveUserId && !isClerkAuthMode) {
      const { data: authData } = await supabase.auth.getUser();
      effectiveUserId = authData?.user?.id;
    }
    if (!effectiveUserId) {
      throw new Error('Authentication required to edit a message.');
    }

    const { data, error } = await supabase
      .from('messages')
      .update({
        text: trimmed,
      })
      .eq('id', messageId)
      .eq('sender_id', effectiveUserId)
      .select(`
        id,
        channel_id,
        sender_id,
        text,
        attachments,
        reactions,
        created_at,
        sender_profile:sender_id(id, full_name, email, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Error editing message in Supabase:', error);
      throw error;
    }

    return mapSupabaseMessage(data as unknown as DbMessage, effectiveUserId);
  },

  async deleteMessage(messageId: string): Promise<void> {
    // 1. Fetch message attachments to clean up any associated storage objects
    const { data: msg } = await supabase
      .from('messages')
      .select('attachments')
      .eq('id', messageId)
      .maybeSingle();

    // 2. Delete message row from database and verify affected rows
    const { data, error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)
      .select('id');

    if (error) {
      console.error('Error deleting message from Supabase:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error('Message could not be deleted. You may not have permission to delete this message.');
    }

    // 3. Clean up attached storage assets if any exist
    const rawAttachments = (msg?.attachments as Array<{ path?: string }>) || [];
    const pathsToRemove = rawAttachments
      .map((a) => a.path)
      .filter((p): p is string => Boolean(p));

    if (pathsToRemove.length > 0) {
      try {
        await supabase.storage.from(CHAT_STORAGE_BUCKET).remove(pathsToRemove);
      } catch (err) {
        console.warn('Non-fatal error removing deleted message attachments from storage:', err);
      }
    }
  },

  async toggleReaction(
    messageId: string,
    emoji: string,
    userId: string
  ): Promise<ChatMessage['reactions']> {
    if (!messageId || !emoji || !userId) {
      throw new Error('Missing parameters for reaction toggle.');
    }

    // 1. Try calling the secure database function RPC if present in Supabase
    try {
      const { data: rpcData, error: rpcErr } = await supabase.rpc('toggle_message_reaction', {
        p_message_id: messageId,
        p_emoji: emoji,
      });

      if (!rpcErr && rpcData) {
        const rawList = rpcData as { emoji: string; count: number; users?: string[] }[];
        return rawList.map((r) => ({
          emoji: r.emoji,
          count: typeof r.count === 'number' ? r.count : (r.users ? r.users.length : 1),
          userReacted: Array.isArray(r.users) ? r.users.includes(userId) : true,
          users: Array.isArray(r.users) ? r.users : [],
        }));
      }
    } catch (err) {
      console.warn('RPC toggle_message_reaction not available, falling back to direct update:', err);
    }

    // 2. Direct fallback update: Read current reactions JSONB, toggle user, update row
    const { data: currentMsg, error: fetchErr } = await supabase
      .from('messages')
      .select('reactions')
      .eq('id', messageId)
      .single();

    if (fetchErr) {
      console.error('Error reading message reactions:', fetchErr);
      throw fetchErr;
    }

    const rawReactions =
      (currentMsg?.reactions as { emoji: string; count: number; users?: string[] }[]) || [];
    const existingIndex = rawReactions.findIndex((r) => r.emoji === emoji);

    let updatedList: { emoji: string; count: number; users: string[] }[] = [];

    if (existingIndex >= 0) {
      const item = rawReactions[existingIndex];
      const userList = Array.isArray(item.users) ? [...item.users] : [];
      const hasReacted = userList.includes(userId);

      if (hasReacted) {
        const nextUsers = userList.filter((u) => u !== userId);
        if (nextUsers.length > 0) {
          updatedList = rawReactions.map((r, idx) =>
            idx === existingIndex
              ? { emoji: r.emoji, count: nextUsers.length, users: nextUsers }
              : { emoji: r.emoji, count: r.count, users: Array.isArray(r.users) ? r.users : [] }
          );
        } else {
          updatedList = rawReactions
            .filter((_, idx) => idx !== existingIndex)
            .map((r) => ({ emoji: r.emoji, count: r.count, users: Array.isArray(r.users) ? r.users : [] }));
        }
      } else {
        const nextUsers = [...userList, userId];
        updatedList = rawReactions.map((r, idx) =>
          idx === existingIndex
            ? { emoji: r.emoji, count: nextUsers.length, users: nextUsers }
            : { emoji: r.emoji, count: r.count, users: Array.isArray(r.users) ? r.users : [] }
        );
      }
    } else {
      updatedList = [
        ...rawReactions.map((r) => ({
          emoji: r.emoji,
          count: r.count,
          users: Array.isArray(r.users) ? r.users : [],
        })),
        { emoji, count: 1, users: [userId] },
      ];
    }

    const { error: updateErr } = await supabase
      .from('messages')
      .update({ reactions: updatedList })
      .eq('id', messageId);

    if (updateErr) {
      console.error('Error updating reactions in Supabase:', updateErr);
      throw updateErr;
    }

    return updatedList.map((r) => ({
      emoji: r.emoji,
      count: r.count,
      userReacted: r.users.includes(userId),
      users: r.users,
    }));
  },

  /**
   * Generates a short-lived signed URL for secure download or preview of a chat attachment.
   */
  async getSignedUrl(filePath: string, expiresInSeconds = 3600): Promise<string | null> {
    if (!filePath) return null;
    try {
      const { data, error } = await supabase.storage
        .from(CHAT_STORAGE_BUCKET)
        .createSignedUrl(filePath, expiresInSeconds);

      if (error) {
        console.warn('Error creating signed URL for chat attachment:', error.message);
        return null;
      }

      return data?.signedUrl || null;
    } catch (err) {
      console.warn('Unexpected error creating chat attachment signed URL:', err);
      return null;
    }
  },

  /**
   * Deletes an attachment binary asset from chat-attachments storage.
   */
  async deleteAttachment(filePath: string): Promise<boolean> {
    if (!filePath) return false;
    try {
      const { error } = await supabase.storage
        .from(CHAT_STORAGE_BUCKET)
        .remove([filePath]);

      if (error) {
        console.warn('Error removing attachment from storage:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Exception removing attachment from storage:', err);
      return false;
    }
  },

  /**
   * Securely uploads an attachment for a chat channel with size, extension,
   * path traversal, and channel authorization validation.
   * Rolls back the uploaded storage asset if signed URL generation fails.
   */
  async uploadAttachment(
    file: File,
    channelId: string
  ): Promise<{ name: string; size: string; type: string; url?: string; path?: string }> {
    const validation = validateChatFile(file);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid file for upload.');
    }

    if (!channelId || !UUID_REGEX.test(channelId)) {
      throw new Error('Invalid or missing channel ID: must be a valid UUID.');
    }

    const formatSize = (bytes: number): string => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const sanitizedName = sanitizeChatFileName(file.name);
    const filePath = `${channelId}/${Date.now()}-${sanitizedName}`;

    // 1. Upload binary asset to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(CHAT_STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading chat attachment to Supabase Storage:', uploadError);
      if (
        uploadError.message?.toLowerCase().includes('bucket not found') ||
        (uploadError as any).statusCode === '404'
      ) {
        throw new Error(
          `Storage bucket '${CHAT_STORAGE_BUCKET}' does not exist yet. Please run migration 20261029000005_storage_chat_attachments.sql.`
        );
      }
      throw new Error(`Chat attachment upload failed: ${uploadError.message}`);
    }

    // 2. Generate signed URL for authenticated download/preview
    let downloadUrl = '';
    try {
      const { data: signedData, error: signError } = await supabase.storage
        .from(CHAT_STORAGE_BUCKET)
        .createSignedUrl(filePath, 60 * 60 * 24 * 7); // 7-day signed URL

      if (signError) {
        throw signError;
      }

      if (signedData?.signedUrl) {
        downloadUrl = signedData.signedUrl;
      }
    } catch (signErr) {
      console.error('Error generating signed URL, rolling back uploaded storage asset:', signErr);
      let rollbackDetail = '';
      // Compensating cleanup: remove uploaded asset from storage
      try {
        const { error: cleanupError } = await supabase.storage.from(CHAT_STORAGE_BUCKET).remove([filePath]);
        if (cleanupError) {
          rollbackDetail = ` (Compensating storage cleanup also failed: ${cleanupError.message})`;
        }
      } catch (cleanupErr) {
        console.warn('Storage rollback cleanup error:', cleanupErr);
        rollbackDetail = ` (Compensating storage cleanup error: ${cleanupErr instanceof Error ? cleanupErr.message : String(cleanupErr)})`;
      }
      throw new Error(`Failed to generate secure URL for uploaded attachment${rollbackDetail}. Upload has been cancelled.`);
    }

    return {
      name: file.name,
      size: formatSize(file.size),
      type: file.type || 'application/octet-stream',
      url: downloadUrl,
      path: filePath,
    };
  },

  /**
   * Safely downloads an attachment by generating a short-lived signed URL (if path present)
   * or using the stored URL, fetching as a blob with fallback.
   */
  async downloadAttachment(attachment: { name: string; url?: string; path?: string }): Promise<void> {
    let downloadUrl = attachment.url;

    if (attachment.path) {
      const freshSignedUrl = await this.getSignedUrl(attachment.path, 600); // 10 minutes
      if (freshSignedUrl) {
        downloadUrl = freshSignedUrl;
      }
    }

    if (!downloadUrl) {
      throw new Error('Download URL could not be generated. Storage may be unavailable or attachment was removed.');
    }

    try {
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`Download request failed with status: ${response.statusText}`);
      }
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = attachment.name;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.warn('Direct blob fetch failed, falling back to window navigation:', err);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.download = attachment.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  },

  subscribeToMessages(
    channelId: string,
    onInsert: (message: ChatMessage) => void,
    onUpdate: (message: ChatMessage) => void,
    onDelete: (messageId: string) => void,
    currentUserId?: string
  ): () => void {
    const subChannel = supabase
      .channel(`chat-channel-${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload: any) => {
          const row = payload.new as unknown as DbMessage;
          if (!row || !row.id) return;

          try {
            const { data } = await supabase
              .from('messages')
              .select(`
                id,
                channel_id,
                sender_id,
                text,
                attachments,
                reactions,
                created_at,
                sender_profile:sender_id(id, full_name, email, avatar_url)
              `)
              .eq('id', row.id)
              .maybeSingle();

            if (data) {
              onInsert(mapSupabaseMessage(data as unknown as DbMessage, currentUserId));
            } else {
              onInsert(mapSupabaseMessage(row, currentUserId));
            }
          } catch {
            onInsert(mapSupabaseMessage(row, currentUserId));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload: any) => {
          const row = payload.new as unknown as DbMessage;
          if (!row || !row.id) return;

          try {
            const { data } = await supabase
              .from('messages')
              .select(`
                id,
                channel_id,
                sender_id,
                text,
                attachments,
                reactions,
                created_at,
                sender_profile:sender_id(id, full_name, email, avatar_url)
              `)
              .eq('id', row.id)
              .maybeSingle();

            if (data) {
              onUpdate(mapSupabaseMessage(data as unknown as DbMessage, currentUserId));
            } else {
              onUpdate(mapSupabaseMessage(row, currentUserId));
            }
          } catch {
            onUpdate(mapSupabaseMessage(row, currentUserId));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload: any) => {
          const oldRow = payload.old as { id?: string } | undefined;
          if (oldRow?.id) {
            onDelete(oldRow.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subChannel);
    };
  },

  subscribeToPresence(
    roomId: string,
    user: { id: string; name: string },
    onCountChange: (count: number) => void
  ): () => void {
    const presenceChannel = supabase.channel(`presence-${roomId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const uniqueUsers = Object.keys(state).length;
        onCountChange(uniqueUsers);
      })
      .on('presence', { event: 'join' }, () => {
        const state = presenceChannel.presenceState();
        onCountChange(Object.keys(state).length);
      })
      .on('presence', { event: 'leave' }, () => {
        const state = presenceChannel.presenceState();
        onCountChange(Object.keys(state).length);
      })
      .subscribe(async (status: any) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: user.id,
            name: user.name,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  },
};
