import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import type { AIAction, AIActionType } from '../../types';
import {
  Bot,
  Send,
  BrainCircuit,
  TrendingUp,
  AlertTriangle,
  Users,
  CheckCircle2,
  Trash2,
  RotateCcw,
  Sparkles,
  Loader2,
  ShieldCheck,
  ListTodo,
  Edit3,
  UserCheck,
  Clock,
  Calendar,
  CalendarX,
  UserPlus,
  Shield,
  UserMinus,
  Square,
} from 'lucide-react';

const formatInlineMarkdown = (text: string): React.ReactNode => {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={i} className="font-semibold text-neutral-900 dark:text-neutral-100">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 mx-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-[#F97316] font-mono text-[11px]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
};

const FormattedAIMessage: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;

  const flushList = () => {
    if (!currentList) return;
    if (currentList.type === 'ul') {
      elements.push(
        <ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-1 my-1.5 pl-1">
          {currentList.items.map((item, idx) => (
            <li key={idx} className="text-neutral-800 dark:text-neutral-200 text-xs leading-relaxed">
              {formatInlineMarkdown(item)}
            </li>
          ))}
        </ul>
      );
    } else {
      elements.push(
        <ol key={`ol-${elements.length}`} className="list-decimal list-inside space-y-1 my-1.5 pl-1">
          {currentList.items.map((item, idx) => (
            <li key={idx} className="text-neutral-800 dark:text-neutral-200 text-xs leading-relaxed">
              {formatInlineMarkdown(item)}
            </li>
          ))}
        </ol>
      );
    }
    currentList = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      flushList();
      if (inCodeBlock) {
        elements.push(
          <pre
            key={`code-${elements.length}`}
            className="p-3 my-2 rounded-xl bg-neutral-900 text-neutral-100 font-mono text-[11px] overflow-x-auto border border-neutral-800"
          >
            <code>{codeBlockLines.join('\n')}</code>
          </pre>
        );
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    if (line.startsWith('### ')) {
      flushList();
      elements.push(
        <h4 key={`h3-${elements.length}`} className="font-bold text-xs text-neutral-900 dark:text-neutral-100 mt-3 mb-1">
          {formatInlineMarkdown(line.replace('### ', ''))}
        </h4>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      flushList();
      elements.push(
        <h3 key={`h2-${elements.length}`} className="font-bold text-sm text-neutral-900 dark:text-neutral-100 mt-3 mb-1">
          {formatInlineMarkdown(line.replace('## ', ''))}
        </h3>
      );
      continue;
    }
    if (line.startsWith('# ')) {
      flushList();
      elements.push(
        <h2 key={`h1-${elements.length}`} className="font-bold text-base text-neutral-900 dark:text-neutral-100 mt-3 mb-1">
          {formatInlineMarkdown(line.replace('# ', ''))}
        </h2>
      );
      continue;
    }

    const bulletMatch = line.match(/^(\s*)[-*+]\s+(.*)$/);
    if (bulletMatch) {
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(bulletMatch[2]);
      continue;
    }

    const numberMatch = line.match(/^(\s*)\d+\.\s+(.*)$/);
    if (numberMatch) {
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(numberMatch[2]);
      continue;
    }

    flushList();

    if (line.trim().length === 0) {
      elements.push(<div key={`sp-${elements.length}`} className="h-1.5" />);
    } else {
      elements.push(
        <p key={`p-${elements.length}`} className="my-1 text-neutral-800 dark:text-neutral-200 text-xs leading-relaxed">
          {formatInlineMarkdown(line)}
        </p>
      );
    }
  }

  flushList();

  if (inCodeBlock && codeBlockLines.length > 0) {
    elements.push(
      <pre
        key={`code-end-${elements.length}`}
        className="p-3 my-2 rounded-xl bg-neutral-900 text-neutral-100 font-mono text-[11px] overflow-x-auto border border-neutral-800"
      >
        <code>{codeBlockLines.join('\n')}</code>
      </pre>
    );
  }

  return <div className="space-y-1">{elements}</div>;
};

// ==============================================================================
// Subcomponent: ActionProposalCard
// Renders structured action proposals with parameter previews, destructive warnings,
// inline editing, and authorization-guarded confirmation buttons.
// ==============================================================================
interface ActionProposalCardProps {
  action: AIAction;
  onExecute: (actionId: string, overrides?: Record<string, any>) => Promise<boolean>;
  onCancel: (actionId: string) => void;
  onUpdateParams: (actionId: string, params: Record<string, any>) => void;
}

const ActionProposalCard: React.FC<ActionProposalCardProps> = ({
  action,
  onExecute,
  onCancel,
  onUpdateParams,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [params, setParams] = useState<Record<string, any>>({ ...action.params });

  useEffect(() => {
    setParams({ ...action.params });
  }, [action.params]);

  const getActionConfig = (type: AIActionType) => {
    switch (type) {
      case 'create_task':
        return { label: 'Task Creation', icon: ListTodo, color: 'text-[#F97316]' };
      case 'update_task':
        return { label: 'Task Update', icon: Edit3, color: 'text-amber-500' };
      case 'assign_task':
        return { label: 'Task Assignment', icon: UserCheck, color: 'text-sky-500' };
      case 'delete_task':
        return { label: 'Task Deletion', icon: Trash2, color: 'text-rose-500' };
      case 'create_daily_log':
        return { label: 'Daily Work Log', icon: Clock, color: 'text-emerald-500' };
      case 'create_meeting':
        return { label: 'Schedule Meeting', icon: Calendar, color: 'text-indigo-500' };
      case 'cancel_meeting':
        return { label: 'Cancel Meeting', icon: CalendarX, color: 'text-rose-500' };
      case 'invite_team_member':
        return { label: 'Team Invitation', icon: UserPlus, color: 'text-orange-500' };
      case 'update_team_member_role':
        return { label: 'Role Update', icon: Shield, color: 'text-violet-500' };
      case 'remove_team_member':
        return { label: 'Remove Member', icon: UserMinus, color: 'text-rose-500' };
      default:
        return { label: 'Action', icon: Bot, color: 'text-[#F97316]' };
    }
  };

  const config = getActionConfig(action.type);
  const Icon = config.icon;
  const isExecuting = action.status === 'executing';
  const isSucceeded = action.status === 'succeeded';
  const isFailed = action.status === 'failed';
  const isCancelled = action.status === 'cancelled';
  const isPending = action.status === 'proposed' || action.status === 'awaiting_confirmation';

  const handleConfirm = () => {
    onExecute(action.id, params);
  };

  const handleSaveEdit = () => {
    onUpdateParams(action.id, params);
    setIsEditing(false);
  };

  return (
    <div
      className={`mt-3 rounded-2xl border transition-all overflow-hidden ${
        action.isDestructive
          ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
          : isSucceeded
          ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
          : isFailed
          ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800'
          : isCancelled
          ? 'bg-neutral-100/60 dark:bg-[#1A1A1A] border-neutral-200 dark:border-[#333333] opacity-60'
          : 'bg-white dark:bg-[#181818] border-orange-200 dark:border-orange-900/50 shadow-sm'
      }`}
    >
      {/* Top Banner / Type Indicator */}
      <div className="px-4 py-2.5 border-b border-black/5 dark:border-white/5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 font-bold tracking-tight">
          <Icon className={`w-4 h-4 ${config.color}`} />
          <span className="text-[#171717] dark:text-[#FAFAFA]">{config.label}</span>
          {action.isDestructive && (
            <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-extrabold bg-rose-100 dark:bg-rose-900/80 text-rose-700 dark:text-rose-200">
              Destructive
            </span>
          )}
        </div>

        {/* Status Badge */}
        <div>
          {isExecuting && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#F97316]">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Executing...
            </span>
          )}
          {isSucceeded && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> Executed
            </span>
          )}
          {isFailed && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-3.5 h-3.5" /> Failed
            </span>
          )}
          {isCancelled && (
            <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500">
              Cancelled
            </span>
          )}
          {isPending && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 dark:bg-orange-950/80 text-[#F97316]">
              Awaiting Confirmation
            </span>
          )}
        </div>
      </div>

      {/* Main Content Body */}
      <div className="p-4 space-y-3 text-xs">
        {/* Description */}
        <p className="font-semibold text-neutral-900 dark:text-neutral-100">
          {action.description}
        </p>

        {/* Destructive Warning Callout */}
        {action.isDestructive && isPending && (
          <div className="p-2.5 rounded-xl bg-rose-100/80 dark:bg-rose-900/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-[11px] flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>
              <strong>Warning:</strong> This action will permanently modify or delete database records. Please verify details before confirming.
            </span>
          </div>
        )}

        {/* Failure / Validation Error Callout */}
        {(action.validationError || action.executionError) && (
          <div className="p-2.5 rounded-xl bg-rose-100/80 dark:bg-rose-900/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-[11px] flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{action.validationError || action.executionError}</span>
          </div>
        )}

        {/* Parameters Grid (Normal Mode) */}
        {!isEditing ? (
          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#121212] border border-neutral-200 dark:border-[#2C2C2C] space-y-1.5 text-[11px]">
            {Object.entries(params).map(([key, val]) => {
              if (val === undefined || val === null || val === '') return null;
              if (key === 'taskId' || key === 'memberId' || key === 'teamId') return null; // hide raw internal IDs
              const formattedKey = key
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, (str) => str.toUpperCase());
              return (
                <div key={key} className="flex items-start justify-between gap-4">
                  <span className="text-neutral-500 dark:text-neutral-400 capitalize">{formattedKey}:</span>
                  <span className="font-medium text-neutral-800 dark:text-neutral-200 text-right">
                    {String(val)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          /* Inline Edit Form */
          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#121212] border border-orange-300 dark:border-orange-800 space-y-2 text-xs">
            <div className="font-bold text-[11px] text-[#F97316] uppercase tracking-wider mb-1">
              Edit Proposed Parameters
            </div>

            {params.title !== undefined && (
              <div>
                <label className="block text-[10px] text-neutral-500 mb-0.5">Title</label>
                <input
                  type="text"
                  value={params.title || ''}
                  onChange={(e) => setParams({ ...params, title: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#1C1C1C] text-xs focus:ring-1 focus:ring-[#F97316]"
                />
              </div>
            )}

            {params.priority !== undefined && (
              <div>
                <label className="block text-[10px] text-neutral-500 mb-0.5">Priority</label>
                <select
                  value={params.priority || 'medium'}
                  onChange={(e) => setParams({ ...params, priority: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#1C1C1C] text-xs focus:ring-1 focus:ring-[#F97316]"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            )}

            {params.dueDate !== undefined && (
              <div>
                <label className="block text-[10px] text-neutral-500 mb-0.5">Due Date</label>
                <input
                  type="date"
                  value={params.dueDate || ''}
                  onChange={(e) => setParams({ ...params, dueDate: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#1C1C1C] text-xs focus:ring-1 focus:ring-[#F97316]"
                />
              </div>
            )}

            {params.hoursWorked !== undefined && (
              <div>
                <label className="block text-[10px] text-neutral-500 mb-0.5">Hours Worked</label>
                <input
                  type="number"
                  min="0.5"
                  max="24"
                  step="0.5"
                  value={params.hoursWorked || 8}
                  onChange={(e) => setParams({ ...params, hoursWorked: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#1C1C1C] text-xs focus:ring-1 focus:ring-[#F97316]"
                />
              </div>
            )}

            {params.workCompleted !== undefined && (
              <div>
                <label className="block text-[10px] text-neutral-500 mb-0.5">Work Completed</label>
                <textarea
                  rows={2}
                  value={params.workCompleted || ''}
                  onChange={(e) => setParams({ ...params, workCompleted: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#1C1C1C] text-xs focus:ring-1 focus:ring-[#F97316]"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-2.5 py-1 rounded-lg border border-neutral-300 dark:border-neutral-700 text-[11px] text-neutral-600 dark:text-neutral-400"
              >
                Cancel Edit
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-2.5 py-1 rounded-lg bg-[#F97316] text-white font-medium text-[11px]"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons (Pending State Only) */}
        {isPending && (
          <div className="pt-1 flex flex-wrap items-center gap-2">
            <button
              onClick={handleConfirm}
              disabled={isExecuting}
              className={`px-3.5 py-2 rounded-xl text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50 ${
                action.isDestructive
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-[#F97316] hover:bg-[#EA580C]'
              }`}
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Executing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{action.isDestructive ? 'Confirm & Delete' : 'Confirm & Execute'}</span>
                </>
              )}
            </button>

            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                disabled={isExecuting}
                className="px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-[#222222] text-xs text-neutral-700 dark:text-neutral-300 font-medium transition flex items-center gap-1 disabled:opacity-50"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Details</span>
              </button>
            )}

            <button
              onClick={() => onCancel(action.id)}
              disabled={isExecuting}
              className="px-3 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-[#222222] text-xs text-neutral-500 hover:text-rose-500 font-medium transition disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const AIAssistantView: React.FC = () => {
  const {
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
    user,
    tasks,
    teams,
  } = useApp();
  const [inputQuery, setInputQuery] = useState(() => {
    try {
      return sessionStorage.getItem('worknest_ai_input_draft') || '';
    } catch {
      return '';
    }
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (val: string) => {
    setInputQuery(val);
    try {
      if (val) {
        sessionStorage.setItem('worknest_ai_input_draft', val);
      } else {
        sessionStorage.removeItem('worknest_ai_input_draft');
      }
    } catch {
      // Ignore storage errors
    }
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const urgentTasks = tasks.filter((t) => (t.priority === 'urgent' || t.priority === 'high') && t.status !== 'completed').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;

  const suggestedPrompts = [
    'Create a high-priority task called Fix login bug due tomorrow',
    'Mark my recent authentication task as completed',
    'Schedule a sprint standup meeting for tomorrow at 10 AM',
    'Prepare my daily work log from today’s progress',
    'Assign the pending API integration task to Rahul',
    'Which tasks are at risk or need urgent attention?',
  ];

  // Auto-scroll to bottom of chat feed when new messages arrive or typing status changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, isAITyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || isAITyping) return;
    const query = inputQuery.trim();
    setInputQuery('');
    try {
      sessionStorage.removeItem('worknest_ai_input_draft');
    } catch {
      // Ignore storage errors
    }
    await sendAIMessage(query);
  };

  const handlePromptClick = (prompt: string) => {
    if (isAITyping) return;
    sendAIMessage(prompt);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#F97316] uppercase tracking-wider mb-1">
            <BrainCircuit className="w-4 h-4 text-[#F97316]" /> Intelligent Productivity Agent
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#171717] dark:text-[#FAFAFA] tracking-tight">
            WorkNest AI
          </h1>
          <p className="text-sm text-[#737373] dark:text-[#A3A3A3] mt-1">
            Control your tasks, teams, daily logs, and meetings with natural language.
          </p>
        </div>

        {/* AI Badges & Actions */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900 text-[11px] font-semibold text-[#F97316]">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Gemini 3.8 Flash Actions</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-[#1C1C1C] border border-[#E5E5E5] dark:border-[#333333] text-[11px] font-medium text-[#737373] dark:text-[#A3A3A3]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>RLS Authorized</span>
          </div>

          {aiMessages.length > 0 && (
            <button
              onClick={clearAIMessages}
              disabled={isAITyping}
              className="px-3 py-1.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] hover:bg-neutral-100 dark:hover:bg-[#1C1C1C] text-xs text-[#737373] dark:text-[#A3A3A3] hover:text-rose-500 dark:hover:text-rose-400 transition flex items-center gap-1.5 disabled:opacity-50"
              title="Clear conversation history"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Workspace Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#333333] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-[#737373] dark:text-[#A3A3A3] font-medium">Task Completion</span>
            <div className="text-xl font-extrabold text-emerald-600">{completionRate}% Done</div>
          </div>
          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#333333] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-[#737373] dark:text-[#A3A3A3] font-medium">Workspaces</span>
            <div className="text-xl font-extrabold text-[#F97316]">{teams.length} Teams</div>
          </div>
          <Users className="w-6 h-6 text-[#F97316]" />
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#333333] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-[#737373] dark:text-[#A3A3A3] font-medium">Urgent Priority</span>
            <div className={`text-xl font-extrabold ${urgentTasks > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {urgentTasks} {urgentTasks === 1 ? 'Task' : 'Tasks'}
            </div>
          </div>
          <AlertTriangle className={`w-6 h-6 ${urgentTasks > 0 ? 'text-rose-500' : 'text-emerald-500'}`} />
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#333333] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-[#737373] dark:text-[#A3A3A3] font-medium">In Flight</span>
            <div className="text-xl font-extrabold text-[#F97316]">{inProgressTasks} Active</div>
          </div>
          <TrendingUp className="w-6 h-6 text-[#F97316]" />
        </div>
      </div>

      {/* AI Chat Workspace Area */}
      <div className="bg-white dark:bg-[#141414] rounded-3xl border border-[#E5E5E5] dark:border-[#333333] shadow-sm flex flex-col h-[640px] overflow-hidden">
        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Empty State when no conversation history exists */}
          {aiMessages.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-center max-w-xl mx-auto space-y-5 py-8">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#EA580C] to-[#F97316] flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                  <Bot className="w-8 h-8" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#141414] flex items-center justify-center">
                  <Sparkles className="w-2.5 h-2.5 text-white" />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#171717] dark:text-[#FAFAFA]">
                  Welcome to WorkNest AI Agent{user?.name ? `, ${user.name}` : ''}!
                </h3>
                <p className="text-xs text-[#737373] dark:text-[#A3A3A3] mt-1.5 max-w-md leading-relaxed">
                  Give instructions in natural language. WorkNest AI will prepare actions, ask for your confirmation, and execute them safely through authorized WorkNest services.
                </p>
              </div>

              {/* Starter Suggested Prompts */}
              <div className="w-full pt-2 space-y-2">
                <span className="text-[11px] font-semibold text-[#737373] dark:text-[#A3A3A3] uppercase tracking-wider block">
                  Try Action Commands
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                  {suggestedPrompts.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handlePromptClick(p)}
                      disabled={isAITyping}
                      className="p-3 rounded-xl bg-neutral-50 dark:bg-[#1C1C1C] hover:bg-orange-50 dark:hover:bg-orange-950/20 border border-[#E5E5E5] dark:border-[#333333] hover:border-orange-300 dark:hover:border-orange-800 text-xs text-[#171717] dark:text-[#FAFAFA] font-medium transition text-left active:scale-[0.99] flex items-start gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#F97316] shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{p}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Conversation History */}
              {aiMessages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div key={msg.id} className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                    {isUser ? (
                      <img
                        src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=f97316&color=fff`}
                        alt={user?.name || 'User'}
                        className="w-8 h-8 rounded-full object-cover shrink-0 ring-2 ring-[#F97316]/20"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#EA580C] to-[#F97316] flex items-center justify-center text-white shrink-0 shadow-sm">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div className={`max-w-2xl space-y-1.5 ${isUser ? 'items-end text-right' : ''}`}>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-[#171717] dark:text-[#FAFAFA]">
                          {isUser ? (user?.name || 'You') : 'WorkNest AI'}
                        </span>
                        {!isUser && msg.model && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-950/60 text-[#F97316] font-mono">
                            {msg.model}
                          </span>
                        )}
                        <span className="text-[10px] text-[#737373] dark:text-[#A3A3A3]">{msg.timestamp}</span>
                      </div>

                      <div
                        className={`p-4 rounded-2xl text-xs leading-relaxed ${
                          isUser
                            ? 'bg-[#F97316] text-white shadow-sm rounded-tr-none'
                            : msg.isError
                            ? 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 rounded-tl-none'
                            : 'bg-[#FAFAFA] dark:bg-[#1C1C1C] border border-[#E5E5E5] dark:border-[#333333] text-[#171717] dark:text-[#FAFAFA] rounded-tl-none'
                        }`}
                      >
                        {isUser ? (
                          <div className="whitespace-pre-wrap">{msg.text}</div>
                        ) : msg.isError ? (
                          <div className="space-y-3">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                              <div className="text-xs leading-relaxed font-medium">{msg.text}</div>
                            </div>
                            <button
                              onClick={retryLastAIMessage}
                              disabled={isAITyping}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition active:scale-95 disabled:opacity-50"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Retry with Gemini</span>
                            </button>
                          </div>
                        ) : (
                          <FormattedAIMessage content={msg.text} />
                        )}

                        {/* Structured Action Proposals */}
                        {msg.actions && msg.actions.length > 0 && (
                          <div className="mt-3 space-y-3 text-left">
                            {msg.actions.map((act) => (
                              <ActionProposalCard
                                key={act.id}
                                action={act}
                                onExecute={executeAIAction}
                                onCancel={cancelAIAction}
                                onUpdateParams={updateAIActionParams}
                              />
                            ))}
                          </div>
                        )}

                        {/* Insights Cards attached to AI reply */}
                        {msg.insights && msg.insights.length > 0 && (
                          <div className="mt-3 space-y-2 text-left">
                            {msg.insights.map((ins, i) => (
                              <div
                                key={i}
                                className={`p-3 rounded-xl border text-xs ${
                                  ins.type === 'success'
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                                    : ins.type === 'warning' || ins.type === 'urgent'
                                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                                    : 'bg-orange-50 dark:bg-orange-950/40 border-orange-300 dark:border-orange-800 text-orange-800 dark:text-orange-200'
                                }`}
                              >
                                <span className="font-bold block mb-0.5">{ins.title}</span>
                                <p className="opacity-90">{ins.description}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing / Generating Indicator */}
              {isAITyping && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#EA580C] to-[#F97316] flex items-center justify-center text-white shrink-0 shadow-sm animate-pulse">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="space-y-1.5 flex-1 max-w-2xl">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-[#171717] dark:text-[#FAFAFA]">WorkNest AI</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-950/60 text-[#F97316] font-medium">
                        {aiStage === 'context'
                          ? '1/3 Gathering Context'
                          : aiStage === 'gemini'
                          ? '2/3 Gemini 3.8 Flash'
                          : aiStage === 'actions'
                          ? '3/3 Validating Actions'
                          : 'Processing'}
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl rounded-tl-none bg-[#FAFAFA] dark:bg-[#1C1C1C] border border-[#E5E5E5] dark:border-[#333333] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-4 h-4 text-[#F97316] animate-spin shrink-0" />
                        <div className="space-y-0.5">
                          <span className="text-xs text-[#171717] dark:text-[#FAFAFA] font-medium block">
                            {aiStage === 'context'
                              ? 'Analyzing workspace context & team roster...'
                              : aiStage === 'gemini'
                              ? 'Waiting for Gemini 3.8 Flash response & proposals...'
                              : aiStage === 'actions'
                              ? 'Verifying authorization & action parameters...'
                              : 'Analyzing workspace context & preparing action proposal...'}
                          </span>
                          <span className="text-[10px] text-[#737373] dark:text-[#A3A3A3] block">
                            {aiStage === 'context'
                              ? 'Fetching database state (timeout: 8s)'
                              : aiStage === 'gemini'
                              ? 'Processing natural language reasoning (timeout: 25s)'
                              : aiStage === 'actions'
                              ? 'Validating parameters against workspace permissions'
                              : 'Please wait a moment...'}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={cancelAIMessage}
                        className="self-start sm:self-center px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:border-rose-300 dark:hover:border-rose-800 bg-white dark:bg-[#141414] hover:bg-rose-50 dark:hover:bg-rose-950/30 text-neutral-700 dark:text-neutral-300 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold transition flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer active:scale-95"
                        title="Cancel this AI request"
                      >
                        <Square className="w-3 h-3 fill-current" />
                        <span>Stop</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Global Error Banner */}
        {aiError && !aiMessages.some((m) => m.isError) && (
          <div className="px-6 py-2.5 bg-rose-50 dark:bg-rose-950/40 border-t border-rose-200 dark:border-rose-900 flex items-center justify-between gap-3 text-xs text-rose-700 dark:text-rose-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{aiError}</span>
            </div>
            <button
              onClick={retryLastAIMessage}
              disabled={isAITyping}
              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-[11px] transition flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Suggested Action Prompts Row */}
        {aiMessages.length > 0 && (
          <div className="px-4 py-2 border-t border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA]/50 dark:bg-[#141414]/50 flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
            <span className="text-[10px] font-semibold text-[#737373] dark:text-[#A3A3A3] uppercase shrink-0">
              Quick Actions:
            </span>
            {suggestedPrompts.slice(0, 4).map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handlePromptClick(prompt)}
                disabled={isAITyping}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1C1C1C] border border-[#E5E5E5] dark:border-[#333333] hover:border-orange-400 text-[11px] text-[#737373] dark:text-[#A3A3A3] hover:text-[#F97316] font-medium whitespace-nowrap transition disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-4 border-t border-[#E5E5E5] dark:border-[#333333] flex items-center gap-3">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => handleInputChange(e.target.value)}
            disabled={isAITyping}
            placeholder={
              isAITyping
                ? 'WorkNest AI is preparing action...'
                : 'Give an action instruction (e.g. "Create a task", "Schedule meeting", "Prepare daily log")...'
            }
            className="flex-1 bg-[#FAFAFA] dark:bg-[#1C1C1C] border border-[#E5E5E5] dark:border-[#333333] rounded-2xl px-4 py-3 text-xs text-[#171717] dark:text-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-[#F97316] disabled:opacity-50"
          />

          {isAITyping ? (
            <button
              type="button"
              onClick={cancelAIMessage}
              className="px-5 py-3 rounded-2xl bg-neutral-200 dark:bg-neutral-800 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white text-neutral-800 dark:text-neutral-200 font-bold text-xs shadow-sm flex items-center gap-2 transition-colors cursor-pointer active:scale-95"
              title="Stop AI processing"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={!inputQuery.trim()}
              className="px-5 py-3 rounded-2xl bg-[#F97316] hover:bg-[#EA580C] dark:hover:bg-[#FB923C] text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>Execute</span>
              <Send className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
