import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bot,
  Send,
  BrainCircuit,
  TrendingUp,
  AlertTriangle,
  Users,
  CheckCircle2,
} from 'lucide-react';

export const AIAssistantView: React.FC = () => {
  const { aiMessages, sendAIMessage, user } = useApp();
  const [inputQuery, setInputQuery] = useState('');

  const suggestedPrompts = [
    'Break this task into smaller steps',
    "Summarize today's team progress",
    'Which tasks need attention?',
    'Suggest priorities for my team',
    'Summarize our recent discussion',
    'Analyze project progress',
  ];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim()) return;
    sendAIMessage(inputQuery);
    setInputQuery('');
  };

  const handlePromptClick = (prompt: string) => {
    sendAIMessage(prompt);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
          <BrainCircuit className="w-4 h-4 text-indigo-500" /> Neural Workspace Intelligence
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          WorkNest AI
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Your intelligent project assistant.
        </p>
      </div>

      {/* AI INSIGHT CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Project Health</span>
            <div className="text-xl font-extrabold text-emerald-600">94% Optimal</div>
          </div>
          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Team Workload</span>
            <div className="text-xl font-extrabold text-indigo-600">Balanced</div>
          </div>
          <Users className="w-6 h-6 text-indigo-500" />
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Task Risk</span>
            <div className="text-xl font-extrabold text-amber-600">2 Items</div>
          </div>
          <AlertTriangle className="w-6 h-6 text-amber-500" />
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Productivity Velocity</span>
            <div className="text-xl font-extrabold text-purple-600">+14% Weekly</div>
          </div>
          <TrendingUp className="w-6 h-6 text-purple-500" />
        </div>
      </div>

      {/* AI CHAT WORKSPACE AREA */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[560px] overflow-hidden">
        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Welcome Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 text-white space-y-3">
            <div className="flex items-center gap-2.5">
              <Bot className="w-6 h-6 text-indigo-400" />
              <span className="text-base font-bold">How can I help you with your work today?</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              WorkNest AI is continuously synchronized with your tasks, teams, daily logs, files, and chat. Select a prompt or type your query below.
            </p>

            {/* Suggested Prompt Chips */}
            <div className="pt-2 flex flex-wrap gap-2">
              {suggestedPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePromptClick(p)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs text-slate-200 font-medium transition active:scale-95"
                >
                  ✨ {p}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation History */}
          {aiMessages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div key={msg.id} className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                {isUser ? (
                  <img src={user?.avatar || 'https://ui-avatars.com/api/?name=User&background=6366f1&color=fff'} alt={user?.name || 'User'} className="w-8 h-8 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0">
                    <Bot className="w-5 h-5" />
                  </div>
                )}

                <div className={`max-w-2xl space-y-2 ${isUser ? 'items-end text-right' : ''}`}>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {isUser ? (user?.name || 'User') : 'WorkNest AI'}
                    </span>
                    <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                  </div>

                  <div
                    className={`p-4 rounded-2xl text-xs leading-relaxed ${
                      isUser
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    {msg.text}

                    {/* Insights Cards attached to AI reply */}
                    {msg.insights && msg.insights.length > 0 && (
                      <div className="mt-3 space-y-2 text-left">
                        {msg.insights.map((ins, i) => (
                          <div
                            key={i}
                            className={`p-3 rounded-xl border text-xs ${
                              ins.type === 'success'
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                                : ins.type === 'warning' || ins.type === 'urgent'
                                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                                : 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200'
                            }`}
                          >
                            <span className="font-bold block mb-0.5">{ins.title}</span>
                            <p className="opacity-90">{ins.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask WorkNest AI anything about your tasks, velocity, or project health..."
            className="flex-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <button
            type="submit"
            className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 transition"
          >
            <span>Ask AI</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
