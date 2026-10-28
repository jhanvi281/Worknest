import React from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, CheckSquare, MessageSquare, FileText, Video, Sparkles, CheckCheck } from 'lucide-react';

export const NotificationsView: React.FC = () => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead, setCurrentView } = useApp();

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'task':
        return <CheckSquare className="w-4 h-4 text-indigo-500" />;
      case 'chat':
        return <MessageSquare className="w-4 h-4 text-purple-500" />;
      case 'file':
        return <FileText className="w-4 h-4 text-cyan-500" />;
      case 'meeting':
        return <Video className="w-4 h-4 text-emerald-500" />;
      case 'ai':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Notification Center
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Stay informed about your assigned tasks, team chat, meetings, and AI insights.
          </p>
        </div>

        <button
          onClick={markAllNotificationsAsRead}
          className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-50 flex items-center gap-1.5 transition"
        >
          <CheckCheck className="w-4 h-4 text-indigo-600" /> Mark all as read
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        {notifications.map((item) => (
          <div
            key={item.id}
            onClick={() => {
              markNotificationAsRead(item.id);
              if (item.linkView) setCurrentView(item.linkView);
            }}
            className={`p-4 md:p-5 flex items-start gap-4 cursor-pointer transition ${
              item.isRead
                ? 'opacity-75 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                : 'bg-indigo-50/40 dark:bg-indigo-950/30 hover:bg-indigo-50/70'
            }`}
          >
            <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 shadow-sm shrink-0">
              {getCategoryIcon(item.category)}
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</h3>
                <span className="text-[10px] text-slate-400">{item.timestamp}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{item.message}</p>
            </div>

            {!item.isRead && <div className="w-2 h-2 rounded-full bg-indigo-600 mt-2 shrink-0" />}
          </div>
        ))}
      </div>
    </div>
  );
};
