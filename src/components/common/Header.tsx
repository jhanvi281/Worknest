import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Plus,
  Bell,
  CheckSquare,
  Users,
  Video,
  Upload,
  Shield,
  Moon,
  Sun,
  User,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  ChevronDown,
} from 'lucide-react';
import type { UserRole } from '../../types';

export const Header: React.FC = () => {
  const {
    user,
    signOut,
    currentRole,
    setCurrentRole,
    isDarkMode,
    setIsDarkMode,
    setIsSearchOpen,
    setCurrentView,
    notifications,
    markAllNotificationsAsRead,
    setIsCreateModalOpen,
    setCreateModalType,
    setIsMobileSidebarOpen,
  } = useApp();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isRoleOpen, setIsRoleOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const roleLabels: Record<UserRole, string> = {
    group_leader: 'Group Leader',
    subgroup_leader: 'Sub-Group Leader',
    member: 'Team Member',
    personal_user: 'Personal User',
  };

  const handleOpenCreate = (type: 'task' | 'team' | 'meeting' | 'file') => {
    setCreateModalType(type);
    setIsCreateModalOpen(true);
    setIsCreateOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 flex items-center justify-between transition-colors">
      {/* Left side: Mobile menu toggle + Global Search */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 text-sm transition-all w-48 sm:w-64 md:w-80 group"
        >
          <Search className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
          <span className="truncate">Search WorkNest...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 ml-auto text-[10px] font-mono bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-400">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Role Switcher Dropdown (Key SaaS Feature requirement) */}
        <div className="relative">
          <button
            onClick={() => setIsRoleOpen(!isRoleOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition"
            title="Switch User Role to test permission levels"
          >
            <Shield className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">{roleLabels[currentRole]}</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          </button>

          {isRoleOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-40 animate-fade-in">
              <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Select Active Role View
              </div>
              {(['group_leader', 'subgroup_leader', 'member', 'personal_user'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setCurrentRole(r);
                    setIsRoleOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 ${
                    currentRole === r
                      ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>{roleLabels[r]}</span>
                  {currentRole === r && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* "+ Create" Dropdown Button */}
        <div className="relative">
          <button
            onClick={() => setIsCreateOpen(!isCreateOpen)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create</span>
          </button>

          {isCreateOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-40 animate-fade-in">
              <button
                onClick={() => handleOpenCreate('task')}
                className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800 flex items-center gap-2.5"
              >
                <CheckSquare className="w-4 h-4 text-indigo-600" /> New Task
              </button>
              <button
                onClick={() => handleOpenCreate('team')}
                className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800 flex items-center gap-2.5"
              >
                <Users className="w-4 h-4 text-purple-600" /> New Team
              </button>
              <button
                onClick={() => handleOpenCreate('meeting')}
                className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800 flex items-center gap-2.5"
              >
                <Video className="w-4 h-4 text-emerald-600" /> New Meeting
              </button>
              <button
                onClick={() => handleOpenCreate('file')}
                className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800 flex items-center gap-2.5"
              >
                <Upload className="w-4 h-4 text-cyan-600" /> Upload File
              </button>
            </div>
          )}
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 z-40 animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Notifications</span>
                <button
                  onClick={markAllNotificationsAsRead}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                >
                  Mark all as read
                </button>
              </div>

              <div className="mt-3 space-y-2.5 max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (n.linkView) setCurrentView(n.linkView);
                        setIsNotifOpen(false);
                      }}
                      className={`p-2.5 rounded-xl text-xs cursor-pointer transition flex items-start gap-2.5 ${
                        n.isRead
                          ? 'bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                          : 'bg-indigo-50/60 dark:bg-indigo-950/40 text-slate-900 dark:text-slate-100 font-medium'
                      }`}
                    >
                      <div className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-1" />
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{n.title}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</div>
                        <div className="text-[10px] text-slate-400 mt-1">{n.timestamp}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dark / Light Toggle Button */}
        <button
          onClick={() => setIsDarkMode((prev) => !prev)}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title="Toggle Dark Mode"
        >
          {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* User Profile Avatar Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <img
              src={user?.avatar || 'https://ui-avatars.com/api/?name=User&background=6366f1&color=fff'}
              alt={user?.name || 'User'}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-600/30"
            />
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-40 animate-fade-in">
              <div className="px-3.5 py-2 border-b border-slate-200 dark:border-slate-800">
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{user?.name || 'User'}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email || ''}</div>
                <div className="mt-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  {roleLabels[user?.role || 'member']}
                </div>
              </div>

              <button
                onClick={() => {
                  setCurrentView('profile');
                  setIsProfileOpen(false);
                }}
                className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5"
              >
                <User className="w-4 h-4 text-slate-400" /> Profile Details
              </button>
              <button
                onClick={() => {
                  setCurrentView('settings');
                  setIsProfileOpen(false);
                }}
                className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5"
              >
                <SettingsIcon className="w-4 h-4 text-slate-400" /> Account Settings
              </button>

              <div className="border-t border-slate-200 dark:border-slate-800 my-1" />

              <button
                onClick={async () => {
                  setIsProfileOpen(false);
                  await signOut();
                }}
                className="w-full text-left px-3.5 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5"
              >
                <LogOut className="w-4 h-4 text-rose-500" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
