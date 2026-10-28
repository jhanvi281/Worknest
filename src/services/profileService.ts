import { supabase } from '../lib/supabase';
import type { UserRole } from '../types';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string;
  department: string;
}

export const profileService = {
  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url, department')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
    return data;
  },

  async updateProfile(
    userId: string,
    updates: Partial<Omit<UserProfile, 'id'>>
  ): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select('id, full_name, email, avatar_url, department')
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
    return data;
  },

  async getUserRole(userId: string): Promise<UserRole> {
    const { data, error } = await supabase
      .from('team_members')
      .select('role')
      .eq('user_id', userId)
      .limit(1);

    if (error) {
      console.error('Error fetching user role:', error);
      return 'member';
    }

    if (data && data.length > 0 && data[0].role) {
      return data[0].role as UserRole;
    }

    return 'member';
  },
};
