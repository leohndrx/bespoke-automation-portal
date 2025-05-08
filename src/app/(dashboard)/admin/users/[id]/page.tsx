export const dynamic = 'force-dynamic';

import React from 'react';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { isAdmin } from '@/lib/auth/roles';

export default async function AdminUserDetailPage({
  params,
}: { 
  params: { id: string }; 
}) {
  // Check if user is admin
  const isAdminUser = await isAdmin();
  if (!isAdminUser) {
    redirect('/dashboard');
  }
  
  const userId = params.id;
  const supabase = await createClient();
  
  // Fetch user
  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
  
  if (userError || !userData.user) {
    notFound();
  }
  
  const user = userData.user;
  
  // Fetch user role
  const { data: roleData, error: roleError } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (roleError) {
    console.error('Error loading user role:', roleError);
  }
  
  const userRole = roleData?.role || 'user';
  
  // Fetch companies this user is associated with
  const { data: clientUsers, error: clientUsersError } = await supabase
    .from('client_users')
    .select(`
      id,
      role,
      client_id,
      clients(id, name, company, email)
    `)
    .eq('user_id', userId);
  
  if (clientUsersError) {
    console.error('Error loading client users:', clientUsersError);
  }
  
  const userCompanies = clientUsers || [];
  
  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center mb-2">
            <Link href="/admin/users" className="text-blue-600 hover:text-blue-800 text-lg">
              Users
            </Link>
            <span className="mx-2 text-gray-500">/</span>
            <h1 className="text-3xl font-bold text-gray-900">{user.user_metadata?.name || 'User'}</h1>
          </div>
          
          <div className="text-lg font-medium text-gray-700 mt-2 mb-3">{user.email}</div>
          
          <div className="flex items-center mt-3 space-x-2">
            <span className={`px-3 py-1.5 inline-flex text-sm leading-5 font-semibold rounded-full ${
              user.confirmed_at ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {user.confirmed_at ? 'Active' : 'Pending'}
            </span>
            
            <span className={`px-3 py-1.5 inline-flex text-sm leading-5 font-semibold rounded-full ${
              userRole === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
            }`}>
              {userRole === 'admin' ? 'Admin' : 'User'}
            </span>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <Button 
            variant={userRole === 'admin' ? 'primary' : 'outline'}
            onClick={async () => {
              'use server';
              // This would be handled via API - UI functionality to be added
            }}
          >
            {userRole === 'admin' ? 'Remove Admin' : 'Make Admin'}
          </Button>
          
          <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
            Disable User
          </Button>
        </div>
      </div>
      
      <div className="mt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Companies</h2>
          <Link href={`/admin/users/add-company?user=${userId}`}>
            <Button size="sm">Add to Company</Button>
          </Link>
        </div>
        
        {userCompanies.length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {userCompanies.map((userCompany: any) => (
                  <tr key={userCompany.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-base font-medium text-gray-900">
                        <Link href={`/admin/clients/${userCompany.clients.id}`} className="text-blue-600 hover:text-blue-800">
                          {userCompany.clients.name}
                        </Link>
                      </div>
                      {userCompany.clients.company && (
                        <div className="text-sm font-medium text-gray-700">
                          {userCompany.clients.company}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1.5 inline-flex text-sm leading-5 font-semibold rounded-full ${
                        userCompany.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {userCompany.role === 'admin' ? 'Admin' : 'Member'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">
                        Change Role
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No companies
            </h3>
            <p className="text-lg text-gray-700 mb-4">
              This user is not associated with any companies yet
            </p>
            <Link href={`/admin/users/add-company?user=${userId}`}>
              <Button>Add to Company</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 