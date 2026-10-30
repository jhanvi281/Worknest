import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, LayoutGrid, List, Filter, ArrowRightLeft } from 'lucide-react';
import { AssignTaskModal } from './AssignTaskModal';
import type { TaskStatus } from '../../types';

interface Props {
  teamId: string;
}

export const TeamTasks: React.FC<Props> = ({ teamId }) => {
  const { tasks, updateTaskStatus } = useApp();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubgroup, setSelectedSubgroup] = useState<string>('all');

  const teamTasks = tasks.filter((t) => t.teamId === teamId);

  const filteredTasks = selectedSubgroup === 'all'
    ? teamTasks
    : teamTasks.filter((t) => t.subgroup === selectedSubgroup);

  const kanbanColumns: { id: TaskStatus; title: string; color: string }[] = [
    { id: 'todo', title: 'To Do', color: 'border-[#E5E5E5] dark:border-[#333333]' },
    { id: 'in_progress', title: 'In Progress', color: 'border-amber-500' },
    { id: 'review', title: 'Review', color: 'border-orange-500' },
    { id: 'completed', title: 'Completed', color: 'border-emerald-500' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 rounded-2xl bg-[#FAFAFA] dark:bg-[#1C1C1C] border border-[#E5E5E5] dark:border-[#333333] text-xs font-semibold">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
                viewMode === 'kanban' ? 'bg-white dark:bg-[#141414] text-[#F97316] shadow-sm' : 'text-[#737373] dark:text-[#A3A3A3]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Kanban View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
                viewMode === 'list' ? 'bg-white dark:bg-[#141414] text-[#F97316] shadow-sm' : 'text-[#737373] dark:text-[#A3A3A3]'
              }`}
            >
              <List className="w-3.5 h-3.5" /> List View
            </button>
          </div>

          <div className="flex items-center gap-1 text-xs text-[#737373] dark:text-[#A3A3A3]">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={selectedSubgroup}
              onChange={(e) => setSelectedSubgroup(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#171717] dark:text-[#FAFAFA] text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#F97316]"
            >
              <option value="all">All Subgroups</option>
              <option value="Development">Development</option>
              <option value="Design System">Design System</option>
              <option value="Quality Assurance">Quality Assurance</option>
              <option value="Management">Management</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] dark:hover:bg-[#FB923C] text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" /> Assign Task
        </button>
      </div>

      {/* KANBAN VIEW */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
          {kanbanColumns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);
            return (
              <div
                key={col.id}
                className="bg-[#FAFAFA] dark:bg-[#141414] rounded-3xl p-4 border border-[#E5E5E5] dark:border-[#333333] space-y-3 min-h-[420px]"
              >
                <div className={`flex items-center justify-between pb-2 border-b-2 ${col.color}`}>
                  <span className="text-xs font-bold text-[#171717] dark:text-[#FAFAFA]">{col.title}</span>
                  <span className="px-2 py-0.5 rounded-full bg-white dark:bg-[#1C1C1C] border border-[#E5E5E5] dark:border-[#333333] text-[10px] font-bold text-[#737373] dark:text-[#A3A3A3]">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {colTasks.map((t) => (
                    <div
                      key={t.id}
                      className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1C] border border-[#E5E5E5] dark:border-[#333333] shadow-sm space-y-3 hover:shadow-md transition-shadow group"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase ${
                            t.priority === 'urgent'
                              ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-600'
                              : t.priority === 'high'
                              ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-600'
                              : 'bg-orange-100 dark:bg-orange-950/80 text-[#F97316]'
                          }`}
                        >
                          {t.priority}
                        </span>
                        <span className="text-[10px] text-[#737373] dark:text-[#A3A3A3] font-medium">{t.subgroup || 'Dev'}</span>
                      </div>

                      <h4 className="text-xs font-bold text-[#171717] dark:text-[#FAFAFA] leading-snug">{t.title}</h4>

                      {/* Assignee & Progress */}
                      <div className="flex items-center justify-between pt-2 border-t border-[#E5E5E5] dark:border-[#333333] text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <img
                            src={
                              t.assignedUserAvatar ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(t.assignedTo || 'Member')}&background=f97316&color=fff`
                            }
                            alt={t.assignedTo || 'Member'}
                            className="w-5 h-5 rounded-full object-cover ring-1 ring-orange-500/20"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(t.assignedTo || 'Member')}&background=f97316&color=fff`;
                            }}
                          />
                          <span className="text-[#737373] dark:text-[#A3A3A3] font-medium text-[10px] truncate max-w-[80px]">
                            {t.assignedTo}
                          </span>
                        </div>

                        {/* Move column trigger */}
                        <button
                          onClick={() => {
                            const nextStatus: Record<TaskStatus, TaskStatus> = {
                              todo: 'in_progress',
                              in_progress: 'review',
                              review: 'completed',
                              completed: 'todo',
                            };
                            updateTaskStatus(t.id, nextStatus[t.status]);
                          }}
                          className="p-1 rounded bg-[#FAFAFA] dark:bg-[#141414] text-[#737373] dark:text-[#A3A3A3] hover:text-[#F97316] transition-colors"
                          title="Move to Next Stage"
                        >
                          <ArrowRightLeft className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-white dark:bg-[#141414] rounded-3xl border border-[#E5E5E5] dark:border-[#333333] overflow-hidden divide-y divide-[#E5E5E5] dark:divide-[#333333]">
          {filteredTasks.map((t) => (
            <div key={t.id} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={t.status === 'completed'}
                  onChange={(e) => updateTaskStatus(t.id, e.target.checked ? 'completed' : 'in_progress')}
                  className="w-4 h-4 rounded accent-[#F97316]"
                />
                <div>
                  <div className="text-sm font-bold text-[#171717] dark:text-[#FAFAFA]">{t.title}</div>
                  <div className="text-xs text-[#737373] dark:text-[#A3A3A3]">Assigned to {t.assignedTo} • {t.subgroup}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="px-2 py-0.5 rounded bg-[#FAFAFA] dark:bg-[#1C1C1C] border border-[#E5E5E5] dark:border-[#333333] font-semibold text-[#171717] dark:text-[#FAFAFA]">{t.status.toUpperCase()}</span>
                <span className="text-[#737373] dark:text-[#A3A3A3]">Due {t.dueDate}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assign Task Modal */}
      <AssignTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} teamId={teamId} />
    </div>
  );
};
