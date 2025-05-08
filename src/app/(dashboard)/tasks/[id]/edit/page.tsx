import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/auth/roles';
import EditTaskForm from './edit-task-form';

export default async function EditTaskPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const supabase = await createClient();
  
  // Await params before accessing its properties
  const { id } = await Promise.resolve(params);
  const taskId = id;
  
  // Check if user is admin
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
  
  // Fetch all projects for the form
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .order('name');
  
  if (projectsError) {
    console.error('Error loading projects:', projectsError);
  }
  
  // Fetch all clients for the form
  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('*')
    .order('company');
  
  if (clientsError) {
    console.error('Error loading clients:', clientsError);
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Edit Task</h1>
          <p className="text-gray-600">
            Update details for {task.title}
          </p>
        </div>
        <div className="flex space-x-3">
          {task.project_id ? (
            <Link href={`/projects/${task.project_id}`}>
              <Button variant="outline">Back to Project</Button>
            </Link>
          ) : (
            <Link href="/tasks">
              <Button variant="outline">Back to Tasks</Button>
            </Link>
          )}
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <EditTaskForm 
          task={task} 
          projects={projects || []} 
          clients={clients || []}
          showAdminFields={isUserAdmin}
        />
      </div>
    </div>
  );
} 