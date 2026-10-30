import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Logo } from './Logo';
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
    isDarkMode,
    setIsDarkMode,
    setIsSearchOpen,
    setCurrentView,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    setIsCreateModalOpen,
    setCreateModalType,
    setIsMobileSidebarOpen,
  } = useApp();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const createRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (createRef.current && !createRef.current.contains(target)) {
        setIsCreateOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(target)) {
        setIsProfileOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCreateOpen(false);
        setIsNotifOpen(false);
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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
    <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-[#141414]/95 backdrop-blur-md border-b border-[#E5E5E5] dark:border-[#333333] px-4 md:px-6 flex items-center justify-between transition-colors">
      {/* Left side: Mobile menu toggle + Global Search */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsMobileSidebarOpen(true)}
          aria-label="Open mobile navigation menu"
          className="md:hidden p-2 rounded-xl text-[#737373] dark:text-[#A3A3A3] hover:text-[#171717] dark:hover:text-[#FAFAFA] hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C] transition"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="md:hidden flex items-center cursor-pointer" onClick={() => setCurrentView('dashboard')}>
          <Logo variant="compact" size="sm" />
        </div>

        {/* Global Search Bar */}
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          aria-label="Open global search (⌘K)"
          className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-[#FAFAFA] dark:bg-[#1C1C1C] hover:bg-neutral-100 dark:hover:bg-[#222222] border border-[#E5E5E5] dark:border-[#333333] text-[#737373] dark:text-[#A3A3A3] text-sm transition-all w-48 sm:w-64 md:w-80 group text-left"
        >
          <Search className="w-4 h-4 text-[#F97316] group-hover:scale-110 transition-transform" />
          <span className="truncate">Search WorkNest...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 ml-auto text-[10px] font-mono bg-white dark:bg-[#141414] px-1.5 py-0.5 rounded border border-[#E5E5E5] dark:border-[#333333] text-[#737373] dark:text-[#A3A3A3]">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Active Role Badge (Reflects authenticated database permissions) */}
        <div className="relative">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200/60 dark:border-orange-800/50 text-xs font-semibold"
            title={`Active Workspace Role: ${roleLabels[currentRole]}`}
          >
            <Shield className="w-3.5 h-3.5 text-[#F97316]" />
            <span className="hidden sm:inline">{roleLabels[currentRole]}</span>
          </div>
        </div>

        {/* "+ Create" Dropdown Button */}
        <div className="relative" ref={createRef}>
          <button
            type="button"
            onClick={() => setIsCreateOpen(!isCreateOpen)}
            aria-expanded={isCreateOpen}
            aria-haspopup="true"
            aria-label="Create new item"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] dark:hover:bg-[#FB923C] text-white text-xs font-semibold shadow-sm active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create</span>
          </button>

          {isCreateOpen && (
            <div
              role="menu"
              aria-label="Create menu"
              className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#141414] rounded-2xl shadow-xl border border-[#E5E5E5] dark:border-[#333333] py-2 z-40 animate-fade-in"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => handleOpenCreate('task')}
                className="w-full text-left px-3.5 py-2 text-xs font-medium text-[#171717] dark:text-[#FAFAFA] hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C] hover:text-[#F97316] flex items-center gap-2.5"
              >
                <CheckSquare className="w-4 h-4 text-[#F97316]" /> New Task
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => handleOpenCreate('team')}
                className="w-full text-left px-3.5 py-2 text-xs font-medium text-[#171717] dark:text-[#FAFAFA] hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C] hover:text-[#F97316] flex items-center gap-2.5"
              >
                <Users className="w-4 h-4 text-[#F97316]" /> New Team
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => handleOpenCreate('meeting')}
                className="w-full text-left px-3.5 py-2 text-xs font-medium text-[#171717] dark:text-[#FAFAFA] hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C] hover:text-[#F97316] flex items-center gap-2.5"
              >
                <Video className="w-4 h-4 text-[#F97316]" /> New Meeting
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => handleOpenCreate('file')}
                className="w-full text-left px-3.5 py-2 text-xs font-medium text-[#171717] dark:text-[#FAFAFA] hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C] hover:text-[#F97316] flex items-center gap-2.5"
              >
                <Upload className="w-4 h-4 text-[#F97316]" /> Upload File
              </button>
            </div>
          )}
        </div>

        {/* Notifications Bell */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            aria-expanded={isNotifOpen}
            aria-haspopup="true"
            aria-label={`Notifications, ${unreadCount} unread`}
            className="relative p-2 rounded-xl text-[#737373] dark:text-[#A3A3A3] hover:text-[#171717] dark:hover:text-[#FAFAFA] hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C] transition"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#F97316] ring-2 ring-white dark:ring-[#141414]" />
            )}
          </button>

          {isNotifOpen && (
            <div
              role="region"
              aria-label="Notifications panel"
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#141414] rounded-2xl shadow-2xl border border-[#E5E5E5] dark:border-[#333333] p-4 z-40 animate-fade-in"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5] dark:border-[#333333]">
                <span className="text-sm font-bold text-[#171717] dark:text-[#FAFAFA]">Notifications</span>
                <button
                  type="button"
                  onClick={markAllNotificationsAsRead}
                  className="text-xs text-[#F97316] hover:text-[#EA580C] hover:underline font-medium"
                >
                  Mark all as read
                </button>
              </div>

              <div className="mt-3 space-y-2.5 max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[#737373] dark:text-[#A3A3A3]">No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        markNotificationAsRead(n.id);
                        if (n.linkView) setCurrentView(n.linkView);
                        setIsNotifOpen(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          markNotificationAsRead(n.id);
                          if (n.linkView) setCurrentView(n.linkView);
                          setIsNotifOpen(false);
                        }
                      }}
                      className={`p-2.5 rounded-xl text-xs cursor-pointer transition flex items-start gap-2.5 ${
                        n.isRead
                          ? 'bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#737373] dark:text-[#A3A3A3]'
                          : 'bg-orange-50/50 dark:bg-orange-950/30 text-[#171717] dark:text-[#FAFAFA] font-medium'
                      }`}
                    >
                      {!n.isRead && (
                        <div className="w-2 h-2 rounded-full bg-[#F97316] shrink-0 mt-1" />
                      )}
                      <div className="flex-1">
                        <div className="font-semibold text-[#171717] dark:text-[#FAFAFA]">{n.title}</div>
                        <div className="text-[11px] text-[#737373] dark:text-[#A3A3A3] mt-0.5">{n.message}</div>
                        <div className="text-[10px] text-[#A3A3A3] dark:text-[#737373] mt-1">{n.timestamp}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2.5 mt-2 border-t border-[#E5E5E5] dark:border-[#333333] text-center">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentView('notifications');
                    setIsNotifOpen(false);
                  }}
                  className="text-xs font-semibold text-[#F97316] hover:text-[#EA580C] hover:underline"
                >
                  View all in Notification Center
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Dark / Light Toggle Button */}
        <button
          type="button"
          onClick={() => setIsDarkMode((prev) => !prev)}
          className="p-2 rounded-xl text-[#737373] dark:text-[#A3A3A3] hover:text-[#171717] dark:hover:text-[#FAFAFA] hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C] transition"
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* User Profile Avatar Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            aria-expanded={isProfileOpen}
            aria-haspopup="true"
            aria-label="User profile menu"
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C] transition"
          >
            <img
              src={user?.avatar || 'https://ui-avatars.com/api/?name=User&background=f97316&color=fff'}
              alt={user?.name || 'User'}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-orange-500/30"
            />
            <ChevronDown className="w-3.5 h-3.5 text-[#737373] dark:text-[#A3A3A3] hidden sm:block" />
          </button>

          {isProfileOpen && (
            <div
              role="menu"
              aria-label="User menu"
              className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#141414] rounded-2xl shadow-xl border border-[#E5E5E5] dark:border-[#333333] py-2 z-40 animate-fade-in"
            >
              <div className="px-3.5 py-2 border-b border-[#E5E5E5] dark:border-[#333333]">
                <div className="text-sm font-bold text-[#171717] dark:text-[#FAFAFA]">{user?.name || 'User'}</div>
                <div className="text-xs text-[#737373] dark:text-[#A3A3A3] truncate">{user?.email || ''}</div>
                <div className="mt-1 text-[10px] font-semibold text-[#F97316] uppercase tracking-wider">
                  {roleLabels[user?.role || 'member']}
                </div>
              </div>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setCurrentView('profile');
                  setIsProfileOpen(false);
                }}
                className="w-full text-left px-3.5 py-2 text-xs font-medium text-[#171717] dark:text-[#FAFAFA] hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C] hover:text-[#F97316] flex items-center gap-2.5"
              >
                <User className="w-4 h-4 text-[#737373] dark:text-[#A3A3A3]" /> Profile Details
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setCurrentView('settings');
                  setIsProfileOpen(false);
                }}
                className="w-full text-left px-3.5 py-2 text-xs font-medium text-[#171717] dark:text-[#FAFAFA] hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C] hover:text-[#F97316] flex items-center gap-2.5"
              >
                <SettingsIcon className="w-4 h-4 text-[#737373] dark:text-[#A3A3A3]" /> Account Settings
              </button>

              <div className="border-t border-[#E5E5E5] dark:border-[#333333] my-1" />

              <button
                type="button"
                role="menuitem"
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
