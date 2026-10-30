import { supabase, isClerkAuthMode } from '../lib/supabase';
import type { Meeting, MeetingParticipant, MeetingType } from '../types';

export interface CreateMeetingParams {
  title: string;
  description?: string;
  meetingDate: string; // YYYY-MM-DD or parseable date string
  meetingTime: string; // HH:MM or HH:MM:SS or 12hr AM/PM
  durationMinutes: number; // e.g. 15, 30, 45, 60, 90
  type: MeetingType;
  teamId?: string;
  participantIds?: string[];
}

/**
 * Normalizes input date strings into PostgreSQL-compatible 'YYYY-MM-DD'.
 * Handles 'Today', 'Tomorrow', ISO strings, or standard date formats.
 */
export const normalizeMeetingDate = (dateStr: string): string => {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  const trimmed = dateStr.trim().toLowerCase();
  const now = new Date();
  if (trimmed === 'today') {
    return now.toISOString().split('T')[0];
  }
  if (trimmed === 'tomorrow') {
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return tomorrow.toISOString().split('T')[0];
  }
  // Check if already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  // Attempt Date parsing
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  return now.toISOString().split('T')[0];
};

/**
 * Normalizes input time strings into PostgreSQL-compatible 'HH:MM:00' (24-hour).
 * Handles '14:30', '14:30:00', '02:30 PM', '2:30 PM', '9:00 AM', etc.
 */
export const normalizeMeetingTime = (timeStr: string): string => {
  if (!timeStr) return '10:00:00';
  const trimmed = timeStr.trim();

  // Match 12-hour AM/PM e.g. "03:00 PM", "3:00pm", "11:30 AM"
  const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)$/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = ampmMatch[2];
    const isPm = ampmMatch[4].toLowerCase() === 'pm';
    if (isPm && hours < 12) hours += 12;
    if (!isPm && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${minutes}:00`;
  }

  // Match 24-hour "HH:MM"
  if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
    const [h, m] = trimmed.split(':');
    return `${h.padStart(2, '0')}:${m}:00`;
  }

  // Match 24-hour "HH:MM:SS"
  if (/^\d{1,2}:\d{2}:\d{2}$/.test(trimmed)) {
    const [h, m, s] = trimmed.split(':');
    return `${h.padStart(2, '0')}:${m}:${s}`;
  }

  return '10:00:00';
};

/**
 * Extracts a clear diagnostic error message from Supabase / PostgREST errors.
 * Preserves specific PostgreSQL error codes without logging secrets.
 */
export const extractSupabaseErrorMessage = (err: unknown, defaultMessage: string): string => {
  if (!err) return defaultMessage;
  if (typeof err === 'object') {
    const e = err as Record<string, any>;
    if (e.code === '42P17') {
      return 'Database policy recursion error (42P17): RLS policies between meetings and participants are recursively referencing each other. Please apply migration 20261029000006.';
    }
    if (e.code === '42501') {
      return 'Database permission error (42501): Row-level security prevented creating the meeting. Ensure you are signed in.';
    }
    if (e.code === '22007') {
      return 'Invalid date/time format (22007). Please choose a valid meeting date and time.';
    }
    if (e.code === '23503') {
      return `Foreign key constraint violation (23503): ${e.message || 'Related team or user record not found.'}`;
    }
    if (e.message && typeof e.message === 'string') {
      return e.message;
    }
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return defaultMessage;
};

/**
 * Returns a stable, unique, alphanumeric room identifier for Jitsi Meet.
 * Safe for public and private Jitsi instances.
 */
export const getJitsiRoomName = (meetingId: string): string => {
  const cleanId = meetingId.replace(/[^a-zA-Z0-9]/g, '');
  return `WorkNest-${cleanId}`;
};

/**
 * Returns the configured Jitsi domain, defaulting to the public 'meet.jit.si' instance.
 */
export const getJitsiDomain = (): string => {
  return (import.meta.env.VITE_JITSI_DOMAIN as string) || 'meet.jit.si';
};

/**
 * Returns the complete URL for a Jitsi conference room.
 */
export const getJitsiMeetingUrl = (roomName: string): string => {
  const domain = getJitsiDomain();
  return `https://${domain}/${encodeURIComponent(roomName)}`;
};

/**
 * Maps a Supabase meeting row with joined organizer, team, and participants to the WorkNest Meeting model.
 */
