import { supabase, isClerkAuthMode } from '../lib/supabase';
import type { DailyLog } from '../types';

export const mapSupabaseDailyLog = (l: any): DailyLog => {
  const profile = l.user_profile;
  const name = profile?.full_name || (profile?.email ? profile.email.split('@')[0] : 'User');
  const avatar =
    profile?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=f97316&color=fff`;

  return {
    id: l.id,
    userId: l.user_id,
    userName: name,
    userAvatar: avatar,
    subgroup: l.subgroup?.name || 'Development',
    subgroupId: l.subgroup_id || undefined,
    teamId: l.team_id || undefined,
    date: l.date,
    hoursWorked: Number(l.hours_worked || 0),
    workCompleted: l.work_completed || '',
    challengesFaced: l.challenges_faced || '',
    planForTomorrow: l.plan_for_tomorrow || '',
    status: l.status || 'submitted',
  };
};

export const dailyLogService = {
  async fetchUserDailyLogs(userId: string): Promise<DailyLog[]> {
    const { data, error } = await supabase
      .from('daily_logs')
      .select(`
        id,
        user_id,
        team_id,
        subgroup_id,
        date,
        hours_worked,
        work_completed,
        challenges_faced,
        plan_for_tomorrow,
        status,
        created_at,
        user_profile:user_id(id, full_name, email, avatar_url),
        subgroup:subgroup_id(id, name)
      `)
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching daily logs from Supabase:', error);
      throw error;
    }

    return (data || []).map(mapSupabaseDailyLog);
  },

  async createOrUpdateDailyLog(
    newLog: {
      hoursWorked: number;
      workCompleted: string;
      challengesFaced?: string;
      planForTomorrow?: string;
      date?: string;
      teamId?: string;
      subgroupId?: string;
    },
    userId: string
  ): Promise<DailyLog> {
    let effectiveUserId: string | undefined = userId;
    if (!effectiveUserId && !isClerkAuthMode) {
      const { data: authData } = await supabase.auth.getUser();
      effectiveUserId = authData?.user?.id;
    }
    if (!effectiveUserId) {
      throw new Error('Authentication required to submit a daily log.');
    }

    const targetDate = newLog.date || new Date().toISOString().split('T')[0];

    // Check if user already submitted a log for targetDate
    const { data: existing } = await supabase
      .from('daily_logs')
      .select('id')
      .eq('user_id', effectiveUserId)
      .eq('date', targetDate)
      .maybeSingle();

    if (existing) {
      // Update existing log row for today
      const dbUpdates: any = {
        hours_worked: newLog.hoursWorked,
        work_completed: newLog.workCompleted.trim(),
        challenges_faced: newLog.challengesFaced?.trim() || '',
        plan_for_tomorrow: newLog.planForTomorrow?.trim() || '',
        status: 'submitted',
        updated_at: new Date().toISOString(),
      };
      if (newLog.teamId) dbUpdates.team_id = newLog.teamId;
      if (newLog.subgroupId) dbUpdates.subgroup_id = newLog.subgroupId;

      const { data, error } = await supabase
        .from('daily_logs')
        .update(dbUpdates)
        .eq('id', existing.id)
        .select(`
          id,
          user_id,
          team_id,
          subgroup_id,
          date,
          hours_worked,
          work_completed,
          challenges_faced,
          plan_for_tomorrow,
          status,
          created_at,
          user_profile:user_id(id, full_name, email, avatar_url),
          subgroup:subgroup_id(id, name)
        `)
        .single();

      if (error) {
        console.error('Error updating daily log in Supabase:', error);
        throw error;
      }
      return mapSupabaseDailyLog(data);
    } else {
      // Insert new log row
      const payload: any = {
        user_id: effectiveUserId,
        team_id: newLog.teamId || null,
        subgroup_id: newLog.subgroupId || null,
        date: targetDate,
        hours_worked: newLog.hoursWorked,
        work_completed: newLog.workCompleted.trim(),
        challenges_faced: newLog.challengesFaced?.trim() || '',
        plan_for_tomorrow: newLog.planForTomorrow?.trim() || '',
        status: 'submitted',
      };

      const { data, error } = await supabase
        .from('daily_logs')
        .insert(payload)
        .select(`
          id,
          user_id,
          team_id,
          subgroup_id,
          date,
          hours_worked,
          work_completed,
          challenges_faced,
          plan_for_tomorrow,
          status,
          created_at,
          user_profile:user_id(id, full_name, email, avatar_url),
          subgroup:subgroup_id(id, name)
        `)
        .single();

      if (error) {
        console.error('Error creating daily log in Supabase:', error);
        throw error;
      }
      return mapSupabaseDailyLog(data);
    }
  },

  async updateDailyLog(logId: string, updates: Partial<DailyLog>): Promise<DailyLog> {
    const dbUpdates: any = {
      updated_at: new Date().toISOString(),
    };
    if (updates.hoursWorked !== undefined) dbUpdates.hours_worked = updates.hoursWorked;
    if (updates.workCompleted !== undefined) dbUpdates.work_completed = updates.workCompleted.trim();
    if (updates.challengesFaced !== undefined) dbUpdates.challenges_faced = updates.challengesFaced.trim();
    if (updates.planForTomorrow !== undefined) dbUpdates.plan_for_tomorrow = updates.planForTomorrow.trim();
    if (updates.status !== undefined) dbUpdates.status = updates.status;

    const { data, error } = await supabase
      .from('daily_logs')
      .update(dbUpdates)
      .eq('id', logId)
      .select(`
        id,
        user_id,
        team_id,
        subgroup_id,
        date,
        hours_worked,
        work_completed,
        challenges_faced,
        plan_for_tomorrow,
        status,
        created_at,
        user_profile:user_id(id, full_name, email, avatar_url),
        subgroup:subgroup_id(id, name)
      `)
      .single();

    if (error) {
      console.error('Error updating daily log in Supabase:', error);
      throw error;
    }

    return mapSupabaseDailyLog(data);
  },

  async deleteDailyLog(logId: string, userId: string): Promise<void> {
    let effectiveUserId: string | undefined = userId;
    if (!effectiveUserId && !isClerkAuthMode) {
      const { data: authData } = await supabase.auth.getUser();
      effectiveUserId = authData?.user?.id;
    }
    if (!logId || !effectiveUserId) {
      throw new Error('Log ID and authenticated user are required to delete a daily log.');
    }

    const { data, error } = await supabase
      .from('daily_logs')
      .delete()
      .eq('id', logId)
      .eq('user_id', effectiveUserId)
      .select('id');

    if (error) {
      console.error('Error deleting daily log from Supabase:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error('Daily log could not be deleted. It may not exist or you do not have permission to delete it.');
    }
  },
};
