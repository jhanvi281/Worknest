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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Header Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 gap-3">
          <Search className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, teams, members, files, messages, meetings..."
            className="w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-base focus:outline-none"
          />
          <button
            onClick={() => setIsSearchOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-4 space-y-5">
          {/* Tasks Group */}
          {filteredTasks.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-2">
                <span className="flex items-center gap-1.5"><CheckSquare className="w-3.5 h-3.5" /> Tasks</span>
                <span>{filteredTasks.length}</span>
              </div>
              <div className="space-y-1">
                {filteredTasks.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleNavigate('my_tasks')}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-indigo-50/70 dark:hover:bg-slate-800/80 text-left transition group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full ${t.status === 'completed' ? 'bg-emerald-500' : t.priority === 'urgent' ? 'bg-rose-500' : 'bg-indigo-500'}`} />
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{t.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">{t.category}</span>
                      <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Teams Group */}
          {filteredTeams.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-2">
                <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Teams</span>
                <span>{filteredTeams.length}</span>
              </div>
              <div className="space-y-1">
                {filteredTeams.map((tm) => (
                  <button
                    key={tm.id}
                    onClick={() => handleNavigate('team_workspace', tm.id)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-purple-50/70 dark:hover:bg-slate-800/80 text-left transition group"
                  >
                    <div>
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400">{tm.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{tm.description}</div>
                    </div>
                    <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg shrink-0">{tm.memberCount} Members</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Files Group */}
          {filteredFiles.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-2">
                <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Files</span>
                <span>{filteredFiles.length}</span>
              </div>
              <div className="space-y-1">
                {filteredFiles.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => handleNavigate('files')}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-cyan-50/70 dark:hover:bg-slate-800/80 text-left transition group"
                  >
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400">{f.name}</span>
                    <span className="text-xs text-slate-400">{f.size}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Meetings Group */}
          {filteredMeetings.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-2">
                <span className="flex items-center gap-1.5"><Video className="w-3.5 h-3.5" /> Meetings</span>
                <span>{filteredMeetings.length}</span>
              </div>
              <div className="space-y-1">
                {filteredMeetings.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleNavigate('meetings')}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-emerald-50/70 dark:hover:bg-slate-800/80 text-left transition group"
                  >
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">{m.title}</span>
                    <span className="text-xs text-slate-400">{m.date} at {m.time}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages Group */}
          {filteredMessages.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-2">
                <span className="flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> Messages</span>
                <span>{filteredMessages.length}</span>
              </div>
              <div className="space-y-1">
                {filteredMessages.map((msg) => (
                  <button
                    key={msg.id}
                    onClick={() => handleNavigate('chat')}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-amber-50/70 dark:hover:bg-slate-800/80 text-left transition group"
                  >
                    <span className="text-sm text-slate-700 dark:text-slate-300 line-clamp-1">{msg.senderName}: {msg.text}</span>
                    <span className="text-xs text-slate-400">{msg.timestamp}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Navigate with click or arrow keys</span>
          <span className="flex items-center gap-1 font-mono bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded">ESC to close</span>
        </div>
      </div>
    </div>
  );
};
