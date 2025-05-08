import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { ProjectCard } from '@/components/project/project-card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Project, Client } from '@/lib/supabase/types';
import { isAdmin } from '@/lib/auth/roles';

// Force dynamic rendering to avoid caching issues
export const dynamic = 'force-dynamic';
// Disable static generation
export const revalidate = 0;

interface ProjectWithClient extends Project {
  client: Client | null;
}

export default async function ProjectsPage({ 
  searchParams 
}: { 
  searchParams: Record<string, string | string[] | undefined>;
}) {
  // Properly handle searchParams in Next.js 15 - use await to access properties
  const params = await searchParams;
  const isArchived = params?.archived === 'true';
  
  const supabase = await createClient();
  const isAdminUser = await isAdmin();
  
  try {
    // For non-admin users, get their associated client
    let clientId: string | null = null;
    
    if (!isAdminUser) {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: clientUser } = await supabase
          .from('client_users')
          .select('client_id')
          .eq('user_id', user.id)
          .single();
        
        if (clientUser) {
          clientId = clientUser.client_id;
        }
      }
    }
    
    // Build query based on user role
    let query = supabase
      .from('projects')
      .select(`
        *,
        client:client_id(*)
      `)
      .order('created_at', { ascending: false });
    
    // If user is not admin, only show projects for their client
    if (!isAdminUser && clientId) {
      query = query.eq('client_id', clientId);
    }
    
    const { data: projects, error } = await query;
    
    if (error) {
      console.error('Error loading projects:', error.message, error.details, error.hint);
      
      // Show simple error UI if loading fails
      return (
        <div className="p-8 bg-red-50 rounded-xl border border-red-200 shadow-sm">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-red-700 mb-4 text-center">Error Loading Projects</h1>
          <p className="text-red-600 mb-4 text-center max-w-md mx-auto">
            There was a problem loading your projects: {error.message}
          </p>
          <p className="text-red-600 mb-6 text-sm text-center max-w-md mx-auto">
            {error.details && `Details: ${error.details}`}
          </p>
          <div className="flex justify-center">
            <Link href="/dashboard">
              <Button variant="secondary" size="lg" className="shadow-sm">Return to Dashboard</Button>
            </Link>
          </div>
        </div>
      );
    }
    
    // Filter projects based on archive status
    const filteredProjects = projects?.filter(p => 
      isArchived ? p.is_archived : !p.is_archived
    ) || [];
    
    // Count for stats
    const totalProjects = projects?.length || 0;
    const archivedCount = projects?.filter(p => p.is_archived).length || 0;
    const activeCount = totalProjects - archivedCount;
    
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-4">
          <div className="relative">
            <h1 className="text-3xl font-bold mb-1 relative inline-block">
              Projects
              <span className="absolute -bottom-1 left-0 w-1/3 h-1 bg-gradient-to-r from-primary to-primary-light rounded-full"></span>
            </h1>
            <p className="text-muted-foreground">Manage your automation projects</p>
          </div>
          <Link href="/projects/new">
            <Button size="lg" className="shadow-sm group relative overflow-hidden">
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary-light to-primary opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-1.5 transform group-hover:rotate-90 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              New Project
            </Button>
          </Link>
        </div>
        
        {/* Project Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1">
            <div className="text-sm font-medium text-muted-foreground mb-1">Total Projects</div>
            <div className="text-2xl font-bold text-gradient">{totalProjects}</div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1">
            <div className="text-sm font-medium text-muted-foreground mb-1">Active Projects</div>
            <div className="text-2xl font-bold text-gradient">{activeCount}</div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1">
            <div className="text-sm font-medium text-muted-foreground mb-1">Archived Projects</div>
            <div className="text-2xl font-bold text-gradient">{archivedCount}</div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1">
            <div className="text-sm font-medium text-muted-foreground mb-1">Recent Activity</div>
            <div className="text-2xl font-bold text-gradient">{projects && projects.length > 0 ? 'Active' : 'None'}</div>
          </div>
        </div>
        
        {/* Filter toggles */}
        <div className="flex flex-wrap mb-10">
          <Link 
            href="/projects"
            className={`px-5 py-2.5 rounded-lg mr-3 mb-2 font-medium text-sm transition-all duration-200 ${!isArchived 
              ? 'bg-primary text-white shadow-sm' 
              : 'bg-muted text-foreground hover:bg-muted/80'} relative overflow-hidden`}
          >
            <span className={`absolute inset-0 bg-gradient-to-r from-primary-light to-primary transition-opacity duration-300 ${!isArchived ? 'opacity-10' : 'opacity-0'}`}></span>
            <div className="relative flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
              Active ({activeCount})
            </div>
          </Link>
          <Link 
            href="/projects?archived=true"
            className={`px-5 py-2.5 rounded-lg mb-2 font-medium text-sm transition-all duration-200 ${isArchived 
              ? 'bg-primary text-white shadow-sm' 
              : 'bg-muted text-foreground hover:bg-muted/80'} relative overflow-hidden`}
          >
            <span className={`absolute inset-0 bg-gradient-to-r from-primary-light to-primary transition-opacity duration-300 ${isArchived ? 'opacity-10' : 'opacity-0'}`}></span>
            <div className="relative flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="8" x2="8" y2="8"></line>
                <line x1="16" y1="16" x2="8" y2="16"></line>
                <line x1="10" y1="12" x2="3" y2="12"></line>
              </svg>
              Archived ({archivedCount})
            </div>
          </Link>
        </div>
        
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project: ProjectWithClient) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                client={project.client}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-xl shadow-sm border border-border text-center">
            <div className="mx-auto flex items-center justify-center w-20 h-20 mb-6 bg-primary bg-opacity-5 text-primary rounded-full animate-float">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="12" y1="18" x2="12" y2="12"></line>
                <line x1="9" y1="15" x2="15" y2="15"></line>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {isArchived ? 'No archived projects' : 'No active projects'}
            </h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              {isArchived 
                ? 'There are no archived projects to display. Active projects can be archived from the project details page.'
                : 'Get started by creating your first project to automate your business processes.'}
            </p>
            {!isArchived && (
              <Link href="/projects/new">
                <Button size="lg" className="shadow-sm group relative overflow-hidden">
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary-light to-primary opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-1.5 transform group-hover:rotate-90 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Create Project
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Projects page error:', error);
    return (
      <div className="mx-auto max-w-2xl p-8 bg-red-50 rounded-xl border border-red-200 shadow-sm">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-full bg-red-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h1 className="text-xl font-bold text-red-700 mb-4 text-center">Error Loading Projects</h1>
        <p className="text-red-600 mb-6 text-center">
          Something went wrong while loading your projects: {error instanceof Error ? error.message : 'Unknown error'}
        </p>
        <div className="flex justify-center">
          <Link href="/dashboard">
            <Button variant="secondary" size="lg" className="shadow-sm">Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }
} 