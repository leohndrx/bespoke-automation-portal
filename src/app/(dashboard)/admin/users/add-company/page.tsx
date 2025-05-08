import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { isAdmin } from '@/lib/auth/roles';
import AddToCompanyForm from './add-to-company-form';

export default async function AddUserToCompanyPage({
  searchParams,
}: {
  searchParams: { user?: string };
}) {
  // Check if user is admin
  const isAdminUser = await isAdmin();
  if (!isAdminUser) {
    redirect('/dashboard');
  }
  
  const userId = searchParams.user;
  
  if (!userId) {
    redirect('/admin/users');
  }
  
  const supabase = await createClient();
  
  // Fetch user details
  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
  
  if (userError || !userData.user) {
    redirect('/admin/users');
  }
  
  const user = userData.user;
  
  // Fetch companies
  const { data: companies, error: companiesError } = await supabase
    .from('clients')
    .select('id, name, company')
    .order('name');
  
  if (companiesError) {
    console.error('Error loading companies:', companiesError);
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add to Company</h1>
          <p className="text-lg font-medium text-gray-700">
            Add {user.user_metadata?.name || user.email} to a company
          </p>
        </div>
        <Link href={`/admin/users/${userId}`}>
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <AddToCompanyForm userId={userId} companies={companies || []} />
      </div>
    </div>
  );
} 