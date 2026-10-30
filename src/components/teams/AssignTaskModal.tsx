import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, CheckSquare, Loader2, AlertCircle } from 'lucide-react';
import type { TaskPriority, TaskStatus } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
}

export const AssignTaskModal: React.FC<Props> = ({ isOpen, onClose, teamId }) => {
  const { addTask, teams } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [subgroupId, setSubgroupId] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('high');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  if (!isOpen) return null;

  const activeTeam = teams.find((t) => t.id === teamId);
  const selectedMember = assigneeId ? activeTeam?.members.find((m) => m.userId === assigneeId) : undefined;
  const selectedSubgroupObj = subgroupId ? activeTeam?.subgroups.find((sg) => sg.id === subgroupId) : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setErrorMessage('Task title cannot be empty.');
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const success = await addTask({
        title: cleanTitle,
        description: description.trim(),
        priority,
        status,
        dueDate,
        category: selectedSubgroupObj?.name || 'General',
        progress: status === 'completed' ? 100 : status === 'in_progress' ? 50 : 0,
        assignedTo: selectedMember?.name,
        assignedToId: selectedMember?.userId,
        subgroup: selectedSubgroupObj?.name,
        subgroupId: selectedSubgroupObj?.id,
        teamId,
      });

      if (success) {
        setTitle('');
        setDescription('');
        setAssigneeId('');
        setSubgroupId('');
        onClose();
      } else {
        setErrorMessage('Failed to assign team task.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error assigning task.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="assign-task-modal-title"
      onClick={!isSubmitting ? onClose : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[calc(100vh-2rem)] flex flex-col bg-white dark:bg-[#141414] rounded-3xl shadow-2xl border border-[#E5E5E5] dark:border-[#333333] overflow-hidden my-auto"
      >
        <div className="px-6 py-4 border-b border-[#E5E5E5] dark:border-[#333333] flex items-center justify-between shrink-0">
          <div id="assign-task-modal-title" className="flex items-center gap-2 font-bold text-[#171717] dark:text-[#FAFAFA]">
            <CheckSquare className="w-5 h-5 text-[#F97316]" />
            <span>Assign Team Task</span>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
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
              placeholder="e.g., Conduct WebRTC Load Testing"
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
              placeholder="Specify requirements and sub-group acceptance targets..."
              className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#171717] dark:text-[#FAFAFA] text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316] resize-none disabled:opacity-60"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#171717] dark:text-[#FAFAFA] mb-1">Assigned Member</label>
              <select
                disabled={isSubmitting}
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#171717] dark:text-[#FAFAFA] text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316] disabled:opacity-60"
              >
                <option value="">Unassigned</option>
                {activeTeam?.members.map((m) => (
                  <option key={m.id} value={m.userId}>
                    {m.name} ({m.roleLabel})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#171717] dark:text-[#FAFAFA] mb-1">Subgroup</label>
              <select
                disabled={isSubmitting}
                value={subgroupId}
                onChange={(e) => setSubgroupId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#171717] dark:text-[#FAFAFA] text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316] disabled:opacity-60"
              >
                <option value="">None (General Team)</option>
                {activeTeam?.subgroups.map((sg) => (
                  <option key={sg.id} value={sg.id}>
                    {sg.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#171717] dark:text-[#FAFAFA] mb-1">Priority</label>
              <select
                disabled={isSubmitting}
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#171717] dark:text-[#FAFAFA] text-xs focus:outline-none focus:ring-2 focus:ring-[#F97316] disabled:opacity-60"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent Priority</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#171717] dark:text-[#FAFAFA] mb-1">Kanban Column</label>
              <select
                disabled={isSubmitting}
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#171717] dark:text-[#FAFAFA] text-xs focus:outline-none focus:ring-2 focus:ring-[#F97316] disabled:opacity-60"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#171717] dark:text-[#FAFAFA] mb-1">
                Deadline <span className="text-[#F97316]">*</span>
              </label>
              <input
                type="date"
                required
                disabled={isSubmitting}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#171717] dark:text-[#FAFAFA] text-xs focus:outline-none focus:ring-2 focus:ring-[#F97316] disabled:opacity-60"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#E5E5E5] dark:border-[#333333] shrink-0">
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
                  <span>Assigning Task...</span>
                </>
              ) : (
                'Assign Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
