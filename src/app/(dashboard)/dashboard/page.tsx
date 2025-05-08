import React from 'react';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { isAdmin } from '@/lib/auth/roles';
import { Button } from '@/components/ui/button';

// This prevents infinite recursion by passing the dynamic flag to Next.js
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  try {
    const supabase = await createClient();
    const isUserAdmin = await isAdmin();
    
    // Get the current user - use getUser instead of getSession for better security
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Error getting user:', userError);
      return (
        <div className="max-w-2xl mx-auto my-12 bg-red-50 p-6 rounded-xl border border-red-200 shadow-sm">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-red-700 mb-2 text-center">Authentication Error</h2>
          <p className="text-red-600 mb-6 text-center">
            Please log in to view your dashboard.
          </p>
          <div className="flex justify-center">
            <Link href="/login">
              <Button size="lg" className="shadow-sm">Login</Button>
            </Link>
          </div>
        </div>
      );
    }
    
    const userId = user.id;
    const userEmail = user.email;
    
    // Check if user is a client (not an admin)
    let clientId = null;
    try {
      if (!isUserAdmin && userEmail) {
        const { data: clientData } = await supabase
          .from('clients')
          .select('id')
          .eq('email', userEmail)
          .single();
          
        clientId = clientData?.id;
      }
    } catch (error) {
      console.error('Error fetching client data:', error);
    }
    
    // Fetch appropriate projects based on user type
    let projectsData = [];
    try {
      let projectsQuery = supabase.from('projects').select(`
        *,
        client:client_id (
          id,
          name,
          company
        )
      `);
      
      if (!isUserAdmin && clientId) {
        // If client, show only their projects
        projectsQuery = projectsQuery.eq('client_id', clientId);
      } else if (!isUserAdmin) {
        // Regular user without client association, show only their projects
        projectsQuery = projectsQuery.eq('owner_id', userId);
      }
      
      const { data: projects } = await projectsQuery.order('created_at', { ascending: false });
      projectsData = projects || [];
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
    
    // Fetch tasks
    let tasksData = [];
    try {
      let tasksQuery = supabase.from('tasks').select(`
        *,
        project:project_id (
          id,
          name
        )
      `);
      
      if (!isUserAdmin && clientId) {
        // Clients see tasks from their projects
        const { data: clientProjects } = await supabase
          .from('projects')
          .select('id')
          .eq('client_id', clientId);
          
        const projectIds = clientProjects?.map(p => p.id) || [];
        
        if (projectIds.length > 0) {
          tasksQuery = tasksQuery.in('project_id', projectIds);
        } else {
          // No projects, so no tasks
          tasksQuery = tasksQuery.eq('project_id', 'no-results');
        }
      } else if (!isUserAdmin) {
        // Non-admins only see their own tasks
        tasksQuery = tasksQuery.eq('owner_id', userId);
      }
      
      const { data: tasks } = await tasksQuery.order('created_at', { ascending: false });
      tasksData = tasks || [];
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
    
    // Calculate counts and stats
    const allProjects = projectsData;
    const projectsCount = allProjects.length;
    const pendingProjects = allProjects.filter(p => p.status === 'pending').length;
    const approvedProjects = allProjects.filter(p => p.status === 'approved').length;
    
    const allTasks = tasksData;
    const tasksCount = allTasks.length;
    const todoTasks = allTasks.filter(t => t.status === 'todo').length;
    const inProgressTasks = allTasks.filter(t => t.status === 'in_progress').length;
    const doneTasks = allTasks.filter(t => t.status === 'done').length;
    
    // Recent projects and tasks for display (limited to 5)
    const recentProjects = allProjects.slice(0, 5);
    const recentTasks = allTasks.slice(0, 5);
    
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-4">
          <div className="relative">
            <h1 className="text-3xl font-bold mb-1 relative inline-block">
              Dashboard
              <span className="absolute -bottom-1 left-0 w-1/3 h-1 bg-gradient-to-r from-primary to-primary-light rounded-full"></span>
            </h1>
            <p className="text-muted-foreground">Welcome back, {user.user_metadata?.name || user.email}</p>
          </div>
          <div className="flex gap-3">
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
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1">
            <div className="text-sm font-medium text-muted-foreground mb-1">Projects</div>
            <div className="text-2xl font-bold text-gradient">{projectsCount}</div>
            <div className="mt-2 text-sm text-muted-foreground flex flex-wrap gap-2">
              {pendingProjects > 0 && (
                <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                  {pendingProjects} pending
                </span>
              )}
              {approvedProjects > 0 && (
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  {approvedProjects} approved
                </span>
              )}
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1">
            <div className="text-sm font-medium text-muted-foreground mb-1">Tasks</div>
            <div className="text-2xl font-bold text-gradient">{tasksCount}</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-muted text-muted-foreground rounded-full text-xs font-medium">
                {todoTasks} to do
              </span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                {inProgressTasks} in progress
              </span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                {doneTasks} done
              </span>
            </div>
          </div>
          
          {isUserAdmin && (
            <>
              <div className="bg-white p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1">
                <div className="text-sm font-medium text-muted-foreground mb-1">Admin Tools</div>
                <div className="text-md font-bold mt-2">
                  <Link href="/admin" className="text-primary hover:underline flex items-center group">
                    <span>Admin Dashboard</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Recent Projects */}
        <div className="mb-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Recent Projects</h2>
            <Link href="/projects" className="text-sm text-primary hover:text-primary/80 flex items-center group transition-colors duration-150">
              <span>View all projects</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>
          
          {recentProjects.length > 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
              <ul className="divide-y divide-border">
                {recentProjects.map(project => (
                  <li key={project.id} className="transition-colors duration-150">
                    <Link href={`/projects/${project.id}`} className="block hover:bg-muted/10 p-4">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium mb-1">{project.name}</p>
                          {project.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">{project.description}</p>
                          )}
                          {project.client && (
                            <p className="text-xs text-primary mt-1">
                              {project.client.name} {project.client.company && `(${project.client.company})`}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center">
                          {project.status && (
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${project.status === 'pending' ? 'bg-amber-100 text-amber-800' : 
                                project.status === 'approved' ? 'bg-green-100 text-green-800' :
                                project.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-blue-100 text-blue-800'}`}>
                              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-border text-center">
              <div className="mx-auto flex items-center justify-center w-16 h-16 mb-4 bg-primary bg-opacity-5 text-primary rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              </div>
              <p className="text-lg font-medium mb-2">No projects yet</p>
              <Link href="/projects/new" className="mt-2 inline-flex items-center text-primary hover:text-primary/80 transition-colors duration-150">
                <span>Create your first project</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            </div>
          )}
        </div>
        
        {/* Recent Tasks */}
        <div className="mb-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Recent Tasks</h2>
            <Link href="/tasks" className="text-sm text-primary hover:text-primary/80 flex items-center group transition-colors duration-150">
              <span>View all tasks</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>
          
          {recentTasks.length > 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
              <ul className="divide-y divide-border">
                {recentTasks.map(task => (
                  <li key={task.id} className="transition-colors duration-150">
                    <Link href={`/tasks/${task.id}`} className="block hover:bg-muted/10 p-4">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium mb-1">{task.title}</p>
                          {task.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">{task.description}</p>
                          )}
                          {task.project && (
                            <p className="text-xs text-primary mt-1">
                              Project: {task.project.name}
                            </p>
                          )}
                        </div>
                        <div>
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                              ${task.status === 'todo' ? 'bg-muted text-muted-foreground' : 
                                task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 
                                'bg-green-100 text-green-800'}`}
                          >
                            {task.status === 'todo' ? 'To Do' : 
                             task.status === 'in_progress' ? 'In Progress' : 'Done'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-border text-center">
              <div className="mx-auto flex items-center justify-center w-16 h-16 mb-4 bg-primary bg-opacity-5 text-primary rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
              <p className="text-lg font-medium mb-2">No tasks yet</p>
              <Link href="/tasks/new" className="mt-2 inline-flex items-center text-primary hover:text-primary/80 transition-colors duration-150">
                <span>Create your first task</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Dashboard page error:', error);
    return (
      <div className="max-w-2xl mx-auto my-12 bg-red-50 p-6 rounded-xl border border-red-200 shadow-sm">
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h2 className="text-xl font-bold text-red-700 mb-2 text-center">Error Loading Dashboard</h2>
        <p className="text-red-600 mb-6 text-center">
          Something went wrong while loading your dashboard. Please try again or contact support if the issue persists.
        </p>
        <div className="flex justify-center">
          <Link href="/">
            <Button size="lg" className="shadow-sm">Go to Home Page</Button>
          </Link>
        </div>
      </div>
    );
  }
} 