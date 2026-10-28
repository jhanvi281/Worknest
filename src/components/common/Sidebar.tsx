import React, { useState } from 'react';
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

  const unreadNotifs = notifications.filter((n) => !n.isRead).length;

  const navItems: { view: AppView; label: string; icon: React.ReactNode; badge?: number }[] = [
    { view: 'dashboard', label: 'Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
    { view: 'my_tasks', label: 'My Tasks', icon: <CheckSquare className="w-5 h-5" /> },
    { view: 'teams', label: 'Teams', icon: <Users className="w-5 h-5" /> },
    { view: 'daily_logs', label: 'Daily Logs', icon: <CalendarCheck className="w-5 h-5" /> },
    { view: 'chat', label: 'Chat', icon: <MessageSquare className="w-5 h-5" /> },
    { view: 'files', label: 'Files', icon: <FileText className="w-5 h-5" /> },
    { view: 'meetings', label: 'Meetings', icon: <Video className="w-5 h-5" /> },
    { view: 'ai_assistant', label: 'AI Assistant', icon: <Sparkles className="w-5 h-5 text-indigo-400" /> },
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
    <div className="flex flex-col h-full bg-slate-900 text-slate-200 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80">
        <div
          onClick={() => handleNavClick('dashboard')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          {(!isCollapsed || isMobileSidebarOpen) && (
            <div className="animate-fade-in">
              <span className="text-lg font-bold tracking-tight text-white">WorkNest</span>
              <span className="block text-[10px] text-slate-400 font-medium tracking-wide">Enterprise SaaS</span>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        {isMobileSidebarOpen && (
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Desktop collapse toggle */}
        {!isMobileSidebarOpen && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
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
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
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
      <div className="p-3 border-t border-slate-800/80 space-y-1.5">
        {bottomItems.map((item) => {
          const isActive = currentView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => handleNavClick(item.view)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="shrink-0">{item.icon}</span>
                {(!isCollapsed || isMobileSidebarOpen) && <span>{item.label}</span>}
              </div>
              {item.badge && item.badge > 0 && (!isCollapsed || isMobileSidebarOpen) && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* User Card */}
        <div
          onClick={() => handleNavClick('profile')}
          className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800/70 cursor-pointer transition"
        >
          <img
            src={user?.avatar || 'https://ui-avatars.com/api/?name=User&background=6366f1&color=fff'}
            alt={user?.name || 'User'}
            className="w-9 h-9 rounded-full object-cover shrink-0 ring-2 ring-indigo-500/40"
          />
          {(!isCollapsed || isMobileSidebarOpen) && (
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-white truncate">{user?.name || 'User'}</div>
              <div className="text-[10px] text-indigo-400 font-medium truncate capitalize">
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
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <aside className="relative w-72 h-full z-10 animate-fade-in">{sidebarContent}</aside>
        </div>
      )}
    </>
  );
};
