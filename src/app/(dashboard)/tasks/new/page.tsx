import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import NewTaskForm from './new-task-form';
import { Project, Client } from '@/lib/supabase/types';

export default async function NewTaskPage({ 
  searchParams 
}: { 
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const supabase = await createClient();
  
  // Fetch projects for the form
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .order('name');
  
  if (projectsError) {
    console.error('Error loading projects:', projectsError);
  }
  
  // Fetch clients for the form
  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('*')
    .order('company');
  
  if (clientsError) {
    console.error('Error loading clients:', clientsError);
  }
  
  return (
    <div className="px-2">
      <div className="page-header">
        <div>
          <h1 style={{ color: '#819cf9', textShadow: '0 0 10px rgba(74, 94, 228, 0.3)' }}>
            New Task
          </h1>
          <p className="subtitle">Create a new task</p>
        </div>
        <Link href="/tasks">
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>
      
      <div className="card">
        <div style={{ borderLeft: '4px solid #4a5ee4', paddingLeft: '1rem', marginBottom: '1.5rem' }}>
          <h2>Task Information</h2>
          <p className="subtitle">Fill in the details below to create a new task</p>
        </div>
        <NewTaskForm 
          projects={projects || []}
          clients={clients || []}
          defaultProjectId={searchParams.project_id as string} 
          defaultClientId={searchParams.client_id as string}
        />
      </div>
    </div>
  );
} 