import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Plus,
  Filter,
  ArrowUpDown,
  Trash2,
  Search,
  CheckSquare,
  Edit3,
  AlertTriangle,
} from 'lucide-react';
import { NewTaskModal } from './NewTaskModal';
import { EditTaskModal } from './EditTaskModal';
import { PageHeader } from '../common/PageHeader';
import { EmptyState } from '../common/EmptyState';
import { TableRowSkeleton } from '../common/LoadingSkeleton';
import type { Task, TaskPriority } from '../../types';

export const MyTasks: React.FC = () => {
  const { tasks, isLoadingTasks, tasksError, updateTaskStatus, deleteTask } = useApp();
  const [activeTab, setActiveTab] = useState<'all' | 'today' | 'upcoming' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority'>('dueDate');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [taskPendingDelete, setTaskPendingDelete] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && taskPendingDelete && !isDeleting) {
        setTaskPendingDelete(null);
      }
    };
    if (taskPendingDelete) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [taskPendingDelete, isDeleting]);

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
      <PageHeader
        badge="Deliverables"
        badgeIcon={CheckSquare}
        title="My Tasks"
        description="Manage personal and assigned team deliverables with real-time status tracking."
        actions={[
          {
            label: 'New Task',
            icon: Plus,
            onClick: () => setIsModalOpen(true),
            variant: 'primary',
          },
        ]}
      />

      {/* Tabs & Controls Bar */}
      <div className="bg-white dark:bg-[#141414] p-4 rounded-3xl border border-[#E5E5E5] dark:border-[#333333] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* View Tabs */}
        <div className="flex items-center p-1 rounded-2xl bg-[#FAFAFA] dark:bg-[#1C1C1C] border border-[#E5E5E5] dark:border-[#333333] text-xs font-semibold w-full sm:w-auto">
          {(['all', 'today', 'upcoming', 'completed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl capitalize transition ${
                activeTab === tab
                  ? 'bg-white dark:bg-[#141414] text-[#F97316] shadow-sm'
                  : 'text-[#737373] dark:text-[#A3A3A3] hover:text-[#171717] dark:hover:text-[#FAFAFA]'
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
            <Search className="w-3.5 h-3.5 text-[#737373] dark:text-[#A3A3A3] absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-xs text-[#171717] dark:text-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-[#F97316]"
            />
          </div>

          {/* Priority filter dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-[#737373] dark:text-[#A3A3A3]">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-xs text-[#171717] dark:text-[#FAFAFA] focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-[#737373] dark:text-[#A3A3A3]">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-xs text-[#171717] dark:text-[#FAFAFA] focus:outline-none"
            >
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List Container */}
      <div className="bg-white dark:bg-[#141414] rounded-3xl border border-[#E5E5E5] dark:border-[#333333] shadow-sm overflow-hidden">
        {isLoadingTasks ? (
          <div className="p-4 divide-y divide-[#E5E5E5] dark:divide-[#333333]">
            <TableRowSkeleton columns={4} />
            <TableRowSkeleton columns={4} />
            <TableRowSkeleton columns={4} />
            <TableRowSkeleton columns={4} />
          </div>
        ) : tasksError ? (
          <div className="p-8 text-center text-rose-500 space-y-2">
            <div className="text-xs font-semibold">{tasksError}</div>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title="No tasks found"
            description={
              searchQuery || priorityFilter !== 'all' || activeTab !== 'all'
                ? 'No tasks match your active filters. Try searching for a different term or clearing filters.'
                : 'You have no tasks created yet. Stay organized by adding your first project deliverable.'
            }
            actionLabel="Create New Task"
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <div className="divide-y divide-[#E5E5E5] dark:divide-[#333333]">
            {filtered.map((task) => {
              const isDone = task.status === 'completed';
              return (
                <div
                  key={task.id}
                  className="p-4 md:p-5 hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C] transition flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={(e) => updateTaskStatus(task.id, e.target.checked ? 'completed' : 'in_progress')}
                      className="mt-1 w-5 h-5 rounded border-[#E5E5E5] text-[#F97316] focus:ring-[#F97316] cursor-pointer"
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
                              ? 'bg-orange-50 dark:bg-orange-950/80 text-[#F97316] dark:text-orange-300'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-[#737373] dark:text-[#A3A3A3]'
                          }`}
                        >
                          {task.priority.toUpperCase()}
                        </span>

                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[#171717] dark:text-[#FAFAFA]">
                          {task.category}
                        </span>

                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                            task.status === 'completed'
                              ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50'
                              : task.status === 'in_progress'
                              ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50'
                              : task.status === 'review'
                              ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50'
                              : 'text-[#737373] dark:text-[#A3A3A3] bg-neutral-100 dark:bg-neutral-800'
                          }`}
                        >
                          {task.status.replace('_', ' ').toUpperCase()}
                        </span>

                        {task.assignedTo && (
                          <span className="text-[11px] font-medium text-[#737373] dark:text-[#A3A3A3]">
                            Assignee: <strong className="text-[#171717] dark:text-[#FAFAFA]">{task.assignedTo}</strong>
                          </span>
                        )}

                        {task.subgroup && (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-orange-50 dark:bg-orange-950/40 text-[#F97316]">
                            {task.subgroup}
                          </span>
                        )}
                      </div>

                      <h3
                        className={`text-base font-bold ${
                          isDone ? 'line-through text-[#A3A3A3] dark:text-[#525252]' : 'text-[#171717] dark:text-[#FAFAFA]'
                        }`}
                      >
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-xs text-[#737373] dark:text-[#A3A3A3] line-clamp-2">{task.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Task details & actions right side */}
                  <div className="flex items-center justify-between md:justify-end gap-6 pt-2 md:pt-0 border-t md:border-t-0 border-[#E5E5E5] dark:border-[#333333]">
                    <div className="text-xs text-[#737373] dark:text-[#A3A3A3] font-medium">
                      <span>Due {task.dueDate}</span>
                    </div>

                    <div className="w-28 shrink-0">
                      <div className="flex justify-between text-[10px] text-[#737373] dark:text-[#A3A3A3] mb-1">
                        <span>Progress</span>
                        <span>{task.progress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                        <div
                          className="h-full bg-[#F97316] rounded-full"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                      <button
                        onClick={() => setTaskToEdit(task)}
                        className="p-1.5 rounded-lg text-[#737373] dark:text-[#A3A3A3] hover:text-[#F97316] hover:bg-orange-50 dark:hover:bg-orange-950/40 transition"
                        title="Edit Task"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setTaskPendingDelete(task)}
                        className="p-1.5 rounded-lg text-[#737373] dark:text-[#A3A3A3] hover:text-rose-500 hover:bg-rose-500/10 transition"
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

      {/* Delete Confirmation Dialog */}
      {taskPendingDelete && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-task-title"
          onClick={!isDeleting ? () => setTaskPendingDelete(null) : undefined}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white dark:bg-[#141414] rounded-3xl p-6 border border-[#E5E5E5] dark:border-[#333333] shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 id="delete-task-title" className="text-sm font-bold text-[#171717] dark:text-[#FAFAFA]">Delete Task?</h3>
                <p className="text-xs text-[#737373] dark:text-[#A3A3A3]">This action will permanently delete the task.</p>
              </div>
            </div>

            <p className="text-xs text-[#171717] dark:text-[#FAFAFA] font-medium bg-[#FAFAFA] dark:bg-[#1C1C1C] p-3 rounded-xl border border-[#E5E5E5] dark:border-[#333333] truncate">
              "{taskPendingDelete.title}"
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTaskPendingDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#737373] dark:text-[#A3A3A3] hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C] transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsDeleting(true);
                  await deleteTask(taskPendingDelete.id);
                  setIsDeleting(false);
                  setTaskPendingDelete(null);
                }}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Task Modal */}
      <NewTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Edit Task Modal */}
      <EditTaskModal
        task={taskToEdit}
        isOpen={Boolean(taskToEdit)}
        onClose={() => setTaskToEdit(null)}
      />
    </div>
  );
};
