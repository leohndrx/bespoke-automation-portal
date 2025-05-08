import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { isAdmin } from '@/lib/auth/roles';
import NewCompanyForm from './new-company-form';

export default async function NewCompanyPage() {
  // Check if user is admin
  const isAdminUser = await isAdmin();
  if (!isAdminUser) {
    redirect('/dashboard');
  }
  
  return (
    <div className="px-2">
      <div className="page-header">
        <div>
          <h1 style={{ color: '#819cf9', textShadow: '0 0 10px rgba(74, 94, 228, 0.3)' }}>
            New Company
          </h1>
          <p className="subtitle">Create a new company profile</p>
        </div>
        <Link href="/admin/clients">
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>
      
      <div className="card">
        <div style={{ borderLeft: '4px solid #4a5ee4', paddingLeft: '1rem', marginBottom: '1.5rem' }}>
          <h2>Company Information</h2>
          <p className="subtitle">Fill in the details below to create a new company</p>
        </div>
        <NewCompanyForm />
      </div>
    </div>
  );
} 