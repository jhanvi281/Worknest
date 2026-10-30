import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Video,
  Plus,
  ArrowUpRight,
  Calendar,
  MessageSquare,
  FileText,
  Play,
  Copy,
  Check,
  Shield,
} from 'lucide-react';
import { MetricCard } from '../common/MetricCard';
import { EmptyState } from '../common/EmptyState';
import { getJitsiMeetingUrl } from '../../services/meetingService';
import type { Task, Meeting } from '../../types';

export const Dashboard: React.FC = () => {
  const {
    user,
    tasks,
    teams,
    meetings,
    tasksError,
    teamsError,
    meetingsError,
    refreshTasks,
    refreshTeams,
    refreshMeetings,
    updateTaskStatus,
    setCurrentView,
    setActiveTeamId,
    setIsCreateModalOpen,
    setCreateModalType,
    setActiveVideoMeeting,
    addToast,
  } = useApp();

  const [taskFilter, setTaskFilter] = useState<'all' | 'in_progress' | 'urgent' | 'completed'>('all');
  const [copiedMeetingId, setCopiedMeetingId] = useState<string | null>(null);

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Calculate real metrics from authentic application state
  const totalTasks = tasks.length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const urgentTasks = tasks.filter(
    (t) => (t.priority === 'urgent' || t.priority === 'high') && t.status !== 'completed'
  );
  const activeTeamsCount = teams.length;
  const upcomingMeetings = meetings.filter((m) => !m.isPast);

  // Filter tasks for task overview
  const displayedTasks = tasks.filter((t) => {
    if (taskFilter === 'in_progress') return t.status === 'in_progress';
    if (taskFilter === 'completed') return t.status === 'completed';
    if (taskFilter === 'urgent') return (t.priority === 'urgent' || t.priority === 'high') && t.status !== 'completed';
    return true;
  });

  const handleOpenTeamWorkspace = (teamId: string) => {
    setActiveTeamId(teamId);
    setCurrentView('team_workspace');
  };

  const handleCopyMeetingLink = (roomName: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getJitsiMeetingUrl(roomName);
    navigator.clipboard.writeText(url);
    setCopiedMeetingId(id);
    addToast('Meeting link copied to clipboard', 'info');
    setTimeout(() => setCopiedMeetingId(null), 2000);
  };

  const openCreateModal = (type: 'task' | 'team' | 'meeting' | 'file') => {
    setCreateModalType(type);
    setIsCreateModalOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* 1. Header & Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#E5E5E5] dark:border-[#333333]">
        <div className="space-y-1">
          <div className="text-xs font-bold text-[#F97316] uppercase tracking-wider">
            {todayFormatted}
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#171717] dark:text-[#FAFAFA] tracking-tight">
            {getGreeting()}, {user?.name || 'Team Member'}
          </h1>
          <p className="text-xs sm:text-sm text-[#737373] dark:text-[#A3A3A3]">
            Overview of your active tasks, upcoming conferences, and team deliverables.
          </p>
        </div>

        {/* Primary CTA */}
        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => openCreateModal('task')}
            className="px-4 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] dark:hover:bg-[#FB923C] text-white font-bold text-xs shadow-sm flex items-center gap-2 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Synchronization / Backend Notice Banner if errors exist */}
      {(tasksError || teamsError || meetingsError) && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              {tasksError
                ? `Tasks notice: ${tasksError}`
                : teamsError
                ? `Teams notice: ${teamsError}`
                : `Meetings notice: ${meetingsError}`}
            </span>
          </div>
          <button
            onClick={() => {
              if (tasksError) refreshTasks();
              if (teamsError) refreshTeams();
              if (meetingsError) refreshMeetings();
            }}
            className="px-3 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] self-start sm:self-auto cursor-pointer"
          >
            Retry Sync
          </button>
        </div>
      )}

      {/* 2. Key Metric Cards (Authentic live state only) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        <MetricCard
          label="Total Tasks"
          value={totalTasks}
          icon={CheckSquare}
          subtitle="All assigned tasks"
          onClick={() => setCurrentView('my_tasks')}
        />
        <MetricCard
          label="In Progress"
          value={inProgressTasks}
          icon={Clock}
          subtitle="Currently active"
          badgeType="accent"
          badge={totalTasks > 0 ? `${Math.round((inProgressTasks / totalTasks) * 100)}%` : undefined}
          onClick={() => setCurrentView('my_tasks')}
        />
        <MetricCard
          label="Completed"
          value={completedTasks}
          icon={CheckCircle2}
          subtitle="Successfully closed"
          badgeType="success"
          badge={totalTasks > 0 ? `${Math.round((completedTasks / totalTasks) * 100)}%` : undefined}
          onClick={() => setCurrentView('my_tasks')}
        />
        <MetricCard
          label="Urgent Priority"
          value={urgentTasks.length}
          icon={AlertCircle}
          subtitle="Requires attention"
          badgeType={urgentTasks.length > 0 ? 'warning' : 'default'}
          badge={urgentTasks.length > 0 ? 'Action needed' : 'Clear'}
          onClick={() => setCurrentView('my_tasks')}
        />
        <MetricCard
          label="Active Teams"
          value={activeTeamsCount}
          icon={Users}
          subtitle="Workspaces joined"
          onClick={() => setCurrentView('teams')}
        />
      </div>

      {/* 3. Quick Action Shortcuts Bar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#333333] shadow-sm">
        <div className="text-xs font-semibold text-[#737373] dark:text-[#A3A3A3] mb-3">
          Quick Actions
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
          <button
            type="button"
            onClick={() => openCreateModal('task')}
            className="p-3 rounded-2xl bg-[#FAFAFA] dark:bg-[#1C1C1C] border border-[#E5E5E5] dark:border-[#333333] hover:border-orange-300 dark:hover:border-orange-800 text-left transition flex items-center gap-3 group cursor-pointer"
          >
            <div className="p-2 rounded-xl bg-orange-100/60 dark:bg-orange-950/60 text-[#F97316] group-hover:scale-105 transition-transform">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#171717] dark:text-[#FAFAFA] truncate">New Task</div>
              <div className="text-[10px] text-[#737373] dark:text-[#A3A3A3] truncate">Track deliverable</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => openCreateModal('meeting')}
            className="p-3 rounded-2xl bg-[#FAFAFA] dark:bg-[#1C1C1C] border border-[#E5E5E5] dark:border-[#333333] hover:border-orange-300 dark:hover:border-orange-800 text-left transition flex items-center gap-3 group cursor-pointer"
          >
            <div className="p-2 rounded-xl bg-orange-100/60 dark:bg-orange-950/60 text-[#F97316] group-hover:scale-105 transition-transform">
              <Video className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#171717] dark:text-[#FAFAFA] truncate">Schedule Call</div>
              <div className="text-[10px] text-[#737373] dark:text-[#A3A3A3] truncate">Jitsi HD bridge</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => openCreateModal('team')}
            className="p-3 rounded-2xl bg-[#FAFAFA] dark:bg-[#1C1C1C] border border-[#E5E5E5] dark:border-[#333333] hover:border-orange-300 dark:hover:border-orange-800 text-left transition flex items-center gap-3 group cursor-pointer"
          >
            <div className="p-2 rounded-xl bg-orange-100/60 dark:bg-orange-950/60 text-[#F97316] group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#171717] dark:text-[#FAFAFA] truncate">New Team</div>
              <div className="text-[10px] text-[#737373] dark:text-[#A3A3A3] truncate">Shared workspace</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => openCreateModal('file')}
            className="p-3 rounded-2xl bg-[#FAFAFA] dark:bg-[#1C1C1C] border border-[#E5E5E5] dark:border-[#333333] hover:border-orange-300 dark:hover:border-orange-800 text-left transition flex items-center gap-3 group cursor-pointer"
          >
            <div className="p-2 rounded-xl bg-orange-100/60 dark:bg-orange-950/60 text-[#F97316] group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#171717] dark:text-[#FAFAFA] truncate">Upload File</div>
              <div className="text-[10px] text-[#737373] dark:text-[#A3A3A3] truncate">Project asset</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('chat')}
            className="p-3 rounded-2xl bg-[#FAFAFA] dark:bg-[#1C1C1C] border border-[#E5E5E5] dark:border-[#333333] hover:border-orange-300 dark:hover:border-orange-800 text-left transition flex items-center gap-3 group cursor-pointer col-span-2 sm:col-span-1"
          >
            <div className="p-2 rounded-xl bg-orange-100/60 dark:bg-orange-950/60 text-[#F97316] group-hover:scale-105 transition-transform">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#171717] dark:text-[#FAFAFA] truncate">Team Chat</div>
              <div className="text-[10px] text-[#737373] dark:text-[#A3A3A3] truncate">Realtime channels</div>
            </div>
          </button>
        </div>
      </div>

      {/* 4. Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Left Column (2 Cols): Task Overview & Upcoming Meetings */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          {/* MY TASKS SECTION */}
          <div className="bg-white dark:bg-[#141414] rounded-3xl p-6 border border-[#E5E5E5] dark:border-[#333333] shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#171717] dark:text-[#FAFAFA]">
                  Tasks Overview
                </h2>
                <p className="text-xs text-[#737373] dark:text-[#A3A3A3]">
                  Your direct deliverables and milestone contributions
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Task Filter Pills */}
                <div className="flex items-center p-1 rounded-xl bg-[#FAFAFA] dark:bg-[#1C1C1C] border border-[#E5E5E5] dark:border-[#333333] text-[11px] font-semibold">
                  {(['all', 'in_progress', 'urgent', 'completed'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setTaskFilter(tab)}
                      className={`px-2.5 py-1 rounded-lg capitalize transition cursor-pointer ${
                        taskFilter === tab
                          ? 'bg-white dark:bg-[#141414] text-[#F97316] shadow-xs'
                          : 'text-[#737373] dark:text-[#A3A3A3] hover:text-[#171717] dark:hover:text-[#FAFAFA]'
                      }`}
                    >
                      {tab.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentView('my_tasks')}
                  className="text-xs font-semibold text-[#F97316] hover:text-[#EA580C] hover:underline flex items-center gap-1 shrink-0 ml-1 cursor-pointer"
                >
                  <span>View all</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {displayedTasks.length === 0 ? (
              <EmptyState
                icon={CheckSquare}
                title="No tasks match this filter"
                description={
                  taskFilter === 'all'
                    ? "You don't have any tasks assigned yet. Create a task to track deliverables."
                    : `No tasks currently in the "${taskFilter.replace('_', ' ')}" state.`
                }
                actionLabel={taskFilter === 'all' ? 'Create First Task' : undefined}
                actionIcon={Plus}
                onAction={() => openCreateModal('task')}
              />
            ) : (
              <div className="space-y-2.5">
                {displayedTasks.slice(0, 5).map((task: Task) => {
                  const isDone = task.status === 'completed';
                  return (
                    <div
                      key={task.id}
                      className="p-3.5 rounded-2xl bg-[#FAFAFA] dark:bg-[#1C1C1C] border border-[#E5E5E5] dark:border-[#333333] hover:border-orange-300 dark:hover:border-orange-800/60 transition flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={(e) =>
                            updateTaskStatus(task.id, e.target.checked ? 'completed' : 'in_progress')
                          }
                          aria-label={`Mark "${task.title}" as ${isDone ? 'in progress' : 'completed'}`}
                          className="w-4 h-4 rounded border-[#E5E5E5] text-[#F97316] focus:ring-[#F97316] cursor-pointer shrink-0"
                        />
                        <div className="min-w-0">
                          <div
                            className={`text-xs sm:text-sm font-semibold truncate ${
                              isDone
                                ? 'line-through text-[#A3A3A3] dark:text-[#525252]'
                                : 'text-[#171717] dark:text-[#FAFAFA]'
                            }`}
                          >
                            {task.title}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {task.category && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-neutral-200/70 dark:bg-neutral-800 text-[#171717] dark:text-[#FAFAFA]">
                                {task.category}
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                task.priority === 'urgent'
                                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                                  : task.priority === 'high'
                                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                                  : 'bg-orange-50 dark:bg-orange-950/60 text-[#F97316] dark:text-orange-300'
                              }`}
                            >
                              {(task.priority || 'medium').toUpperCase()}
                            </span>
                            {task.dueDate && (
                              <span className="text-[10px] text-[#737373] dark:text-[#A3A3A3]">
                                Due {task.dueDate}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                          isDone
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/40 dark:border-emerald-800/40'
                            : task.status === 'in_progress'
                            ? 'bg-orange-50 dark:bg-orange-950/40 text-[#F97316] border border-orange-200/40 dark:border-orange-800/40'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-[#737373] dark:text-[#A3A3A3]'
                        }`}
                      >
                        {isDone ? 'Completed' : task.status === 'in_progress' ? 'In Progress' : 'Pending'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* UPCOMING MEETINGS SECTION (Real Supabase + Jitsi Call Join) */}
          <div className="bg-white dark:bg-[#141414] rounded-3xl p-6 border border-[#E5E5E5] dark:border-[#333333] shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#171717] dark:text-[#FAFAFA] flex items-center gap-2">
                  <Video className="w-4 h-4 text-[#F97316]" />
                  <span>Upcoming Video Conferences</span>
                </h2>
                <p className="text-xs text-[#737373] dark:text-[#A3A3A3]">
                  Scheduled meetings with live Jitsi Meet audio & video
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openCreateModal('meeting')}
                  className="px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 text-[#F97316] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Schedule</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentView('meetings')}
                  className="text-xs font-semibold text-[#F97316] hover:text-[#EA580C] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>All</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {upcomingMeetings.length === 0 ? (
              <EmptyState
                icon={Video}
                title="No Upcoming Meetings"
                description="Connect with your team in real-time. Schedule an HD audio/video conference anytime."
                actionLabel="Schedule Meeting"
                actionIcon={Plus}
                onAction={() => openCreateModal('meeting')}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {upcomingMeetings.slice(0, 4).map((mtg: Meeting) => {
                  const room = mtg.roomName || `WorkNest-${mtg.id.replace(/[^a-zA-Z0-9]/g, '')}`;
                  const isCopied = copiedMeetingId === mtg.id;
                  return (
                    <div
                      key={mtg.id}
                      className="p-4 rounded-2xl bg-[#FAFAFA] dark:bg-[#1C1C1C] border border-[#E5E5E5] dark:border-[#333333] hover:border-orange-300 dark:hover:border-orange-800/60 transition flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                            {mtg.type}
                          </span>
                          <span className="text-[11px] font-medium text-[#737373] dark:text-[#A3A3A3] flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {mtg.duration}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-[#171717] dark:text-[#FAFAFA] line-clamp-1">
                          {mtg.title}
                        </h3>
                        {mtg.description && (
                          <p className="text-[11px] text-[#737373] dark:text-[#A3A3A3] line-clamp-2">
                            {mtg.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-[#E5E5E5] dark:border-[#333333] flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 text-[11px] text-[#737373] dark:text-[#A3A3A3]">
                          <Calendar className="w-3.5 h-3.5 text-[#F97316]" />
                          <span>{mtg.date} at {mtg.time}</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => handleCopyMeetingLink(room, mtg.id, e)}
                            title="Copy conference link"
                            className="p-1.5 rounded-lg text-[#737373] dark:text-[#A3A3A3] hover:text-[#F97316] hover:bg-white dark:hover:bg-[#222222] transition cursor-pointer"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveVideoMeeting(mtg)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Join</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Active Teams & Urgent Deadlines */}
        <div className="space-y-6 md:space-y-8">
          {/* ACTIVE TEAMS & WORKSPACES */}
          <div className="bg-white dark:bg-[#141414] rounded-3xl p-6 border border-[#E5E5E5] dark:border-[#333333] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#171717] dark:text-[#FAFAFA] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#F97316]" />
                <span>My Team Workspaces</span>
              </h2>
              <button
                type="button"
                onClick={() => setCurrentView('teams')}
                className="text-xs font-semibold text-[#F97316] hover:text-[#EA580C] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View all</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {teams.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No teams joined"
                description="Collaborate with colleagues by creating or joining a team workspace."
                actionLabel="Create Team"
                actionIcon={Plus}
                onAction={() => openCreateModal('team')}
              />
            ) : (
              <div className="space-y-3">
                {teams.slice(0, 4).map((team) => (
                  <div
                    key={team.id}
                    onClick={() => handleOpenTeamWorkspace(team.id)}
                    className="p-4 rounded-2xl bg-[#FAFAFA] dark:bg-[#1C1C1C] border border-[#E5E5E5] dark:border-[#333333] hover:border-orange-300 dark:hover:border-orange-800/60 transition cursor-pointer group space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-xs sm:text-sm font-bold text-[#171717] dark:text-[#FAFAFA] group-hover:text-[#F97316] transition-colors truncate">
                          {team.name}
                        </h3>
                        {team.description && (
                          <p className="text-[11px] text-[#737373] dark:text-[#A3A3A3] line-clamp-1 mt-0.5">
                            {team.description}
                          </p>
                        )}
                      </div>
                      <span className="p-1.5 rounded-xl bg-orange-100/60 dark:bg-orange-950/60 text-[#F97316] shrink-0">
                        <Users className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#737373] dark:text-[#A3A3A3] pt-1 border-t border-[#E5E5E5] dark:border-[#333333]">
                      <span className="flex items-center gap-1">
                        <Shield className="w-3 h-3 text-[#F97316]" />
                        <span>Leader: <strong className="text-[#171717] dark:text-[#FAFAFA]">{team.leaderName}</strong></span>
                      </span>
                      <span><strong className="text-[#171717] dark:text-[#FAFAFA]">{team.memberCount}</strong> members</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* URGENT DELIVERABLES / ATTENTION */}
          <div className="bg-white dark:bg-[#141414] rounded-3xl p-6 border border-[#E5E5E5] dark:border-[#333333] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#171717] dark:text-[#FAFAFA] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span>Urgent Attention</span>
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                {urgentTasks.length} pending
              </span>
            </div>

            {urgentTasks.length === 0 ? (
              <div className="p-6 text-center bg-[#FAFAFA] dark:bg-[#1C1C1C] rounded-2xl border border-[#E5E5E5] dark:border-[#333333] space-y-1.5">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                <div className="text-xs font-bold text-[#171717] dark:text-[#FAFAFA]">
                  All Deliverables On Track
                </div>
                <p className="text-[11px] text-[#737373] dark:text-[#A3A3A3]">
                  No overdue or urgent items currently require escalation.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {urgentTasks.slice(0, 4).map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-2xl bg-[#FAFAFA] dark:bg-[#1C1C1C] border border-[#E5E5E5] dark:border-[#333333] hover:border-amber-400 dark:hover:border-amber-700/60 transition flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-[#171717] dark:text-[#FAFAFA] truncate">
                        {task.title}
                      </div>
                      <div className="text-[10px] text-[#737373] dark:text-[#A3A3A3] mt-0.5">
                        Priority: <strong className="text-rose-500">{task.priority.toUpperCase()}</strong>
                      </div>
                    </div>
                    {task.dueDate && (
                      <span className="px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-[10px] font-bold shrink-0">
                        {task.dueDate}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
