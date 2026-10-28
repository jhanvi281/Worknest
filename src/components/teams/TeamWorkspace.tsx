import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  LayoutDashboard,
  CheckSquare,
  UserCheck,
  CalendarCheck,
  MessageSquare,
  FileText,
  Video,
  Sparkles,
  Shield,
  Clock,
} from 'lucide-react';
import { TeamMembers } from './TeamMembers';
import { TeamTasks } from './TeamTasks';
import { DailyLogs } from '../logs/DailyLogs';
import { ChatView } from '../chat/ChatView';
import { FilesView } from '../files/FilesView';
import { MeetingsView } from '../meetings/MeetingsView';

export const TeamWorkspace: React.FC = () => {
  const { activeTeamId, teams } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'members' | 'logs' | 'chat' | 'files' | 'meetings'>('overview');

  const team = teams.find((t) => t.id === activeTeamId) || teams[0];

  if (!team) return null;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* TEAM WORKSPACE HEADER */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1">
              <Users className="w-4 h-4" /> Team Workspace
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {team.name}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
              {team.description}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200/60 dark:border-purple-800/60 text-xs text-purple-700 dark:text-purple-300">
              <Shield className="w-4 h-4 text-purple-600" />
              <span>Leader: <strong>{team.leaderName}</strong></span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/60 text-xs text-indigo-700 dark:text-indigo-300">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Deadline: <strong>{team.deadline}</strong></span>
            </div>
          </div>
        </div>

        {/* Project Progress Bar */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-600 dark:text-slate-400">Milestone Target Completion</span>
            <span className="text-purple-600 dark:text-purple-400 font-bold">{team.projectProgress}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 rounded-full"
              style={{ width: `${team.projectProgress}%` }}
            />
          </div>
        </div>

        {/* Workspace Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 pt-2 overflow-x-auto text-xs font-bold">
          {[
            { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
            { id: 'tasks', label: 'Tasks', icon: <CheckSquare className="w-4 h-4" /> },
            { id: 'members', label: 'Members', icon: <UserCheck className="w-4 h-4" /> },
            { id: 'logs', label: 'Daily Logs', icon: <CalendarCheck className="w-4 h-4" /> },
            { id: 'chat', label: 'Chat', icon: <MessageSquare className="w-4 h-4" /> },
            { id: 'files', label: 'Files', icon: <FileText className="w-4 h-4" /> },
            { id: 'meetings', label: 'Meetings', icon: <Video className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition shrink-0 ${
                activeTab === tab.id
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-950/30'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* TAB CONTENTS */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Overview Grid Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">Subgroups</span>
              <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">{team.subgroups.length}</div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">Team Members</span>
              <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">{team.memberCount}</div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">Active Tasks</span>
              <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">{team.activeTasks}</div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">Velocity Score</span>
              <div className="mt-2 text-2xl font-extrabold text-emerald-600">92%</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 cols: Workload & Activity */}
            <div className="lg:col-span-2 space-y-6">
              {/* Subgroup Workload Breakdown */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Subgroup Workload & Progress</h3>
                <div className="space-y-3">
                  {team.subgroups.map((sg) => (
                    <div key={sg.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{sg.name}</span>
                          <span className="text-slate-400 ml-2">Leader: {sg.leaderName}</span>
                        </div>
                        <span className="font-semibold text-purple-600">{sg.memberCount} Members</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div className="h-full bg-purple-600 rounded-full" style={{ width: `${70 + Math.random() * 20}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Project Insights Right Card */}
            <div className="bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 border border-purple-800 shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-purple-400" />
                AI Project Insights
              </div>

              <p className="text-xs text-slate-200 leading-relaxed">
                "Subgroup velocity is highest in Development. QA task backlog is light. Team deadline of {team.deadline} is on track."
              </p>

              <div className="pt-2 border-t border-purple-800/60 space-y-2">
                <div className="text-[11px] font-bold text-purple-300">Recommended Action:</div>
                <div className="p-2.5 rounded-xl bg-slate-900/80 text-xs text-slate-300">
                  Assign 1 upcoming QA task to David Chen to boost testing iteration speed.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tasks' && <TeamTasks teamId={team.id} />}
      {activeTab === 'members' && <TeamMembers teamId={team.id} />}
      {activeTab === 'logs' && <DailyLogs />}
      {activeTab === 'chat' && <ChatView />}
      {activeTab === 'files' && <FilesView />}
      {activeTab === 'meetings' && <MeetingsView />}
    </div>
  );
};
