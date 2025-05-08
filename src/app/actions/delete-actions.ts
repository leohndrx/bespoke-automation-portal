'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth/roles';

/**
 * Deletes a task by ID
 */
export async function deleteTask(taskId: string, redirectTo?: string) {
  const supabase = await createClient();
  const isUserAdmin = await isAdmin();

  // Check if user is admin - only admins can delete tasks
  if (!isUserAdmin) {
    throw new Error('You do not have permission to delete tasks');
  }

  // Fetch task info to get project ID before deletion (for redirection)
  const { data: task } = await supabase
    .from('tasks')
    .select('project_id')
    .eq('id', taskId)
    .single();

  // Delete the task
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) {
    console.error('Error deleting task:', error);
    throw new Error(`Failed to delete task: ${error.message}`);
  }

  // Revalidate the tasks list and the project detail page if the task was associated with a project
  revalidatePath('/tasks');
  if (task?.project_id) {
    revalidatePath(`/projects/${task.project_id}`);
  }

  // Redirect after delete
  if (redirectTo) {
    redirect(redirectTo);
  } else if (task?.project_id) {
    redirect(`/projects/${task.project_id}`);
  } else {
    redirect('/tasks');
  }
}

/**
 * Deletes a project by ID
 */
export async function deleteProject(projectId: string) {
  const supabase = await createClient();
  const isUserAdmin = await isAdmin();

  // Check if user is admin - only admins can delete projects
  if (!isUserAdmin) {
    throw new Error('You do not have permission to delete projects');
  }

  // Delete all tasks associated with this project first
  const { error: tasksError } = await supabase
    .from('tasks')
    .delete()
    .eq('project_id', projectId);

  if (tasksError) {
    console.error('Error deleting project tasks:', tasksError);
    throw new Error(`Failed to delete project tasks: ${tasksError.message}`);
  }

  // Now delete the project
  const { error: projectError } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (projectError) {
    console.error('Error deleting project:', projectError);
    throw new Error(`Failed to delete project: ${projectError.message}`);
  }

  // Revalidate the projects list
  revalidatePath('/projects');

  // Redirect to projects list
  redirect('/projects');
} 