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
  const { activeTeamId, teams, tasks } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'members' | 'logs' | 'chat' | 'files' | 'meetings'>('overview');

  const team = teams.find((t) => t.id === activeTeamId) || teams[0];

  if (!team) return null;

  // Real team tasks & metrics
  const teamTasks = tasks.filter((t) => t.teamId === team.id);
  const completedTeamTasks = teamTasks.filter((t) => t.status === 'completed').length;
  const teamProgress =
    teamTasks.length > 0
      ? Math.round((completedTeamTasks / teamTasks.length) * 100)
      : typeof team.projectProgress === 'number'
      ? team.projectProgress
      : 0;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* TEAM WORKSPACE HEADER */}
      <div className="bg-white dark:bg-[#141414] rounded-3xl p-6 md:p-8 border border-[#E5E5E5] dark:border-[#333333] shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#F97316] uppercase tracking-wider mb-1">
              <Users className="w-4 h-4" /> Team Workspace
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#171717] dark:text-[#FAFAFA] tracking-tight">
              {team.name}
            </h1>
            <p className="text-sm text-[#737373] dark:text-[#A3A3A3] mt-1 max-w-2xl">
              {team.description}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-800/60 text-xs text-orange-700 dark:text-orange-300">
              <Shield className="w-4 h-4 text-[#F97316]" />
              <span>Leader: <strong>{team.leaderName}</strong></span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FAFAFA] dark:bg-[#1C1C1C] border border-[#E5E5E5] dark:border-[#333333] text-xs text-[#737373] dark:text-[#A3A3A3]">
              <Clock className="w-4 h-4 text-[#737373] dark:text-[#A3A3A3]" />
              <span>Deadline: <strong className="text-[#171717] dark:text-[#FAFAFA]">{team.deadline}</strong></span>
            </div>
          </div>
        </div>

        {/* Project Progress Bar */}
        <div className="space-y-1.5 pt-2 border-t border-[#E5E5E5] dark:border-[#333333]">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-[#737373] dark:text-[#A3A3A3]">Milestone Target Completion</span>
            <span className="text-[#F97316] font-bold">{team.projectProgress}%</span>
          </div>
          <div className="h-2 rounded-full bg-[#FAFAFA] dark:bg-[#1C1C1C] overflow-hidden border border-[#E5E5E5] dark:border-[#333333]">
            <div
              className="h-full bg-[#F97316] rounded-full transition-all"
              style={{ width: `${team.projectProgress}%` }}
            />
          </div>
        </div>

        {/* Workspace Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-[#E5E5E5] dark:border-[#333333] pt-2 overflow-x-auto text-xs font-bold">
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
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors shrink-0 ${
                activeTab === tab.id
                  ? 'border-[#F97316] text-[#F97316] bg-orange-50/50 dark:bg-orange-950/30'
                  : 'border-transparent text-[#737373] dark:text-[#A3A3A3] hover:text-[#171717] dark:hover:text-[#FAFAFA]'
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
            <div className="p-4 rounded-2xl bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#333333] shadow-sm">
              <span className="text-xs text-[#737373] dark:text-[#A3A3A3] font-medium">Subgroups</span>
              <div className="mt-2 text-2xl font-extrabold text-[#171717] dark:text-[#FAFAFA]">{team.subgroups.length}</div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#333333] shadow-sm">
              <span className="text-xs text-[#737373] dark:text-[#A3A3A3] font-medium">Team Members</span>
              <div className="mt-2 text-2xl font-extrabold text-[#171717] dark:text-[#FAFAFA]">{team.memberCount}</div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#333333] shadow-sm">
              <span className="text-xs text-[#737373] dark:text-[#A3A3A3] font-medium">Active Tasks</span>
              <div className="mt-2 text-2xl font-extrabold text-[#171717] dark:text-[#FAFAFA]">
                {teamTasks.filter((t) => t.status !== 'completed').length}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#333333] shadow-sm">
              <span className="text-xs text-[#737373] dark:text-[#A3A3A3] font-medium">Completion Rate</span>
              <div className="mt-2 text-2xl font-extrabold text-[#F97316]">{teamProgress}%</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 cols: Workload & Activity */}
            <div className="lg:col-span-2 space-y-6">
              {/* Subgroup Workload Breakdown */}
              <div className="bg-white dark:bg-[#141414] rounded-3xl p-6 border border-[#E5E5E5] dark:border-[#333333] shadow-sm space-y-4">
                <h3 className="text-base font-bold text-[#171717] dark:text-[#FAFAFA]">Subgroup Workload & Progress</h3>
                <div className="space-y-3">
                  {team.subgroups.map((sg) => {
                    const sgTasks = teamTasks.filter(
                      (t) => (t as any).subgroupId === sg.id || t.assignedTo === sg.leaderName
                    );
                    const sgDone = sgTasks.filter((t) => t.status === 'completed').length;
                    const sgPct = sgTasks.length > 0 ? Math.round((sgDone / sgTasks.length) * 100) : teamProgress;

                    return (
                      <div key={sg.id} className="p-3.5 rounded-2xl bg-[#FAFAFA] dark:bg-[#1C1C1C] border border-[#E5E5E5] dark:border-[#333333] space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-[#171717] dark:text-[#FAFAFA]">{sg.name}</span>
                            <span className="text-[#737373] dark:text-[#A3A3A3] ml-2">Leader: {sg.leaderName}</span>
                          </div>
                          <span className="font-semibold text-[#F97316]">{sg.memberCount} Members • {sgPct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[#E5E5E5] dark:bg-[#333333] overflow-hidden">
                          <div className="h-full bg-[#F97316] rounded-full transition-all" style={{ width: `${sgPct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* AI Project Insights Right Card */}
            <div className="bg-[#141414] dark:bg-[#1C1C1C] text-white rounded-3xl p-6 border border-orange-500/30 shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-[#F97316]" />
                AI Workspace Status
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed">
                {teamTasks.length > 0
                  ? `Workspace has ${teamTasks.length} tracked task${teamTasks.length > 1 ? 's' : ''} with ${completedTeamTasks} completed (${teamProgress}% completion). Target deadline: ${team.deadline}.`
                  : `Team workspace initialized with ${team.subgroups.length} subgroup${team.subgroups.length > 1 ? 's' : ''}. Add team tasks to track milestone progress.`}
              </p>

              <div className="pt-2 border-t border-[#333333] space-y-2">
                <div className="text-[11px] font-bold text-orange-400">Status Summary:</div>
                <div className="p-2.5 rounded-xl bg-black/40 border border-[#333333] text-xs text-neutral-300">
                  {teamProgress === 100
                    ? 'All tasks in this workspace are completed.'
                    : `${teamTasks.filter((t) => t.status !== 'completed').length} active task${teamTasks.filter((t) => t.status !== 'completed').length === 1 ? '' : 's'} remaining.`}
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
