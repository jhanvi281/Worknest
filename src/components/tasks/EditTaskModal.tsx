import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Edit3, Loader2, AlertCircle } from 'lucide-react';
import type { Task, TaskPriority, TaskStatus } from '../../types';

interface Props {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditTaskModal: React.FC<Props> = ({ task, isOpen, onClose }) => {
  const { editTask, teams, user } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [progress, setProgress] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState('Development');
  const [assignedToId, setAssignedToId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (task && isOpen) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setPriority(task.priority || 'medium');
      setStatus(task.status || 'todo');
      setProgress(typeof task.progress === 'number' ? task.progress : 0);
      setDueDate(task.dueDate || '');
      setCategory(task.category || 'General');
      setAssignedToId(task.assignedToId || '');
      setErrorMessage(null);
    }
  }, [task, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !task) return null;

  const currentTeam = task.teamId ? teams.find((t) => t.id === task.teamId) : null;
  const teamMembers = currentTeam?.members || [];

  const handleStatusChange = (newStatus: TaskStatus) => {
    setStatus(newStatus);
    if (newStatus === 'completed') {
      setProgress(100);
    } else if (newStatus === 'in_progress' && progress === 0) {
      setProgress(50);
    } else if (newStatus === 'todo') {
      setProgress(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setErrorMessage('Task title cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedMember = teamMembers.find((m) => m.userId === assignedToId);

      const success = await editTask(task.id, {
        title: cleanTitle,
        description: description.trim(),
        priority,
        status,
        progress: Number(progress),
        dueDate: dueDate || undefined,
        category,
        assignedToId: task.teamId ? assignedToId || undefined : user?.id,
        assignedTo: task.teamId ? (selectedMember ? selectedMember.name : undefined) : user?.name,
      });

      if (success) {
        onClose();
      } else {
        setErrorMessage('Failed to save task changes. Check permissions.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating task.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-task-modal-title"
      onClick={!isSubmitting ? onClose : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[calc(100vh-2rem)] flex flex-col bg-white dark:bg-[#141414] rounded-3xl shadow-2xl border border-[#E5E5E5] dark:border-[#333333] overflow-hidden my-auto"
      >
        <div className="px-5 sm:px-6 py-4 border-b border-[#E5E5E5] dark:border-[#333333] flex items-center justify-between shrink-0">
          <div id="edit-task-modal-title" className="flex items-center gap-2 font-bold text-[#171717] dark:text-[#FAFAFA]">
            <Edit3 className="w-5 h-5 text-[#F97316]" />
            <span>Edit Task</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close dialog"
            className="p-1 rounded-lg text-[#737373] dark:text-[#A3A3A3] hover:text-[#171717] dark:hover:text-[#FAFAFA] disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#171717] dark:text-[#FAFAFA] mb-1">
              Task Title <span className="text-[#F97316]">*</span>
            </label>
            <input
              type="text"
              required
              disabled={isSubmitting}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#171717] dark:text-[#FAFAFA] text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316] disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] dark:text-[#FAFAFA] mb-1">Description</label>
            <textarea
              rows={3}
              disabled={isSubmitting}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#171717] dark:text-[#FAFAFA] text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316] resize-none disabled:opacity-60"
            />
          </div>

          {task.teamId && (
            <div>
              <label className="block text-xs font-semibold text-[#171717] dark:text-[#FAFAFA] mb-1">Assignee</label>
              <select
                disabled={isSubmitting}
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#171717] dark:text-[#FAFAFA] text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316] disabled:opacity-60"
              >
                <option value="">Unassigned</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.userId}>
                    {m.name} ({m.roleLabel})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#171717] dark:text-[#FAFAFA] mb-1">Priority</label>
              <select
                disabled={isSubmitting}
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#171717] dark:text-[#FAFAFA] text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316] disabled:opacity-60"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent Priority</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#171717] dark:text-[#FAFAFA] mb-1">Status</label>
              <select
                disabled={isSubmitting}
                value={status}
                onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#171717] dark:text-[#FAFAFA] text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316] disabled:opacity-60"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center text-xs font-semibold mb-1">
              <span className="text-[#171717] dark:text-[#FAFAFA]">Progress</span>
              <span className="text-[#F97316] font-bold">{progress}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              disabled={isSubmitting}
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full accent-[#F97316] cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#171717] dark:text-[#FAFAFA] mb-1">Category</label>
              <select
                disabled={isSubmitting}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#171717] dark:text-[#FAFAFA] text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316] disabled:opacity-60"
              >
                <option value="Development">Development</option>
                <option value="Design System">Design System</option>
                <option value="Quality Assurance">Quality Assurance</option>
                <option value="Management">Management</option>
                <option value="General">General</option>
                <option value="Personal">Personal</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#171717] dark:text-[#FAFAFA] mb-1">Due Date</label>
              <input
                type="date"
                disabled={isSubmitting}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#171717] dark:text-[#FAFAFA] text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316] disabled:opacity-60"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#E5E5E5] dark:border-[#333333]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#737373] dark:text-[#A3A3A3] hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] dark:hover:bg-[#FB923C] text-white font-bold text-xs shadow-sm transition-colors flex items-center gap-2 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

