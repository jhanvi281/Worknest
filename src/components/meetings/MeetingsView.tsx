import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calendar,
  Clock,
  Plus,
  Play,
  Trash2,
  Video,
  AlertCircle,
  Loader2,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import { ScheduleMeetingModal } from './ScheduleMeetingModal';
import { PageHeader } from '../common/PageHeader';
import { EmptyState } from '../common/EmptyState';
import { CardSkeleton } from '../common/LoadingSkeleton';
import { getJitsiMeetingUrl } from '../../services/meetingService';
import type { Meeting } from '../../types';

export const MeetingsView: React.FC = () => {
  const {
    meetings,
    isLoadingMeetings,
    meetingsError,
    refreshMeetings,
    cancelMeeting,
    setActiveVideoMeeting,
    user,
    addToast,
  } = useApp();

  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [meetingPendingCancel, setMeetingPendingCancel] = useState<Meeting | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [copiedRoomId, setCopiedRoomId] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && meetingPendingCancel && !isCancelling) {
        setMeetingPendingCancel(null);
      }
    };
    if (meetingPendingCancel) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [meetingPendingCancel, isCancelling]);

  const upcomingMeetings = meetings.filter((m) => !m.isPast);
  const pastMeetings = meetings.filter((m) => m.isPast);

  const displayedMeetings =
    activeTab === 'upcoming'
      ? upcomingMeetings
      : activeTab === 'past'
      ? pastMeetings
      : meetings;

  const handleCopyRoom = (roomName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getJitsiMeetingUrl(roomName);
    navigator.clipboard.writeText(url);
    setCopiedRoomId(roomName);
    addToast('Meeting link copied to clipboard', 'info');
    setTimeout(() => setCopiedRoomId(null), 2000);
  };

  const handleConfirmCancel = async () => {
    if (!meetingPendingCancel) return;
    setIsCancelling(true);
    await cancelMeeting(meetingPendingCancel.id);
    setIsCancelling(false);
    setMeetingPendingCancel(null);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Page Header */}
      <PageHeader
        badge="Video Conferencing"
        badgeIcon={Video}
        title="Meetings & Calls"
        description="Real-time audio/video conferences powered by Jitsi Meet and PostgreSQL persistence."
        actions={[
          {
            label: isLoadingMeetings ? 'Refreshing...' : 'Refresh',
            icon: RefreshCw,
            onClick: () => refreshMeetings(),
            variant: 'secondary',
            disabled: isLoadingMeetings,
          },
          {
            label: 'Schedule Meeting',
            icon: Plus,
            onClick: () => setIsScheduleOpen(true),
            variant: 'primary',
          },
        ]}
      />

      {/* Error Banner */}
      {meetingsError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between gap-3 text-xs text-rose-700 dark:text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{meetingsError}</span>
          </div>
          <button
            onClick={() => refreshMeetings()}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#141414] border border-rose-200 dark:border-rose-900 font-semibold hover:bg-rose-50 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E5E5E5] dark:border-[#333333] pb-3">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'upcoming'
              ? 'bg-[#F97316] text-white shadow-sm'
              : 'text-[#737373] dark:text-[#A3A3A3] hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C]'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Upcoming Meetings</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'upcoming'
                ? 'bg-white/20 text-white'
                : 'bg-[#FAFAFA] dark:bg-[#222222] text-[#737373] dark:text-[#A3A3A3]'
            }`}
          >
            {upcomingMeetings.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('past')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'past'
              ? 'bg-[#F97316] text-white shadow-sm'
              : 'text-[#737373] dark:text-[#A3A3A3] hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C]'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Past Meetings</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'past'
                ? 'bg-white/20 text-white'
                : 'bg-[#FAFAFA] dark:bg-[#222222] text-[#737373] dark:text-[#A3A3A3]'
            }`}
          >
            {pastMeetings.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'all'
              ? 'bg-[#F97316] text-white shadow-sm'
              : 'text-[#737373] dark:text-[#A3A3A3] hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C]'
          }`}
        >
          <span>All ({meetings.length})</span>
        </button>
      </div>

      {/* Loading Skeleton / Spinner */}
      {isLoadingMeetings && meetings.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : meetingsError ? (
        <div className="p-8 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-center space-y-3">
          <div className="text-xs font-bold text-rose-700 dark:text-rose-300">
            {meetingsError}
          </div>
          <button
            onClick={() => refreshMeetings()}
            className="px-4 py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold transition shadow-sm cursor-pointer"
          >
            Retry Loading Meetings
          </button>
        </div>
      ) : displayedMeetings.length === 0 ? (
        <EmptyState
          icon={Video}
          title={activeTab === 'past' ? 'No Past Meetings' : 'No Upcoming Meetings Scheduled'}
          description={
            activeTab === 'past'
              ? 'Completed meetings will appear here with history and participant details.'
              : 'Connect with your team using real-time HD audio, video, and screen sharing.'
          }
          actionLabel={activeTab !== 'past' ? 'Schedule Your First Meeting' : undefined}
          onAction={activeTab !== 'past' ? () => setIsScheduleOpen(true) : undefined}
        />
      ) : (
        /* Meetings Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedMeetings.map((mtg) => {
            const isOrganizer = user?.id && mtg.organizerId === user.id;
            const roomName = mtg.roomName || `WorkNest-${mtg.id.replace(/[^a-zA-Z0-9]/g, '')}`;
            const isCopied = copiedRoomId === roomName;

            return (
              <div
                key={mtg.id}
                className="bg-white dark:bg-[#141414] rounded-3xl p-6 border border-[#E5E5E5] dark:border-[#333333] shadow-sm hover:shadow-xl transition-all space-y-4 flex flex-col justify-between"
              >
                {/* Card Top: Badges & Duration */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                        {mtg.type}
                      </span>
                      {mtg.teamName && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 dark:bg-orange-950/50 text-[#F97316]">
                          {mtg.teamName}
                        </span>
                      )}
                      {mtg.isPast && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                          Past
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-xs text-[#737373] dark:text-[#A3A3A3] font-medium shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{mtg.duration}</span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-[#171717] dark:text-[#FAFAFA] leading-snug">
                    {mtg.title}
                  </h3>

                  {mtg.description && (
                    <p className="text-xs text-[#737373] dark:text-[#A3A3A3] line-clamp-2 leading-relaxed">
                      {mtg.description}
                    </p>
                  )}

                  {/* Room identifier with copy action */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#FAFAFA] dark:bg-[#1C1C1C] border border-[#E5E5E5] dark:border-[#333333] text-[11px]">
                    <div className="truncate font-mono text-[#737373] dark:text-[#A3A3A3]">
                      Room: <span className="text-[#171717] dark:text-[#FAFAFA] font-medium">{roomName}</span>
                    </div>
                    <button
                      onClick={(e) => handleCopyRoom(roomName, e)}
                      title="Copy meeting link"
                      className="p-1 rounded text-[#737373] dark:text-[#A3A3A3] hover:text-[#F97316] transition-colors shrink-0"
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Card Bottom: Metadata & Actions */}
                <div className="space-y-3 pt-3 border-t border-[#E5E5E5] dark:border-[#333333]">
                  <div className="flex items-center justify-between text-xs text-[#737373] dark:text-[#A3A3A3]">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-[#F97316]" />
                      <span>
                        {mtg.date} at {mtg.time}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#737373] dark:text-[#A3A3A3] truncate max-w-[120px]">
                      Host: {mtg.organizer}
                    </div>
                  </div>

                  {/* Participant Avatars & Actions */}
                  <div className="flex items-center justify-between pt-1 gap-2">
                    {/* Participant Avatars */}
                    <div className="flex items-center">
                      <div className="flex -space-x-2 overflow-hidden">
                        {(mtg.participants || []).slice(0, 4).map((p, idx) => (
                          <img
                            key={idx}
                            src={p.avatar}
                            alt={p.name}
                            title={p.name}
                            className="inline-block h-7 w-7 rounded-full ring-2 ring-white dark:ring-[#141414] object-cover"
                          />
                        ))}
                      </div>
                      {(mtg.participants || []).length > 4 && (
                        <span className="ml-2 text-[10px] font-bold text-[#737373] dark:text-[#A3A3A3]">
                          +{mtg.participants.length - 4}
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isOrganizer && (
                        <button
                          onClick={() => setMeetingPendingCancel(mtg)}
                          title="Cancel meeting"
                          className="p-1.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => setActiveVideoMeeting(mtg)}
                        className={`px-3.5 py-1.5 rounded-xl text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition active:scale-95 ${
                          mtg.isPast
                            ? 'bg-neutral-600 hover:bg-neutral-700'
                            : 'bg-emerald-600 hover:bg-emerald-700'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{mtg.isPast ? 'Reopen Call' : 'Join Call'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Meeting Confirmation Dialog */}
      {meetingPendingCancel && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="cancel-meeting-title"
          onClick={!isCancelling ? () => setMeetingPendingCancel(null) : undefined}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white dark:bg-[#141414] rounded-3xl shadow-2xl border border-[#E5E5E5] dark:border-[#333333] p-6 space-y-4"
          >
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-2xl bg-rose-100 dark:bg-rose-950/60">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 id="cancel-meeting-title" className="font-bold text-base text-[#171717] dark:text-[#FAFAFA]">
                Cancel Meeting?
              </h3>
            </div>

            <p className="text-xs text-[#737373] dark:text-[#A3A3A3] leading-relaxed">
              Are you sure you want to cancel{' '}
              <span className="font-semibold text-[#171717] dark:text-[#FAFAFA]">
                "{meetingPendingCancel.title}"
              </span>
              ? This meeting and participant invites will be removed from Supabase.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isCancelling}
                onClick={() => setMeetingPendingCancel(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#737373] dark:text-[#A3A3A3] hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C] transition-colors disabled:opacity-50"
              >
                Keep Meeting
              </button>
              <button
                type="button"
                disabled={isCancelling}
                onClick={handleConfirmCancel}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  'Yes, Cancel'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Meeting Modal */}
      <ScheduleMeetingModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
      />
    </div>
  );
};
