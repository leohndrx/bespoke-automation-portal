import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/auth/roles';
import EditProjectForm from './edit-project-form';

export default async function EditProjectPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const supabase = await createClient();
  
  // Await params before accessing its properties
  const { id } = await Promise.resolve(params);
  const projectId = id;
  
  // Check if user is admin
  const isUserAdmin = await isAdmin();
  
  // Fetch project data
  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      *,
      client:client_id(*)
    `)
    .eq('id', projectId)
    .single();
  
  if (error || !project) {
    console.error('Error loading project:', error);
    notFound();
  }
  
  // Fetch all clients for the admin form
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
          <h1 className="text-2xl font-bold">Edit Project</h1>
          <p className="text-gray-600">
            Update details for {project.name}
          </p>
        </div>
        <Link href={`/projects/${projectId}`}>
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <EditProjectForm 
          project={project} 
          clients={clients || []} 
          showAdminFields={isUserAdmin}
          showClientSelect={isUserAdmin}
        />
      </div>
    </div>
  );
} 