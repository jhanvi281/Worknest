import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, CheckSquare, Loader2, AlertCircle } from 'lucide-react';
import type { TaskPriority, TaskStatus } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultTeamId?: string;
}

export const NewTaskModal: React.FC<Props> = ({ isOpen, onClose, defaultTeamId }) => {
  const { addTask, user, teams } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Development');
  const [selectedTeamId, setSelectedTeamId] = useState<string>(defaultTeamId || '');
  const [selectedSubgroupId, setSelectedSubgroupId] = useState<string>('');
  const [assignedToId, setAssignedToId] = useState<string>(user?.id || '');
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

  const currentTeam = teams.find((t) => t.id === selectedTeamId);
  const teamMembers = currentTeam?.members || [];
  const teamSubgroups = currentTeam?.subgroups || [];

  const handleTeamChange = (newTeamId: string) => {
    setSelectedTeamId(newTeamId);
    setSelectedSubgroupId('');
    if (newTeamId) {
      const targetTeam = teams.find((t) => t.id === newTeamId);
      const firstMember = targetTeam?.members[0];
      setAssignedToId(firstMember ? firstMember.userId : user?.id || '');
    } else {
      setAssignedToId(user?.id || '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setErrorMessage('Task title cannot be empty or only spaces.');
      return;
    }

    if (!dueDate) {
      setErrorMessage('Please select a valid due date.');
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const selectedMember = teamMembers.find((m) => m.userId === assignedToId);
      const selectedSubgroup = teamSubgroups.find((sg) => sg.id === selectedSubgroupId);

      const success = await addTask({
        title: cleanTitle,
        description: description.trim(),
        priority,
        status,
        dueDate,
        category,
        progress: status === 'completed' ? 100 : status === 'in_progress' ? 50 : 0,
        assignedTo: selectedTeamId ? selectedMember?.name : user?.name,
        assignedToId: selectedTeamId ? assignedToId || undefined : user?.id,
        teamId: selectedTeamId || undefined,
        subgroupId: selectedSubgroupId || undefined,
        subgroup: selectedSubgroup?.name || undefined,
      });

      if (success) {
        setTitle('');
        setDescription('');
        setSelectedTeamId('');
        setSelectedSubgroupId('');
        setAssignedToId(user?.id || '');
        onClose();
      } else {
        setErrorMessage('Failed to create task. Please check permissions and input values.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create task.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-task-modal-title"
      onClick={!isSubmitting ? onClose : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[calc(100vh-2rem)] flex flex-col bg-white dark:bg-[#141414] rounded-3xl shadow-2xl border border-[#E5E5E5] dark:border-[#333333] overflow-hidden my-auto"
      >
        <div className="px-5 sm:px-6 py-4 border-b border-[#E5E5E5] dark:border-[#333333] flex items-center justify-between shrink-0">
          <div id="new-task-modal-title" className="flex items-center gap-2 font-bold text-[#171717] dark:text-[#FAFAFA]">
            <CheckSquare className="w-5 h-5 text-[#F97316]" />
            <span>Create New Task</span>
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
              placeholder="e.g., Finalize API WebSocket Event Schema"
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
              placeholder="Provide context, acceptance criteria, or links..."
              className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#171717] dark:text-[#FAFAFA] text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316] resize-none disabled:opacity-60"
            />
          </div>

          {/* Team and Assignee Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#171717] dark:text-[#FAFAFA] mb-1">Workspace Scope</label>
              <select
                disabled={isSubmitting}
                value={selectedTeamId}
                onChange={(e) => handleTeamChange(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#171717] dark:text-[#FAFAFA] text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316] disabled:opacity-60"
              >
                <option value="">Personal Task (No Team)</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    Team: {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#171717] dark:text-[#FAFAFA] mb-1">Assignee</label>
              {selectedTeamId ? (
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
              ) : (
                <input
                  type="text"
                  disabled
                  value={user?.name ? `${user.name} (You)` : 'You'}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#737373] dark:text-[#A3A3A3] text-sm cursor-not-allowed opacity-80"
                />
              )}
            </div>
          </div>

          {selectedTeamId && teamSubgroups.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-[#171717] dark:text-[#FAFAFA] mb-1">Team Subgroup (Optional)</label>
              <select
                disabled={isSubmitting}
                value={selectedSubgroupId}
                onChange={(e) => setSelectedSubgroupId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#171717] dark:text-[#FAFAFA] text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316] disabled:opacity-60"
              >
                <option value="">No specific subgroup</option>
                {teamSubgroups.map((sg) => (
                  <option key={sg.id} value={sg.id}>
                    {sg.name}
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
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#171717] dark:text-[#FAFAFA] text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316] disabled:opacity-60"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
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
              <label className="block text-xs font-semibold text-[#171717] dark:text-[#FAFAFA] mb-1">
                Due Date <span className="text-[#F97316]">*</span>
              </label>
              <input
                type="date"
                required
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
                  <span>Creating Task...</span>
                </>
              ) : (
                'Create Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
