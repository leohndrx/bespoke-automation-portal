import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/auth/roles';
import { Button } from '@/components/ui/button';
import AddUserForm from './add-user-form';

export default async function AddUserPage() {
  // Check if user is admin
  const isUserAdmin = await isAdmin();
  if (!isUserAdmin) {
    redirect('/dashboard');
  }
  
  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Add New Client User</h1>
          <p className="subtitle">Send a magic link to create a client account</p>
        </div>
        <Link href="/admin">
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>
      
      <div className="card">
        <AddUserForm />
      </div>
    </div>
  );
} 