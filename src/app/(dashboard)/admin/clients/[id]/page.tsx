import React from 'react';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Button } from '@/components/ui/button';
import { isAdmin } from '@/lib/auth/roles';

// This prevents infinite recursion by ensuring dynamic data fetching
export const dynamic = 'force-dynamic';

// Define proper types for params
type Params = {
  id: string;
};

export default async function AdminClientDetailPage(props: {
  params: Promise<Params>;
}) {
  // Check if user is admin
  const isAdminUser = await isAdmin();
  if (!isAdminUser) {
    redirect('/dashboard');
  }
  
  // Access id by awaiting the params promise
  const { id } = await props.params;
  const clientId = id;
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();
  
  try {
    // Fetch client
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();
    
    if (clientError || !client) {
      notFound();
    }
    
    // Fetch users associated with this client using the new client_users table
    const { data: clientUsers, error: clientUsersError } = await supabase
      .from('client_users')
      .select(`
        id,
        role,
        user_id,
        created_at
      `)
      .eq('client_id', clientId);
    
    if (clientUsersError) {
      console.error('Error loading client users:', clientUsersError);
    }
    
    // Fetch the actual user details for the associated users
    const userIds = clientUsers?.map(cu => cu.user_id) || [];
    let users: any[] = [];
    
    if (userIds.length > 0) {
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (userError) {
        console.error('Error fetching user details:', userError);
      } else {
        users = userData.users.filter(user => userIds.includes(user.id)).map(user => {
          // Find the client_user record for this user
          const clientUser = clientUsers?.find(cu => cu.user_id === user.id);
          return {
            ...user,
            client_role: clientUser?.role || 'member'
          };
        });
      }
    }
    
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb and Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start mb-8 gap-4">
          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground mb-1">
              <Link href="/admin/clients" className="hover:text-primary transition-colors">
                Companies
              </Link>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-foreground">{client.name}</span>
            </div>
            
            <h1 className="text-3xl font-bold mb-1 relative inline-block">
              {client.name}
              <span className="absolute -bottom-1 left-0 w-1/3 h-1 bg-gradient-to-r from-primary to-primary-light rounded-full"></span>
            </h1>
            
            {client.company && (
              <div className="text-lg text-primary font-medium">{client.company}</div>
            )}
            
            {client.description && (
              <p className="text-muted-foreground max-w-3xl">{client.description}</p>
            )}
          </div>
          
          <div className="flex gap-3 self-start mt-4 sm:mt-0">
            <Link href={`/admin/clients/${clientId}/edit`}>
              <Button variant="outline" className="shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Edit Company
              </Button>
            </Link>
            <Link href={`/admin/users/add?client=${clientId}`}>
              <Button size="md" className="shadow-sm group relative overflow-hidden">
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary-light to-primary opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="8.5" cy="7" r="4"></circle>
                  <line x1="20" y1="8" x2="20" y2="14"></line>
                  <line x1="23" y1="11" x2="17" y2="11"></line>
                </svg>
                Invite User
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Contact Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {client.email && (
            <div className="bg-white p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1">
              <div className="text-sm font-medium text-muted-foreground mb-1">Email</div>
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href={`mailto:${client.email}`} className="text-foreground hover:text-primary transition-colors">{client.email}</a>
              </div>
            </div>
          )}
          
          {client.phone && (
            <div className="bg-white p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1">
              <div className="text-sm font-medium text-muted-foreground mb-1">Phone</div>
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a href={`tel:${client.phone}`} className="text-foreground hover:text-primary transition-colors">{client.phone}</a>
              </div>
            </div>
          )}
          
          <div className="bg-white p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1">
            <div className="text-sm font-medium text-muted-foreground mb-1">Users</div>
            <div className="text-2xl font-bold text-gradient">{users.length}</div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1">
            <div className="text-sm font-medium text-muted-foreground mb-1">Added On</div>
            <div className="text-foreground">
              {new Date(client.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>
        
        {/* Users Section */}
        <div className="mt-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-2xl font-bold">Company Users</h2>
            <Link href={`/admin/users/add?client=${clientId}`}>
              <Button size="md" className="shadow-sm group relative overflow-hidden">
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary-light to-primary opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1.5 transform group-hover:rotate-90 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Invite User
              </Button>
            </Link>
          </div>
          
          {users.length > 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/30">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Company Role
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-border">
                  {users.map((user: any) => (
                    <tr key={user.id} className="hover:bg-muted/10 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium">
                          {user.user_metadata?.name || 'No Name'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.confirmed_at ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {user.confirmed_at ? 'Active' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.client_role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.client_role === 'admin' ? 'Admin' : 'Member'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link href={`/admin/users/${user.id}`} className="text-primary hover:text-primary/80 transition-colors duration-150 inline-flex items-center">
                          View
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-xl shadow-sm border border-border text-center">
              <div className="mx-auto flex items-center justify-center w-20 h-20 mb-6 bg-primary bg-opacity-5 text-primary rounded-full animate-float">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                No users yet
              </h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Invite users to this company to collaborate on projects
              </p>
              <Link href={`/admin/users/add?client=${clientId}`}>
                <Button size="md" className="shadow-sm group relative overflow-hidden">
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary-light to-primary opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-1.5 transform group-hover:rotate-90 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Invite User
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading client details:', error);
    return (
      <div className="max-w-2xl mx-auto my-12 bg-red-50 p-6 rounded-xl border border-red-200 shadow-sm">
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h2 className="text-xl font-bold text-red-700 mb-2 text-center">Error Loading Company Details</h2>
        <p className="text-red-600 mb-6 text-center">
          There was a problem retrieving company information. Please try again later.
        </p>
        <div className="flex justify-center">
          <Link href="/admin/clients">
            <Button variant="outline" size="lg" className="shadow-sm">Return to Companies</Button>
          </Link>
        </div>
      </div>
    );
  }
} 