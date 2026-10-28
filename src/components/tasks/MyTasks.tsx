import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Plus,
  Filter,
  ArrowUpDown,
  Trash2,
  CheckCircle2,
  Search,
} from 'lucide-react';
import { NewTaskModal } from './NewTaskModal';
import type { TaskPriority } from '../../types';

export const MyTasks: React.FC = () => {
  const { tasks, isLoadingTasks, tasksError, updateTaskStatus, deleteTask } = useApp();
  const [activeTab, setActiveTab] = useState<'all' | 'today' | 'upcoming' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority'>('dueDate');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter tasks by active tab
  const todayStr = new Date().toISOString().split('T')[0];

  let filtered = tasks.filter((t) => {
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;

    if (activeTab === 'today') return t.dueDate === todayStr;
    if (activeTab === 'upcoming') return t.dueDate > todayStr && t.status !== 'completed';
    if (activeTab === 'completed') return t.status === 'completed';
    return true;
  });

  // Sort tasks
  filtered.sort((a, b) => {
    if (sortBy === 'priority') {
      const pMap: Record<TaskPriority, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
      return pMap[b.priority] - pMap[a.priority];
    }
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            My Tasks
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Manage personal and assigned team deliverables in one place.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" /> New Task
          </button>
        </div>
      </div>

      {/* Tabs & Controls Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* View Tabs */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold w-full sm:w-auto">
          {(['all', 'today', 'upcoming', 'completed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl capitalize transition ${
                activeTab === tab
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Filter and Sort Inputs */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search box */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Priority filter dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {isLoadingTasks ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="text-xs font-semibold text-slate-500">Loading tasks from Supabase...</div>
          </div>
        ) : tasksError ? (
          <div className="p-8 text-center text-rose-500 space-y-2">
            <div className="text-xs font-semibold">{tasksError}</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <CheckCircle2 className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">No tasks found</div>
            <p className="text-xs text-slate-400">Try adjusting your active view filter or create a new task.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filtered.map((task) => {
              const isDone = task.status === 'completed';
              return (
                <div
                  key={task.id}
                  className="p-4 md:p-5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={(e) => updateTaskStatus(task.id, e.target.checked ? 'completed' : 'in_progress')}
                      className="mt-1 w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
                            task.priority === 'urgent'
                              ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400'
                              : task.priority === 'high'
                              ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400'
                              : task.priority === 'medium'
                              ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {task.priority.toUpperCase()}
                        </span>

                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {task.category}
                        </span>

                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                            task.status === 'completed'
                              ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50'
                              : task.status === 'in_progress'
                              ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50'
                              : 'text-slate-500 bg-slate-100 dark:bg-slate-800'
                          }`}
                        >
                          {task.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>

                      <h3
                        className={`text-base font-bold ${
                          isDone ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{task.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Task details & actions right side */}
                  <div className="flex items-center justify-between md:justify-end gap-6 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                    <div className="text-xs text-slate-400 font-medium">
                      <span>Due {task.dueDate}</span>
                    </div>

                    <div className="w-28 shrink-0">
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>Progress</span>
                        <span>{task.progress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        title="Delete Task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Task Modal */}
      <NewTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
