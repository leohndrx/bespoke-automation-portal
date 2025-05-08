import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { isAdmin } from '@/lib/auth/roles';
import { formatDate } from '@/lib/utils/date';
import { AdminTaskFilters } from '@/components/admin/task-filters';

// Force dynamic rendering to avoid caching issues
export const dynamic = 'force-dynamic';
// Disable static generation
export const revalidate = 0;

// Define SearchParams type
type SearchParams = Record<string, string | string[] | undefined>;

export default async function TasksPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const isUserAdmin = await isAdmin();
  
  try {
    // Get filter parameters from URL
    const sortParam = searchParams?.sort as string || 'created_at_desc';
    const valueMinParam = searchParams?.value_min ? parseFloat(searchParams.value_min as string) : null;
    const valueMaxParam = searchParams?.value_max ? parseFloat(searchParams.value_max as string) : null;
    const filterUnapproved = searchParams?.unapproved === 'true';
    const clientParam = searchParams?.client as string || null;
    
    // Determine query based on user type
    let query = supabase
      .from('tasks')
      .select(`
        *,
        project:project_id(*),
        client:client_id(*)
      `);
    
    // For regular users, only show tasks that belong to them
    if (!isUserAdmin) {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        query = query.eq('owner_id', user.id);
      }
    } else {
      // Only apply these filters for admin users
      
      // Filter by approval status if requested
      if (filterUnapproved) {
        query = query.eq('approved', false);
      }
      
      // Filter by client if specified
      if (clientParam) {
        // Tasks can be associated with a client either directly or through a project
        // First, get projects associated with this client
        const { data: clientProjects } = await supabase
          .from('projects')
          .select('id')
          .eq('client_id', clientParam);
          
        const projectIds = clientProjects?.map(p => p.id) || [];
        
        if (projectIds.length > 0) {
          // Use an OR filter: either client_id matches directly, or project_id is in the list of this client's projects
          query = query.or(`client_id.eq.${clientParam},project_id.in.(${projectIds.join(',')})`);
        } else {
          // No projects for this client, just filter by direct client association
          query = query.eq('client_id', clientParam);
        }
      }
    }
    
    // Set ordering based on sort parameter
    switch (sortParam) {
      case 'created_at_asc':
        query = query.order('created_at', { ascending: true });
        break;
      case 'value_desc':
        // For value sorting, we'll sort in JavaScript after fetching
        query = query.order('created_at', { ascending: false });
        break;
      case 'value_asc':
        // For value sorting, we'll sort in JavaScript after fetching
        query = query.order('created_at', { ascending: false });
        break;
      case 'due_date_asc':
        query = query.order('due_date', { ascending: true, nullsFirst: false });
        break;
      case 'title_asc':
        query = query.order('title', { ascending: true });
        break;
      default: // created_at_desc is default
        query = query.order('created_at', { ascending: false });
    }
    
    const { data: tasks, error } = await query;
    
    if (error) {
      console.error('Error loading tasks:', error);
      throw error;
    }
    
    // Apply JavaScript-based filtering and sorting
    let filteredTasks = tasks || [];
    
    // Apply min/max value filters (value = hours * price_per_hour)
    if (isUserAdmin && (valueMinParam !== null || valueMaxParam !== null)) {
      filteredTasks = filteredTasks.filter(task => {
        const taskValue = (task.hours || 0) * (task.price_per_hour || 0);
        
        if (valueMinParam !== null && taskValue < valueMinParam) {
          return false;
        }
        
        if (valueMaxParam !== null && taskValue > valueMaxParam) {
          return false;
        }
        
        return true;
      });
    }
    
    // Apply JavaScript-based sorting for value-based sorting
    if (isUserAdmin && (sortParam === 'value_desc' || sortParam === 'value_asc')) {
      filteredTasks.sort((a, b) => {
        const valueA = (a.hours || 0) * (a.price_per_hour || 0);
        const valueB = (b.hours || 0) * (b.price_per_hour || 0);
        
        return sortParam === 'value_desc' 
          ? valueB - valueA  // High to low
          : valueA - valueB; // Low to high
      });
    }
    
    // Separate tasks by status
    const todoTasks = filteredTasks.filter(task => task.status === 'todo') || [];
    const inProgressTasks = filteredTasks.filter(task => task.status === 'in_progress') || [];
    const doneTasks = filteredTasks.filter(task => task.status === 'done') || [];
    
    // Count for stats
    const totalTasks = filteredTasks.length || 0;
    const pendingApproval = filteredTasks.filter(task => task.approved === false)?.length || 0;
    
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-4">
          <div className="relative">
            <h1 className="text-3xl font-bold mb-1 relative inline-block">
              Tasks
              <span className="absolute -bottom-1 left-0 w-1/3 h-1 bg-gradient-to-r from-primary to-primary-light rounded-full"></span>
            </h1>
            <p className="text-muted-foreground">Manage all tasks</p>
          </div>
          <Link href="/tasks/new">
            <Button size="lg" className="shadow-sm group relative overflow-hidden">
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary-light to-primary opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-1.5 transform group-hover:rotate-90 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              New Task
            </Button>
          </Link>
        </div>
        
        {/* Task Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1">
            <div className="text-sm font-medium text-muted-foreground mb-1">Total Tasks</div>
            <div className="text-2xl font-bold text-gradient">{totalTasks}</div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1">
            <div className="text-sm font-medium text-muted-foreground mb-1">To Do</div>
            <div className="text-2xl font-bold text-gradient">{todoTasks.length}</div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1">
            <div className="text-sm font-medium text-muted-foreground mb-1">In Progress</div>
            <div className="text-2xl font-bold text-gradient">{inProgressTasks.length}</div>
          </div>
          {isUserAdmin && (
            <div className="bg-white p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1">
              <div className="text-sm font-medium text-muted-foreground mb-1">Pending Approval</div>
              <div className="text-2xl font-bold text-gradient">{pendingApproval}</div>
            </div>
          )}
        </div>
        
        {/* Admin Filters - only shown to admin users */}
        {isUserAdmin && (
          <AdminTaskFilters 
            totalTasks={totalTasks} 
            hasUnapprovedTasks={pendingApproval > 0}
          />
        )}
        
        {/* Task Sections */}
        <div className="space-y-12">
          {todoTasks.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 inline-flex items-center">
                <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                To Do ({todoTasks.length})
              </h2>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project / Client</th>
                        {isUserAdmin && (
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                        )}
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {todoTasks.map(task => (
                        <tr key={task.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{task.title}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {task.project ? (
                              <Link href={`/projects/${task.project.id}`} className="text-primary hover:underline">
                                {task.project.name}
                              </Link>
                            ) : task.client ? (
                              <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <span className="text-gray-700">{task.client.company}</span>
                              </div>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          {isUserAdmin && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {task.hours !== null ? task.hours : '-'}
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {task.due_date ? formatDate(task.due_date) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              To Do
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link href={`/tasks/${task.id}`} className="text-primary hover:text-primary-dark mr-3">
                              View
                            </Link>
                            <Link href={`/tasks/${task.id}/edit`} className="text-primary hover:text-primary-dark">
                              Edit
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          {inProgressTasks.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 inline-flex items-center">
                <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                In Progress ({inProgressTasks.length})
              </h2>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project / Client</th>
                        {isUserAdmin && (
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                        )}
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {inProgressTasks.map(task => (
                        <tr key={task.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{task.title}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {task.project ? (
                              <Link href={`/projects/${task.project.id}`} className="text-primary hover:underline">
                                {task.project.name}
                              </Link>
                            ) : task.client ? (
                              <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <span className="text-gray-700">{task.client.company}</span>
                              </div>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          {isUserAdmin && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {task.hours !== null ? task.hours : '-'}
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {task.due_date ? formatDate(task.due_date) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              In Progress
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link href={`/tasks/${task.id}`} className="text-primary hover:text-primary-dark mr-3">
                              View
                            </Link>
                            <Link href={`/tasks/${task.id}/edit`} className="text-primary hover:text-primary-dark">
                              Edit
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          {doneTasks.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 inline-flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                Done ({doneTasks.length})
              </h2>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project / Client</th>
                        {isUserAdmin && (
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                        )}
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {doneTasks.map(task => (
                        <tr key={task.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{task.title}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {task.project ? (
                              <Link href={`/projects/${task.project.id}`} className="text-primary hover:underline">
                                {task.project.name}
                              </Link>
                            ) : task.client ? (
                              <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <span className="text-gray-700">{task.client.company}</span>
                              </div>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          {isUserAdmin && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {task.hours !== null ? task.hours : '-'}
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {task.due_date ? formatDate(task.due_date) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Done
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link href={`/tasks/${task.id}`} className="text-primary hover:text-primary-dark mr-3">
                              View
                            </Link>
                            <Link href={`/tasks/${task.id}/edit`} className="text-primary hover:text-primary-dark">
                              Edit
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          {filteredTasks.length === 0 && (
            <div className="bg-white p-12 rounded-xl shadow-sm border border-border text-center">
              <div className="mx-auto flex items-center justify-center w-20 h-20 mb-6 bg-primary bg-opacity-5 text-primary rounded-full animate-float">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                No tasks found
              </h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Create your first task to track your work and keep everything organized.
              </p>
              <Link href="/tasks/new">
                <Button size="lg" className="shadow-sm group relative overflow-hidden">
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary-light to-primary opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-1.5 transform group-hover:rotate-90 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Create Task
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error in tasks page:', error);
    return (
      <div className="max-w-2xl mx-auto p-8 bg-red-50 rounded-xl border border-red-200 shadow-sm">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-full bg-red-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h1 className="text-xl font-bold text-red-700 mb-4 text-center">Error Loading Tasks</h1>
        <p className="text-red-600 mb-6 text-center">
          Something went wrong while loading your tasks. Please try again later.
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