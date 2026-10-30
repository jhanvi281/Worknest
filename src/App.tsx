import React, { Suspense, lazy } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { ToastContainer } from './components/common/ToastContainer';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';

import { LandingPage } from './components/landing/LandingPage';
import { SignUpPage } from './components/auth/SignUpPage';
import { LoginPage } from './components/auth/LoginPage';
import { ForgotPasswordPage } from './components/auth/ForgotPasswordPage';

import { Dashboard } from './components/dashboard/Dashboard';
import { MyTasks } from './components/tasks/MyTasks';
import { MyTeams } from './components/teams/MyTeams';
import { TeamWorkspace } from './components/teams/TeamWorkspace';
import { DailyLogs } from './components/logs/DailyLogs';
import { NotificationsView } from './components/notifications/NotificationsView';
import { SettingsView } from './components/settings/SettingsView';
import { ProfileView } from './components/profile/ProfileView';

// Code-split heavy interactive modules to minimize initial bundle size and optimize TTI
const ChatView = lazy(() => import('./components/chat/ChatView').then((m) => ({ default: m.ChatView })));
const FilesView = lazy(() => import('./components/files/FilesView').then((m) => ({ default: m.FilesView })));
const MeetingsView = lazy(() => import('./components/meetings/MeetingsView').then((m) => ({ default: m.MeetingsView })));
const AIAssistantView = lazy(() => import('./components/ai/AIAssistantView').then((m) => ({ default: m.AIAssistantView })));
const VideoConferenceModal = lazy(() =>
  import('./components/meetings/VideoConferenceModal').then((m) => ({ default: m.VideoConferenceModal }))
);

import { NewTaskModal } from './components/tasks/NewTaskModal';
import { CreateTeamModal } from './components/teams/CreateTeamModal';
import { ScheduleMeetingModal } from './components/meetings/ScheduleMeetingModal';
import { FileUploadModal } from './components/files/FileUploadModal';

import { Layers, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react';

const AppContent: React.FC = () => {
  const {
    currentView,
    user,
    isLoadingUser,
    userError,
    retryProfileSync,
    signOut,
    isCreateModalOpen,
    setIsCreateModalOpen,
    createModalType,
    setCreateModalType,
    setCurrentView,
    activeVideoMeeting,
    setActiveVideoMeeting,
  } = useApp();

  // Handle Clerk OAuth SSO redirect handshake for Google Sign-In
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/sso-callback')) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0A0A0A] flex flex-col items-center justify-center transition-colors">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F97316] flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
            <Layers className="w-7 h-7" />
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-[#737373] dark:text-[#A3A3A3]">
            <Loader2 className="w-5 h-5 text-[#F97316] animate-spin" />
            <span>Completing Google authentication...</span>
          </div>
        </div>
        <AuthenticateWithRedirectCallback signInForceRedirectUrl="/" signUpForceRedirectUrl="/" />
      </div>
    );
  }

  if (isLoadingUser && !user) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0A0A0A] flex flex-col items-center justify-center transition-colors">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F97316] flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
            <Layers className="w-7 h-7" />
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-[#737373] dark:text-[#A3A3A3]">
            <Loader2 className="w-5 h-5 text-[#F97316] animate-spin" />
            <span>Restoring session...</span>
          </div>
        </div>
      </div>
    );
  }

  // 1. Recoverable Workspace Profile Synchronization Error:
  // If Clerk authentication succeeded or a session was attempted, but database profile
  // provisioning failed to resolve a canonical UUID, show an actionable recovery screen.
  if (userError && !user && !isLoadingUser) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0A0A0A] text-[#171717] dark:text-[#FAFAFA] flex flex-col items-center justify-center p-6 transition-colors font-sans">
        <div className="max-w-md w-full bg-white dark:bg-[#141414] rounded-3xl p-8 border border-[#E5E5E5] dark:border-[#333333] shadow-xl text-center space-y-6 animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800 text-[#F97316] flex items-center justify-center mx-auto shadow-sm">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-[#171717] dark:text-[#FAFAFA]">
              Workspace Synchronization Required
            </h2>
            <p className="text-xs text-[#737373] dark:text-[#A3A3A3] leading-relaxed">
              {userError}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAFAFA] dark:bg-[#1C1C1C] border border-[#E5E5E5] dark:border-[#2E2E2E] text-left text-xs text-[#737373] dark:text-[#A3A3A3] space-y-1">
            <div className="font-semibold text-[#171717] dark:text-[#FAFAFA]">Identity Status:</div>
            <div className="text-[11px] font-mono text-[#F97316]">
              Awaiting trusted canonical database profile resolution
            </div>
            {userError && userError.includes('sync_clerk_profile') && (
              <div className="pt-2 text-[11px] text-[#737373] dark:text-[#A3A3A3] border-t border-[#E5E5E5] dark:border-[#2E2E2E] mt-2 leading-relaxed">
                Database migration required: Execute <code className="text-[#F97316] font-mono">20261030000000_clerk_auth_integration.sql</code> in your Supabase SQL Editor, then click <strong>Retry Synchronization</strong>.
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => retryProfileSync()}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Synchronization</span>
            </button>

            <button
              type="button"
              onClick={() => signOut()}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C] text-xs font-semibold text-[#737373] dark:text-[#A3A3A3] transition cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated Visitor Flow:
  // Strictly prevent unauthenticated visitors from rendering private SaaS workspace views.
  // Explicitly requested public views (landing, signup, forgot_password) are honored;
  // all other views (including dashboard) route directly to LoginPage.
  if (!user) {
    if (currentView === 'landing') return <LandingPage />;
    if (currentView === 'signup') return <SignUpPage />;
    if (currentView === 'forgot_password') return <ForgotPasswordPage />;
    return <LoginPage />;
  }

  // 3. Authenticated Flow:
  // If an authenticated user explicitly navigates to the marketing landing page, show it.
  if (currentView === 'landing') {
    return <LandingPage />;
  }

  // If an authenticated user is on an auth entry page (login/signup/forgot_password),
  // redirect them directly to the authenticated Dashboard.
  const activeView =
    currentView === 'login' || currentView === 'signup' || currentView === 'forgot_password'
      ? 'dashboard'
      : currentView;

  // Main Authenticated SaaS Layout
  const renderMainView = () => {
    switch (activeView) {
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
    <div className="flex h-screen overflow-hidden bg-white dark:bg-[#0A0A0A] text-[#171717] dark:text-[#FAFAFA] transition-colors font-sans">
      {/* Persistent Left Sidebar */}
      <Sidebar />

      {/* Main Content Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto bg-[#FAFAFA] dark:bg-[#0A0A0A]">
          <ErrorBoundary
            key={activeView}
            onGoToDashboard={() => setCurrentView('dashboard')}
          >
            <Suspense
              fallback={
                <div className="flex h-full min-h-[360px] w-full flex-col items-center justify-center p-8">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-[#F97316] animate-spin" />
                    <span className="text-xs font-semibold text-[#737373] dark:text-[#A3A3A3]">
                      Loading view...
                    </span>
                  </div>
                </div>
              }
            >
              {renderMainView()}
            </Suspense>
          </ErrorBoundary>
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

      {/* Global Real Jitsi Video Call Overlay */}
      {activeVideoMeeting && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0A] text-white">
              <Loader2 className="w-8 h-8 text-[#F97316] animate-spin" />
            </div>
          }
        >
          <VideoConferenceModal
            meeting={activeVideoMeeting}
            onClose={() => setActiveVideoMeeting(null)}
          />
        </Suspense>
      )}
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary isFullScreen>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
