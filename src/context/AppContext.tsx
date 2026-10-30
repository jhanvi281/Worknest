import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useUser, useClerk, useAuth } from '@clerk/clerk-react';
import { supabase, setClerkTokenGetter, isClerkAuthMode } from '../lib/supabase';
import { isValidUuid } from '../lib/clerkUtils';
import { taskService } from '../services/taskService';
import { dailyLogService } from '../services/dailyLogService';
import { chatService } from '../services/chatService';
import { fileService } from '../services/fileService';
import { notificationService } from '../services/notificationService';
import { meetingService, type CreateMeetingParams } from '../services/meetingService';
import { aiService } from '../services/aiService';
import { actionValidationService } from '../services/actionValidationService';
import type {
  AppView,
  UserRole,
  UserProfile,
  Task,
  Team,
  TeamMember,
  Subgroup,
  DailyLog,
  ChatMessage,
  ChatChannel,
  ProjectFile,
  FileCategory,
  Meeting,
  AIMessage,
  AIAction,
  AIStage,
  NotificationItem,
  ToastAlert,
} from '../types';

interface AppContextType {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean | ((prev: boolean) => boolean)) => void;
  activeTeamId: string;
  setActiveTeamId: (id: string) => void;

  // User Data
  user: UserProfile | null;
  isLoadingUser: boolean;
  userError: string | null;
  retryProfileSync: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (name: string, email: string, department: string) => Promise<boolean>;

  // Tasks
  tasks: Task[];
  isLoadingTasks: boolean;
  tasksError: string | null;
  addTask: (task: Omit<Task, 'id'>) => Promise<boolean>;
  updateTaskStatus: (id: string, status: Task['status'], progress?: number) => Promise<boolean>;
  editTask: (id: string, updated: Partial<Task>) => Promise<boolean>;
  deleteTask: (id: string) => Promise<boolean>;
  refreshTasks: () => Promise<void>;

  // Teams & Subgroups & Members
  teams: Team[];
  isLoadingTeams: boolean;
  teamsError: string | null;
  currentUserRole: UserRole;
  addTeam: (team: { name: string; description: string; deadline: string }) => Promise<boolean>;
  addSubgroup: (teamId: string, subgroup: { name: string; description: string }) => Promise<boolean>;
  addTeamMember: (teamId: string, member: { email: string; role: UserRole; subgroupId?: string }) => Promise<boolean>;
  updateTeamMember: (teamId: string, memberId: string, updates: { role?: UserRole; subgroupId?: string | null }) => Promise<boolean>;
  removeTeamMember: (teamId: string, memberId: string) => Promise<boolean>;
  refreshTeams: () => Promise<void>;

  // Daily Logs
  dailyLogs: DailyLog[];
  isLoadingDailyLogs: boolean;
  dailyLogsError: string | null;
  addDailyLog: (log: Omit<DailyLog, 'id' | 'userId' | 'userName' | 'userAvatar' | 'status'>) => Promise<boolean>;
  deleteDailyLog: (id: string) => Promise<boolean>;
  refreshDailyLogs: () => Promise<void>;

  // Chat
  channels: ChatChannel[];
  isLoadingChannels: boolean;
  channelsError: string | null;
  activeChannelId: string;
  setActiveChannelId: (id: string) => void;
  messages: ChatMessage[];
  isLoadingMessages: boolean;
  messagesError: string | null;
  sendMessage: (channelId: string, text: string, attachments?: ChatMessage['attachments']) => Promise<boolean>;
  editMessage: (messageId: string, newText: string) => Promise<boolean>;
  deleteMessage: (messageId: string) => Promise<boolean>;
  toggleReaction: (messageId: string, emoji: string) => Promise<boolean>;
  uploadChatAttachment: (file: File) => Promise<{ name: string; size: string; type: string; url?: string; path?: string } | null>;
  downloadChatAttachment: (att: { name: string; url?: string; path?: string }) => Promise<void>;
  createChannel: (channel: { name: string; description?: string; isSubgroup?: boolean; subgroupId?: string }) => Promise<boolean>;
  refreshChannels: () => Promise<void>;
  refreshMessages: (channelId?: string) => Promise<void>;
  onlineCount: number;

  // Files
  files: ProjectFile[];
  isLoadingFiles: boolean;
  filesError: string | null;
  refreshFiles: (teamId?: string) => Promise<void>;
  uploadFile: (
    file: File,
    options?: { teamId?: string; customName?: string; category?: FileCategory }
  ) => Promise<ProjectFile | null>;
  addFile: (file: Omit<ProjectFile, 'id' | 'uploadedBy' | 'uploaderAvatar' | 'date'>) => void;
  deleteFile: (id: string) => Promise<boolean>;
  downloadFile: (file: ProjectFile) => Promise<void>;
  getFilePreviewUrl: (file: ProjectFile) => Promise<string | null>;

  // Meetings & Video Call
  meetings: Meeting[];
  isLoadingMeetings: boolean;
  meetingsError: string | null;
  refreshMeetings: () => Promise<void>;
  createMeeting: (params: CreateMeetingParams) => Promise<Meeting | null>;
  cancelMeeting: (meetingId: string) => Promise<boolean>;
  addMeeting: (meeting: Omit<Meeting, 'id'>) => void;
  activeVideoMeeting: Meeting | null;
  setActiveVideoMeeting: (meeting: Meeting | null) => void;

  // AI Assistant
  aiMessages: AIMessage[];
  isAITyping: boolean;
  aiStage: AIStage;
  aiError: string | null;
  sendAIMessage: (text: string) => Promise<boolean>;
  cancelAIMessage: () => void;
  clearAIMessages: () => void;
  retryLastAIMessage: () => Promise<boolean>;
  executeAIAction: (actionId: string, overrides?: Record<string, any>) => Promise<boolean>;
  cancelAIAction: (actionId: string) => void;
  updateAIActionParams: (actionId: string, newParams: Record<string, any>) => void;

  // Notifications
  notifications: NotificationItem[];
  isLoadingNotifications: boolean;
  notificationsError: string | null;
  unreadNotificationsCount: number;
  refreshNotifications: () => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<boolean>;
  markAllNotificationsAsRead: () => Promise<boolean>;
  deleteNotification: (id: string) => Promise<boolean>;

  // Search & Modals
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  createModalType: 'task' | 'team' | 'meeting' | 'file' | null;
  setCreateModalType: (type: 'task' | 'team' | 'meeting' | 'file' | null) => void;

  // Toasts
  toasts: ToastAlert[];
  addToast: (title: string, type?: ToastAlert['type']) => void;
  removeToast: (id: string) => void;

  // Mobile sidebar
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
}








const loadInitialAIMessages = (): AIMessage[] => {
  try {
    const saved = sessionStorage.getItem('worknest_ai_messages');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Ignore sessionStorage parse errors
  }
  return [];
};



const AppContext = createContext<AppContextType | undefined>(undefined);

