import { supabase } from '../lib/supabase';
import type { AppView, NotificationItem } from '../types';

export const formatNotificationTime = (dateStr: string): string => {
  if (!dateStr) return 'Just now';
  const now = new Date();
  const created = new Date(dateStr);
  const diffSec = Math.floor((now.getTime() - created.getTime()) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) {
    const mins = Math.floor(diffSec / 60);
    return `${mins} min${mins > 1 ? 's' : ''} ago`;
  }
  if (diffSec < 86400) {
    const hours = Math.floor(diffSec / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  if (diffSec < 172800) return 'Yesterday';
  if (diffSec < 604800) {
    const days = Math.floor(diffSec / 86400);
    return `${days} days ago`;
  }

  return created.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export const mapSupabaseNotification = (n: any): NotificationItem => {
  return {
    id: n.id,
    title: n.title || 'Notification',
    message: n.message || '',
    timestamp: formatNotificationTime(n.created_at),
    isRead: Boolean(n.is_read),
    category: (n.category as NotificationItem['category']) || 'system',
    linkView: (n.link_view as AppView) || 'notifications',
  };
};

export const notificationService = {
  /**
   * Fetches notifications for the authenticated user ordered by newest first.
   */
  async fetchNotifications(limit = 50): Promise<NotificationItem[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('id, user_id, title, message, is_read, category, link_view, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching notifications from Supabase:', error);
      throw error;
    }

    return (data || []).map(mapSupabaseNotification);
  },

  /**
   * Returns the count of unread notifications for the current user.
   */
  async fetchUnreadCount(): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);

    if (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }

    return count || 0;
  },

  /**
   * Marks a single notification as read.
   */
  async markAsRead(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }

    return true;
  },

  /**
   * Marks all notifications of the authenticated user as read.
   */
  async markAllAsRead(): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }

    return true;
  },

  /**
   * Deletes / dismisses a single notification.
   */
  async deleteNotification(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }

    return true;
  },

  /**
   * Subscribes to Realtime notification changes for the specific user.
   */
  subscribeToNotifications(
    userId: string,
    callbacks: {
      onInsert: (n: NotificationItem) => void;
      onUpdate: (n: NotificationItem) => void;
      onDelete: (id: string) => void;
    }
  ): () => void {
    if (!userId) return () => {};

    const channelName = `user-notifications-${userId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          if (payload.new && (payload.new as any).id) {
            callbacks.onInsert(mapSupabaseNotification(payload.new));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          if (payload.new && (payload.new as any).id) {
            callbacks.onUpdate(mapSupabaseNotification(payload.new));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          if (payload.old && (payload.old as any).id) {
            callbacks.onDelete((payload.old as any).id);
          }
        }
      )
      .subscribe((_status: any, err?: any) => {
        if (err) {
          console.warn(`Notifications Realtime subscription warning [${channelName}]:`, err);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
