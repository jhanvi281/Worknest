import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, Users, Calendar, ArrowRight, Shield } from 'lucide-react';
import { CreateTeamModal } from './CreateTeamModal';

export const MyTeams: React.FC = () => {
  const { teams, setActiveTeamId, setCurrentView } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenWorkspace = (teamId: string) => {
    setActiveTeamId(teamId);
    setCurrentView('team_workspace');
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            My Teams
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Manage your projects and collaborate with your teams.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-lg shadow-purple-600/25 flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" /> Create Team
        </button>
      </div>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {teams.map((team) => (
          <div
            key={team.id}
            onClick={() => handleOpenWorkspace(team.id)}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 hover:border-purple-500/50 dark:hover:border-purple-500/50 shadow-sm hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                    {team.name}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {team.description}
                  </p>
                </div>
                <span className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 shrink-0">
                  <Users className="w-5 h-5" />
                </span>
              </div>

              {/* Leader info */}
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-4">
                <Shield className="w-3.5 h-3.5 text-indigo-500" />
                <span>Group Leader:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{team.leaderName}</span>
              </div>

              {/* Progress bar */}
              <div className="mt-5 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Project Progress</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400">{team.projectProgress}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full"
                    style={{ width: `${team.projectProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Meta Bar */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-4">
                <span><strong>{team.memberCount}</strong> Members</span>
                <span><strong>{team.activeTasks}</strong> Active Tasks</span>
              </div>

              <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-purple-600 transition">
                <Calendar className="w-3.5 h-3.5" />
                <span>Due {team.deadline}</span>
                <ArrowRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Team Modal */}
      <CreateTeamModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
