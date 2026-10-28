import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { ToastContainer } from './components/common/ToastContainer';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
/* TEMPORARY SUPABASE CONNECTION TEST - REMOVE AFTER VERIFICATION */
import { SupabaseConnectionTest } from './components/common/SupabaseConnectionTest';

import { LandingPage } from './components/landing/LandingPage';
import { SignUpPage } from './components/auth/SignUpPage';
import { LoginPage } from './components/auth/LoginPage';
import { ForgotPasswordPage } from './components/auth/ForgotPasswordPage';

import { Dashboard } from './components/dashboard/Dashboard';
import { MyTasks } from './components/tasks/MyTasks';
import { MyTeams } from './components/teams/MyTeams';
import { TeamWorkspace } from './components/teams/TeamWorkspace';
import { DailyLogs } from './components/logs/DailyLogs';
import { ChatView } from './components/chat/ChatView';
import { FilesView } from './components/files/FilesView';
import { MeetingsView } from './components/meetings/MeetingsView';
import { AIAssistantView } from './components/ai/AIAssistantView';
import { NotificationsView } from './components/notifications/NotificationsView';
import { SettingsView } from './components/settings/SettingsView';
import { ProfileView } from './components/profile/ProfileView';

import { NewTaskModal } from './components/tasks/NewTaskModal';
import { CreateTeamModal } from './components/teams/CreateTeamModal';
import { ScheduleMeetingModal } from './components/meetings/ScheduleMeetingModal';
import { FileUploadModal } from './components/files/FileUploadModal';

import { Layers, Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const {
    currentView,
    isLoadingUser,
    isCreateModalOpen,
    setIsCreateModalOpen,
    createModalType,
    setCreateModalType,
  } = useApp();

  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center transition-colors">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30 animate-pulse">
            <Layers className="w-7 h-7" />
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400">
            <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
            <span>Restoring session...</span>
          </div>
        </div>
      </div>
    );
  }

  // Public Unauthenticated Pages
  if (currentView === 'landing') return <LandingPage />;
  if (currentView === 'signup') return <SignUpPage />;
  if (currentView === 'login') return <LoginPage />;
  if (currentView === 'forgot_password') return <ForgotPasswordPage />;

  // Main Authenticated SaaS Layout
  const renderMainView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'my_tasks':
        return <MyTasks />;
      case 'teams':
        return <MyTeams />;
      case 'team_workspace':
        return <TeamWorkspace />;
      case 'daily_logs':
        return <DailyLogs />;
      case 'chat':
        return <ChatView />;
      case 'files':
        return <FilesView />;
      case 'meetings':
        return <MeetingsView />;
      case 'ai_assistant':
        return <AIAssistantView />;
      case 'notifications':
        return <NotificationsView />;
      case 'settings':
        return <SettingsView />;
      case 'profile':
        return <ProfileView />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors font-sans">
      {/* Persistent Left Sidebar */}
      <Sidebar />

      {/* Main Content Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950/60">
          {renderMainView()}
        </main>
      </div>

      {/* Global Modals & Notifications */}
      <GlobalSearchModal />
      <ToastContainer />

      {/* Top Bar "+ Create" Triggered Modals */}
      <NewTaskModal
        isOpen={isCreateModalOpen && createModalType === 'task'}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCreateModalType(null);
        }}
      />
      <CreateTeamModal
        isOpen={isCreateModalOpen && createModalType === 'team'}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCreateModalType(null);
        }}
      />
      <ScheduleMeetingModal
        isOpen={isCreateModalOpen && createModalType === 'meeting'}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCreateModalType(null);
        }}
      />
      <FileUploadModal
        isOpen={isCreateModalOpen && createModalType === 'file'}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCreateModalType(null);
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
      {/* TEMPORARY SUPABASE CONNECTION TEST - REMOVE AFTER VERIFICATION */}
      <SupabaseConnectionTest />
    </AppProvider>
  );
}
