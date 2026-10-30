import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import { supabase, isClerkAuthMode } from '../../lib/supabase';
import { User, Lock, Moon, Sun, Bell, Shield, Loader2 } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { user, updateUserProfile, isDarkMode, setIsDarkMode, addToast } = useApp();
  const { user: clerkUser } = useUser();
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'appearance' | 'notifications' | 'privacy'>('profile');

  // Form states
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [department, setDepartment] = useState(user?.department || '');

  // Password change states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setDepartment(user.department);
    }
  }, [user]);

  const [taskNotifs, setTaskNotifs] = useState(() => localStorage.getItem('worknest_pref_taskNotifs') !== 'false');
  const [chatNotifs, setChatNotifs] = useState(() => localStorage.getItem('worknest_pref_chatNotifs') !== 'false');
  const [meetingNotifs, setMeetingNotifs] = useState(() => localStorage.getItem('worknest_pref_meetingNotifs') !== 'false');
  const [dailyLogNotifs, setDailyLogNotifs] = useState(() => localStorage.getItem('worknest_pref_dailyLogNotifs') !== 'false');

  const [onlineStatus, setOnlineStatus] = useState(() => localStorage.getItem('worknest_pref_onlineStatus') !== 'false');
  const [profileVisible, setProfileVisible] = useState(() => localStorage.getItem('worknest_pref_profileVisible') !== 'false');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('Name cannot be empty', 'error');
      return;
    }
    setIsUpdatingProfile(true);
    try {
      await updateUserProfile(name.trim(), email.trim(), department.trim());
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!newPassword) {
      setPasswordError('Please enter a new password');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    try {
      setIsUpdatingPassword(true);
      if (clerkUser) {
        await clerkUser.updatePassword({
          newPassword,
        });
        addToast('Password updated successfully', 'success');
        setNewPassword('');
        setConfirmPassword('');
      } else if (!isClerkAuthMode) {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
          setPasswordError(error.message);
          addToast(error.message, 'error');
        } else {
          addToast('Password updated successfully', 'success');
          setNewPassword('');
          setConfirmPassword('');
        }
      } else {
        throw new Error('Please manage your password in your Clerk account security settings.');
      }
    } catch (err: any) {
      const clerkMsg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message;
      const msg = clerkMsg || (err instanceof Error ? err.message : 'Failed to update password');
      setPasswordError(msg);
      addToast(msg, 'error');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#171717] dark:text-[#FAFAFA] tracking-tight">
          Settings
        </h1>
        <p className="text-sm text-[#737373] dark:text-[#A3A3A3] mt-1">
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
                  ? 'bg-[#F97316] text-white shadow-sm'
                  : 'text-[#737373] dark:text-[#A3A3A3] hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Right Settings Form Container */}
        <div className="md:col-span-3 bg-white dark:bg-[#141414] rounded-3xl p-6 border border-[#E5E5E5] dark:border-[#333333] shadow-sm space-y-6">
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <h2 className="text-base font-bold text-[#171717] dark:text-[#FAFAFA]">Profile Information</h2>

              <div>
                <label className="block text-xs font-semibold text-[#171717] dark:text-[#FAFAFA] mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#171717] dark:text-[#FAFAFA] text-xs focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#171717] dark:text-[#FAFAFA] mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#171717] dark:text-[#FAFAFA] text-xs focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#171717] dark:text-[#FAFAFA] mb-1">Department / Role Scope</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#171717] dark:text-[#FAFAFA] text-xs focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="px-5 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] dark:hover:bg-[#FB923C] disabled:opacity-60 text-white font-bold text-xs shadow-sm transition flex items-center gap-2"
              >
                {isUpdatingProfile ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  'Save Profile Changes'
                )}
              </button>
            </form>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <h2 className="text-base font-bold text-[#171717] dark:text-[#FAFAFA]">Theme & Appearance</h2>
              <p className="text-xs text-[#737373] dark:text-[#A3A3A3]">Choose your preferred visual theme interface mode.</p>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setIsDarkMode(false)}
                  className={`p-4 rounded-2xl border text-left space-y-3 transition ${
                    !isDarkMode
                      ? 'border-[#F97316] bg-orange-50/50 text-[#171717] ring-2 ring-orange-500/30'
                      : 'border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#737373] dark:text-[#A3A3A3]'
                  }`}
                >
                  <Sun className="w-6 h-6 text-amber-500" />
                  <div>
                    <div className="text-xs font-bold text-[#171717] dark:text-[#FAFAFA]">Light Mode</div>
                    <div className="text-[10px] text-[#737373] dark:text-[#A3A3A3]">Clean white + orange canvas</div>
                  </div>
                </button>

                <button
                  onClick={() => setIsDarkMode(true)}
                  className={`p-4 rounded-2xl border text-left space-y-3 transition ${
                    isDarkMode
                      ? 'border-[#F97316] bg-orange-950/40 text-[#FAFAFA] ring-2 ring-orange-500/30'
                      : 'border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#737373] dark:text-[#A3A3A3]'
                  }`}
                >
                  <Moon className="w-6 h-6 text-orange-400" />
                  <div>
                    <div className="text-xs font-bold text-[#171717] dark:text-[#FAFAFA]">Dark Mode</div>
                    <div className="text-[10px] text-[#737373] dark:text-[#A3A3A3]">Sleek obsidian + orange canvas</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-[#171717] dark:text-[#FAFAFA]">Notification Preferences</h2>
                <p className="text-xs text-[#737373] dark:text-[#A3A3A3] mt-0.5">Preferences are saved in your local browser storage.</p>
              </div>

              {[
                { key: 'worknest_pref_taskNotifs', label: 'Task Notifications', desc: 'Alerts when tasks are assigned or past due', state: taskNotifs, set: setTaskNotifs },
                { key: 'worknest_pref_chatNotifs', label: 'Chat Notifications', desc: 'Direct message and subgroup chat alerts', state: chatNotifs, set: setChatNotifs },
                { key: 'worknest_pref_meetingNotifs', label: 'Meeting Reminders', desc: 'Alerts 15 mins before scheduled meetings start', state: meetingNotifs, set: setMeetingNotifs },
                { key: 'worknest_pref_dailyLogNotifs', label: 'Daily Log Reminders', desc: 'Prompts to submit your end-of-day work log', state: dailyLogNotifs, set: setDailyLogNotifs },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAFAFA] dark:bg-[#1C1C1C] border border-[#E5E5E5] dark:border-[#333333]">
                  <div>
                    <div className="text-xs font-bold text-[#171717] dark:text-[#FAFAFA]">{item.label}</div>
                    <div className="text-[11px] text-[#737373] dark:text-[#A3A3A3]">{item.desc}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={item.state}
                    onChange={(e) => {
                      const val = e.target.checked;
                      item.set(val);
                      localStorage.setItem(item.key, String(val));
                      addToast('Notification preference saved', 'info');
                    }}
                    className="w-4 h-4 rounded border-[#E5E5E5] text-[#F97316] focus:ring-[#F97316]"
                  />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-[#171717] dark:text-[#FAFAFA]">Privacy & Visibility Settings</h2>
                <p className="text-xs text-[#737373] dark:text-[#A3A3A3] mt-0.5">Privacy flags are persisted to your active browser profile.</p>
              </div>

              {[
                { key: 'worknest_pref_onlineStatus', label: 'Online Status Visibility', desc: 'Allow team members to see when you are active', state: onlineStatus, set: setOnlineStatus },
                { key: 'worknest_pref_profileVisible', label: 'Public Profile Visibility', desc: 'Show assigned task metrics on team leaderboard', state: profileVisible, set: setProfileVisible },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAFAFA] dark:bg-[#1C1C1C] border border-[#E5E5E5] dark:border-[#333333]">
                  <div>
                    <div className="text-xs font-bold text-[#171717] dark:text-[#FAFAFA]">{item.label}</div>
                    <div className="text-[11px] text-[#737373] dark:text-[#A3A3A3]">{item.desc}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={item.state}
                    onChange={(e) => {
                      const val = e.target.checked;
                      item.set(val);
                      localStorage.setItem(item.key, String(val));
                      addToast('Privacy preference saved', 'info');
                    }}
                    className="w-4 h-4 rounded border-[#E5E5E5] text-[#F97316] focus:ring-[#F97316]"
                  />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'account' && (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <h2 className="text-base font-bold text-[#171717] dark:text-[#FAFAFA]">Account Security</h2>

              {passwordError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs">
                  {passwordError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#171717] dark:text-[#FAFAFA] mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-xs text-[#171717] dark:text-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#171717] dark:text-[#FAFAFA] mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-xs text-[#171717] dark:text-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] dark:hover:bg-[#FB923C] disabled:opacity-60 text-white font-bold text-xs shadow-sm transition cursor-pointer"
              >
                {isUpdatingPassword ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  'Update Password'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
