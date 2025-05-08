'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { createClient } from '@/lib/supabase/client';

// Basic nav items for all users
const baseNavItems = [
  { name: 'Dashboard', href: '/dashboard', icon: 'chart-bar' },
  { name: 'Projects', href: '/projects', icon: 'folder' },
  { name: 'Tasks', href: '/tasks', icon: 'check-circle' },
];

// Admin-only nav items
const adminNavItems = [
  { name: 'Admin Dashboard', href: '/admin', icon: 'shield-check' },
  { name: 'Companies', href: '/admin/clients', icon: 'office-building' },
  { name: 'Users', href: '/admin/users', icon: 'users' },
];

export function Sidebar() {
  const pathname = usePathname();
  const supabase = createClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [navItems, setNavItems] = useState(baseNavItems);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  // Check if user has admin role or is a client
  useEffect(() => {
    async function checkUserRole() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUserEmail(user.email || null);
        
        // Query user_roles table to check if user is admin
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        if (userRole?.role === 'admin') {
          setIsAdmin(true);
          setNavItems([...baseNavItems, ...adminNavItems]);
          return; // Admin sees everything, no need to check if they're a client too
        }
        
        // Check if user is a client by checking client_users table
        const { data: clientUserData } = await supabase
          .from('client_users')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);
          
        if (clientUserData && clientUserData.length > 0) {
          setIsClient(true);
        }
      }
    }
    
    checkUserRole();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 text-white w-64 p-4">
      <div className="text-xl font-bold py-6 px-4">
        Bespoke Automation Portal
      </div>
      
      <nav className="flex-1 mt-6">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={clsx(
                  'flex items-center px-4 py-3 text-sm rounded-md',
                  pathname === item.href || pathname?.startsWith(`${item.href}/`)
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                )}
              >
                <SidebarIcon name={item.icon} className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
        
        {isAdmin && (
          <div className="mt-8">
            <div className="px-4 mb-2 text-xs text-gray-400 uppercase">
              Admin Actions
            </div>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/admin/users/add"
                  className="flex items-center px-4 py-2 text-sm text-gray-300 rounded-md hover:bg-gray-700"
                >
                  <SidebarIcon name="user-add" className="mr-3 h-5 w-5" />
                  Invite User
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/clients/new"
                  className="flex items-center px-4 py-2 text-sm text-gray-300 rounded-md hover:bg-gray-700"
                >
                  <SidebarIcon name="plus" className="mr-3 h-5 w-5" />
                  New Company
                </Link>
              </li>
            </ul>
          </div>
        )}
      </nav>
      
      <div className="mt-auto pt-4">
        {isAdmin && (
          <div className="mb-2 px-4 py-2 text-xs text-gray-400 uppercase">
            Admin User
          </div>
        )}
        {isClient && !isAdmin && (
          <div className="mb-2 px-4 py-2 text-xs text-gray-400 uppercase">
            Client User
          </div>
        )}
        {userEmail && (
          <div className="mb-2 px-4 py-2 text-xs text-gray-300 truncate">
            {userEmail}
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center px-4 py-3 text-sm text-gray-300 rounded-md hover:bg-gray-700 w-full"
        >
          <SidebarIcon name="logout" className="mr-3 h-5 w-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

// Helper component for sidebar icons
function SidebarIcon({ name, className }: { name: string; className?: string }) {
  // Simple implementation with basic icons
  const icons: Record<string, React.ReactNode> = {
    'chart-bar': (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
      </svg>
    ),
    'folder': (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1H8a3 3 0 00-3 3v1.5a1.5 1.5 0 01-3 0V6z" clipRule="evenodd" />
        <path d="M6 12a2 2 0 012-2h8a2 2 0 012 2v2a2 2 0 01-2 2H2h2a2 2 0 002-2v-2z" />
      </svg>
    ),
    'check-circle': (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    'users': (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
      </svg>
    ),
    'shield-check': (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    'logout': (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414l-5-5H3z" clipRule="evenodd" />
        <path d="M13 7.414V10h-2V4.414L13 7.414z" />
      </svg>
    ),
    'office-building': (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2a1 1 0 00-1-1H7a1 1 0 00-1 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
      </svg>
    ),
    'user-add': (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
      </svg>
    ),
    'plus': (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
  };

  return icons[name] || null;
} 