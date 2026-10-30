import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  CalendarCheck,
  MessageSquare,
  FileText,
  Video,
  Sparkles,
  Bell,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Layers,
} from 'lucide-react';
import type { AppView } from '../../types';

export const Sidebar: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    user,
    notifications,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
  } = useApp();

  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false);
      }
    };
    if (isMobileSidebarOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileSidebarOpen, setIsMobileSidebarOpen]);

  const unreadNotifs = notifications.filter((n) => !n.isRead).length;

  const navItems: { view: AppView; label: string; icon: React.ReactNode; badge?: number }[] = [
    { view: 'dashboard', label: 'Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
    { view: 'my_tasks', label: 'My Tasks', icon: <CheckSquare className="w-5 h-5" /> },
    { view: 'teams', label: 'Teams', icon: <Users className="w-5 h-5" /> },
    { view: 'daily_logs', label: 'Daily Logs', icon: <CalendarCheck className="w-5 h-5" /> },
    { view: 'chat', label: 'Chat', icon: <MessageSquare className="w-5 h-5" /> },
    { view: 'files', label: 'Files', icon: <FileText className="w-5 h-5" /> },
    { view: 'meetings', label: 'Meetings', icon: <Video className="w-5 h-5" /> },
    { view: 'ai_assistant', label: 'AI Assistant', icon: <Sparkles className="w-5 h-5 text-orange-500" /> },
  ];

  const bottomItems: { view: AppView; label: string; icon: React.ReactNode; badge?: number }[] = [
    { view: 'notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" />, badge: unreadNotifs },
    { view: 'settings', label: 'Settings', icon: <SettingsIcon className="w-5 h-5" /> },
  ];

  const handleNavClick = (view: AppView) => {
    setCurrentView(view);
    setIsMobileSidebarOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-[#141414] text-[#171717] dark:text-[#FAFAFA] border-r border-[#E5E5E5] dark:border-[#333333] transition-colors select-none">
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-[#E5E5E5] dark:border-[#333333]">
        <div
          onClick={() => handleNavClick('dashboard')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-[#F97316] flex items-center justify-center text-white shadow-sm shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          {(!isCollapsed || isMobileSidebarOpen) && (
            <div className="animate-fade-in">
              <span className="text-lg font-bold tracking-tight text-[#171717] dark:text-[#FAFAFA]">WorkNest</span>
              <span className="block text-[10px] text-[#737373] dark:text-[#A3A3A3] font-medium tracking-wide">Enterprise SaaS</span>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        {isMobileSidebarOpen && (
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-label="Close navigation menu"
            className="md:hidden p-1.5 rounded-xl text-[#737373] dark:text-[#A3A3A3] hover:text-[#171717] dark:hover:text-[#FAFAFA] hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C]"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Desktop collapse toggle */}
        {!isMobileSidebarOpen && (
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden md:flex p-1.5 rounded-xl text-[#737373] dark:text-[#A3A3A3] hover:text-[#171717] dark:hover:text-[#FAFAFA] hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C] transition"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
        {navItems.map((item) => {
          const isActive = currentView === item.view || (item.view === 'teams' && currentView === 'team_workspace');
          return (
            <button
              key={item.view}
              onClick={() => handleNavClick(item.view)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#F97316] text-white shadow-sm'
                  : 'text-[#737373] dark:text-[#A3A3A3] hover:text-[#171717] dark:hover:text-[#FAFAFA] hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C]'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <span className="shrink-0">{item.icon}</span>
              {(!isCollapsed || isMobileSidebarOpen) && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom Nav Items & User Profile */}
      <div className="p-3 border-t border-[#E5E5E5] dark:border-[#333333] space-y-1.5">
        {bottomItems.map((item) => {
          const isActive = currentView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => handleNavClick(item.view)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-orange-50 dark:bg-orange-950/40 text-[#F97316] font-semibold'
                  : 'text-[#737373] dark:text-[#A3A3A3] hover:text-[#171717] dark:hover:text-[#FAFAFA] hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="shrink-0">{item.icon}</span>
                {(!isCollapsed || isMobileSidebarOpen) && <span>{item.label}</span>}
              </div>
              {item.badge && item.badge > 0 && (!isCollapsed || isMobileSidebarOpen) && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F97316] text-white">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* User Card */}
        <div
          onClick={() => handleNavClick('profile')}
          className="mt-3 pt-3 border-t border-[#E5E5E5] dark:border-[#333333] flex items-center gap-3 p-2 rounded-xl hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C] cursor-pointer transition"
        >
          <img
            src={user?.avatar || 'https://ui-avatars.com/api/?name=User&background=f97316&color=fff'}
            alt={user?.name || 'User'}
            className="w-9 h-9 rounded-full object-cover shrink-0 ring-2 ring-orange-500/30"
          />
          {(!isCollapsed || isMobileSidebarOpen) && (
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-[#171717] dark:text-[#FAFAFA] truncate">{user?.name || 'User'}</div>
              <div className="text-[10px] text-[#F97316] font-medium truncate capitalize">
                {user?.role ? user.role.replace('_', ' ') : 'member'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden md:block h-screen sticky top-0 z-30 transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Sidebar */}
      {isMobileSidebarOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className="fixed inset-0 z-50 md:hidden flex"
        >
          <div
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-hidden="true"
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          <aside className="relative w-72 h-full z-10 animate-fade-in">{sidebarContent}</aside>
        </div>
      )}
    </>
  );
};
