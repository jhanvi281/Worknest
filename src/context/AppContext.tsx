import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { taskService } from '../services/taskService';
import { dailyLogService } from '../services/dailyLogService';
import { chatService } from '../services/chatService';
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
  Meeting,
  AIMessage,
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
  createChannel: (channel: { name: string; description?: string; isSubgroup?: boolean; subgroupId?: string }) => Promise<boolean>;
  refreshChannels: () => Promise<void>;
  refreshMessages: (channelId?: string) => Promise<void>;
  onlineCount: number;

  // Files
  files: ProjectFile[];
  addFile: (file: Omit<ProjectFile, 'id' | 'uploadedBy' | 'uploaderAvatar' | 'date'>) => void;
  deleteFile: (id: string) => void;

  // Meetings & Video Call
  meetings: Meeting[];
  addMeeting: (meeting: Omit<Meeting, 'id'>) => void;
  activeVideoMeeting: Meeting | null;
  setActiveVideoMeeting: (meeting: Meeting | null) => void;

  // AI Assistant
  aiMessages: AIMessage[];
  sendAIMessage: (text: string) => void;

  // Notifications
  notifications: NotificationItem[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;

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




const initialFiles: ProjectFile[] = [
  {
    id: 'file-1',
    name: 'WorkNest_Q4_Product_Architecture.pptx',
    type: 'PPTX',
    category: 'presentations',
    uploadedBy: 'Alex Morgan',
    uploaderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    date: '2026-08-12',
    size: '14.2 MB',
  },
  {
    id: 'file-2',
    name: 'API_Integration_Endpoints_v2.pdf',
    type: 'PDF',
    category: 'documents',
    uploadedBy: 'David Chen',
    uploaderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    date: '2026-08-11',
    size: '4.8 MB',
  },
  {
    id: 'file-3',
    name: 'UI_Component_Library_Specs.docx',
    type: 'DOCX',
    category: 'documents',
    uploadedBy: 'Sarah Jenkins',
    uploaderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    date: '2026-08-10',
    size: '2.1 MB',
  },
  {
    id: 'file-4',
    name: 'Q3_Performance_Analytics.xlsx',
    type: 'XLSX',
    category: 'other',
    uploadedBy: 'Marcus Vance',
    uploaderAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    date: '2026-08-08',
    size: '1.9 MB',
  },
  {
    id: 'file-5',
    name: 'WorkNest_Brand_Identity_Assets.png',
    type: 'PNG',
    category: 'images',
    uploadedBy: 'Sarah Jenkins',
    uploaderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    date: '2026-08-05',
    size: '8.4 MB',
  },
];

const initialMeetings: Meeting[] = [
  {
    id: 'mtg-1',
    title: 'Weekly Product & Engineering Sync',
    date: 'Today',
    time: '10:00 AM',
    duration: '45 mins',
    participants: [
      { name: 'Alex Morgan', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
      { name: 'David Chen', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
      { name: 'Sarah Jenkins', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
      { name: 'Michael Vance', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
    ],
    organizer: 'Alex Morgan',
    type: 'Video Conference',
    description: 'Review milestone progress, OAuth 2.0 release, and subgroup work allocation for upcoming launch.',
  },
  {
    id: 'mtg-2',
    title: 'Subgroup Design Review: Glassmorphism UI',
    date: 'Tomorrow',
    time: '02:00 PM',
    duration: '30 mins',
    participants: [
      { name: 'Sarah Jenkins', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
      { name: 'Alex Morgan', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
    ],
    organizer: 'Sarah Jenkins',
    type: 'Subgroup Sync',
    description: 'Walkthrough updated color tokens, dark mode UI states, and mobile accessibility.',
  },
  {
    id: 'mtg-3',
    title: 'WorkNest AI Engine Task Scheduling Deep Dive',
    date: 'Aug 18, 2026',
    time: '11:30 AM',
    duration: '60 mins',
    participants: [
      { name: 'Elena Rostova', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80' },
      { name: 'Marcus Vance', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' },
      { name: 'Alex Morgan', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
    ],
    organizer: 'Elena Rostova',
    type: 'Project Standup',
    description: 'Evaluate neural network predictive scoring on team task completion velocity.',
  },
];

const initialAIMessages: AIMessage[] = [
  {
    id: 'aimsg-1',
    sender: 'ai',
    text: 'Hello Alex! I am WorkNest AI, your intelligent project assistant. I have analyzed your workspace and team activity for today.',
    timestamp: '09:00 AM',
    insights: [
      {
        title: 'Project Health Rating: 94%',
        description: 'Core SaaS Engineering team velocity is strong. 78% of milestone deliverables are completed ahead of schedule.',
        type: 'success',
      },
      {
        title: 'Deadline Attention Required',
        description: 'Task "Implement OAuth 2.0 & Role-Based Access Control" is marked Urgent and due in 5 days.',
        type: 'warning',
      },
    ],
  },
];

const initialNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'New Task Assigned',
    message: 'David Chen assigned you to "Optimize Audio Waveform Streaming for Meetings".',
    timestamp: '10 min ago',
    isRead: false,
    category: 'task',
    linkView: 'my_tasks',
  },
  {
    id: 'notif-2',
    title: 'Daily Work Log Reminder',
    message: 'Today\'s work log submission is now open for your Development subgroup.',
    timestamp: '1 hour ago',
    isRead: false,
    category: 'system',
    linkView: 'daily_logs',
  },
  {
    id: 'notif-3',
    title: 'WorkNest AI Alert',
    message: 'WorkNest AI detected 2 high-priority tasks approaching deadline next week.',
    timestamp: '3 hours ago',
    isRead: true,
    category: 'ai',
    linkView: 'ai_assistant',
  },
  {
    id: 'notif-4',
    title: 'File Uploaded',
    message: 'Alex Morgan uploaded "WorkNest_Q4_Product_Architecture.pptx".',
    timestamp: 'Yesterday',
    isRead: true,
    category: 'file',
    linkView: 'files',
  },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

const PUBLIC_VIEWS: AppView[] = ['landing', 'login', 'signup', 'forgot_password'];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentViewState] = useState<AppView>(() => {
    const saved = localStorage.getItem('worknest_current_view');
    if (saved && !PUBLIC_VIEWS.includes(saved as AppView)) {
      return saved as AppView;
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
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [activeTeamId, setActiveTeamIdState] = useState<string>(() => {
    return localStorage.getItem('worknest_active_team_id') || '';
  });

  const setActiveTeamId = (id: string) => {
    setActiveTeamIdState(id);
    localStorage.setItem('worknest_active_team_id', id);
  };

  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(true);
  const [userError, setUserError] = useState<string | null>(null);

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
  const [files, setFiles] = useState<ProjectFile[]>(initialFiles);
  const [meetings, setMeetings] = useState<Meeting[]>(initialMeetings);
  const [activeVideoMeeting, setActiveVideoMeeting] = useState<Meeting | null>(null);
  const [aiMessages, setAiMessages] = useState<AIMessage[]>(initialAIMessages);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalType, setCreateModalType] = useState<'task' | 'team' | 'meeting' | 'file' | null>(null);
  const [toasts, setToasts] = useState<ToastAlert[]>([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Fetch real tasks from Supabase
  const fetchTasks = async (userId: string) => {
    setIsLoadingTasks(true);
    setTasksError(null);
    try {
      const fetchedTasks = await taskService.fetchUserTasks(userId);
      setTasks(fetchedTasks);
    } catch (err: unknown) {
      console.error('Error loading tasks from Supabase:', err);
      const msg = err instanceof Error ? err.message : 'Failed to load tasks.';
      setTasksError(msg);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  // Fetch real daily logs from Supabase
  const fetchDailyLogs = async (userId: string) => {
    setIsLoadingDailyLogs(true);
    setDailyLogsError(null);
    try {
      const fetchedLogs = await dailyLogService.fetchUserDailyLogs(userId);
      setDailyLogs(fetchedLogs);
    } catch (err: unknown) {
      console.error('Error loading daily logs from Supabase:', err);
      const msg = err instanceof Error ? err.message : 'Failed to load daily logs.';
      setDailyLogsError(msg);
    } finally {
      setIsLoadingDailyLogs(false);
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
  const fetchTeams = async (userId: string) => {
    setIsLoadingTeams(true);
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
        setIsLoadingTeams(false);
        return;
      }

      if (!memberRows || memberRows.length === 0) {
        setTeams([]);
        setIsLoadingTeams(false);
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
            const avatar = profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff`;
            
            const assignedSg = rawSubgroups.find((sg: any) => sg.id === m.subgroup_id);
            const roleLabels: Record<UserRole, string> = {
              group_leader: 'Group Leader',
              subgroup_leader: 'Sub-Group Leader',
              member: 'Member',
              personal_user: 'Personal User',
            };

            return {
              id: m.user_id,
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
      setIsLoadingTeams(false);
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

  // Load the currently authenticated Supabase user & profile
  const loadAuthenticatedUser = async (explicitAuthUser?: any) => {
    setIsLoadingUser(true);
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
        setUser(null);
        setTeams([]);
        setIsLoadingUser(false);
        setIsLoadingTeams(false);
        return;
      }

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
          `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=6366f1&color=fff`;

        setUser({
          id: authUser.id,
          name: fallbackName,
          email: authUser.email || '',
          avatar: fallbackAvatar,
          role: currentRole,
          department: 'General',
        });

        // Trigger teams, tasks, and daily logs load
        fetchTeams(authUser.id);
        fetchTasks(authUser.id);
        fetchDailyLogs(authUser.id);

        setCurrentViewState((prev) => {
          if (PUBLIC_VIEWS.includes(prev)) {
            const savedView = localStorage.getItem('worknest_current_view') as AppView | null;
            return (savedView && !PUBLIC_VIEWS.includes(savedView)) ? savedView : 'dashboard';
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
        `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff`;
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

      // Trigger loading real teams, tasks, and daily logs from Supabase
      fetchTeams(authUser.id);
      fetchTasks(authUser.id);
      fetchDailyLogs(authUser.id);

      // On successful auth restoration, transition away from landing/login pages to dashboard or saved view
      setCurrentViewState((prev) => {
        if (PUBLIC_VIEWS.includes(prev)) {
          const savedView = localStorage.getItem('worknest_current_view') as AppView | null;
          return (savedView && !PUBLIC_VIEWS.includes(savedView)) ? savedView : 'dashboard';
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

  useEffect(() => {
    let isMounted = true;

    loadAuthenticatedUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        if (session?.user) {
          loadAuthenticatedUser(session.user);
        } else if (event === 'INITIAL_SESSION' && !session) {
          setUser(null);
          setTeams([]);
          setTasks([]);
          setDailyLogs([]);
          setChannels([]);
          setMessages([]);
          setActiveChannelIdState('');
          setIsLoadingUser(false);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setTeams([]);
        setTasks([]);
        setDailyLogs([]);
        setChannels([]);
        setMessages([]);
        setActiveChannelIdState('');
        setIsLoadingUser(false);
        localStorage.removeItem('worknest_current_view');
        localStorage.removeItem('worknest_active_channel_id');
        setCurrentViewState('landing');
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Sync theme class to <html> element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
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

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      setUser(null);
      setTeams([]);
      setTasks([]);
      setDailyLogs([]);
      setChannels([]);
      setMessages([]);
      setActiveChannelIdState('');
      localStorage.removeItem('worknest_current_view');
      localStorage.removeItem('worknest_active_channel_id');
      setCurrentViewState('landing');
      addToast('Signed out successfully', 'info');
    }
  };

  const updateUserProfile = async (name: string, email: string, department: string): Promise<boolean> => {
    if (!user) {
      addToast('No active user logged in.', 'error');
      return false;
    }

    try {
      // 1. Upsert public.profiles in Supabase for currently authenticated user's ID
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: name,
          email: email,
          department: department,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error updating profile in Supabase:', error);
        addToast(`Failed to update profile: ${error.message}`, 'error');
        return false;
      }

      // 2. Update React local state after database update succeeds
      setUser((prev) => (prev ? { ...prev, name, email, department } : null));
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
    if (!user) {
      addToast('Must be logged in to create a team.', 'error');
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
    if (!user) return false;
    try {
      // 1. Look up profile by email in public.profiles
      const { data: foundProfile, error: profileErr } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('email', member.email.trim().toLowerCase())
        .maybeSingle();

      if (profileErr) {
        console.error('Error querying profile:', profileErr);
        addToast(`Error searching for profile: ${profileErr.message}`, 'error');
        return false;
      }

      if (!foundProfile) {
        addToast(`User with email "${member.email}" is not registered on WorkNest. They must sign up first.`, 'error');
        return false;
      }

      // 2. Insert team_members row
      const { error: insertErr } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: foundProfile.id,
          role: member.role === 'personal_user' ? 'member' : member.role,
          subgroup_id: member.subgroupId || null,
        });

      if (insertErr) {
        console.error('Error adding team member:', insertErr);
        if (insertErr.code === '23505') {
          addToast(`User is already a member of this team.`, 'warning');
        } else if (insertErr.message?.includes('unq_one_subgroup_leader_per_subgroup')) {
          addToast(`This subgroup already has a Sub-Group Leader. Subgroups can only have 1 leader.`, 'error');
        } else {
          addToast(`Failed to add team member: ${insertErr.message}`, 'error');
        }
        return false;
      }

      addToast(`${foundProfile.full_name || foundProfile.email} added to team!`, 'success');
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
      const payload: any = {};
      if (updates.role) payload.role = updates.role === 'personal_user' ? 'member' : updates.role;
      if (updates.subgroupId !== undefined) payload.subgroup_id = updates.subgroupId;

      const { error } = await supabase
        .from('team_members')
        .update(payload)
        .eq('id', memberId)
        .eq('team_id', teamId);

      if (error) {
        console.error('Error updating member:', error);
        if (error.message?.includes('unq_one_subgroup_leader_per_subgroup')) {
          addToast(`This subgroup already has a Sub-Group Leader. Subgroups can only have 1 leader.`, 'error');
        } else {
          addToast(`Failed to update member: ${error.message}`, 'error');
        }
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
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId)
        .eq('team_id', teamId);

      if (error) {
        console.error('Error removing member:', error);
        addToast(`Failed to remove member: ${error.message}`, 'error');
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
      const msg = err instanceof Error ? err.message : 'Failed to send message.';
      addToast(msg, 'error');
      return false;
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

  const addFile = (file: Omit<ProjectFile, 'id' | 'uploadedBy' | 'uploaderAvatar' | 'date'>) => {
    const created: ProjectFile = {
      ...file,
      id: `file-${Date.now()}`,
      uploadedBy: user?.name || 'User',
      uploaderAvatar: user?.avatar || '',
      date: new Date().toISOString().split('T')[0],
    };
    setFiles((prev) => [created, ...prev]);
    addToast('File uploaded successfully', 'success');
  };

  const deleteFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    addToast('File removed', 'warning');
  };

  const addMeeting = (newMeeting: Omit<Meeting, 'id'>) => {
    const created: Meeting = {
      ...newMeeting,
      id: `mtg-${Date.now()}`,
    };
    setMeetings((prev) => [created, ...prev]);
    addToast('Meeting scheduled successfully', 'success');
  };

  const sendAIMessage = (text: string) => {
    const userMsg: AIMessage = {
      id: `aimsg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setAiMessages((prev) => [...prev, userMsg]);

    // Simulate intelligent AI response based on query
    setTimeout(() => {
      let aiText = `I have processed your request regarding "${text}". Here is an intelligent breakdown based on your WorkNest team data:`;
      let insights: AIMessage['insights'] = [];

      if (text.toLowerCase().includes('break') || text.toLowerCase().includes('smaller steps')) {
        aiText = `Here is a step-by-step execution plan for your team:`;
        insights = [
          { title: 'Step 1: Architecture & API Schema', description: 'Define endpoints and data models for team review.', type: 'info' },
          { title: 'Step 2: Subgroup Implementation', description: 'Assign David Chen (Backend) and Sarah Jenkins (UI tokens).', type: 'info' },
          { title: 'Step 3: QA & Load Testing', description: 'Run automated Cypress suite with Michael Vance.', type: 'success' },
        ];
      } else if (text.toLowerCase().includes('summarize') || text.toLowerCase().includes('progress')) {
        aiText = `Your team has logged 22.5 total hours today. Key achievements include JWT OAuth refresh token completion and dark mode design system tokens.`;
        insights = [
          { title: 'Project Progress: 78%', description: 'Development subgroup leads velocity with 3 tasks completed this week.', type: 'success' },
        ];
      } else if (text.toLowerCase().includes('risk') || text.toLowerCase().includes('attention')) {
        aiText = `WorkNest AI detected 2 high-priority tasks approaching their target deadlines:`;
        insights = [
          { title: 'WebRTC Audio Waveforms', description: 'Assigned to Alex Morgan. Target date: Aug 20, 2026.', type: 'warning' },
          { title: 'OAuth 2.0 RBAC Microservices', description: 'Urgent priority. Target date: Aug 18, 2026.', type: 'urgent' },
        ];
      } else {
        aiText = `Your project is progressing well, but two high-priority tasks are approaching their deadlines. Consider reviewing the API integration milestone and redistributing one QA task.`;
        insights = [
          { title: 'Optimization Suggestion', description: 'Reassign 1 QA task to David Chen to balance workload.', type: 'info' },
        ];
      }

      const aiReply: AIMessage = {
        id: `aimsg-${Date.now() + 1}`,
        sender: 'ai',
        text: aiText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        insights,
      };

      setAiMessages((prev) => [...prev, aiReply]);
    }, 800);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    addToast('All notifications marked as read', 'info');
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
        createChannel,
        refreshChannels,
        refreshMessages,
        onlineCount,
        files,
        addFile,
        deleteFile,
        meetings,
        addMeeting,
        activeVideoMeeting,
        setActiveVideoMeeting,
        aiMessages,
        sendAIMessage,
        notifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
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
