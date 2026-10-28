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
export type FileType = 'PPT' | 'PPTX' | 'PDF' | 'DOC' | 'DOCX' | 'XLS' | 'XLSX' | 'PNG' | 'JPG' | 'ZIP';

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
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  participants: { name: string; avatar: string }[];
  organizer: string;
  type: 'Video Conference' | 'Subgroup Sync' | 'Project Standup' | 'Review';
  description: string;
  isPast?: boolean;
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