const PUBLIC_VIEWS: AppView[] = ['landing', 'login', 'signup', 'forgot_password'];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Clerk Authentication hooks
  const { user: clerkUser, isLoaded: isClerkLoaded, isSignedIn: isClerkSignedIn } = useUser();
  const { getToken } = useAuth();
  const clerk = useClerk();

  // Register dynamic token getter for Supabase client (Clerk native 3rd-party auth)
  useEffect(() => {
    if (getToken) {
      setClerkTokenGetter(async () => {
        try {
          return await getToken();
        } catch (err) {
          console.error('Error retrieving Clerk session token for Supabase client:', err);
          return null;
        }
      });
    }
  }, [getToken]);
  const [currentView, setCurrentViewState] = useState<AppView>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlView = params.get('view');
      if (urlView) return urlView as AppView;
      const saved = localStorage.getItem('worknest_current_view');
      if (saved && !PUBLIC_VIEWS.includes(saved as AppView)) {
        return saved as AppView;
      }
    } catch {
      // Ignore URL/localStorage parse errors
    }
    return 'landing';
  });

  const setCurrentView = (view: AppView) => {
    setCurrentViewState(view);
    if (!PUBLIC_VIEWS.includes(view)) {
      localStorage.setItem('worknest_current_view', view);
    } else if (view === 'landing') {
      localStorage.removeItem('worknest_current_view');
    }
  };

  const [currentRole, setCurrentRole] = useState<UserRole>('group_leader');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlTheme = params.get('theme');
      if (urlTheme === 'dark') return true;
      if (urlTheme === 'light') return false;
      const saved = localStorage.getItem('worknest_theme');
      if (saved) return saved === 'dark';
      return typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : false;
    } catch {
      return false;
    }
  });
  const [activeTeamId, setActiveTeamIdState] = useState<string>(() => {
    return localStorage.getItem('worknest_active_team_id') || '';
  });

  // Clean up transient deep-link/testing parameters from URL so normal navigation & refresh use saved preferences
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.location.search) {
        const params = new URLSearchParams(window.location.search);
        let hasCustomParams = false;
        if (params.has('theme')) {
          params.delete('theme');
          hasCustomParams = true;
        }
        if (params.has('view')) {
          params.delete('view');
          hasCustomParams = true;
        }
        if (params.has('modal')) {
          params.delete('modal');
          hasCustomParams = true;
        }
        if (hasCustomParams) {
          const remaining = params.toString();
          const cleanUrl = window.location.pathname + (remaining ? '?' + remaining : '') + window.location.hash;
          window.history.replaceState({}, '', cleanUrl);
        }
      }
    } catch {
      // Ignore history manipulation errors
    }
  }, []);

  const setActiveTeamId = (id: string) => {
    setActiveTeamIdState(id);
    localStorage.setItem('worknest_active_team_id', id);
  };

  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(true);
  const [userError, setUserError] = useState<string | null>(null);
  const lastLoadedUserIdRef = useRef<string | null>(null);

  // Real Supabase Teams & Subgroups State
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState<boolean>(true);
  const [teamsError, setTeamsError] = useState<string | null>(null);

  // Real Supabase Tasks & Daily Logs State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState<boolean>(true);
  const [tasksError, setTasksError] = useState<string | null>(null);

  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [isLoadingDailyLogs, setIsLoadingDailyLogs] = useState<boolean>(true);
  const [dailyLogsError, setDailyLogsError] = useState<string | null>(null);

  // Real Supabase Chat State
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [isLoadingChannels, setIsLoadingChannels] = useState<boolean>(true);
  const [channelsError, setChannelsError] = useState<string | null>(null);
  const [activeChannelId, setActiveChannelIdState] = useState<string>(() => {
    return localStorage.getItem('worknest_active_channel_id') || '';
  });
  const setActiveChannelId = (id: string) => {
    setActiveChannelIdState(id);
    if (id) {
      localStorage.setItem('worknest_active_channel_id', id);
    }
  };
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false);
  const [filesError, setFilesError] = useState<string | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoadingMeetings, setIsLoadingMeetings] = useState<boolean>(false);
  const [meetingsError, setMeetingsError] = useState<string | null>(null);
  const [activeVideoMeeting, setActiveVideoMeeting] = useState<Meeting | null>(null);
  const [aiMessages, setAiMessages] = useState<AIMessage[]>(loadInitialAIMessages);
  const [isAITyping, setIsAITyping] = useState<boolean>(false);
  const [aiStage, setAiStage] = useState<AIStage>('idle');
  const [aiError, setAiError] = useState<string | null>(null);
  const isSendingAIMessageRef = useRef<boolean>(false);
  const aiAbortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      if (aiMessages.length === 0) {
        sessionStorage.removeItem('worknest_ai_messages');
      } else {
        sessionStorage.setItem('worknest_ai_messages', JSON.stringify(aiMessages));
      }
    } catch {
      // Ignore sessionStorage quota/serialization errors
    }
  }, [aiMessages]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState<boolean>(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

  const [isSearchOpen, setIsSearchOpen] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).get('modal') === 'search';
    } catch {
      return false;
    }
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(() => {
    try {
      const m = new URLSearchParams(window.location.search).get('modal');
      return ['task', 'team', 'meeting', 'file'].includes(m || '');
    } catch {
      return false;
    }
  });
  const [createModalType, setCreateModalType] = useState<'task' | 'team' | 'meeting' | 'file' | null>(() => {
    try {
      const m = new URLSearchParams(window.location.search).get('modal');
      if (m && ['task', 'team', 'meeting', 'file'].includes(m)) {
        return m as any;
      }
    } catch {}
    return null;
  });
  const [toasts, setToasts] = useState<ToastAlert[]>([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Fetch real tasks from Supabase
  const fetchTasks = async (userId: string, showLoading: boolean = true) => {
    if (!userId || !isValidUuid(userId)) {
      setTasks([]);
      if (showLoading) setIsLoadingTasks(false);
      return;
    }
    if (showLoading) setIsLoadingTasks(true);
    setTasksError(null);
    try {
      const fetchedTasks = await taskService.fetchUserTasks(userId);
      setTasks(fetchedTasks);
    } catch (err: unknown) {
      console.error('Error loading tasks from Supabase:', err);
      const msg = err instanceof Error ? err.message : 'Failed to load tasks.';
      setTasksError(msg);
    } finally {
      if (showLoading) setIsLoadingTasks(false);
    }
  };

  // Fetch real daily logs from Supabase
  const fetchDailyLogs = async (userId: string, showLoading: boolean = true) => {
    if (!userId || !isValidUuid(userId)) {
      setDailyLogs([]);
      if (showLoading) setIsLoadingDailyLogs(false);
      return;
    }
    if (showLoading) setIsLoadingDailyLogs(true);
    setDailyLogsError(null);
    try {
      const fetchedLogs = await dailyLogService.fetchUserDailyLogs(userId);
      setDailyLogs(fetchedLogs);
    } catch (err: unknown) {
      console.error('Error loading daily logs from Supabase:', err);
      const msg = err instanceof Error ? err.message : 'Failed to load daily logs.';
      setDailyLogsError(msg);
    } finally {
      if (showLoading) setIsLoadingDailyLogs(false);
    }
  };

  const refreshTasks = async () => {
    if (user?.id) {
      await fetchTasks(user.id);
    }
  };

  const refreshDailyLogs = async () => {
    if (user?.id) {
      await fetchDailyLogs(user.id);
    }
  };

  // Fetch real project files from Supabase
  const fetchFiles = async (teamId?: string, showLoading: boolean = true) => {
    if (showLoading) setIsLoadingFiles(true);
    setFilesError(null);
    try {
      const loadedFiles = await fileService.fetchFiles({ teamId });
      setFiles(loadedFiles);
    } catch (err: unknown) {
      console.error('Error loading files from Supabase:', err);
      const msg = err instanceof Error ? err.message : 'Failed to load project files.';
      setFilesError(msg);
    } finally {
      if (showLoading) setIsLoadingFiles(false);
    }
  };

  const refreshFiles = async (teamId?: string) => {
    await fetchFiles(teamId);
  };

  // Fetch real notifications from Supabase
  const fetchNotifications = async (showLoading: boolean = true) => {
    if (showLoading) setIsLoadingNotifications(true);
    setNotificationsError(null);
    try {
      const loaded = await notificationService.fetchNotifications();
      setNotifications(loaded);
    } catch (err: unknown) {
      console.error('Error loading notifications from Supabase:', err);
      const msg = err instanceof Error ? err.message : 'Failed to load notifications.';
      setNotificationsError(msg);
    } finally {
      if (showLoading) setIsLoadingNotifications(false);
    }
  };

  const refreshNotifications = async () => {
    await fetchNotifications();
  };

  // Realtime subscription for notifications
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = notificationService.subscribeToNotifications(user.id, {
      onInsert: (newNotif) => {
        setNotifications((prev) => {
          if (prev.some((n) => n.id === newNotif.id)) return prev;
          return [newNotif, ...prev];
        });
        addToast(newNotif.title, 'info');
      },
      onUpdate: (updatedNotif) => {
        setNotifications((prev) =>
          prev.map((n) => (n.id === updatedNotif.id ? updatedNotif : n))
        );
      },
      onDelete: (deletedId) => {
        setNotifications((prev) => prev.filter((n) => n.id !== deletedId));
      },
    });

    return () => {
      unsubscribe();
    };
  }, [user?.id]);

  // Fetch real persistent meetings from Supabase
  const fetchMeetings = async (showLoading: boolean = true) => {
    if (showLoading) setIsLoadingMeetings(true);
    setMeetingsError(null);
    try {
      const loaded = await meetingService.fetchUserMeetings();
      setMeetings(loaded);
    } catch (err: unknown) {
      console.error('Error loading meetings from Supabase:', err);
      const msg = err instanceof Error ? err.message : 'Failed to load meetings.';
      setMeetingsError(msg);
    } finally {
      if (showLoading) setIsLoadingMeetings(false);
    }
  };

  const refreshMeetings = async () => {
    await fetchMeetings();
  };

  // Realtime subscription for meetings
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = meetingService.subscribeToMeetings(() => {
      fetchMeetings();
    });

    return () => {
      unsubscribe();
    };
  }, [user?.id]);

  // Fetch real chat channels from Supabase
  const fetchChannels = async (teamId?: string) => {
    setIsLoadingChannels(true);
    setChannelsError(null);
    try {
      const loadedChannels = await chatService.fetchChannels(teamId);
      setChannels(loadedChannels);

      if (loadedChannels.length > 0) {
        setActiveChannelIdState((prev) => {
          if (prev && loadedChannels.some((c) => c.id === prev)) return prev;
          const saved = localStorage.getItem('worknest_active_channel_id');
          if (saved && loadedChannels.some((c) => c.id === saved)) return saved;
          return loadedChannels[0].id;
        });
      } else {
        setActiveChannelIdState('');
      }
    } catch (err: unknown) {
      console.error('Error loading chat channels from Supabase:', err);
      const msg = err instanceof Error ? err.message : 'Failed to load chat channels.';
      setChannelsError(msg);
      setChannels([]);
    } finally {
      setIsLoadingChannels(false);
    }
  };

  // Fetch real messages for the specified channel
  const fetchMessages = async (channelId: string) => {
    if (!channelId) {
      setMessages([]);
      return;
    }
    setIsLoadingMessages(true);
    setMessagesError(null);
    try {
      const msgs = await chatService.fetchMessages(channelId, user?.id);
      setMessages(msgs);
    } catch (err: unknown) {
      console.error(`Error loading messages for channel ${channelId}:`, err);
      const msg = err instanceof Error ? err.message : 'Failed to load messages.';
      setMessagesError(msg);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const refreshChannels = async () => {
    await fetchChannels(activeTeamId || undefined);
  };

  const refreshMessages = async (channelId?: string) => {
    const targetId = channelId || activeChannelId;
    if (targetId) {
      await fetchMessages(targetId);
    }
  };

  // Fetch real teams from Supabase for a given user ID
  const fetchTeams = async (userId: string, showLoading: boolean = true) => {
    if (!userId || !isValidUuid(userId)) {
      setTeams([]);
      if (showLoading) setIsLoadingTeams(false);
      return;
    }
    if (showLoading) setIsLoadingTeams(true);
    setTeamsError(null);
    try {
      // 1. Query team_members for the authenticated user to get teams they belong to
      const { data: memberRows, error: memberErr } = await supabase
        .from('team_members')
        .select(`
          team_id,
          role,
          subgroup_id,
          teams:team_id (
            id,
            name,
            description,
            created_by,
            project_progress,
            deadline,
            created_at
          )
        `)
        .eq('user_id', userId);

      if (memberErr) {
        console.error('Error fetching user teams from team_members:', memberErr);
        setTeamsError(memberErr.message);
        setTeams([]);
        if (showLoading) setIsLoadingTeams(false);
        return;
      }

      if (!memberRows || memberRows.length === 0) {
        setTeams([]);
        if (showLoading) setIsLoadingTeams(false);
        return;
      }

      // Extract unique team objects
      const rawTeamsMap = new Map<string, any>();
      memberRows.forEach((m: any) => {
        if (m.teams && !rawTeamsMap.has(m.teams.id)) {
          rawTeamsMap.set(m.teams.id, m.teams);
        }
      });
      const teamList = Array.from(rawTeamsMap.values());

      // 2. Load subgroups & members (with profiles) for each team
      const loadedTeams: Team[] = await Promise.all(
        teamList.map(async (t: any) => {
          // Fetch subgroups
          const { data: sgData, error: sgErr } = await supabase
            .from('subgroups')
            .select('id, name, description, leader_id, created_at')
            .eq('team_id', t.id);

          if (sgErr) {
            console.error(`Error fetching subgroups for team ${t.id}:`, sgErr);
          }

          // Fetch team members with profile details
          const { data: membersData, error: memErr } = await supabase
            .from('team_members')
            .select(`
              id,
              team_id,
              user_id,
              role,
              subgroup_id,
              joined_at,
              profiles:user_id (
                id,
                full_name,
                email,
                avatar_url,
                department
              )
            `)
            .eq('team_id', t.id);

          if (memErr) {
            console.error(`Error fetching members for team ${t.id}:`, memErr);
          }

          const rawMembers = membersData || [];
          const rawSubgroups = sgData || [];

          // Map team members
          const members: TeamMember[] = rawMembers.map((m: any) => {
            const profile = m.profiles || {};
            const name = profile.full_name || profile.email?.split('@')[0] || 'Member';
            const email = profile.email || '';
            const avatar = profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=f97316&color=fff`;
            
            const assignedSg = rawSubgroups.find((sg: any) => sg.id === m.subgroup_id);
            const roleLabels: Record<UserRole, string> = {
              group_leader: 'Group Leader',
              subgroup_leader: 'Sub-Group Leader',
              member: 'Member',
              personal_user: 'Personal User',
            };

            return {
              id: m.id,
              memberId: m.id,
              userId: m.user_id,
              name,
              email,
              role: m.role as UserRole,
              roleLabel: roleLabels[m.role as UserRole] || 'Member',
              avatar,
              isOnline: true,
              subgroupId: m.subgroup_id || undefined,
              assignedSubgroup: assignedSg ? assignedSg.name : undefined,
              assignedTasksCount: 0,
              progress: 100,
            };
          });

          // Compute group leader info
          const leaderMember = members.find((m) => m.role === 'group_leader') || members[0];
          const leaderName = leaderMember ? leaderMember.name : 'Group Leader';
          const leaderAvatar = leaderMember ? leaderMember.avatar : '';

          // Map subgroups
          const subgroups: Subgroup[] = rawSubgroups.map((sg: any) => {
            const sgLeader = members.find(
              (m) => m.userId === sg.leader_id || (m.subgroupId === sg.id && m.role === 'subgroup_leader')
            );
            const memberCount = members.filter((m) => m.subgroupId === sg.id).length;
            return {
              id: sg.id,
              name: sg.name,
              description: sg.description || '',
              leaderId: sg.leader_id || (sgLeader ? sgLeader.userId : ''),
              leaderName: sgLeader ? sgLeader.name : 'Unassigned',
              memberCount,
            };
          });

          return {
            id: t.id,
            name: t.name,
            description: t.description || '',
            leaderName,
            leaderAvatar,
            createdBy: t.created_by,
            memberCount: members.length,
            projectProgress: t.project_progress || 0,
            activeTasks: 0,
            deadline: t.deadline ? t.deadline : 'Not Set',
            subgroups,
            members,
          };
        })
      );

      setTeams(loadedTeams);

      // Select active team if missing or invalid
      if (loadedTeams.length > 0) {
        setActiveTeamIdState((prev) => {
          if (prev && loadedTeams.some((t) => t.id === prev)) return prev;
          const saved = localStorage.getItem('worknest_active_team_id');
          if (saved && loadedTeams.some((t) => t.id === saved)) return saved;
          return loadedTeams[0].id;
        });
      } else {
        setActiveTeamIdState('');
      }
    } catch (err: unknown) {
      console.error('Unexpected error loading teams:', err);
      const msg = err instanceof Error ? err.message : 'Failed to load teams.';
      setTeamsError(msg);
    } finally {
      if (showLoading) setIsLoadingTeams(false);
    }
  };

  // Derive active user's actual database role for the selected team
  const activeTeam = teams.find((t) => t.id === activeTeamId);
  const activeUserMemberRecord = activeTeam?.members.find((m) => m.userId === user?.id);
  const currentUserRole: UserRole = activeUserMemberRecord
    ? activeUserMemberRecord.role
    : activeTeam?.createdBy === user?.id
    ? 'group_leader'
    : 'member';

  const refreshTeams = async () => {
    if (user?.id) {
      await fetchTeams(user.id);
    }
  };

  // Synchronize Clerk user identity to Supabase PostgreSQL and resolve canonical UUID
  const syncAndLoadClerkUser = async (cUser: NonNullable<typeof clerkUser>, isInitial: boolean = false) => {
    if (!cUser) return;
    if (isInitial && !user) {
      setIsLoadingUser(true);
    }
    setUserError(null);

    try {
      const primaryEmail =
        cUser.primaryEmailAddress?.emailAddress ||
        cUser.emailAddresses?.[0]?.emailAddress ||
        '';
      const fullName =
        cUser.fullName ||
        [cUser.firstName, cUser.lastName].filter(Boolean).join(' ') ||
        cUser.username ||
        primaryEmail.split('@')[0] ||
        'User';
      const avatarUrl =
        cUser.imageUrl ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=f97316&color=fff`;

      // 1. Call secure JIT sync RPC to map Clerk User ID to canonical UUID profile in public.profiles
      let canonicalUuid: string | null = null;
      let syncErrorMsg: string | null = null;

      try {
        const { data, error } = await supabase.rpc('sync_clerk_profile', {
          p_clerk_user_id: cUser.id,
          p_email: primaryEmail,
          p_full_name: fullName,
          p_avatar_url: avatarUrl,
        });

        if (!error && data && isValidUuid(data)) {
          canonicalUuid = data;
        } else if (error) {
          syncErrorMsg = error.message;
          console.warn('[WorkNest Auth] sync_clerk_profile RPC notice:', error.message);
        }
      } catch (rpcErr) {
        syncErrorMsg = rpcErr instanceof Error ? rpcErr.message : String(rpcErr);
        console.warn('[WorkNest Auth] RPC invocation exception:', rpcErr);
      }

      // 2. Query trusted public.profiles by canonical UUID or clerk_user_id
      let profileData: { id: string; full_name?: string; email?: string; avatar_url?: string; department?: string } | null = null;

      if (canonicalUuid) {
        const { data, error: profileErr } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url, department')
          .eq('id', canonicalUuid)
          .maybeSingle();

        if (!profileErr && data && isValidUuid(data.id)) {
          profileData = data;
        }
      }

      // Secondary lookup: If RPC returned error or timed out, check if trusted mapping was previously established
      if (!profileData) {
        const { data, error: byClerkErr } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url, department')
          .eq('clerk_user_id', cUser.id)
          .maybeSingle();

        if (!byClerkErr && data && isValidUuid(data.id)) {
          profileData = data;
          canonicalUuid = data.id;
        }
      }

      // 3. STRICT IDENTITY VERIFICATION:
      // If provisioning failed to resolve a canonical UUID from public.profiles.id,
      // fail safely with a recoverable synchronization error.
      // NEVER silently substitute Clerk IDs (user_...) or independently generated UUIDs.
      if (!profileData || !canonicalUuid) {
        lastLoadedUserIdRef.current = null;
        setUser(null);
        const detailedError = syncErrorMsg
          ? `Workspace profile synchronization error: ${syncErrorMsg}`
          : 'Unable to resolve your canonical workspace profile from the database. Please ensure the Clerk database migration has been applied and your session is active.';
        setUserError(detailedError);
        setIsLoadingUser(false);
        return;
      }

      const canonicalId = profileData.id;
      const name = profileData.full_name || fullName;
      const email = profileData.email || primaryEmail;
      const avatar = profileData.avatar_url || avatarUrl;
      const department = profileData.department || 'General';

      lastLoadedUserIdRef.current = canonicalId;
      setUserError(null);

      setUser({
        id: canonicalId,
        name,
        email,
        avatar,
        role: currentRole,
        department,
      });

      // 4. Load all associated private workspace data ONLY AFTER canonical identity is confirmed
      fetchTeams(canonicalId, isInitial);
      fetchTasks(canonicalId, isInitial);
      fetchDailyLogs(canonicalId, isInitial);
      fetchFiles(undefined, isInitial);
      fetchNotifications(isInitial);
      fetchMeetings(isInitial);

      // On successful auth restoration, transition away from public auth entry views to dashboard or saved view
      setCurrentViewState((prev) => {
        if (PUBLIC_VIEWS.includes(prev)) {
          const savedView = localStorage.getItem('worknest_current_view') as AppView | null;
          return savedView && !PUBLIC_VIEWS.includes(savedView) ? savedView : 'dashboard';
        }
        return prev;
      });
    } catch (err: unknown) {
      console.error('[WorkNest Auth] Unexpected error loading Clerk user profile:', err);
      const msg = err instanceof Error ? err.message : 'Failed to load user information.';
      lastLoadedUserIdRef.current = null;
      setUser(null);
      setUserError(`Workspace profile synchronization error: ${msg}`);
    } finally {
      setIsLoadingUser(false);
    }
  };

  // Legacy Supabase user loading fallback during migration
  const loadLegacySupabaseUser = async (explicitAuthUser?: any, isInitial: boolean = false) => {
    if (isClerkAuthMode) {
      // In Clerk auth mode, if user is not authenticated via Clerk, they are an unauthenticated visitor
      lastLoadedUserIdRef.current = null;
      setUser(null);
      setTeams([]);
      setIsLoadingUser(false);
      setIsLoadingTeams(false);
      return;
    }

    if (isInitial && !user) {
      setIsLoadingUser(true);
    }
    setUserError(null);
    let authUser = explicitAuthUser;
    try {
      if (!authUser) {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Failed to get Supabase session:', sessionError);
        }
        authUser = session?.user || null;
      }

      if (!authUser) {
        lastLoadedUserIdRef.current = null;
        setUser(null);
        setTeams([]);
        setIsLoadingUser(false);
        setIsLoadingTeams(false);
        return;
      }

      lastLoadedUserIdRef.current = authUser.id;
      const shouldShowLoading = isInitial && !user;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, department')
        .eq('id', authUser.id)
        .maybeSingle();

      if (profileError) {
        console.error('Failed to load profile from public.profiles:', profileError);
        setUserError(`Failed to load user profile: ${profileError.message}`);

        const fallbackName =
          authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User';
        const fallbackAvatar =
          authUser.user_metadata?.avatar_url ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=f97316&color=fff`;

        setUser({
          id: authUser.id,
          name: fallbackName,
          email: authUser.email || '',
          avatar: fallbackAvatar,
          role: currentRole,
          department: 'General',
        });

        fetchTeams(authUser.id, shouldShowLoading);
        fetchTasks(authUser.id, shouldShowLoading);
        fetchDailyLogs(authUser.id, shouldShowLoading);
        fetchFiles(undefined, shouldShowLoading);
        fetchNotifications(shouldShowLoading);
        fetchMeetings(shouldShowLoading);

        setCurrentViewState((prev) => {
          if (PUBLIC_VIEWS.includes(prev)) {
            const savedView = localStorage.getItem('worknest_current_view') as AppView | null;
            return savedView && !PUBLIC_VIEWS.includes(savedView) ? savedView : 'dashboard';
          }
          return prev;
        });
        return;
      }

      const name =
        profile?.full_name ||
        authUser.user_metadata?.full_name ||
        authUser.email?.split('@')[0] ||
        'User';
      const email = profile?.email || authUser.email || '';
      const avatar =
        profile?.avatar_url ||
        authUser.user_metadata?.avatar_url ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=f97316&color=fff`;
      const department = profile?.department || 'General';

      setUser({
        id: authUser.id,
        name,
        email,
        avatar,
        role: currentRole,
        department,
      });
      setUserError(null);

      fetchTeams(authUser.id, shouldShowLoading);
      fetchTasks(authUser.id, shouldShowLoading);
      fetchDailyLogs(authUser.id, shouldShowLoading);
      fetchFiles(undefined, shouldShowLoading);
      fetchNotifications(shouldShowLoading);
      fetchMeetings(shouldShowLoading);

      setCurrentViewState((prev) => {
        if (PUBLIC_VIEWS.includes(prev)) {
          const savedView = localStorage.getItem('worknest_current_view') as AppView | null;
          return savedView && !PUBLIC_VIEWS.includes(savedView) ? savedView : 'dashboard';
        }
        return prev;
      });
    } catch (err: unknown) {
      console.error('Unexpected error loading authenticated user:', err);
      const msg = err instanceof Error ? err.message : 'Failed to load user information.';
      setUserError(msg);
    } finally {
      setIsLoadingUser(false);
    }
  };

  // Primary authentication handler: Clerk priority with legacy Supabase fallback
  useEffect(() => {
    if (!isClerkLoaded) return;

    if (isClerkSignedIn && clerkUser) {
      syncAndLoadClerkUser(clerkUser, true);
    } else {
      loadLegacySupabaseUser(undefined, true);
    }
  }, [isClerkLoaded, isClerkSignedIn, clerkUser?.id]);

  // Secondary listener: Supabase Auth session changes
  useEffect(() => {
    // When Clerk auth mode is enabled, legacy Supabase auth events are bypassed
    if (isClerkAuthMode) return;

    let isMounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      if (!isMounted) return;

      // If user is already authenticated via Clerk, ignore legacy Supabase session events
      if (isClerkSignedIn && clerkUser) return;

      if (event === 'SIGNED_IN') {
        if (session?.user) {
          const isSameUser = lastLoadedUserIdRef.current === session.user.id;
          if (!isSameUser) {
            if (lastLoadedUserIdRef.current) {
              setTeams([]);
              setTasks([]);
              setDailyLogs([]);
              setChannels([]);
              setMessages([]);
              setFiles([]);
              setNotifications([]);
              setMeetings([]);
              setActiveVideoMeeting(null);
            }
            loadLegacySupabaseUser(session.user, true);
          } else {
            loadLegacySupabaseUser(session.user, false);
          }
        }
      } else if (event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          loadLegacySupabaseUser(session.user, false);
        }
      } else if (event === 'PASSWORD_RECOVERY') {
        if (session?.user) {
          loadLegacySupabaseUser(session.user, false);
          setCurrentViewState('settings');
          addToast('Please enter your new password in Account Security', 'info');
        }
      } else if (event === 'INITIAL_SESSION') {
        if (session?.user) {
          if (lastLoadedUserIdRef.current !== session.user.id) {
            loadLegacySupabaseUser(session.user, false);
          }
        } else if (!isClerkSignedIn) {
          lastLoadedUserIdRef.current = null;
          setUser(null);
          setTeams([]);
          setTasks([]);
          setDailyLogs([]);
          setChannels([]);
          setMessages([]);
          setFiles([]);
          setFilesError(null);
          setNotifications([]);
          setNotificationsError(null);
          setMeetings([]);
          setMeetingsError(null);
          setActiveVideoMeeting(null);
          setActiveChannelIdState('');
          setIsLoadingUser(false);
        }
      } else if (event === 'SIGNED_OUT') {
        if (!isClerkSignedIn) {
          lastLoadedUserIdRef.current = null;
          setUser(null);
          setTeams([]);
          setTasks([]);
          setDailyLogs([]);
          setChannels([]);
          setMessages([]);
          setFiles([]);
          setFilesError(null);
          setNotifications([]);
          setNotificationsError(null);
          setMeetings([]);
          setMeetingsError(null);
          setActiveVideoMeeting(null);
          setActiveChannelIdState('');
          setIsLoadingUser(false);
          localStorage.removeItem('worknest_current_view');
          localStorage.removeItem('worknest_active_channel_id');
          localStorage.removeItem('worknest_active_team_id');
          sessionStorage.removeItem('worknest_ai_messages');
          sessionStorage.removeItem('worknest_ai_input_draft');
          setCurrentViewState('landing');
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [isClerkSignedIn, clerkUser]);

  // Sync theme class to <html> element & persist user preference
  useEffect(() => {
    try {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('worknest_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('worknest_theme', 'light');
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [isDarkMode]);

  // Keep user role in sync with role switcher
  useEffect(() => {
    if (user) {
      setUser((prev) => (prev ? { ...prev, role: currentRole } : null));
    }
  }, [currentRole]);

  // Load channels whenever authenticated user or activeTeamId changes
  useEffect(() => {
    if (user?.id) {
      fetchChannels(activeTeamId || undefined);
    } else {
      setChannels([]);
      setMessages([]);
      setActiveChannelIdState('');
    }
  }, [user?.id, activeTeamId]);

  // Load messages and subscribe to Realtime whenever activeChannelId or user?.id changes
  useEffect(() => {
    if (!activeChannelId) {
      setMessages([]);
      return;
    }

    fetchMessages(activeChannelId);

    const unsubscribe = chatService.subscribeToMessages(
      activeChannelId,
      (newMsg) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        setChannels((prev) =>
          prev.map((c) =>
            c.id === newMsg.channelId
              ? { ...c, lastMessage: newMsg.text, lastTimestamp: newMsg.timestamp }
              : c
          )
        );
      },
      (updatedMsg) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m))
        );
        setChannels((prev) =>
          prev.map((c) =>
            c.id === updatedMsg.channelId
              ? { ...c, lastMessage: updatedMsg.text, lastTimestamp: updatedMsg.timestamp }
              : c
          )
        );
      },
      (deletedId) => {
        setMessages((prev) => prev.filter((m) => m.id !== deletedId));
      },
      user?.id
    );

    return () => {
      unsubscribe();
    };
  }, [activeChannelId, user?.id]);

  // Realtime Presence for current active channel
  useEffect(() => {
    if (!user?.id || !activeChannelId) {
      setOnlineCount(1);
      return;
    }

    const unsubscribe = chatService.subscribeToPresence(
      activeChannelId,
      { id: user.id, name: user.name },
      (count) => {
        setOnlineCount(count > 0 ? count : 1);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user?.id, user?.name, activeChannelId]);

  const addToast = (title: string, type: ToastAlert['type'] = 'success') => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, title, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const retryProfileSync = async () => {
    if (isClerkSignedIn && clerkUser) {
      await syncAndLoadClerkUser(clerkUser, true);
    } else {
      await loadLegacySupabaseUser(undefined, true);
    }
  };

  const signOut = async () => {
    try {
      if (clerk && typeof clerk.signOut === 'function') {
        await clerk.signOut();
      }
      if (!isClerkAuthMode) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      lastLoadedUserIdRef.current = null;
      setUser(null);
      setUserError(null);
      setTeams([]);
      setTasks([]);
      setDailyLogs([]);
      setChannels([]);
      setMessages([]);
      setFiles([]);
      setFilesError(null);
      setNotifications([]);
      setNotificationsError(null);
      setMeetings([]);
      setMeetingsError(null);
      setActiveVideoMeeting(null);
      setActiveChannelIdState('');
      localStorage.removeItem('worknest_current_view');
      localStorage.removeItem('worknest_active_channel_id');
      localStorage.removeItem('worknest_active_team_id');
      sessionStorage.removeItem('worknest_ai_messages');
      sessionStorage.removeItem('worknest_ai_input_draft');
      setCurrentViewState('landing');
      addToast('Signed out successfully', 'info');
    }
  };

  const updateUserProfile = async (name: string, email: string, department: string): Promise<boolean> => {
    if (!user?.id) {
      addToast('Session expired or unauthenticated. Please sign in again.', 'error');
      await signOut();
      return false;
    }

    try {
      // 1. If Clerk is active, sync first name and last name
      if (clerkUser) {
        try {
          const parts = name.trim().split(' ');
          const firstName = parts[0] || '';
          const lastName = parts.slice(1).join(' ') || '';
          await clerkUser.update({
            firstName,
            lastName,
          });
        } catch (clerkErr) {
          console.warn('Notice: Clerk profile attributes could not be updated:', clerkErr);
        }
      } else if (!isClerkAuthMode) {
        // Legacy Supabase email update
        const { data: authData } = await supabase.auth.getUser();
        const authUser = authData?.user;
        if (authUser && email && email.trim().toLowerCase() !== authUser.email?.toLowerCase()) {
          const { error: emailUpdateErr } = await supabase.auth.updateUser({ email: email.trim() });
          if (emailUpdateErr) {
            addToast(`Email change notice: ${emailUpdateErr.message}`, 'warning');
          } else {
            addToast('Confirmation link sent to verify your new email address.', 'info');
          }
        }
      }

      // 2. Update canonical profile in public.profiles table
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({
          full_name: name.trim(),
          department: department.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileErr) {
        console.error('Error updating profile in Supabase:', profileErr);
        addToast(`Failed to update profile: ${profileErr.message}`, 'error');
        return false;
      }

      // 3. Update React local state
      setUser((prev) => (prev ? { ...prev, name: name.trim(), email: email.trim() || prev.email, department: department.trim() } : null));
      addToast('Profile information updated successfully', 'success');
      return true;
    } catch (err: unknown) {
      console.error('Error updating profile:', err);
      const msg = err instanceof Error ? err.message : 'Unknown error';
      addToast(`Error updating profile: ${msg}`, 'error');
      return false;
    }
  };

  const addTask = async (newTask: Omit<Task, 'id'>): Promise<boolean> => {
    if (!user) {
      addToast('Must be logged in to create a task.', 'error');
      return false;
    }
    try {
      const created = await taskService.createTask(
        {
          title: newTask.title,
          description: newTask.description,
          priority: newTask.priority,
          status: newTask.status,
          progress: newTask.progress,
          dueDate: newTask.dueDate,
          category: newTask.category,
          teamId: newTask.teamId,
          subgroupId: newTask.subgroupId,
          assignedToId: newTask.assignedToId,
        },
        user.id
      );
      setTasks((prev) => [created, ...prev.filter((t) => t.id !== created.id)]);
      addToast('Task created successfully', 'success');
      return true;
    } catch (err: unknown) {
      console.error('Error creating task:', err);
      const msg = err instanceof Error ? err.message : 'Failed to create task.';
      addToast(`Error creating task: ${msg}`, 'error');
      return false;
    }
  };

  const updateTaskStatus = async (id: string, status: Task['status'], progress?: number): Promise<boolean> => {
    if (!user) return false;
    try {
      const updated = await taskService.updateTaskStatus(id, status, progress);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      addToast('Task status updated', 'info');
      return true;
    } catch (err: unknown) {
      console.error('Error updating task status:', err);
      const msg = err instanceof Error ? err.message : 'Failed to update task status.';
      addToast(`Error updating task: ${msg}`, 'error');
      return false;
    }
  };

  const editTask = async (id: string, updated: Partial<Task>): Promise<boolean> => {
    if (!user) return false;
    try {
      const updatedTask = await taskService.editTask(id, updated);
      setTasks((prev) => prev.map((t) => (t.id === id ? updatedTask : t)));
      addToast('Task updated successfully', 'success');
      return true;
    } catch (err: unknown) {
      console.error('Error editing task:', err);
      const msg = err instanceof Error ? err.message : 'Failed to edit task.';
      addToast(`Error editing task: ${msg}`, 'error');
      return false;
    }
  };

  const deleteTask = async (id: string): Promise<boolean> => {
    if (!user) return false;
    try {
      await taskService.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      addToast('Task removed', 'warning');
      return true;
    } catch (err: unknown) {
      console.error('Error deleting task:', err);
      const msg = err instanceof Error ? err.message : 'Failed to delete task.';
      addToast(`Error deleting task: ${msg}`, 'error');
      return false;
    }
  };

  const addTeam = async (newTeam: { name: string; description: string; deadline: string }): Promise<boolean> => {
    if (!user || !isValidUuid(user.id)) {
      addToast('Must be signed in with a valid workspace profile to create a team.', 'error');
      return false;
    }
    try {
      const { data, error } = await supabase
        .from('teams')
        .insert({
          name: newTeam.name.trim(),
          description: newTeam.description.trim(),
          deadline: newTeam.deadline || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating team in Supabase:', error);
        addToast(`Failed to create team: ${error.message}`, 'error');
        return false;
      }

      addToast(`Team "${newTeam.name}" created successfully!`, 'success');
      // DB trigger on_team_created automatically added creator as group_leader in team_members
      await fetchTeams(user.id);
      if (data?.id) {
        setActiveTeamId(data.id);
        await chatService.ensureDefaultChannel(data.id);
      }
      return true;
    } catch (err: unknown) {
      console.error('Unexpected error adding team:', err);
      const msg = err instanceof Error ? err.message : 'Failed to create team.';
      addToast(msg, 'error');
      return false;
    }
  };

  const addSubgroup = async (teamId: string, subgroup: { name: string; description: string }): Promise<boolean> => {
    if (!user) return false;
    try {
      const { error } = await supabase
        .from('subgroups')
        .insert({
          team_id: teamId,
          name: subgroup.name.trim(),
          description: subgroup.description.trim(),
        });

      if (error) {
        console.error('Error creating subgroup:', error);
        addToast(`Failed to create subgroup: ${error.message}`, 'error');
        return false;
      }

      addToast(`Subgroup "${subgroup.name}" created successfully!`, 'success');
      await fetchTeams(user.id);
      return true;
    } catch (err: unknown) {
      console.error('Error adding subgroup:', err);
      const msg = err instanceof Error ? err.message : 'Failed to create subgroup.';
      addToast(msg, 'error');
      return false;
    }
  };

  const addTeamMember = async (
    teamId: string,
    member: { email: string; role: UserRole; subgroupId?: string }
  ): Promise<boolean> => {
    if (!user) {
      addToast('You must be signed in to invite team members.', 'error');
      return false;
    }

    const trimmedEmail = member.email?.trim().toLowerCase();
    if (!trimmedEmail) {
      addToast('Please provide a valid email address.', 'error');
      return false;
    }

    if (!teamId) {
      addToast('A valid team must be selected to invite a member.', 'error');
      return false;
    }

    try {
      const dbRole = member.role === 'personal_user' ? 'member' : member.role;

      // 1. Atomically resolve user, verify group leader auth, and insert team_members
      const { data, error } = await supabase.rpc('invite_team_member', {
        p_team_id: teamId,
        p_email: trimmedEmail,
        p_role: dbRole,
        p_subgroup_id: member.subgroupId || null,
      });

      if (error) {
        console.error('Error invoking invite_team_member RPC:', error);
        const errMsg = error.message || '';

        if (errMsg.includes('not registered')) {
          addToast(`User with email "${member.email}" is not registered on WorkNest. They must sign up first.`, 'error');
        } else if (errMsg.includes('already a member')) {
          addToast('User is already a member of this team.', 'warning');
        } else if (errMsg.includes('Subgroups can only have 1 leader')) {
          addToast('This subgroup already has a Sub-Group Leader. Subgroups can only have 1 leader.', 'error');
        } else if (errMsg.includes('Access denied')) {
          addToast('Access denied: only Group Leaders can add members to this team.', 'error');
        } else if (errMsg.includes('Sub-Group Leaders must be assigned to a specific subgroup')) {
          addToast('Sub-Group Leaders must be assigned to a specific subgroup.', 'error');
        } else if (errMsg.includes('does not belong to this team')) {
          addToast('The selected subgroup does not belong to this team.', 'error');
        } else if (errMsg.includes('Not authenticated')) {
          addToast('You must be signed in to invite team members.', 'error');
        } else {
          addToast(errMsg || 'Failed to add team member.', 'error');
        }
        return false;
      }

      const memberName = data?.full_name || trimmedEmail;
      addToast(`${memberName} added to team!`, 'success');
      await fetchTeams(user.id);
      return true;
    } catch (err: unknown) {
      console.error('Error adding team member:', err);
      const msg = err instanceof Error ? err.message : 'Failed to add member.';
      addToast(msg, 'error');
      return false;
    }
  };

  const updateTeamMember = async (
    teamId: string,
    memberId: string,
    updates: { role?: UserRole; subgroupId?: string | null }
  ): Promise<boolean> => {
    if (!user) return false;
    try {
      const targetTeam = teams.find((t) => t.id === teamId);
      const targetMember = targetTeam?.members.find((m) => m.id === memberId || m.memberId === memberId || m.userId === memberId);
      const leadersCount = targetTeam?.members.filter((m) => m.role === 'group_leader').length || 0;

      if (targetMember?.role === 'group_leader' && updates.role && updates.role !== 'group_leader' && leadersCount <= 1) {
        addToast('Cannot demote the sole Group Leader. Promote another member first.', 'error');
        return false;
      }

      const payload: any = {};
      if (updates.role) payload.role = updates.role === 'personal_user' ? 'member' : updates.role;
      if (updates.subgroupId !== undefined) payload.subgroup_id = updates.subgroupId;

      const rowId = targetMember?.memberId;
      const targetUserId = targetMember?.userId;

      let updateQuery = supabase.from('team_members').update(payload).eq('team_id', teamId);
      if (rowId && targetUserId) {
        updateQuery = updateQuery.or(`id.eq.${rowId},user_id.eq.${targetUserId}`);
      } else if (rowId) {
        updateQuery = updateQuery.eq('id', rowId);
      } else {
        updateQuery = updateQuery.or(`id.eq.${memberId},user_id.eq.${memberId}`);
      }

      const { data, error } = await updateQuery.select('id');

      if (error) {
        console.error('Error updating member:', error);
        if (error.message?.includes('unq_one_subgroup_leader_per_subgroup')) {
          addToast(`This subgroup already has a Sub-Group Leader. Subgroups can only have 1 leader.`, 'error');
        } else {
          addToast(`Failed to update member: ${error.message}`, 'error');
        }
        return false;
      }

      if (!data || data.length === 0) {
        addToast('Failed to update member: Record not found or permission denied.', 'error');
        return false;
      }

      addToast('Member role/subgroup updated successfully!', 'success');
      await fetchTeams(user.id);
      return true;
    } catch (err: unknown) {
      console.error('Error updating member:', err);
      const msg = err instanceof Error ? err.message : 'Failed to update member.';
      addToast(msg, 'error');
      return false;
    }
  };

  const removeTeamMember = async (teamId: string, memberId: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const targetTeam = teams.find((t) => t.id === teamId);
      const targetMember = targetTeam?.members.find((m) => m.id === memberId || m.memberId === memberId || m.userId === memberId);
      const leadersCount = targetTeam?.members.filter((m) => m.role === 'group_leader').length || 0;

      if (targetMember?.role === 'group_leader' && leadersCount <= 1) {
        addToast('Cannot remove the sole Group Leader of the team.', 'error');
        return false;
      }

      const rowId = targetMember?.memberId;
      const targetUserId = targetMember?.userId;

      let deleteQuery = supabase.from('team_members').delete().eq('team_id', teamId);
      if (rowId && targetUserId) {
        deleteQuery = deleteQuery.or(`id.eq.${rowId},user_id.eq.${targetUserId}`);
      } else if (rowId) {
        deleteQuery = deleteQuery.eq('id', rowId);
      } else {
        deleteQuery = deleteQuery.or(`id.eq.${memberId},user_id.eq.${memberId}`);
      }

      const { data, error } = await deleteQuery.select('id');

      if (error) {
        console.error('Error removing member:', error);
        addToast(`Failed to remove member: ${error.message}`, 'error');
        return false;
      }

      if (!data || data.length === 0) {
        addToast('Failed to remove member: Record not found or permission denied.', 'error');
        return false;
      }

      addToast('Member removed from team', 'info');
      await fetchTeams(user.id);
      return true;
    } catch (err: unknown) {
      console.error('Error removing member:', err);
      const msg = err instanceof Error ? err.message : 'Failed to remove member.';
      addToast(msg, 'error');
      return false;
    }
  };

  const addDailyLog = async (
    log: Omit<DailyLog, 'id' | 'userId' | 'userName' | 'userAvatar' | 'status'>
  ): Promise<boolean> => {
    if (!user) {
      addToast('Must be logged in to submit a daily log.', 'error');
      return false;
    }
    try {
      const created = await dailyLogService.createOrUpdateDailyLog(
        {
          hoursWorked: log.hoursWorked,
          workCompleted: log.workCompleted,
          challengesFaced: log.challengesFaced,
          planForTomorrow: log.planForTomorrow,
          date: log.date,
          teamId: log.teamId || (activeTeamId || undefined),
          subgroupId: log.subgroupId,
        },
        user.id
      );
      setDailyLogs((prev) => [created, ...prev.filter((l) => l.id !== created.id)]);
      addToast('Daily work log submitted successfully', 'success');
      return true;
    } catch (err: unknown) {
      console.error('Error submitting daily log:', err);
      const msg = err instanceof Error ? err.message : 'Failed to submit daily log.';
      addToast(`Error submitting log: ${msg}`, 'error');
      return false;
    }
  };

  const deleteDailyLog = async (id: string): Promise<boolean> => {
    if (!user) {
      addToast('Must be logged in to delete a daily log.', 'error');
      return false;
    }
    try {
      await dailyLogService.deleteDailyLog(id, user.id);
      setDailyLogs((prev) => prev.filter((l) => l.id !== id));
      addToast('Daily log removed', 'warning');
      return true;
    } catch (err: unknown) {
      console.error('Error deleting daily log:', err);
      const msg = err instanceof Error ? err.message : 'Failed to delete daily log.';
      addToast(`Error deleting log: ${msg}`, 'error');
      return false;
    }
  };

  const sendMessage = async (
    channelId: string,
    text: string,
    attachments?: ChatMessage['attachments']
  ): Promise<boolean> => {
    if (!user) {
      addToast('Must be logged in to send a message.', 'error');
      return false;
    }
    if (!text.trim() && (!attachments || attachments.length === 0)) {
      return false;
    }
    try {
      const sent = await chatService.sendMessage(
        { channelId, text, attachments },
        user.id
      );

      setMessages((prev) => {
        if (prev.some((m) => m.id === sent.id)) return prev;
        return [...prev, sent];
      });

      setChannels((prev) =>
        prev.map((c) =>
          c.id === channelId
            ? { ...c, lastMessage: sent.text, lastTimestamp: sent.timestamp }
            : c
        )
      );

      return true;
    } catch (err: unknown) {
      console.error('Error sending message:', err);
      let rollbackDetail = '';
      // Compensating cleanup: if sending message failed, delete any uploaded storage assets
      if (attachments && attachments.length > 0) {
        for (const att of attachments) {
          if (att.path) {
            try {
              const cleaned = await chatService.deleteAttachment(att.path);
              if (!cleaned) {
                rollbackDetail = ' (Compensating storage cleanup could not delete the uploaded file)';
              }
            } catch (cleanupErr) {
              console.warn('Storage rollback cleanup error for attachment:', cleanupErr);
              rollbackDetail = ` (Compensating storage cleanup error: ${cleanupErr instanceof Error ? cleanupErr.message : String(cleanupErr)})`;
            }
          }
        }
      }
      const msg = err instanceof Error ? err.message : 'Failed to send message.';
      addToast(`${msg}${rollbackDetail}`, 'error');
      return false;
    }
  };

  const downloadChatAttachment = async (
    att: { name: string; url?: string; path?: string }
  ): Promise<void> => {
    try {
      await chatService.downloadAttachment(att);
    } catch (err: unknown) {
      console.error('Error downloading chat attachment:', err);
      const msg = err instanceof Error ? err.message : 'Failed to download attachment.';
      addToast(msg, 'error');
    }
  };

  const editMessage = async (messageId: string, newText: string): Promise<boolean> => {
    if (!user) {
      addToast('Must be logged in to edit message.', 'error');
      return false;
    }
    const trimmed = newText.trim();
    if (!trimmed) {
      addToast('Message text cannot be empty.', 'warning');
      return false;
    }

    try {
      const updated = await chatService.editMessage(messageId, trimmed, user.id);
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? updated : m))
      );
      setChannels((prev) =>
        prev.map((c) =>
          c.id === updated.channelId
            ? { ...c, lastMessage: updated.text, lastTimestamp: updated.timestamp }
            : c
        )
      );
      addToast('Message updated', 'info');
      return true;
    } catch (err: unknown) {
      console.error('Error editing message:', err);
      const msg = err instanceof Error ? err.message : 'Failed to edit message.';
      addToast(msg, 'error');
      return false;
    }
  };

  const toggleReaction = async (messageId: string, emoji: string): Promise<boolean> => {
    if (!user) {
      addToast('Must be logged in to react.', 'error');
      return false;
    }

    try {
      const updatedReactions = await chatService.toggleReaction(messageId, emoji, user.id);
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, reactions: updatedReactions } : m))
      );
      return true;
    } catch (err: unknown) {
      console.error('Error updating reaction:', err);
      const msg = err instanceof Error ? err.message : 'Failed to update reaction.';
      addToast(msg, 'error');
      return false;
    }
  };

  const uploadChatAttachment = async (
    file: File
  ): Promise<{ name: string; size: string; type: string; url?: string; path?: string } | null> => {
    if (!user) {
      addToast('Must be logged in to upload attachments.', 'error');
      return null;
    }
    const targetChannelId = activeChannelId || (channels[0] ? channels[0].id : '');
    if (!targetChannelId) {
      addToast('No active channel selected for attachment upload.', 'error');
      return null;
    }

    try {
      const res = await chatService.uploadAttachment(file, targetChannelId);
      return res;
    } catch (err: unknown) {
      console.error('Error uploading chat attachment:', err);
      const msg = err instanceof Error ? err.message : 'Failed to upload file.';
      addToast(`Upload failed: ${msg}`, 'error');
      return null;
    }
  };

  const deleteMessage = async (messageId: string): Promise<boolean> => {
    if (!user) return false;
    try {
      await chatService.deleteMessage(messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      addToast('Message deleted', 'info');
      return true;
    } catch (err: unknown) {
      console.error('Error deleting message:', err);
      const msg = err instanceof Error ? err.message : 'Failed to delete message.';
      addToast(msg, 'error');
      return false;
    }
  };

  const createChannel = async (params: {
    name: string;
    description?: string;
    isSubgroup?: boolean;
    subgroupId?: string;
  }): Promise<boolean> => {
    if (!user) return false;
    const targetTeamId = activeTeamId || (teams[0] ? teams[0].id : '');
    if (!targetTeamId) {
      addToast('Must select a team before creating a channel.', 'error');
      return false;
    }

    try {
      const created = await chatService.createChannel({
        teamId: targetTeamId,
        name: params.name,
        description: params.description,
        isSubgroup: params.isSubgroup,
        subgroupId: params.subgroupId,
      });

      setChannels((prev) => [...prev, created]);
      setActiveChannelId(created.id);
      addToast(`Channel #${created.name} created!`, 'success');
      return true;
    } catch (err: unknown) {
      console.error('Error creating channel:', err);
      const msg = err instanceof Error ? err.message : 'Failed to create channel.';
      addToast(msg, 'error');
      return false;
    }
  };

  const uploadFile = async (
    file: File,
    options?: { teamId?: string; customName?: string; category?: FileCategory }
  ): Promise<ProjectFile | null> => {
    if (!user) {
      addToast('Must be logged in to upload files.', 'error');
      return null;
    }

    try {
      const created = await fileService.uploadFile({
        file,
        customName: options?.customName,
        teamId: options?.teamId,
        category: options?.category,
        userId: user.id,
      });

      setFiles((prev) => [created, ...prev]);
      addToast(`"${created.name}" uploaded successfully!`, 'success');
      return created;
    } catch (err: unknown) {
      console.error('Error uploading file:', err);
      const msg = err instanceof Error ? err.message : 'Failed to upload file.';
      addToast(msg, 'error');
      throw err;
    }
  };

  const addFile = (file: Omit<ProjectFile, 'id' | 'uploadedBy' | 'uploaderAvatar' | 'date'>) => {
    const created: ProjectFile = {
      ...file,
      id: `file-${Date.now()}`,
      uploadedBy: user?.name || 'User',
      uploaderAvatar: user?.avatar || '',
      date: new Date().toISOString().split('T')[0],
    };
    setFiles((prev) => [created, ...prev]);
    addToast('File record created', 'success');
  };

  const deleteFile = async (id: string): Promise<boolean> => {
    const targetFile = files.find((f) => f.id === id);
    try {
      if (id.startsWith('file-')) {
        // Mock / local file
        setFiles((prev) => prev.filter((f) => f.id !== id));
        addToast('File removed', 'warning');
        return true;
      }

      await fileService.deleteFile(id, targetFile?.storagePath);
      setFiles((prev) => prev.filter((f) => f.id !== id));
      addToast('File deleted successfully', 'success');
      return true;
    } catch (err: unknown) {
      console.error('Error deleting file:', err);
      const msg = err instanceof Error ? err.message : 'Failed to delete file.';
      addToast(msg, 'error');
      return false;
    }
  };

  const downloadFile = async (file: ProjectFile): Promise<void> => {
    try {
      addToast(`Preparing download for "${file.name}"...`, 'info');
      await fileService.downloadFile(file);
    } catch (err: unknown) {
      console.error('Error downloading file:', err);
      const msg = err instanceof Error ? err.message : 'Failed to download file.';
      addToast(msg, 'error');
    }
  };

  const getFilePreviewUrl = async (file: ProjectFile): Promise<string | null> => {
    if (file.url && file.url.startsWith('http')) return file.url;
    if (file.storagePath) {
      return await fileService.getSignedUrl(file.storagePath, 3600);
    }
    return null;
  };

  const createMeeting = async (params: CreateMeetingParams): Promise<Meeting | null> => {
    if (!user) {
      const msg = 'You must be signed in to schedule a persistent meeting.';
      addToast(msg, 'error');
      throw new Error(msg);
    }

    try {
      const created = await meetingService.createMeeting(params, user.id, {
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      });
      setMeetings((prev) => {
        const filtered = prev.filter((m) => m.id !== created.id);
        const next = [created, ...filtered];
        return next.sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
      });
      addToast(`Meeting "${created.title}" scheduled successfully`, 'success');
      return created;
    } catch (err: unknown) {
      console.error('[AppContext] Failed to create meeting:', err);
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err && 'message' in err
          ? String((err as any).message)
          : 'Failed to schedule meeting.';
      addToast(msg, 'error');
      throw err;
    }
  };

  const cancelMeeting = async (meetingId: string): Promise<boolean> => {
    if (!user) {
      addToast('You must be signed in to cancel a meeting.', 'error');
      return false;
    }

    try {
      if (meetingId.startsWith('mtg-')) {
        // Local / mock meeting
        setMeetings((prev) => prev.filter((m) => m.id !== meetingId));
        if (activeVideoMeeting?.id === meetingId) {
          setActiveVideoMeeting(null);
        }
        addToast('Meeting cancelled', 'info');
        return true;
      }

      await meetingService.cancelMeeting(meetingId);
      setMeetings((prev) => prev.filter((m) => m.id !== meetingId));
      if (activeVideoMeeting?.id === meetingId) {
        setActiveVideoMeeting(null);
      }
      addToast('Meeting cancelled successfully', 'info');
      return true;
    } catch (err: unknown) {
      console.error('[AppContext] Failed to cancel meeting:', err);
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err && 'message' in err
          ? String((err as any).message)
          : 'Failed to cancel meeting.';
      addToast(msg, 'error');
      return false;
    }
  };

  const addMeeting = (newMeeting: Omit<Meeting, 'id'>) => {
    if (user) {
      createMeeting({
        title: newMeeting.title,
        description: newMeeting.description,
        meetingDate: newMeeting.date,
        meetingTime: newMeeting.time,
        durationMinutes: parseInt(newMeeting.duration) || 30,
        type: newMeeting.type,
      }).catch((err) => {
        console.error('[AppContext] addMeeting error:', err);
      });
      return;
    }
    const created: Meeting = {
      ...newMeeting,
      id: `mtg-${Date.now()}`,
      roomName: `WorkNest-local-${Date.now()}`,
    };
    setMeetings((prev) => [created, ...prev]);
    addToast('Meeting scheduled successfully', 'success');
  };

  const sendAIMessageInternal = async (
    text: string,
    options?: { skipAppendingUser?: boolean }
  ): Promise<boolean> => {
    const cleanText = text.trim();
    if (!cleanText) return false;
    if (isSendingAIMessageRef.current || isAITyping) return false;

    isSendingAIMessageRef.current = true;
    setIsAITyping(true);
    setAiStage('context');
    setAiError(null);

    const controller = new AbortController();
    aiAbortControllerRef.current = controller;

    if (!options?.skipAppendingUser) {
      const userMsg: AIMessage = {
        id: `aimsg-${Date.now()}`,
        sender: 'user',
        text: cleanText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setAiMessages((prev) => [...prev, userMsg]);
    }

    // Filter out previous error messages before passing to AI service
    const historySnapshot = aiMessages.filter((m) => !m.isError);

    try {
      // Transition from context to gemini inference
      setAiStage('gemini');

      const response = await aiService.sendMessage(cleanText, historySnapshot, {
        signal: controller.signal,
      });

      // Transition to action validation if actions returned
      if (response.proposedActions && response.proposedActions.length > 0) {
        setAiStage('actions');
      }

      // Validate any proposed actions against active workspace data
      let validatedActions: AIAction[] | undefined = undefined;
      if (response.proposedActions && response.proposedActions.length > 0) {
        validatedActions = response.proposedActions.map((act) => {
          const res = actionValidationService.validate(act, {
            tasks,
            teams,
            dailyLogs,
            meetings,
            currentUser: user,
            activeTeamId,
          });
          return res.validatedAction;
        });
      }

      const aiReply: AIMessage = {
        id: `aimsg-${Date.now() + 1}`,
        sender: 'ai',
        text: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        insights: response.insights,
        model: response.model,
        actions: validatedActions,
      };

      setAiMessages((prev) => [...prev, aiReply]);
      return true;
    } catch (err: unknown) {
      const isAborted =
        (err instanceof Error &&
          (err.name === 'AbortError' ||
            err.message.toLowerCase().includes('cancelled') ||
            err.message.toLowerCase().includes('aborted'))) ||
        controller.signal.aborted;

      if (isAborted) {
        const cancelReply: AIMessage = {
          id: `aimsg-${Date.now() + 1}`,
          sender: 'ai',
          text: 'Request was cancelled.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setAiMessages((prev) => [...prev, cancelReply]);
        return false;
      }

      const errorMessage =
        err instanceof Error ? err.message : 'Failed to communicate with WorkNest AI.';
      setAiError(errorMessage);

      const errorReply: AIMessage = {
        id: `aimsg-${Date.now() + 1}`,
        sender: 'ai',
        text: `Error: ${errorMessage}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };

      setAiMessages((prev) => [...prev, errorReply]);
      addToast(errorMessage, 'error');
      return false;
    } finally {
      setIsAITyping(false);
      setAiStage('idle');
      isSendingAIMessageRef.current = false;
      aiAbortControllerRef.current = null;
    }
  };

  const sendAIMessage = (text: string): Promise<boolean> =>
    sendAIMessageInternal(text, { skipAppendingUser: false });

  const cancelAIMessage = () => {
    if (aiAbortControllerRef.current) {
      aiAbortControllerRef.current.abort();
      aiAbortControllerRef.current = null;
    }
    setIsAITyping(false);
    setAiStage('idle');
    isSendingAIMessageRef.current = false;
  };

  const executeAIAction = async (
    actionId: string,
    overrides?: Record<string, any>
  ): Promise<boolean> => {
    let targetAction: AIAction | null = null;

    for (const msg of aiMessages) {
      const found = msg.actions?.find((a) => a.id === actionId);
      if (found) {
        targetAction = found;
        break;
      }
    }

    if (!targetAction) {
      addToast('Proposed action not found or expired.', 'error');
      return false;
    }

    // Prevent duplicate clicks or execution of already completed actions
    if (targetAction.status === 'executing' || targetAction.status === 'succeeded') {
      return false;
    }

    if (!user) {
      addToast('Authentication required to execute actions.', 'error');
      return false;
    }

    const mergedParams = { ...targetAction.params, ...(overrides || {}) };

    // Update status to executing
    setAiMessages((prev) =>
      prev.map((msg) => ({
        ...msg,
        actions: msg.actions?.map((a) =>
          a.id === actionId ? { ...a, status: 'executing' as const, params: mergedParams } : a
        ),
      }))
    );

    let executionSuccess = false;
    let errorMessage = '';

    try {
      switch (targetAction.type) {
        case 'create_task': {
          executionSuccess = await addTask({
            title: mergedParams.title,
            description: mergedParams.description || '',
            priority: mergedParams.priority || 'medium',
            status: mergedParams.status || 'todo',
            dueDate: mergedParams.dueDate || new Date().toISOString().split('T')[0],
            category: mergedParams.category || 'General',
            progress: 0,
            assignedTo: mergedParams.assignedToName,
            assignedToId: mergedParams.assignedToId,
            teamId: mergedParams.teamId || activeTeamId || undefined,
            subgroupId: mergedParams.subgroupId,
          });
          break;
        }

        case 'update_task': {
          const updates: Partial<Task> = {};
          if (mergedParams.title) updates.title = mergedParams.title;
          if (mergedParams.description !== undefined) updates.description = mergedParams.description;
          if (mergedParams.priority) updates.priority = mergedParams.priority;
          if (mergedParams.status) updates.status = mergedParams.status;
          if (typeof mergedParams.progress === 'number') updates.progress = mergedParams.progress;
          if (mergedParams.dueDate) updates.dueDate = mergedParams.dueDate;
          if (mergedParams.category) updates.category = mergedParams.category;

          executionSuccess = await editTask(mergedParams.taskId, updates);
          break;
        }

        case 'assign_task': {
          executionSuccess = await editTask(mergedParams.taskId, {
            assignedToId: mergedParams.assigneeId,
            assignedTo: mergedParams.assigneeName,
          });
          break;
        }

        case 'delete_task': {
          executionSuccess = await deleteTask(mergedParams.taskId);
          break;
        }

        case 'create_daily_log': {
          executionSuccess = await addDailyLog({
            date: mergedParams.date || new Date().toISOString().split('T')[0],
            hoursWorked: Number(mergedParams.hoursWorked) || 8,
            workCompleted: mergedParams.workCompleted || '',
            challengesFaced: mergedParams.challengesFaced || '',
            planForTomorrow: mergedParams.planForTomorrow || '',
            subgroup: '',
            teamId: activeTeamId || undefined,
          });
          break;
        }

        case 'create_meeting': {
          const res = await createMeeting({
            title: mergedParams.title,
            description: mergedParams.description || '',
            meetingDate: mergedParams.meetingDate,
            meetingTime: mergedParams.meetingTime,
            durationMinutes: Number(mergedParams.durationMinutes) || 30,
            type: mergedParams.type || 'Video Conference',
            teamId: mergedParams.teamId || activeTeamId || undefined,
          });
          executionSuccess = !!res;
          break;
        }

        case 'cancel_meeting': {
          executionSuccess = await cancelMeeting(mergedParams.meetingId);
          break;
        }

        case 'invite_team_member': {
          executionSuccess = await addTeamMember(mergedParams.teamId, {
            email: mergedParams.email,
            role: mergedParams.role || 'member',
          });
          break;
        }

        case 'update_team_member_role': {
          executionSuccess = await updateTeamMember(mergedParams.teamId, mergedParams.memberId, {
            role: mergedParams.role,
          });
          break;
        }

        case 'remove_team_member': {
          executionSuccess = await removeTeamMember(mergedParams.teamId, mergedParams.memberId);
          break;
        }

        default:
          throw new Error(`Unsupported action type: ${(targetAction as any).type}`);
      }
    } catch (err: unknown) {
      executionSuccess = false;
      errorMessage = err instanceof Error ? err.message : 'Action execution failed.';
    }

    if (executionSuccess) {
      const nowFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Update action status to succeeded
      setAiMessages((prev) =>
        prev.map((msg) => ({
          ...msg,
          actions: msg.actions?.map((a) =>
            a.id === actionId
              ? {
                  ...a,
                  status: 'succeeded' as const,
                  executedAt: new Date().toISOString(),
                }
              : a
          ),
        }))
      );

      // Append follow-up conversational confirmation turn from WorkNest AI
      const confirmationTurn: AIMessage = {
        id: `aimsg-${Date.now() + 1}`,
        sender: 'ai',
        text: `Action executed successfully: **${targetAction.description}**. WorkNest data is updated.`,
        timestamp: nowFormatted,
      };

      setAiMessages((prev) => [...prev, confirmationTurn]);
      addToast('Action executed successfully', 'success');
      return true;
    } else {
      const failureReason = errorMessage || 'Operation returned failure status from database service.';

      // Update action status to failed
      setAiMessages((prev) =>
        prev.map((msg) => ({
          ...msg,
          actions: msg.actions?.map((a) =>
            a.id === actionId
              ? {
                  ...a,
                  status: 'failed' as const,
                  executionError: failureReason,
                }
              : a
          ),
        }))
      );

      addToast(`Action failed: ${failureReason}`, 'error');
      return false;
    }
  };

  const cancelAIAction = (actionId: string) => {
    setAiMessages((prev) =>
      prev.map((msg) => ({
        ...msg,
        actions: msg.actions?.map((a) =>
          a.id === actionId ? { ...a, status: 'cancelled' as const } : a
        ),
      }))
    );
    addToast('Action proposal cancelled', 'info');
  };

  const updateAIActionParams = (actionId: string, newParams: Record<string, any>) => {
    setAiMessages((prev) =>
      prev.map((msg) => ({
        ...msg,
        actions: msg.actions?.map((a) =>
          a.id === actionId ? { ...a, params: { ...a.params, ...newParams } } : a
        ),
      }))
    );
  };

  const clearAIMessages = () => {
    setAiMessages([]);
    setAiError(null);
    try {
      sessionStorage.removeItem('worknest_ai_messages');
    } catch {
      // Ignore sessionStorage removal errors
    }
    addToast('AI conversation cleared', 'info');
  };

  const retryLastAIMessage = async (): Promise<boolean> => {
    const lastUserMsg = [...aiMessages].reverse().find((m) => m.sender === 'user');
    if (!lastUserMsg) return false;

    // Remove the trailing error message if present
    setAiMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.isError) {
        return prev.slice(0, -1);
      }
      return prev;
    });

    return sendAIMessageInternal(lastUserMsg.text, { skipAppendingUser: true });
  };

  const markNotificationAsRead = async (id: string): Promise<boolean> => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    if (id.startsWith('notif-')) return true;
    try {
      await notificationService.markAsRead(id);
      return true;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return false;
    }
  };

  const markAllNotificationsAsRead = async (): Promise<boolean> => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    addToast('All notifications marked as read', 'info');
    try {
      await notificationService.markAllAsRead();
      return true;
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      return false;
    }
  };

  const deleteNotification = async (id: string): Promise<boolean> => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (id.startsWith('notif-')) return true;
    try {
      await notificationService.deleteNotification(id);
      return true;
    } catch (err) {
      console.error('Error deleting notification:', err);
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        currentRole: currentUserRole,
        setCurrentRole,
        isDarkMode,
        setIsDarkMode,
        activeTeamId,
        setActiveTeamId,
        user,
        isLoadingUser,
        userError,
        retryProfileSync,
        signOut,
        updateUserProfile,
        tasks,
        isLoadingTasks,
        tasksError,
        addTask,
        updateTaskStatus,
        editTask,
        deleteTask,
        refreshTasks,
        teams,
        isLoadingTeams,
        teamsError,
        currentUserRole,
        addTeam,
        addSubgroup,
        addTeamMember,
        updateTeamMember,
        removeTeamMember,
        refreshTeams,
        dailyLogs,
        isLoadingDailyLogs,
        dailyLogsError,
        addDailyLog,
        deleteDailyLog,
        refreshDailyLogs,
        channels,
        isLoadingChannels,
        channelsError,
        activeChannelId,
        setActiveChannelId,
        messages,
        isLoadingMessages,
        messagesError,
        sendMessage,
        editMessage,
        deleteMessage,
        toggleReaction,
        uploadChatAttachment,
        downloadChatAttachment,
        createChannel,
        refreshChannels,
        refreshMessages,
        onlineCount,
        files,
        isLoadingFiles,
        filesError,
        refreshFiles,
        uploadFile,
        addFile,
        deleteFile,
        downloadFile,
        getFilePreviewUrl,
        meetings,
        isLoadingMeetings,
        meetingsError,
        refreshMeetings,
        createMeeting,
        cancelMeeting,
        addMeeting,
        activeVideoMeeting,
        setActiveVideoMeeting,
        aiMessages,
        isAITyping,
        aiStage,
        aiError,
        sendAIMessage,
        cancelAIMessage,
        clearAIMessages,
        retryLastAIMessage,
        executeAIAction,
        cancelAIAction,
        updateAIActionParams,
        notifications,
        isLoadingNotifications,
        notificationsError,
        unreadNotificationsCount,
        refreshNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        isSearchOpen,
        setIsSearchOpen,
        isCreateModalOpen,
        setIsCreateModalOpen,
        createModalType,
        setCreateModalType,
        toasts,
        addToast,
        removeToast,
        isMobileSidebarOpen,
        setIsMobileSidebarOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
