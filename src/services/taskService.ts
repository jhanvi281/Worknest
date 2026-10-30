import { supabase, isClerkAuthMode } from '../lib/supabase';
import type { Task, TaskPriority, TaskStatus } from '../types';

export const mapSupabaseTask = (t: any): Task => {
  const assigned = t.assigned_profile;
  const assignedName = assigned?.full_name || (assigned?.email ? assigned.email.split('@')[0] : undefined);
  const assignedAvatar = assigned?.avatar_url || (assignedName ? `https://ui-avatars.com/api/?name=${encodeURIComponent(assignedName)}&background=f97316&color=fff` : undefined);

  return {
    id: t.id,
    title: t.title || '',
    description: t.description || '',
    priority: (t.priority as TaskPriority) || 'medium',
    status: (t.status as TaskStatus) || 'todo',
    dueDate: t.due_date || '',
    category: t.category || 'General',
    progress: typeof t.progress === 'number' ? t.progress : 0,
    assignedTo: assignedName,
    assignedUserAvatar: assignedAvatar,
    assignedToId: t.assigned_to || undefined,
    createdBy: t.created_by,
    teamId: t.team_id || undefined,
    subgroupId: t.subgroup_id || undefined,
    subgroup: t.subgroup?.name || undefined,
    completedAt: t.completed_at || undefined,
  };
};

export const taskService = {
  async fetchUserTasks(_userId?: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        id,
        team_id,
        subgroup_id,
        title,
        description,
        priority,
        status,
        progress,
        due_date,
        category,
        assigned_to,
        created_by,
        completed_at,
        created_at,
        assigned_profile:assigned_to(id, full_name, email, avatar_url),
        subgroup:subgroup_id(id, name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks from Supabase:', error);
      throw error;
    }

    return (data || []).map(mapSupabaseTask);
  },

  async createTask(
    newTask: {
      title: string;
      description?: string;
      priority?: TaskPriority;
      status?: TaskStatus;
      progress?: number;
      dueDate?: string;
      category?: string;
      teamId?: string;
      subgroupId?: string;
      assignedToId?: string;
    },
    userId: string
  ): Promise<Task> {
    // Authenticated session check to ensure identity integrity (prioritizes canonical profile UUID)
    let effectiveUserId: string | undefined = userId;
    if (!effectiveUserId && !isClerkAuthMode) {
      const { data: authData } = await supabase.auth.getUser();
      effectiveUserId = authData?.user?.id;
    }
    if (!effectiveUserId) {
      throw new Error('Authentication required to create a task.');
    }

    const status = newTask.status || 'todo';
    const progress =
      newTask.progress !== undefined
        ? newTask.progress
        : status === 'completed'
        ? 100
        : status === 'in_progress'
        ? 50
        : 0;

    const payload: any = {
      title: newTask.title.trim(),
      description: newTask.description?.trim() || '',
      priority: newTask.priority || 'medium',
      status,
      progress,
      due_date: newTask.dueDate || null,
      category: newTask.category || 'General',
      created_by: effectiveUserId,
      team_id: newTask.teamId || null,
      subgroup_id: newTask.subgroupId || null,
      assigned_to: newTask.assignedToId || (newTask.teamId ? null : effectiveUserId),
      completed_at: status === 'completed' ? new Date().toISOString() : null,
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert(payload)
      .select(`
        id,
        team_id,
        subgroup_id,
        title,
        description,
        priority,
        status,
        progress,
        due_date,
        category,
        assigned_to,
        created_by,
        completed_at,
        created_at,
        assigned_profile:assigned_to(id, full_name, email, avatar_url),
        subgroup:subgroup_id(id, name)
      `)
      .single();

    if (error) {
      console.error('Error creating task in Supabase:', error);
      throw error;
    }

    return mapSupabaseTask(data);
  },

  async updateTaskStatus(taskId: string, status: TaskStatus, progress?: number): Promise<Task> {
    const calculatedProgress =
      progress !== undefined
        ? progress
        : status === 'completed'
        ? 100
        : status === 'in_progress'
        ? 50
        : 0;

    const updates: any = {
      status,
      progress: calculatedProgress,
      completed_at: status === 'completed' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select(`
        id,
        team_id,
        subgroup_id,
        title,
        description,
        priority,
        status,
        progress,
        due_date,
        category,
        assigned_to,
        created_by,
        completed_at,
        created_at,
        assigned_profile:assigned_to(id, full_name, email, avatar_url),
        subgroup:subgroup_id(id, name)
      `)
      .single();

    if (error) {
      console.error('Error updating task status in Supabase:', error);
      throw error;
    }

    return mapSupabaseTask(data);
  },

  async editTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    const dbUpdates: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.title !== undefined) dbUpdates.title = updates.title.trim();
    if (updates.description !== undefined) dbUpdates.description = updates.description.trim();
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.progress !== undefined) dbUpdates.progress = updates.progress;
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate || null;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.assignedToId !== undefined) dbUpdates.assigned_to = updates.assignedToId || null;
    if (updates.teamId !== undefined) dbUpdates.team_id = updates.teamId || null;
    if (updates.subgroupId !== undefined) dbUpdates.subgroup_id = updates.subgroupId || null;
    
    if (updates.status !== undefined) {
      dbUpdates.completed_at = updates.status === 'completed' ? new Date().toISOString() : null;
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(dbUpdates)
      .eq('id', taskId)
      .select(`
        id,
        team_id,
        subgroup_id,
        title,
        description,
        priority,
        status,
        progress,
        due_date,
        category,
        assigned_to,
        created_by,
        completed_at,
        created_at,
        assigned_profile:assigned_to(id, full_name, email, avatar_url),
        subgroup:subgroup_id(id, name)
      `)
      .single();

    if (error) {
      console.error('Error editing task in Supabase:', error);
      throw error;
    }

    return mapSupabaseTask(data);
  },

  async deleteTask(taskId: string): Promise<void> {
    const { data, error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .select('id');

    if (error) {
      console.error('Error deleting task from Supabase:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error('Task could not be deleted. It may not exist or you do not have permission to delete it.');
    }
  },
};
