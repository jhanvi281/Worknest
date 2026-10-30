export type UserRole = 'group_leader' | 'subgroup_leader' | 'member' | 'personal_user';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  department: string;
}

export type AppView =
  | 'landing'
  | 'signup'
  | 'login'
  | 'forgot_password'
  | 'dashboard'
  | 'my_tasks'
  | 'teams'
  | 'team_workspace'
  | 'daily_logs'
  | 'chat'
  | 'files'
  | 'meetings'
  | 'ai_assistant'
  | 'notifications'
  | 'settings'
  | 'profile';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  category: string;
  progress: number;
  assignedTo?: string; // User Name
  assignedUserAvatar?: string;
  assignedToId?: string;
  createdBy?: string;
  subgroup?: string;
  subgroupId?: string;
  teamId?: string;
  completedAt?: string;
}

export interface Subgroup {
  id: string;
  name: string;
  leaderId: string;
  leaderName: string;
  description: string;
  memberCount: number;
}

export interface TeamMember {
  id: string;
  memberId: string;
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  roleLabel: string;
  avatar: string;
  isOnline: boolean;
  subgroupId?: string;
  assignedSubgroup?: string;
  assignedTasksCount: number;
  progress: number;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  leaderName: string;
  leaderAvatar: string;
  createdBy?: string;
  memberCount: number;
  projectProgress: number;
  activeTasks: number;
  deadline: string;
  subgroups: Subgroup[];
  members: TeamMember[];
}

export interface DailyLog {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  subgroup: string;
  subgroupId?: string;
  teamId?: string;
  date: string;
  hoursWorked: number;
  workCompleted: string;
  challengesFaced: string;
  planForTomorrow: string;
  status: 'submitted' | 'pending';
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
  channelId: string;
  attachments?: { name: string; size: string; type: string; url?: string; path?: string }[];
  reactions?: { emoji: string; count: number; userReacted: boolean; users?: string[] }[];
  createdAt?: string;
  updatedAt?: string;
  isEdited?: boolean;
}

export interface ChatChannel {
  id: string;
  name: string;
  isSubgroup: boolean;
  description: string;
  unreadCount: number;
  lastMessage?: string;
  lastTimestamp?: string;
  teamId?: string;
  subgroupId?: string;
  createdAt?: string;
}

export type FileCategory = 'all' | 'presentations' | 'documents' | 'images' | 'other';
export type FileType =
  | 'PPT'
  | 'PPTX'
  | 'PDF'
  | 'DOC'
  | 'DOCX'
  | 'XLS'
  | 'XLSX'
  | 'PNG'
  | 'JPG'
  | 'JPEG'
  | 'GIF'
  | 'WEBP'
  | 'SVG'
  | 'ZIP'
  | 'TXT'
  | 'CSV'
  | 'OTHER'
  | string;

export interface ProjectFile {
  id: string;
  name: string;
  type: FileType;
  category: FileCategory;
  uploadedBy: string;
  uploaderAvatar: string;
  date: string;
  size: string;
  url?: string;
  previewUrl?: string;
  storagePath?: string;
  teamId?: string;
  teamName?: string;
  uploadedById?: string;
  createdAt?: string;
}

export type MeetingType = 'Video Conference' | 'Subgroup Sync' | 'Project Standup' | 'Review';

export interface MeetingParticipant {
  id?: string;
  userId?: string;
  name: string;
  avatar: string;
  email?: string;
  status?: 'invited' | 'accepted' | 'declined' | 'tentative';
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  durationMinutes?: number;
  participants: MeetingParticipant[];
  organizer: string;
  organizerId?: string;
  organizerAvatar?: string;
  type: MeetingType;
  description: string;
  teamId?: string;
  teamName?: string;
  roomName?: string;
  isPast?: boolean;
  createdAt?: string;
}

export type AIStage = 'idle' | 'context' | 'gemini' | 'actions';

export type AIActionType =
  | 'create_task'
  | 'update_task'
  | 'assign_task'
  | 'delete_task'
  | 'create_daily_log'
  | 'create_meeting'
  | 'cancel_meeting'
  | 'invite_team_member'
  | 'update_team_member_role'
  | 'remove_team_member';

export type AIActionStatus =
  | 'proposed'
  | 'awaiting_confirmation'
  | 'executing'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

export interface CreateTaskActionParams {
  title: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string;
  category?: string;
  assignedToId?: string;
  assignedToName?: string;
  teamId?: string;
  subgroupId?: string;
}

export interface UpdateTaskActionParams {
  taskId: string;
  taskTitle?: string;
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  progress?: number;
  dueDate?: string;
  category?: string;
}

export interface AssignTaskActionParams {
  taskId: string;
  taskTitle?: string;
  assigneeId: string;
  assigneeName: string;
}

export interface DeleteTaskActionParams {
  taskId: string;
  taskTitle: string;
}

export interface CreateDailyLogActionParams {
  date?: string;
  hoursWorked: number;
  workCompleted: string;
  challengesFaced?: string;
  planForTomorrow?: string;
}

export interface CreateMeetingActionParams {
  title: string;
  description?: string;
  meetingDate: string;
  meetingTime: string;
  durationMinutes: number;
  type?: MeetingType;
  teamId?: string;
}

export interface CancelMeetingActionParams {
  meetingId: string;
  meetingTitle: string;
}

export interface InviteTeamMemberActionParams {
  teamId: string;
  teamName: string;
  email: string;
  role: UserRole;
}

export interface UpdateTeamMemberRoleActionParams {
  teamId: string;
  teamName?: string;
  memberId: string;
  memberName: string;
  role: UserRole;
}

export interface RemoveTeamMemberActionParams {
  teamId: string;
  teamName: string;
  memberId: string;
  memberName: string;
}

export type AIActionParams = Record<string, any>;

export interface AIAction {
  id: string;
  type: AIActionType;
  description: string;
  params: Record<string, any>;
  requiresConfirmation: boolean;
  status: AIActionStatus;
  isDestructive?: boolean;
  entityId?: string;
  entityTitle?: string;
  entityType?: 'task' | 'meeting' | 'daily_log' | 'team_member' | 'team';
  validationError?: string;
  executionError?: string;
  executedAt?: string;
}

export interface AIMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  insights?: {
    title: string;
    description: string;
    type: 'success' | 'warning' | 'info' | 'urgent';
  }[];
  isError?: boolean;
  model?: string;
  actions?: AIAction[];
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  category: 'task' | 'chat' | 'file' | 'meeting' | 'ai' | 'system';
  linkView?: AppView;
}

export interface ToastAlert {
  id: string;
  title: string;
  type: 'success' | 'info' | 'warning' | 'error';
}
