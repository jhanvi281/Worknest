import React from 'react';
import { useApp } from '../../context/AppContext';
import { Shield, CheckCircle2, Clock, Users, Activity, Edit3, Camera } from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { user, setCurrentView, teams } = useApp();

  if (!user) {
    return (
      <div className="p-8 max-w-md mx-auto text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Not Signed In</h2>
        <p className="text-xs text-slate-500">Please sign in to view your profile details.</p>
        <button
          onClick={() => setCurrentView('login')}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* PROFILE HEADER CARD */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative group">
            <img
              src={user.avatar || 'https://ui-avatars.com/api/?name=User&background=6366f1&color=fff'}
              alt={user.name || 'User'}
              className="w-24 h-24 rounded-full object-cover ring-4 ring-indigo-600/30"
            />
            <button
              onClick={() => setCurrentView('settings')}
              className="absolute bottom-0 right-0 p-2 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition"
              title="Change Profile Photo"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">{user.name}</h1>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>

              <button
                onClick={() => setCurrentView('settings')}
                className="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:bg-indigo-100 flex items-center gap-1.5 self-center sm:self-auto transition"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Profile
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2 text-xs font-semibold">
              <span className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-[10px] font-extrabold flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> {user.role ? user.role.replace('_', ' ') : 'member'}
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600 dark:text-slate-400">{user.department || 'General'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* USER METRICS & STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">42</div>
          <div className="text-xs text-slate-500">Tasks Completed</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <Users className="w-5 h-5 text-purple-500" />
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{teams.length}</div>
          <div className="text-xs text-slate-500">Active Teams</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <Activity className="w-5 h-5 text-indigo-500" />
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">128</div>
          <div className="text-xs text-slate-500">Team Contributions</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <Clock className="w-5 h-5 text-amber-500" />
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">340h</div>
          <div className="text-xs text-slate-500">Work Hours Logged</div>
        </div>
      </div>

      {/* RECENT ACTIVITY & TEAMS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Teams List */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Assigned Teams</h3>
          <div className="space-y-3">
            {teams.map((t) => (
              <div key={t.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">{t.name}</div>
                  <div className="text-slate-400">{t.subgroups.length} Subgroups • {t.memberCount} Members</div>
                </div>
                <span className="font-bold text-purple-600 dark:text-purple-400">{t.projectProgress}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Log */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Activity</h3>
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <span className="font-bold text-slate-900 dark:text-white">Created task:</span> "Implement OAuth 2.0 Access Control"
              <div className="text-[10px] text-slate-400 mt-1">Today at 09:15 AM</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <span className="font-bold text-slate-900 dark:text-white">Submitted daily work log:</span> 8.0 hours logged
              <div className="text-[10px] text-slate-400 mt-1">Yesterday at 05:30 PM</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <span className="font-bold text-slate-900 dark:text-white">Uploaded file:</span> WorkNest_Q4_Product_Architecture.pptx
              <div className="text-[10px] text-slate-400 mt-1">2 days ago</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
