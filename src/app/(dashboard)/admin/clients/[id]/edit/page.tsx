import React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/auth/roles';
import EditCompanyForm from './edit-company-form';

// This prevents infinite recursion by ensuring dynamic data fetching
export const dynamic = 'force-dynamic';

export default async function EditCompanyPage({
  params,
}: { 
  params: { id: string }; 
}) {
  // Check if user is admin
  const isAdminUser = await isAdmin();
  if (!isAdminUser) {
    redirect('/dashboard');
  }
  
  // Access id directly without destructuring
  const clientId = params.id;
  const supabase = await createClient();
  
  // Fetch client
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();
  
  if (clientError || !client) {
    notFound();
  }
  
  return (
    <div className="px-2">
      <div className="page-header">
        <div>
          <h1 style={{ color: '#819cf9', textShadow: '0 0 10px rgba(74, 94, 228, 0.3)' }}>
            Edit Company
          </h1>
          <p className="subtitle">Update company information</p>
        </div>
        <Link href={`/admin/clients/${clientId}`}>
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>
      
      <div className="card">
        <div style={{ borderLeft: '4px solid #4a5ee4', paddingLeft: '1rem', marginBottom: '1.5rem' }}>
          <h2>Company Information</h2>
          <p className="subtitle">Update the details below</p>
        </div>
        <EditCompanyForm client={client} />
      </div>
    </div>
  );
} 