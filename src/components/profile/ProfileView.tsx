import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Shield, CheckCircle2, Clock, Users, CalendarCheck, Edit3, Camera } from 'lucide-react';

export const ProfileView: React.FC = () => {
  const {
    user,
    setCurrentView,
    teams,
    tasks,
    dailyLogs,
    isLoadingTasks,
    isLoadingDailyLogs,
    isLoadingTeams,
  } = useApp();

  // Safely calculate real metrics from existing loaded application state
  const completedTasksCount = useMemo(() => {
    if (!user?.id || !Array.isArray(tasks)) return 0;
    return tasks.filter(
      (t) => t.status === 'completed' && (!t.assignedToId || t.assignedToId === user.id || t.createdBy === user.id)
    ).length;
  }, [tasks, user?.id]);

  const activeTeamsCount = useMemo(() => {
    return Array.isArray(teams) ? teams.length : 0;
  }, [teams]);

  const totalLogsCount = useMemo(() => {
    return Array.isArray(dailyLogs) ? dailyLogs.length : 0;
  }, [dailyLogs]);

  const totalHoursLogged = useMemo(() => {
    if (!Array.isArray(dailyLogs)) return 0;
    return dailyLogs.reduce((acc, log) => {
      const h = Number(log.hoursWorked);
      return acc + (isNaN(h) || h < 0 ? 0 : h);
    }, 0);
  }, [dailyLogs]);

  const formattedHours = useMemo(() => {
    if (totalHoursLogged === 0) return '0h';
    return totalHoursLogged % 1 === 0 ? `${totalHoursLogged}h` : `${totalHoursLogged.toFixed(1)}h`;
  }, [totalHoursLogged]);

  // Derive real recent activities from existing daily logs and tasks (most recent first)
  const recentActivities = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      detail: string;
      timestamp: string;
      sortKey: string;
    }> = [];

    // Add recent daily logs
    if (Array.isArray(dailyLogs)) {
      dailyLogs.slice(0, 5).forEach((log) => {
        list.push({
          id: `log-${log.id}`,
          title: 'Submitted daily work log:',
          detail: `${log.hoursWorked}h logged${log.subgroup ? ` • ${log.subgroup}` : ''}`,
          timestamp: log.date || 'Recently',
          sortKey: log.date || '',
        });
      });
    }

    // Add recent completed or created tasks
    if (Array.isArray(tasks)) {
      tasks.slice(0, 5).forEach((t) => {
        const isCompleted = t.status === 'completed';
        const dateStr = t.completedAt ? t.completedAt.split('T')[0] : (t.dueDate || '');
        list.push({
          id: `task-${t.id}`,
          title: isCompleted ? 'Completed task:' : 'Created task:',
          detail: `"${t.title}"`,
          timestamp: dateStr ? (isCompleted ? `Completed ${dateStr}` : `Due ${dateStr}`) : 'Task active',
          sortKey: dateStr,
        });
      });
    }

    // Sort descending by date/key and take top 4 items
    list.sort((a, b) => b.sortKey.localeCompare(a.sortKey));
    return list.slice(0, 4);
  }, [dailyLogs, tasks]);

  const isLoadingStats = isLoadingTasks || isLoadingDailyLogs || isLoadingTeams;

  if (!user) {
    return (
      <div className="p-8 max-w-md mx-auto text-center space-y-4">
        <h2 className="text-xl font-bold text-[#171717] dark:text-[#FAFAFA]">Not Signed In</h2>
        <p className="text-xs text-[#737373] dark:text-[#A3A3A3]">Please sign in to view your profile details.</p>
        <button
          onClick={() => setCurrentView('login')}
          className="px-4 py-2 rounded-xl bg-[#F97316] text-white font-bold text-xs hover:bg-[#EA580C] dark:hover:bg-[#FB923C] transition"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=f97316&color=fff`;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 animate-fade-in font-sans">
      {/* PROFILE HEADER CARD */}
      <div className="bg-white dark:bg-[#141414] rounded-3xl p-6 md:p-8 border border-[#E5E5E5] dark:border-[#333333] shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative group">
            <img
              src={user?.avatar || fallbackAvatar}
              alt={user?.name || 'User'}
              className="w-24 h-24 rounded-full object-cover ring-4 ring-orange-500/30"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = fallbackAvatar;
              }}
            />
            <button
              onClick={() => setCurrentView('settings')}
              className="absolute bottom-0 right-0 p-2 rounded-full bg-[#F97316] text-white shadow-sm hover:bg-[#EA580C] transition-colors"
              title="Change Profile Photo in Settings"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-extrabold text-[#171717] dark:text-[#FAFAFA]">{user?.name || 'User'}</h1>
                <p className="text-xs text-[#737373] dark:text-[#A3A3A3]">{user?.email || ''}</p>
              </div>

              <button
                onClick={() => setCurrentView('settings')}
                className="px-4 py-2 rounded-xl bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800 text-[#F97316] font-bold text-xs hover:bg-orange-100 dark:hover:bg-orange-900/60 flex items-center gap-1.5 self-center sm:self-auto transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Profile
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2 text-xs font-semibold">
              <span className="px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950 text-[#F97316] uppercase tracking-wider text-[10px] font-extrabold flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> {user?.role ? user.role.replace('_', ' ') : 'member'}
              </span>
              <span className="text-[#737373] dark:text-[#A3A3A3]">•</span>
              <span className="text-[#737373] dark:text-[#A3A3A3]">{user?.department || 'General'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* USER METRICS & STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Metric 1: Tasks Completed */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#333333] shadow-sm space-y-1">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <div className="text-2xl font-extrabold text-[#171717] dark:text-[#FAFAFA] min-h-[2rem] flex items-center">
            {isLoadingStats ? (
              <span className="h-6 w-10 bg-[#FAFAFA] dark:bg-[#1C1C1C] rounded animate-pulse" />
            ) : (
              completedTasksCount
            )}
          </div>
          <div className="text-xs text-[#737373] dark:text-[#A3A3A3]">Tasks Completed</div>
        </div>

        {/* Metric 2: Active Teams */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#333333] shadow-sm space-y-1">
          <Users className="w-5 h-5 text-[#F97316]" />
          <div className="text-2xl font-extrabold text-[#171717] dark:text-[#FAFAFA] min-h-[2rem] flex items-center">
            {isLoadingStats ? (
              <span className="h-6 w-10 bg-[#FAFAFA] dark:bg-[#1C1C1C] rounded animate-pulse" />
            ) : (
              activeTeamsCount
            )}
          </div>
          <div className="text-xs text-[#737373] dark:text-[#A3A3A3]">Active Teams</div>
        </div>

        {/* Metric 3: Daily Logs Submitted */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#333333] shadow-sm space-y-1">
          <CalendarCheck className="w-5 h-5 text-[#F97316]" />
          <div className="text-2xl font-extrabold text-[#171717] dark:text-[#FAFAFA] min-h-[2rem] flex items-center">
            {isLoadingStats ? (
              <span className="h-6 w-10 bg-[#FAFAFA] dark:bg-[#1C1C1C] rounded animate-pulse" />
            ) : (
              totalLogsCount
            )}
          </div>
          <div className="text-xs text-[#737373] dark:text-[#A3A3A3]">Daily Logs Submitted</div>
        </div>

        {/* Metric 4: Work Hours Logged */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#333333] shadow-sm space-y-1">
          <Clock className="w-5 h-5 text-amber-500" />
          <div className="text-2xl font-extrabold text-[#171717] dark:text-[#FAFAFA] min-h-[2rem] flex items-center">
            {isLoadingStats ? (
              <span className="h-6 w-12 bg-[#FAFAFA] dark:bg-[#1C1C1C] rounded animate-pulse" />
            ) : (
              formattedHours
            )}
          </div>
          <div className="text-xs text-[#737373] dark:text-[#A3A3A3]">Work Hours Logged</div>
        </div>
      </div>

      {/* RECENT ACTIVITY & TEAMS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Teams List */}
        <div className="bg-white dark:bg-[#141414] rounded-3xl p-6 border border-[#E5E5E5] dark:border-[#333333] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#171717] dark:text-[#FAFAFA]">Assigned Teams</h3>
            <span className="text-xs text-[#737373] dark:text-[#A3A3A3] font-medium">
              {teams.length} {teams.length === 1 ? 'team' : 'teams'}
            </span>
          </div>

          {teams.length === 0 ? (
            <div className="py-8 text-center text-[#737373] dark:text-[#A3A3A3] space-y-1.5">
              <Users className="w-8 h-8 mx-auto text-[#737373] dark:text-[#A3A3A3]" />
              <p className="text-xs font-semibold text-[#171717] dark:text-[#FAFAFA]">No teams assigned yet</p>
              <p className="text-[11px] text-[#737373] dark:text-[#A3A3A3]">
                Create a new team or join an existing team to see it here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {teams.map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    setCurrentView('team_workspace');
                  }}
                  className="p-3.5 rounded-2xl bg-[#FAFAFA] dark:bg-[#1C1C1C] border border-[#E5E5E5] dark:border-[#333333] hover:border-[#F97316]/50 flex items-center justify-between text-xs transition-colors cursor-pointer"
                >
                  <div className="min-w-0 pr-3">
                    <div className="font-bold text-[#171717] dark:text-[#FAFAFA] truncate">{t.name}</div>
                    <div className="text-[#737373] dark:text-[#A3A3A3] truncate">
                      {t.subgroups?.length || 0} Subgroups • {t.memberCount || 1} Members
                    </div>
                  </div>
                  <span className="font-bold text-[#F97316] shrink-0">
                    {t.projectProgress || 0}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity Log */}
        <div className="bg-white dark:bg-[#141414] rounded-3xl p-6 border border-[#E5E5E5] dark:border-[#333333] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#171717] dark:text-[#FAFAFA]">Recent Activity</h3>
            {recentActivities.length > 0 && (
              <span className="text-xs text-[#737373] dark:text-[#A3A3A3] font-medium">Latest actions</span>
            )}
          </div>

          {isLoadingStats ? (
            <div className="space-y-3 py-2">
              <div className="h-12 bg-[#FAFAFA] dark:bg-[#1C1C1C] rounded-xl animate-pulse" />
              <div className="h-12 bg-[#FAFAFA] dark:bg-[#1C1C1C] rounded-xl animate-pulse" />
            </div>
          ) : recentActivities.length === 0 ? (
            <div className="py-8 text-center text-[#737373] dark:text-[#A3A3A3] space-y-1.5">
              <Clock className="w-8 h-8 mx-auto text-[#737373] dark:text-[#A3A3A3]" />
              <p className="text-xs font-semibold text-[#171717] dark:text-[#FAFAFA]">No recent activity</p>
              <p className="text-[11px] text-[#737373] dark:text-[#A3A3A3] max-w-xs mx-auto">
                Your recent daily logs and task deliverables will appear here as you work.
              </p>
            </div>
          ) : (
            <div className="space-y-3 text-xs text-[#737373] dark:text-[#A3A3A3]">
              {recentActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded-xl bg-[#FAFAFA] dark:bg-[#1C1C1C] border border-[#E5E5E5] dark:border-[#333333] flex flex-col justify-between gap-1"
                >
                  <div>
                    <span className="font-bold text-[#171717] dark:text-[#FAFAFA]">{act.title}</span>{' '}
                    <span className="text-[#171717] dark:text-[#FAFAFA]">{act.detail}</span>
                  </div>
                  <div className="text-[10px] text-[#737373] dark:text-[#A3A3A3]">{act.timestamp}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
