import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Task } from '@/lib/supabase/types';
import { TaskCard } from '@/components/task/task-card';
import { isAdmin } from '@/lib/auth/roles';
import { DeleteProjectButton } from '@/components/delete-buttons/delete-project-button';

// This prevents infinite recursion by ensuring dynamic data fetching
export const dynamic = 'force-dynamic';

// Define types for params and searchParams
type Params = {
  id: string;
};

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ProjectDetailPage(props: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const supabase = await createClient();
  const isUserAdmin = await isAdmin();
  
  // Await params before accessing its properties
  const { id } = await props.params;
  const projectId = id;
  
  // Safely handle search params in Next.js 15
  const searchParams = await props.searchParams;
  const statusParam = searchParams?.status as string || null;
  
  // Fetch project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select(`
      *,
      client:client_id (*)
    `)
    .eq('id', projectId)
    .single();
  
  if (projectError || !project) {
    notFound();
  }
  
  // Build query for tasks with optional status filter
  let tasksQuery = supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  
  if (statusParam) {
    tasksQuery = tasksQuery.eq('status', statusParam);
  }
  
  // Fetch tasks
  const { data: tasks, error: tasksError } = await tasksQuery;
  
  if (tasksError) {
    console.error('Error loading tasks:', tasksError);
  }
  
  // Group tasks by status for the filters
  const allTasks = tasks || [];
  const tasksByStatus = {
    todo: allTasks.filter((task) => task.status === 'todo'),
    inProgress: allTasks.filter((task) => task.status === 'in_progress'),
    done: allTasks.filter((task) => task.status === 'done'),
  };
  
  return (
    <div>
      <div className="mb-6">
        <Link href="/projects" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
          ← Back to Projects
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-1">{project.name}</h1>
            {project.description && (
              <p className="text-gray-600 mb-4">{project.description}</p>
            )}
            {project.client && (
              <div className="mb-4">
                <span className="text-sm text-blue-600 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {project.client.name} {project.client.company && `(${project.client.company})`}
                </span>
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              {project.status && (
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                  ${project.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                    project.status === 'approved' ? 'bg-green-100 text-green-800' :
                    project.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'}`}>
                  Status: {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </span>
              )}
              
              {isUserAdmin && project.total_price > 0 && (
                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                  Total Price: ${project.total_price.toFixed(2)}
                </span>
              )}
              
              {project.is_archived && (
                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                  Archived
                </span>
              )}
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Link href={`/projects/${projectId}/edit`}>
              <Button variant="outline">Edit</Button>
            </Link>
            <Link href={`/tasks/new?project_id=${projectId}`}>
              <Button>New Task</Button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Project management options, including danger zone */}
      {isUserAdmin && (
        <div className="mb-8 mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Project Management</h3>
          <div className="border-t border-gray-200 pt-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-red-600">Danger Zone</h4>
                <p className="text-xs text-gray-500 max-w-md">
                  Deleting this project will permanently remove it and all associated tasks. This action cannot be undone.
                </p>
              </div>
              <DeleteProjectButton projectId={projectId} />
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Tasks</h2>
        
        {/* Task filters */}
        <div className="flex space-x-2 mb-4">
          <Link
            href={`/projects/${projectId}`}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              !statusParam ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
            }`}
          >
            All ({allTasks.length})
          </Link>
          <Link
            href={`/projects/${projectId}?status=todo`}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              statusParam === 'todo' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
            }`}
          >
            To Do ({tasksByStatus.todo.length})
          </Link>
          <Link
            href={`/projects/${projectId}?status=in_progress`}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              statusParam === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
            }`}
          >
            In Progress ({tasksByStatus.inProgress.length})
          </Link>
          <Link
            href={`/projects/${projectId}?status=done`}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              statusParam === 'done' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
            }`}
          >
            Done ({tasksByStatus.done.length})
          </Link>
        </div>
        
        {allTasks.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {allTasks.map((task: Task) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                showPricing={isUserAdmin}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No tasks yet
            </h3>
            <p className="text-gray-600 mb-6">
              This project doesn&apos;t have any tasks yet
            </p>
            <Link href={`/tasks/new?project_id=${projectId}`}>
              <Button>Create Task</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 