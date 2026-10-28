import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  FileText,
  CalendarCheck,
  Video,
  Plus,
  Bot,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const {
    user,
    tasks,
    teams,
    updateTaskStatus,
    setCurrentView,
    setIsCreateModalOpen,
    setCreateModalType,
  } = useApp();

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const dueSoonTasks = tasks.filter((t) => t.priority === 'urgent' || t.priority === 'high').length;
  const totalTeams = teams.length;

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
            {todayStr}
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Good morning, {user?.name || 'User'} 👋
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Here's an overview of your work and team activity.
          </p>
        </div>

        <button
          onClick={() => {
            setCreateModalType('task');
            setIsCreateModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 flex items-center gap-2 self-start md:self-auto transition"
        >
          <Plus className="w-4 h-4" /> New Task
        </button>
      </div>

      {/* STATISTICS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Tasks', value: totalTasks, icon: <CheckSquare className="w-5 h-5 text-indigo-600" />, bg: 'bg-indigo-50 dark:bg-indigo-950/50' },
          { label: 'Completed', value: completedTasks, icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />, bg: 'bg-emerald-50 dark:bg-emerald-950/50' },
          { label: 'In Progress', value: inProgressTasks, icon: <Clock className="w-5 h-5 text-amber-600" />, bg: 'bg-amber-50 dark:bg-amber-950/50' },
          { label: 'Due Soon', value: dueSoonTasks, icon: <AlertCircle className="w-5 h-5 text-rose-600" />, bg: 'bg-rose-50 dark:bg-rose-950/50' },
          { label: 'Teams', value: totalTeams, icon: <Users className="w-5 h-5 text-purple-600" />, bg: 'bg-purple-50 dark:bg-purple-950/50' },
        ].map((stat, i) => (
          <div
            key={i}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{stat.label}</span>
              <div className={`p-2 rounded-xl ${stat.bg}`}>{stat.icon}</div>
            </div>
            <div className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* MAIN GRID CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: My Tasks & Team Activity */}
        <div className="lg:col-span-2 space-y-8">
          {/* MY TASKS SECTION */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">My Tasks</h2>
                <p className="text-xs text-slate-500">Tasks assigned to you across personal and team spaces</p>
              </div>
              <button
                onClick={() => setCurrentView('my_tasks')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                View all <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {tasks.slice(0, 4).map((task) => {
                const isDone = task.status === 'completed';
                return (
                  <div
                    key={task.id}
                    className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 transition flex items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={(e) => updateTaskStatus(task.id, e.target.checked ? 'completed' : 'in_progress')}
                        className="mt-1 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <div className={`text-sm font-semibold truncate ${isDone ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'}`}>
                          {task.title}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {task.category}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                              task.priority === 'urgent'
                                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                                : task.priority === 'high'
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                                : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                            }`}
                          >
                            {task.priority.toUpperCase()}
                          </span>
                          <span className="text-[11px] text-slate-400">Due {task.dueDate}</span>
                        </div>
                      </div>
                    </div>

                    <div className="w-24 shrink-0 hidden sm:block">
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>Progress</span>
                        <span>{task.progress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${task.progress}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TEAM ACTIVITY FEED */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Team Activity</h2>
              <span className="text-xs text-slate-400 font-medium">Real-time update stream</span>
            </div>

            <div className="space-y-4">
              {[
                { icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, text: 'David Chen completed JWT OAuth Access Control microservice task.', time: '15 min ago', tag: 'Task' },
                { icon: <FileText className="w-4 h-4 text-cyan-500" />, text: 'Alex Morgan uploaded WorkNest_Q4_Product_Architecture.pptx.', time: '1 hour ago', tag: 'File' },
                { icon: <CalendarCheck className="w-4 h-4 text-purple-500" />, text: 'Sarah Jenkins submitted daily work log (7.5h logged).', time: '2 hours ago', tag: 'Daily Log' },
                { icon: <Video className="w-4 h-4 text-amber-500" />, text: 'Subgroup Sync meeting scheduled for tomorrow 2:00 PM.', time: '3 hours ago', tag: 'Meeting' },
              ].map((act, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs pb-3 border-b border-slate-100 dark:border-slate-800/60 last:border-none last:pb-0">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">{act.icon}</div>
                  <div className="flex-1">
                    <div className="text-slate-800 dark:text-slate-200 font-medium">{act.text}</div>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                      <span>{act.time}</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-500 dark:text-slate-400">{act.tag}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: AI Insights & Productivity Chart & Upcoming Deadlines */}
        <div className="space-y-8">
          {/* AI INSIGHTS CARD */}
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 text-white rounded-3xl p-6 border border-indigo-800 shadow-xl relative overflow-hidden space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                WorkNest AI Insights
              </div>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-200 px-2 py-0.5 rounded font-mono">LIVE ANALYTICS</span>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-indigo-950/80 border border-indigo-800/50 text-xs leading-relaxed">
                <span className="font-bold text-amber-300 block mb-1">⚠️ Urgent Deadline Alert</span>
                "Two high-priority tasks are approaching their deadlines. Consider reviewing the API integration milestone."
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs leading-relaxed">
                <span className="font-bold text-emerald-300 block mb-1">📈 Velocity Recommendation</span>
                "Your development team has several tasks in progress. Workload distribution across sub-groups is optimal."
              </div>
            </div>

            <button
              onClick={() => setCurrentView('ai_assistant')}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition"
            >
              <Bot className="w-4 h-4" /> Ask WorkNest AI
            </button>
          </div>

          {/* PRODUCTIVITY OVERVIEW CHART */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Productivity Overview</h3>
                <p className="text-xs text-slate-500">Weekly task velocity</p>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                <TrendingUp className="w-4 h-4" /> +18%
              </div>
            </div>

            {/* Custom SVG Weekly Velocity Bar Chart */}
            <div className="pt-4 pb-2">
              <div className="h-32 flex items-end justify-between gap-2 px-2">
                {[
                  { day: 'Mon', count: 12, height: '60%' },
                  { day: 'Tue', count: 16, height: '80%' },
                  { day: 'Wed', count: 20, height: '100%' },
                  { day: 'Thu', count: 14, height: '70%' },
                  { day: 'Fri', count: 18, height: '90%' },
                  { day: 'Sat', count: 6, height: '30%' },
                  { day: 'Sun', count: 4, height: '20%' },
                ].map((bar, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-lg h-full flex items-end p-1">
                      <div
                        className="w-full bg-gradient-to-t from-indigo-600 to-purple-500 rounded-md group-hover:opacity-90 transition-all"
                        style={{ height: bar.height }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold">{bar.day}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* UPCOMING DEADLINES */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Upcoming Deadlines</h3>
            <div className="space-y-2">
              {tasks.filter((t) => t.priority === 'urgent' || t.priority === 'high').map((t) => (
                <div key={t.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{t.title}</span>
                  <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold shrink-0">
                    {t.dueDate}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
