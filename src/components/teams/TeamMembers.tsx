import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserPlus, Shield, Crown, UserCheck, Search, Trash2 } from 'lucide-react';
import { AddMemberModal } from './AddMemberModal';
import type { UserRole } from '../../types';

interface Props {
  teamId: string;
}

export const TeamMembers: React.FC<Props> = ({ teamId }) => {
  const { teams, user, currentUserRole, removeTeamMember, updateTeamMember } = useApp();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const team = teams.find((t) => t.id === teamId);

  if (!team) return null;

  const isLeader = currentUserRole === 'group_leader';

  const groupLeaders = team.members.filter((m) => m.role === 'group_leader');
  const subgroupLeaders = team.members.filter((m) => m.role === 'subgroup_leader');
  const regularMembers = team.members.filter((m) => m.role === 'member' || m.role === 'personal_user');

  const filterMember = (m: typeof team.members[0]) =>
    !searchQuery ||
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase());

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (window.confirm(`Are you sure you want to remove ${memberName} from this team?`)) {
      await removeTeamMember(teamId, memberId);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: UserRole) => {
    await updateTeamMember(teamId, memberId, { role: newRole });
  };

  const handleSubgroupChange = async (memberId: string, newSubgroupId: string) => {
    await updateTeamMember(teamId, memberId, { subgroupId: newSubgroupId || null });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Team Members & Hierarchy</h2>
          <p className="text-xs text-slate-500">Group Leader → Sub-Group Leaders → Members</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members..."
              className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs focus:outline-none"
            />
          </div>

          {isLeader && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md flex items-center gap-2 transition shrink-0"
            >
              <UserPlus className="w-4 h-4" /> Add Member
            </button>
          )}
        </div>
      </div>

      {/* Role Hierarchy Visual Tree */}
      {/* 1. Group Leaders Section */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-3">
          <Crown className="w-4 h-4 text-amber-500" /> Group Leader
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groupLeaders.filter(filterMember).map((m) => (
            <div
              key={m.memberId || m.id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-indigo-500/40 dark:border-indigo-500/30 shadow-md flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="relative">
                  <img src={m.avatar} alt={m.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-500" />
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                      m.isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{m.name}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 text-[10px] font-bold">
                      LEADER
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{m.email}</div>
                  <div className="text-[11px] text-slate-400 mt-1">Full Admin Permissions</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Sub-Group Leaders Section */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-3">
          <Shield className="w-4 h-4 text-purple-500" /> Sub-Group Leaders
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subgroupLeaders.filter(filterMember).map((m) => (
            <div
              key={m.memberId || m.id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="relative">
                  <img src={m.avatar} alt={m.name} className="w-11 h-11 rounded-full object-cover ring-2 ring-purple-500/40" />
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                      m.isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{m.name}</h3>
                  <div className="text-xs text-purple-600 dark:text-purple-400 font-semibold truncate">
                    {m.assignedSubgroup || 'General Subgroup'}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">{m.email}</div>
                </div>
              </div>

              {isLeader && m.userId !== user?.id && (
                <div className="flex items-center gap-1.5">
                  <select
                    value={m.role}
                    onChange={(e) => handleRoleChange(m.memberId, e.target.value as UserRole)}
                    className="text-[11px] rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-2 py-1 text-slate-700 dark:text-slate-300 focus:outline-none"
                  >
                    <option value="subgroup_leader">Sub-Group Leader</option>
                    <option value="member">Member</option>
                    <option value="group_leader">Group Leader</option>
                  </select>
                  <button
                    onClick={() => handleRemoveMember(m.memberId, m.name)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                    title="Remove Member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
          {subgroupLeaders.length === 0 && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-400 col-span-full">
              No Sub-Group Leaders assigned yet. Group leaders can promote members by assigning them as Sub-Group Leaders.
            </div>
          )}
        </div>
      </div>

      {/* 3. Team Members Section */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          <UserCheck className="w-4 h-4 text-slate-400" /> Members ({regularMembers.length})
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {regularMembers.filter(filterMember).map((m) => (
            <div
              key={m.memberId || m.id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="relative">
                  <img src={m.avatar} alt={m.name} className="w-10 h-10 rounded-full object-cover" />
                  <span
                    className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ${
                      m.isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{m.name}</h3>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{m.email}</div>
                  
                  {isLeader ? (
                    <select
                      value={m.subgroupId || ''}
                      onChange={(e) => handleSubgroupChange(m.memberId, e.target.value)}
                      className="mt-1 text-[11px] rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 text-slate-700 dark:text-slate-300 focus:outline-none"
                    >
                      <option value="">No Subgroup</option>
                      {team.subgroups.map((sg) => (
                        <option key={sg.id} value={sg.id}>
                          {sg.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-[10px] text-slate-400 mt-1">{m.assignedSubgroup || 'General Member'}</div>
                  )}
                </div>
              </div>

              {isLeader && m.userId !== user?.id && (
                <div className="flex items-center gap-1.5">
                  <select
                    value={m.role}
                    onChange={(e) => handleRoleChange(m.memberId, e.target.value as UserRole)}
                    className="text-[11px] rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-2 py-1 text-slate-700 dark:text-slate-300 focus:outline-none"
                  >
                    <option value="member">Member</option>
                    <option value="subgroup_leader">Sub-Group Leader</option>
                    <option value="group_leader">Group Leader</option>
                  </select>
                  <button
                    onClick={() => handleRemoveMember(m.memberId, m.name)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                    title="Remove Member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
          {regularMembers.length === 0 && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-400 col-span-full">
              No regular team members found. Click "Add Member" to invite users to this team.
            </div>
          )}
        </div>
      </div>

      {/* Add Member Modal */}
      <AddMemberModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} teamId={teamId} />
    </div>
  );
};
