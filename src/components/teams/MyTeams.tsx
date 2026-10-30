import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, Users, Calendar, ArrowRight, Shield } from 'lucide-react';
import { CreateTeamModal } from './CreateTeamModal';
import { PageHeader } from '../common/PageHeader';
import { EmptyState } from '../common/EmptyState';
import { CardSkeleton } from '../common/LoadingSkeleton';

export const MyTeams: React.FC = () => {
  const { teams, isLoadingTeams, teamsError, refreshTeams, setActiveTeamId, setCurrentView } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenWorkspace = (teamId: string) => {
    setActiveTeamId(teamId);
    setCurrentView('team_workspace');
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <PageHeader
        badge="Collaboration"
        badgeIcon={Users}
        title="My Teams"
        description="Manage your projects, organize subgroups, and collaborate seamlessly across team workspaces."
        actions={[
          {
            label: 'Create Team',
            icon: Plus,
            onClick: () => setIsModalOpen(true),
            variant: 'primary',
          },
        ]}
      />

      {/* Loading Skeleton, Error State, or Team Cards Grid */}
      {isLoadingTeams && teams.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : teamsError ? (
        <div className="p-8 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-center space-y-3">
          <div className="text-xs font-bold text-rose-700 dark:text-rose-300">
            {teamsError}
          </div>
          <button
            onClick={() => refreshTeams()}
            className="px-4 py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold transition shadow-sm cursor-pointer"
          >
            Retry Loading Teams
          </button>
        </div>
      ) : teams.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Teams Found"
          description="You are not currently a member of any teams. Create a new team workspace to start collaborating with your peers."
          actionLabel="Create Your First Team"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teams.map((team) => (
            <div
              key={team.id}
              onClick={() => handleOpenWorkspace(team.id)}
              className="bg-white dark:bg-[#141414] rounded-3xl p-6 border border-[#E5E5E5] dark:border-[#333333] hover:border-[#F97316]/60 dark:hover:border-[#F97316]/60 shadow-sm hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h2 className="text-lg font-bold text-[#171717] dark:text-[#FAFAFA] group-hover:text-[#F97316] transition-colors">
                      {team.name}
                    </h2>
                    <p className="text-xs text-[#737373] dark:text-[#A3A3A3] mt-1 line-clamp-2 leading-relaxed">
                      {team.description}
                    </p>
                  </div>
                  <span className="p-2.5 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-[#F97316] shrink-0">
                    <Users className="w-5 h-5" />
                  </span>
                </div>

                {/* Leader info */}
                <div className="flex items-center gap-2 text-xs text-[#737373] dark:text-[#A3A3A3] mt-4">
                  <Shield className="w-3.5 h-3.5 text-[#F97316]" />
                  <span>Group Leader:</span>
                  <span className="font-bold text-[#171717] dark:text-[#FAFAFA]">{team.leaderName}</span>
                </div>

                {/* Progress bar */}
                <div className="mt-5 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-[#737373] dark:text-[#A3A3A3]">Project Progress</span>
                    <span className="font-bold text-[#F97316]">{team.projectProgress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#FAFAFA] dark:bg-[#1C1C1C] overflow-hidden border border-[#E5E5E5] dark:border-[#333333]">
                    <div
                      className="h-full bg-[#F97316] rounded-full transition-all"
                      style={{ width: `${team.projectProgress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Meta Bar */}
              <div className="mt-6 pt-4 border-t border-[#E5E5E5] dark:border-[#333333] flex items-center justify-between text-xs text-[#737373] dark:text-[#A3A3A3]">
                <div className="flex items-center gap-4">
                  <span><strong className="text-[#171717] dark:text-[#FAFAFA]">{team.memberCount}</strong> Members</span>
                  <span><strong className="text-[#171717] dark:text-[#FAFAFA]">{team.activeTasks}</strong> Active Tasks</span>
                </div>

                <div className="flex items-center gap-1.5 text-[#737373] dark:text-[#A3A3A3] group-hover:text-[#F97316] transition-colors">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Due {team.deadline}</span>
                  <ArrowRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Team Modal */}
      <CreateTeamModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
