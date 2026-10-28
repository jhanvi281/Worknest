import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { User, Lock, Moon, Sun, Bell, Shield } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { user, updateUserProfile, isDarkMode, setIsDarkMode, addToast } = useApp();
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'appearance' | 'notifications' | 'privacy'>('profile');

  // Form states
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [department, setDepartment] = useState(user?.department || '');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setDepartment(user.department);
    }
  }, [user]);

  const [taskNotifs, setTaskNotifs] = useState(true);
  const [chatNotifs, setChatNotifs] = useState(true);
  const [meetingNotifs, setMeetingNotifs] = useState(true);
  const [dailyLogNotifs, setDailyLogNotifs] = useState(true);

  const [onlineStatus, setOnlineStatus] = useState(true);
  const [profileVisible, setProfileVisible] = useState(true);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserProfile(name, email, department);
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Settings
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Manage your account preferences, appearance theme, and notifications.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Left Settings Tabs */}
        <div className="space-y-1">
          {[
            { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
            { id: 'account', label: 'Account Security', icon: <Lock className="w-4 h-4" /> },
            { id: 'appearance', label: 'Appearance', icon: <Sun className="w-4 h-4" /> },
            { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
            { id: 'privacy', label: 'Privacy', icon: <Shield className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-bold transition ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Right Settings Form Container */}
        <div className="md:col-span-3 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Profile Information</h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Department / Role Scope</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition"
              >
                Save Profile Changes
              </button>
            </form>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Theme & Appearance</h2>
              <p className="text-xs text-slate-500">Choose your preferred visual theme interface mode.</p>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setIsDarkMode(false)}
                  className={`p-4 rounded-2xl border text-left space-y-3 transition ${
                    !isDarkMode
                      ? 'border-indigo-600 bg-indigo-50/50 text-slate-900 ring-2 ring-indigo-600/30'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-700'
                  }`}
                >
                  <Sun className="w-6 h-6 text-amber-500" />
                  <div>
                    <div className="text-xs font-bold">Light Mode</div>
                    <div className="text-[10px] text-slate-400">Clean slate background</div>
                  </div>
                </button>

                <button
                  onClick={() => setIsDarkMode(true)}
                  className={`p-4 rounded-2xl border text-left space-y-3 transition ${
                    isDarkMode
                      ? 'border-indigo-600 bg-indigo-950/40 text-white ring-2 ring-indigo-600/30'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-700'
                  }`}
                >
                  <Moon className="w-6 h-6 text-indigo-400" />
                  <div>
                    <div className="text-xs font-bold">Dark Mode</div>
                    <div className="text-[10px] text-slate-400">Sleek obsidian background</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Notification Preferences</h2>

              {[
                { label: 'Task Notifications', desc: 'Alerts when tasks are assigned or past due', state: taskNotifs, set: setTaskNotifs },
                { label: 'Chat Notifications', desc: 'Direct message and subgroup chat alerts', state: chatNotifs, set: setChatNotifs },
                { label: 'Meeting Reminders', desc: 'Alerts 15 mins before scheduled meetings start', state: meetingNotifs, set: setMeetingNotifs },
                { label: 'Daily Log Reminders', desc: 'Prompts to submit your end-of-day work log', state: dailyLogNotifs, set: setDailyLogNotifs },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">{item.label}</div>
                    <div className="text-[11px] text-slate-400">{item.desc}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={item.state}
                    onChange={(e) => {
                      item.set(e.target.checked);
                      addToast('Preferences updated', 'info');
                    }}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                  />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Privacy & Visibility Settings</h2>

              {[
                { label: 'Online Status Visibility', desc: 'Allow team members to see when you are active', state: onlineStatus, set: setOnlineStatus },
                { label: 'Public Profile Visibility', desc: 'Show assigned task metrics on team leaderboard', state: profileVisible, set: setProfileVisible },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">{item.label}</div>
                    <div className="text-[11px] text-slate-400">{item.desc}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={item.state}
                    onChange={(e) => {
                      item.set(e.target.checked);
                      addToast('Privacy settings updated', 'info');
                    }}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                  />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'account' && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Account Security</h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Current Password</label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs focus:outline-none"
                />
              </div>

              <button
                onClick={() => addToast('Password changed successfully', 'success')}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition"
              >
                Update Password
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