export const mapSupabaseMeeting = (m: any): Meeting => {
  const org = m.organizer;
  const orgName = org?.full_name || (org?.email ? org.email.split('@')[0] : 'WorkNest Member');
  const orgAvatar =
    org?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(orgName)}&background=f97316&color=fff`;

  // Map participants from meeting_participants join
  const rawParticipants: any[] = Array.isArray(m.participants) ? m.participants : [];
  const participants: MeetingParticipant[] = rawParticipants.map((p) => {
    const prof = p.profile;
    const pName = prof?.full_name || (prof?.email ? prof.email.split('@')[0] : 'Participant');
    const pAvatar =
      prof?.avatar_url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(pName)}&background=f97316&color=fff`;
    return {
      id: p.id,
      userId: p.user_id,
      name: pName,
      email: prof?.email,
      avatar: pAvatar,
      status: p.status,
    };
  });

  // Ensure organizer is represented in participants list
  if (m.organizer_id && !participants.some((p) => p.userId === m.organizer_id)) {
    participants.unshift({
      userId: m.organizer_id,
      name: orgName,
      avatar: orgAvatar,
      status: 'accepted',
    });
  }

  const durationNum = typeof m.duration === 'number' ? m.duration : 30;

  // Determine if the meeting is in the past
  let isPast = false;
  try {
    if (m.meeting_date && m.meeting_time) {
      const timePart = m.meeting_time.substring(0, 5);
      const dtString = `${m.meeting_date}T${timePart}:00`;
      const startMs = new Date(dtString).getTime();
      if (!isNaN(startMs)) {
        const endMs = startMs + durationNum * 60 * 1000;
        isPast = endMs < Date.now();
      }
    }
  } catch {
    // If parse fails, leave isPast as false
  }

  const roomName = getJitsiRoomName(m.id);

  return {
    id: m.id,
    title: m.title || 'WorkNest Meeting',
    date: m.meeting_date || '',
    time: m.meeting_time ? m.meeting_time.substring(0, 5) : '',
    duration: `${durationNum} mins`,
    durationMinutes: durationNum,
    organizer: orgName,
    organizerId: m.organizer_id,
    organizerAvatar: orgAvatar,
    type: (m.type as MeetingType) || 'Video Conference',
    description: m.description || '',
    teamId: m.team_id || undefined,
    teamName: m.team?.name || undefined,
    participants,
    roomName,
    isPast,
    createdAt: m.created_at,
  };
};

