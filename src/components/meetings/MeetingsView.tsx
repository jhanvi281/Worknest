import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Calendar, Clock, Plus, Play } from 'lucide-react';
import { ScheduleMeetingModal } from './ScheduleMeetingModal';
import { VideoConferenceModal } from './VideoConferenceModal';

export const MeetingsView: React.FC = () => {
  const { meetings, activeVideoMeeting, setActiveVideoMeeting, addToast } = useApp();
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  const upcomingMeetings = meetings.filter((m) => !m.isPast);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Meetings
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Schedule and conduct audio/video meetings with your team.
          </p>
        </div>

        <button
          onClick={() => setIsScheduleOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" /> Schedule Meeting
        </button>
      </div>

      {/* UPCOMING MEETINGS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
          <Calendar className="w-4 h-4" /> Upcoming Meetings
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingMeetings.map((mtg) => (
            <div
              key={mtg.id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                    {mtg.type}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{mtg.duration}</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">{mtg.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{mtg.description}</p>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{mtg.date} at {mtg.time}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Organizer: {mtg.organizer}</div>
                </div>

                {/* Participant Avatars */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex -space-x-2 overflow-hidden">
                    {mtg.participants.map((p, idx) => (
                      <img
                        key={idx}
                        src={p.avatar}
                        alt={p.name}
                        className="inline-block h-7 w-7 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover"
                      />
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => addToast(`Meeting Details: ${mtg.title} (${mtg.duration})`, 'info')}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200 transition"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => setActiveVideoMeeting(mtg)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Join Meeting
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Schedule Meeting Modal */}
      <ScheduleMeetingModal isOpen={isScheduleOpen} onClose={() => setIsScheduleOpen(false)} />

      {/* Video Conference Active Overlay */}
      {activeVideoMeeting && (
        <VideoConferenceModal meeting={activeVideoMeeting} onClose={() => setActiveVideoMeeting(null)} />
      )}
    </div>
  );
};
