import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/auth/roles';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils/date';
import { DeleteTaskButton } from '@/components/delete-buttons/delete-task-button';

// This prevents infinite recursion by ensuring dynamic data fetching
export const dynamic = 'force-dynamic';

// Define proper types for params
type Params = {
  id: string;
};

export default async function TaskDetailPage(props: {
  params: Promise<Params>;
}) {
  const supabase = await createClient();
  
  // Await params before accessing its properties
  const { id } = await props.params;
  const taskId = id;
  const isUserAdmin = await isAdmin();
  
  // Fetch task data
  const { data: task, error } = await supabase
    .from('tasks')
    .select(`
      *,
      project:project_id(*),
      client:client_id(*)
    `)
    .eq('id', taskId)
    .single();
  
  if (error || !task) {
    console.error('Error loading task:', error);
    notFound();
  }
  
  // Calculate total price if applicable
  const totalPrice = task.hours && task.price_per_hour 
    ? task.hours * task.price_per_hour 
    : null;
    
  // Format dates
  const formattedDueDate = task.due_date ? formatDate(task.due_date) : null;
  const formattedCreatedDate = formatDate(task.created_at);
  
  // Status styles
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'todo':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'done':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">{task.title}</h1>
          {task.project?.name && (
            <Link 
              href={`/projects/${task.project.id}`}
              className="text-primary hover:underline"
            >
              {task.project.name}
            </Link>
          )}
          {!task.project && task.client?.company && (
            <div className="text-sm text-blue-600 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Client: {task.client.company}
            </div>
          )}
        </div>
        
        <div className="flex space-x-3">
          <Link href={`/tasks/${taskId}/edit`}>
            <Button variant="outline">Edit Task</Button>
          </Link>
          {task.project?.id && (
            <Link href={`/projects/${task.project.id}`}>
              <Button>Back to Project</Button>
            </Link>
          )}
          {isUserAdmin && (
            <DeleteTaskButton taskId={taskId} />
          )}
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="p-6">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyles(task.status)}`}>
              {task.status === 'todo' ? 'To Do' : 
               task.status === 'in_progress' ? 'In Progress' : 'Done'}
            </span>
            
            {task.approved !== null && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${task.approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {task.approved ? 'Approved' : 'Pending Approval'}
              </span>
            )}
            
            {formattedDueDate && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                Due: {formattedDueDate}
              </span>
            )}
          </div>
          
          {task.description && (
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-2">Description</h3>
              <div className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border border-gray-100">
                {task.description}
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-medium mb-3">Details</h3>
              <dl className="space-y-2">
                <div className="flex">
                  <dt className="w-32 font-medium text-gray-600">Created:</dt>
                  <dd>{formattedCreatedDate}</dd>
                </div>
                
                {formattedDueDate && (
                  <div className="flex">
                    <dt className="w-32 font-medium text-gray-600">Due Date:</dt>
                    <dd>{formattedDueDate}</dd>
                  </div>
                )}
                
                <div className="flex">
                  <dt className="w-32 font-medium text-gray-600">Status:</dt>
                  <dd className="capitalize">{task.status.replace('_', ' ')}</dd>
                </div>

                {!task.project && task.client && (
                  <div className="flex">
                    <dt className="w-32 font-medium text-gray-600">Client:</dt>
                    <dd>{task.client.company}</dd>
                  </div>
                )}
              </dl>
            </div>
            
            {(isUserAdmin || task.hours) && (
              <div>
                <h3 className="text-lg font-medium mb-3">Pricing & Time</h3>
                <dl className="space-y-2">
                  {task.hours !== null && (
                    <div className="flex">
                      <dt className="w-32 font-medium text-gray-600">Hours:</dt>
                      <dd>{task.hours}</dd>
                    </div>
                  )}
                  
                  {isUserAdmin && task.price_per_hour !== null && (
                    <div className="flex">
                      <dt className="w-32 font-medium text-gray-600">Rate:</dt>
                      <dd>${task.price_per_hour}/hour</dd>
                    </div>
                  )}
                  
                  {isUserAdmin && totalPrice !== null && (
                    <div className="flex font-medium">
                      <dt className="w-32 text-gray-600">Total:</dt>
                      <dd className="text-primary">${totalPrice.toFixed(2)}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}
          </div>
          
          {isUserAdmin && !task.approved && (
            <div className="mt-8 flex justify-end">
              <Link href={`/tasks/${taskId}/edit`}>
                <Button>
                  Approve Task
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 