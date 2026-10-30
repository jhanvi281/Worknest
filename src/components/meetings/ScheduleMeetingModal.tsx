import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Video, Users, Loader2, Calendar, Clock, AlertCircle } from 'lucide-react';
import type { MeetingType } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultTeamId?: string;
}

export const ScheduleMeetingModal: React.FC<Props> = ({
  isOpen,
  onClose,
  defaultTeamId,
}) => {
  const { createMeeting, teams, activeTeamId, user } = useApp();

  const [title, setTitle] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>(
    defaultTeamId || activeTeamId || ''
  );
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(() => {
    const nextHour = new Date();
    nextHour.setHours(nextHour.getHours() + 1);
    const h = String(nextHour.getHours()).padStart(2, '0');
    return `${h}:00`;
  });
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [type, setType] = useState<MeetingType>('Video Conference');
  const [description, setDescription] = useState('');
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const initialTeam = defaultTeamId || activeTeamId || '';
      setSelectedTeamId(initialTeam);
      setErrorMessage(null);
      setIsSubmitting(false);

      // Auto-select members of the active team if any
      if (initialTeam) {
        const team = teams.find((t) => t.id === initialTeam);
        if (team && team.members) {
          setSelectedParticipantIds(
            team.members
              .filter((m) => m.userId && m.userId !== user?.id)
              .map((m) => m.userId)
          );
        }
      } else {
        setSelectedParticipantIds([]);
      }
    } else {
      setTitle('');
      setDescription('');
      setErrorMessage(null);
    }
  }, [isOpen, defaultTeamId, activeTeamId, teams, user?.id]);

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
  const availableMembers = currentTeam?.members?.filter(
    (m) => m.userId && m.userId !== user?.id
  ) || [];

  const handleTeamChange = (newTeamId: string) => {
    setSelectedTeamId(newTeamId);
    if (!newTeamId) {
      setSelectedParticipantIds([]);
      return;
    }
    const t = teams.find((team) => team.id === newTeamId);
    if (t?.members) {
      setSelectedParticipantIds(
        t.members.filter((m) => m.userId && m.userId !== user?.id).map((m) => m.userId)
      );
    } else {
      setSelectedParticipantIds([]);
    }
  };

  const toggleParticipant = (userId: string) => {
    setSelectedParticipantIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAllParticipants = () => {
    if (selectedParticipantIds.length === availableMembers.length) {
      setSelectedParticipantIds([]);
    } else {
      setSelectedParticipantIds(availableMembers.map((m) => m.userId));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Meeting title is required.');
      return;
    }
    if (!date) {
      setErrorMessage('Meeting date is required.');
      return;
    }
    if (!time) {
      setErrorMessage('Meeting time is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const created = await createMeeting({
        title: title.trim(),
        description: description.trim(),
        meetingDate: date,
        meetingTime: time,
        durationMinutes,
        type,
        teamId: selectedTeamId || undefined,
        participantIds: selectedParticipantIds,
      });

      if (created) {
        onClose();
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err && 'message' in err
          ? String((err as any).message)
          : 'Failed to schedule meeting.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="schedule-meeting-modal-title"
      onClick={!isSubmitting ? onClose : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[calc(100vh-2rem)] flex flex-col bg-white dark:bg-[#141414] rounded-3xl shadow-2xl border border-[#E5E5E5] dark:border-[#333333] overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E5E5] dark:border-[#333333] flex items-center justify-between shrink-0">
          <div id="schedule-meeting-modal-title" className="flex items-center gap-2.5 font-bold text-[#171717] dark:text-[#FAFAFA]">
            <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-[#F97316]">
              <Video className="w-5 h-5" />
            </div>
            <span>Schedule Meeting</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-[#737373] dark:text-[#A3A3A3] hover:text-[#171717] dark:hover:text-[#FAFAFA] transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {/* Meeting Title */}
          <div>
            <label className="block text-xs font-semibold text-[#171717] dark:text-[#FAFAFA] mb-1">
              Meeting Title <span className="text-[#F97316]">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Weekly Product Architecture & Sprint Review"
              className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#171717] dark:text-[#FAFAFA] text-xs focus:outline-none focus:ring-2 focus:ring-[#F97316]"
            />
          </div>

          {/* Team Context Scope */}
          <div>
            <label className="block text-xs font-semibold text-[#171717] dark:text-[#FAFAFA] mb-1">
              Team Workspace
            </label>
            <select
              value={selectedTeamId}
              onChange={(e) => handleTeamChange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#171717] dark:text-[#FAFAFA] text-xs focus:outline-none focus:ring-2 focus:ring-[#F97316]"
            >
              <option value="">General Workspace (No specific team)</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  Team: {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date, Time, Duration Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#171717] dark:text-[#FAFAFA] mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#F97316]" /> Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#171717] dark:text-[#FAFAFA] text-xs focus:outline-none focus:ring-2 focus:ring-[#F97316]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#171717] dark:text-[#FAFAFA] mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#F97316]" /> Time
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#171717] dark:text-[#FAFAFA] text-xs focus:outline-none focus:ring-2 focus:ring-[#F97316]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#171717] dark:text-[#FAFAFA] mb-1">
                Duration
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#171717] dark:text-[#FAFAFA] text-xs focus:outline-none focus:ring-2 focus:ring-[#F97316]"
              >
                <option value={15}>15 mins</option>
                <option value={30}>30 mins</option>
                <option value={45}>45 mins</option>
                <option value={60}>60 mins (1 hr)</option>
                <option value={90}>90 mins (1.5 hr)</option>
              </select>
            </div>
          </div>

          {/* Meeting Type */}
          <div>
            <label className="block text-xs font-semibold text-[#171717] dark:text-[#FAFAFA] mb-1">
              Meeting Category
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as MeetingType)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#171717] dark:text-[#FAFAFA] text-xs focus:outline-none focus:ring-2 focus:ring-[#F97316]"
            >
              <option value="Video Conference">Video Conference (General HD Call)</option>
              <option value="Subgroup Sync">Subgroup Sync</option>
              <option value="Project Standup">Project Standup</option>
              <option value="Review">Review & Demo</option>
            </select>
          </div>

          {/* Participants Picker */}
          {availableMembers.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#171717] dark:text-[#FAFAFA] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#F97316]" />
                  <span>Invite Team Members ({selectedParticipantIds.length}/{availableMembers.length})</span>
                </label>
                <button
                  type="button"
                  onClick={handleSelectAllParticipants}
                  className="text-[11px] text-[#F97316] hover:underline font-semibold"
                >
                  {selectedParticipantIds.length === availableMembers.length
                    ? 'Deselect All'
                    : 'Select All'}
                </button>
              </div>

              <div className="max-h-36 overflow-y-auto rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] p-2 space-y-1">
                {availableMembers.map((member) => {
                  const isSelected = selectedParticipantIds.includes(member.userId);
                  return (
                    <label
                      key={member.id}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                        isSelected
                          ? 'bg-orange-50 dark:bg-orange-950/40 text-[#171717] dark:text-[#FAFAFA]'
                          : 'hover:bg-white dark:hover:bg-[#222222] text-[#737373] dark:text-[#A3A3A3]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleParticipant(member.userId)}
                          className="rounded border-[#E5E5E5] text-[#F97316] focus:ring-[#F97316]"
                        />
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <span className="font-medium truncate">{member.name}</span>
                        <span className="text-[10px] text-[#737373] dark:text-[#A3A3A3]">
                          ({member.roleLabel})
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Description / Agenda */}
          <div>
            <label className="block text-xs font-semibold text-[#171717] dark:text-[#FAFAFA] mb-1">
              Meeting Agenda / Notes
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline deliverables, discussion items, links to project specs..."
              className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#171717] dark:text-[#FAFAFA] text-xs focus:outline-none focus:ring-2 focus:ring-[#F97316] resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#E5E5E5] dark:border-[#333333] shrink-0">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#737373] dark:text-[#A3A3A3] hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-5 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] dark:hover:bg-[#FB923C] text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Scheduling with Supabase...</span>
                </>
              ) : (
                <>
                  <Video className="w-4 h-4" />
                  <span>Schedule Meeting</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
