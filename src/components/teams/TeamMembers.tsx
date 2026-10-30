import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { UserPlus, Shield, Crown, UserCheck, Search, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { AddMemberModal } from './AddMemberModal';
import type { UserRole } from '../../types';

interface Props {
  teamId: string;
}

export const TeamMembers: React.FC<Props> = ({ teamId }) => {
  const { teams, user, currentUserRole, removeTeamMember, updateTeamMember } = useApp();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [memberPendingRemove, setMemberPendingRemove] = useState<{ id: string; name: string; memberId?: string } | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && memberPendingRemove && !isRemoving) {
        setMemberPendingRemove(null);
      }
    };
    if (memberPendingRemove) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [memberPendingRemove, isRemoving]);

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

  const handleConfirmRemove = async () => {
    if (!memberPendingRemove || isRemoving) return;
    setIsRemoving(true);
    await removeTeamMember(teamId, memberPendingRemove.memberId || memberPendingRemove.id);
    setIsRemoving(false);
    setMemberPendingRemove(null);
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
          <h2 className="text-xl font-bold text-[#171717] dark:text-[#FAFAFA]">Team Members & Hierarchy</h2>
          <p className="text-xs text-[#737373] dark:text-[#A3A3A3]">Group Leader → Sub-Group Leaders → Members</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#737373] dark:text-[#A3A3A3] absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members..."
              className="pl-9 pr-3 py-1.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#171717] dark:text-[#FAFAFA] text-xs focus:outline-none focus:ring-2 focus:ring-[#F97316]"
            />
          </div>

          {isLeader && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] dark:hover:bg-[#FB923C] text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-colors shrink-0"
            >
              <UserPlus className="w-4 h-4" /> Add Member
            </button>
          )}
        </div>
      </div>

      {/* Role Hierarchy Visual Tree */}
      {/* 1. Group Leaders Section */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-[#F97316] uppercase tracking-wider mb-3">
          <Crown className="w-4 h-4 text-amber-500" /> Group Leader
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groupLeaders.filter(filterMember).map((m) => (
            <div
              key={m.memberId || m.id}
              className="p-4 rounded-2xl bg-white dark:bg-[#141414] border-2 border-orange-500/40 dark:border-orange-500/30 shadow-sm flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="relative">
                  <img src={m.avatar} alt={m.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-[#F97316]" />
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-[#141414] ${
                      m.isOnline ? 'bg-emerald-500' : 'bg-neutral-400'
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#171717] dark:text-[#FAFAFA] truncate">{m.name}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-[#F97316] text-[10px] font-bold">
                      LEADER
                    </span>
                  </div>
                  <div className="text-xs text-[#737373] dark:text-[#A3A3A3] truncate">{m.email}</div>
                  <div className="text-[11px] text-[#737373] dark:text-[#A3A3A3] mt-1">Full Admin Permissions</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Sub-Group Leaders Section */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-[#F97316] uppercase tracking-wider mb-3">
          <Shield className="w-4 h-4 text-[#F97316]" /> Sub-Group Leaders
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subgroupLeaders.filter(filterMember).map((m) => (
            <div
              key={m.memberId || m.id}
              className="p-4 rounded-2xl bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#333333] shadow-sm flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="relative">
                  <img src={m.avatar} alt={m.name} className="w-11 h-11 rounded-full object-cover ring-2 ring-orange-500/40" />
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-[#141414] ${
                      m.isOnline ? 'bg-emerald-500' : 'bg-neutral-400'
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[#171717] dark:text-[#FAFAFA] truncate">{m.name}</h3>
                  <div className="text-xs text-[#F97316] font-semibold truncate">
                    {m.assignedSubgroup || 'General Subgroup'}
                  </div>
                  <div className="text-[10px] text-[#737373] dark:text-[#A3A3A3] truncate mt-0.5">{m.email}</div>
                </div>
              </div>

              {isLeader && m.userId !== user?.id && (
                <div className="flex items-center gap-1.5">
                  <select
                    value={m.role}
                    onChange={(e) => handleRoleChange(m.memberId, e.target.value as UserRole)}
                    className="text-[11px] rounded-lg border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] px-2 py-1 text-[#171717] dark:text-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-[#F97316]"
                  >
                    <option value="subgroup_leader">Sub-Group Leader</option>
                    <option value="member">Member</option>
                    <option value="group_leader">Group Leader</option>
                  </select>
                  <button
                    onClick={() => setMemberPendingRemove({ id: m.memberId, name: m.name })}
                    className="p-1.5 rounded-lg text-[#737373] dark:text-[#A3A3A3] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Remove Member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
          {subgroupLeaders.length === 0 && (
            <div className="p-4 rounded-2xl bg-[#FAFAFA] dark:bg-[#1C1C1C] border border-dashed border-[#E5E5E5] dark:border-[#333333] text-xs text-[#737373] dark:text-[#A3A3A3] col-span-full">
              No Sub-Group Leaders assigned yet. Group leaders can promote members by assigning them as Sub-Group Leaders.
            </div>
          )}
        </div>
      </div>

      {/* 3. Team Members Section */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-[#737373] dark:text-[#A3A3A3] uppercase tracking-wider mb-3">
          <UserCheck className="w-4 h-4 text-[#737373] dark:text-[#A3A3A3]" /> Members ({regularMembers.length})
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {regularMembers.filter(filterMember).map((m) => (
            <div
              key={m.memberId || m.id}
              className="p-4 rounded-2xl bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#333333] shadow-sm flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="relative">
                  <img src={m.avatar} alt={m.name} className="w-10 h-10 rounded-full object-cover" />
                  <span
                    className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#141414] ${
                      m.isOnline ? 'bg-emerald-500' : 'bg-neutral-400'
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[#171717] dark:text-[#FAFAFA] truncate">{m.name}</h3>
                  <div className="text-xs text-[#737373] dark:text-[#A3A3A3] truncate">{m.email}</div>
                  
                  {isLeader ? (
                    <select
                      value={m.subgroupId || ''}
                      onChange={(e) => handleSubgroupChange(m.memberId, e.target.value)}
                      className="mt-1 text-[11px] rounded-lg border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] px-2 py-0.5 text-[#171717] dark:text-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-[#F97316]"
                    >
                      <option value="">No Subgroup</option>
                      {team.subgroups.map((sg) => (
                        <option key={sg.id} value={sg.id}>
                          {sg.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-[10px] text-[#737373] dark:text-[#A3A3A3] mt-1">{m.assignedSubgroup || 'General Member'}</div>
                  )}
                </div>
              </div>

              {isLeader && m.userId !== user?.id && (
                <div className="flex items-center gap-1.5">
                  <select
                    value={m.role}
                    onChange={(e) => handleRoleChange(m.memberId, e.target.value as UserRole)}
                    className="text-[11px] rounded-lg border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] px-2 py-1 text-[#171717] dark:text-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-[#F97316]"
                  >
                    <option value="member">Member</option>
                    <option value="subgroup_leader">Sub-Group Leader</option>
                    <option value="group_leader">Group Leader</option>
                  </select>
                  <button
                    onClick={() => setMemberPendingRemove({ id: m.memberId, name: m.name })}
                    className="p-1.5 rounded-lg text-[#737373] dark:text-[#A3A3A3] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Remove Member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
          {regularMembers.length === 0 && (
            <div className="p-4 rounded-2xl bg-[#FAFAFA] dark:bg-[#1C1C1C] border border-dashed border-[#E5E5E5] dark:border-[#333333] text-xs text-[#737373] dark:text-[#A3A3A3] col-span-full">
              No regular team members found. Click "Add Member" to invite users to this team.
            </div>
          )}
        </div>
      </div>

      {/* Add Member Modal */}
      <AddMemberModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} teamId={teamId} />

      {/* Remove Member Confirmation Dialog */}
      {memberPendingRemove && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="remove-member-title"
          onClick={!isRemoving ? () => setMemberPendingRemove(null) : undefined}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white dark:bg-[#141414] rounded-3xl p-6 border border-[#E5E5E5] dark:border-[#333333] shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 id="remove-member-title" className="text-sm font-bold text-[#171717] dark:text-[#FAFAFA]">Remove Team Member?</h3>
                <p className="text-xs text-[#737373] dark:text-[#A3A3A3]">Revokes workspace access for this user.</p>
              </div>
            </div>

            <p className="text-xs text-[#171717] dark:text-[#FAFAFA] font-medium bg-[#FAFAFA] dark:bg-[#1C1C1C] p-3 rounded-xl border border-[#E5E5E5] dark:border-[#333333] truncate">
              {memberPendingRemove.name}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMemberPendingRemove(null)}
                disabled={isRemoving}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#737373] dark:text-[#A3A3A3] hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C] transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemove}
                disabled={isRemoving}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {isRemoving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  'Remove Member'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
