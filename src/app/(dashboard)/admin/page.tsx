import React from 'react';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdmin } from '@/lib/auth/roles';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function AdminDashboardPage() {
  // Check if user is admin
  const isAdminUser = await isAdmin();
  
  if (!isAdminUser) {
    notFound();
  }
  
  // Use regular client for database operations
  const supabase = await createClient();
  // Use admin client for auth admin operations
  const supabaseAdmin = createAdminClient();
  
  try {
    // Get all users and their roles using the admin client
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    
    // Get all user roles
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('*');
      
    // Combine users with roles
    const usersWithRoles = users.map(user => {
      const role = userRoles?.find(r => r.user_id === user.id)?.role || 'user';
      return {
        ...user,
        role,
      };
    });
    
    // Get some stats
    const { count: projectsCount } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true });
      
    const { count: tasksCount } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true });
      
    const { count: clientsCount } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true });
  
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-4">
          <div className="relative">
            <h1 className="text-3xl font-bold mb-1 relative inline-block">
              Admin Dashboard
              <span className="absolute -bottom-1 left-0 w-1/3 h-1 bg-gradient-to-r from-primary to-primary-light rounded-full"></span>
            </h1>
            <p className="text-muted-foreground">Manage users, companies, and view system statistics</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/users/add">
              <Button size="lg" className="shadow-sm group relative overflow-hidden">
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary-light to-primary opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-1.5 transform group-hover:rotate-90 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Invite User
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1">
            <div className="text-sm font-medium text-muted-foreground mb-1">Total Users</div>
            <div className="text-2xl font-bold text-gradient">{users.length}</div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1">
            <div className="text-sm font-medium text-muted-foreground mb-1">Total Projects</div>
            <div className="text-2xl font-bold text-gradient">{projectsCount || 0}</div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1">
            <div className="text-sm font-medium text-muted-foreground mb-1">Total Companies</div>
            <div className="text-2xl font-bold text-gradient">{clientsCount || 0}</div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1">
            <div className="text-sm font-medium text-muted-foreground mb-1">Total Tasks</div>
            <div className="text-2xl font-bold text-gradient">{tasksCount || 0}</div>
          </div>
        </div>
        
        {/* Admin Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <Link href="/admin/users" className="bg-white p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1 group">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold mb-2">User Management</h2>
                <p className="text-muted-foreground">Manage users, roles, and company associations</p>
              </div>
              <div className="text-primary transform group-hover:translate-x-1 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-3xl font-bold mr-2 text-gradient">{users.length}</span>
              <span className="text-muted-foreground">users total</span>
            </div>
          </Link>
          
          <Link href="/admin/clients" className="bg-white p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1 group">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold mb-2">Company Management</h2>
                <p className="text-muted-foreground">Manage client companies and user associations</p>
              </div>
              <div className="text-primary transform group-hover:translate-x-1 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-3xl font-bold mr-2 text-gradient">{clientsCount || 0}</span>
              <span className="text-muted-foreground">companies total</span>
            </div>
          </Link>
        </div>
        
        {/* Recent Users */}
        <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="p-4 border-b border-border flex justify-between items-center">
            <h2 className="text-lg font-semibold">Recent Users</h2>
            <Link href="/admin/users" className="text-sm text-primary hover:underline flex items-center group">
              View All Users
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/30">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-border">
                {usersWithRoles.slice(0, 5).map(user => (
                  <tr key={user.id} className="hover:bg-muted/10 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">
                        {user.user_metadata?.name || 'User'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.confirmed_at ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {user.confirmed_at ? 'Confirmed' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/admin/users/${user.id}`} className="text-primary hover:text-primary/80 transition-colors duration-150">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error in admin dashboard:', error);
    return (
      <div className="max-w-2xl mx-auto my-12 bg-red-50 p-6 rounded-xl border border-red-200 shadow-sm">
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h2 className="text-xl font-bold text-red-700 mb-2 text-center">Error Loading Admin Dashboard</h2>
        <p className="text-red-600 mb-6 text-center">
          There was an error loading the admin data: {error instanceof Error ? error.message : 'Unknown error'}
        </p>
        <div className="flex justify-center">
          <Link href="/dashboard">
            <Button variant="outline" size="lg" className="shadow-sm">Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }
} 