export const meetingService = {
  /**
   * Fetch meetings visible to the authenticated user from Supabase.
   */
  async fetchUserMeetings(): Promise<Meeting[]> {
    const { data, error } = await supabase
      .from('meetings')
      .select(`
        id,
        team_id,
        organizer_id,
        title,
        description,
        meeting_date,
        meeting_time,
        duration,
        type,
        created_at,
        updated_at,
        organizer:organizer_id(id, full_name, email, avatar_url),
        team:team_id(id, name),
        participants:meeting_participants(
          id,
          user_id,
          status,
          profile:user_id(id, full_name, email, avatar_url)
        )
      `)
      .order('meeting_date', { ascending: true })
      .order('meeting_time', { ascending: true });

    if (error) {
      console.error('[MeetingService] Error fetching meetings from Supabase:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      throw error;
    }

    return (data || []).map(mapSupabaseMeeting);
  },

  /**
   * Fetch a single meeting by its ID with all related organizer & participants data.
   */
  async fetchMeetingById(meetingId: string): Promise<Meeting | null> {
    const { data, error } = await supabase
      .from('meetings')
      .select(`
        id,
        team_id,
        organizer_id,
        title,
        description,
        meeting_date,
        meeting_time,
        duration,
        type,
        created_at,
        updated_at,
        organizer:organizer_id(id, full_name, email, avatar_url),
        team:team_id(id, name),
        participants:meeting_participants(
          id,
          user_id,
          status,
          profile:user_id(id, full_name, email, avatar_url)
        )
      `)
      .eq('id', meetingId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Row not found
      console.error('[MeetingService] Error fetching meeting by id:', {
        code: error.code,
        message: error.message,
        details: error.details,
      });
      throw error;
    }

    return data ? mapSupabaseMeeting(data) : null;
  },

  /**
   * Schedule a new persistent meeting in Supabase and add participants.
   * Generates a stable client-side UUID to insert cleanly without relying
   * on recursive RETURNING evaluation, preventing duplicate rows on retry.
   */
  async createMeeting(
    params: CreateMeetingParams,
    organizerId: string,
    organizerProfile?: { name?: string; email?: string; avatar?: string }
  ): Promise<Meeting> {
    let effectiveOrganizerId: string | undefined = organizerId;
    if (!effectiveOrganizerId && !isClerkAuthMode) {
      const { data: authData } = await supabase.auth.getUser();
      effectiveOrganizerId = authData?.user?.id;
    }
    if (!effectiveOrganizerId) {
      throw new Error('Organizer ID is required to schedule a meeting.');
    }

    const formattedDate = normalizeMeetingDate(params.meetingDate);
    const formattedTime = normalizeMeetingTime(params.meetingTime);
    const durationNum = params.durationMinutes || 30;
    const meetingTitle = params.title.trim();
    const meetingDesc = params.description?.trim() || '';
    const meetingType = params.type || 'Video Conference';

    // Generate client-side UUID so we know the record ID before inserting
    const meetingId = crypto.randomUUID();
    const roomName = getJitsiRoomName(meetingId);

    // 1. Insert primary meeting record into Supabase
    // Inserting without .select('id') sends 'return=minimal' to PostgREST,
    // avoiding the evaluation of the recursive SELECT policy on meetings
    const { error: insertError } = await supabase
      .from('meetings')
      .insert({
        id: meetingId,
        organizer_id: effectiveOrganizerId,
        team_id: params.teamId || null,
        title: meetingTitle,
        description: meetingDesc,
        meeting_date: formattedDate,
        meeting_time: formattedTime,
        duration: durationNum,
        type: meetingType,
      });

    if (insertError) {
      console.error('[MeetingService] Failed to insert meeting in Supabase:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
      });
      const descriptiveMsg = extractSupabaseErrorMessage(
        insertError,
        'Failed to schedule meeting.'
      );
      throw new Error(descriptiveMsg);
    }

    // 2. Insert participants if any were specified (excluding organizer)
    const distinctParticipantIds = Array.from(
      new Set((params.participantIds || []).filter((pid) => pid && pid !== organizerId))
    );

    if (distinctParticipantIds.length > 0) {
      const participantRows = distinctParticipantIds.map((userId) => ({
        meeting_id: meetingId,
        user_id: userId,
        status: 'invited' as const,
      }));

      const { error: partError } = await supabase
        .from('meeting_participants')
        .insert(participantRows);

      if (partError) {
        console.warn('[MeetingService] Could not insert some meeting participants:', {
          code: partError.code,
          message: partError.message,
          hint: partError.hint,
        });
        // Non-fatal: the meeting row itself was already persisted
      }
    }

    // 3. Re-query full joined meeting from Supabase or construct resilient fallback
    try {
      const fullMeeting = await this.fetchMeetingById(meetingId);
      if (fullMeeting) return fullMeeting;
    } catch (reQueryErr) {
      console.warn(
        '[MeetingService] Meeting created (id: %s) but re-query encountered an issue: %o. Using constructed model.',
        meetingId,
        reQueryErr
      );
    }

    // Fallback: Construct valid Meeting object from verified inserted parameters
    const orgName = organizerProfile?.name || 'WorkNest Member';
    const orgAvatar =
      organizerProfile?.avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(orgName)}&background=f97316&color=fff`;

    const fallbackParticipants: MeetingParticipant[] = [
      {
        userId: organizerId,
        name: orgName,
        avatar: orgAvatar,
        status: 'accepted',
      },
      ...distinctParticipantIds.map((pid) => ({
        userId: pid,
        name: 'Invited Member',
        avatar: `https://ui-avatars.com/api/?name=Member&background=f97316&color=fff`,
        status: 'invited' as const,
      })),
    ];

    return {
      id: meetingId,
      title: meetingTitle,
      date: formattedDate,
      time: formattedTime.substring(0, 5),
      duration: `${durationNum} mins`,
      durationMinutes: durationNum,
      organizer: orgName,
      organizerId,
      organizerAvatar: orgAvatar,
      type: meetingType,
      description: meetingDesc,
      teamId: params.teamId || undefined,
      participants: fallbackParticipants,
      roomName,
      isPast: false,
      createdAt: new Date().toISOString(),
    };
  },

  /**
   * Cancel/delete a meeting from Supabase.
   * Cascade-deletes participant records automatically via database foreign key.
   */
  async cancelMeeting(meetingId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('meetings')
      .delete()
      .eq('id', meetingId)
      .select('id');

    if (error) {
      console.error('[MeetingService] Error cancelling meeting:', {
        code: error.code,
        message: error.message,
        details: error.details,
      });
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error('Meeting could not be cancelled. It may not exist or you do not have permission to cancel it.');
    }

    return true;
  },

  /**
   * Subscribe to Supabase Realtime changes for meetings and participants.
   */
  subscribeToMeetings(onChange: () => void): () => void {
    const channelName = `meetings-realtime-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meetings' },
        () => {
          onChange();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meeting_participants' },
        () => {
          onChange();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};


