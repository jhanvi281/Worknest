import type {
  AIAction,
  Task,
  Team,
  DailyLog,
  Meeting,
  UserProfile,
  TaskPriority,
  TaskStatus,
  UserRole,
  MeetingType,
} from '../types';

export interface ValidationContext {
  tasks: Task[];
  teams: Team[];
  dailyLogs: DailyLog[];
  meetings: Meeting[];
  currentUser: UserProfile | null;
  activeTeamId?: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  validatedAction: AIAction;
}

const VALID_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];
const VALID_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'review', 'completed'];
const VALID_ROLES: UserRole[] = ['group_leader', 'subgroup_leader', 'member'];
const VALID_MEETING_TYPES: MeetingType[] = [
  'Video Conference',
  'Subgroup Sync',
  'Project Standup',
  'Review',
];

export const actionValidationService = {
  /**
   * Validates a proposed action against the authenticated user's current live workspace state.
   * Resolves entity references, enforces parameter bounds, detects destructive operations,
   * and prevents hallucinations or stale IDs.
   */
  validate(action: AIAction, context: ValidationContext): ValidationResult {
    const validated: AIAction = {
      ...action,
      params: { ...action.params },
      status: 'awaiting_confirmation',
    };

    switch (action.type) {
      case 'create_task': {
        const title = String(validated.params.title || '').trim();
        if (!title) {
          return {
            isValid: false,
            error: 'Task title is required.',
            validatedAction: { ...validated, status: 'failed', validationError: 'Missing task title' },
          };
        }

        // Validate or fallback priority
        if (!VALID_PRIORITIES.includes(validated.params.priority)) {
          validated.params.priority = 'medium';
        }

        // Validate or fallback status
        if (!VALID_STATUSES.includes(validated.params.status)) {
          validated.params.status = 'todo';
        }

        // Validate or resolve due date
        if (validated.params.dueDate) {
          const parsed = new Date(validated.params.dueDate);
          if (isNaN(parsed.getTime())) {
            validated.params.dueDate = undefined;
          } else {
            validated.params.dueDate = parsed.toISOString().split('T')[0];
          }
        }

        // Validate team association if provided
        if (validated.params.teamId) {
          const team = context.teams.find((t) => t.id === validated.params.teamId);
          if (!team) {
            // Unset invalid teamId rather than hard failing
            validated.params.teamId = undefined;
          }
        }

        // Resolve or validate assignee if provided
        if (validated.params.assignedToName && !validated.params.assignedToId) {
          const targetName = String(validated.params.assignedToName).toLowerCase();
          const allMembers = context.teams.flatMap((t) => t.members || []);
          const match = allMembers.find(
            (m) => m.name.toLowerCase().includes(targetName) || m.email.toLowerCase().includes(targetName)
          );
          if (match) {
            validated.params.assignedToId = match.userId;
            validated.params.assignedToName = match.name;
          }
        }

        validated.entityTitle = title;
        validated.entityType = 'task';
        break;
      }

      case 'update_task': {
        const taskId = validated.params.taskId;
        const taskTitle = validated.params.taskTitle;

        // Resolve task by ID or title
        let task = context.tasks.find((t) => t.id === taskId);
        if (!task && taskTitle) {
          task = context.tasks.find(
            (t) => t.title.toLowerCase().trim() === String(taskTitle).toLowerCase().trim()
          );
        }

        if (!task) {
          return {
            isValid: false,
            error: `Target task "${taskTitle || taskId}" could not be found in active workspace.`,
            validatedAction: {
              ...validated,
              status: 'failed',
              validationError: 'Task not found in active workspace',
            },
          };
        }

        validated.params.taskId = task.id;
        validated.params.taskTitle = task.title;
        validated.entityId = task.id;
        validated.entityTitle = task.title;
        validated.entityType = 'task';

        // Validate priority if supplied
        if (validated.params.priority && !VALID_PRIORITIES.includes(validated.params.priority)) {
          delete validated.params.priority;
        }

        // Validate status if supplied
        if (validated.params.status && !VALID_STATUSES.includes(validated.params.status)) {
          delete validated.params.status;
        }

        // Validate progress
        if (typeof validated.params.progress === 'number') {
          validated.params.progress = Math.max(0, Math.min(100, Math.round(validated.params.progress)));
        }
        break;
      }

      case 'assign_task': {
        const taskId = validated.params.taskId;
        const taskTitle = validated.params.taskTitle;

        let task = context.tasks.find((t) => t.id === taskId);
        if (!task && taskTitle) {
          task = context.tasks.find(
            (t) => t.title.toLowerCase().trim() === String(taskTitle).toLowerCase().trim()
          );
        }

        if (!task) {
          return {
            isValid: false,
            error: `Task "${taskTitle || taskId}" could not be found.`,
            validatedAction: { ...validated, status: 'failed', validationError: 'Task not found' },
          };
        }

        validated.params.taskId = task.id;
        validated.params.taskTitle = task.title;

        // Resolve assignee
        const allMembers = context.teams.flatMap((t) => t.members || []);
        let member = allMembers.find(
          (m) =>
            m.userId === validated.params.assigneeId ||
            (validated.params.assigneeName &&
              (m.name.toLowerCase().includes(validated.params.assigneeName.toLowerCase()) ||
                m.email.toLowerCase().includes(validated.params.assigneeName.toLowerCase())))
        );

        if (!member) {
          return {
            isValid: false,
            error: `Assignee "${validated.params.assigneeName || validated.params.assigneeId}" not found in your teams.`,
            validatedAction: { ...validated, status: 'failed', validationError: 'Assignee not found in active teams' },
          };
        }

        validated.params.assigneeId = member.userId;
        validated.params.assigneeName = member.name;
        validated.entityId = task.id;
        validated.entityTitle = `${task.title} ➔ ${member.name}`;
        validated.entityType = 'task';
        break;
      }

      case 'delete_task': {
        const taskId = validated.params.taskId;
        const taskTitle = validated.params.taskTitle;

        let task = context.tasks.find((t) => t.id === taskId);
        if (!task && taskTitle) {
          task = context.tasks.find(
            (t) => t.title.toLowerCase().trim() === String(taskTitle).toLowerCase().trim()
          );
        }

        if (!task) {
          return {
            isValid: false,
            error: `Task "${taskTitle || taskId}" could not be found for deletion.`,
            validatedAction: { ...validated, status: 'failed', validationError: 'Task not found' },
          };
        }

        validated.params.taskId = task.id;
        validated.params.taskTitle = task.title;
        validated.isDestructive = true;
        validated.entityId = task.id;
        validated.entityTitle = task.title;
        validated.entityType = 'task';
        break;
      }

      case 'create_daily_log': {
        const workCompleted = String(validated.params.workCompleted || '').trim();
        if (!workCompleted) {
          return {
            isValid: false,
            error: 'Daily log requires work completed summary.',
            validatedAction: { ...validated, status: 'failed', validationError: 'Missing work completed details' },
          };
        }

        let hours = Number(validated.params.hoursWorked);
        if (isNaN(hours) || hours <= 0 || hours > 24) {
          hours = 8;
        }
        validated.params.hoursWorked = hours;

        if (!validated.params.date) {
          validated.params.date = new Date().toISOString().split('T')[0];
        }

        validated.entityTitle = `Daily Log (${validated.params.date})`;
        validated.entityType = 'daily_log';
        break;
      }

      case 'create_meeting': {
        const title = String(validated.params.title || '').trim();
        if (!title) {
          return {
            isValid: false,
            error: 'Meeting title is required.',
            validatedAction: { ...validated, status: 'failed', validationError: 'Missing meeting title' },
          };
        }

        let meetingDate = String(validated.params.meetingDate || '').trim();
        if (!meetingDate || isNaN(new Date(meetingDate).getTime())) {
          meetingDate = new Date().toISOString().split('T')[0];
        }
        validated.params.meetingDate = meetingDate;

        let meetingTime = String(validated.params.meetingTime || '').trim();
        if (!meetingTime) {
          meetingTime = '10:00 AM';
        }
        validated.params.meetingTime = meetingTime;

        let duration = Number(validated.params.durationMinutes);
        if (isNaN(duration) || duration <= 0) {
          duration = 30;
        }
        validated.params.durationMinutes = duration;

        if (!VALID_MEETING_TYPES.includes(validated.params.type)) {
          validated.params.type = 'Video Conference';
        }

        validated.entityTitle = `${title} (${meetingDate} at ${meetingTime})`;
        validated.entityType = 'meeting';
        break;
      }

      case 'cancel_meeting': {
        const meetingId = validated.params.meetingId;
        const meetingTitle = validated.params.meetingTitle;

        let meeting = context.meetings.find((m) => m.id === meetingId);
        if (!meeting && meetingTitle) {
          meeting = context.meetings.find(
            (m) => m.title.toLowerCase().trim() === String(meetingTitle).toLowerCase().trim()
          );
        }

        if (!meeting) {
          return {
            isValid: false,
            error: `Meeting "${meetingTitle || meetingId}" could not be found.`,
            validatedAction: { ...validated, status: 'failed', validationError: 'Meeting not found' },
          };
        }

        validated.params.meetingId = meeting.id;
        validated.params.meetingTitle = meeting.title;
        validated.isDestructive = true;
        validated.entityId = meeting.id;
        validated.entityTitle = meeting.title;
        validated.entityType = 'meeting';
        break;
      }

      case 'invite_team_member': {
        const teamId = validated.params.teamId;
        const team = context.teams.find((t) => t.id === teamId) || context.teams[0];
        if (!team) {
          return {
            isValid: false,
            error: 'Team workspace not found.',
            validatedAction: { ...validated, status: 'failed', validationError: 'Team workspace not found' },
          };
        }

        const email = String(validated.params.email || '').trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
          return {
            isValid: false,
            error: 'Valid team member email address is required.',
            validatedAction: { ...validated, status: 'failed', validationError: 'Invalid email address' },
          };
        }

        let role: UserRole = validated.params.role;
        if (!VALID_ROLES.includes(role)) {
          role = 'member';
        }

        validated.params.teamId = team.id;
        validated.params.teamName = team.name;
        validated.params.email = email;
        validated.params.role = role;
        validated.entityTitle = `${email} (${team.name})`;
        validated.entityType = 'team_member';
        break;
      }

      case 'update_team_member_role': {
        const teamId = validated.params.teamId;
        const memberId = validated.params.memberId;

        const team = context.teams.find((t) => t.id === teamId);
        if (!team) {
          return {
            isValid: false,
            error: 'Team not found.',
            validatedAction: { ...validated, status: 'failed', validationError: 'Team not found' },
          };
        }

        const member = team.members?.find((m) => m.memberId === memberId || m.userId === memberId);
        if (!member) {
          return {
            isValid: false,
            error: 'Team member not found in specified workspace.',
            validatedAction: { ...validated, status: 'failed', validationError: 'Member not found in team' },
          };
        }

        let role: UserRole = validated.params.role;
        if (!VALID_ROLES.includes(role)) {
          role = 'member';
        }

        validated.params.teamId = team.id;
        validated.params.teamName = team.name;
        validated.params.memberId = member.memberId || member.id;
        validated.params.memberName = member.name;
        validated.params.role = role;
        validated.entityTitle = `${member.name} ➔ ${role.replace('_', ' ')}`;
        validated.entityType = 'team_member';
        break;
      }

      case 'remove_team_member': {
        const teamId = validated.params.teamId;
        const memberId = validated.params.memberId;

        const team = context.teams.find((t) => t.id === teamId);
        if (!team) {
          return {
            isValid: false,
            error: 'Team not found.',
            validatedAction: { ...validated, status: 'failed', validationError: 'Team not found' },
          };
        }

        const member = team.members?.find((m) => m.memberId === memberId || m.userId === memberId);
        if (!member) {
          return {
            isValid: false,
            error: 'Team member not found in specified workspace.',
            validatedAction: { ...validated, status: 'failed', validationError: 'Member not found in team' },
          };
        }

        validated.params.teamId = team.id;
        validated.params.teamName = team.name;
        validated.params.memberId = member.memberId || member.id;
        validated.params.memberName = member.name;
        validated.isDestructive = true;
        validated.entityTitle = `${member.name} from ${team.name}`;
        validated.entityType = 'team_member';
        break;
      }

      default:
        return {
          isValid: false,
          error: `Unsupported action type: ${(action as any).type}`,
          validatedAction: { ...validated, status: 'failed', validationError: 'Unsupported action type' },
        };
    }

    return {
      isValid: true,
      validatedAction: validated,
    };
  },
};

