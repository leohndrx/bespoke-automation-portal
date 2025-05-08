export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import EditClientForm from './edit-client-form';

// Define proper types for params
type Params = {
  id: string;
};

export default async function EditClientPage(props: {
  params: Promise<Params>;
}) {
  // Access id by awaiting the params promise
  const { id } = await props.params;
  const clientId = id;
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Edit Client</h1>
          <p className="text-gray-600">Update client information</p>
        </div>
        <Link href={`/clients/${clientId}`}>
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <EditClientForm client={client} />
      </div>
    </div>
  );
} 