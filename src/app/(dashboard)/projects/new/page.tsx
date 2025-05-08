import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import NewProjectForm from './new-project-form';
import { createClient } from '@/lib/supabase/server';

// Add dynamic flag
export const dynamic = 'force-dynamic';

// Define SearchParams type
type SearchParams = Record<string, string | string[] | undefined>;

export default async function NewProjectPage(props: { 
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const client_id = searchParams?.client_id as string;
  
  // Fetch all clients for the form
  const { data: clients, error } = await supabase
    .from('clients')
    .select('*')
    .order('company');
  
  if (error) {
    console.error('Error loading clients:', error);
  }
  
  // Get the client name if a client_id was provided
  let clientName = '';
  if (client_id) {
    const { data: client } = await supabase
      .from('clients')
      .select('company')
      .eq('id', client_id)
      .single();
    
    if (client) {
      clientName = client.company;
    }
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">New Project</h1>
          <p className="text-gray-600">
            {clientName ? `Create a new project for ${clientName}` : 'Create a new automation project'}
          </p>
        </div>
        <Link href="/projects">
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <NewProjectForm clients={clients || []} defaultClientId={client_id} />
      </div>
    </div>
  );
} 