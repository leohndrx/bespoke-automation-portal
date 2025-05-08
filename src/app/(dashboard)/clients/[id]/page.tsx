export const dynamic = 'force-dynamic';

import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ProjectCard } from '@/components/project/project-card';
import { Button } from '@/components/ui/button';
import { Project } from '@/lib/supabase/types';

export default async function ClientDetailPage({
  params,
}: { 
  params: { id: string }; 
}) {
  // Access id directly with Promise.resolve
  const { id } = await Promise.resolve(params);
  const clientId = id;
  const supabase = await createClient();
  
  // Fetch client
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();
  
  if (clientError || !client) {
    notFound();
  }
  
  // Fetch projects for this client
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });
  
  if (projectsError) {
    console.error('Error loading projects:', projectsError);
  }
  
  // Filtering projects by archived status
  const activeProjects = projects?.filter(p => !p.is_archived) || [];
  const archivedProjects = projects?.filter(p => p.is_archived) || [];
  
  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center mb-1">
            <Link href="/clients" className="text-blue-600 hover:text-blue-800">
              Clients
            </Link>
            <span className="mx-2">/</span>
            <h1 className="text-2xl font-bold">{client.name}</h1>
          </div>
          
          {client.company && (
            <div className="text-lg text-blue-600 mt-1 mb-2">{client.company}</div>
          )}
          
          {client.description && (
            <p className="text-gray-600 mt-1 mb-3 max-w-3xl">{client.description}</p>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {client.email && (
              <div className="flex items-center text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>{client.email}</span>
              </div>
            )}
            
            {client.phone && (
              <div className="flex items-center text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>{client.phone}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex space-x-3">
          <Link href={`/clients/${clientId}/edit`}>
            <Button variant="outline">Edit Client</Button>
          </Link>
          <Link href={`/projects/new?client_id=${clientId}`}>
            <Button>New Project</Button>
          </Link>
        </div>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Projects</h2>
        
        {activeProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {activeProjects.map((project: Project) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                client={client}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No active projects
            </h3>
            <p className="text-gray-600 mb-4">
              Create a new project for this client
            </p>
            <Link href={`/projects/new?client_id=${clientId}`}>
              <Button>Create Project</Button>
            </Link>
          </div>
        )}
        
        {archivedProjects.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mt-10 mb-4 text-gray-700">Archived Projects</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {archivedProjects.map((project: Project) => (
                <ProjectCard 
                  key={project.id} 
                  project={project} 
                  client={client}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 