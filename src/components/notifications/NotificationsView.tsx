import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  CheckSquare,
  MessageSquare,
  FileText,
  Video,
  Sparkles,
  CheckCheck,
  Check,
  Trash2,
  RefreshCw,
  AlertCircle,
  FolderOpen,
  ArrowRight,
  Loader2,
} from 'lucide-react';

export const NotificationsView: React.FC = () => {
  const {
    notifications,
    isLoadingNotifications,
    notificationsError,
    unreadNotificationsCount,
    refreshNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    setCurrentView,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'task' | 'system' | 'file' | 'chat'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'task':
        return <CheckSquare className="w-4 h-4 text-[#F97316]" />;
      case 'chat':
        return <MessageSquare className="w-4 h-4 text-[#F97316]" />;
      case 'file':
        return <FileText className="w-4 h-4 text-[#737373] dark:text-[#A3A3A3]" />;
      case 'meeting':
        return <Video className="w-4 h-4 text-emerald-500" />;
      case 'ai':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      default:
        return <Bell className="w-4 h-4 text-[#737373] dark:text-[#A3A3A3]" />;
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshNotifications();
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredNotifications = notifications.filter((item) => {
    if (activeFilter === 'unread') return !item.isRead;
    if (activeFilter !== 'all') return item.category === activeFilter;
    return true;
  });

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#171717] dark:text-[#FAFAFA] tracking-tight">
              Notification Center
            </h1>
            {unreadNotificationsCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-[#F97316] font-bold text-xs">
                {unreadNotificationsCount} new
              </span>
            )}
          </div>
          <p className="text-sm text-[#737373] dark:text-[#A3A3A3] mt-1">
            Stay informed about your assigned tasks, team invites, updates, and system activities.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing || isLoadingNotifications}
            aria-label="Refresh notifications"
            title="Refresh Notifications"
            className="p-2.5 rounded-xl bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#333333] text-[#171717] dark:text-[#FAFAFA] hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C] transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing || isLoadingNotifications ? 'animate-spin text-[#F97316]' : ''}`}
            />
          </button>
          {unreadNotificationsCount > 0 && (
            <button
              type="button"
              onClick={markAllNotificationsAsRead}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#333333] text-[#171717] dark:text-[#FAFAFA] font-semibold text-xs hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C] flex items-center gap-1.5 transition-colors"
            >
              <CheckCheck className="w-4 h-4 text-[#F97316]" />
              <span>Mark all as read</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {notificationsError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between gap-4 text-xs text-rose-700 dark:text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{notificationsError}</span>
          </div>
          <button
            onClick={() => refreshNotifications()}
            className="px-3 py-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 font-semibold hover:bg-rose-200 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#FAFAFA] dark:bg-[#1C1C1C] border border-[#E5E5E5] dark:border-[#333333] text-xs font-semibold overflow-x-auto">
        {[
          { id: 'all', label: 'All' },
          { id: 'unread', label: `Unread (${unreadNotificationsCount})` },
          { id: 'task', label: 'Tasks' },
          { id: 'system', label: 'System & Teams' },
          { id: 'file', label: 'Files' },
          { id: 'chat', label: 'Chat' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-xl capitalize transition-colors shrink-0 ${
              activeFilter === tab.id
                ? 'bg-white dark:bg-[#141414] text-[#F97316] shadow-sm'
                : 'text-[#737373] dark:text-[#A3A3A3] hover:text-[#171717] dark:hover:text-[#FAFAFA]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification List Container */}
      <div className="bg-white dark:bg-[#141414] rounded-3xl border border-[#E5E5E5] dark:border-[#333333] shadow-sm overflow-hidden divide-y divide-[#E5E5E5] dark:divide-[#333333]">
        {isLoadingNotifications ? (
          <div className="p-12 text-center text-[#737373] dark:text-[#A3A3A3] space-y-3">
            <Loader2 className="w-8 h-8 mx-auto text-[#F97316] animate-spin" />
            <div className="text-sm font-semibold text-[#171717] dark:text-[#FAFAFA]">
              Loading notifications...
            </div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="p-4 rounded-3xl bg-[#FAFAFA] dark:bg-[#1C1C1C] inline-block text-[#737373] dark:text-[#A3A3A3]">
              <FolderOpen className="w-10 h-10 mx-auto" />
            </div>
            <div className="text-base font-bold text-[#171717] dark:text-[#FAFAFA]">
              {activeFilter === 'unread' ? 'No unread notifications' : 'No notifications found'}
            </div>
            <p className="text-xs text-[#737373] dark:text-[#A3A3A3] max-w-sm mx-auto">
              {activeFilter === 'unread'
                ? "You're all caught up! There are no unread notifications waiting for your attention."
                : 'New updates about task assignments, team invites, and project activities will appear here.'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                if (!item.isRead) markNotificationAsRead(item.id);
                if (item.linkView) setCurrentView(item.linkView);
              }}
              className={`p-4 md:p-5 flex items-start justify-between gap-4 cursor-pointer transition-colors group ${
                item.isRead
                  ? 'opacity-80 hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C]'
                  : 'bg-orange-50/40 dark:bg-orange-950/20 hover:bg-orange-50/70 dark:hover:bg-orange-950/40'
              }`}
            >
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="p-2.5 rounded-2xl bg-[#FAFAFA] dark:bg-[#1C1C1C] shadow-sm shrink-0 mt-0.5 border border-[#E5E5E5] dark:border-[#333333]">
                  {getCategoryIcon(item.category)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3
                      className={`text-sm font-bold truncate ${
                        item.isRead ? 'text-[#171717] dark:text-[#FAFAFA]' : 'text-[#171717] dark:text-white'
                      }`}
                    >
                      {item.title}
                    </h3>
                    {!item.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#F97316] shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-[#737373] dark:text-[#A3A3A3] mt-1 leading-relaxed break-words">
                    {item.message}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-[#737373] dark:text-[#A3A3A3]">
                    <span>{item.timestamp}</span>
                    {item.linkView && (
                      <span className="inline-flex items-center gap-1 text-[#F97316] font-medium group-hover:underline">
                        <span>Go to {item.linkView.replace('_', ' ')}</span>
                        <ArrowRight className="w-3 h-3 transition group-hover:translate-x-0.5" />
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div
                className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                {!item.isRead && (
                  <button
                    onClick={() => markNotificationAsRead(item.id)}
                    title="Mark as read"
                    className="p-1.5 rounded-lg text-[#737373] dark:text-[#A3A3A3] hover:text-[#F97316] hover:bg-orange-50 dark:hover:bg-orange-950/50 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => deleteNotification(item.id)}
                  title="Dismiss notification"
                  className="p-1.5 rounded-lg text-[#737373] dark:text-[#A3A3A3] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
