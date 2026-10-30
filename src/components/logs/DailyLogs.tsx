import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  CalendarCheck,
  Clock,
  Plus,
  Trash2,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronUp,
  Send,
  Loader2,
  Filter,
} from 'lucide-react';

export const DailyLogs: React.FC = () => {
  const {
    dailyLogs,
    isLoadingDailyLogs,
    dailyLogsError,
    addDailyLog,
    deleteDailyLog,
    refreshDailyLogs,
    user,
    teams,
    activeTeamId,
  } = useApp();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [hoursWorked, setHoursWorked] = useState('8');
  const [workCompleted, setWorkCompleted] = useState('');
  const [challengesFaced, setChallengesFaced] = useState('');
  const [planForTomorrow, setPlanForTomorrow] = useState('');
  const [selectedSubgroupId, setSelectedSubgroupId] = useState('');
  const [logDate, setLogDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [filterSubgroup, setFilterSubgroup] = useState('all');
  const [logPendingDelete, setLogPendingDelete] = useState<{ id: string; date: string } | null>(null);
  const [isDeletingLog, setIsDeletingLog] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && logPendingDelete && !isDeletingLog) {
        setLogPendingDelete(null);
      }
    };
    if (logPendingDelete) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [logPendingDelete, isDeletingLog]);

  const activeTeam = teams.find((t) => t.id === activeTeamId) || teams[0];
  const subgroups = activeTeam?.subgroups || [];

  const todayStr = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!workCompleted.trim()) {
      setFormError('Please detail the work completed today.');
      return;
    }

    const hours = parseFloat(hoursWorked);
    if (isNaN(hours) || hours <= 0 || hours > 24) {
      setFormError('Hours worked must be a number between 0.1 and 24.');
      return;
    }

    setIsSubmitting(true);
    const sgObj = subgroups.find((s) => s.id === selectedSubgroupId);
    try {
      const success = await addDailyLog({
        date: logDate,
        hoursWorked: hours,
        workCompleted: workCompleted.trim(),
        challengesFaced: challengesFaced.trim(),
        planForTomorrow: planForTomorrow.trim(),
        teamId: activeTeamId || undefined,
        subgroupId: selectedSubgroupId || undefined,
        subgroup: sgObj?.name || 'Development',
      });

      if (success) {
        setWorkCompleted('');
        setChallengesFaced('');
        setPlanForTomorrow('');
        setHoursWorked('8');
        setIsFormOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!logPendingDelete || isDeletingLog) return;
    setIsDeletingLog(true);
    await deleteDailyLog(logPendingDelete.id);
    setIsDeletingLog(false);
    setLogPendingDelete(null);
  };

  const filteredLogs = dailyLogs.filter((log) => {
    if (filterSubgroup !== 'all') {
      if (log.subgroupId && log.subgroupId !== filterSubgroup) return false;
      if (!log.subgroupId && log.subgroup !== filterSubgroup) return false;
    }
    return true;
  });

  const totalHours = dailyLogs.reduce((acc, log) => acc + (Number(log.hoursWorked) || 0), 0);
  const hasLoggedToday = dailyLogs.some((l) => l.date === todayStr && l.userId === user?.id);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in font-sans">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#F97316] uppercase tracking-wider mb-1">
            <CalendarCheck className="w-4 h-4" /> Work Accountability & Progress
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#171717] dark:text-[#FAFAFA] tracking-tight">
            Daily Work Logs
          </h1>
          <p className="text-sm text-[#737373] dark:text-[#A3A3A3] mt-1">
            Track daily hours, accomplishments, blockers, and next-day commitments.
          </p>
        </div>

        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="px-4 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] dark:hover:bg-[#FB923C] text-white font-bold text-xs shadow-sm flex items-center gap-2 self-start md:self-auto transition"
        >
          {isFormOpen ? <ChevronUp className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{isFormOpen ? 'Close Form' : 'New Log Entry'}</span>
        </button>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#333333] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-[#737373] dark:text-[#A3A3A3] font-medium">Total Logs</span>
            <div className="text-2xl font-extrabold text-[#171717] dark:text-[#FAFAFA]">{dailyLogs.length}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-orange-500/10 text-[#F97316]">
            <CalendarCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#333333] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-[#737373] dark:text-[#A3A3A3] font-medium">Hours Logged</span>
            <div className="text-2xl font-extrabold text-[#171717] dark:text-[#FAFAFA]">{totalHours.toFixed(1)}h</div>
          </div>
          <div className="p-2.5 rounded-xl bg-orange-500/10 text-[#F97316]">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#333333] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-[#737373] dark:text-[#A3A3A3] font-medium">Today's Status</span>
            <div className={`text-sm font-bold mt-1 ${hasLoggedToday ? 'text-emerald-500' : 'text-amber-500'}`}>
              {hasLoggedToday ? 'Submitted' : 'Pending Entry'}
            </div>
          </div>
          <div className={`p-2.5 rounded-xl ${hasLoggedToday ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
            {hasLoggedToday ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#333333] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-[#737373] dark:text-[#A3A3A3] font-medium">Active Subgroup</span>
            <div className="text-sm font-bold text-[#171717] dark:text-[#FAFAFA] mt-1 truncate max-w-[120px]">
              {subgroups.find((s) => s.id === selectedSubgroupId)?.name || 'Development'}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#737373] dark:text-[#A3A3A3] border border-[#E5E5E5] dark:border-[#333333]">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* COLLAPSIBLE LOG ENTRY SUBMISSION CARD */}
      {isFormOpen && (
        <div className="bg-white dark:bg-[#141414] rounded-3xl p-6 border border-[#F97316]/40 shadow-sm space-y-5 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5] dark:border-[#333333]">
            <h2 className="text-base font-bold text-[#171717] dark:text-[#FAFAFA] flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-[#F97316]" />
              <span>Submit Daily Work Log</span>
            </h2>
            <span className="text-xs text-[#737373] dark:text-[#A3A3A3]">Date: {logDate}</span>
          </div>

          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-500 font-medium">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#171717] dark:text-[#FAFAFA] mb-1">
                  Log Date
                </label>
                <input
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#171717] dark:text-[#FAFAFA] text-xs focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#171717] dark:text-[#FAFAFA] mb-1">
                  Hours Worked
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  required
                  value={hoursWorked}
                  onChange={(e) => setHoursWorked(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#171717] dark:text-[#FAFAFA] text-xs focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                />
              </div>

              {subgroups.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-[#171717] dark:text-[#FAFAFA] mb-1">
                    Assigned Subgroup
                  </label>
                  <select
                    value={selectedSubgroupId}
                    onChange={(e) => setSelectedSubgroupId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#171717] dark:text-[#FAFAFA] text-xs focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                  >
                    <option value="">General Subgroup</option>
                    {subgroups.map((sg) => (
                      <option key={sg.id} value={sg.id}>
                        {sg.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#171717] dark:text-[#FAFAFA] mb-1">
                Work Completed <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={workCompleted}
                onChange={(e) => setWorkCompleted(e.target.value)}
                placeholder="What deliverables, tasks, or milestones did you complete today?"
                className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#171717] dark:text-[#FAFAFA] text-xs focus:outline-none focus:ring-2 focus:ring-[#F97316]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#171717] dark:text-[#FAFAFA] mb-1">
                  Challenges / Blockers Encountered
                </label>
                <textarea
                  rows={2}
                  value={challengesFaced}
                  onChange={(e) => setChallengesFaced(e.target.value)}
                  placeholder="Any roadblocks, dependencies, or technical issues?"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#171717] dark:text-[#FAFAFA] text-xs focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#171717] dark:text-[#FAFAFA] mb-1">
                  Plan for Tomorrow
                </label>
                <textarea
                  rows={2}
                  value={planForTomorrow}
                  onChange={(e) => setPlanForTomorrow(e.target.value)}
                  placeholder="Key priorities and next steps for the upcoming workday..."
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#171717] dark:text-[#FAFAFA] text-xs focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#737373] dark:text-[#A3A3A3] hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C] transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] dark:hover:bg-[#FB923C] text-white font-bold text-xs shadow-sm flex items-center gap-2 transition disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Daily Log</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FILTER & HEADER BAR */}
      <div className="bg-white dark:bg-[#141414] p-4 rounded-3xl border border-[#E5E5E5] dark:border-[#333333] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-[#171717] dark:text-[#FAFAFA]">
          <Calendar className="w-4 h-4 text-[#F97316]" />
          <span>Work Log History</span>
        </div>

        {subgroups.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-[#737373] dark:text-[#A3A3A3] w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={filterSubgroup}
              onChange={(e) => setFilterSubgroup(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-xs font-medium text-[#171717] dark:text-[#FAFAFA] focus:outline-none"
            >
              <option value="all">All Subgroups</option>
              {subgroups.map((sg) => (
                <option key={sg.id} value={sg.id}>
                  {sg.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* LOG ENTRIES TIMELINE CONTAINER */}
      <div className="space-y-4">
        {isLoadingDailyLogs ? (
          <div className="p-12 text-center text-[#737373] dark:text-[#A3A3A3] space-y-3 bg-white dark:bg-[#141414] rounded-3xl border border-[#E5E5E5] dark:border-[#333333]">
            <div className="w-6 h-6 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="text-xs font-semibold text-[#737373] dark:text-[#A3A3A3]">Loading daily work logs from Supabase...</div>
          </div>
        ) : dailyLogsError ? (
          <div className="p-6 text-center text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-3xl space-y-2 text-xs">
            <div>{dailyLogsError}</div>
            <button
              onClick={refreshDailyLogs}
              className="text-[#F97316] font-bold hover:underline"
            >
              Retry
            </button>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-[#737373] dark:text-[#A3A3A3] space-y-3 bg-white dark:bg-[#141414] rounded-3xl border border-[#E5E5E5] dark:border-[#333333]">
            <CalendarCheck className="w-12 h-12 mx-auto text-[#737373] dark:text-[#A3A3A3] opacity-40" />
            <div className="text-base font-bold text-[#171717] dark:text-[#FAFAFA]">No Daily Logs Submitted</div>
            <p className="text-xs text-[#737373] dark:text-[#A3A3A3] max-w-sm mx-auto">
              You haven't submitted any daily logs yet. Use the "New Log Entry" button above to log today's progress.
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isOwner = log.userId === user?.id;
            return (
              <div
                key={log.id}
                className="bg-white dark:bg-[#141414] rounded-3xl p-6 border border-[#E5E5E5] dark:border-[#333333] shadow-sm space-y-4 hover:border-[#F97316]/40 transition group"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E5E5] dark:border-[#333333]">
                  <div className="flex items-center gap-3">
                    <img
                      src={log.userAvatar}
                      alt={log.userName}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-[#F97316]/20"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#171717] dark:text-[#FAFAFA]">{log.userName}</span>
                        {isOwner && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-[#F97316]">
                            You
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-[#737373] dark:text-[#A3A3A3]">
                        <span>{log.subgroup}</span>
                        <span>•</span>
                        <span>{log.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#FAFAFA] dark:bg-[#1C1C1C] border border-[#E5E5E5] dark:border-[#333333] text-[#171717] dark:text-[#FAFAFA] text-xs font-bold">
                      <Clock className="w-3.5 h-3.5 text-[#F97316]" />
                      <span>{log.hoursWorked} hrs</span>
                    </div>

                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => setLogPendingDelete({ id: log.id, date: log.date })}
                        className="p-1.5 rounded-lg text-[#737373] hover:text-rose-500 hover:bg-rose-500/10 transition opacity-80 group-hover:opacity-100"
                        title="Delete log"
                        aria-label="Delete log entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Body Content */}
                <div className="space-y-3 text-xs leading-relaxed">
                  <div>
                    <div className="font-bold text-[#171717] dark:text-[#FAFAFA] mb-1 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Work Completed</span>
                    </div>
                    <p className="text-[#171717] dark:text-[#FAFAFA] bg-[#FAFAFA] dark:bg-[#1C1C1C] p-3 rounded-2xl whitespace-pre-line border border-[#E5E5E5] dark:border-[#333333]">
                      {log.workCompleted}
                    </p>
                  </div>

                  {log.challengesFaced && (
                    <div>
                      <div className="font-bold text-[#171717] dark:text-[#FAFAFA] mb-1 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                        <span>Challenges & Blockers</span>
                      </div>
                      <p className="text-[#171717] dark:text-[#FAFAFA] bg-amber-500/5 dark:bg-amber-950/20 p-3 rounded-2xl whitespace-pre-line border border-amber-500/20">
                        {log.challengesFaced}
                      </p>
                    </div>
                  )}

                  {log.planForTomorrow && (
                    <div>
                      <div className="font-bold text-[#171717] dark:text-[#FAFAFA] mb-1 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#F97316]" />
                        <span>Plan for Tomorrow</span>
                      </div>
                      <p className="text-[#171717] dark:text-[#FAFAFA] bg-orange-500/5 dark:bg-orange-950/20 p-3 rounded-2xl whitespace-pre-line border border-orange-500/20">
                        {log.planForTomorrow}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {logPendingDelete && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-log-title"
          onClick={!isDeletingLog ? () => setLogPendingDelete(null) : undefined}
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
                <h3 id="delete-log-title" className="text-sm font-bold text-[#171717] dark:text-[#FAFAFA]">Delete Work Log?</h3>
                <p className="text-xs text-[#737373] dark:text-[#A3A3A3]">This action will permanently delete the log entry.</p>
              </div>
            </div>

            <p className="text-xs text-[#171717] dark:text-[#FAFAFA] font-medium bg-[#FAFAFA] dark:bg-[#1C1C1C] p-3 rounded-xl border border-[#E5E5E5] dark:border-[#333333] truncate">
              Log date: {logPendingDelete.date}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setLogPendingDelete(null)}
                disabled={isDeletingLog}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#737373] dark:text-[#A3A3A3] hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C] transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeletingLog}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {isDeletingLog ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  'Delete Log'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
