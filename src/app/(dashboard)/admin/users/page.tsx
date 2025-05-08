'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { redirect, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Button } from '@/components/ui/button';
import { isAdmin } from '@/lib/auth/roles';

export default function AdminUsersPage() {
  // This is now a client component so we can handle delete actions
  const router = useRouter();
  const [loading, setLoading] = useState<{[key: string]: boolean}>({});
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [userStats, setUserStats] = useState({
    total: 0,
    admin: 0,
    regular: 0,
    pending: 0
  });

  // Load users on component mount
  React.useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load users');
      }
      
      setUsers(data.users || []);
      setUserStats({
        total: data.users.length,
        admin: data.users.filter((u: any) => u.role === 'admin').length,
        regular: data.users.filter((u: any) => u.role !== 'admin').length,
        pending: data.users.filter((u: any) => !u.confirmed_at).length
      });
    } catch (err: any) {
      console.error('Error loading users:', err);
      setError(err.message || 'Failed to load users');
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(prev => ({ ...prev, [userId]: true }));
      
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }
      
      // Remove the user from the state
      setUsers(users.filter(user => user.id !== userId));
      // Update the stats
      setUserStats(prev => ({
        ...prev,
        total: prev.total - 1,
        admin: prev.admin - (users.find(u => u.id === userId)?.role === 'admin' ? 1 : 0),
        regular: prev.regular - (users.find(u => u.id === userId)?.role !== 'admin' ? 1 : 0),
        pending: prev.pending - (!users.find(u => u.id === userId)?.confirmed_at ? 1 : 0)
      }));
      
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError(err.message || 'Failed to delete user');
    } finally {
      setLoading(prev => ({ ...prev, [userId]: false }));
    }
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-red-50 p-6 rounded-xl border border-red-200 shadow-sm">
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h2 className="text-xl font-bold text-red-700 mb-2 text-center">Error Loading Users</h2>
        <p className="text-red-600 mb-6 text-center">
          {error}
        </p>
        <div className="flex justify-center">
          <Button variant="outline" size="lg" className="shadow-sm" onClick={loadUsers}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-4">
        <div className="relative">
          <h1 className="text-3xl font-bold mb-1 relative inline-block">
            User Management
            <span className="absolute -bottom-1 left-0 w-1/3 h-1 bg-gradient-to-r from-primary to-primary-light rounded-full"></span>
          </h1>
          <p className="text-muted-foreground">Manage users and their access permissions</p>
        </div>
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
      
      {/* User Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1">
          <div className="text-sm font-medium text-muted-foreground mb-1">Total Users</div>
          <div className="text-2xl font-bold text-gradient">{userStats.total}</div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1">
          <div className="text-sm font-medium text-muted-foreground mb-1">Admin Users</div>
          <div className="text-2xl font-bold text-gradient">{userStats.admin}</div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1">
          <div className="text-sm font-medium text-muted-foreground mb-1">Regular Users</div>
          <div className="text-2xl font-bold text-gradient">{userStats.regular}</div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1">
          <div className="text-sm font-medium text-muted-foreground mb-1">Pending Invitations</div>
          <div className="text-2xl font-bold text-gradient">{userStats.pending}</div>
        </div>
      </div>
      
      {users && users.length > 0 ? (
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
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Companies
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
                      user.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role === 'admin' ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-muted-foreground">
                      {user.companies.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {user.companies.map((company: any) => (
                            <Link 
                              key={company.id} 
                              href={`/admin/clients/${company.id}`}
                              className="inline-block px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded transition-colors duration-150"
                            >
                              {company.name}
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/70">No companies</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/users/${user.id}`} className="text-primary hover:text-primary/80 transition-colors duration-150 inline-flex items-center">
                        View
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                      </Link>
                      
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={loading[user.id] || user.role === 'admin'}
                        className="ml-2"
                      >
                        {loading[user.id] ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
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
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">
            No users yet
          </h3>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Get started by inviting your first user to collaborate on projects
          </p>
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
      )}
    </div>
  );
} 