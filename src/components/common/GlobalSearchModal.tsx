import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Search, X, CheckSquare, Users, FileText, MessageSquare, Video, ArrowRight } from 'lucide-react';
import type { AppView } from '../../types';

export const GlobalSearchModal: React.FC = () => {
  const { isSearchOpen, setIsSearchOpen, tasks, teams, files, messages, meetings, setCurrentView, setActiveTeamId } = useApp();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  if (!isSearchOpen) return null;

  const filteredTasks = query
    ? tasks.filter((t) => t.title.toLowerCase().includes(query.toLowerCase()) || t.category.toLowerCase().includes(query.toLowerCase()))
    : tasks.slice(0, 3);

  const filteredTeams = query
    ? teams.filter((tm) => tm.name.toLowerCase().includes(query.toLowerCase()) || tm.description.toLowerCase().includes(query.toLowerCase()))
    : teams;

  const filteredFiles = query
    ? files.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()))
    : files.slice(0, 3);

  const filteredMessages = query
    ? messages.filter((m) => m.text.toLowerCase().includes(query.toLowerCase()))
    : [];

  const filteredMeetings = query
    ? meetings.filter((m) => m.title.toLowerCase().includes(query.toLowerCase()))
    : meetings.slice(0, 2);

  const handleNavigate = (view: AppView, teamId?: string) => {
    if (teamId) setActiveTeamId(teamId);
    setCurrentView(view);
    setIsSearchOpen(false);
    setQuery('');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Global search"
      onClick={() => setIsSearchOpen(false)}
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white dark:bg-[#141414] rounded-2xl shadow-2xl border border-[#E5E5E5] dark:border-[#333333] overflow-hidden flex flex-col max-h-[80vh]"
      >
        {/* Search Header Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#E5E5E5] dark:border-[#333333] gap-3">
          <Search className="w-5 h-5 text-[#F97316] shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, teams, members, files, messages, meetings..."
            aria-label="Search query"
            className="w-full bg-transparent text-[#171717] dark:text-[#FAFAFA] placeholder:text-[#A3A3A3] text-base focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setIsSearchOpen(false)}
            aria-label="Close search dialog"
            className="p-1 rounded-lg text-[#737373] dark:text-[#A3A3A3] hover:text-[#171717] dark:hover:text-[#FAFAFA] hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-4 space-y-5">
          {/* Tasks Group */}
          {filteredTasks.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-[#737373] dark:text-[#A3A3A3] uppercase tracking-wider mb-2 px-2">
                <span className="flex items-center gap-1.5"><CheckSquare className="w-3.5 h-3.5" /> Tasks</span>
                <span>{filteredTasks.length}</span>
              </div>
              <div className="space-y-1">
                {filteredTasks.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleNavigate('my_tasks')}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-orange-50/60 dark:hover:bg-[#1C1C1C] text-left transition group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full ${t.status === 'completed' ? 'bg-emerald-500' : t.priority === 'urgent' ? 'bg-rose-500' : 'bg-[#F97316]'}`} />
                      <span className="text-sm font-medium text-[#171717] dark:text-[#FAFAFA] group-hover:text-[#F97316]">{t.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#737373] dark:text-[#A3A3A3] px-2 py-0.5 rounded bg-[#FAFAFA] dark:bg-[#1C1C1C] border border-[#E5E5E5] dark:border-[#333333]">{t.category}</span>
                      <ArrowRight className="w-4 h-4 text-[#737373] opacity-0 group-hover:opacity-100 transition" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Teams Group */}
          {filteredTeams.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-[#737373] dark:text-[#A3A3A3] uppercase tracking-wider mb-2 px-2">
                <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Teams</span>
                <span>{filteredTeams.length}</span>
              </div>
              <div className="space-y-1">
                {filteredTeams.map((tm) => (
                  <button
                    key={tm.id}
                    onClick={() => handleNavigate('team_workspace', tm.id)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-orange-50/60 dark:hover:bg-[#1C1C1C] text-left transition group"
                  >
                    <div>
                      <div className="text-sm font-medium text-[#171717] dark:text-[#FAFAFA] group-hover:text-[#F97316]">{tm.name}</div>
                      <div className="text-xs text-[#737373] dark:text-[#A3A3A3] line-clamp-1">{tm.description}</div>
                    </div>
                    <span className="text-xs text-[#737373] dark:text-[#A3A3A3] bg-[#FAFAFA] dark:bg-[#1C1C1C] border border-[#E5E5E5] dark:border-[#333333] px-2 py-1 rounded-lg shrink-0">{tm.memberCount} Members</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Files Group */}
          {filteredFiles.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-[#737373] dark:text-[#A3A3A3] uppercase tracking-wider mb-2 px-2">
                <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Files</span>
                <span>{filteredFiles.length}</span>
              </div>
              <div className="space-y-1">
                {filteredFiles.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => handleNavigate('files')}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-orange-50/60 dark:hover:bg-[#1C1C1C] text-left transition group"
                  >
                    <span className="text-sm font-medium text-[#171717] dark:text-[#FAFAFA] group-hover:text-[#F97316]">{f.name}</span>
                    <span className="text-xs text-[#737373] dark:text-[#A3A3A3]">{f.size}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Meetings Group */}
          {filteredMeetings.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-[#737373] dark:text-[#A3A3A3] uppercase tracking-wider mb-2 px-2">
                <span className="flex items-center gap-1.5"><Video className="w-3.5 h-3.5" /> Meetings</span>
                <span>{filteredMeetings.length}</span>
              </div>
              <div className="space-y-1">
                {filteredMeetings.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleNavigate('meetings')}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-orange-50/60 dark:hover:bg-[#1C1C1C] text-left transition group"
                  >
                    <span className="text-sm font-medium text-[#171717] dark:text-[#FAFAFA] group-hover:text-[#F97316]">{m.title}</span>
                    <span className="text-xs text-[#737373] dark:text-[#A3A3A3]">{m.date} at {m.time}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages Group */}
          {filteredMessages.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-[#737373] dark:text-[#A3A3A3] uppercase tracking-wider mb-2 px-2">
                <span className="flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> Messages</span>
                <span>{filteredMessages.length}</span>
              </div>
              <div className="space-y-1">
                {filteredMessages.map((msg) => (
                  <button
                    key={msg.id}
                    onClick={() => handleNavigate('chat')}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-orange-50/60 dark:hover:bg-[#1C1C1C] text-left transition group"
                  >
                    <span className="text-sm text-[#171717] dark:text-[#FAFAFA] line-clamp-1">{msg.senderName}: {msg.text}</span>
                    <span className="text-xs text-[#737373] dark:text-[#A3A3A3]">{msg.timestamp}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-[#FAFAFA] dark:bg-[#1C1C1C] border-t border-[#E5E5E5] dark:border-[#333333] flex items-center justify-between text-xs text-[#737373] dark:text-[#A3A3A3]">
          <span>Navigate with click or arrow keys</span>
          <span className="flex items-center gap-1 font-mono bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#333333] px-1.5 py-0.5 rounded">ESC to close</span>
        </div>
      </div>
    </div>
  );
};
